import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

const WhatsAppCompose = ({
  isOpen,
  onClose,
  recipients,
  onSuccess,
  remainingCredits
}) => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim()) {
      alert('⚠️ Please enter a message');
      return;
    }

    try {
      setSending(true);

      const response = await api.post('/data-center/bulk-whatsapp', {
        candidates: recipients.map(r => ({
          phone: r.phone,
          firstName: r.firstName,
          lastName: r.lastName,
        })),
        message: message,
      });

      const mode = response.data.mode || 'unknown';
      if (mode === 'sandbox') {
        alert(`⚠️ SANDBOX MODE: Sent ${response.data.data.sent} messages\n\nNote: Recipients must join Twilio sandbox first!`);
      } else {
        alert(`✅ Successfully sent ${response.data.data.sent} WhatsApp messages!`);
      }

      // Reset form
      setMessage('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending WhatsApp messages:', error);
      alert('❌ ' + (error.response?.data?.message || 'Failed to send WhatsApp messages'));
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
        {/* Header - WhatsApp Style */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          background: '#25D366',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>💬</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white' }}>
              WhatsApp Message
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
          background: '#dcf8c6',
          borderBottom: '1px solid #b8e986'
        }}>
          <div style={{ fontSize: '13px', color: '#065e49', fontWeight: '500' }}>
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
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '14px',
              color: '#5f6368',
              minWidth: '50px',
              fontWeight: '600'
            }}>To:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
              {recipients.slice(0, 3).map((r, idx) => (
                <span key={idx} style={{
                  background: '#dcf8c6',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#065e49',
                  fontWeight: '500'
                }}>
                  {r.phone}
                </span>
              ))}
              {recipients.length > 3 && (
                <span style={{ fontSize: '13px', color: '#5f6368', fontWeight: '500' }}>
                  +{recipients.length - 3} more
                </span>
              )}
            </div>
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
              placeholder="Type your WhatsApp message...&#10;&#10;Tip: Use {{firstName}} and {{lastName}} for personalization"
              style={{
                width: '100%',
                minHeight: '280px',
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
              onFocus={(e) => e.target.style.borderColor = '#25D366'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '12px',
              color: '#5f6368'
            }}>
              <span>💡 Use {'{'}{'{'} firstName {'}'}{'}'} for personalization</span>
              <span>{message.length} characters</span>
            </div>
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
              background: '#25D366',
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
            {sending ? '⏳ Sending...' : '📤 Send WhatsApp'}
          </button>
          <div style={{ fontSize: '11px', color: '#5f6368', fontStyle: 'italic' }}>
            Recipients must have WhatsApp
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WhatsAppCompose;
