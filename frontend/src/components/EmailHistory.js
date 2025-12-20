import React, { useState, useEffect } from 'react';
import emailService from '../services/emailService';

const EmailHistory = ({ entityType, entityId }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);
  const [currentThread, setCurrentThread] = useState([]);

  useEffect(() => {
    if (entityType && entityId) {
      fetchEmails();
    }
  }, [entityType, entityId]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await emailService.getEntityEmails(entityType, entityId);
      setEmails(response.data?.emails || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewThread = async (email) => {
    try {
      const response = await emailService.getThread(email.messageId);
      setCurrentThread(response.data?.thread || []);
      setThreadDialogOpen(true);
    } catch (error) {
      console.error('Error loading thread:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: 'blue',
      delivered: 'green',
      replied: 'purple',
      failed: 'red',
      bounced: 'orange'
    };
    return colors[status] || 'gray';
  };

  return (
    <div className="email-history">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3>Email History ({emails.length})</h3>
        <button onClick={fetchEmails} disabled={loading} className="btn btn-sm btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : emails.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📧</div>
          <p style={{ color: '#666' }}>No emails yet</p>
        </div>
      ) : (
        <div className="email-list">
          {emails.map((email) => (
            <div
              key={email._id}
              onClick={() => viewThread(email)}
              style={{
                padding: '1rem',
                marginBottom: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: email.isRead ? 'white' : '#f0f7ff',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = email.isRead ? 'white' : '#f0f7ff'}
            >
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '18px' }}>
                  {email.direction === 'sent' ? '📤' : '📥'}
                </span>
                <strong style={{ fontSize: '14px' }}>
                  {email.direction === 'sent' ? 'Sent' : 'Received'}
                </strong>
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
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
                  {new Date(email.sentAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: email.isRead ? 400 : 600, marginBottom: '0.25rem' }}>
                {email.subject}
              </div>
              <div style={{ fontSize: '14px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email.bodyText.substring(0, 150)}...
              </div>
            </div>
          ))}
        </div>
      )}

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
          justifyContent: 'center'
        }} onClick={() => setThreadDialogOpen(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '2rem',
            width: '90%'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Email Thread</h2>
              <button
                onClick={() => setThreadDialogOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px'
                }}
              >
                ✕
              </button>
            </div>

            {currentThread.map((email, idx) => (
              <div key={email._id} style={{
                marginBottom: '1rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: email.direction === 'sent' ? '#f0f7ff' : '#f5fff0'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px' }}>
                    {email.direction === 'sent' ? '📤' : '📥'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {email.direction === 'sent' ? 'You' : email.from.email}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(email.sentAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <h4 style={{ marginBottom: '0.5rem' }}>{email.subject}</h4>
                <div
                  style={{ fontSize: '14px', lineHeight: '1.6' }}
                  dangerouslySetInnerHTML={{ __html: email.bodyHtml || email.bodyText.replace(/\n/g, '<br>') }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailHistory;
