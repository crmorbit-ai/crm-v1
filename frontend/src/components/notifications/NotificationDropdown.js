import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_ICONS = {
  task_assigned: '📋',
  task_overdue: '⏰',
  task_completed: '✅',
  task_updated: '📋',
  lead_created: '🧲',
  lead_assigned: '🧲',
  lead_status_changed: '🧲',
  lead_converted: '🔄',
  opportunity_created: '💼',
  opportunity_stage_changed: '💼',
  opportunity_won: '🏆',
  opportunity_lost: '❌',
  contact_created: '👤',
  account_created: '🏢',
  meeting_reminder: '📅',
  meeting_created: '📅',
  support_ticket_created: '🎫',
  support_ticket_status_changed: '🎫',
  invoice_overdue: '💰',
  invoice_created: '💰',
  email_received: '📧',
  note_added: '📝',
  tenant_registered: '🏢',
  subscription_changed: '💳',
  payment_failed: '⚠️'
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const ENTITY_ROUTES = {
  Task: '/tasks',
  Lead: '/leads',
  Opportunity: '/opportunities',
  Contact: '/contacts',
  Account: '/accounts',
  SupportTicket: '/support',
  Invoice: '/invoices'
};

const NotificationDropdown = ({ onClose, onSeeAll }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchUnreadCount } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await notificationService.getNotifications({ page: 1, limit: 10 });
        setNotifications(res?.data?.notifications || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await notificationService.markAsRead(notif._id);
      fetchUnreadCount();
    }
    const base = notif.entityType ? ENTITY_ROUTES[notif.entityType] : null;
    if (base && notif.entityId) {
      navigate(`${base}/${notif.entityId}`);
    } else if (base) {
      navigate(base);
    }
    onClose();
  };

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      width: '360px',
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>Notifications</span>
        <button
          onClick={async () => {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            fetchUnreadCount();
          }}
          style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
        >
          Mark all as read
        </button>
      </div>

      {/* List */}
      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No notifications yet</div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif._id}
              onClick={() => handleClick(notif)}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                background: notif.isRead ? '#fff' : '#f0f4ff',
                borderBottom: '1px solid #f9fafb',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? '#fff' : '#f0f4ff'}
            >
              <div style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>
                {TYPE_ICONS[notif.type] || '🔔'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: notif.isRead ? '400' : '600', fontSize: '13px', color: '#111827', marginBottom: '2px' }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4, marginBottom: '4px' }}>
                  {notif.message}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {timeAgo(notif.createdAt)}
                </div>
              </div>
              {!notif.isRead && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: '6px' }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
        <button
          onClick={onSeeAll}
          style={{ fontSize: '13px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
