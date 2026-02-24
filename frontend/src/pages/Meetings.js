import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import '../styles/crm.css';

const Meetings = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    from: '',
    to: '',
    location: '',
    meetingType: 'Online',
    relatedTo: '',
    relatedToId: '',
    description: '',
    participants: '', // Email addresses (comma-separated)
    isIndependent: true // Default to independent meeting
  });

  const [entitySearch, setEntitySearch] = useState('');
  const [entityResults, setEntityResults] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loadingEntities, setLoadingEntities] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  // Search for entities when relatedTo type changes or search query changes
  useEffect(() => {
    if (formData.relatedTo && entitySearch && entitySearch.length >= 2) {
      searchEntities();
    } else {
      setEntityResults([]);
    }
  }, [entitySearch, formData.relatedTo]);

  const searchEntities = async () => {
    if (!formData.relatedTo || !entitySearch) return;

    try {
      setLoadingEntities(true);
      const endpoint = formData.relatedTo.toLowerCase() + 's'; // leads, contacts, accounts, opportunities
      const response = await fetch(`${API_URL}/${endpoint}?search=${entitySearch}&limit=10`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setEntityResults(data.data[endpoint] || []);
      }
    } catch (err) {
      console.error('Entity search error:', err);
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
    setFormData({ ...formData, relatedToId: entity._id });
    const displayName = entity.companyName ||
                       `${entity.firstName || ''} ${entity.lastName || ''}`.trim() ||
                       entity.name || entity.title || 'Selected';
    setEntitySearch(displayName);
    setEntityResults([]);
  };

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/meetings?limit=100`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setMeetings(data.data.meetings || []);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      console.error(err);
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // Validation for entity-linked meetings
    if (!formData.isIndependent && !formData.relatedToId) {
      setError('Please select a ' + formData.relatedTo);
      return;
    }

    try {
      // Prepare data
      const submitData = {
        title: formData.title,
        from: formData.from,
        to: formData.to,
        location: formData.location,
        meetingType: formData.meetingType,
        description: formData.description
      };

      // If independent meeting, add participants array
      if (formData.isIndependent) {
        // Convert comma-separated emails to array
        const emailArray = formData.participants
          .split(',')
          .map(email => email.trim())
          .filter(email => email.length > 0);
        submitData.participants = emailArray;
      } else {
        // For entity-linked meetings, add relatedTo and relatedToId
        submitData.relatedTo = formData.relatedTo;
        submitData.relatedToId = formData.relatedToId;
      }

      const response = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Meeting created and invitations sent!');
        setShowCreateForm(false);
        resetForm();
        loadMeetings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to create meeting');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError('Failed to create meeting');
      setTimeout(() => setError(''), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', from: '', to: '', location: '', meetingType: 'Online',
      relatedTo: '', relatedToId: '', description: '', participants: '', isIndependent: true
    });
    setEntitySearch('');
    setEntityResults([]);
    setSelectedEntity(null);
  };

  return (
    <DashboardLayout title="Meetings">
      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      {/* Action Bar */}
      <div className="crm-card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Meetings</h3>
          <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateForm(true)}>+ Create Meeting</button>
        </div>
      </div>

      {/* Inline Create Meeting Form */}
      {showCreateForm && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Create New Meeting</h3>
            <button onClick={() => { setShowCreateForm(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Title *</label>
                  <input type="text" className="crm-form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>From *</label>
                  <input type="datetime-local" className="crm-form-input" value={formData.from} onChange={(e) => setFormData({ ...formData, from: e.target.value })} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>To *</label>
                  <input type="datetime-local" className="crm-form-input" value={formData.to} onChange={(e) => setFormData({ ...formData, to: e.target.value })} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Location</label>
                  <input type="text" className="crm-form-input" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Meeting Type</label>
                  <select className="crm-form-select" value={formData.meetingType} onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px' }}>
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Phone Call">Phone Call</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    <input type="checkbox" checked={formData.isIndependent} onChange={(e) => setFormData({ ...formData, isIndependent: e.target.checked, relatedTo: e.target.checked ? '' : 'Lead', relatedToId: '' })} />
                    Independent Meeting (not linked to any Lead/Contact)
                  </label>
                </div>

                {formData.isIndependent ? (
                  <div style={{ gridColumn: 'span 4' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Participant Email(s) *</label>
                    <input type="text" className="crm-form-input" placeholder="email1@example.com, email2@example.com" value={formData.participants} onChange={(e) => setFormData({ ...formData, participants: e.target.value })} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                    <small style={{ color: '#6B7280', fontSize: '11px' }}>Enter one or more email addresses separated by commas</small>
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Related To *</label>
                      <select className="crm-form-select" value={formData.relatedTo} onChange={(e) => { setFormData({ ...formData, relatedTo: e.target.value, relatedToId: '' }); setEntitySearch(''); setSelectedEntity(null); setEntityResults([]); }} required style={{ padding: '8px 10px', fontSize: '13px' }}>
                        <option value="">Select Type</option>
                        <option value="Lead">Lead</option>
                        <option value="Contact">Contact</option>
                        <option value="Account">Account</option>
                        <option value="Opportunity">Opportunity</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: 'span 3', position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Search {formData.relatedTo || 'Entity'} *</label>
                      <input type="text" className="crm-form-input" value={entitySearch} onChange={(e) => setEntitySearch(e.target.value)} placeholder={`Type to search ${formData.relatedTo || 'entity'}...`} disabled={!formData.relatedTo} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                      {loadingEntities && <span style={{ position: 'absolute', right: '12px', top: '28px', fontSize: '11px', color: '#6B7280' }}>Searching...</span>}
                      {entityResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '150px', overflowY: 'auto', background: 'white', border: '1px solid #E5E7EB', borderRadius: '6px', marginTop: '4px', zIndex: 1000, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                          {entityResults.map((entity) => {
                            const displayName = entity.companyName || `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || entity.name || entity.title;
                            return (
                              <div key={entity._id} onClick={() => handleEntitySelect(entity)} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: '13px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                {displayName}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {selectedEntity && <small style={{ color: '#10B981', fontSize: '11px' }}>Selected</small>}
                    </div>
                  </>
                )}

                <div style={{ gridColumn: 'span 4' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                  <textarea className="crm-form-input" rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px', resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline" onClick={() => { setShowCreateForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary">Create & Send Invites</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="crm-card">
        <div className="crm-card-header">
          <h2>All Meetings ({meetings.length})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : meetings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>No meetings found</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>From</th>
                <th>To</th>
                <th>Related To</th>
                <th>Host</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map(meeting => (
                <tr key={meeting._id}>
                  <td
                    style={{ fontWeight: '500', color: '#3B82F6', cursor: 'pointer' }}
                    onClick={() => navigate(`/meetings/${meeting._id}`)}
                  >
                    {meeting.title}
                  </td>
                  <td>{new Date(meeting.from).toLocaleString()}</td>
                  <td>{new Date(meeting.to).toLocaleString()}</td>
                  <td>
                    {meeting.relatedTo ? (
                      <span>{meeting.relatedTo}</span>
                    ) : (
                      <span style={{ color: '#6B7280', fontSize: '12px' }}>
                        Independent ({meeting.participants?.length || 0} participants)
                      </span>
                    )}
                  </td>
                  <td>{meeting.host?.firstName} {meeting.host?.lastName}</td>
                  <td><span className="status-badge">{meeting.status}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    {meeting.meetingLink && (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="crm-btn crm-btn-sm crm-btn-success"
                        style={{ marginRight: '8px' }}
                      >
                        Join
                      </a>
                    )}
                    <button
                      className="crm-btn crm-btn-sm crm-btn-primary"
                      onClick={() => navigate(`/meetings/${meeting._id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Meetings;
