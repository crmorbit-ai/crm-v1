import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      background: '#0f172a',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        maxWidth: '400px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'inline-block',
            marginBottom: '16px'
          }}>
            <img
              src="/logo.png"
              alt="UFS CRM"
              style={{
                height: '20px',
                display: 'block'
              }}
            />
          </div>
          <h1 style={{
            marginBottom: '8px',
            fontSize: '22px',
            fontWeight: '500',
            color: '#ffffff'
          }}>Partner Login</h1>
          <p style={{ marginBottom: '0', fontSize: '15px', color: '#9ca3af' }}>
            Access your reseller dashboard
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#e5e7eb',
              marginBottom: '6px',
              display: 'block'
            }}>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="partner@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                outline: 'none'
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
              fontSize: '14px',
              fontWeight: '600',
              color: '#e5e7eb',
              marginBottom: '6px',
              display: 'block'
            }}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                outline: 'none'
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
              background: loading ? '#4b5563' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s ease',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
              }
            }}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
              Not a partner yet?{' '}
              <button
                type="button"
                onClick={() => navigate('/reseller/register')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a78bfa',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
              >
                Apply now
              </button>
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontWeight: '400',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
              >
                ← Back to Home
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResellerLogin;