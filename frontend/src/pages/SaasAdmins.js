import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api.config';
import SaasLayout, { useWindowSize } from '../components/layout/SaasLayout';

/* ─── constants ─────────────────────────────────────────────────────────────── */
const ROLE_META = {
  primary: { label:'Primary Owner', color:'#6366f1', bg:'#eef2ff', border:'#c7d2fe' },
  manager: { label:'Manager',       color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  admin:   { label:'Admin',         color:'#0891b2', bg:'#ecfeff', border:'#a5f3fc' },
};
const getRole = a => a.isPrimary ? ROLE_META.primary : a.saasRole === 'Manager' ? ROLE_META.manager : ROLE_META.admin;

const AVATAR_COLORS = ['#6366f1','#0891b2','#059669','#d97706','#db2777','#7c3aed','#0284c7','#16a34a'];
const avatarColor = name => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = a => `${a.firstName?.[0] || ''}${a.lastName?.[0] || ''}`.toUpperCase() || '??';

const inp = {
  width: '100%', padding: '8px 11px', border: '1px solid #d1d5db',
  borderRadius: 6, fontSize: 13, color: '#111827', background: '#fff',
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const FILTER_TABS = [
  { k: 'all',      label: 'All' },
  { k: 'admin',    label: 'Admins' },
  { k: 'manager',  label: 'Managers' },
  { k: 'active',   label: 'Active' },
  { k: 'inactive', label: 'Inactive' },
];

const matchFilter = (a, k) => {
  if (k === 'all')      return true;
  if (k === 'admin')    return !a.isPrimary && a.saasRole !== 'Manager';
  if (k === 'manager')  return a.saasRole === 'Manager' && !a.isPrimary;
  if (k === 'active')   return a.isActive;
  if (k === 'inactive') return !a.isActive;
  return true;
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─── SVG icons ─────────────────────────────────────────────────────────────── */
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="#9ca3af" strokeWidth="1.4"/><path d="M10 10l2.5 2.5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IconKey = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const IconBan = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M6.34 6.34l11.32 11.32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconShield = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7l-9-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
const IconClose = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
const IconRefresh = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconEye    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

/* ─── component ─────────────────────────────────────────────────────────────── */
export default function SaasAdmins() {
  const { isMobile, isTablet } = useWindowSize();
  const [admins, setAdmins]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [checking, setChecking]     = useState(true);
  const [isPrimary, setIsPrimary]   = useState(false);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [panel, setPanel]           = useState(null); // null | 'add' | 'edit' | 'reset'
  const [target, setTarget]         = useState(null);
  const [editForm, setEditForm]     = useState({ firstName:'', lastName:'', saasRole:'Admin', isActive:true });
  const [showPwd, setShowPwd]         = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [form, setForm]             = useState({ firstName:'', lastName:'', email:'', password:'', saasRole:'Admin' });
  const [copied, setCopied]         = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [busy, setBusy]             = useState(false);

  const auth = () => { const t = sessionStorage.getItem('token') || localStorage.getItem('token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

  useEffect(() => {
    (async () => {
      try {
        setChecking(true);
        const r = await axios.get(`${API_URL}/saas-admins/me`, { headers: auth() });
        const ok = r.data?.data?.user?.isPrimary || false;
        setIsPrimary(ok);
        if (ok) {
          const r2 = await axios.get(`${API_URL}/saas-admins`, { headers: auth() });
          setAdmins(r2.data?.data?.admins || []);
        }
      } catch (e) {
        if (e.response?.status !== 403) setError(e.response?.data?.message || 'Failed to load');
      } finally {
        setChecking(false);
        setLoading(false);
      }
    })();
  }, []);

  const reload = async () => {
    try { setLoading(true); const r = await axios.get(`${API_URL}/saas-admins`, { headers: auth() }); setAdmins(r.data?.data?.admins || []); }
    catch (e) { setError('Refresh failed'); } finally { setLoading(false); }
  };

  const openAdd = () => { setForm({ firstName:'', lastName:'', email:'', password:'', saasRole:'Admin' }); setPanel('add'); };
  const openReset = a => { setTarget(a); setNewPwd(''); setPanel('reset'); };
  const openEdit  = a => { setTarget(a); setEditForm({ firstName: a.firstName, lastName: a.lastName, saasRole: a.saasRole || 'Admin', isActive: a.isActive }); setPanel('edit'); };
  const saveEdit  = async () => {
    try { setBusy(true); await axios.put(`${API_URL}/saas-admins/${target._id}`, editForm, { headers: auth() }); closePanel(); reload(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to update'); } finally { setBusy(false); }
  };
  const closePanel = () => { setPanel(null); setTarget(null); setShowPwd(false); setShowResetPwd(false); };

  const createAdmin = async e => {
    e.preventDefault();
    try { setBusy(true); await axios.post(`${API_URL}/saas-admins/create`, form, { headers: auth() }); closePanel(); reload(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to create admin'); } finally { setBusy(false); }
  };

  const resetPwd = async () => {
    if (newPwd.length < 6) return;
    try { setBusy(true); await axios.post(`${API_URL}/saas-admins/${target._id}/reset-password`, { newPassword: newPwd }, { headers: auth() }); closePanel(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };

  const toggleActive = async a => {
    if (a.isPrimary) return;
    try { await axios.put(`${API_URL}/saas-admins/${a._id}`, { isActive: !a.isActive }, { headers: auth() }); reload(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const deleteAdmin = async a => {
    if (a.isPrimary || !window.confirm(`Remove ${a.firstName} ${a.lastName}?`)) return;
    try { await axios.delete(`${API_URL}/saas-admins/${a._id}`, { headers: auth() }); reload(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const stats = {
    total:    admins.length,
    active:   admins.filter(a => a.isActive).length,
    admins:   admins.filter(a => !a.isPrimary && a.saasRole !== 'Manager').length,
    managers: admins.filter(a => a.saasRole === 'Manager' && !a.isPrimary).length,
  };

  const rows = admins.filter(a => {
    const s = search.toLowerCase();
    const matchS = !s || `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(s);
    return matchS && matchFilter(a, filter);
  });

  /* ── Loading ── */
  if (checking) return (
    <SaasLayout title="Team">
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .saasadmi-grid4,.saasadmi-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .saasadmi-grid2{grid-template-columns:1fr!important;}
    .saasadmi-split{flex-direction:column!important;}
    .saasadmi-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .saasadmi-panel{width:100%!important;}
    .saasadmi-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .saasadmi-form-row{grid-template-columns:1fr!important;}
    .saasadmi-hide{display:none!important;}
  }
  @media(max-width:480px){
    .saasadmi-grid4,.saasadmi-grid3,.saasadmi-grid2{grid-template-columns:1fr!important;}
  }
`}</style>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
        <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid #6366f1', borderTopColor:'transparent', animation:'spin 0.7s linear infinite' }}/>
      </div>
    </SaasLayout>
  );

  /* ── Access denied ── */
  if (!isPrimary) return (
    <SaasLayout title="Team">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'36px 40px', maxWidth:380, textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:'#374151' }}><IconShield/></div>
          <div style={{ fontSize:16, fontWeight:700, color:'#111827', marginBottom:8 }}>Restricted Access</div>
          <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.65 }}>Only the Primary Owner can manage team members and permissions.</div>
        </div>
      </div>
    </SaasLayout>
  );

  return (
    <SaasLayout title="Team">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
        .tr:hover { background: #f9fafb !important; }
        .row-actions { opacity:1; }
        .tab { padding:5px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; border:none; background:transparent; color:#6b7280; transition:all 0.12s; }
        .tab:hover { background:#f3f4f6; color:#374151; }
        .tab.on { background:#111827; color:#fff; }
        .icoBtn { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; border:1px solid #e5e7eb; background:#fff; cursor:pointer; color:#6b7280; transition:all 0.12s; }
        .icoBtn:hover { border-color:#d1d5db; background:#f9fafb; color:#111827; }
        .icoBtn.danger:hover { border-color:#fca5a5; background:#fef2f2; color:#dc2626; }
        .icoBtn.warn:hover { border-color:#fde68a; background:#fffbeb; color:#d97706; }
        .icoBtn.success:hover { border-color:#a7f3d0; background:#f0fdf4; color:#059669; }
        .finput:focus { outline:none; border-color:#6366f1 !important; box-shadow:0 0 0 3px rgba(99,102,241,0.12) !important; }
        .stat-card { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 20px; }
        .pbtn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:7px; border:none; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.13s; }
        .pbtn:hover { opacity:0.88; transform:translateY(-1px); }
        .pbtn.primary { background:#111827; color:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.18); }
        .pbtn.ghost { background:#fff; color:#374151; border:1px solid #d1d5db; }
        .pbtn.ghost:hover { background:#f9fafb; }
        .pbtn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
      `}</style>

      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:18, fontWeight:800, color:'#111827', letterSpacing:'-0.3px' }}>Team Members</div>
        <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{stats.total} members · Manage access and roles</div>
      </div>

      {/* ─── Stat Row ─────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:10, marginBottom:12 }}>
        {[
          { label:'Total Members', value:stats.total,    note:'All team members',     grad:'linear-gradient(135deg,#6366f1,#8b5cf6)' },
          { label:'Active',        value:stats.active,   note:`${stats.total - stats.active} inactive`, grad:'linear-gradient(135deg,#10b981,#059669)' },
          { label:'Admins',        value:stats.admins,   note:'Full access',           grad:'linear-gradient(135deg,#0891b2,#0284c7)' },
          { label:'Managers',      value:stats.managers, note:'Limited tenant access', grad:'linear-gradient(135deg,#f59e0b,#f97316)' },
        ].map(s => (
          <div key={s.label} style={{ background:s.grad, borderRadius:8, padding:'10px 14px', animation:'fadeIn 0.2s ease', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:-12, top:-12, width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }}/>
            <div style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.9)', marginTop:4 }}>{s.label}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', marginTop:1 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* ─── Action Buttons (below stats) ────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <button className="pbtn primary" onClick={openAdd}><IconPlus/> Add Member</button>
        <button className="pbtn ghost" onClick={reload}><IconRefresh/> Refresh</button>
      </div>

      {/* ─── Main Layout ──────────────────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:14, alignItems:'flex-start' }}>

        {/* ── Table ── */}
        <div style={{ flex:1, minWidth:0, width:'100%' }}>

          {/* Toolbar */}
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px 10px 0 0', borderBottom:'none', padding:'10px 14px', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            {/* Search */}
            <div style={{ position:'relative', flex:'0 0 200px' }}>
              <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', display:'flex' }}><IconSearch/></span>
              <input className="finput" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inp, paddingLeft:30, fontSize:12 }}/>
            </div>
            {/* Filter tabs */}
            <div style={{ display:'flex', gap:2, background:'#f3f4f6', padding:3, borderRadius:8 }}>
              {FILTER_TABS.map(f => (
                <button key={f.k} className={`tab${filter === f.k ? ' on' : ''}`} onClick={() => setFilter(f.k)}>
                  {f.label}
                  <span style={{ marginLeft:5, fontSize:10, opacity:0.65 }}>
                    {admins.filter(a => matchFilter(a, f.k)).length}
                  </span>
                </button>
              ))}
            </div>
            <span style={{ marginLeft:'auto', fontSize:11, color:'#9ca3af', flexShrink:0 }}>{rows.length} result{rows.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Table */}
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'0 0 10px 10px', overflow:'hidden', overflowX:'auto' }}>

            {/* Head */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 80px' : '2.4fr 1fr 0.85fr 0.85fr 96px', gap:0, borderBottom:'1px solid #e5e7eb', background:'#f9fafb', padding:'9px 16px', minWidth: isMobile ? 0 : 520 }}>
              {(isMobile ? ['Member',''] : ['Member','Role','Status','Joined','']).map((h,i) => (
                <div key={i} style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.7px' }}>{h}</div>
              ))}
            </div>

            {/* Body */}
            {loading ? (
              <div style={{ padding:48, textAlign:'center' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid #6366f1', borderTopColor:'transparent', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }}/>
                <div style={{ fontSize:12, color:'#9ca3af' }}>Loading…</div>
              </div>
            ) : rows.length === 0 ? (
              <div style={{ padding:48, textAlign:'center' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:4 }}>No members found</div>
                <div style={{ fontSize:12, color:'#9ca3af' }}>{search ? 'Try a different search term' : 'Add your first team member'}</div>
              </div>
            ) : rows.map((a, idx) => {
              const rc  = getRole(a);
              const ini = initials(a);
              const ac  = avatarColor(a.firstName);
              return (
                <div key={a._id} className="tr"
                  style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 80px' : '2.4fr 1fr 0.85fr 0.85fr 96px', gap:0, padding: isMobile ? '10px 12px' : '11px 16px', borderBottom: idx < rows.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems:'center', animation:'fadeIn 0.15s ease' }}>

                  {/* Member */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:ac, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, flexShrink:0, letterSpacing:'0.3px' }}>
                      {ini}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#111827', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        {a.firstName} {a.lastName}
                        {a.isPrimary && (
                          <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:4, background:'#eef2ff', color:'#4f46e5', border:'1px solid #c7d2fe', letterSpacing:'0.3px' }}>OWNER</span>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:'#9ca3af', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.email}</div>
                      {isMobile && (
                        <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, color:rc.color, background:rc.bg, border:`1px solid ${rc.border}`, padding:'2px 7px', borderRadius:4 }}>
                            <span style={{ width:4, height:4, borderRadius:'50%', background:rc.color, display:'inline-block' }}/>{rc.label}
                          </span>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, color: a.isActive ? '#059669' : '#6b7280', background: a.isActive ? '#f0fdf4' : '#f9fafb', border:`1px solid ${a.isActive ? '#a7f3d0' : '#e5e7eb'}`, padding:'2px 7px', borderRadius:4 }}>
                            <span style={{ width:4, height:4, borderRadius:'50%', background: a.isActive ? '#10b981' : '#d1d5db', display:'inline-block' }}/>{a.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role — desktop only */}
                  {!isMobile && <div>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, color:rc.color, background:rc.bg, border:`1px solid ${rc.border}`, padding:'3px 9px', borderRadius:5 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:rc.color, display:'inline-block', flexShrink:0 }}/>
                      {rc.label}
                    </span>
                  </div>}

                  {/* Status — desktop only */}
                  {!isMobile && <div>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600,
                      color: a.isActive ? '#059669' : '#6b7280',
                      background: a.isActive ? '#f0fdf4' : '#f9fafb',
                      border: `1px solid ${a.isActive ? '#a7f3d0' : '#e5e7eb'}`,
                      padding:'3px 9px', borderRadius:5 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background: a.isActive ? '#10b981' : '#d1d5db', display:'inline-block', flexShrink:0 }}/>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>}

                  {/* Joined — desktop only */}
                  {!isMobile && <div style={{ fontSize:12, color:'#6b7280' }}>{fmtDate(a.createdAt)}</div>}

                  {/* Actions */}
                  <div className="row-actions" style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                    {a.isPrimary ? (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'#9ca3af', fontWeight:500 }}>
                        <IconShield/> Protected
                      </span>
                    ) : (
                      <>
                        <button className="icoBtn" onClick={() => openEdit(a)} title="Edit member"><IconEdit/></button>
                        <button className="icoBtn warn" onClick={() => openReset(a)} title="Reset password"><IconKey/></button>
                        <button className={`icoBtn ${a.isActive ? 'danger' : 'success'}`} onClick={() => toggleActive(a)} title={a.isActive ? 'Deactivate' : 'Activate'}>
                          {a.isActive ? <IconBan/> : <IconCheck/>}
                        </button>
                        <button className="icoBtn danger" onClick={() => deleteAdmin(a)} title="Remove member"><IconTrash/></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {error && <div style={{ marginTop:10, padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, fontSize:12, color:'#dc2626' }}>{error}</div>}
        </div>

        {/* ── Side Panel (LEFT) ── */}
        {panel && (
          <div style={{ width: isMobile ? '100%' : 352, flexShrink:0, background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden', animation:'slideIn 0.18s ease', boxShadow:'0 4px 24px rgba(0,0,0,0.09)', position: isMobile ? 'relative' : 'sticky', top:20, order: isMobile ? 1 : -1 }}>

            {/* Panel header */}
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>
                  {panel === 'add' ? 'Add Team Member' : panel === 'edit' ? 'Edit Member' : 'Reset Password'}
                </div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                  {panel === 'add' ? 'Fill in the details to create an account' : `${target?.firstName} ${target?.lastName}`}
                </div>
              </div>
              <button onClick={closePanel} className="icoBtn" style={{ flexShrink:0 }}><IconClose/></button>
            </div>

            <div style={{ padding:18 }}>

              {/* ─ Add Member Form ─ */}
              {panel === 'add' && (
                <form onSubmit={createAdmin}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>First name</label>
                      <input className="finput" style={inp} value={form.firstName} onChange={e => setForm({ ...form, firstName:e.target.value })} required placeholder="John"/>
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Last name</label>
                      <input className="finput" style={inp} value={form.lastName} onChange={e => setForm({ ...form, lastName:e.target.value })} required placeholder="Doe"/>
                    </div>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Email address</label>
                    <div style={{ display:'flex', gap:6 }}>
                      <input className="finput" style={{ ...inp, flex:1 }} type="email" value={form.email} onChange={e => setForm({ ...form, email:e.target.value })} required placeholder="john@company.com"/>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(form.email); setCopied('email'); setTimeout(() => setCopied(''), 1500); }}
                        style={{ flexShrink:0, padding:'0 10px', border:'1px solid #e5e7eb', borderRadius:6, background: copied==='email' ? '#d1fae5' : '#f9fafb', color: copied==='email' ? '#059669' : '#6b7280', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.2s', whiteSpace:'nowrap' }}>
                        {copied === 'email' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Password</label>
                    <div style={{ display:'flex', gap:6 }}>
                      <div style={{ position:'relative', flex:1 }}>
                        <input className="finput" style={{ ...inp, width:'100%', boxSizing:'border-box', paddingRight:34 }} type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password:e.target.value })} required minLength={6} maxLength={16} placeholder="6–16 characters"/>
                        <button type="button" onClick={() => setShowPwd(p => !p)}
                          style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:0, display:'flex', alignItems:'center' }}>
                          {showPwd ? <IconEyeOff/> : <IconEye/>}
                        </button>
                      </div>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(form.password); setCopied('password'); setTimeout(() => setCopied(''), 1500); }}
                        style={{ flexShrink:0, padding:'0 10px', border:'1px solid #e5e7eb', borderRadius:6, background: copied==='password' ? '#d1fae5' : '#f9fafb', color: copied==='password' ? '#059669' : '#6b7280', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.2s', whiteSpace:'nowrap' }}>
                        {copied === 'password' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Role</label>
                    <select className="finput" style={{ ...inp, cursor:'pointer', appearance:'auto' }} value={form.saasRole} onChange={e => setForm({ ...form, saasRole:e.target.value })}>
                      <option value="Admin">Admin — Full platform access</option>
                      <option value="Manager">Manager — Assigned tenants only</option>
                    </select>
                    <div style={{ marginTop:8, padding:'8px 11px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:6, fontSize:11, color:'#6b7280', lineHeight:1.5 }}>
                      {form.saasRole === 'Admin'
                        ? 'Can access all tenants, settings, billing, and support.'
                        : 'Can only view dashboard and assigned tenants. No billing or admin access.'}
                    </div>
                  </div>
                  <button type="submit" disabled={busy} className="pbtn primary" style={{ width:'100%', justifyContent:'center', padding:'9px' }}>
                    {busy ? 'Creating…' : 'Create member'}
                  </button>
                </form>
              )}

              {/* ─ Edit Member ─ */}
              {panel === 'edit' && target && (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>First name</label>
                      <input className="finput" style={inp} value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName:e.target.value })} placeholder="First name"/>
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Last name</label>
                      <input className="finput" style={inp} value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName:e.target.value })} placeholder="Last name"/>
                    </div>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Email</label>
                    <input className="finput" style={{ ...inp, background:'#f9fafb', color:'#9ca3af' }} value={target.email} disabled/>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Role</label>
                    <select className="finput" style={{ ...inp, cursor:'pointer', appearance:'auto' }} value={editForm.saasRole} onChange={e => setEditForm({ ...editForm, saasRole:e.target.value })}>
                      <option value="Admin">Admin — Full platform access</option>
                      <option value="Manager">Manager — Assigned tenants only</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Status</label>
                    <select className="finput" style={{ ...inp, cursor:'pointer', appearance:'auto' }} value={editForm.isActive ? 'active' : 'inactive'} onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <button type="button" onClick={closePanel} className="pbtn ghost" style={{ justifyContent:'center', padding:'9px' }}>Cancel</button>
                    <button type="button" onClick={saveEdit} disabled={busy} className="pbtn primary" style={{ justifyContent:'center', padding:'9px' }}>
                      {busy ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* ─ Reset Password ─ */}
              {panel === 'reset' && target && (
                <div>
                  {/* Member row */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:7, marginBottom:18 }}>
                    <div style={{ width:32, height:32, borderRadius:7, background:avatarColor(target.firstName), color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, flexShrink:0 }}>
                      {initials(target)}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{target.firstName} {target.lastName}</div>
                      <div style={{ fontSize:11, color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{target.email}</div>
                    </div>
                    <span style={{ marginLeft:'auto', fontSize:11, fontWeight:600, color:getRole(target).color, background:getRole(target).bg, border:`1px solid ${getRole(target).border}`, padding:'2px 8px', borderRadius:4, flexShrink:0 }}>
                      {getRole(target).label}
                    </span>
                  </div>

                  <div style={{ marginBottom:18 }}>
                    <label style={{ fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>New password</label>
                    <div style={{ position:'relative' }}>
                      <input className="finput" style={{ ...inp, paddingRight:34 }} type={showResetPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="6–16 characters" minLength={6} maxLength={16}/>
                      <button type="button" onClick={() => setShowResetPwd(p => !p)}
                        style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:0, display:'flex', alignItems:'center' }}>
                        {showResetPwd ? <IconEyeOff/> : <IconEye/>}
                      </button>
                    </div>
                    {newPwd.length > 0 && (
                      <div style={{ marginTop:7 }}>
                        <div style={{ height:2, background:'#e5e7eb', borderRadius:1, overflow:'hidden' }}>
                          <div style={{ height:'100%', transition:'all 0.2s', borderRadius:1,
                            width: newPwd.length >= 10 ? '100%' : newPwd.length >= 8 ? '66%' : newPwd.length >= 6 ? '33%' : '10%',
                            background: newPwd.length >= 8 ? '#10b981' : newPwd.length >= 6 ? '#f59e0b' : '#ef4444' }}/>
                        </div>
                        <div style={{ fontSize:10, color:'#9ca3af', marginTop:4 }}>
                          {newPwd.length >= 8 ? 'Strong' : newPwd.length >= 6 ? 'Acceptable' : 'Too short'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ padding:'10px 12px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:6, marginBottom:16, fontSize:11, color:'#92400e', lineHeight:1.5 }}>
                    The member will need to use this new password on their next login.
                  </div>

                  <button onClick={resetPwd} disabled={busy || newPwd.length < 6} className="pbtn primary" style={{ width:'100%', justifyContent:'center', padding:'9px', background:busy || newPwd.length < 6 ? undefined : 'linear-gradient(135deg,#d97706,#b45309)' }}>
                    {busy ? 'Resetting…' : 'Reset password'}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </SaasLayout>
  );
}
