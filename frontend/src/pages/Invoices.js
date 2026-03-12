import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import invoiceService from '../services/invoiceService';
import DashboardLayout from '../components/layout/DashboardLayout';
import InvoiceForm from './InvoiceForm';
import '../styles/crm.css';

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [apiStats, setApiStats] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [panelWidth, setPanelWidth] = useState(42);

  useEffect(() => { fetchInvoices(); fetchStats(); }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const response = await invoiceService.getInvoices(params);
      setInvoices(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices');
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try { const r = await invoiceService.getStats(); setApiStats(r.data?.overall || null); }
    catch { /* silent */ }
  };

  const handleDelete = async (id, invoiceNumber) => {
    if (window.confirm(`Delete invoice ${invoiceNumber}?`)) {
      try { await invoiceService.deleteInvoice(id); fetchInvoices(); fetchStats(); }
      catch (err) { alert(err.message || 'Failed to delete'); }
    }
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('invoices-split-container');
    if (!container) return;
    const startX = e.clientX, startW = panelWidth, cW = container.getBoundingClientRect().width;
    const onMove = (mv) => { const d = ((mv.clientX - startX) / cW) * 100; setPanelWidth(Math.max(25, Math.min(65, startW + d))); };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const STATUS_CFG = {
    draft:          { label: 'Draft',    color: '#64748b', bg: '#f1f5f9' },
    sent:           { label: 'Sent',     color: '#2563eb', bg: '#dbeafe' },
    partially_paid: { label: 'Partial',  color: '#d97706', bg: '#fef3c7' },
    paid:           { label: 'Paid',     color: '#059669', bg: '#d1fae5' },
    overdue:        { label: 'Overdue',  color: '#dc2626', bg: '#fee2e2' },
    cancelled:      { label: 'Cancelled',color: '#64748b', bg: '#f1f5f9' },
  };

  const badge = (key) => {
    const c = STATUS_CFG[key] || STATUS_CFG.draft;
    return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{c.label}</span>;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtCur = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(v || 0);

  const statCards = [
    { label: 'Total Invoices', value: apiStats?.totalInvoices ?? invoices.length,  icon: '🧾' },
    { label: 'Total Billed',   value: fmtCur(apiStats?.totalAmount),               icon: '💵', small: true },
    { label: 'Total Paid',     value: fmtCur(apiStats?.totalPaid),                 icon: '✅', small: true },
    { label: 'Balance Due',    value: fmtCur(apiStats?.totalDue),                  icon: '⚠️', small: true },
  ];

  if (loading) return (
    <DashboardLayout title="Invoices">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Loading Invoices...</span>
      </div>
    </DashboardLayout>
  );

  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: '#f8fafc' };
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };

  return (
    <DashboardLayout title="Invoices">
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* Fixed top: Header + Stats — never moves */}
        <div style={{ flexShrink: 0, padding: '0 16px 12px 16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '14px', padding: '18px 22px', marginBottom: '10px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', flexShrink: 0 }}>🧾</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e3a8a' }}>Invoices</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6', fontWeight: '500', marginTop: '2px' }}>Manage invoices, payments & outstanding dues</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            {statCards.map((s, i) => (
              <div key={i} style={{ background: '#f0f6ff', borderRadius: '12px', padding: '14px 16px', border: '1px solid #93c5fd', boxShadow: '0 1px 6px rgba(59,130,246,0.08)', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{s.label}</div>
                    <div style={{ fontSize: s.small ? '13px' : '24px', fontWeight: '800', color: '#1e3a8a', lineHeight: 1 }}>{s.value}</div>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Toolbar: New button + Search + Filter */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '8px 12px', marginTop: '8px', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowCreateForm(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              + New Invoice
            </button>
            <div style={{ flex: '1', minWidth: '180px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', opacity: 0.45 }}>🔍</span>
              <input type="text" placeholder="Search invoices..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchInvoices()}
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', cursor: 'pointer', color: '#374151' }}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={fetchInvoices} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Search</button>
          </div>
          {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginTop: '8px', fontSize: '13px' }}>{error}</div>}
        </div>

        {/* Split panel — form left, table right */}
        <div id="invoices-split-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {showCreateForm && (
            <div style={{ flex: `0 0 ${panelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <InvoiceForm embedded onClose={() => setShowCreateForm(false)} onSuccess={() => { setShowCreateForm(false); fetchInvoices(); fetchStats(); }} />
            </div>
          )}
          {showCreateForm && (
            <div onMouseDown={handleDividerDrag} title="Drag to resize"
              style={{ width: '6px', flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = '#93c5fd'}
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
                    {['Invoice #','Customer','Title','Amount','Paid','Balance Due','Date','Due Date','Status','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan="10" style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{ fontSize: '42px', marginBottom: '10px' }}>🧾</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>No invoices found</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Click "+ New Invoice" to create your first one</div>
                    </td></tr>
                  ) : invoices.map(inv => (
                    <tr key={inv._id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f5f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <td style={tdStyle}><Link to={`/invoices/${inv._id}`} style={{ color: '#3b82f6', fontWeight: '700', textDecoration: 'none' }}>{inv.invoiceNumber}</Link></td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{inv.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{inv.customerEmail}</div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '160px' }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>{inv.title}</div></td>
                      <td style={{ ...tdStyle, fontWeight: '700', color: '#374151' }}>{fmtCur(inv.totalAmount)}</td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: '#059669' }}>{fmtCur(inv.totalPaid)}</td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: inv.balanceDue > 0 ? '#dc2626' : '#64748b' }}>{fmtCur(inv.balanceDue)}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(inv.invoiceDate)}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(inv.dueDate)}</td>
                      <td style={tdStyle}>{badge(inv.status)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => navigate(`/invoices/${inv._id}`)} title="View" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>👁️</button>
                          {inv.status !== 'paid' && <button onClick={() => navigate(`/invoices/${inv._id}/edit`)} title="Edit" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>✏️</button>}
                          {inv.status === 'draft' && inv.payments?.length === 0 && (
                            <button onClick={() => handleDelete(inv._id, inv.invoiceNumber)} title="Delete" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invoices.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #f8fafc', background: '#f5f9ff' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Showing <strong style={{ color: '#374151' }}>{invoices.length}</strong> invoice{invoices.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};


export default Invoices;
