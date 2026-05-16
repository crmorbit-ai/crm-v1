import React, { useState, useEffect, useCallback } from 'react';
import SaasLayout from '../components/layout/SaasLayout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config/api.config';

const STATUS = {
  completed: { label: 'Paid',     color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  refunded:  { label: 'Refunded', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  created:   { label: 'Created',  color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)' },
};

const fmt    = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtM   = v => `₹${Number(v||0).toLocaleString('en-IN')}`;
const getHdr = token => ({ headers: { Authorization: `Bearer ${token}` } });

export default function SaasRefunds() {
  const { token } = useAuth();
  const [payments, setPayments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [selected, setSelected]   = useState(null); // payment for refund modal
  const [refundAmt, setRefundAmt] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast]         = useState({ msg: '', ok: true });

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (search) params.append('search', search);
      const res = await axios.get(`${API_URL}/subscriptions/all-payments?${params}`, getHdr(token));
      setPayments(res.data?.data?.payments || []);
    } catch { setPayments([]); }
    finally { setLoading(false); }
  }, [token, filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  const openRefund = (p) => {
    setSelected(p);
    setRefundAmt(p.amount?.toString() || '');
    setRefundNote('');
  };

  const handleRefund = async () => {
    if (!selected) return;
    const amt = parseFloat(refundAmt);
    if (!amt || amt <= 0) { showToast('Enter valid amount', false); return; }
    if (amt > selected.amount) { showToast(`Cannot exceed ₹${selected.amount}`, false); return; }

    setProcessing(true);
    try {
      await axios.post(`${API_URL}/subscriptions/refund`,
        { paymentId: selected._id, amount: amt, reason: refundNote || 'Admin initiated refund' },
        getHdr(token)
      );
      showToast(`Refund of ₹${amt} processed successfully`);
      setSelected(null);
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Refund failed', false);
    } finally { setProcessing(false); }
  };

  const stats = {
    total:    payments.length,
    paid:     payments.filter(p => p.status === 'completed').length,
    refunded: payments.filter(p => p.status === 'refunded').length,
    revenue:  payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0),
  };

  return (
    <SaasLayout title="Refunds & Payments">
      <style>{`
        .rf-card{background:#fff;border:1px solid #e8edf2;border-radius:12px;overflow:hidden;}
        .rf-tbl{width:100%;border-collapse:collapse;}
        .rf-tbl th{background:#f8fafc;padding:10px 14px;font-size:11px;font-weight:700;color:#64748b;text-align:left;border-bottom:1px solid #e8edf2;text-transform:uppercase;letter-spacing:0.5px;}
        .rf-tbl td{padding:12px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9;}
        .rf-tbl tr:last-child td{border-bottom:none;}
        .rf-tbl tr:hover td{background:#f8fafc;}
        .rf-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;}
        .rf-btn{padding:6px 14px;border-radius:7px;border:none;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;transition:all .2s;}
        .rf-input{width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s;}
        .rf-input:focus{border-color:#6366f1;}
        @media(max-width:768px){.rf-hide{display:none!important;}.rf-tbl th,.rf-tbl td{padding:8px 10px;font-size:12px;}}
      `}</style>

      {/* Toast */}
      {toast.msg && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast.ok ? '#10b981' : '#ef4444', color:'#fff', padding:'12px 20px', borderRadius:10, fontWeight:700, fontSize:13, boxShadow:'0 4px 20px rgba(0,0,0,0.15)' }}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:24 }}>
        {[
          { label:'Total Transactions', value: stats.total,                color:'#6366f1' },
          { label:'Paid',               value: stats.paid,                 color:'#10b981' },
          { label:'Refunded',           value: stats.refunded,             color:'#f59e0b' },
          { label:'Total Revenue',      value: fmtM(stats.revenue),        color:'#0ea5e9' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid #e8edf2', borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#64748b', fontWeight:500, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input className="rf-input" style={{ maxWidth:260 }} placeholder="Search by org name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rf-input" style={{ maxWidth:160 }} value={filterStatus} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="completed">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="created">Created</option>
        </select>
      </div>

      {/* Table */}
      <div className="rf-card">
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Loading payments...</div>
        ) : payments.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>No payments found</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="rf-tbl">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th className="rf-hide">Plan</th>
                  <th>Amount</th>
                  <th className="rf-hide">Billing</th>
                  <th>Status</th>
                  <th className="rf-hide">Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const st = STATUS[p.status] || STATUS.created;
                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight:600, color:'#111827' }}>{p.tenant?.organizationName || '—'}</div>
                        <div style={{ fontSize:11, color:'#9ca3af' }}>{p.tenant?.contactEmail || ''}</div>
                      </td>
                      <td className="rf-hide">{p.planName || p.plan?.name || '—'}</td>
                      <td style={{ fontWeight:700, color:'#111827' }}>{fmtM(p.amount)}</td>
                      <td className="rf-hide" style={{ textTransform:'capitalize' }}>{p.billingCycle || '—'}</td>
                      <td>
                        <span className="rf-badge" style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
                          {st.label}
                          {p.status === 'refunded' && p.amountRefunded ? ` (₹${p.amountRefunded})` : ''}
                        </span>
                      </td>
                      <td className="rf-hide" style={{ color:'#6b7280', fontSize:12 }}>{fmt(p.paidAt || p.createdAt)}</td>
                      <td>
                        {p.status === 'completed' ? (
                          <button className="rf-btn"
                            style={{ background:'#fef3c7', color:'#92400e' }}
                            onClick={() => openRefund(p)}>
                            Issue Refund
                          </button>
                        ) : (
                          <span style={{ fontSize:12, color:'#9ca3af' }}>
                            {p.status === 'refunded' ? `Refunded ${fmt(p.updatedAt)}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin:'0 0 4px', fontSize:18, fontWeight:700, color:'#111827' }}>Issue Refund</h3>
            <p style={{ margin:'0 0 20px', fontSize:13, color:'#6b7280' }}>
              {selected.tenant?.organizationName} — {selected.planName} Plan
            </p>

            <div style={{ background:'#f8fafc', borderRadius:8, padding:'12px 16px', marginBottom:20, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, color:'#374151' }}>Payment ID</span>
              <span style={{ fontSize:12, color:'#6b7280', fontFamily:'monospace' }}>{selected.gatewayTransactionId?.slice(0,20) || '—'}</span>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>
                Refund Amount (max ₹{selected.amount})
              </label>
              <input className="rf-input" type="number" value={refundAmt}
                onChange={e => setRefundAmt(e.target.value)}
                placeholder={`Max ₹${selected.amount}`} />
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>
                Reason (optional)
              </label>
              <textarea className="rf-input" rows={3} value={refundNote}
                onChange={e => setRefundNote(e.target.value)}
                placeholder="e.g. Customer requested cancellation" style={{ resize:'vertical' }} />
            </div>

            <div style={{ background:'#fef3c7', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:12, color:'#92400e' }}>
              ⚠️ Refund of <strong>₹{refundAmt || 0}</strong> will be processed via Razorpay. This cannot be undone.
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="rf-btn" style={{ flex:1, background:'#f1f5f9', color:'#374151', padding:'10px' }}
                onClick={() => setSelected(null)} disabled={processing}>
                Cancel
              </button>
              <button className="rf-btn" style={{ flex:1, background: processing ? '#fde68a' : '#f59e0b', color:'#fff', padding:'10px' }}
                onClick={handleRefund} disabled={processing}>
                {processing ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SaasLayout>
  );
}
