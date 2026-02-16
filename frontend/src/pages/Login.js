import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import { leadService } from '../services/leadService';
import { accountService } from '../services/accountService';
import { contactService } from '../services/contactService';
import { opportunityService } from '../services/opportunityService';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const defaultRoute = user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN'
        ? '/saas/dashboard'
        : '/dashboard';
      navigate(defaultRoute);
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData.email, formData.password);

      // Prefetch dashboard data in background to warm up backend
      Promise.all([
        leadService.getLeadStats().catch(() => null),
        accountService.getAccountStats().catch(() => null),
        contactService.getContactStats().catch(() => null),
        opportunityService.getOpportunityStats().catch(() => null)
      ]).then((results) => {
        const stats = {
          leads: results[0]?.data || null,
          accounts: results[1]?.data || null,
          contacts: results[2]?.data || null,
          opportunities: results[3]?.data || null
        };
        try {
          localStorage.setItem('dashboard_stats_cache', JSON.stringify(stats));
          localStorage.setItem('dashboard_stats_expiry', String(Date.now() + 120000));
        } catch (e) {}
      });

      const defaultRoute = response.user?.userType === 'SAAS_OWNER' || response.user?.userType === 'SAAS_ADMIN'
        ? '/saas/dashboard'
        : '/dashboard';
      window.location.href = defaultRoute;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: '#8b5cf6',
        borderRadius: '50%',
        filter: 'blur(150px)',
        opacity: '0.15'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '400px',
        height: '400px',
        background: '#3b82f6',
        borderRadius: '50%',
        filter: 'blur(150px)',
        opacity: '0.15'
      }}></div>

      <div style={{
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Link to="/" style={{ display: 'inline-block' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '6px', display: 'inline-block' }}>
              <img
                src="/logo.png"
                alt="Logo"
                style={{
                  height: '20px',
                  display: 'block'
                }}
              />
            </div>
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: '500',
            color: '#ffffff',
            marginBottom: '2px'
          }}>
            Welcome back!
          </h2>
          <p style={{ fontSize: '17px', color: '#94a3b8', marginBottom: '4px' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: '#a78bfa',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#f87171',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#ffffff',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#e2e8f0',
              marginBottom: '2px'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#e2e8f0',
              marginBottom: '6px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '15px',
              fontWeight: '600',
              color: 'white',
              background: loading ? '#64748b' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.9')}
            onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
          >
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        {/* Forgot password link */}
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <Link
            to="/forgot-password"
            style={{
              fontSize: '14px',
              color: '#a78bfa',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Forgot password?
          </Link>
        </div>

        {/* Back to home */}
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              color: '#64748b',
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
