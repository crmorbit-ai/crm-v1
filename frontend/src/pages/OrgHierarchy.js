import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import * as svc from '../services/orgNodeService';
import { generateTree } from '../services/roleTemplateService';

/* ── Constants ─────────────────────────────────────────────── */
const TYPE_META = {
  company:    { icon: '🏢', color: '#6366f1' },
  division:   { icon: '🏬', color: '#7c3aed' },
  department: { icon: '📂', color: '#0ea5e9' },
  team:       { icon: '👥', color: '#10b981' },
  role:       { icon: '💼', color: '#f59e0b' },
  person:     { icon: '👤', color: '#6366f1' },
};
const TYPES = Object.keys(TYPE_META);
const ROLE_BADGE_COLOR = { TENANT_ADMIN: '#7c3aed', TENANT_MANAGER: '#0ea5e9', TENANT_USER: '#10b981' };

const initials = (n = '') => n.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const GRAD = ['#6366f1,#8b5cf6','#0ea5e9,#38bdf8','#10b981,#34d399','#f59e0b,#fbbf24','#ec4899,#f472b6','#f97316,#fb923c'];
const grad  = (n = '') => GRAD[(n.charCodeAt(0) || 0) % GRAD.length].split(',');

/* ── Spinner ────────────────────────────────────────────────── */
const Spin = () => (
  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:80 }}>
    <div style={{ width:36, height:36, border:'3px solid #e0e7ff', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
  </div>
);

/* ── Single tree row ────────────────────────────────────────── */
const Row = ({ node, depth, all, onEdit, onDelete, onAddChild, onMove, isAdmin, expanded, toggle, highlightId }) => {
  const meta     = TYPE_META[node.type] || TYPE_META.role;
  const [g0, g1] = grad(node.name);
  const [hover, setHover] = useState(false);
  const isPerson    = node.type === 'person';
  const isHighlight = highlightId === node._id;

  const children = all
    .filter(n => (n.parent?._id?.toString() || n.parent?.toString()) === node._id?.toString())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const hasKids = children.length > 0;
  const open    = expanded.has(node._id);

  return (
    <div>
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .orghiera-grid4,.orghiera-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .orghiera-grid2{grid-template-columns:1fr!important;}
    .orghiera-split{flex-direction:column!important;}
    .orghiera-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .orghiera-panel{width:100%!important;}
    .orghiera-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .orghiera-form-row{grid-template-columns:1fr!important;}
    .orghiera-hide{display:none!important;}
  }
  @media(max-width:480px){
    .orghiera-grid4,.orghiera-grid3,.orghiera-grid2{grid-template-columns:1fr!important;}
  }
`}</style>
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: depth * 24 }}>

        {/* Vertical line + elbow connector */}
        {depth > 0 && (
          <div style={{ width: 24, flexShrink: 0, alignSelf: 'stretch', position: 'relative', marginLeft: -24 }}>
            <div style={{ position: 'absolute', left: 11, top: 0, bottom: open && hasKids ? 0 : '50%', width: 1.5, background: '#dde3ed' }} />
            <div style={{ position: 'absolute', left: 11, top: '50%', width: 13, height: 1.5, background: '#dde3ed' }} />
          </div>
        )}

        {/* Row card */}
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          data-node-id={node._id}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 14px', marginBottom: 3, borderRadius: 12,
            background: isHighlight ? '#fef9c3' : hover ? '#f0f4ff' : isPerson ? '#ffffff' : '#fafbff',
            border: `1px solid ${isHighlight ? '#fbbf24' : hover ? '#c7d2fe' : isPerson ? '#eaecf4' : '#e4e8f5'}`,
            boxShadow: isHighlight ? '0 0 0 3px #fde68a' : hover ? '0 2px 12px rgba(99,102,241,0.10)' : '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all .15s ease', cursor: 'default',
            borderLeft: `3px solid ${isHighlight ? '#f59e0b' : hover ? meta.color : isPerson ? meta.color + '60' : meta.color + '40'}`,
          }}
        >
          {/* Toggle */}
          <button onClick={() => hasKids && toggle(node._id)} style={{
            width: 20, height: 20, borderRadius: 5, border: 'none', flexShrink: 0,
            background: hasKids ? (hover ? meta.color + '20' : '#eef0f7') : 'transparent',
            color: hasKids ? meta.color : '#c8cfdf',
            cursor: hasKids ? 'pointer' : 'default',
            fontSize: 8, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {hasKids ? (open ? '▼' : '▶') : '—'}
          </button>

          {/* Avatar */}
          <div style={{
            width: isPerson ? 38 : 32, height: isPerson ? 38 : 32,
            borderRadius: isPerson ? '50%' : 9, flexShrink: 0,
            background: isPerson ? `linear-gradient(135deg,${g0},${g1})` : meta.color + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isPerson ? 12 : 16, fontWeight: 800,
            color: isPerson ? '#fff' : meta.color,
            boxShadow: isPerson ? `0 2px 8px ${g0}35` : 'none',
          }}>
            {isPerson ? initials(node.name) : meta.icon}
          </div>

          {/* Main info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{node.name}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, color: meta.color, background: meta.color + '12',
                padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>{node.type}</span>
              {hasKids && <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>{children.length} {children.length === 1 ? 'report' : 'reports'}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
              {node.title && node.title !== node.name && (
                <span style={{ fontSize: 11, color: '#6b7280' }}>{node.title}</span>
              )}
              {node.department && (
                <span style={{ fontSize: 10, color: '#0369a1', background: '#e0f2fe', padding: '1px 8px', borderRadius: 4, fontWeight: 600 }}>
                  {node.department}
                </span>
              )}
              {node.email && (
                <span style={{ fontSize: 10, color: '#6b7280' }}>· {node.email}</span>
              )}
              {node.phone && (
                <span style={{ fontSize: 10, color: '#6b7280' }}>· {node.phone}</span>
              )}
            </div>
          </div>

          {/* Reports to */}
          {node.reportsTo && !hover && (
            <span style={{ fontSize: 10, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 6, fontWeight: 600, flexShrink: 0 }}>
              ↑ {node.reportsTo.name}
            </span>
          )}

          {/* Actions on hover */}
          {isAdmin && hover && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {[
                { l: '+ Child', c: '#059669' },
                { l: 'Edit',    c: '#4f46e5' },
                { l: 'Move',    c: '#d97706' },
                { l: 'Delete',  c: '#dc2626' },
              ].map((a, i) => (
                <button key={a.l} onClick={e => { e.stopPropagation(); [onAddChild, onEdit, onMove, onDelete][i](node); }}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: `1px solid ${a.c}30`,
                    background: '#fff', color: a.c, cursor: 'pointer',
                    fontSize: 11, fontWeight: 600, transition: 'all .12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = a.c; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = a.c; }}
                >{a.l}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {hasKids && open && (
        <div style={{ paddingLeft: depth * 24 + 24 }}>
          {children.map(child => (
            <Row key={child._id} node={child} depth={depth + 1} all={all}
              onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} onMove={onMove}
              isAdmin={isAdmin} expanded={expanded} toggle={toggle} highlightId={highlightId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Search bar (local search + navigate) ───────────────────── */
const SearchBar = ({ flat, expandPath, setHighlight }) => {
  const [q, setQ]   = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const results = q.trim().length > 0
    ? flat.filter(n => {
        const s = q.toLowerCase();
        return n.name?.toLowerCase().includes(s)
          || n.title?.toLowerCase().includes(s)
          || n.email?.toLowerCase().includes(s)
          || n.department?.toLowerCase().includes(s);
      }).slice(0, 10)
    : [];

  const navigateTo = (node) => {
    expandPath(node._id);
    setHighlight(node._id);
    setQ('');
    setOpen(false);
    setTimeout(() => {
      const el = document.querySelector(`[data-node-id="${node._id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    setTimeout(() => setHighlight(null), 2500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: 260 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: '7px 12px' }}>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>🔍</span>
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name, dept, email…"
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: '#374151' }}
        />
        {q && <button onClick={() => { setQ(''); setOpen(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, lineHeight: 1 }}>✕</button>}
      </div>

      {open && q.trim() && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 300, overflow: 'hidden' }}>
          {results.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>No match found</div>
          ) : results.map(r => {
            const meta = TYPE_META[r.type] || TYPE_META.role;
            const [c0, c1] = grad(r.name);
            return (
              <div key={r._id} onClick={() => navigateTo(r)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <div style={{ width: 30, height: 30, borderRadius: r.type === 'person' ? '50%' : 8, background: r.type === 'person' ? `linear-gradient(135deg,${c0},${c1})` : meta.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: r.type === 'person' ? 10 : 15, fontWeight: 800, color: r.type === 'person' ? '#fff' : meta.color, flexShrink: 0 }}>
                  {r.type === 'person' ? initials(r.name) : meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>
                    {r.title}{r.department ? ` · ${r.department}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, background: meta.color + '12', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{r.type}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Node Form Modal ────────────────────────────────────────── */
const EMPTY = { linkedUser: '', name: '', title: '', type: 'role', email: '', phone: '', department: '', reportsTo: '', positionType: 'top', parentId: '' };

const NodeForm = ({ initial, onSave, onClose, modalTitle, isEdit, allNodes, preParentId }) => {
  const [users, setUsers] = useState([]);
  const [search, setSrch] = useState('');
  const [form, setForm]   = useState(() => ({
    ...EMPTY, ...(initial || {}),
    parentId:     initial?.parentId || preParentId || '',
    positionType: preParentId ? 'under' : (initial?.parentId ? 'under' : 'top'),
  }));
  const [step, setStep] = useState(isEdit ? 'form' : 'pick');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    svc.getTenantUsers().then(r => setUsers(r.data?.users || [])).catch(() => {});
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || `${u.firstName} ${u.lastName} ${u.email} ${u.designation || ''}`.toLowerCase().includes(q);
  });

  const selectUser = u => {
    setForm(f => ({ ...f, linkedUser: u._id, name: `${u.firstName} ${u.lastName}`.trim(), title: u.designation || '', email: u.email || '', phone: u.phone || '', type: 'person' }));
    setStep('form');
  };

  const parentOptions = allNodes.filter(n => n._id !== initial?._id);
  const rtoOptions    = allNodes.filter(n => n._id !== initial?._id);

  const inp = (label, key, type = 'text') => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => set(key, e.target.value)}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{modalTitle}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>
          {step === 'pick' ? 'Select a user from your team' : 'Set position and details'}
        </div>

        {step === 'pick' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
              <span>🔍</span>
              <input value={search} onChange={e => setSrch(e.target.value)} placeholder="Search by name, email…"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13 }} autoFocus />
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 12 }}>
              {filtered.length === 0
                ? <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No users found</div>
                : filtered.map(u => {
                  const [c0, c1] = grad(`${u.firstName}${u.lastName}`);
                  return (
                    <div key={u._id} onClick={() => selectUser(u)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${c0},${c1})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {initials(`${u.firstName} ${u.lastName}`)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{u.designation || u.email}</div>
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: (ROLE_BADGE_COLOR[u.userType] || '#6366f1') + '15', color: ROLE_BADGE_COLOR[u.userType] || '#6366f1', fontWeight: 700 }}>
                        {u.userType === 'TENANT_ADMIN' ? 'Admin' : u.userType === 'TENANT_MANAGER' ? 'Manager' : 'Member'}
                      </span>
                    </div>
                  );
                })}
            </div>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button onClick={() => setStep('form')} style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }}>
                + Add as custom node (vacant role / dept) →
              </button>
            </div>
          </>
        )}

        {step === 'form' && (
          <>
            {form.linkedUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '8px 12px', marginBottom: 16 }}>
                <span style={{ fontSize: 16 }}>👤</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4338ca' }}>{form.name}</div>
                  <div style={{ fontSize: 11, color: '#6366f1' }}>{form.email}</div>
                </div>
                {!isEdit && <button onClick={() => { setForm(EMPTY); setStep('pick'); }} style={{ fontSize: 11, color: '#f43f5e', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}>Change</button>}
              </div>
            )}

            {inp('Name *', 'name')}
            {inp('Title / Designation', 'title')}

            {/* Type */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Node Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].icon} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>

            {/* Position */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>📍 Position in Hierarchy</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { val: 'top',   label: 'Top Level',  desc: 'Root / CEO', icon: '⬆️' },
                  { val: 'under', label: 'Under...',   desc: 'Child of',   icon: '↙️' },
                  { val: 'same',  label: 'Same Level', desc: 'Sibling of', icon: '↔️' },
                ].map(opt => (
                  <div key={opt.val} onClick={() => set('positionType', opt.val)}
                    style={{ padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.positionType === opt.val ? '#6366f1' : '#e2e8f0'}`, background: form.positionType === opt.val ? '#eef2ff' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{opt.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: form.positionType === opt.val ? '#4338ca' : '#475569' }}>{opt.label}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
              {(form.positionType === 'under' || form.positionType === 'same') && (
                <select value={form.parentId || ''} onChange={e => set('parentId', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                  <option value="">— Select node —</option>
                  {parentOptions.map(n => <option key={n._id} value={n._id}>{TYPE_META[n.type]?.icon} {n.name}{n.title ? ` (${n.title})` : ''}</option>)}
                </select>
              )}
            </div>

            {/* Reports To */}
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#c2410c', marginBottom: 6 }}>📋 Reports To <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></div>
              <select value={form.reportsTo || ''} onChange={e => set('reportsTo', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                <option value="">— No reporting line —</option>
                {rtoOptions.map(n => <option key={n._id} value={n._id}>{TYPE_META[n.type]?.icon} {n.name}{n.title ? ` (${n.title})` : ''}</option>)}
              </select>
            </div>

            {inp('Department', 'department')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {inp('Email', 'email', 'email')}
              {inp('Phone', 'phone', 'tel')}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Cancel</button>
              <button onClick={() => { if (!form.name.trim()) return; onSave(form); }}
                style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: form.name.trim() ? '#6366f1' : '#c7d2fe', color: '#fff', cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700 }}>
                Save Node
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Move Modal ─────────────────────────────────────────────── */
const MoveModal = ({ node, flatNodes, onMove, onClose }) => {
  const [newParentId, setNewParentId] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Move "{node.name}"</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Select new parent</div>
        <select value={newParentId} onChange={e => setNewParentId(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          <option value="">— Make top level —</option>
          {flatNodes.filter(n => n._id !== node._id).map(n => (
            <option key={n._id} value={n._id}>{TYPE_META[n.type]?.icon} {n.name}{n.title ? ` (${n.title})` : ''}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Cancel</button>
          <button onClick={() => onMove(node._id, newParentId || null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Move</button>
        </div>
      </div>
    </div>
  );
};

/* ── Delete Modal ───────────────────────────────────────────── */
const DeleteModal = ({ node, onConfirm, onClose }) => {
  const [withKids, setWithKids] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#f43f5e', marginBottom: 8 }}>Delete "{node.name}"?</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', marginBottom: 20, cursor: 'pointer' }}>
          <input type="checkbox" checked={withKids} onChange={e => setWithKids(e.target.checked)} />
          Also delete all child nodes
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Cancel</button>
          <button onClick={() => onConfirm(node._id, withKids)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#f43f5e', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Delete</button>
        </div>
      </div>
    </div>
  );
};

/* ── Rebuild Modal ──────────────────────────────────────────── */
const RebuildModal = ({ onClose, onDone, showToast }) => {
  const [clear, setClear]   = useState(true);
  const [busy, setBusy]     = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setBusy(true);
    try {
      const res = await generateTree({ clearExisting: clear });
      setResult(res.data);
      onDone();
    } catch (e) {
      showToast('Error: ' + (e.response?.data?.message || e.message));
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => !busy && e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {result ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#15803d' }}>Hierarchy Rebuilt!</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { l: 'Total Leads',   v: result.totalLeads, c: '#6366f1' },
                { l: 'Matched',       v: result.matched,    c: '#10b981' },
                { l: 'Unmatched',     v: result.unmatched,  c: '#f59e0b' },
                { l: 'Nodes Created', v: result.totalNodes, c: '#0ea5e9' },
              ].map(s => (
                <div key={s.l} style={{ background: s.c + '0d', border: `1px solid ${s.c}25`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{(s.v || 0).toLocaleString()}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Done ✓</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>🔄 Rebuild Org Hierarchy</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Matches imported leads to role template and rebuilds the tree automatically.</div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={clear} onChange={e => setClear(e.target.checked)} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Clear existing tree before rebuilding</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Recommended — avoids duplicate nodes</div>
                </div>
              </label>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 11, color: '#92400e', marginBottom: 20 }}>
              ⚠️ Requires a <strong>Role Template</strong> to be saved first.{' '}
              <a href="/role-template" style={{ color: '#6366f1', fontWeight: 700 }}>Setup here →</a>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} disabled={busy} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Cancel</button>
              <button onClick={run} disabled={busy} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: busy ? '#c7d2fe' : '#6366f1', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
                {busy ? '⏳ Rebuilding…' : '🚀 Rebuild Now'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ══ Main Page ══════════════════════════════════════════════════ */
const OrgHierarchy = () => {
  const { user } = useAuth();
  const isAdmin = ['SAAS_OWNER', 'SAAS_ADMIN', 'TENANT_ADMIN'].includes(user?.userType);

  const [flat, setFlat]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [expanded, setExpanded]             = useState(new Set());
  const [toast, setToast]                   = useState('');
  const [formModal, setFormModal]           = useState(null);
  const [deleteModal, setDeleteModal]       = useState(null);
  const [moveModal, setMoveModal]           = useState(null);
  const [rebuildModal, setRebuildModal]     = useState(false);
  const [highlightId, setHighlightId]       = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const res   = await svc.getTree();
      const nodes = res.data?.flat || [];
      setFlat(nodes);
      // auto-expand only root nodes
      setExpanded(new Set(nodes.filter(n => !n.parent).map(n => n._id)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  const toggleExpand = id => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const resolveParent = form => {
    if (form.positionType === 'top')   return null;
    if (form.positionType === 'under') return form.parentId || null;
    if (form.positionType === 'same') {
      const ref = flat.find(n => n._id === form.parentId);
      return ref?.parent || null;
    }
    return null;
  };

  const handleSave = async form => {
    try {
      const parentId = resolveParent(form);
      if (formModal.mode === 'create') {
        await svc.createNode({ name: form.name, title: form.title, type: form.type, email: form.email, phone: form.phone, department: form.department || '', parent: parentId, reportsTo: form.reportsTo || null, linkedUser: form.linkedUser || null });
        showToast('Node created ✓');
      } else {
        await svc.updateNode(formModal.node._id, { name: form.name, title: form.title, type: form.type, email: form.email, phone: form.phone, department: form.department || '', reportsTo: form.reportsTo || null, linkedUser: form.linkedUser || null });
        showToast('Node updated ✓');
      }
      setFormModal(null); loadTree();
    } catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)); }
  };

  const handleDelete = async (id, withKids) => {
    try { await svc.deleteNode(id, withKids); showToast('Deleted ✓'); setDeleteModal(null); loadTree(); }
    catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)); }
  };

  const handleMove = async (id, newParentId) => {
    try { await svc.moveNode(id, { newParentId }); showToast('Moved ✓'); setMoveModal(null); loadTree(); }
    catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)); }
  };

  // Expand all ancestors of a node so it becomes visible
  const expandPath = useCallback((nodeId) => {
    const ancestors = new Set();
    let current = flat.find(n => n._id === nodeId);
    while (current) {
      const parentId = current.parent?._id?.toString() || current.parent?.toString();
      if (!parentId) break;
      ancestors.add(parentId);
      current = flat.find(n => n._id?.toString() === parentId);
    }
    setExpanded(prev => new Set([...prev, nodeId, ...ancestors]));
  }, [flat]);

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL nodes from the hierarchy? This cannot be undone.')) return;
    try { await svc.clearAll(); showToast('Hierarchy cleared ✓'); loadTree(); }
    catch (e) { showToast('Error: ' + (e.response?.data?.message || e.message)); }
  };

  const roots = flat.filter(n => !n.parent);

  return (
    <DashboardLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#0f172a', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, animation: 'fadeUp .2s ease' }}>
          {toast}
        </div>
      )}

      {/* Modals */}
      {formModal && (
        <NodeForm
          modalTitle={formModal.mode === 'create' ? `Add ${formModal.preParentId ? 'Child' : 'Root'} Node` : `Edit "${formModal.node?.name}"`}
          isEdit={formModal.mode === 'edit'}
          preParentId={formModal.preParentId || null}
          allNodes={flat}
          initial={formModal.mode === 'edit' ? {
            _id: formModal.node._id, linkedUser: formModal.node.linkedUser || '',
            name: formModal.node.name, title: formModal.node.title,
            type: formModal.node.type, email: formModal.node.email, phone: formModal.node.phone, department: formModal.node.department || '',
            reportsTo: formModal.node.reportsTo?._id || formModal.node.reportsTo || '',
            parentId: formModal.node.parent || '', positionType: formModal.node.parent ? 'under' : 'top',
          } : null}
          onSave={handleSave}
          onClose={() => setFormModal(null)}
        />
      )}
      {deleteModal && <DeleteModal node={deleteModal} onConfirm={handleDelete} onClose={() => setDeleteModal(null)} />}
      {moveModal   && <MoveModal   node={moveModal}   flatNodes={flat} onMove={handleMove} onClose={() => setMoveModal(null)} />}
      {rebuildModal && <RebuildModal showToast={showToast} onDone={loadTree} onClose={() => setRebuildModal(false)} />}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f0c29,#1e1654,#0d1b4b)', borderRadius: 20, padding: '22px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: 40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.25),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Organisation</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginTop: 4 }}>
            Company <span style={{ background: 'linear-gradient(90deg,#a78bfa,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hierarchy</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Build, manage and explore your organization structure</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap', background: '#fff', borderRadius: 14, padding: '10px 14px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <SearchBar flat={flat} expandPath={expandPath} setHighlight={setHighlightId} />
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { l: '⊞ Expand All',   fn: () => setExpanded(new Set(flat.map(n => n._id))) },
            { l: '⊟ Collapse All', fn: () => setExpanded(new Set()) },
          ].map(b => (
            <button key={b.l} onClick={b.fn} style={{
              padding: '7px 13px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#f8fafc', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#475569',
              transition: 'all .12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
            >{b.l}</button>
          ))}
          {isAdmin && (
            <>
              <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />
              <button onClick={handleClearAll} style={{
                padding: '8px 14px', background: '#fff1f2', color: '#f43f5e',
                border: '1.5px solid #fecdd3', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>🗑 Clear All</button>
              <button onClick={() => setRebuildModal(true)} style={{
                padding: '8px 14px', background: '#0f172a', color: '#fff',
                border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(15,23,42,0.2)',
              }}>🔄 Rebuild from Leads</button>
              <button onClick={() => setFormModal({ mode: 'create', preParentId: null })} style={{
                padding: '8px 18px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}>+ Add Root</button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ padding: '5px 14px', borderRadius: 8, background: '#111827', color: '#fff', fontSize: 12, fontWeight: 700 }}>
          {flat.length} total nodes
        </div>
        {TYPES.map(t => {
          const count = flat.filter(n => n.type === t).length;
          if (!count) return null;
          const meta = TYPE_META[t];
          return (
            <div key={t} style={{
              padding: '5px 12px', borderRadius: 8,
              background: meta.color + '10', border: `1px solid ${meta.color}25`,
              fontSize: 12, fontWeight: 600, color: meta.color,
            }}>
              {meta.icon} {count} {t}s
            </div>
          );
        }).filter(Boolean)}
      </div>

      {/* Tree */}
      {loading ? <Spin /> : flat.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 20px', background: '#fff', borderRadius: 20, border: '2px dashed #e0e7ff' }}>
          <div style={{ fontSize: 52 }}>🏢</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#475569' }}>No hierarchy defined yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', maxWidth: 400 }}>
            Import leads and use Role Template Builder to auto-generate, or add a root node manually.
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a href="/role-template" style={{ padding: '10px 20px', background: '#0f172a', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>🏗️ Role Template</a>
              <button onClick={() => setRebuildModal(true)} style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🔄 Rebuild from Leads</button>
              <button onClick={() => setFormModal({ mode: 'create', preParentId: null })} style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Create Root Node</button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eaecf4', padding: '12px 10px' }}>
          {roots.length === 0
            ? <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No root nodes found</div>
            : roots.map(root => (
              <Row key={root._id} node={root} depth={0} all={flat}
                onEdit={n => setFormModal({ mode: 'edit', node: n })}
                onDelete={n => setDeleteModal(n)}
                onAddChild={n => setFormModal({ mode: 'create', preParentId: n._id })}
                onMove={n => setMoveModal(n)}
                isAdmin={isAdmin} expanded={expanded} toggle={toggleExpand}
                highlightId={highlightId}
              />
            ))
          }
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 14, padding: '10px 18px', background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guide</span>
        {[
          { icon: '▸', label: 'Click arrow to expand / collapse' },
          { icon: '✎', label: 'Hover card → action buttons appear' },
          { icon: '↑', label: 'Reports to = functional reporting line', color: '#6366f1' },
          { icon: '🏬', label: 'Department badge' },
          { icon: '✉', label: 'Email always visible' },
        ].map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: l.color || '#64748b' }}>
            <span style={{ fontWeight: 700 }}>{l.icon}</span> {l.label}
          </span>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default OrgHierarchy;
