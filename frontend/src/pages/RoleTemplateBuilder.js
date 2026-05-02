import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import * as svc from '../services/roleTemplateService';

/* ── Constants ─────────────────────────────────────────── */
const TYPE_META = { company:'🏢', division:'🏬', department:'📂', team:'👥', role:'💼', person:'👤' };
const TYPES = Object.keys(TYPE_META);
const LEVEL_COLORS = ['#7c3aed','#0ea5e9','#10b981','#f59e0b','#ec4899','#f97316','#6366f1','#14b8a6'];
const lc  = (lvl) => LEVEL_COLORS[(lvl ?? 0) % LEVEL_COLORS.length];
const uid = () => Math.random().toString(36).slice(2, 8);

/* ── UI Helpers ─────────────────────────────────────────── */
const Btn = ({ onClick, color = '#6366f1', children, disabled, outline, full }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: '9px 20px', borderRadius: 10,
    border: outline ? `1.5px solid ${color}` : 'none',
    background: disabled ? '#f1f5f9' : outline ? 'transparent' : color,
    color: disabled ? '#94a3b8' : outline ? color : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13, fontWeight: 700, width: full ? '100%' : undefined,
  }}>{children}</button>
);

const Toast = ({ msg }) => msg ? (
  <div style={{ position:'fixed', top:20, right:20, background:'#0f172a', color:'#fff', padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:700, zIndex:2000 }}>
    {msg}
  </div>
) : null;

const Steps = ({ active }) => (
  <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:24 }}>
    {['Define Roles', 'Preview & Generate'].map((s, i) => (
      <React.Fragment key={i}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background: i <= active ? '#6366f1' : '#e2e8f0', color: i <= active ? '#fff' : '#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800 }}>{i + 1}</div>
          <div style={{ fontSize:11, fontWeight:700, color: i === active ? '#6366f1' : '#94a3b8', whiteSpace:'nowrap' }}>{s}</div>
        </div>
        {i < 1 && <div style={{ flex:1, height:2, background: i < active ? '#6366f1' : '#e2e8f0', margin:'0 8px', marginBottom:18 }} />}
      </React.Fragment>
    ))}
  </div>
);

