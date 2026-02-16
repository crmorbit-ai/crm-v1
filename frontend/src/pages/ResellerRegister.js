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
    <div className="auth-container" style={{
      background: 'linear-gradient(135deg, #5db9de 0%, #47b9e1 25%, #1a2a35 50%, #95b5ef 75%, #2a5298 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      minHeight: '100vh',
      padding: '30px 20px'
    }}>
      <div className="auth-card" style={{
        maxWidth: '900px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <img
            src="/logo.png"
            alt="UFS CRM"
            style={{
              width: '130px',
              height: 'auto',
              mixBlendMode: 'multiply',
              filter: 'contrast(1.1)',
              display: 'block',
              margin: '0 auto 8px'
            }}
          />
          <h1 className="auth-title" style={{
            marginBottom: '4px',
            fontSize: '18px',
            background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Become a Reseller Partner</h1>
          <p className="auth-subtitle" style={{ marginBottom: '0', fontSize: '13px', color: '#6b7280' }}>
            Fill out the form below to apply for our reseller program
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            marginBottom: '12px',
            fontSize: '13px'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(93, 185, 222, 0.08) 0%, rgba(42, 82, 152, 0.05) 100%)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '10px',
            border: '1px solid rgba(93, 185, 222, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              paddingBottom: '6px',
              borderBottom: '2px solid rgba(93, 185, 222, 0.3)'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(93, 185, 222, 0.3)'
              }}>👤</div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                margin: 0,
                color: '#1a1a1a'
              }}>Personal Information</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Email *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Password *</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ padding: '9px' }}
                />
              </div>
            </div>
          </div>

          {/* Business & Address Combined */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(42, 82, 152, 0.08) 0%, rgba(93, 185, 222, 0.05) 100%)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '10px',
            border: '1px solid rgba(42, 82, 152, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              paddingBottom: '6px',
              borderBottom: '2px solid rgba(42, 82, 152, 0.3)'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #2a5298 0%, #5db9de 100%)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(42, 82, 152, 0.3)'
              }}>🏢</div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                margin: 0,
                color: '#1a1a1a'
              }}>Business & Address Information</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-input"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Occupation *</label>
                <input
                  type="text"
                  name="occupation"
                  className="form-input"
                  placeholder="e.g., Consultant"
                  value={formData.occupation}
                  onChange={handleChange}
                  required
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Website</label>
                <input
                  type="url"
                  name="website"
                  className="form-input"
                  placeholder="yourwebsite.com"
                  value={formData.website}
                  onChange={handleChange}
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0', gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Street Address</label>
                <input
                  type="text"
                  name="street"
                  className="form-input"
                  value={formData.street}
                  onChange={handleChange}
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>City</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  value={formData.city}
                  onChange={handleChange}
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>State</label>
                <input
                  type="text"
                  name="state"
                  className="form-input"
                  value={formData.state}
                  onChange={handleChange}
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Country</label>
                <input
                  type="text"
                  name="country"
                  className="form-input"
                  value={formData.country}
                  onChange={handleChange}
                  style={{ padding: '9px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '5px' }}>Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  className="form-input"
                  value={formData.zipCode}
                  onChange={handleChange}
                  style={{ padding: '9px' }}
                />
              </div>
            </div>
          </div>

          {/* Why Partner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(93, 185, 222, 0.08) 0%, rgba(42, 82, 152, 0.05) 100%)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '10px',
            border: '1px solid rgba(93, 185, 222, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              paddingBottom: '6px',
              borderBottom: '2px solid rgba(93, 185, 222, 0.3)'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(93, 185, 222, 0.3)'
              }}>💬</div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                margin: 0,
                color: '#1a1a1a'
              }}>Why Partner With Us? *</h3>
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <textarea
                name="reason"
                className="form-input"
                rows="2"
                placeholder="Tell us about your business, client base, and why you'd be a great partner..."
                value={formData.reason}
                onChange={handleChange}
                required
                style={{ resize: 'vertical', padding: '9px' }}
              />
            </div>
          </div>

          {/* Info Box */}
          <div style={{
            padding: '10px 12px',
            background: 'linear-gradient(135deg, rgba(93, 185, 222, 0.12) 0%, rgba(42, 82, 152, 0.08) 100%)',
            borderRadius: '10px',
            marginBottom: '10px',
            border: '1px solid rgba(93, 185, 222, 0.3)',
            display: 'flex',
            alignItems: 'start',
            gap: '10px'
          }}>
            <div style={{
              fontSize: '18px',
              lineHeight: 1
            }}>✨</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '12px', color: '#1a1a1a', margin: '0 0 5px 0', fontWeight: '700' }}>
                Partner Benefits:
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px',
                fontSize: '11px',
                color: '#4b5563'
              }}>
                <div>• 10% recurring commission</div>
                <div>• Partner dashboard</div>
                <div>• Marketing materials</div>
                <div>• Priority support</div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{
              marginTop: '2px',
              marginBottom: '8px',
              padding: '12px',
              fontSize: '15px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
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
            {loading ? '⏳ Submitting Application...' : '🚀 Submit Application'}
          </button>

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