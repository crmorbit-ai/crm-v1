import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SaasLayout from '../components/layout/SaasLayout';
import * as svc from '../services/monetizationService';

/* ─────────────── FORMATTERS ─────────────── */
const fmtF = v => `₹${Number(v||0).toLocaleString('en-IN')}`;
const fmtM = v => { const n=Number(v||0); return n>=1e7?`₹${(n/1e7).toFixed(1)}Cr`:n>=1e5?`₹${(n/1e5).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}k`:`₹${n}`; };
const pct  = n => `${n||0}%`;
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';

/* ─────────────── COLOR MAPS ─────────────── */
const PLAN_COLOR   = { Free:'#64748b', Basic:'#3b82f6', Professional:'#8b5cf6', Enterprise:'#f59e0b' };
const PLAN_GRAD    = { Free:'linear-gradient(135deg,#64748b,#475569)', Basic:'linear-gradient(135deg,#3b82f6,#0ea5e9)', Professional:'linear-gradient(135deg,#8b5cf6,#6366f1)', Enterprise:'linear-gradient(135deg,#f59e0b,#f97316)' };
const STATUS_COLOR = { active:'#10b981', trial:'#f59e0b', cancelled:'#ef4444', expired:'#64748b', suspended:'#f97316' };
const SEG_COLOR    = { champion:'#10b981', healthy:'#3b82f6', at_risk:'#f59e0b', critical:'#ef4444' };
const SEG_LABEL    = { champion:'Champion', healthy:'Healthy', at_risk:'At Risk', critical:'Critical' };
const FLABELS = { leadManagement:'Lead Management',contactManagement:'Contact Management',dealTracking:'Deal Tracking',taskManagement:'Task Management',emailIntegration:'Email Integration',calendarSync:'Calendar & Meetings',advancedReports:'Advanced Reports',customFields:'Custom Fields',automation:'Automation & Templates',apiAccess:'API Access',crossOrgHierarchy:'Org Hierarchy',salesMonetization:'Sales Monetization',dedicatedSupport:'Dedicated Support',customIntegrations:'Social Media & Integrations',advancedSecurity:'Advanced Security & Audit' };
const PRIORITY_CFG = { critical:{label:'Critical',color:'#ef4444'}, high:{label:'High',color:'#f97316'}, medium:{label:'Medium',color:'#f59e0b'}, low:{label:'Low',color:'#64748b'} };
const getPriority  = p => p>=90?'critical':p>=70?'high':p>=50?'medium':'low';

/* avatar gradient */
const AV=[['#6366f1','#8b5cf6'],['#10b981','#059669'],['#f59e0b','#f97316'],['#0ea5e9','#6366f1'],['#ec4899','#8b5cf6'],['#14b8a6','#0ea5e9']];
const avG = n => `linear-gradient(135deg,${AV[(n?.charCodeAt(0)||0)%AV.length][0]},${AV[(n?.charCodeAt(0)||0)%AV.length][1]})`;

const TABS = [
  {id:'overview',label:'Overview',      color:'#a78bfa'},
  {id:'revenue', label:'Revenue',       color:'#34d399'},
  {id:'churn',   label:'Churn',         color:'#fb7185'},
  {id:'upsell',  label:'Upsell',        color:'#60a5fa'},
  {id:'features',label:'Features',      color:'#fbbf24'},
  {id:'subs',    label:'Subscriptions', color:'#a78bfa'},
  {id:'health',  label:'Health',        color:'#4ade80'},
];

/* ─────────────── CSV ─────────────── */
const downloadCSV = (filename,rows,cols) => {
  const hd = cols.map(c=>c.label).join(',');
  const bd = rows.map(r=>cols.map(c=>{const v=c.csvVal?c.csvVal(r):(r[c.key]??'');return `"${String(v).replace(/"/g,'""')}"`;}).join(',')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([hd+'\n'+bd],{type:'text/csv'})); a.download=filename; a.click();
};

/* ══════════════════════════════════════
   GLOBAL CSS
══════════════════════════════════════ */
const CSS = `
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes mFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes mPulse{0%,100%{opacity:1}50%{opacity:0.25}}
@keyframes mPing{0%{transform:scale(1);opacity:1}100%{transform:scale(2.4);opacity:0}}
@keyframes mOrb{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.12) translate(8px,-10px)}}
@keyframes mOrb2{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.08) translate(-6px,8px)}}
@keyframes mScan{0%{transform:translateY(-100%);opacity:0}40%{opacity:1}60%{opacity:1}100%{transform:translateY(1200%);opacity:0}}
@keyframes mTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes mFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.mKpi{cursor:pointer;transition:all 0.18s ease;}
.mKpi:hover{transform:translateY(-3px)!important;filter:brightness(1.12);box-shadow:0 12px 32px rgba(0,0,0,0.28)!important;}
.mRow:hover td{background:#eff6ff!important;}
.mRow:hover .mSticky{background:#eff6ff!important;}
.mTabBtn{transition:all 0.15s ease;border:none;cursor:pointer;font-weight:700;letter-spacing:0.2px;}
.mTabBtn:hover{background:rgba(255,255,255,0.12)!important;}
.mDlBtn:hover{background:#f1f5f9!important;border-color:#cbd5e1!important;}
.mCardHover{transition:box-shadow 0.2s,transform 0.2s;}
.mCardHover:hover{box-shadow:0 8px 24px rgba(0,0,0,0.1)!important;transform:translateY(-1px);}
`;

/* ══════════════════════════════════════
   COMPONENTS
══════════════════════════════════════ */

const Spin = () => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:220,flexDirection:'column',gap:12}}>
    <div style={{width:32,height:32,border:'3px solid #e2e8f0',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
    <span style={{fontSize:10,color:'#94a3b8',fontWeight:700,letterSpacing:'1px',textTransform:'uppercase'}}>Loading</span>
  </div>
);

const Empty = ({msg='No data available',icon='📭'}) => (
  <div style={{textAlign:'center',padding:'44px 20px',color:'#94a3b8'}}>
    <div style={{fontSize:28,marginBottom:10,opacity:0.5}}>{icon}</div>
    <div style={{fontSize:12,fontWeight:600,color:'#64748b'}}>{msg}</div>
  </div>
);

/* White card with 3-px top accent — matches SaasDashboard style */
const Card = ({children,color='#6366f1',style={},pad=20}) => (
  <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,borderTop:`3px solid ${color}`,boxShadow:'0 1px 4px rgba(0,0,0,0.05)',padding:pad,...style}}>
    {children}
  </div>
);

/* Dark card — matches SaasDashboard "Tenant Health" dark glass panel */
const DarkCard = ({children,style={}}) => (
  <div style={{background:'linear-gradient(145deg,#0f172a,#1e1b4b 60%,#0f2027)',border:'1px solid rgba(99,102,241,0.18)',borderRadius:14,padding:'18px 20px',position:'relative',overflow:'hidden',...style}}>
    <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)',pointerEvents:'none'}}/>
    <div style={{position:'absolute',bottom:-30,left:-20,width:120,height:120,background:'radial-gradient(circle,rgba(16,185,129,0.15),transparent 70%)',pointerEvents:'none'}}/>
    {children}
  </div>
);

