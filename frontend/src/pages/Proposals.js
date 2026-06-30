import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import proposalService from '../services/proposalService';
import DashboardLayout from '../components/layout/DashboardLayout';
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

  useEffect(() => { fetchProposals(); }, [statusFilter]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
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
                    {['Proposal #','Customer','Title','Amount','Date','Expiry','Status','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {proposals.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px' }}>
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
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => navigate(`/proposals/${q._id}`)} title="View" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>👁️</button>
                          {q.status === 'draft' && <>
                            <button onClick={() => navigate(`/proposals/${q._id}/edit`)} title="Edit" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                            <button onClick={() => handleDelete(q._id, q.proposalNumber)} title="Delete" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                          </>}
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
    </DashboardLayout>
  );
};


export default Proposals;
