import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import SaasLayout from '../components/layout/SaasLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import axios from 'axios';

const BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const authH = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` } });

const api = {
  submit:          (d)    => axios.post(`${BASE}/api/feedback`, d, authH()).then(r=>r.data),
  mine:            (p)    => axios.get(`${BASE}/api/feedback/mine`, { ...authH(), params:p }).then(r=>r.data),
  tenantInbox:     (p)    => axios.get(`${BASE}/api/feedback/tenant/inbox`, { ...authH(), params:p }).then(r=>r.data),
  tenantAnalytics: (p)    => axios.get(`${BASE}/api/feedback/tenant/analytics`, { ...authH(), params:p }).then(r=>r.data),
  tenantReply:     (id,d) => axios.post(`${BASE}/api/feedback/${id}/tenant-reply`, d, authH()).then(r=>r.data),
  tenantStatus:    (id,d) => axios.patch(`${BASE}/api/feedback/${id}/tenant-status`, d, authH()).then(r=>r.data),
  escalate:        (id,d) => axios.post(`${BASE}/api/feedback/${id}/escalate`, d, authH()).then(r=>r.data),
  all:             (p)    => axios.get(`${BASE}/api/feedback`, { ...authH(), params:p }).then(r=>r.data),
  byId:            (id)   => axios.get(`${BASE}/api/feedback/${id}`, authH()).then(r=>r.data),
  saasReply:       (id,d) => axios.post(`${BASE}/api/feedback/${id}/reply`, d, authH()).then(r=>r.data),
  saasStatus:      (id,d) => axios.patch(`${BASE}/api/feedback/${id}/status`, d, authH()).then(r=>r.data),
  saasNote:        (id,d) => axios.post(`${BASE}/api/feedback/${id}/notes`, d, authH()).then(r=>r.data),
  saasDelete:      (id)   => axios.delete(`${BASE}/api/feedback/${id}`, authH()).then(r=>r.data),
  saasAnalytics:   (p)    => axios.get(`${BASE}/api/feedback/analytics`, { ...authH(), params:p }).then(r=>r.data),
};

/* ─── Design tokens ─── */
const TYPE = {
  bug:             { label:'Bug Report',      icon:'🐛', color:'#dc2626', bg:'#fef2f2', border:'#fecaca' },
  feature_request: { label:'Feature Request', icon:'💡', color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
  general:         { label:'General',         icon:'💬', color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
  complaint:       { label:'Complaint',       icon:'😤', color:'#ea580c', bg:'#fff7ed', border:'#fed7aa' },
  praise:          { label:'Praise',          icon:'🌟', color:'#059669', bg:'#ecfdf5', border:'#a7f3d0' },
};
const CAT = {
  service: { label:'Service',  icon:'🤝', color:'#2563eb', bg:'#eff6ff' },
  product: { label:'Product',  icon:'📦', color:'#7c3aed', bg:'#f5f3ff' },
  support: { label:'Support',  icon:'🎧', color:'#059669', bg:'#ecfdf5' },
  ui:      { label:'UI / UX',  icon:'🎨', color:'#d97706', bg:'#fffbeb' },
  pricing: { label:'Pricing',  icon:'💰', color:'#db2777', bg:'#fdf2f8' },
  other:   { label:'Other',    icon:'📝', color:'#64748b', bg:'#f8fafc' },
};
const TSTATUS = {
  pending:   { label:'Pending',   color:'#2563eb', bg:'#eff6ff', dot:'#3b82f6' },
  in_review: { label:'In Review', color:'#d97706', bg:'#fffbeb', dot:'#f59e0b' },
  resolved:  { label:'Resolved',  color:'#059669', bg:'#ecfdf5', dot:'#10b981' },
  escalated: { label:'Escalated', color:'#dc2626', bg:'#fef2f2', dot:'#ef4444' },
};
const GSTATUS = {
  new:          { label:'New',          color:'#2563eb', bg:'#eff6ff' },
  acknowledged: { label:'Acknowledged', color:'#7c3aed', bg:'#f5f3ff' },
  in_progress:  { label:'In Progress',  color:'#d97706', bg:'#fffbeb' },
  resolved:     { label:'Resolved',     color:'#059669', bg:'#ecfdf5' },
  closed:       { label:'Closed',       color:'#64748b', bg:'#f1f5f9' },
};
const SENT = {
  positive: { label:'Positive', color:'#059669', bg:'#ecfdf5', icon:'😊' },
  neutral:  { label:'Neutral',  color:'#64748b', bg:'#f1f5f9', icon:'😐' },
  negative: { label:'Negative', color:'#dc2626', bg:'#fef2f2', icon:'😞' },
};

/* ─── Stat card CSS ─── */
const STAT_CSS = `
  .fbStat { cursor:pointer; border-radius:12px; padding:12px 16px; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); background:#fff; }
  .fbStat:hover { transform:translateY(-4px) scale(1.02); box-shadow:0 10px 28px rgba(124,58,237,0.18) !important; }
  .fbStat:active { transform:translateY(-1px) scale(1.01); transition:all 0.15s; }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;

const GradStat = ({ label, value, color, active, onClick }) => {
  const getGradient = (c) => {
    const gradients = {
      '#6366f1': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      '#f59e0b': 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      '#10b981': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
      '#ef4444': 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    };
    return gradients[c] || `linear-gradient(135deg, ${c} 0%, ${c} 100%)`;
  };

  return (
    <div className="fbStat" onClick={onClick}
      style={{ border: active ? `2px solid ${color}` : '1.5px solid #e8edf2',
        boxShadow: active ? `0 0 0 4px ${color}20, 0 6px 20px ${color}40` : '0 3px 10px rgba(0,0,0,0.06)',
        flex:'1 1 0', minWidth:95,
        background: active ? `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)` : 'linear-gradient(135deg, #ffffff 0%, #fefbff 100%)',
        position:'relative', overflow:'hidden' }}>
      {active && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:getGradient(color) }}/>}
      <div style={{ fontSize:26, fontWeight:900, color: active ? color : '#0f172a', lineHeight:1, marginBottom:5, fontVariantNumeric:'tabular-nums',
        textShadow: active ? `0 2px 12px ${color}30` : 'none' }}>{value}</div>
      <div style={{ fontSize:9, fontWeight:700, color: active ? color : '#94a3b8', textTransform:'uppercase', letterSpacing:'0.7px' }}>{label}</div>
    </div>
  );
};

const AVC=[['#6366f1','#8b5cf6'],['#10b981','#059669'],['#f59e0b','#d97706'],['#0ea5e9','#0284c7'],['#ec4899','#db2777'],['#14b8a6','#0d9488']];
const avG = n => { const [a,b]=AVC[(n?.charCodeAt(0)||0)%AVC.length]; return `linear-gradient(135deg,${a},${b})`; };
const ago = d => {
  const s=Math.floor((Date.now()-new Date(d))/1000);
  if(s<60) return `${s}s ago`;
  if(s<3600) return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};
const fmt = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const initials = (fn,ln) => `${(fn||'?').charAt(0)}${(ln||'').charAt(0)}`.toUpperCase();

/* ─── Shared Atoms ─── */
const Badge = ({ label, color, bg, dot, size='sm' }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:3,
    background:bg, color, border:`1px solid ${color}30`,
    borderRadius:20, padding: size==='sm' ? '2px 7px' : '4px 10px',
    fontSize: size==='sm' ? 9 : 10, fontWeight:700, whiteSpace:'nowrap', letterSpacing:0.2,
    boxShadow:`0 1px 3px ${color}15` }}>
    {dot && <span style={{ width:4,height:4,borderRadius:'50%',background:dot,flexShrink:0,boxShadow:`0 0 4px ${dot}` }}/>}
    {label}
  </span>
);

const Avatar = ({ name, size=36, bg }) => (
  <div style={{ width:size, height:size, borderRadius:size/2.5, flexShrink:0,
    background: bg || avG(name), display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:size*0.38, fontWeight:800, color:'#fff', letterSpacing:0.5, userSelect:'none',
    boxShadow:'0 2px 8px rgba(0,0,0,0.15), inset 0 -2px 4px rgba(0,0,0,0.1)',
    border:'3px solid #fff' }}>
    {name?.split(' ').map(n=>n?.[0]).filter(Boolean).join('').slice(0,2).toUpperCase()||'?'}
  </div>
);

const Pill = ({ label, icon, selected, color, bg, onClick }) => (
  <button onClick={onClick}
    style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:11,
      cursor:'pointer', fontSize:13, fontWeight: selected ? 700 : 600, transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',
      border: selected ? `2px solid ${color}` : '1.5px solid #e2e8f0',
      background: selected ? `linear-gradient(135deg, ${bg} 0%, ${bg}dd 100%)` : 'linear-gradient(135deg, #fff 0%, #fafbfc 100%)',
      color: selected ? color : '#64748b',
      boxShadow: selected ? `0 0 0 4px ${color}15, 0 3px 8px ${color}20` : '0 2px 6px rgba(0,0,0,0.04)',
      outline:'none' }}>
    {icon && <span style={{ fontSize:16 }}>{icon}</span>}
    {label}
  </button>
);

const Chip = ({ label, icon, selected, color, bg, onClick }) => (
  <button onClick={onClick}
    style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9,
      cursor:'pointer', fontSize:12, fontWeight: selected ? 700 : 600, transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',
      border: selected ? `1.5px solid ${color}` : '1px solid #e2e8f0',
      background: selected ? bg : '#fafafa', color: selected ? color : '#94a3b8',
      boxShadow: selected ? `0 2px 6px ${color}20` : 'none',
      outline:'none' }}>
    <span>{icon}</span>{label}
  </button>
);

const Textarea = ({ value, onChange, placeholder, rows=4, style={} }) => (
  <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder}
    style={{ width:'100%', background:'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)', border:'1.5px solid #e2e8f0',
      borderRadius:11, padding:'12px 16px', color:'#0f172a', fontSize:14,
      outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box',
      lineHeight:1.7, transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)', ...style }}
    onFocus={e=>{ e.target.style.borderColor='#7c3aed'; e.target.style.boxShadow='0 0 0 4px rgba(124,58,237,0.12), 0 2px 8px rgba(0,0,0,0.04)'; e.target.style.background='#fff'; }}
    onBlur={e=>{ e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; e.target.style.background='linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)'; }}/>
);

const Input = ({ value, onChange, placeholder, style={} }) => (
  <input value={value} onChange={onChange} placeholder={placeholder}
    style={{ width:'100%', background:'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)', border:'1.5px solid #e2e8f0',
      borderRadius:11, padding:'12px 16px', color:'#0f172a', fontSize:14,
      outline:'none', boxSizing:'border-box', transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)', ...style }}
    onFocus={e=>{ e.target.style.borderColor='#7c3aed'; e.target.style.boxShadow='0 0 0 4px rgba(124,58,237,0.12), 0 2px 8px rgba(0,0,0,0.04)'; e.target.style.background='#fff'; }}
    onBlur={e=>{ e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; e.target.style.background='linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)'; }}/>
);

const Btn = ({ children, onClick, disabled, variant='primary', size='md', fullWidth }) => {
  const v = {
    primary: { bg:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', shadow:'0 4px 12px rgba(124,58,237,0.4)' },
    secondary:{ bg:'linear-gradient(135deg,#f1f5f9,#e2e8f0)', color:'#374151', border:'none', shadow:'0 2px 6px rgba(0,0,0,0.08)' },
    outline:  { bg:'#fff', color:'#374151', border:'1.5px solid #e2e8f0', shadow:'0 2px 6px rgba(0,0,0,0.04)' },
    danger:   { bg:'#fff', color:'#dc2626', border:'1.5px solid #fecaca', shadow:'0 2px 6px rgba(220,38,38,0.15)' },
    ghost:    { bg:'transparent', color:'#64748b', border:'none', shadow:'none' },
    red:      { bg:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', border:'none', shadow:'0 4px 12px rgba(239,68,68,0.35)' },
    green:    { bg:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', shadow:'0 4px 12px rgba(16,185,129,0.35)' },
  };
  const s = v[variant] || v.primary;
  const pad = size==='sm' ? '8px 18px' : size==='lg' ? '13px 30px' : '10px 22px';
  const fz  = size==='sm' ? 12 : size==='lg' ? 15 : 13;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:s.bg, color:s.color, border:s.border||'none',
        boxShadow:s.shadow, padding:pad, borderRadius:10, fontSize:fz, fontWeight:700,
        cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1,
        transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)', whiteSpace:'nowrap', width:fullWidth?'100%':'auto',
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
        outline:'none', letterSpacing:0.2 }}
      onMouseEnter={e=> { if(!disabled) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=s.shadow.replace(/rgba\(([^)]+)\)/, (m,p)=>`rgba(${p.split(',').slice(0,3).join(',')},${parseFloat(p.split(',')[3]||0.4)*1.3})`); } }}
      onMouseLeave={e=>{ if(!disabled) { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=s.shadow; } }}>
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .feedback-grid4,.feedback-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .feedback-grid2{grid-template-columns:1fr!important;}
    .feedback-split{flex-direction:column!important;}
    .feedback-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .feedback-panel{width:100%!important;}
    .feedback-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .feedback-form-row{grid-template-columns:1fr!important;}
    .feedback-hide{display:none!important;}
  }
  @media(max-width:480px){
    .feedback-grid4,.feedback-grid3,.feedback-grid2{grid-template-columns:1fr!important;}
  }
