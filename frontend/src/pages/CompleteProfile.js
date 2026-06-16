import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCountries, getStates, getCities } from '../data/locationData';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, completeProfile, logout } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: '', slug: '', businessType: 'B2B', industry: '',
    numberOfEmployees: '', street: '', city: '', state: '', country: 'IN', zipCode: '',
    logo: null, primaryColor: '#2a5298', timezone: '', dateFormat: '', currency: ''
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const isSaasOwner = user?.userType === 'SAAS_OWNER' || user?.userType === 'SAAS_ADMIN';
    if (isSaasOwner || user?.isProfileComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const isSaasOwner = user?.userType === 'SAAS_OWNER' || user?.userType === 'SAAS_ADMIN';
  if (isSaasOwner || user?.isProfileComplete) return null;

  const industries = [
    'Technology', 'Healthcare', 'Finance & Banking', 'Manufacturing', 'Retail & E-commerce',
    'Education', 'Real Estate', 'Consulting', 'Marketing & Advertising', 'Logistics & Transportation',
    'Food & Beverage', 'Hospitality', 'Automotive', 'Telecommunications', 'Energy & Utilities',
    'Legal Services', 'Media & Entertainment', 'Construction', 'Agriculture', 'Other'
  ];

  // Get dynamic location data
  const allCountries = getCountries();
  const allStates = getStates(formData.country);
  const allCities = getCities(formData.country, formData.state);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'organizationName') {
      setFormData({ ...formData, organizationName: value, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') });
    } else if (name === 'country') {
      setFormData({ ...formData, country: value, state: '', city: '' });
    } else if (name === 'state') {
      if (value && !/^[a-zA-Z\s\-'&]*$/.test(value)) return;
      setFormData({ ...formData, state: value, city: '' });
    } else if (name === 'zipCode') {
      if (/^[a-zA-Z0-9\s\-]*$/.test(value)) setFormData({ ...formData, zipCode: value });
    } else if (name === 'city') {
      if (/^[a-zA-Z\s\-']*$/.test(value)) setFormData({ ...formData, city: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
      if (file.size > 2 * 1024 * 1024) { setError('Logo must be less than 2MB'); return; }
      if (file.size < 10 * 1024) { setError('Image is too small. Please upload a higher resolution logo (min 10KB)'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          if (img.width < 200 || img.height < 200) {
            setError('Image resolution is too low. Please upload at least 200×200 pixels');
            return;
          }
          setFormData(prev => ({ ...prev, logo: file }));
          setLogoPreview(reader.result);
          setError('');
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step) => {
    setError('');
    if (step === 1) {
      const name = formData.organizationName.trim();
      if (!name) { setError('Organization name is required'); return false; }
      if (name.length > 80) { setError('Organization name is too long (max 80 characters)'); return false; }
      if (!/[a-zA-Z0-9]{2,}/.test(name)) { setError('Please enter a valid organization name (must contain at least 2 letters or numbers)'); return false; }
      if (!/[a-zA-Z]/.test(name)) { setError('Organization name must contain at least one letter'); return false; }
      if (!formData.industry) { setError('Please select an Industry'); return false; }
      if (!formData.numberOfEmployees) { setError('Please select your Team Size'); return false; }
    }
    if (step === 2) {
      const street = formData.street.trim();
      if (street && street.length > 150) { setError('Address is too long (max 150 characters)'); return false; }
      if (street && !/[a-zA-Z0-9]/.test(street)) { setError('Please enter a valid street address'); return false; }
      if (!formData.state) { setError('Please select a State'); return false; }
      const city = formData.city.trim();
      if (!city) { setError('City is required'); return false; }
      if (city.length > 50) { setError('City name is too long (max 50 characters)'); return false; }
      if (!/^[a-zA-Z\s\-']+$/.test(city)) { setError('Please enter a valid city name (letters only)'); return false; }
      if (formData.state && formData.state.length > 50) { setError('State name is too long (max 50 characters)'); return false; }
      const zip = formData.zipCode.trim();
      if (zip && !/^[a-zA-Z0-9\s\-]{3,10}$/.test(zip)) { setError('Please enter a valid ZIP code'); return false; }
    }
    if (step === 4) {
      if (!formData.timezone) { setError('Please select your Timezone'); return false; }
      if (!formData.dateFormat) { setError('Please select a Date Format'); return false; }
      if (!formData.currency) { setError('Please select a Currency'); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 4)); };
  const handlePrevious = () => { setError(''); setCurrentStep(prev => Math.max(prev - 1, 1)); };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateStep(currentStep)) return;
    setLoading(true);
    try {
      const slugBase = formData.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uniqueSlug = `${slugBase}-${Date.now().toString(36)}`;
      await completeProfile({ ...formData, slug: uniqueSlug });
      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Dark-themed input styles (matches login page)
  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
    transition: 'border 0.2s'
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '500', color: '#94a3b8', marginBottom: '5px' };

  const stepData = [
    { title: 'Business', desc: 'Company details', icon: '🏢' },
    { title: 'Location', desc: 'Where you are', icon: '📍' },
    { title: 'Branding', desc: 'Logo & color', icon: '🎨' },
    { title: 'Preferences', desc: 'Defaults', icon: '⚙️' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .complete-grid4,.complete-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .complete-grid2{grid-template-columns:1fr!important;}
    .complete-split{flex-direction:column!important;}
    .complete-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .complete-panel{width:100%!important;}
    .complete-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .complete-form-row{grid-template-columns:1fr!important;}
    .complete-hide{display:none!important;}
  }
  @media(max-width:480px){
    .complete-grid4,.complete-grid3,.complete-grid2{grid-template-columns:1fr!important;}
  }
`}</style>
            <div>
              <label style={labelStyle}>Organization Name *</label>
              <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} placeholder="Your company name" style={inputStyle} maxLength={80} />
              <div style={{ fontSize: '11px', color: formData.organizationName.length > 70 ? '#f87171' : '#475569', textAlign: 'right', marginTop: 3 }}>{formData.organizationName.length}/80</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Industry *</label>
                <select name="industry" value={formData.industry} onChange={handleChange} style={selectStyle}>
                  <option value="" style={{ background: '#1e293b' }}>Select Industry</option>
                  {industries.map(ind => <option key={ind} value={ind} style={{ background: '#1e293b' }}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Business Type</label>
                <select name="businessType" value={formData.businessType} onChange={handleChange} style={selectStyle}>
                  <option value="B2B" style={{ background: '#1e293b' }}>B2B</option>
                  <option value="B2C" style={{ background: '#1e293b' }}>B2C</option>
                  <option value="B2B2C" style={{ background: '#1e293b' }}>B2B2C</option>
                </select>
              </div>
            </div>
            <div style={{ maxWidth: '180px' }}>
              <label style={labelStyle}>Team Size *</label>
              <select name="numberOfEmployees" value={formData.numberOfEmployees} onChange={handleChange} style={selectStyle}>
                <option value="" style={{ background: '#1e293b' }}>Select</option>
                {['1-10', '11-50', '51-200', '201-500', '500+'].map(s => <option key={s} value={s} style={{ background: '#1e293b' }}>{s}</option>)}
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Street Address</label>
              <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Enter business address" style={inputStyle} maxLength={150} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Country *</label>
                <select name="country" value={formData.country} onChange={handleChange} style={selectStyle}>
                  <option value="" style={{ background: '#1e293b' }}>Select Country</option>
                  {allCountries.map(country => (
                    <option key={country.isoCode} value={country.isoCode} style={{ background: '#1e293b' }}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>State / Province</label>
                {allStates.length > 0 ? (
                  <select name="state" value={formData.state} onChange={handleChange} style={selectStyle}>
                    <option value="" style={{ background: '#1e293b' }}>Select State</option>
                    {allStates.map(state => (
                      <option key={state.isoCode} value={state.isoCode} style={{ background: '#1e293b' }}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Enter state" style={inputStyle} maxLength={50} disabled={!formData.country} />
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>City</label>
                {allCities.length > 0 ? (
                  <select name="city" value={formData.city} onChange={handleChange} style={selectStyle}>
                    <option value="" style={{ background: '#1e293b' }}>Select City</option>
                    {allCities.map(city => (
                      <option key={city.name} value={city.name} style={{ background: '#1e293b' }}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Enter city name" style={inputStyle} maxLength={50} disabled={!formData.country} />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              border: '1px dashed rgba(255,255,255,0.12)'
            }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: formData.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                {logoPreview ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : formData.organizationName?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8' }}>PNG, JPG · max 2MB</p>
                <input type="file" id="logo" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                <label htmlFor="logo" style={{ padding: '6px 14px', background: 'rgba(139,92,246,0.2)', color: '#1EB980', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', border: '1px solid rgba(30,185,128,0.3)' }}>
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </label>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Brand Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.15)', borderRadius: '8px', cursor: 'pointer', padding: 0 }} />
                <input type="text" value={formData.primaryColor} readOnly style={{ ...inputStyle, width: '100px', fontFamily: 'monospace', textAlign: 'center' }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>Brand accent color</span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Timezone</label>
              <select name="timezone" value={formData.timezone} onChange={handleChange} style={selectStyle}>
                <option value="" style={{ background: '#1e293b' }}>Select Timezone *</option>
                <option value="Asia/Kolkata" style={{ background: '#1e293b' }}>IST (India)</option>
                <option value="America/New_York" style={{ background: '#1e293b' }}>EST (US)</option>
                <option value="America/Los_Angeles" style={{ background: '#1e293b' }}>PST (US)</option>
                <option value="Europe/London" style={{ background: '#1e293b' }}>GMT (UK)</option>
                <option value="Asia/Dubai" style={{ background: '#1e293b' }}>GST (Dubai)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date Format</label>
              <select name="dateFormat" value={formData.dateFormat} onChange={handleChange} style={selectStyle}>
                <option value="" style={{ background: '#1e293b' }}>Select Format *</option>
                <option value="DD/MM/YYYY" style={{ background: '#1e293b' }}>DD/MM/YYYY</option>
                <option value="MM/DD/YYYY" style={{ background: '#1e293b' }}>MM/DD/YYYY</option>
                <option value="YYYY-MM-DD" style={{ background: '#1e293b' }}>YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <select name="currency" value={formData.currency} onChange={handleChange} style={selectStyle}>
                <option value="" style={{ background: '#1e293b' }}>Select Currency *</option>
                <option value="INR" style={{ background: '#1e293b' }}>₹ INR</option>
                <option value="USD" style={{ background: '#1e293b' }}>$ USD</option>
                <option value="EUR" style={{ background: '#1e293b' }}>€ EUR</option>
                <option value="GBP" style={{ background: '#1e293b' }}>£ GBP</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glows */}
        <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '20px' }}>
          {/* Checkmark circle */}
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 0 12px rgba(16,185,129,0.15), 0 0 40px rgba(16,185,129,0.3)' }}>
            <span style={{ fontSize: '36px', color: '#fff' }}>✓</span>
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            🎉 Congratulations!
          </h1>
          <p style={{ fontSize: '17px', color: '#94a3b8', margin: '0 0 6px' }}>
            <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{formData.organizationName}</span> is all set up
          </p>
          <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 32px' }}>
            Your workspace is ready. Redirecting you to the dashboard...
          </p>

          {/* Animated progress bar */}
          <div style={{ width: '220px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', margin: '0 auto 28px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #1EB980)', borderRadius: '2px', animation: 'progressFill 3.5s linear forwards' }} />
          </div>

          <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 28px', background: 'linear-gradient(135deg, #1EB980, #1EB980)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(30,185,128,0.35)' }}>
            Go to Dashboard →
          </button>
        </div>

        <style>{`
          @keyframes progressFill {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1e2e', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Background glows — same as Login */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(30,185,128,0.07) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(30,185,128,0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Top Bar — Logo left */}
      <div style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', position: 'relative', zIndex: 10, flexShrink: 0 }}>
        <div style={{ background: '#fff', padding: '5px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '20px', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </div>

      {/* Center Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: '540px' }}>

          {/* Welcome heading */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <h1 style={{ margin: '0 0 10px', fontSize: '34px', fontWeight: '800', color: '#f1f5f9', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Welcome to{' '}
              <span style={{ background: 'linear-gradient(135deg, #1EB980, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Unified CRM
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: '16px', color: '#64748b', lineHeight: 1.5 }}>
              Complete your workspace setup in 4 simple steps to unlock all features
            </p>
          </div>

          {/* Step breadcrumb — just above the card */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
            {stepData.map((step, i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', opacity: currentStep < i + 1 ? 0.35 : 1, transition: 'opacity 0.25s' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: currentStep > i + 1 ? '#10b981' : currentStep === i + 1 ? 'linear-gradient(135deg, #1EB980, #1EB980)' : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '700', color: '#fff',
                    boxShadow: currentStep === i + 1 ? '0 0 0 4px rgba(30,185,128,0.3)' : 'none',
                    transition: 'all 0.3s', flexShrink: 0
                  }}>
                    {currentStep > i + 1 ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '14px', color: currentStep === i + 1 ? '#e2e8f0' : '#475569', fontWeight: currentStep === i + 1 ? '600' : '400', whiteSpace: 'nowrap' }}>
                    {step.title}
                  </span>
                </div>
                {i < stepData.length - 1 && (
                  <div style={{ width: '32px', height: '1px', background: currentStep > i + 1 ? '#10b981' : 'rgba(255,255,255,0.1)', margin: '0 8px', transition: 'background 0.3s', flexShrink: 0 }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', backdropFilter: 'blur(12px)' }}>

            {/* Card Header */}
            <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #1EB980, #1EB980)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                {stepData[currentStep - 1].icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', lineHeight: 1.2 }}>
                  {currentStep === 1 ? 'Business Details' : currentStep === 2 ? 'Location Info' : currentStep === 3 ? 'Branding' : 'Preferences'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                  {stepData[currentStep - 1].desc}
                </div>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Skip for now →
              </button>
            </div>

            {/* Form Body */}
            <div style={{ padding: '18px 22px' }}>
              {error && (
                <div style={{ padding: '9px 14px', marginBottom: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: '8px', fontSize: '12px' }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                {renderStepContent()}
              </form>
            </div>

            {/* Card Footer */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)' }}>
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                style={{
                  padding: '8px 16px',
                  background: currentStep === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                  color: currentStep === 1 ? '#334155' : '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '7px', fontSize: '12px', fontWeight: '500',
                  cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Back
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {currentStep > 1 && currentStep < 4 && (
                  <button type="button" onClick={handleNext} style={{ padding: '8px 14px', background: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                    Skip
                  </button>
                )}
                {currentStep < 4 ? (
                  <button type="button" onClick={handleNext} style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #1EB980 0%, #1EB980 100%)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(30,185,128,0.3)' }}>
                    Continue →
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={loading} style={{ padding: '8px 20px', background: loading ? '#374151' : 'linear-gradient(135deg, #1EB980 0%, #1EB980 100%)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 14px rgba(30,185,128,0.3)' }}>
                    {loading ? 'Setting up...' : 'Complete Setup ✓'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Below card — note */}
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#334155', margin: '12px 0 0' }}>
            All settings can be changed later from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
