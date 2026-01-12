import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import '../styles/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);

      // Redirect based on user type
      if (response.user.userType === 'SAAS_OWNER' || response.user.userType === 'SAAS_ADMIN') {
        navigate('/saas/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      background: 'linear-gradient(135deg, #5db9de 0%, #47b9e1 25%, #1a2a35 50%, #95b5ef 75%, #2a5298 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 20px'
    }}>
      <div className="auth-card" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <img
            src="/ufsscrmlogo.png"
            alt="UFS CRM"
            style={{
              width: '180px',
              height: 'auto',
              mixBlendMode: 'multiply',
              filter: 'contrast(1.1)',
              display: 'block',
              margin: '0 auto 10px'
            }}
          />
          <p className="auth-subtitle" style={{ marginBottom: '0', fontSize: '13px', color: '#6b7280' }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '12px',
            fontSize: '13px',
            fontWeight: '500',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label" style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px',
              display: 'block'
            }}>Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#5db9de';
                e.target.style.boxShadow = '0 0 0 3px rgba(93, 185, 222, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label" style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px',
              display: 'block'
            }}>Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#5db9de';
                e.target.style.boxShadow = '0 0 0 3px rgba(93, 185, 222, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'right', marginBottom: '12px' }}>
            <Link to="/forgot-password" style={{
              fontSize: '12px',
              color: '#5db9de',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#2a5298'}
            onMouseLeave={(e) => e.target.style.color = '#5db9de'}>
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{
              padding: '12px',
              fontSize: '15px',
              fontWeight: '700',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(93, 185, 222, 0.4)',
              transition: 'all 0.3s ease',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              width: '100%',
              transform: loading ? 'none' : 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 28px rgba(93, 185, 222, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 20px rgba(93, 185, 222, 0.4)';
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          {/* OR Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '14px 0 12px 0',
            textAlign: 'center'
          }}>
            <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb' }}></div>
            <span style={{ padding: '0', color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}>OR</span>
            <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb' }}></div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={() => window.location.href = `${API_URL}/auth/google`}
            style={{
              width: '100%',
              padding: '10px',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f9fafb';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332A8.997 8.997 0 009.003 18z" fill="#34A853"/>
              <path d="M3.964 10.712A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.96A8.996 8.996 0 000 9c0 1.452.348 2.827.96 4.042l3.004-2.33z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0A8.997 8.997 0 00.96 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '14px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#5db9de',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#2a5298'}
            onMouseLeave={(e) => e.target.style.color = '#5db9de'}>
              Register your organization
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default Login;