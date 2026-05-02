import React, { useState, useEffect, useCallback, useRef } from 'react';
import supportService from '../services/supportService';
import SaasLayout, { useWindowSize } from '../components/layout/SaasLayout';

/* ── helpers ── */
const PRIORITY = {
  Critical: { border:'#ef4444', bg:'linear-gradient(135deg,#fef2f2,#fee2e2)', bgComp:'linear-gradient(135deg,#fff5f5,#fee2e2)', color:'#dc2626', dot:'#ef4444', glow:'rgba(239,68,68,0.3)'  },
  High:     { border:'#f97316', bg:'linear-gradient(135deg,#fff7ed,#ffedd5)', bgComp:'linear-gradient(135deg,#fff8f0,#ffedd5)', color:'#ea580c', dot:'#f97316', glow:'rgba(249,115,22,0.3)'  },
  Medium:   { border:'#f59e0b', bg:'linear-gradient(135deg,#fffbeb,#fef3c7)', bgComp:'linear-gradient(135deg,#fffcf0,#fef3c7)', color:'#d97706', dot:'#f59e0b', glow:'rgba(245,158,11,0.3)'  },
  Low:      { border:'#10b981', bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', bgComp:'linear-gradient(135deg,#f2fdf6,#dcfce7)', color:'#059669', dot:'#10b981', glow:'rgba(16,185,129,0.3)'  },
};
const STATUS = {
  'Open':                 { color:'#dc2626', bg:'#fef2f2', border:'#fecaca', dot:'#ef4444', grad:'linear-gradient(135deg,#ef4444,#dc2626)' },
  'In Progress':          { color:'#d97706', bg:'#fffbeb', border:'#fde68a', dot:'#f59e0b', grad:'linear-gradient(135deg,#f59e0b,#f97316)' },
  'Waiting for Customer': { color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe', dot:'#3b82f6', grad:'linear-gradient(135deg,#3b82f6,#2563eb)' },
  'Resolved':             { color:'#059669', bg:'#f0fdf4', border:'#bbf7d0', dot:'#10b981', grad:'linear-gradient(135deg,#10b981,#059669)' },
  'Closed':               { color:'#475569', bg:'#f8fafc', border:'#e2e8f0', dot:'#94a3b8', grad:'linear-gradient(135deg,#64748b,#475569)' },
};
const AV=[['#6366f1','#818cf8'],['#10b981','#34d399'],['#f59e0b','#fbbf24'],['#0ea5e9','#38bdf8'],['#ec4899','#f472b6'],['#8b5cf6','#a78bfa'],['#f43f5e','#fb7185'],['#14b8a6','#2dd4bf']];
const avG = n => { const i=(n?.charCodeAt(0)||0)%AV.length; return `linear-gradient(135deg,${AV[i][0]},${AV[i][1]})`; };
const avC = n => AV[(n?.charCodeAt(0)||0)%AV.length][0];
const timeAgo = d => { const s=Math.floor((Date.now()-new Date(d))/1000); if(s<60)return`${s}s`; if(s<3600)return`${Math.floor(s/60)}m`; if(s<86400)return`${Math.floor(s/3600)}h`; return`${Math.floor(s/86400)}d`; };
const fmt = d => d?new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';

const SupportAdmin = () => {
  const { isMobile, isTablet } = useWindowSize();
  const [tickets,setTickets]         = useState([]);
  const [stats,setStats]             = useState({});
  const [selectedTicket,setSelected] = useState(null);
  const [loading,setLoading]         = useState(false);
  const [newMessage,setNewMessage]   = useState('');
  const [isInternal,setIsInternal]   = useState(false);
  const [filters,setFilters]         = useState({status:'',priority:'',category:'',search:''});
  const [pagination,setPagination]   = useState({page:1,limit:20,total:0,pages:0});
  const [sending,setSending]         = useState(false);
  const [panelWidth,setPanelWidth]   = useState(62);
  const msgEnd   = useRef(null);
  const panelRef = useRef(null);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(62);

  const onDragStart = useCallback(e=>{
    dragging.current=true;
    dragStartX.current=e.clientX;
    dragStartW.current=panelWidth;
    document.body.style.cursor='col-resize';
    document.body.style.userSelect='none';
    const move=ev=>{
      if(!dragging.current)return;
      const cw=panelRef.current?.offsetWidth||window.innerWidth;
      const diff=ev.clientX-dragStartX.current;
      const pct=(diff/cw)*100;
      setPanelWidth(w=>Math.min(78,Math.max(30,dragStartW.current+pct)));
    };
    const up=()=>{
      dragging.current=false;
      document.body.style.cursor='';
      document.body.style.userSelect='';
      document.removeEventListener('mousemove',move);
      document.removeEventListener('mouseup',up);
    };
    document.addEventListener('mousemove',move);
    document.addEventListener('mouseup',up);
  },[panelWidth]);

  const loadTickets = useCallback(async()=>{
    try{ setLoading(true); const r=await supportService.getAllTickets({...filters,page:pagination.page,limit:pagination.limit}); setTickets(r.data?.tickets||[]); setPagination(r.data?.pagination||pagination); }
    catch(e){console.error(e);} finally{setLoading(false);}
  },[filters,pagination.page,pagination.limit]);

  const loadStats = useCallback(async()=>{ try{const r=await supportService.getStats();setStats(r.data||{});}catch(e){console.error(e);} },[]);

  useEffect(()=>{loadTickets();loadStats();},[filters,pagination.page,loadTickets,loadStats]);
  useEffect(()=>{ msgEnd.current?.scrollIntoView({behavior:'smooth'}); },[selectedTicket?.messages]);

  const loadDetail = async id=>{ try{const r=await supportService.getTicket(id);setSelected(r.data||r);}catch(e){console.error(e);} };
  const handleUpdateStatus = async s=>{ if(!selectedTicket)return; try{await supportService.updateStatus(selectedTicket._id,s);loadDetail(selectedTicket._id);loadTickets();loadStats();}catch(e){if(e?.isPermissionDenied)return;alert('Error');} };
  const handleAssign = async()=>{ if(!selectedTicket)return; try{await supportService.assignTicket(selectedTicket._id);loadDetail(selectedTicket._id);loadTickets();}catch(e){if(e?.isPermissionDenied)return;alert('Error');} };
  const handleSend = async e=>{ e.preventDefault(); if(!newMessage.trim()||!selectedTicket)return; try{setSending(true);await supportService.addMessage(selectedTicket._id,newMessage,isInternal);setNewMessage('');setIsInternal(false);loadDetail(selectedTicket._id);}catch(e){if(e?.isPermissionDenied)return;alert('Error');}finally{setSending(false);} };
  const handleDelete = async id=>{ if(!window.confirm('Force close this ticket?'))return; try{await supportService.deleteTicket(id);setSelected(null);loadTickets();loadStats();}catch(e){if(e?.isPermissionDenied)return;alert('Error');} };

  const sc = {total:stats.overall?.total||0, open:stats.byStatus?.Open||0, inProgress:stats.byStatus?.['In Progress']||0, resolved:stats.byStatus?.Resolved||0, waiting:stats.byStatus?.['Waiting for Customer']||0};
  const setF = v=>{ setFilters(f=>({...f,status:v})); setPagination(p=>({...p,page:1})); };
  const clear = ()=>{ setFilters({status:'',priority:'',category:'',search:''}); setPagination(p=>({...p,page:1})); };

  return (
    <SaasLayout title="Support">
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .supporta-grid4,.supporta-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .supporta-grid2{grid-template-columns:1fr!important;}
    .supporta-split{flex-direction:column!important;}
    .supporta-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .supporta-panel{width:100%!important;}
    .supporta-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .supporta-form-row{grid-template-columns:1fr!important;}
    .supporta-hide{display:none!important;}
  }
  @media(max-width:480px){
    .supporta-grid4,.supporta-grid3,.supporta-grid2{grid-template-columns:1fr!important;}
  }
`}</style>
      <style>{`
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-32px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .tCard{cursor:pointer;border-radius:14px;border:2px solid transparent;transition:all 0.18s;position:relative;overflow:hidden;}
        .tCard:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.12)!important;}
        .tCard.sel{border-color:#6366f1!important;box-shadow:0 0 0 4px rgba(99,102,241,0.15),0 8px 24px rgba(0,0,0,0.1)!important;}
        .aBtn{cursor:pointer;transition:all 0.15s;border:none;}
        .aBtn:hover{opacity:0.82;transform:translateY(-1px);}
        .fPill{border:1.5px solid #e2e8f0;background:#fff;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.15s;color:#64748b;white-space:nowrap;}
        .fPill:hover{border-color:#6366f1;color:#6366f1;}
        .fPill.on{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border-color:transparent;box-shadow:0 2px 10px rgba(99,102,241,0.4);}
        .sBubble{transition:all 0.15s;}
        .sBubble:hover{transform:scale(1.02);}
        .inp2:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.12);}
        .miniRow{cursor:pointer;border-left:3px solid transparent;transition:background 0.12s;}
        .miniRow:hover{background:#f8fafc!important;}
        .miniRow.sel{background:#eff6ff!important;border-left-color:#6366f1!important;}
      `}</style>

      {/* ══ HEADER ══ */}
      <div style={{background:'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',borderRadius:16,padding:'16px 22px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,boxShadow:'0 4px 24px rgba(0,0,0,0.25)'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:46,height:46,borderRadius:13,background:'rgba(99,102,241,0.3)',border:'1px solid rgba(99,102,241,0.6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🎧</div>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#fff',letterSpacing:'-0.5px'}}>Support Center</div>
            <div style={{fontSize:11,color:'#8b9ccc',marginTop:2}}>{sc.total} tickets · {sc.open} open · {sc.waiting} waiting for customer</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {sc.open>0&&<div style={{background:'rgba(239,68,68,0.18)',border:'1px solid rgba(239,68,68,0.5)',borderRadius:9,padding:'6px 13px',display:'flex',alignItems:'center',gap:7}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#ef4444',animation:'pulse 1.4s infinite',display:'inline-block'}}/>
            <span style={{fontSize:11,fontWeight:700,color:'#fca5a5'}}>{sc.open} need attention</span>
          </div>}
          <button onClick={()=>{loadTickets();loadStats();}} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',padding:'8px 16px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer'}}>↺ Refresh</button>
        </div>
      </div>

      {/* ══ STAT CARDS ══ */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':isTablet?'repeat(3,1fr)':'repeat(5,1fr)',gap:8,marginBottom:12}}>
        {[
          {label:'Total',      val:sc.total,      f:'',                       grad:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)',icon:'🎫'},
          {label:'Open',       val:sc.open,        f:'Open',                   grad:'linear-gradient(135deg,#ef4444 0%,#dc2626 50%,#9f1239 100%)',icon:'🔴'},
          {label:'In Progress',val:sc.inProgress,  f:'In Progress',            grad:'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ea580c 100%)',icon:'⚡'},
          {label:'Waiting',    val:sc.waiting,     f:'Waiting for Customer',   grad:'linear-gradient(135deg,#3b82f6 0%,#2563eb 50%,#1d4ed8 100%)',icon:'⏳'},
          {label:'Resolved',   val:sc.resolved,    f:'Resolved',               grad:'linear-gradient(135deg,#10b981 0%,#059669 50%,#16a34a 100%)',icon:'✅'},
        ].map(s=>(
          <div key={s.label} onClick={()=>setF(s.f)}
            style={{background:s.grad,borderRadius:12,padding:'13px 16px',cursor:'pointer',transition:'all 0.18s',outline:filters.status===s.f?'2px solid rgba(255,255,255,0.6)':'none',outlineOffset:2,boxShadow:filters.status===s.f?'0 6px 18px rgba(0,0,0,0.3)':'0 2px 8px rgba(0,0,0,0.12)',transform:filters.status===s.f?'translateY(-2px)':'none',position:'relative',overflow:'hidden',display:'flex',alignItems:'center',gap:11}}>
            <div style={{position:'absolute',right:-8,top:-8,width:50,height:50,borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}/>
            <div style={{fontSize:20,flexShrink:0}}>{s.icon}</div>
            <div>
              <div style={{fontSize:24,fontWeight:900,color:'#fff',lineHeight:1,textShadow:'0 1px 4px rgba(0,0,0,0.2)'}}>{s.val}</div>
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.85)',marginTop:3,textTransform:'uppercase',letterSpacing:'0.5px'}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div ref={panelRef} style={{display:'flex',gap:0,minHeight:isMobile?'auto':520,position:'relative',flexDirection:isMobile?'column':'row'}}>

        {/* ════ LEFT — Detail Panel (when selected) ════ */}
        {selectedTicket&&(
          <div style={{width:isMobile?'100%':`${panelWidth}%`,flexShrink:0,minWidth:0,display:'flex',flexDirection:'column',background:'#fff',borderRadius:16,border:'1px solid #e2e8f0',overflow:'hidden',animation:'slideInLeft 0.25s ease',boxShadow:'0 4px 24px rgba(0,0,0,0.08)'}}>

            {/* Detail Header */}
            <div style={{background:`linear-gradient(135deg,${STATUS[selectedTicket.status]?.dot||'#6366f1'}22,${STATUS[selectedTicket.status]?.dot||'#6366f1'}08)`,borderBottom:'1px solid #e2e8f0',padding:'16px 20px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                    <span style={{fontFamily:'monospace',fontSize:12,fontWeight:800,color:'#7c3aed',background:'#ede9fe',padding:'3px 10px',borderRadius:20,letterSpacing:'0.5px'}}>{selectedTicket.ticketNumber}</span>
                    {/* Status badge */}
                    {(()=>{const s=STATUS[selectedTicket.status]||STATUS['Closed'];return(
                      <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 11px',borderRadius:20,fontSize:11,fontWeight:700,background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:s.dot}}/>
                        {selectedTicket.status}
                      </span>
                    )})()}
                    {/* Priority badge */}
                    {(()=>{const p=PRIORITY[selectedTicket.priority]||PRIORITY.Low;return(
                      <span style={{display:'inline-flex',alignItems:'center',padding:'4px 11px',borderRadius:20,fontSize:11,fontWeight:700,background:p.bg,color:p.color,border:`1px solid ${p.border}44`}}>{selectedTicket.priority}</span>
                    )})()}
                    {selectedTicket.category&&<span style={{display:'inline-flex',alignItems:'center',padding:'4px 11px',borderRadius:20,fontSize:11,fontWeight:600,background:'#f1f5f9',color:'#475569',border:'1px solid #e2e8f0'}}>{selectedTicket.category}</span>}
                  </div>
                  <h2 style={{margin:0,fontSize:16,fontWeight:800,color:'#0f172a',lineHeight:1.3}}>{selectedTicket.summary}</h2>
                  <div style={{fontSize:11,color:'#64748b',marginTop:6,display:'flex',gap:12,flexWrap:'wrap'}}>
                    <span>🏢 {selectedTicket.tenant?.organizationName||'—'}</span>
                    <span>📅 {fmt(selectedTicket.createdAt)}</span>
                    <span>👤 {selectedTicket.assignedTo?`${selectedTicket.assignedTo.firstName} ${selectedTicket.assignedTo.lastName}`:'Unassigned'}</span>
                  </div>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:'#f1f5f9',border:'none',width:32,height:32,borderRadius:9,color:'#64748b',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontWeight:700}}>✕</button>
              </div>

              {/* Quick action buttons */}
              <div style={{display:'flex',gap:7,marginTop:12,flexWrap:'wrap'}}>
                {!selectedTicket.assignedTo&&<button className="aBtn" onClick={handleAssign} style={{padding:'7px 13px',borderRadius:8,background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',fontSize:11,fontWeight:700,boxShadow:'0 2px 8px rgba(99,102,241,0.35)'}}>👤 Assign to Me</button>}
                {selectedTicket.status==='Open'&&<button className="aBtn" onClick={()=>handleUpdateStatus('In Progress')} style={{padding:'7px 13px',borderRadius:8,background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',fontSize:11,fontWeight:700}}>⚡ Start Working</button>}
                {selectedTicket.status==='In Progress'&&<>
                  <button className="aBtn" onClick={()=>handleUpdateStatus('Waiting for Customer')} style={{padding:'7px 13px',borderRadius:8,background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff',fontSize:11,fontWeight:700}}>⏳ Wait for Customer</button>
                  <button className="aBtn" onClick={()=>handleUpdateStatus('Resolved')} style={{padding:'7px 13px',borderRadius:8,background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontSize:11,fontWeight:700}}>✅ Mark Resolved</button>
                </>}
                {selectedTicket.status==='Waiting for Customer'&&<button className="aBtn" onClick={()=>handleUpdateStatus('In Progress')} style={{padding:'7px 13px',borderRadius:8,background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',fontSize:11,fontWeight:700}}>▶ Resume</button>}
                {selectedTicket.status==='Resolved'&&<button className="aBtn" onClick={()=>handleUpdateStatus('Closed')} style={{padding:'7px 13px',borderRadius:8,background:'linear-gradient(135deg,#64748b,#475569)',color:'#fff',fontSize:11,fontWeight:700}}>🔒 Close</button>}
                <button className="aBtn" onClick={()=>handleDelete(selectedTicket._id)} style={{padding:'7px 13px',borderRadius:8,border:'1.5px solid #fca5a5',background:'#fef2f2',color:'#dc2626',fontSize:11,fontWeight:700,marginLeft:'auto'}}>🗑 Force Close</button>
              </div>
            </div>

            {/* Conversation */}
            <div style={{flex:1,overflowY:'auto',padding:'18px 20px',display:'flex',flexDirection:'column',gap:16,background:'#fafbff'}}>
              {/* Description */}
              {selectedTicket.description&&(
                <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:avG(selectedTicket.createdBy?.firstName||'U'),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{selectedTicket.createdBy?.firstName?.charAt(0)||'?'}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,fontWeight:700,color:'#7c3aed',marginBottom:5,display:'flex',gap:8,alignItems:'center'}}>
                      <span>{selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName}</span>
                      <span style={{background:'#ede9fe',color:'#7c3aed',padding:'1px 7px',borderRadius:10,fontSize:9}}>Original Report</span>
                      <span style={{color:'#94a3b8',fontWeight:400}}>{timeAgo(selectedTicket.createdAt)} ago</span>
                    </div>
                    <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'4px 14px 14px 14px',padding:'12px 16px',fontSize:13,color:'#374151',lineHeight:1.65,whiteSpace:'pre-wrap',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>{selectedTicket.description}</div>
                  </div>
                </div>
              )}

              {/* Messages */}
              {(!selectedTicket.messages||selectedTicket.messages.length===0)?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px',color:'#94a3b8',textAlign:'center'}}>
                  <div style={{fontSize:40,marginBottom:10}}>💬</div>
                  <div style={{fontSize:14,fontWeight:600,color:'#475569'}}>No messages yet</div>
                  <div style={{fontSize:12,marginTop:4}}>Be the first to reply</div>
                </div>
              ):selectedTicket.messages.map((msg,i)=>{
                const isAdmin=msg.senderType==='SAAS_ADMIN';
                const isInt2=msg.isInternal;
                const name=`${msg.sender?.firstName||''} ${msg.sender?.lastName||''}`.trim();

                if(isInt2) return(
                  <div key={i} style={{display:'flex',justifyContent:'center',animation:'fadeUp 0.2s ease'}}>
                    <div style={{background:'linear-gradient(135deg,#fefce8,#fef9c3)',border:'1px solid #fde68a',borderRadius:12,padding:'11px 16px',maxWidth:'88%',width:'100%'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <div style={{display:'flex',gap:7,alignItems:'center'}}>
                          <span style={{fontSize:11,fontWeight:700,color:'#92400e'}}>{name}</span>
                          <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',background:'#fbbf24',color:'#78350f',borderRadius:10}}>🔒 Internal Note</span>
                        </div>
                        <span style={{fontSize:10,color:'#a16207'}}>{timeAgo(msg.sentAt)} ago</span>
                      </div>
                      <p style={{margin:0,fontSize:13,color:'#78350f',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{msg.message}</p>
                    </div>
                  </div>
                );

                return(
                  <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',flexDirection:isAdmin?'row-reverse':'row',animation:'fadeUp 0.2s ease'}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:isAdmin?'linear-gradient(135deg,#6366f1,#4f46e5)':avG(name),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0,boxShadow:`0 2px 8px ${isAdmin?'rgba(99,102,241,0.35)':avC(name)+'55'}`}}>
                      {name?.charAt(0)?.toUpperCase()||'?'}
                    </div>
                    <div style={{maxWidth:'72%',display:'flex',flexDirection:'column',alignItems:isAdmin?'flex-end':'flex-start',gap:4}}>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontSize:11,fontWeight:700,color:'#1e293b'}}>{name}</span>
                        {isAdmin&&<span style={{fontSize:9,background:'#ede9fe',color:'#7c3aed',padding:'1px 7px',borderRadius:10,fontWeight:700}}>Admin</span>}
                        <span style={{fontSize:10,color:'#94a3b8'}}>{timeAgo(msg.sentAt)} ago</span>
                      </div>
                      <div className="sBubble" style={{
                        padding:'12px 16px',
                        borderRadius:isAdmin?'14px 4px 14px 14px':'4px 14px 14px 14px',
                        background:isAdmin?'linear-gradient(135deg,#6366f1,#4f46e5)':'#fff',
                        border:isAdmin?'none':'1px solid #e2e8f0',
                        boxShadow:isAdmin?'0 4px 14px rgba(99,102,241,0.3)':'0 1px 4px rgba(0,0,0,0.06)',
                      }}>
                        <p style={{margin:0,fontSize:13,color:isAdmin?'#fff':'#374151',lineHeight:1.65,whiteSpace:'pre-wrap'}}>{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEnd}/>
            </div>

            {/* Reply box */}
            <form onSubmit={handleSend} style={{borderTop:'1px solid #e2e8f0',padding:'14px 18px',background:isInternal?'#fefce8':'#fff',transition:'background 0.2s',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <label style={{display:'flex',alignItems:'center',gap:7,fontSize:12,fontWeight:isInternal?700:500,color:isInternal?'#92400e':'#475569',cursor:'pointer',userSelect:'none'}}>
                  <input type="checkbox" checked={isInternal} onChange={e=>setIsInternal(e.target.checked)} style={{accentColor:'#d97706',width:14,height:14}}/>
                  {isInternal?'🔒 Internal Note':'Mark as Internal Note'}
                </label>
              </div>
              <div style={{display:'flex',gap:10,alignItems:'flex-end'}}>
                <textarea className="inp2" value={newMessage} onChange={e=>setNewMessage(e.target.value)}
                  placeholder={isInternal?'Internal note — visible to admins only…':'Reply to customer…'}
                  rows={3} required
                  style={{flex:1,padding:'11px 14px',border:`1.5px solid ${isInternal?'#fde68a':'#e2e8f0'}`,borderRadius:10,fontSize:13,resize:'vertical',color:'#1e293b',background:isInternal?'#fffbeb':'#f8fafc',fontFamily:'inherit',lineHeight:1.55,transition:'all 0.15s'}}/>
                <button type="submit" className="aBtn" disabled={sending||!newMessage.trim()}
                  style={{padding:'12px 22px',background:isInternal?'linear-gradient(135deg,#f59e0b,#d97706)':'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',borderRadius:10,fontSize:13,fontWeight:700,flexShrink:0,opacity:sending||!newMessage.trim()?0.55:1,boxShadow:isInternal?'0 2px 10px rgba(245,158,11,0.4)':'0 2px 10px rgba(99,102,241,0.4)'}}>
                  {sending?'…':isInternal?'📝 Note':'➤ Send'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════ DRAG DIVIDER ════ */}
        {selectedTicket&&!isMobile&&(
          <div onMouseDown={onDragStart}
            style={{width:10,flexShrink:0,cursor:'col-resize',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10,margin:'0 2px',position:'relative',userSelect:'none'}}
            title="Drag to resize">
            <div style={{width:4,height:48,borderRadius:2,background:'#cbd5e1',transition:'background 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#6366f1'}
              onMouseLeave={e=>e.currentTarget.style.background='#cbd5e1'}/>
          </div>
        )}

        {/* ════ RIGHT (or full) — Ticket List ════ */}
        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:0,marginLeft:selectedTicket?0:0}}>

          {/* Toolbar */}
          <div style={{background:'#fff',borderRadius:'14px 14px 0 0',border:'1px solid #e2e8f0',borderBottom:'none',padding:'12px 14px',display:'flex',flexDirection:'column',gap:8}}>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',fontSize:14}}>🔍</span>
              <input className="inp2" type="text" placeholder="Search tickets…" value={filters.search}
                onChange={e=>setFilters(f=>({...f,search:e.target.value}))}
                style={{width:'100%',padding:'8px 10px 8px 34px',border:'1px solid #e2e8f0',borderRadius:9,fontSize:12,background:'#f8fafc',boxSizing:'border-box'}}/>
            </div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
              {['','Open','In Progress','Waiting for Customer','Resolved','Closed'].map(v=>(
                <button key={v} className={`fPill${filters.status===v?' on':''}`} onClick={()=>setF(v)} style={{fontSize:10,padding:'4px 10px'}}>
                  {v||'All'}
                </button>
              ))}
              <select value={filters.priority} onChange={e=>setFilters(f=>({...f,priority:e.target.value}))}
                style={{padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:11,background:'#f8fafc',color:'#374151',fontWeight:600,marginLeft:'auto'}}>
                <option value="">All Priority</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderTop:'none',borderRadius:'0 0 14px 14px',overflowY:'auto'}}>
            {loading?(
              <div style={{padding:48,textAlign:'center',color:'#94a3b8'}}><div style={{fontSize:32,marginBottom:8}}>⏳</div>Loading…</div>
            ):tickets.length===0?(
              <div style={{padding:48,textAlign:'center',color:'#94a3b8'}}><div style={{fontSize:40,marginBottom:8}}>🎫</div><div style={{fontSize:13,fontWeight:600}}>No tickets found</div></div>
            ):tickets.map(t=>{
              const isSel=selectedTicket?._id===t._id;
              const pr=PRIORITY[t.priority]||PRIORITY.Low;
              const st=STATUS[t.status]||STATUS['Closed'];

              /* Compact colorful card when detail is open */
              if(selectedTicket) return(
                <div key={t._id} className={`tCard${isSel?' sel':''}`} onClick={()=>loadDetail(t._id)}
                  style={{margin:'7px 10px',background:isSel?'linear-gradient(135deg,#ede9fe,#e0e7ff)':pr.bgComp,border:`2px solid ${isSel?'#6366f1':pr.border}`,boxShadow:isSel?`0 0 0 3px rgba(99,102,241,0.25),0 4px 16px rgba(99,102,241,0.25)`:`0 2px 8px ${pr.glow}`,borderRadius:12,padding:'10px 12px',animation:'fadeUp 0.15s ease',position:'relative',overflow:'hidden'}}>
                  {/* Priority color strip */}
                  <div style={{position:'absolute',top:0,left:0,bottom:0,width:5,background:isSel?'#6366f1':pr.border,borderRadius:'12px 0 0 12px'}}/>
                  <div style={{paddingLeft:8}}>
                    {/* Top row */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontFamily:'monospace',fontSize:10,fontWeight:800,color:isSel?'#5b21b6':pr.color,background:'rgba(255,255,255,0.75)',padding:'2px 8px',borderRadius:20,border:`1px solid ${isSel?'rgba(99,102,241,0.3)':pr.border+'44'}`}}>{t.ticketNumber}</span>
                      <span style={{fontSize:9,color:isSel?'#7c3aed':'#64748b',fontWeight:600}}>{timeAgo(t.createdAt)} ago</span>
                    </div>
                    {/* Title */}
                    <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:6,lineHeight:1.35,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{t.summary}</div>
                    {/* Badges row */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:10,background:'rgba(255,255,255,0.85)',color:st.color,border:`1px solid ${st.border}`}}>
                          <span style={{width:4,height:4,borderRadius:'50%',background:st.dot,display:'inline-block'}}/>
                          {t.status}
                        </span>
                        <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:10,background:'rgba(255,255,255,0.85)',color:pr.color,border:`1px solid ${pr.border}55`}}>{t.priority}</span>
                      </div>
                      {t.tenant?.organizationName&&(
                        <span style={{fontSize:9,color:'#374151',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:80,flexShrink:0}}>{t.tenant.organizationName}</span>
                      )}
                    </div>
                  </div>
                </div>
              );

              /* Full card when no detail open */
              return(
                <div key={t._id} className={`tCard${isSel?' sel':''}`} onClick={()=>loadDetail(t._id)}
                  style={{margin:'6px 10px',background:pr.bg,border:`2px solid ${isSel?'#6366f1':pr.border+'66'}`,boxShadow:isSel?`0 0 0 3px rgba(99,102,241,0.15),0 4px 14px ${pr.glow}`:`0 1px 6px ${pr.glow}`,borderRadius:12,padding:'10px 13px',animation:'fadeUp 0.2s ease',position:'relative',overflow:'hidden'}}>
                  {/* Priority left strip */}
                  <div style={{position:'absolute',top:0,left:0,bottom:0,width:4,background:isSel?'#6366f1':pr.border,borderRadius:'12px 0 0 12px'}}/>
                  <div style={{paddingLeft:8}}>
                    {/* Top row */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
                        <span style={{fontFamily:'monospace',fontSize:10,fontWeight:800,color:'#7c3aed',background:'rgba(124,58,237,0.1)',padding:'2px 8px',borderRadius:20}}>{t.ticketNumber}</span>
                        <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:'rgba(255,255,255,0.8)',color:st.color,border:`1px solid ${st.border}`}}>
                          <span style={{width:5,height:5,borderRadius:'50%',background:st.dot,display:'inline-block'}}/>
                          {t.status}
                        </span>
                        <span style={{display:'inline-flex',alignItems:'center',padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:'rgba(255,255,255,0.8)',color:pr.color,border:`1px solid ${pr.border}55`}}>{t.priority}</span>
                      </div>
                      <span style={{fontSize:10,color:'#64748b',flexShrink:0}}>{timeAgo(t.createdAt)} ago</span>
                    </div>
                    {/* Title */}
                    <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:5,lineHeight:1.3}}>{t.summary}</div>
                    {/* Footer */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:18,height:18,borderRadius:'50%',background:avG(t.tenant?.organizationName),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,flexShrink:0}}>
                          {t.tenant?.organizationName?.charAt(0)?.toUpperCase()||'?'}
                        </div>
                        <span style={{fontSize:11,color:'#475569',fontWeight:500}}>{t.tenant?.organizationName||'N/A'}</span>
                      </div>
                      {t.category&&<span style={{fontSize:10,color:'#64748b',background:'rgba(255,255,255,0.7)',padding:'2px 7px',borderRadius:7,border:'1px solid rgba(0,0,0,0.06)'}}>{t.category}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages>1&&(
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8,padding:'8px 12px',background:'#fff',borderRadius:9,border:'1px solid #e2e8f0',flexWrap:'wrap',gap:6}}>
              <span style={{fontSize:11,color:'#64748b'}}>{pagination.page}/{pagination.pages}</span>
              <div style={{display:'flex',gap:5}}>
                <button onClick={()=>setPagination(p=>({...p,page:p.page-1}))} disabled={pagination.page===1}
                  style={{padding:'5px 11px',border:'1px solid #e2e8f0',borderRadius:7,background:'#fff',fontSize:11,cursor:'pointer',opacity:pagination.page===1?0.4:1,fontWeight:600}}>← Prev</button>
                <button onClick={()=>setPagination(p=>({...p,page:p.page+1}))} disabled={pagination.page===pagination.pages}
                  style={{padding:'5px 11px',border:'1px solid #e2e8f0',borderRadius:7,background:'#fff',fontSize:11,cursor:'pointer',opacity:pagination.page===pagination.pages?0.4:1,fontWeight:600}}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SaasLayout>
  );
};

export default SupportAdmin;
