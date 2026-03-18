import React, { useState, useEffect, useCallback } from 'react';
import SaasLayout, { useWindowSize } from '../components/layout/SaasLayout';
import { tenantService } from '../services/tenantService';
import notificationService from '../services/notificationService';

const TYPE_CONFIG = {
  task_assigned:                { icon: '📋', color: '#7c3aed', bg: '#ede9fe', label: 'Task' },
  task_overdue:                 { icon: '⏰', color: '#dc2626', bg: '#fee2e2', label: 'Task' },
  task_completed:               { icon: '✅', color: '#16a34a', bg: '#dcfce7', label: 'Task' },
  task_updated:                 { icon: '🔄', color: '#7c3aed', bg: '#ede9fe', label: 'Task' },
  lead_created:                 { icon: '🧲', color: '#2563eb', bg: '#dbeafe', label: 'Lead' },
  lead_assigned:                { icon: '👤', color: '#2563eb', bg: '#dbeafe', label: 'Lead' },
  lead_status_changed:          { icon: '🔁', color: '#0891b2', bg: '#cffafe', label: 'Lead' },
  lead_converted:               { icon: '🔄', color: '#0891b2', bg: '#cffafe', label: 'Lead' },
  opportunity_created:          { icon: '💼', color: '#d97706', bg: '#fef3c7', label: 'Opportunity' },
  opportunity_stage_changed:    { icon: '📈', color: '#d97706', bg: '#fef3c7', label: 'Opportunity' },
  opportunity_won:              { icon: '🏆', color: '#16a34a', bg: '#dcfce7', label: 'Won' },
  opportunity_lost:             { icon: '💔', color: '#dc2626', bg: '#fee2e2', label: 'Lost' },
  contact_created:              { icon: '👤', color: '#0891b2', bg: '#cffafe', label: 'Contact' },
  account_created:              { icon: '🏢', color: '#7c3aed', bg: '#ede9fe', label: 'Account' },
  meeting_reminder:             { icon: '📅', color: '#d97706', bg: '#fef3c7', label: 'Meeting' },
  support_ticket_created:       { icon: '🎫', color: '#dc2626', bg: '#fee2e2', label: 'Support' },
  support_ticket_status_changed:{ icon: '🎫', color: '#dc2626', bg: '#fee2e2', label: 'Support' },
  invoice_overdue:              { icon: '💰', color: '#dc2626', bg: '#fee2e2', label: 'Invoice' },
  invoice_created:              { icon: '💵', color: '#16a34a', bg: '#dcfce7', label: 'Invoice' },
  email_received:               { icon: '📧', color: '#2563eb', bg: '#dbeafe', label: 'Email' },
  note_added:                   { icon: '📝', color: '#64748b', bg: '#f1f5f9', label: 'Note' },
};

const CRM_TYPES = [
  { v: '', l: 'All' },
  { v: 'lead_created',          l: 'Leads' },
  { v: 'task_assigned',         l: 'Tasks' },
  { v: 'opportunity_created',   l: 'Opportunities' },
  { v: 'contact_created',       l: 'Contacts' },
  { v: 'account_created',       l: 'Accounts' },
  { v: 'support_ticket_created',l: 'Support' },
];

const DEL_STATUS = {
  pending:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'Pending Review' },
  approved: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: 'Deletion Approved' },
  rejected: { bg: '#dcfce7', color: '#15803d', border: '#86efac', label: 'Rejected' },
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const daysLeft = (d) => d ? Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000)) : 0;

