import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/api.config';
import SaasLayout, { Badge, DetailPanel, InfoRow, useWindowSize } from '../components/layout/SaasLayout';

const AV = [
  ['#6366f1','#818cf8'], ['#f59e0b','#fbbf24'], ['#10b981','#34d399'],
  ['#0ea5e9','#38bdf8'], ['#ec4899','#f472b6'], ['#8b5cf6','#a78bfa'],
  ['#f43f5e','#fb7185'], ['#14b8a6','#2dd4bf'],
];
const avG = n => { const i = (n?.charCodeAt(0) || 0) % AV.length; return `linear-gradient(135deg,${AV[i][0]},${AV[i][1]})`; };
const avC = n => AV[(n?.charCodeAt(0) || 0) % AV.length][0];

const STATUS = {
  approved: { label: 'Approved', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  pending:  { label: 'Pending',  color: '#d97706', bg: '#fef9c3', border: '#fde68a' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
  suspended:{ label: 'Suspended',color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = v => { const n = Number(v || 0); return n >= 1000 ? `₹${(n/1000).toFixed(1)}k` : `₹${n}`; };

const ResellerManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useWindowSize();
  const [allResellers, setAllResellers] = useState([]);
  const [selectedReseller, setSelectedReseller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [actionData, setActionData] = useState({ status: '', commissionRate: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchResellers(); }, []);

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && s !== filterStatus) setFilterStatus(s);
  }, [searchParams]);

  useEffect(() => { setCurrentPage(1); }, [filterStatus, searchTerm]);

  const fetchResellers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/resellers`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAllResellers(data.data.resellers || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchDetail = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/resellers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSelectedReseller(data.data);
    } catch (e) { console.error(e); }
  };

  const handleStatusFilter = (s) => {
    setFilterStatus(s);
    s !== 'all' ? setSearchParams({ status: s }) : setSearchParams({});
  };

  const handleStatusUpdate = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/resellers/${selectedReseller.reseller._id}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionData.status }),
      });
      if ((await res.json()).success) { setShowModal(false); fetchResellers(); setSelectedReseller(null); }
    } catch { alert('Failed'); }
    finally { setActionLoading(false); }
  };

  const handleCommissionUpdate = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/resellers/${selectedReseller.reseller._id}/commission`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: parseFloat(actionData.commissionRate) }),
      });
      if ((await res.json()).success) { setShowModal(false); fetchDetail(selectedReseller.reseller._id); }
    } catch { alert('Failed'); }
    finally { setActionLoading(false); }
  };

  const stats = {
    total:     allResellers.length,
    approved:  allResellers.filter(r => r.status === 'approved').length,
    pending:   allResellers.filter(r => r.status === 'pending').length,
    suspended: allResellers.filter(r => r.status === 'suspended').length,
  };

  const filtered = allResellers.filter(r => {
    const ms = filterStatus === 'all' || r.status === filterStatus;
    const q  = searchTerm.toLowerCase();
    const mq = !q || `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) || r.companyName?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
    return ms && mq;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated  = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const FILTERS = [
    { k: 'all',       label: 'All',       count: stats.total },
    { k: 'approved',  label: 'Approved',  count: stats.approved },
    { k: 'pending',   label: 'Pending',   count: stats.pending },
    { k: 'suspended', label: 'Suspended', count: stats.suspended },
  ];

  return (
    <SaasLayout title="Reseller Management">
      <style>{`
        .rItem { display:flex; align-items:center; gap:12px; padding:11px 16px; border-bottom:1px solid #f1f5f9; cursor:pointer; transition:background 0.12s; }
        .rItem:last-child { border-bottom:none; }
        .rItem:hover { background:#f8fafc; }
        .rItem.rSel { background:#eff6ff; border-left:3px solid #6366f1; }
        .rItem:not(.rSel) { border-left:3px solid transparent; }
        .rFBtn { padding:5px 13px; border-radius:20px; font-size:11px; font-weight:600; cursor:pointer; border:1.5px solid #e2e8f0; background:#fff; color:#64748b; transition:all 0.13s; white-space:nowrap; }
        .rFBtn:hover { border-color:#6366f1; color:#6366f1; }
        .rFBtn.on { background:#6366f1; color:#fff; border-color:#6366f1; }
        .rStatCard { border-radius:10px; padding:12px 16px; cursor:pointer; transition:transform 0.15s, box-shadow 0.15s; }
        .rStatCard:hover { transform:translateY(-2px); }
      `}</style>

      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800,color:'#0f172a',letterSpacing:'-0.4px'}}>Reseller Management</h2>
          <p style={{margin:'3px 0 0',fontSize:12,color:'#64748b'}}>{stats.total} partners · {stats.approved} active · {stats.pending} pending approval</p>
        </div>
        {stats.pending > 0 && (
          <button onClick={() => handleStatusFilter('pending')}
            style={{background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',border:'none',padding:'8px 16px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6,boxShadow:'0 2px 10px rgba(245,158,11,0.35)'}}>
            ⏳ {stats.pending} Pending Review
          </button>
        )}
      </div>

      {/* STAT CARDS */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:8,marginBottom:16}}>
        {[
          { k:'all',       label:'Total Partners',  val:stats.total,     grad:'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow:'rgba(99,102,241,0.3)' },
          { k:'approved',  label:'Active Partners',  val:stats.approved,  grad:'linear-gradient(135deg,#10b981,#059669)', shadow:'rgba(16,185,129,0.3)' },
          { k:'pending',   label:'Awaiting Approval',val:stats.pending,   grad:'linear-gradient(135deg,#f59e0b,#f97316)', shadow:'rgba(245,158,11,0.3)' },
          { k:'suspended', label:'Suspended',         val:stats.suspended, grad:'linear-gradient(135deg,#64748b,#475569)', shadow:'rgba(100,116,139,0.3)' },
        ].map(s => (
          <div key={s.k} onClick={() => handleStatusFilter(s.k)} className="rStatCard"
            style={{background:s.grad,boxShadow:filterStatus===s.k?`0 4px 20px ${s.shadow}`:'0 2px 8px rgba(0,0,0,0.1)',outline:filterStatus===s.k?'2px solid rgba(255,255,255,0.6)':'none',outlineOffset:3}}>
            <div style={{fontSize:24,fontWeight:900,color:'#fff',lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.85)',marginTop:5,textTransform:'uppercase',letterSpacing:'0.4px'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* MAIN SPLIT */}
      <div style={{display:'flex',gap:14,alignItems:'flex-start',flexDirection:isMobile?'column':'row'}}>

        {/* LEFT — LIST */}
        <div style={{flex:(!isMobile && selectedReseller) ? '0 0 52%' : '1',minWidth:0,display:'flex',flexDirection:'column',gap:0}}>

          {/* Toolbar */}
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderBottom:'none',borderRadius:'10px 10px 0 0',padding:'10px 14px',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <input
              type="text"
              placeholder="Search by name, company, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{flex:1,minWidth:150,padding:'7px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12,outline:'none',background:'#f8fafc'}}
            />
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              {FILTERS.map(f => (
                <button key={f.k} className={`rFBtn${filterStatus === f.k ? ' on' : ''}`} onClick={() => handleStatusFilter(f.k)}>
                  {f.label} <span style={{opacity:0.7,fontSize:10}}>({f.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'0 0 10px 10px',overflow:'hidden'}}>
            {loading ? (
              <div style={{padding:40,textAlign:'center',color:'#94a3b8',fontSize:13}}>Loading...</div>
            ) : paginated.length === 0 ? (
              <div style={{padding:48,textAlign:'center',color:'#94a3b8'}}>
                <div style={{fontSize:36,marginBottom:8}}>🤝</div>
                <div style={{fontSize:13,fontWeight:600}}>No resellers found</div>
              </div>
            ) : paginated.map(r => {
              const sc = STATUS[r.status] || STATUS.suspended;
              const isSelected = selectedReseller?.reseller?._id === r._id;
              return (
                <div key={r._id} className={`rItem${isSelected ? ' rSel' : ''}`} onClick={() => fetchDetail(r._id)}>
                  {/* Avatar */}
                  <div style={{width:38,height:38,borderRadius:10,background:avG(r.firstName),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0,boxShadow:`0 2px 8px ${avC(r.firstName)}44`}}>
                    {r.firstName?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Name + company */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {r.firstName} {r.lastName}
                    </div>
                    <div style={{fontSize:11,color:'#64748b',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {r.companyName || r.email}
                    </div>
                  </div>

                  {/* Metrics */}
                  {!isMobile && (
                    <div style={{display:'flex',gap:14,flexShrink:0}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:13,fontWeight:800,color:avC(r.firstName)}}>{r.stats?.totalTenants || 0}</div>
                        <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,textTransform:'uppercase'}}>Clients</div>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#7c3aed'}}>{fmtMoney(r.stats?.monthlyCommission)}</div>
                        <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,textTransform:'uppercase'}}>Commission</div>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{r.commissionRate}%</div>
                        <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,textTransform:'uppercase'}}>Rate</div>
                      </div>
                    </div>
                  )}

                  {/* Status badge */}
                  <span style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,flexShrink:0,textTransform:'capitalize'}}>
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,padding:'8px 14px',background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',flexWrap:'wrap',gap:8}}>
              <span style={{fontSize:11,color:'#64748b'}}>
                {(currentPage-1)*pageSize + 1}–{Math.min(currentPage*pageSize, filtered.length)} of {filtered.length}
              </span>
              <div style={{display:'flex',gap:6}}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}
                  style={{background:currentPage===1?'#f1f5f9':'#6366f1',color:currentPage===1?'#94a3b8':'#fff',border:'none',padding:'5px 12px',borderRadius:6,cursor:currentPage===1?'not-allowed':'pointer',fontSize:11,fontWeight:700}}>
                  ← Prev
                </button>
                <span style={{fontSize:11,fontWeight:700,color:'#1e293b',display:'flex',alignItems:'center',padding:'0 4px'}}>
                  {currentPage} / {totalPages}
                </span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage>=totalPages}
                  style={{background:currentPage>=totalPages?'#f1f5f9':'#6366f1',color:currentPage>=totalPages?'#94a3b8':'#fff',border:'none',padding:'5px 12px',borderRadius:6,cursor:currentPage>=totalPages?'not-allowed':'pointer',fontSize:11,fontWeight:700}}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — DETAIL PANEL */}
        {selectedReseller && (
          <DetailPanel
            title={`${selectedReseller.reseller.firstName} ${selectedReseller.reseller.lastName}`}
            onClose={() => setSelectedReseller(null)}
          >
            {/* Header */}
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16,paddingBottom:16,borderBottom:'1px solid #f1f5f9'}}>
              <div style={{width:52,height:52,borderRadius:13,background:avG(selectedReseller.reseller.firstName),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:20,flexShrink:0,boxShadow:`0 4px 16px ${avC(selectedReseller.reseller.firstName)}55`}}>
                {selectedReseller.reseller.firstName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:15,color:'#0f172a'}}>{selectedReseller.reseller.firstName} {selectedReseller.reseller.lastName}</div>
                <div style={{fontSize:12,color:'#64748b',marginTop:1}}>{selectedReseller.reseller.companyName || '—'}</div>
                <div style={{marginTop:6}}>
                  {(() => { const sc = STATUS[selectedReseller.reseller.status] || STATUS.suspended; return (
                    <span style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20}}>
                      {sc.label}
                    </span>
                  ); })()}
                </div>
              </div>
            </div>

            {/* KPI row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
              {[
                { label:'Clients',    val:selectedReseller.stats.totalTenants,                                         color:'#6366f1', bg:'#ede9fe' },
                { label:'Revenue',    val:`₹${(selectedReseller.stats.totalMonthlyRevenue||0).toLocaleString()}`,       color:'#059669', bg:'#d1fae5' },
                { label:'Commission', val:`₹${(selectedReseller.stats.monthlyCommission||0).toLocaleString()}`,         color:'#7c3aed', bg:'#ede9fe' },
              ].map(c => (
                <div key={c.label} style={{background:c.bg,borderRadius:9,padding:'10px 8px',textAlign:'center'}}>
                  <div style={{fontSize:15,fontWeight:800,color:c.color}}>{c.val}</div>
                  <div style={{fontSize:9,color:'#64748b',fontWeight:600,textTransform:'uppercase',marginTop:3}}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:7}}>Contact</div>
              <div style={{background:'#f8fafc',borderRadius:9,overflow:'hidden',border:'1px solid #e2e8f0'}}>
                <InfoRow label="Email"      value={selectedReseller.reseller.email} />
                <InfoRow label="Phone"      value={selectedReseller.reseller.phone || '—'} />
                <InfoRow label="Rate"       value={`${selectedReseller.reseller.commissionRate}%`} />
                <InfoRow label="Joined"     value={fmtDate(selectedReseller.reseller.createdAt)} />
              </div>
            </div>

            {/* Referral */}
            {selectedReseller.reseller.status === 'approved' && (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:7}}>Referral Link</div>
                <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:9,padding:12}}>
                  <div style={{fontFamily:'monospace',fontSize:10,color:'#3b82f6',wordBreak:'break-all',lineHeight:1.6,marginBottom:8}}>
                    {`${window.location.origin}/register?ref=${selectedReseller.reseller._id}`}
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?ref=${selectedReseller.reseller._id}`)}
                    style={{background:'#3b82f6',color:'#fff',border:'none',padding:'5px 12px',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                    📋 Copy
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
              <button onClick={() => { setModalType('status'); setActionData({ status: selectedReseller.reseller.status, commissionRate: selectedReseller.reseller.commissionRate }); setShowModal(true); }}
                style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',border:'none',padding:'9px 0',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                ✏️ Change Status
              </button>
              <button onClick={() => { setModalType('commission'); setActionData({ status: selectedReseller.reseller.status, commissionRate: selectedReseller.reseller.commissionRate }); setShowModal(true); }}
                style={{background:'#fff',color:'#374151',border:'1.5px solid #e2e8f0',padding:'9px 0',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                💲 Update Rate
              </button>
            </div>

            {/* Clients */}
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:7}}>
                Clients ({selectedReseller.tenants.length})
              </div>
              {selectedReseller.tenants.length > 0 ? (
                <div style={{border:'1px solid #e2e8f0',borderRadius:9,overflow:'hidden'}}>
                  {selectedReseller.tenants.map((t, i) => (
                    <div key={t.id} style={{padding:'9px 12px',borderBottom:i < selectedReseller.tenants.length-1 ? '1px solid #f1f5f9' : 'none',display:'flex',justifyContent:'space-between',alignItems:'center',background:i%2===0?'#fff':'#fafafa'}}>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {t.organizationName}
                          {!t.isActive && <span style={{color:'#ef4444',fontSize:9,marginLeft:4,fontWeight:700}}>INACTIVE</span>}
                        </div>
                        <div style={{fontSize:10,color:'#94a3b8',textTransform:'capitalize',marginTop:1}}>{t.planType}</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                        <div style={{fontSize:10,color:'#64748b'}}>₹{(t.monthlySubscription||0).toLocaleString()}</div>
                        <div style={{fontSize:11,fontWeight:800,color:'#7c3aed'}}>₹{(t.monthlyCommission||0).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:24,background:'#f8fafc',borderRadius:9,border:'1px solid #e2e8f0',color:'#94a3b8',fontSize:12}}>
                  No clients yet
                </div>
              )}
            </div>
          </DetailPanel>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)'}}>
          <div style={{background:'#fff',borderRadius:14,padding:28,width:360,boxShadow:'0 20px 60px rgba(0,0,0,0.25)',border:'1px solid #e2e8f0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:'#0f172a'}}>{modalType === 'status' ? 'Change Status' : 'Update Commission Rate'}</div>
                <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{selectedReseller?.reseller?.companyName || `${selectedReseller?.reseller?.firstName} ${selectedReseller?.reseller?.lastName}`}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{background:'#f1f5f9',border:'none',width:30,height:30,borderRadius:8,cursor:'pointer',color:'#475569',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>

            {modalType === 'status' ? (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {Object.entries(STATUS).map(([k, sc]) => (
                  <div key={k} onClick={() => setActionData(d => ({ ...d, status: k }))}
                    style={{border:`2px solid ${actionData.status===k ? sc.color : '#e2e8f0'}`,borderRadius:9,padding:'10px 12px',cursor:'pointer',background:actionData.status===k ? sc.bg : '#fff',transition:'all 0.12s'}}>
                    <div style={{fontSize:12,fontWeight:700,color:actionData.status===k ? sc.color : '#374151',textTransform:'capitalize'}}>{sc.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label style={{fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:8}}>Commission Rate (%)</label>
                <div style={{position:'relative'}}>
                  <input type="number" min="0" max="100" step="0.1" value={actionData.commissionRate}
                    onChange={e => setActionData(d => ({ ...d, commissionRate: e.target.value }))}
                    style={{width:'100%',padding:'10px 40px 10px 14px',border:'1.5px solid #d1d5db',borderRadius:9,fontSize:15,fontWeight:700,outline:'none',background:'#f9fafb',boxSizing:'border-box'}}
                  />
                  <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',fontWeight:700}}>%</span>
                </div>
              </div>
            )}

            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button onClick={() => setShowModal(false)} style={{flex:1,background:'#f1f5f9',color:'#374151',border:'none',padding:'10px 0',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={modalType === 'status' ? handleStatusUpdate : handleCommissionUpdate} disabled={actionLoading}
                style={{flex:1,background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',border:'none',padding:'10px 0',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',opacity:actionLoading?0.7:1}}>
                {actionLoading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SaasLayout>
  );
};

export default ResellerManagement;
