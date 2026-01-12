import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { completeProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: '',
    slug: '',
    businessType: 'B2B',
    industry: '',
    numberOfEmployees: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    logo: null,
    primaryColor: '#4A90E2',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR'
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'organizationName') {
      const slugValue = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData({
        ...formData,
        organizationName: value,
        slug: slugValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }
      setFormData({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const validateStep = (step) => {
    setError('');
    if (step === 1) {
      if (!formData.organizationName.trim()) {
        setError('Organization name is required');
        return false;
      }
      if (!formData.slug.trim()) {
        setError('Organization slug is required');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateStep(currentStep)) return;

    setLoading(true);

    try {
      await completeProfile(formData);
      setShowSuccessModal(true);
      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Organization Name *</label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Enter your company name"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Organization Slug *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="company-name"
                pattern="[a-z0-9-]+"
                required
                style={inputStyle}
              />
              <small style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '4px' }}>
                This will be used in your organization's URL
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Business Type</label>
                <select name="businessType" value={formData.businessType} onChange={handleChange} style={selectStyle}>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="B2B2C">B2B2C</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="e.g., Technology"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Number of Employees</label>
              <select name="numberOfEmployees" value={formData.numberOfEmployees} onChange={handleChange} style={selectStyle}>
                <option value="">Select range</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Street Address</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="123 Business Street"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>State/Province</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="India" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Zip/Postal Code</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="400001" style={inputStyle} />
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Company Logo</label>
              <div style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                background: '#f9fafb'
              }}>
                {logoPreview ? (
                  <div style={{ marginBottom: '16px' }}>
                    <img src={logoPreview} alt="Logo preview" style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '8px' }} />
                  </div>
                ) : (
                  <div style={{ marginBottom: '16px', fontSize: '48px' }}>📤</div>
                )}
                <input type="file" id="logo" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                <label
                  htmlFor="logo"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    background: '#5db9de',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </label>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', marginBottom: 0 }}>PNG, JPG (Max 5MB)</p>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Primary Brand Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  readOnly
                  style={{
                    ...inputStyle,
                    flex: 1,
                    fontFamily: 'monospace',
                    fontWeight: '600'
                  }}
                />
              </div>
            </div>
          </>
        );

      case 4:
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Timezone</label>
              <select name="timezone" value={formData.timezone} onChange={handleChange} style={selectStyle}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Date Format</label>
                <select name="dateFormat" value={formData.dateFormat} onChange={handleChange} style={selectStyle}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange} style={selectStyle}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const stepLabels = ['Business Details', 'Location', 'Branding', 'Preferences'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Left Side - Brand/Marketing */}
      <div style={{
        width: '38%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        padding: '30px 35px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(93, 185, 222, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(42, 82, 152, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '35px', textAlign: 'center' }}>
            <img
              src="/ufsscrmlogo.png"
              alt="UFS CRM"
              style={{
                width: '280px',
                height: 'auto',
                display: 'block',
                margin: '0 auto 18px',
                filter: 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.4))'
              }}
            />
            <p style={{
              fontSize: '15px',
              lineHeight: '1.5',
              color: '#cbd5e1',
              fontWeight: '400',
              letterSpacing: '0.2px',
              maxWidth: '320px',
              margin: '0 auto'
            }}>
              Complete your profile in 4 simple steps to unlock the full power of UFS CRM
            </p>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '16px',
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              textAlign: 'center'
            }}>
              Platform Features
            </h3>
            {[
              { icon: '🎯', text: 'Complete CRM Suite', color: '#10b981' },
              { icon: '📊', text: 'Advanced Analytics', color: '#3b82f6' },
              { icon: '👥', text: 'Team Collaboration', color: '#8b5cf6' },
              { icon: '⚡', text: 'Workflow Automation', color: '#f59e0b' },
              { icon: '🔒', text: 'Enterprise Security', color: '#ef4444' }
            ].map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
                padding: '9px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </div>
                <span style={{
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>{item.text}</span>
              </div>
            ))}
          </div>

          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{
              fontSize: '12px',
              margin: 0,
              color: '#d1fae5',
              lineHeight: '1.5'
            }}>
              💡 <strong style={{ color: '#a7f3d0' }}>Pro Tip:</strong> All settings can be customized later
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{
        width: '62%',
        background: '#ffffff',
        padding: '40px 50px',
        overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.06)'
      }}>
        {/* Modern Progress Steps */}
        <div style={{ marginBottom: '35px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '20px' }}>
            {[1, 2, 3, 4].map((step) => (
              <div key={step} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: currentStep >= step
                    ? 'linear-gradient(90deg, #5db9de 0%, #2a5298 100%)'
                    : '#e5e7eb',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  transition: 'all 0.4s ease',
                  boxShadow: currentStep >= step ? '0 2px 8px rgba(93, 185, 222, 0.3)' : 'none'
                }}></div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: currentStep >= step
                    ? 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)'
                    : '#f3f4f6',
                  color: currentStep >= step ? '#ffffff' : '#9ca3af',
                  fontSize: '13px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  boxShadow: currentStep === step
                    ? '0 4px 12px rgba(93, 185, 222, 0.4), 0 0 0 4px rgba(93, 185, 222, 0.1)'
                    : currentStep > step ? '0 2px 6px rgba(93, 185, 222, 0.2)' : 'none'
                }}>
                  {currentStep > step ? '✓' : step}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: currentStep >= step ? '#1f2937' : '#9ca3af',
                  fontWeight: currentStep === step ? '600' : '500',
                  marginTop: '6px'
                }}>
                  {['Business', 'Location', 'Branding', 'Settings'][step - 1]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Title with Icon */}
        <div style={{
          marginBottom: '30px',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '12px',
          border: '1px solid #bae6fd'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(93, 185, 222, 0.3)'
            }}>
              {['🏢', '📍', '🎨', '⚙️'][currentStep - 1]}
            </div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#0c4a6e',
              margin: 0
            }}>
              {stepLabels[currentStep - 1]}
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#0369a1', margin: 0, paddingLeft: '48px' }}>
            {['Tell us about your organization', 'Where are you located?', 'Customize your brand identity', 'Configure your preferences'][currentStep - 1]}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            color: '#991b1b',
            borderRadius: '10px',
            marginBottom: '24px',
            fontSize: '13px',
            border: '1px solid #fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '35px',
            paddingTop: '24px',
            borderTop: '2px solid #f1f5f9'
          }}>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              style={{
                padding: '11px 22px',
                background: currentStep === 1 ? '#f8fafc' : '#ffffff',
                color: currentStep === 1 ? '#cbd5e1' : '#475569',
                border: '2px solid',
                borderColor: currentStep === 1 ? '#e2e8f0' : '#cbd5e1',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: currentStep === 1 ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                if (currentStep !== 1) {
                  e.target.style.borderColor = '#94a3b8';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentStep !== 1) {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              <span>←</span> Previous
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Skip button for optional steps (2, 3, 4) */}
              {currentStep > 1 && currentStep < 4 && (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    padding: '11px 20px',
                    background: '#ffffff',
                    color: '#64748b',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f8fafc';
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ffffff';
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Skip →
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    padding: '11px 28px',
                    background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(93, 185, 222, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(93, 185, 222, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(93, 185, 222, 0.3)';
                  }}
                >
                  Continue <span>→</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    style={{
                      padding: '11px 20px',
                      background: '#ffffff',
                      color: '#64748b',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f8fafc';
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#ffffff';
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Skip & Finish
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '11px 28px',
                      background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: loading ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                      }
                    }}
                  >
                    {loading ? '⏳ Saving...' : '✓ Complete Setup'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease'
        }}>
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              @keyframes confetti {
                0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
              }
            `}
          </style>

          {/* Confetti Elements */}
          {[...Array(30)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: '-20px',
              left: `${Math.random() * 100}%`,
              width: '10px',
              height: '10px',
              background: ['#5db9de', '#2a5298', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)],
              animation: `confetti ${2 + Math.random() * 2}s linear infinite`,
              animationDelay: `${Math.random() * 2}s`,
              borderRadius: '2px',
              opacity: 0.8
            }}></div>
          ))}

          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '50px 60px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.5s ease',
            position: 'relative'
          }}>
            {/* Success Icon with Animation */}
            <div style={{
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 30px',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
              animation: 'float 2s ease-in-out infinite'
            }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h2 style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#1f2937',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Welcome to UFS CRM!
            </h2>

            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '10px',
              lineHeight: '1.6'
            }}>
              Your profile has been successfully set up!
            </p>

            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              marginBottom: '30px'
            }}>
              Redirecting to your dashboard in a moment...
            </p>

            {/* Loading Progress Bar */}
            <div style={{
              width: '100%',
              height: '6px',
              background: '#e5e7eb',
              borderRadius: '999px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                borderRadius: '999px',
                animation: 'progress 3s linear'
              }}></div>
            </div>
            <style>
              {`
                @keyframes progress {
                  from { width: 0%; }
                  to { width: 100%; }
                }
              `}
            </style>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '14px 36px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
              }}
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompleteProfile;
