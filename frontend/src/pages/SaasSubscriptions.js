import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';
import SaasLayout, { useWindowSize } from '../components/layout/SaasLayout';

/* ─── deterministic avatar gradient ─── */
const AV = [['#6366f1','#a78bfa'],['#0ea5e9','#38bdf8'],['#10b981','#34d399'],['#f59e0b','#fbbf24'],['#ec4899','#f472b6'],['#8b5cf6','#c084fc'],['#14b8a6','#2dd4bf'],['#f43f5e','#fb7185']];
const avG = n => { const i=(n?.charCodeAt(0)||0)%AV.length; return `linear-gradient(135deg,${AV[i][0]},${AV[i][1]})`; };
const avC = n => AV[(n?.charCodeAt(0)||0)%AV.length][0];

/* ─── config maps ─── */
const S = {
  active:    {bg:'rgba(34,197,94,0.1)',  c:'#22c55e', b:'rgba(34,197,94,0.3)',  glow:'0 0 12px rgba(34,197,94,0.4)',  label:'Active',    pulse:true },
  trial:     {bg:'rgba(245,158,11,0.1)', c:'#f59e0b', b:'rgba(245,158,11,0.3)', glow:'0 0 12px rgba(245,158,11,0.4)', label:'Trial',     pulse:false},
  expired:   {bg:'rgba(100,116,139,0.1)',c:'#64748b', b:'rgba(100,116,139,0.2)',glow:'none',                          label:'Expired',   pulse:false},
  suspended: {bg:'rgba(239,68,68,0.1)',  c:'#ef4444', b:'rgba(239,68,68,0.3)',  glow:'0 0 12px rgba(239,68,68,0.4)',  label:'Suspended', pulse:false},
  cancelled: {bg:'rgba(100,116,139,0.1)',c:'#64748b', b:'rgba(100,116,139,0.2)',glow:'none',                          label:'Cancelled', pulse:false},
};
const P = {
  Free:         {g:'linear-gradient(135deg,#475569,#64748b)', ico:'—', c:'#94a3b8', ring:'#475569'},
  Basic:        {g:'linear-gradient(135deg,#2563eb,#3b82f6)', ico:'B', c:'#3b82f6', ring:'#2563eb'},
  Professional: {g:'linear-gradient(135deg,#7c3aed,#8b5cf6)', ico:'P', c:'#8b5cf6', ring:'#7c3aed'},
  Enterprise:   {g:'linear-gradient(135deg,#b45309,#f59e0b)', ico:'E', c:'#f59e0b', ring:'#b45309'},
};

/* ─── mini ring component (CSS only) ─── */
const Ring = ({pct=0,size=44,thick=4,color='#6366f1',label,sub}) => {
  const r = (size-thick*2)/2;
  const circ = 2*Math.PI*r;
  const dash = circ*(Math.min(pct,100)/100);
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thick} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thick}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{transition:'stroke-dasharray 0.6s ease',filter:`drop-shadow(0 0 3px ${color}88)`}} />
      </svg>
      <div style={{marginTop:-size/2-2,fontSize:11,fontWeight:900,color:'#fff',textAlign:'center',pointerEvents:'none'}}>{label}</div>
      {sub&&<div style={{fontSize:9,color:'rgba(255,255,255,0.4)',fontWeight:600,marginTop:sub?-2:0}}>{sub}</div>}
    </div>
  );
};

/* ─── sparkline bars ─── */
const Spark = ({data=[],color='#6366f1',height=24}) => {
  const max = Math.max(...data,1);
  return(
    <div style={{display:'flex',alignItems:'flex-end',gap:2,height}}>
      {data.map((v,i)=>(
        <div key={i} style={{flex:1,background:i===data.length-1?color:`${color}55`,borderRadius:2,height:`${(v/max)*100}%`,minHeight:2,transition:'height 0.3s'}} />
      ))}
    </div>
  );
};

