import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import EmailCompose from '../components/EmailCompose';
import emailService from '../services/emailService';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import '../styles/crm.css';

const EmailInbox = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState('inbox'); // inbox, sent, drafts, starred, trash
  const [filters, setFilters] = useState({
    search: '',
    emailType: '',
    status: '',
    page: 1,
    limit: 50
  });
  const [stats, setStats] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState('new'); // 'new', 'reply', 'forward'
  const [replyToEmail, setReplyToEmail] = useState(null);

  useEffect(() => {
    fetchEmails();
    fetchStats();
  }, [activeFolder, filters.page, filters.emailType, filters.status]);

  // Socket.io real-time email notifications
  useEffect(() => {
    if (!user?.tenant) return;

    console.log('🔌 Initializing Socket.io connection...');
    socketService.connect();
    socketService.joinTenant(user.tenant);
    setSocketConnected(true);

    const handleNewEmail = (data) => {
      console.log('📧 New email received:', data);
      showNotification(
        `New Email: ${data.notification.subject}`,
        'success'
      );

      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Sound play failed:', e));
      } catch (e) {
        // Ignore sound errors
      }

      fetchEmails();
      fetchStats();
    };

    socketService.onNewEmail(handleNewEmail);

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
        direction: activeFolder === 'sent' ? 'sent' : activeFolder === 'inbox' ? 'received' : undefined,
        conversationsOnly: activeFolder === 'inbox' ? 'true' : undefined
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
      showNotification('Emails synced successfully!', 'success');
    } catch (error) {
      console.error('Sync error:', error);
      showNotification('Failed to sync emails', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleEmailClick = async (email) => {
    try {
      // Fetch full email details (including bodyHtml)
      const response = await emailService.getEmail(email._id);
      setSelectedEmail(response.data);

      // Mark as read if not already
      if (!email.isRead) {
        await emailService.markAsRead(email._id);
        fetchEmails();
        fetchStats();
      }
    } catch (error) {
      console.error('Error loading email details:', error);
      // Fallback to using the email from the list
      setSelectedEmail(email);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleReply = () => {
    setComposeMode('reply');
    setReplyToEmail(selectedEmail);
    setShowCompose(true);
  };

  const handleForward = () => {
    setComposeMode('forward');
    setReplyToEmail(selectedEmail);
    setShowCompose(true);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Helper function to extract email display string
  const getEmailDisplay = (emailField) => {
    if (!emailField) return 'Unknown';
    if (typeof emailField === 'string') return emailField;
    if (typeof emailField === 'object') {
      return emailField.name || emailField.email || 'Unknown';
    }
    return 'Unknown';
  };

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: '📥', count: stats?.totalReceived || 0 },
    { id: 'sent', label: 'Sent', icon: '📤', count: stats?.totalSent || 0 },
    { id: 'drafts', label: 'Drafts', icon: '📝', count: 0 },
    { id: 'starred', label: 'Starred', icon: '⭐', count: 0 },
    { id: 'trash', label: 'Trash', icon: '🗑️', count: 0 }
  ];

  return (
    <DashboardLayout>
      {/* Email Compose Modal */}
      {showCompose && (
        <EmailCompose
          isOpen={showCompose}
          onClose={() => {
            setShowCompose(false);
            setComposeMode('new');
            setReplyToEmail(null);
          }}
          recipients={[]}
          remainingCredits={1000}
          mode={composeMode}
          replyToEmail={replyToEmail}
          onSuccess={() => {
            setShowCompose(false);
            setComposeMode('new');
            setReplyToEmail(null);
            fetchEmails();
            fetchStats();
            showNotification('Email sent successfully!', 'success');
          }}
        />
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          background: notification.type === 'success' ? '#4CAF50' : '#f44336',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: 500
        }}>
          {notification.message}
        </div>
      )}

      {/* Gmail-style Layout */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 100px)',
        gap: '0',
        overflow: 'hidden'
      }}>

        {/* Left Sidebar - Gmail Style */}
        <div style={{
          width: '260px',
          backgroundColor: 'white',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          overflow: 'auto'
        }}>
          {/* Compose Button */}
          <button
            onClick={() => {
              setComposeMode('new');
              setReplyToEmail(null);
              setShowCompose(true);
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
          >
            <span style={{ fontSize: '18px' }}>✏️</span>
            Compose
          </button>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '10px 20px',
              backgroundColor: syncing ? '#f5f5f5' : 'white',
              color: syncing ? '#999' : '#666',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: syncing ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {syncing ? '⏳ Syncing...' : '🔄 Sync Emails'}
          </button>

          {/* Connection Status */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: socketConnected ? '#e8f5e9' : '#fff3e0',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            color: socketConnected ? '#2e7d32' : '#f57c00',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: socketConnected ? '#4caf50' : '#ff9800'
            }}></span>
            {socketConnected ? 'Real-time ON' : 'Connecting...'}
          </div>

          {/* Folders */}
          <div style={{ marginTop: '10px' }}>
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '0 20px 20px 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2px',
                  backgroundColor: activeFolder === folder.id ? '#e3f2fd' : 'transparent',
                  color: activeFolder === folder.id ? '#1976d2' : '#5f6368',
                  fontWeight: activeFolder === folder.id ? 600 : 500,
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (activeFolder !== folder.id) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseOut={(e) => {
                  if (activeFolder !== folder.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>{folder.icon}</span>
                  <span>{folder.label}</span>
                </div>
                {folder.count > 0 && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: activeFolder === folder.id ? '#1976d2' : '#666'
                  }}>
                    {folder.count}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Stats Summary */}
          {stats && (
            <div style={{
              marginTop: 'auto',
              paddingTop: '20px',
              borderTop: '1px solid #e0e0e0'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 600 }}>
                Email Summary
              </div>
              <div style={{ fontSize: '11px', color: '#999', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>📊 Total: {(stats.totalSent || 0) + (stats.totalReceived || 0)}</div>
                <div>💬 Replies: {stats.totalReplies || 0}</div>
                <div>🔥 Last 24h: {stats.sentLast24h || 0}</div>
              </div>
            </div>
          )}
        </div>

        {/* Email List - Gmail Style */}
        <div style={{
          flex: selectedEmail ? '0 0 400px' : '1',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Search Bar */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <input
              type="text"
              placeholder="Search emails..."
              value={filters.search}
              onChange={handleSearch}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '24px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f5f5f5'
              }}
            />
            <span style={{ fontSize: '20px', color: '#999' }}>🔍</span>
          </div>

          {/* Email List */}
          <div style={{
            flex: 1,
            overflow: 'auto'
          }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px' }}>Loading emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p>No emails in {activeFolder}</p>
              </div>
            ) : (
              emails.map((email, index) => (
                <div
                  key={email._id}
                  onClick={() => handleEmailClick(email)}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    backgroundColor: selectedEmail?._id === email._id ? '#f5f5f5' : email.isRead ? 'white' : '#f9f9f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (selectedEmail?._id !== email._id) {
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedEmail?._id !== email._id) {
                      e.currentTarget.style.backgroundColor = email.isRead ? 'white' : '#f9f9f9';
                    }
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(email._id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setSelectedEmails([...selectedEmails, email._id]);
                      } else {
                        setSelectedEmails(selectedEmails.filter(id => id !== email._id));
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />

                  {/* Star */}
                  <span style={{ fontSize: '16px', cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
                    ☆
                  </span>

                  {/* Email Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: email.isRead ? 400 : 700,
                        color: '#202124',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '200px'
                      }}>
                        {activeFolder === 'sent' ? getEmailDisplay(email.to) : getEmailDisplay(email.from)}
                      </span>
                      {!email.isRead && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#1976d2',
                          borderRadius: '50%'
                        }}></span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#202124',
                      fontWeight: email.isRead ? 400 : 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '4px'
                    }}>
                      {email.subject || '(No Subject)'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#5f6368',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {email.preview || email.bodyText?.substring(0, 80) || ''}
                    </div>
                  </div>

                  {/* Date */}
                  <span style={{
                    fontSize: '12px',
                    color: '#5f6368',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatDate(email.receivedAt || email.sentAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Detail - Gmail Style */}
        {selectedEmail && (
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            borderLeft: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Email Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 400,
                  color: '#202124',
                  margin: 0
                }}>
                  {selectedEmail.subject || '(No Subject)'}
                </h2>
                <button
                  onClick={() => setSelectedEmail(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#5f6368',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 600
                }}>
                  {(getEmailDisplay(selectedEmail.from)).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#202124' }}>
                    {getEmailDisplay(selectedEmail.from)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#5f6368' }}>
                    to {getEmailDisplay(selectedEmail.to)}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#5f6368' }}>
                  {new Date(selectedEmail.receivedAt || selectedEmail.sentAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflow: 'auto',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#202124'
            }}>
              {selectedEmail.bodyHtml ? (
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} />
              ) : (
                <pre style={{
                  fontFamily: 'inherit',
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}>
                  {selectedEmail.bodyText || '(No content)'}
                </pre>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={handleReply}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                ↩️ Reply
              </button>
              <button
                onClick={handleForward}
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'white',
                  color: '#5f6368',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                ➡️ Forward
              </button>
              <button
                onClick={async () => {
                  try {
                    await emailService.deleteEmail(selectedEmail._id);
                    setSelectedEmail(null);
                    fetchEmails();
                    fetchStats();
                    showNotification('Email moved to trash', 'success');
                  } catch (error) {
                    showNotification('Failed to delete email', 'error');
                  }
                }}
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'white',
                  color: '#d32f2f',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmailInbox;