`}</style>
      {children}
    </button>
  );
};

const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick}
    style={{ background:'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', borderRadius:16, border:'2px solid #bbf7d0',
      boxShadow:'0 4px 16px rgba(16,185,129,0.08), 0 0 1px rgba(16,185,129,0.06)', ...style }}>
    {children}
  </div>
);

const Divider = () => <div style={{ height:1, background:'#f1f5f9', margin:'0' }}/>;

const KpiCard = ({ label, value, color, icon, sub }) => (
  <div style={{ background:'#fff', border:'1px solid #e8edf2', borderRadius:14,
    padding:'18px 22px', flex:'1 1 0', minWidth:110, position:'relative', overflow:'hidden',
    boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color, borderRadius:'14px 14px 0 0' }}/>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <div style={{ fontSize:28, fontWeight:800, color:'#0f172a', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginTop:5, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:color, fontWeight:600, marginTop:3 }}>{sub}</div>}
      </div>
      <div style={{ width:38,height:38,borderRadius:10,background:`${color}15`,
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{icon}</div>
    </div>
  </div>
);

const MiniBarChart = ({ data={}, colors={} }) => {
  const entries = Object.entries(data).filter(([,v])=>v>0);
  if(!entries.length) return <p style={{ color:'#cbd5e1', fontSize:13, margin:0 }}>No data yet</p>;
  const max = Math.max(...entries.map(e=>e[1]),1);
  return (
    <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:90 }}>
      {entries.map(([k,v])=>{
        const pct=(v/max)*100, c=colors[k]||'#7c3aed';
        return (
          <div key={k} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#374151', fontWeight:700 }}>{v}</span>
            <div style={{ width:'100%', background:'#f1f5f9', borderRadius:6, height:64, display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
              <div style={{ width:'100%', height:`${pct}%`, background:c, borderRadius:6, transition:'height 0.7s cubic-bezier(.4,0,.2,1)' }}/>
            </div>
            <span style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', textAlign:'center', maxWidth:54, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:0.3 }}>
              {k.replace(/_/g,' ')}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const InsightRow = ({ bySentiment={}, avgRatingByCategory=[] }) => {
  const pos=bySentiment.positive||0, neg=bySentiment.negative||0;
  const tot=(pos+neg+(bySentiment.neutral||0))||1;
  const topP=avgRatingByCategory.filter(r=>r.avg>=4).sort((a,b)=>b.avg-a.avg).slice(0,3);
  const topN=avgRatingByCategory.filter(r=>r.avg<3).sort((a,b)=>a.avg-b.avg).slice(0,3);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      {/* Positive */}
      <Card style={{ padding:22, borderTop:'3px solid #10b981' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
          <div style={{ width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#10b981,#059669)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>😊</div>
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#059669' }}>What's Working Well</p>
            <p style={{ margin:0, fontSize:12, color:'#94a3b8', marginTop:2 }}>{Math.round((pos/tot)*100)}% positive feedback</p>
          </div>
        </div>
        {topP.length ? topP.map((r,i)=>(
          <div key={r._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'10px 14px', background: i%2===0?'#f0fdf4':'#fff', borderRadius:9, marginBottom:6 }}>
            <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{CAT[r._id]?.icon} {CAT[r._id]?.label||r._id}</span>
            <span style={{ fontSize:13, fontWeight:800, color:'#059669' }}>{r.avg.toFixed(1)} ★</span>
          </div>
        )) : <p style={{ color:'#cbd5e1', fontSize:13, margin:0, textAlign:'center', padding:'16px 0' }}>No ratings yet</p>}
      </Card>
      {/* Negative */}
      <Card style={{ padding:22, borderTop:'3px solid #ef4444' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
          <div style={{ width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#ef4444,#dc2626)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>😞</div>
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#dc2626' }}>Needs Improvement</p>
            <p style={{ margin:0, fontSize:12, color:'#94a3b8', marginTop:2 }}>{Math.round((neg/tot)*100)}% negative feedback</p>
          </div>
        </div>
        {topN.length ? topN.map((r,i)=>(
          <div key={r._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'10px 14px', background: i%2===0?'#fff1f2':'#fff', borderRadius:9, marginBottom:6 }}>
            <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{CAT[r._id]?.icon} {CAT[r._id]?.label||r._id}</span>
            <span style={{ fontSize:13, fontWeight:800, color:'#dc2626' }}>{r.avg.toFixed(1)} ★</span>
          </div>
        )) : <p style={{ color:'#cbd5e1', fontSize:13, margin:0, textAlign:'center', padding:'16px 0' }}>All areas performing well 🎉</p>}
      </Card>
    </div>
  );
};

const EmptyState = ({ icon, title, sub }) => (
  <div style={{ textAlign:'center', padding:'80px 32px' }}>
    <div style={{ fontSize:56, marginBottom:20, opacity:0.5, filter:'grayscale(0.3)' }}>{icon}</div>
    <p style={{ fontSize:17, fontWeight:800, color:'#374151', margin:'0 0 8px', letterSpacing:-0.2 }}>{title}</p>
    <p style={{ fontSize:14, color:'#94a3b8', margin:0, fontWeight:500 }}>{sub}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   TIER 0 — TENANT USER
═══════════════════════════════════════════════════════════ */
const TenantUserView = () => {
  const [tab,    setTab]    = useState('submit');
  const [form,   setForm]   = useState({ type:'', category:'other', title:'', description:'', rating:0 });
  const [sending,setSending]= useState(false);
  const [sent,   setSent]   = useState(false);
  const [descError, setDescError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [history,setHistory]= useState([]);
  const [hLoad,  setHLoad]  = useState(false);
  const [selId,  setSelId]  = useState(null);
  const [detail, setDetail] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);

  useEffect(()=>{ if(tab==='history') loadHistory(); },[tab]);

  const loadHistory = async() => {
    setHLoad(true);
    try{ const d=await api.mine({limit:50}); setHistory(d.data||[]); }catch{}
    setHLoad(false);
  };

  const openDetail = async id => {
    setSelId(s=>s===id?null:id); setDetail(null);
    try{ const d=await api.byId(id); setDetail(d.data); }catch{}
  };

  const handleSubmit = async() => {
    // Clear previous errors
    setTitleError('');
    setDescError('');

    // Basic checks
    if(!form.type) {
      alert('Please select a feedback type');
      return;
    }
    if(!form.title.trim()) {
      setTitleError('Title is required');
      return;
    }
    if(!form.description.trim()) {
      setDescError('Description is required');
      return;
    }

    // Title validation
    const trimmedTitle = form.title.trim();
    if (trimmedTitle.length < 5) {
      setTitleError('Title too short - minimum 5 characters');
      return;
    }
    const titleLetters = (trimmedTitle.match(/[a-zA-Z]/g) || []).length;
    if (titleLetters < 3) {
      setTitleError('Title must contain at least 3 letters');
      return;
    }
    const titleAlphanumeric = (trimmedTitle.match(/[a-zA-Z0-9]/g) || []).length;
    const titleRatio = titleAlphanumeric / trimmedTitle.length;
    if (titleRatio < 0.5) {
      setTitleError('Title must contain readable text, not just symbols');
      return;
    }

    // Description validation
    const trimmedDesc = form.description.trim();
    if (trimmedDesc.length < 20) {
      setDescError('Description too short - minimum 20 characters');
      return;
    }
    const descLetters = (trimmedDesc.match(/[a-zA-Z]/g) || []).length;
    if (descLetters < 10) {
      setDescError('Description must contain at least 10 letters');
      return;
    }
    const descAlphanumeric = (trimmedDesc.match(/[a-zA-Z0-9]/g) || []).length;
    const descRatio = descAlphanumeric / trimmedDesc.length;
    if (descRatio < 0.5) {
      setDescError('Please enter a meaningful feedback description using letters and numbers');
      return;
    }

    // All validations passed - submit
    setSending(true);
    try{
      // If no attachments, use regular JSON
      if (attachments.length === 0) {
        await api.submit({...form, rating:form.rating||undefined});
      } else {
        // Use FormData only when files are present
        const formData = new FormData();
        formData.append('type', form.type);
        formData.append('category', form.category);
        formData.append('title', form.title);
        formData.append('description', form.description);
        if(form.rating) formData.append('rating', form.rating);

        // Append files
        attachments.forEach(file => {
          formData.append('attachments', file);
        });

        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        await axios.post(`${BASE}/api/feedback`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type - axios will auto-set with boundary
          }
        });
      }

      setSent(true);
      setForm({type:'',category:'other',title:'',description:'',rating:0});
      setAttachments([]);
      setDescError('');
      setTitleError('');

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(()=>setSent(false),5000);
    }catch{}
    setSending(false);
  };

  const canSubmit = form.type && form.title.trim() && form.description.trim() && !titleError && !descError;
  const stats = { total:history.length, open:history.filter(h=>!['resolved','closed'].includes(h.status)).length, replied:history.filter(h=>h.tenantAdminReply).length };
  const ratingLabel = ['','Poor','Fair','Good','Very Good','Excellent'];

  // Filter and paginate history
  const filteredHistory = history.filter(h => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return h.title?.toLowerCase().includes(q) ||
           h.description?.toLowerCase().includes(q) ||
           h.category?.toLowerCase().includes(q) ||
           h.type?.toLowerCase().includes(q);
  });
  const totalHistory = filteredHistory.length;
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * historyLimit, historyPage * historyLimit);
  const totalPages = Math.ceil(totalHistory / historyLimit);

  return (
    <DashboardLayout>
      <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

        {/* ── Page Header ── */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e8edf2' }}>
          <div style={{ maxWidth:780, margin:'0 auto', padding:'28px 32px 0' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:24 }}>
              <div style={{ width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>💬</div>
              <div>
                <h1 style={{ margin:'0 0 4px', fontSize:24, fontWeight:800, color:'#0f172a', letterSpacing:-0.5 }}>Feedback</h1>
                <p style={{ margin:0, fontSize:14, color:'#64748b' }}>Your voice matters — every message helps us improve.</p>
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display:'flex', gap:0, borderBottom:'2px solid #f1f5f9' }}>
              {[{id:'submit',label:'✏️ Submit Feedback'},{id:'history',label:`📋 My Submissions${history.length?` (${history.length})`:''}`}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{ padding:'12px 22px', fontSize:13, fontWeight:600, cursor:'pointer',
                    background:'transparent', border:'none', outline:'none',
                    color: tab===t.id ? '#7c3aed' : '#94a3b8',
                    borderBottom: tab===t.id ? '2px solid #7c3aed' : '2px solid transparent',
                    marginBottom:-2, transition:'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth:780, margin:'0 auto', padding:'32px' }}>

          {/* SUBMIT TAB */}
          {tab==='submit' && (
            <>
              {sent && (
                <div style={{ background:'linear-gradient(135deg,#ecfdf5,#d1fae5)', border:'1px solid #6ee7b7',
                  borderRadius:14, padding:'18px 22px', marginBottom:28,
                  display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#10b981,#059669)',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>✓</div>
                  <div>
                    <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:700, color:'#065f46' }}>Submitted successfully!</p>
                    <p style={{ margin:0, fontSize:13, color:'#047857' }}>Our team will review it shortly and get back to you.</p>
                  </div>
                </div>
              )}

              <Card style={{ padding:32 }}>
                {/* Step 1 — Type */}
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <div style={{ width:26,height:26,borderRadius:8,background:form.type?'linear-gradient(135deg,#7c3aed,#6d28d9)':'#f1f5f9',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:form.type?'#fff':'#94a3b8',flexShrink:0 }}>1</div>
                    <span style={{ fontSize:13, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:0.8 }}>Feedback Type</span>
                    {form.type && <span style={{ fontSize:12, color:'#7c3aed', fontWeight:600 }}>✓ {TYPE[form.type]?.label}</span>}
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {Object.entries(TYPE).map(([k,m])=>(
                      <Pill key={k} label={m.label} icon={m.icon} selected={form.type===k}
                        color={m.color} bg={m.bg} onClick={()=>setForm(f=>({...f,type:k}))}/>
                    ))}
                  </div>
                </div>

                <Divider/>

                {/* Step 2 — Category */}
                <div style={{ marginTop:24, marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{ width:26,height:26,borderRadius:8,background:'#f1f5f9',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#94a3b8' }}>2</div>
                    <span style={{ fontSize:13, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:0.8 }}>Area</span>
                  </div>
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                    {Object.entries(CAT).map(([k,m])=>(
                      <Chip key={k} label={m.label} icon={m.icon} selected={form.category===k}
                        color={m.color} bg={m.bg} onClick={()=>setForm(f=>({...f,category:k}))}/>
                    ))}
                  </div>
                </div>

                <Divider/>

                {/* Step 3 — Details */}
                <div style={{ marginTop:24 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                    <div style={{ width:26,height:26,borderRadius:8,background:'#f1f5f9',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#94a3b8' }}>3</div>
                    <span style={{ fontSize:13, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:0.8 }}>Details</span>
                  </div>

                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>
                      Title <span style={{ color:'#ef4444' }}>*</span>
                    </label>
                    <Input
                      value={form.title}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(f => ({ ...f, title: val }));
                        setTitleError('');

                        const trimmed = val.trim();
                        if (trimmed.length > 0 && trimmed.length < 5) {
                          setTitleError('Title too short - minimum 5 characters');
                        } else if (trimmed.length > 0) {
                          const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
                          if (letterCount < 3) {
                            setTitleError('Title must contain at least 3 letters');
                          } else {
                            const alphanumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
                            const alphanumericRatio = alphanumericCount / trimmed.length;
                            if (alphanumericRatio < 0.5) {
                              setTitleError('Title must contain readable text, not just symbols');
                            }
                          }
                        }
                      }}
                      placeholder="Give your feedback a clear, descriptive title"
                      style={{ borderColor: titleError ? '#ef4444' : '#e2e8f0' }}
                    />
                    {titleError && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>⚠️</span>
                        <span>{titleError}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom:20 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>
                      Description <span style={{ color:'#ef4444' }}>*</span>
                    </label>
                    <Textarea
                      value={form.description}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(f => ({ ...f, description: val }));
                        setDescError('');

                        const trimmed = val.trim();
                        if (trimmed.length > 0 && trimmed.length < 20) {
                          setDescError('Description too short - minimum 20 characters');
                        } else if (trimmed.length > 0) {
                          const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
                          if (letterCount < 10) {
                            setDescError('Description must contain at least 10 letters');
                          } else {
                            const alphanumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
                            const alphanumericRatio = alphanumericCount / trimmed.length;
                            if (alphanumericRatio < 0.5) {
                              setDescError('Please enter a meaningful feedback description using letters and numbers');
                            }
                          }
                        }
                      }}
                      rows={5}
                      placeholder="Tell us as much as you can — the more context, the better we can help you."
                      style={{ borderColor: descError ? '#ef4444' : '#e2e8f0' }}
                    />
                    {descError && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>⚠️</span>
                        <span>{descError}</span>
                      </div>
                    )}
                  </div>

                  {/* File Attachment */}
                  <div style={{ marginBottom:20 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>
                      Attachments <span style={{ color:'#94a3b8', fontWeight:400, textTransform:'none', fontSize:12 }}>(optional)</span>
                    </label>
                    <div style={{ border:'2px dashed #e2e8f0', borderRadius:11, padding:'20px', background:'#fafbfc', textAlign:'center', transition:'all 0.2s' }}
                      onDragOver={e=>{ e.preventDefault(); e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.background='#f5f3ff'; }}
                      onDragLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#fafbfc'; }}
                      onDrop={e=>{ e.preventDefault(); e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#fafbfc';
                        const files=Array.from(e.dataTransfer.files);
                        setAttachments(prev=>[...prev,...files]);
                      }}>
                      <input type="file" multiple accept="image/*,.pdf,.doc,.docx" id="fileInput"
                        style={{ display:'none' }}
                        onChange={e=>{
                          const files=Array.from(e.target.files);
                          setAttachments(prev=>[...prev,...files]);
                        }}/>
                      <label htmlFor="fileInput" style={{ cursor:'pointer' }}>
                        <div style={{ fontSize:32, marginBottom:8 }}>📎</div>
                        <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:600, color:'#374151' }}>Click to upload or drag and drop</p>
                        <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>PNG, JPG, PDF, DOC (max 5MB each)</p>
                      </label>
                    </div>
                    {attachments.length>0 && (
                      <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
                        {attachments.map((file,idx)=>(
                          <div key={idx} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px',
                            background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:18 }}>📄</span>
                              <div>
                                <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#374151' }}>{file.name}</p>
                                <p style={{ margin:0, fontSize:10, color:'#94a3b8' }}>{(file.size/1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <button onClick={()=>setAttachments(prev=>prev.filter((_,i)=>i!==idx))}
                              style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, padding:4 }}>❌</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div style={{ marginBottom:28, padding:'16px 18px', background:'#fafafa', borderRadius:12, border:'1px solid #f1f5f9' }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>
                      Overall Rating <span style={{ color:'#94a3b8', fontWeight:400, textTransform:'none', fontSize:12 }}>(optional)</span>
                    </label>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {[1,2,3,4,5].map(r=>(
                        <button key={r} onClick={()=>setForm(f=>({...f,rating:r===f.rating?0:r}))}
                          style={{ width:44, height:44, borderRadius:10, fontSize:22, cursor:'pointer',
                            border: form.rating>=r ? '2px solid #f59e0b' : '1.5px solid #e2e8f0',
                            background: form.rating>=r ? '#fffbeb' : '#fff',
                            transition:'all 0.15s', outline:'none',
                            boxShadow: form.rating===r ? '0 0 0 4px rgba(245,158,11,0.2)' : 'none',
                            transform: form.rating>=r ? 'scale(1.08)' : 'scale(1)' }}>
                          ⭐
                        </button>
                      ))}
                      {form.rating>0 && (
                        <span style={{ marginLeft:8, fontSize:14, color:'#d97706', fontWeight:700 }}>
                          {ratingLabel[form.rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <div style={{ display:'flex', alignItems:'center', gap:14, paddingTop:20, borderTop:'1.5px solid #f1f5f9' }}>
                    <Btn onClick={handleSubmit} disabled={sending||!canSubmit} size="lg">
                      {sending ? '⏳ Submitting…' : '🚀 Submit Feedback'}
                    </Btn>
                    {!canSubmit && (
                      <span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>
                        {!form.type ? '⚠️ Select a feedback type first' : !form.title.trim() ? '⚠️ Add a title to continue' : '⚠️ Add a description to continue'}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* HISTORY TAB */}
          {tab==='history' && (
            <>
              <div style={{ display:'flex', gap:12, marginBottom:28 }}>
                <KpiCard label="Submitted" value={stats.total}   color="#7c3aed" icon="📊"/>
                <KpiCard label="Open"      value={stats.open}    color="#f59e0b" icon="⏳"/>
                <KpiCard label="Replied"   value={stats.replied} color="#10b981" icon="💬"/>
              </div>

              {/* Search Bar */}
              {history.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <input
                    type="text"
                    placeholder="🔍 Search submissions by title, description, category..."
                    value={historySearch}
                    onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: 14,
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 10,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              )}

              {hLoad ? (
                <Card style={{ padding:60, textAlign:'center' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
                  <p style={{ color:'#94a3b8', margin:0 }}>Loading your submissions…</p>
                </Card>
              ) : history.length===0 ? (
                <Card><EmptyState icon="📭" title="No submissions yet" sub="Submit your first feedback above and track responses here."/></Card>
              ) : filteredHistory.length === 0 ? (
                <Card><EmptyState icon="🔍" title="No results found" sub="Try a different search term or clear the filter."/></Card>
              ) : (
                <Card>
                  {paginatedHistory.map((fb,i)=>{
                    const t=TYPE[fb.type]||{icon:'💬',color:'#64748b',bg:'#f8fafc'};
                    const ts=TSTATUS[fb.tenantAdminStatus]||TSTATUS.pending;
                    const expanded=selId===fb._id;
                    return (
                      <div key={fb._id}>
                        {i>0 && <Divider/>}
                        <div onClick={()=>openDetail(fb._id)}
                          style={{ padding:'18px 22px', cursor:'pointer', transition:'background 0.12s',
                            background: expanded ? '#faf5ff' : '#fff',
                            borderLeft:`3px solid ${expanded?'#7c3aed':ts.dot||'transparent'}`,
                            borderRadius: i===0 ? '14px 14px 0 0' : i===paginatedHistory.length-1&&!expanded ? '0 0 14px 14px' : 0 }}
                          onMouseEnter={e=>{ if(!expanded) e.currentTarget.style.background='#fafafa'; }}
                          onMouseLeave={e=>{ if(!expanded) e.currentTarget.style.background='#fff'; }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                                <span style={{ fontSize:18 }}>{t.icon}</span>
                                <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{fb.title}</span>
                                {fb.tenantAdminReply && <Badge label="Replied" color="#059669" bg="#ecfdf5" dot="#10b981"/>}
                                {fb.escalatedToSaas  && <Badge label="Escalated" color="#dc2626" bg="#fef2f2" dot="#ef4444"/>}
                              </div>
                              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                <Badge label={CAT[fb.category]?.label||'Other'} color={CAT[fb.category]?.color} bg={CAT[fb.category]?.bg}/>
                                <Badge label={ts.label} color={ts.color} bg={ts.bg} dot={ts.dot}/>
                              </div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                              <span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>{ago(fb.createdAt)}</span>
                              <span style={{ fontSize:18, color:'#cbd5e1' }}>{expanded?'▲':'▼'}</span>
                            </div>
                          </div>

                          {/* Expanded thread view */}
                          {expanded && (
                            <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid #f1f5f9' }}
                              onClick={e=>e.stopPropagation()}>
                              <p style={{ margin:'0 0 16px', fontSize:14, color:'#374151', lineHeight:1.8 }}>{detail?.description||fb.description}</p>

                              {fb.rating>0 && (
                                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#fffbeb', border:'1px solid #fde68a',
                                  borderRadius:8, padding:'6px 12px', marginBottom:16 }}>
                                  <span style={{ fontSize:14 }}>{'⭐'.repeat(fb.rating)}</span>
                                  <span style={{ fontSize:12, color:'#92400e', fontWeight:600 }}>{ratingLabel[fb.rating]}</span>
                                </div>
                              )}

                              {/* Attachments */}
                              {detail?.attachments && detail.attachments.length > 0 && (
                                <div style={{ marginBottom:16 }}>
                                  <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:0.5 }}>Attachments</p>
                                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                    {detail.attachments.map((att,idx)=>(
                                      <a key={idx} href={`${BASE}/${att.path}`} target="_blank" rel="noopener noreferrer"
                                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px',
                                          background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, textDecoration:'none',
                                          transition:'all 0.2s' }}
                                        onMouseEnter={e=>{ e.currentTarget.style.background='#dcfce7'; e.currentTarget.style.borderColor='#86efac'; }}
                                        onMouseLeave={e=>{ e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.borderColor='#bbf7d0'; }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                          <span style={{ fontSize:18 }}>
                                            {att.mimetype?.includes('image') ? '🖼️' : att.mimetype?.includes('pdf') ? '📄' : '📎'}
                                          </span>
                                          <div>
                                            <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#374151' }}>{att.originalName}</p>
                                            <p style={{ margin:0, fontSize:10, color:'#94a3b8' }}>{(att.size/1024).toFixed(1)} KB</p>
                                          </div>
                                        </div>
                                        <span style={{ fontSize:16 }}>⬇️</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Conversation thread */}
                              {detail?.tenantAdminReply && (
                                <div style={{ marginTop:16, borderLeft:'3px solid #10b981', paddingLeft:16 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                                    <div style={{ width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#10b981,#059669)',
                                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#fff',fontWeight:700 }}>A</div>
                                    <span style={{ fontSize:12, fontWeight:700, color:'#059669' }}>Admin</span>
                                    <span style={{ fontSize:11, color:'#94a3b8' }}>· {ago(detail.tenantAdminRepliedAt)}</span>
                                  </div>
                                  <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.7, background:'#f0fdf4', borderRadius:10, padding:'12px 16px' }}>{detail.tenantAdminReply}</p>
                                </div>
                              )}

                              {detail?.adminReply && (
                                <div style={{ marginTop:14, borderLeft:'3px solid #7c3aed', paddingLeft:16 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                                    <div style={{ width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
                                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#fff',fontWeight:700 }}>S</div>
                                    <span style={{ fontSize:12, fontWeight:700, color:'#7c3aed' }}>Support Team</span>
                                    <span style={{ fontSize:11, color:'#94a3b8' }}>· {ago(detail.repliedAt)}</span>
                                  </div>
                                  <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.7, background:'#f5f3ff', borderRadius:10, padding:'12px 16px' }}>{detail.adminReply}</p>
                                </div>
                              )}

                              {!detail?.tenantAdminReply && !detail?.adminReply && (
                                <div style={{ padding:'14px 18px', background:'#fafafa', borderRadius:10, border:'1px dashed #e2e8f0' }}>
                                  <p style={{ margin:0, fontSize:13, color:'#94a3b8' }}>⏳ Awaiting response from the team…</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Footer */}
                  {totalPages > 1 && (
                    <>
                      <Divider />
                      <div style={{ padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                            Showing <strong>{((historyPage - 1) * historyLimit) + 1}-{Math.min(historyPage * historyLimit, totalHistory)}</strong> of <strong>{totalHistory}</strong>
                          </span>
                          <select
                            value={historyLimit}
                            onChange={e => { setHistoryLimit(Number(e.target.value)); setHistoryPage(1); }}
                            style={{ padding: '6px 10px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', outline: 'none' }}
                          >
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                            disabled={historyPage === 1}
                            style={{
                              padding: '7px 14px',
                              fontSize: 12,
                              fontWeight: 600,
                              border: '1px solid #e2e8f0',
                              borderRadius: 7,
                              background: historyPage === 1 ? '#f8fafc' : '#fff',
                              color: historyPage === 1 ? '#cbd5e1' : '#475569',
                              cursor: historyPage === 1 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            ← Previous
                          </button>
                          <span style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                            Page {historyPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                            disabled={historyPage === totalPages}
                            style={{
                              padding: '7px 14px',
                              fontSize: 12,
                              fontWeight: 600,
                              border: '1px solid #e2e8f0',
                              borderRadius: 7,
                              background: historyPage === totalPages ? '#f8fafc' : '#fff',
                              color: historyPage === totalPages ? '#cbd5e1' : '#475569',
                              cursor: historyPage === totalPages ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ═══════════════════════════════════════════════════════════
   TIER 1 — TENANT ADMIN
═══════════════════════════════════════════════════════════ */
const TenantAdminView = () => {
  const { user } = useAuth();
  const [tab,         setTab]        = useState('inbox');
  const [list,        setList]       = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [analytics,   setAnalytics]  = useState(null);
  const [selId,       setSelId]      = useState(null);
  const [detail,      setDetail]     = useState(null);
  const [reply,       setReply]      = useState('');
  const [escalReason, setEscalReason]= useState('');
  const [showEscal,   setShowEscal]  = useState(false);
  const [busy,        setBusy]       = useState(false);
  const [filters,     setFilters]    = useState({search:'',tenantAdminStatus:'',type:'',category:'',sentiment:''});
  const [cForm,       setCForm]      = useState({type:'',category:'other',title:'',description:'',rating:0});
  const [cAttachments, setCAttachments] = useState([]);
  const [cSending,    setCsend]      = useState(false);
  const [cSent,       setCSent]      = useState(false);
  const [cDescError,  setCDescError] = useState('');
  const [cTitleError, setCTitleError]= useState('');

  // DEBUG: Log user info
  console.log('👤 Current User:', { email: user?.email, tenant: user?.tenant, userType: user?.userType });

  const loadInbox = useCallback(async()=>{
    setLoading(true);
    try{
      const p={};
      if(filters.search)            p.search            =filters.search;
      if(filters.tenantAdminStatus) p.tenantAdminStatus =filters.tenantAdminStatus;
      if(filters.type)              p.type              =filters.type;
      if(filters.category)          p.category          =filters.category;
      if(filters.sentiment)         p.sentiment         =filters.sentiment;
      const d=await api.tenantInbox(p); setList(d.data||[]);
    }catch{} setLoading(false);
  },[filters]);

  const loadAnalytics = useCallback(async()=>{
    try{
      const d=await api.tenantAnalytics({days:90}); // Changed to 90 days to show older feedback
      console.log('📊 Analytics Response:', d);
      setAnalytics(d.data);
    }catch(err){
      console.error('❌ Analytics Error:', err);
    }
  },[]);

  useEffect(()=>{ loadInbox(); },[loadInbox]);
  useEffect(()=>{ loadAnalytics(); },[loadAnalytics]);

  const selectItem = async id=>{
    setSelId(id); setReply(''); setShowEscal(false); setDetail(null);
    try{ const d=await api.byId(id); setDetail(d.data); setReply(d.data.tenantAdminReply||''); }catch{}
  };
  const doReply = async()=>{
    if(!reply.trim()) return; setBusy(true);
    try{ const d=await api.tenantReply(selId,{reply}); setDetail(d.data); setList(l=>l.map(f=>f._id===selId?{...f,...d.data}:f)); }catch{}
    setBusy(false);
  };
  const doStatus = async s=>{
    setBusy(true);
    try{ const d=await api.tenantStatus(selId,{tenantAdminStatus:s}); setDetail(p=>({...p,...d.data})); setList(l=>l.map(f=>f._id===selId?{...f,...d.data}:f)); }catch{}
    setBusy(false);
  };
  const doEscalate = async()=>{
    setBusy(true);
    try{
      console.log('🚀 Escalating feedback:', selId, {reason: escalReason});
      const d=await api.escalate(selId,{reason:escalReason});
      console.log('✅ Escalation response:', d);
      setDetail(p=>({...p,...d.data}));
      setList(l=>l.map(f=>f._id===selId?{...f,...d.data}:f));
      setShowEscal(false);
      alert('✅ Successfully escalated to SAAS admin!');
    }catch(err){
      console.error('❌ Escalation failed:', err);
      alert('❌ Failed to escalate: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
    setBusy(false);
  };
  const doContactSaas = async() => {
    // Clear previous errors
    setCTitleError('');
    setCDescError('');

    // Basic checks
    if(!cForm.type||!cForm.title.trim()||!cForm.description.trim()) {
      if(!cForm.type) alert('Please select a feedback type');
      if(!cForm.title.trim()) setCTitleError('Title is required');
      if(!cForm.description.trim()) setCDescError('Description is required');
      return;
    }

    // Title validation
    const trimmedTitle = cForm.title.trim();
    if (trimmedTitle.length < 5) { setCTitleError('Title too short - minimum 5 characters'); return; }
    const titleLetters = (trimmedTitle.match(/[a-zA-Z]/g) || []).length;
    if (titleLetters < 3) { setCTitleError('Title must contain at least 3 letters'); return; }
    const titleAlphanumeric = (trimmedTitle.match(/[a-zA-Z0-9]/g) || []).length;
    const titleRatio = titleAlphanumeric / trimmedTitle.length;
    if (titleRatio < 0.5) { setCTitleError('Title must contain readable text, not just symbols'); return; }

    // Description validation
    const trimmedDesc = cForm.description.trim();
    if (trimmedDesc.length < 20) { setCDescError('Description too short - minimum 20 characters'); return; }
    const descLetters = (trimmedDesc.match(/[a-zA-Z]/g) || []).length;
    if (descLetters < 10) { setCDescError('Description must contain at least 10 letters'); return; }
    const descAlphanumeric = (trimmedDesc.match(/[a-zA-Z0-9]/g) || []).length;
    const descRatio = descAlphanumeric / trimmedDesc.length;
    if (descRatio < 0.5) { setCDescError('Please enter a meaningful feedback description using letters and numbers'); return; }

    setCsend(true);
    try{
      // If no attachments, use regular JSON
      if (cAttachments.length === 0) {
        await api.submit({...cForm, rating:cForm.rating||undefined, directToSaas:true});
      } else {
        // Use FormData only when files are present
        const formData = new FormData();
        formData.append('type', cForm.type);
        formData.append('category', cForm.category);
        formData.append('title', cForm.title);
        formData.append('description', cForm.description);
        if(cForm.rating) formData.append('rating', cForm.rating);
        formData.append('directToSaas', 'true');

        // Append files
        cAttachments.forEach(file => {
          formData.append('attachments', file);
        });

        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        await axios.post(`${BASE}/api/feedback`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type - axios will auto-set with boundary
          }
        });
      }

      setCSent(true);
      setCForm({type:'',category:'other',title:'',description:'',rating:0});
      setCAttachments([]);
      setCDescError('');
      setCTitleError('');

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(()=>setCSent(false),5000);
    }catch{}
    setCsend(false);
  };

  const unread = list.filter(f=>f.tenantAdminStatus==='pending').length;
  const TABS = [
    { id:'inbox',        label:'Inbox',           icon:'📥', badge: unread||null },
    { id:'insights',     label:'Insights',        icon:'📊' },
    { id:'contact_saas', label:'Submit Feedback', icon:'📨' },
  ];

  return (
    <DashboardLayout>
      <style>{STAT_CSS}</style>
      <div style={{ height:'100vh', background:'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)', display:'flex', overflow:'hidden',
        fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

        {/* ── Sidebar ── */}
        <div style={{ width:220, flexShrink:0, background:'linear-gradient(180deg, #064e3b 0%, #065f46 50%, #14532d 100%)',
          borderRight:'3px solid transparent',
          backgroundImage:'linear-gradient(180deg, #064e3b 0%, #065f46 50%, #14532d 100%), linear-gradient(135deg, #10b981 0%, #059669 100%)',
          backgroundOrigin:'border-box', backgroundClip:'padding-box, border-box',
          display:'flex', flexDirection:'column', boxShadow:'4px 0 20px rgba(16,185,129,0.25)' }}>

          {/* Header */}
          <div style={{ padding:'20px 16px', borderBottom:'2px solid rgba(16,185,129,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,
                boxShadow:'0 4px 12px rgba(251,191,36,0.4), 0 0 0 3px rgba(251,191,36,0.2)' }}>📬</div>
              <div>
                <h1 style={{ margin:0, fontSize:17, fontWeight:900, color:'#ffffff', letterSpacing:-0.3, textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>Feedback</h1>
              </div>
            </div>
            <p style={{ margin:0, fontSize:10, color:'#a7f3d0', fontWeight:600, lineHeight:1.4 }}>Manage team feedback</p>
          </div>

          {/* Tabs */}
          <div style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
            {TABS.map((t, idx)=>{
              const tabColors = [
                { bg:'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow:'#10b981' },
                { bg:'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', glow:'#14b8a6' },
                { bg:'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', glow:'#22c55e' },
              ];
              const tc = tabColors[idx] || tabColors[0];
              return (
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 14px', marginBottom:6,
                    fontSize:12, fontWeight:700, cursor:'pointer', border:'none', borderRadius:12,
                    outline:'none', transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)', textAlign:'left',
                    background: tab===t.id ? tc.bg : 'rgba(16,185,129,0.15)',
                    color: tab===t.id ? '#ffffff' : '#a7f3d0',
                    boxShadow: tab===t.id ? `0 4px 16px ${tc.glow}40, 0 0 0 2px ${tc.glow}30` : 'none',
                    transform: tab===t.id ? 'translateX(4px)' : 'translateX(0)' }}
                  onMouseEnter={e=>{ if(tab!==t.id) { e.currentTarget.style.background='rgba(16,185,129,0.25)'; e.currentTarget.style.color='#d1fae5'; e.currentTarget.style.transform='translateX(2px)'; } }}
                  onMouseLeave={e=>{ if(tab!==t.id) { e.currentTarget.style.background='rgba(16,185,129,0.15)'; e.currentTarget.style.color='#a7f3d0'; e.currentTarget.style.transform='translateX(0)'; } }}>
                  <span style={{ fontSize:18 }}>{t.icon}</span>
                  <span style={{ flex:1 }}>{t.label}</span>
                  {t.badge && (
                    <span style={{ background:'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color:'#fff', borderRadius:20,
                      padding:'3px 8px', fontSize:9, fontWeight:900, boxShadow:'0 2px 8px rgba(239,68,68,0.4), 0 0 0 2px rgba(239,68,68,0.2)',
                      animation:'pulse 2s infinite' }}>{t.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer decoration */}
          <div style={{ padding:'16px', borderTop:'2px solid rgba(16,185,129,0.3)' }}>
            <div style={{ background:'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.2) 100%)',
              borderRadius:10, padding:'10px 12px', border:'1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e' }}/>
                <span style={{ fontSize:10, color:'#a7f3d0', fontWeight:700 }}>System Active</span>
              </div>
              <p style={{ margin:0, fontSize:9, color:'#6ee7b7', lineHeight:1.3 }}>{list.length} items tracked</p>
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Stats Header */}
          {analytics && (
            <div style={{ background:'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', borderBottom:'2px solid #bbf7d0',
              padding:'16px 20px', flexShrink:0, boxShadow:'0 2px 8px rgba(16,185,129,0.08)' }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[
                  {k:'all',      l:'Total',    v:analytics.total||0,                 c:'#6366f1', f:()=>setFilters(p=>({...p,tenantAdminStatus:'',sentiment:''})),           act:!filters.tenantAdminStatus&&!filters.sentiment},
                  {k:'pending',  l:'Pending',  v:analytics.open||0,                  c:'#f59e0b', f:()=>setFilters(p=>({...p,tenantAdminStatus:'pending',sentiment:''})),     act:filters.tenantAdminStatus==='pending'},
                  {k:'resolved', l:'Resolved', v:analytics.resolved||0,              c:'#10b981', f:()=>setFilters(p=>({...p,tenantAdminStatus:'resolved',sentiment:''})),    act:filters.tenantAdminStatus==='resolved'},
                  {k:'escalated',l:'Escalated',v:analytics.escalated||0,             c:'#ef4444', f:()=>setFilters(p=>({...p,tenantAdminStatus:'escalated',sentiment:''})),   act:filters.tenantAdminStatus==='escalated'},
                  {k:'positive', l:'Positive', v:`${analytics.positiveRate||0}%`,    c:'#10b981', f:()=>setFilters(p=>({...p,sentiment:'positive',tenantAdminStatus:''})),    act:filters.sentiment==='positive'},
                ].map(s=>(
                  <GradStat key={s.k} label={s.l} value={s.v} color={s.c} active={s.act} onClick={s.f}/>
                ))}
              </div>
            </div>
          )}

        {/* ── INBOX TAB ── */}
        {tab==='inbox' && (
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

            {/* List pane */}
            <div style={{ width: selId ? '40%' : '100%', flexShrink:0, borderRight: selId ? '2px solid #bbf7d0' : 'none',
              display:'flex', flexDirection:'column', background:'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
              transition:'all 0.3s cubic-bezier(.4,0,.2,1)', boxShadow: selId ? '2px 0 8px rgba(16,185,129,0.06)' : 'none' }}>

              {/* Filters */}
              <div style={{ padding:'10px 14px', borderBottom:'2px solid #bbf7d0', background:'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)' }}>
                <div style={{ position:'relative', marginBottom:6 }}>
                  <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#94a3b8' }}>🔍</span>
                  <input value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))}
                    placeholder="Search feedback…"
                    style={{ width:'100%', background:'linear-gradient(135deg, #fff 0%, #fafbfc 100%)', border:'1.5px solid #e8edf2', borderRadius:8,
                      padding:'7px 10px 7px 32px', color:'#374151', fontSize:12, outline:'none', boxSizing:'border-box',
                      transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)', fontWeight:500 }}
                    onFocus={e=>{ e.target.style.borderColor='#7c3aed'; e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background='#fff'; }}
                    onBlur={e=>{ e.target.style.borderColor='#e8edf2'; e.target.style.boxShadow='none'; e.target.style.background='linear-gradient(135deg, #fff 0%, #fafbfc 100%)'; }}/>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  {[{k:'tenantAdminStatus',opts:Object.keys(TSTATUS),pl:'Status'},{k:'type',opts:Object.keys(TYPE),pl:'Type'}].map(f=>(
                    <select key={f.k} value={filters[f.k]} onChange={e=>setFilters(fv=>({...fv,[f.k]:e.target.value}))}
                      style={{ flex:1, background:'linear-gradient(135deg, #fff 0%, #fafbfc 100%)', border:'1.5px solid #e8edf2', borderRadius:7,
                        padding:'6px 8px', color:'#374151', fontSize:11, outline:'none', cursor:'pointer', fontWeight:600 }}>
                      <option value="">{f.pl}</option>
                      {f.opts.map(o=><option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                    </select>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div style={{ padding:'8px 14px', borderBottom:'2px solid #bbf7d0', background:'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
                <span style={{ fontSize:11, color:'#065f46', fontWeight:800, letterSpacing:0.3 }}>📋 {list.length} item{list.length!==1?'s':''}</span>
              </div>

              {/* Items */}
              <div style={{ flex:1, overflowY:'auto' }}>
                {loading ? (
                  <EmptyState icon="⏳" title="Loading…" sub="Fetching feedback from your team"/>
                ) : list.length===0 ? (
                  <EmptyState icon="📭" title="All caught up!" sub="No feedback matching your filters"/>
                ) : list.map((fb,i)=>{
                  const uN=[fb.submittedBy?.firstName,fb.submittedBy?.lastName].filter(Boolean).join(' ')||fb.submittedBy?.email||'User';
                  const ts=TSTATUS[fb.tenantAdminStatus]||TSTATUS.pending;
                  const isActive=selId===fb._id;
                  const isPending=fb.tenantAdminStatus==='pending';
                  return (
                    <div key={fb._id} onClick={()=>selectItem(fb._id)}
                      style={{ padding:'12px 14px', borderBottom:'1px solid #d1fae5', cursor:'pointer',
                        transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                        background: isActive ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                        borderLeft:`4px solid ${isActive?'#10b981':fb.escalatedToSaas?'#ef4444':isPending?'#059669':'transparent'}`,
                        boxShadow: isActive ? '0 3px 12px rgba(16,185,129,0.2), inset 0 0 0 1px rgba(16,185,129,0.15)' : 'none',
                        margin: isActive ? '3px 0' : '0',
                        borderRadius: isActive ? '0 10px 10px 0' : '0' }}
                      onMouseEnter={e=>{ if(!isActive) { e.currentTarget.style.background='linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'; e.currentTarget.style.paddingLeft='18px'; e.currentTarget.style.boxShadow='0 2px 8px rgba(16,185,129,0.1)'; } }}
                      onMouseLeave={e=>{ if(!isActive) { e.currentTarget.style.background='linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)'; e.currentTarget.style.paddingLeft='14px'; e.currentTarget.style.boxShadow='none'; } }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
                        <Avatar name={uN} size={32}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:3 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:'#374151' }}>{uN}</span>
                            <span style={{ fontSize:9, color:'#94a3b8', flexShrink:0, marginLeft:4 }}>{ago(fb.createdAt)}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                            <span style={{ fontSize:12 }}>{TYPE[fb.type]?.icon}</span>
                            <span style={{ fontSize:12, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {fb.title}
                            </span>
                            {isPending&&!fb.tenantAdminReply&&
                              <span style={{ width:6,height:6,borderRadius:'50%',background:'#3b82f6',flexShrink:0,display:'inline-block' }}/>}
                          </div>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            <Badge label={ts.label} color={ts.color} bg={ts.bg} dot={ts.dot}/>
                            <Badge label={CAT[fb.category]?.label||'Other'} color={CAT[fb.category]?.color||'#64748b'} bg={CAT[fb.category]?.bg||'#f8fafc'}/>
                            {fb.escalatedToSaas && <Badge label="↑ SAAS" color="#dc2626" bg="#fef2f2"/>}
                            {fb.tenantAdminReply && <Badge label="✓ Replied" color="#059669" bg="#ecfdf5"/>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail pane - only show when item selected */}
            {selId && detail && (
              <div style={{ flex:1, overflowY:'auto', background:'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)', display:'flex', flexDirection:'column' }}>

                {/* Detail header */}
                <div style={{ background:'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', borderBottom:'2px solid #bbf7d0',
                  padding:'20px 28px', flexShrink:0, boxShadow:'0 2px 8px rgba(16,185,129,0.08)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, marginRight:18 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                        <span style={{ fontSize:22 }}>{TYPE[detail.type]?.icon}</span>
                        <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#0f172a', letterSpacing:-0.3 }}>{detail.title}</h2>
                      </div>
                      <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                        <Badge label={TYPE[detail.type]?.label}    color={TYPE[detail.type]?.color}    bg={TYPE[detail.type]?.bg}/>
                        <Badge label={CAT[detail.category]?.label} color={CAT[detail.category]?.color} bg={CAT[detail.category]?.bg}/>
                        <Badge label={`${SENT[detail.sentiment]?.icon} ${SENT[detail.sentiment]?.label}`} color={SENT[detail.sentiment]?.color} bg={SENT[detail.sentiment]?.bg}/>
                        {detail.escalatedToSaas && <Badge label="↑ Escalated to SAAS" color="#dc2626" bg="#fef2f2"/>}
                      </div>
                    </div>
                    <button onClick={()=>{setSelId(null);setDetail(null);}}
                      style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',border:'1px solid #e2e8f0',cursor:'pointer',
                        fontSize:17,color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center',
                        transition:'all 0.2s', boxShadow:'0 2px 6px rgba(0,0,0,0.06)' }}
                      onMouseEnter={e=>{ e.currentTarget.style.background='linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; e.currentTarget.style.color='#fff'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background='linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'; e.currentTarget.style.color='#64748b'; }}>✕</button>
                  </div>
                </div>

                <div style={{ padding:'24px 28px', flex:1 }}>
                  {/* Submitter card */}
                  <Card style={{ padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:14 }}>
                    <Avatar name={detail.submittedBy?.firstName} size={44}/>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:800, color:'#0f172a', letterSpacing:-0.2 }}>
                        {[detail.submittedBy?.firstName,detail.submittedBy?.lastName].filter(Boolean).join(' ')||'User'}
                      </p>
                      <p style={{ margin:0, fontSize:12, color:'#64748b', fontWeight:500 }}>{detail.submittedBy?.email} · {fmt(detail.createdAt)}</p>
                    </div>
                    {detail.rating>0 && (
                      <div style={{ textAlign:'center', padding:'8px 12px', background:'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                        borderRadius:10, border:'1px solid #fde68a' }}>
                        <div style={{ fontSize:17, marginBottom:2 }}>{'⭐'.repeat(detail.rating)}</div>
                        <div style={{ fontSize:10, color:'#d97706', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{['','Poor','Fair','Good','Very Good','Excellent'][detail.rating]}</div>
                      </div>
                    )}
                  </Card>

                  {/* Message */}
                  <Card style={{ padding:'18px 22px', marginBottom:20 }}>
                    <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1.2 }}>User's Message</p>
                    <p style={{ margin:0, fontSize:14, color:'#374151', lineHeight:1.9, fontWeight:500 }}>{detail.description}</p>
                  </Card>

                  {/* Attachments */}
                  {detail.attachments && detail.attachments.length > 0 && (
                    <Card style={{ padding:'18px 22px', marginBottom:20 }}>
                      <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1.2 }}>📎 Attachments ({detail.attachments.length})</p>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {detail.attachments.map((att,idx)=>(
                          <a key={idx} href={`${BASE}/${att.path}`} target="_blank" rel="noopener noreferrer"
                            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px',
                              background:'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border:'1.5px solid #a7f3d0', borderRadius:10, textDecoration:'none',
                              transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)', boxShadow:'0 2px 6px rgba(16,185,129,0.08)' }}
                            onMouseEnter={e=>{ e.currentTarget.style.background='linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'; e.currentTarget.style.borderColor='#6ee7b7'; e.currentTarget.style.transform='translateX(4px)'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'; e.currentTarget.style.borderColor='#a7f3d0'; e.currentTarget.style.transform='translateX(0)'; }}>
                            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                              <div style={{ width:36,height:36,borderRadius:9,background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0,
                                boxShadow:'0 2px 6px rgba(16,185,129,0.3)' }}>
                                {att.mimetype?.includes('image') ? '🖼️' : att.mimetype?.includes('pdf') ? '📄' : '📎'}
                              </div>
                              <div>
                                <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#065f46' }}>{att.originalName}</p>
                                <p style={{ margin:0, fontSize:11, color:'#059669', fontWeight:600 }}>{(att.size/1024).toFixed(1)} KB · {att.mimetype?.split('/')[1]?.toUpperCase()}</p>
                              </div>
                            </div>
                            <div style={{ padding:'6px 12px', background:'rgba(16,185,129,0.15)', borderRadius:8, fontSize:11, fontWeight:700, color:'#047857' }}>
                              Download ⬇️
                            </div>
                          </a>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* SAAS reply (read only) */}
                  {detail.adminReply && (
                    <div style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'2px solid #ddd6fe',
                      borderRadius:14, padding:'18px 22px', marginBottom:20, boxShadow:'0 2px 8px rgba(124,58,237,0.08)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:12 }}>
                        <div style={{ width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
                          display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#fff',fontWeight:800,
                          boxShadow:'0 2px 6px rgba(124,58,237,0.3)' }}>S</div>
                        <span style={{ fontSize:13, fontWeight:800, color:'#6d28d9', letterSpacing:-0.2 }}>SAAS Admin Reply</span>
                        <span style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>· {ago(detail.repliedAt)}</span>
                      </div>
                      <p style={{ margin:0, fontSize:14, color:'#374151', lineHeight:1.8, fontWeight:500 }}>{detail.adminReply}</p>
                    </div>
                  )}

                  {/* Status update */}
                  <div style={{ marginBottom:20 }}>
                    <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1.2 }}>Update Status</p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {Object.entries(TSTATUS).filter(([k])=>k!=='escalated').map(([k,m])=>(
                        <button key={k} onClick={()=>doStatus(k)}
                          style={{ padding:'9px 18px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer',
                            transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)', outline:'none',
                            border: detail.tenantAdminStatus===k ? `2px solid ${m.color}` : '1.5px solid #e2e8f0',
                            background: detail.tenantAdminStatus===k ? `linear-gradient(135deg, ${m.bg} 0%, ${m.bg}dd 100%)` : 'linear-gradient(135deg, #fff 0%, #fafbfc 100%)',
                            color: detail.tenantAdminStatus===k ? m.color : '#64748b',
                            boxShadow: detail.tenantAdminStatus===k ? `0 0 0 4px ${m.dot}18, 0 3px 8px ${m.dot}20` : '0 2px 6px rgba(0,0,0,0.04)' }}>
                          {detail.tenantAdminStatus===k && '● '}{m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reply box */}
                  <Card style={{ padding:'18px 20px', marginBottom:14 }}>
                    <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>
                      {detail.tenantAdminReply ? '✏️ Edit Reply' : '💬 Reply to User'}
                    </p>
                    {detail.tenantAdminReply && (
                      <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
                        <p style={{ margin:'0 0 4px', fontSize:11, color:'#059669', fontWeight:700 }}>Current reply</p>
                        <p style={{ margin:0, fontSize:13, color:'#374151' }}>{detail.tenantAdminReply}</p>
                      </div>
                    )}
                    <Textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3}
                      placeholder="Your response will be visible to the user…"/>
                    <div style={{ marginTop:10, display:'flex', gap:8 }}>
                      <Btn onClick={doReply} disabled={busy||!reply.trim()} size="sm">
                        {busy ? 'Sending…' : detail.tenantAdminReply ? 'Update Reply' : 'Send Reply →'}
                      </Btn>
                    </div>
                  </Card>

                  {/* Escalate */}
                  {!detail.escalatedToSaas ? (
                    !showEscal ? (
                      <button onClick={()=>setShowEscal(true)}
                        style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:13, fontWeight:600,
                          color:'#dc2626', background:'#fef2f2', border:'1.5px dashed #fecaca', cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#fee2e2'}
                        onMouseLeave={e=>e.currentTarget.style.background='#fef2f2'}>
                        ↑ Escalate to SAAS Admin
                      </button>
                    ) : (
                      <Card style={{ padding:'18px 20px', borderColor:'#fecaca', borderWidth:1.5 }}>
                        <p style={{ margin:'0 0 12px', fontSize:12, fontWeight:700, color:'#dc2626', textTransform:'uppercase', letterSpacing:0.8 }}>
                          ↑ Escalate to SAAS Admin
                        </p>
                        <Textarea value={escalReason} onChange={e=>setEscalReason(e.target.value)} rows={2}
                          placeholder="Why should SAAS admin review this? (optional)"/>
                        <div style={{ display:'flex', gap:8, marginTop:10 }}>
                          <Btn onClick={doEscalate} disabled={busy} variant="red" size="sm">
                            {busy ? 'Escalating…' : '↑ Confirm Escalate'}
                          </Btn>
                          <Btn onClick={()=>setShowEscal(false)} variant="outline" size="sm">Cancel</Btn>
                        </div>
                      </Card>
                    )
                  ) : (
                    <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:12,
                      padding:'14px 18px', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:18 }}>↑</span>
                      <div>
                        <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'#dc2626' }}>Escalated to SAAS Admin</p>
                        <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{detail.escalatedReason || 'No reason provided'} · {ago(detail.escalatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INSIGHTS TAB ── */}
        {tab==='insights' && analytics && (
          <div style={{ flex:1, overflowY:'auto', padding:'36px 40px', background:'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 30%, #d1fae5 60%, #a7f3d0 100%)' }}>
            <div style={{ display:'flex', gap:10, marginBottom:32, flexWrap:'wrap' }}>
              <GradStat label="Total"     value={analytics.total}                 color="#6366f1" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,tenantAdminStatus:'',sentiment:''})); }}/>
              <GradStat label="Pending"   value={analytics.open}                  color="#f59e0b" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,tenantAdminStatus:'pending',sentiment:''})); }}/>
              <GradStat label="Resolved"  value={analytics.resolved}              color="#10b981" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,tenantAdminStatus:'resolved',sentiment:''})); }}/>
              <GradStat label="Escalated" value={analytics.escalated}             color="#ef4444" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,tenantAdminStatus:'escalated',sentiment:''})); }}/>
              <GradStat label="Positive"  value={`${analytics.positiveRate||0}%`} color="#10b981" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,sentiment:'positive',tenantAdminStatus:''})); }}/>
            </div>
            <div style={{ marginBottom:10, background:'linear-gradient(135deg, #ffffff 0%, #fefbff 100%)', padding:'24px 28px',
              borderRadius:16, border:'2px solid #e0e7ff', boxShadow:'0 4px 16px rgba(124,58,237,0.08)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:'0 4px 12px rgba(124,58,237,0.3)' }}>📊</div>
                <div>
                  <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:900, color:'#0f172a', letterSpacing:-0.5 }}>Business Intelligence</h2>
                  <p style={{ margin:'0', fontSize:14, color:'#64748b', fontWeight:600 }}>What your users are saying — last 90 days</p>
                </div>
              </div>
            </div>
            <div style={{ height:32 }}/>

            <div style={{ marginBottom:24 }}>
              <InsightRow bySentiment={analytics.bySentiment} avgRatingByCategory={analytics.avgRatingByCategory}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
              {[
                {title:'By Category', data:analytics.byCategory, colors:Object.fromEntries(Object.entries(CAT).map(([k,v])=>[k,v.color]))},
                {title:'By Type',     data:analytics.byType,     colors:Object.fromEntries(Object.entries(TYPE).map(([k,v])=>[k,v.color]))},
                {title:'Sentiment',   data:analytics.bySentiment,colors:{positive:'#10b981',neutral:'#94a3b8',negative:'#ef4444'}},
                {title:'Status',      data:analytics.byStatus,   colors:Object.fromEntries(Object.entries(TSTATUS).map(([k,v])=>[k,v.color]))},
              ].map(ch=>(
                <Card key={ch.title} style={{ padding:'20px 22px' }}>
                  <p style={{ margin:'0 0 16px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>{ch.title}</p>
                  <MiniBarChart data={ch.data} colors={ch.colors}/>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTACT SAAS TAB ── */}
        {tab==='contact_saas' && (
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)' }}>
            <div style={{ width:'100%' }}>

              {/* Banner */}
              <div style={{ background:'linear-gradient(135deg,#eff6ff,#e0e7ff)', border:'2px solid #c7d2fe',
                borderRadius:12, padding:'14px 18px', marginBottom:18, display:'flex', gap:12, alignItems:'flex-start',
                boxShadow:'0 3px 12px rgba(99,102,241,0.12)' }}>
                <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#4f46e5)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0,
                  boxShadow:'0 3px 10px rgba(99,102,241,0.3)' }}>📨</div>
                <div>
                  <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:800, color:'#3730a3', letterSpacing:-0.2 }}>Direct Message to SAAS Team</p>
                  <p style={{ margin:0, fontSize:11, color:'#4f46e5', lineHeight:1.6, fontWeight:500 }}>
                    Report platform issues, billing queries, or feature requests directly to SAAS.
                    This goes <strong>straight to their inbox</strong> — bypassing the user feedback flow.
                  </p>
                </div>
              </div>

              {cSent && (
                <div style={{ background:'linear-gradient(135deg,#ecfdf5,#d1fae5)', border:'2px solid #6ee7b7',
                  borderRadius:12, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'center', gap:12,
                  boxShadow:'0 3px 12px rgba(16,185,129,0.15)' }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#10b981,#059669)',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0,
                    boxShadow:'0 3px 10px rgba(16,185,129,0.3)' }}>✓</div>
                  <div>
                    <p style={{ margin:'0 0 3px', fontSize:13, fontWeight:800, color:'#065f46', letterSpacing:-0.2 }}>Message sent to SAAS team!</p>
                    <p style={{ margin:0, fontSize:11, color:'#047857', fontWeight:500 }}>They will review and respond to you shortly.</p>
                  </div>
                </div>
              )}

              <Card style={{ padding:20 }}>
                {/* Type */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>
                    Message Type <span style={{ color:'#ef4444' }}>*</span>
                  </label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {Object.entries(TYPE).map(([k,m])=>(
                      <Pill key={k} label={m.label} icon={m.icon} selected={cForm.type===k}
                        color={m.color} bg={m.bg} onClick={()=>setCForm(f=>({...f,type:k}))}/>
                    ))}
                  </div>
                </div>
                <Divider/>
                {/* Category */}
                <div style={{ marginTop:14, marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>
                    Area
                  </label>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {Object.entries(CAT).map(([k,m])=>(
                      <Chip key={k} label={m.label} icon={m.icon} selected={cForm.category===k}
                        color={m.color} bg={m.bg} onClick={()=>setCForm(f=>({...f,category:k}))}/>
                    ))}
                  </div>
                </div>
                <Divider/>
                <div style={{ marginTop:14 }}>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>
                      Subject <span style={{ color:'#ef4444' }}>*</span>
                    </label>
                    <Input
                      value={cForm.title}
                      onChange={e=>{const v=e.target.value; setCForm(f=>({...f,title:v})); setCTitleError(''); const t=v.trim(); if(t.length>0&&t.length<5){setCTitleError('Title too short - minimum 5 characters')}else if(t.length>0){const l=(t.match(/[a-zA-Z]/g)||[]).length; if(l<3){setCTitleError('Title must contain at least 3 letters')}else{const a=(t.match(/[a-zA-Z0-9]/g)||[]).length; if(a/t.length<0.5){setCTitleError('Title must contain readable text, not just symbols')}}}}}
                      placeholder="Brief subject of your message"
                      style={{borderColor:cTitleError?'#ef4444':'#e2e8f0'}}/>
                    {cTitleError && <div style={{fontSize:10,color:'#ef4444',marginTop:4,fontWeight:600}}>⚠️ {cTitleError}</div>}
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>
                      Message <span style={{ color:'#ef4444' }}>*</span>
                    </label>
                    <Textarea
                      value={cForm.description}
                      onChange={e=>{const v=e.target.value; setCForm(f=>({...f,description:v})); setCDescError(''); const t=v.trim(); if(t.length>0&&t.length<20){setCDescError('Description too short - minimum 20 characters')}else if(t.length>0){const l=(t.match(/[a-zA-Z]/g)||[]).length; if(l<10){setCDescError('Description must contain at least 10 letters')}else{const a=(t.match(/[a-zA-Z0-9]/g)||[]).length; if(a/t.length<0.5){setCDescError('Please enter a meaningful feedback description using letters and numbers')}}}}}
                      rows={5}
                      placeholder="Describe the issue, request, or concern in detail…"
                      style={{borderColor:cDescError?'#ef4444':'#e2e8f0'}}/>
                    {cDescError && <div style={{fontSize:10,color:'#ef4444',marginTop:4,fontWeight:600}}>⚠️ {cDescError}</div>}
                  </div>

                  {/* File Attachment */}
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>
                      Attachments <span style={{ color:'#94a3b8', fontWeight:400, textTransform:'none' }}>(optional)</span>
                    </label>
                    <div style={{ border:'2px dashed #e2e8f0', borderRadius:10, padding:'16px', background:'#fafbfc', textAlign:'center', transition:'all 0.2s' }}
                      onDragOver={e=>{ e.preventDefault(); e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.background='#f5f3ff'; }}
                      onDragLeave={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#fafbfc'; }}
                      onDrop={e=>{ e.preventDefault(); e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#fafbfc';
                        const files=Array.from(e.dataTransfer.files);
                        setCAttachments(prev=>[...prev,...files]);
                      }}>
                      <input type="file" multiple accept="image/*,.pdf,.doc,.docx" id="cFileInput"
                        style={{ display:'none' }}
                        onChange={e=>{
                          const files=Array.from(e.target.files);
                          setCAttachments(prev=>[...prev,...files]);
                        }}/>
                      <label htmlFor="cFileInput" style={{ cursor:'pointer' }}>
                        <div style={{ fontSize:28, marginBottom:6 }}>📎</div>
                        <p style={{ margin:'0 0 3px', fontSize:12, fontWeight:600, color:'#374151' }}>Click to upload or drag and drop</p>
                        <p style={{ margin:0, fontSize:10, color:'#94a3b8' }}>PNG, JPG, PDF, DOC (max 5MB each)</p>
                      </label>
                    </div>
                    {cAttachments.length>0 && (
                      <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
                        {cAttachments.map((file,idx)=>(
                          <div key={idx} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px',
                            background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:7 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontSize:16 }}>📄</span>
                              <div>
                                <p style={{ margin:0, fontSize:11, fontWeight:600, color:'#374151' }}>{file.name}</p>
                                <p style={{ margin:0, fontSize:9, color:'#94a3b8' }}>{(file.size/1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <button onClick={()=>setCAttachments(prev=>prev.filter((_,i)=>i!==idx))}
                              style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:3 }}>❌</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div style={{ marginBottom:16, padding:'12px 14px', background:'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)', borderRadius:10, border:'1.5px solid #e8edf2',
                    boxShadow:'0 2px 6px rgba(0,0,0,0.04)' }}>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>
                      Platform Rating <span style={{ color:'#94a3b8', fontWeight:400, textTransform:'none' }}>(optional)</span>
                    </label>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {[1,2,3,4,5].map(r=>(
                        <button key={r} onClick={()=>setCForm(f=>({...f,rating:r===f.rating?0:r}))}
                          style={{ width:36,height:36,borderRadius:9,fontSize:18,cursor:'pointer',
                            border: cForm.rating>=r ? '2px solid #f59e0b' : '1.5px solid #e2e8f0',
                            background: cForm.rating>=r ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : 'linear-gradient(135deg, #fff 0%, #fafbfc 100%)',
                            transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)', outline:'none',
                            transform: cForm.rating>=r ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: cForm.rating>=r ? '0 3px 10px rgba(245,158,11,0.25)' : '0 2px 6px rgba(0,0,0,0.04)' }}>⭐</button>
                      ))}
                      {cForm.rating>0 && (
                        <span style={{ marginLeft:6, fontSize:12, color:'#d97706', fontWeight:800, letterSpacing:-0.2 }}>
                          {['','Poor','Fair','Good','Very Good','Excellent'][cForm.rating]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:14, borderTop:'1.5px solid #f1f5f9' }}>
                    <Btn onClick={doContactSaas} disabled={cSending||!cForm.type||!cForm.title.trim()||!cForm.description.trim()} size="md">
                      {cSending ? '⏳ Sending…' : '📨 Send to SAAS →'}
                    </Btn>
                    {(!cForm.type||!cForm.title.trim()||!cForm.description.trim()) && (
                      <span style={{ fontSize:10, color:'#64748b', fontWeight:600 }}>
                        {!cForm.type ? '⚠️ Select message type first' : !cForm.title.trim() ? '⚠️ Add a subject' : '⚠️ Add your message'}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        </div>
      </div>
    </DashboardLayout>
  );
};

/* ═══════════════════════════════════════════════════════════
   TIER 2 — SAAS ADMIN
═══════════════════════════════════════════════════════════ */
const SaasAdminView = () => {
  const [tab,       setTab]       = useState('inbox');
  const [list,      setList]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [aLoad,     setALoad]     = useState(true);
  const [selId,     setSelId]     = useState(null);
  const [detail,    setDetail]    = useState(null);
  const [reply,     setReply]     = useState('');
  const [note,      setNote]      = useState('');
  const [busy,      setBusy]      = useState(false);
  const [filters,   setFilters]   = useState({search:'',status:'',type:'',category:'',escalatedOnly:false,sentiment:''});
  const [days,      setDays]      = useState(30);
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadList = useCallback(async()=>{
    setLoading(true);
    try{
      const p={limit:200};
      if(filters.search)        p.search        =filters.search;
      if(filters.status)        p.status        =filters.status;
      if(filters.type)          p.type          =filters.type;
      if(filters.category)      p.category      =filters.category;
      if(filters.escalatedOnly) p.escalatedOnly ='true';
      if(filters.sentiment)     p.sentiment     =filters.sentiment;
      const d=await api.all(p); setList(d.data||[]);
    }catch{} setLoading(false);
  },[filters]);

  const loadAnalytics = useCallback(async()=>{
    setALoad(true);
    try{ const d=await api.saasAnalytics({days}); setAnalytics(d.data); }catch{}
    setALoad(false);
  },[days]);

  useEffect(()=>{ loadList(); },[loadList]);
  useEffect(()=>{ loadAnalytics(); },[loadAnalytics]);

  const selectItem = async id=>{
    setSelId(id); setReply(''); setNote(''); setDetail(null);
    try{ const d=await api.byId(id); setDetail(d.data); setReply(d.data.adminReply||''); }catch{}
  };
  const doReply  = async()=>{ if(!reply.trim()) return; setBusy(true);
    try{ const d=await api.saasReply(selId,{reply}); setDetail(d.data); setList(l=>l.map(f=>f._id===selId?{...f,...d.data}:f)); }catch{} setBusy(false); };
  const doStatus = async s=>{ setBusy(true);
    try{ const d=await api.saasStatus(selId,{status:s}); setDetail(p=>({...p,...d.data})); setList(l=>l.map(f=>f._id===selId?{...f,...d.data}:f)); }catch{} setBusy(false); };
  const doNote   = async()=>{ if(!note.trim()) return; setBusy(true);
    try{ const d=await api.saasNote(selId,{note}); setDetail(d.data); setNote(''); }catch{} setBusy(false); };
  const doDelete = async id=>{ if(!window.confirm('Delete this feedback permanently?')) return;
    await api.saasDelete(id); setList(l=>l.filter(f=>f._id!==id));
    if(selId===id){ setSelId(null); setDetail(null); } };

  const escalCount=list.filter(f=>f.escalatedToSaas).length;

  return (
    <SaasLayout>
      <style>{STAT_CSS}</style>
      <div style={{ height:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column', overflow:'hidden',
        fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

        {/* ── Header ── */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e8edf2', padding:isMobile?'0 12px':'0 28px', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:isMobile?'flex-start':'center', padding:isMobile?'12px 0 0':'20px 0 0', flexDirection:isMobile?'column':'row', gap:isMobile?12:0 }}>
            <div style={{ display:'flex', alignItems:isMobile?'flex-start':'center', gap:isMobile?10:14, width:isMobile?'100%':'auto', flexDirection:isMobile?'row':'row', flexWrap:isMobile?'nowrap':'nowrap' }}>
              <div style={{ width:isMobile?36:42,height:isMobile?36:42,borderRadius:12,background:'linear-gradient(135deg,#ef4444,#dc2626)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?18:20,flexShrink:0 }}>🎯</div>
              <div style={{ flex:1, minWidth:isMobile?0:200, overflow:isMobile?'visible':'visible' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                  <h1 style={{ margin:0, fontSize:isMobile?15:20, fontWeight:800, color:'#0f172a', letterSpacing:-0.3, whiteSpace:isMobile?'normal':'nowrap', wordBreak:isMobile?'break-word':'normal', lineHeight:1.3 }}>
                    Feedback Intelligence
                  </h1>
                </div>
                {escalCount>0 && (
                  <span style={{
                    background:'linear-gradient(135deg,#ef4444,#dc2626)',
                    color:'#fff',
                    borderRadius:20,
                    padding:'3px 10px',
                    fontSize:isMobile?10:12,
                    fontWeight:700,
                    boxShadow:'0 2px 8px rgba(239,68,68,0.35)',
                    display:'inline-block',
                    whiteSpace:'nowrap',
                    marginBottom:isMobile?4:0
                  }}>
                    ↑ {escalCount} escalated
                  </span>
                )}
                <p style={{ margin:0, fontSize:isMobile?11:13, color:'#64748b', marginTop:isMobile?2:0 }}>Global feedback across all tenants</p>
              </div>
            </div>

            {/* KPI strip — clickable gradient cards */}
            {analytics && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                <GradStat label="Total"     value={analytics.total}                 color="#6366f1" active={!filters.escalatedOnly&&!filters.status&&!filters.sentiment} onClick={()=>setFilters(p=>({...p,escalatedOnly:false,status:'',sentiment:''}))}/>
                <GradStat label="Escalated" value={analytics.escalated}             color="#ef4444" active={filters.escalatedOnly}                    onClick={()=>setFilters(p=>({...p,escalatedOnly:!p.escalatedOnly,status:'',sentiment:''}))}/>
                <GradStat label="Open"      value={analytics.open}                  color="#f59e0b" active={filters.status==='new'}                   onClick={()=>setFilters(p=>({...p,status:p.status==='new'?'':'new',escalatedOnly:false,sentiment:''}))}/>
                <GradStat label="Resolved"  value={analytics.resolved}              color="#10b981" active={filters.status==='resolved'}              onClick={()=>setFilters(p=>({...p,status:p.status==='resolved'?'':'resolved',escalatedOnly:false,sentiment:''}))}/>
                <GradStat label="Positive"  value={`${analytics.positiveRate||0}%`} color="#10b981" active={filters.sentiment==='positive'}           onClick={()=>setFilters(p=>({...p,sentiment:p.sentiment==='positive'?'':'positive',status:'',escalatedOnly:false}))}/>
                <GradStat label="Negative"  value={`${analytics.negativeRate||0}%`} color="#ef4444" active={filters.sentiment==='negative'}           onClick={()=>setFilters(p=>({...p,sentiment:p.sentiment==='negative'?'':'negative',status:'',escalatedOnly:false}))}/>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:0, marginTop:16 }}>
            {[{id:'inbox',label:'📥 Inbox'},{id:'intelligence',label:'📊 Intelligence'}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'12px 22px', fontSize:13, fontWeight:600,
                  cursor:'pointer', background:'transparent', border:'none', outline:'none',
                  color: tab===t.id ? '#7c3aed' : '#64748b',
                  borderBottom: tab===t.id ? '2px solid #7c3aed' : '2px solid transparent',
                  marginBottom:-2, transition:'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── INBOX ── */}
        {tab==='inbox' && (
          <div style={{ flex:1, display:'flex', overflow:isMobile?'visible':'hidden', flexDirection:isMobile?'column':'row' }}>

            {/* List */}
            {(!isMobile || !selId) && (
            <div style={{
              width: isMobile ? '100%' : (selId ? 400 : 480),
              flexShrink:0,
              borderRight:isMobile?'none':'1px solid #e8edf2',
              display:'flex',
              flexDirection:'column',
              background:'#fff',
              transition:'width 0.3s cubic-bezier(.4,0,.2,1)'
            }}>

              {/* Filters */}
              <div style={{ padding:'12px 14px', borderBottom:'1px solid #f1f5f9', background:'#fafbfc' }}>
                <div style={{ position:'relative', marginBottom:8 }}>
                  <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#94a3b8' }}>🔍</span>
                  <input value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))}
                    placeholder="Search all feedback…"
                    style={{ width:'100%', background:'#fff', border:'1.5px solid #e8edf2', borderRadius:9,
                      padding:'8px 12px 8px 34px', color:'#374151', fontSize:13, outline:'none', boxSizing:'border-box',
                      transition:'border-color 0.15s' }}
                    onFocus={e=>e.target.style.borderColor='#7c3aed'}
                    onBlur={e=>e.target.style.borderColor='#e8edf2'}/>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <button onClick={()=>setFilters(f=>({...f,escalatedOnly:!f.escalatedOnly}))}
                    style={{ padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer',
                      border: filters.escalatedOnly ? '1.5px solid #ef4444' : '1.5px solid #e8edf2',
                      background: filters.escalatedOnly ? 'linear-gradient(135deg,#fef2f2,#fee2e2)' : '#fff',
                      color: filters.escalatedOnly ? '#dc2626' : '#94a3b8', outline:'none', whiteSpace:'nowrap' }}>
                    ↑ Escalated
                  </button>
                  {[{k:'status',opts:Object.keys(GSTATUS),pl:'Status'},{k:'type',opts:Object.keys(TYPE),pl:'Type'}].map(f=>(
                    <select key={f.k} value={filters[f.k]} onChange={e=>setFilters(fv=>({...fv,[f.k]:e.target.value}))}
                      style={{ flex:1, background:'#fff', border:'1.5px solid #e8edf2', borderRadius:8,
                        padding:'6px 10px', color:'#374151', fontSize:12, outline:'none', cursor:'pointer' }}>
                      <option value="">{f.pl}</option>
                      {f.opts.map(o=><option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                    </select>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div style={{ padding:'8px 14px', borderBottom:'1px solid #f1f5f9', background:'#fafbfc',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>{list.length} item{list.length!==1?'s':''}</span>
                {escalCount>0 && <span style={{ fontSize:11, color:'#dc2626', fontWeight:700 }}>↑ {escalCount} escalated</span>}
              </div>

              {/* Items */}
              <div style={{ flex:1, overflowY:'auto' }}>
                {loading ? <EmptyState icon="⏳" title="Loading…" sub="Fetching global feedback"/>
                : list.length===0 ? <EmptyState icon="📭" title="No feedback found" sub="Adjust filters or check back later"/>
                : list.map((fb,i)=>{
                  const tn=fb.tenant?.organizationName||fb.tenant?.contactEmail||'Unknown';
                  const sm=GSTATUS[fb.status]||GSTATUS.new;
                  const isEsc=fb.escalatedToSaas;
                  const isActive=selId===fb._id;
                  return (
                    <div key={fb._id} onClick={()=>selectItem(fb._id)}
                      style={{ padding:'13px 14px', borderBottom:'1px solid #f8fafc', cursor:'pointer',
                        transition:'background 0.12s', background: isActive ? '#faf5ff' : isEsc ? '#fff9f9' : '#fff',
                        borderLeft:`3px solid ${isActive?'#7c3aed':isEsc?'#ef4444':'transparent'}` }}
                      onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='#fafafa'; }}
                      onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background = isEsc?'#fff9f9':'#fff'; }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                        <Avatar name={tn} size={34}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                            <span style={{ fontSize:12, fontWeight:700, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>{tn}</span>
                            <span style={{ fontSize:10, color:'#94a3b8', flexShrink:0 }}>{ago(fb.createdAt)}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
                            <span style={{ fontSize:12 }}>{TYPE[fb.type]?.icon}</span>
                            <span style={{ fontSize:13, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {fb.title}
                            </span>
                          </div>
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            <Badge label={sm.label} color={sm.color} bg={sm.bg}/>
                            {isEsc && <Badge label="↑ Escalated" color="#dc2626" bg="#fef2f2" dot="#ef4444"/>}
                            {fb.adminReply && <Badge label="✓ Replied" color="#059669" bg="#ecfdf5"/>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {/* Detail */}
            {selId && detail ? (
              <div style={{
                flex:1,
                overflowY:'auto',
                background:'#f8fafc',
                display:'flex',
                flexDirection:'column',
                width:isMobile?'100%':'auto',
                minHeight:isMobile?'100vh':'auto'
              }}>

                {/* Escalation banner */}
                {detail.escalatedToSaas && (
                  <div style={{ background:'linear-gradient(135deg,#fef2f2,#fee2e2)', borderBottom:'1px solid #fecaca',
                    padding:'14px 26px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
                    <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#ef4444,#dc2626)',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>↑</div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:800, color:'#dc2626' }}>Escalated by Tenant Admin</p>
                      <p style={{ margin:0, fontSize:12, color:'#64748b' }}>
                        {detail.escalatedReason || 'No reason provided'} · {ago(detail.escalatedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Detail header */}
                <div style={{ background:'#fff', borderBottom:'1px solid #e8edf2', padding:isMobile?'14px 16px':'18px 26px', flexShrink:0 }}>
                  {/* Mobile back button */}
                  {isMobile && (
                    <button
                      onClick={()=>{setSelId(null);setDetail(null);}}
                      style={{
                        display:'flex',
                        alignItems:'center',
                        gap:8,
                        background:'transparent',
                        border:'none',
                        padding:'8px 0',
                        marginBottom:12,
                        cursor:'pointer',
                        fontSize:14,
                        fontWeight:600,
                        color:'#6366f1'
                      }}
                    >
                      ← Back to list
                    </button>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:isMobile?'wrap':'nowrap' }}>
                    <div style={{ flex:1, marginRight:isMobile?0:16, width:isMobile?'100%':'auto' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                        <span style={{ fontSize:20 }}>{TYPE[detail.type]?.icon}</span>
                        <h2 style={{ margin:0, fontSize:isMobile?15:17, fontWeight:800, color:'#0f172a', flex:1, minWidth:0, wordBreak:'break-word' }}>{detail.title}</h2>
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <Badge label={TYPE[detail.type]?.label}    color={TYPE[detail.type]?.color}    bg={TYPE[detail.type]?.bg}/>
                        <Badge label={CAT[detail.category]?.label} color={CAT[detail.category]?.color} bg={CAT[detail.category]?.bg}/>
                        <Badge label={`${SENT[detail.sentiment]?.icon} ${SENT[detail.sentiment]?.label}`} color={SENT[detail.sentiment]?.color} bg={SENT[detail.sentiment]?.bg}/>
                        <Badge label={GSTATUS[detail.status]?.label} color={GSTATUS[detail.status]?.color} bg={GSTATUS[detail.status]?.bg}/>
                      </div>
                    </div>
                    {!isMobile && (
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <Btn onClick={()=>doDelete(selId)} variant="danger" size="sm">🗑 Delete</Btn>
                        <button onClick={()=>{setSelId(null);setDetail(null);}}
                          style={{ width:32,height:32,borderRadius:8,background:'#f1f5f9',border:'none',cursor:'pointer',
                            fontSize:16,color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
                      </div>
                    )}
                  </div>
                  {isMobile && (
                    <div style={{ display:'flex', gap:6, marginTop:12 }}>
                      <Btn onClick={()=>doDelete(selId)} variant="danger" size="sm" fullWidth>🗑 Delete</Btn>
                    </div>
                  )}
                </div>

                <div style={{ padding:'22px 26px' }}>
                  {/* Tenant + User card */}
                  <Card style={{ padding:'14px 18px', marginBottom:18 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <Avatar name={detail.tenant?.organizationName} size={42}/>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:800, color:'#0f172a' }}>
                          {detail.tenant?.organizationName||detail.tenant?.contactEmail||'Unknown Tenant'}
                        </p>
                        <p style={{ margin:0, fontSize:12, color:'#64748b' }}>
                          {[detail.submittedBy?.firstName,detail.submittedBy?.lastName].filter(Boolean).join(' ')||'User'} · {detail.submittedBy?.email}
                        </p>
                      </div>
                      {detail.rating>0 && (
                        <div style={{ textAlign:'center' }}>
                          <div>{'⭐'.repeat(detail.rating)}</div>
                          <div style={{ fontSize:11, color:'#d97706', fontWeight:600, marginTop:2 }}>
                            {['','Poor','Fair','Good','Very Good','Excellent'][detail.rating]}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Message */}
                  <Card style={{ padding:'16px 20px', marginBottom:18 }}>
                    <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>User's Message</p>
                    <p style={{ margin:0, fontSize:14, color:'#374151', lineHeight:1.85 }}>{detail.description}</p>
                  </Card>

                  {/* Attachments */}
                  {detail.attachments && detail.attachments.length > 0 && (
                    <Card style={{ padding:'16px 20px', marginBottom:18 }}>
                      <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>📎 Attachments ({detail.attachments.length})</p>
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {detail.attachments.map((att,idx)=>(
                          <a key={idx} href={`${BASE}/${att.path}`} target="_blank" rel="noopener noreferrer"
                            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px',
                              background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:9, textDecoration:'none',
                              transition:'all 0.2s' }}
                            onMouseEnter={e=>{ e.currentTarget.style.background='#dcfce7'; e.currentTarget.style.borderColor='#86efac'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.borderColor='#bbf7d0'; }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:32,height:32,borderRadius:8,background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>
                                {att.mimetype?.includes('image') ? '🖼️' : att.mimetype?.includes('pdf') ? '📄' : '📎'}
                              </div>
                              <div>
                                <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#065f46' }}>{att.originalName}</p>
                                <p style={{ margin:0, fontSize:10, color:'#059669' }}>{(att.size/1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <span style={{ fontSize:14 }}>⬇️</span>
                          </a>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Tenant admin reply */}
                  {detail.tenantAdminReply && (
                    <div style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'1px solid #ddd6fe',
                      borderRadius:12, padding:'16px 20px', marginBottom:18 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                        <div style={{ width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
                          display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#fff',fontWeight:700 }}>T</div>
                        <span style={{ fontSize:12, fontWeight:700, color:'#6d28d9' }}>Tenant Admin Reply</span>
                        <span style={{ fontSize:11, color:'#94a3b8' }}>· {ago(detail.tenantAdminRepliedAt)}</span>
                      </div>
                      <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.7 }}>{detail.tenantAdminReply}</p>
                    </div>
                  )}

                  {/* Status */}
                  <div style={{ marginBottom:18 }}>
                    <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>Update Status</p>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {Object.entries(GSTATUS).map(([k,m])=>(
                        <button key={k} onClick={()=>doStatus(k)}
                          style={{ padding:'7px 16px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
                            transition:'all 0.15s', outline:'none',
                            border: detail.status===k ? `1.5px solid ${m.color}` : '1.5px solid #e2e8f0',
                            background: detail.status===k ? m.bg : '#fff',
                            color: detail.status===k ? m.color : '#64748b',
                            boxShadow: detail.status===k ? `0 0 0 3px ${m.color}18` : 'none' }}>
                          {detail.status===k && '● '}{m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reply box */}
                  <Card style={{ padding:'18px 20px', marginBottom:16 }}>
                    <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>
                      {detail.adminReply ? '✏️ Edit Reply to Tenant Admin' : '💬 Reply to Tenant Admin'}
                    </p>
                    {detail.adminReply && (
                      <div style={{ background:'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
                        <p style={{ margin:'0 0 4px', fontSize:11, color:'#7c3aed', fontWeight:700 }}>Current reply</p>
                        <p style={{ margin:0, fontSize:13, color:'#374151' }}>{detail.adminReply}</p>
                      </div>
                    )}
                    <Textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3}
                      placeholder="Your reply is visible to the tenant admin (not to the end user)…"/>
                    <div style={{ marginTop:10 }}>
                      <Btn onClick={doReply} disabled={busy||!reply.trim()} size="sm">
                        {busy ? 'Sending…' : detail.adminReply ? 'Update Reply' : 'Send Reply →'}
                      </Btn>
                    </div>
                  </Card>

                  {/* Internal notes */}
                  <div style={{ background:'linear-gradient(135deg,#fffbeb,#fef9e7)', border:'1.5px solid #fde68a',
                    borderRadius:14, padding:'18px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                      <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#f59e0b,#d97706)',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>🔒</div>
                      <div>
                        <p style={{ margin:0, fontSize:12, fontWeight:800, color:'#92400e' }}>Internal Notes</p>
                        <p style={{ margin:0, fontSize:11, color:'#d97706' }}>Private — never visible to tenants or users</p>
                      </div>
                    </div>

                    {detail.internalNotes?.length>0 && (
                      <div style={{ marginBottom:14, display:'flex', flexDirection:'column', gap:8 }}>
                        {detail.internalNotes.map((n,i)=>(
                          <div key={i} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.7)',
                            border:'1px solid #fde68a', borderRadius:10 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                              <Avatar name={n.addedBy?.firstName||'A'} size={22}/>
                              <span style={{ fontSize:12, fontWeight:600, color:'#92400e' }}>
                                {[n.addedBy?.firstName,n.addedBy?.lastName].filter(Boolean).join(' ')||'Admin'}
                              </span>
                              <span style={{ fontSize:10, color:'#94a3b8' }}>· {ago(n.addedAt)}</span>
                            </div>
                            <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.6 }}>{n.note}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <Textarea value={note} onChange={e=>setNote(e.target.value)} rows={2}
                      placeholder="Add a private note for your team…"
                      style={{ background:'rgba(255,255,255,0.8)', borderColor:'#fde68a' }}/>
                    <div style={{ marginTop:8 }}>
                      <Btn onClick={doNote} disabled={busy||!note.trim()} variant="outline" size="sm">Add Note</Btn>
                    </div>
                  </div>
                </div>
              </div>
            ) : selId ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
                <p style={{ color:'#94a3b8', fontSize:14 }}>⏳ Loading…</p>
              </div>
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:48, marginBottom:16, opacity:0.3 }}>👈</div>
                  <p style={{ fontSize:15, fontWeight:600, color:'#94a3b8', margin:'0 0 6px' }}>Select a feedback item</p>
                  <p style={{ fontSize:13, color:'#cbd5e1', margin:0 }}>Click any item from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INTELLIGENCE ── */}
        {tab==='intelligence' && (
          <div style={{ flex:1, overflowY:'auto', padding:'28px 32px', background:'#f8fafc' }}>
            {/* Time filter */}
            <div style={{ display:'flex', gap:6, marginBottom:28 }}>
              {[7,14,30,90].map(d=>(
                <button key={d} onClick={()=>setDays(d)}
                  style={{ padding:'8px 18px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer',
                    outline:'none', transition:'all 0.15s',
                    border: days===d ? 'none' : '1.5px solid #e2e8f0',
                    background: days===d ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#fff',
                    color: days===d ? '#fff' : '#64748b',
                    boxShadow: days===d ? '0 2px 8px rgba(124,58,237,0.3)' : 'none' }}>
                  Last {d}d
                </button>
              ))}
            </div>

            {aLoad ? (
              <Card style={{ padding:80, textAlign:'center' }}>
                <EmptyState icon="⏳" title="Loading analytics…" sub="Crunching the numbers"/>
              </Card>
            ) : analytics && (
              <>
                <div style={{ display:'flex', gap:8, marginBottom:28, flexWrap:'wrap' }}>
                  <GradStat label="Total"     value={analytics.total}                 color="#6366f1" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,escalatedOnly:false,status:'',sentiment:''})); }}/>
                  <GradStat label="Escalated" value={analytics.escalated}             color="#ef4444" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,escalatedOnly:true,status:'',sentiment:''})); }}/>
                  <GradStat label="Open"      value={analytics.open}                  color="#f59e0b" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,status:'new',escalatedOnly:false,sentiment:''})); }}/>
                  <GradStat label="Resolved"  value={analytics.resolved}              color="#10b981" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,status:'resolved',escalatedOnly:false,sentiment:''})); }}/>
                  <GradStat label="Positive"  value={`${analytics.positiveRate||0}%`} color="#10b981" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,sentiment:'positive',status:'',escalatedOnly:false})); }}/>
                  <GradStat label="Negative"  value={`${analytics.negativeRate||0}%`} color="#ef4444" active={false} onClick={()=>{ setTab('inbox'); setFilters(p=>({...p,sentiment:'negative',status:'',escalatedOnly:false})); }}/>
                </div>

                <h2 style={{ margin:'0 0 6px', fontSize:18, fontWeight:800, color:'#0f172a', letterSpacing:-0.3 }}>Business Intelligence</h2>
                <p style={{ margin:'0 0 22px', fontSize:13, color:'#64748b' }}>Positive vs. negative breakdown across all tenants</p>

                <div style={{ marginBottom:28 }}>
                  <InsightRow bySentiment={analytics.bySentiment} avgRatingByCategory={analytics.avgRatingByCategory}/>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, marginBottom:20 }}>
                  {[
                    {title:'By Category', data:analytics.byCategory, colors:Object.fromEntries(Object.entries(CAT).map(([k,v])=>[k,v.color]))},
                    {title:'By Type',     data:analytics.byType,     colors:Object.fromEntries(Object.entries(TYPE).map(([k,v])=>[k,v.color]))},
                    {title:'Sentiment',   data:analytics.bySentiment,colors:{positive:'#10b981',neutral:'#94a3b8',negative:'#ef4444'}},
                    {title:'By Priority', data:analytics.byPriority, colors:{low:'#94a3b8',medium:'#3b82f6',high:'#f59e0b',critical:'#ef4444'}},
                  ].map(ch=>(
                    <Card key={ch.title} style={{ padding:'20px 22px' }}>
                      <p style={{ margin:'0 0 16px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>{ch.title}</p>
                      <MiniBarChart data={ch.data} colors={ch.colors}/>
                    </Card>
                  ))}
                </div>

                {analytics.dailyTrend?.length>1 && (
                  <Card style={{ padding:'20px 22px' }}>
                    <p style={{ margin:'0 0 16px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>Daily Volume</p>
                    <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:100, padding:'0 4px' }}>
                      {analytics.dailyTrend.map((d,i)=>{
                        const max=Math.max(...analytics.dailyTrend.map(x=>x.count),1);
                        const pct=(d.count/max)*100;
                        return (
                          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                            {d.count>0 && <span style={{ fontSize:9, color:'#374151', fontWeight:700 }}>{d.count}</span>}
                            <div style={{ width:'100%', background:'#f1f5f9', borderRadius:4, height:72, display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
                              <div style={{ width:'100%', height:`${pct}%`, background:'linear-gradient(180deg,#7c3aed,#6d28d9)', borderRadius:4, transition:'height 0.5s ease' }}/>
                            </div>
                            <span style={{ fontSize:8, color:'#94a3b8', transform:'rotate(-45deg)', transformOrigin:'center', whiteSpace:'nowrap' }}>
                              {d._id?.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </SaasLayout>
  );
};

/* ═══════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════ */
const Feedback = () => {
  const { user, isSaasOwner } = useAuth();
  if (isSaasOwner()) return <SaasAdminView/>;
  if (['TENANT_ADMIN','TENANT_MANAGER'].includes(user?.userType)) return <TenantAdminView/>;
  return <TenantUserView/>;
};

export default Feedback;
