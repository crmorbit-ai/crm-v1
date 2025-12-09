import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

const SMSCompose = ({
  isOpen,
  onClose,
  recipients,
  onSuccess,
  remainingCredits
}) => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const SMS_LIMIT = 160;
  const messageCount = Math.ceil(message.length / SMS_LIMIT) || 1;
  const remainingChars = SMS_LIMIT - (message.length % SMS_LIMIT || SMS_LIMIT);

  const handleSend = async () => {
    if (!message.trim()) {
      alert('⚠️ Please enter a message');
      return;
    }

    try {
      setSending(true);

      const response = await api.post('/data-center/bulk-sms', {
        candidates: recipients.map(r => ({
          phone: r.phone,
          firstName: r.firstName,
          lastName: r.lastName,
        })),
        message: message,
      });

      alert(`✅ Successfully sent ${response.data.data.sent} SMS messages!`);

      // Reset form
      setMessage('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('❌ ' + (error.response?.data?.message || 'Failed to send SMS'));
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
          borderRadius: '12px',
          maxWidth: '600px',
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
        {/* Header - SMS Style */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>💬</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white' }}>
              SMS Message
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Credits Info */}
        <div style={{
          padding: '10px 20px',
          background: '#ede7f6',
          borderBottom: '1px solid #d1c4e9'
        }}>
          <div style={{ fontSize: '13px', color: '#4a148c', fontWeight: '500' }}>
            💳 {remainingCredits} credits available | {recipients.length} will be used
          </div>
        </div>

        {/* Compose Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* To */}
          <div style={{
            display: 'flex',
            padding: '12px 16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '16px',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '14px',
              color: '#5f6368',
              minWidth: '50px',
              fontWeight: '600'
            }}>To:</span>
            <span style={{ fontSize: '14px', color: '#202124', fontWeight: '500' }}>
              {recipients.length} recipient{recipients.length > 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Message Area */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#202124',
              marginBottom: '8px'
            }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your SMS message...&#10;&#10;Tip: Use {{firstName}} and {{lastName}} for personalization&#10;Keep it short - SMS has 160 character limit per message"
              style={{
                width: '100%',
                minHeight: '200px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '15px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                resize: 'vertical',
                color: '#202124',
                lineHeight: '1.5',
                padding: '12px',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '12px',
              color: message.length > SMS_LIMIT ? '#d32f2f' : '#5f6368'
            }}>
              <span>💡 Use {'{'}{'{'} firstName {'}'}{'}'} for personalization</span>
              <span style={{ fontWeight: '600' }}>
                {message.length} / {SMS_LIMIT} chars ({messageCount} SMS{messageCount > 1 ? 's' : ''})
                {message.length > 0 && ` - ${remainingChars} left in current SMS`}
              </span>
            </div>
            {messageCount > 1 && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: '#fff3e0',
                borderLeft: '3px solid #f57c00',
                fontSize: '12px',
                color: '#e65100',
                borderRadius: '4px'
              }}>
                ⚠️ Your message will be sent as {messageCount} SMS messages. This will use {messageCount}x credits per recipient.
              </div>
            )}
          </div>
        </div>

        {/* Footer - Send Button */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa'
        }}>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              padding: '10px 32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: sending ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              opacity: sending ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {sending ? '⏳ Sending...' : '📤 Send SMS'}
          </button>
          <div style={{ fontSize: '11px', color: '#5f6368', fontStyle: 'italic' }}>
            Standard SMS rates apply
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SMSCompose;
