import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import supportService from '../services/supportService';
import '../styles/crm.css';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Create ticket form
  const [newTicket, setNewTicket] = useState({
    summary: '',
    description: '',
    category: 'Other',
    priority: 'Medium'
  });

  // Message form
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filters, pagination.page]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await supportService.getAllTickets({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      setTickets(response.data?.tickets || []);
      setPagination(response.data?.pagination || pagination);
    } catch (error) {
      console.error('Error loading tickets:', error);
      alert('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    if (!newTicket.summary || !newTicket.description) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await supportService.createTicket(newTicket);
      alert('Ticket created successfully!');
      setShowCreateForm(false);
      setNewTicket({ summary: '', description: '', category: 'Other', priority: 'Medium' });
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert(error.message || 'Failed to create ticket');
    }
  };

  const handleViewTicket = async (ticket) => {
    try {
      const response = await supportService.getTicket(ticket._id);
      setSelectedTicket(response.data || response);
    } catch (error) {
      console.error('Error loading ticket:', error);
      alert('Failed to load ticket details');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      setSendingMessage(true);
      const response = await supportService.addMessage(selectedTicket._id, newMessage);
      setSelectedTicket(response.data || response);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': '#ef4444',
      'In Progress': '#f59e0b',
      'Waiting for Customer': '#3b82f6',
      'Resolved': '#10b981',
      'Closed': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': '#10b981',
      'Medium': '#f59e0b',
      'High': '#ef4444',
      'Critical': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Lead Management': '📋',
      'Account Management': '🏢',
      'Contact Management': '👤',
      'Data Center': '💾',
      'Email/SMS Issues': '✉️',
      'Product Purchase': '🛒',
      'User Management': '👥',
      'Performance Issue': '⚡',
      'Bug Report': '🐛',
      'Feature Request': '💡',
      'Other': '📌'
    };
    return icons[category] || '📌';
  };

  return (
    <DashboardLayout title="Support Center">
      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        {/* Action Bar */}
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e3c72' }}>Support Center</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Need help? Create a support ticket and our team will assist you.</p>
            </div>
            <button className="crm-btn crm-btn-primary" onClick={() => { setShowCreateForm(true); setSelectedTicket(null); }}>+ Create New Ticket</button>
          </div>
        </div>

        {/* Inline Create Ticket Form */}
        {showCreateForm && (
          <div className="crm-card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Create New Support Ticket</h3>
              <button onClick={() => setShowCreateForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ padding: '16px' }}>
              <form onSubmit={handleCreateTicket}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Summary *</label>
                    <input type="text" className="crm-form-input" placeholder="Brief summary of the issue" value={newTicket.summary} onChange={(e) => setNewTicket({ ...newTicket, summary: e.target.value })} required maxLength={200} style={{ padding: '8px 10px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Category</label>
                    <select className="crm-form-select" value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px' }}>
                      <option value="Lead Management">Lead Management</option>
                      <option value="Account Management">Account Management</option>
                      <option value="Contact Management">Contact Management</option>
                      <option value="Data Center">Data Center</option>
                      <option value="Email/SMS Issues">Email/SMS Issues</option>
                      <option value="Product Purchase">Product Purchase</option>
                      <option value="User Management">User Management</option>
                      <option value="Performance Issue">Performance Issue</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Priority</label>
                    <select className="crm-form-select" value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px' }}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description *</label>
                    <textarea className="crm-form-input" placeholder="Detailed description of the issue" value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} rows={4} required style={{ padding: '8px 10px', fontSize: '13px', resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                  <button type="button" className="crm-btn crm-btn-outline" onClick={() => setShowCreateForm(false)}>Cancel</button>
                  <button type="submit" className="crm-btn crm-btn-primary">Create Ticket</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inline Ticket Detail View */}
        {selectedTicket && (
          <div className="crm-card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#667eea', fontFamily: 'monospace', background: 'rgba(102, 126, 234, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>{selectedTicket.ticketNumber}</span>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: getStatusColor(selectedTicket.status), color: 'white' }}>{selectedTicket.status}</span>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: getPriorityColor(selectedTicket.priority), color: 'white' }}>{selectedTicket.priority}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{getCategoryIcon(selectedTicket.category)}</span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>{selectedTicket.category}</span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1e3c72' }}>{selectedTicket.summary}</h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{selectedTicket.description}</p>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Created: {new Date(selectedTicket.createdAt).toLocaleString()} by {selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName}</div>
              </div>

              {/* Messages Thread */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#1e3c72' }}>Messages ({selectedTicket.messages?.length || 0})</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '12px' }}>
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((msg, index) => (
                      <div key={index} style={{ marginBottom: '12px', padding: '12px', borderRadius: '8px', background: msg.senderType === 'SAAS_ADMIN' ? 'rgba(102, 126, 234, 0.1)' : '#f9fafb', border: msg.senderType === 'SAAS_ADMIN' ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontWeight: '600', color: '#1e3c72', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {msg.sender?.firstName} {msg.sender?.lastName}
                            {msg.senderType === 'SAAS_ADMIN' && <span style={{ padding: '2px 6px', borderRadius: '10px', fontSize: '10px', background: '#667eea', color: 'white', fontWeight: '700' }}>Support</span>}
                          </span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(msg.sentAt).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb' }}>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px' }}>No messages yet</p>
                    </div>
                  )}
                </div>

                {/* Add Message Form */}
                {selectedTicket.status !== 'Closed' && (
                  <form onSubmit={handleSendMessage}>
                    <textarea className="crm-form-input" placeholder="Type your message here..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={2} required style={{ padding: '8px 10px', fontSize: '13px', resize: 'vertical', marginBottom: '8px' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="crm-btn crm-btn-primary" disabled={sendingMessage}>{sendingMessage ? 'Sending...' : 'Send Message'}</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <input type="text" placeholder="Search tickets..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="crm-form-input" style={{ padding: '10px 12px', fontSize: '13px' }} />
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="crm-form-select" style={{ padding: '10px 12px', fontSize: '13px' }}>
                <option value="">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Customer">Waiting for Customer</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="crm-form-select" style={{ padding: '10px 12px', fontSize: '13px' }}>
                <option value="">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="crm-form-select" style={{ padding: '10px 12px', fontSize: '13px' }}>
                <option value="">All Categories</option>
                <option value="Lead Management">Lead Management</option>
                <option value="Account Management">Account Management</option>
                <option value="Contact Management">Contact Management</option>
                <option value="Data Center">Data Center</option>
                <option value="Email/SMS Issues">Email/SMS Issues</option>
                <option value="Product Purchase">Product Purchase</option>
                <option value="User Management">User Management</option>
                <option value="Performance Issue">Performance Issue</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="crm-card" style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>Loading your tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="crm-card" style={{ padding: isMobile ? '40px 20px' : '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎫</div>
            <h3 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#1e3c72', marginBottom: '12px' }}>No Tickets Yet</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Create your first support ticket to get help from our team</p>
            <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateForm(true)}>Create Your First Ticket</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))' }}>
            {tickets.map((ticket) => (
              <div key={ticket._id} className="crm-card" onClick={() => handleViewTicket(ticket)} style={{ cursor: 'pointer', padding: '20px', transition: 'all 0.2s', border: selectedTicket?._id === ticket._id ? '2px solid #667eea' : '1px solid #e5e7eb' }}>
                {/* Ticket Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{getCategoryIcon(ticket.category)}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#667eea', fontFamily: 'monospace', background: 'rgba(102, 126, 234, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>{ticket.ticketNumber}</span>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', background: getPriorityColor(ticket.priority), color: 'white' }}>{ticket.priority}</span>
                </div>

                {/* Ticket Title */}
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3c72', marginBottom: '8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ticket.summary}</h3>

                {/* Ticket Description */}
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ticket.description}</p>

                {/* Ticket Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f0f0f0', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#9ca3af' }}>
                    <span>💬 {ticket.messages?.length || 0}</span>
                    <span>📅 {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: getStatusColor(ticket.status), color: 'white' }}>{ticket.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <button className="crm-btn crm-btn-outline" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>Previous</button>
            <span style={{ padding: '10px 20px', color: '#374151', fontWeight: '600', display: 'flex', alignItems: 'center' }}>Page {pagination.page} of {pagination.pages}</span>
            <button className="crm-btn crm-btn-outline" disabled={pagination.page === pagination.pages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>Next</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Support;
