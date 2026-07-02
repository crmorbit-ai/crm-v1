import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import proposalService from '../services/proposalService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
// import ProposalForm from './ProposalForm'; // TODO: Create ProposalForm
import '../styles/crm.css';

const mobileCSS = `
  @media (max-width: 768px) {
    #proposals-split-container { flex-direction: column !important; }
    #proposals-split-container > div[style*="col-resize"] { display: none !important; }
    .prop-panel-form { flex: none !important; width: 100% !important; max-height: 60vh; overflow-y: auto; border-right: none !important; border-bottom: 1px solid #e0e0e0 !important; }
    .prop-panel-table { flex: none !important; width: 100% !important; }
    .prop-page-wrapper { height: auto !important; overflow: visible !important; }
  }
`;

const Proposals = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [assigningProposal, setAssigningProposal] = useState(null);
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'assigned'
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingProposal, setReviewingProposal] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState(''); // 'approved' or 'rejected'

  useEffect(() => { fetchProposals(); }, [statusFilter, activeTab]);

  const fetchProposals = async () => {
    try {
      setLoading(true);

      // If assigned tab, fetch assigned proposals
      if (activeTab === 'assigned') {
        const response = await fetch(`${API_URL}/proposals/assigned/me`, {
          headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success) {
          setProposals(data.data || []);
        }
        setLoading(false);
        return;
      }

      // Otherwise fetch my proposals
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const response = await proposalService.getProposals(params);
      setProposals(response.data || []);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.message || 'Failed to fetch proposals');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, proposalNumber) => {
    if (window.confirm(`Delete proposal ${proposalNumber}?`)) {
      try { await proposalService.deleteProposal(id); fetchProposals(); }
      catch (err) { if (!err?.isPermissionDenied) alert(err.message || 'Failed to delete'); }
    }
  };

  const handleAssignClick = async (proposal) => {
    setAssigningProposal(proposal);
    try {
      const response = await fetch(`${API_URL}/proposals/managers/list`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setManagers(data.data);
        setShowAssignModal(true);
      }
    } catch (err) {
      alert('Failed to load managers');
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedManager) {
      alert('Please select a manager');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/proposals/${assigningProposal._id}/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assignedTo: selectedManager })
      });

      const data = await response.json();

      if (data.success) {
        alert('Proposal assigned successfully!');
        setShowAssignModal(false);
        setSelectedManager('');
        setAssigningProposal(null);
        fetchProposals(); // Refresh list
      } else {
        throw new Error(data.message || 'Assignment failed');
      }
    } catch (err) {
      alert(err.message || 'Failed to assign proposal');
    }
  };

  const handleReviewClick = (proposal, action) => {
    setReviewingProposal(proposal);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    try {
      const response = await fetch(`${API_URL}/proposals/${reviewingProposal._id}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reviewStatus: reviewAction,
          reviewNotes: reviewNotes || ''
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Proposal ${reviewAction === 'approved' ? 'approved' : 'rejected'} successfully!`);
        setShowReviewModal(false);
        setReviewNotes('');
        setReviewingProposal(null);
        setReviewAction('');
        fetchProposals(); // Refresh list
      } else {
        throw new Error(data.message || 'Review failed');
      }
    } catch (err) {
      alert(err.message || 'Failed to review proposal');
    }
  };

  const STATUS_CFG = {
    draft:    { label: 'Draft',    color: '#64748b', bg: '#f1f5f9' },
    sent:     { label: 'Sent',     color: '#2563eb', bg: '#dbeafe' },
    viewed:   { label: 'Viewed',   color: '#0891b2', bg: '#cffafe' },
    accepted: { label: 'Accepted', color: '#059669', bg: '#d1fae5' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2' },
    expired:  { label: 'Expired',  color: '#d97706', bg: '#fef3c7' },
  };

  const badge = (key) => {
    const c = STATUS_CFG[key] || STATUS_CFG.draft;
    return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{c.label}</span>;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtCur = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(v || 0);

  const totalValue = proposals.reduce((s, q) => s + (q.totalAmount || 0), 0);
  const statCards = [
    { label: 'Total Proposals', value: proposals.length,                                                                       icon: '💰' },
    { label: 'Total Value',      value: fmtCur(totalValue),                                                                     icon: '💵', small: true },
    { label: 'Accepted',         value: proposals.filter(q => q.status === 'accepted').length,                                  icon: '✅' },
    { label: 'Pending',          value: proposals.filter(q => ['draft','sent','viewed'].includes(q.status)).length,             icon: '⏳' },
  ];

  if (loading) return (
    <DashboardLayout title="Proposals">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#10b981', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Loading Proposals...</span>
      </div>
    </DashboardLayout>
  );

  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 };
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };

  return (
    <DashboardLayout title="Proposals">
      <style>{mobileCSS}</style>
      <div className="prop-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* Fixed top: Header + Stats — never moves */}
        <div style={{ flexShrink: 0, padding: '0 16px 12px 16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderRadius: '14px', padding: '18px 22px', marginBottom: '10px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', flexShrink: 0 }}>💰</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#064e3b' }}>Proposals</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#10b981', fontWeight: '500', marginTop: '2px' }}>Create & manage price proposals for customers</p>
              </div>
            </div>
          </div>
          <div className="resp-grid-4">
            {statCards.map((s, i) => (
              <div key={i} style={{ background: '#f0fdf8', borderRadius: '12px', padding: '14px 16px', border: '1px solid #6ee7b7', boxShadow: '0 1px 6px rgba(16,185,129,0.08)', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{s.label}</div>
                    <div style={{ fontSize: s.small ? '14px' : '24px', fontWeight: '800', color: '#064e3b', lineHeight: 1 }}>{s.value}</div>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0' }}>
            <button
              onClick={() => setActiveTab('my')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'my' ? '3px solid #10b981' : '3px solid transparent',
                color: activeTab === 'my' ? '#10b981' : '#64748b',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              📋 My Proposals
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'assigned' ? '3px solid #8b5cf6' : '3px solid transparent',
                color: activeTab === 'assigned' ? '#8b5cf6' : '#64748b',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              👤 Assigned to Me
            </button>
          </div>

          {/* Toolbar: New button + Search + Filter */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '8px 12px', marginTop: '8px', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => navigate('/proposals/new')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              + New Proposal
            </button>
            <div style={{ flex: '1', minWidth: '180px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', opacity: 0.45 }}>🔍</span>
              <input type="text" placeholder="Search proposals..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchProposals()}
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', cursor: 'pointer', color: '#374151' }}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
            <button onClick={(e) => {
              e.preventDefault();
              if (!searchTerm.trim()) return;
              fetchProposals();
            }} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Search</button>
          </div>
          {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginTop: '8px', fontSize: '13px' }}>{error}</div>}
        </div>

        {/* Table Section */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
          {/* Table Card */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Proposal #','Customer','Title','Amount','Date','Expiry','Status','Review Status','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {proposals.length === 0 ? (
                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{ fontSize: '42px', marginBottom: '10px' }}>💰</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>No proposals found</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Click "+ New Proposal" to create your first one</div>
                    </td></tr>
                  ) : proposals.map(q => (
                    <tr key={q._id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0fdf9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <td style={tdStyle}><Link to={`/proposals/${q._id}`} style={{ color: '#10b981', fontWeight: '700', textDecoration: 'none' }}>{q.proposalNumber}</Link></td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{q.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{q.customerEmail}</div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '180px' }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>{q.title}</div></td>
                      <td style={{ ...tdStyle, fontWeight: '700', color: '#059669' }}>{fmtCur(q.totalAmount)}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(q.proposalDate)}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(q.expiryDate)}</td>
                      <td style={tdStyle}>{badge(q.status)}</td>
                      <td style={tdStyle}>
                        {q.reviewStatus ? (
                          <div>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '10px',
                              fontWeight: '700',
                              background: q.reviewStatus === 'approved' ? '#d1fae5' : q.reviewStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                              color: q.reviewStatus === 'approved' ? '#065f46' : q.reviewStatus === 'rejected' ? '#991b1b' : '#92400e',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap'
                            }}>
                              {q.reviewStatus === 'approved' ? '✓ Approved' : q.reviewStatus === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                            </span>
                            {q.reviewNotes && (
                              <div style={{
                                marginTop: '6px',
                                padding: '6px 8px',
                                background: '#f8fafc',
                                borderLeft: '3px solid ' + (q.reviewStatus === 'approved' ? '#10b981' : '#ef4444'),
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: '#64748b',
                                maxWidth: '200px',
                                lineHeight: '1.4'
                              }}>
                                <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', marginBottom: '2px', textTransform: 'uppercase' }}>Notes:</div>
                                {q.reviewNotes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button onClick={() => navigate(`/proposals/${q._id}`)} title="View" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>👁️</button>

                          {/* Show different buttons based on tab */}
                          {activeTab === 'my' ? (
                            <>
                              <button onClick={() => handleAssignClick(q)} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>Assign</button>
                              {q.status === 'draft' && <>
                                <button onClick={() => navigate(`/proposals/${q._id}/edit`)} title="Edit" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                                <button onClick={() => handleDelete(q._id, q.proposalNumber)} title="Delete" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                              </>}
                            </>
                          ) : (
                            <>
                              {/* Review buttons for assigned proposals */}
                              {q.reviewStatus === 'pending' && (
                                <>
                                  <button onClick={() => handleReviewClick(q, 'approved')} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>✓ Approve</button>
                                  <button onClick={() => handleReviewClick(q, 'rejected')} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>✗ Reject</button>
                                </>
                              )}
                              {q.reviewStatus && q.reviewStatus !== 'pending' && (
                                <span style={{
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  background: q.reviewStatus === 'approved' ? '#d1fae5' : '#fee2e2',
                                  color: q.reviewStatus === 'approved' ? '#065f46' : '#991b1b'
                                }}>
                                  {q.reviewStatus === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {proposals.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #f8fafc', background: '#f0fdf9' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Showing <strong style={{ color: '#374151' }}>{proposals.length}</strong> proposal{proposals.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Assign to Manager
              </h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedManager('');
                  setAssigningProposal(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>

            {assigningProposal && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Proposal:</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{assigningProposal.proposalNumber}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{assigningProposal.title}</div>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                Select Manager <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Select Manager --</option>
                {managers.map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedManager('');
                  setAssigningProposal(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={!selectedManager}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: !selectedManager ? '#cbd5e1' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: !selectedManager ? 'not-allowed' : 'pointer'
                }}
              >
                ✓ Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {reviewAction === 'approved' ? '✓ Approve Proposal' : '✗ Reject Proposal'}
              </h2>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewNotes('');
                  setReviewingProposal(null);
                  setReviewAction('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>

            {reviewingProposal && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Proposal:</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{reviewingProposal.proposalNumber}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{reviewingProposal.title}</div>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                Review Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any comments or feedback..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewNotes('');
                  setReviewingProposal(null);
                  setReviewAction('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: reviewAction === 'approved'
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {reviewAction === 'approved' ? '✓ Approve' : '✗ Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};


export default Proposals;
