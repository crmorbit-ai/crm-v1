import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService, orgHierarchyService } from '../services/userService';
import DashboardLayout from '../components/layout/DashboardLayout';

/* ─── Constants ───────────────────────────────────────────── */
const CARD_W = 220, CARD_H = 88, H_GAP = 40, V_GAP = 60;

const ROLE_COLOR = {
  TENANT_ADMIN:   { bar: '#7c3aed', bg: '#f5f3ff', badge: '#7c3aed', label: 'Admin' },
  TENANT_MANAGER: { bar: '#0ea5e9', bg: '#f0f9ff', badge: '#0ea5e9', label: 'Manager' },
  TENANT_USER:    { bar: '#10b981', bg: '#f0fdf4', badge: '#10b981', label: 'Member' },
};

const DEPT_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#14b8a6','#f97316','#8b5cf6'];
const deptColor = s => DEPT_COLORS[(s?.charCodeAt(0)||0) % DEPT_COLORS.length];

const avGrad = n => {
  const colors = [['#6366f1','#8b5cf6'],['#0ea5e9','#38bdf8'],['#10b981','#34d399'],['#f59e0b','#fbbf24'],['#ec4899','#f472b6'],['#8b5cf6','#c084fc'],['#14b8a6','#2dd4bf'],['#f97316','#fb923c']];
  const i = (n?.charCodeAt(0)||0) % colors.length;
  return `linear-gradient(135deg,${colors[i][0]},${colors[i][1]})`;
};

/* ─── Layout engine ───────────────────────────────────────── */
function layoutTree(rootId, usersMap, getDR) {
  const positions = {};
  let maxCol = 0;

  function measure(id, depth, col) {
    const children = getDR(id);
    if (!children.length) {
      positions[id] = { x: col * (CARD_W + H_GAP), y: depth * (CARD_H + V_GAP) };
      if (col > maxCol) maxCol = col;
      return col + 1;
    }
    const startCol = col;
    let nextCol = col;
    for (const c of children) nextCol = measure(c._id, depth + 1, nextCol);
    const endCol = nextCol - 1;
    const cx = ((startCol + endCol) / 2) * (CARD_W + H_GAP);
    positions[id] = { x: cx, y: depth * (CARD_H + V_GAP) };
    return nextCol;
  }

  measure(rootId, 0, 0);
  return positions;
}

/* ─── SVG Connector ───────────────────────────────────────── */
const Connector = ({ x1, y1, x2, y2, focused }) => {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const d = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={focused ? '#7c3aed' : '#c7d2fe'}
      strokeWidth={focused ? 2 : 1.5}
      strokeDasharray={focused ? 'none' : 'none'}
      opacity={focused ? 1 : 0.7}
      style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
    />
  );
};

