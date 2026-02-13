import React, { useState, useEffect, useCallback } from 'react';
import supportService from '../services/supportService';
import SaasLayout, { StatCard, Card, Badge, Button, Select, DetailPanel, InfoRow } from '../components/layout/SaasLayout';

const SupportAdmin = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = { ...filters, page: pagination.page, limit: pagination.limit };
      const response = await supportService.getAllTickets(params);
      setTickets(response.data?.tickets || []);
      setPagination(response.data?.pagination || pagination);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const loadStats = useCallback(async () => {
    try {
      const response = await supportService.getStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filters, pagination.page, loadTickets, loadStats]);

  const loadTicketDetails = async (ticketId) => {
    try {
      const response = await supportService.getTicket(ticketId);
      setSelectedTicket(response.data || response);
    } catch (error) {
      console.error('Error loading ticket details:', error);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return;
    try {
      await supportService.updateStatus(selectedTicket._id, status);
      loadTicketDetails(selectedTicket._id);
      loadTickets();
      loadStats();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedTicket) return;
    try {
      await supportService.assignTicket(selectedTicket._id);
      loadTicketDetails(selectedTicket._id);
      loadTickets();
    } catch (error) {
      alert('Error assigning ticket');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      await supportService.addMessage(selectedTicket._id, newMessage, isInternalNote);
      setNewMessage('');
      setIsInternalNote(false);
      loadTicketDetails(selectedTicket._id);
    } catch (error) {
      alert('Error sending message');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return;
    try {
      await supportService.deleteTicket(ticketId);
      setSelectedTicket(null);
      loadTickets();
      loadStats();
    } catch (error) {
      alert('Error closing ticket');
    }
  };

  const getStatusVariant = (status) => {
    const map = { 'Open': 'danger', 'In Progress': 'warning', 'Waiting for Customer': 'info', 'Resolved': 'success', 'Closed': 'default' };
    return map[status] || 'default';
  };

  const getPriorityVariant = (priority) => {
    const map = { 'Low': 'success', 'Medium': 'warning', 'High': 'danger', 'Critical': 'danger' };
    return map[priority] || 'default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Calculate stats
  const statCounts = {
    open: stats.byStatus?.Open || 0,
    inProgress: stats.byStatus?.['In Progress'] || 0,
    resolved: stats.byStatus?.Resolved || 0,
    waiting: stats.byStatus?.['Waiting for Customer'] || 0,
    total: stats.overall?.total || 0
  };

  // Handle status filter from stats click
  const handleStatsFilter = (status) => {
    setFilters(prev => ({ ...prev, status }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <SaasLayout title="Support Dashboard">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <StatCard
          icon="📊"
          value={statCounts.total}
          label="Total"
          onClick={() => handleStatsFilter('')}
          active={filters.status === ''}
        />
        <StatCard
          icon="🔴"
          value={statCounts.open}
          label="Open"
          onClick={() => handleStatsFilter('Open')}
          active={filters.status === 'Open'}
        />
        <StatCard
          icon="⚡"
          value={statCounts.inProgress}
          label="In Progress"
          onClick={() => handleStatsFilter('In Progress')}
          active={filters.status === 'In Progress'}
        />
        <StatCard
          icon="✅"
          value={statCounts.resolved}
          label="Resolved"
          onClick={() => handleStatsFilter('Resolved')}
          active={filters.status === 'Resolved'}
        />
      </div>

      {/* Main Content - Split View */}
      <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 280px)', minHeight: '500px' }}>
        {/* Left Panel */}
        <div style={{ flex: selectedTicket ? '0 0 55%' : '1', display: 'flex', flexDirection: 'column' }}>
          {/* Filters */}
          <Card>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'end', flexWrap: 'wrap' }}>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'Open', label: 'Open' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Waiting for Customer', label: 'Waiting' },
                  { value: 'Resolved', label: 'Resolved' },
                  { value: 'Closed', label: 'Closed' }
                ]}
                style={{ marginBottom: 0, minWidth: '120px' }}
              />
              <Select
                label="Priority"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                options={[
                  { value: '', label: 'All Priorities' },
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Critical', label: 'Critical' }
                ]}
                style={{ marginBottom: 0, minWidth: '120px' }}
              />
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#475569', marginBottom: '4px' }}>Search</label>
                <input
                  type="text"
                  placeholder="Ticket # or summary..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px' }}
                />
              </div>
              <Button size="small" onClick={loadTickets}>Refresh</Button>
              {(filters.status || filters.priority || filters.search) && (
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => {
                    setFilters({ status: '', priority: '', category: '', search: '' });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  style={{ color: '#dc2626' }}
                >
                  ✕ Clear
                </Button>
              )}
            </div>
          </Card>

          {/* Tickets List */}
          <Card
            title={`Tickets (${tickets.length})`}
            action={
              pagination.pages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Button size="small" variant="secondary" onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}>Prev</Button>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{pagination.page}/{pagination.pages}</span>
                  <Button size="small" variant="secondary" onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.pages}>Next</Button>
                </div>
              )
            }
            noPadding
            style={{ flex: 1, marginTop: '12px', overflow: 'hidden' }}
          >
            <div style={{ height: '100%', overflow: 'auto' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
              ) : tickets.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎫</div>
                  <div style={{ fontSize: '12px' }}>No tickets found</div>
                </div>
              ) : (
                <div>
                  {tickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      onClick={() => loadTicketDetails(ticket._id)}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: selectedTicket?._id === ticket._id ? '#eff6ff' : 'transparent',
                        borderLeft: selectedTicket?._id === ticket._id ? '3px solid #3b82f6' : '3px solid transparent',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { if (selectedTicket?._id !== ticket._id) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { if (selectedTicket?._id !== ticket._id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', fontFamily: 'monospace' }}>
                          {ticket.ticketNumber}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                          <Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '4px', lineHeight: 1.3 }}>
                        {ticket.summary}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {ticket.tenant?.organizationName || 'N/A'} • {formatDate(ticket.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Detail */}
        {selectedTicket && (
          <DetailPanel title={selectedTicket.ticketNumber} onClose={() => setSelectedTicket(null)}>
            {/* Header */}
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700', color: '#1e293b', lineHeight: 1.3 }}>
                {selectedTicket.summary}
              </h3>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Badge variant={getStatusVariant(selectedTicket.status)}>{selectedTicket.status}</Badge>
                <Badge variant={getPriorityVariant(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                <Badge variant="default">{selectedTicket.category}</Badge>
              </div>
            </div>

            {/* Ticket Info */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Details</h4>
              <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '10px' }}>
                <InfoRow label="Tenant" value={selectedTicket.tenant?.organizationName} />
                <InfoRow label="Created By" value={`${selectedTicket.createdBy?.firstName} ${selectedTicket.createdBy?.lastName}`} />
                <InfoRow label="Created" value={formatDate(selectedTicket.createdAt)} />
                <InfoRow label="Assigned To" value={selectedTicket.assignedTo ? `${selectedTicket.assignedTo.firstName} ${selectedTicket.assignedTo.lastName}` : 'Unassigned'} />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Description</h4>
              <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {selectedTicket.description}
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Actions</h4>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {!selectedTicket.assignedTo && (
                  <Button size="small" onClick={handleAssignToMe}>Assign to Me</Button>
                )}
                {selectedTicket.status === 'Open' && (
                  <Button size="small" variant="secondary" onClick={() => handleUpdateStatus('In Progress')}>Start</Button>
                )}
                {selectedTicket.status === 'In Progress' && (
                  <>
                    <Button size="small" variant="secondary" onClick={() => handleUpdateStatus('Waiting for Customer')}>Wait</Button>
                    <Button size="small" variant="success" onClick={() => handleUpdateStatus('Resolved')}>Resolve</Button>
                  </>
                )}
                {selectedTicket.status === 'Waiting for Customer' && (
                  <Button size="small" variant="secondary" onClick={() => handleUpdateStatus('In Progress')}>Resume</Button>
                )}
                {selectedTicket.status === 'Resolved' && (
                  <Button size="small" variant="secondary" onClick={() => handleUpdateStatus('Closed')}>Close</Button>
                )}
                <Button size="small" variant="danger" onClick={() => handleDeleteTicket(selectedTicket._id)}>Force Close</Button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Messages ({selectedTicket.messages?.length || 0})
              </h4>
              <div style={{ maxHeight: '200px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedTicket.messages?.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '6px', fontSize: '11px', color: '#64748b' }}>
                    No messages yet
                  </div>
                ) : (
                  selectedTicket.messages.map((msg, idx) => (
                    <div key={idx} style={{
                      padding: '10px',
                      borderRadius: '6px',
                      background: msg.senderType === 'SAAS_ADMIN' ? '#eff6ff' : '#f8fafc',
                      border: msg.senderType === 'SAAS_ADMIN' ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{msg.sender?.firstName} {msg.sender?.lastName}</span>
                          {msg.senderType === 'SAAS_ADMIN' && <Badge variant="info">Admin</Badge>}
                          {msg.isInternal && <Badge variant="warning">Internal</Badge>}
                        </div>
                        <span style={{ color: '#64748b' }}>{formatDate(msg.sentAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#374151', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendMessage}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} />
                  Internal Note (admin only)
                </label>
              </div>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isInternalNote ? "Add internal note..." : "Type your reply..."}
                required
                rows={3}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', resize: 'vertical', marginBottom: '8px' }}
              />
              <Button style={{ width: '100%' }}>Send Message</Button>
            </form>
          </DetailPanel>
        )}
      </div>
    </SaasLayout>
  );
};

export default SupportAdmin;
