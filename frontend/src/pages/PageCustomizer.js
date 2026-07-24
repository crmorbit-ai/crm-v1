import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import SaasLayout from '../components/layout/SaasLayout';

const PageCustomizer = () => {
  const [activePage, setActivePage] = useState('home');
  // Image crop modal state
  const [cropModal, setCropModal] = useState({
    show: false,
    imageSrc: null,
    crop: { x: 50, y: 50, width: 400, height: 225 }, // x, y in %, width/height in px
    imageSize: { width: 0, height: 0 },
    containerSize: { width: 800, height: 500 },
    isDragging: false,
    isResizing: false,
    dragStart: { x: 0, y: 0 },
    onSave: null
  });

  const [settings, setSettings] = useState({
    homePage: {
      topBanner: { image: '', heading: '', subheading: '' },
      statsSection: { images: [], autoRotate: true, interval: 2000 },
      connectSection: { type: 'video', url: '', heading: '', content: '' },
      section1: { image: '', heading: '', content: '' },
      section2: { image: '', heading: '', content: '' },
      section3: { image: '', heading: '', content: '' }
    },
    aboutPage: {
      banner: { image: '', heading: '', subheading: '' },
      section1: { image: '', heading: '', content: '' },
      section2: { image: '', heading: '', content: '' }
    },
    productsPage: {
      banner: { image: '', heading: '', subheading: '' },
      section1: { image: '', heading: '', content: '' },
      section2: { image: '', heading: '', content: '' }
    },
    featuresPage: {
      banner: { image: '', heading: '', subheading: '' },
      section1: { image: '', heading: '', content: '' },
      section2: { image: '', heading: '', content: '' }
    },
    contactPage: {
      banner: { image: '', heading: '', subheading: '' },
      section1: { image: '', heading: '', content: '' }
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Crop drag & resize handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cropModal.isDragging) {
        const img = document.getElementById('crop-image');
        if (!img) return;

        const imgRect = img.getBoundingClientRect();

        // Calculate position relative to IMAGE, not viewport
        const newX = e.clientX - imgRect.left - cropModal.dragStart.x;
        const newY = e.clientY - imgRect.top - cropModal.dragStart.y;

        // Constrain to image boundaries (in image coordinates)
        const maxX = img.width - cropModal.crop.width;
        const maxY = img.height - cropModal.crop.height;

        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));

        setCropModal(prev => ({
          ...prev,
          crop: { ...prev.crop, x: constrainedX, y: constrainedY }
        }));
      } else if (cropModal.isResizing) {
        const img = document.getElementById('crop-image');
        if (!img) return;

        const corner = cropModal.isResizing;
        const deltaX = e.clientX - cropModal.dragStart.x;
        const deltaY = e.clientY - cropModal.dragStart.y;

        setCropModal(prev => {
          let { x, y, width, height } = prev.crop;
          const aspectRatio = prev.aspectRatio || (16 / 9); // Use locked ratio if set
          const maxWidth = img.width;
          const maxHeight = img.height;

          // Resize based on corner (maintaining aspect ratio)
          if (corner.includes('e')) {
            width = Math.max(100, Math.min(width + deltaX, maxWidth - x));
          } else if (corner.includes('w')) {
            const newWidth = Math.max(100, width - deltaX);
            const deltaWidth = width - newWidth;
            if (x + deltaWidth >= 0 && newWidth <= maxWidth) {
              x = x + deltaWidth;
              width = newWidth;
            }
          }

          // Force height based on locked aspect ratio
          height = width / aspectRatio;

          // Adjust Y for north handles
          if (corner.includes('n')) {
            const deltaHeight = height - prev.crop.height;
            const newY = y - deltaHeight;
            if (newY >= 0) {
              y = newY;
            } else {
              y = 0;
              height = prev.crop.height;
              width = height * aspectRatio;
            }
          }

          // Constrain to image bounds
          if (y + height > maxHeight) {
            height = maxHeight - y;
            width = height * aspectRatio;
          }
          if (x + width > maxWidth) {
            width = maxWidth - x;
            height = width / aspectRatio;
          }

          return {
            ...prev,
            crop: { x, y, width, height },
            dragStart: { x: e.clientX, y: e.clientY }
          };
        });
      }
    };

    const handleMouseUp = () => {
      setCropModal(prev => ({ ...prev, isDragging: false, isResizing: false }));
    };

    if (cropModal.show) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [cropModal.isDragging, cropModal.isResizing, cropModal.dragStart, cropModal.crop, cropModal.containerSize, cropModal.show]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/landing-page/settings');
      console.log('📥 Full Response:', response.data);

      // Backend returns data directly, not nested in .data
      const apiData = response.data?.data || response.data;
      console.log('📦 API Data:', apiData);

      if (apiData && apiData.homePage) {
        // Use API data directly
        const merged = {
          homePage: { ...settings.homePage, ...(apiData.homePage || {}) },
          aboutPage: { ...settings.aboutPage, ...(apiData.aboutPage || {}) },
          productsPage: { ...settings.productsPage, ...(apiData.productsPage || {}) },
          featuresPage: { ...settings.featuresPage, ...(apiData.featuresPage || {}) },
          contactPage: { ...settings.contactPage, ...(apiData.contactPage || {}) }
        };
        console.log('✅ Merged settings:', merged);
        console.log('🖼️ Top Banner Image:', merged.homePage?.topBanner?.image);
        setSettings(merged);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      console.log('Using default settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('Saving settings:', settings);
      const response = await api.put('/landing-page/settings', settings);
      console.log('Save response:', response.data);
      alert('✅ Settings saved successfully!');
      // Refresh to confirm
      await fetchSettings();
    } catch (err) {
      console.error('Save error:', err);
      console.error('Error details:', err.response?.data);
      alert(`❌ Failed to save: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (page, section, field, acceptType = 'image/*') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptType;

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const maxSize = acceptType.includes('video') ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      // If image, show crop modal
      if (file.type.startsWith('image/')) {
        console.log('📸 Image selected, loading...');
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('📸 Image data loaded');
          const img = new Image();
          img.onload = () => {
            console.log('📸 Image dimensions:', img.width, 'x', img.height);
            console.log('📸 Opening crop modal...');
            setCropModal({
              show: true,
              imageSrc: e.target.result,
              crop: { x: 10, y: 10, width: 600, height: 337 },
              imageSize: { width: img.width, height: img.height },
              containerSize: { width: 800, height: 500 },
              isDragging: false,
              isResizing: false,
              dragStart: { x: 0, y: 0 },
              onSave: async (croppedFile) => {
                try {
                  const formData = new FormData();
                  formData.append('file', croppedFile);

                  const response = await api.post('/landing-page/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });

                  const fileUrl = response.data?.data?.url || response.data?.url;

                  setSettings(prev => ({
                    ...prev,
                    [page]: {
                      ...prev[page],
                      [section]: {
                        ...prev[page][section],
                        [field]: fileUrl
                      }
                    }
                  }));

                  alert('✅ Image uploaded!');
                } catch (err) {
                  console.error('Upload failed:', err);
                  alert('❌ Upload failed');
                }
              }
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        // Video - upload directly
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await api.post('/landing-page/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const fileUrl = response.data?.data?.url || response.data?.url;

          setSettings(prev => ({
            ...prev,
            [page]: {
              ...prev[page],
              [section]: {
                ...prev[page][section],
                [field]: fileUrl
              }
            }
          }));

          alert('✅ Video uploaded!');
        } catch (err) {
          console.error('Upload failed:', err);
          alert('❌ Upload failed');
        }
      }
    };

    input.click();
  };

  // Handle carousel images/videos (multiple) - ONE AT A TIME for cropping
  const handleCarouselImageUpload = async (page, section) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/mp4,video/webm';
    input.multiple = false; // One at a time for crop

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File too large (max ${maxSize / (1024 * 1024)}MB)`);
        return;
      }

      // If image, show crop modal with 16:9 lock
      if (file.type.startsWith('image/')) {
        console.log('📸 Image selected, loading...');
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('📸 Image data loaded');
          const img = new Image();
          img.onload = () => {
            console.log('📸 Image dimensions:', img.width, 'x', img.height);
            console.log('📸 Opening crop modal with 16:9 aspect ratio lock...');

            // Calculate 16:9 crop box - 80% of image width
            const cropWidth = Math.min(img.width * 0.8, 800);
            const cropHeight = cropWidth / (16/9); // Force 16:9
            const cropX = (img.width - cropWidth) / 2;
            const cropY = Math.max(0, (img.height - cropHeight) / 2);

            setCropModal({
              show: true,
              imageSrc: e.target.result,
              crop: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
              imageSize: { width: img.width, height: img.height },
              containerSize: { width: 800, height: 500 },
              isDragging: false,
              isResizing: false,
              dragStart: { x: 0, y: 0 },
              aspectRatio: 16/9, // Lock aspect ratio for stats banner
              onSave: async (croppedFile) => {
                try {
                  const formData = new FormData();
                  formData.append('file', croppedFile);

                  const response = await api.post('/landing-page/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });

                  const fileUrl = response.data?.data?.url || response.data?.url;

                  setSettings(prev => ({
                    ...prev,
                    [page]: {
                      ...prev[page],
                      [section]: {
                        ...prev[page][section],
                        images: [...(prev[page][section].images || []), fileUrl]
                      }
                    }
                  }));

                  alert('✅ Image uploaded!');
                } catch (err) {
                  console.error('Upload failed:', err);
                  alert('❌ Upload failed');
                }
              }
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        // Video - upload directly
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await api.post('/landing-page/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const fileUrl = response.data?.data?.url || response.data?.url;

          setSettings(prev => ({
            ...prev,
            [page]: {
              ...prev[page],
              [section]: {
                ...prev[page][section],
                images: [...(prev[page][section].images || []), fileUrl]
              }
            }
          }));

          alert('✅ Video uploaded!');
        } catch (err) {
          console.error('Upload failed:', err);
          alert('❌ Upload failed');
        }
      }
    };

    input.click();
  };

  // Remove carousel image
  const removeCarouselImage = (page, section, index) => {
    setSettings(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        [section]: {
          ...prev[page][section],
          images: prev[page][section].images.filter((_, i) => i !== index)
        }
      }
    }));
  };

  // Crop helper functions
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, crop, imageSize) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Get actual image display size
    const img = document.querySelector('img[alt="Crop"]');
    if (!img) return null;

    const displayWidth = img.width;
    const displayHeight = img.height;

    // Calculate scale from display to natural size
    const scaleX = image.naturalWidth / displayWidth;
    const scaleY = image.naturalHeight / displayHeight;

    // Calculate crop coordinates in natural image size
    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    // High quality output - use original resolution
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight
    );

    return new Promise((resolve) => {
      // Use JPEG with high quality - much smaller file size than PNG
      const format = 'image/jpeg';
      const quality = 0.95; // 95% quality - great balance
      canvas.toBlob((blob) => {
        resolve(blob);
      }, format, quality);
    });
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(cropModal.imageSrc, cropModal.crop, cropModal.imageSize);
      const croppedFile = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });

      console.log('📦 Cropped file size:', (croppedFile.size / (1024 * 1024)).toFixed(2), 'MB');
      console.log('📦 File details:', { name: croppedFile.name, type: croppedFile.type, size: croppedFile.size });

      if (cropModal.onSave) {
        await cropModal.onSave(croppedFile);
      }

      setCropModal({
        show: false,
        imageSrc: null,
        crop: { x: 50, y: 50, width: 400, height: 225 },
        imageSize: { width: 0, height: 0 },
        containerSize: { width: 800, height: 500 },
        isDragging: false,
        isResizing: false,
        dragStart: { x: 0, y: 0 },
        onSave: null
      });
    } catch (e) {
      console.error('Crop error:', e);
      alert('❌ Crop failed');
    }
  };

  const pages = [
    { id: 'home', label: '🏠 Home Page', sections: ['topBanner', 'statsSection', 'connectSection'] },
    { id: 'about', label: 'ℹ️ About Page', sections: ['banner', 'section1', 'section2'] },
    { id: 'products', label: '📦 Products Page', sections: ['banner', 'section1', 'section2'] },
    { id: 'features', label: '✨ Features Page', sections: ['banner', 'section1', 'section2'] },
    { id: 'contact', label: '📞 Contact Page', sections: ['banner', 'section1'] }
  ];

  const currentPage = pages.find(p => p.id === activePage);
  const pageKey = `${activePage}Page`;
  const pageData = settings[pageKey] || {};

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
    <SaasLayout title="Landing Page Customizer">
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        {/* Content Container */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
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
              🎨 Landing Pages Customizer
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              Customize images and content for each page
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              background: saving ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '16px',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
            }}
          >
            {saving ? 'Saving...' : '💾 Save All Changes'}
          </button>
        </div>
      </div>

      {/* Page Tabs */}
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
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => setActivePage(page.id)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: activePage === page.id ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#f3f4f6',
              color: activePage === page.id ? '#ffffff' : '#6b7280',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px', color: '#111827' }}>
          {currentPage?.label} Sections
        </h2>

        {currentPage?.sections.map((sectionKey, idx) => {
          const section = pageData[sectionKey] || {};
          const sectionName = sectionKey === 'topBanner' || sectionKey === 'banner'
            ? 'Top Banner'
            : sectionKey === 'statsSection'
            ? 'Stats Banner (Carousel)'
            : sectionKey === 'connectSection'
            ? 'We Connect (Video/Image)'
            : `Section ${sectionKey.replace('section', '')}`;

          // SPECIAL: Stats Section (Carousel)
          if (sectionKey === 'statsSection') {
            return (
              <div key={sectionKey} style={{
                marginBottom: '40px',
                padding: '24px',
                background: '#f0f9ff',
                borderRadius: '12px',
                border: '2px solid #3b82f6'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e40af', marginBottom: '8px' }}>
                    🎠 {sectionName}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: 500, background: '#dbeafe', padding: '12px 16px', borderRadius: '6px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '14px' }}>📍 LOCATION: Immediately after Hero Section</div>
                    <div style={{ marginBottom: '8px' }}>🎯 <strong>Full-width carousel banner</strong> (50vh height). Upload images OR videos.</div>
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(30,64,175,0.1)', borderRadius: '4px' }}>
                      <strong>How it works:</strong>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                        <li>Upload 2-5 images/videos (mixed supported)</li>
                        <li>Auto-rotate every few seconds</li>
                        <li>Dots at bottom for manual navigation</li>
                        <li>Perfect for: Product showcases, demos, promos, features</li>
                      </ul>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>
                      💡 <strong>Images:</strong> 1920x1080px (16:9), PNG for best quality, max 20MB | <strong>Videos:</strong> MP4/WebM, max 50MB
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#059669', background: '#d1fae5', padding: '6px 10px', borderRadius: '4px', fontWeight: 600 }}>
                      ✨ <strong>Quality Tips:</strong> Upload PNG format • Crop auto-converts to 16:9 • High-res output preserved
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                    Media Files ({section.images?.length || 0} uploaded)
                  </label>
                  <button
                    onClick={() => handleCarouselImageUpload(pageKey, sectionKey)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '2px dashed #3b82f6',
                      background: '#eff6ff',
                      color: '#3b82f6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginBottom: '16px'
                    }}
                  >
                    📤 Upload Images/Videos (Multiple)
                  </button>

                  {/* Show uploaded media */}
                  {section.images && section.images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginTop: '12px' }}>
                      {section.images.map((url, i) => {
                        const isVideo = url.match(/\.(mp4|webm)$/i);
                        return (
                          <div key={i} style={{ position: 'relative' }}>
                            {isVideo ? (
                              <video
                                src={`http://localhost:4000${url}`}
                                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                                muted
                              />
                            ) : (
                              <img
                                src={`http://localhost:4000${url}`}
                                alt={`Media ${i+1}`}
                                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                              />
                            )}
                            <button
                              onClick={() => removeCarouselImage(pageKey, sectionKey, i)}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 700
                              }}
                            >
                              ×
                            </button>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', textAlign: 'center' }}>
                              {isVideo ? '🎬' : '🖼️'} {i+1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Auto-rotate interval */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                    Auto-Rotate Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={(section.interval || 2000) / 1000}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      [pageKey]: {
                        ...prev[pageKey],
                        [sectionKey]: {
                          ...prev[pageKey][sectionKey],
                          interval: parseFloat(e.target.value) * 1000
                        }
                      }
                    }))}
                    min="1"
                    max="10"
                    step="0.5"
                    style={{
                      width: '120px',
                      padding: '8px 12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            );
          }

          // SPECIAL: Connect Section (Video/Image)
          if (sectionKey === 'connectSection') {
            return (
              <div key={sectionKey} style={{
                marginBottom: '40px',
                padding: '24px',
                background: '#f0fdf4',
                borderRadius: '12px',
                border: '2px solid #22c55e'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#15803d', marginBottom: '8px' }}>
                    🎬 {sectionName}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#166534', fontWeight: 500, background: '#dcfce7', padding: '12px 16px', borderRadius: '6px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>📍 Location: "We Connect" section</div>
                    <div>🎯 Two-column layout with video/image on the right. Perfect for product demos, explainer videos, or feature highlights.</div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#15803d' }}>
                      💡 <strong>Video:</strong> MP4/WebM, max 50MB | <strong>Image:</strong> JPG/PNG, max 10MB
                    </div>
                  </div>
                </div>

                {/* Type selector */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                    Media Type
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['video', 'image'].map(type => (
                      <button
                        key={type}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          [pageKey]: {
                            ...prev[pageKey],
                            [sectionKey]: { ...prev[pageKey][sectionKey], type }
                          }
                        }))}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: section.type === type ? '2px solid #22c55e' : '2px solid #e5e7eb',
                          background: section.type === type ? '#dcfce7' : '#fff',
                          color: section.type === type ? '#15803d' : '#6b7280',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {type === 'video' ? '🎬 Video' : '🖼️ Image'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                    {section.type === 'video' ? 'Video File' : 'Image File'}
                  </label>
                  <button
                    onClick={() => handleImageUpload(
                      pageKey,
                      sectionKey,
                      'url',
                      section.type === 'video' ? 'video/mp4,video/webm' : 'image/*'
                    )}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '2px dashed #22c55e',
                      background: '#f0fdf4',
                      color: '#22c55e',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📤 Upload {section.type === 'video' ? 'Video' : 'Image'}
                  </button>
                  {section.url && (
                    <div style={{ marginTop: '12px' }}>
                      {section.type === 'image' ? (
                        <img
                          src={`http://localhost:4000${section.url}`}
                          alt="Connect section"
                          style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        />
                      ) : (
                        <video
                          src={`http://localhost:4000${section.url}`}
                          controls
                          style={{ maxWidth: '300px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Heading */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                    Heading (Optional - override default)
                  </label>
                  <input
                    type="text"
                    value={section.heading || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      [pageKey]: {
                        ...prev[pageKey],
                        [sectionKey]: {
                          ...prev[pageKey][sectionKey],
                          heading: e.target.value
                        }
                      }
                    }))}
                    placeholder="We connect."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Content */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                    Content (Optional - override default)
                  </label>
                  <textarea
                    value={section.content || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      [pageKey]: {
                        ...prev[pageKey],
                        [sectionKey]: {
                          ...prev[pageKey][sectionKey],
                          content: e.target.value
                        }
                      }
                    }))}
                    placeholder="Sales, support, finance, and operations..."
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
              </div>
            );
          }

          // DEFAULT: Regular sections
          return (
            <div key={sectionKey} style={{
              marginBottom: '40px',
              padding: '24px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px solid #e5e7eb'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  📍 {sectionName}
                </h3>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, background: '#f3f4f6', padding: '12px 16px', borderRadius: '6px', marginBottom: '12px' }}>
                  {sectionKey === 'topBanner' || sectionKey === 'banner' ? (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: '6px', color: '#374151' }}>📍 Location: Top of page (Hero)</div>
                      <div>🎯 Full-screen hero section with background image. Image covers entire viewport (85vh height). Text overlays on top-left.</div>
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#4b5563' }}>
                        💡 Recommended: 1920x1080px landscape image
                      </div>
                    </>
                  ) : sectionKey === 'section1' ? (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: '6px', color: '#374151' }}>📍 Location: After carousel banner</div>
                      <div>📄 Two-column: Image left, text right</div>
                    </>
                  ) : sectionKey === 'section2' ? (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: '6px', color: '#374151' }}>📍 Location: After section 1</div>
                      <div>📄 Two-column: Text left, image right (reversed)</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: '6px', color: '#374151' }}>📍 Location: After section 2</div>
                      <div>📄 Two-column: Image left, text right</div>
                    </>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                  Image
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleImageUpload(pageKey, sectionKey, 'image')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '2px dashed #3b82f6',
                      background: '#eff6ff',
                      color: '#3b82f6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📤 Upload Image
                  </button>
                  {section.image && (
                    <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>
                      ✓ Image uploaded
                    </span>
                  )}
                </div>
                {section.image && (
                  <div style={{ marginTop: '12px' }}>
                    <img
                      src={`http://localhost:4000${section.image}`}
                      alt={sectionName}
                      style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      onError={(e) => {
                        console.error('Failed to load image:', section.image);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Heading */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                  Heading
                </label>
                <input
                  type="text"
                  value={section.heading || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    [pageKey]: {
                      ...prev[pageKey],
                      [sectionKey]: {
                        ...prev[pageKey][sectionKey],
                        heading: e.target.value
                      }
                    }
                  }))}
                  placeholder="Enter heading"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Content/Subheading */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                  {sectionKey === 'topBanner' || sectionKey === 'banner' ? 'Subheading' : 'Content'}
                </label>
                <textarea
                  value={section.content || section.subheading || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    [pageKey]: {
                      ...prev[pageKey],
                      [sectionKey]: {
                        ...prev[pageKey][sectionKey],
                        [sectionKey === 'topBanner' || sectionKey === 'banner' ? 'subheading' : 'content']: e.target.value
                      }
                    }
                  }))}
                  placeholder={sectionKey === 'topBanner' || sectionKey === 'banner' ? 'Enter subheading' : 'Enter content'}
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
            </div>
          );
        })}
      </div>

      {/* Crop Modal - Mobile Style */}
      {cropModal.show && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Top Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            background: '#000',
            color: '#fff',
            gap: '12px'
          }}>
            <button
              onClick={() => setCropModal({
                show: false,
                imageSrc: null,
                crop: { x: 50, y: 50, width: 400, height: 225 },
                imageSize: { width: 0, height: 0 },
                containerSize: { width: 800, height: 500 },
                isDragging: false,
                isResizing: false,
                dragStart: { x: 0, y: 0 },
                onSave: null
              })}
              style={{
                fontSize: '16px',
                color: '#fff',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Cancel
            </button>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Crop Image</h3>
              {cropModal.aspectRatio && (
                <span style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  background: '#f59e0b',
                  color: '#fff',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  🔒 16:9 Ratio Locked
                </span>
              )}
              <button
                onClick={() => {
                  const img = document.getElementById('crop-image');
                  if (img) {
                    setCropModal(prev => {
                      // If aspect ratio is locked, fit full width but maintain ratio
                      if (prev.aspectRatio) {
                        const cropWidth = img.width;
                        const cropHeight = cropWidth / prev.aspectRatio;
                        const cropY = Math.max(0, (img.height - cropHeight) / 2);

                        return {
                          ...prev,
                          crop: {
                            x: 0,
                            y: cropY,
                            width: cropWidth,
                            height: cropHeight
                          }
                        };
                      }

                      // No aspect ratio lock - use full image
                      return {
                        ...prev,
                        crop: {
                          x: 0,
                          y: 0,
                          width: img.width,
                          height: img.height
                        }
                      };
                    });
                  }
                }}
                style={{
                  fontSize: '12px',
                  color: '#1EB980',
                  background: 'rgba(30,185,128,0.15)',
                  border: '1px solid #1EB980',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '4px 8px'
                }}
              >
                Full Image
              </button>
            </div>

            <button
              onClick={handleCropSave}
              style={{
                fontSize: '16px',
                color: '#1EB980',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Save
            </button>
          </div>

          {/* Crop Area */}
          <div style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000'
          }}>
            {/* Image Container - positioned */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* Image */}
              <img
                id="crop-image"
                src={cropModal.imageSrc}
                alt="Crop"
                style={{
                  maxWidth: '100vw',
                  maxHeight: 'calc(100vh - 60px)',
                  display: 'block',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
                onLoad={(e) => {
                  const img = e.target;
                  console.log('🖼️ Image loaded - Rendered size:', img.width, 'x', img.height);
                  console.log('🖼️ Natural size:', img.naturalWidth, 'x', img.naturalHeight);

                  // Use RENDERED size (what user sees), not natural size
                  const displayWidth = img.width;
                  const displayHeight = img.height;

                  // Start with 80% of image size
                  const cropWidth = displayWidth * 0.8;
                  const cropHeight = cropWidth / (16/9);

                  // Center it
                  const cropX = (displayWidth - cropWidth) / 2;
                  const cropY = (displayHeight - cropHeight) / 2;

                  console.log('✂️ Initial crop:', { x: cropX, y: cropY, width: cropWidth, height: cropHeight });

                  setCropModal(prev => ({
                    ...prev,
                    imageSize: { width: displayWidth, height: displayHeight },
                    crop: {
                      x: cropX,
                      y: cropY,
                      width: cropWidth,
                      height: cropHeight
                    }
                  }));
                }}
              />

              {/* Dark overlay - outside crop box */}
              <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none'
              }}>
                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                  <defs>
                    <mask id="crop-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x={cropModal.crop.x}
                        y={cropModal.crop.y}
                        width={cropModal.crop.width}
                        height={cropModal.crop.height}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-mask)" />
                </svg>
              </div>

              {/* Crop Box */}
              {/* Crop Box */}
              <div
                style={{
                  position: 'absolute',
                  left: `${cropModal.crop.x}px`,
                  top: `${cropModal.crop.y}px`,
                  width: `${cropModal.crop.width}px`,
                  height: `${cropModal.crop.height}px`,
                  border: '3px solid #fff',
                  cursor: 'move',
                  pointerEvents: 'auto',
                  boxSizing: 'border-box'
                }}
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) {
                    e.preventDefault();
                    const img = document.getElementById('crop-image');
                    const imgRect = img.getBoundingClientRect();

                    // Store offset from mouse to crop box top-left
                    const offsetX = e.clientX - imgRect.left - cropModal.crop.x;
                    const offsetY = e.clientY - imgRect.top - cropModal.crop.y;

                    setCropModal(prev => ({
                      ...prev,
                      isDragging: true,
                      dragStart: { x: offsetX, y: offsetY }
                    }));
                  }
                }}
              >
              {/* Corner Handles */}
              {['nw', 'ne', 'sw', 'se'].map(corner => (
                <div
                  key={corner}
                  style={{
                    position: 'absolute',
                    width: '20px',
                    height: '20px',
                    background: '#fff',
                    border: '2px solid #1EB980',
                    borderRadius: '50%',
                    cursor: `${corner.includes('n') ? 'n' : 's'}${corner.includes('w') ? 'w' : 'e'}-resize`,
                    ...(corner.includes('n') ? { top: '-10px' } : { bottom: '-10px' }),
                    ...(corner.includes('w') ? { left: '-10px' } : { right: '-10px' })
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setCropModal(prev => ({
                      ...prev,
                      isResizing: corner,
                      dragStart: { x: e.clientX, y: e.clientY }
                    }));
                  }}
                />
              ))}
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </SaasLayout>
  );
};

export default PageCustomizer;
