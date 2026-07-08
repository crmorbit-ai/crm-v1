import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import '../styles/crm.css';
import { API_URL } from '../config/api.config';

const Calls = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Related records for dropdown
  const [relatedRecords, setRelatedRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    callStartTime: '',
    callDuration: '',
    callType: 'Outbound',
    callPurpose: 'Follow-up',
    callResult: 'Completed',
    relatedTo: 'Lead',
    relatedToId: '',
    description: ''
  });

  useEffect(() => {
    loadCalls();
  }, []);

  // Load related records when relatedTo type changes
  useEffect(() => {
    if (showCreateForm && formData.relatedTo) {
      loadRelatedRecords(formData.relatedTo);
    }
  }, [showCreateForm, formData.relatedTo]);

  const loadRelatedRecords = async (type) => {
    try {
      setLoadingRecords(true);
      let endpoint = '';
      switch (type) {
        case 'Lead': endpoint = '/leads'; break;
        case 'Contact': endpoint = '/contacts'; break;
        case 'Account': endpoint = '/accounts'; break;
        case 'Opportunity': endpoint = '/opportunities'; break;
        case 'Deal': endpoint = '/deals'; break;
        default: endpoint = '/leads';
      }
      const response = await fetch(`${API_URL}${endpoint}?limit=100`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        // Handle different response structures
        const records = data.data?.leads || data.data?.contacts || data.data?.accounts ||
                       data.data?.opportunities || data.data?.deals || data.data || [];
        setRelatedRecords(Array.isArray(records) ? records : []);
      }
    } catch (err) {
      console.error('Failed to load related records:', err);
      setRelatedRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const getRecordDisplayName = (record) => {
    if (record.firstName && record.lastName) return `${record.firstName} ${record.lastName}`;
    if (record.name) return record.name;
    if (record.title) return record.title;
    if (record.companyName) return record.companyName;
    if (record.email) return record.email;
    return record._id;
  };

  const loadCalls = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/calls?limit=100`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setCalls(data.data.calls || []);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      console.error(err);
      setError('Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    const errors = { ...validationErrors };

    if (name === 'subject') {
      // Must contain at least one letter
      if (!value || value.trim().length === 0) {
        errors.subject = 'Subject is required';
      } else if (!/[a-zA-Z]/.test(value)) {
        errors.subject = 'Subject must contain at least one letter';
      } else if (/^[0-9]+$/.test(value.trim())) {
        errors.subject = 'Subject cannot be only numbers';
      } else if (value.trim().length < 3) {
        errors.subject = 'Subject must be at least 3 characters';
      } else {
        delete errors.subject;
      }
    }

    if (name === 'description') {
      // If filled, must contain at least one letter
      if (value && value.trim().length > 0) {
        if (!/[a-zA-Z]/.test(value)) {
          errors.description = 'Description must contain at least one letter';
        } else if (/^[0-9@#$%^&*()]+$/.test(value.trim())) {
          errors.description = 'Description cannot be only numbers or symbols';
        } else {
          delete errors.description;
        }
      } else {
        delete errors.description;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // Validate all fields
    const subjectValid = validateField('subject', formData.subject);
    const descValid = validateField('description', formData.description);

    if (!subjectValid || !descValid) {
      setError('Please fix validation errors');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Call logged!');
        setShowCreateForm(false);
        setFormData({ subject: '', callStartTime: '', callDuration: '', callType: 'Outbound', callPurpose: 'Follow-up', callResult: 'Completed', relatedTo: 'Lead', relatedToId: '', description: '' });
        setRelatedRecords([]);
        loadCalls();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to log call');
      }
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError('Failed to log call');
    }
  };

  const getCallTypeColor = (type) => {
    const colors = { 'Outbound': '#3B82F6', 'Inbound': '#10B981', 'Missed': '#EF4444' };
    return colors[type] || '#6B7280';
  };

  const getResultColor = (result) => {
    const colors = { 'Interested': '#10B981', 'Not Interested': '#EF4444', 'No Answer': '#F59E0B', 'Call Back Later': '#8B5CF6', 'Completed': '#3B82F6' };
    return colors[result] || '#6B7280';
  };

  const mobileCSS = `
    /* Desktop table fixes */
    .crm-table {
      table-layout: auto;
      width: 100%;
    }

    .crm-table th {
      white-space: nowrap !important;
      min-width: 100px;
    }

    .crm-table td {
      white-space: nowrap;
      padding: 12px 16px;
    }

    /* Badge columns - wider */
    .crm-table th:nth-child(4),
    .crm-table th:nth-child(5) {
      min-width: 120px;
    }

    .crm-table td:nth-child(4),
    .crm-table td:nth-child(5) {
      min-width: 120px;
    }

    /* Actions column */
    .crm-table th:last-child,
    .crm-table td:last-child {
      min-width: 100px;
    }

    /* Subject column - allow longer text */
    .crm-table td:first-child {
      max-width: 300px;
      white-space: normal;
      word-wrap: break-word;
    }

    @media(max-width:768px){
      .resp-grid-4 { grid-template-columns: 1fr 1fr !important; }
      .calls-span2 { grid-column: span 1 !important; }
      .calls-span4 { grid-column: span 1 !important; }
      .crm-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    }
  `;

  return (
    <DashboardLayout title="Calls">
      <style>{mobileCSS}</style>
      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      {/* Action Bar */}
      <div className="crm-card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Calls</h3>
          <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateForm(true)}>+ Log Call</button>
        </div>
      </div>

      {/* Inline Create Call Form */}
      {showCreateForm && (
        <>
          {/* Mobile backdrop */}
          {window.innerWidth <= 768 && (
            <div
              className="calls-form-backdrop"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 998,
                backdropFilter: 'blur(2px)'
              }}
              onClick={() => setShowCreateForm(false)}
            />
          )}
          <div
            className="crm-card calls-form-panel"
            style={{
              marginBottom: '16px',
              ...(window.innerWidth <= 768 ? {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                margin: 0,
                borderRadius: 0,
                zIndex: 999,
                overflowY: 'auto',
                maxHeight: '100vh'
              } : {})
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Log New Call</h3>
              <button onClick={() => setShowCreateForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }} title="Close">✕</button>
            </div>
            <div style={{ padding: '16px' }}>
            <form onSubmit={handleCreate}>
              <div className="resp-grid-4">
                <div className="calls-span2">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Subject *</label>
                  <input
                    type="text"
                    className="crm-form-input"
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                      validateField('subject', e.target.value);
                    }}
                    required
                    style={{ padding: '8px 10px', fontSize: '13px', borderColor: validationErrors.subject ? '#dc2626' : undefined }}
                  />
                  {validationErrors.subject && (
                    <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px' }}>
                      {validationErrors.subject}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Call Time *</label>
                  <input
                    type="datetime-local"
                    className="crm-form-input"
                    value={formData.callStartTime}
                    onChange={(e) => setFormData({ ...formData, callStartTime: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                    style={{ padding: '8px 10px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Duration (min)</label>
                  <input type="number" className="crm-form-input" value={formData.callDuration} onChange={(e) => setFormData({ ...formData, callDuration: e.target.value })} min="0" style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Call Type</label>
                  <select className="crm-form-select" value={formData.callType} onChange={(e) => setFormData({ ...formData, callType: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px' }}>
                    <option value="Outbound">Outbound</option>
                    <option value="Inbound">Inbound</option>
                    <option value="Missed">Missed</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Call Result</label>
                  <select className="crm-form-select" value={formData.callResult} onChange={(e) => setFormData({ ...formData, callResult: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px' }}>
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Call Back Later">Call Back Later</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Related To *</label>
                  <select className="crm-form-select" value={formData.relatedTo} onChange={(e) => setFormData({ ...formData, relatedTo: e.target.value, relatedToId: '' })} required style={{ padding: '8px 10px', fontSize: '13px' }}>
                    <option value="Lead">Lead</option>
                    <option value="Contact">Contact</option>
                    <option value="Account">Account</option>
                    <option value="Opportunity">Opportunity</option>
                    <option value="Deal">Deal</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Select {formData.relatedTo} *</label>
                  <select className="crm-form-select" value={formData.relatedToId} onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })} required style={{ padding: '8px 10px', fontSize: '13px' }}>
                    <option value="">-- Select {formData.relatedTo} --</option>
                    {loadingRecords ? (
                      <option disabled>Loading...</option>
                    ) : relatedRecords.map(record => (
                      <option key={record._id} value={record._id}>{getRecordDisplayName(record)}</option>
                    ))}
                  </select>
                </div>
                <div className="calls-span4" style={{ gridColumn: 'span 4' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                  <textarea
                    className="crm-form-input"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      validateField('description', e.target.value);
                    }}
                    style={{ padding: '8px 10px', fontSize: '13px', resize: 'vertical', borderColor: validationErrors.description ? '#dc2626' : undefined }}
                  />
                  {validationErrors.description && (
                    <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px' }}>
                      {validationErrors.description}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline" onClick={() => setShowCreateForm(false)}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary">Log Call</button>
              </div>
            </form>
          </div>
        </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .calls-form-backdrop {
            display: block !important;
          }
          .calls-form-panel {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
            z-index: 999 !important;
            overflow-y: auto !important;
            max-height: 100vh !important;
          }
        }
      `}</style>

      <div className="crm-card">
        <div className="crm-card-header">
          <h2>All Calls ({calls.length})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : calls.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>No calls found</div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Call Time</th>
                <th>Duration</th>
                <th>Type</th>
                <th>Result</th>
                <th>Related To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {calls.map(call => (
                <tr key={call._id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: '500', color: '#1e3c72' }}>{call.subject}</td>
                  <td>{new Date(call.callStartTime).toLocaleString()}</td>
                  <td>{call.callDuration ? `${call.callDuration} min` : '-'}</td>
                  <td>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'white',
                      background: getCallTypeColor(call.callType),
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {call.callType}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'white',
                      background: getResultColor(call.callResult),
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {call.callResult}
                    </span>
                  </td>
                  <td>{call.relatedTo}</td>
                  <td>
                    <button className="crm-btn crm-btn-sm crm-btn-primary" onClick={() => { setSelectedCall(call); setShowDetailPanel(true); }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Call Detail Side Panel */}
      {showDetailPanel && selectedCall && (
        <>
          {/* Overlay */}
          <div
            onClick={() => { setShowDetailPanel(false); setSelectedCall(null); }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998,
              backdropFilter: 'blur(2px)'
            }}
          />

          {/* Side Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '450px',
            maxWidth: '90vw',
            background: '#ffffff',
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.2)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
              padding: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#fff' }}>
                    📞 {selectedCall.subject}
                  </h2>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                    {new Date(selectedCall.callStartTime).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </div>
                </div>
                <button
                  onClick={() => { setShowDetailPanel(false); setSelectedCall(null); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '18px',
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Call Type & Result Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: getCallTypeColor(selectedCall.callType),
                  color: '#fff'
                }}>
                  {selectedCall.callType}
                </span>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: getResultColor(selectedCall.callResult),
                  color: '#fff'
                }}>
                  {selectedCall.callResult}
                </span>
              </div>

              {/* Details Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Duration */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Duration
                  </label>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e3c72' }}>
                    {selectedCall.callDuration ? `${selectedCall.callDuration} minutes` : 'Not recorded'}
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Purpose
                  </label>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e3c72' }}>
                    {selectedCall.callPurpose || 'Not specified'}
                  </div>
                </div>

                {/* Related To */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Related To
                  </label>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e3c72' }}>
                    {selectedCall.relatedTo || 'Not linked'}
                  </div>
                </div>

                {/* Description/Notes */}
                {selectedCall.description && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Call Notes
                    </label>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      color: '#334155',
                      lineHeight: '1.6'
                    }}>
                      {selectedCall.description}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div style={{
                  marginTop: '12px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    <strong>Created:</strong> {new Date(selectedCall.createdAt).toLocaleString()}
                  </div>
                  {selectedCall.updatedAt && (
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      <strong>Updated:</strong> {new Date(selectedCall.updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => { setShowDetailPanel(false); setSelectedCall(null); }}
                className="crm-btn crm-btn-outline"
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>

          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </>
      )}
    </DashboardLayout>
  );
};

export default Calls;