/* ── Single Role Row ─────────────────────────────────────── */
const RoleRow = ({ role, index, total, allRoles, onChange, onDelete, onMoveUp, onMoveDown }) => {
  const [open, setOpen] = useState(false);
  const color = lc(role.level ?? index);

  return (
    <div style={{ border: `1.5px solid ${color}30`, borderRadius: 14, marginBottom: 8, background: '#fff', overflow: 'hidden' }}>
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .roletemp-grid4,.roletemp-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .roletemp-grid2{grid-template-columns:1fr!important;}
    .roletemp-split{flex-direction:column!important;}
    .roletemp-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .roletemp-panel{width:100%!important;}
    .roletemp-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .roletemp-form-row{grid-template-columns:1fr!important;}
    .roletemp-hide{display:none!important;}
  }
  @media(max-width:480px){
    .roletemp-grid4,.roletemp-grid3,.roletemp-grid2{grid-template-columns:1fr!important;}
  }
`}</style>

      {/* Collapsed header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ width:28, height:28, borderRadius:8, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color, flexShrink:0 }}>
          L{role.level ?? index}
        </div>
        <span style={{ fontSize:16 }}>{TYPE_META[role.type] || '💼'}</span>
        <span style={{ fontSize:13, fontWeight:800, color:'#0f172a', flex:1 }}>{role.roleName || <span style={{ color:'#94a3b8' }}>Unnamed Role</span>}</span>

        {role.parentRoleId && (
          <span style={{ fontSize:10, color:'#6366f1', background:'#eef2ff', padding:'2px 8px', borderRadius:20, border:'1px solid #c7d2fe' }}>
            ↑ {allRoles.find(r => r.roleId === role.parentRoleId)?.roleName || '?'}
          </span>
        )}
        {role.keywords?.length > 0 && (
          <span style={{ fontSize:10, color:'#94a3b8' }}>{role.keywords.length} keyword{role.keywords.length > 1 ? 's' : ''}</span>
        )}

        {/* Move + Delete */}
        <div style={{ display:'flex', gap:4 }} onClick={e => e.stopPropagation()}>
          <button onClick={onMoveUp}   disabled={index === 0}       style={abtn}>↑</button>
          <button onClick={onMoveDown} disabled={index === total-1} style={abtn}>↓</button>
          <button onClick={onDelete}   style={{ ...abtn, color:'#f43f5e', background:'#fff1f2', borderColor:'#fecaca' }}>✕</button>
        </div>
        <span style={{ fontSize:12, color:'#94a3b8', marginLeft:4 }}>{open ? '▾' : '▸'}</span>
      </div>

      {/* Expanded fields */}
      {open && (
        <div style={{ padding:'0 14px 16px', borderTop:'1px solid #f1f5f9', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:12 }}>
          <div>
            <label style={lbl}>Role Name *</label>
            <input value={role.roleName} onChange={e => onChange('roleName', e.target.value)}
              style={inp} placeholder="e.g. Chief Executive Officer" />
          </div>
          <div>
            <label style={lbl}>Level <span style={{ fontWeight:400, color:'#94a3b8' }}>(0 = top)</span></label>
            <input type="number" min="0" value={role.level ?? 0} onChange={e => onChange('level', parseInt(e.target.value) || 0)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Type</label>
            <select value={role.type} onChange={e => onChange('type', e.target.value)} style={inp}>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t]} {t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Reports Under <span style={{ fontWeight:400, color:'#94a3b8' }}>(parent role)</span></label>
            <select value={role.parentRoleId || ''} onChange={e => onChange('parentRoleId', e.target.value || null)} style={inp}>
              <option value="">— Top Level —</option>
              {allRoles.filter(r => r.roleId !== role.roleId).map(r => (
                <option key={r.roleId} value={r.roleId}>{TYPE_META[r.type]} {r.roleName} (L{r.level})</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lbl}>
              Match Keywords <span style={{ fontWeight:400, color:'#94a3b8' }}>— comma separated, used to match lead designations automatically</span>
            </label>
            <input
              value={(role.keywords || []).join(', ')}
              onChange={e => onChange('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
              style={inp} placeholder="e.g. ceo, chief executive, managing director, md" />
          </div>
        </div>
      )}
    </div>
  );
};

const lbl = { fontSize:11, fontWeight:700, color:'#475569', display:'block', marginBottom:4 };
const inp = { width:'100%', padding:'8px 11px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box', background:'#fff' };
const abtn = { width:24, height:24, border:'1px solid #e2e8f0', background:'#f8fafc', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:700, color:'#475569', padding:0 };

/* ── Main Page ──────────────────────────────────────────── */
export default function RoleTemplateBuilder() {
  const [step, setStep]           = useState(0);
  const [roles, setRoles]         = useState([]);
  const [tplName, setTplName]     = useState('Default Hierarchy Template');
  const [preview, setPreview]     = useState(null);
  const [genResult, setGenResult] = useState(null);
  const [clearExisting, setClear] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  // Load existing template on mount
  useEffect(() => {
    svc.getTemplate().then(r => {
      const t = r.data?.template;
      if (t) { setRoles(t.roles || []); setTplName(t.templateName || ''); }
    }).catch(() => {});
  }, []);

  /* ── Role helpers ── */
  const addRole = () => setRoles(r => [...r, {
    roleId: `role_${uid()}`, roleName: '', level: r.length,
    type: 'role', parentRoleId: null, keywords: [], order: r.length,
  }]);
  const upd  = (idx, k, v) => setRoles(r => r.map((ro, i) => i === idx ? { ...ro, [k]: v } : ro));
  const del  = (idx)        => setRoles(r => r.filter((_, i) => i !== idx));
  const up   = (idx)        => { if (!idx) return; setRoles(r => { const a=[...r]; [a[idx-1],a[idx]]=[a[idx],a[idx-1]]; return a; }); };
  const down = (idx)        => { if (idx >= roles.length-1) return; setRoles(r => { const a=[...r]; [a[idx],a[idx+1]]=[a[idx+1],a[idx]]; return a; }); };

  const saveAndPreview = async () => {
    if (!roles.length) return showToast('Add at least one role first');
    setLoading(true);
    try {
      await svc.saveTemplate({ templateName: tplName, roles });
      const res = await svc.previewMatch({});
      setPreview(res.data);
      setStep(1);
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)); }
    finally { setLoading(false); }
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await svc.generateTree({ clearExisting });
      setGenResult(res.data);
      showToast('Tree generated! ✓');
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Toast msg={toast} />

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0f0c29,#1e1654,#0d1b4b)', borderRadius:20, padding:'22px 28px', marginBottom:24 }}>
        <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.3)', letterSpacing:'2px', textTransform:'uppercase' }}>Organization</div>
        <div style={{ fontSize:22, fontWeight:900, color:'#fff', marginTop:4 }}>
          Role <span style={{ background:'linear-gradient(90deg,#a78bfa,#67e8f9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Template Builder</span>
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>
          Define roles top to bottom → preview match → auto-generate org tree from leads
        </div>
      </div>

      <Steps active={step} />

      {/* ══ STEP 0: Define Roles ══ */}
      {step === 0 && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:900, color:'#0f172a' }}>Define Your Role Hierarchy</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>
                Add roles from top to bottom. Use keywords so the system can match lead designations automatically.
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input value={tplName} onChange={e => setTplName(e.target.value)}
                style={{ padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, outline:'none', width:210 }}
                placeholder="Template name" />
              <Btn color="#10b981" onClick={addRole}>+ Add Role</Btn>
            </div>
          </div>

          {/* Level guide */}
          {roles.length > 0 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
              {[...new Set(roles.map(r => r.level ?? 0))].sort().map(lvl => (
                <div key={lvl} style={{ display:'flex', alignItems:'center', gap:5, background:'#fff', border:`1px solid ${lc(lvl)}33`, borderRadius:8, padding:'4px 10px' }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:lc(lvl) }} />
                  <span style={{ fontSize:11, fontWeight:700, color:'#475569' }}>
                    Level {lvl}: {roles.filter(r => (r.level ?? 0) === lvl).length} role(s)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {roles.length === 0 && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'60px 20px', background:'#fff', borderRadius:16, border:'2px dashed #e0e7ff' }}>
              <div style={{ fontSize:52 }}>🏗️</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#475569' }}>No roles defined yet</div>
              <div style={{ fontSize:12, color:'#94a3b8', textAlign:'center', maxWidth:380 }}>
                Start with Level 0 (CEO / Company), then add roles below it level by level.
              </div>
              <Btn onClick={addRole}>+ Add First Role</Btn>
            </div>
          )}

          {/* Role list */}
          {roles.map((role, idx) => (
            <RoleRow key={role.roleId} role={role} index={idx} total={roles.length} allRoles={roles}
              onChange={(k, v) => upd(idx, k, v)}
              onDelete={() => del(idx)}
              onMoveUp={() => up(idx)} onMoveDown={() => down(idx)} />
          ))}

          {roles.length > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20 }}>
              <Btn outline color="#10b981" onClick={addRole}>+ Add Role</Btn>
              <Btn onClick={saveAndPreview} disabled={loading || !roles.length}>
                {loading ? 'Loading…' : 'Save & Preview Match →'}
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* ══ STEP 1: Preview & Generate ══ */}
      {step === 1 && preview && (
        <div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:900, color:'#0f172a' }}>Preview Match Results</div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>
              System auto-detected designation, name, email and phone from your leads.
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:12, marginBottom:20 }}>
            {[
              { l:'Total Leads',  v: preview.totalLeads,    c:'#6366f1' },
              { l:'Matched',      v: preview.totalMatched,  c:'#10b981' },
              { l:'Unmatched',    v: preview.unmatchedCount,c:'#f43f5e' },
              { l:'Match Rate',   v: preview.totalLeads > 0 ? `${Math.round(preview.totalMatched/preview.totalLeads*100)}%` : '0%', c:'#f59e0b' },
            ].map(s => (
              <div key={s.l} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', border:'1px solid #f1f5f9' }}>
                <div style={{ fontSize:22, fontWeight:900, color:'#0f172a' }}>{typeof s.v === 'number' ? s.v.toLocaleString() : s.v}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Per-role breakdown */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:20, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:12 }}>Role Breakdown</div>
            {Object.entries(preview.matchCounts || {}).map(([rid, data], i) => (
              <div key={rid} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:26, height:26, borderRadius:8, background:`${lc(data.level)}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:lc(data.level), flexShrink:0 }}>
                  L{data.level}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, marginBottom:3 }}>
                    <span style={{ color:'#0f172a' }}>{data.roleName}</span>
                    <span style={{ color:'#0f172a' }}>{data.count.toLocaleString()} leads</span>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:'#f1f5f9', overflow:'hidden' }}>
                    <div style={{ height:'100%', background:lc(i), borderRadius:3, width:`${preview.totalLeads > 0 ? Math.min(100,(data.count/preview.totalLeads)*100) : 0}%`, transition:'width .4s' }} />
                  </div>
                  {data.sample?.length > 0 && (
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>e.g. {data.sample.join(', ')}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Unmatched hint */}
          {preview.unmatchedSample?.length > 0 && (
            <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:14, marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#c2410c', marginBottom:6 }}>
                ⚠️ {preview.unmatchedCount} leads unmatched — add these as keywords to fix
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {preview.unmatchedSample.map((d, i) => (
                  <span key={i} style={{ fontSize:10, padding:'2px 8px', background:'#fff', border:'1px solid #fed7aa', borderRadius:20, color:'#78716c' }}>{d}</span>
                ))}
              </div>
            </div>
          )}

          {/* Clear option */}
          <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:14, marginBottom:16 }}>
            <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }}>
              <input type="checkbox" checked={clearExisting} onChange={e => setClear(e.target.checked)} style={{ marginTop:2 }} />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#475569' }}>Clear existing org tree before generating</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>Recommended on first run or when re-importing leads</div>
              </div>
            </label>
          </div>

          {/* Success result */}
          {genResult && (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#15803d', marginBottom:8 }}>✅ Org Tree Generated!</div>
              <div style={{ display:'flex', gap:20, fontSize:12, color:'#166534', flexWrap:'wrap' }}>
                <span>📊 {genResult.totalLeads?.toLocaleString()} leads</span>
                <span>✓ {genResult.matched?.toLocaleString()} matched</span>
                <span>⚠️ {genResult.unmatched?.toLocaleString()} unmatched</span>
                <span>🌳 {genResult.totalNodes?.toLocaleString()} total nodes</span>
              </div>
              <a href="/org-hierarchy" style={{ display:'inline-block', marginTop:10, padding:'8px 18px', background:'#16a34a', color:'#fff', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none' }}>
                View Org Hierarchy →
              </a>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
            <Btn outline color="#94a3b8" onClick={() => setStep(0)}>← Edit Roles</Btn>
            <Btn color="#10b981" onClick={generate} disabled={loading}>
              {loading ? 'Generating…' : `🚀 Generate Tree (${preview.totalLeads?.toLocaleString()} leads)`}
            </Btn>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
