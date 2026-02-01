import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import '../styles/crm.css';

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    from: '',
    to: '',
    location: '',
    meetingType: 'Online',
    description: ''
  });

  useEffect(() => {
    loadMeeting();
  }, [id]);

  const loadMeeting = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/meetings/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setMeeting(data.data);
        setFormData({
          title: data.data.title,
          from: data.data.from,
          to: data.data.to,
          location: data.data.location || '',
          meetingType: data.data.meetingType,
          description: data.data.description || ''
        });
      }
    } catch (err) {
      setError('Failed to load meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/meetings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Meeting updated!');
        setShowEditForm(false);
        loadMeeting();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to update meeting');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/meetings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setSuccess('Meeting deleted!');
        setTimeout(() => navigate('/meetings'), 1500);
      }
    } catch (err) {
      setError('Failed to delete meeting');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Meeting Details">
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  if (!meeting) {
    return (
      <DashboardLayout title="Meeting Details">
        <div style={{ padding: '20px' }}>
          <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px' }}>
            Meeting not found
          </div>
          <button className="crm-btn crm-btn-secondary" onClick={() => navigate('/meetings')} style={{ marginTop: '20px' }}>
            ← Back to Meetings
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Meeting Details">
      {success && <div style={{ padding: '16px', background: '#DCFCE7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>{success}</div>}
      {error && <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      {/* Inline Edit Form */}
      {showEditForm && (
        <div className="crm-card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e3c72' }}>Edit Meeting</h3>
            <button onClick={() => setShowEditForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <form onSubmit={handleUpdate}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Title *</label>
                  <input type="text" className="crm-form-input" value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>From *</label>
                  <input type="datetime-local" className="crm-form-input" value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>To *</label>
                  <input type="datetime-local" className="crm-form-input" value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })} required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Location</label>
                  <input type="text" className="crm-form-input" value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Meeting Type</label>
                  <select className="crm-form-select" value={formData.meetingType}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}>
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Description</label>
                <textarea className="crm-form-textarea" rows="3" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowEditForm(false)}>Cancel</button>
              <button type="submit" className="crm-btn crm-btn-primary">Update Meeting</button>
            </div>
          </form>
        </div>
      )}

      {/* Inline Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="crm-card" style={{ marginBottom: '20px', border: '2px solid #FCA5A5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#FEF2F2' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#DC2626' }}>Delete Meeting</h3>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#374151' }}>Are you sure you want to delete this meeting?</p>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '16px', color: '#111827' }}>{meeting.title}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <button className="crm-btn crm-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            <button className="crm-btn crm-btn-danger" onClick={handleDelete}>Delete Meeting</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="crm-card" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  M
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{meeting.title}</h1>
                  <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
                    {meeting.relatedTo ? `Meeting for ${meeting.relatedTo}` : 'Independent Meeting'}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="crm-btn crm-btn-secondary" onClick={() => navigate('/meetings')}>
                ← Back
              </button>
              <button className="crm-btn crm-btn-primary" onClick={() => { setShowDeleteConfirm(false); setShowEditForm(true); }}>
                Edit
              </button>
              <button className="crm-btn crm-btn-danger" onClick={() => { setShowEditForm(false); setShowDeleteConfirm(true); }}>
                Delete
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>From</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {new Date(meeting.from).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>To</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {new Date(meeting.to).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Location</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>{meeting.location || 'Not specified'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Host</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {meeting.host?.firstName} {meeting.host?.lastName}
              </p>
            </div>
          </div>

          {/* Join Meeting Card */}
          {meeting.meetingLink && (
            <div style={{
              marginTop: '24px',
              padding: '24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '32px' }}>V</div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                    Join Video Meeting
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>
                    Click below to join the meeting instantly
                  </div>
                </div>
              </div>
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '14px 32px',
                  background: 'white',
                  color: '#667eea',
                  fontWeight: '700',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '15px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Join Now
              </a>
              <div style={{ fontSize: '12px', marginTop: '16px', opacity: 0.8, fontFamily: 'monospace' }}>
                Meeting ID: {meeting.meetingId}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left Column */}
        <div>
          {/* Meeting Information */}
          <div className="crm-card" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Meeting Information</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Title</label>
                  <p style={{ fontSize: '14px', fontWeight: '500' }}>{meeting.title}</p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Meeting Type</label>
                  <p style={{ fontSize: '14px', fontWeight: '500' }}>{meeting.meetingType}</p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Status</label>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    background: meeting.status === 'Completed' ? '#10B981' : '#3B82F6',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    {meeting.status}
                  </span>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Created By</label>
                  <p style={{ fontSize: '14px', fontWeight: '500' }}>
                    {meeting.owner?.firstName} {meeting.owner?.lastName}
                  </p>
                </div>
              </div>

              {meeting.description && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '8px' }}>Description</label>
                  <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{meeting.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="crm-card" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Participants</h3>
              <button className="crm-btn crm-btn-sm crm-btn-primary">+ Add</button>
            </div>
            <div style={{ padding: '20px' }}>
              {meeting.participants && meeting.participants.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {meeting.participants.map((email, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: '#F9FAFB',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#3B82F6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {email}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          Participant
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666' }}>
                  No participants found
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="crm-card" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Notes</h3>
              <button className="crm-btn crm-btn-sm crm-btn-primary">+ Add Note</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  {meeting.owner?.firstName?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>Meeting details</div>
                  <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                    {meeting.description || 'No notes added yet'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    {new Date(meeting.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="crm-card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Attachments</h3>
              <button className="crm-btn crm-btn-sm crm-btn-primary">+ Attach</button>
            </div>
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No Attachment
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div>
          {/* Related To - Only show if meeting is linked to an entity */}
          {meeting.relatedTo && (
            <div className="crm-card" style={{ marginBottom: '20px' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Related To</h3>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>{meeting.relatedTo}</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#3B82F6', cursor: 'pointer' }}>
                  View Details →
                </div>
              </div>
            </div>
          )}

          {/* Other Information */}
          <div className="crm-card">
            <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Other Information</h3>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Created By</label>
                <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>
                  {meeting.owner?.firstName} {meeting.owner?.lastName}
                </p>
                <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0 0' }}>
                  {new Date(meeting.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Modified By</label>
                <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>
                  {meeting.lastModifiedBy?.firstName} {meeting.lastModifiedBy?.lastName}
                </p>
                <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0 0' }}>
                  {new Date(meeting.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MeetingDetail;
