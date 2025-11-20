import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { leadService } from '../services/leadService';
import { taskService } from '../services/taskService';
import { noteService } from '../services/noteService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import { API_URL } from '../config/api.config';
import '../styles/crm.css';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const [lead, setLead] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [calls, setCalls] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({});

  const [taskData, setTaskData] = useState({
    subject: '',
    dueDate: '',
    status: 'Not Started',
    priority: 'Normal',
    description: ''
  });

  const [meetingData, setMeetingData] = useState({
    title: '',
    from: '',
    to: '',
    location: '',
    meetingType: 'Online',
    description: ''
  });

  const [callData, setCallData] = useState({
    subject: '',
    callStartTime: '',
    callDuration: '',
    callType: 'Outbound',
    callPurpose: 'Follow-up',
    callResult: 'Completed',
    description: ''
  });

  const [noteData, setNoteData] = useState({
    title: '',
    content: ''
  });

  const [conversionData, setConversionData] = useState({
    createAccount: true,
    createContact: true,
    createOpportunity: false,
    accountName: '',
    opportunityName: '',
    opportunityAmount: '',
    closeDate: ''
  });

  useEffect(() => {
    loadLead();
    loadTasks();
    loadMeetings();
    loadCalls();
    loadNotes();
  }, [id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await leadService.getLead(id);
      
      if (response && response.success && response.data) {
        setLead(response.data);
        setConversionData(prev => ({
          ...prev,
          accountName: response.data.company || `${response.data.firstName} ${response.data.lastName}`,
          opportunityName: `${response.data.company || response.data.firstName + ' ' + response.data.lastName} - Opportunity`
        }));
      } else {
        setError('Failed to load lead');
      }
    } catch (err) {
      console.error('Load lead error:', err);
      setError(err.response?.data?.message || 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await taskService.getTasks({
        relatedTo: 'Lead',
        relatedToId: id,
        limit: 100
      });
      if (response?.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (err) {
      console.error('Load tasks error:', err);
    }
  };

  const loadMeetings = async () => {
    try {
      const response = await fetch(`${API_URL}/meetings?relatedTo=Lead&relatedToId=${id}&limit=100`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setMeetings(data.data.meetings || []);
      }
    } catch (err) {
      console.error('Load meetings error:', err);
    }
  };

  const loadCalls = async () => {
    try {
      const response = await fetch(`${API_URL}/calls?relatedTo=Lead&relatedToId=${id}&limit=100`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setCalls(data.data.calls || []);
      }
    } catch (err) {
      console.error('Load calls error:', err);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await noteService.getNotes({
        relatedTo: 'Lead',
        relatedToId: id,
        limit: 100
      });
      if (response?.success) {
        setNotes(response.data.notes || []);
      }
    } catch (err) {
      console.error('Load notes error:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await taskService.createTask({
        ...taskData,
        relatedTo: 'Lead',
        relatedToId: id
      });
      setSuccess('Task created successfully!');
      setShowTaskModal(false);
      setTaskData({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
      loadTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...meetingData,
          relatedTo: 'Lead',
          relatedToId: id
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Meeting created successfully!');
        setShowMeetingModal(false);
        setMeetingData({ title: '', from: '', to: '', location: '', meetingType: 'Online', description: '' });
        loadMeetings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to create meeting');
      }
    } catch (err) {
      setError('Failed to create meeting');
    }
  };

  const handleCreateCall = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await fetch(`${API_URL}/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...callData,
          relatedTo: 'Lead',
          relatedToId: id
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Call logged successfully!');
        setShowCallModal(false);
        setCallData({ subject: '', callStartTime: '', callDuration: '', callType: 'Outbound', callPurpose: 'Follow-up', callResult: 'Completed', description: '' });
        loadCalls();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to log call');
      }
    } catch (err) {
      setError('Failed to log call');
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await noteService.createNote({
        ...noteData,
        relatedTo: 'Lead',
        relatedToId: id
      });
      setSuccess('Note created successfully!');
      setShowNoteModal(false);
      setNoteData({ title: '', content: '' });
      loadNotes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create note');
    }
  };

  const openEditModal = () => {
    setFormData({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      jobTitle: lead.jobTitle || '',
      leadSource: lead.leadSource,
      leadStatus: lead.leadStatus,
      rating: lead.rating,
      industry: lead.industry || '',
      website: lead.website || '',
      description: lead.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await leadService.updateLead(lead._id, formData);
      setSuccess('Lead updated successfully!');
      setShowEditModal(false);
      loadLead();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update lead');
    }
  };

  const handleDeleteLead = async () => {
    try {
      setError('');
      await leadService.deleteLead(lead._id);
      setSuccess('Lead deleted successfully!');
      setTimeout(() => {
        navigate('/leads');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  const handleConversionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConversionData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        createAccount: conversionData.createAccount,
        createContact: conversionData.createContact,
        createOpportunity: conversionData.createOpportunity,
        accountData: conversionData.createAccount ? {
          accountName: conversionData.accountName,
          accountType: 'Customer',
          industry: lead.industry,
          website: lead.website,
          phone: lead.phone,
          email: lead.email,
          street: lead.street,
          city: lead.city,
          state: lead.state,
          country: lead.country,
          zipCode: lead.zipCode
        } : {},
        contactData: conversionData.createContact ? {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          jobTitle: lead.jobTitle
        } : {},
        opportunityData: conversionData.createOpportunity ? {
          opportunityName: conversionData.opportunityName,
          amount: parseFloat(conversionData.opportunityAmount),
          closeDate: conversionData.closeDate,
          stage: 'Qualification',
          probability: 50,
          type: 'New Business',
          leadSource: lead.leadSource
        } : {}
      };

      const response = await leadService.convertLead(lead._id, payload);

      if (response.success) {
        setSuccess('Lead converted successfully!');
        setShowConvertModal(false);
        
        if (response.data.opportunity) {
          setTimeout(() => {
            navigate(`/opportunities/${response.data.opportunity._id}`);
          }, 1500);
        } else if (response.data.account) {
          setTimeout(() => {
            navigate(`/accounts/${response.data.account._id}`);
          }, 1500);
        } else {
          loadLead();
        }
      } else {
        setError(response.message || 'Failed to convert lead');
      }
    } catch (err) {
      console.error('Convert lead error:', err);
      setError(err.response?.data?.message || 'Failed to convert lead');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const canUpdateLead = hasPermission('lead_management', 'update');
  const canDeleteLead = hasPermission('lead_management', 'delete');
  const canConvertLead = hasPermission('lead_management', 'convert');

  if (loading) {
    return (
      <DashboardLayout title="Lead Details">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '10px' }}>Loading lead...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !lead) {
    return (
      <DashboardLayout title="Lead Details">
        <div style={{ padding: '20px' }}>
          <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px' }}>
            {error}
          </div>
          <button 
            className="crm-btn crm-btn-secondary" 
            onClick={() => navigate('/leads')}
            style={{ marginTop: '20px' }}
          >
            ← Back to Leads
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return null;
  }

  const openActivities = [
    ...tasks.filter(t => t.status !== 'Completed'),
    ...meetings.filter(m => m.status === 'Scheduled'),
    ...calls.filter(c => c.callResult !== 'Completed')
  ];

  const closedActivities = [
    ...tasks.filter(t => t.status === 'Completed'),
    ...meetings.filter(m => m.status === 'Completed'),
    ...calls.filter(c => c.callResult === 'Completed')
  ];

  return (
    <DashboardLayout title="Lead Details">
      {success && (
        <div style={{ padding: '16px', background: '#DCFCE7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Lead Header */}
      <div className="crm-card" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}>
                  {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                </div>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
                    {lead.firstName} {lead.lastName}
                  </h1>
                  {lead.jobTitle && (
                    <p style={{ color: '#666', fontSize: '16px', margin: '4px 0' }}>
                      {lead.jobTitle} {lead.company && `at ${lead.company}`}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span className={`status-badge ${(lead.leadStatus || 'new').toLowerCase()}`}>
                      {lead.leadStatus || 'New'}
                    </span>
                    <span className={`rating-badge ${(lead.rating || 'warm').toLowerCase()}`}>
                      {lead.rating || 'Warm'}
                    </span>
                    {lead.isConverted && (
                      <span className="status-badge converted">
                        Converted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="crm-btn crm-btn-secondary"
                onClick={() => navigate('/leads')}
              >
                ← Back
              </button>
              {!lead.isConverted && canConvertLead && (
                <button 
                  className="crm-btn crm-btn-success"
                  onClick={() => setShowConvertModal(true)}
                >
                  🔄 Convert Lead
                </button>
              )}
              {canUpdateLead && (
                <button 
                  className="crm-btn crm-btn-primary"
                  onClick={openEditModal}
                >
                  ✏️ Edit
                </button>
              )}
              {canDeleteLead && (
                <button 
                  className="crm-btn crm-btn-danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Email</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                <a href={`mailto:${lead.email}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>
                  {lead.email}
                </a>
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Phone</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>
                    {lead.phone}
                  </a>
                ) : '-'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Company</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.company || '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Lead Source</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.leadSource || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="crm-card">
        <div className="crm-tabs">
          <button
            className={`crm-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`crm-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
          <button
            className={`crm-tab ${activeTab === 'related' ? 'active' : ''}`}
            onClick={() => setActiveTab('related')}
          >
            Related Lists
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Lead Information</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Contact Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Full Name</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.firstName} {lead.lastName}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Email</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.email}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Phone</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Website</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                            {lead.website}
                          </a>
                        ) : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Company Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Company</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.company || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Job Title</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.jobTitle || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Industry</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.industry || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Annual Revenue</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>
                        {lead.annualRevenue ? `$${lead.annualRevenue.toLocaleString()}` : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Lead Details</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Lead Status</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.leadStatus}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Lead Source</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.leadSource}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Rating</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.rating}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Lead Score</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.leadScore || 0}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Address</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Street</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.street || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>City</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>State / Country</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>
                        {lead.state && lead.country ? `${lead.state}, ${lead.country}` : lead.state || lead.country || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {lead.description && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Description</h4>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>{lead.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Activity Timeline</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <p>Timeline feature coming soon...</p>
              </div>
            </div>
          )}

          {/* Related Lists Tab */}
          {activeTab === 'related' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Related Lists</h3>
              
              {/* OPEN ACTIVITIES */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                    Open Activities ({openActivities.length})
                  </h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="crm-btn crm-btn-sm crm-btn-primary"
                      onClick={() => setShowTaskModal(true)}
                    >
                      + Task
                    </button>
                    <button 
                      className="crm-btn crm-btn-sm crm-btn-primary"
                      onClick={() => setShowMeetingModal(true)}
                    >
                      + Meeting
                    </button>
                    <button 
                      className="crm-btn crm-btn-sm crm-btn-primary"
                      onClick={() => setShowCallModal(true)}
                    >
                      + Call
                    </button>
                  </div>
                </div>
                {openActivities.length === 0 ? (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#666' }}>
                    No open activities found
                  </div>
                ) : (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                    <table className="crm-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Subject</th>
                          <th>Date/Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.filter(t => t.status !== 'Completed').map(task => (
                          <tr key={task._id}>
                            <td>📋 Task</td>
                            <td>{task.subject}</td>
                            <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                            <td><span className="status-badge">{task.status}</span></td>
                          </tr>
                        ))}
                        {meetings.filter(m => m.status === 'Scheduled').map(meeting => (
                          <tr key={meeting._id}>
                            <td>📅 Meeting</td>
                            <td>{meeting.title}</td>
                            <td>{new Date(meeting.from).toLocaleString()}</td>
                            <td><span className="status-badge">{meeting.status}</span></td>
                          </tr>
                        ))}
                        {calls.filter(c => c.callResult !== 'Completed').map(call => (
                          <tr key={call._id}>
                            <td>📞 Call</td>
                            <td>{call.subject}</td>
                            <td>{new Date(call.callStartTime).toLocaleString()}</td>
                            <td><span className="status-badge">{call.callResult}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CLOSED ACTIVITIES */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
                  Closed Activities ({closedActivities.length})
                </h4>
                {closedActivities.length === 0 ? (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#666' }}>
                    No closed activities found
                  </div>
                ) : (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                    <table className="crm-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Subject</th>
                          <th>Date/Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.filter(t => t.status === 'Completed').map(task => (
                          <tr key={task._id}>
                            <td>📋 Task</td>
                            <td>{task.subject}</td>
                            <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                            <td><span className="status-badge">Completed</span></td>
                          </tr>
                        ))}
                        {meetings.filter(m => m.status === 'Completed').map(meeting => (
                          <tr key={meeting._id}>
                            <td>📅 Meeting</td>
                            <td>{meeting.title}</td>
                            <td>{new Date(meeting.from).toLocaleString()}</td>
                            <td><span className="status-badge">Completed</span></td>
                          </tr>
                        ))}
                        {calls.filter(c => c.callResult === 'Completed').map(call => (
                          <tr key={call._id}>
                            <td>📞 Call</td>
                            <td>{call.subject}</td>
                            <td>{new Date(call.callStartTime).toLocaleString()}</td>
                            <td><span className="status-badge">Completed</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* EMAILS */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Emails</h4>
                  <button className="crm-btn crm-btn-sm crm-btn-primary">+ Compose Email</button>
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '16px', padding: '8px 16px', background: '#F9FAFB' }}>
                    <button style={{ padding: '4px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '500', borderBottom: '2px solid #3B82F6' }}>
                      Mails
                    </button>
                    <button style={{ padding: '4px 12px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#666' }}>
                      Drafts
                    </button>
                    <button style={{ padding: '4px 12px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#666' }}>
                      Scheduled
                    </button>
                  </div>
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No emails found
                  </div>
                </div>
              </div>

              {/* NOTES */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Notes ({notes.length})</h4>
                  <button 
                    className="crm-btn crm-btn-sm crm-btn-primary"
                    onClick={() => setShowNoteModal(true)}
                  >
                    + Add Note
                  </button>
                </div>
                {notes.length === 0 ? (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#666' }}>
                    No notes found
                  </div>
                ) : (
                  <div>
                    {notes.map(note => (
                      <div key={note._id} style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>{note.title}</div>
                        <div style={{ color: '#666', fontSize: '14px' }}>{note.content}</div>
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                          {new Date(note.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ATTACHMENTS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Attachments</h4>
                  <button className="crm-btn crm-btn-sm crm-btn-primary">+ Attach File</button>
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#666' }}>
                  No attachments found
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}

      {/* Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Create Task">
        <form onSubmit={handleCreateTask}>
          <div className="crm-form-group">
            <label>Subject *</label>
            <input
              type="text"
              className="crm-form-input"
              value={taskData.subject}
              onChange={(e) => setTaskData({ ...taskData, subject: e.target.value })}
              required
            />
          </div>
          <div className="crm-form-group">
            <label>Due Date *</label>
            <input
              type="date"
              className="crm-form-input"
              value={taskData.dueDate}
              onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
              required
            />
          </div>
          <div className="crm-form-group">
            <label>Priority</label>
            <select
              className="crm-form-select"
              value={taskData.priority}
              onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
            >
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="crm-form-group">
            <label>Description</label>
            <textarea
              className="crm-form-textarea"
              rows="3"
              value={taskData.description}
              onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowTaskModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Create Task</button>
          </div>
        </form>
      </Modal>

      {/* Meeting Modal */}
      <Modal isOpen={showMeetingModal} onClose={() => setShowMeetingModal(false)} title="Create Meeting">
        <form onSubmit={handleCreateMeeting}>
          <div className="crm-form-group">
            <label>Title *</label>
            <input
              type="text"
              className="crm-form-input"
              value={meetingData.title}
              onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="crm-form-group">
              <label>From *</label>
              <input
                type="datetime-local"
                className="crm-form-input"
                value={meetingData.from}
                onChange={(e) => setMeetingData({ ...meetingData, from: e.target.value })}
                required
              />
            </div>
            <div className="crm-form-group">
              <label>To *</label>
              <input
                type="datetime-local"
                className="crm-form-input"
                value={meetingData.to}
                onChange={(e) => setMeetingData({ ...meetingData, to: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="crm-form-group">
            <label>Location</label>
            <input
              type="text"
              className="crm-form-input"
              value={meetingData.location}
              onChange={(e) => setMeetingData({ ...meetingData, location: e.target.value })}
            />
          </div>
          <div className="crm-form-group">
            <label>Meeting Type</label>
            <select
              className="crm-form-select"
              value={meetingData.meetingType}
              onChange={(e) => setMeetingData({ ...meetingData, meetingType: e.target.value })}
            >
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
              <option value="Phone Call">Phone Call</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowMeetingModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Create Meeting</button>
          </div>
        </form>
      </Modal>

      {/* Call Modal */}
      <Modal isOpen={showCallModal} onClose={() => setShowCallModal(false)} title="Log Call">
        <form onSubmit={handleCreateCall}>
          <div className="crm-form-group">
            <label>Subject *</label>
            <input
              type="text"
              className="crm-form-input"
              value={callData.subject}
              onChange={(e) => setCallData({ ...callData, subject: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="crm-form-group">
              <label>Call Time *</label>
              <input
                type="datetime-local"
                className="crm-form-input"
                value={callData.callStartTime}
                onChange={(e) => setCallData({ ...callData, callStartTime: e.target.value })}
                required
              />
            </div>
            <div className="crm-form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                className="crm-form-input"
                value={callData.callDuration}
                onChange={(e) => setCallData({ ...callData, callDuration: e.target.value })}
                min="0"
              />
            </div>
          </div>
          <div className="crm-form-group">
            <label>Call Type</label>
            <select
              className="crm-form-select"
              value={callData.callType}
              onChange={(e) => setCallData({ ...callData, callType: e.target.value })}
            >
              <option value="Outbound">Outbound</option>
              <option value="Inbound">Inbound</option>
              <option value="Missed">Missed</option>
            </select>
          </div>
          <div className="crm-form-group">
            <label>Call Result</label>
            <select
              className="crm-form-select"
              value={callData.callResult}
              onChange={(e) => setCallData({ ...callData, callResult: e.target.value })}
            >
              <option value="Interested">Interested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="No Answer">No Answer</option>
              <option value="Call Back Later">Call Back Later</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="crm-form-group">
            <label>Description</label>
            <textarea
              className="crm-form-textarea"
              rows="3"
              value={callData.description}
              onChange={(e) => setCallData({ ...callData, description: e.target.value })}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowCallModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Log Call</button>
          </div>
        </form>
      </Modal>

      {/* Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Create Note">
        <form onSubmit={handleCreateNote}>
          <div className="crm-form-group">
            <label>Title *</label>
            <input
              type="text"
              className="crm-form-input"
              value={noteData.title}
              onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
              required
            />
          </div>
          <div className="crm-form-group">
            <label>Content *</label>
            <textarea
              className="crm-form-textarea"
              rows="5"
              value={noteData.content}
              onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowNoteModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Create Note</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Lead"
        size="large"
      >
        <form onSubmit={handleUpdateLead}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="crm-form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                className="crm-form-input"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="crm-form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                className="crm-form-input"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="crm-form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                className="crm-form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="crm-form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                className="crm-form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Update Lead</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Lead"
        size="small"
      >
        <div>
          <p>Are you sure you want to delete this lead?</p>
          <p style={{ marginTop: '10px', fontWeight: '600' }}>
            {lead.firstName} {lead.lastName}
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {lead.company} • {lead.email}
          </p>
          <div className="modal-footer">
            <button className="crm-btn crm-btn-secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
            <button className="crm-btn crm-btn-danger" onClick={handleDeleteLead}>
              Delete Lead
            </button>
          </div>
        </div>
      </Modal>

      {/* Convert Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title="Convert Lead"
        size="large"
      >
        <form onSubmit={handleConvertLead}>
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Name:</strong> {lead.firstName} {lead.lastName}</p>
            <p><strong>Email:</strong> {lead.email}</p>
          </div>
          <div className="crm-form-group">
            <label>
              <input
                type="checkbox"
                name="createAccount"
                checked={conversionData.createAccount}
                onChange={handleConversionChange}
              />
              {' '}Create Account
            </label>
          </div>
          {conversionData.createAccount && (
            <div className="crm-form-group">
              <label>Account Name *</label>
              <input
                type="text"
                name="accountName"
                className="crm-form-input"
                value={conversionData.accountName}
                onChange={handleConversionChange}
                required
              />
            </div>
          )}
          <div className="crm-form-group">
            <label>
              <input
                type="checkbox"
                name="createContact"
                checked={conversionData.createContact}
                onChange={handleConversionChange}
              />
              {' '}Create Contact
            </label>
          </div>
          <div className="crm-form-group">
            <label>
              <input
                type="checkbox"
                name="createOpportunity"
                checked={conversionData.createOpportunity}
                onChange={handleConversionChange}
                disabled={!conversionData.createAccount}
              />
              {' '}Create Opportunity
            </label>
          </div>
          {conversionData.createOpportunity && conversionData.createAccount && (
            <>
              <div className="crm-form-group">
                <label>Opportunity Name *</label>
                <input
                  type="text"
                  name="opportunityName"
                  className="crm-form-input"
                  value={conversionData.opportunityName}
                  onChange={handleConversionChange}
                  required
                />
              </div>
              <div className="crm-form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  name="opportunityAmount"
                  className="crm-form-input"
                  value={conversionData.opportunityAmount}
                  onChange={handleConversionChange}
                  required
                />
              </div>
            </>
          )}
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowConvertModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Convert Lead</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default LeadDetail;