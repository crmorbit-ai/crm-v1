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
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
          <p>Loading candidate details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Candidate not found</h2>
          <button className="crm-btn-primary" onClick={() => navigate('/data-center')}>
            Back to Customer
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="crm-container">
        {/* Header */}
        <div className="crm-header">
          <div>
            <h1>👤 {candidate.firstName} {candidate.lastName}</h1>
            <p>{candidate.currentDesignation || 'N/A'} at {candidate.currentCompany || 'N/A'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="crm-btn-secondary"
              onClick={() => navigate('/data-center')}
            >
              ← Back
            </button>
            <button 
              className="crm-btn-primary"
              onClick={() => setShowMoveModal(true)}
              disabled={candidate.status === 'Moved to Leads'}
            >
              ➡️ Move to Leads
            </button>
          </div>
        </div>

        {/* Status Badge */}
        {candidate.status === 'Moved to Leads' && (
          <div style={{ 
            background: '#d4edda', 
            border: '1px solid #c3e6cb',
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            color: '#155724'
          }}>
            ✅ This candidate has been moved to Leads
          </div>
        )}

        {/* Details Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {/* Contact Information */}
          <div className="crm-detail-card">
            <h3>📞 Contact Information</h3>
            <div className="crm-detail-item">
              <label>Email:</label>
              <span>{candidate.email}</span>
            </div>
            <div className="crm-detail-item">
              <label>Phone:</label>
              <span>{candidate.phone}</span>
            </div>
            {candidate.alternatePhone && (
              <div className="crm-detail-item">
                <label>Alternate Phone:</label>
                <span>{candidate.alternatePhone}</span>
              </div>
            )}
            <div className="crm-detail-item">
              <label>Location:</label>
              <span>{candidate.currentLocation}</span>
            </div>
          </div>

          {/* Professional Information */}
          <div className="crm-detail-card">
            <h3>💼 Professional Information</h3>
            <div className="crm-detail-item">
              <label>Experience:</label>
              <span>{candidate.totalExperience} years</span>
            </div>
            <div className="crm-detail-item">
              <label>Current Company:</label>
              <span>{candidate.currentCompany || 'N/A'}</span>
            </div>
            <div className="crm-detail-item">
              <label>Designation:</label>
              <span>{candidate.currentDesignation || 'N/A'}</span>
            </div>
            <div className="crm-detail-item">
              <label>Education:</label>
              <span>{candidate.highestQualification || 'N/A'}</span>
            </div>
          </div>

          {/* Salary & Availability */}
          <div className="crm-detail-card">
            <h3>💰 Salary & Availability</h3>
            <div className="crm-detail-item">
              <label>Current CTC:</label>
              <span>₹{candidate.currentCTC ? candidate.currentCTC.toLocaleString() : 'N/A'}</span>
            </div>
            <div className="crm-detail-item">
              <label>Expected CTC:</label>
              <span>₹{candidate.expectedCTC ? candidate.expectedCTC.toLocaleString() : 'N/A'}</span>
            </div>
            <div className="crm-detail-item">
              <label>Notice Period:</label>
              <span>{candidate.noticePeriod} days</span>
            </div>
            <div className="crm-detail-item">
              <label>Availability:</label>
              <span className="crm-badge crm-badge-success">{candidate.availability}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="crm-detail-card" style={{ gridColumn: '1 / -1' }}>
            <h3>💻 Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {candidate.skills && candidate.skills.length > 0 ? (
                candidate.skills.map((skill, index) => (
                  <span key={index} className="crm-badge crm-badge-primary">
                    {skill}
                  </span>
                ))
              ) : (
                <span>No skills listed</span>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="crm-detail-card">
            <h3>🔗 Links</h3>
            {candidate.linkedInUrl && (
              <div className="crm-detail-item">
                <label>LinkedIn:</label>
                <a href={candidate.linkedInUrl} target="_blank" rel="noopener noreferrer">
                  View Profile
                </a>
              </div>
            )}
            {candidate.githubUrl && (
              <div className="crm-detail-item">
                <label>GitHub:</label>
                <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer">
                  View Profile
                </a>
              </div>
            )}
            {candidate.resumeUrl && (
              <div className="crm-detail-item">
                <label>Resume:</label>
                <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                  Download Resume
                </a>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="crm-detail-card">
            <h3>📊 Activity</h3>
            <div className="crm-detail-item">
              <label>Source:</label>
              <span>{candidate.sourceWebsite}</span>
            </div>
            <div className="crm-detail-item">
              <label>Last Active:</label>
              <span>{new Date(candidate.lastActiveOn).toLocaleDateString()}</span>
            </div>
            <div className="crm-detail-item">
              <label>Status:</label>
              <span className="crm-badge crm-badge-success">{candidate.status}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        {candidate.summary && (
          <div className="crm-detail-card" style={{ marginTop: '20px' }}>
            <h3>📝 Summary</h3>
            <p>{candidate.summary}</p>
          </div>
        )}

        {/* Move to Leads Modal */}
        {showMoveModal && (
          <div className="crm-modal-overlay" onClick={() => setShowMoveModal(false)}>
            <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="crm-modal-header">
                <h3>Move to Leads</h3>
                <button onClick={() => setShowMoveModal(false)}>✕</button>
              </div>
              
              <div className="crm-modal-body">
                <p>Move <strong>{candidate.firstName} {candidate.lastName}</strong> to Leads module?</p>
                
                <div className="crm-form-group">
                  <label>Lead Status</label>
                  <select
                    value={moveForm.leadStatus}
                    onChange={(e) => setMoveForm({ ...moveForm, leadStatus: e.target.value })}
                    className="crm-select"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                  </select>
                </div>

                <div className="crm-form-group">
                  <label>Lead Source</label>
                  <input
                    type="text"
                    value={moveForm.leadSource}
                    onChange={(e) => setMoveForm({ ...moveForm, leadSource: e.target.value })}
                    className="crm-input"
                  />
                </div>

                <div className="crm-form-group">
                  <label>Rating</label>
                  <select
                    value={moveForm.rating}
                    onChange={(e) => setMoveForm({ ...moveForm, rating: e.target.value })}
                    className="crm-select"
                  >
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>
              </div>

              <div className="crm-modal-footer">
                <button className="crm-btn-secondary" onClick={() => setShowMoveModal(false)}>
                  Cancel
                </button>
                <button className="crm-btn-primary" onClick={handleMoveToLead}>
                  ✅ Confirm & Move
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DataCenterDetail;