import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config/api.config';

const ResellerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/resellers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.reseller));
        navigate('/reseller/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
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
            Partner Login
          </h2>
          <p style={{ fontSize: '17px', color: '#94a3b8', marginBottom: '4px' }}>
            Not a partner yet?{' '}
            <Link
              to="/reseller/register"
              style={{
                color: '#a78bfa',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Apply now
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
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {/* Back to home */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
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

export default ResellerLogin;
