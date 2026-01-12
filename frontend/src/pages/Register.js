import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import '../styles/auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resellerId = searchParams.get('ref');
  const { registerStep1 } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      };

      if (resellerId) {
        payload.resellerId = resellerId;
      }

      await registerStep1(payload);
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #5db9de 0%, #47b9e1 25%, #1a2a35 50%, #95b5ef 75%, #2a5298 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <img
            src="/ufsscrmlogo.png"
            alt="UFS CRM"
            style={{
              width: '180px',
              height: 'auto',
              mixBlendMode: 'multiply',
              filter: 'contrast(1.1)',
              display: 'block',
              margin: '0 auto 8px'
            }}
          />
          <p style={{ marginBottom: '0', fontSize: '13px', color: '#6b7280' }}>
            Start your 15-day free trial
          </p>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '10px',
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
            <div>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '3px',
                display: 'block'
              }}>First Name *</label>
              <input
                type="text"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
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

            <div>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '3px',
                display: 'block'
              }}>Last Name *</label>
              <input
                type="text"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
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
          </div>

          <div style={{ marginBottom: '6px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px',
              display: 'block'
            }}>Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
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

          <div style={{ marginBottom: '6px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px',
              display: 'block'
            }}>Password *</label>
            <input
              type="password"
              name="password"
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
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

          <div style={{ marginBottom: '6px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px',
              display: 'block'
            }}>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(93, 185, 222, 0.4)',
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
            {loading ? 'Creating Account...' : 'Continue →'}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          margin: '10px 0 8px 0',
          color: '#9ca3af',
          fontSize: '12px'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
        </div>

        <button
          type="button"
          onClick={() => window.location.href = `${API_URL}/auth/google`}
          style={{
            width: '100%',
            padding: '8px',
            background: 'white',
            color: '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.background = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.background = 'white';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332A8.997 8.997 0 009.003 18z" fill="#34A853"/>
            <path d="M3.964 10.712A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.96A8.996 8.996 0 000 9c0 1.452.348 2.827.96 4.042l3.004-2.33z" fill="#FBBC05"/>
            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0A8.997 8.997 0 00.96 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0' }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: '#5db9de',
              fontWeight: '600',
              textDecoration: 'none'
            }}>Sign In</Link>
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
            By signing up, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
