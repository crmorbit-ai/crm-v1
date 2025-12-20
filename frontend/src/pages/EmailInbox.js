import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import emailService from '../services/emailService';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import '../styles/crm.css';

const EmailInbox = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('conversations'); // conversations, all, sent, received
  const [filters, setFilters] = useState({
    search: '',
    emailType: '',
    status: '',
    page: 1,
    limit: 20
  });
  const [stats, setStats] = useState(null);
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);
  const [currentThread, setCurrentThread] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    fetchEmails();
    fetchStats();
  }, [tab, filters.page, filters.emailType, filters.status]);

  // Socket.io real-time email notifications
  useEffect(() => {
    if (!user?.tenant) return;

    console.log('🔌 Initializing Socket.io connection...');

    // Connect to Socket.io server
    socketService.connect();

    // Join tenant room
    socketService.joinTenant(user.tenant);
    setSocketConnected(true);

    // Listen for new email events
    const handleNewEmail = (data) => {
      console.log('📧 New email received:', data);

      // Show notification
      showNotification(
        `New Email: ${data.notification.subject}`,
        'success'
      );

      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Sound play failed:', e));
      } catch (e) {
        // Ignore sound errors
      }

      // Refresh email list to show new email
      fetchEmails();
      fetchStats();
    };

    socketService.onNewEmail(handleNewEmail);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up Socket.io connection...');
      socketService.offNewEmail(handleNewEmail);
      socketService.disconnect();
      setSocketConnected(false);
    };
  }, [user?.tenant]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        direction: tab === 'sent' ? 'sent' : tab === 'received' ? 'received' : undefined,
        conversationsOnly: tab === 'conversations' ? 'true' : undefined
      };
      const response = await emailService.getEmails(params);
      setEmails(response.data?.emails || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await emailService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await emailService.syncEmails();
      await fetchEmails();
      await fetchStats();
      alert('✅ Emails synced successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      alert('❌ Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  };

  const viewThread = async (email) => {
    try {
      const response = await emailService.getThread(email.messageId);
      setCurrentThread(response.data?.thread || []);
      setThreadDialogOpen(true);

      // Mark as read
      if (!email.isRead) {
        await emailService.markAsRead(email._id);
        fetchEmails(); // Refresh list
      }
    } catch (error) {
      console.error('Error loading thread:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmails();
  };

  const handleDeleteClick = (email, e) => {
    e.stopPropagation(); // Prevent opening thread
    setEmailToDelete(email);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await emailService.deleteEmail(emailToDelete._id);
      setDeleteConfirmOpen(false);
      setEmailToDelete(null);
      showNotification('Email deleted successfully', 'success');
      fetchEmails();
      fetchStats();
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('Failed to delete email', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: '#2196F3',
      delivered: '#4CAF50',
      replied: '#9C27B0',
      failed: '#f44336',
      bounced: '#FF9800'
    };
    return colors[status] || '#757575';
  };

  return (
    <DashboardLayout>
      <div className="crm-container">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1rem 0'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              margin: 0,
              marginBottom: '0.25rem',
              color: '#1a1a1a'
            }}>📧 Email Inbox</h1>
            <p style={{
              margin: 0,
              color: '#666',
              fontSize: '0.9rem'
            }}>Manage your email conversations</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Real-time connection indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: socketConnected ? '#e8f5e9' : '#fff3e0',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: socketConnected ? '#2e7d32' : '#f57c00'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: socketConnected ? '#4caf50' : '#ff9800',
                animation: socketConnected ? 'pulse 2s infinite' : 'none'
              }}></span>
              {socketConnected ? '🟢 Real-time ON' : '🟡 Connecting...'}
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-primary"
              style={{
                opacity: syncing ? 0.6 : 1,
                whiteSpace: 'nowrap'
              }}
            >
              {syncing ? '⏳ Syncing...' : '🔄 Sync Emails'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#2196F3' }}>{stats.totalSent}</div>
              <div className="stat-label">📤 Total Sent</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#4CAF50' }}>{stats.totalReceived}</div>
              <div className="stat-label">📥 Total Received</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#9C27B0' }}>{stats.totalReplies}</div>
              <div className="stat-label">💬 Replies</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#FF9800' }}>{stats.sentLast24h}</div>
              <div className="stat-label">🔥 Sent (24h)</div>
            </div>
          </div>
        )}

      {/* Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        marginBottom: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
          {[
            { value: 'conversations', label: '💬 My Conversations', icon: '💬' },
            { value: 'sent', label: '📤 Sent', icon: '📤' },
            { value: 'received', label: '📥 All Received', icon: '📥' }
          ].map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              style={{
                padding: '1rem 2rem',
                backgroundColor: tab === value ? '#f5f5f5' : 'transparent',
                border: 'none',
                borderBottom: tab === value ? '3px solid #2196F3' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: tab === value ? 600 : 400,
                color: tab === value ? '#2196F3' : '#666'
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Search emails..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          {/* Email Type filter removed - users can use Sent/Received tabs instead */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="">📊 All Status</option>
            <option value="sent">✅ Sent Successfully</option>
            <option value="delivered">📬 Delivered</option>
            <option value="replied">💬 Got Reply</option>
            <option value="failed">❌ Failed</option>
          </select>
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Email List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minHeight: '400px'
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⏳</div>
            <div>Loading emails...</div>
          </div>
        ) : emails.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ color: '#666', fontWeight: 400 }}>No emails found</h3>
            <p style={{ color: '#999' }}>Try adjusting your filters or sync your inbox</p>
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email._id}
              onClick={() => viewThread(email)}
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                backgroundColor: email.isRead ? 'white' : '#f0f7ff',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = email.isRead ? 'white' : '#f0f7ff'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '20px' }}>
                      {email.direction === 'sent' ? '📤' : '📥'}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: email.isRead ? 400 : 600,
                      color: '#333'
                    }}>
                      {email.direction === 'sent'
                        ? `To: ${email.to.map(t => t.email).join(', ')}`
                        : `From: ${email.from.email}`
                      }
                    </span>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid #ddd',
                      backgroundColor: 'white'
                    }}>
                      {email.emailType}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      color: 'white',
                      backgroundColor: getStatusColor(email.status)
                    }}>
                      {email.status}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: email.isRead ? 400 : 600,
                    marginBottom: '0.25rem'
                  }}>
                    {email.subject}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {email.bodyText.substring(0, 100)}...
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '150px' }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {new Date(email.sentAt).toLocaleString()}
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(email, e)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc0000'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff4444'}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Thread Dialog */}
      {threadDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }} onClick={() => setThreadDialogOpen(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '900px',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '2rem',
            width: '100%'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>💬 Email Conversation</h2>
              <button
                onClick={() => setThreadDialogOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            {currentThread.map((email) => (
              <div key={email._id} style={{
                marginBottom: '1rem',
                padding: '1.5rem',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: email.direction === 'sent' ? '#f0f7ff' : '#f5fff0'
              }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '24px' }}>
                    {email.direction === 'sent' ? '📤' : '📥'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '0.25rem' }}>
                      {email.direction === 'sent' ? 'You' : email.from.email}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(email.sentAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    color: 'white',
                    backgroundColor: getStatusColor(email.status)
                  }}>
                    {email.status}
                  </div>
                </div>
                <h3 style={{ marginBottom: '1rem', fontSize: '18px' }}>{email.subject}</h3>
                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#333'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: email.bodyHtml || email.bodyText.replace(/\n/g, '<br>')
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }} onClick={() => setDeleteConfirmOpen(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '20px' }}>Delete Email?</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
              Are you sure you want to delete this email? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#f0f0f0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#333'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          backgroundColor: notification.type === 'success' ? '#4CAF50' : '#f44336',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '14px',
          fontWeight: 600,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span style={{ fontSize: '20px' }}>
            {notification.type === 'success' ? '✅' : '❌'}
          </span>
          {notification.message}
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default EmailInbox;
