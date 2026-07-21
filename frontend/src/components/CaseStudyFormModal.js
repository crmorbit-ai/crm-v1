import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CaseStudyFormModal = ({ show, onClose, onSubmit, initialData = null, isEdit = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    title: initialData?.title || '',
    shortDescription: initialData?.shortDescription || '',
    executiveSummary: initialData?.executiveSummary || '',
    category: initialData?.category || 'Sales',
    tags: initialData?.tags?.join(', ') || '',

    // Client Details
    clientName: initialData?.clientName || '',
    industry: initialData?.industry || '',
    companySize: initialData?.companySize || '51-200',
    location: {
      country: initialData?.location?.country || '',
      city: initialData?.location?.city || '',
      region: initialData?.location?.region || ''
    },
    website: initialData?.website || '',
    stakeholder: {
      name: initialData?.stakeholder?.name || '',
      designation: initialData?.stakeholder?.designation || ''
    },

    // Challenge & Solution
    challenge: initialData?.challenge || '',
    solution: initialData?.solution || '',
    content: initialData?.content || '',
    duration: {
      value: initialData?.duration?.value || '',
      unit: initialData?.duration?.unit || 'months',
      displayText: initialData?.duration?.displayText || ''
    },

    // Results & Metrics
    results: initialData?.results?.length ? initialData.results : [
      { metric: '', value: '', description: '', type: 'percentage' }
    ],
    roi: {
      percentage: initialData?.roi?.percentage || '',
      description: initialData?.roi?.description || '',
      timeframe: initialData?.roi?.timeframe || ''
    },
    financialImpact: {
      costSavings: initialData?.financialImpact?.costSavings || '',
      revenueIncrease: initialData?.financialImpact?.revenueIncrease || '',
      timeReduction: initialData?.financialImpact?.timeReduction || ''
    },
    beforeAfter: {
      before: initialData?.beforeAfter?.before || [{ metric: '', value: '' }],
      after: initialData?.beforeAfter?.after || [{ metric: '', value: '' }]
    },
    timeline: initialData?.timeline || [],
    productsUsed: initialData?.productsUsed || [],

    // Media & Testimonials
    testimonial: {
      quote: initialData?.testimonial?.quote || '',
      author: initialData?.testimonial?.author || '',
      authorTitle: initialData?.testimonial?.authorTitle || '',
      rating: initialData?.testimonial?.rating || 5
    },

    // Publishing
    status: initialData?.status || 'draft', // 'draft', 'published', or 'scheduled'
    scheduledPublishDate: initialData?.scheduledPublishDate ? new Date(initialData.scheduledPublishDate).toISOString().slice(0, 16) : '',
    isPublished: initialData?.isPublished || false,
    isFeatured: initialData?.isFeatured || false,
    displayOrder: initialData?.displayOrder || 0
  });

  const [files, setFiles] = useState({
    featuredImage: null,
    clientLogo: null,
    stakeholderPhoto: null,
    pdfDocument: null
  });

  const steps = [
    { num: 1, title: 'Basic Info', icon: '📝' },
    { num: 2, title: 'Client Details', icon: '🏢' },
    { num: 3, title: 'Challenge & Solution', icon: '💡' },
    { num: 4, title: 'Results & Metrics', icon: '📊' },
    { num: 5, title: 'Media & Testimonials', icon: '🎬' },
    { num: 6, title: 'Publishing', icon: '🚀' }
  ];

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addResult = () => {
    setFormData(prev => ({
      ...prev,
      results: [...prev.results, { metric: '', value: '', description: '', type: 'percentage' }]
    }));
  };

  const updateResult = (index, field, value) => {
    const updated = [...formData.results];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, results: updated }));
  };

  const removeResult = (index) => {
    setFormData(prev => ({
      ...prev,
      results: prev.results.filter((_, i) => i !== index)
    }));
  };

  const addTimelineItem = () => {
    setFormData(prev => ({
      ...prev,
      timeline: [...prev.timeline, { phase: '', description: '', duration: '', milestone: '' }]
    }));
  };

  const addBeforeAfter = (type) => {
    setFormData(prev => ({
      ...prev,
      beforeAfter: {
        ...prev.beforeAfter,
        [type]: [...prev.beforeAfter[type], { metric: '', value: '' }]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();

    // Add text fields
    Object.keys(formData).forEach(key => {
      if (key === 'tags') {
        formDataToSend.append(key, JSON.stringify(formData[key].split(',').map(t => t.trim()).filter(Boolean)));
      } else if (['results', 'timeline', 'productsUsed', 'beforeAfter'].includes(key)) {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (typeof formData[key] === 'object' && formData[key] !== null) {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Add files
    Object.keys(files).forEach(key => {
      if (files[key]) {
        formDataToSend.append(key, files[key]);
      }
    });

    await onSubmit(formDataToSend);
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (!show) return null;

  const inputStyle = {
    width: '100%',
    background: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#1e293b',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
    transition: 'all 0.3s'
  };

  const labelStyle = {
    display: 'block',
    color: '#334155',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '700'
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#f8fafc',
        borderRadius: '24px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>
              {isEdit ? '✏️ Edit Case Study' : '✨ Create New Case Study'}
            </h2>
            <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '14px' }}>
              Step {currentStep} of 6 - {steps[currentStep - 1].title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              fontSize: '28px',
              cursor: 'pointer',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          background: '#fff',
          padding: '16px 24px',
          gap: '10px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          {steps.map((step) => (
            <div
              key={step.num}
              onClick={() => setCurrentStep(step.num)}
              style={{
                padding: '14px 10px',
                borderRadius: '12px',
                background: currentStep === step.num ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f1f5f9',
                color: currentStep === step.num ? '#fff' : '#64748b',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: '700',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                border: currentStep === step.num ? '2px solid #3b82f6' : '1px solid transparent',
                boxShadow: currentStep === step.num ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                transform: currentStep === step.num ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (currentStep !== step.num) {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentStep !== step.num) {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <div style={{ fontSize: '24px' }}>{step.icon}</div>
              <div style={{ lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                {step.title}
              </div>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto', padding: '32px' }}>

          {/* Step 1: Basic Info */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Case Study Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., How Acme Corp Increased Sales by 150%"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Short Description * (Max 300 chars)</label>
                <textarea
                  required
                  maxLength={300}
                  value={formData.shortDescription}
                  onChange={(e) => handleChange('shortDescription', e.target.value)}
                  placeholder="Brief teaser for preview cards"
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {formData.shortDescription.length}/300
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Executive Summary (50-500 chars)</label>
                <textarea
                  maxLength={500}
                  value={formData.executiveSummary}
                  onChange={(e) => handleChange('executiveSummary', e.target.value)}
                  placeholder="Quick overview for decision makers - the what, why, and impact in 2-3 sentences"
                  style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {formData.executiveSummary.length}/500
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Sales">💰 Sales</option>
                    <option value="Marketing">📢 Marketing</option>
                    <option value="Support">🎧 Support</option>
                    <option value="Operations">⚙️ Operations</option>
                    <option value="Technology">💻 Technology</option>
                    <option value="Other">📌 Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    placeholder="CRM, Analytics, Cloud, AI"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Featured Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFiles({ ...files, featuredImage: e.target.files[0] })}
                  style={{ ...inputStyle, padding: '10px' }}
                />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  Recommended: 1200x600px, Max 5MB
                </p>
              </div>
            </div>

          {/* Step 2: Client Details */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Client Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => handleChange('clientName', e.target.value)}
                    placeholder="Acme Corporation"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Industry *</label>
                  <input
                    type="text"
                    required
                    value={formData.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    placeholder="Technology, Healthcare, Finance..."
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Company Size</label>
                  <select
                    value={formData.companySize}
                    onChange={(e) => handleChange('companySize', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1001-5000">1001-5000 employees</option>
                    <option value="5001+">5001+ employees</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Client Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFiles({ ...files, clientLogo: e.target.files[0] })}
                  style={{ ...inputStyle, padding: '10px' }}
                />
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  📍 Location
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Country</label>
                    <input
                      type="text"
                      value={formData.location.country}
                      onChange={(e) => handleChange('location.country', e.target.value)}
                      placeholder="USA"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => handleChange('location.city', e.target.value)}
                      placeholder="San Francisco"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Region/State</label>
                    <input
                      type="text"
                      value={formData.location.region}
                      onChange={(e) => handleChange('location.region', e.target.value)}
                      placeholder="California"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  👤 Key Stakeholder
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input
                      type="text"
                      value={formData.stakeholder.name}
                      onChange={(e) => handleChange('stakeholder.name', e.target.value)}
                      placeholder="John Doe"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Designation</label>
                    <input
                      type="text"
                      value={formData.stakeholder.designation}
                      onChange={(e) => handleChange('stakeholder.designation', e.target.value)}
                      placeholder="CEO, VP of Sales..."
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

          {/* Step 3: Challenge & Solution */}
          <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Challenge / Problem Statement</label>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <ReactQuill
                    theme="snow"
                    value={formData.challenge}
                    onChange={(value) => handleChange('challenge', value)}
                    placeholder="What was the business problem or pain point? You can add bold text, colors, bullet points..."
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ]
                    }}
                    style={{ minHeight: '150px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Solution / Approach</label>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <ReactQuill
                    theme="snow"
                    value={formData.solution}
                    onChange={(value) => handleChange('solution', value)}
                    placeholder="How did your product/service solve it? Format with colors, bold text..."
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ]
                    }}
                    style={{ minHeight: '150px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Full Content / Story * 📖</label>
                <div style={{ background: '#fff', border: '2px solid #1EB980', borderRadius: '8px' }}>
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(value) => handleChange('content', value)}
                    placeholder="Write the complete story with full formatting: headings, bold text, colors, bullet points, numbered lists..."
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['blockquote', 'code-block'],
                        ['link'],
                        ['clean']
                      ]
                    }}
                    style={{ minHeight: '300px' }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: '600' }}>
                  ✨ Use rich formatting: Make important text <strong>bold</strong>, add <span style={{background: '#fef3c7', padding: '2px 6px', borderRadius: '4px'}}>background colors</span>, create bullet points, etc.
                </p>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  ⏱️ Project Duration
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Value</label>
                    <input
                      type="number"
                      value={formData.duration.value}
                      onChange={(e) => handleChange('duration.value', e.target.value)}
                      placeholder="6"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Unit</label>
                    <select
                      value={formData.duration.unit}
                      onChange={(e) => handleChange('duration.unit', e.target.value)}
                      style={inputStyle}
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Display Text (optional)</label>
                    <input
                      type="text"
                      value={formData.duration.displayText}
                      onChange={(e) => handleChange('duration.displayText', e.target.value)}
                      placeholder="e.g., 6 months (Jan - June 2026)"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

          {/* Step 4: Results & Metrics */}
          <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                    📊 Key Results & Metrics
                  </h4>
                  <button
                    type="button"
                    onClick={addResult}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Result
                  </button>
                </div>

                {formData.results.map((result, index) => (
                  <div key={index} style={{
                    background: '#fff',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 40px', gap: '12px', marginBottom: '12px' }}>
                      <input
                        type="text"
                        value={result.metric}
                        onChange={(e) => updateResult(index, 'metric', e.target.value)}
                        placeholder="Metric (e.g., Revenue Growth)"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={result.value}
                        onChange={(e) => updateResult(index, 'value', e.target.value)}
                        placeholder="Value (e.g., +150%)"
                        style={inputStyle}
                      />
                      <select
                        value={result.type || 'percentage'}
                        onChange={(e) => updateResult(index, 'type', e.target.value)}
                        style={inputStyle}
                      >
                        <option value="percentage">%</option>
                        <option value="currency">$</option>
                        <option value="number">#</option>
                        <option value="time">⏱️</option>
                        <option value="custom">Custom</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeResult(index)}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '18px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="text"
                      value={result.description || ''}
                      onChange={(e) => updateResult(index, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  💰 ROI & Financial Impact
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>ROI %</label>
                    <input
                      type="number"
                      value={formData.roi.percentage}
                      onChange={(e) => handleChange('roi.percentage', e.target.value)}
                      placeholder="213"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Timeframe</label>
                    <input
                      type="text"
                      value={formData.roi.timeframe}
                      onChange={(e) => handleChange('roi.timeframe', e.target.value)}
                      placeholder="within 6 months"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Cost Savings</label>
                    <input
                      type="text"
                      value={formData.financialImpact.costSavings}
                      onChange={(e) => handleChange('financialImpact.costSavings', e.target.value)}
                      placeholder="$230K/year"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Revenue Increase</label>
                    <input
                      type="text"
                      value={formData.financialImpact.revenueIncrease}
                      onChange={(e) => handleChange('financialImpact.revenueIncrease', e.target.value)}
                      placeholder="+40%"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Time Reduction</label>
                    <input
                      type="text"
                      value={formData.financialImpact.timeReduction}
                      onChange={(e) => handleChange('financialImpact.timeReduction', e.target.value)}
                      placeholder="20 hrs/week"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

          {/* Step 5: Media & Testimonials */}
          <div style={{ display: currentStep === 5 ? 'block' : 'none' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  💬 Client Testimonial
                </h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Quote</label>
                  <textarea
                    value={formData.testimonial.quote}
                    onChange={(e) => handleChange('testimonial.quote', e.target.value)}
                    placeholder='"This solution transformed our business..."'
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Author Name</label>
                    <input
                      type="text"
                      value={formData.testimonial.author}
                      onChange={(e) => handleChange('testimonial.author', e.target.value)}
                      placeholder="John Doe"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Author Title</label>
                    <input
                      type="text"
                      value={formData.testimonial.authorTitle}
                      onChange={(e) => handleChange('testimonial.authorTitle', e.target.value)}
                      placeholder="CEO"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Rating</label>
                    <select
                      value={formData.testimonial.rating}
                      onChange={(e) => handleChange('testimonial.rating', parseInt(e.target.value))}
                      style={inputStyle}
                    >
                      <option value="5">⭐⭐⭐⭐⭐</option>
                      <option value="4">⭐⭐⭐⭐</option>
                      <option value="3">⭐⭐⭐</option>
                      <option value="2">⭐⭐</option>
                      <option value="1">⭐</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>PDF Download (optional)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFiles({ ...files, pdfDocument: e.target.files[0] })}
                  style={{ ...inputStyle, padding: '10px' }}
                />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  Upload a PDF version for users to download
                </p>
              </div>
            </div>

          {/* Step 6: Publishing */}
          <div style={{ display: currentStep === 6 ? 'block' : 'none' }}>
              {/* Status Selection */}
              <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', padding: '32px', borderRadius: '16px', marginBottom: '24px', border: '2px solid #3b82f6' }}>
                <h4 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '900', color: '#1e3a8a' }}>
                  🚀 Choose Status
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  {/* Draft Button */}
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('status', 'draft');
                      handleChange('isPublished', false);
                    }}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      border: formData.status === 'draft' ? '3px solid #f59e0b' : '2px solid #e5e7eb',
                      background: formData.status === 'draft'
                        ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                        : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: formData.status === 'draft' ? '0 8px 24px rgba(245,158,11,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                      transform: formData.status === 'draft' ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📝</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#92400e', marginBottom: '6px' }}>
                      Save as Draft
                    </div>
                    <div style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.5' }}>
                      Keep private
                    </div>
                  </button>

                  {/* Publish Button */}
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('status', 'published');
                      handleChange('isPublished', true);
                    }}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      border: formData.status === 'published' ? '3px solid #10b981' : '2px solid #e5e7eb',
                      background: formData.status === 'published'
                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                        : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: formData.status === 'published' ? '0 8px 24px rgba(16,185,129,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                      transform: formData.status === 'published' ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#065f46', marginBottom: '6px' }}>
                      Publish Now
                    </div>
                    <div style={{ fontSize: '12px', color: '#064e3b', lineHeight: '1.5' }}>
                      Public instantly
                    </div>
                  </button>

                  {/* Schedule Button */}
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('status', 'scheduled');
                      handleChange('isPublished', false);
                    }}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      border: formData.status === 'scheduled' ? '3px solid #6366f1' : '2px solid #e5e7eb',
                      background: formData.status === 'scheduled'
                        ? 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'
                        : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: formData.status === 'scheduled' ? '0 8px 24px rgba(99,102,241,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                      transform: formData.status === 'scheduled' ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>⏰</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#3730a3', marginBottom: '6px' }}>
                      Schedule
                    </div>
                    <div style={{ fontSize: '12px', color: '#4338ca', lineHeight: '1.5' }}>
                      Auto-publish later
                    </div>
                  </button>
                </div>

                {/* Schedule Date/Time Picker */}
                {formData.status === 'scheduled' && (
                  <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '12px',
                    border: '2px solid #6366f1'
                  }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
                      📅 Select Publish Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledPublishDate}
                      onChange={(e) => handleChange('scheduledPublishDate', e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        fontWeight: '600',
                        border: '2px solid #6366f1',
                        borderRadius: '10px',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      required={formData.status === 'scheduled'}
                    />
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: '600' }}>
                      ⚡ Auto-publishes every 5 minutes. Your case study will go live within 5 minutes of scheduled time.
                    </p>
                  </div>
                )}

                {/* Current Status Indicator */}
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>
                    Current Status:{' '}
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '900',
                    color: formData.status === 'published' ? '#10b981' : formData.status === 'scheduled' ? '#6366f1' : '#f59e0b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {formData.status === 'published' ? '✅ Published' : formData.status === 'scheduled' ? '⏰ Scheduled' : '📝 Draft'}
                  </span>
                  {formData.status === 'scheduled' && formData.scheduledPublishDate && (
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', fontWeight: '600' }}>
                      Will publish: {new Date(formData.scheduledPublishDate).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'Asia/Kolkata'
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Featured & Display Order */}
              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  ⚙️ Additional Options
                </h4>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => handleChange('isFeatured', e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>
                      ⭐ Mark as Featured
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      Highlight this case study at the top
                    </div>
                  </div>
                </label>

                <div>
                  <label style={labelStyle}>Display Order (0 = highest priority)</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => handleChange('displayOrder', parseInt(e.target.value) || 0)}
                    style={{ ...inputStyle, maxWidth: '200px' }}
                  />
                </div>
              </div>

              <div style={{ background: '#dbeafe', border: '2px solid #3b82f6', padding: '20px', borderRadius: '16px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '800', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ℹ️ Review Before Publishing
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e40af', fontSize: '14px', lineHeight: '1.8' }}>
                  <li>Check all metrics and results are accurate</li>
                  <li>Ensure client testimonial and stakeholder details are approved</li>
                  <li>Verify images are high quality and properly sized</li>
                  <li>Review content for typos and clarity</li>
                </ul>
              </div>
            </div>
        </form>

        {/* Footer with Navigation */}
        <div style={{
          padding: '20px 32px',
          background: '#fff',
          borderTop: '2px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            style={{
              background: currentStep === 1 ? '#f1f5f9' : '#fff',
              color: currentStep === 1 ? '#cbd5e1' : '#3b82f6',
              border: '2px solid',
              borderColor: currentStep === 1 ? '#e2e8f0' : '#3b82f6',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous
          </button>

          <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
            Step {currentStep} of 6
          </div>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 32px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              {isEdit ? '✅ Update Case Study' : '🚀 Create Case Study'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseStudyFormModal;

// Add global styles for ReactQuill
const quillStyles = `
  .ql-container {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 15px;
    min-height: 150px;
  }

  .ql-editor {
    min-height: 150px;
    max-height: 400px;
    overflow-y: auto;
  }

  .ql-editor.ql-blank::before {
    font-style: normal;
    color: #94a3b8;
  }

  .ql-toolbar {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    background: #f8fafc;
    border-color: #e2e8f0 !important;
  }

  .ql-container {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    border-color: #e2e8f0 !important;
  }

  .ql-snow .ql-stroke {
    stroke: #475569;
  }

  .ql-snow .ql-fill {
    fill: #475569;
  }

  .ql-snow .ql-picker-label {
    color: #475569;
  }

  .ql-toolbar button:hover,
  .ql-toolbar button:focus {
    color: #1EB980 !important;
  }

  .ql-toolbar button:hover .ql-stroke,
  .ql-toolbar button:focus .ql-stroke {
    stroke: #1EB980 !important;
  }

  .ql-snow.ql-toolbar button.ql-active .ql-stroke {
    stroke: #1EB980 !important;
  }

  .ql-snow.ql-toolbar button.ql-active {
    color: #1EB980 !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'quill-custom-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = quillStyles;
    document.head.appendChild(style);
  }
}
