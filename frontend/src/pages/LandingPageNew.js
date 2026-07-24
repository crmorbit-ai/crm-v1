import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPageSimple = () => {
  const navigate = useNavigate();
  const [pageContent, setPageContent] = useState({
    homePage: {
      topBanner: { image: '', heading: '', subheading: '' },
      section1: { image: '', heading: '', content: '' },
      section2: { image: '', heading: '', content: '' },
      section3: { image: '', heading: '', content: '' }
    }
  });

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/landing-page/public-settings');
        if (response.ok) {
          const data = await response.json();
          const apiData = data.data || data;
          if (apiData && apiData.homePage) {
            console.log('✅ Content loaded:', apiData);
            setPageContent(prev => ({ ...prev, ...apiData }));
          }
        }
      } catch (err) {
        console.log('Using defaults');
      }
    };
    loadContent();
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0f1e2e', color: '#fff' }}>

      {/* ═══ 1. TOP BANNER (Full-width Hero) ═══ */}
      <section style={{
        position: 'relative',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: pageContent.homePage?.topBanner?.image
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(http://localhost:4000${pageContent.homePage.topBanner.image})`
          : 'linear-gradient(135deg, #0f1e2e 0%, #1a3a52 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '100px 20px'
      }}>
        <div style={{ maxWidth: '800px', textAlign: 'center', zIndex: 1 }}>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 900,
            marginBottom: '24px',
            lineHeight: 1.1,
            letterSpacing: '-1px'
          }}>
            {pageContent.homePage?.topBanner?.heading || 'The CRM Platform Your Business Deserves'}
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '40px',
            lineHeight: 1.6
          }}>
            {pageContent.homePage?.topBanner?.subheading || 'All-in-one CRM with 25+ modules, AI assistant, and enterprise-grade features.'}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
              background: '#1EB980',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(30,185,128,0.4)'
            }}>
              Start Free Trial →
            </button>
            <button onClick={() => navigate('/login')} style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ═══ 2. SECTION 1 (Background Image with Overlay) ═══ */}
      <section style={{
        position: 'relative',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        backgroundImage: pageContent.homePage?.section1?.image
          ? `linear-gradient(rgba(15,30,46,0.85), rgba(15,30,46,0.85)), url(http://localhost:4000${pageContent.homePage.section1.image})`
          : 'none',
        backgroundColor: pageContent.homePage?.section1?.image ? 'transparent' : '#162e48',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '80px 20px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          {pageContent.homePage?.section1?.heading && (
            <h2 style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 800,
              marginBottom: '24px',
              letterSpacing: '-1px'
            }}>
              {pageContent.homePage.section1.heading}
            </h2>
          )}
          {pageContent.homePage?.section1?.content && (
            <p style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.7,
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              {pageContent.homePage.section1.content}
            </p>
          )}
          {!pageContent.homePage?.section1?.heading && !pageContent.homePage?.section1?.content && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              📸 Section 1 - Add image and content from customizer
            </div>
          )}
        </div>
      </section>

      {/* ═══ 3. SECTION 2 (Image Left, Text Right) ═══ */}
      <section style={{
        background: '#0f1e2e',
        padding: '80px 20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '60px',
          alignItems: 'center'
        }}>
          {/* Image */}
          <div>
            {pageContent.homePage?.section2?.image ? (
              <img
                src={`http://localhost:4000${pageContent.homePage.section2.image}`}
                alt={pageContent.homePage.section2.heading || 'Section 2'}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '500px',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '400px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '14px'
              }}>
                📸 Add image from customizer
              </div>
            )}
          </div>

          {/* Text */}
          <div>
            {pageContent.homePage?.section2?.heading && (
              <h2 style={{
                fontSize: 'clamp(28px, 4vw, 48px)',
                fontWeight: 800,
                marginBottom: '20px',
                letterSpacing: '-1px'
              }}>
                {pageContent.homePage.section2.heading}
              </h2>
            )}
            {pageContent.homePage?.section2?.content && (
              <p style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.7
              }}>
                {pageContent.homePage.section2.content}
              </p>
            )}
            {!pageContent.homePage?.section2?.heading && !pageContent.homePage?.section2?.content && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                📝 Section 2 - Add heading and content from customizer
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ 4. SECTION 3 (Text Left, Image Right) ═══ */}
      <section style={{
        background: '#162e48',
        padding: '80px 20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '60px',
          alignItems: 'center'
        }}>
          {/* Text (appears first on mobile, left on desktop) */}
          <div style={{ order: window.innerWidth > 768 ? 1 : 2 }}>
            {pageContent.homePage?.section3?.heading && (
              <h2 style={{
                fontSize: 'clamp(28px, 4vw, 48px)',
                fontWeight: 800,
                marginBottom: '20px',
                letterSpacing: '-1px'
              }}>
                {pageContent.homePage.section3.heading}
              </h2>
            )}
            {pageContent.homePage?.section3?.content && (
              <p style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.7
              }}>
                {pageContent.homePage.section3.content}
              </p>
            )}
            {!pageContent.homePage?.section3?.heading && !pageContent.homePage?.section3?.content && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                📝 Section 3 - Add heading and content from customizer
              </div>
            )}
          </div>

          {/* Image (appears second on mobile, right on desktop) */}
          <div style={{ order: window.innerWidth > 768 ? 2 : 1 }}>
            {pageContent.homePage?.section3?.image ? (
              <img
                src={`http://localhost:4000${pageContent.homePage.section3.image}`}
                alt={pageContent.homePage.section3.heading || 'Section 3'}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '500px',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '400px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '14px'
              }}>
                📸 Add image from customizer
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        background: '#0a1420',
        padding: '40px 20px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          © 2026 Unified CRM. All rights reserved.
        </p>
      </footer>

    </div>
  );
};

export default LandingPageSimple;
