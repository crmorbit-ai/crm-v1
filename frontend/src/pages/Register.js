import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import '../styles/auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resellerId = searchParams.get('ref'); // Get reseller ID from URL

  const [formData, setFormData] = useState({
    organizationName: '',
    slug: '',
    contactEmail: '',
    contactPhone: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    resellerId: resellerId || '' // Pre-fill if coming from reseller link
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

    // Validation
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.adminPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        organizationName: formData.organizationName,
        slug: formData.slug,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        adminFirstName: formData.adminFirstName,
        adminLastName: formData.adminLastName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword
      };

      // Add resellerId if present
      if (formData.resellerId) {
        payload.resellerId = formData.resellerId;
      }

      const response = await fetch(`${API_URL}/auth/register-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to register. Please try again.');
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
      padding: '30px 20px'
    }}>
      <div className="auth-card" style={{
        maxWidth: '1000px',
        padding: '28px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 8px 24px rgba(93, 185, 222, 0.4)'
          }}>🏢</div>
          <h1 className="auth-title" style={{
            marginBottom: '6px',
            fontSize: '26px',
            background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Register Your Organization</h1>
          <p className="auth-subtitle" style={{ marginBottom: '0', fontSize: '14px', color: '#6b7280' }}>
            Get started with your free CRM account
          </p>
        </div>

        {resellerId && (
          <div style={{
            padding: '12px 16px',
            background: '#EFF6FF',
            color: '#1E40AF',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ✅ You're registering through a partner referral
          </div>
        )}

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
          {/* Organization & Admin Details Combined */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(93, 185, 222, 0.08) 0%, rgba(42, 82, 152, 0.05) 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid rgba(93, 185, 222, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '2px solid rgba(93, 185, 222, 0.3)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(93, 185, 222, 0.3)'
              }}>📋</div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                margin: 0,
                color: '#1a1a1a'
              }}>Organization Details</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Organization Name *</label>
                <input
                  type="text"
                  name="organizationName"
                  className="form-input"
                  placeholder="Acme Corporation"
                  value={formData.organizationName}
                  onChange={handleChange}
                  required
                  style={{ padding: '10px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Slug *</label>
                <input
                  type="text"
                  name="slug"
                  className="form-input"
                  placeholder="acme-corp"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  style={{ padding: '10px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Contact Email *</label>
                <input
                  type="email"
                  name="contactEmail"
                  className="form-input"
                  placeholder="contact@acme.com"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                  style={{ padding: '10px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  className="form-input"
                  placeholder="+1 234 567 8900"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  style={{ padding: '10px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0', gridColumn: '2 / -1' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  name="resellerId"
                  className="form-input"
                  placeholder="Enter referral code"
                  value={formData.resellerId}
                  onChange={handleChange}
                  disabled={!!resellerId}
                  style={{ padding: '10px' }}
                />
              </div>
            </div>
          </div>

          {/* Admin User Details */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(42, 82, 152, 0.08) 0%, rgba(93, 185, 222, 0.05) 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid rgba(42, 82, 152, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '2px solid rgba(42, 82, 152, 0.3)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #2a5298 0%, #5db9de 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(42, 82, 152, 0.3)'
              }}>👤</div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                margin: 0,
                color: '#1a1a1a'
              }}>Admin User Details</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>First Name *</label>
                <input
                  type="text"
                  name="adminFirstName"
                  className="form-input"
                  placeholder="John"
                  value={formData.adminFirstName}
                  onChange={handleChange}
                  required
                  style={{ padding: '10px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Last Name *</label>
                <input
                  type="text"
                  name="adminLastName"
                  className="form-input"
                  placeholder="Doe"
                  value={formData.adminLastName}
                  onChange={handleChange}
                  required
                  style={{ padding: '10px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Admin Email *</label>
                <input
                  type="email"
                  name="adminEmail"
                  className="form-input"
                  placeholder="admin@acme.com"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                  style={{ padding: '10px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Password *</label>
                <input
                  type="password"
                  name="adminPassword"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  required
                  style={{ padding: '10px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0', gridColumn: '2 / -1' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ padding: '10px' }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{
              marginTop: '4px',
              padding: '15px',
              fontSize: '16px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(93, 185, 222, 0.4)',
              transition: 'all 0.3s ease',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
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
            {loading ? '⏳ Creating Account...' : '🚀 Create Account'}
          </button>
        </form>

        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @media (max-width: 1024px) {
            form > div > div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 768px) {
            .auth-card {
              max-width: 100% !important;
              padding: 20px !important;
              margin: 0 10px !important;
            }
            form > div > div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
            }
            form > div > div > div[style*="gridColumn"] {
              grid-column: 1 / -1 !important;
            }
          }
        `}</style>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;