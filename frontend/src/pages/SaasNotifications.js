import React, { useState, useEffect, useCallback } from 'react';
import SaasLayout, { useWindowSize } from '../components/layout/SaasLayout';
import { tenantService } from '../services/tenantService';
import notificationService from '../services/notificationService';

const TYPE_CONFIG = {
  task_assigned:                { icon: '📋', color: '#7c3aed', bg: '#ede9fe', label: 'Task' },
  task_overdue:                 { icon: '⏰', color: '#dc2626', bg: '#fee2e2', label: 'Task' },
  task_completed:               { icon: '✅', color: '#16a34a', bg: '#dcfce7', label: 'Task' },
  task_updated:                 { icon: '🔄', color: '#7c3aed', bg: '#ede9fe', label: 'Task' },
  lead_created:                 { icon: '🧲', color: '#2563eb', bg: '#dbeafe', label: 'Lead' },
  lead_assigned:                { icon: '👤', color: '#2563eb', bg: '#dbeafe', label: 'Lead' },
  lead_status_changed:          { icon: '🔁', color: '#0891b2', bg: '#cffafe', label: 'Lead' },
  lead_converted:               { icon: '🔄', color: '#0891b2', bg: '#cffafe', label: 'Lead' },
  opportunity_created:          { icon: '💼', color: '#d97706', bg: '#fef3c7', label: 'Opportunity' },
  opportunity_stage_changed:    { icon: '📈', color: '#d97706', bg: '#fef3c7', label: 'Opportunity' },
  opportunity_won:              { icon: '🏆', color: '#16a34a', bg: '#dcfce7', label: 'Won' },
  opportunity_lost:             { icon: '💔', color: '#dc2626', bg: '#fee2e2', label: 'Lost' },
  contact_created:              { icon: '👤', color: '#0891b2', bg: '#cffafe', label: 'Contact' },
  account_created:              { icon: '🏢', color: '#7c3aed', bg: '#ede9fe', label: 'Account' },
  meeting_reminder:             { icon: '📅', color: '#d97706', bg: '#fef3c7', label: 'Meeting' },
  support_ticket_created:       { icon: '🎫', color: '#dc2626', bg: '#fee2e2', label: 'Support' },
  support_ticket_status_changed:{ icon: '🎫', color: '#dc2626', bg: '#fee2e2', label: 'Support' },
  invoice_overdue:              { icon: '💰', color: '#dc2626', bg: '#fee2e2', label: 'Invoice' },
  invoice_created:              { icon: '💵', color: '#16a34a', bg: '#dcfce7', label: 'Invoice' },
  email_received:               { icon: '📧', color: '#2563eb', bg: '#dbeafe', label: 'Email' },
  note_added:                   { icon: '📝', color: '#64748b', bg: '#f1f5f9', label: 'Note' },
};

const CRM_TYPES = [
  { v: '', l: 'All' },
  { v: 'lead_created',          l: 'Leads' },
  { v: 'task_assigned',         l: 'Tasks' },
  { v: 'opportunity_created',   l: 'Opportunities' },
  { v: 'contact_created',       l: 'Contacts' },
  { v: 'account_created',       l: 'Accounts' },
  { v: 'support_ticket_created',l: 'Support' },
];

const DEL_STATUS = {
  pending:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'Pending Review' },
  approved: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: 'Deletion Approved' },
  rejected: { bg: '#dcfce7', color: '#15803d', border: '#86efac', label: 'Rejected' },
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const daysLeft = (d) => d ? Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000)) : 0;

