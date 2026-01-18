import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';

const AuthSlider = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const navigate = useNavigate();
  const { login, registerStep1 } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
    setError(''); // Clear any errors when switching tabs
  }, [defaultTab, isOpen]);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(loginData.email, loginData.password);
      if (response.user.userType === 'SAAS_OWNER' || response.user.userType === 'SAAS_ADMIN') {
        navigate('/saas/dashboard');
      } else {
        navigate('/dashboard');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!registerData.firstName || !registerData.lastName || !registerData.email || !registerData.password) {
      setError('All fields are required');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await registerStep1(registerData);
      navigate('/verify-email', { state: { email: registerData.email } });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999998,
          backdropFilter: 'blur(3px)',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease'
        }}
        onClick={onClose}
      />

      {/* Compact Slider Card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          right: isOpen ? '40px' : '-450px',
          transform: 'translateY(-50%)',
          width: '400px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          zIndex: 999999,
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#666',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.1)';
            e.target.style.transform = 'rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.05)';
            e.target.style.transform = 'rotate(0deg)';
          }}
        >
          ✕
        </button>

        {/* Logo */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="UFS CRM"
            style={{
              width: '140px',
              height: 'auto',
              mixBlendMode: 'multiply',
              margin: '0 auto'
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '0 24px 20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === 'login' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
              color: activeTab === 'login' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === 'register' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
              color: activeTab === 'register' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Register
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '10px 12px',
              background: '#fee',
              color: '#c00',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #e5e7eb',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #e5e7eb',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ textAlign: 'right' }}>
                <a href="/forgot-password" style={{
                  fontSize: '12px',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '4px'
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '8px 0'
              }}>
                <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb' }}></div>
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>OR</span>
                <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb' }}></div>
              </div>

              <button
                type="button"
                onClick={() => window.location.href = `${API_URL}/auth/google`}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'white',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332A8.997 8.997 0 009.003 18z" fill="#34A853"/>
                  <path d="M3.964 10.712A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.96A8.996 8.996 0 000 9c0 1.452.348 2.827.96 4.042l3.004-2.33z" fill="#FBBC05"/>
                  <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0A8.997 8.997 0 00.96 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={registerData.firstName}
                  onChange={handleRegisterChange}
                  required
                  style={{
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #e5e7eb',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={registerData.lastName}
                  onChange={handleRegisterChange}
                  required
                  style={{
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #e5e7eb',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />

              <input
                type="password"
                name="password"
                placeholder="Password (min 6 characters)"
                value={registerData.password}
                onChange={handleRegisterChange}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '4px'
                }}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '4px 0'
              }}>
                <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb' }}></div>
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>OR</span>
                <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb' }}></div>
              </div>

              <button
                type="button"
                onClick={() => window.location.href = `${API_URL}/auth/google`}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'white',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332A8.997 8.997 0 009.003 18z" fill="#34A853"/>
                  <path d="M3.964 10.712A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.96A8.996 8.996 0 000 9c0 1.452.348 2.827.96 4.042l3.004-2.33z" fill="#FBBC05"/>
                  <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0A8.997 8.997 0 00.96 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthSlider;
