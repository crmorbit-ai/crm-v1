import React, { useState, useEffect, useCallback } from 'react';
import SaasLayout, { useWindowSize } from '../components/layout/SaasLayout';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';

const STATUS_META = {
  New:     { label:'New',     color:'#dc2626', bg:'#fef2f2', border:'#fecaca', dot:'#ef4444', grad:'linear-gradient(135deg,#dc2626,#ef4444)' },
  Read:    { label:'Read',    color:'#d97706', bg:'#fffbeb', border:'#fde68a', dot:'#f59e0b', grad:'linear-gradient(135deg,#d97706,#f59e0b)' },
  Replied: { label:'Replied', color:'#059669', bg:'#f0fdf4', border:'#a7f3d0', dot:'#10b981', grad:'linear-gradient(135deg,#059669,#10b981)' },
};

const SUBJ_COLOR = {
  'General Inquiry':'#6366f1','Sales':'#10b981','Technical Support':'#0891b2',
  'Partnership':'#d97706','Billing':'#db2777','Other':'#64748b',
};

const SUBJECTS = ['All','General Inquiry','Sales','Technical Support','Partnership','Billing','Other'];
const STATUSES = ['All','New','Read','Replied'];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

function timeAgo(date) {
  const diff=Date.now()-new Date(date).getTime();
  const m=Math.floor(diff/60000),h=Math.floor(diff/3600000),d=Math.floor(diff/86400000);
  if(m<1) return 'Just now';
  if(m<60) return `${m}m ago`;
  if(h<24) return `${h}h ago`;
  if(d<7) return `${d}d ago`;
  return new Date(date).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
}

