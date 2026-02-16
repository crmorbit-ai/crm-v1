import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config/api.config';

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
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

  const inputStyle = {
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
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '2px'
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = '#8b5cf6';
    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    e.target.style.boxShadow = 'none';
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h1 style={{ fontSize: '24px', fontWeight: '500', color: '#ffffff', marginBottom: '8px' }}>
            Application Submitted!
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
            Thank you for your interest in becoming a reseller partner.
          </p>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
            We will review your application and get back to you within 2-3 business days.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '600',
              color: 'white',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

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
        maxWidth: '500px',
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
            Become a Partner
          </h2>
          <p style={{ fontSize: '17px', color: '#94a3b8', marginBottom: '4px' }}>
            Already a partner?{' '}
            <Link
              to="/reseller/login"
              style={{
                color: '#a78bfa',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Login here
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
          {/* Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>

          {/* Row 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>

          {/* Row 4 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Company Name *</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Occupation *</label>
              <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} required placeholder="e.g., Consultant" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>

          {/* Row 5 */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Website (Optional)</label>
            <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://yourwebsite.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          {/* Row 6 - Address */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Street Address</label>
            <input type="text" name="street" value={formData.street} onChange={handleChange} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          {/* Row 7 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Zip Code</label>
              <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>

          {/* Row 8 - Reason */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Why Partner With Us? *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Tell us about your business and why you'd be a great partner..."
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={handleFocus}
              onBlur={handleBlur}
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
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

        {/* Back to home */}
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
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

      <style>{`
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="gridTemplateColumns: 1fr 1fr 1fr 1fr"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ResellerRegister;
