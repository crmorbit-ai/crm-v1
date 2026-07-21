import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const CaseStudyDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseStudy();
  }, [slug]);

  const fetchCaseStudy = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/case-studies/public/${slug}`);
      setCaseStudy(res.data.data);
    } catch (err) {
      console.error('Error fetching case study:', err);
      alert('Case study not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1e2e' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'spin 2s linear infinite' }}>⏳</div>
          <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>Loading case study...</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!caseStudy) return null;

  return (
    <>
      <SharedHeader />

      <div style={{ background: '#0f1e2e', minHeight: '100vh', paddingTop: '80px' }}>
        {/* Hero Section */}
        <div style={{
          background: caseStudy.featuredImage?.url
            ? `linear-gradient(rgba(15,30,46,0.85), rgba(15,30,46,0.95)), url(${caseStudy.featuredImage.url}) center/cover`
            : 'linear-gradient(135deg, #1e3a5f 0%, #0f1e2e 100%)',
          padding: '60px 40px 80px',
          position: 'relative'
        }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Category & Client Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <span style={{
              background: 'rgba(30,185,128,0.2)',
              backdropFilter: 'blur(10px)',
              color: '#1EB980',
              fontSize: '12px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(30,185,128,0.3)'
            }}>
              {caseStudy.category}
            </span>
            {caseStudy.clientLogo?.url && (
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                padding: '8px 20px',
                borderRadius: '8px'
              }}>
                <img src={caseStudy.clientLogo.url} alt={caseStudy.clientName} style={{ height: 32, objectFit: 'contain' }} />
              </div>
            )}
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: '900',
            color: '#fff',
            marginBottom: '20px',
            lineHeight: 1.2,
            letterSpacing: '-0.5px'
          }}>
            {caseStudy.title}
          </h1>

          <p style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.6,
            maxWidth: '800px',
            marginBottom: '32px'
          }}>
            {caseStudy.shortDescription}
          </p>

          {/* Client Info */}
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Client</div>
              <div style={{ fontSize: '18px', color: '#fff', fontWeight: '700' }}>{caseStudy.clientName}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Industry</div>
              <div style={{ fontSize: '18px', color: '#fff', fontWeight: '700' }}>{caseStudy.industry}</div>
            </div>
            {caseStudy.companySize && (
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Company Size</div>
                <div style={{ fontSize: '18px', color: '#fff', fontWeight: '700' }}>{caseStudy.companySize} employees</div>
              </div>
            )}
            {caseStudy.location?.country && (
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Location</div>
                <div style={{ fontSize: '18px', color: '#fff', fontWeight: '700' }}>{caseStudy.location.city}, {caseStudy.location.country}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Results Section */}
      {caseStudy.results && caseStudy.results.length > 0 && (
        <div style={{ background: '#162e48', padding: '60px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '40px', textAlign: 'center' }}>
              📊 Key Results
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              {caseStudy.results.map((result, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '28px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '40px', fontWeight: '900', color: '#1EB980', lineHeight: 1, marginBottom: '12px' }}>
                    {result.value}
                  </div>
                  <div style={{ fontSize: '14px', color: '#fff', fontWeight: '700', marginBottom: '8px' }}>
                    {result.metric}
                  </div>
                  {result.description && (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                      {result.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div style={{ background: '#0f1e2e', padding: '80px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Executive Summary */}
          {caseStudy.executiveSummary && (
            <div style={{
              background: 'rgba(30,185,128,0.08)',
              border: '2px solid rgba(30,185,128,0.2)',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '60px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1EB980', marginBottom: '16px' }}>
                📝 Executive Summary
              </h3>
              <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, margin: 0 }}>
                {caseStudy.executiveSummary}
              </p>
            </div>
          )}

          {/* Challenge */}
          {caseStudy.challenge && (
            <div style={{ marginBottom: '60px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>
                🎯 The Challenge
              </h3>
              <div
                style={{ fontSize: '17px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: caseStudy.challenge }}
              />
            </div>
          )}

          {/* Solution */}
          {caseStudy.solution && (
            <div style={{ marginBottom: '60px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>
                💡 The Solution
              </h3>
              <div
                style={{ fontSize: '17px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: caseStudy.solution }}
              />
            </div>
          )}

          {/* Full Content */}
          {caseStudy.content && (
            <div style={{ marginBottom: '60px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>
                📖 Full Story
              </h3>
              <div
                style={{ fontSize: '17px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: caseStudy.content }}
              />
            </div>
          )}

          {/* Testimonial */}
          {caseStudy.testimonial?.quote && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(30,185,128,0.1) 0%, rgba(30,185,128,0.05) 100%)',
              border: '2px solid rgba(30,185,128,0.2)',
              borderRadius: '20px',
              padding: '40px',
              marginTop: '60px',
              position: 'relative'
            }}>
              <div style={{ fontSize: '48px', color: 'rgba(30,185,128,0.3)', lineHeight: 1, marginBottom: '20px' }}>"</div>
              <p style={{ fontSize: '20px', color: '#fff', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '24px' }}>
                {caseStudy.testimonial.quote}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1EB980 0%, #17a46f 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: '800'
                }}>
                  {caseStudy.testimonial.author?.charAt(0) || 'T'}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                    {caseStudy.testimonial.author}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                    {caseStudy.testimonial.authorTitle} at {caseStudy.clientName}
                  </div>
                </div>
                {caseStudy.testimonial.rating && (
                  <div style={{ marginLeft: 'auto', fontSize: '18px' }}>
                    {'⭐'.repeat(caseStudy.testimonial.rating)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ background: 'linear-gradient(135deg, #1EB980 0%, #17a46f 100%)', padding: '80px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#fff', marginBottom: '20px' }}>
            Ready to achieve similar results?
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px', lineHeight: 1.7 }}>
            Join hundreds of businesses transforming their operations with our platform
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                background: '#fff',
                color: '#1EB980',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 40px',
                fontSize: '16px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
              }}
            >
              Get Started Free →
            </button>
            <button
              onClick={() => navigate('/case-studies')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                padding: '16px 40px',
                fontSize: '16px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              View More Cases
            </button>
          </div>
        </div>
      </div>

      <SharedFooter />
      </div>

      {/* Rich Text Content Styles */}
      <style>{`
        .rich-text-content h1,
        .rich-text-content h2,
        .rich-text-content h3 {
          color: #fff;
          font-weight: 800;
          margin: 24px 0 16px;
        }

        .rich-text-content h1 { font-size: 32px; }
        .rich-text-content h2 { font-size: 28px; }
        .rich-text-content h3 { font-size: 24px; }

        .rich-text-content p {
          margin: 16px 0;
          line-height: 1.8;
        }

        .rich-text-content strong {
          font-weight: 800;
          color: #fff;
        }

        .rich-text-content em {
          font-style: italic;
        }

        .rich-text-content ul,
        .rich-text-content ol {
          margin: 16px 0;
          padding-left: 24px;
        }

        .rich-text-content li {
          margin: 8px 0;
          line-height: 1.7;
        }

        .rich-text-content a {
          color: #1EB980;
          text-decoration: underline;
        }

        .rich-text-content a:hover {
          color: #17a46f;
        }

        .rich-text-content blockquote {
          border-left: 4px solid #1EB980;
          padding-left: 20px;
          margin: 24px 0;
          font-style: italic;
          color: rgba(255,255,255,0.8);
        }

        .rich-text-content code {
          background: rgba(255,255,255,0.1);
          padding: 2px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
        }

        .rich-text-content pre {
          background: rgba(255,255,255,0.05);
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
        }
      `}</style>
    </>
  );
};

export default CaseStudyDetail;
