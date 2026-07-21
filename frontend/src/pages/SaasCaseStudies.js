import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SaasLayout from '../components/layout/SaasLayout';
import CaseStudyFormModal from '../components/CaseStudyFormModal';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const SaasCaseStudies = () => {
  const navigate = useNavigate();
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', category: 'all', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchCaseStudies();
  }, [filter]);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        ...(filter.status !== 'all' && { status: filter.status }),
        ...(filter.category !== 'all' && { category: filter.category }),
        ...(filter.search && { search: filter.search })
      };

      const res = await axios.get(`${API_URL}/api/case-studies`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setCaseStudies(res.data.data || []);
    } catch (err) {
      console.error('Error fetching case studies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEdit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();

      Object.keys(formData).forEach(key => {
        if (key === 'featuredImage' || key === 'clientLogo' || key === 'pdfDocument' || key === 'stakeholderPhoto') {
          if (formData[key] instanceof File) {
            data.append(key, formData[key]);
          }
        } else if (typeof formData[key] === 'object' && formData[key] !== null) {
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      });

      if (selectedCase) {
        await axios.put(`${API_URL}/api/case-studies/${selectedCase._id}`, data, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API_URL}/api/case-studies`, data, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }

      fetchCaseStudies();
      setShowModal(false);
      setSelectedCase(null);
    } catch (err) {
      console.error('Error saving case study:', err);
      alert('Error: ' + (err.response?.data?.message || 'Failed to save'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this case study?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/case-studies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCaseStudies();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete');
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/case-studies/${id}/toggle-publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCaseStudies();
    } catch (err) {
      console.error('Error toggling publish:', err);
    }
  };

  const stats = {
    total: caseStudies.length,
    published: caseStudies.filter(c => c.status === 'published').length,
    draft: caseStudies.filter(c => c.status === 'draft').length,
    scheduled: caseStudies.filter(c => c.status === 'scheduled').length,
    views: caseStudies.reduce((sum, c) => sum + (c.views || 0), 0)
  };

  const filteredCases = caseStudies.filter(cs => {
    if (filter.status !== 'all' && cs.status !== filter.status) return false;
    if (filter.category !== 'all' && cs.category !== filter.category) return false;
    if (filter.search) {
      const query = filter.search.toLowerCase();
      return cs.title?.toLowerCase().includes(query) ||
             cs.clientName?.toLowerCase().includes(query) ||
             cs.industry?.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <SaasLayout>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)',
        padding: '32px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.5px'
                }}>
                  Case Studies
                </h1>
                <p style={{
                  fontSize: '15px',
                  color: '#64748b',
                  margin: '8px 0 0',
                  fontWeight: '500'
                }}>
                  Manage customer success stories and testimonials
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCase(null);
                  setShowModal(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(15,23,42,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.2)';
                }}
              >
                <span style={{ fontSize: '18px' }}>+</span>
                New Case Study
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {[
              {
                label: 'Total Cases',
                value: stats.total,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"></path>
                    <path d="M18 17V9"></path>
                    <path d="M13 17V5"></path>
                    <path d="M8 17v-3"></path>
                  </svg>
                ),
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                shadowColor: 'rgba(102,126,234,0.3)',
                lightBg: 'rgba(102,126,234,0.1)'
              },
              {
                label: 'Published',
                value: stats.published,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                ),
                gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                shadowColor: 'rgba(16,185,129,0.3)',
                lightBg: 'rgba(16,185,129,0.1)'
              },
              {
                label: 'Drafts',
                value: stats.draft,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                ),
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                shadowColor: 'rgba(245,158,11,0.3)',
                lightBg: 'rgba(245,158,11,0.1)'
              },
              {
                label: 'Scheduled',
                value: stats.scheduled,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                ),
                gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                shadowColor: 'rgba(139,92,246,0.3)',
                lightBg: 'rgba(139,92,246,0.1)'
              },
              {
                label: 'Total Views',
                value: stats.views,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ),
                gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                shadowColor: 'rgba(6,182,212,0.3)',
                lightBg: 'rgba(6,182,212,0.1)'
              }
            ].map((stat, i) => (
              <div key={i} style={{
                background: `linear-gradient(to bottom right, ${stat.lightBg} 0%, #fff 100%)`,
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 24px ${stat.shadowColor}`;
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)';
              }}
              >
                {/* Background decoration */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '100px',
                  height: '100px',
                  background: stat.gradient,
                  borderRadius: '50%',
                  opacity: 0.1,
                  filter: 'blur(40px)'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {stat.label}
                  </span>
                  <div style={{
                    background: stat.gradient,
                    borderRadius: '12px',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    boxShadow: `0 4px 12px ${stat.shadowColor}`
                  }}>
                    {stat.icon}
                  </div>
                </div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  background: stat.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-1px',
                  position: 'relative'
                }}>
                  {stat.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Filters & Search */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ flex: '1 1 300px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search by title, client, or industry..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0f172a';
                    e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                style={{
                  padding: '12px 40px 12px 16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#fff',
                  color: '#0f172a',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1L6 6L11 1\' stroke=\'%230f172a\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center'
                }}
              >
                <option value="all">All Status</option>
                <option value="published">✅ Published</option>
                <option value="draft">📝 Draft</option>
                <option value="scheduled">⏰ Scheduled</option>
              </select>

              {/* Category Filter */}
              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                style={{
                  padding: '12px 40px 12px 16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#fff',
                  color: '#0f172a',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1L6 6L11 1\' stroke=\'%230f172a\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center'
                }}
              >
                <option value="all">All Categories</option>
                <option value="Sales">💼 Sales</option>
                <option value="Marketing">📣 Marketing</option>
                <option value="Support">🛟 Support</option>
                <option value="Operations">⚙️ Operations</option>
                <option value="Technology">💻 Technology</option>
                <option value="Other">📊 Other</option>
              </select>

              {/* View Mode Toggle */}
              <div style={{
                display: 'flex',
                gap: '4px',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '8px',
                marginLeft: 'auto'
              }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: viewMode === 'grid' ? '#fff' : 'transparent',
                    color: viewMode === 'grid' ? '#0f172a' : '#64748b',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  ⊞ Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: viewMode === 'table' ? '#fff' : 'transparent',
                    color: viewMode === 'table' ? '#0f172a' : '#64748b',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  ☰ Table
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div style={{
              marginTop: '16px',
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '600'
            }}>
              {filteredCases.length} {filteredCases.length === 1 ? 'result' : 'results'}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #0f172a',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite'
              }} />
              <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600' }}>
                Loading case studies...
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredCases.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '80px 40px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>
                No case studies found
              </h3>
              <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
                {filter.search || filter.status !== 'all' || filter.category !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first case study to get started'}
              </p>
              {!filter.search && filter.status === 'all' && filter.category === 'all' && (
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  + Create First Case Study
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '20px'
            }}>
              {filteredCases.map((cs) => (
                <div
                  key={cs._id}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  {/* Image */}
                  {cs.featuredImage?.url ? (
                    <div style={{
                      height: '180px',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#f1f5f9'
                    }}>
                      <img
                        src={cs.featuredImage.url}
                        alt={cs.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {/* Status Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: cs.status === 'published'
                          ? 'rgba(5,150,105,0.95)'
                          : cs.status === 'scheduled'
                          ? 'rgba(79,70,229,0.95)'
                          : 'rgba(217,119,6,0.95)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {cs.status === 'published' ? '✅ Live' : cs.status === 'scheduled' ? '⏰ Scheduled' : '📝 Draft'}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      height: '180px',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <span style={{ fontSize: '48px', opacity: 0.3 }}>📊</span>
                      {/* Status Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: cs.status === 'published'
                          ? 'rgba(5,150,105,0.95)'
                          : cs.status === 'scheduled'
                          ? 'rgba(79,70,229,0.95)'
                          : 'rgba(217,119,6,0.95)',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {cs.status === 'published' ? '✅ Live' : cs.status === 'scheduled' ? '⏰ Scheduled' : '📝 Draft'}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {cs.category}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#0f172a',
                      margin: '0 0 8px',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {cs.title}
                    </h3>

                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      lineHeight: '1.6',
                      margin: '0 0 16px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {cs.clientName} • {cs.industry}
                    </p>

                    {/* Stats */}
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #f1f5f9',
                      marginBottom: '16px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Views
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                          {cs.views || 0}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Results
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                          {cs.results?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCase(cs);
                          setShowModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          background: '#fff',
                          color: '#0f172a',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/case-study/${cs.slug}`, '_blank');
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          background: '#fff',
                          color: '#0f172a',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cs._id);
                        }}
                        style={{
                          padding: '10px 14px',
                          border: '1px solid #fee2e2',
                          borderRadius: '8px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fecaca';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fef2f2';
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Case Study</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Views</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((cs, i) => (
                    <tr key={cs._id} style={{
                      borderBottom: i < filteredCases.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {cs.featuredImage?.url ? (
                            <img
                              src={cs.featuredImage.url}
                              alt=""
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '1px solid #e2e8f0'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '8px',
                              background: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '24px'
                            }}>
                              📊
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                              {cs.title}
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                              {cs.industry}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                        {cs.clientName}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#475569'
                        }}>
                          {cs.category}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: cs.status === 'published'
                            ? '#d1fae5'
                            : cs.status === 'scheduled'
                            ? '#e0e7ff'
                            : '#fef3c7',
                          color: cs.status === 'published'
                            ? '#059669'
                            : cs.status === 'scheduled'
                            ? '#4f46e5'
                            : '#d97706',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {cs.status === 'published' ? '✅ Live' : cs.status === 'scheduled' ? '⏰ Scheduled' : '📝 Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        {cs.views || 0}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setSelectedCase(cs);
                              setShowModal(true);
                            }}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              background: '#fff',
                              color: '#64748b',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.color = '#0f172a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => window.open(`/case-study/${cs.slug}`, '_blank')}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              background: '#fff',
                              color: '#64748b',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.color = '#0f172a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(cs._id)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #fee2e2',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fecaca';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fef2f2';
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <CaseStudyFormModal
          show={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedCase(null);
          }}
          onSubmit={handleCreateEdit}
          initialData={selectedCase}
          isEdit={!!selectedCase}
        />
      )}
    </SaasLayout>
  );
};

export default SaasCaseStudies;
