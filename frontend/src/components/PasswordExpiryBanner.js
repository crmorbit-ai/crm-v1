import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PasswordExpiryBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Skip SAAS users and Google OAuth users (no password)
    if (user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN') return;
    if (user.authProvider === 'google') return; // Google users don't have passwords
    if (!user.passwordChangedAt && !user.createdAt) return;

    const passwordDate = new Date(user.passwordChangedAt || user.createdAt);
    const daysSinceChange = Math.floor((Date.now() - passwordDate) / (1000 * 60 * 60 * 24));
    const remaining = 90 - daysSinceChange;

    // Show warning only in last 10 days
    if (remaining > 0 && remaining <= 10) {
      setDaysRemaining(remaining);
    }
  }, [user]);

  if (!daysRemaining || dismissed) return null;

  const getColor = () => {
    if (daysRemaining <= 1) return { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' };
    if (daysRemaining <= 3) return { bg: '#fff7ed', border: '#f97316', text: '#9a3412' };
    return { bg: '#fef9c3', border: '#eab308', text: '#854d0e' };
  };

  const colors = getColor();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: colors.bg,
      borderBottom: `2px solid ${colors.border}`,
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        fontSize: 20,
        filter: 'grayscale(0)'
      }}>
        {daysRemaining <= 1 ? '🔒' : '⏰'}
      </div>
      <div style={{ flex: 1, maxWidth: 800 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: colors.text,
          marginBottom: 2
        }}>
          {daysRemaining === 1
            ? '⚠️ Password expires tomorrow!'
            : `Your password expires in ${daysRemaining} days`}
        </div>
        <div style={{
          fontSize: 12,
          color: colors.text,
          opacity: 0.8
        }}>
          Change your password now to keep your account secure and avoid being locked out.
        </div>
      </div>
      <button
        onClick={() => navigate('/security')}
        style={{
          padding: '8px 16px',
          background: colors.border,
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        Change Password
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: colors.text,
          fontSize: 18,
          cursor: 'pointer',
          padding: '4px 8px',
          lineHeight: 1
        }}
      >
        ×
      </button>
    </div>
  );
};

export default PasswordExpiryBanner;
