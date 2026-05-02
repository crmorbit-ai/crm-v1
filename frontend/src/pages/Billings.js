import React, { useState, useEffect, useMemo } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import SaasLayout, { useWindowSize } from '../components/layout/SaasLayout';

/* ── utils ── */
const fmt = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtM = v => { const n=Number(v||0); return n>=1e5?`₹${(n/1e5).toFixed(2)}L`:n>=1000?`₹${(n/1000).toFixed(1)}k`:`₹${n}`; };
const fmtF = v => `₹${Number(v||0).toLocaleString('en-IN')}`;
const dLeft = d => d ? Math.ceil((new Date(d)-Date.now())/864e5) : null;
const AV=[['#10b981','#34d399'],['#6366f1','#a78bfa'],['#f59e0b','#fbbf24'],['#0ea5e9','#38bdf8'],['#ec4899','#f472b6'],['#8b5cf6','#c084fc'],['#f43f5e','#fb7185'],['#14b8a6','#2dd4bf']];
const avG = n => { const i=(n?.charCodeAt(0)||0)%AV.length; return `linear-gradient(135deg,${AV[i][0]},${AV[i][1]})`; };
const avC = n => AV[(n?.charCodeAt(0)||0)%AV.length][0];

const PLAN_COLOR = { Enterprise:'#f59e0b', Professional:'#8b5cf6', Basic:'#3b82f6', Free:'#64748b' };
const planC = p => PLAN_COLOR[p] || '#10b981';

const ST = {
  active:   { c:'#10b981', bg:'rgba(16,185,129,0.1)',  b:'rgba(16,185,129,0.3)',  glow:'0 0 12px rgba(16,185,129,0.35)',  label:'Active',    dot:true  },
  trial:    { c:'#f59e0b', bg:'rgba(245,158,11,0.1)',  b:'rgba(245,158,11,0.3)',  glow:'0 0 12px rgba(245,158,11,0.35)',  label:'Trial',     dot:true  },
  expired:  { c:'#64748b', bg:'rgba(100,116,139,0.1)', b:'rgba(100,116,139,0.2)', glow:'none',                            label:'Expired',   dot:false },
  suspended:{ c:'#ef4444', bg:'rgba(239,68,68,0.1)',   b:'rgba(239,68,68,0.3)',   glow:'0 0 12px rgba(239,68,68,0.35)',   label:'Suspended', dot:false },
  cancelled:{ c:'#64748b', bg:'rgba(100,116,139,0.1)', b:'rgba(100,116,139,0.2)', glow:'none',                            label:'Cancelled', dot:false },
};

/* ── SVG Area Chart ── */
const AreaChart = ({ pts=[], months=[], color='#10b981', h=160 }) => {
  if(pts.length<2) return null;
  const VW=800, VH=h, pad={t:8,r:8,b:22,l:46};
  const iW=VW-pad.l-pad.r, iH=VH-pad.t-pad.b;
  const mx=Math.max(...pts,1), mn=0, rng=mx-mn||1;
  const P=pts.map((v,i)=>({ x:pad.l+(i/(pts.length-1))*iW, y:pad.t+iH-((v-mn)/rng)*iH }));
  let line=`M${P[0].x},${P[0].y}`;
  for(let i=1;i<P.length;i++){const cx=(P[i-1].x+P[i].x)/2;line+=` C${cx},${P[i-1].y} ${cx},${P[i].y} ${P[i].x},${P[i].y}`;}
  const area=line+` L${P[P.length-1].x},${pad.t+iH} L${P[0].x},${pad.t+iH}Z`;
  const uid=color.replace(/\W/g,'');
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{width:'100%',height:VH,display:'block'}}>
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .billings-grid4,.billings-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .billings-grid2{grid-template-columns:1fr!important;}
    .billings-split{flex-direction:column!important;}
    .billings-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .billings-panel{width:100%!important;}
    .billings-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .billings-form-row{grid-template-columns:1fr!important;}
    .billings-hide{display:none!important;}
  }
  @media(max-width:480px){
    .billings-grid4,.billings-grid3,.billings-grid2{grid-template-columns:1fr!important;}
  }