export default function SaasNotifications() {
  const { isMobile } = useWindowSize();
  const [tab, setTab] = useState('crm');

  // CRM state
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pag, setPag]           = useState({});
  const [tenantF, setTenantF]   = useState('');
  const [typeF, setTypeF]       = useState('');
  const [readF, setReadF]       = useState('');
  const [tenants, setTenants]   = useState([]);
  const [busyId, setBusyId]     = useState(null);

  // Deletion state
  const [delItems, setDelItems]     = useState([]);
  const [delLoading, setDelLoading] = useState(false);
  const [delFilter, setDelFilter]   = useState('pending');
  const [actionId, setActionId]     = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadCrm = useCallback(async () => {
    setLoading(true);
    try {
      const p = { page, limit: 20 };
      if (tenantF) p.tenantId = tenantF;
      if (typeF)   p.type     = typeF;
      if (readF !== '') p.isRead = readF;
      const r = await notificationService.getNotifications(p);
      setNotifs(r?.data?.notifications || []);
      setPag(r?.data?.pagination || {});
    } catch {}
    finally { setLoading(false); }
  }, [page, tenantF, typeF, readF]);

  useEffect(() => { if (tab === 'crm') loadCrm(); }, [tab, loadCrm]);

  useEffect(() => {
    tenantService.getTenants({ page: 1, limit: 200 })
      .then(d => setTenants(d.tenants || d || []))
      .catch(() => {});
  }, []);

  const loadDel = useCallback(async () => {
    setDelLoading(true);
    try {
      const p = { page: 1, limit: 1000 };
      if (delFilter !== 'all') p.deletionStatus = delFilter;
      const d = await tenantService.getTenants(p);
      const all = d.tenants || d || [];
      setDelItems(all.filter(t => t.deletionRequest?.status && t.deletionRequest.status !== 'none'));
    } catch {}
    finally { setDelLoading(false); }
  }, [delFilter]);

  useEffect(() => { if (tab === 'deletion') loadDel(); }, [tab, loadDel]);

  const markAll  = async () => { await notificationService.markAllAsRead(); setNotifs(p => p.map(n => ({ ...n, isRead: true }))); };
  const markOne  = async (e, id) => { e.stopPropagation(); setBusyId(id); await notificationService.markAsRead(id); setNotifs(p => p.map(n => n._id === id ? { ...n, isRead: true } : n)); setBusyId(null); };
  const delNotif = async (e, id) => { e.stopPropagation(); setBusyId(id); await notificationService.deleteNotification(id); setNotifs(p => p.filter(n => n._id !== id)); setBusyId(null); };

  const approve = async (id, name) => {
    if (!window.confirm(`Approve deletion for "${name}"? Data will be permanently deleted after 45 days.`)) return;
    setActionId(id);
    try { await tenantService.approveDeletion(id); await loadDel(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActionId(rejectModal.id);
    try { await tenantService.rejectDeletion(rejectModal.id, rejectReason); setRejectModal(null); setRejectReason(''); await loadDel(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  const recover = async (id, name) => {
    if (!window.confirm(`Recover "${name}"?`)) return;
    setActionId(id);
    try { await tenantService.recoverTenant(id); await loadDel(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  const unread   = notifs.filter(n => !n.isRead).length;
  const total    = pag.total || 0;
  const pending  = delItems.filter(t => t.deletionRequest?.status === 'pending').length;
  const tenantSet = new Set(notifs.map(n => n.tenant?._id).filter(Boolean));

  return (
    <SaasLayout title="Notifications">

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Notifications</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>Monitor all tenant activity and system alerts</p>
        </div>
        {pending > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '7px 14px' }}>
            <span style={{ fontSize: 16 }}>🚨</span>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{pending} deletion request{pending > 1 ? 's' : ''} pending</p>
              <p style={{ margin: 0, fontSize: 11, color: '#b91c1c' }}>Requires your review</p>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN TABS ── */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 20, background: '#f1f5f9', padding: 3, borderRadius: 10, width: 'fit-content' }}>
        {[
          { k: 'crm',      l: 'CRM Activity',     badge: unread },
          { k: 'deletion', l: 'Deletion Requests', badge: pending, danger: true },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 13,
            fontWeight: tab === t.k ? 700 : 500,
            color: tab === t.k ? '#0f172a' : '#64748b',
            background: tab === t.k ? '#fff' : 'transparent',
            cursor: 'pointer', boxShadow: tab === t.k ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
          }}>
            {t.l}
            {t.badge > 0 && (
              <span style={{ background: t.danger ? '#dc2626' : '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════ CRM TAB ══════════════════ */}
      {tab === 'crm' && (
        <div>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'Total',    value: total,           icon: '🔔', accent: '#3b82f6', from: '#eff6ff' },
              { label: 'Unread',   value: unread,          icon: '🔵', accent: '#7c3aed', from: '#f5f3ff' },
              { label: 'Tenants',  value: tenantSet.size,  icon: '🏢', accent: '#d97706', from: '#fffbeb' },
              { label: 'This Page',value: notifs.length,   icon: '📄', accent: '#16a34a', from: '#f0fdf4' },
            ].map(s => (
              <div key={s.label} style={{
                position: 'relative', overflow: 'hidden', borderRadius: 10,
                border: '1px solid #e2e8f0', padding: '14px 16px',
                background: `linear-gradient(135deg, ${s.from} 0%, #fff 100%)`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: s.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {s.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.value}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <select value={tenantF} onChange={e => { setTenantF(e.target.value); setPage(1); }}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, background: '#fff', color: '#374151', cursor: 'pointer', minWidth: 160, outline: 'none' }}>
              <option value="">All Tenants</option>
              {tenants.map(t => <option key={t._id} value={t._id}>{t.organizationName}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {CRM_TYPES.map(c => (
                <button key={c.v} onClick={() => { setTypeF(c.v); setPage(1); }}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: typeF === c.v ? 700 : 500,
                    border: `1.5px solid ${typeF === c.v ? '#3b82f6' : '#e2e8f0'}`,
                    background: typeF === c.v ? '#3b82f6' : '#fff',
                    color: typeF === c.v ? '#fff' : '#64748b', cursor: 'pointer'
                  }}>
                  {c.l}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 2, marginLeft: 'auto' }}>
              {[['', 'All'], ['false', 'Unread'], ['true', 'Read']].map(([v, l]) => (
                <button key={v} onClick={() => { setReadF(v); setPage(1); }}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 11, border: 'none',
                    background: readF === v ? '#fff' : 'transparent',
                    color: readF === v ? '#0f172a' : '#64748b',
                    fontWeight: readF === v ? 600 : 400, cursor: 'pointer',
                    boxShadow: readF === v ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                  }}>
                  {l}
                </button>
              ))}
            </div>

            {unread > 0 && (
              <button onClick={markAll} style={{ padding: '5px 13px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                ✓ Mark all read
                <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 8, padding: '0 5px' }}>{unread}</span>
              </button>
            )}
          </div>

          {total > 0 && (
            <p style={{ margin: '0 0 10px', fontSize: 11, color: '#94a3b8' }}>
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total} notifications
            </p>
          )}

          {/* List */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '11px 16px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
                      <div style={{ width: '22%', height: 10, background: '#f1f5f9', borderRadius: 4 }} />
                      <div style={{ width: '12%', height: 10, background: '#f1f5f9', borderRadius: 4 }} />
                    </div>
                    <div style={{ width: '55%', height: 12, background: '#f1f5f9', borderRadius: 4, marginBottom: 5 }} />
                    <div style={{ width: '70%', height: 10, background: '#f1f5f9', borderRadius: 4 }} />
                  </div>
                </div>
              ))
            ) : notifs.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#334155' }}>All clear!</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>No notifications match the current filters.</p>
              </div>
            ) : notifs.map((n, i) => {
              const c = TYPE_CONFIG[n.type] || { icon: '🔔', color: '#64748b', bg: '#f1f5f9', label: '' };
              return (
                <div key={n._id}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 16px',
                    borderBottom: i < notifs.length - 1 ? '1px solid #f8fafc' : 'none',
                    borderLeft: `3px solid ${n.isRead ? 'transparent' : c.color}`,
                    background: n.isRead ? '#fff' : '#fafbff',
                    alignItems: 'flex-start', opacity: busyId === n._id ? 0.5 : 1,
                    transition: 'background 0.1s', cursor: 'default'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = n.isRead ? '#fff' : '#fafbff'}
                >
                  {/* Icon */}
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                    {c.icon}
                  </div>
                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 5, marginBottom: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                      {n.tenant?.organizationName && (
                        <span style={{ fontSize: 10, background: '#dbeafe', color: '#1d4ed8', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>
                          {n.tenant.organizationName}
                        </span>
                      )}
                      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: c.bg, color: c.color, fontWeight: 600 }}>{c.label}</span>
                      {!n.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, display: 'inline-block' }} />}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: '#0f172a', marginBottom: 2 }}>{n.title}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 3 }}>{n.message}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                      {timeAgo(n.createdAt)}
                      {n.userId?.firstName && ` · for ${n.userId.firstName} ${n.userId.lastName}`}
                    </p>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {!n.isRead && (
                      <button onClick={e => markOne(e, n._id)}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#6b7280'; }}
                        style={{ width: 27, height: 27, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#6b7280', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Mark read">✓</button>
                    )}
                    <button onClick={e => delNotif(e, n._id)}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#d1d5db'; }}
                      style={{ width: 27, height: 27, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#d1d5db', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                      title="Delete">×</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pag.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Page {page} of {pag.pages} · {total} total</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pgb(page === 1)}>← Prev</button>
                {Array.from({ length: Math.min(5, pag.pages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, pag.pages - 4));
                  const p = start + i;
                  if (p > pag.pages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ ...pgb(false), background: p === page ? '#3b82f6' : '#fff', color: p === page ? '#fff' : '#374151', borderColor: p === page ? '#3b82f6' : '#e2e8f0', fontWeight: p === page ? 700 : 400, minWidth: 32 }}>{p}</button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(pag.pages, p + 1))} disabled={page === pag.pages} style={pgb(page === pag.pages)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ DELETION TAB ══════════════════ */}
      {tab === 'deletion' && (
        <div>
          {/* Sub tabs */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 16, background: '#f1f5f9', padding: 3, borderRadius: 9, width: 'fit-content' }}>
            {[
              { k: 'pending',  l: 'Pending',  cnt: delItems.filter(t => t.deletionRequest?.status === 'pending').length },
              { k: 'approved', l: 'Approved' },
              { k: 'rejected', l: 'Rejected' },
              { k: 'all',      l: 'All' },
            ].map(t => (
              <button key={t.k} onClick={() => setDelFilter(t.k)} style={{
                padding: '6px 15px', borderRadius: 7, border: 'none', fontSize: 12,
                fontWeight: delFilter === t.k ? 700 : 500,
                color: delFilter === t.k ? '#0f172a' : '#64748b',
                background: delFilter === t.k ? '#fff' : 'transparent',
                cursor: 'pointer', boxShadow: delFilter === t.k ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex', alignItems: 'center', gap: 5
              }}>
                {t.l}
                {t.cnt > 0 && <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, padding: '0 5px', borderRadius: 8 }}>{t.cnt}</span>}
              </button>
            ))}
          </div>

          {pending > 0 && delFilter !== 'approved' && delFilter !== 'rejected' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{pending} organization{pending > 1 ? 's' : ''} requesting deletion</p>
                <p style={{ margin: 0, fontSize: 11, color: '#b91c1c' }}>Review and take action before data is permanently deleted</p>
              </div>
            </div>
          )}

          {delLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : delItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#334155' }}>No requests found</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>All deletion requests have been handled</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {delItems.map(tenant => {
                const dr  = tenant.deletionRequest;
                const sc  = DEL_STATUS[dr.status] || {};
                const busy = actionId === tenant._id;
                const dl  = daysLeft(dr.permanentDeleteAt);
                return (
                  <div key={tenant._id} style={{
                    background: '#fff', border: `1.5px solid ${dr.status === 'pending' ? '#fca5a5' : '#e2e8f0'}`,
                    borderRadius: 10, padding: isMobile ? '14px' : '16px 20px',
                    boxShadow: dr.status === 'pending' ? '0 2px 8px rgba(220,38,38,0.07)' : '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                          {tenant.organizationName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{tenant.organizationName}</p>
                          <p style={{ margin: '1px 0 0', fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{tenant.organizationId} · {tenant.contactEmail}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap' }}>
                        {sc.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: dr.reason ? 10 : 12, flexWrap: 'wrap' }}>
                      <div style={dBox}>
                        <span style={dLabel}>Requested</span>
                        <span style={dVal}>{fmtDate(dr.requestedAt)}</span>
                      </div>
                      {dr.permanentDeleteAt && (
                        <div style={{ ...dBox, background: dl <= 7 ? '#fef2f2' : '#f8fafc', borderColor: dl <= 7 ? '#fca5a5' : '#e2e8f0' }}>
                          <span style={dLabel}>Delete Date</span>
                          <span style={{ ...dVal, color: dl <= 7 ? '#dc2626' : '#0f172a' }}>
                            {fmtDate(dr.permanentDeleteAt)}
                            <span style={{ fontSize: 10, fontWeight: 500, color: dl <= 7 ? '#dc2626' : '#64748b', marginLeft: 4 }}>({dl}d left)</span>
                          </span>
                        </div>
                      )}
                      {dr.rejectionReason && (
                        <div style={dBox}>
                          <span style={dLabel}>Rejection Reason</span>
                          <span style={dVal}>{dr.rejectionReason}</span>
                        </div>
                      )}
                    </div>

                    {dr.reason && (
                      <div style={{ background: '#f8fafc', borderLeft: '3px solid #cbd5e1', borderRadius: '0 6px 6px 0', padding: '8px 12px', marginBottom: 12 }}>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>Tenant's Reason</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.55 }}>{dr.reason}</p>
                      </div>
                    )}

                    {dr.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => approve(tenant._id, tenant.organizationName)} disabled={busy}
                          style={{ padding: '7px 18px', background: busy ? '#9ca3af' : '#dc2626', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                          {busy ? 'Processing...' : '✅ Approve Deletion'}
                        </button>
                        <button onClick={() => { setRejectModal({ id: tenant._id, name: tenant.organizationName }); setRejectReason(''); }} disabled={busy}
                          style={{ padding: '7px 18px', background: '#fff', border: '1.5px solid #dc2626', borderRadius: 7, color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                          ❌ Reject
                        </button>
                      </div>
                    )}
                    {dr.status === 'approved' && (
                      <button onClick={() => recover(tenant._id, tenant.organizationName)} disabled={busy}
                        style={{ padding: '7px 18px', background: busy ? '#9ca3af' : '#16a34a', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                        {busy ? 'Processing...' : '🔄 Recover Account'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Reject Deletion Request</h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>
              For <strong style={{ color: '#0f172a' }}>{rejectModal.name}</strong>. Tenant will be notified via email.
            </p>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Reason <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why the request is being rejected..."
              rows={3}
              style={{ width: '100%', padding: '9px 11px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                style={{ flex: 1, padding: 11, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancel
              </button>
              <button onClick={reject} disabled={actionId === rejectModal.id}
                style={{ flex: 1, padding: 11, background: '#dc2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                {actionId === rejectModal.id ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SaasLayout>
  );
}

const pgb = (dis) => ({
  padding: '5px 13px', border: '1px solid #e2e8f0', borderRadius: 7,
  background: '#fff', cursor: dis ? 'not-allowed' : 'pointer',
  color: dis ? '#cbd5e1' : '#374151', fontSize: 12, opacity: dis ? 0.6 : 1
});
const dBox   = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '8px 12px', minWidth: 120 };
const dLabel = { display: 'block', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 };
const dVal   = { display: 'block', fontSize: 12, fontWeight: 600, color: '#0f172a' };
