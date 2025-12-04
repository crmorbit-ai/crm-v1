import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import dataCenterService from '../services/dataCenterService';
import '../styles/crm.css';

const DataCenterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [moveForm, setMoveForm] = useState({
    leadStatus: 'New',
    leadSource: 'Customer',
    rating: 'Warm'
  });

  useEffect(() => {
    loadCandidate();
  }, [id]);

  const loadCandidate = async () => {
    try {
      setLoading(true);
      const response = await dataCenterService.getCandidate(id);
      setCandidate(response.data);
    } catch (error) {
      console.error('Error loading candidate:', error);
      alert('Failed to load candidate details');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToLead = async () => {
    try {
      const data = {
        candidateIds: [id],
        ...moveForm
      };

      await dataCenterService.moveToLeads(data);
      alert('✅ Successfully moved to Leads!');
      navigate('/leads');
    } catch (error) {
      console.error('Error moving to lead:', error);
      alert('Failed to move to leads');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: '#64748b', fontSize: '15px', fontWeight: '600' }}>
            Loading candidate details...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ color: '#1e3c72', marginBottom: '8px' }}>Candidate not found</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            This candidate may have been removed or doesn't exist.
          </p>
          <button className="crm-btn crm-btn-primary" onClick={() => navigate('/data-center')}>
            ← Back to Customer Database
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const actionButtons = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <button
        className="crm-btn crm-btn-secondary"
        onClick={() => navigate('/data-center')}
      >
        ← Back to List
      </button>
      <button
        className="crm-btn crm-btn-primary"
        onClick={() => setShowMoveModal(true)}
        disabled={candidate.status === 'Moved to Leads'}
      >
        ➡️ Move to Leads
      </button>
    </div>
  );

  return (
    <DashboardLayout title="Candidate Profile" actionButton={actionButtons}>
      {/* Status Badge */}
      {candidate.status === 'Moved to Leads' && (
        <div style={{
          background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
          border: '2px solid #86EFAC',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          color: '#166534',
          fontWeight: '600',
          boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <span>This candidate has been successfully moved to Leads module</span>
        </div>
      )}

      {/* Hero Section - Profile Card */}
      <div className="crm-card" style={{ marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
          padding: '32px',
          borderRadius: '16px 16px 0 0',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%'
          }}></div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: '800',
                color: '#4A90E2',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
              }}>
                {candidate.firstName?.[0]}{candidate.lastName?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{
                  margin: '0 0 8px 0',
                  fontSize: '32px',
                  fontWeight: '800',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}>
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  opacity: 0.95,
                  fontWeight: '600'
                }}>
                  {candidate.currentDesignation || 'Position not specified'}
                  {candidate.currentCompany && ` at ${candidate.currentCompany}`}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backdropFilter: 'blur(10px)'
                  }}>
                    📊 {candidate.totalExperience} years exp
                  </span>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backdropFilter: 'blur(10px)'
                  }}>
                    📍 {candidate.currentLocation}
                  </span>
                  <span style={{
                    background: candidate.status === 'Available'
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'rgba(255, 255, 255, 0.2)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {candidate.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0',
          borderTop: '2px solid #f1f5f9'
        }}>
          <div style={{
            padding: '24px',
            borderRight: '2px solid #f1f5f9',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>
              Current CTC
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e3c72' }}>
              ₹{candidate.currentCTC ? candidate.currentCTC.toLocaleString() : 'N/A'}
            </div>
          </div>
          <div style={{
            padding: '24px',
            borderRight: '2px solid #f1f5f9',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>
              Expected CTC
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>
              ₹{candidate.expectedCTC ? candidate.expectedCTC.toLocaleString() : 'N/A'}
            </div>
          </div>
          <div style={{
            padding: '24px',
            borderRight: '2px solid #f1f5f9',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>
              Notice Period
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e3c72' }}>
              {candidate.noticePeriod} days
            </div>
          </div>
          <div style={{
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>
              Availability
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>
              {candidate.availability}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="crm-tabs" style={{ marginBottom: '24px' }}>
        <button
          className={`crm-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </button>
        <button
          className={`crm-tab ${activeTab === 'professional' ? 'active' : ''}`}
          onClick={() => setActiveTab('professional')}
        >
          💼 Professional
        </button>
        <button
          className={`crm-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          💻 Skills & Links
        </button>
        <button
          className={`crm-tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📊 Activity
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {/* Contact Information */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">📞 Contact Information</h3>
            </div>
            <div className="crm-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>📧</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>
                      Email Address
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e3c72' }}>
                      {candidate.email}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>📞</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>
                      Phone Number
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e3c72' }}>
                      {candidate.phone}
                    </div>
                  </div>
                </div>

                {candidate.alternatePhone && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>☎️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>
                        Alternate Phone
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e3c72' }}>
                        {candidate.alternatePhone}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>📍</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>
                      Current Location
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e3c72' }}>
                      {candidate.currentLocation}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {candidate.summary && (
            <div className="crm-card" style={{ gridColumn: '1 / -1' }}>
              <div className="crm-card-header">
                <h3 className="crm-card-title">📝 Professional Summary</h3>
              </div>
              <div className="crm-card-body">
                <p style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: '#475569',
                  margin: 0
                }}>
                  {candidate.summary}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'professional' && (
        <div className="crm-card">
          <div className="crm-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: '12px',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '8px' }}>
                  💼 CURRENT COMPANY
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e3c72' }}>
                  {candidate.currentCompany || 'Not specified'}
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: '12px',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '8px' }}>
                  👨‍💼 DESIGNATION
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e3c72' }}>
                  {candidate.currentDesignation || 'Not specified'}
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: '12px',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '8px' }}>
                  📊 TOTAL EXPERIENCE
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e3c72' }}>
                  {candidate.totalExperience} years
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: '12px',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '8px' }}>
                  🎓 EDUCATION
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e3c72' }}>
                  {candidate.highestQualification || 'Not specified'}
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                borderRadius: '12px',
                border: '2px solid #86efac'
              }}>
                <div style={{ fontSize: '13px', color: '#166534', fontWeight: '700', marginBottom: '8px' }}>
                  💰 CURRENT CTC
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#15803d' }}>
                  ₹{candidate.currentCTC ? candidate.currentCTC.toLocaleString() : 'Not specified'}
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: '12px',
                border: '2px solid #93c5fd'
              }}>
                <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: '700', marginBottom: '8px' }}>
                  🎯 EXPECTED CTC
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a8a' }}>
                  ₹{candidate.expectedCTC ? candidate.expectedCTC.toLocaleString() : 'Not specified'}
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '12px',
                border: '2px solid #fcd34d'
              }}>
                <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '700', marginBottom: '8px' }}>
                  ⏰ NOTICE PERIOD
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#b45309' }}>
                  {candidate.noticePeriod} days
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #fae8ff 0%, #f5d0fe 100%)',
                borderRadius: '12px',
                border: '2px solid #e9d5ff'
              }}>
                <div style={{ fontSize: '13px', color: '#7e22ce', fontWeight: '700', marginBottom: '8px' }}>
                  📅 AVAILABILITY
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#6b21a8' }}>
                  {candidate.availability}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Skills */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">💻 Technical Skills</h3>
            </div>
            <div className="crm-card-body">
              {candidate.skills && candidate.skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {candidate.skills.map((skill, index) => (
                    <span key={index} style={{
                      padding: '10px 18px',
                      background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
                      transition: 'all 0.3s ease'
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                  No skills listed
                </p>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">🔗 Professional Links</h3>
            </div>
            <div className="crm-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {candidate.linkedInUrl && (
                  <a
                    href={candidate.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #0077b5 0%, #005582 100%)',
                      borderRadius: '12px',
                      color: 'white',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(0, 119, 181, 0.3)'
                    }}
                  >
                    <div style={{ fontSize: '32px' }}>💼</div>
                    <div>
                      <div style={{ fontWeight: '700', marginBottom: '4px' }}>LinkedIn Profile</div>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>View professional profile</div>
                    </div>
                  </a>
                )}

                {candidate.githubUrl && (
                  <a
                    href={candidate.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #24292e 0%, #1a1d21 100%)',
                      borderRadius: '12px',
                      color: 'white',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(36, 41, 46, 0.3)'
                    }}
                  >
                    <div style={{ fontSize: '32px' }}>🐙</div>
                    <div>
                      <div style={{ fontWeight: '700', marginBottom: '4px' }}>GitHub Profile</div>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>View code repositories</div>
                    </div>
                  </a>
                )}

                {candidate.resumeUrl && (
                  <a
                    href={candidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderRadius: '12px',
                      color: 'white',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <div style={{ fontSize: '32px' }}>📄</div>
                    <div>
                      <div style={{ fontWeight: '700', marginBottom: '4px' }}>Resume / CV</div>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>Download resume document</div>
                    </div>
                  </a>
                )}

                {!candidate.linkedInUrl && !candidate.githubUrl && !candidate.resumeUrl && (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                    No professional links available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="crm-card">
          <div className="crm-card-header">
            <h3 className="crm-card-title">📊 Activity & Source Information</h3>
          </div>
          <div className="crm-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌐</div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '8px' }}>
                  SOURCE WEBSITE
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e3c72' }}>
                  {candidate.sourceWebsite}
                </div>
              </div>

              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🕐</div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '8px' }}>
                  LAST ACTIVE ON
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e3c72' }}>
                  {new Date(candidate.lastActiveOn).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div style={{
                padding: '24px',
                background: candidate.status === 'Available'
                  ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                  : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                borderRadius: '12px',
                border: candidate.status === 'Available' ? '2px solid #86efac' : '2px solid #fca5a5',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                  {candidate.status === 'Available' ? '✅' : '⚠️'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: candidate.status === 'Available' ? '#166534' : '#991b1b',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  CURRENT STATUS
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: candidate.status === 'Available' ? '#15803d' : '#b91c1c'
                }}>
                  {candidate.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move to Leads Modal */}
      {showMoveModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowMoveModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '24px',
              borderBottom: '2px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e3c72' }}>
                Move to Leads
              </h3>
              <button
                onClick={() => setShowMoveModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ marginBottom: '20px', color: '#475569' }}>
                Move <strong>{candidate.firstName} {candidate.lastName}</strong> to the Leads module?
              </p>

              <div className="crm-form-group" style={{ marginBottom: '20px' }}>
                <label className="crm-form-label">Lead Status</label>
                <select
                  value={moveForm.leadStatus}
                  onChange={(e) => setMoveForm({ ...moveForm, leadStatus: e.target.value })}
                  className="crm-form-select"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                </select>
              </div>

              <div className="crm-form-group" style={{ marginBottom: '20px' }}>
                <label className="crm-form-label">Lead Source</label>
                <input
                  type="text"
                  value={moveForm.leadSource}
                  onChange={(e) => setMoveForm({ ...moveForm, leadSource: e.target.value })}
                  className="crm-form-input"
                />
              </div>

              <div className="crm-form-group" style={{ marginBottom: '20px' }}>
                <label className="crm-form-label">Rating</label>
                <select
                  value={moveForm.rating}
                  onChange={(e) => setMoveForm({ ...moveForm, rating: e.target.value })}
                  className="crm-form-select"
                >
                  <option value="Hot">🔥 Hot</option>
                  <option value="Warm">🌤️ Warm</option>
                  <option value="Cold">❄️ Cold</option>
                </select>
              </div>
            </div>

            <div style={{
              padding: '24px',
              borderTop: '2px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                className="crm-btn crm-btn-secondary"
                onClick={() => setShowMoveModal(false)}
              >
                Cancel
              </button>
              <button
                className="crm-btn crm-btn-primary"
                onClick={handleMoveToLead}
              >
                ✅ Confirm & Move
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DataCenterDetail;