/* ─── Node Card ───────────────────────────────────────────── */
const NodeCard = ({ u, x, y, focused, onClick }) => {
  const rc = ROLE_COLOR[u.userType] || ROLE_COLOR.TENANT_USER;
  const dc = deptColor(u.department);
  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={() => onClick(u)}
      style={{ cursor: 'pointer' }}
    >
      {/* Shadow */}
      <rect x={3} y={4} width={CARD_W} height={CARD_H} rx={12} fill="rgba(0,0,0,0.08)" />
      {/* Card bg */}
      <rect
        width={CARD_W} height={CARD_H} rx={12}
        fill={focused ? '#f5f3ff' : '#ffffff'}
        stroke={focused ? '#7c3aed' : '#e8edf5'}
        strokeWidth={focused ? 2 : 1.5}
        style={{ transition: 'all 0.2s', filter: focused ? 'drop-shadow(0 4px 16px rgba(124,58,237,0.2))' : 'none' }}
      />
      {/* Left color bar */}
      <rect x={0} y={0} width={5} height={CARD_H} rx={4} fill={focused ? '#7c3aed' : rc.bar} />
      {/* Top accent when focused */}
      {focused && <rect x={5} y={0} width={CARD_W - 5} height={3} rx={0} fill="url(#focusGrad)" />}

      {/* Avatar circle */}
      <circle cx={38} cy={CARD_H / 2} r={20} fill={avGrad(u.firstName)} />
      <text x={38} y={CARD_H / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={13} fontWeight={900} fontFamily="system-ui">
        {u.firstName?.[0]}{u.lastName?.[0]}
      </text>

      {/* Active dot */}
      <circle cx={52} cy={CARD_H / 2 - 15} r={5} fill={u.isActive ? '#22c55e' : '#f43f5e'} stroke="#fff" strokeWidth={1.5} />

      {/* Name */}
      <text x={68} y={28} fill={focused ? '#4f46e5' : '#0f172a'} fontSize={12} fontWeight={800} fontFamily="system-ui">
        {(u.firstName + ' ' + u.lastName).slice(0, 20)}{(u.firstName + ' ' + u.lastName).length > 20 ? '…' : ''}
      </text>

      {/* Designation */}
      {u.designation && (
        <text x={68} y={44} fill={rc.bar} fontSize={10} fontWeight={600} fontFamily="system-ui">
          {u.designation.slice(0, 22)}{u.designation.length > 22 ? '…' : ''}
        </text>
      )}

      {/* Department badge */}
      {u.department && (
        <>
          <rect x={68} y={54} width={Math.min(u.department.length * 6.5 + 10, 130)} height={16} rx={8} fill={`${dc}18`} />
          <text x={73} y={65} fill={dc} fontSize={9} fontWeight={700} fontFamily="system-ui">
            {u.department.slice(0, 18)}
          </text>
        </>
      )}

      {/* Role badge */}
      <rect x={CARD_W - 46} y={8} width={38} height={14} rx={7} fill={`${rc.badge}18`} stroke={`${rc.badge}44`} strokeWidth={1} />
      <text x={CARD_W - 27} y={18} textAnchor="middle" fill={rc.badge} fontSize={8} fontWeight={800} fontFamily="system-ui">
        {rc.label}
      </text>
    </g>
  );
};

/* ─── Canvas Tree ─────────────────────────────────────────── */
const CanvasTree = ({ users, focusUser, onSelect, getDR, rootId }) => {
  const usersMap = Object.fromEntries(users.map(u => [u._id, u]));
  const getDRById = id => users.filter(u => (u.reportsTo?._id || u.reportsTo) === id);
  const positions = layoutTree(rootId, usersMap, getDRById);

  // Build edges
  const edges = [];
  users.forEach(u => {
    const pid = u.reportsTo?._id || u.reportsTo;
    if (pid && positions[pid] && positions[u._id]) {
      const p = positions[pid];
      const c = positions[u._id];
      const parentFocused = focusUser?._id === pid || focusUser?._id === u._id;
      edges.push({ key: `${pid}-${u._id}`, x1: p.x + CARD_W/2, y1: p.y + CARD_H, x2: c.x + CARD_W/2, y2: c.y, focused: parentFocused });
    }
  });

  const allX = Object.values(positions).map(p => p.x);
  const allY = Object.values(positions).map(p => p.y);
  const svgW = Math.max(...allX) + CARD_W + 60;
  const svgH = Math.max(...allY) + CARD_H + 60;

  return (
    <svg width={svgW} height={svgH} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g transform="translate(30,30)">
        {/* Edges first (behind cards) */}
        {edges.map(e => <Connector key={e.key} {...e} />)}

        {/* Cards */}
        {users.map(u => positions[u._id] ? (
          <NodeCard
            key={u._id}
            u={u}
            x={positions[u._id].x}
            y={positions[u._id].y}
            focused={focusUser?._id === u._id}
            onClick={onSelect}
          />
        ) : null)}
      </g>
    </svg>
  );
};

