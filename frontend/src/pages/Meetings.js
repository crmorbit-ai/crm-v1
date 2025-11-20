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
    relatedTo: 'Lead',
    relatedToId: '',
    description: ''
  });

  useEffect(() => {
    loadMeetings();
  }, []);

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
    try {
      const response = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Meeting created!');
        setShowCreateModal(false);
        setFormData({ title: '', from: '', to: '', location: '', meetingType: 'Online', relatedTo: 'Lead', relatedToId: '', description: '' });
        loadMeetings();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to create meeting');
    }
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
                  <td>{meeting.relatedTo}</td>
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

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Meeting">
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
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Meetings;