/* Gradient KPI card — matches Billings style */
const GradKPI = ({label,value,icon,grad,grad2,onClick,pulse}) => (
  <div className="mKpi" onClick={onClick} style={{background:grad,borderRadius:14,padding:'16px 14px',cursor:onClick?'pointer':'default',boxShadow:'0 2px 10px rgba(0,0,0,0.12)',position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',top:-14,right:-8,fontSize:50,opacity:0.1,fontWeight:900,lineHeight:1}}>{icon}</div>
    {pulse&&<div style={{position:'absolute',top:10,right:10,width:7,height:7,borderRadius:'50%',background:'#fff',boxShadow:'0 0 8px rgba(255,255,255,0.9)',animation:'mPulse 1.5s infinite'}}/>}
    <div style={{fontSize:28,fontWeight:900,color:'#fff',lineHeight:1,fontFamily:'monospace',letterSpacing:-1}}>{value}</div>
    <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.75)',textTransform:'uppercase',letterSpacing:0.8,marginTop:8}}>{label}</div>
    <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,rgba(255,255,255,0.4),rgba(255,255,255,0.1),transparent)`,borderRadius:'0 0 14px 14px'}}/>
  </div>
);

/* SVG Area Chart — same as SaasDashboard */
const AreaChart = ({pts=[],months=[],color='#10b981',h=140}) => {
  if(pts.length<2) return <div style={{height:h,display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:12}}>No data yet</div>;
  const VW=700,VH=h,pad={t:8,r:8,b:22,l:48};
  const iW=VW-pad.l-pad.r, iH=VH-pad.t-pad.b;
  const mx=Math.max(...pts,1);
  const P=pts.map((v,i)=>({x:pad.l+(i/(pts.length-1))*iW, y:pad.t+iH-(v/mx)*iH}));
  let line=`M${P[0].x},${P[0].y}`;
  for(let i=1;i<P.length;i++){const cx=(P[i-1].x+P[i].x)/2;line+=` C${cx},${P[i-1].y} ${cx},${P[i].y} ${P[i].x},${P[i].y}`;}
  const area=line+` L${P[P.length-1].x},${pad.t+iH} L${P[0].x},${pad.t+iH}Z`;
  const uid=color.replace(/\W/g,'');
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{width:'100%',height:VH,display:'block'}}>
      <defs>
        <linearGradient id={`mg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.38"/>
          <stop offset="88%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {[0,50,100].map(p=>{const y=pad.t+((100-p)/100)*iH;return(<g key={p}><line x1={pad.l} y1={y} x2={pad.l+iW} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray="4 6"/><text x={pad.l-5} y={y+4} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">{fmtM((p/100)*mx)}</text></g>);})}
      <path d={area} fill={`url(#mg${uid})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{filter:`drop-shadow(0 0 5px ${color}66)`}}/>
      {P.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={i===P.length-1?4:2.5} fill={i===P.length-1?color:'#e2e8f0'} stroke="#fff" strokeWidth="1.5" style={{filter:i===P.length-1?`drop-shadow(0 0 5px ${color})`:'none'}}/>)}
      {months.map((m,i)=><text key={i} x={P[i]?.x} y={VH-2} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">{m}</text>)}
    </svg>
  );
};

/* SVG Ring Gauge — same as SaasDashboard */
const Ring = ({pct=0,size=80,thick=8,color='#10b981',label='',val=''}) => {
  const r=(size-thick*2)/2, circ=2*Math.PI*r, dash=circ*(Math.min(pct,100)/100);
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      <div style={{position:'relative',width:size,height:size}}>
        <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={thick}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thick} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:'stroke-dasharray 0.8s ease',filter:`drop-shadow(0 0 4px ${color}88)`}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontSize:14,fontWeight:900,color:'#fff',lineHeight:1}}>{val}</div>
        </div>
      </div>
      <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:0.8}}>{label}</div>
    </div>
  );
};

/* Progress bar */
const ProgressBar = ({value,max=100,color='#6366f1',label,right,h=5}) => (
  <div style={{marginBottom:10}}>
    {label&&<div style={{display:'flex',justifyContent:'space-between',fontSize:11,fontWeight:600,marginBottom:4}}><span style={{color:'#475569'}}>{label}</span><span style={{color:'#0f172a',fontWeight:700}}>{right}</span></div>}
    <div style={{height:h,borderRadius:99,background:'#f1f5f9',overflow:'hidden'}}>
      <div style={{height:'100%',background:color,borderRadius:99,width:`${Math.min(100,(value/Math.max(max,1))*100)}%`,transition:'width .6s cubic-bezier(.4,0,.2,1)',boxShadow:`0 0 6px ${color}55`}}/>
    </div>
  </div>
);

/* Status Badge */
const Badge = ({color='#6366f1',children,sm}) => (
  <span style={{display:'inline-flex',alignItems:'center',padding:sm?'1px 7px':'3px 10px',borderRadius:20,fontSize:sm?9:10,fontWeight:700,background:color,color:'#fff',letterSpacing:'0.1px'}}>
    {children}
  </span>
);

/* Download CSV button */
const DlBtn = ({onClick}) => (
  <button className="mDlBtn" onClick={onClick} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:10,fontWeight:700,color:'#475569',transition:'all .15s',flexShrink:0}}>
    ↓ CSV
  </button>
);

/* Section title */
const SH = ({title,sub,action}) => (
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,gap:12}}>
    <div>
      <div style={{fontSize:13,fontWeight:800,color:'#1e293b',letterSpacing:'-0.2px'}}>{title}</div>
      {sub&&<div style={{fontSize:11,color:'#64748b',marginTop:2,lineHeight:1.5}}>{sub}</div>}
    </div>
    {action&&<div style={{flexShrink:0}}>{action}</div>}
  </div>
);

/* Data Table — dark sticky header like Billings */
const DataTable = ({cols,rows,emptyMsg,emptyIcon}) => (
  <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
      <thead>
        <tr>
          {cols.map(c=>(
            <th key={c.key+c.label} style={{background:'#1e293b',border:'1px solid #334155',padding:'7px 12px',fontSize:10,fontWeight:700,color:'#94a3b8',textAlign:c.right?'right':'left',whiteSpace:'nowrap',letterSpacing:'.5px',textTransform:'uppercase'}}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {!rows?.length
          ? <tr><td colSpan={cols.length}><Empty msg={emptyMsg} icon={emptyIcon}/></td></tr>
          : rows.map((row,i)=>(
            <tr key={i} className="mRow" style={{cursor:'default'}}>
              {cols.map(c=>(
                <td key={c.key+c.label} style={{border:'1px solid #e2e6eb',padding:'0 12px',fontSize:12,color:'#1e293b',textAlign:c.right?'right':'left',verticalAlign:'middle',height:40,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {c.render?c.render(row):row[c.key]}
                </td>
              ))}
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
);

/* ══════════════════════════════════════
   TAB: OVERVIEW
══════════════════════════════════════ */
const TabOverview = ({d,onTabChange}) => {
  if(!d) return <Spin/>;
  const go = t => onTabChange&&onTabChange(t);
  const pe = Object.entries(d.planBreakdown||{});
  const tot = pe.reduce((s,[,v])=>s+v,0);
  const GRADS = [
    {l:'MRR',          v:fmtM(d.mrr),         icon:'₹', g:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)',  g2:'linear-gradient(135deg,#4f46e5,#7c3aed,#0891b2)'},
    {l:'ARR',          v:fmtM(d.arr),          icon:'📈',g:'linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)',               g2:'linear-gradient(135deg,#0284c7,#4f46e5)'},
    {l:'Active',       v:d.activeTenants,      icon:'✓', g:'linear-gradient(135deg,#10b981 0%,#059669 50%,#16a34a 100%)',  g2:'linear-gradient(135deg,#059669,#047857)', onClick:()=>go('health')},
    {l:'Churn Rate',   v:pct(d.churnRate),     icon:'↻', g:'linear-gradient(135deg,#ef4444 0%,#dc2626 50%,#b91c1c 100%)',  g2:'linear-gradient(135deg,#dc2626,#b91c1c)', onClick:()=>go('churn')},
    {l:'Trials',       v:d.trialTenants,       icon:'⚗', g:'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)',  g2:'linear-gradient(135deg,#d97706,#ea580c)', onClick:()=>go('churn')},
    {l:'Cancelled',    v:d.cancelledTenants,   icon:'✕', g:'linear-gradient(135deg,#64748b 0%,#475569 50%,#334155 100%)',  g2:'linear-gradient(135deg,#475569,#334155)', onClick:()=>go('churn')},
    {l:'New (30d)',     v:d.newThisMonth,       icon:'★', g:'linear-gradient(135deg,#14b8a6 0%,#0d9488 50%,#0e7490 100%)',  g2:'linear-gradient(135deg,#0d9488,#0e7490)', onClick:()=>go('subs')},
    {l:'Total',        v:d.totalTenants,       icon:'⬡', g:'linear-gradient(135deg,#8b5cf6 0%,#6366f1 50%,#0ea5e9 100%)',  g2:'linear-gradient(135deg,#7c3aed,#4f46e5)', onClick:()=>go('subs')},
  ];
  const activeRate = d.totalTenants ? Math.round((d.activeTenants/d.totalTenants)*100) : 0;
  const trialRate  = d.totalTenants ? Math.round((d.trialTenants/d.totalTenants)*100)  : 0;
  const churnN     = d.cancelledTenants||0;
  return (
    <div style={{animation:'mFadeUp .35s ease'}}>
      {/* Dark backdrop KPI section */}
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',marginBottom:16,padding:'14px'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#0f0c29 0%,#1a1060 30%,#0d2a4a 60%,#0b1a2e 100%)',zIndex:0}}/>
        {['8%','28%','50%','70%','88%'].map((l,i)=>(
          <div key={i} style={{position:'absolute',top:-50,left:l,width:180,height:180,borderRadius:'50%',background:`radial-gradient(circle,${['rgba(99,102,241,0.4)','rgba(16,185,129,0.3)','rgba(245,158,11,0.3)','rgba(236,72,153,0.3)','rgba(239,68,68,0.35)'][i]},transparent 65%)`,zIndex:0,pointerEvents:'none'}}/>
        ))}
        <div style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {GRADS.slice(0,4).map((s,i)=>(
            <GradKPI key={i} label={s.l} value={s.v} icon={s.icon} grad={s.g} grad2={s.g2} onClick={s.onClick}/>
          ))}
        </div>
        <div style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:10}}>
          {GRADS.slice(4,8).map((s,i)=>(
            <GradKPI key={i} label={s.l} value={s.v} icon={s.icon} grad={s.g} grad2={s.g2} onClick={s.onClick}/>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        {/* Plan Distribution */}
        <Card color="#6366f1">
          <SH title="Plan Distribution" sub="Revenue by subscription tier"/>
          {!pe.length ? <Empty/> : pe.map(([p,c])=>(
            <div key={p} style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:10,height:10,borderRadius:3,background:PLAN_GRAD[p]||'#6366f1',flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:600,color:'#374151'}}>{p}</span>
                  <span style={{fontSize:10,color:'#94a3b8',background:'#f1f5f9',padding:'1px 7px',borderRadius:10,fontWeight:600}}>{c}</span>
                </div>
                <span style={{fontSize:11,fontWeight:800,color:'#1e293b'}}>{Math.round((c/Math.max(tot,1))*100)}%</span>
              </div>
              <div style={{height:5,borderRadius:99,background:'#f1f5f9',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(c/Math.max(tot,1))*100}%`,background:PLAN_GRAD[p]||'#6366f1',borderRadius:99,transition:'width .8s ease'}}/>
              </div>
            </div>
          ))}
          {pe.length>0&&(
            <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid #f1f5f9',display:'flex',gap:5,flexWrap:'wrap'}}>
              {pe.filter(([,c])=>c>0).map(([p,c])=>(
                <div key={p} style={{flex:c,height:5,background:PLAN_GRAD[p]||'#6366f1',borderRadius:3,minWidth:4,transition:'flex .8s ease'}}/>
              ))}
            </div>
          )}
        </Card>

        {/* Dark Health Gauges */}
        <DarkCard>
          <div style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:2,position:'relative'}}>Tenant Health</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginBottom:18,position:'relative'}}>Real-time status overview</div>
          <div style={{display:'flex',justifyContent:'space-around',alignItems:'flex-end',position:'relative'}}>
            <Ring pct={activeRate} size={76} thick={8} color="#10b981" label="Active"    val={`${activeRate}%`}/>
            <Ring pct={trialRate}  size={76} thick={8} color="#f59e0b" label="Trial"     val={d.trialTenants||0}/>
            <Ring pct={d.totalTenants?Math.round((churnN/d.totalTenants)*100):0} size={76} thick={8} color="#ef4444" label="Cancelled" val={churnN}/>
          </div>
          <div style={{marginTop:18,paddingTop:14,borderTop:'1px solid rgba(255,255,255,0.06)',position:'relative'}}>
            {[
              {l:'MRR',          v:fmtM(d.mrr),                c:'#10b981'},
              {l:'Active Rate',  v:`${activeRate}%`,            c:activeRate>=70?'#10b981':activeRate>=40?'#f59e0b':'#ef4444'},
              {l:'New (30d)',     v:`+${d.newThisMonth||0}`,    c:'#0ea5e9'},
            ].map((s,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:i<2?'1px solid rgba(255,255,255,0.05)':'none'}}>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>{s.l}</span>
                <span style={{fontSize:11,fontWeight:700,color:s.c,fontFamily:'monospace'}}>{s.v}</span>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   TAB: REVENUE
══════════════════════════════════════ */
const TabRevenue = ({d}) => {
  const refTop = React.useRef(null);
  const scrollTo = ref => ref.current?.scrollIntoView({behavior:'smooth',block:'start'});
  if(!d) return <Spin/>;
  const chartPts  = (d.revenueChart||[]).map(m=>m.revenue);
  const chartMths = (d.revenueChart||[]).map(m=>m.label);
  const mxPlan    = Math.max(...Object.values(d.planRevenue||{}).map(Number),1);
  return (
    <div style={{animation:'mFadeUp .35s ease'}}>
      {/* Revenue Strip — dark with area chart */}
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',marginBottom:16,border:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#09101f,#07121a)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:-80,left:'30%',width:300,height:300,background:'radial-gradient(circle,rgba(16,185,129,0.08),transparent 65%)',animation:'mOrb 12s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{position:'relative',padding:'20px 24px 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
            <div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',fontFamily:'monospace',letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>Revenue Intelligence</div>
              <div style={{fontSize:16,fontWeight:800,color:'#fff'}}>Monthly Recurring Revenue</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2}}>Last 12 months · Based on active subscriptions</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:26,fontWeight:900,color:'#34d399',fontFamily:'monospace',letterSpacing:-1}}>{fmtM(d.revenueChart?.[d.revenueChart.length-1]?.revenue||0)}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:2}}>Current month</div>
            </div>
          </div>
        </div>
        <div style={{position:'relative',padding:'0 24px 16px'}}>
          <AreaChart pts={chartPts} months={chartMths} color="#10b981" h={140}/>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        {/* Revenue by Plan */}
        <Card color="#10b981">
          <SH title="Revenue by Plan" sub="Monthly recurring from each tier"/>
          {!Object.keys(d.planRevenue||{}).length ? <Empty/> : Object.entries(d.planRevenue).map(([p,r])=>(
            <div key={p} style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:8,height:8,borderRadius:2,background:PLAN_GRAD[p]||'#6366f1',flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:600,color:'#374151'}}>{p}</span>
                </div>
                <span style={{fontSize:12,fontWeight:800,color:'#1e293b',fontFamily:'monospace'}}>{fmtM(r)}</span>
              </div>
              <div style={{height:5,borderRadius:99,background:'#f1f5f9',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(r/mxPlan)*100}%`,background:PLAN_GRAD[p]||'#6366f1',borderRadius:99,transition:'width .6s ease',boxShadow:`0 0 6px ${PLAN_COLOR[p]||'#6366f1'}55`}}/>
              </div>
            </div>
          ))}
        </Card>

        {/* Top Revenue Tenants */}
        <div ref={refTop}>
          <Card color="#6366f1">
            <SH title="Top Revenue Tenants" sub="Highest paying active accounts"/>
            {!(d.topTenants||[]).length ? <Empty msg="No active tenants yet"/> : d.topTenants.map((t,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<d.topTenants.length-1?'1px solid #f8fafc':'none'}}>
                <div style={{width:32,height:32,borderRadius:9,background:avG(t.name),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:13,flexShrink:0}}>
                  {(t.name||'?').charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</div>
                  <span style={{fontSize:9,fontWeight:700,background:PLAN_COLOR[t.plan]||'#6366f1',color:'#fff',padding:'1px 7px',borderRadius:10}}>{t.plan}</span>
                </div>
                <div style={{fontSize:14,fontWeight:900,color:'#10b981',fontFamily:'monospace',flexShrink:0}}>{fmtM(t.mrr)}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   TAB: CHURN
══════════════════════════════════════ */
const TabChurn = ({d}) => {
  const refAtRisk   = React.useRef(null);
  const refChurned  = React.useRef(null);
  const refWinBack  = React.useRef(null);
  const refInactive = React.useRef(null);
  const scrollTo    = ref => ref.current?.scrollIntoView({behavior:'smooth',block:'start'});
  if(!d) return <Spin/>;
  const {summary={},atRisk=[],recentlyChurned=[],churnReasons={},winBack=[],churnTrend=[],inactiveTenants=[]}=d;

  return (
    <div style={{animation:'mFadeUp .35s ease'}}>
      {/* KPIs */}
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',marginBottom:16,padding:'14px'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#0f0c29 0%,#1a1060 30%,#0d2a4a 60%,#0b1a2e 100%)',zIndex:0}}/>
        {['8%','30%','55%','78%'].map((l,i)=>(
          <div key={i} style={{position:'absolute',top:-50,left:l,width:180,height:180,borderRadius:'50%',background:`radial-gradient(circle,${['rgba(245,158,11,0.4)','rgba(239,68,68,0.35)','rgba(99,102,241,0.35)','rgba(148,163,184,0.3)'][i]},transparent 65%)`,zIndex:0,pointerEvents:'none'}}/>
        ))}
        <div style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          <GradKPI label="At Risk"       value={summary.atRiskCount||0}  icon="⚠" grad="linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)"  onClick={()=>scrollTo(refAtRisk)}/>
          <GradKPI label="Churned (90d)" value={summary.churnedCount||0} icon="✕" grad="linear-gradient(135deg,#ef4444 0%,#dc2626 50%,#b91c1c 100%)"  onClick={()=>scrollTo(refChurned)} pulse={summary.churnedCount>0}/>
          <GradKPI label="Win-Back"      value={summary.winBackCount||0} icon="◎" grad="linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)"  onClick={()=>scrollTo(refWinBack)}/>
          <GradKPI label="Inactive"      value={summary.inactiveCount||0}icon="…" grad="linear-gradient(135deg,#64748b 0%,#475569 50%,#334155 100%)"  onClick={()=>scrollTo(refInactive)}/>
        </div>
      </div>

      {/* Churn trend chart + Cancellation Reasons */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <Card color="#ef4444">
          <SH title="Monthly Churn vs New Signups" sub="Green = new signups · Red = cancelled"/>
          <div style={{display:'flex',gap:4,overflowX:'auto',paddingBottom:4,alignItems:'flex-end'}}>
            {churnTrend.map((m,i)=>{
              const mx=Math.max(...churnTrend.map(x=>Math.max(x.new,x.churned)),1);
              return (
                <div key={i} style={{minWidth:48,textAlign:'center',flex:'0 0 48px'}}>
                  <div style={{fontSize:9,fontWeight:800,color:'#10b981',minHeight:12}}>{m.new>0?`+${m.new}`:''}</div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:2,height:60,justifyContent:'center',marginBottom:2}}>
                    <div style={{width:13,background:'linear-gradient(180deg,#10b981,#047857)',borderRadius:'3px 3px 0 0',height:`${Math.max(4,(m.new/mx)*56)}px`,transition:'height .3s'}}/>
                    <div style={{width:13,background:'linear-gradient(180deg,#ef4444,#b91c1c)',borderRadius:'3px 3px 0 0',height:`${Math.max(m.churned>0?4:0,(m.churned/mx)*56)}px`,transition:'height .3s'}}/>
                  </div>
                  <div style={{fontSize:9,fontWeight:800,color:'#ef4444',minHeight:12}}>{m.churned>0?`-${m.churned}`:''}</div>
                  <div style={{fontSize:8,color:'#94a3b8',marginTop:1}}>{m.label}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:'flex',gap:14,marginTop:10,paddingTop:10,borderTop:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:10,height:10,borderRadius:2,background:'#10b981'}}/><span style={{fontSize:10,color:'#64748b',fontWeight:600}}>New</span></div>
            <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:10,height:10,borderRadius:2,background:'#ef4444'}}/><span style={{fontSize:10,color:'#64748b',fontWeight:600}}>Churned</span></div>
          </div>
        </Card>

        <div ref={refAtRisk} style={{display:'flex',flexDirection:'column',gap:14}}>
          <Card color="#f59e0b" style={{flex:1}}>
            <SH title="Cancellation Reasons" sub="Why tenants are leaving"/>
            {!Object.keys(churnReasons).length
              ? <Empty msg="No cancellations recorded yet" icon="📋"/>
              : Object.entries(churnReasons).sort((a,b)=>b[1]-a[1]).map(([r,c])=>(
                <ProgressBar key={r} label={r} right={`${c}×`} value={c} max={Math.max(...Object.values(churnReasons))} color="#ef4444"/>
              ))
            }
          </Card>
        </div>
      </div>

      {/* At-Risk Tenants */}
      <Card color="#f59e0b" style={{marginBottom:14}}>
        <SH title="At-Risk Tenants" sub="Trial expiring soon or already expired"/>
        {!atRisk.length ? <Empty msg="No at-risk tenants right now 🎉" icon="🎉"/> : (
          <DataTable cols={[
            {key:'name',label:'Organization',render:r=><span style={{fontWeight:700,color:'#1e293b'}}>{r.name}</span>},
            {key:'usage',label:'Leads',render:r=><span style={{fontFamily:'monospace',fontWeight:600}}>{r.usage?.leads||0}</span>},
            {key:'activity',label:'Activity (30d)',render:r=><span style={{fontFamily:'monospace',fontWeight:600}}>{r.usage?.activity30d||0}</span>},
            {key:'lastActivity',label:'Last Active',render:r=>r.lastActivity?fmtD(r.lastActivity):'Never'},
            {key:'status',label:'Status',render:r=>r.isOverdue
              ? <span style={{fontSize:10,fontWeight:700,color:'#dc2626',background:'#fef2f2',border:'1px solid #fecaca',padding:'2px 8px',borderRadius:20}}>Overdue {Math.abs(r.daysLeft)}d</span>
              : <span style={{fontSize:10,fontWeight:700,color:'#92400e',background:'#fffbeb',border:'1px solid #fde68a',padding:'2px 8px',borderRadius:20}}>{r.daysLeft}d left</span>
            },
          ]} rows={atRisk} emptyMsg="No at-risk tenants"/>
        )}
      </Card>

      {/* Recently Churned */}
      <div ref={refChurned}>
        <Card color="#ef4444" style={{marginBottom:14}}>
          <SH title="Recently Churned" sub="Tenants who cancelled in last 90 days"
            action={<DlBtn onClick={()=>downloadCSV('churned-tenants.csv',recentlyChurned,[{key:'name',label:'Organization'},{key:'plan',label:'Plan'},{key:'amount',label:'Was Paying',csvVal:r=>r.amount||0},{key:'reason',label:'Reason'},{key:'cancelledAt',label:'Date',csvVal:r=>r.cancelledAt?fmtD(r.cancelledAt):''}])}/>}/>
          <DataTable cols={[
            {key:'name',label:'Organization',render:r=><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:26,height:26,borderRadius:7,background:avG(r.name),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>{(r.name||'?').charAt(0).toUpperCase()}</div><span style={{fontWeight:700}}>{r.name}</span></div>},
            {key:'plan',label:'Plan',render:r=><Badge color={PLAN_COLOR[r.plan]||'#6366f1'}>{r.plan}</Badge>},
            {key:'amount',label:'Was Paying',right:true,render:r=><b style={{fontFamily:'monospace'}}>{fmtM(r.amount)}</b>},
            {key:'reason',label:'Reason'},
            {key:'cancelledAt',label:'Date',render:r=>fmtD(r.cancelledAt)},
          ]} rows={recentlyChurned} emptyMsg="No cancellations yet"/>
        </Card>
      </div>

      {/* Inactive */}
      <div ref={refInactive}>
        <Card color="#64748b" style={{marginBottom:14}}>
          <SH title="Inactive Tenants" sub="No activity in last 14 days"
            action={<DlBtn onClick={()=>downloadCSV('inactive-tenants.csv',inactiveTenants,[{key:'name',label:'Organization'},{key:'plan',label:'Plan'},{key:'status',label:'Status'},{key:'daysSinceActivity',label:'Inactive Days'},{key:'lastActivity',label:'Last Active',csvVal:r=>r.lastActivity?fmtD(r.lastActivity):'Never'}])}/>}/>
          <DataTable cols={[
            {key:'name',label:'Organization',render:r=><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:26,height:26,borderRadius:7,background:avG(r.name),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>{(r.name||'?').charAt(0).toUpperCase()}</div><span style={{fontWeight:700}}>{r.name}</span></div>},
            {key:'plan',label:'Plan',render:r=><Badge color={PLAN_COLOR[r.plan]||'#6366f1'}>{r.plan}</Badge>},
            {key:'status',label:'Status',render:r=><Badge color={STATUS_COLOR[r.status]||'#94a3b8'}>{r.status}</Badge>},
            {key:'daysSinceActivity',label:'Inactive For',render:r=><span style={{fontWeight:800,color:r.daysSinceActivity>30?'#ef4444':r.daysSinceActivity>14?'#f59e0b':'#64748b',fontFamily:'monospace'}}>{r.daysSinceActivity}d</span>},
            {key:'usage',label:'Data',render:r=>`${r.usage?.leads||0} leads · ${r.usage?.deals||0} deals`},
            {key:'lastActivity',label:'Last Active',render:r=>r.lastActivity?fmtD(r.lastActivity):'Never'},
          ]} rows={inactiveTenants} emptyMsg="All tenants are active 🎉"/>
        </Card>
      </div>

      {/* Win-Back */}
      <div ref={refWinBack}>
        {winBack.length>0&&(
          <Card color="#6366f1">
            <SH title="Win-Back Opportunities" sub="Cancelled but had real usage — worth reaching out"/>
            <DataTable cols={[
              {key:'name',label:'Organization'},
              {key:'plan',label:'Last Plan',render:r=><Badge color={PLAN_COLOR[r.plan]||'#6366f1'}>{r.plan}</Badge>},
              {key:'usage',label:'Usage',render:r=>`${r.usage?.leads||0} leads · ${r.usage?.deals||0} deals`},
              {key:'reason',label:'Cancel Reason'},
            ]} rows={winBack}/>
          </Card>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   TAB: UPSELL
══════════════════════════════════════ */
const TabUpsell = ({d}) => {
  const refUpsell    = React.useRef(null);
  const refCrosssell = React.useRef(null);
  const scrollTo = ref => ref.current?.scrollIntoView({behavior:'smooth',block:'start'});
  if(!d) return <Spin/>;
  const {upsellCandidates=[],crossSellOpps=[],summary={}}=d;
  return (
    <div style={{animation:'mFadeUp .35s ease'}}>
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',marginBottom:16,padding:'14px'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#0f0c29 0%,#1a1060 30%,#0d2a4a 60%,#0b1a2e 100%)',zIndex:0}}/>
        {['10%','40%','72%'].map((l,i)=>(
          <div key={i} style={{position:'absolute',top:-50,left:l,width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle,${['rgba(99,102,241,0.4)','rgba(14,165,233,0.35)','rgba(16,185,129,0.4)'][i]},transparent 65%)`,zIndex:0,pointerEvents:'none'}}/>
        ))}
        <div style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          <GradKPI label="Upsell Candidates"  value={summary.upsellCount||0}    icon="▲" grad="linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)" onClick={()=>scrollTo(refUpsell)}/>
          <GradKPI label="Cross-sell Opps"    value={summary.crossSellCount||0} icon="⇌" grad="linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)"               onClick={()=>scrollTo(refCrosssell)}/>
          <GradKPI label="Potential MRR Gain" value={fmtM(summary.potentialMRR||0)} icon="₹" grad="linear-gradient(135deg,#10b981 0%,#059669 50%,#16a34a 100%)"/>
        </div>
      </div>

      <div ref={refUpsell}>
        <Card color="#6366f1" style={{marginBottom:14}}>
          <SH title="Upsell Candidates" sub="Tenants at 70%+ of plan limits — ideal time to suggest upgrade"/>
          {!upsellCandidates.length
            ? <Empty msg="No upsell candidates — all tenants well within limits" icon="✅"/>
            : <DataTable cols={[
                {key:'priority',label:'Priority',render:r=>{const p=getPriority(r.maxUsagePct);const c=PRIORITY_CFG[p];return<Badge color={c.color}>{c.label}</Badge>;}},
                {key:'name',label:'Organization',render:r=><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:26,height:26,borderRadius:7,background:avG(r.name),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>{(r.name||'?').charAt(0).toUpperCase()}</div><span style={{fontWeight:700}}>{r.name}</span></div>},
                {key:'currentPlan',label:'Current Plan',render:r=><Badge color={PLAN_COLOR[r.currentPlan]||'#6366f1'}>{r.currentPlan}</Badge>},
                {key:'suggestedPlan',label:'Suggest',render:r=><Badge color={PLAN_COLOR[r.suggestedPlan]||'#10b981'}>{r.suggestedPlan}</Badge>},
                {key:'maxUsagePct',label:'Peak Usage',right:true,render:r=>{const p=getPriority(r.maxUsagePct);const c=PRIORITY_CFG[p];return(
                  <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}>
                    <div style={{width:56,height:4,borderRadius:99,background:'#f1f5f9',overflow:'hidden'}}><div style={{height:'100%',borderRadius:99,background:c.color,width:`${r.maxUsagePct}%`,boxShadow:`0 0 5px ${c.color}66`}}/></div>
                    <b style={{color:c.color,minWidth:32,textAlign:'right',fontFamily:'monospace'}}>{r.maxUsagePct}%</b>
                  </div>);}},
                {key:'hitLimits',label:'Limit Hit',render:r=><div style={{display:'flex',gap:3,flexWrap:'wrap'}}>{r.hitLimits?.map(l=><Badge key={l.field} color="#f97316" sm>{l.field} {l.pct}%</Badge>)}</div>},
              ]} rows={upsellCandidates}/>
          }
        </Card>
      </div>

      <div ref={refCrosssell}>
        <Card color="#0ea5e9">
          <SH title="Cross-sell Opportunities" sub="Features available in higher plans"/>
          {!crossSellOpps.length
            ? <Empty msg="No cross-sell opportunities right now" icon="🔗"/>
            : <DataTable cols={[
                {key:'name',label:'Organization',render:r=><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:26,height:26,borderRadius:7,background:avG(r.name),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>{(r.name||'?').charAt(0).toUpperCase()}</div><span style={{fontWeight:700}}>{r.name}</span></div>},
                {key:'currentPlan',label:'Plan',render:r=><Badge color={PLAN_COLOR[r.currentPlan]||'#6366f1'}>{r.currentPlan}</Badge>},
                {key:'missingFeatures',label:'Features to Unlock',render:r=><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{r.missingFeatures?.slice(0,3).map(f=><Badge key={f.key} color="#6366f1" sm>{f.label}</Badge>)}</div>},
              ]} rows={crossSellOpps}/>
          }
        </Card>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   TAB: FEATURES
