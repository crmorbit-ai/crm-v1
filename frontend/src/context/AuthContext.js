import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

// Cache keys
const USER_CACHE_KEY = 'cached_user';
const CACHE_EXPIRY_KEY = 'user_cache_expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Inactivity timeout — 1 hour
const LAST_ACTIVITY_KEY = 'last_activity';
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in ms

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Try to get cached user for instant display
  const getCachedUser = () => {
    try {
      const cached = sessionStorage.getItem(USER_CACHE_KEY);
      const expiry = sessionStorage.getItem(CACHE_EXPIRY_KEY);
      if (cached && expiry && Date.now() < parseInt(expiry)) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Cache read error:', e);
    }
    return null;
  };

  const [user, setUser] = useState(getCachedUser());
  const [loading, setLoading] = useState(!getCachedUser() && !!sessionStorage.getItem('token'));
  const [token, setToken] = useState(sessionStorage.getItem('token'));

  // Cache user data
  const cacheUser = (userData) => {
    try {
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
      sessionStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  };

  const clearUserCache = () => {
    sessionStorage.removeItem(USER_CACHE_KEY);
    sessionStorage.removeItem(CACHE_EXPIRY_KEY);
    localStorage.removeItem(USER_CACHE_KEY); // Clean old cache
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  };

  // Update activity timestamp on user interaction
  const updateActivity = () => {
    if (token) {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }
  };

  useEffect(() => {
    if (token) {
      // Check inactivity on load
      const lastActivity = sessionStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastActivity && Date.now() - parseInt(lastActivity) > INACTIVITY_TIMEOUT) {
        logout();
        return;
      }
      // Set initial activity
      updateActivity();
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Track user activity (mouse, keyboard, touch)
  useEffect(() => {
    if (!token) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [token]);

  // Check inactivity every minute
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      const lastActivity = sessionStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastActivity && Date.now() - parseInt(lastActivity) > INACTIVITY_TIMEOUT) {
        alert('Your session has expired due to inactivity. Please login again.');
        logout();
      }
    }, 60 * 1000); // Check every 1 minute
    return () => clearInterval(interval);
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await authService.getMe();
      console.log('✅ User loaded from backend:', response.data);
      console.log('📋 User roles:', response.data.roles);
      setUser(response.data);
      cacheUser(response.data); // Cache for future
    } catch (error) {
      console.error('Load user error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginName, password) => {
    const response = await authService.login(loginName, password);
    const { token, user } = response.data;
    setToken(token);
    setUser(user);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    cacheUser(user); // Cache user for instant load
    return response.data;
  };

  const registerTenant = async (formData) => {
    const response = await authService.registerTenant(formData);
    const { token, user } = response.data;
    setToken(token);
    setUser(user);
    sessionStorage.setItem('token', token);
    return response.data;
  };

  // NEW: Two-step registration methods
  const registerStep1 = async (formData) => {
    const response = await authService.registerStep1(formData);
    // Don't set token yet - user needs to verify email first
    return response;
  };

  const verifyEmail = async (email, otp) => {
    const response = await authService.verifyEmail(email, otp);
    const { token, user, requiresProfileCompletion } = response.data;
    setToken(token);
    setUser(user);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    return { token, user, requiresProfileCompletion };
  };

  const resendOTP = async (email) => {
    const response = await authService.resendOTP(email);
    return response;
  };

  const completeProfile = async (profileData) => {
    const response = await authService.completeProfile(profileData);
    setUser(response.data);
    // Refresh from server to ensure tenant.logo and all fields are populated
    try {
      const fresh = await authService.getMe();
      setUser(fresh.data);
      cacheUser(fresh.data);
    } catch (_) {}
    return response.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem('welcomePromptShown'); // Clear welcome prompt flag on logout
    localStorage.removeItem('token'); // Clean old localStorage tokens too
    localStorage.removeItem('session_start'); // Clean old localStorage session
    clearUserCache();
  };

  const hasPermission = (feature, action) => {
    if (!user) return false;

    // SAAS_OWNER and SAAS_ADMIN have all permissions
    if (user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN') return true;

    // TENANT_ADMIN has all permissions within their tenant
    if (user.userType === 'TENANT_ADMIN') return true;

    // Debug log for TENANT_MANAGER
    if (user.userType === 'TENANT_MANAGER') {
      console.log('🔍 Permission Check:', { feature, action, userRoles: user.roles, customPerms: user.customPermissions });
    }

    // Check custom permissions
    if (user.customPermissions) {
      const perm = user.customPermissions.find(p => p.feature === feature);
      if (perm && (perm.actions.includes(action) || perm.actions.includes('manage'))) {
        return true;
      }
    }

    // Check role permissions
    if (user.roles && Array.isArray(user.roles)) {
      for (const role of user.roles) {
        if (role.permissions && Array.isArray(role.permissions)) {
          const perm = role.permissions.find(p => p.feature === feature);
          if (perm && (perm.actions.includes(action) || perm.actions.includes('manage'))) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const isSaasOwner = () => {
    return user && (user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN');
  };

  const value = {
    user,
    setUser, // NEW - needed for OAuth callback
    loading,
    token,
    setToken, // NEW - needed for OAuth callback
    loadUser, // NEW - needed for OAuth callback
    login,
    registerTenant,
    registerStep1, // NEW
    verifyEmail, // NEW
    resendOTP, // NEW
    completeProfile, // NEW
    logout,
    hasPermission,
    isSaasOwner
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
