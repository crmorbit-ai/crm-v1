import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LandingPageCustomizerSimple = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('hero');
  const [settings, setSettings] = useState({
    heroSection: {
      backgroundType: 'gradient',
      headline: '',
      subheadline: '',
      gradientColors: { start: '#3b82f6', end: '#1d4ed8' }
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/landing-page/settings');
      console.log('Settings loaded:', response.data);
      setSettings(response.data.data);
    } catch (err) {
      console.error('API Error:', err);
      // Create default settings
      setSettings({
        heroSection: {
          backgroundType: 'gradient',
          headline: 'Welcome to Our Platform',
          subheadline: 'Powerful CRM solution',
          gradientColors: { start: '#3b82f6', end: '#1d4ed8' }
        }
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
      console.error('Save error:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      console.log('Uploading file:', file.name, file.type, file.size);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/landing-page/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Upload response:', response.data);

      // Handle different response structures
      const fileUrl = response.data?.data?.url || response.data?.url || `/uploads/landing-pages/${file.name}`;
      console.log('File URL:', fileUrl);

      // Update settings with image URL
      setSettings(prev => ({
        ...prev,
        heroSection: {
          ...(prev?.heroSection || {}),
          [field]: fileUrl
        }
      }));

      alert('Image uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
      console.error('Error details:', err.response?.data);
      alert(`Failed to upload image: ${err.response?.data?.message || err.message}`);
    }
  };

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
              🎨 Landing Page Customizer
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              Customize your landing page - images, banners, carousels, and more
            </p>
          </div>
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
          { id: 'hero', label: '🎯 Hero' },
          { id: 'features', label: '✨ Features' },
          { id: 'about', label: 'ℹ️ About' },
          { id: 'showcase', label: '🖼️ Showcase' },
          { id: 'testimonials', label: '💬 Testimonials' },
          { id: 'stats', label: '📊 Stats' },
          { id: 'cta', label: '🚀 CTA' }
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
              whiteSpace: 'nowrap'
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
        {activeTab === 'hero' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>Hero Section</h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Headline
              </label>
              <input
                type="text"
                value={settings?.heroSection?.headline || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  heroSection: {
                    ...(prev?.heroSection || {}),
                    headline: e.target.value
                  }
                }))}
                placeholder="Enter your headline"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Subheadline
              </label>
              <textarea
                value={settings?.heroSection?.subheadline || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  heroSection: {
                    ...(prev?.heroSection || {}),
                    subheadline: e.target.value
                  }
                }))}
                placeholder="Enter your subheadline"
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Background Type
              </label>
              <select
                value={settings?.heroSection?.backgroundType || 'gradient'}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  heroSection: {
                    ...(prev?.heroSection || {}),
                    backgroundType: e.target.value
                  }
                }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  background: '#ffffff'
                }}
              >
                <option value="gradient">Gradient Background</option>
                <option value="image">Single Image</option>
                <option value="carousel">Image Carousel (Multiple)</option>
                <option value="video">Video Background</option>
              </select>
            </div>

            {/* Image Upload */}
            {settings?.heroSection?.backgroundType === 'image' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  Upload Background Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'backgroundImage')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px dashed #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
                {settings?.heroSection?.backgroundImage && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      Preview:
                    </p>
                    <img
                      src={`http://localhost:5000${settings.heroSection.backgroundImage}`}
                      alt="Background preview"
                      style={{ maxWidth: '300px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      onError={(e) => {
                        console.error('Image failed to load:', settings.heroSection.backgroundImage);
                        e.target.style.display = 'none';
                      }}
                    />
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', wordBreak: 'break-all' }}>
                      URL: {settings.heroSection.backgroundImage}
                    </p>
                  </div>
                )}
              </div>
            )}

            {settings?.heroSection?.backgroundType === 'gradient' && (
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#1e3a8a' }}>
                  ✨ Gradient background will be automatically applied!
                </p>
              </div>
            )}

            {(settings?.heroSection?.backgroundType === 'carousel' || settings?.heroSection?.backgroundType === 'video') && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                  🚧 {settings.heroSection.backgroundType === 'carousel' ? 'Carousel' : 'Video'} upload coming soon!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab !== 'hero' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚧</div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Coming soon... Full customization features will be added shortly!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPageCustomizerSimple;
