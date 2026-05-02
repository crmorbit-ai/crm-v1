import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import rfiService from '../services/rfiService';
import DashboardLayout from '../components/layout/DashboardLayout';
import RFIForm from './RFIForm';
import '../styles/crm.css';

const mobileCSS = `
  @media (max-width: 768px) {
    #rfi-split-container { flex-direction: column !important; }
    #rfi-split-container > div[style*="col-resize"] { display: none !important; }
    .rfi-panel-form { flex: none !important; width: 100% !important; max-height: 60vh; overflow-y: auto; border-right: none !important; border-bottom: 1px solid #e0e0e0 !important; }
    .rfi-panel-table { flex: none !important; width: 100% !important; }
    .rfi-page-wrapper { height: auto !important; overflow: visible !important; }
  }
`;

const RFIs = () => {
  const navigate = useNavigate();
  const [rfis, setRfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [panelWidth, setPanelWidth] = useState(42);

  useEffect(() => { fetchRFIs(); }, [statusFilter]);

  const fetchRFIs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await rfiService.getRFIs(params);
      setRfis(res.data || []);
    } catch (err) {
      if (!err?.isPermissionDenied) setError(err.message || 'Failed to fetch RFIs');
    } finally { setLoading(false); }
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('rfi-split-container');
    if (!container) return;
    const startX = e.clientX, startW = panelWidth, cW = container.getBoundingClientRect().width;
    const onMove = (mv) => { const d = ((mv.clientX - startX) / cW) * 100; setPanelWidth(Math.max(25, Math.min(65, startW + d))); };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const STATUS_CFG = {
    draft:     { label: 'Draft',     color: '#64748b', bg: '#f1f5f9' },
    sent:      { label: 'Sent',      color: '#2563eb', bg: '#dbeafe' },
    responded: { label: 'Responded', color: '#0891b2', bg: '#cffafe' },
    converted: { label: 'Converted', color: '#059669', bg: '#d1fae5' },
    closed:    { label: 'Closed',    color: '#dc2626', bg: '#fee2e2' },
  };
  const PRIORITY_CFG = {
    low:    { label: 'Low',    color: '#16a34a', bg: '#dcfce7' },
    medium: { label: 'Medium', color: '#2563eb', bg: '#dbeafe' },
    high:   { label: 'High',   color: '#d97706', bg: '#fef3c7' },
    urgent: { label: 'Urgent', color: '#dc2626', bg: '#fee2e2' },
  };

  const badge = (cfg, key) => {
    const c = cfg[key] || cfg[Object.keys(cfg)[0]];
    return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{c.label}</span>;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const statCards = [
    { label: 'Total RFIs', value: rfis.length,                                                            icon: '📋' },
    { label: 'Draft',      value: rfis.filter(r => r.status === 'draft').length,                          icon: '📝' },
    { label: 'Sent',       value: rfis.filter(r => r.status === 'sent').length,                           icon: '📤' },
    { label: 'Responded',  value: rfis.filter(r => ['responded','converted'].includes(r.status)).length,  icon: '✅' },
  ];

  if (loading) return (
    <DashboardLayout title="RFIs">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Loading RFIs...</span>
      </div>
    </DashboardLayout>
  );

  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: '#f8fafc' };
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };

  return (
    <DashboardLayout title="RFIs">
      <style>{mobileCSS}</style>
      <div className="rfi-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* Fixed top: Header + Stats — never moves */}
        <div style={{ flexShrink: 0, padding: '0 16px 12px 16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)', borderRadius: '14px', padding: '18px 22px', marginBottom: '10px', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', flexShrink: 0 }}>📋</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e1b4b' }}>Request for Information</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#6366f1', fontWeight: '500', marginTop: '2px' }}>Track & manage customer information requests</p>
              </div>
            </div>
          </div>
          <div className="resp-grid-4">
            {statCards.map((s, i) => (
              <div key={i} style={{ background: '#f0f1ff', borderRadius: '12px', padding: '14px 16px', border: '1px solid #c7d2fe', boxShadow: '0 1px 6px rgba(99,102,241,0.08)', borderLeft: '4px solid #6366f1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{s.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#312e81', lineHeight: 1 }}>{s.value}</div>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Toolbar: New button + Search + Filter */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '8px 12px', marginTop: '8px', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowCreateForm(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              + New RFI
            </button>
            <div style={{ flex: '1', minWidth: '180px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', opacity: 0.45 }}>🔍</span>
              <input type="text" placeholder="Search RFIs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchRFIs()}
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', cursor: 'pointer', color: '#374151' }}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="responded">Responded</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
            <button onClick={fetchRFIs} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Search</button>
          </div>
          {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginTop: '8px', fontSize: '13px' }}>{error}</div>}
        </div>

        {/* Split panel — form left, table right */}
        <div id="rfi-split-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {showCreateForm && (
            <div className="rfi-panel-form" style={{ flex: `0 0 ${panelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <RFIForm embedded onClose={() => setShowCreateForm(false)} onSuccess={() => { setShowCreateForm(false); fetchRFIs(); }} />
            </div>
          )}
          {showCreateForm && (
            <div onMouseDown={handleDividerDrag} title="Drag to resize"
              style={{ width: '6px', flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = '#a5b4fc'}
              onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}>
              <div style={{ width: '2px', height: '40px', borderRadius: '99px', background: 'rgba(0,0,0,0.15)' }} />
            </div>
          )}
          <div style={{ flex: showCreateForm ? `0 0 ${100 - panelWidth}%` : '1 1 100%', minWidth: 0, overflowY: 'auto', padding: '0 16px 16px 12px' }}>
          {/* Table Card */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['RFI #','Customer','Title','Priority','Created','Due Date','Status','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rfis.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{ fontSize: '42px', marginBottom: '10px' }}>📋</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>No RFIs found</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Click "+ New RFI" to create your first one</div>
                    </td></tr>
                  ) : rfis.map(rfi => (
                    <tr key={rfi._id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <td style={tdStyle}><Link to={`/rfi/${rfi._id}`} style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none' }}>{rfi.rfiNumber}</Link></td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{rfi.customerName || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{rfi.customerEmail || ''}</div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '180px' }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>{rfi.title}</div></td>
                      <td style={tdStyle}>{badge(PRIORITY_CFG, rfi.priority)}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(rfi.createdAt)}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(rfi.dueDate)}</td>
                      <td style={tdStyle}>{badge(STATUS_CFG, rfi.status)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => navigate(`/rfi/${rfi._id}`)} title="View" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>👁️</button>
                          {rfi.status === 'draft' && <>
                            <button onClick={() => navigate(`/rfi/${rfi._id}/edit`)} title="Edit" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                            <button onClick={async () => { if(window.confirm(`Delete ${rfi.rfiNumber}?`)) { try { await rfiService.deleteRFI(rfi._id); fetchRFIs(); } catch(e) { alert(e.message); } }}} title="Delete" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rfis.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #f8fafc', background: '#fafbff' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Showing <strong style={{ color: '#374151' }}>{rfis.length}</strong> RFI{rfis.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};


export default RFIs;