══════════════════════════════════════ */
const TabFeatures = ({d}) => {
  if(!d) return <Spin/>;
  const {featureList=[],planMatrix=[],totalTenants=0}=d;
  const mx=Math.max(...featureList.map(f=>f.hits30d),1);
  const hasUsageData=featureList.some(f=>f.hits30d>0);
  return (
    <div style={{animation:'mFadeUp .35s ease'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        {/* Real Feature Usage */}
        <Card color="#f59e0b">
          <SH title="Real Feature Usage (Last 30 Days)" sub="Actual API hits from live tracking"/>
          {!hasUsageData ? (
            <div style={{textAlign:'center',padding:'32px 20px'}}>
              <div style={{fontSize:28,marginBottom:10,opacity:0.4}}>📡</div>
              <div style={{fontSize:12,fontWeight:700,color:'#1e293b',marginBottom:6}}>No activity recorded yet</div>
              <div style={{fontSize:11,color:'#64748b',lineHeight:1.6}}>
                This section tracks actual feature usage — how many times tenants used Lead Management, created deals, used email integration etc.<br/>
                <span style={{color:'#94a3b8',fontSize:10,marginTop:6,display:'block'}}>Data will appear automatically as tenants use the app.</span>
              </div>
            </div>
          ) : featureList.filter(f=>f.hits30d>0).map(f=>(
            <ProgressBar key={f.key} label={f.label} right={`${f.hits30d.toLocaleString()} hits · ${f.activeUsers} tenants`} value={f.hits30d} max={mx} color="#6366f1"/>
          ))}
        </Card>
        {/* Plan-Based Adoption */}
        <Card color="#10b981">
          <SH title="Plan-Based Adoption" sub={`Tenants whose plan includes each feature (of ${totalTenants} total)`}/>
          {featureList.map(f=><ProgressBar key={f.key} label={f.label} right={`${f.planAdoption}/${totalTenants}`} value={f.planAdoption} max={totalTenants||1} color="#10b981"/>)}
        </Card>
      </div>

      {/* Feature Matrix */}
      <Card color="#8b5cf6">
        <SH title="Feature → Plan Matrix" sub="Which features are included in each plan tier"/>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead>
              <tr>
                <th style={{background:'#1e293b',border:'1px solid #334155',padding:'7px 14px',fontSize:10,fontWeight:700,color:'#94a3b8',textAlign:'left',letterSpacing:'.5px',textTransform:'uppercase',minWidth:160}}>Feature</th>
                {planMatrix.map(p=>(
                  <th key={p.plan} style={{background:'#1e293b',border:'1px solid #334155',padding:'7px 16px',textAlign:'center',minWidth:100}}>
                    <div style={{fontSize:11,fontWeight:800,color:PLAN_COLOR[p.plan]||'#6366f1'}}>{p.plan}</div>
                    <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',marginTop:1}}>{p.tenants} tenants</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(FLABELS).map(([key,label],i)=>(
                <tr key={key} className="mRow" style={{background:i%2===0?'#fff':'#fafbfd'}}>
                  <td style={{border:'1px solid #e2e6eb',padding:'7px 14px',fontWeight:600,color:'#374151',fontSize:11}}>{label}</td>
                  {planMatrix.map(p=>(
                    <td key={p.plan} style={{border:'1px solid #e2e6eb',padding:'7px 12px',textAlign:'center'}}>
                      {p.features?.some(f=>f.key===key)
                        ? <span style={{color:'#10b981',fontSize:15,fontWeight:800}}>✓</span>
                        : <span style={{color:'#e2e8f0',fontSize:14}}>✕</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ══════════════════════════════════════
   TAB: SUBSCRIPTIONS
══════════════════════════════════════ */
const TabSubs = ({d}) => {
  const [filterStatus,setFilterStatus]=useState(null);
  const [filterPlan,setFilterPlan]=useState(null);
  const refRenewals=React.useRef(null);
  const refChanges=React.useRef(null);
  const scrollTo=ref=>ref.current?.scrollIntoView({behavior:'smooth',block:'start'});
  if(!d) return <Spin/>;
  const {statusBreakdown={},planDist={},upcomingRenewals=[],recentPlanChanges=[]}=d;
  const ms=Math.max(...Object.values(statusBreakdown),1);
  const CHANGE_COLOR={upgrade:'#10b981',downgrade:'#f59e0b',cancel:'#ef4444',new:'#6366f1',reactivate:'#0ea5e9',trial_end:'#94a3b8'};

  return (
    <div style={{animation:'mFadeUp .35s ease'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        {/* Status Breakdown */}
        <Card color="#6366f1">
          <SH title="Subscription Status" sub={filterStatus?`Filtered: ${filterStatus} — click to clear`:'Click status to filter renewals table'}/>
          {Object.entries(statusBreakdown).map(([s,c])=>(
            <div key={s} onClick={()=>{setFilterStatus(filterStatus===s?null:s);scrollTo(refRenewals);}}
              style={{cursor:'pointer',borderRadius:8,padding:'2px 6px',marginBottom:2,background:filterStatus===s?`${STATUS_COLOR[s]||'#6366f1'}12`:'transparent',transition:'background .15s'}}>
              <ProgressBar label={s.charAt(0).toUpperCase()+s.slice(1)} right={c} value={c} max={ms} color={STATUS_COLOR[s]||'#6366f1'}/>
            </div>
          ))}
        </Card>

        {/* Plan Distribution */}
        <Card color="#10b981">
          <SH title="Plan Distribution + Revenue" sub={filterPlan?`Filtered: ${filterPlan} — click to clear`:'Click plan to filter renewals'}/>
          {!Object.keys(planDist).length ? <Empty/> : Object.entries(planDist).map(([plan,data])=>(
            <div key={plan} onClick={()=>{setFilterPlan(filterPlan===plan?null:plan);scrollTo(refRenewals);}}
              style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',marginBottom:4,cursor:'pointer',borderRadius:10,border:`1px solid ${filterPlan===plan?(PLAN_COLOR[plan]||'#6366f1')+'44':'#f1f5f9'}`,background:filterPlan===plan?`${PLAN_COLOR[plan]||'#6366f1'}0d`:'#fafbfd',transition:'all .15s'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:PLAN_COLOR[plan]||'#6366f1',flexShrink:0}}/>
                <span style={{fontSize:12,fontWeight:700,color:'#1e293b'}}>{plan}</span>
                <Badge color={PLAN_COLOR[plan]||'#6366f1'} sm>{data.count}</Badge>
              </div>
              <span style={{fontSize:12,fontWeight:800,color:'#1e293b',fontFamily:'monospace'}}>{fmtM(data.revenue)}<span style={{fontSize:9,color:'#94a3b8',fontWeight:600}}>/mo</span></span>
            </div>
          ))}
        </Card>
      </div>

      {/* Upcoming Renewals */}
      <div ref={refRenewals}>
        <Card color="#f59e0b" style={{marginBottom:14}}>
          <SH title="Upcoming Renewals (Next 30 Days)"
            sub={filterPlan||filterStatus?`Filtered: ${[filterPlan,filterStatus].filter(Boolean).join(', ')} — click card to clear`:'Accounts renewing in the next 30 days'}
            action={<DlBtn onClick={()=>downloadCSV('upcoming-renewals.csv',upcomingRenewals,[{key:'name',label:'Organization'},{key:'plan',label:'Plan'},{key:'renewalDate',label:'Renewal Date',csvVal:r=>r.renewalDate?fmtD(r.renewalDate):''},{key:'amount',label:'Amount (₹)',csvVal:r=>r.amount||0}])}/>}/>
          <DataTable cols={[
            {key:'name',label:'Organization',render:r=><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:26,height:26,borderRadius:7,background:avG(r.name),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>{(r.name||'?').charAt(0).toUpperCase()}</div><span style={{fontWeight:700}}>{r.name}</span></div>},
            {key:'plan',label:'Plan',render:r=><Badge color={PLAN_COLOR[r.plan]||'#6366f1'}>{r.plan}</Badge>},
            {key:'renewalDate',label:'Renewal Date',render:r=>fmtD(r.renewalDate)},
            {key:'amount',label:'Amount',right:true,render:r=><b style={{fontFamily:'monospace',color:'#10b981'}}>{fmtM(r.amount)}</b>},
          ]} rows={upcomingRenewals.filter(r=>(!filterPlan||r.plan===filterPlan))} emptyMsg="No renewals in next 30 days"/>
        </Card>
      </div>

      {/* Recent Plan Changes */}
      <div ref={refChanges}>
        <Card color="#8b5cf6">
          <SH title="Recent Plan Changes" sub="Full audit trail — upgrades, downgrades, cancellations"
            action={<DlBtn onClick={()=>downloadCSV('plan-changes.csv',recentPlanChanges,[{key:'tenant',label:'Organization',csvVal:r=>r.tenant?.organizationName||''},{key:'changeType',label:'Type'},{key:'fromPlan',label:'From'},{key:'toPlan',label:'To'},{key:'reason',label:'Reason'},{key:'changedAt',label:'Date',csvVal:r=>fmtD(r.changedAt)}])}/>}/>
          <DataTable cols={[
            {key:'tenant',label:'Organization',render:r=>{const n=r.tenant?.organizationName||'—';return<div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:26,height:26,borderRadius:7,background:avG(n),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>{n.charAt(0).toUpperCase()}</div><span style={{fontWeight:700}}>{n}</span></div>;}},
            {key:'changeType',label:'Type',render:r=><Badge color={CHANGE_COLOR[r.changeType]||'#6366f1'}>{r.changeType}</Badge>},
            {key:'fromPlan',label:'From',render:r=><span style={{color:'#94a3b8'}}>{r.fromPlan||'—'}</span>},
            {key:'toPlan',label:'To',render:r=><b style={{color:'#1e293b'}}>{r.toPlan}</b>},
            {key:'reason',label:'Reason',render:r=><span style={{color:'#64748b',fontSize:11}}>{r.reason||'—'}</span>},
            {key:'changedAt',label:'Date',render:r=>fmtD(r.changedAt)},
          ]} rows={recentPlanChanges} emptyMsg="No plan changes yet"/>
        </Card>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   TAB: HEALTH
══════════════════════════════════════ */
const TabHealth = ({d}) => {
  const [filterSeg,setFilterSeg]=useState(null);
  const refTable=React.useRef(null);
  const scrollTo=ref=>ref.current?.scrollIntoView({behavior:'smooth',block:'start'});
  if(!d) return <Spin/>;
  const {segments={},tenants=[],total=0}=d;
  const filtered=filterSeg?tenants.filter(t=>t.segment===filterSeg):tenants;

  return (
    <div style={{animation:'mFadeUp .35s ease'}}>
      {/* Segment KPIs — compact pill row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        {['champion','healthy','at_risk','critical'].map((s,i)=>{
          const color=SEG_COLOR[s];
          const on=filterSeg===s;
          return(
            <div key={s} onClick={()=>{setFilterSeg(on?null:s);scrollTo(refTable);}}
              style={{background:'#fff',border:`1.5px solid ${on?color:'#e2e8f0'}`,borderLeft:`4px solid ${color}`,borderRadius:10,padding:'11px 14px',cursor:'pointer',boxShadow:on?`0 2px 10px ${color}25`:'0 1px 3px rgba(0,0,0,0.05)',transition:'all .15s ease'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:22,fontWeight:900,color:color,lineHeight:1,fontFamily:'monospace'}}>{segments[s]||0}</div>
                {on&&<span style={{fontSize:9,color:color,fontWeight:700,background:`${color}15`,padding:'1px 6px',borderRadius:10}}>filtered</span>}
              </div>
              <div style={{fontSize:11,fontWeight:700,color:'#475569',marginTop:5}}>{SEG_LABEL[s]}</div>
              <div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>of {total} total</div>
            </div>
          );
        })}
      </div>

      {/* Health Scores Table */}
      <div ref={refTable}>
        <Card color="#10b981">
          <SH title="Customer Health Scores"
            sub={filterSeg?`Showing: ${SEG_LABEL[filterSeg]} (${filtered.length}) — click card to clear`:'Score 0–100 based on activity, usage, feature adoption & tenure'}
            action={<DlBtn onClick={()=>downloadCSV('customer-health.csv',filtered,[{key:'name',label:'Organization'},{key:'plan',label:'Plan'},{key:'segment',label:'Health Segment',csvVal:r=>SEG_LABEL[r.segment]||r.segment},{key:'score',label:'Score'},{key:'activity30d',label:'Activity 30d',csvVal:r=>r.metrics?.activity30d||0},{key:'featuresUsed',label:'Features Used',csvVal:r=>r.metrics?.featuresUsed||0},{key:'lastActivity',label:'Last Active',csvVal:r=>r.lastActivity?fmtD(r.lastActivity):'Never'}])}/>}/>
          <DataTable cols={[
            {key:'name',label:'Organization',render:r=><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:26,height:26,borderRadius:7,background:avG(r.name),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>{(r.name||'?').charAt(0).toUpperCase()}</div><span style={{fontWeight:700}}>{r.name}</span></div>},
            {key:'plan',label:'Plan',render:r=><Badge color={PLAN_COLOR[r.plan]||'#6366f1'}>{r.plan}</Badge>},
            {key:'segment',label:'Health',render:r=><Badge color={SEG_COLOR[r.segment]}>{SEG_LABEL[r.segment]}</Badge>},
            {key:'score',label:'Score',right:true,render:r=>(
              <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}>
                <div style={{width:56,height:4,borderRadius:99,background:'#f1f5f9',overflow:'hidden'}}><div style={{height:'100%',background:SEG_COLOR[r.segment],width:`${r.score}%`,borderRadius:99,boxShadow:`0 0 5px ${SEG_COLOR[r.segment]}66`}}/></div>
                <b style={{minWidth:24,textAlign:'right',fontFamily:'monospace'}}>{r.score}</b>
              </div>
            )},
            {key:'activity30d',label:'Activity (30d)',render:r=><span style={{fontWeight:700,fontFamily:'monospace'}}>{r.metrics?.activity30d||0}</span>},
            {key:'featuresUsed',label:'Features',render:r=><span style={{fontWeight:700,fontFamily:'monospace'}}>{r.metrics?.featuresUsed||0}</span>},
            {key:'lastActivity',label:'Last Active',render:r=>r.lastActivity?fmtD(r.lastActivity):'Never'},
          ]} rows={filtered} emptyMsg="No tenants in this segment"/>
        </Card>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   ALERT BANNER
══════════════════════════════════════ */
const AlertBanner = ({alerts,onGoToUpsell,onDismiss}) => {
  if(!alerts?.length) return null;
  const critical=alerts.filter(a=>a.maxUsagePct>=90);
  const high=alerts.filter(a=>a.maxUsagePct>=70&&a.maxUsagePct<90);
  return (
    <div style={{background:'linear-gradient(135deg,#fff1f2,#fffbeb)',border:'1px solid #fecaca',borderRadius:14,padding:'14px 18px',marginBottom:16,borderLeft:'4px solid #ef4444'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
          <div style={{width:34,height:34,borderRadius:9,background:'#fef2f2',border:'1px solid #fecaca',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>🚨</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:800,color:'#9f1239',marginBottom:5}}>
              {critical.length>0&&`${critical.length} Critical`}
              {critical.length>0&&high.length>0&&' · '}
              {high.length>0&&`${high.length} High`}
              {' '}usage alert{alerts.length>1?'s':''} — tenants hitting plan limits
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {alerts.slice(0,6).map((a,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:5,background:'#fff',border:`1px solid ${a.maxUsagePct>=90?'#fca5a5':'#fed7aa'}`,borderRadius:7,padding:'3px 9px'}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:a.maxUsagePct>=90?'#ef4444':'#f97316',display:'inline-block'}}/>
                  <span style={{fontSize:11,fontWeight:700,color:'#1e293b'}}>{a.name}</span>
                  <span style={{fontSize:10,color:a.maxUsagePct>=90?'#ef4444':'#f97316',fontWeight:800,fontFamily:'monospace'}}>{a.maxUsagePct}%</span>
                </div>
              ))}
              {alerts.length>6&&<span style={{fontSize:11,color:'#94a3b8',alignSelf:'center'}}>+{alerts.length-6} more</span>}
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:6,flexShrink:0}}>
          <button onClick={onGoToUpsell} style={{padding:'7px 14px',borderRadius:8,border:'none',background:'#ef4444',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(239,68,68,0.35)'}}>View All →</button>
          <button onClick={onDismiss} style={{padding:'7px 10px',borderRadius:8,border:'1px solid #fecaca',background:'#fff',color:'#94a3b8',fontSize:11,cursor:'pointer'}}>✕</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN
══════════════════════════════════════ */
export default function Monetization(){
  const [tab,setTab]=useState('overview');
  const [data,setData]=useState({});
  const [loading,setLoading]=useState({});
  const [toast,setToast]=useState('');
  const [alertsDismissed,setAlertsDismissed]=useState(false);

  const showToast=m=>{setToast(m);setTimeout(()=>setToast(''),3500);};

  const load=useCallback(async(key,fn)=>{
    if(data[key]!==undefined||loading[key])return;
    setLoading(l=>({...l,[key]:true}));
    try{const r=await fn();setData(d=>({...d,[key]:r.data}));}
    catch(e){showToast('Error: '+(e.response?.data?.message||e.message));setData(d=>({...d,[key]:null}));}
    finally{setLoading(l=>({...l,[key]:false}));}
  },[data,loading]); // eslint-disable-line

  useEffect(()=>{load('upsell',svc.getUpsellCrosssell);},[]);// eslint-disable-line

  useEffect(()=>{
    if(tab==='overview')load('overview',svc.getOverview);
    if(tab==='revenue') load('revenue', svc.getRevenueAnalytics);
    if(tab==='churn')   load('churn',   svc.getChurnManagement);
    if(tab==='upsell')  load('upsell',  svc.getUpsellCrosssell);
    if(tab==='features')load('features',svc.getFeatureAnalytics);
    if(tab==='subs')    load('subs',    svc.getSubscriptionMetrics);
    if(tab==='health')  load('health',  svc.getHealthScores);
  },[tab]); // eslint-disable-line

  const alerts       = (data.upsell?.upsellCandidates||[]).filter(a=>a.maxUsagePct>=70).sort((a,b)=>b.maxUsagePct-a.maxUsagePct);
  const criticalCount= (data.upsell?.upsellCandidates||[]).filter(a=>a.maxUsagePct>=90).length;

  /* ticker data */
  const mrr    = data.overview?.mrr;
  const arr    = data.overview?.arr;
  const active = data.overview?.activeTenants;
  const total  = data.overview?.totalTenants;
  const churn  = data.overview?.churnRate;
  const newMo  = data.overview?.newThisMonth;
  const tickerItems = [
    `● MRR ${mrr!==undefined?fmtM(mrr):'—'}`,
    `● ARR ${arr!==undefined?fmtM(arr):'—'}`,
    `● Active ${active!==undefined?active:'—'}/${total!==undefined?total:'—'}`,
    `● Churn Rate ${churn!==undefined?pct(churn):'—'}`,
    `● New (30d) ${newMo!==undefined?`+${newMo}`:'—'}`,
    `● Upsell Alerts ${alerts.length}`,
    `● Critical ${criticalCount}`,
  ];

  return(
    <SaasLayout>
      <style>{CSS}</style>

      {/* Toast */}
      {toast&&<div style={{position:'fixed',top:20,right:20,zIndex:3000,background:'#1e293b',color:'#fff',padding:'11px 20px',borderRadius:10,fontSize:12,fontWeight:700,boxShadow:'0 8px 24px rgba(0,0,0,0.25)',animation:'mFadeUp .2s ease'}}>{toast}</div>}

      {/* ══ HERO HEADER ══ */}
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',marginBottom:16,border:'1px solid rgba(255,255,255,0.07)'}}>
        {/* bg */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#060d1f 0%,#0f172a 45%,#0d1b4b 100%)',pointerEvents:'none'}}/>
        {/* animated orbs */}
        <div style={{position:'absolute',top:-60,left:'15%',width:280,height:280,background:'radial-gradient(circle,rgba(99,102,241,0.18),transparent 65%)',animation:'mOrb 11s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-50,right:'10%',width:220,height:220,background:'radial-gradient(circle,rgba(16,185,129,0.13),transparent 65%)',animation:'mOrb2 15s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'5%',right:'30%',width:160,height:160,background:'radial-gradient(circle,rgba(236,72,153,0.09),transparent 65%)',animation:'mOrb 9s ease-in-out infinite 3s',pointerEvents:'none'}}/>
        {/* grid */}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)',backgroundSize:'40px 40px',pointerEvents:'none'}}/>
        {/* scan line */}
        <div style={{position:'absolute',left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),rgba(16,185,129,0.5),transparent)',animation:'mScan 4.5s ease-in-out infinite',pointerEvents:'none',zIndex:1}}/>

        {/* ticker */}
        <div style={{borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'4px 0',overflow:'hidden',position:'relative'}}>
          <div style={{display:'flex',whiteSpace:'nowrap',animation:'mTicker 22s linear infinite',width:'200%'}}>
            {[0,1].map(ri=>(
              <div key={ri} style={{display:'flex',gap:0,flex:'0 0 50%'}}>
                {tickerItems.map((t,i)=>(
                  <span key={i} style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontFamily:'monospace',letterSpacing:1.5,padding:'0 22px',borderRight:'1px solid rgba(255,255,255,0.06)'}}>{t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'stretch'}}>
          {/* Brand */}
          <div style={{padding:'16px 22px',borderRight:'1px solid rgba(255,255,255,0.06)',flexShrink:0,display:'flex',flexDirection:'column',justifyContent:'center',gap:6,minWidth:200}}>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <div style={{position:'relative'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981'}}/>
                <div style={{position:'absolute',inset:-2,borderRadius:'50%',background:'#10b981',opacity:0.3,animation:'mPing 1.8s ease-out infinite'}}/>
              </div>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.35)',fontFamily:'monospace',letterSpacing:2,textTransform:'uppercase'}}>Live · SaaS Console</span>
            </div>
            <div style={{fontSize:20,fontWeight:900,color:'#fff',letterSpacing:-0.5,lineHeight:1.2}}>
              Sales{' '}
              <span style={{background:'linear-gradient(90deg,#a78bfa,#34d399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'mFloat 4s ease-in-out infinite',display:'inline-block'}}>Monetization</span>
            </div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.22)',fontFamily:'monospace',lineHeight:1.4}}>Revenue · Churn · Upsell · Features</div>
          </div>

          {/* Live metric tiles */}
          {[
            {l:'Monthly Revenue', v:mrr!==undefined?fmtF(mrr):'—', sub:mrr!==undefined?fmtM(mrr)+'/mo':'loading…', c:'#10b981'},
            {l:'Annual Run Rate',  v:arr!==undefined?fmtF(arr):'—', sub:arr!==undefined?fmtM(arr)+'/yr':'loading…', c:'#6366f1'},
            {l:'Active Tenants',   v:active!==undefined?active:'—', sub:total!==undefined?`of ${total} total`:'loading…', c:'#f59e0b'},
            {l:'Upsell Alerts',    v:alerts.length,                  sub:criticalCount>0?`${criticalCount} critical`:'All good', c:criticalCount>0?'#ef4444':'#10b981'},
          ].map((m,i)=>(
            <React.Fragment key={i}>
              <div style={{width:1,background:'rgba(255,255,255,0.05)',flexShrink:0}}/>
              <div style={{flex:1,padding:'14px 20px',position:'relative',overflow:'hidden',minWidth:0,cursor:'default'}}>
                <div style={{position:'absolute',top:0,right:0,width:70,height:70,background:`radial-gradient(circle at 100% 0%,${m.c}1e,transparent 70%)`,pointerEvents:'none'}}/>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',fontWeight:600,letterSpacing:0.6,marginBottom:5,textTransform:'uppercase'}}>{m.l}</div>
                <div style={{fontSize:20,fontWeight:900,color:'#fff',fontFamily:'monospace',letterSpacing:-0.8,lineHeight:1,marginBottom:5}}>{m.v}</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:9,color:'rgba(255,255,255,0.22)'}}>{m.sub}</span>
                </div>
                <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${m.c}88,transparent)`}}/>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Alert Banner */}
      {!alertsDismissed&&<AlertBanner alerts={alerts} onGoToUpsell={()=>{setTab('upsell');setAlertsDismissed(false);}} onDismiss={()=>setAlertsDismissed(true)}/>}

      {/* ══ TAB BAR ══ */}
      <div style={{display:'flex',gap:3,marginBottom:20,flexWrap:'wrap',background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'6px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        {TABS.map(t=>{
          const isActive=tab===t.id;
          const showBadge=t.id==='upsell'&&criticalCount>0;
          return(
            <button key={t.id} className="mTabBtn" onClick={()=>setTab(t.id)} style={{
              position:'relative',padding:'8px 16px',borderRadius:9,fontSize:12,fontWeight:700,
              background:isActive?`linear-gradient(135deg,#1e1b4b,#312e81)`:'transparent',
              color:isActive?'#fff':'#64748b',
              boxShadow:isActive?'0 2px 12px rgba(30,27,75,0.4)':'none',
            }}>
              {isActive&&<div style={{position:'absolute',top:0,left:'20%',right:'20%',height:1,background:`linear-gradient(90deg,transparent,${t.color},transparent)`}}/>}
              {t.label}
              {showBadge&&<span style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:'#ef4444',color:'#fff',fontSize:9,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff',boxShadow:'0 0 6px rgba(239,68,68,0.6)'}}>{criticalCount}</span>}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab==='overview'&&<TabOverview d={loading.overview?null:data.overview} onTabChange={setTab}/>}
      {tab==='revenue' &&<TabRevenue  d={loading.revenue ?null:data.revenue}/>}
      {tab==='churn'   &&<TabChurn    d={loading.churn   ?null:data.churn}/>}
      {tab==='upsell'  &&<TabUpsell   d={loading.upsell  ?null:data.upsell}/>}
      {tab==='features'&&<TabFeatures d={loading.features?null:data.features}/>}
      {tab==='subs'    &&<TabSubs     d={loading.subs    ?null:data.subs}/>}
      {tab==='health'  &&<TabHealth   d={loading.health  ?null:data.health}/>}
    </SaasLayout>
  );
}
