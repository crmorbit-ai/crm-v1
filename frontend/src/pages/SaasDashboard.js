import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from '../context/AuthContext';
import SaasLayout, { useWindowSize } from '../components/layout/SaasLayout';

/* ── formatters ── */
const fmtF = v => `₹${Number(v||0).toLocaleString('en-IN')}`;
const fmtM = v => { const n=Number(v||0); return n>=1e5?`₹${(n/1e5).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}k`:`₹${n}`; };
const dLeft = d => d ? Math.ceil((new Date(d)-Date.now())/864e5) : null;

/* ── Avatar gradient ── */
const AV=[['#6366f1','#8b5cf6'],['#10b981','#059669'],['#f59e0b','#f97316'],['#0ea5e9','#6366f1'],['#ec4899','#8b5cf6'],['#14b8a6','#0ea5e9']];
const avG = n => `linear-gradient(135deg,${AV[(n?.charCodeAt(0)||0)%AV.length][0]},${AV[(n?.charCodeAt(0)||0)%AV.length][1]})`;

/* ══ SVG Area Chart ══ */
const AreaChart = ({ pts=[], months=[], color='#10b981', h=130 }) => {
  if(pts.length<2) return <div style={{height:h,display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:12}}>No data yet</div>;
  const VW=700,VH=h,pad={t:8,r:8,b:22,l:48};
  const iW=VW-pad.l-pad.r, iH=VH-pad.t-pad.b;
  const mx=Math.max(...pts,1), mn=0, rng=mx-mn||1;
  const P=pts.map((v,i)=>({x:pad.l+(i/(pts.length-1))*iW, y:pad.t+iH-((v-mn)/rng)*iH}));
  let line=`M${P[0].x},${P[0].y}`;
  for(let i=1;i<P.length;i++){const cx=(P[i-1].x+P[i].x)/2;line+=` C${cx},${P[i-1].y} ${cx},${P[i].y} ${P[i].x},${P[i].y}`;}
  const area=line+` L${P[P.length-1].x},${pad.t+iH} L${P[0].x},${pad.t+iH}Z`;
  const uid=color.replace(/\W/g,'');
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{width:'100%',height:VH,display:'block'}}>
      <defs>
        <linearGradient id={`dg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="90%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {[0,50,100].map(p=>{
        const y=pad.t+((100-p)/100)*iH;
        return <line key={p} x1={pad.l} y1={y} x2={pad.l+iW} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray="4 6"/>;
      })}
      {[0,50,100].map(p=>{
        const y=pad.t+((100-p)/100)*iH, v=(p/100)*mx;
        return <text key={p} x={pad.l-5} y={y+4} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">{fmtM(v)}</text>;
      })}
      <path d={area} fill={`url(#dg${uid})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{filter:`drop-shadow(0 0 5px ${color}66)`}}/>
      {P.map((p,i)=>(
        <circle key={i} cx={p.x} cy={p.y} r={i===P.length-1?4:2.5}
          fill={i===P.length-1?color:'#e2e8f0'} stroke="#fff" strokeWidth="1.5"
          style={{filter:i===P.length-1?`drop-shadow(0 0 5px ${color})`:'none'}}/>
      ))}
      {months.map((m,i)=>(
        <text key={i} x={P[i]?.x} y={VH-2} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">{m}</text>
      ))}
    </svg>
  );
};

/* ══ Ring gauge ══ */
const Ring = ({pct=0,size=80,thick=8,color='#10b981',label='',val=''}) => {
  const r=(size-thick*2)/2, circ=2*Math.PI*r, dash=circ*(Math.min(pct,100)/100);
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      <div style={{position:'relative',width:size,height:size}}>
        <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={thick}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thick}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{transition:'stroke-dasharray 0.8s ease',filter:`drop-shadow(0 0 4px ${color}88)`}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontSize:15,fontWeight:900,color:'#fff',lineHeight:1}}>{val}</div>
        </div>
      </div>
      <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:0.8}}>{label}</div>
    </div>
  );
};