const SaasSubscriptions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [revenue, setRevenue]   = useState({total:0,monthlyRecurring:0});
  const [loading, setLoading]   = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status')||'all');
  const [filterPlan, setFilterPlan]     = useState('');
  const [search, setSearch]             = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [actionLoading, setActionLoading]   = useState(false);
  const [toast, setToast]   = useState({msg:'',ok:true});
  const [sortBy, setSortBy] = useState('amount');
  const pageSize = 15;
  const { isMobile } = useWindowSize();

  useEffect(()=>{ loadSubscriptions(); },[]);
  useEffect(()=>{ const s=searchParams.get('status'); if(s&&s!==filterStatus) setFilterStatus(s); },[searchParams]);
  useEffect(()=>{ setCurrentPage(1); },[filterStatus,filterPlan,search,sortBy]);

  const showToast=(msg,ok=true)=>{ setToast({msg,ok}); setTimeout(()=>setToast({msg:'',ok:true}),3200); };

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await subscriptionService.getAllSubscriptions({page:1,limit:1000});
      if(res.success){ setAllSubscriptions(res.data.subscriptions||[]); setRevenue(res.data.revenue); }
    } catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  const handleStatusFilter = s => { setFilterStatus(s); s!=='all'?setSearchParams({status:s}):setSearchParams({}); };

  const handleAction = async updates => {
    try{
      setActionLoading(true);
      await subscriptionService.updateTenantSubscription(selectedTenant._id,updates);
      showToast('Subscription updated successfully');
      await loadSubscriptions();
      setSelectedTenant(null);
    }catch(e){ showToast(e.message||'Update failed',false); }
    finally{ setActionLoading(false); }
  };

  const fmt  = d => d?new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—';
  const fmtM = n => `₹${(n||0).toLocaleString('en-IN')}`;
  const dl   = d => { if(!d) return null; return Math.ceil((new Date(d)-Date.now())/86400000); };

  const stats = {
    total:     allSubscriptions.length,
    active:    allSubscriptions.filter(s=>s.subscription?.status==='active').length,
    trial:     allSubscriptions.filter(s=>s.subscription?.status==='trial').length,
    expired:   allSubscriptions.filter(s=>s.subscription?.status==='expired').length,
    suspended: allSubscriptions.filter(s=>s.subscription?.status==='suspended'||s.isSuspended).length,
  };

  const filtered = allSubscriptions
    .filter(s=>{
      const status = s.isSuspended?'suspended':(s.subscription?.status||'trial');
      const ok1 = filterStatus==='all'||status===filterStatus;
      const ok2 = !filterPlan||s.subscription?.planName===filterPlan;
      const ok3 = !search||s.organizationName?.toLowerCase().includes(search.toLowerCase())||s.organizationId?.toLowerCase().includes(search.toLowerCase());
      return ok1&&ok2&&ok3;
    })
    .sort((a,b)=>{
      if(sortBy==='amount')  return (b.subscription?.amount||0)-(a.subscription?.amount||0);
      if(sortBy==='name')    return (a.organizationName||'').localeCompare(b.organizationName||'');
      if(sortBy==='expires') return new Date(a.subscription?.endDate||0)-new Date(b.subscription?.endDate||0);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length/pageSize);
  const paginated  = filtered.slice((currentPage-1)*pageSize, currentPage*pageSize);

  /* fake sparkline data per tenant (seeded from name) */
  const spark = name => Array.from({length:7},(_,i)=>{
    const seed=(name?.charCodeAt(i%name.length)||50);
    return 30+Math.abs(seed*17+i*31)%70;
  });

  return (
    <SaasLayout title="Subscription Management">
      <style>{`
        @keyframes ssGlow { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ssSlide { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ssFade  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .ssRow { transition:background 0.1s,box-shadow 0.1s; cursor:pointer; }
        .ssRow:hover { background:rgba(99,102,241,0.04) !important; }
        .ssRow:hover .ssAct { opacity:1 !important; }
        .ssKpi { transition:all 0.2s; cursor:pointer; }
        .ssKpi:hover { transform:translateY(-3px); }
        .ssBtn { transition:all 0.15s; cursor:pointer; border:none; }
        .ssBtn:hover:not(:disabled) { filter:brightness(1.12); transform:translateY(-1px); }
        .ssPanel { animation:ssSlide 0.22s ease; }
        .ssToast { animation:ssFade 0.22s ease; }
        .ssPulse { animation:ssGlow 2s ease-in-out infinite; }
        .ssScroll::-webkit-scrollbar { width:4px; height:4px; }
        .ssScroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
        .ssScroll::-webkit-scrollbar-track { background:transparent; }
        .ssInp:focus { outline:none; border-color:#6366f1 !important; box-shadow:0 0 0 3px rgba(99,102,241,0.15) !important; }
      `}</style>

      {/* ── TOAST ── */}
      {toast.msg&&(
        <div className="ssToast" style={{position:'fixed',top:18,right:22,zIndex:9999,padding:'12px 20px',borderRadius:12,background:toast.ok?'#052e16':'#450a0a',border:`1px solid ${toast.ok?'#16a34a':'#dc2626'}`,color:toast.ok?'#4ade80':'#f87171',fontSize:13,fontWeight:600,boxShadow:'0 8px 32px rgba(0,0,0,0.4)',display:'flex',alignItems:'center',gap:10,backdropFilter:'blur(12px)'}}>
          <span style={{fontSize:16}}>{toast.ok?'✓':'✗'}</span>{toast.msg}
        </div>
      )}

      {/* ════════════════════════════════════
          HERO — full dark canvas
      ════════════════════════════════════ */}
      <div style={{background:'linear-gradient(145deg,#060610 0%,#0d0b1e 40%,#0a1628 100%)',borderRadius:20,marginBottom:16,overflow:'hidden',position:'relative',boxShadow:'0 32px 64px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.06)'}}>

        {/* animated grid */}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)',backgroundSize:'40px 40px',pointerEvents:'none'}} />
        {/* glow orbs */}
        <div style={{position:'absolute',top:-100,left:'15%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 65%)',pointerEvents:'none'}} />
        <div style={{position:'absolute',bottom:-80,right:'10%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(14,165,233,0.12) 0%,transparent 65%)',pointerEvents:'none'}} />
        <div style={{position:'absolute',top:'30%',right:'30%',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(236,72,153,0.08) 0%,transparent 65%)',pointerEvents:'none'}} />

        <div style={{position:'relative',zIndex:1,padding:'24px 28px'}}>

          {/* top bar */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:0}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 8px #22c55e'}} className="ssPulse" />
                <span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'3px',textTransform:'uppercase'}}>Live Dashboard</span>
              </div>
              <h1 style={{margin:0,fontSize:26,fontWeight:900,color:'#fff',letterSpacing:'-0.5px',lineHeight:1.15}}>
                Subscription{' '}
                <span style={{background:'linear-gradient(90deg,#a78bfa,#67e8f9,#34d399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                  Management
                </span>
              </h1>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.28)',marginTop:5}}>
                {allSubscriptions.length} tenants · Last synced just now
              </div>
            </div>

            {/* Revenue trio */}
            <div style={{display:'flex',gap:0,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,overflow:'hidden',backdropFilter:'blur(12px)'}}>
              {[
                {label:'MRR',val:revenue?.monthlyRecurring||0, c:'#a78bfa'},
                {label:'ARR',val:(revenue?.monthlyRecurring||0)*12, c:'#67e8f9'},
                {label:'Total Collected',val:revenue?.total||0, c:'#34d399'},
              ].map((r,i)=>(
                <div key={i} style={{padding:'14px 22px',borderRight:i<2?'1px solid rgba(255,255,255,0.06)':0}}>
                  <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:4}}>{r.label}</div>
                  <div style={{fontSize:20,fontWeight:900,color:r.c,letterSpacing:'-0.5px',lineHeight:1}}>{fmtM(r.val)}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
        {[
          {label:'Total',     val:stats.total,     k:'all',       g:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)', gh:'linear-gradient(135deg,#4f46e5,#7c3aed,#0891b2)'},
          {label:'Active',    val:stats.active,    k:'active',    g:'linear-gradient(135deg,#10b981 0%,#059669 50%,#16a34a 100%)', gh:'linear-gradient(135deg,#059669,#047857,#15803d)'},
          {label:'Trial',     val:stats.trial,     k:'trial',     g:'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)', gh:'linear-gradient(135deg,#d97706,#ea580c,#dc2626)'},
          {label:'Expired',   val:stats.expired,   k:'expired',   g:'linear-gradient(135deg,#64748b 0%,#475569 50%,#334155 100%)', gh:'linear-gradient(135deg,#475569,#334155,#1e293b)'},
          {label:'Suspended', val:stats.suspended, k:'suspended', g:'linear-gradient(135deg,#ef4444 0%,#dc2626 50%,#b91c1c 100%)', gh:'linear-gradient(135deg,#dc2626,#b91c1c,#991b1b)'},
        ].map(s=>{
          const on=filterStatus===s.k;
          return(
            <div key={s.k} className="ssKpi" onClick={()=>handleStatusFilter(s.k)}
              onMouseEnter={e=>{e.currentTarget.style.background=s.gh;e.currentTarget.style.transform='translateY(-3px)';}}
              onMouseLeave={e=>{e.currentTarget.style.background=s.g;e.currentTarget.style.transform='translateY(0)';}}
              style={{background:s.g,borderRadius:12,padding:'14px 16px',boxShadow:on?`0 6px 20px rgba(0,0,0,0.25)`:'0 2px 10px rgba(0,0,0,0.12)',cursor:'pointer',transition:'all 0.15s ease',outline:on?'2.5px solid rgba(255,255,255,0.6)':'none',outlineOffset:on?'-3px':0}}>
              <div style={{fontSize:26,fontWeight:900,color:'#fff',lineHeight:1,textShadow:'0 1px 4px rgba(0,0,0,0.2)'}}>{s.val}</div>
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.85)',textTransform:'uppercase',letterSpacing:'0.6px',marginTop:6}}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════ */}
      <div style={{display:'flex',gap:14,alignItems:'flex-start',flexWrap:isMobile?'wrap':'nowrap'}}>

        {/* ── LEFT PANEL ── */}
        <div style={{flex:selectedTenant&&!isMobile?'0 0 58%':'1',minWidth:0,display:'flex',flexDirection:'column',gap:10}}>

          {/* toolbar */}
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:'10px 14px',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
            {/* search */}
            <div style={{position:'relative',flex:1,minWidth:160}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.25)',fontSize:13,pointerEvents:'none'}}>⌕</span>
              <input className="ssInp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search organization…"
                style={{width:'100%',padding:'8px 12px 8px 30px',border:'1.5px solid #e2e8f0',borderRadius:9,fontSize:12,color:'#1e293b',background:'#f8fafc',boxSizing:'border-box',transition:'all 0.15s',outline:'none'}} />
            </div>
            {/* plan filter */}
            <select value={filterPlan} onChange={e=>setFilterPlan(e.target.value)}
              style={{padding:'8px 12px',border:'1.5px solid #e2e8f0',borderRadius:9,fontSize:12,fontWeight:600,color:'#374151',background:'#f8fafc',cursor:'pointer',outline:'none'}}>
              {[['','All Plans'],['Free','Free'],['Basic','Basic'],['Professional','Professional'],['Enterprise','Enterprise']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
            {/* sort */}
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              style={{padding:'8px 12px',border:'1.5px solid #e2e8f0',borderRadius:9,fontSize:12,fontWeight:600,color:'#374151',background:'#f8fafc',cursor:'pointer',outline:'none'}}>
              {[['amount','Sort: Amount'],['name','Sort: Name'],['expires','Sort: Expiry']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
            {(filterStatus!=='all'||filterPlan||search)&&(
              <button className="ssBtn" onClick={()=>{handleStatusFilter('all');setFilterPlan('');setSearch('');}}
                style={{padding:'7px 12px',border:'1px solid rgba(239,68,68,0.35)',borderRadius:9,fontSize:11,fontWeight:700,color:'#f87171',background:'rgba(239,68,68,0.1)',cursor:'pointer'}}>
                ✕ Reset
              </button>
            )}
            <button className="ssBtn" onClick={loadSubscriptions}
              style={{padding:'8px 16px',borderRadius:9,fontSize:12,fontWeight:700,color:'#fff',background:'linear-gradient(135deg,#4f46e5,#7c3aed)',cursor:'pointer',boxShadow:'0 3px 12px rgba(79,70,229,0.35)',display:'flex',alignItems:'center',gap:5}}>
              ↻
            </button>
          </div>

          {/* TABLE CARD */}
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e8edf5',overflow:'hidden',boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>

            {/* card header */}
            <div style={{padding:'12px 18px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',background:'linear-gradient(135deg,#fafbff,#f5f7ff)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 3px 10px rgba(79,70,229,0.35)'}}>
                  <span style={{color:'#fff',fontSize:13}}>◈</span>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:'#0f172a'}}>Tenant Subscriptions</div>
                  <div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>{filtered.length} tenants · page {currentPage} of {totalPages||1}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:5}}>
                {[['amount','₹'],['name','Az'],['expires','📅']].map(([k,ico])=>(
                  <button key={k} className="ssBtn" onClick={()=>setSortBy(k)}
                    style={{width:28,height:28,borderRadius:7,border:`1.5px solid ${sortBy===k?'#6366f1':'#e2e8f0'}`,background:sortBy===k?'#eef2ff':'#fff',color:sortBy===k?'#4f46e5':'#94a3b8',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                    {ico}
                  </button>
                ))}
              </div>
            </div>

            {/* list */}
            {loading?(
              <div style={{padding:'60px',textAlign:'center'}}>
                <div style={{width:36,height:36,borderRadius:'50%',border:'3px solid #e2e8f0',borderTopColor:'#6366f1',margin:'0 auto 12px',animation:'spin 0.8s linear infinite'}}/>
                <div style={{fontSize:12,color:'#94a3b8'}}>Loading subscriptions…</div>
              </div>
            ):paginated.length===0?(
              <div style={{padding:'60px',textAlign:'center'}}>
                <div style={{fontSize:40,opacity:.12,marginBottom:12}}>◈</div>
                <div style={{fontSize:14,fontWeight:700,color:'#334155',marginBottom:4}}>No results found</div>
                <div style={{fontSize:12,color:'#94a3b8'}}>Try adjusting your filters</div>
              </div>
            ):(
              <div className="ssScroll" style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',minWidth:560}}>
                  <thead>
                    <tr style={{background:'#f8fafc',borderBottom:'2px solid #e2e8f0'}}>
                      <th style={{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',width:'32%'}}>Organization</th>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:10,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',width:'18%'}}>Plan</th>
                      <th style={{padding:'10px 12px',textAlign:'right',fontSize:10,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',width:'14%'}}>Amount</th>
                      <th style={{padding:'10px 12px',textAlign:'center',fontSize:10,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',width:'14%'}}>Status</th>
                      <th style={{padding:'10px 12px',textAlign:'center',fontSize:10,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',width:'10%'}}>Period</th>
                      <th style={{padding:'10px 12px',textAlign:'right',fontSize:10,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',width:'12%'}}>Expires</th>
                      <th style={{padding:'10px 12px',textAlign:'center',fontSize:10,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',width:'4%'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((row,i)=>{
                      const status = row.isSuspended?'suspended':(row.subscription?.status||'trial');
                      const plan   = row.subscription?.planName||'Free';
                      const sc = S[status]||S.expired;
                      const pc = P[plan]||P.Free;
                      const expDl = dl(row.subscription?.endDate);
                      const isSel = selectedTenant?._id===row._id;
                      const spData = spark(row.organizationName);
                      return(
                        <tr key={row._id} className="ssRow" onClick={()=>setSelectedTenant(isSel?null:row)}
                          style={{borderBottom:'1px solid #f1f5f9',background:isSel?'#eef2ff':'#fff',borderLeft:`3px solid ${isSel?'#6366f1':sc.c}`}}>

                          {/* Org */}
                          <td style={{padding:'11px 16px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{position:'relative',flexShrink:0}}>
                                <div style={{width:34,height:34,borderRadius:9,background:avG(row.organizationName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:13,boxShadow:`0 2px 6px ${avC(row.organizationName)}44`}}>
                                  {row.organizationName?.charAt(0)?.toUpperCase()||'?'}
                                </div>
                                {status==='active'&&<div className="ssPulse" style={{position:'absolute',bottom:-1,right:-1,width:8,height:8,borderRadius:'50%',background:'#22c55e',border:'2px solid #fff',boxShadow:'0 0 5px #22c55e'}}/>}
                              </div>
                              <div style={{minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:700,color:'#0f172a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:160}}>{row.organizationName}</div>
                                <div style={{fontSize:10,color:'#94a3b8',fontFamily:'monospace',marginTop:1}}>{row.organizationId||'—'}</div>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td style={{padding:'11px 12px'}}>
                            <div style={{display:'inline-flex',alignItems:'center',gap:6}}>
                              <div style={{width:20,height:20,borderRadius:5,background:pc.g,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:8,fontWeight:900,flexShrink:0}}>{pc.ico}</div>
                              <div>
                                <div style={{fontSize:11,fontWeight:700,color:pc.c}}>{plan}</div>
                                <div style={{fontSize:9,color:'#94a3b8'}}>{row.subscription?.billingCycle||'monthly'}</div>
                              </div>
                            </div>
                          </td>

                          {/* Amount */}
                          <td style={{padding:'11px 12px',textAlign:'right'}}>
                            <div style={{fontSize:13,fontWeight:900,color:'#10b981',letterSpacing:'-0.5px'}}>{fmtM(row.subscription?.amount)}</div>
                            <div style={{fontSize:9,color:'#94a3b8',marginTop:1}}>/mo</div>
                          </td>

                          {/* Status */}
                          <td style={{padding:'11px 12px',textAlign:'center'}}>
                            <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,background:sc.bg,border:`1px solid ${sc.b}`,boxShadow:sc.glow}}>
                              <div className={status==='active'?'ssPulse':''} style={{width:5,height:5,borderRadius:'50%',background:sc.c,flexShrink:0}}/>
                              <span style={{fontSize:10,fontWeight:700,color:sc.c,whiteSpace:'nowrap'}}>{sc.label}</span>
                            </div>
                          </td>

                          {/* Period Progress */}
                          <td style={{padding:'11px 12px'}}>
                            {(()=>{
                              const start = row.subscription?.startDate;
                              const end   = row.subscription?.endDate;
                              if(!start||!end) return <span style={{fontSize:10,color:'#cbd5e1'}}>—</span>;
                              const total = new Date(end)-new Date(start);
                              const used  = Date.now()-new Date(start);
                              const pct   = Math.min(100,Math.max(0,Math.round((used/total)*100)));
                              const color = pct>=90?'#ef4444':pct>=70?'#f59e0b':'#10b981';
                              return(
                                <div style={{minWidth:72}}>
                                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                                    <span style={{fontSize:9,color:'#94a3b8'}}>Used</span>
                                    <span style={{fontSize:9,fontWeight:700,color}}>{pct}%</span>
                                  </div>
                                  <div style={{height:5,borderRadius:3,background:'#f1f5f9',overflow:'hidden'}}>
                                    <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width 0.4s'}}/>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Expires */}
                          <td style={{padding:'11px 12px',textAlign:'right'}}>
                            <div style={{fontSize:11,color:'#374151',fontWeight:600}}>{fmt(row.subscription?.endDate)}</div>
                            {expDl!==null&&<div style={{fontSize:9,fontWeight:700,marginTop:2,color:expDl<0?'#ef4444':expDl<=7?'#f59e0b':'#94a3b8'}}>{expDl<0?`${Math.abs(expDl)}d overdue`:expDl===0?'Today':expDl<=30?`${expDl}d left`:''}</div>}
                          </td>

                          {/* Arrow */}
                          <td style={{padding:'11px 12px',textAlign:'center'}}>
                            <span style={{fontSize:16,color:isSel?'#6366f1':'#cbd5e1',fontWeight:700}}>›</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* pagination */}
            {totalPages>1&&(
              <div style={{padding:'10px 16px',borderTop:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,background:'#fafbff'}}>
                <span style={{fontSize:11,color:'#94a3b8'}}>{(currentPage-1)*pageSize+1}–{Math.min(currentPage*pageSize,filtered.length)} of {filtered.length}</span>
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  <button className="ssBtn" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
                    style={{padding:'5px 12px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:11,fontWeight:700,color:currentPage===1?'#cbd5e1':'#374151',background:currentPage===1?'#f8fafc':'#fff',cursor:currentPage===1?'not-allowed':'pointer'}}>←</button>
                  {Array.from({length:Math.min(totalPages,5)},(_,i)=>{ const p=currentPage<=3?i+1:currentPage+i-2; if(p<1||p>totalPages) return null;
                    return <button key={p} className="ssBtn" onClick={()=>setCurrentPage(p)} style={{width:28,height:28,border:`1.5px solid ${p===currentPage?'#6366f1':'#e2e8f0'}`,borderRadius:7,fontSize:11,fontWeight:700,color:p===currentPage?'#fff':'#374151',background:p===currentPage?'linear-gradient(135deg,#4f46e5,#7c3aed)':'#fff',cursor:'pointer',boxShadow:p===currentPage?'0 2px 8px rgba(79,70,229,0.3)':'none'}}>{p}</button>;
                  })}
                  <button className="ssBtn" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage>=totalPages}
                    style={{padding:'5px 12px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:11,fontWeight:700,color:currentPage>=totalPages?'#cbd5e1':'#374151',background:currentPage>=totalPages?'#f8fafc':'#fff',cursor:currentPage>=totalPages?'not-allowed':'pointer'}}>→</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: DETAIL PANEL ── */}
        {selectedTenant&&(()=>{
          const t = selectedTenant;
          const status = t.isSuspended?'suspended':(t.subscription?.status||'trial');
          const plan   = t.subscription?.planName||'Free';
          const sc = S[status]||S.expired;
          const pc = P[plan]||P.Free;
          const isActive = status==='active';
          const expDl = dl(t.subscription?.endDate);
          const usage = [
            {label:'Users',    icon:'👥', used:t.usage?.users||0,    max:t.subscription?.maxUsers||0,    c:'#6366f1'},
            {label:'Leads',    icon:'🎯', used:t.usage?.leads||0,    max:t.subscription?.maxLeads||0,    c:'#0ea5e9'},
            {label:'Contacts', icon:'📇', used:t.usage?.contacts||0, max:t.subscription?.maxContacts||0, c:'#10b981'},
            {label:'Deals',    icon:'💼', used:t.usage?.deals||0,    max:t.subscription?.maxDeals||0,    c:'#f59e0b'},
          ].filter(u=>u.max>0);

          return(
            <div className="ssPanel" style={{flex:`0 0 ${isMobile?'100%':'39%'}`,minWidth:isMobile?'100%':300,order:-1,alignSelf:'flex-start'}}>

              {/* Panel outer card */}
              <div style={{background:'linear-gradient(145deg,#060610,#0d0b1e)',borderRadius:18,overflow:'hidden',boxShadow:'0 20px 48px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.06)'}}>

                {/* dark header */}
                <div style={{padding:'18px 20px',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-40,right:-30,width:160,height:160,borderRadius:'50%',background:`radial-gradient(circle,${avC(t.organizationName)}44 0%,transparent 70%)`,pointerEvents:'none'}} />
                  <button onClick={()=>setSelectedTenant(null)}
                    style={{position:'absolute',top:14,right:14,width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',cursor:'pointer',color:'rgba(255,255,255,0.6)',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>×</button>
                  <div style={{position:'relative',zIndex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
                      <div style={{width:52,height:52,borderRadius:14,background:avG(t.organizationName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:22,flexShrink:0,boxShadow:`0 6px 20px ${avC(t.organizationName)}66`}}>
                        {t.organizationName?.charAt(0)?.toUpperCase()||'?'}
                      </div>
                      <div>
                        <div style={{fontSize:15,fontWeight:800,color:'#fff',lineHeight:1.2}}>{t.organizationName}</div>
                        <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:3,fontFamily:'monospace'}}>{t.organizationId||'—'}</div>
                        <div style={{display:'flex',gap:5,marginTop:6}}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:sc.bg,color:sc.c,border:`1px solid ${sc.b}`}}>
                            <span className={status==='active'?'ssPulse':''} style={{width:5,height:5,borderRadius:'50%',background:sc.c}} />{sc.label}
                          </span>
                          <span style={{padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:`${pc.c}22`,color:pc.c,border:`1px solid ${pc.c}44`}}>{plan}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount hero */}
                    <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div>
                        <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:4}}>Subscription Value</div>
                        <div style={{fontSize:26,fontWeight:900,color:pc.c,letterSpacing:'-0.5px',lineHeight:1}}>{fmtM(t.subscription?.amount)}</div>
                        <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:3}}>per {t.subscription?.billingCycle||'month'}</div>
                      </div>
                      <div style={{width:44,height:44,borderRadius:12,background:pc.g,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:`0 6px 18px ${pc.c}55`,flexShrink:0}}>
                        {plan==='Enterprise'?'👑':plan==='Professional'?'⭐':plan==='Basic'?'💎':'—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* body */}
                <div className="ssScroll" style={{padding:'0 18px 18px',overflowY:'auto',maxHeight:'calc(100vh - 260px)'}}>

                  {/* expiry alert */}
                  {expDl!==null&&expDl<=30&&(
                    <div style={{background:expDl<0?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.1)',border:`1px solid ${expDl<0?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.3)'}`,borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:16}}>{expDl<0?'🚨':'⚠️'}</span>
                      <div>
                        <div style={{fontSize:11,fontWeight:800,color:expDl<0?'#f87171':'#fbbf24'}}>{expDl<0?`Expired ${Math.abs(expDl)} days ago`:`Expires in ${expDl} day${expDl!==1?'s':''}`}</div>
                        <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:1}}>Action required</div>
                      </div>
                    </div>
                  )}

                  {/* Usage rings */}
                  {usage.length>0&&(
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:9,fontWeight:800,color:'rgba(255,255,255,0.3)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:12}}>Usage Overview</div>
                      <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(usage.length,4)},1fr)`,gap:8,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'14px 8px'}}>
                        {usage.map(u=>{
                          const pct=Math.min(Math.round((u.used/u.max)*100),100);
                          const uc=pct>=90?'#ef4444':pct>=70?'#f59e0b':u.c;
                          return(
                            <div key={u.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                              <Ring pct={pct} size={52} thick={5} color={uc} label={`${pct}%`} />
                              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.5)',textAlign:'center'}}>{u.icon} {u.label}</div>
                              <div style={{fontSize:9,color:'rgba(255,255,255,0.25)'}}>{u.used}/{u.max}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Subscription timeline */}
                  <div style={{marginBottom:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'14px 16px'}}>
                    <div style={{fontSize:9,fontWeight:800,color:'rgba(255,255,255,0.3)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:12}}>Timeline</div>
                    {[
                      {label:'Start',   val:fmt(t.subscription?.startDate),   c:'#22c55e', ico:'▶'},
                      {label:'Renewal', val:fmt(t.subscription?.renewalDate), c:'#a78bfa', ico:'↻'},
                      {label:'Expires', val:fmt(t.subscription?.endDate),     c:expDl!==null&&expDl<7?'#ef4444':'#64748b', ico:'⏹'},
                    ].map((item,i,arr)=>(
                      <div key={item.label} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
                          <div style={{width:24,height:24,borderRadius:'50%',background:`${item.c}22`,border:`1.5px solid ${item.c}66`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:item.c,fontWeight:900}}>{item.ico}</div>
                          {i<arr.length-1&&<div style={{width:1,height:20,background:'rgba(255,255,255,0.06)',margin:'3px 0'}} />}
                        </div>
                        <div style={{paddingBottom:i<arr.length-1?16:0}}>
                          <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.5)'}}>{item.label}</div>
                          <div style={{fontSize:12,fontWeight:700,color:'#fff',marginTop:1}}>{item.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Info grid */}
                  <div style={{marginBottom:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'14px 16px'}}>
                    <div style={{fontSize:9,fontWeight:800,color:'rgba(255,255,255,0.3)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:10}}>Details</div>
                    {[
                      ['Billing Cycle', t.subscription?.billingCycle||'—'],
                      ['Auto Renew',    t.subscription?.autoRenew?'✓ Yes':'✗ No'],
                      ['Contact Email', t.contactEmail||'—'],
                      ['Contact Phone', t.contactPhone||'—'],
                      ...(t.reseller?[['Reseller',`${t.reseller.firstName} ${t.reseller.lastName}`],['Commission',`${t.commissionRate||0}%`]]:[]),
                    ].map(([k,v])=>v&&v!=='—'?(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',gap:8}}>
                        <span style={{fontSize:10,color:'rgba(255,255,255,0.28)',fontWeight:600,flexShrink:0}}>{k}</span>
                        <span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.75)',textAlign:'right',wordBreak:'break-all'}}>{v}</span>
                      </div>
                    ):null)}
                  </div>

                  {/* Trial banner */}
                  {t.subscription?.isTrialActive&&(
                    <div style={{background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:10,padding:'12px 14px',marginBottom:14}}>
                      <div style={{fontSize:9,fontWeight:800,color:'#fbbf24',letterSpacing:'2px',textTransform:'uppercase',marginBottom:6}}>⏳ Trial Period</div>
                      <div style={{display:'flex',justifyContent:'space-between'}}>
                        <div><div style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>Start</div><div style={{fontSize:11,fontWeight:700,color:'#fbbf24'}}>{fmt(t.subscription?.trialStartDate)}</div></div>
                        <div style={{textAlign:'right'}}><div style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>End</div><div style={{fontSize:11,fontWeight:700,color:'#fbbf24'}}>{fmt(t.subscription?.trialEndDate)}</div></div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <button className="ssBtn" disabled={actionLoading}
                    onClick={()=>handleAction({status:isActive?'suspended':'active'})}
                    style={{width:'100%',padding:'13px',borderRadius:11,fontSize:13,fontWeight:800,color:'#fff',background:isActive?'linear-gradient(135deg,#dc2626,#f43f5e)':'linear-gradient(135deg,#059669,#10b981)',cursor:actionLoading?'not-allowed':'pointer',opacity:actionLoading?0.65:1,boxShadow:isActive?'0 6px 20px rgba(244,63,94,0.4)':'0 6px 20px rgba(16,185,129,0.4)',letterSpacing:'0.3px'}}>
                    {actionLoading?'Updating…':isActive?'⏸  Suspend Subscription':'▶  Activate Subscription'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </SaasLayout>
  );
};

export default SaasSubscriptions;
