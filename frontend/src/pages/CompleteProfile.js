import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, completeProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: '', slug: '', businessType: 'B2B', industry: '',
    numberOfEmployees: '', street: '', city: '', state: '', country: 'India', zipCode: '',
    logo: null, primaryColor: '#2a5298', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY', currency: 'INR'
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if profile is already complete
  useEffect(() => {
    if (user?.isProfileComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Don't render if profile is already complete
  if (user?.isProfileComplete) {
    return null;
  }

  const industries = [
    'Technology', 'Healthcare', 'Finance & Banking', 'Manufacturing', 'Retail & E-commerce',
    'Education', 'Real Estate', 'Consulting', 'Marketing & Advertising', 'Logistics & Transportation',
    'Food & Beverage', 'Hospitality', 'Automotive', 'Telecommunications', 'Energy & Utilities',
    'Legal Services', 'Media & Entertainment', 'Construction', 'Agriculture', 'Other'
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
  ];

  const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE', 'Saudi Arabia', 'Japan', 'Other'];

  const majorCities = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad'],
    'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
    'Uttar Pradesh': ['Lucknow', 'Noida', 'Ghaziabad', 'Kanpur', 'Agra', 'Varanasi'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
  };

  const getCitiesForState = () => majorCities[formData.state] || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'organizationName') {
      setFormData({ ...formData, organizationName: value, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') });
    } else if (name === 'state') {
      setFormData({ ...formData, state: value, city: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
      if (file.size > 2 * 1024 * 1024) { setError('Logo must be less than 2MB'); return; }
      setFormData({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const validateStep = (step) => {
    setError('');
    if (step === 1 && !formData.organizationName.trim()) { setError('Organization name is required'); return false; }
    return true;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 4)); };
  const handlePrevious = () => { setError(''); setCurrentStep(prev => Math.max(prev - 1, 1)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    setLoading(true);
    try {
      await completeProfile(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s' };
  const selectStyle = { ...inputStyle, background: '#fff', cursor: 'pointer' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' };

  const stepData = [
    { title: 'Business Details', desc: 'Tell us about your company', icon: '🏢' },
    { title: 'Location', desc: 'Where are you located?', icon: '📍' },
    { title: 'Branding', desc: 'Customize your look', icon: '🎨' },
    { title: 'Preferences', desc: 'Set your defaults', icon: '⚙️' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Organization Name *</label>
                <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} placeholder="Your company name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>URL Slug</label>
                <input type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="company-slug" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Industry</label>
                <select name="industry" value={formData.industry} onChange={handleChange} style={selectStyle}>
                  <option value="">Select Industry</option>
                  {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Business Type</label>
                <select name="businessType" value={formData.businessType} onChange={handleChange} style={selectStyle}>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="B2B2C">B2B2C</option>
                </select>
              </div>
            </div>
            <div style={{ maxWidth: '200px' }}>
              <label style={labelStyle}>Team Size</label>
              <select name="numberOfEmployees" value={formData.numberOfEmployees} onChange={handleChange} style={selectStyle}>
                <option value="">Select</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="500+">500+</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={labelStyle}>Street Address</label>
              <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Enter business address" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Country</label>
                <select name="country" value={formData.country} onChange={handleChange} style={selectStyle}>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>State</label>
                {formData.country === 'India' ? (
                  <select name="state" value={formData.state} onChange={handleChange} style={selectStyle}>
                    <option value="">Select State</option>
                    {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" style={inputStyle} />
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>City</label>
                {formData.country === 'India' && getCitiesForState().length > 0 ? (
                  <select name="city" value={formData.city} onChange={handleChange} style={selectStyle}>
                    <option value="">Select City</option>
                    {getCitiesForState().map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" style={inputStyle} />
                )}
              </div>
              <div>
                <label style={labelStyle}>ZIP Code</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="400001" style={inputStyle} />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '18px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '12px', background: '#2a5298', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '26px', fontWeight: '700', overflow: 'hidden' }}>
                {logoPreview ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : formData.organizationName?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#64748b' }}>Upload logo (PNG, JPG - max 2MB)</p>
                <input type="file" id="logo" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                <label htmlFor="logo" style={{ padding: '8px 18px', background: '#2a5298', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </label>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Brand Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} style={{ width: '48px', height: '48px', border: '2px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', padding: 0 }} />
                <input type="text" value={formData.primaryColor} readOnly style={{ ...inputStyle, width: '110px', fontFamily: 'monospace', textAlign: 'center' }} />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Timezone</label>
              <select name="timezone" value={formData.timezone} onChange={handleChange} style={selectStyle}>
                <option value="Asia/Kolkata">IST (India)</option>
                <option value="America/New_York">EST (US)</option>
                <option value="America/Los_Angeles">PST (US)</option>
                <option value="Europe/London">GMT (UK)</option>
                <option value="Asia/Dubai">GST (Dubai)</option>
              </select>
            </div>
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
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Side */}
      <div style={{
        width: '300px',
        background: 'linear-gradient(135deg, #5db9de 0%, #47b9e1 25%, #131d21 50%, #95b5ef 75%, #2a5298 100%)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '60px', left: '-30px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        {/* Logo only - white background */}
        <div style={{
          background: '#fff',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '36px',
          display: 'inline-block',
          alignSelf: 'flex-start',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <img src="/logo.png" alt="Logo" style={{ height: '32px', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

        {/* Welcome text */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', lineHeight: 1.3 }}>
            Welcome to Unified CRM
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.85, lineHeight: 1.6, margin: 0 }}>
            Complete your profile in 4 simple steps to start managing your business.
          </p>
        </div>

        {/* Steps */}
        <div style={{ flex: 1 }}>
          {stepData.map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px',
              borderRadius: '10px',
              marginBottom: '8px',
              background: currentStep === i + 1 ? 'rgba(255,255,255,0.15)' : 'transparent',
              transition: 'all 0.2s'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '600',
                background: currentStep > i + 1 ? '#10b981' : currentStep === i + 1 ? '#fff' : 'rgba(255,255,255,0.15)',
                color: currentStep > i + 1 ? '#fff' : currentStep === i + 1 ? '#2a5298' : 'rgba(255,255,255,0.8)',
                boxShadow: currentStep === i + 1 ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
              }}>
                {currentStep > i + 1 ? '✓' : step.icon}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: currentStep === i + 1 ? '600' : '500', opacity: currentStep < i + 1 ? 0.7 : 1 }}>
                  {step.title}
                </div>
                {currentStep === i + 1 && (
                  <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>{step.desc}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>
            All settings can be changed later from dashboard
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{ flex: 1, background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '28px 36px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>
                {stepData[currentStep - 1].title}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                {stepData[currentStep - 1].desc}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {[1, 2, 3, 4].map(s => (
                  <div key={s} style={{
                    width: s === currentStep ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: s <= currentStep ? '#2a5298' : '#e5e7eb',
                    transition: 'all 0.3s'
                  }} />
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '8px 16px', background: '#f3f4f6', color: '#6b7280',
                  border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px',
                  fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                Skip for Now →
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '600px', background: '#fff', padding: '28px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            {error && (
              <div style={{ padding: '12px 16px', marginBottom: '20px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '14px' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {renderStepContent()}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 36px', background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            style={{
              padding: '11px 22px', background: '#fff', color: currentStep === 1 ? '#d1d5db' : '#374151',
              border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep > 1 && currentStep < 4 && (
              <button type="button" onClick={handleNext} style={{
                padding: '11px 22px', background: '#fff', color: '#6b7280',
                border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
              }}>
                Skip
              </button>
            )}

            {currentStep < 4 ? (
              <button type="button" onClick={handleNext} style={{
                padding: '11px 28px', background: '#2a5298', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(42, 82, 152, 0.3)'
              }}>
                Continue →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} style={{
                padding: '11px 28px', background: loading ? '#9ca3af' : '#2a5298', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 2px 6px rgba(42, 82, 152, 0.3)'
              }}>
                {loading ? 'Setting up...' : 'Complete Setup ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
