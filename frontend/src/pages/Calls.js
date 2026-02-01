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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setCalls(data.data.calls || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  return (
    <DashboardLayout title="Calls">
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
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Log New Call</h3>
            <button onClick={() => setShowCreateForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Subject *</label>
                  <input type="text" className="crm-form-input" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Call Time *</label>
                  <input type="datetime-local" className="crm-form-input" value={formData.callStartTime} onChange={(e) => setFormData({ ...formData, callStartTime: e.target.value })} required style={{ padding: '8px 10px', fontSize: '13px' }} />
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
                <div style={{ gridColumn: 'span 4' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                  <textarea className="crm-form-input" rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px', resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline" onClick={() => setShowCreateForm(false)}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary">Log Call</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="crm-card">
        <div className="crm-card-header">
          <h2>All Calls ({calls.length})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : calls.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>No calls found</div>
        ) : (
          <table className="crm-table">
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
                <tr key={call._id} onClick={() => navigate(`/calls/${call._id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: '500', color: '#3B82F6' }}>{call.subject}</td>
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
                  <td onClick={e => e.stopPropagation()}>
                    <button className="crm-btn crm-btn-sm crm-btn-primary">View</button>
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

export default Calls;