/* ══ MAIN COMPONENT ══ */
const SaasDashboard = () => {
  const [tenantStats, setTenantStats] = useState(null);
  const [billings, setBillings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [now]                         = useState(new Date());
  const [myTenants, setMyTenants]     = useState([]);
  const navigate                      = useNavigate();
  const { isMobile, isTablet }        = useWindowSize();
  const { user }                      = useAuth();

  const isManager = user?.saasRole === 'Manager';

  useEffect(()=>{ load(); },[]);

  const load = async () => {
    try {
      setLoading(true);
      if (isManager) {
        // Manager: load only their assigned tenants
        const data = await tenantService.getTenants({ assignedManager: 'me', limit: 1000 });
        setMyTenants(data.tenants || data || []);
      } else {
        const [tStats, bRes] = await Promise.all([
          tenantService.getTenantStats(),
          subscriptionService.getAllSubscriptions({})
        ]);
        setTenantStats(tStats);
        if(bRes.success) setBillings(bRes.data.subscriptions||[]);
      }
    } catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  /* ── derived metrics ── */
  const mrr = useMemo(()=>billings.reduce((s,b)=>s+(b.subscription?.amount||0),0),[billings]);
  const arr  = mrr*12;

  const calcMRR = (offset) => {
    const mS=new Date(now.getFullYear(),now.getMonth()-offset,1);
    const mE=new Date(now.getFullYear(),now.getMonth()-offset+1,0,23,59,59);
    return billings.reduce((s,b)=>{
      const st=b.subscription?.startDate?new Date(b.subscription.startDate):null;
      const en=b.subscription?.endDate  ?new Date(b.subscription.endDate)  :null;
      const am=b.subscription?.amount||0;
      if(!st||!am) return s;
      return (st<=mE&&(!en||en>=mS))?s+am:s;
    },0);
  };

  const mrrGrowth = useMemo(()=>{
    const cur=calcMRR(0), prv=calcMRR(1);
    if(!prv) return cur>0?{pct:100,up:true,str:'+100%'}:{pct:0,up:null,str:'—'};
    const p=((cur-prv)/prv)*100;
    return {pct:Math.abs(p).toFixed(1),up:p>=0,str:(p>=0?'+':'')+p.toFixed(1)+'%'};
  },[billings]);

  /* chart pts — 6 months */
  const {chartPts,chartMonths} = useMemo(()=>{
    const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const n=6;
    const pts=Array.from({length:n},(_,i)=>calcMRR(n-1-i));
    const mths=Array.from({length:n},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-(n-1)+i,1);
      return MONTHS[d.getMonth()];
    });
    return{chartPts:pts,chartMonths:mths};
  },[billings]);

  const total      = tenantStats?.totalTenants||0;
  const active     = tenantStats?.activeTenants||0;
  const trial      = tenantStats?.trialTenants||0;
  const suspended  = tenantStats?.suspendedTenants||0;
  const recent     = tenantStats?.recentTenants||0;
  const byPlan     = tenantStats?.tenantsByPlan||{};

  const churnRisk  = billings.filter(b=>{ const d=dLeft(b.subscription?.endDate); return d!==null&&d>=0&&d<14; });
  const overdue    = billings.filter(b=>{ const d=dLeft(b.subscription?.endDate); return d!==null&&d<0; });
  const activeRate = total?Math.round((active/total)*100):0;

  const PLAN_DATA=[
    {l:'Enterprise',v:byPlan.enterprise||0, g:'linear-gradient(135deg,#f59e0b,#f97316)', rev:billings.filter(b=>b.subscription?.planName==='Enterprise').reduce((s,b)=>s+(b.subscription?.amount||0),0)},
    {l:'Professional',v:byPlan.professional||0,g:'linear-gradient(135deg,#8b5cf6,#6366f1)',rev:billings.filter(b=>b.subscription?.planName==='Professional').reduce((s,b)=>s+(b.subscription?.amount||0),0)},
    {l:'Basic',v:byPlan.basic||0,  g:'linear-gradient(135deg,#3b82f6,#0ea5e9)',rev:billings.filter(b=>b.subscription?.planName==='Basic').reduce((s,b)=>s+(b.subscription?.amount||0),0)},
    {l:'Free',v:byPlan.free||0,    g:'linear-gradient(135deg,#64748b,#475569)',rev:0},
  ];
  const maxPlanRev = Math.max(...PLAN_DATA.map(p=>p.rev),1);

  const NAV=[
    {l:'Tenants',     ico:'🏢', g:'linear-gradient(135deg,#6366f1,#8b5cf6)', to:'/saas/tenants',       sub:`${total} organizations`},
    {l:'Subscriptions',ico:'📋',g:'linear-gradient(135deg,#10b981,#059669)', to:'/saas/subscriptions', sub:`${active} active`},
    {l:'Billing',     ico:'💳', g:'linear-gradient(135deg,#f59e0b,#f97316)', to:'/saas/billings',      sub:fmtM(mrr)+'/mo'},
    {l:'Resellers',   ico:'🤝', g:'linear-gradient(135deg,#0ea5e9,#6366f1)', to:'/saas/resellers',     sub:'Partner network'},
    {l:'Support',     ico:'🎧', g:'linear-gradient(135deg,#ec4899,#8b5cf6)', to:'/saas/support',       sub:'Tickets & issues'},
    {l:'Admins',      ico:'🛡', g:'linear-gradient(135deg,#14b8a6,#0ea5e9)', to:'/saas/admins',        sub:'Access control'},
  ];

  if(loading) return (
    <SaasLayout title="Dashboard">
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,flexDirection:'column',gap:14}}>
        <div style={{width:44,height:44,borderRadius:'50%',border:'3px solid #e2e8f0',borderTopColor:'#6366f1',animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{fontSize:13,color:'#94a3b8',fontWeight:500}}>Loading dashboard…</div>
      </div>
    </SaasLayout>
  );

  /* ══ MANAGER DASHBOARD ══ */
  if(isManager) {
    const mActive   = myTenants.filter(t=>t.subscription?.status==='active').length;
    const mTrial    = myTenants.filter(t=>t.subscription?.status==='trial').length;
    const mSuspended= myTenants.filter(t=>t.isSuspended).length;
    const statusColor = {active:'#16a34a',trial:'#0ea5e9',suspended:'#dc2626',expired:'#dc2626'};
    const planColor   = {Enterprise:'#f59e0b',Professional:'#8b5cf6',Basic:'#3b82f6',Free:'#64748b'};
    return (
      <SaasLayout title="Dashboard">
        <style>{`@keyframes mF{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {/* Manager Header */}
        <div style={{background:'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 50%,#312e81 100%)',borderRadius:14,padding:'18px 22px',marginBottom:16,display:'flex',alignItems:'center',gap:14,border:'1px solid rgba(255,255,255,0.08)',animation:'mF 0.4s ease'}}>
          <div style={{width:46,height:46,borderRadius:12,background:'linear-gradient(135deg,#f59e0b,#f97316)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,color:'#fff',flexShrink:0}}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <div style={{fontSize:16,fontWeight:800,color:'#fff'}}>{user?.firstName} {user?.lastName}</div>
              <span style={{background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:20,letterSpacing:1}}>MANAGER</span>
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:3}}>You are managing {myTenants.length} assigned organization{myTenants.length!==1?'s':''}</div>
          </div>
          <button onClick={load} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:7,color:'rgba(255,255,255,0.55)',fontSize:11,padding:'7px 13px',cursor:'pointer',fontWeight:600}}>↺ Sync</button>
        </div>

        {/* Manager KPI Cards */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':isTablet?'repeat(3,1fr)':'repeat(4,1fr)',gap:10,marginBottom:16}}>
          {[
            {l:'Assigned',v:myTenants.length,c:'#a5b4fc',c2:'#67e8f9',g:'linear-gradient(135deg,#0f0c29,#1a1060)'},
            {l:'Active',   v:mActive,         c:'#6ee7b7',c2:'#34d399',g:'linear-gradient(135deg,#0a2a1a,#0f3d25)'},
            {l:'Trial',    v:mTrial,          c:'#fde68a',c2:'#fbbf24',g:'linear-gradient(135deg,#1a130a,#2e200f)'},
            {l:'Suspended',v:mSuspended,      c:'#fbcfe8',c2:'#f472b6',g:'linear-gradient(135deg,#1a0a10,#2e0f1a)'},
          ].map((s,i)=>(
            <div key={i} style={{position:'relative',borderRadius:14,padding:'16px 14px',overflow:'hidden',cursor:'default',border:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{position:'absolute',inset:0,background:s.g,zIndex:0}}/>
              <div style={{position:'absolute',top:-40,left:'20%',width:120,height:120,borderRadius:'50%',background:`radial-gradient(circle,${s.c}33,transparent 65%)`,zIndex:0,pointerEvents:'none'}}/>
              <div style={{position:'absolute',top:0,left:'15%',right:'15%',height:1,background:`linear-gradient(90deg,transparent,${s.c},transparent)`,zIndex:1}}/>
              <div style={{position:'relative',zIndex:1}}>
                <div style={{fontSize:28,fontWeight:900,color:'#fff',lineHeight:1,fontFamily:'monospace'}}>{s.v}</div>
                <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1,marginTop:8}}>{s.l}</div>
              </div>
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.c}00,${s.c},${s.c2},${s.c2}00)`,borderRadius:'0 0 14px 14px'}}/>
            </div>
          ))}
        </div>

        {/* Assigned Tenants List */}
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,overflow:'hidden',borderTop:'3px solid #8b5cf6',animation:'mF 0.5s ease'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:'#1e293b'}}>My Assigned Organizations</div>
              <div style={{fontSize:11,color:'#64748b',marginTop:1}}>{myTenants.length} organization{myTenants.length!==1?'s':''} under your management</div>
            </div>
            <button onClick={()=>navigate('/saas/tenants')} style={{background:'linear-gradient(135deg,#8b5cf6,#6366f1)',color:'#fff',border:'none',borderRadius:7,padding:'7px 14px',fontSize:11,fontWeight:700,cursor:'pointer'}}>View All →</button>
          </div>
          {myTenants.length===0?(
            <div style={{padding:'40px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No tenants assigned yet. Ask the primary owner to assign tenants to you.</div>
          ):(
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#f8fafc'}}>
                    <th style={{padding:'8px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5,borderBottom:'1px solid #e2e8f0'}}>#</th>
                    <th style={{padding:'8px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5,borderBottom:'1px solid #e2e8f0'}}>Organization</th>
                    <th style={{padding:'8px 14px',textAlign:'center',fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5,borderBottom:'1px solid #e2e8f0'}}>Status</th>
                    <th style={{padding:'8px 14px',textAlign:'center',fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5,borderBottom:'1px solid #e2e8f0'}}>Plan</th>
                    <th style={{padding:'8px 14px',textAlign:'center',fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5,borderBottom:'1px solid #e2e8f0'}}>Users</th>
                    <th style={{padding:'8px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5,borderBottom:'1px solid #e2e8f0'}}>Assigned On</th>
                    <th style={{padding:'8px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:0.5,borderBottom:'1px solid #e2e8f0'}}>Assigned By</th>
                  </tr>
                </thead>
                <tbody>
                  {myTenants.map((t,i)=>{
                    const st=t.subscription?.status||(t.isSuspended?'suspended':'active');
                    const sc=statusColor[st]||'#475569';
                    const pc=planColor[t.subscription?.planName]||'#64748b';
                    const grad=avG(t.organizationName);
                    return (
                      <tr key={t._id} style={{borderBottom:'1px solid #f1f5f9',cursor:'pointer',transition:'background 0.1s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                        onClick={()=>navigate('/saas/tenants')}
                      >
                        <td style={{padding:'10px 14px',fontSize:12,color:'#94a3b8',fontWeight:600}}>{i+1}</td>
                        <td style={{padding:'10px 14px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:9}}>
                            <div style={{width:30,height:30,borderRadius:8,background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>
                              {t.organizationName?.charAt(0)?.toUpperCase()||'?'}
                            </div>
                            <div>
                              <div style={{fontSize:12,fontWeight:700,color:'#111827'}}>{t.organizationName}</div>
                              <div style={{fontSize:10,color:'#9ca3af'}}>{t.organizationId||t.contactEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{padding:'10px 14px',textAlign:'center'}}>
                          <span style={{background:sc,color:'#fff',fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,textTransform:'uppercase'}}>{st}</span>
                        </td>
                        <td style={{padding:'10px 14px',textAlign:'center'}}>
                          <span style={{background:pc,color:'#fff',fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20}}>{t.subscription?.planName||'Free'}</span>
                        </td>
                        <td style={{padding:'10px 14px',textAlign:'center',fontSize:12,fontWeight:700,color:'#374151'}}>{t.userCount||0}</td>
                        <td style={{padding:'10px 14px'}}>
                          {t.assignedManagerAt ? (
                            <div>
                              <div style={{fontSize:11,fontWeight:600,color:'#1e293b'}}>{new Date(t.assignedManagerAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                              <div style={{fontSize:10,color:'#94a3b8'}}>{new Date(t.assignedManagerAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                            </div>
                          ) : <span style={{fontSize:11,color:'#d1d5db'}}>—</span>}
                        </td>
                        <td style={{padding:'10px 14px'}}>
                          {t.assignedManagerBy ? (
                            <div>
                              <div style={{fontSize:11,fontWeight:600,color:'#1e293b'}}>{t.assignedManagerBy.firstName} {t.assignedManagerBy.lastName}</div>
                              <div style={{fontSize:10,color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',maxWidth:120}}>{t.assignedManagerBy.email}</div>
                            </div>
                          ) : <span style={{fontSize:11,color:'#d1d5db'}}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SaasLayout>
    );
  }

  return (
    <SaasLayout title="Dashboard">
      <style>{`
        @keyframes dP{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes dO{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.15) translate(10px,-12px)}}
        @keyframes dO2{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.1) translate(-8px,10px)}}
        @keyframes dF{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dScan{0%{transform:translateY(-100%);opacity:0}40%{opacity:1}60%{opacity:1}100%{transform:translateY(800%);opacity:0}}
        @keyframes dShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes dFloat{0%,100%{transform:translateY(0px) rotate(0deg)}33%{transform:translateY(-6px) rotate(1deg)}66%{transform:translateY(3px) rotate(-1deg)}}
        @keyframes dPing{0%{transform:scale(1);opacity:1}100%{transform:scale(2.5);opacity:0}}
        @keyframes dTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .dKpi{cursor:pointer;transition:all 0.18s ease;border-radius:14px;padding:14px 12px;position:relative;overflow:hidden;}
        .dKpi:hover{transform:translateY(-3px);filter:brightness(1.12);box-shadow:0 10px 28px rgba(0,0,0,0.22)!important;}
        .dNav{cursor:pointer;transition:all 0.18s ease;border-radius:12px;padding:13px;display:flex;align-items:center;gap:10px;}
        .dNav:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,0.15)!important;}
        .dAlertRow{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;margin-bottom:6px;cursor:pointer;transition:background 0.12s;}
        .dAlertRow:hover{background:#fef9ec;}
        .dHeroMetric{flex:1;padding:14px 18px;position:relative;overflow:hidden;min-width:0;transition:background 0.2s;}
        .dHeroMetric:hover{background:rgba(255,255,255,0.03)!important;}
        @media(max-width:768px){
          .dHeroMetric{border-left:none !important;border-top:1px solid rgba(255,255,255,0.05);}
          .dNavGrid{grid-template-columns:1fr 1fr !important;}
          .dMainGrid{grid-template-columns:1fr !important;}
          .dBottomGrid{grid-template-columns:1fr !important;}
        }
      `}</style>

      {/* ══ HERO STRIP ══ */}
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',marginBottom:16,border:'1px solid rgba(255,255,255,0.08)'}}>
        {/* bg */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#060d1f 0%,#0f172a 45%,#0d1b4b 100%)',pointerEvents:'none'}}/>
        {/* animated orbs */}
        <div style={{position:'absolute',top:-60,left:'18%',width:280,height:280,background:'radial-gradient(circle,rgba(99,102,241,0.18),transparent 65%)',animation:'dO 11s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-50,right:'12%',width:220,height:220,background:'radial-gradient(circle,rgba(16,185,129,0.13),transparent 65%)',animation:'dO2 15s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'10%',right:'32%',width:160,height:160,background:'radial-gradient(circle,rgba(236,72,153,0.09),transparent 65%)',animation:'dO 9s ease-in-out infinite 3s',pointerEvents:'none'}}/>
        {/* scan line */}
        <div style={{position:'absolute',left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.4),rgba(16,185,129,0.4),transparent)',animation:'dScan 4s ease-in-out infinite',pointerEvents:'none',zIndex:1}}/>
        {/* grid overlay */}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'40px 40px',pointerEvents:'none'}}/>

        {/* ticker bar */}
        <div style={{borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'5px 0',overflow:'hidden',position:'relative'}}>
          <div style={{display:'flex',whiteSpace:'nowrap',animation:'dTicker 22s linear infinite',width:'200%'}}>
            {[...Array(2)].map((_,ri)=>(
              <div key={ri} style={{display:'flex',gap:0,flex:'0 0 50%'}}>
                {[
                  `● MRR ${fmtM(mrr)}`,`● ARR ${fmtM(arr)}`,`● Active ${active}/${total}`,
                  `● Trial ${trial}`,`● Churn Risk ${churnRisk.length}`,`● Growth ${mrrGrowth.str}`,
                  `● Overdue ${overdue.length}`,`● New ${recent} this month`,
                ].map((t,i)=>(
                  <span key={i} style={{fontSize:9,color:'#fff',fontFamily:'monospace',letterSpacing:1.5,padding:'0 24px',borderRight:'1px solid rgba(255,255,255,0.06)'}}>{t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{position:'relative',display:'flex',alignItems:'stretch',flexWrap:'wrap'}}>
          {/* Brand */}
          <div style={{padding:'14px 20px',borderRight:'1px solid rgba(255,255,255,0.06)',flexShrink:0,display:'flex',flexDirection:'column',justifyContent:'center',minWidth:180,gap:6}}>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <div style={{position:'relative'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981'}}/>
                <div style={{position:'absolute',inset:-2,borderRadius:'50%',background:'#10b981',opacity:0.3,animation:'dPing 1.8s ease-out infinite'}}/>
              </div>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.4)',fontFamily:'monospace',letterSpacing:2,textTransform:'uppercase'}}>Live · SaaS Console</span>
            </div>
            <div style={{fontSize:18,fontWeight:900,color:'#fff',letterSpacing:-0.5,lineHeight:1.15}}>
              Command{' '}
              <span style={{background:'linear-gradient(90deg,#a78bfa,#34d399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'dFloat 4s ease-in-out infinite',display:'inline-block'}}>Center</span>
            </div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',fontFamily:'monospace'}}>{total} tenants · {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
            <button onClick={load} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,color:'rgba(255,255,255,0.5)',fontSize:10,padding:'5px 10px',cursor:'pointer',fontWeight:600,width:'fit-content',marginTop:2}}>↺ Sync</button>
          </div>

          {/* Metrics — compact */}
          {[
            {l:'Monthly Revenue', v:fmtF(mrr), sub:fmtM(mrr)+'/mo', chg:mrrGrowth.str, up:mrrGrowth.up, c:'#10b981'},
            {l:'Annual Run Rate', v:fmtF(arr),  sub:fmtM(arr)+'/yr', chg:mrrGrowth.str, up:mrrGrowth.up, c:'#6366f1'},
            {l:'Active Tenants',  v:active,      sub:`${activeRate}% active`, chg:recent>0?`+${recent} this mo`:'No new', up:recent>0, c:'#f59e0b'},
            {l:'New This Month',  v:`+${recent}`,sub:`${total} total`, chg:total>0?`${Math.round((recent/total)*100)}% growth`:'—', up:recent>0, c:'#0ea5e9'},
          ].map((m,i)=>(
            <React.Fragment key={i}>
              <div style={{width:1,background:'rgba(255,255,255,0.05)',flexShrink:0}}/>
              <div className="dHeroMetric">
                <div style={{position:'absolute',top:0,right:0,width:60,height:60,background:`radial-gradient(circle at 100% 0%,${m.c}22,transparent 70%)`,pointerEvents:'none'}}/>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',fontWeight:600,letterSpacing:0.6,marginBottom:5,textTransform:'uppercase'}}>{m.l}</div>
                <div style={{fontSize:isMobile?18:22,fontWeight:900,color:'#fff',fontFamily:'monospace',letterSpacing:-0.8,lineHeight:1,marginBottom:5}}>{m.v}</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:9,color:'rgba(255,255,255,0.22)'}}>{m.sub}</span>
                  <span style={{fontSize:9,fontWeight:700,color:m.up===null?'rgba(255,255,255,0.35)':m.up?'#22c55e':'#f43f5e',padding:'1px 6px',borderRadius:20,background:m.up===null?'rgba(255,255,255,0.06)':m.up?'rgba(34,197,94,0.12)':'rgba(244,63,94,0.12)'}}>{m.chg}</span>
                </div>
                <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${m.c}77,transparent)`}}/>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══ KPI CARDS — glassmorphism ══ */}
      <div style={{position:'relative',borderRadius:18,overflow:'hidden',marginBottom:18,padding:'14px',paddingBottom:14}}>
        {/* Rich gradient backdrop — glass blurs through this */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#0f0c29 0%,#1a1060 30%,#0d2a4a 60%,#0b1a2e 100%)',zIndex:0}}/>
        {/* colour orbs behind cards */}
        <div style={{position:'absolute',top:-60,left:'8%', width:220,height:220,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.45),transparent 65%)',zIndex:0,pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:-40,left:'30%',width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(16,185,129,0.35),transparent 65%)',zIndex:0,pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:-50,left:'52%',width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,158,11,0.35),transparent 65%)',zIndex:0,pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:-60,left:'70%',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(236,72,153,0.35),transparent 65%)',zIndex:0,pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:-40,left:'88%',width:170,height:170,borderRadius:'50%',background:'radial-gradient(circle,rgba(239,68,68,0.4),transparent 65%)',zIndex:0,pointerEvents:'none'}}/>

        <div style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':isTablet?'repeat(3,1fr)':'repeat(5,1fr)',gap:10}}>
          {[
            {l:'Total',     v:total,            c:'#a5b4fc', c2:'#67e8f9', to:'/saas/tenants'},
            {l:'Active',    v:active,           c:'#6ee7b7', c2:'#34d399', to:'/saas/tenants?status=active'},
            {l:'Trial',     v:trial,            c:'#fde68a', c2:'#fbbf24', to:'/saas/tenants?status=trial'},
            {l:'Suspended', v:suspended,        c:'#fbcfe8', c2:'#f472b6', to:'/saas/tenants?status=suspended'},
            {l:'Churn Risk',v:churnRisk.length, c:'#fca5a5', c2:'#fb7185', to:'/saas/billings'},
          ].map((s,i)=>(
            <div key={i} className="dKpi" onClick={()=>navigate(s.to)}
              style={{
                background:'rgba(255,255,255,0.07)',
                backdropFilter:'blur(20px)',
                WebkitBackdropFilter:'blur(20px)',
                border:'1px solid rgba(255,255,255,0.18)',
                boxShadow:'0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.1)',
              }}>
              {/* shimmer top edge */}
              <div style={{position:'absolute',top:0,left:'15%',right:'15%',height:1,background:`linear-gradient(90deg,transparent,${s.c},transparent)`}}/>
              {/* value */}
              <div style={{fontSize:30,fontWeight:900,color:'#fff',lineHeight:1,fontFamily:'monospace',letterSpacing:-1}}>{s.v}</div>
              {/* label */}
              <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.1,marginTop:9}}>{s.l}</div>
              {/* bottom accent line */}
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.c}00,${s.c},${s.c2},${s.c2}00)`,borderRadius:'0 0 14px 14px'}}/>
              {/* churn pulse */}
              {i===4&&churnRisk.length>0&&<div style={{position:'absolute',top:10,right:10,width:7,height:7,borderRadius:'50%',background:'#fb7185',boxShadow:'0 0 8px #fb7185',animation:'dP 1.5s infinite'}}/>}
            </div>
          ))}
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="dMainGrid" style={{display:'grid',gridTemplateColumns:isMobile?'1fr':selectedLayout(),gap:14,marginBottom:14,animation:'dF 0.4s ease'}}>

        {/* ── Revenue Trend ── */}
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'18px 20px',borderTop:'3px solid #10b981'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:'#1e293b'}}>Revenue Trend</div>
              <div style={{fontSize:11,color:'#64748b',marginTop:2}}>Monthly recurring revenue · Last 6 months</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:18,fontWeight:900,color:'#10b981',fontFamily:'monospace'}}>{fmtM(mrr)}</div>
              <div style={{fontSize:11,fontWeight:700,color:mrrGrowth.up?'#16a34a':'#dc2626',marginTop:1}}>{mrrGrowth.str} vs last mo</div>
            </div>
          </div>
          <AreaChart pts={chartPts} months={chartMonths} color="#10b981" h={130}/>
        </div>

        {/* ── Plan Distribution ── */}
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'18px 20px',borderTop:'3px solid #6366f1'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#1e293b',marginBottom:4}}>Plan Distribution</div>
          <div style={{fontSize:11,color:'#64748b',marginBottom:16}}>Revenue by subscription tier</div>
          {PLAN_DATA.map((p,i)=>(
            <div key={i} style={{marginBottom:i<PLAN_DATA.length-1?14:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:10,height:10,borderRadius:3,background:p.g,flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:600,color:'#374151'}}>{p.l}</span>
                  <span style={{fontSize:10,color:'#94a3b8',background:'#f1f5f9',padding:'1px 7px',borderRadius:10,fontWeight:600}}>{p.v}</span>
                </div>
                <span style={{fontSize:11,fontWeight:800,color:'#1e293b',fontFamily:'monospace'}}>{p.rev?fmtM(p.rev):'—'}</span>
              </div>
              <div style={{height:6,borderRadius:3,background:'#f1f5f9',overflow:'hidden'}}>
                <div style={{height:'100%',width:total?`${(p.v/total)*100}%`:'0%',background:p.g,borderRadius:3,transition:'width 0.8s ease'}}/>
              </div>
            </div>
          ))}

          {/* Mini donut-like total split */}
          <div style={{marginTop:18,paddingTop:14,borderTop:'1px solid #f1f5f9',display:'flex',gap:6,flexWrap:'wrap'}}>
            {PLAN_DATA.filter(p=>p.v>0).map((p,i)=>(
              <div key={i} style={{flex:p.v,height:6,background:p.g,borderRadius:3,minWidth:4,transition:'flex 0.8s ease'}}/>
            ))}
          </div>
          <div style={{display:'flex',gap:12,marginTop:8,flexWrap:'wrap'}}>
            {PLAN_DATA.filter(p=>p.v>0).map((p,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:7,height:7,borderRadius:2,background:p.g}}/>
                <span style={{fontSize:9,color:'#64748b',fontWeight:600}}>{p.l} {total?Math.round((p.v/total)*100):0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Health Gauges ── */}
        <div style={{background:'linear-gradient(145deg,#0f172a,#1e1b4b 60%,#0f2027)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:14,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-30,left:-20,width:120,height:120,background:'radial-gradient(circle,rgba(16,185,129,0.15),transparent 70%)',pointerEvents:'none'}}/>
          <div style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:2,position:'relative'}}>Tenant Health</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.55)',marginBottom:18,position:'relative'}}>Real-time status overview</div>
          <div style={{display:'flex',justifyContent:'space-around',alignItems:'flex-end',position:'relative'}}>
            <Ring pct={activeRate} size={78} thick={8} color="#10b981" label="Active" val={`${activeRate}%`}/>
            <Ring pct={total?Math.round((trial/total)*100):0} size={78} thick={8} color="#f59e0b" label="Trial" val={trial}/>
            <Ring pct={total?Math.round((suspended/total)*100):0} size={78} thick={8} color="#ef4444" label="Suspended" val={suspended}/>
          </div>
          <div style={{marginTop:18,paddingTop:14,borderTop:'1px solid rgba(255,255,255,0.06)',position:'relative'}}>
            {[
              {l:'MRR Growth',  v:mrrGrowth.str, c:mrrGrowth.up?'#10b981':'#ef4444'},
              {l:'Churn Risk',  v:`${churnRisk.length} expiring soon`, c:churnRisk.length>0?'#f59e0b':'#10b981'},
              {l:'Overdue',     v:`${overdue.length} accounts`, c:overdue.length>0?'#ef4444':'#10b981'},
            ].map((s,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:i<2?'1px solid rgba(255,255,255,0.05)':'none'}}>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.7)'}}>{s.l}</span>
                <span style={{fontSize:11,fontWeight:700,color:s.c,fontFamily:'monospace'}}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BOTTOM ROW ══ */}
      <div className="dBottomGrid" style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14,marginBottom:14,animation:'dF 0.5s ease'}}>

        {/* ── Alerts ── */}
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'18px 20px',borderTop:'3px solid #ef4444'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:'#1e293b'}}>Alerts & Actions</div>
              <div style={{fontSize:11,color:'#64748b',marginTop:1}}>Subscriptions needing attention</div>
            </div>
            {(churnRisk.length+overdue.length)>0&&
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,color:'#dc2626'}}>{churnRisk.length+overdue.length} issues</div>
            }
          </div>
          {overdue.length===0&&churnRisk.length===0?(
            <div style={{textAlign:'center',padding:'20px 0',color:'#94a3b8',fontSize:13}}>
              <div style={{fontSize:28,marginBottom:8}}>✅</div>
              All subscriptions are healthy
            </div>
          ):(
            <>
              {overdue.slice(0,3).map((b,i)=>(
                <div key={i} className="dAlertRow" onClick={()=>navigate('/saas/billings')}
                  style={{background:'#fef2f2',border:'1px solid #fecaca',marginBottom:6}}>
                  <div style={{width:32,height:32,borderRadius:8,background:avG(b.organizationName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,flexShrink:0}}>
                    {(b.organizationName||'?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.organizationName}</div>
                    <div style={{fontSize:10,color:'#ef4444',fontWeight:600}}>{Math.abs(dLeft(b.subscription?.endDate))}d overdue · {fmtF(b.subscription?.amount)}/mo</div>
                  </div>
                  <div style={{fontSize:10,fontWeight:700,background:'#dc2626',color:'#fff',padding:'3px 8px',borderRadius:6,flexShrink:0}}>OVERDUE</div>
                </div>
              ))}
              {churnRisk.slice(0,3).map((b,i)=>(
                <div key={i} className="dAlertRow" onClick={()=>navigate('/saas/billings')}
                  style={{background:'#fffbeb',border:'1px solid #fde68a',marginBottom:6}}>
                  <div style={{width:32,height:32,borderRadius:8,background:avG(b.organizationName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,flexShrink:0}}>
                    {(b.organizationName||'?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.organizationName}</div>
                    <div style={{fontSize:10,color:'#d97706',fontWeight:600}}>Expires in {dLeft(b.subscription?.endDate)}d · {fmtF(b.subscription?.amount)}/mo</div>
                  </div>
                  <div style={{fontSize:10,fontWeight:700,background:'#f59e0b',color:'#fff',padding:'3px 8px',borderRadius:6,flexShrink:0}}>AT RISK</div>
                </div>
              ))}
              {(churnRisk.length+overdue.length)>6&&(
                <div onClick={()=>navigate('/saas/billings')} style={{textAlign:'center',fontSize:11,color:'#6366f1',fontWeight:700,cursor:'pointer',paddingTop:8}}>View all {churnRisk.length+overdue.length} issues →</div>
              )}
            </>
          )}
        </div>

        {/* ── Quick Navigation ── */}
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'18px 20px',borderTop:'3px solid #6366f1'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#1e293b',marginBottom:4}}>Quick Navigation</div>
          <div style={{fontSize:11,color:'#64748b',marginBottom:14}}>Jump to any section instantly</div>
          <div className="dNavGrid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {NAV.map((n,i)=>(
              <div key={i} className="dNav" onClick={()=>navigate(n.to)}
                style={{background:n.g,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{n.ico}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:800,color:'#fff',whiteSpace:'nowrap'}}>{n.l}</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.65)',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{n.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SaasLayout>
  );
};

function selectedLayout(){ return '1.8fr 1.2fr 1fr'; }

export default SaasDashboard;
