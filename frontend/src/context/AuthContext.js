import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Load user error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    return response;
  };

  const registerTenant = async (formData) => {
    const response = await authService.registerTenant(formData);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    return response;
  };

  // NEW: Two-step registration methods
  const registerStep1 = async (formData) => {
    const response = await authService.registerStep1(formData);
    // Don't set token yet - user needs to verify email first
    return response;
  };

  const verifyEmail = async (email, otp) => {
    const response = await authService.verifyEmail(email, otp);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    return response;
  };

  const resendOTP = async (email) => {
    const response = await authService.resendOTP(email);
    return response;
  };

  const completeProfile = async (profileData) => {
    const response = await authService.completeProfile(profileData);
    setUser(response); // Update user with tenant info
    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const hasPermission = (feature, action) => {
    if (!user) return false;

    // SAAS_OWNER has all permissions
    if (user.userType === 'SAAS_OWNER') return true;

    // Check custom permissions
    if (user.customPermissions) {
      const perm = user.customPermissions.find(p => p.feature === feature);
      if (perm && (perm.actions.includes(action) || perm.actions.includes('manage'))) {
        return true;
      }
    }

    // Check role permissions
    if (user.roles) {
      for (const role of user.roles) {
        const perm = role.permissions.find(p => p.feature === feature);
        if (perm && (perm.actions.includes(action) || perm.actions.includes('manage'))) {
          return true;
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
