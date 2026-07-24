import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LandingPageCustomizer = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/landing-page/settings');
      console.log('Settings fetched:', response.data);
      setSettings(response.data.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      // Create default settings if API fails
      setSettings({
        heroSection: {
          backgroundType: 'gradient',
          headline: 'Welcome to Our Platform',
          subheadline: 'Powerful CRM solution for your business',
          ctaText: 'Get Started',
          ctaLink: '/register',
          gradientColors: { start: '#3b82f6', end: '#1d4ed8' }
        },
        featuresSection: { enabled: true, features: [] },
        aboutSection: { enabled: true },
        showcaseSection: { enabled: true, items: [] },
        testimonialsSection: { enabled: true, testimonials: [] },
        statsSection: { enabled: true, stats: [] },
        ctaSection: { enabled: true },
        footer: {},
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#1d4ed8',
          accentColor: '#f59e0b'
        },
        isPublished: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/landing-page/settings', settings);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, field, section) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Please select an image or video file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/landing-page/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileUrl = response.data.data.url;

      // Update settings
      if (section) {
        setSettings(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [field]: fileUrl
          }
        }));
      } else {
        setSettings(prev => ({ ...prev, [field]: fileUrl }));
      }

      alert('Image uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMultipleImageUpload = async (e, field, section) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploadingImage(true);
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/landing-page/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Add to existing images
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: [...(prev[section][field] || []), ...uploadedUrls]
        }
      }));

      alert(`${uploadedUrls.length} images uploaded successfully!`);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload images');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      const response = await api.patch('/landing-page/toggle-publish');
      setSettings(response.data.data);
      alert(`Landing page ${response.data.data.isPublished ? 'published' : 'unpublished'} successfully!`);
    } catch (err) {
      console.error('Failed to toggle publish:', err);
      alert('Failed to update publish status');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
        Loading landing page settings...
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 700, color: '#111827' }}>
            🎨 Landing Page Customizer
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Customize your landing page - images, banners, carousels, and more
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleTogglePublish}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: settings.isPublished ? '#fef3c7' : '#dcfce7',
              color: settings.isPublished ? '#92400e' : '#166534',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {settings.isPublished ? '📤 Published' : '📥 Unpublished'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: saving ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
            }}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '16px 24px',
        marginBottom: '24px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {[
          { id: 'hero', label: '🎯 Hero Section', icon: '🎯' },
          { id: 'features', label: '✨ Features', icon: '✨' },
          { id: 'about', label: 'ℹ️ About', icon: 'ℹ️' },
          { id: 'showcase', label: '🖼️ Showcase', icon: '🖼️' },
          { id: 'testimonials', label: '💬 Testimonials', icon: '💬' },
          { id: 'stats', label: '📊 Stats', icon: '📊' },
          { id: 'cta', label: '🚀 CTA', icon: '🚀' },
          { id: 'theme', label: '🎨 Theme', icon: '🎨' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#f3f4f6',
              color: activeTab === tab.id ? '#ffffff' : '#6b7280',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {renderTabContent()}
      </div>
    </div>
  );

  function renderTabContent() {
    if (!settings) {
      return <div>Loading settings...</div>;
    }

    switch (activeTab) {
      case 'hero':
        return renderHeroSection();
      case 'features':
        return renderFeaturesSection();
      case 'about':
        return renderAboutSection();
      case 'showcase':
        return renderShowcaseSection();
      case 'testimonials':
        return renderTestimonialsSection();
      case 'stats':
        return renderStatsSection();
      case 'cta':
        return renderCTASection();
      case 'theme':
        return renderThemeSection();
      default:
        return null;
    }
  }

  function renderHeroSection() {
    const heroSection = settings?.heroSection || {};

    return (
      <div>
        <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 700 }}>Hero Section</h2>

        {/* Background Type */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Background Type</label>
          <select
            value={heroSection.backgroundType || 'image'}
            onChange={(e) => setSettings({
              ...settings,
              heroSection: { ...heroSection, backgroundType: e.target.value }
            })}
            style={selectStyle}
          >
            <option value="image">Single Image</option>
            <option value="carousel">Image Carousel</option>
            <option value="video">Video Background</option>
            <option value="gradient">Gradient</option>
          </select>
        </div>

        {/* Single Image Upload */}
        {heroSection.backgroundType === 'image' && (
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Background Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'backgroundImage', 'heroSection')}
              style={fileInputStyle}
            />
            {heroSection.backgroundImage && (
              <img
                src={heroSection.backgroundImage}
                alt="Hero background"
                style={{ marginTop: '12px', maxWidth: '300px', borderRadius: '8px' }}
              />
            )}
          </div>
        )}

        {/* Carousel Images */}
        {heroSection.backgroundType === 'carousel' && (
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Carousel Images (Multiple)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleMultipleImageUpload(e, 'backgroundImages', 'heroSection')}
              style={fileInputStyle}
            />
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
              {heroSection.backgroundImages?.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Carousel ${idx + 1}`}
                  style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Text Content */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Headline</label>
          <input
            type="text"
            value={heroSection.headline || ''}
            onChange={(e) => setSettings({
              ...settings,
              heroSection: { ...heroSection, headline: e.target.value }
            })}
            style={inputStyle}
            placeholder="Enter hero headline"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Subheadline</label>
          <textarea
            value={heroSection.subheadline || ''}
            onChange={(e) => setSettings({
              ...settings,
              heroSection: { ...heroSection, subheadline: e.target.value }
            })}
            style={textareaStyle}
            placeholder="Enter subheadline"
            rows="3"
          />
        </div>
      </div>
    );
  }

  function renderFeaturesSection() {
    return (
      <div>
        <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 700 }}>Features Section</h2>
        <p style={{ color: '#6b7280' }}>Features customization coming soon...</p>
      </div>
    );
  }

  function renderAboutSection() {
    return (
      <div>
        <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 700 }}>About Section</h2>
        <p style={{ color: '#6b7280' }}>About section customization coming soon...</p>
      </div>
    );
  }

  function renderShowcaseSection() {
    return (
      <div>
        <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 700 }}>Showcase Section</h2>
        <p style={{ color: '#6b7280' }}>Showcase customization coming soon...</p>
      </div>
    );
  }

  function renderTestimonialsSection() {
    return (
      <div>
        <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 700 }}>Testimonials Section</h2>
        <p style={{ color: '#6b7280' }}>Testimonials customization coming soon...</p>
      </div>
    );
  }

  function renderStatsSection() {
    return (
      <div>
        <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 700 }}>Stats Section</h2>
        <p style={{ color: '#6b7280' }}>Stats customization coming soon...</p>
      </div>
    );
  }

  function renderCTASection() {
    return (
      <div>
        <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 700 }}>CTA Section</h2>
        <p style={{ color: '#6b7280' }}>CTA customization coming soon...</p>
      </div>
    );
  }

  function renderThemeSection() {
    return (
      <div>
        <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 700 }}>Theme Settings</h2>
        <p style={{ color: '#6b7280' }}>Theme customization coming soon...</p>
      </div>
    );
  }
};

// Styles
const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '8px'
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none'
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  fontFamily: 'inherit'
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  background: '#ffffff'
};

const fileInputStyle = {
  width: '100%',
  padding: '12px',
  border: '2px dashed #e5e7eb',
  borderRadius: '8px',
  cursor: 'pointer'
};

export default LandingPageCustomizer;
