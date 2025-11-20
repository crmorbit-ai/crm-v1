import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import '../styles/crm.css';
import { API_URL } from '../config/api.config';

const Calls = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        setShowCreateModal(false);
        setFormData({ subject: '', callStartTime: '', callDuration: '', callType: 'Outbound', callPurpose: 'Follow-up', callResult: 'Completed', relatedTo: 'Lead', relatedToId: '', description: '' });
        loadCalls();
        setTimeout(() => setSuccess(''), 3000);
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
    <DashboardLayout
      title="Calls"
      actionButton={
        <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateModal(true)}>
          + Log Call
        </button>
      }
    >
      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

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

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Log Call">
        <form onSubmit={handleCreate}>
          <div className="crm-form-group">
            <label>Subject *</label>
            <input type="text" className="crm-form-input" value={formData.subject} 
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="crm-form-group">
              <label>Call Time *</label>
              <input type="datetime-local" className="crm-form-input" value={formData.callStartTime}
                onChange={(e) => setFormData({ ...formData, callStartTime: e.target.value })} required />
            </div>
            <div className="crm-form-group">
              <label>Duration (min)</label>
              <input type="number" className="crm-form-input" value={formData.callDuration}
                onChange={(e) => setFormData({ ...formData, callDuration: e.target.value })} min="0" />
            </div>
          </div>
          <div className="crm-form-group">
            <label>Call Type</label>
            <select className="crm-form-select" value={formData.callType}
              onChange={(e) => setFormData({ ...formData, callType: e.target.value })}>
              <option value="Outbound">Outbound</option>
              <option value="Inbound">Inbound</option>
              <option value="Missed">Missed</option>
            </select>
          </div>
          <div className="crm-form-group">
            <label>Call Result</label>
            <select className="crm-form-select" value={formData.callResult}
              onChange={(e) => setFormData({ ...formData, callResult: e.target.value })}>
              <option value="Interested">Interested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="No Answer">No Answer</option>
              <option value="Call Back Later">Call Back Later</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="crm-form-group">
            <label>Description</label>
            <textarea className="crm-form-textarea" rows="3" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary">Log Call</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Calls;