`}</style>
      <defs>
        <linearGradient id={`ag${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
          <stop offset="85%" stopColor={color} stopOpacity="0.03"/>
        </linearGradient>
      </defs>
      {[0,25,50,75,100].map(p=>{
        const y=pad.t+((100-p)/100)*iH;
        return <line key={p} x1={pad.l} y1={y} x2={pad.l+iW} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="3 5"/>;
      })}
      {[0,25,50,75,100].map(p=>{
        const y=pad.t+((100-p)/100)*iH, v=(p/100)*mx;
        return <text key={p} x={pad.l-5} y={y+4} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">{fmtM(v)}</text>;
      })}
      <path d={area} fill={`url(#ag${uid})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" style={{filter:`drop-shadow(0 0 6px ${color}77)`}}/>
      {P.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={i===P.length-1?4:2.5} fill={i===P.length-1?color:'#e2e8f0'} stroke="#fff" strokeWidth="1.5"
            style={{filter:i===P.length-1?`drop-shadow(0 0 6px ${color})`:'none'}}/>
        </g>
      ))}
      {months.map((m,i)=>(
        <text key={i} x={P[i]?.x} y={VH-2} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">{m}</text>
      ))}
    </svg>
  );
};

/* ── Ring ── */
const Ring = ({pct=0,size=40,thick=4.5,color='#10b981'}) => {
  const r=(size-thick*2)/2, circ=2*Math.PI*r, dash=circ*(Math.min(pct,100)/100);
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={thick}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thick}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{transition:'stroke-dasharray 0.6s ease',filter:`drop-shadow(0 0 5px ${color}88)`}}/>
    </svg>
  );
};

/* ══════════════════════════════════════════
   MAIN
══════════════════════════════════════════ */
const Billings = () => {
  const [billings,setBillings]=useState([]);
  const [stats,setStats]=useState({mrr:0,arr:0,active:0,pending:0,avg:0,totalPaid:0});
  const [loading,setLoading]=useState(true);
  const [statusFilter,setStatusFilter]=useState('all');
  const [search,setSearch]=useState('');
  const [sort,setSort]=useState('amount');
  const [period,setPeriod]=useState('6M');
  const [selected,setSelected]=useState(null);
  const [actionLoading,setActionLoading]=useState(false);
  const {width,isMobile,isTablet}=useWindowSize();
  const compact=width<1100;

  const handleAction = async (updates) => {
    try {
      setActionLoading(true);
      await subscriptionService.updateTenantSubscription(selected._id, updates);
      await load();
      setSelected(null);
    } catch(e) { alert(e.message||'Update failed'); }
    finally { setActionLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  const load=async()=>{
    try{
      setLoading(true);
      const res=await subscriptionService.getAllSubscriptions({});
      if(res.success){
        const subs=res.data.subscriptions||[];
        setBillings(subs);
        const mrr=subs.reduce((s,t)=>s+(t.subscription?.amount||0),0);
        const active=subs.filter(t=>t.subscription?.status==='active').length;
        const totalPaid=subs.reduce((s,t)=>s+(t.subscription?.totalPaid||0),0);
        setStats({ mrr, arr:mrr*12, active, pending:subs.length-active, avg:subs.length?Math.round(mrr/subs.length):0, totalPaid });
      }
    }catch(e){console.error(e);}finally{setLoading(false);}
  };

  /* plan breakdown for sidebar */
  const planBreakdown=useMemo(()=>{
    const map={};
    billings.forEach(b=>{
      const p=b.subscription?.planName||'Free';
      if(!map[p])map[p]={count:0,rev:0};
      map[p].count++; map[p].rev+=b.subscription?.amount||0;
    });
    return Object.entries(map).sort((a,b)=>b[1].rev-a[1].rev);
  },[billings]);
  const maxPlanRev=planBreakdown.reduce((m,[,v])=>Math.max(m,v.rev),1);

  /* chart data — real MRR per month from actual subscription startDate/endDate */
  const {chartPts,chartMonths}=useMemo(()=>{
    const n=period==='1M'?4:period==='3M'?6:period==='6M'?8:12;
    const now=new Date();
    const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const pts=Array.from({length:n},(_,i)=>{
      const offset=n-1-i;
      const mStart=new Date(now.getFullYear(),now.getMonth()-offset,1);
      const mEnd  =new Date(now.getFullYear(),now.getMonth()-offset+1,0,23,59,59);
      return billings.reduce((sum,b)=>{
        const start=b.subscription?.startDate?new Date(b.subscription.startDate):null;
        const end  =b.subscription?.endDate  ?new Date(b.subscription.endDate)  :null;
        const amt  =b.subscription?.amount||0;
        if(!start||!amt) return sum;
        // active during this month: started before month end AND (no end or ends after month start)
        const active=start<=mEnd&&(!end||end>=mStart);
        return active?sum+amt:sum;
      },0);
    });
    const mths=Array.from({length:n},(_,i)=>{
      const offset=n-1-i;
      const d=new Date(now.getFullYear(),now.getMonth()-offset,1);
      return MONTHS[d.getMonth()];
    });
    return{chartPts:pts,chartMonths:mths};
  },[billings,period]);

  /* filtered rows */
  const rows=billings.filter(b=>{
    const q=search.toLowerCase();
    const mQ=!q||(b.organizationName||'').toLowerCase().includes(q)||(b.organizationId||'').toLowerCase().includes(q);
    const mS=statusFilter==='all'||(statusFilter==='churn'?(()=>{const d=dLeft(b.subscription?.endDate);return d!==null&&d>=0&&d<14;})():b.subscription?.status===statusFilter);
    return mQ&&mS;
  }).sort((a,b)=>{
    if(sort==='amount')return(b.subscription?.amount||0)-(a.subscription?.amount||0);
    if(sort==='name')return(a.organizationName||'').localeCompare(b.organizationName||'');
    if(sort==='date')return new Date(b.subscription?.endDate||0)-new Date(a.subscription?.endDate||0);
    return 0;
  });

  const STAT_FILTERS=[
    {k:'all',     l:'All Subscriptions', n:billings.length,       c:'#64748b'},
    {k:'active',  l:'Active',            n:stats.active,          c:'#10b981'},
    {k:'trial',   l:'Trial',             n:billings.filter(b=>b.subscription?.status==='trial').length, c:'#f59e0b'},
    {k:'expired', l:'Expired / Overdue', n:billings.filter(b=>['expired','suspended'].includes(b.subscription?.status)).length, c:'#ef4444'},
  ];

  const trialCount  = billings.filter(b=>b.subscription?.status==='trial').length;
  const expiredCount= billings.filter(b=>['expired','suspended'].includes(b.subscription?.status)).length;
  const churnRisk   = billings.filter(b=>{ const d=dLeft(b.subscription?.endDate); return d!==null&&d>=0&&d<14; }).length;
  const healthPct   = billings.length ? Math.round((stats.active/billings.length)*100) : 0;
  const healthColor = healthPct>=70?'#10b981':healthPct>=40?'#f59e0b':'#ef4444';

  /* Real MRR Growth: current month vs previous month */
  const mrrGrowth = useMemo(()=>{
    const now = new Date();
    const calcMRR = (monthOffset) => {
      const mStart = new Date(now.getFullYear(), now.getMonth()-monthOffset, 1);
      const mEnd   = new Date(now.getFullYear(), now.getMonth()-monthOffset+1, 0, 23, 59, 59);
      return billings.reduce((sum,b)=>{
        const start = b.subscription?.startDate ? new Date(b.subscription.startDate) : null;
        const end   = b.subscription?.endDate   ? new Date(b.subscription.endDate)   : null;
        const amt   = b.subscription?.amount||0;
        if(!start||!amt) return sum;
        return (start<=mEnd&&(!end||end>=mStart)) ? sum+amt : sum;
      },0);
    };
    const curr = calcMRR(0);
    const prev = calcMRR(1);
    if(!prev) return curr>0?'+100%':'—';
    const pct = ((curr-prev)/prev)*100;
    return (pct>=0?'+':'')+pct.toFixed(1)+'%';
  },[billings]);

  const KPI_CARDS=[
    {l:'Total',    v:billings.length, icon:'◈', g:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)', gh:'linear-gradient(135deg,#4f46e5,#7c3aed,#0891b2)', k:'all'},
    {l:'Active',   v:stats.active,    icon:'◉', g:'linear-gradient(135deg,#10b981 0%,#059669 50%,#16a34a 100%)', gh:'linear-gradient(135deg,#059669,#047857,#15803d)', k:'active'},
    {l:'Trial',    v:trialCount,      icon:'◎', g:'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)', gh:'linear-gradient(135deg,#d97706,#ea580c,#dc2626)',  k:'trial'},
    {l:'Expired',  v:expiredCount,    icon:'◌', g:'linear-gradient(135deg,#64748b 0%,#475569 50%,#334155 100%)', gh:'linear-gradient(135deg,#475569,#334155,#1e293b)',  k:'expired'},
    {l:'Churn Risk',v:churnRisk,      icon:'⚠', g:'linear-gradient(135deg,#ef4444 0%,#dc2626 50%,#b91c1c 100%)', gh:'linear-gradient(135deg,#dc2626,#b91c1c,#991b1b)', k:'churn'},
  ];

  return (
    <SaasLayout title="Billing">
      <style>{`
        @keyframes bP{0%,100%{opacity:1}50%{opacity:0.25}}
        @keyframes bS{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes bF{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bO{0%,100%{transform:scale(1)}50%{transform:scale(1.1) translate(6px,-8px)}}
        .bFilterBtn{width:100%;text-align:left;border:none;cursor:pointer;padding:10px 14px;border-radius:10px;transition:all 0.15s;background:none;display:flex;align-items:center;justify-content:space-between}
        .bFilterBtn:hover{background:#f1f5f9}
        .bFilterBtn.on{border:1px solid currentColor!important}
        .bPBtn{padding:5px 13px;border-radius:7px;font-size:10px;font-weight:700;border:none;cursor:pointer;transition:all 0.15s;letter-spacing:0.5px}
        .bActBtn{width:100%;padding:10px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;border:none;transition:opacity 0.15s;text-align:center}
        .bActBtn:hover{opacity:0.75}
        .bTh{position:sticky;top:0;z-index:2;background:#1e293b;border:1px solid #334155;padding:7px 10px;font-size:10px;font-weight:700;color:#94a3b8;text-align:left;white-space:nowrap;user-select:none;letter-spacing:.5px;text-transform:uppercase;}
        .bTd{border:1px solid #e2e6eb;padding:0 10px;font-size:12px;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;height:40px;vertical-align:middle;}
        .bTr{cursor:pointer;}
        .bTr:hover .bTd{background:#eff6ff!important;}
        .bTr.bSel .bTd{background:#e0e7ff!important;border-color:#c7d2fe!important;}
        .bNum{position:sticky;left:0;z-index:1;background:#f8fafc!important;border:1px solid #d1d5db!important;padding:0 8px;font-size:10px;color:#94a3b8;text-align:center;width:32px;min-width:32px;font-weight:600;}
        .bTr.bSel .bNum{background:#e0e7ff!important;}
        .bSortBtn{border:none;background:none;font-size:11px;font-weight:600;color:#94a3b8;cursor:pointer;padding:5px 10px;border-radius:7px;transition:all 0.15s}
        .bSortBtn:hover{color:#1e293b;background:#f1f5f9}
        .bSortBtn.on{color:#10b981;background:rgba(16,185,129,0.1)}
        @media(max-width:1100px){
          .bPageBody{flex-direction:column!important}
          .bSidebar{width:100%!important;flex-direction:row!important;gap:12px!important}
          .bSideSection{flex:1}
          .bDetailPane{position:fixed!important;bottom:0;left:0;right:0;top:auto!important;width:100%!important;max-height:72vh!important;border-radius:20px 20px 0 0!important;z-index:999}
        }
        @media(max-width:640px){
          .bRevenueStrip{flex-direction:column!important;gap:0!important}
          .bStripDivider{display:none!important}
          .bRevenueStrip>div{border-bottom:1px solid rgba(255,255,255,0.06)!important}
          .bSidebar{display:none!important}
          .bCol-plan,.bCol-trend{display:none}
        }
      `}</style>

      {/* ══ PAGE HEADER ══ */}
      <div style={{display:'flex',alignItems:isMobile?'flex-start':'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12,flexDirection:isMobile?'column':'row'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 10px #10b981',animation:'bP 2s infinite'}}/>
            <span style={{fontSize:10,color:'#64748b',fontFamily:'monospace',letterSpacing:2,textTransform:'uppercase'}}>Live · Revenue Console</span>
          </div>
          <h1 style={{margin:0,fontSize:26,fontWeight:900,color:'#1e293b',letterSpacing:-0.8}}>
            Billing <span style={{background:'linear-gradient(90deg,#10b981,#34d399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>&amp; Revenue</span>
          </h1>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={load} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,color:'#475569',fontSize:12,padding:'9px 18px',cursor:'pointer',fontWeight:600}}>↺ Sync</button>
          <button style={{background:'linear-gradient(135deg,#10b981,#059669)',border:'none',borderRadius:10,color:'#fff',fontSize:12,padding:'9px 18px',cursor:'pointer',fontWeight:700,boxShadow:'0 4px 18px rgba(16,185,129,0.4)'}}>⬇ Export</button>
        </div>
      </div>

      {/* ══ REVENUE STRIP ══ */}
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',marginBottom:20,border:'1px solid rgba(255,255,255,0.08)'}}>
        {/* animated bg */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#09101f,#07121a)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:-80,left:'25%',width:300,height:300,background:'radial-gradient(circle,rgba(16,185,129,0.1),transparent 65%)',animation:'bO 10s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-80,right:'10%',width:250,height:250,background:'radial-gradient(circle,rgba(99,102,241,0.08),transparent 65%)',animation:'bO 14s ease-in-out infinite reverse',pointerEvents:'none'}}/>

        <div className="bRevenueStrip" style={{position:'relative',display:'flex',alignItems:'stretch'}}>
          {[
            {l:'Monthly Recurring Revenue',v:fmtF(stats.mrr),      sub:fmtM(stats.mrr)+'/mo',       chg:mrrGrowth, up:!mrrGrowth.startsWith('-'), c:'#10b981'},
            {l:'Annual Run Rate',          v:fmtF(stats.arr),      sub:fmtM(stats.arr)+'/yr',       chg:mrrGrowth, up:!mrrGrowth.startsWith('-'), c:'#6366f1'},
            {l:'Total Collected',          v:fmtF(stats.totalPaid),sub:billings.length+' subs',    chg:`${billings.length} tenants`, up:null, c:'#f59e0b'},
            {l:'Avg Plan Value',           v:fmtF(stats.avg),      sub:'per subscription',         chg:'→ stable',up:null,c:'#0ea5e9'},
          ].map((m,i)=>(
            <React.Fragment key={i}>
              {i>0&&<div className="bStripDivider" style={{width:1,background:'rgba(255,255,255,0.07)',flexShrink:0}}/>}
              <div style={{flex:1,padding:'28px 28px 24px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,right:0,width:80,height:80,background:`radial-gradient(circle at 100% 0%,${m.c}18,transparent 70%)`,pointerEvents:'none'}}/>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.32)',fontWeight:600,letterSpacing:0.5,marginBottom:12,textTransform:'uppercase'}}>{m.l}</div>
                <div style={{fontSize:30,fontWeight:900,color:'#fff',fontFamily:'monospace',letterSpacing:-1.5,lineHeight:1,marginBottom:8}}>{m.v}</div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:'rgba(255,255,255,0.28)'}}>{m.sub}</span>
                  <span style={{fontSize:11,fontWeight:700,color:m.up===null?'rgba(255,255,255,0.4)':m.up?'#22c55e':'#f43f5e',padding:'2px 8px',borderRadius:20,background:m.up===null?'rgba(255,255,255,0.06)':m.up?'rgba(34,197,94,0.1)':'rgba(244,63,94,0.1)'}}>{m.chg}</span>
                </div>
                <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${m.c}99,${m.c}00)`}}/>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══ KPI STAT CARDS ══ */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':isTablet?'repeat(3,1fr)':'repeat(5,1fr)',gap:10,marginBottom:16}}>
        {KPI_CARDS.map((s,i)=>{
          const on = statusFilter===s.k;
          return (
          <div key={i} onClick={()=>setStatusFilter(s.k)}
            onMouseEnter={e=>{e.currentTarget.style.background=s.gh;e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 10px 28px rgba(0,0,0,0.22)';}}
            onMouseLeave={e=>{e.currentTarget.style.background=s.g;e.currentTarget.style.transform=on?'translateY(-2px)':'translateY(0)';e.currentTarget.style.boxShadow=on?'0 8px 24px rgba(0,0,0,0.2)':'0 2px 10px rgba(0,0,0,0.1)';}}
            style={{background:s.g,borderRadius:14,padding:'16px 14px',cursor:'pointer',transition:'all 0.18s ease',
              boxShadow: on?'0 8px 24px rgba(0,0,0,0.2)':'0 2px 10px rgba(0,0,0,0.1)',
              transform: on?'translateY(-2px)':'translateY(0)',
              outline: on?'2.5px solid rgba(255,255,255,0.7)':'2.5px solid transparent',
              position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:-16,right:-10,fontSize:52,opacity:0.12,fontWeight:900,lineHeight:1}}>{s.icon}</div>
            {on&&<div style={{position:'absolute',top:8,right:8,width:7,height:7,borderRadius:'50%',background:'#fff',boxShadow:'0 0 6px rgba(255,255,255,0.9)'}}/>}
            <div style={{fontSize:28,fontWeight:900,color:'#fff',lineHeight:1,fontFamily:'monospace'}}>{s.v}</div>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.82)',textTransform:'uppercase',letterSpacing:0.7,marginTop:8}}>{s.l}</div>
          </div>
        );})}
      </div>

      {/* ══ BODY: SIDEBAR + MAIN ══ */}
      <div className="bPageBody" style={{display:'flex',gap:16,alignItems:'flex-start'}}>

        {/* ── SIDEBAR ── */}
        <div className="bSidebar" style={{width:230,flexShrink:0,display:'flex',flexDirection:'column',gap:12}}>

          {/* Status Filters */}
          <div className="bSideSection" style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'14px 12px',borderTop:'3px solid #6366f1'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#6366f1',textTransform:'uppercase',letterSpacing:1.4,marginBottom:10,padding:'0 2px'}}>Quick Filters</div>
            {STAT_FILTERS.map(f=>{const on=statusFilter===f.k; return (
              <button key={f.k} className={`bFilterBtn${on?' on':''}`} onClick={()=>setStatusFilter(f.k)}
                style={{border:`1px solid ${on?f.c+'44':'transparent'}`,background:on?`${f.c}12`:'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:f.c,flexShrink:0,boxShadow:on?`0 0 7px ${f.c}`:'none'}}/>
                  <span style={{fontSize:12,fontWeight:600,color:on?f.c:'#374151'}}>{f.l}</span>
                </div>
                <span style={{fontSize:11,fontWeight:800,color:on?f.c:'#94a3b8',fontFamily:'monospace'}}>{f.n}</span>
              </button>
            );})}

          </div>

          {/* Plan Breakdown */}
          <div className="bSideSection" style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'14px 16px',borderTop:'3px solid #10b981'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#10b981',textTransform:'uppercase',letterSpacing:1.4,marginBottom:14}}>Plan Breakdown</div>
            {planBreakdown.length===0?(
              <div style={{fontSize:11,color:'#94a3b8',textAlign:'center',padding:'12px 0'}}>No data yet</div>
            ):planBreakdown.map(([plan,d],i)=>(
              <div key={i} style={{marginBottom:i<planBreakdown.length-1?14:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:8,height:8,borderRadius:2,background:planC(plan),flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:600,color:'#374151'}}>{plan}</span>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,fontWeight:800,color:'#1e293b',fontFamily:'monospace'}}>{fmtM(d.rev)}</div>
                    <div style={{fontSize:9,color:'#94a3b8'}}>{d.count} sub{d.count!==1?'s':''}</div>
                  </div>
                </div>
                <div style={{height:4,borderRadius:2,background:'#f1f5f9',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(d.rev/maxPlanRev)*100}%`,background:`linear-gradient(90deg,${planC(plan)},${planC(plan)}88)`,borderRadius:2,transition:'width 0.6s ease',boxShadow:`0 0 6px ${planC(plan)}66`}}/>
                </div>
              </div>
            ))}
          </div>
          {/* Revenue Health */}
          <div className="bSideSection" style={{background:'linear-gradient(145deg,#0f172a 0%,#1e1b4b 50%,#0f2027 100%)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:14,padding:'16px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:-30,right:-30,width:120,height:120,background:'radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)',pointerEvents:'none'}}/>
            <div style={{position:'absolute',bottom:-20,left:-20,width:100,height:100,background:'radial-gradient(circle,rgba(16,185,129,0.15),transparent 70%)',pointerEvents:'none'}}/>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:1.4,marginBottom:14,position:'relative'}}>Revenue Health</div>
            {/* Ring gauge */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16,position:'relative'}}>
              <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                <Ring pct={healthPct} size={96} thick={9} color={healthColor}/>
                <div style={{position:'absolute',textAlign:'center'}}>
                  <div style={{fontSize:24,fontWeight:900,color:'#fff',lineHeight:1,fontFamily:'monospace'}}>{healthPct}%</div>
                  <div style={{fontSize:8,color:'rgba(255,255,255,0.35)',marginTop:2,letterSpacing:1}}>HEALTH</div>
                </div>
              </div>
            </div>
            {/* Mini metrics */}
            {[
              {l:'Active Rate', v:`${healthPct}%`,          c:healthColor},
              {l:'MRR Growth',  v:mrrGrowth,                c:mrrGrowth.startsWith('+')?'#6366f1':'#ef4444'},
              {l:'Churn Risk',  v:`${churnRisk} accts`,     c:churnRisk>0?'#f59e0b':'#10b981'},
            ].map((s,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:i<2?'1px solid rgba(255,255,255,0.06)':'none',position:'relative'}}>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>{s.l}</span>
                <span style={{fontSize:11,fontWeight:800,color:s.c,fontFamily:'monospace'}}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN AREA ── */}
        <div style={{flex:1,minWidth:0,order:2,display:'flex',flexDirection:'column',gap:14}}>

          {/* Revenue Chart */}
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'18px 20px',animation:'bF 0.4s ease'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#1e293b',letterSpacing:-0.3}}>Revenue Trend</div>
                <div style={{fontSize:11,color:'#64748b',marginTop:3}}>Monthly recurring revenue · {period}</div>
              </div>
              <div style={{display:'flex',gap:3,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,padding:3}}>
                {['1M','3M','6M','1Y'].map(p=>(
                  <button key={p} className="bPBtn" onClick={()=>setPeriod(p)}
                    style={{background:period===p?'rgba(16,185,129,0.15)':'none',color:period===p?'#10b981':'#64748b',border:period===p?'1px solid rgba(16,185,129,0.3)':'1px solid transparent'}}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <AreaChart pts={chartPts} months={chartMonths} color="#10b981" h={150}/>
          </div>

          {/* Subscription Table */}
          {/* toolbar */}
          <div style={{background:'#fff',borderRadius:'8px 8px 0 0',border:'1px solid #d1d5db',borderBottom:'none',padding:'8px 12px',display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search organization, ID..."
              style={{flex:1,minWidth:140,padding:'5px 10px',border:'1px solid #d1d5db',borderRadius:5,fontSize:12,outline:'none',background:'#f9fafb'}}/>
            <div style={{display:'flex',gap:2,background:'#f8fafc',border:'1px solid #d1d5db',borderRadius:6,padding:3}}>
              {[['amount','₹ High'],['name','A–Z'],['date','Expiry']].map(([v,l])=>(
                <button key={v} className={`bSortBtn${sort===v?' on':''}`} onClick={()=>setSort(v)}>{l}</button>
              ))}
            </div>
            {statusFilter!=='all'&&<button onClick={()=>setStatusFilter('all')} style={{background:'#fee2e2',color:'#dc2626',border:'1px solid #fecaca',padding:'5px 9px',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer'}}>✕ Clear</button>}
            <span style={{marginLeft:'auto',fontSize:10,color:'#94a3b8',fontWeight:600,whiteSpace:'nowrap'}}>{rows.length} records</span>
          </div>
          {/* table */}
          <div style={{overflowX:'auto',borderRadius:'0 0 8px 8px',border:'1px solid #d1d5db',background:'#fff',marginBottom:0}}>
            {loading?(
              <div style={{padding:40,textAlign:'center',color:'#94a3b8',fontSize:13}}>Loading billing data...</div>
            ):(
              <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed',minWidth:600}}>
                <colgroup>
                  <col style={{width:36}}/>
                  <col style={{width:'30%'}}/>
                  <col style={{width:'13%'}}/>
                  <col style={{width:'14%'}}/>
                  <col style={{width:'11%'}}/>
                  <col style={{width:'18%'}}/>
                </colgroup>
                <thead>
                  <tr>
                    <th className="bTh bNum">#</th>
                    <th className="bTh">Organization</th>
                    <th className="bTh">Plan</th>
                    <th className="bTh" style={{textAlign:'right'}}>Amount</th>
                    <th className="bTh" style={{textAlign:'center'}}>Status</th>
                    <th className="bTh" style={{textAlign:'right'}}>Renews / Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length===0?(
                    <tr><td colSpan={6} style={{padding:'28px',textAlign:'center',color:'#94a3b8',fontSize:13,border:'1px solid #e2e6eb'}}>No records found</td></tr>
                  ):rows.map((row,ri)=>{
                    const st=ST[row.subscription?.status]||ST.expired;
                    const dl=dLeft(row.subscription?.endDate);
                    const isSel=selected?._id===row._id;
                    const rowBg=isSel?null:ri%2===0?'#fff':'#f9fafb';
                    const statusStyle={
                      active:   {bg:'#16a34a',color:'#fff'},
                      trial:    {bg:'#0ea5e9',color:'#fff'},
                      expired:  {bg:'#64748b',color:'#fff'},
                      suspended:{bg:'#dc2626',color:'#fff'},
                      cancelled:{bg:'#475569',color:'#fff'},
                    }[row.subscription?.status]||{bg:'#64748b',color:'#fff'};
                    return(
                      <tr key={ri} className={`bTr${isSel?' bSel':''}`} onClick={()=>setSelected(isSel?null:row)}>
                        <td className="bTd bNum" style={{background:rowBg||undefined}}>{ri+1}</td>
                        {/* org */}
                        <td className="bTd" style={{background:rowBg||undefined}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{width:28,height:28,borderRadius:7,background:avG(row.organizationName),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,color:'#fff',flexShrink:0}}>
                              {(row.organizationName||'?').charAt(0).toUpperCase()}
                            </div>
                            <div style={{minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis'}}>{row.organizationName||'—'}</div>
                              <div style={{fontSize:10,color:'#9ca3af',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis'}}>{row.organizationId||'—'}</div>
                            </div>
                          </div>
                        </td>
                        {/* plan */}
                        <td className="bTd" style={{background:isSel?null:planC(row.subscription?.planName),color:'#fff',fontWeight:700,fontSize:11,textAlign:'center'}}>
                          {row.subscription?.planName||'Free'}
                          <div style={{fontSize:9,color:'rgba(255,255,255,0.75)',fontWeight:500,marginTop:1}}>/{row.subscription?.billingCycle||'mo'}</div>
                        </td>
                        {/* amount */}
                        <td className="bTd" style={{background:rowBg||undefined,textAlign:'right',fontFamily:'monospace'}}>
                          <div style={{fontSize:13,fontWeight:800,color:'#10b981'}}>{fmtF(row.subscription?.amount)}</div>
                          <div style={{fontSize:9,color:'#9ca3af'}}>{fmtM((row.subscription?.amount||0)*12)}/yr</div>
                        </td>
                        {/* status */}
                        <td className="bTd" style={{background:isSel?null:statusStyle.bg,color:statusStyle.color,fontWeight:700,fontSize:10,textAlign:'center',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                          {st.label}
                        </td>
                        {/* expiry */}
                        <td className="bTd" style={{background:rowBg||undefined,textAlign:'right',fontFamily:'monospace'}}>
                          <div style={{fontSize:11,color:'#6b7280'}}>{fmt(row.subscription?.endDate)}</div>
                          {dl!==null&&<div style={{fontSize:10,fontWeight:700,color:dl<0?'#ef4444':dl<14?'#f59e0b':'#94a3b8'}}>{dl<0?`${Math.abs(dl)}d overdue`:dl===0?'Today':`${dl}d left`}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ══ DETAIL PANEL ══ */}
        {selected&&(()=>{
          const b=selected;
          const st=ST[b.subscription?.status]||ST.expired;
          const dl=dLeft(b.subscription?.endDate);
          const usedPct=dl!==null&&dl>=0?Math.max(0,Math.min(100,100-Math.round((dl/30)*100))):dl!==null?100:50;
          return(
            <div className="bDetailPane" style={{width:300,flexShrink:0,order:1,background:'#09101f',border:'1px solid rgba(255,255,255,0.09)',borderRadius:16,overflow:'hidden',animation:'bS 0.22s ease',boxShadow:'0 20px 80px rgba(0,0,0,0.7)',alignSelf:'flex-start',position:'sticky',top:0}}>

              {/* top bar */}
              <div style={{padding:'13px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.02)'}}>
                <span style={{fontSize:10,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:1.4,fontWeight:700}}>Invoice Detail</span>
                <button onClick={()=>setSelected(null)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.09)',color:'rgba(255,255,255,0.4)',width:26,height:26,borderRadius:7,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>✕</button>
              </div>

              <div style={{overflowY:'auto',maxHeight:'calc(100vh - 280px)',padding:'16px'}}>
                {/* org hero */}
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,padding:'14px',background:'rgba(255,255,255,0.03)',borderRadius:12,border:'1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{width:46,height:46,borderRadius:12,background:avG(b.organizationName),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:20,color:'#fff',flexShrink:0,boxShadow:`0 4px 20px ${avC(b.organizationName)}44`}}>
                    {(b.organizationName||'?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,color:'#fff',fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.organizationName||'—'}</div>
                    <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',fontFamily:'monospace',marginTop:2}}>{b.organizationId}</div>
                    <div style={{marginTop:7,display:'inline-flex',alignItems:'center',gap:5,padding:'2px 9px',borderRadius:20,background:st.bg,border:`1px solid ${st.b}`}}>
                      {st.dot&&<div style={{width:4,height:4,borderRadius:'50%',background:st.c,animation:'bP 1.8s infinite'}}/>}
                      <span style={{fontSize:9,fontWeight:700,color:st.c}}>{st.label}</span>
                    </div>
                  </div>
                </div>

                {/* amount */}
                <div style={{background:'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))',border:'1px solid rgba(16,185,129,0.2)',borderRadius:12,padding:'16px',marginBottom:14,textAlign:'center'}}>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:1.5,marginBottom:8}}>Plan Value</div>
                  <div style={{fontSize:34,fontWeight:900,color:'#10b981',fontFamily:'monospace',letterSpacing:-1.5,lineHeight:1}}>{fmtF(b.subscription?.amount)}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:6}}>/{b.subscription?.billingCycle||'month'} · <span style={{color:planC(b.subscription?.planName),fontWeight:700}}>{b.subscription?.planName||'Free'}</span></div>
                  <div style={{display:'flex',justifyContent:'center',gap:18,marginTop:14,paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.07)'}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:12,fontWeight:800,color:'#fff',fontFamily:'monospace'}}>{fmtM(b.subscription?.totalPaid)}</div>
                      <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',marginTop:2,textTransform:'uppercase',letterSpacing:1}}>Paid</div>
                    </div>
                    <div style={{width:1,background:'rgba(255,255,255,0.07)'}}/>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:12,fontWeight:800,color:'#fff',fontFamily:'monospace'}}>{fmtM((b.subscription?.amount||0)*12)}</div>
                      <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',marginTop:2,textTransform:'uppercase',letterSpacing:1}}>Annual</div>
                    </div>
                  </div>
                </div>

                {/* rings */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                  {[
                    {l:'Used',v:`${usedPct}%`,pct:usedPct,c:'#6366f1'},
                    {l:'Auto-Renew',v:b.subscription?.autoRenew?'ON':'OFF',pct:b.subscription?.autoRenew?100:0,c:'#10b981'},
                    {l:'Days Left',v:dl!==null?(dl<0?`${Math.abs(dl)}OD`:dl+'d'):'—',pct:dl!==null&&dl>=0?Math.min(100,Math.round((dl/30)*100)):0,c:dl!==null&&dl<14?'#ef4444':'#f59e0b'},
                  ].map((rg,i)=>(
                    <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:11,padding:'12px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                      <Ring pct={rg.pct} size={42} thick={4.5} color={rg.c}/>
                      <div style={{fontSize:11,fontWeight:800,color:'#fff',fontFamily:'monospace'}}>{rg.v}</div>
                      <div style={{fontSize:8,color:'rgba(255,255,255,0.28)',textAlign:'center',lineHeight:1.4}}>{rg.l}</div>
                    </div>
                  ))}
                </div>

                {/* timeline */}
                <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'13px 14px',marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:1.4,marginBottom:12}}>Timeline</div>
                  {[
                    {dot:'#10b981',l:'Start',v:fmt(b.subscription?.startDate)},
                    {dot:'#6366f1',l:'Last Payment',v:fmt(b.subscription?.lastPaymentDate)},
                    {dot:'#f59e0b',l:'Renewal',v:fmt(b.subscription?.renewalDate)},
                    {dot:'#ef4444',l:'Expires',v:fmt(b.subscription?.endDate)},
                  ].map((t,i,arr)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:9,paddingBottom:i<arr.length-1?10:0,marginBottom:i<arr.length-1?10:0,borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:t.dot,flexShrink:0,boxShadow:`0 0 5px ${t.dot}`}}/>
                      <div style={{flex:1,display:'flex',justifyContent:'space-between'}}>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>{t.l}</span>
                        <span style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.7)',fontFamily:'monospace'}}>{t.v}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* payment info */}
                <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'13px 14px',marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:1.4,marginBottom:12}}>Payment</div>
                  {[
                    ['Last Amount',fmtF(b.subscription?.lastPaymentAmount)],
                    ['Total Paid', fmtF(b.subscription?.totalPaid)],
                    ['Currency',   b.subscription?.currency||'INR'],
                    ['Contact',    b.contactEmail||'—'],
                  ].map(([l,v],i,arr)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                      <span style={{fontSize:11,color:'rgba(255,255,255,0.32)'}}>{l}</span>
                      <span style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.72)',fontFamily:'monospace',maxWidth:140,textAlign:'right',overflow:'hidden',textOverflow:'ellipsis'}}>{v||'—'}</span>
                    </div>
                  ))}
                </div>

                {/* actions */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                  <button className="bActBtn" disabled={actionLoading}
                    onClick={()=>{ const end=new Date(); end.setMonth(end.getMonth()+1); handleAction({endDate:end,status:'active'}); }}
                    style={{background:'rgba(16,185,129,0.13)',border:'1px solid rgba(16,185,129,0.3)',color:'#34d399',opacity:actionLoading?0.5:1}}>↻ Renew</button>
                  <button className="bActBtn" disabled={actionLoading}
                    onClick={()=>{ const plan=window.prompt('New plan name (Basic/Professional/Enterprise):',b.subscription?.planName||''); if(plan) handleAction({planName:plan}); }}
                    style={{background:'rgba(99,102,241,0.13)',border:'1px solid rgba(99,102,241,0.3)',color:'#a78bfa',opacity:actionLoading?0.5:1}}>✎ Edit</button>
                  <button className="bActBtn" disabled={actionLoading}
                    onClick={()=>window.open(`/invoice/${b._id}`,'_blank')}
                    style={{background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',color:'#fbbf24',opacity:actionLoading?0.5:1}}>⬇ Invoice</button>
                  <button className="bActBtn" disabled={actionLoading}
                    onClick={()=>{ if(window.confirm(`${st.label==='Suspended'?'Activate':'Suspend'} ${b.organizationName}?`)) handleAction({status:st.label==='Suspended'?'active':'suspended'}); }}
                    style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#fb7185',opacity:actionLoading?0.5:1}}>{st.label==='Suspended'?'▶ Activate':'⏸ Suspend'}</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </SaasLayout>
  );
};

export default Billings;
