import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import purchaseOrderService from '../services/purchaseOrderService';
import DashboardLayout from '../components/layout/DashboardLayout';
import PurchaseOrderForm from './PurchaseOrderForm';
import '../styles/crm.css';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [panelWidth, setPanelWidth] = useState(42);

  useEffect(() => { fetchPurchaseOrders(); }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const response = await purchaseOrderService.getPurchaseOrders(params);
      setPurchaseOrders(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch purchase orders');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, poNumber) => {
    if (window.confirm(`Delete PO ${poNumber}?`)) {
      try { await purchaseOrderService.deletePurchaseOrder(id); fetchPurchaseOrders(); }
      catch (err) { alert(err.message || 'Failed to delete'); }
    }
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('po-split-container');
    if (!container) return;
    const startX = e.clientX, startW = panelWidth, cW = container.getBoundingClientRect().width;
    const onMove = (mv) => { const d = ((mv.clientX - startX) / cW) * 100; setPanelWidth(Math.max(25, Math.min(65, startW + d))); };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const STATUS_CFG = {
    draft:       { label: 'Draft',       color: '#64748b', bg: '#f1f5f9' },
    received:    { label: 'Received',    color: '#2563eb', bg: '#dbeafe' },
    approved:    { label: 'Approved',    color: '#059669', bg: '#d1fae5' },
    in_progress: { label: 'In Progress', color: '#0891b2', bg: '#cffafe' },
    completed:   { label: 'Completed',   color: '#16a34a', bg: '#dcfce7' },
    cancelled:   { label: 'Cancelled',   color: '#dc2626', bg: '#fee2e2' },
  };

  const badge = (key) => {
    const c = STATUS_CFG[key] || STATUS_CFG.draft;
    return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{c.label}</span>;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtCur = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(v || 0);

  const totalValue = purchaseOrders.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const statCards = [
    { label: 'Total POs',   value: purchaseOrders.length,                                               icon: '📦' },
    { label: 'Total Value', value: fmtCur(totalValue),                                                  icon: '💵', small: true },
    { label: 'In Progress', value: purchaseOrders.filter(p => p.status === 'in_progress').length,       icon: '⚙️' },
    { label: 'Completed',   value: purchaseOrders.filter(p => p.status === 'completed').length,         icon: '✅' },
  ];

  if (loading) return (
    <DashboardLayout title="Purchase Orders">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#f59e0b', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Loading Purchase Orders...</span>
      </div>
    </DashboardLayout>
  );

  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: '#f8fafc' };
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };

  return (
    <DashboardLayout title="Purchase Orders">
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* Fixed top: Header + Stats — never moves */}
        <div style={{ flexShrink: 0, padding: '0 16px 12px 16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderRadius: '14px', padding: '18px 22px', marginBottom: '10px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(245,158,11,0.3)', flexShrink: 0 }}>📦</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#78350f' }}>Purchase Orders</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#d97706', fontWeight: '500', marginTop: '2px' }}>Manage & track customer purchase orders</p>
              </div>
            </div>
          </div>
          <div className="resp-grid-4">
            {statCards.map((s, i) => (
              <div key={i} style={{ background: '#fffbf0', borderRadius: '12px', padding: '14px 16px', border: '1px solid #fcd34d', boxShadow: '0 1px 6px rgba(245,158,11,0.08)', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#d97706', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{s.label}</div>
                    <div style={{ fontSize: s.small ? '14px' : '24px', fontWeight: '800', color: '#78350f', lineHeight: 1 }}>{s.value}</div>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Toolbar: New button + Search + Filter */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '8px 12px', marginTop: '8px', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowCreateForm(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(245,158,11,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              + New Purchase Order
            </button>
            <div style={{ flex: '1', minWidth: '180px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', opacity: 0.45 }}>🔍</span>
              <input type="text" placeholder="Search purchase orders..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPurchaseOrders()}
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', cursor: 'pointer', color: '#374151' }}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="received">Received</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={fetchPurchaseOrders} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Search</button>
          </div>
          {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginTop: '8px', fontSize: '13px' }}>{error}</div>}
        </div>

        {/* Split panel — form left, table right */}
        <div id="po-split-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {showCreateForm && (
            <div style={{ flex: `0 0 ${panelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <PurchaseOrderForm embedded onClose={() => setShowCreateForm(false)} onSuccess={() => { setShowCreateForm(false); fetchPurchaseOrders(); }} />
            </div>
          )}
          {showCreateForm && (
            <div onMouseDown={handleDividerDrag} title="Drag to resize"
              style={{ width: '6px', flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = '#fcd34d'}
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
                    {['PO #','Customer PO #','Customer','Title','Amount','PO Date','Delivery','Status','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.length === 0 ? (
                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{ fontSize: '42px', marginBottom: '10px' }}>📦</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>No purchase orders found</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Click "+ New Purchase Order" to create your first one</div>
                    </td></tr>
                  ) : purchaseOrders.map(po => (
                    <tr key={po._id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fffdf5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <td style={tdStyle}><Link to={`/purchase-orders/${po._id}`} style={{ color: '#d97706', fontWeight: '700', textDecoration: 'none' }}>{po.poNumber}</Link></td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: '#374151' }}>{po.customerPONumber || '—'}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{po.customerName || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{po.customerEmail || ''}</div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '160px' }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>{po.title}</div></td>
                      <td style={{ ...tdStyle, fontWeight: '700', color: '#d97706' }}>{fmtCur(po.totalAmount)}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(po.poDate)}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(po.deliveryDate)}</td>
                      <td style={tdStyle}>{badge(po.status)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => navigate(`/purchase-orders/${po._id}`)} title="View" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>👁️</button>
                          {po.status === 'draft' && <>
                            <button onClick={() => navigate(`/purchase-orders/${po._id}/edit`)} title="Edit" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                            <button onClick={() => handleDelete(po._id, po.poNumber)} title="Delete" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {purchaseOrders.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #f8fafc', background: '#fffdf0' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Showing <strong style={{ color: '#374151' }}>{purchaseOrders.length}</strong> purchase order{purchaseOrders.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};


export default PurchaseOrders;
