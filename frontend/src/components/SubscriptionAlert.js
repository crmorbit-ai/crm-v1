import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';

const SubscriptionAlert = () => {
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const response = await subscriptionService.getCurrentSubscription();
      if (response.success) {
        setSubscriptionStatus(response.data.status);
      }
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !subscriptionStatus) return null;

  // Show alert if trial is ending soon (5 days or less)
  if (
    subscriptionStatus.isTrialActive && 
    subscriptionStatus.trialDaysRemaining <= 5 &&
    !subscriptionStatus.isTrialExpired
  ) {
    return (
      <div style={{
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        border: '2px solid #F59E0B',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <div>
            <div style={{ fontWeight: '700', color: '#92400E', marginBottom: '4px' }}>
              Your trial ends in {subscriptionStatus.trialDaysRemaining} days!
            </div>
            <div style={{ fontSize: '14px', color: '#92400E' }}>
              Upgrade now to continue using all features without interruption.
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/subscription')}
          style={{
            padding: '10px 24px',
            background: '#F59E0B',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Upgrade Now →
        </button>
      </div>
    );
  }

  // Show alert if trial has expired
  if (subscriptionStatus.isTrialExpired && !subscriptionStatus.isActive) {
    return (
      <div style={{
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
        border: '2px solid #EF4444',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '32px' }}>🚫</div>
          <div>
            <div style={{ fontWeight: '700', color: '#991B1B', marginBottom: '4px' }}>
              Your trial has expired!
            </div>
            <div style={{ fontSize: '14px', color: '#991B1B' }}>
              Please upgrade to a paid plan to continue using the CRM.
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/subscription')}
          style={{
            padding: '10px 24px',
            background: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Upgrade Now →
        </button>
      </div>
    );
  }

  // Show success message for active subscription
  if (subscriptionStatus.isActive && !subscriptionStatus.isTrialActive) {
    return (
      <div style={{
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
        border: '1px solid #10B981',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '24px' }}>✅</div>
          <div style={{ fontSize: '14px', color: '#065F46', fontWeight: '600' }}>
            Your subscription is active and all features are available!
          </div>
        </div>
        <button
          onClick={() => navigate('/subscription')}
          style={{
            padding: '6px 16px',
            background: 'transparent',
            color: '#065F46',
            border: '1px solid #065F46',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Manage Subscription
        </button>
      </div>
    );
  }

  return null;
};

export default SubscriptionAlert;