import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { tenantGetOverview } from '../services/monetizationService';

const fmt  = n => n >= 1e6 ? `₹${(n/1e6).toFixed(1)}M` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n||0}`;
const pct  = n => `${n||0}%`;

const STAGE_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#14b8a6'];

const StatCard = ({ icon, label, value, sub, color='#6366f1' }) => (
  <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
    <div style={{ width:40, height:40, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:10 }}>{icon}</div>
    <div style={{ fontSize:24, fontWeight:900, color:'#0f172a', lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:12, fontWeight:600, color:'#64748b', marginTop:4 }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{sub}</div>}
  </div>
);

const BarChart = ({ data, valueKey, labelKey, color='#6366f1', height=120 }) => {
  if (!data?.length) return <div style={{ color:'#94a3b8', fontSize:12, padding:20 }}>No data yet</div>;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height, padding:'0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, height:'100%', justifyContent:'flex-end' }}>
          <div style={{ width:'100%', background:color, borderRadius:'4px 4px 0 0', height:`${((d[valueKey]||0)/max)*100}%`, minHeight:2, opacity:0.85 }} />
          <div style={{ fontSize:8, color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:32, textAlign:'center' }}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
};

const Spin = () => (
  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:200 }}>
    <div style={{ width:36, height:36, border:'3px solid #e0e7ff', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const PLATFORM_ICONS = { youtube:'▶️', linkedin:'🔗', facebook:'📘', instagram:'📷', twitter:'🐦' };
const PLATFORM_COLORS = { youtube:'#ff0000', linkedin:'#0077b5', facebook:'#1877f2', instagram:'#e1306c', twitter:'#1da1f2' };

const TenantMonetization = () => {
  const [overview, setOverview]   = useState(null);
  const [social, setSocial]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('overview');

  useEffect(() => {
    Promise.all([
      tenantGetOverview().then(d => setOverview(d.data || d)),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><Spin /></DashboardLayout>;

  const TABS = [
    { id:'overview', label:'Overview',     icon:'📊' },
    { id:'pipeline', label:'Sales Pipeline', icon:'🎯' },
    { id:'social',   label:'Social Media',  icon:'📱' },
  ];

  return (
    <DashboardLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .mt-tab:hover{background:#f1f5f9 !important}`}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0f0c29 0%,#1e1654 50%,#0d1b4b 100%)', borderRadius:20, padding:'24px 28px', marginBottom:20, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.25),transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.3)', letterSpacing:'2px', textTransform:'uppercase' }}>Sales Intelligence</div>
          <div style={{ fontSize:26, fontWeight:900, color:'#fff', marginTop:4 }}>
            Sales <span style={{ background:'linear-gradient(90deg,#a78bfa,#67e8f9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Monetization</span>
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>Your revenue · Pipeline · Social performance</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} className="mt-tab" onClick={() => setTab(t.id)} style={{
            display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
            borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
            background: tab === t.id ? '#6366f1' : '#fff',
            color:      tab === t.id ? '#fff'    : '#475569',
            boxShadow:  tab === t.id ? '0 4px 14px rgba(99,102,241,0.3)' : '0 1px 3px rgba(0,0,0,0.07)',
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:16 }}>
            <StatCard icon="💰" label="Won Revenue"       value={fmt(overview?.wonRevenue)}      color="#10b981" />
            <StatCard icon="🎯" label="Pipeline Value"    value={fmt(overview?.pipelineValue)}   sub={`${overview?.openDeals||0} open deals`} color="#6366f1" />
            <StatCard icon="📊" label="Win Rate"          value={pct(overview?.winRate)}         color="#f59e0b" />
            <StatCard icon="🔄" label="Lead Conversion"   value={pct(overview?.conversionRate)}  sub={`${overview?.convertedLeads||0} converted`} color="#0ea5e9" />
            <StatCard icon="👥" label="Total Leads"       value={overview?.totalLeads||0}        color="#7c3aed" />
            <StatCard icon="👤" label="Team Members"      value={overview?.totalMembers||0}      color="#14b8a6" />
          </div>

          {/* Plan Usage vs Limits — real data */}
          {overview?.planLimits && (
            <div style={{ background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:16 }}>📦 Plan Usage vs Limits</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
                {Object.entries(overview.planLimits).map(([key, data]) => {
                  const pctUsed = data.max === -1 ? 0 : data.max > 0 ? (data.used / data.max) * 100 : 0;
                  const barColor = pctUsed >= 90 ? '#f43f5e' : pctUsed >= 75 ? '#f97316' : pctUsed >= 50 ? '#f59e0b' : '#10b981';
                  return (
                    <div key={key}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, marginBottom:6 }}>
                        <span style={{ color:'#475569', textTransform:'capitalize' }}>{key}</span>
                        <span style={{ color:'#0f172a' }}>{data.used} / {data.max === -1 ? '∞' : data.max}</span>
                      </div>
                      <div style={{ height:8, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.min(100, data.max === -1 ? 10 : pctUsed)}%`, background:barColor, borderRadius:4, transition:'width 0.4s' }} />
                      </div>
                      {data.max !== -1 && <div style={{ fontSize:10, color:barColor, fontWeight:700, marginTop:3 }}>{pctUsed.toFixed(0)}% used</div>}
                      {data.max === -1 && <div style={{ fontSize:10, color:'#10b981', fontWeight:700, marginTop:3 }}>Unlimited</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly Revenue Trend */}
          <div style={{ background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:16 }}>Monthly Revenue Trend</div>
            <BarChart data={overview?.monthlyRevenue} valueKey="revenue" labelKey="label" color="#6366f1" height={140} />
          </div>

          {/* Lead Sources */}
          {Object.keys(overview?.bySource || {}).length > 0 && (
            <div style={{ background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:16 }}>Lead Sources</div>
              {Object.entries(overview.bySource).sort((a,b) => b[1]-a[1]).slice(0,6).map(([src, count], i) => (
                <div key={src} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, marginBottom:4 }}>
                    <span style={{ color:'#475569', display:'flex', alignItems:'center', gap:6 }}>
                      <span>{src?.toLowerCase().includes('youtube')?'▶️':src?.toLowerCase().includes('linkedin')?'🔗':src?.toLowerCase().includes('facebook')?'📘':'🌐'}</span>
                      {src}
                    </span>
                    <span style={{ color:'#0f172a' }}>{count}</span>
                  </div>
                  <div style={{ height:8, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
                    <div style={{ height:'100%', background:STAGE_COLORS[i%STAGE_COLORS.length], borderRadius:4, width:`${(count/Math.max(...Object.values(overview.bySource)))*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Pipeline Tab ── */}
      {tab === 'pipeline' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:16 }}>
            <StatCard icon="✅" label="Won Deals"   value={overview?.wonDeals||0}  color="#10b981" />
            <StatCard icon="❌" label="Lost Deals"  value={overview?.lostDeals||0} color="#f43f5e" />
            <StatCard icon="🔄" label="Open Deals"  value={overview?.openDeals||0} color="#f59e0b" />
            <StatCard icon="📊" label="Win Rate"    value={pct(overview?.winRate)}  color="#6366f1" />
          </div>

          <div style={{ background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:16 }}>Deals by Stage</div>
            {Object.entries(overview?.byStage || {}).map(([stage, data], i) => (
              <div key={stage} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, marginBottom:4 }}>
                  <span style={{ color:'#475569' }}>{stage}</span>
                  <span style={{ color:'#0f172a' }}>{data.count} deals · {fmt(Math.round(data.value))}</span>
                </div>
                <div style={{ height:8, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
                  <div style={{ height:'100%', background:STAGE_COLORS[i%STAGE_COLORS.length], borderRadius:4, width:`${Math.min(100,(data.count/Math.max(overview?.totalDeals||1,1))*100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Social Tab ── */}
      {tab === 'social' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {(social?.accounts || []).length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'60px 20px', background:'#fff', borderRadius:16, border:'2px dashed #e0e7ff' }}>
              <div style={{ fontSize:48 }}>📱</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#475569' }}>No social accounts connected</div>
              <div style={{ fontSize:12, color:'#94a3b8' }}>Connect from Social Media settings</div>
              <a href="/social-media" style={{ padding:'8px 20px', background:'#6366f1', color:'#fff', borderRadius:10, fontSize:12, fontWeight:700, textDecoration:'none' }}>Connect Now →</a>
            </div>
          ) : (
            (social.accounts || []).map(acc => (
              <div key={acc._id} style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:52, height:52, borderRadius:16, background:`${PLATFORM_COLORS[acc.platform]||'#6366f1'}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
                  {PLATFORM_ICONS[acc.platform]||'📱'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{acc.accountName || acc.platform}</div>
                  <div style={{ fontSize:11, color:'#94a3b8', textTransform:'capitalize', marginTop:2 }}>{acc.platform}</div>
                </div>
                <div style={{ display:'flex', gap:20 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:900, color:'#0f172a' }}>{(acc.followers||0).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>Followers</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:900, color:'#0f172a' }}>{(acc.totalPosts||0).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>Posts</div>
                  </div>
                </div>
                <div style={{ padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>✅ Connected</div>
              </div>
            ))
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default TenantMonetization;
