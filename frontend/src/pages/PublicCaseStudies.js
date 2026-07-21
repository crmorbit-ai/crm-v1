import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const PublicCaseStudies = () => {
  const navigate = useNavigate();
  const [caseStudies, setCaseStudies] = useState([]);
  const [filteredStudies, setFilteredStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'All', label: 'All Stories', icon: '🌟' },
    { id: 'Sales', label: 'Sales', icon: '💼' },
    { id: 'Marketing', label: 'Marketing', icon: '📣' },
    { id: 'Support', label: 'Support', icon: '🛟' },
    { id: 'Operations', label: 'Operations', icon: '⚙️' },
    { id: 'Technology', label: 'Technology', icon: '💻' },
    { id: 'Other', label: 'Other', icon: '📊' }
  ];

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  useEffect(() => {
    filterCaseStudies();
  }, [selectedCategory, selectedIndustry, searchQuery, caseStudies]);

  const fetchCaseStudies = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/case-studies/public?limit=50`);
      setCaseStudies(res.data.data || []);
    } catch (err) {
      console.error('Error fetching case studies:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterCaseStudies = () => {
    let filtered = caseStudies;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(cs => cs.category === selectedCategory);
    }

    if (selectedIndustry !== 'All') {
      filtered = filtered.filter(cs => cs.industry === selectedIndustry);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cs =>
        cs.title?.toLowerCase().includes(query) ||
        cs.clientName?.toLowerCase().includes(query) ||
        cs.industry?.toLowerCase().includes(query) ||
        cs.shortDescription?.toLowerCase().includes(query)
      );
    }

    setFilteredStudies(filtered);
  };

  const industries = ['All', ...new Set(caseStudies.map(cs => cs.industry).filter(Boolean))];

  return (
    <>
      <SharedHeader />

      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #0a1929 0%, #0f1e2e 100%)', paddingTop: '80px' }}>
        {/* Premium Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8a 50%, #1e3a5f 100%)',
          padding: '80px 40px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated background gradient orbs */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(30,185,128,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'float 20s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-5%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(45,90,138,0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'float 15s ease-in-out infinite reverse'
          }} />

          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center' }}>
              {/* Subtitle badge */}
              <div style={{
                display: 'inline-block',
                background: 'rgba(30,185,128,0.15)',
                border: '1px solid rgba(30,185,128,0.3)',
                borderRadius: '100px',
                padding: '8px 20px',
                marginBottom: '24px'
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#1EB980',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px'
                }}>
                  ⭐ Success Stories
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(42px, 6vw, 68px)',
                fontWeight: '900',
                color: '#fff',
                marginBottom: '24px',
                letterSpacing: '-1.5px',
                lineHeight: 1.1
              }}>
                Customer Success Stories
              </h1>
              <p style={{
                fontSize: '21px',
                color: 'rgba(255,255,255,0.8)',
                maxWidth: '750px',
                margin: '0 auto 40px',
                lineHeight: 1.6,
                fontWeight: '400'
              }}>
                Discover how businesses across industries achieve remarkable results with our platform
              </p>

              {/* Search Bar */}
              <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                position: 'relative'
              }}>
                <input
                  type="text"
                  placeholder="🔍 Search case studies by company, industry, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '18px 24px 18px 52px',
                    fontSize: '16px',
                    fontWeight: '500',
                    border: '2px solid rgba(255,255,255,0.15)',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    color: '#fff',
                    outline: 'none',
                    transition: 'all 0.3s',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(30,185,128,0.5)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.boxShadow = '0 12px 48px rgba(30,185,128,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '20px',
                  opacity: 0.6
                }}>
                  🔍
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) translateX(0px); }
              50% { transform: translateY(-30px) translateX(20px); }
            }
          `}</style>
        </div>

        {/* Filters Section */}
        <div style={{
          background: 'rgba(15,30,46,0.6)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '40px 40px 50px'
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Category Filters */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: '16px'
              }}>
                Filter by Category
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      background: selectedCategory === cat.id
                        ? 'linear-gradient(135deg, #1EB980 0%, #17a46f 100%)'
                        : 'rgba(255,255,255,0.06)',
                      color: selectedCategory === cat.id ? '#fff' : 'rgba(255,255,255,0.75)',
                      border: selectedCategory === cat.id
                        ? '2px solid rgba(30,185,128,0.5)'
                        : '2px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '14px 24px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: selectedCategory === cat.id
                        ? '0 8px 24px rgba(30,185,128,0.25), 0 0 0 1px rgba(30,185,128,0.1)'
                        : '0 4px 12px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transform: selectedCategory === cat.id ? 'translateY(-2px)' : 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== cat.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== cat.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                    {cat.label}
                    {cat.id === 'All' && ` (${caseStudies.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Industry Filter + Results Count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              {/* Industry Filter */}
              {industries.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px'
                  }}>
                    Industry:
                  </div>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '2px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                      padding: '12px 40px 12px 18px',
                      color: '#fff',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      outline: 'none',
                      minWidth: '200px',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1L6 6L11 1\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 16px center',
                      transition: 'all 0.3s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(30,185,128,0.5)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    {industries.map(ind => (
                      <option key={ind} value={ind} style={{ background: '#1e3a5f', color: '#fff' }}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Results Count */}
              <div style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: '600',
                background: 'rgba(255,255,255,0.05)',
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{ color: '#1EB980', fontWeight: '800', fontSize: '18px' }}>
                  {filteredStudies.length}
                </span> {filteredStudies.length === 1 ? 'case study' : 'case studies'} found
              </div>
            </div>
          </div>
        </div>

        {/* Case Studies Grid */}
        <div style={{
          padding: '70px 40px 100px',
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '120px 0' }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(30,185,128,0.2)',
                borderTop: '4px solid #1EB980',
                borderRadius: '50%',
                margin: '0 auto 24px',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>
                Loading success stories...
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredStudies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '120px 40px' }}>
              <div style={{ fontSize: '72px', marginBottom: '24px' }}>🔍</div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>
                No case studies found
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', marginBottom: '32px' }}>
                Try adjusting your filters or search query
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedIndustry('All');
                  setSearchQuery('');
                }}
                style={{
                  background: 'linear-gradient(135deg, #1EB980 0%, #17a46f 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(30,185,128,0.3)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,185,128,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,185,128,0.3)';
                }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '28px'
            }}>
              {filteredStudies.map((cs) => (
                <div
                  key={cs._id}
                  onClick={() => navigate(`/case-study/${cs.slug}`)}
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-12px)';
                    e.currentTarget.style.borderColor = 'rgba(30,185,128,0.4)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(30,185,128,0.25), 0 0 0 1px rgba(30,185,128,0.2)';
                    e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
                    e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)';
                  }}
                >
                  {/* Featured Image */}
                  {cs.featuredImage?.url ? (
                    <div style={{
                      height: '180px',
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8a 100%)'
                    }}>
                      <img
                        src={cs.featuredImage.url}
                        alt={cs.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, transparent 30%, rgba(15,30,46,0.95) 100%)'
                      }} />
                      {/* Category Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(30,185,128,0.95)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        boxShadow: '0 6px 20px rgba(30,185,128,0.4)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        {cs.category}
                      </div>
                      {/* Client Logo */}
                      {cs.clientLogo?.url && (
                        <div style={{
                          position: 'absolute',
                          bottom: '16px',
                          left: '16px',
                          background: 'rgba(255,255,255,0.98)',
                          padding: '10px 20px',
                          borderRadius: '12px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                          border: '1px solid rgba(0,0,0,0.05)'
                        }}>
                          <img
                            src={cs.clientLogo.url}
                            alt={cs.clientName}
                            style={{
                              height: '32px',
                              maxWidth: '120px',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      height: '180px',
                      background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        fontSize: '64px',
                        opacity: 0.3
                      }}>
                        📊
                      </div>
                      {/* Category Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(30,185,128,0.95)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        boxShadow: '0 6px 20px rgba(30,185,128,0.4)'
                      }}>
                        {cs.category}
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '24px' }}>
                    <h3 style={{
                      fontSize: '21px',
                      fontWeight: '800',
                      color: '#fff',
                      marginBottom: '12px',
                      lineHeight: 1.3,
                      letterSpacing: '-0.3px'
                    }}>
                      {cs.title}
                    </h3>

                    <p style={{
                      color: 'rgba(255,255,255,0.65)',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      marginBottom: '20px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      fontWeight: '400'
                    }}>
                      {cs.shortDescription}
                    </p>

                    {/* Results Metrics */}
                    {cs.results && cs.results.length > 0 && cs.results.some(r => r.value) && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: cs.results.filter(r => r.value).length > 1 ? '1fr 1fr' : '1fr',
                        gap: '12px',
                        padding: '18px 0',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        marginBottom: '18px'
                      }}>
                        {cs.results.filter(r => r.value).slice(0, 2).map((result, i) => (
                          <div key={i} style={{
                            background: 'rgba(30,185,128,0.08)',
                            borderRadius: '10px',
                            padding: '14px',
                            border: '1px solid rgba(30,185,128,0.15)'
                          }}>
                            <div style={{
                              fontSize: '28px',
                              fontWeight: '900',
                              color: '#1EB980',
                              lineHeight: 1,
                              marginBottom: '8px',
                              letterSpacing: '-0.5px'
                            }}>
                              {result.value}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: 'rgba(255,255,255,0.7)',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.7px'
                            }}>
                              {result.metric}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.5)',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ fontSize: '16px' }}>🏢</span>
                        {cs.industry}
                      </div>
                      <div style={{
                        fontSize: '15px',
                        color: '#1EB980',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        Read Story
                        <span style={{ fontSize: '18px' }}>→</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SharedFooter />
    </>
  );
};

export default PublicCaseStudies;
