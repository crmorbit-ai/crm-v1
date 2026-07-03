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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantEmail, setParticipantEmail] = useState('');

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
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
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
          'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}`,
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

  const handleAddParticipant = async () => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!participantEmail.trim()) {
      setError('Email cannot be empty');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!emailRegex.test(participantEmail)) {
      setError('Please enter a valid email address');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Check if already exists
    if (meeting.participants && meeting.participants.includes(participantEmail)) {
      setError('Participant already added');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/meetings/${id}/participants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: participantEmail })
      });

      if (response.ok) {
        setSuccess('Participant added successfully!');
        setParticipantEmail('');
        setShowAddParticipant(false);
        loadMeeting();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to add participant');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to add participant');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setError('Note cannot be empty');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/meetings/${id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: newNote })
      });

      if (response.ok) {
        setSuccess('Note added successfully!');
        setNewNote('');
        setShowAddNote(false);
        loadMeeting();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to add note');
      }
    } catch (err) {
      setError('Failed to add note');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/meetings/${id}/attachments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` },
        body: formData
      });

      if (response.ok) {
        setSuccess('File uploaded successfully!');
        loadMeeting(); // Reload to show new attachment
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to upload file');
      }
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/meetings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
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
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  .meeting-detail-container {
    width: 100%;
    max-width: 100%;
  }

  /* Section headers - desktop horizontal, mobile vertical */
  .section-header-mobile {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-header-mobile h3 {
    margin: 0 !important;
  }

  .section-header-mobile button {
    width: auto !important;
  }

  @media(max-width:768px){
    /* Mobile: headers vertical */
    .section-header-mobile {
      display: block !important;
    }

    .section-header-mobile h3 {
      margin: 0 0 8px 0 !important;
    }

    .section-header-mobile button {
      width: 100% !important;
      display: block !important;
    }

    /* Attachment items vertical on mobile */
    .attachment-item-mobile {
      display: block !important;
    }

    .attachment-item-mobile > div:first-child {
      margin-bottom: 8px !important;
    }

    .attachment-item-mobile a[download] {
      width: 100% !important;
      display: block !important;
      text-align: center !important;
    }
    .meeting-detail-container {
      overflow-x: hidden !important;
      width: 100% !important;
      padding: 0 !important;
    }

    .meetingd-grid4,.meetingd-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .meetingd-grid2{grid-template-columns:1fr!important;}

    .meetingd-split{
      grid-template-columns:1fr!important;
      display:flex!important;
      flex-direction:column!important;
      width: 100% !important;
    }

    .meetingd-sidebar{
      width:100%!important;
      min-width:unset!important;
      max-width:unset!important;
      order:2!important;
    }

    .meetingd-panel{
      width:100%!important;
      max-width: 100% !important;
      order:1!important;
    }

    .meetingd-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .meetingd-form-row{grid-template-columns:1fr!important;}
    .meetingd-hide{display:none!important;}

    .crm-card{
      margin-bottom:12px!important;
      overflow:visible!important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .crm-card > div {
      padding: 12px !important;
      box-sizing: border-box !important;
      width: 100% !important;
      overflow: visible !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
    }

    /* All buttons visible and no shrink */
    .crm-btn,
    .crm-btn-primary,
    .crm-btn-sm,
    button {
      font-size:12px!important;
      padding:6px 10px!important;
      white-space:nowrap!important;
      flex-shrink: 0 !important;
      display: inline-block !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      z-index: 10 !important;
    }

    /* Headers don't hide buttons */
    .crm-card h3 {
      flex: 0 1 auto !important;
      font-size: 14px !important;
      margin-right: auto !important;
    }

    /* Download links */
    .crm-card a,
    a[download] {
      flex-shrink: 0 !important;
      display: inline-block !important;
      visibility: visible !important;
      white-space: nowrap !important;
    }

    /* Header responsive */
    .crm-card h1 {
      font-size: 18px !important;
    }
  }

  @media(max-width:480px){
    .meetingd-grid4,.meetingd-grid3,.meetingd-grid2{grid-template-columns:1fr!important;}

    .crm-btn{
      font-size:12px!important;
      padding:6px 10px!important;
    }
  }
`}</style>
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
      <div className="meeting-detail-container" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
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
              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(4, 1fr)',
                gap: '16px'
              }}>
                <div style={{ gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Title *</label>
                  <input type="text" className="crm-form-input" value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} required style={{ width: '100%' }} />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>From *</label>
                  <input
                    type="datetime-local"
                    className="crm-form-input"
                    value={formData.from}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>To *</label>
                  <input
                    type="datetime-local"
                    className="crm-form-input"
                    value={formData.to}
                    min={formData.from || new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Location</label>
                  <input type="text" className="crm-form-input" value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Meeting Type</label>
                  <select className="crm-form-select" value={formData.meetingType}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })} style={{ width: '100%' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ minWidth: '250px' }}>
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

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="crm-btn crm-btn-secondary" onClick={() => navigate('/meetings')} style={{ fontSize: '14px', padding: '8px 16px' }}>
                ← Back
              </button>
              <button className="crm-btn crm-btn-primary" onClick={() => { setShowDeleteConfirm(false); setShowEditForm(true); }} style={{ fontSize: '14px', padding: '8px 16px' }}>
                Edit
              </button>
              <button className="crm-btn crm-btn-danger" onClick={() => { setShowEditForm(false); setShowDeleteConfirm(true); }} style={{ fontSize: '14px', padding: '8px 16px' }}>
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
      <div style={{
        display: window.innerWidth <= 768 ? 'block' : 'grid',
        gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '2fr 1fr',
        gap: '20px'
      }}>
        {/* Left Column */}
        <div style={{ width: '100%', maxWidth: '100%' }}>
          {/* Meeting Information */}
          <div className="crm-card" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Meeting Information</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="meetingd-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
            <div style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 10px 0', display: 'block' }}>Participants</h3>
              <button
                onClick={() => setShowAddParticipant(!showAddParticipant)}
                style={{
                  fontSize: '13px',
                  padding: '8px 16px',
                  width: '100%',
                  display: 'block',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {showAddParticipant ? '✕ Cancel' : '+ Add Participant'}
              </button>
            </div>

            {/* Add Participant Form */}
            {showAddParticipant && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', background: '#f9fafb' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  placeholder="Enter participant email (e.g., user@example.com)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    marginBottom: '12px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddParticipant();
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    className="crm-btn crm-btn-sm crm-btn-outline"
                    onClick={() => {
                      setShowAddParticipant(false);
                      setParticipantEmail('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="crm-btn crm-btn-sm crm-btn-primary"
                    onClick={handleAddParticipant}
                    disabled={!participantEmail.trim()}
                  >
                    Add Participant
                  </button>
                </div>
              </div>
            )}
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
            <div style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 10px 0', display: 'block' }}>Notes</h3>
              <button
                onClick={() => setShowAddNote(!showAddNote)}
                style={{
                  fontSize: '13px',
                  padding: '8px 16px',
                  width: '100%',
                  display: 'block',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {showAddNote ? '✕ Cancel' : '+ Add Note'}
              </button>
            </div>

            {/* Add Note Form */}
            {showAddNote && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', background: '#f9fafb' }}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write your note here..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    marginBottom: '12px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    className="crm-btn crm-btn-sm crm-btn-outline"
                    onClick={() => {
                      setShowAddNote(false);
                      setNewNote('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="crm-btn crm-btn-sm crm-btn-primary"
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}

            <div style={{ padding: '20px' }}>
              {/* Description as initial note */}
              {meeting.description && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                    {meeting.owner?.firstName?.charAt(0) || 'M'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>Meeting description</div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                      {meeting.description}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                      {new Date(meeting.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Display notes list */}
              {meeting.notes && meeting.notes.length > 0 ? (
                meeting.notes.map((note, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: idx < meeting.notes.length - 1 ? '16px' : '0', paddingBottom: idx < meeting.notes.length - 1 ? '16px' : '0', borderBottom: idx < meeting.notes.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                      {note.createdBy?.firstName?.charAt(0) || user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                        {note.createdBy?.firstName || user?.firstName || 'User'} {note.createdBy?.lastName || user?.lastName || ''}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                        {note.note || note.content}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        {new Date(note.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                !meeting.description && (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    No notes added yet
                  </div>
                )
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="crm-card">
            <div style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 10px 0', display: 'block' }}>Attachments</h3>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  fontSize: '13px',
                  padding: '8px 16px',
                  width: '100%',
                  display: 'block',
                  background: uploading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {uploading ? '⏳ Uploading...' : '+ Attach File'}
              </button>
            </div>
            <div style={{ padding: meeting.attachments && meeting.attachments.length > 0 ? '0' : '20px', textAlign: meeting.attachments && meeting.attachments.length > 0 ? 'left' : 'center', color: '#666' }}>
              {meeting.attachments && meeting.attachments.length > 0 ? (
                <div>
                  {meeting.attachments.map((att, idx) => (
                    <div key={idx} className="attachment-item-mobile" style={{
                      padding: '12px 16px',
                      borderBottom: idx < meeting.attachments.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '20px', flexShrink: 0 }}>
                          {att.mimetype?.includes('pdf') ? '📄' :
                           att.mimetype?.includes('image') ? '🖼️' :
                           att.mimetype?.includes('word') || att.mimetype?.includes('doc') ? '📝' :
                           att.mimetype?.includes('excel') || att.mimetype?.includes('spreadsheet') ? '📊' : '📎'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#1e3c72',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {att.filename || att.name || 'Attachment'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                            {att.size ? `${(att.size / 1024).toFixed(1)} KB` : ''}
                            {att.uploadedAt ? ` • ${new Date(att.uploadedAt).toLocaleDateString()}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <a
                          href={`${API_URL.replace('/api', '')}/uploads/meetings/${att.path?.split('/').pop() || att.filename}`}
                          download={att.filename}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            color: '#10b981',
                            border: '1px solid #10b981',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            background: 'white',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#10b981';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.color = '#10b981';
                          }}
                        >
                          ⬇️ Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                'No Attachment'
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ width: '100%', maxWidth: '100%' }}>
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
      </div>
    </DashboardLayout>
  );
};

export default MeetingDetail;
