import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

const EmailCompose = ({
  isOpen,
  onClose,
  recipients,
  onSuccess,
  remainingCredits
}) => {
  const [sending, setSending] = useState(false);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(true);

  const [emailData, setEmailData] = useState({
    from: '',
    cc: '',
    bcc: '',
    subject: '',
    message: ''
  });

  // Load user's email settings
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const response = await api.get('/user-settings');
        // api.js interceptor already returns response.data, so 'response' is the settings object
        if (response.emailConfig?.isConfigured || response.emailConfig?.isPremium) {
          // Use premium SMTP if configured, otherwise use basic config
          const fromEmail = response.emailConfig?.premiumSmtp?.fromEmail || response.emailConfig?.replyToEmail || 'Not Configured';
          const displayName = response.emailConfig?.displayName || 'CRM User';
          const fullFrom = `${displayName} <${fromEmail}>`;

          setEmailData(prev => ({ ...prev, from: fullFrom }));
          setUserEmail(fromEmail);
          setEmailConfigured(true);
        } else {
          setEmailData(prev => ({ ...prev, from: 'Not Configured' }));
          setEmailConfigured(false);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
        setEmailConfigured(false);
      }
    };

    if (isOpen) {
      loadUserSettings();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!emailConfigured) {
      alert('⚠️ Please configure your email settings first!\n\nGo to Settings → Email Configuration');
      return;
    }

    if (!emailData.subject || !emailData.message) {
      alert('⚠️ Please enter subject and message');
      return;
    }

    try {
      setSending(true);

      const response = await api.post('/data-center/bulk-email', {
        candidates: recipients.map(r => ({
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
        })),
        subject: emailData.subject,
        message: emailData.message,
      });

      alert(`✅ Successfully sent ${response.data.sent} emails!`);

      // Reset form
      setEmailData({
        from: 'CRM System <iasabhishek6200@gmail.com>',
        cc: '',
        bcc: '',
        subject: '',
        message: ''
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('❌ ' + (error.response?.data?.message || 'Failed to send emails'));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(4px)',
        isolation: 'isolate'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          maxWidth: '720px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 24px 38px 3px rgba(0,0,0,0.14)',
          position: 'relative',
          zIndex: 1000000,
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Gmail Style */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#202124' }}>
            New Message
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#5f6368',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Credits Info */}
        <div style={{
          padding: '8px 16px',
          background: '#e8f0fe',
          borderBottom: '1px solid #d2e3fc'
        }}>
          <div style={{ fontSize: '12px', color: '#1967d2', fontWeight: '500' }}>
            💳 {remainingCredits} credits available | {recipients.length} will be used
          </div>
        </div>

        {/* Email Not Configured Warning */}
        {!emailConfigured && (
          <div style={{
            padding: '12px 16px',
            background: '#fef3c7',
            borderBottom: '1px solid #fbbf24',
            borderLeft: '4px solid #f59e0b'
          }}>
            <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
              ⚠️ Email not configured! Please go to Settings → Email Configuration to setup your email before sending.
            </div>
          </div>
        )}

        {/* Compose Body */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* From */}
          <div style={{
            display: 'flex',
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '13px',
              color: '#5f6368',
              minWidth: '70px',
              fontWeight: '500'
            }}>From</span>
            <input
              type="text"
              value={emailData.from}
              readOnly
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                padding: '6px 8px',
                color: emailConfigured ? '#202124' : '#dc2626',
                background: '#f9fafb',
                cursor: 'not-allowed'
              }}
              title={emailConfigured ? 'Configured in Settings' : 'Please configure in Settings'}
            />
          </div>

          {/* To */}
          <div style={{
            display: 'flex',
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '13px',
              color: '#5f6368',
              minWidth: '70px',
              fontWeight: '500'
            }}>To</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                fontSize: '14px',
                color: '#202124',
                flex: 1,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                alignItems: 'center'
              }}>
                {recipients.slice(0, 3).map((r, idx) => (
                  <span key={idx} style={{
                    background: '#e8f0fe',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#1967d2'
                  }}>
                    {r.email}
                  </span>
                ))}
                {recipients.length > 3 && (
                  <span style={{ fontSize: '13px', color: '#5f6368' }}>
                    +{recipients.length - 3} more
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setShowCC(!showCC)}
                  style={{
                    fontSize: '12px',
                    color: showCC ? '#1967d2' : '#5f6368',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontWeight: showCC ? '600' : '400'
                  }}
                >
                  Cc
                </button>
                <button
                  onClick={() => setShowBCC(!showBCC)}
                  style={{
                    fontSize: '12px',
                    color: showBCC ? '#1967d2' : '#5f6368',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontWeight: showBCC ? '600' : '400'
                  }}
                >
                  Bcc
                </button>
              </div>
            </div>
          </div>

          {/* CC (Conditional) */}
          {showCC && (
            <div style={{
              display: 'flex',
              padding: '8px 16px',
              borderBottom: '1px solid #f0f0f0',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '13px',
                color: '#5f6368',
                minWidth: '70px',
                fontWeight: '500'
              }}>Cc</span>
              <input
                type="text"
                value={emailData.cc}
                onChange={(e) => setEmailData({ ...emailData, cc: e.target.value })}
                placeholder="Comma separated emails"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  padding: '6px 8px',
                  color: '#202124',
                  background: 'transparent'
                }}
              />
            </div>
          )}

          {/* BCC (Conditional) */}
          {showBCC && (
            <div style={{
              display: 'flex',
              padding: '8px 16px',
              borderBottom: '1px solid #f0f0f0',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '13px',
                color: '#5f6368',
                minWidth: '70px',
                fontWeight: '500'
              }}>Bcc</span>
              <input
                type="text"
                value={emailData.bcc}
                onChange={(e) => setEmailData({ ...emailData, bcc: e.target.value })}
                placeholder="Comma separated emails"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  padding: '6px 8px',
                  color: '#202124',
                  background: 'transparent'
                }}
              />
            </div>
          )}

          {/* Subject */}
          <div style={{
            display: 'flex',
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '13px',
              color: '#5f6368',
              minWidth: '70px',
              fontWeight: '500'
            }}>Subject</span>
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              placeholder="Subject"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                padding: '6px 8px',
                color: '#202124',
                fontWeight: '400',
                background: 'transparent'
              }}
            />
          </div>

          {/* Compose Area */}
          <div style={{ padding: '16px' }}>
            <textarea
              value={emailData.message}
              onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              placeholder="Compose email...&#10;&#10;Tip: Use {{firstName}} and {{lastName}} for personalization"
              style={{
                width: '100%',
                minHeight: '250px',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                resize: 'vertical',
                color: '#202124',
                lineHeight: '1.6',
                background: 'transparent'
              }}
            />
          </div>
        </div>

        {/* Footer - Send Button */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                padding: '8px 24px',
                background: '#1a73e8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: sending ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: sending ? 0.6 : 1
              }}
            >
              {sending ? '⏳ Sending...' : '✉️ Send'}
            </button>
            <button
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#5f6368'
              }}
              title="Attach files"
            >
              📎
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#5f6368' }}>
            💡 Tip: Use {'{'}{'{'} firstName {'}'}{'}'} for personalization
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EmailCompose;