export default function SaasNotifications() {
  const { isMobile } = useWindowSize();
  const [tab, setTab] = useState('crm');

  // CRM state
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pag, setPag]           = useState({});
  const [tenantF, setTenantF]   = useState('');
  const [typeF, setTypeF]       = useState('');
  const [readF, setReadF]       = useState('');
  const [tenants, setTenants]   = useState([]);
  const [busyId, setBusyId]     = useState(null);

  // Deletion state
  const [delItems, setDelItems]     = useState([]);
  const [delLoading, setDelLoading] = useState(false);
  const [delFilter, setDelFilter]   = useState('pending');
  const [actionId, setActionId]     = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadCrm = useCallback(async () => {
    setLoading(true);
    try {
      const p = { page, limit: 20 };
      if (tenantF) p.tenantId = tenantF;
      if (typeF)   p.type     = typeF;
      if (readF !== '') p.isRead = readF;
      const r = await notificationService.getNotifications(p);
      setNotifs(r?.data?.notifications || []);
      setPag(r?.data?.pagination || {});
    } catch {}
    finally { setLoading(false); }
  }, [page, tenantF, typeF, readF]);

  useEffect(() => { if (tab === 'crm') loadCrm(); }, [tab, loadCrm]);

  useEffect(() => {
    tenantService.getTenants({ page: 1, limit: 200 })
      .then(d => setTenants(d.tenants || d || []))
      .catch(() => {});
  }, []);

  const loadDel = useCallback(async () => {
    setDelLoading(true);
    try {
      const p = { page: 1, limit: 1000 };
      if (delFilter !== 'all') p.deletionStatus = delFilter;
      const d = await tenantService.getTenants(p);
      const all = d.tenants || d || [];
      setDelItems(all.filter(t => t.deletionRequest?.status && t.deletionRequest.status !== 'none'));
    } catch {}
    finally { setDelLoading(false); }
  }, [delFilter]);

  useEffect(() => { if (tab === 'deletion') loadDel(); }, [tab, loadDel]);

  const markAll  = async () => { await notificationService.markAllAsRead(); setNotifs(p => p.map(n => ({ ...n, isRead: true }))); };
  const markOne  = async (e, id) => { e.stopPropagation(); setBusyId(id); await notificationService.markAsRead(id); setNotifs(p => p.map(n => n._id === id ? { ...n, isRead: true } : n)); setBusyId(null); };
  const delNotif = async (e, id) => { e.stopPropagation(); setBusyId(id); await notificationService.deleteNotification(id); setNotifs(p => p.filter(n => n._id !== id)); setBusyId(null); };

  const approve = async (id, name) => {
    if (!window.confirm(`Approve deletion for "${name}"? Data will be permanently deleted after 45 days.`)) return;
    setActionId(id);
    try { await tenantService.approveDeletion(id); await loadDel(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActionId(rejectModal.id);
    try { await tenantService.rejectDeletion(rejectModal.id, rejectReason); setRejectModal(null); setRejectReason(''); await loadDel(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  const recover = async (id, name) => {
    if (!window.confirm(`Recover "${name}"?`)) return;
    setActionId(id);
    try { await tenantService.recoverTenant(id); await loadDel(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  const unread   = notifs.filter(n => !n.isRead).length;
  const total    = pag.total || 0;
  const pending  = delItems.filter(t => t.deletionRequest?.status === 'pending').length;
  const tenantSet = new Set(notifs.map(n => n.tenant?._id).filter(Boolean));

  const pgb = (dis) => ({
    padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 7,
    background: '#fff', cursor: dis ? 'not-allowed' : 'pointer',
    color: dis ? '#cbd5e1' : '#374151', fontSize: 11, opacity: dis ? 0.6 : 1, fontWeight: 600
  });

  return (
    <SaasLayout title="Notifications">
      <style>{`
        @keyframes nPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes nSlide { from{transform:translateX(-6px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes nSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .nItem { transition:background 0.12s,box-shadow 0.12s; }
        .nItem:hover { background:#f8fafc !important; box-shadow:inset 3px 0 0 currentColor; }
        .nTabBtn { transition:all 0.15s ease; }
        .nTabBtn:hover { opacity:0.85; transform:translateY(-1px); }
        .nDelCard { transition:box-shadow 0.15s,transform 0.15s; }
        .nDelCard:hover { box-shadow:0 6px 24px rgba(0,0,0,0.1) !important; transform:translateY(-1px); }
        @media(max-width:768px){ .nHideM{display:none!important} }
      `}</style>

      {/* ── HERO ── */}
      <div style={{background:'linear-gradient(135deg,#0f0c29 0%,#1a1040 35%,#0d1b4b 70%,#0f172a 100%)',borderRadius:14,marginBottom:12,overflow:'hidden',position:'relative'}}>
        <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(99,102,241,0.08)',pointerEvents:'none'}} />
        <div style={{position:'absolute',bottom:-30,left:'30%',width:120,height:120,borderRadius:'50%',background:'rgba(139,92,246,0.06)',pointerEvents:'none'}} />
        <div style={{padding:'14px 20px 0',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 12px rgba(99,102,241,0.4)',flexShrink:0}}>🔔</div>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:'#fff',letterSpacing:'-0.3px'}}>Notifications Center</div>
              <div style={{fontSize:11,color:'#8b9ccc',marginTop:1}}>Real-time activity feed &amp; deletion request management</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            {[
              {label:'Total',val:total,c:'#a5b4fc',bg:'rgba(99,102,241,0.15)',border:'rgba(99,102,241,0.3)'},
              {label:'Unread',val:unread,c:'#f9a8d4',bg:'rgba(236,72,153,0.15)',border:'rgba(236,72,153,0.3)'},
              {label:'Pending Del.',val:pending,c:'#fca5a5',bg:'rgba(220,38,38,0.15)',border:'rgba(220,38,38,0.3)'},
            ].map(s=>(
              <div key={s.label} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:8,padding:'5px 12px',textAlign:'center',minWidth:70}}>
                <div style={{fontSize:16,fontWeight:800,color:s.c,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.4px',marginTop:2}}>{s.label}</div>
              </div>
            ))}
            {unread>0&&(
              <button onClick={markAll} style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',border:'none',padding:'7px 14px',borderRadius:7,fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap'}}>
                ✓ Mark all read <span style={{background:'rgba(255,255,255,0.25)',borderRadius:5,padding:'0 5px',fontSize:10}}>{unread}</span>
              </button>
            )}
          </div>
        </div>
        {/* Tab pills in hero */}
        <div style={{padding:'12px 20px 0',display:'flex',gap:4,position:'relative'}}>
          {[
            {k:'crm',      l:'CRM Activity',      ico:'📊', badge:unread,     bdanger:false},
            {k:'deletion', l:'Deletion Requests',  ico:'🗑️', badge:pending,   bdanger:true},
          ].map(t=>(
            <button key={t.k} className="nTabBtn" onClick={()=>setTab(t.k)} style={{
              padding:'8px 16px',border:'none',cursor:'pointer',fontSize:12,fontWeight:700,
              borderRadius:'8px 8px 0 0',display:'flex',alignItems:'center',gap:6,
              background:tab===t.k?'#f8fafc':'transparent',
              color:tab===t.k?'#1e293b':'rgba(255,255,255,0.6)',
              borderBottom:tab===t.k?'2px solid #6366f1':'2px solid transparent',
            }}>
              <span>{t.ico}</span>{t.l}
              {t.badge>0&&<span style={{background:t.bdanger?'#dc2626':'#6366f1',color:'#fff',fontSize:9,fontWeight:800,padding:'1px 6px',borderRadius:10,minWidth:16,textAlign:'center'}}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── PENDING DELETION ALERT ── */}
      {pending>0&&tab==='crm'&&(
        <div style={{background:'linear-gradient(90deg,#7f1d1d,#991b1b)',borderRadius:8,padding:'9px 14px',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:16,animation:'nPulse 1.5s infinite'}}>🚨</span>
            <div>
              <span style={{fontWeight:700,fontSize:12,color:'#fff'}}>{pending} deletion request{pending>1?'s':''} need your action</span>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.7)',marginLeft:8}}>Review before data is permanently deleted</span>
            </div>
          </div>
          <button onClick={()=>setTab('deletion')} style={{background:'rgba(255,255,255,0.15)',color:'#fff',border:'1px solid rgba(255,255,255,0.3)',borderRadius:6,padding:'5px 12px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>Review Now →</button>
        </div>
      )}

      {/* ══════════════════════════════════ CRM TAB ══════════════════════════════════ */}
      {tab==='crm'&&(
        <div style={{animation:'nSlide 0.2s ease'}}>

          {/* STATS */}
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:8,marginBottom:12}}>
            {[
              {label:'Total',      val:total,          grad:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)', hov:'linear-gradient(135deg,#4f46e5,#7c3aed,#0891b2)'},
              {label:'Unread',     val:unread,          grad:'linear-gradient(135deg,#ec4899 0%,#8b5cf6 50%,#6366f1 100%)', hov:'linear-gradient(135deg,#db2777,#7c3aed,#4f46e5)'},
              {label:'Tenants',    val:tenantSet.size,  grad:'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)', hov:'linear-gradient(135deg,#d97706,#ea580c,#dc2626)'},
              {label:'This Page',  val:notifs.length,   grad:'linear-gradient(135deg,#10b981 0%,#16a34a 50%,#84cc16 100%)', hov:'linear-gradient(135deg,#059669,#15803d,#65a30d)'},
            ].map(s=>(
              <div key={s.label} className="sStat"
                onMouseEnter={e=>{e.currentTarget.style.background=s.hov;e.currentTarget.style.transform='translateY(-3px)';}}
                onMouseLeave={e=>{e.currentTarget.style.background=s.grad;e.currentTarget.style.transform='translateY(0)';}}
                style={{background:s.grad,borderRadius:10,padding:'11px 14px',boxShadow:'0 2px 10px rgba(0,0,0,0.15)',cursor:'default',transition:'all 0.15s ease'}}>
                <div style={{fontSize:22,fontWeight:900,color:'#fff',lineHeight:1,textShadow:'0 1px 4px rgba(0,0,0,0.2)'}}>{s.val}</div>
                <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.8)',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* FILTER BAR */}
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:'9px 12px',marginBottom:10,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <select value={tenantF} onChange={e=>{setTenantF(e.target.value);setPage(1);}}
              style={{padding:'5px 9px',border:'1px solid #e2e8f0',borderRadius:6,fontSize:11,background:'#f9fafb',color:'#374151',outline:'none',fontWeight:600,minWidth:140}}>
              <option value="">🏢 All Tenants</option>
              {tenants.map(t=><option key={t._id} value={t._id}>{t.organizationName}</option>)}
            </select>
            <div style={{display:'flex',gap:4,flexWrap:'wrap',flex:1}}>
              {CRM_TYPES.map(c=>(
                <button key={c.v} onClick={()=>{setTypeF(c.v);setPage(1);}} style={{
                  padding:'4px 10px',borderRadius:20,fontSize:10,fontWeight:typeF===c.v?700:500,
                  border:`1.5px solid ${typeF===c.v?'#6366f1':'#e2e8f0'}`,
                  background:typeF===c.v?'#6366f1':'#fff',
                  color:typeF===c.v?'#fff':'#64748b',cursor:'pointer',transition:'all 0.12s',whiteSpace:'nowrap'
                }}>{c.l}</button>
              ))}
            </div>
            <div style={{display:'flex',background:'#f1f5f9',borderRadius:7,padding:2,flexShrink:0}}>
              {[['','All'],['false','Unread'],['true','Read']].map(([v,l])=>(
                <button key={v} onClick={()=>{setReadF(v);setPage(1);}} style={{
                  padding:'4px 10px',borderRadius:5,fontSize:11,border:'none',
                  background:readF===v?'#fff':'transparent',
                  color:readF===v?'#1e293b':'#64748b',
                  fontWeight:readF===v?700:400,cursor:'pointer',
                  boxShadow:readF===v?'0 1px 3px rgba(0,0,0,0.1)':'none',transition:'all 0.12s',whiteSpace:'nowrap'
                }}>{l}</button>
              ))}
            </div>
          </div>

          {total>0&&<div style={{fontSize:10,color:'#94a3b8',fontWeight:600,marginBottom:8,paddingLeft:2}}>
            Showing {((page-1)*20)+1}–{Math.min(page*20,total)} of {total} notifications
          </div>}

          {/* NOTIFICATION LIST */}
          {loading?(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {Array.from({length:5}).map((_,i)=>(
                <div key={i} style={{background:'#fff',borderRadius:12,padding:'14px 16px',border:'1px solid #e2e8f0',display:'flex',gap:14,alignItems:'flex-start'}}>
                  <div style={{width:44,height:44,borderRadius:12,background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',flexShrink:0}} />
                  <div style={{flex:1}}>
                    <div style={{display:'flex',gap:6,marginBottom:8}}>
                      <div style={{width:70,height:8,background:'#f1f5f9',borderRadius:4}} />
                      <div style={{width:50,height:8,background:'#f1f5f9',borderRadius:4}} />
                    </div>
                    <div style={{width:'55%',height:13,background:'#f1f5f9',borderRadius:4,marginBottom:7}} />
                    <div style={{width:'80%',height:10,background:'#f8fafc',borderRadius:4}} />
                  </div>
                  <div style={{width:60,height:8,background:'#f1f5f9',borderRadius:4,flexShrink:0,marginTop:4}} />
                </div>
              ))}
            </div>
          ):notifs.length===0?(
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'60px 24px',textAlign:'center'}}>
              <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#eef2ff,#e0e7ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 16px'}}>🎉</div>
              <div style={{fontSize:15,fontWeight:700,color:'#1e293b',marginBottom:5}}>All clear!</div>
              <div style={{fontSize:12,color:'#94a3b8'}}>No notifications match the current filters.</div>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {notifs.map((n)=>{
                const c=TYPE_CONFIG[n.type]||{icon:'🔔',color:'#64748b',bg:'#f1f5f9',label:''};
                const grads=['linear-gradient(135deg,#6366f1,#8b5cf6)','linear-gradient(135deg,#0ea5e9,#6366f1)','linear-gradient(135deg,#10b981,#0ea5e9)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#ec4899,#8b5cf6)','linear-gradient(135deg,#14b8a6,#6366f1)'];
                const tName=n.tenant?.organizationName||'';
                const tGrad=grads[(tName.charCodeAt(0)||0)%grads.length];
                return (
                  <div key={n._id} className="nItem" style={{
                    background:n.isRead?'#fff':'#f8f7ff',
                    border:`1px solid ${n.isRead?'#e2e8f0':c.color+'44'}`,
                    borderRadius:12,
                    padding:'12px 14px',
                    display:'flex',gap:13,alignItems:'flex-start',
                    opacity:busyId===n._id?0.4:1,
                    transition:'all 0.15s',
                    boxShadow:n.isRead?'none':`0 2px 10px ${c.color}18`,
                    position:'relative',overflow:'hidden',
                  }}>
                    {/* Unread accent bar */}
                    {!n.isRead&&<div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:c.color,borderRadius:'12px 0 0 12px'}} />}

                    {/* Icon circle */}
                    <div style={{
                      width:42,height:42,borderRadius:11,
                      background:`linear-gradient(135deg,${c.color}22,${c.color}44)`,
                      border:`1.5px solid ${c.color}55`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:19,flexShrink:0,
                    }}>{c.icon}</div>

                    {/* Content */}
                    <div style={{flex:1,minWidth:0}}>
                      {/* Top row: title + time */}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:5}}>
                        <div style={{fontSize:13,fontWeight:n.isRead?500:700,color:'#0f172a',lineHeight:1.3,flex:1}}>{n.title}</div>
                        <span style={{fontSize:10,color:'#94a3b8',whiteSpace:'nowrap',flexShrink:0,marginTop:2}}>{timeAgo(n.createdAt)}</span>
                      </div>
                      {/* Message */}
                      <div style={{fontSize:11,color:'#64748b',lineHeight:1.55,marginBottom:7}}>{n.message}</div>
                      {/* Bottom tags row */}
                      <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
                        {tName&&(
                          <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:tGrad,color:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.15)'}}>
                            <span style={{fontSize:9}}>🏢</span>{tName}
                          </span>
                        )}
                        <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:c.bg,color:c.color,fontWeight:700,border:`1px solid ${c.color}33`}}>{c.label}</span>
                        {n.userId?.firstName&&(
                          <span style={{fontSize:10,color:'#94a3b8',display:'inline-flex',alignItems:'center',gap:3}}>
                            <span style={{width:14,height:14,borderRadius:'50%',background:'#e2e8f0',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:8}}>👤</span>
                            {n.userId.firstName} {n.userId.lastName}
                          </span>
                        )}
                        {!n.isRead&&(
                          <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,color:c.color,marginLeft:'auto'}}>
                            <span style={{width:7,height:7,borderRadius:'50%',background:c.color,boxShadow:`0 0 0 3px ${c.color}30`,display:'inline-block'}} />
                            Unread
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{display:'flex',flexDirection:'column',gap:5,flexShrink:0,alignItems:'center'}} onClick={e=>e.stopPropagation()}>
                      {!n.isRead&&(
                        <button onClick={e=>markOne(e,n._id)} title="Mark as read"
                          style={{width:30,height:30,borderRadius:8,border:`1.5px solid ${c.color}55`,background:`${c.color}11`,color:c.color,cursor:'pointer',fontSize:14,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.12s'}}
                          onMouseEnter={e=>{e.currentTarget.style.background=c.color;e.currentTarget.style.color='#fff';}}
                          onMouseLeave={e=>{e.currentTarget.style.background=`${c.color}11`;e.currentTarget.style.color=c.color;}}>✓</button>
                      )}
                      <button onClick={e=>delNotif(e,n._id)} title="Delete"
                        style={{width:30,height:30,borderRadius:8,border:'1.5px solid #e2e8f0',background:'#fafafa',color:'#cbd5e1',cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,transition:'all 0.12s'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='#fef2f2';e.currentTarget.style.borderColor='#fca5a5';e.currentTarget.style.color='#ef4444';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='#fafafa';e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#cbd5e1';}}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINATION */}
          {pag.pages>1&&(
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,flexWrap:'wrap',gap:8}}>
              <span style={{fontSize:11,color:'#94a3b8',fontWeight:500}}>Page <b style={{color:'#1e293b'}}>{page}</b> of <b style={{color:'#1e293b'}}>{pag.pages}</b> · {total} total</span>
              <div style={{display:'flex',gap:4}}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={pgb(page===1)}>← Prev</button>
                {Array.from({length:Math.min(5,pag.pages)},(_,i)=>{
                  const start=Math.max(1,Math.min(page-2,pag.pages-4));
                  const p=start+i;
                  if(p>pag.pages)return null;
                  return <button key={p} onClick={()=>setPage(p)} style={{...pgb(false),background:p===page?'#6366f1':'#fff',color:p===page?'#fff':'#374151',borderColor:p===page?'#6366f1':'#e2e8f0',fontWeight:p===page?700:400,minWidth:32}}>{p}</button>;
                })}
                <button onClick={()=>setPage(p=>Math.min(pag.pages,p+1))} disabled={page===pag.pages} style={pgb(page===pag.pages)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════ DELETION TAB ══════════════════════════════ */}
      {tab==='deletion'&&(
        <div style={{animation:'nSlide 0.2s ease'}}>
          {/* Sub-filter tabs */}
          <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
            {[
              {k:'pending', l:'Pending',  cnt:delItems.filter(t=>t.deletionRequest?.status==='pending').length, grad:'linear-gradient(135deg,#dc2626,#b91c1c)'},
              {k:'approved',l:'Approved', cnt:0, grad:'linear-gradient(135deg,#ea580c,#c2410c)'},
              {k:'rejected',l:'Rejected', cnt:0, grad:'linear-gradient(135deg,#16a34a,#15803d)'},
              {k:'all',     l:'All',      cnt:0, grad:'linear-gradient(135deg,#6366f1,#4f46e5)'},
            ].map(t=>(
              <button key={t.k} onClick={()=>setDelFilter(t.k)} style={{
                padding:'7px 16px',border:'none',cursor:'pointer',fontSize:11,fontWeight:700,
                borderRadius:8,display:'flex',alignItems:'center',gap:6,transition:'all 0.15s',
                background:delFilter===t.k?t.grad:'#fff',
                color:delFilter===t.k?'#fff':'#64748b',
                border:delFilter===t.k?'none':'1px solid #e2e8f0',
                boxShadow:delFilter===t.k?'0 3px 10px rgba(0,0,0,0.15)':'none',
              }}>
                {t.l}
                {t.cnt>0&&<span style={{background:'rgba(255,255,255,0.25)',color:delFilter===t.k?'#fff':'#dc2626',border:delFilter===t.k?'none':'1px solid #fca5a5',fontSize:9,fontWeight:800,padding:'1px 6px',borderRadius:10}}>{t.cnt}</span>}
              </button>
            ))}
          </div>

          {/* Alert */}
          {pending>0&&delFilter!=='approved'&&delFilter!=='rejected'&&(
            <div style={{background:'linear-gradient(135deg,#fef2f2,#fff5f5)',border:'1px solid #fecaca',borderLeft:'4px solid #dc2626',borderRadius:9,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:18,animation:'nPulse 1.5s infinite'}}>🚨</span>
              <div>
                <div style={{fontWeight:700,fontSize:12,color:'#dc2626'}}>{pending} organization{pending>1?'s':''} requesting permanent deletion</div>
                <div style={{fontSize:11,color:'#b91c1c',marginTop:1}}>Review and take action before data is permanently deleted</div>
              </div>
            </div>
          )}

          {/* Cards */}
          {delLoading?(
            <div style={{textAlign:'center',padding:'48px',color:'#94a3b8',fontSize:13}}>
              <div style={{width:28,height:28,border:'3px solid #e2e8f0',borderTopColor:'#6366f1',borderRadius:'50%',animation:'nSpin 0.8s linear infinite',margin:'0 auto 12px'}} />
              Loading requests...
            </div>
          ):delItems.length===0?(
            <div style={{textAlign:'center',padding:'60px 24px'}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 14px'}}>🎉</div>
              <div style={{fontSize:14,fontWeight:700,color:'#1e293b',marginBottom:4}}>No requests found</div>
              <div style={{fontSize:12,color:'#94a3b8'}}>All deletion requests have been handled.</div>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {delItems.map(tenant=>{
                const dr=tenant.deletionRequest;
                const sc=DEL_STATUS[dr.status]||{};
                const busy=actionId===tenant._id;
                const dl=daysLeft(dr.permanentDeleteAt);
                const urgent=dr.status==='pending'&&dl<=7;
                const grads=['linear-gradient(135deg,#6366f1,#4f46e5)','linear-gradient(135deg,#8b5cf6,#7c3aed)','linear-gradient(135deg,#06b6d4,#0891b2)','linear-gradient(135deg,#10b981,#059669)','linear-gradient(135deg,#f59e0b,#d97706)','linear-gradient(135deg,#ef4444,#dc2626)','linear-gradient(135deg,#ec4899,#db2777)','linear-gradient(135deg,#14b8a6,#0d9488)'];
                const ag=grads[(tenant.organizationName?.charCodeAt(0)||0)%grads.length];
                return (
                  <div key={tenant._id} className="nDelCard" style={{
                    background:'#fff',border:`1px solid ${urgent?'#fca5a5':'#e2e8f0'}`,
                    borderLeft:`4px solid ${dr.status==='pending'?'#dc2626':dr.status==='approved'?'#ea580c':'#16a34a'}`,
                    borderRadius:10,overflow:'hidden',
                    boxShadow:urgent?'0 2px 12px rgba(220,38,38,0.12)':'0 1px 4px rgba(0,0,0,0.06)'
                  }}>
                    {/* Card header */}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'12px 16px',borderBottom:'1px solid #f1f5f9',flexWrap:'wrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:40,height:40,borderRadius:10,background:ag,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:17,flexShrink:0}}>{tenant.organizationName?.charAt(0)?.toUpperCase()||'?'}</div>
                        <div>
                          <div style={{fontWeight:800,fontSize:14,color:'#0f172a'}}>{tenant.organizationName}</div>
                          <div style={{fontSize:10,color:'#94a3b8',fontFamily:'monospace',marginTop:1}}>{tenant.organizationId} · {tenant.contactEmail}</div>
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        {urgent&&<span style={{background:'#dc2626',color:'#fff',fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:20,animation:'nPulse 1.5s infinite'}}>URGENT</span>}
                        <span style={{fontSize:10,fontWeight:700,padding:'4px 11px',borderRadius:20,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{sc.label}</span>
                      </div>
                    </div>
                    {/* Card body */}
                    <div style={{padding:'10px 16px'}}>
                      <div style={{display:'flex',gap:8,marginBottom:dr.reason?10:0,flexWrap:'wrap'}}>
                        <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:7,padding:'7px 12px',minWidth:120}}>
                          <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:3}}>Requested</div>
                          <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{fmtDate(dr.requestedAt)}</div>
                        </div>
                        {dr.permanentDeleteAt&&(
                          <div style={{background:dl<=7?'#fef2f2':'#f8fafc',border:`1px solid ${dl<=7?'#fca5a5':'#e2e8f0'}`,borderRadius:7,padding:'7px 12px',minWidth:140}}>
                            <div style={{fontSize:9,fontWeight:700,color:dl<=7?'#dc2626':'#94a3b8',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:3}}>Permanent Deletion</div>
                            <div style={{fontSize:12,fontWeight:700,color:dl<=7?'#dc2626':'#0f172a'}}>
                              {fmtDate(dr.permanentDeleteAt)}
                              <span style={{fontSize:10,fontWeight:600,color:dl<=7?'#dc2626':'#64748b',marginLeft:5}}>({dl}d left)</span>
                            </div>
                          </div>
                        )}
                        {dr.rejectionReason&&(
                          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:7,padding:'7px 12px',flex:1,minWidth:120}}>
                            <div style={{fontSize:9,fontWeight:700,color:'#16a34a',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:3}}>Rejection Reason</div>
                            <div style={{fontSize:12,fontWeight:600,color:'#0f172a'}}>{dr.rejectionReason}</div>
                          </div>
                        )}
                      </div>
                      {dr.reason&&(
                        <div style={{background:'#f8fafc',borderLeft:'3px solid #94a3b8',borderRadius:'0 7px 7px 0',padding:'7px 12px',marginBottom:10}}>
                          <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:3}}>Tenant's Reason</div>
                          <div style={{fontSize:12,color:'#374151',lineHeight:1.5}}>{dr.reason}</div>
                        </div>
                      )}
                      {dr.status==='pending'&&(
                        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:dr.reason?0:8}}>
                          <button onClick={()=>approve(tenant._id,tenant.organizationName)} disabled={busy}
                            style={{padding:'7px 18px',background:busy?'#9ca3af':'linear-gradient(135deg,#dc2626,#b91c1c)',border:'none',borderRadius:7,color:'#fff',fontSize:11,fontWeight:700,cursor:busy?'not-allowed':'pointer',boxShadow:busy?'none':'0 2px 8px rgba(220,38,38,0.3)',transition:'all 0.15s'}}>
                            {busy?'Processing...':'✅ Approve Deletion'}
                          </button>
                          <button onClick={()=>{setRejectModal({id:tenant._id,name:tenant.organizationName});setRejectReason('');}} disabled={busy}
                            style={{padding:'7px 18px',background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:7,color:'#374151',fontSize:11,fontWeight:700,cursor:busy?'not-allowed':'pointer',transition:'all 0.15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='#fca5a5';e.currentTarget.style.color='#dc2626';}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#374151';}}>
                            ❌ Reject
                          </button>
                        </div>
                      )}
                      {dr.status==='approved'&&(
                        <button onClick={()=>recover(tenant._id,tenant.organizationName)} disabled={busy}
                          style={{padding:'7px 18px',background:busy?'#9ca3af':'linear-gradient(135deg,#16a34a,#15803d)',border:'none',borderRadius:7,color:'#fff',fontSize:11,fontWeight:700,cursor:busy?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(22,163,74,0.3)',transition:'all 0.15s'}}>
                          {busy?'Processing...':'🔄 Recover Account'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20,backdropFilter:'blur(4px)'}}>
          <div style={{background:'#fff',borderRadius:14,overflow:'hidden',maxWidth:420,width:'100%',boxShadow:'0 24px 60px rgba(0,0,0,0.3)'}}>
            <div style={{background:'linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c)',padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:9,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>❌</div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>Reject Deletion Request</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.65)',marginTop:1}}>For <strong style={{color:'#fff'}}>{rejectModal.name}</strong> · Tenant will be notified</div>
              </div>
            </div>
            <div style={{padding:'18px'}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.4px'}}>Rejection Reason <span style={{color:'#94a3b8',fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label>
              <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
                placeholder="Explain why the request is being rejected..."
                rows={3}
                style={{width:'100%',padding:'9px 11px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box',marginBottom:14,outline:'none'}} />
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{setRejectModal(null);setRejectReason('');}}
                  style={{flex:1,padding:10,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',color:'#374151'}}>Cancel</button>
                <button onClick={reject} disabled={actionId===rejectModal.id}
                  style={{flex:1,padding:10,background:'linear-gradient(135deg,#dc2626,#b91c1c)',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',color:'#fff',boxShadow:'0 2px 8px rgba(220,38,38,0.3)'}}>
                  {actionId===rejectModal.id?'Rejecting...':'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SaasLayout>
  );
}
