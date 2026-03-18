import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import quotationService from '../services/quotationService';
import DashboardLayout from '../components/layout/DashboardLayout';
import QuotationForm from './QuotationForm';
import '../styles/crm.css';

const Quotations = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [panelWidth, setPanelWidth] = useState(42);

  useEffect(() => { fetchQuotations(); }, [statusFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const response = await quotationService.getQuotations(params);
      setQuotations(response.data || []);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.message || 'Failed to fetch quotations');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, quotationNumber) => {
    if (window.confirm(`Delete quotation ${quotationNumber}?`)) {
      try { await quotationService.deleteQuotation(id); fetchQuotations(); }
      catch (err) { if (!err?.isPermissionDenied) alert(err.message || 'Failed to delete'); }
    }
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('quotations-split-container');
    if (!container) return;
    const startX = e.clientX, startW = panelWidth, cW = container.getBoundingClientRect().width;
    const onMove = (mv) => { const d = ((mv.clientX - startX) / cW) * 100; setPanelWidth(Math.max(25, Math.min(65, startW + d))); };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
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

  const totalValue = quotations.reduce((s, q) => s + (q.totalAmount || 0), 0);
  const statCards = [
    { label: 'Total Quotations', value: quotations.length,                                                                       icon: '💰' },
    { label: 'Total Value',      value: fmtCur(totalValue),                                                                     icon: '💵', small: true },
    { label: 'Accepted',         value: quotations.filter(q => q.status === 'accepted').length,                                  icon: '✅' },
    { label: 'Pending',          value: quotations.filter(q => ['draft','sent','viewed'].includes(q.status)).length,             icon: '⏳' },
  ];

  if (loading) return (
    <DashboardLayout title="Quotations">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#10b981', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Loading Quotations...</span>
      </div>
    </DashboardLayout>
  );

  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: '#f8fafc' };
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };

  return (
    <DashboardLayout title="Quotations">
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* Fixed top: Header + Stats — never moves */}
        <div style={{ flexShrink: 0, padding: '0 16px 12px 16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderRadius: '14px', padding: '18px 22px', marginBottom: '10px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', flexShrink: 0 }}>💰</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#064e3b' }}>Quotations</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#10b981', fontWeight: '500', marginTop: '2px' }}>Create & manage price quotations for customers</p>
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
            <button onClick={() => setShowCreateForm(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              + New Quotation
            </button>
            <div style={{ flex: '1', minWidth: '180px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', opacity: 0.45 }}>🔍</span>
              <input type="text" placeholder="Search quotations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchQuotations()}
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
            <button onClick={fetchQuotations} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Search</button>
          </div>
          {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginTop: '8px', fontSize: '13px' }}>{error}</div>}
        </div>

        {/* Split panel — form left, table right */}
        <div id="quotations-split-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {showCreateForm && (
            <div style={{ flex: `0 0 ${panelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <QuotationForm embedded onClose={() => setShowCreateForm(false)} onSuccess={() => { setShowCreateForm(false); fetchQuotations(); }} />
            </div>
          )}
          {showCreateForm && (
            <div onMouseDown={handleDividerDrag} title="Drag to resize"
              style={{ width: '6px', flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = '#6ee7b7'}
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
                    {['Quotation #','Customer','Title','Amount','Date','Expiry','Status','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {quotations.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{ fontSize: '42px', marginBottom: '10px' }}>💰</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>No quotations found</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Click "+ New Quotation" to create your first one</div>
                    </td></tr>
                  ) : quotations.map(q => (
                    <tr key={q._id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0fdf9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <td style={tdStyle}><Link to={`/quotations/${q._id}`} style={{ color: '#10b981', fontWeight: '700', textDecoration: 'none' }}>{q.quotationNumber}</Link></td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{q.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{q.customerEmail}</div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '180px' }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>{q.title}</div></td>
                      <td style={{ ...tdStyle, fontWeight: '700', color: '#059669' }}>{fmtCur(q.totalAmount)}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(q.quotationDate)}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(q.expiryDate)}</td>
                      <td style={tdStyle}>{badge(q.status)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => navigate(`/quotations/${q._id}`)} title="View" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>👁️</button>
                          {q.status === 'draft' && <>
                            <button onClick={() => navigate(`/quotations/${q._id}/edit`)} title="Edit" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                            <button onClick={() => handleDelete(q._id, q.quotationNumber)} title="Delete" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {quotations.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #f8fafc', background: '#f0fdf9' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Showing <strong style={{ color: '#374151' }}>{quotations.length}</strong> quotation{quotations.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};


export default Quotations;
