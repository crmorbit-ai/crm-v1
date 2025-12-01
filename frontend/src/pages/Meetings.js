import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import { API_URL } from '../config/api.config';
import '../styles/crm.css';

const Meetings = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        setShowCreateModal(false);
        resetForm();
        loadMeetings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to create meeting');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
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
    <DashboardLayout
      title="Meetings"
      actionButton={
        <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Meeting
        </button>
      }
    >
      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

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
                        🎥 Join
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

      <Modal isOpen={showCreateModal} onClose={() => {
        setShowCreateModal(false);
        resetForm();
      }} title="Create Meeting">
        <form onSubmit={handleCreate}>
          <div className="crm-form-group">
            <label>Title *</label>
            <input type="text" className="crm-form-input" value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="crm-form-group">
              <label>From *</label>
              <input type="datetime-local" className="crm-form-input" value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })} required />
            </div>
            <div className="crm-form-group">
              <label>To *</label>
              <input type="datetime-local" className="crm-form-input" value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })} required />
            </div>
          </div>
          <div className="crm-form-group">
            <label>Location</label>
            <input type="text" className="crm-form-input" value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          </div>
          <div className="crm-form-group">
            <label>Meeting Type</label>
            <select className="crm-form-select" value={formData.meetingType}
              onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}>
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
              <option value="Phone Call">Phone Call</option>
            </select>
          </div>

          {/* Meeting Type Toggle */}
          <div className="crm-form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isIndependent}
                onChange={(e) => setFormData({
                  ...formData,
                  isIndependent: e.target.checked,
                  relatedTo: e.target.checked ? '' : 'Lead',
                  relatedToId: e.target.checked ? '' : formData.relatedToId
                })}
              />
              <span>Independent Meeting (not linked to any Lead/Contact)</span>
            </label>
          </div>

          {/* Conditional Fields */}
          {formData.isIndependent ? (
            <div className="crm-form-group">
              <label>Participant Email(s) *</label>
              <input
                type="text"
                className="crm-form-input"
                placeholder="email1@example.com, email2@example.com"
                value={formData.participants}
                onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                required
              />
              <small style={{ color: '#6B7280', fontSize: '12px' }}>
                Enter one or more email addresses separated by commas
              </small>
            </div>
          ) : (
            <>
              <div className="crm-form-group">
                <label>Related To *</label>
                <select className="crm-form-select" value={formData.relatedTo}
                  onChange={(e) => {
                    setFormData({ ...formData, relatedTo: e.target.value, relatedToId: '' });
                    setEntitySearch('');
                    setSelectedEntity(null);
                    setEntityResults([]);
                  }} required>
                  <option value="">Select Type</option>
                  <option value="Lead">Lead</option>
                  <option value="Contact">Contact</option>
                  <option value="Account">Account</option>
                  <option value="Opportunity">Opportunity</option>
                </select>
              </div>
              <div className="crm-form-group" style={{ position: 'relative' }}>
                <label>Search {formData.relatedTo || 'Entity'} *</label>
                <input
                  type="text"
                  className="crm-form-input"
                  value={entitySearch}
                  onChange={(e) => setEntitySearch(e.target.value)}
                  placeholder={`Type to search ${formData.relatedTo || 'entity'}...`}
                  disabled={!formData.relatedTo}
                  required
                />
                {loadingEntities && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '36px',
                    fontSize: '12px',
                    color: '#6B7280'
                  }}>
                    Searching...
                  </div>
                )}
                {entityResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    marginTop: '4px',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}>
                    {entityResults.map((entity) => {
                      const displayName = entity.companyName ||
                                         `${entity.firstName || ''} ${entity.lastName || ''}`.trim() ||
                                         entity.name || entity.title;
                      const subInfo = entity.email || entity.phone || '';
                      return (
                        <div
                          key={entity._id}
                          onClick={() => handleEntitySelect(entity)}
                          style={{
                            padding: '12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #F3F4F6',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{ fontWeight: '500', fontSize: '14px', color: '#111827' }}>
                            {displayName}
                          </div>
                          {subInfo && (
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                              {subInfo}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {formData.relatedTo && entitySearch.length > 0 && entitySearch.length < 2 && (
                  <small style={{ color: '#6B7280', fontSize: '11px' }}>
                    Type at least 2 characters to search
                  </small>
                )}
                {selectedEntity && (
                  <small style={{ color: '#10B981', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    ✓ Selected
                  </small>
                )}
              </div>
            </>
          )}

          <div className="crm-form-group">
            <label>Description</label>
            <textarea
              className="crm-form-textarea"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary">Create & Send Invites</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Meetings;