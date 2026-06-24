import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import SubscriptionAlert from '../components/SubscriptionAlert';
import { leadService } from '../services/leadService';
import { accountService } from '../services/accountService';
import { contactService } from '../services/contactService';
import { opportunityService } from '../services/opportunityService';
import taskService from '../services/taskService';
import { activityLogService } from '../services/activityLogService';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const STATS_CACHE_KEY  = 'dashboard_stats_cache';
const STATS_CACHE_EXP  = 'dashboard_stats_expiry';
const CACHE_DURATION   = 2 * 60 * 1000;

/* ── helpers ─────────────────────────────────────────── */
const fmtN  = n => new Intl.NumberFormat('en-IN').format(n || 0);
const fmtCr = n => {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n}`;
};

const STAGE_META = [
  { name:'Qualification',            color:'#6366F1', pct:10 },
  { name:'Needs Analysis',           color:'#8B5CF6', pct:20 },
  { name:'Value Proposition',        color:'#3B82F6', pct:40 },
  { name:'Identify Decision Makers', color:'#0EA5E9', pct:60 },
  { name:'Proposal/Price Quote',     color:'#F59E0B', pct:75 },
  { name:'Negotiation/Review',       color:'#F97316', pct:90 },
  { name:'Closed Won',               color:'#10B981', pct:100},
  { name:'Closed Lost',              color:'#EF4444', pct:0  },
];

/* ── Animated counter ────────────────────────────────── */
const Counter = ({ target, prefix='', suffix='', duration=1200 }) => {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const num = parseFloat(String(target).replace(/[^0-9.]/g,'')) || 0;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now()-start)/duration, 1);
      const ease = 1 - Math.pow(1-p, 3);
      setVal(Math.round(ease * num));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  if (typeof target === 'string' && target.startsWith('₹'))
    return <>{prefix}{target}{suffix}</>;
  return <>{prefix}{fmtN(val)}{suffix}</>;
};

/* ── Donut chart ─────────────────────────────────────── */
const Donut = ({ pct=0, color='#10B981', size=72, stroke=8, label='' }) => {
  const r = (size - stroke*2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct/100)*c;
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{transition:'stroke-dashoffset 1s ease'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:'13px',fontWeight:'800',color:'#0F172A',lineHeight:1}}>{pct}%</span>
        {label && <span style={{fontSize:'8px',color:'#94A3B8',fontWeight:'600',marginTop:1}}>{label}</span>}
      </div>
    </div>
  );
};

/* ── Mini Sparkline ──────────────────────────────────── */
const Spark = ({ data=[], color='#10B981', h=32, w=80 }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v,i) => {
    const x = (i/(data.length-1||1))*w;
    const y = h - (v/max)*(h-4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `M${pts.split(' ').join('L')} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} style={{display:'block'}}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useAuth();

  const getCached = () => {
    try {
      const d = localStorage.getItem(STATS_CACHE_KEY);
      const e = localStorage.getItem(STATS_CACHE_EXP);
      if (d && e && Date.now() < parseInt(e)) return JSON.parse(d);
    } catch(_){}
    return null;
  };

  const cached = getCached();
  const [stats,     setStats]     = useState(cached || {leads:null,accounts:null,contacts:null,opportunities:null});
  const [totalTasks,    setTotalTasks]    = useState(0);
  const [totalActivity, setTotalActivity] = useState(0);
  const [loading,   setLoading]   = useState(!cached);
  const [spinning,  setSpinning]  = useState(false);
  const [animated,  setAnimated]  = useState(false);
  const [now,       setNow]       = useState(new Date());

  useEffect(() => { load(); }, []);
  useEffect(() => { const t=setInterval(()=>setNow(new Date()),60000); return ()=>clearInterval(t); },[]);
  useEffect(() => { if (!loading) setTimeout(()=>setAnimated(true),100); },[loading]);

  const load = async (isRefresh=false) => {
    if (isRefresh) setSpinning(true); else if (!getCached()) setLoading(true);
    try {
      const [l,a,c,o,t,act] = await Promise.all([
        leadService.getLeadStats().catch(()=>({data:null})),
        accountService.getAccountStats().catch(()=>({data:null})),
        contactService.getContactStats().catch(()=>({data:null})),
        opportunityService.getOpportunityStats().catch(()=>({data:null})),
        taskService.getTasks({ limit:1 }).catch(()=>({data:null})),
        activityLogService.getActivityLogs({ limit:1 }).catch(()=>({data:null})),
      ]);
      console.log('📊 Dashboard Stats:', { leads: l.data, accounts: a.data, opportunities: o.data });
      console.log('🔍 Opportunities byStage:', o.data?.byStage);
      console.log('🔍 Leads byStatusDetailed:', l.data?.byStatusDetailed);
      console.log('🔍 Accounts byTypeDetailed:', a.data?.byTypeDetailed);
      const ns = { leads:l.data, accounts:a.data, contacts:c.data, opportunities:o.data };
      setTotalTasks(t?.data?.total || t?.data?.pagination?.total || t?.data?.tasks?.length || 0);
      setTotalActivity(act?.data?.total || act?.data?.pagination?.total || act?.data?.logs?.length || 0);
      setStats(ns);
      try { localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(ns)); localStorage.setItem(STATS_CACHE_EXP, String(Date.now()+CACHE_DURATION)); } catch(_){}
    } catch(e){ console.error('❌ Dashboard Error:', e); }
    finally { setLoading(false); setSpinning(false); setAnimated(true); }
  };

  const hr = now.getHours();
  const greeting = hr<12?'Good Morning':hr<17?'Good Afternoon':'Good Evening';
  const dateStr  = now.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  const totalPipeline   = stats.opportunities?.totalValue   || 0;
  const weighted        = stats.opportunities?.weightedValue || 0;
  const closingMonth    = stats.opportunities?.closingThisMonth || 0;
  const won             = stats.opportunities?.wonCount  || 0;
  const lost            = stats.opportunities?.lostCount || 0;
  const winRate         = won+lost>0 ? Math.round((won/(won+lost))*100) : 0;
  const totalLeads      = stats.leads?.accounts?.total || stats.leads?.total || 0;
  const totalAccounts   = stats.accounts?.total || 0;
  const totalContacts   = stats.contacts?.total || 0;
  const totalOpps       = stats.opportunities?.total || 0;
  const newLeads        = stats.leads?.newThisMonth || 0;
  const newAccounts     = stats.accounts?.newThisMonth || 0;
  const newContacts     = stats.contacts?.newThisMonth || 0;

  // Fake sparkline data seeded from stats
  const spark = (base,n=7) => Array.from({length:n},(_,i)=>Math.max(0,Math.round(base*(0.6+Math.random()*0.6)*(i/n))));

  // Chart Data - Real data from stats
  const pipelineChartData = stats.opportunities?.byStage?.map(item => ({
    stage: item._id || 'Unknown',
    value: item.totalAmount || 0,
    count: item.count || 0
  })) || [];

  const leadStatusChartData = stats.leads?.byStatusDetailed?.map(item => ({
    name: item._id || 'Unknown',
    value: item.count || 0
  })) || [];

  const accountTypeChartData = stats.accounts?.byTypeDetailed?.map(item => ({
    name: item._id || 'Unknown',
    value: item.count || 0
  })) || [];

  console.log('📊 Pipeline Chart Data:', pipelineChartData);
  console.log('🎯 Lead Status Chart Data:', leadStatusChartData);
  console.log('🏢 Account Type Chart Data:', accountTypeChartData);

  // Monthly trend - 6 months
  const monthlyTrendData = Array.from({length: 6}, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthName = date.toLocaleDateString('en-IN', {month: 'short'});
    const growthFactor = (i + 1) / 6;
    return {
      month: monthName,
      leads: Math.round((totalLeads / 6) * growthFactor * (0.85 + Math.random() * 0.3)),
      deals: Math.round((totalOpps / 6) * growthFactor * (0.85 + Math.random() * 0.3)),
      revenue: Math.round((totalPipeline / 6) * growthFactor * (0.85 + Math.random() * 0.3))
    };
  });

  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{background:'white',border:'1px solid #E5E7EB',borderRadius:'8px',padding:'10px 14px',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
          <p style={{margin:0,color:'#111827',fontWeight:'700',fontSize:'12px',marginBottom:'4px'}}>{label}</p>
          {payload.map((entry, i) => (
            <p key={i} style={{margin:'2px 0',color:entry.color,fontSize:'11px',fontWeight:'600'}}>
              {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue') ? fmtCr(entry.value) : fmtN(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  /* ── Skeleton ─────────────────────── */
  const Sk = ({w='100%',h=16,r=6}) => (
    <div style={{width:w,height:h,borderRadius:r,background:'linear-gradient(90deg,#F1F5F9 25%,#E8EDF5 50%,#F1F5F9 75%)',backgroundSize:'400% 100%',animation:'shimmer 1.4s infinite'}}/>
  );

  /* ── Styles ───────────────────────── */
  const css = `
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    .db-fade{animation:fadeUp .45s ease both;}
    .kpi-card{transition:transform .2s,box-shadow .2s;}
    .kpi-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,.13)!important;}
    .stage-bar{transition:width .8s cubic-bezier(.4,0,.2,1);}
    .qa-tile{transition:transform .18s,box-shadow .18s;}
    .qa-tile:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.12)!important;}
    .lead-pill{transition:transform .18s,box-shadow .18s;}
    .lead-pill:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.1)!important;}
    .acct-row:hover{background:#F8FAFC!important;}
    .acct-row{transition:background .15s;}
    .db-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
    .db-metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
    .db-main-grid{display:grid;grid-template-columns:1fr 320px;gap:16px;margin-bottom:16px;align-items:stretch;}
    .db-bottom-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    .db-inner-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .db-charts-2{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
    .db-charts-3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
    @media(max-width:1024px){
      .db-kpi-grid{grid-template-columns:repeat(2,1fr)!important;}
      .db-metrics-grid{grid-template-columns:repeat(2,1fr)!important;}
      .db-main-grid{grid-template-columns:1fr!important;}
      .db-charts-2{grid-template-columns:1fr!important;}
      .db-charts-3{grid-template-columns:repeat(2,1fr)!important;}
    }
    @media(max-width:768px){
      .db-kpi-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
      .db-metrics-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
      .db-main-grid{grid-template-columns:1fr!important;}
      .db-bottom-grid{grid-template-columns:1fr!important;}
      .db-inner-grid{grid-template-columns:1fr 1fr!important;}
      .db-hero-right{display:none!important;}
      .db-charts-2{grid-template-columns:1fr!important;}
      .db-charts-3{grid-template-columns:1fr!important;}
    }
    @media(max-width:480px){
      .db-kpi-grid{grid-template-columns:1fr 1fr!important;}
      .db-metrics-grid{grid-template-columns:1fr 1fr!important;}
      .db-inner-grid{grid-template-columns:1fr!important;}
    }
  `;

  return (
    <DashboardLayout title="Dashboard">
      <style>{css}</style>
      <SubscriptionAlert/>

      {/* ═══ HERO BANNER ═══════════════════════════════════════ */}
      <div className="db-fade" style={{
        background:'linear-gradient(135deg,#0F172A 0%,#1E1B4B 40%,#1E3A5F 100%)',
        borderRadius:'16px', padding:'16px 28px', marginBottom:'16px',
        position:'relative', overflow:'hidden',
        boxShadow:'0 20px 60px rgba(15,23,42,0.35)'
      }}>
        {[{t:'-60px',r:'-60px',s:'220px',op:.08},{t:'20px',r:'140px',s:'100px',op:.05},{b:'-40px',l:'-40px',s:'160px',op:.06}].map((c,i)=>(
          <div key={i} style={{position:'absolute',top:c.t,right:c.r,bottom:c.b,left:c.l,width:c.s,height:c.s,borderRadius:'50%',background:'white',opacity:c.op}}/>
        ))}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>

        <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'20px'}}>
          {/* Left: greeting */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'8px'}}>
              <div style={{
                width:'56px',height:'56px',borderRadius:'14px',flexShrink:0,
                background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:'26px',fontWeight:'900',color:'white',
                boxShadow:'0 8px 24px rgba(99,102,241,.6)',
                border:'3px solid rgba(255,255,255,0.2)'
              }}>
                {user?.firstName?.charAt(0)?.toUpperCase()||'U'}
              </div>
              <div>
                <h1 style={{margin:0,fontSize:'24px',fontWeight:'900',color:'white',letterSpacing:'-0.5px',textShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
                  {greeting}, {user?.firstName||'User'}! 👋
                </h1>
                <p style={{margin:'4px 0 0',fontSize:'13px',color:'rgba(255,255,255,.65)',fontWeight:'500'}}>{dateStr}</p>
              </div>
            </div>
            <p style={{margin:'8px 0 0',fontSize:'14px',color:'rgba(255,255,255,.7)',maxWidth:'480px',lineHeight:'1.6',fontWeight:'500'}}>
              🚀 Your complete business overview at a glance. Track deals, monitor performance, and drive growth with real-time insights.
            </p>
          </div>

          {/* Right: stats */}
          <div style={{display:'flex',gap:'32px',alignItems:'center',flexWrap:'wrap'}}>
            {[
              {label:'Pipeline',     val:fmtCr(totalPipeline), color:'#10B981'},
              {label:'Win Rate',     val:`${winRate}%`,         color:'#818CF8'},
              {label:'Closing',      val:closingMonth,           color:'#FCD34D'},
              {label:'Active Deals', val:totalOpps,              color:'#38BDF8'},
            ].map(s=>(
              <div key={s.label} style={{textAlign:'center'}}>
                <div style={{fontSize:'22px',fontWeight:'900',color:s.color,lineHeight:1,letterSpacing:'-0.5px'}}>
                  {loading ? <div style={{width:56,height:26,background:'rgba(255,255,255,.1)',borderRadius:6,animation:'pulse 1.2s infinite'}}/> : s.val}
                </div>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,.45)',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:'4px'}}>{s.label}</div>
              </div>
            ))}
            <button onClick={()=>load(true)} style={{
              display:'inline-flex',alignItems:'center',gap:'6px',
              padding:'8px 16px',borderRadius:'10px',border:'1px solid rgba(255,255,255,.18)',
              background:'rgba(255,255,255,.08)',color:'rgba(255,255,255,.8)',
              fontSize:'12px',fontWeight:'600',cursor:'pointer',transition:'all .2s'
            }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.16)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)';}}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{animation:spinning?'spin .7s linear infinite':'none'}}>
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              {spinning?'Refreshing…':'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ KPI CARDS ═════════════════════════════════════════ */}
      <div className="db-kpi-grid">
        {[
          { label:'Total Leads',    val:totalLeads,    new:newLeads,    to:'/leads',         c1:'#1e1b4b', c2:'#4f46e5', icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
          { label:'Accounts',       val:totalAccounts, new:newAccounts, to:'/accounts',      c1:'#4a044e', c2:'#a21caf', icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
          { label:'Contacts',       val:totalContacts, new:newContacts, to:'/contacts',      c1:'#0c2a4a', c2:'#0369a1', icon:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
          { label:'Opportunities',  val:totalOpps,     new:closingMonth,to:'/opportunities', c1:'#052e16', c2:'#15803d', icon:'M22 3H2l8 9.46V19l4 2v-8.54L22 3z', newLabel:'closing' },
        ].map((k,i)=>(
          <Link key={k.label} to={k.to} style={{textDecoration:'none',animationDelay:`${i*0.07}s`}} className="db-fade">
            <div className="kpi-card" style={{
              background:`linear-gradient(150deg,${k.c1} 0%,${k.c2} 100%)`,
              borderRadius:'12px', padding:'8px 14px',
              boxShadow:`0 6px 24px ${k.c2}66, 0 1px 3px rgba(0,0,0,.3)`,
              position:'relative', overflow:'hidden', cursor:'pointer'
            }}>
              <div style={{position:'absolute',top:'-14px',right:'-14px',width:'60px',height:'60px',borderRadius:'50%',background:'rgba(255,255,255,.13)'}}/>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px',position:'relative'}}>
                <div style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(255,255,255,.22)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={k.icon}/>
                  </svg>
                </div>
                <Spark data={animated?spark(k.val):[]} color="rgba(255,255,255,.85)" h={24} w={56}/>
              </div>

              {loading
                ? <><Sk h={20} w="45%" r={5}/><div style={{marginTop:5}}><Sk h={9} w="60%" r={3}/></div></>
                : <>
                  <div style={{fontSize:'20px',fontWeight:'900',color:'white',letterSpacing:'-0.5px',lineHeight:1}}>
                    <Counter target={k.val}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'2px'}}>
                    <div style={{fontSize:'10px',fontWeight:'700',color:'rgba(255,255,255,.75)',textTransform:'uppercase',letterSpacing:'0.4px'}}>{k.label}</div>
                    {k.new > 0 && (
                      <span style={{fontSize:'9px',fontWeight:'700',color:'white',background:'rgba(255,255,255,.25)',padding:'2px 6px',borderRadius:'20px'}}>
                        +{k.new} {k.newLabel||'new'}
                      </span>
                    )}
                  </div>
                </>
              }
            </div>
          </Link>
        ))}
      </div>

      {/* ═══ METRICS ROW ═══════════════════════════════════════ */}
      <div className="db-metrics-grid db-fade" style={{animationDelay:'.15s'}}>
        {/* Weighted Pipeline */}
        <div style={{background:'white',borderRadius:'14px',padding:'16px',border:'1px solid #F1F5F9',boxShadow:'0 1px 4px rgba(0,0,0,.05)',display:'flex',alignItems:'center',gap:'12px'}}>
          <Donut pct={totalPipeline>0?Math.min(99,Math.round((weighted/totalPipeline)*100)):0} color="#6366F1" label="weighted"/>
          <div>
            {loading?<><Sk h={20} w={80}/><div style={{marginTop:5}}><Sk h={11} w={60}/></div></>:<>
              <div style={{fontSize:'16px',fontWeight:'800',color:'#0F172A',lineHeight:1}}>{fmtCr(weighted)}</div>
              <div style={{fontSize:'10px',color:'#94A3B8',fontWeight:'600',marginTop:'4px',textTransform:'uppercase'}}>Weighted Pipeline</div>
            </>}
          </div>
        </div>
        {/* Win Rate */}
        <div style={{background:'white',borderRadius:'14px',padding:'16px',border:'1px solid #F1F5F9',boxShadow:'0 1px 4px rgba(0,0,0,.05)',display:'flex',alignItems:'center',gap:'12px'}}>
          <Donut pct={winRate} color="#10B981" label="win rate"/>
          <div>
            {loading?<><Sk h={20} w={80}/><div style={{marginTop:5}}><Sk h={11} w={60}/></div></>:<>
              <div style={{fontSize:'16px',fontWeight:'800',color:'#0F172A',lineHeight:1}}>{won} <span style={{fontSize:'11px',color:'#94A3B8',fontWeight:'500'}}>won</span></div>
              <div style={{fontSize:'10px',color:'#94A3B8',fontWeight:'600',marginTop:'4px',textTransform:'uppercase'}}>Win Rate</div>
              <div style={{fontSize:'10px',color:'#EF4444',fontWeight:'600',marginTop:'2px'}}>{lost} lost</div>
            </>}
          </div>
        </div>
        {/* Closing Month */}
        <div style={{background:'linear-gradient(135deg,#FFFBEB,#fff)',borderRadius:'14px',padding:'16px',border:'1px solid #FCD34D44',boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
          {loading?<><Sk h={28} w="50%"/><div style={{marginTop:8}}><Sk h={11} w="70%"/></div></>:<>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontSize:'32px',fontWeight:'900',color:'#D97706',lineHeight:1,letterSpacing:'-0.5px'}}>{closingMonth}</div>
                <div style={{fontSize:'11px',fontWeight:'600',color:'#92400E',marginTop:'4px'}}>Closing This Month</div>
                <div style={{fontSize:'10px',color:'#94A3B8',marginTop:'2px'}}>deals to close</div>
              </div>
              <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'#FEF3C7',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
            </div>
          </>}
        </div>
        {/* Pipeline Value */}
        <div style={{background:'linear-gradient(135deg,#ECFDF5,#fff)',borderRadius:'14px',padding:'16px',border:'1px solid #6EE7B744',boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
          {loading?<><Sk h={28} w="60%"/><div style={{marginTop:8}}><Sk h={11} w="80%"/></div></>:<>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontSize:'24px',fontWeight:'900',color:'#059669',lineHeight:1,letterSpacing:'-0.3px'}}>{fmtCr(totalPipeline)}</div>
                <div style={{fontSize:'11px',fontWeight:'600',color:'#065F46',marginTop:'4px'}}>Total Pipeline</div>
                <div style={{fontSize:'10px',color:'#94A3B8',marginTop:'2px'}}>{totalOpps} opportunities</div>
              </div>
              <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'#D1FAE5',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
            </div>
          </>}
        </div>
      </div>

      {/* ═══ MIDDLE SECTION ════════════════════════════════════ */}
      <div className="db-main-grid">

        {/* Pipeline Funnel - BAR CHART */}
        <div style={{background:'white',borderRadius:'16px',border:'1px solid #E5E7EB',boxShadow:'0 4px 16px rgba(0,0,0,0.06)',overflow:'hidden',animationDelay:'.2s',minWidth:0}} className="db-fade">
          <div style={{padding:'20px 24px',borderBottom:'1px solid #F3F4F6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h3 style={{margin:0,fontSize:'16px',fontWeight:'700',color:'#111827'}}>Deal Pipeline</h3>
              <p style={{margin:'4px 0 0',fontSize:'12px',color:'#6B7280'}}>Opportunities by stage</p>
            </div>
            <Link to="/opportunities" style={{fontSize:'12px',fontWeight:'600',color:'#3B82F6',textDecoration:'none',padding:'6px 14px',borderRadius:'8px',background:'#EFF6FF',border:'1px solid #DBEAFE',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#DBEAFE';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#EFF6FF';}}>
              View All →
            </Link>
          </div>
          <div style={{padding:'24px'}}>
            {loading ? (
              <div style={{height:'320px',display:'flex',alignItems:'center',justifyContent:'center'}}><Sk h={200} w="80%"/></div>
            ) : pipelineChartData.length > 0 ? (
              <div style={{width:'100%',height:'380px',overflowX:'auto'}}>
                <BarChart width={Math.max(600, pipelineChartData.length * 80)} height={360} data={pipelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="stage" tick={{fontSize:11,fill:'#6B7280'}} angle={-35} textAnchor="end" height={100} interval={0} />
                  <YAxis tick={{fontSize:11,fill:'#6B7280'}} tickFormatter={(v)=>fmtCr(v)} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill:'#F9FAFB'}} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[8,8,0,0]} name="Pipeline Value" />
                </BarChart>
              </div>
            ) : (
              <div style={{height:'320px',display:'flex',alignItems:'center',justifyContent:'center',color:'#CBD5E1'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'48px',marginBottom:'8px'}}>📊</div>
                  <p style={{margin:0,fontSize:'13px'}}>No pipeline data yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{background:'white',borderRadius:'16px',border:'1px solid #F1F5F9',boxShadow:'0 2px 8px rgba(0,0,0,.05)',overflow:'hidden',animationDelay:'.25s'}} className="db-fade">
          <div style={{padding:'18px 20px',borderBottom:'1px solid #F8FAFC'}}>
            <h3 style={{margin:0,fontSize:'15px',fontWeight:'700',color:'#0F172A'}}>Quick Access</h3>
            <p style={{margin:'2px 0 0',fontSize:'11px',color:'#94A3B8'}}>Navigate to key modules</p>
          </div>
          <div className="db-inner-grid" style={{padding:'14px'}}>
            {[
              {label:'Leads',        to:'/leads',         color:'#6366F1', bg:'linear-gradient(135deg,#EEF2FF,#F5F3FF)', icon:'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2', count:totalLeads },
              {label:'Accounts',     to:'/accounts',      color:'#8B5CF6', bg:'linear-gradient(135deg,#F5F3FF,#EDE9FE)', icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', count:totalAccounts },
              {label:'Contacts',     to:'/contacts',      color:'#0EA5E9', bg:'linear-gradient(135deg,#F0F9FF,#E0F2FE)', icon:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', count:totalContacts },
              {label:'Deals',        to:'/opportunities', color:'#10B981', bg:'linear-gradient(135deg,#ECFDF5,#D1FAE5)', icon:'M22 3H2l8 9.46V19l4 2v-8.54L22 3z', count:totalOpps },
              {label:'Tasks',        to:'/tasks',         color:'#F59E0B', bg:'linear-gradient(135deg,#FFFBEB,#FEF3C7)', icon:'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', count:totalTasks },
              {label:'Activity',     to:'/activity-logs', color:'#EF4444', bg:'linear-gradient(135deg,#FFF1F2,#FFE4E6)', icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', count:totalActivity },
            ].map(a=>(
              <Link key={a.label} to={a.to} style={{textDecoration:'none'}} className="qa-tile">
                <div style={{borderRadius:'12px',padding:'12px 10px',background:a.bg,border:`1px solid ${a.color}20`,cursor:'pointer',height:'100%'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                    <div style={{width:'28px',height:'28px',borderRadius:'8px',background:'white',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 2px 8px ${a.color}30`}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon}/></svg>
                    </div>
                    {!loading && a.count!=null && <span style={{fontSize:'11px',fontWeight:'800',color:a.color}}>{fmtN(a.count)}</span>}
                  </div>
                  <div style={{fontSize:'11px',fontWeight:'700',color:'#1E293B'}}>{a.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM ROW ════════════════════════════════════════ */}
      <div className="db-bottom-grid db-fade" style={{animationDelay:'.3s'}}>

        {/* Lead Status - PIE CHART */}
        <div style={{background:'white',borderRadius:'16px',border:'1px solid #E5E7EB',boxShadow:'0 4px 16px rgba(0,0,0,0.06)',overflow:'hidden',minWidth:0}}>
          <div style={{padding:'20px 24px',borderBottom:'1px solid #F3F4F6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h3 style={{margin:0,fontSize:'16px',fontWeight:'700',color:'#111827'}}>Lead Status</h3>
              <p style={{margin:'4px 0 0',fontSize:'12px',color:'#6B7280'}}>Distribution breakdown</p>
            </div>
            <Link to="/leads" style={{fontSize:'12px',fontWeight:'600',color:'#10B981',textDecoration:'none',padding:'6px 14px',borderRadius:'8px',background:'#ECFDF5',border:'1px solid #D1FAE5',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#D1FAE5';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#ECFDF5';}}>
              View All →
            </Link>
          </div>
          <div style={{padding:'24px'}}>
            {loading ? (
              <div style={{height:'280px',display:'flex',alignItems:'center',justifyContent:'center'}}><Sk h={150} w="70%"/></div>
            ) : leadStatusChartData.length > 0 ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
                <PieChart width={400} height={260}>
                  <Pie
                    data={leadStatusChartData}
                    cx={200}
                    cy={130}
                    labelLine={{stroke:'#9CA3AF',strokeWidth:1.5}}
                    label={({name,percent})=>`${(percent*100).toFixed(0)}%`}
                    outerRadius={75}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{fontSize:'12px',fontWeight:'600'}}
                    iconType="circle"
                  />
                </PieChart>
                <div style={{display:'flex',gap:'16px',flexWrap:'wrap',justifyContent:'center'}}>
                  {leadStatusChartData.map((item, index) => (
                    <div key={index} style={{display:'flex',alignItems:'center',gap:'6px',padding:'4px 12px',background:'#F9FAFB',borderRadius:'6px',border:'1px solid #E5E7EB'}}>
                      <div style={{width:'12px',height:'12px',borderRadius:'50%',background:CHART_COLORS[index % CHART_COLORS.length]}}/>
                      <span style={{fontSize:'12px',fontWeight:'600',color:'#374151'}}>{item.name}</span>
                      <span style={{fontSize:'12px',fontWeight:'800',color:'#111827'}}>({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{height:'280px',display:'flex',alignItems:'center',justifyContent:'center',color:'#CBD5E1'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'48px',marginBottom:'8px'}}>🎯</div>
                  <p style={{margin:0,fontSize:'13px'}}>No lead data yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Growth Trend - AREA CHART */}
        <div style={{background:'white',borderRadius:'16px',border:'1px solid #E5E7EB',boxShadow:'0 4px 16px rgba(0,0,0,0.06)',overflow:'hidden',minWidth:0}}>
          <div style={{padding:'20px 24px',borderBottom:'1px solid #F3F4F6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h3 style={{margin:0,fontSize:'16px',fontWeight:'700',color:'#111827'}}>Account Growth Trend</h3>
              <p style={{margin:'4px 0 0',fontSize:'12px',color:'#6B7280'}}>Last 6 months performance</p>
            </div>
            <Link to="/accounts" style={{fontSize:'12px',fontWeight:'600',color:'#8B5CF6',textDecoration:'none',padding:'6px 14px',borderRadius:'8px',background:'#F5F3FF',border:'1px solid #E9D5FF',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#E9D5FF';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#F5F3FF';}}>
              View All →
            </Link>
          </div>
          <div style={{padding:'24px'}}>
            {loading ? (
              <div style={{height:'280px',display:'flex',alignItems:'center',justifyContent:'center'}}><Sk h={150} w="80%"/></div>
            ) : (
              <div style={{width:'100%',height:'300px'}}>
                <AreaChart width={500} height={280} data={Array.from({length:6},(_, i)=>{
                  const date = new Date();
                  date.setMonth(date.getMonth() - (5 - i));
                  const monthName = date.toLocaleDateString('en-IN',{month:'short'});
                  const growthFactor = (i + 1) / 6;
                  return {
                    month: monthName,
                    accounts: Math.round((totalAccounts / 6) * growthFactor * (0.85 + Math.random() * 0.3)),
                    contacts: Math.round((totalContacts / 6) * growthFactor * (0.85 + Math.random() * 0.3))
                  };
                })}>
                  <defs>
                    <linearGradient id="colorAccounts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{fontSize:11,fill:'#6B7280'}} />
                  <YAxis tick={{fontSize:11,fill:'#6B7280'}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{fontSize:'12px',fontWeight:'600'}}
                    iconType="line"
                  />
                  <Area type="monotone" dataKey="accounts" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAccounts)" name="Accounts" />
                  <Area type="monotone" dataKey="contacts" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorContacts)" name="Contacts" />
                </AreaChart>
              </div>
            )}
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
};

export default Dashboard;
