import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api.config';
import '../styles/auth.css';

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
      console.log('🔍 Login Response:', data); // DEBUG

      if (data.success) {
        console.log('✅ Token:', data.data.token); // DEBUG
        console.log('✅ Reseller:', data.data.reseller); // DEBUG
        
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.reseller));
        
        console.log('✅ Navigating to dashboard...'); // DEBUG
        navigate('/reseller/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login Error:', err); // DEBUG
      setError('Failed to login. Please try again.');
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
        maxWidth: '480px',
        width: '100%',
        padding: '40px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            boxShadow: '0 10px 30px rgba(93, 185, 222, 0.4)'
          }}>🤝</div>
          <h1 className="auth-title" style={{
            marginBottom: '8px',
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Partner Login</h1>
          <p className="auth-subtitle" style={{ marginBottom: '0', fontSize: '15px', color: '#6b7280' }}>
            Access your reseller dashboard
          </p>
        </div>

        {error && (
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
            color: '#991b1b',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
              display: 'block'
            }}>Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="partner@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoFocus
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                fontSize: '15px',
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

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
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
                padding: '14px 16px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                fontSize: '15px',
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
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{
              padding: '16px',
              fontSize: '16px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(93, 185, 222, 0.4)',
              transition: 'all 0.3s ease',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              width: '100%'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 32px rgba(93, 185, 222, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(93, 185, 222, 0.4)';
              }
            }}
          >
            {loading ? '⏳ Logging in...' : '🚀 Login to Dashboard'}
          </button>

          <div className="auth-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '10px' }}>
              Not a partner yet?{' '}
              <button
                type="button"
                onClick={() => navigate('/reseller/register')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#5db9de',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  padding: 0
                }}
                onMouseEnter={(e) => e.target.style.color = '#2a5298'}
                onMouseLeave={(e) => e.target.style.color = '#5db9de'}
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
                  color: '#5db9de',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  padding: 0
                }}
                onMouseEnter={(e) => e.target.style.color = '#2a5298'}
                onMouseLeave={(e) => e.target.style.color = '#5db9de'}
              >
                ← Back to Home
              </button>
            </p>
          </div>
        </form>

        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ResellerLogin;