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
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤝</div>
          <h1 className="auth-title">Reseller Partner Login</h1>
          <p className="auth-subtitle">
            Access your reseller dashboard
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="auth-footer">
            <p>
              Not a partner yet?{' '}
              <button
                type="button"
                onClick={() => navigate('/reseller/register')}
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Apply now
              </button>
            </p>
            <p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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