/* ══ Main OrgChart Page ═════════════════════════════════════ */
const OrgChart = () => {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [focusUser, setFocus]   = useState(null);
  const [search, setSearch]     = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [zoom, setZoom]         = useState(0.85);
  const [leftOpen, setLeftOpen] = useState(window.innerWidth > 768);

  // Cross-org
  const [orgList, setOrgList]               = useState([]);
  const [selectedOrg, setSelectedOrg]       = useState(null);
  const [orgDropOpen, setOrgDropOpen]       = useState(false);
  const [crossOrgAccess, setCrossOrgAccess] = useState(false);
  const isViewingOtherOrg = !!selectedOrg;

  const load = useCallback(async (targetTenantId = null) => {
    setLoading(true);
    setZoom(0.85);
    try {
      if (targetTenantId) {
        const res = await orgHierarchyService.getOrgUsers(targetTenantId);
        const list = res.users || [];
        setUsers(list);
        const roots = list.filter(u => { const rt = u.reportsTo?._id || u.reportsTo; return !rt || !list.find(x => x._id === rt); });
        setFocus(roots[0] || list[0] || null);
      } else {
        const res = await userService.getUsers({ limit: 200 });
        const list = (res.users || []).filter(u => u.isActive);
        setUsers(list);
        const self = list.find(u => u._id === me?._id) || list[0];
        setFocus(self || null);
      }
    } catch(e) { if(e?.isPermissionDenied) return; }
    finally { setLoading(false); }
  }, [me]);

  const loadOrgList = useCallback(async () => {
    try {
      const res = await orgHierarchyService.getOrgList();
      setOrgList(res.tenants || []); setCrossOrgAccess(true);
    } catch { setCrossOrgAccess(false); }
  }, []);

  useEffect(() => { load(); loadOrgList(); }, [load, loadOrgList]);

  const getDR = useCallback((u, all) =>
    all.filter(x => (x.reportsTo?._id || x.reportsTo) === u._id)
  , []);

  const getMgrChain = useCallback((u, all) => {
    const chain = []; let cur = u; const seen = new Set();
    while (cur?.reportsTo) {
      const mid = cur.reportsTo?._id || cur.reportsTo;
      if (seen.has(mid)) break; seen.add(mid);
      const mgr = all.find(x => x._id === mid);
      if (!mgr) break; chain.unshift(mgr); cur = mgr;
    }
    return chain;
  }, []);

  const rootUsers = users.filter(u => {
    const rt = u.reportsTo?._id || u.reportsTo;
    return !rt || !users.find(x => x._id === rt);
  });

  const filtered = search.trim()
    ? users.filter(u => `${u.firstName} ${u.lastName} ${u.designation||''} ${u.department||''}`.toLowerCase().includes(search.toLowerCase()))
    : [];

  const mgrChain     = focusUser ? getMgrChain(focusUser, users) : [];
  const directReports = focusUser ? getDR(focusUser, users) : [];
  const peers = focusUser && focusUser.reportsTo
    ? users.filter(u => { const rt = u.reportsTo?._id || u.reportsTo; const myMgr = focusUser.reportsTo?._id || focusUser.reportsTo; return rt === myMgr && u._id !== focusUser._id; })
    : [];


  if (loading) return (
    <DashboardLayout>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'70vh', gap:16 }}>
        <div style={{ width:48, height:48, border:'3px solid #ede9fe', borderTop:'3px solid #7c3aed', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <div style={{ fontSize:13, color:'#94a3b8', fontWeight:600, letterSpacing:'0.5px' }}>Building org chart...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .oc-fade { animation: fadeUp 0.3s ease; }
        .oc-slide { animation: slideIn 0.25s ease; }
        .oc-scroll::-webkit-scrollbar { width:4px; }
        .oc-scroll::-webkit-scrollbar-thumb { background:#ddd6fe; border-radius:4px; }
        .oc-btn:hover { opacity:0.85; transform:translateY(-1px); }
        .oc-node:hover rect:first-of-type { filter: drop-shadow(0 6px 20px rgba(99,102,241,0.18)); }
        .oc-left-item:hover { background: rgba(255,255,255,0.08) !important; }
        .oc-left-item:hover .oc-left-name { color: #fff !important; }
        @media (max-width: 768px) {
          .oc-header-stats { display: none !important; }
          .oc-header-search { width: 130px !important; }
        }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 80px)', gap:4 }}>

        {/* ══ TOP BAR — Premium Dark Header ═══════════════════ */}
        <div style={{
          background:'linear-gradient(135deg,#0f0c29 0%,#1e1654 50%,#0d1b4b 100%)',
          borderRadius:'20px 20px 0 0',
          padding:'0 24px',
          flexShrink:0,
          position:'relative',
          boxShadow:'0 4px 24px rgba(79,70,229,0.25)',
        }}>
          {/* bg blobs */}
          <div style={{position:'absolute',inset:0,borderRadius:'20px 20px 0 0',overflow:'hidden',pointerEvents:'none'}}>
            <div style={{position:'absolute',top:-60,right:60,width:220,height:220,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.25) 0%,transparent 65%)'}} />
            <div style={{position:'absolute',top:-40,right:320,width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,0.12) 0%,transparent 65%)'}} />
            <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'20px 20px'}} />
          </div>

          <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,height:72}}>

            {/* LEFT — Title + stats */}
            <div style={{display:'flex',alignItems:'center',gap:20}}>
              {/* Icon + title */}
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:38,height:38,borderRadius:12,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,backdropFilter:'blur(4px)'}}>
                  🏢
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:800,color:'rgba(255,255,255,0.3)',letterSpacing:'2px',textTransform:'uppercase',lineHeight:1}}>Organisation</div>
                  <div style={{fontSize:20,fontWeight:900,letterSpacing:'-0.5px',lineHeight:1.2,marginTop:2}}>
                    <span style={{color:'#fff'}}>Org </span>
                    <span style={{background:'linear-gradient(90deg,#a78bfa,#67e8f9)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Chart</span>
                  </div>
                  {isViewingOtherOrg && (
                    <div style={{fontSize:9,color:'#a78bfa',fontWeight:700,marginTop:1,letterSpacing:'0.3px'}}>↳ {selectedOrg?.organizationName}</div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{width:1,height:32,background:'rgba(255,255,255,0.1)'}} />

              {/* Stats */}
              <div className="oc-header-stats" style={{display:'flex',gap:6}}>
                {[
                  {n:users.length,         l:'Members',   c:'#a78bfa', icon:'👥'},
                  {n:rootUsers.length,     l:'Top Level', c:'#67e8f9', icon:'⬆'},
                  {n:users.filter(u=>u.designation).length, l:'Designated', c:'#86efac', icon:'🏷'},
                ].map(s=>(
                  <div key={s.l} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 12px',borderRadius:10,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(4px)'}}>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:16,fontWeight:900,color:s.c,lineHeight:1}}>{s.n}</div>
                      <div style={{fontSize:9,color:'rgba(255,255,255,0.35)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',marginTop:1}}>{s.l}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Controls */}
            <div style={{display:'flex',alignItems:'center',gap:8}}>

              {/* Org switcher */}
              {crossOrgAccess && (
                <div style={{position:'relative'}}>
                  <button onClick={()=>setOrgDropOpen(p=>!p)} style={{
                    display:'flex',alignItems:'center',gap:7,padding:'8px 14px',
                    borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',
                    background:isViewingOtherOrg?'rgba(167,139,250,0.2)':'rgba(255,255,255,0.08)',
                    color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',
                    backdropFilter:'blur(4px)',transition:'all 0.2s',whiteSpace:'nowrap',
                  }}>
                    <span style={{fontSize:13}}>🏢</span>
                    <span>{selectedOrg?selectedOrg.organizationName:'My Organization'}</span>
                    {isViewingOtherOrg&&<span style={{fontSize:8,background:'#7c3aed',padding:'1px 6px',borderRadius:6,fontWeight:800,letterSpacing:'0.5px'}}>EXTERNAL</span>}
                    <span style={{fontSize:9,opacity:0.5}}>▼</span>
                  </button>
                  {orgDropOpen&&(
                    <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:14,boxShadow:'0 20px 60px rgba(0,0,0,0.18)',zIndex:1000,minWidth:240,maxHeight:280,overflowY:'auto'}}>
                      {[{_id:null,organizationName:'My Organization',sub:'Your own team',icon:'🏠'},
                        ...orgList.filter(o=>o._id!==(me?.tenant?._id||me?.tenant)).map(o=>({...o,icon:'🏢',sub:o.industry||o.organizationId||''}))
                      ].map(org=>(
                        <div key={org._id||'mine'} onClick={()=>{setSelectedOrg(org._id?org:null);setOrgDropOpen(false);load(org._id||null);}}
                          style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f8fafc',background:(selectedOrg?._id===org._id||(!selectedOrg&&!org._id))?'#f5f3ff':'#fff',transition:'background 0.12s'}}
                          onMouseEnter={e=>e.currentTarget.style.background='#f5f3ff'}
                          onMouseLeave={e=>e.currentTarget.style.background=(selectedOrg?._id===org._id||(!selectedOrg&&!org._id))?'#f5f3ff':'#fff'}
                        >
                          <div style={{width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{org.icon}</div>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>{org.organizationName}</div>
                            <div style={{fontSize:10,color:'#94a3b8'}}>{org.sub}</div>
                          </div>
                          {(selectedOrg?._id===org._id||(!selectedOrg&&!org._id))&&<span style={{marginLeft:'auto',color:'#7c3aed',fontSize:14}}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Search */}
              <div style={{position:'relative'}}>
                <div className="oc-header-search" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.08)',backdropFilter:'blur(4px)',width:200}}>
                  <span style={{color:'rgba(255,255,255,0.4)',fontSize:13,flexShrink:0}}>🔍</span>
                  <input
                    value={search}
                    onChange={e=>setSearch(e.target.value)}
                    onFocus={()=>setShowDrop(true)}
                    onBlur={()=>setTimeout(()=>setShowDrop(false),200)}
                    placeholder="Search people..."
                    style={{border:'none',outline:'none',background:'transparent',fontSize:12,color:'#fff',width:'100%'}}
                  />
                </div>
                {showDrop&&filtered.length>0&&(
                  <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:12,boxShadow:'0 16px 40px rgba(0,0,0,0.14)',zIndex:1000,width:260,maxHeight:220,overflowY:'auto'}}>
                    {filtered.map(u=>(
                      <div key={u._id} onClick={()=>{setFocus(u);setSearch('');}}
                        style={{display:'flex',alignItems:'center',gap:10,padding:'9px 13px',cursor:'pointer',borderBottom:'1px solid #f8fafc'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#f5f3ff'}
                        onMouseLeave={e=>e.currentTarget.style.background='#fff'}
                      >
                        <div style={{width:32,height:32,borderRadius:'50%',background:avGrad(u.firstName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:11,flexShrink:0}}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{u.firstName} {u.lastName}</div>
                          <div style={{fontSize:10,color:'#94a3b8'}}>{u.designation||u.department||u.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Zoom controls */}
              <div style={{display:'flex',alignItems:'center',gap:1,padding:'4px',borderRadius:10,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.07)',backdropFilter:'blur(4px)'}}>
                <button onClick={()=>setZoom(z=>Math.max(0.3,z-0.1))} style={{width:28,height:28,border:'none',borderRadius:7,background:'transparent',cursor:'pointer',fontSize:15,color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                <span style={{fontSize:11,fontWeight:800,color:'#fff',width:36,textAlign:'center'}}>{Math.round(zoom*100)}%</span>
                <button onClick={()=>setZoom(z=>Math.min(2,z+0.1))} style={{width:28,height:28,border:'none',borderRadius:7,background:'transparent',cursor:'pointer',fontSize:15,color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              </div>

              <button onClick={()=>setZoom(0.85)} style={{padding:'8px 13px',borderRadius:10,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.07)',backdropFilter:'blur(4px)',fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.7)',cursor:'pointer',whiteSpace:'nowrap'}}>
                ⊡ Reset
              </button>
            </div>
          </div>
        </div>

        {/* ══ BODY ════════════════════════════════════════════ */}
        <div style={{ display:'flex', flex:1, overflow:'hidden', borderRadius:'20px 20px 20px 20px', gap:2, background:'#e8edf5' }}>

          {/* ── LEFT SIDEBAR ───────────────────────────────── */}
          <div style={{
            width: leftOpen ? 220 : 48, flexShrink:0,
            background:'#0f172a',
            display:'flex', flexDirection:'column',
            transition:'width 0.25s ease', overflow:'hidden',
            borderRadius:'20px 0 0 20px',
          }}>
            {/* Sidebar header */}
            <div style={{ padding:'14px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
              {leftOpen && <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'1.5px' }}>Team</div>}
              <button onClick={() => setLeftOpen(p => !p)} style={{ width:26, height:26, borderRadius:8, border:'none', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, marginLeft:'auto', flexShrink:0 }}>
                {leftOpen ? '◀' : '▶'}
              </button>
            </div>

            {/* Member list — expanded */}
            {leftOpen && (
              <div className="oc-scroll" style={{ overflowY:'auto', flex:1, padding:'8px 0' }}>
                {rootUsers.map(root => (
                  <SidebarNode key={root._id} u={root} users={users} focusUser={focusUser} onSelect={setFocus} getDR={getDR} level={0} />
                ))}
              </div>
            )}

            {/* Collapsed: show avatar circles */}
            {!leftOpen && (
              <div className="oc-scroll" style={{ overflowY:'auto', flex:1, padding:'8px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                {users.map(u => (
                  <div
                    key={u._id}
                    onClick={() => setFocus(u)}
                    title={`${u.firstName} ${u.lastName}`}
                    style={{
                      width:34, height:34, borderRadius:'50%',
                      background: focusUser?._id === u._id ? 'linear-gradient(135deg,#7c3aed,#6366f1)' : avGrad(u.firstName),
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#fff', fontWeight:900, fontSize:11, cursor:'pointer',
                      flexShrink:0,
                      border: focusUser?._id === u._id ? '2px solid #a78bfa' : '2px solid rgba(255,255,255,0.1)',
                      transition:'all 0.15s',
                      boxShadow: focusUser?._id === u._id ? '0 0 10px rgba(124,58,237,0.6)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform='scale(1.12)'}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                  >
                    {u.firstName?.[0]}{u.lastName?.[0]}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── CANVAS ─────────────────────────────────────── */}
          <div style={{
            flex:1, overflow:'auto', position:'relative',
            background:'#fefce8',
            backgroundImage:'radial-gradient(circle,#d1d5db 1px,transparent 1px)',
            backgroundSize:'24px 24px',
          }}
          className="oc-scroll"
          >
            {/* Read only badge */}
            {isViewingOtherOrg && (
              <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', zIndex:10, display:'flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:20, background:'linear-gradient(90deg,#7c3aed,#6366f1)', color:'#fff', fontSize:11, fontWeight:800, boxShadow:'0 4px 16px rgba(124,58,237,0.4)', pointerEvents:'none' }}>
                <span>👁️</span> Viewing: {selectedOrg?.organizationName} <span style={{ padding:'1px 8px', borderRadius:10, background:'rgba(255,255,255,0.2)', fontSize:9, letterSpacing:'1px' }}>READ ONLY</span>
              </div>
            )}

            {rootUsers.length > 0 ? (
              <div style={{ transform:`scale(${zoom})`, transformOrigin:'top left', padding:'30px', display:'inline-block' }}>
                {/* Only show roots that have at least 1 direct report (connected trees) */}
                {rootUsers.filter(root => getDR(root, users).length > 0).map(root => (
                  <div key={root._id} style={{ display:'inline-block', marginRight:60, verticalAlign:'top' }}>
                    <CanvasTree
                      users={users.filter(u => {
                        const inSubtree = (id) => {
                          if (id === root._id) return true;
                          const u2 = users.find(x => x._id === id);
                          if (!u2) return false;
                          return inSubtree(u2.reportsTo?._id || u2.reportsTo);
                        };
                        return inSubtree(u._id);
                      })}
                      focusUser={focusUser}
                      onSelect={setFocus}
                      getDR={getDR}
                      rootId={root._id}
                    />
                  </div>
                ))}

                {/* Unassigned users — no parent, no children */}
                {(() => {
                  const unassigned = users.filter(u => {
                    const rt = u.reportsTo?._id || u.reportsTo;
                    const hasParent = rt && users.find(x => x._id === rt);
                    const hasChildren = getDR(u, users).length > 0;
                    return !hasParent && !hasChildren;
                  });
                  if (!unassigned.length) return null;
                  return (
                    <div style={{ display:'inline-block', verticalAlign:'top', marginLeft:20 }}>
                      <div style={{ fontSize:10, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:12 }}>
                        No Reporting Structure · {unassigned.length}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {unassigned.map(u => {
                          const rc = ROLE_COLOR[u.userType] || ROLE_COLOR.TENANT_USER;
                          return (
                            <div key={u._id} onClick={() => setFocus(u)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#fff', borderRadius:12, border:`1.5px dashed ${rc.bar}44`, cursor:'pointer', opacity:0.7, transition:'all 0.15s', minWidth:200 }}
                              onMouseEnter={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.borderStyle='solid';}}
                              onMouseLeave={e=>{e.currentTarget.style.opacity='0.7';e.currentTarget.style.borderStyle='dashed';}}
                            >
                              <div style={{ width:34,height:34,borderRadius:'50%',background:avGrad(u.firstName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:12,flexShrink:0 }}>
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <div>
                                <div style={{ fontSize:12, fontWeight:700, color:'#475569' }}>{u.firstName} {u.lastName}</div>
                                {u.designation && <div style={{ fontSize:10, color:'#94a3b8' }}>{u.designation}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🏢</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#64748b' }}>No team members yet</div>
                <div style={{ fontSize:12, marginTop:6 }}>Add members from Team Management</div>
              </div>
            )}
          </div>

          {/* ── RIGHT PROFILE PANEL ────────────────────────── */}
          {focusUser && window.innerWidth > 640 && (
            <div className="oc-slide" style={{
              width:260, flexShrink:0,
              background:'#fff',
              borderLeft:'1px solid #f1f5f9',
              display:'flex', flexDirection:'column',
              borderRadius:'0 20px 20px 0',
              overflow:'hidden',
            }}>
              {/* Profile header */}
              <div style={{ background:'linear-gradient(160deg,#0f0c29 0%,#312e81 100%)', padding:'20px 16px', textAlign:'center', position:'relative', overflow:'hidden', flexShrink:0 }}>
                <div style={{ position:'absolute', top:-40, right:-20, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.4),transparent 70%)', pointerEvents:'none' }} />
                <div style={{ position:'relative', zIndex:1 }}>
                  <div style={{ width:64, height:64, borderRadius:'50%', background:avGrad(focusUser.firstName), margin:'0 auto 10px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:22, boxShadow:'0 4px 20px rgba(0,0,0,0.3)', border:'3px solid rgba(255,255,255,0.2)', position:'relative' }}>
                    {focusUser.firstName?.[0]}{focusUser.lastName?.[0]}
                    <div style={{ position:'absolute', bottom:2, right:2, width:13, height:13, borderRadius:'50%', background:focusUser.isActive?'#22c55e':'#f43f5e', border:'2px solid #1e1b4b' }} />
                  </div>
                  <div style={{ fontSize:15, fontWeight:900, color:'#fff', lineHeight:1.2 }}>{focusUser.firstName} {focusUser.lastName}</div>
                  {focusUser.designation && <div style={{ fontSize:11, color:'#a78bfa', fontWeight:700, marginTop:3 }}>{focusUser.designation}</div>}
                  {focusUser.department && <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{focusUser.department}</div>}

                  <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:12 }}>
                    {[{n:mgrChain.length,l:'Levels'},{n:directReports.length,l:'Reports'},{n:peers.length,l:'Peers'}].map(s => (
                      <div key={s.l} style={{ textAlign:'center', padding:'5px 10px', borderRadius:10, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize:16, fontWeight:900, color:'#fff' }}>{s.n}</div>
                        <div style={{ fontSize:8, color:'rgba(255,255,255,0.35)', fontWeight:700, textTransform:'uppercase' }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hierarchy path */}
              {mgrChain.length > 0 && (
                <div style={{ padding:'10px 14px', borderBottom:'1px solid #f1f5f9', background:'#fafbff' }}>
                  <div style={{ fontSize:9, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>Reporting Path</div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                    {mgrChain.map((m, i) => (
                      <React.Fragment key={m._id}>
                        <span onClick={() => setFocus(m)} style={{ fontSize:10, fontWeight:700, color:'#7c3aed', cursor:'pointer', whiteSpace:'nowrap' }}>{m.firstName} {m.lastName?.[0]}.</span>
                        <span style={{ fontSize:10, color:'#c7d2fe' }}>›</span>
                      </React.Fragment>
                    ))}
                    <span style={{ fontSize:10, fontWeight:800, color:'#0f172a' }}>{focusUser.firstName}</span>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="oc-scroll" style={{ padding:'12px 14px', flex:1, overflowY:'auto' }}>
                {[
                  { ico:'✉️', label:'Email', val:focusUser.email },
                  { ico:'📞', label:'Phone', val:focusUser.phone },
                  { ico:'📅', label:'Joined', val:focusUser.createdAt ? new Date(focusUser.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : null },
                ].filter(r => r.val).map(r => (
                  <div key={r.label} style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'7px 0', borderBottom:'1px solid #f8fafc' }}>
                    <span style={{ fontSize:13, width:18, textAlign:'center', flexShrink:0, marginTop:1 }}>{r.ico}</span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:9, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.6px' }}>{r.label}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:'#0f172a', wordBreak:'break-all', marginTop:2 }}>{r.val}</div>
                    </div>
                  </div>
                ))}

                {/* Direct reports list */}
                {directReports.length > 0 && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontSize:9, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>Direct Reports · {directReports.length}</div>
                    {directReports.map(r => (
                      <div key={r._id} onClick={() => setFocus(r)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:8, cursor:'pointer', marginBottom:3, transition:'background 0.12s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#f5f3ff'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      >
                        <div style={{ width:26, height:26, borderRadius:'50%', background:avGrad(r.firstName), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:9, flexShrink:0 }}>{r.firstName?.[0]}{r.lastName?.[0]}</div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.firstName} {r.lastName}</div>
                          {r.designation && <div style={{ fontSize:9, color:'#94a3b8' }}>{r.designation}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:7 }}>
                  {!isViewingOtherOrg && (
                    <button onClick={() => navigate('/users')}
                      style={{ width:'100%', padding:'9px 0', border:'none', borderRadius:11, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontSize:12, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 14px rgba(79,70,229,0.3)', transition:'all 0.2s' }}
                      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
                      onMouseLeave={e=>e.currentTarget.style.transform='none'}
                    >
                      ✏️ Edit in Team Management
                    </button>
                  )}
                  {isViewingOtherOrg && (
                    <div style={{ padding:'8px 12px', borderRadius:10, background:'#fef9c3', border:'1px solid #fde047', fontSize:11, fontWeight:700, color:'#854d0e', textAlign:'center' }}>
                      🔒 Read Only — External Org
                    </div>
                  )}
                  {!isViewingOtherOrg && focusUser._id !== me?._id && (
                    <button onClick={() => setFocus(users.find(u => u._id === me?._id) || null)}
                      style={{ width:'100%', padding:'8px 0', border:'1.5px solid #e0e7ff', borderRadius:11, background:'#f8fafc', color:'#4f46e5', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='#6366f1'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='#e0e7ff'}
                    >
                      👤 View My Position
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ─── Sidebar tree node ───────────────────────────────────── */
const SidebarNode = ({ u, users, focusUser, onSelect, getDR, level }) => {
  const reports = getDR(u, users);
  const isFocus = focusUser?._id === u._id;
  const [open, setOpen] = useState(level < 2);
  const rc = ROLE_COLOR[u.userType] || ROLE_COLOR.TENANT_USER;

  return (
    <div>
      <div
        className="oc-left-item"
        style={{
          display:'flex', alignItems:'center', gap:7,
          padding:`5px 12px 5px ${12 + level * 14}px`,
          cursor:'pointer',
          background: isFocus ? 'rgba(124,58,237,0.15)' : 'transparent',
          borderLeft: isFocus ? '3px solid #7c3aed' : '3px solid transparent',
          transition:'all 0.12s',
        }}
      >
        {reports.length > 0
          ? <button onClick={e=>{e.stopPropagation();setOpen(p=>!p);}} style={{ width:16, height:16, borderRadius:4, background:'rgba(255,255,255,0.08)', border:'none', cursor:'pointer', fontSize:9, color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:900 }}>
              {open ? '−' : '+'}
            </button>
          : <div style={{ width:16, flexShrink:0 }} />
        }
        <div style={{ display:'flex', alignItems:'center', gap:7, flex:1, minWidth:0 }} onClick={() => onSelect(u)}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:rc.bar, flexShrink:0 }} />
          <div style={{ minWidth:0 }}>
            <div className="oc-left-name" style={{ fontSize:11, fontWeight:isFocus?800:500, color:isFocus?'#c4b5fd':'rgba(255,255,255,0.7)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {u.firstName} {u.lastName}
            </div>
            {u.designation && <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.designation}</div>}
          </div>
          {reports.length > 0 && <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginLeft:'auto', flexShrink:0 }}>{reports.length}</span>}
        </div>
      </div>
      {open && reports.map(r => (
        <SidebarNode key={r._id} u={r} users={users} focusUser={focusUser} onSelect={onSelect} getDR={getDR} level={level+1} />
      ))}
    </div>
  );
};

export default OrgChart;