const AVATAR_COLORS=['#6366f1','#0891b2','#059669','#d97706','#db2777','#7c3aed','#0284c7','#16a34a'];
const avColor = n => AVATAR_COLORS[(n?.charCodeAt(0)||0)%AVATAR_COLORS.length];
const initials = n => (n||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

export default function SaasContactInquiries() {
  const { token } = useAuth();
  const { isMobile } = useWindowSize();
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats]         = useState({ total:0, New:0, Read:0, Replied:0 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusF, setStatusF]     = useState('All');
  const [subjectF, setSubjectF]   = useState('All');
  const [selected, setSelected]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [replying, setReplying]   = useState(false);
  const [note, setNote]           = useState('');
  const [replyText, setReplyText] = useState('');
  const [toast, setToast]         = useState('');

  const hdrs = { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' };

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p=new URLSearchParams();
      if(statusF!=='All') p.set('status',statusF);
      if(subjectF!=='All') p.set('subject',subjectF);
      if(search) p.set('search',search);
      const r=await fetch(`${API_URL}/contact-inquiries?${p}`,{headers:hdrs});
      const d=await r.json();
      if(d.success){setInquiries(d.inquiries);setStats(d.stats);}
    }catch(e){console.error(e);}
    finally{setLoading(false);}
  },[statusF,subjectF,search,token]);

  useEffect(()=>{load();},[load]);

  // Auto-refresh every 30 seconds
  useEffect(()=>{
    const id = setInterval(()=>{ load(); }, 30000);
    return ()=>clearInterval(id);
  },[load]);

  const open = async (inq) => {
    setSelected(inq); setNote(inq.adminNote||''); setReplyText('');
    if(inq.status==='New'){
      await fetch(`${API_URL}/contact-inquiries/${inq._id}`,{method:'PATCH',headers:hdrs,body:JSON.stringify({status:'Read'})});
      load();
    }
  };

  const sendReply = async () => {
    if(!selected || !replyText.trim()) return;
    setReplying(true);
    try{
      const r=await fetch(`${API_URL}/contact-inquiries/${selected._id}/reply`,{method:'POST',headers:hdrs,body:JSON.stringify({replyText})});
      const d=await r.json();
      if(d.success){setSelected(d.inquiry);setNote(d.inquiry.adminNote||'');setReplyText('');load();showToast('Reply sent to '+selected.email);}
      else{ showToast('Error: '+(d.message||'Failed to send')); }
    }catch(e){console.error(e);showToast('Failed to send reply');}
    finally{setReplying(false);}
  };

  const save = async (status) => {
    if(!selected) return;
    setSaving(true);
    try{
      const r=await fetch(`${API_URL}/contact-inquiries/${selected._id}`,{method:'PATCH',headers:hdrs,body:JSON.stringify({status,adminNote:note})});
      const d=await r.json();
      if(d.success){setSelected(d.inquiry);setNote(d.inquiry.adminNote||'');load();showToast('Saved successfully');}
    }catch(e){console.error(e);}
    finally{setSaving(false);}
  };

  const del = async (id) => {
    if(!window.confirm('Delete this inquiry?')) return;
    await fetch(`${API_URL}/contact-inquiries/${id}`,{method:'DELETE',headers:hdrs});
    if(selected?._id===id) setSelected(null);
    load(); showToast('Inquiry deleted');
  };

  return (
    <SaasLayout title="Contact Inquiries">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .ci-tr { transition:background 0.12s; cursor:pointer; }
        .ci-tr:hover { background:#f9fafb !important; }
        .ci-tr.sel { background:#eef2ff !important; }
        .ci-tab { padding:6px 14px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:none; background:transparent; color:#6b7280; transition:all 0.12s; font-family:inherit; }
        .ci-tab:hover { background:#f3f4f6; color:#374151; }
        .ci-tab.on { background:#111827; color:#fff; }
        .ci-inp:focus { outline:none; border-color:#6366f1 !important; box-shadow:0 0 0 3px rgba(99,102,241,0.12) !important; }
        .ci-action { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid #e5e7eb; background:#fff; color:#374151; transition:all 0.12s; font-family:inherit; }
        .ci-action:hover { background:#f9fafb; border-color:#d1d5db; }
        .ci-action.danger:hover { background:#fef2f2; border-color:#fecaca; color:#dc2626; }
        .ci-status-btn { flex:1; padding:7px; font-size:12px; font-weight:700; border-radius:7px; cursor:pointer; border:1px solid #e5e7eb; background:#fff; color:#374151; transition:all 0.12s; font-family:inherit; }
        .ci-status-btn:hover:not(:disabled) { transform:translateY(-1px); }
        .ci-status-btn:disabled { cursor:default; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#111827', color:'#fff', padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:600, zIndex:9999, animation:'fadeIn 0.2s ease', boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
          ✓ {toast}
        </div>
      )}

      {/* ─── Header ─── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#111827', letterSpacing:'-0.3px' }}>Contact Inquiries</div>
          <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{stats.total} total messages from the Contact Us page</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {stats.New > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, padding:'5px 11px', fontSize:12, fontWeight:700, color:'#dc2626' }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'#ef4444',display:'inline-block' }}/>
              {stats.New} unread
            </div>
          )}
          <button onClick={load} className="ci-action">↻ Refresh</button>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        {[
          { label:'Total',   sub:'All inquiries',     value:stats.total,   grad:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)', hov:'linear-gradient(135deg,#4f46e5,#7c3aed,#0891b2)' },
          { label:'New',     sub:'Awaiting response', value:stats.New,     grad:'linear-gradient(135deg,#ec4899 0%,#8b5cf6 50%,#6366f1 100%)', hov:'linear-gradient(135deg,#db2777,#7c3aed,#4f46e5)' },
          { label:'Read',    sub:'Seen, not replied', value:stats.Read,    grad:'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)', hov:'linear-gradient(135deg,#d97706,#ea580c,#dc2626)' },
          { label:'Replied', sub:'Resolved',          value:stats.Replied, grad:'linear-gradient(135deg,#10b981 0%,#16a34a 50%,#84cc16 100%)', hov:'linear-gradient(135deg,#059669,#15803d,#65a30d)' },
        ].map(s=>(
          <div key={s.label}
            onMouseEnter={e=>{ e.currentTarget.style.background=s.hov; e.currentTarget.style.transform='translateY(-3px)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=s.grad; e.currentTarget.style.transform='translateY(0)'; }}
            style={{ background:s.grad, borderRadius:10, padding:'14px 16px', boxShadow:'0 2px 10px rgba(0,0,0,0.15)', cursor:'default', transition:'all 0.15s ease', animation:'fadeIn 0.3s ease' }}>
            <div style={{ fontSize:28, fontWeight:900, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)', marginTop:6 }}>{s.label}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Filters ─── */}
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 14px', marginBottom:12, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="7" stroke="#9ca3af" strokeWidth="2"/><path d="M20 20l-3-3" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email or message…" className="ci-inp"
            style={{ width:'100%', padding:'7px 10px 7px 30px', fontSize:12, border:'1px solid #e5e7eb', borderRadius:7, color:'#111827', fontFamily:'inherit', background:'#f9fafb', boxSizing:'border-box' }}/>
        </div>

        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {STATUSES.map(s=>(
            <button key={s} className={`ci-tab${statusF===s?' on':''}`} onClick={()=>setStatusF(s)}>{s}</button>
          ))}
        </div>

        <select value={subjectF} onChange={e=>setSubjectF(e.target.value)}
          style={{ padding:'7px 28px 7px 10px', fontSize:12, border:'1px solid #e5e7eb', borderRadius:7, color:'#374151', background:'#f9fafb', outline:'none', cursor:'pointer', fontFamily:'inherit', appearance:'none',
            backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat:'no-repeat', backgroundPosition:'right 8px center' }}>
          {SUBJECTS.map(s=><option key={s} value={s}>{s==='All'?'All Subjects':s}</option>)}
        </select>
      </div>

      {/* ─── Main grid ─── */}
      <div style={{ display:'grid', gridTemplateColumns: selected?'1fr 380px':'1fr', gap:12, alignItems:'start' }}>

        {/* ─── Table ─── */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', borderTop:'3px solid #6366f1', animation:'fadeIn 0.3s ease' }}>

          {loading ? (
            <div style={{ padding:48, textAlign:'center' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid #6366f1', borderTopColor:'transparent', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }}/>
              <div style={{ fontSize:13, color:'#94a3b8' }}>Loading inquiries…</div>
            </div>
          ) : inquiries.length === 0 ? (
            <div style={{ padding:60, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#374151', marginBottom:4 }}>No inquiries found</div>
              <div style={{ fontSize:12, color:'#94a3b8' }}>Try adjusting your filters or search query</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                    {['Sender','Subject','Status','Message','Received','Actions'].map((h,i)=>(
                      <th key={i} style={{ padding:'10px 14px', fontSize:11, fontWeight:700, color:'#6b7280', textAlign:'left', textTransform:'uppercase', letterSpacing:0.6, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map(inq=>{
                    const sm=STATUS_META[inq.status];
                    const sc=SUBJ_COLOR[inq.subject]||'#64748b';
                    const isSel=selected?._id===inq._id;
                    return (
                      <tr key={inq._id} className={`ci-tr${isSel?' sel':''}`} onClick={()=>open(inq)}
                        style={{ borderBottom:'1px solid #f3f4f6' }}>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', background:avColor(inq.name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>
                              {initials(inq.name)}
                            </div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:inq.status==='New'?700:500, color:'#111827', display:'flex', alignItems:'center', gap:5 }}>
                                {inq.name}
                                {inq.status==='New' && <span style={{ width:6,height:6,borderRadius:'50%',background:'#ef4444',display:'inline-block',boxShadow:'0 0 4px #ef4444' }}/>}
                              </div>
                              <div style={{ fontSize:11, color:'#6b7280' }}>{inq.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, background:`${sc}15`, color:sc, border:`1px solid ${sc}25`, whiteSpace:'nowrap' }}>{inq.subject}</span>
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:sm.bg, color:sm.color, border:`1px solid ${sm.border}`, display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                            <span style={{ width:5,height:5,borderRadius:'50%',background:sm.dot,display:'inline-block' }}/>
                            {inq.status}
                          </span>
                        </td>
                        <td style={{ padding:'12px 14px', maxWidth:240 }}>
                          <div style={{ fontSize:12, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inq.message}</div>
                        </td>
                        <td style={{ padding:'12px 14px', whiteSpace:'nowrap' }}>
                          <div style={{ fontSize:12, color:'#374151', fontWeight:500 }}>{timeAgo(inq.createdAt)}</div>
                        </td>
                        <td style={{ padding:'12px 14px' }} onClick={e=>e.stopPropagation()}>
                          <button className="ci-action danger" onClick={()=>del(inq._id)}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Detail Panel ─── */}
        {selected && (
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', borderTop:'3px solid #6366f1', animation:'slideIn 0.2s ease', position:'sticky', top:76 }}>

            {/* Panel header */}
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f9fafb' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Inquiry Details</div>
              <button onClick={()=>setSelected(null)} style={{ width:26, height:26, borderRadius:6, border:'1px solid #e5e7eb', background:'#fff', color:'#6b7280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>×</button>
            </div>

            <div style={{ padding:16 }}>
              {/* Sender card */}
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#f9fafb', borderRadius:9, border:'1px solid #e5e7eb', marginBottom:14 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:avColor(selected.name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {initials(selected.name)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{selected.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis' }}>{selected.email}</div>
                  {selected.phone && <div style={{ fontSize:12, color:'#6b7280' }}>{selected.phone}</div>}
                </div>
              </div>

              {/* Meta */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.6, marginBottom:5 }}>Subject</div>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${SUBJ_COLOR[selected.subject]||'#64748b'}15`, color:SUBJ_COLOR[selected.subject]||'#64748b' }}>{selected.subject}</span>
                </div>
                <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.6, marginBottom:5 }}>Received</div>
                  <div style={{ fontSize:11, color:'#374151', fontWeight:600 }}>{timeAgo(selected.createdAt)}</div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>{new Date(selected.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.6, marginBottom:7 }}>Message</div>
                <div style={{ fontSize:13, color:'#334155', lineHeight:1.75, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'12px 14px', whiteSpace:'pre-wrap', maxHeight:160, overflowY:'auto' }}>
                  {selected.message}
                </div>
              </div>

              {/* Current status */}
              <div style={{ marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.6 }}>Status:</div>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:STATUS_META[selected.status].bg, color:STATUS_META[selected.status].color, border:`1px solid ${STATUS_META[selected.status].border}` }}>
                  {selected.status}
                </span>
              </div>

              {/* Admin Note */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.6, marginBottom:7 }}>Internal Note</div>
                <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Add an internal note (not sent to user)…"
                  style={{ width:'100%', padding:'9px 11px', fontSize:12, border:'1px solid #e5e7eb', borderRadius:7, color:'#111827', background:'#f9fafb', outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }} />
              </div>

              {/* Reply to User */}
              <div style={{ marginBottom:14, background:'#f0fdf4', border:'1px solid #a7f3d0', borderRadius:9, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#059669', textTransform:'uppercase', letterSpacing:0.6, marginBottom:7 }}>
                  📧 Reply to User <span style={{ fontWeight:400, color:'#6b7280', textTransform:'none', letterSpacing:0 }}>— sent to {selected.email}</span>
                </div>
                {selected.adminReply && (
                  <div style={{ fontSize:11, color:'#374151', background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:6, padding:'8px 10px', marginBottom:8, whiteSpace:'pre-wrap' }}>
                    <span style={{ fontWeight:700, color:'#059669' }}>Last reply: </span>{selected.adminReply}
                  </div>
                )}
                <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} rows={3} placeholder="Type your reply here… This will be emailed to the user."
                  style={{ width:'100%', padding:'9px 11px', fontSize:12, border:'1px solid #a7f3d0', borderRadius:7, color:'#111827', background:'#fff', outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }} />
                <button onClick={sendReply} disabled={replying||!replyText.trim()}
                  style={{ marginTop:7, width:'100%', padding:'8px', fontSize:12, fontWeight:700, color:'#fff', background: replying||!replyText.trim() ? '#9ca3af' : 'linear-gradient(135deg,#059669,#10b981)', border:'none', borderRadius:7, cursor: replying||!replyText.trim() ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow: replying||!replyText.trim() ? 'none':'0 2px 8px rgba(16,185,129,0.3)' }}>
                  {replying ? 'Sending…' : '📤 Send Reply Email'}
                </button>
              </div>

              {/* Status buttons */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.6, marginBottom:8 }}>Mark as</div>
                <div style={{ display:'flex', gap:6 }}>
                  {['New','Read','Replied'].map(s=>{
                    const sm=STATUS_META[s];
                    const active=selected.status===s;
                    return (
                      <button key={s} className="ci-status-btn" onClick={()=>save(s)} disabled={saving||active}
                        style={{ background:active?sm.grad:'#fff', color:active?'#fff':sm.color, border:`1px solid ${active?'transparent':sm.border}`, boxShadow:active?`0 2px 8px ${sm.dot}44`:undefined }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save + Delete */}
              <button onClick={()=>save(selected.status)} disabled={saving}
                style={{ width:'100%', padding:'9px', fontSize:13, fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit', marginBottom:8, opacity:saving?0.6:1, boxShadow:'0 2px 8px rgba(99,102,241,0.3)' }}>
                {saving?'Saving…':'💾 Save Note'}
              </button>
              <button onClick={()=>del(selected._id)}
                style={{ width:'100%', padding:'8px', fontSize:12, fontWeight:600, color:'#dc2626', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, cursor:'pointer', fontFamily:'inherit' }}>
                🗑 Delete Inquiry
              </button>
            </div>
          </div>
        )}
      </div>
    </SaasLayout>
  );
}
