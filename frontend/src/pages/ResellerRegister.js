import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api.config';
import '../styles/auth.css';

const ResellerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: '',
    occupation: '',
    website: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/resellers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            zipCode: formData.zipCode
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/reseller/login');
        }, 3000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
          <h1 className="auth-title">Application Submitted!</h1>
          <p className="auth-subtitle" style={{ marginBottom: '20px' }}>
            Thank you for your interest in becoming a reseller partner.
          </p>
          <p style={{ color: '#6B7280', marginBottom: '30px' }}>
            We will review your application and get back to you within 2-3 business days.
            You'll receive an email once your application is approved.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary btn-block"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤝</div>
          <h1 className="auth-title">Become a Reseller Partner</h1>
          <p className="auth-subtitle">
            Fill out the form below to apply for our reseller program
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
          {/* Personal Information */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1F2937' }}>
              Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
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
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1F2937' }}>
              Business Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-input"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Occupation *</label>
                <input
                  type="text"
                  name="occupation"
                  className="form-input"
                  placeholder="e.g., Business Consultant"
                  value={formData.occupation}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Website (Optional)</label>
              <input
                type="url"
                name="website"
                className="form-input"
                placeholder="https://yourwebsite.com"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1F2937' }}>
              Address
            </h3>
            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                name="street"
                className="form-input"
                value={formData.street}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  name="state"
                  className="form-input"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input
                  type="text"
                  name="country"
                  className="form-input"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  className="form-input"
                  value={formData.zipCode}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Why Partner */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1F2937' }}>
              Why do you want to become a reseller partner? *
            </h3>
            <div className="form-group">
              <textarea
                name="reason"
                className="form-input"
                rows="4"
                placeholder="Tell us about your business, your client base, and why you'd be a great partner..."
                value={formData.reason}
                onChange={handleChange}
                required
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Info Box */}
          <div style={{
            padding: '16px',
            background: '#EFF6FF',
            borderLeft: '4px solid #3B82F6',
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', color: '#1E40AF', margin: '0 0 8px 0', fontWeight: '600' }}>
              What you'll get:
            </p>
            <ul style={{ fontSize: '13px', color: '#1E40AF', paddingLeft: '20px', margin: 0 }}>
              <li>10% recurring commission on all sales</li>
              <li>Dedicated partner dashboard</li>
              <li>Marketing materials and support</li>
              <li>Priority customer support</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginBottom: '16px' }}
          >
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>

          <div className="auth-footer">
            <p>
              Already a partner?{' '}
              <button
                type="button"
                onClick={() => navigate('/reseller/login')}
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Login here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResellerRegister;