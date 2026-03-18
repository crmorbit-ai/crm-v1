import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import notificationService from '../services/notificationService';
import { useNotifications } from '../context/NotificationContext';

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
  meeting_created:              { icon: '📅', color: '#d97706', bg: '#fef3c7', label: 'Meeting' },
  support_ticket_created:       { icon: '🎫', color: '#dc2626', bg: '#fee2e2', label: 'Support' },
  support_ticket_status_changed:{ icon: '🎫', color: '#dc2626', bg: '#fee2e2', label: 'Support' },
  invoice_overdue:              { icon: '💰', color: '#dc2626', bg: '#fee2e2', label: 'Invoice' },
  invoice_created:              { icon: '💵', color: '#16a34a', bg: '#dcfce7', label: 'Invoice' },
  email_received:               { icon: '📧', color: '#2563eb', bg: '#dbeafe', label: 'Email' },
  note_added:                   { icon: '📝', color: '#64748b', bg: '#f1f5f9', label: 'Note' },
};

const ENTITY_ROUTES = {
  Task: '/tasks', Lead: '/leads', Opportunity: '/opportunities',
  Contact: '/contacts', Account: '/accounts', SupportTicket: '/support', Invoice: '/invoices'
};

const CATS = [
  { v: '', l: 'All Types' },
  { v: 'task',        l: 'Tasks',         types: ['task_assigned','task_overdue','task_completed','task_updated'] },
  { v: 'lead',        l: 'Leads',         types: ['lead_created','lead_assigned','lead_status_changed','lead_converted'] },
  { v: 'opportunity', l: 'Opportunities', types: ['opportunity_created','opportunity_stage_changed','opportunity_won','opportunity_lost'] },
  { v: 'contact',     l: 'Contacts',      types: ['contact_created'] },
  { v: 'account',     l: 'Accounts',      types: ['account_created'] },
  { v: 'support',     l: 'Support',       types: ['support_ticket_created','support_ticket_status_changed'] },
  { v: 'invoice',     l: 'Invoices',      types: ['invoice_overdue','invoice_created'] },
];

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function Notifications() {
  const navigate = useNavigate();
  const { fetchUnreadCount } = useNotifications();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('');
  const [readF, setReadF] = useState('');
  const [page, setPage] = useState(1);
  const [pag, setPag] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = { page, limit: 20 };
      const found = CATS.find(c => c.v === cat);
      if (found?.types?.[0]) p.type = found.types[0];
      if (readF !== '') p.isRead = readF;
      const r = await notificationService.getNotifications(p);
      setNotifs(r?.data?.notifications || []);
      setPag(r?.data?.pagination || {});
    } catch {}
    finally { setLoading(false); }
  }, [page, cat, readF]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (n) => {
    if (!n.isRead) {
      setBusyId(n._id);
      await notificationService.markAsRead(n._id);
      setNotifs(p => p.map(x => x._id === n._id ? { ...x, isRead: true } : x));
      fetchUnreadCount();
      setBusyId(null);
    }
    const base = n.entityType ? ENTITY_ROUTES[n.entityType] : null;
    if (base && n.entityId) navigate(`${base}/${n.entityId}`);
  };

  const markAll = async () => {
    await notificationService.markAllAsRead();
    setNotifs(p => p.map(n => ({ ...n, isRead: true })));
    fetchUnreadCount();
  };

  const del = async (e, id) => {
    e.stopPropagation();
    setBusyId(id);
    await notificationService.deleteNotification(id);
    setNotifs(p => p.filter(n => n._id !== id));
    fetchUnreadCount();
    setBusyId(null);
  };

  const unread = notifs.filter(n => !n.isRead).length;
  const total = pag.total || 0;

  return (
    <DashboardLayout title="Notifications">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total',     value: total,              icon: '🔔', from: '#1d4ed8', to: '#2563eb', shadow: 'rgba(37,99,235,0.35)' },
          { label: 'Unread',   value: unread,             icon: '🔵', from: '#6d28d9', to: '#7c3aed', shadow: 'rgba(124,58,237,0.35)' },
          { label: 'Read',     value: total - unread,     icon: '✅', from: '#15803d', to: '#16a34a', shadow: 'rgba(22,163,74,0.35)'  },
          { label: 'This Page',value: notifs.length,      icon: '📄', from: '#b45309', to: '#d97706', shadow: 'rgba(217,119,6,0.35)'  },
        ].map(s => (
          <div key={s.label}
            className="relative overflow-hidden rounded-xl p-4 flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})`, boxShadow: `0 4px 14px ${s.shadow}` }}>
            {/* watermark circle */}
            <div className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="absolute -right-1 top-2 w-10 h-10 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.18)' }}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white leading-none">{s.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTERS BAR ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Category */}
        <div className="flex flex-wrap gap-1.5">
          {CATS.map(c => (
            <button key={c.v} onClick={() => { setCat(c.v); setPage(1); }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150"
              style={{
                background: cat === c.v ? '#3b82f6' : '#fff',
                color: cat === c.v ? '#fff' : '#64748b',
                borderColor: cat === c.v ? '#3b82f6' : '#e2e8f0',
              }}>
              {c.l}
            </button>
          ))}
        </div>

        {/* Read toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 ml-auto">
          {[['', 'All'], ['false', 'Unread'], ['true', 'Read']].map(([v, l]) => (
            <button key={v} onClick={() => { setReadF(v); setPage(1); }}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
              style={{
                background: readF === v ? '#fff' : 'transparent',
                color: readF === v ? '#1e293b' : '#64748b',
                boxShadow: readF === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
              {l}
            </button>
          ))}
        </div>

        {unread > 0 && (
          <button onClick={markAll}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
            style={{ background: '#3b82f6' }}>
            ✓ Mark all read
            <span className="bg-white/25 rounded-full px-1.5">{unread}</span>
          </button>
        )}
      </div>

      {/* ── NOTIFICATION LIST ── */}
      <div className="rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>

        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-5 py-4 border-b border-gray-100 animate-pulse bg-white">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex gap-2 mb-2">
                  <div className="h-3.5 w-36 bg-gray-100 rounded-full" />
                  <div className="h-3.5 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="h-3 w-3/4 bg-gray-100 rounded-full mb-1.5" />
                <div className="h-2.5 w-20 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
              style={{ background: '#f3f4f6' }}>🔔</div>
            <p className="text-sm font-semibold text-gray-600 mb-1">
              {readF === 'false' ? "You're all caught up!" : 'No notifications'}
            </p>
            <p className="text-xs text-gray-400">Nothing to show here.</p>
          </div>
        ) : (
          notifs.map((n, i) => {
            const c = TYPE_CONFIG[n.type] || { icon: '🔔', color: '#64748b', bg: '#f1f5f9', label: '' };
            const isLast = i === notifs.length - 1;
            return (
              <div key={n._id} onClick={() => markRead(n)}
                className="group cursor-pointer transition-all duration-150"
                style={{
                  borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                  borderLeft: `4px solid ${n.isRead ? 'transparent' : c.color}`,
                  background: n.isRead ? '#ffffff' : `${c.color}08`,
                  opacity: busyId === n._id ? 0.5 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = n.isRead ? '#f8fafc' : `${c.color}12`; }}
                onMouseLeave={e => { e.currentTarget.style.background = n.isRead ? '#ffffff' : `${c.color}08`; }}
              >
                <div className="flex items-start gap-3 px-4 py-3.5">
                  {/* Icon bubble */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: c.bg, border: `1px solid ${c.color}22` }}>
                    {c.icon}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm leading-tight" style={{ fontWeight: n.isRead ? 500 : 700, color: n.isRead ? '#374151' : '#111827' }}>
                        {n.title}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                        style={{ background: c.bg, color: c.color, borderColor: c.color + '33' }}>
                        {c.label}
                      </span>
                      {!n.isRead && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                          style={{ background: c.color, fontSize: '10px' }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed mb-1.5" style={{ color: '#6b7280' }}>{n.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>🕐 {timeAgo(n.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center"
                    onClick={e => e.stopPropagation()}>
                    {!n.isRead && (
                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          setBusyId(n._id);
                          await notificationService.markAsRead(n._id);
                          setNotifs(p => p.map(x => x._id === n._id ? { ...x, isRead: true } : x));
                          fetchUnreadCount();
                          setBusyId(null);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                        style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                        title="Mark read">
                        ✓ Read
                      </button>
                    )}
                    <button onClick={e => del(e, n._id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold transition-all"
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                      title="Delete">×
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── PAGINATION ── */}
      {pag.pages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-400">
            Page {page} of {pag.pages} · {total} total
          </span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, pag.pages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, pag.pages - 4));
              const p = start + i;
              if (p > pag.pages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className="w-8 h-7 text-xs font-semibold rounded-lg border transition-colors"
                  style={{
                    background: p === page ? '#3b82f6' : '#fff',
                    color: p === page ? '#fff' : '#374151',
                    borderColor: p === page ? '#3b82f6' : '#e2e8f0',
                  }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(pag.pages, p + 1))} disabled={page === pag.pages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
