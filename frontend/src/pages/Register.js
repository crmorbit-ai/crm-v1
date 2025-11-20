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
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <h1 className="auth-title">Register Your Organization</h1>
        <p className="auth-subtitle">
          Get started with your free CRM account
        </p>

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
          {/* Organization Details */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Organization Details
            </h3>
            
            <div className="form-group">
              <label className="form-label">Organization Name *</label>
              <input
                type="text"
                name="organizationName"
                className="form-input"
                placeholder="Acme Corporation"
                value={formData.organizationName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organization Slug *</label>
              <input
                type="text"
                name="slug"
                className="form-input"
                placeholder="acme-corp"
                value={formData.slug}
                onChange={handleChange}
                required
              />
              <small style={{ fontSize: '12px', color: '#6B7280' }}>
                URL-friendly identifier (lowercase, no spaces)
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Email *</label>
              <input
                type="email"
                name="contactEmail"
                className="form-input"
                placeholder="contact@acmecorp.com"
                value={formData.contactEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                className="form-input"
                placeholder="+1 234 567 8900"
                value={formData.contactPhone}
                onChange={handleChange}
              />
            </div>

            {/* ============================================ */}
            {/* 🚀 REFERRAL CODE FIELD - NEW */}
            {/* ============================================ */}
            <div className="form-group">
              <label className="form-label">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                name="resellerId"
                className="form-input"
                placeholder="Enter referral code if you have one"
                value={formData.resellerId}
                onChange={handleChange}
                disabled={!!resellerId} // Disable if coming from URL
              />
              {formData.resellerId && (
                <small style={{ fontSize: '12px', color: '#059669', display: 'block', marginTop: '4px' }}>
                  ✅ Referral code applied
                </small>
              )}
            </div>
            {/* ============================================ */}
          </div>

          {/* Admin User Details */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Admin User Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="adminFirstName"
                  className="form-input"
                  placeholder="John"
                  value={formData.adminFirstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="adminLastName"
                  className="form-input"
                  placeholder="Doe"
                  value={formData.adminLastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Email *</label>
              <input
                type="email"
                name="adminEmail"
                className="form-input"
                placeholder="admin@acmecorp.com"
                value={formData.adminEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="adminPassword"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={formData.adminPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

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