import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import supportService from '../services/supportService';
import '../styles/crm.css';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [panelWidth, setPanelWidth] = useState(38);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const [newTicket, setNewTicket] = useState({
    summary: '', description: '', category: 'Other', priority: 'Medium'
  });

  const CATEGORIES = ['Lead Management','Account Management','Contact Management','Data Center','Email/SMS Issues','Product Purchase','User Management','Performance Issue','Bug Report','Feature Request','Other'];

  useEffect(() => { loadTickets(); }, [filters, pagination.page]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await supportService.getAllTickets({ ...filters, page: pagination.page, limit: pagination.limit });
      setTickets(response.data?.tickets || []);
      setPagination(prev => ({ ...prev, ...(response.data?.pagination || {}) }));
    } catch (err) {
      if (!err?.isPermissionDenied) setError('Failed to load tickets');
    } finally { setLoading(false); }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await supportService.createTicket(newTicket);
      setSuccess('Ticket created!');
      setShowCreateForm(false);
      setNewTicket({ summary: '', description: '', category: 'Other', priority: 'Medium' });
      loadTickets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (!err?.isPermissionDenied) { setError(err.message || 'Failed to create ticket'); setTimeout(() => setError(''), 4000); }
    }
  };

  const handleViewTicket = async (ticket) => {
    try {
      const response = await supportService.getTicket(ticket._id);
      setSelectedTicket(response.data || response);
      setShowCreateForm(false);
    } catch { setError('Failed to load ticket details'); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      setSendingMessage(true);
      const response = await supportService.addMessage(selectedTicket._id, newMessage);
      setSelectedTicket(response.data || response);
      setNewMessage('');
    } catch { setError('Failed to send message'); }
    finally { setSendingMessage(false); }
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('support-split-container');
    if (!container) return;
    const startX = e.clientX, startW = panelWidth, cW = container.getBoundingClientRect().width;
    const onMove = (mv) => { const d = ((mv.clientX - startX) / cW) * 100; setPanelWidth(Math.max(25, Math.min(60, startW + d))); };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const getStatusCfg = (s) => ({
    'Open':                 { color: '#dc2626', bg: '#fee2e2' },
    'In Progress':          { color: '#d97706', bg: '#fef3c7' },
    'Waiting for Customer': { color: '#2563eb', bg: '#dbeafe' },
    'Resolved':             { color: '#059669', bg: '#d1fae5' },
    'Closed':               { color: '#64748b', bg: '#f1f5f9' },
  }[s] || { color: '#64748b', bg: '#f1f5f9' });

  const getPriorityCfg = (p) => ({
    'Low':      { color: '#059669', bg: '#d1fae5' },
    'Medium':   { color: '#d97706', bg: '#fef3c7' },
    'High':     { color: '#dc2626', bg: '#fee2e2' },
    'Critical': { color: '#7c3aed', bg: '#ede9fe' },
  }[p] || { color: '#64748b', bg: '#f1f5f9' });

  const getCategoryIcon = (c) => ({
    'Lead Management': '📋', 'Account Management': '🏢', 'Contact Management': '👤',
    'Data Center': '💾', 'Email/SMS Issues': '✉️', 'Product Purchase': '🛒',
    'User Management': '👥', 'Performance Issue': '⚡', 'Bug Report': '🐛',
    'Feature Request': '💡', 'Other': '📌'
  }[c] || '📌');

  const badge = (label, cfg) => (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>{label}</span>
  );

  const open = tickets.filter(t => t.status === 'Open').length;
  const inProgress = tickets.filter(t => t.status === 'In Progress').length;
  const resolved = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;

  const statCards = [
    { label: 'Total Tickets', value: tickets.length, icon: '🎫', bg: '#eff6ff', border: '#93c5fd', left: '#3b82f6', labelColor: '#2563eb', valColor: '#1e3a8a', iconBg: '#dbeafe' },
    { label: 'Open',          value: open,           icon: '🔴', bg: '#fff1f2', border: '#fda4af', left: '#f43f5e', labelColor: '#e11d48', valColor: '#881337', iconBg: '#ffe4e6' },
    { label: 'In Progress',   value: inProgress,     icon: '🔄', bg: '#fff7ed', border: '#fdba74', left: '#f97316', labelColor: '#ea580c', valColor: '#7c2d12', iconBg: '#ffedd5' },
    { label: 'Resolved',      value: resolved,       icon: '✅', bg: '#f0fdfa', border: '#99f6e4', left: '#14b8a6', labelColor: '#0d9488', valColor: '#134e4a', iconBg: '#ccfbf1' },
  ];

  const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: '#f8fafc' };
  const tdStyle = { padding: '11px 14px', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

  if (loading) return (
    <DashboardLayout title="Support Center">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#f97316', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Loading Tickets...</span>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Support Center">
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* Fixed top */}
        <div style={{ flexShrink: 0, padding: '0 16px 10px 16px' }}>

          {/* Header banner */}
          <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderRadius: '14px', padding: '16px 22px', marginBottom: '10px', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)', flexShrink: 0 }}>🎫</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#7c2d12' }}>Support Center</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#f97316', fontWeight: '500', marginTop: '2px' }}>Create tickets & track support requests with our team</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="resp-grid-4">
            {statCards.map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: '12px', padding: '12px 16px', border: `1px solid ${s.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.left}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: s.labelColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: s.valColor, lineHeight: 1 }}>{s.value}</div>
                  </div>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '8px 12px', marginTop: '8px', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => { setShowCreateForm(true); setSelectedTicket(null); }}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(249,115,22,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              + Create Ticket
            </button>
            <div style={{ flex: '1', minWidth: '180px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', opacity: 0.45 }}>🔍</span>
              <input type="text" placeholder="Search tickets..." value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && loadTickets()}
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', cursor: 'pointer', color: '#374151' }}>
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for Customer">Waiting for Customer</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', cursor: 'pointer', color: '#374151' }}>
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            {success && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>✓ {success}</span>}
            {error && <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>{error}</span>}
          </div>
        </div>

        {/* Split panel */}
        <div id="support-split-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Left: Create Ticket Form */}
          {showCreateForm && (
            <div style={{ flex: `0 0 ${panelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <div style={{ background: 'linear-gradient(135deg, #431407 0%, #9a3412 100%)', flexShrink: 0, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#f97316,#fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🎫</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>New Support Ticket</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Fill in the details below</div>
                  </div>
                </div>
                <button onClick={() => setShowCreateForm(false)}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '7px', padding: '5px 9px', color: 'white', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <form onSubmit={handleCreateTicket}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Summary *</label>
                    <input type="text" value={newTicket.summary} onChange={e => setNewTicket({ ...newTicket, summary: e.target.value })} required
                      placeholder="Brief summary of the issue"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#f97316'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Category</label>
                      <select value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Priority</label>
                      <select value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}>
                        <option value="Low">🟢 Low</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="High">🔴 High</option>
                        <option value="Critical">🟣 Critical</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Description *</label>
                    <textarea value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })} rows="6" required
                      placeholder="Detailed description of the issue..."
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                      onFocus={e => e.target.style.borderColor = '#f97316'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <button type="button" onClick={() => setShowCreateForm(false)}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit"
                      style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#9a3412 0%,#f97316 100%)', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}>
                      🎫 Create Ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Divider */}
          {showCreateForm && (
            <div onMouseDown={handleDividerDrag} title="Drag to resize"
              style={{ width: '6px', flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = '#fed7aa'}
              onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}>
              <div style={{ width: '2px', height: '40px', borderRadius: '99px', background: 'rgba(0,0,0,0.15)' }} />
            </div>
          )}

          {/* Right: Ticket List or Detail */}
          <div style={{ flex: showCreateForm ? `0 0 ${100 - panelWidth}%` : '1 1 100%', minWidth: 0, overflowY: 'auto', padding: '0 16px 16px 12px' }}>

            {selectedTicket ? (
              /* Ticket Detail */
              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', padding: '14px 18px', borderBottom: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#ea580c', fontFamily: 'monospace', background: 'rgba(249,115,22,0.1)', padding: '4px 10px', borderRadius: '8px' }}>{selectedTicket.ticketNumber}</span>
                    {badge(selectedTicket.status, getStatusCfg(selectedTicket.status))}
                    {badge(selectedTicket.priority, getPriorityCfg(selectedTicket.priority))}
                  </div>
                  <button onClick={() => setSelectedTicket(null)}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #fed7aa', background: 'white', color: '#ea580c', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>← Back to List</button>
                </div>
                <div style={{ padding: '18px' }}>
                  <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>{getCategoryIcon(selectedTicket.category)}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f8fafc', padding: '2px 8px', borderRadius: '6px' }}>{selectedTicket.category}</span>
                    </div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{selectedTicket.summary}</h3>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>{selectedTicket.description}</p>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Created: {new Date(selectedTicket.createdAt).toLocaleString()} · By {selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName}</div>
                  </div>

                  <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Messages ({selectedTicket.messages?.length || 0})</h4>
                  <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTicket.messages?.length > 0 ? selectedTicket.messages.map((msg, i) => (
                      <div key={i} style={{ padding: '10px 12px', borderRadius: '10px', background: msg.senderType === 'SAAS_ADMIN' ? '#fff7ed' : '#f8fafc', border: msg.senderType === 'SAAS_ADMIN' ? '1px solid #fed7aa' : '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {msg.sender?.firstName} {msg.sender?.lastName}
                            {msg.senderType === 'SAAS_ADMIN' && <span style={{ padding: '1px 6px', borderRadius: '8px', fontSize: '9px', background: '#f97316', color: 'white', fontWeight: '700' }}>Support</span>}
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(msg.sentAt).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, color: '#475569', fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.message}</p>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0', fontSize: '12px', color: '#94a3b8' }}>No messages yet. Be the first to reply.</div>
                    )}
                  </div>

                  {selectedTicket.status !== 'Closed' && (
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} rows="2" required
                        placeholder="Type your reply..."
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', resize: 'none', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#f97316'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                      <button type="submit" disabled={sendingMessage}
                        style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {sendingMessage ? '...' : '📤 Send'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              /* Tickets Table */
              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {tickets.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '42px', marginBottom: '10px' }}>🎫</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>No tickets found</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Click "+ Create Ticket" to raise your first support request</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                          {['Ticket #','Summary','Category','Priority','Status','Messages','Created','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map(ticket => (
                          <tr key={ticket._id} style={{ transition: 'background 0.1s', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            onClick={() => handleViewTicket(ticket)}>
                            <td style={tdStyle}>
                              <span style={{ color: '#ea580c', fontWeight: '700', fontFamily: 'monospace', fontSize: '12px', background: 'rgba(249,115,22,0.08)', padding: '3px 8px', borderRadius: '6px' }}>{ticket.ticketNumber}</span>
                            </td>
                            <td style={{ ...tdStyle, maxWidth: '200px' }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600', color: '#1e293b' }}>{ticket.summary}</div>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>{getCategoryIcon(ticket.category)} {ticket.category}</span>
                            </td>
                            <td style={tdStyle}>{badge(ticket.priority, getPriorityCfg(ticket.priority))}</td>
                            <td style={tdStyle}>{badge(ticket.status, getStatusCfg(ticket.status))}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>
                              <span style={{ fontSize: '12px' }}>💬 {ticket.messages?.length || 0}</span>
                            </td>
                            <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap', fontSize: '12px' }}>
                              {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={tdStyle}>
                              <button onClick={e => { e.stopPropagation(); handleViewTicket(ticket); }} title="View"
                                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fed7aa', background: '#fff7ed', cursor: 'pointer', fontSize: '13px' }}>👁️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {tickets.length > 0 && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid #f8fafc', background: '#fff7ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Showing <strong style={{ color: '#374151' }}>{tickets.length}</strong> ticket{tickets.length !== 1 ? 's' : ''}</span>
                    {pagination.pages > 1 && (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}
                          style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: pagination.page === 1 ? 'default' : 'pointer', fontSize: '12px', color: '#374151', opacity: pagination.page === 1 ? 0.5 : 1 }}>← Prev</button>
                        <span style={{ padding: '5px 8px', fontSize: '12px', color: '#64748b' }}>{pagination.page} / {pagination.pages}</span>
                        <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.pages}
                          style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: pagination.page === pagination.pages ? 'default' : 'pointer', fontSize: '12px', color: '#374151', opacity: pagination.page === pagination.pages ? 0.5 : 1 }}>Next →</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;
