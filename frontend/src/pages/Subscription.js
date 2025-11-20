import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { subscriptionService } from '../services/subscriptionService';

const Subscription = () => {
  const navigate = useNavigate();
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [hoveredPlanId, setHoveredPlanId] = useState(null); // FIX: Moved outside map

  // iOS Glass Inline Styles
  const glassStyles = {
    container: {
      minHeight: '100vh',
      // background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      borderRadius: '20px'
    },
    glassCard: {
      background: 'rgba(130, 145, 134, 0.1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      padding: '32px',
      marginBottom: '32px',
      color: 'Black'
    },
    planCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '20px',
      border: '2px solid rgba(255, 255, 255, 0.5)',
      padding: '32px',
      position: 'relative',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
    },
    planCardHover: {
      transform: 'translateY(-10px) scale(1.02)',
      boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
      borderColor: 'rgba(102, 126, 234, 0.5)'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      padding: '20px',
      textAlign: 'center',
      color: 'Black'
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'Black',
      border: 'none',
      padding: '14px 32px',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '16px',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
      transition: 'all 0.3s ease',
      width: '100%'
    },
    alertWarning: {
      background: 'rgba(251, 191, 36, 0.2)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: '2px solid rgba(251, 191, 36, 0.4)',
      padding: '20px',
      color: 'Black',
      marginBottom: '24px'
    },
    toggle: {
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '4px',
      display: 'inline-flex',
      gap: '4px',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    toggleButton: {
      padding: '10px 28px',
      borderRadius: '8px',
      border: 'none',
      background: 'transparent',
      color: 'Black',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    toggleButtonActive: {
      background: 'white',
      color: '#667eea',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    popularBadge: {
      position: 'absolute',
      top: '-12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'Black',
      padding: '8px 20px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
    },
    currentBadge: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'rgba(16, 185, 129, 0.9)',
      backdropFilter: 'blur(5px)',
      color: 'Black',
      padding: '6px 14px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600'
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subscriptionData, plansData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getAllPlans()
      ]);
      
      setCurrentSubscription(subscriptionData.data);
      setPlans(plansData.data);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    if (!plan) return;
    
    try {
      setUpgrading(true);
      const response = await subscriptionService.upgradePlan(plan._id, billingCycle);
      
      if (response.success) {
        alert('✅ ' + response.message);
        loadData();
      }
    } catch (error) {
      alert('❌ ' + (error.message || 'Failed to upgrade plan'));
    } finally {
      setUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      trial: { bg: 'rgba(254, 243, 199, 0.9)', color: '#92400E', text: '🔄 Trial' },
      active: { bg: 'rgba(209, 250, 229, 0.9)', color: '#065F46', text: '✅ Active' },
      expired: { bg: 'rgba(254, 226, 226, 0.9)', color: '#991B1B', text: '❌ Expired' },
      cancelled: { bg: 'rgba(243, 244, 246, 0.9)', color: '#6B7280', text: '⏸️ Cancelled' }
    };
    
    const style = styles[status] || styles.trial;
    
    return (
      <span style={{
        padding: '8px 16px',
        background: style.bg,
        backdropFilter: 'blur(10px)',
        color: style.color,
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Subscription & Billing">
        <div style={glassStyles.container}>
          <div style={{...glassStyles.glassCard, textAlign: 'center', padding: '60px'}}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p style={{color: 'white', fontSize: '18px'}}>Loading subscription details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sub = currentSubscription?.subscription;
  const status = currentSubscription?.status;

  return (
    <DashboardLayout title="Subscription & Billing">
      <div style={glassStyles.container}>
        
        {/* Current Subscription Card */}
        <div style={glassStyles.glassCard}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px', color: 'Blue' }}>
            💳 Current Subscription
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            
            {/* Plan Info */}
            <div style={glassStyles.statCard}>
              <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.8 }}>Current Plan</div>
              <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
                {sub?.planName || 'Free'}
              </div>
              {getStatusBadge(sub?.status || 'trial')}
            </div>

            {/* Billing Info */}
            <div style={glassStyles.statCard}>
              <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.8 }}>Monthly Cost</div>
              <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
                ₹{sub?.amount?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {sub?.billingCycle === 'yearly' ? 'Billed Yearly' : 'Billed Monthly'}
              </div>
            </div>

            {/* Trial Info */}
            {status?.isTrialActive && !status?.isTrialExpired && (
              <div style={glassStyles.statCard}>
                <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.8 }}>Trial Period</div>
                <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
                  {status.trialDaysRemaining}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>days remaining</div>
              </div>
            )}
          </div>

          {/* Trial Warning */}
          {status?.isTrialActive && status?.trialDaysRemaining <= 5 && (
            <div style={glassStyles.alertWarning}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>
                ⚠️ Trial Ending Soon
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Your trial expires in {status.trialDaysRemaining} days. Upgrade now to continue using all features.
              </div>
            </div>
          )}

          {/* Usage Stats */}
          {currentSubscription?.usage && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'Black' }}>
                📊 Current Usage
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div style={glassStyles.statCard}>
                  <div style={{ fontSize: '28px', fontWeight: '700' }}>
                    {currentSubscription.usage.users || 0}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>Users</div>
                </div>
                <div style={glassStyles.statCard}>
                  <div style={{ fontSize: '28px', fontWeight: '700' }}>
                    {currentSubscription.usage.leads || 0}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>Leads</div>
                </div>
                <div style={glassStyles.statCard}>
                  <div style={{ fontSize: '28px', fontWeight: '700' }}>
                    {currentSubscription.usage.contacts || 0}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>Contacts</div>
                </div>
                <div style={glassStyles.statCard}>
                  <div style={{ fontSize: '28px', fontWeight: '700' }}>
                    {Math.round(currentSubscription.usage.storage / 1024) || 0}GB
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>Storage</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Billing Cycle Toggle */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <div style={glassStyles.toggle}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                ...glassStyles.toggleButton,
                ...(billingCycle === 'monthly' ? glassStyles.toggleButtonActive : {})
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                ...glassStyles.toggleButton,
                ...(billingCycle === 'yearly' ? glassStyles.toggleButtonActive : {})
              }}
            >
              Yearly <span style={{ color: billingCycle === 'yearly' ? '#10B981' : 'rgba(255,255,255,0.7)', fontSize: '12px' }}>(Save 20%)</span>
            </button>
          </div>
        </div>

        {/* Available Plans */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '32px', textAlign: 'center', color: 'Blue' }}>
            ✨ Available Plans
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {plans.map((plan) => {
              const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
              const isCurrentPlan = sub?.planName === plan.name;
              const isHovered = hoveredPlanId === plan._id; // FIX: Using state from outside
              
              return (
                <div
                  key={plan._id}
                  style={{
                    ...glassStyles.planCard,
                    ...(isHovered ? glassStyles.planCardHover : {}),
                    border: isCurrentPlan ? '3px solid rgba(102, 126, 234, 0.8)' : '2px solid rgba(255, 255, 255, 0.5)'
                  }}
                  onMouseEnter={() => setHoveredPlanId(plan._id)} // FIX
                  onMouseLeave={() => setHoveredPlanId(null)} // FIX
                >
                  {plan.isPopular && (
                    <div style={glassStyles.popularBadge}>
                      ⭐ MOST POPULAR
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div style={glassStyles.currentBadge}>
                      ✓ Current Plan
                    </div>
                  )}

                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#1F2937' }}>
                      {plan.displayName}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>
                      {plan.description}
                    </p>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{
                        fontSize: '48px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        ₹{price.toLocaleString()}
                      </span>
                      <span style={{ color: '#6B7280' }}>
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '12px', color: '#9CA3AF' }}>
                      FEATURES:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        `${plan.limits.users === -1 ? 'Unlimited' : plan.limits.users} Users`,
                        `${plan.limits.leads === -1 ? 'Unlimited' : plan.limits.leads} Leads`,
                        `${Math.round(plan.limits.storage / 1024)}GB Storage`,
                        plan.features.emailIntegration && 'Email Integration',
                        plan.features.advancedReports && 'Advanced Reports',
                        `${plan.support} Support`
                      ].filter(Boolean).map((feature, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: 'Black',
                            fontWeight: 'bold'
                          }}>✓</div>
                          <span style={{ fontSize: '14px', color: '#4B5563' }}>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => !isCurrentPlan && handleUpgrade(plan)}
                    disabled={isCurrentPlan || upgrading}
                    style={{
                      ...glassStyles.buttonPrimary,
                      background: isCurrentPlan 
                        ? 'rgba(229, 231, 235, 0.8)' 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: isCurrentPlan ? '#6B7280' : 'white',
                      cursor: isCurrentPlan ? 'not-allowed' : 'pointer',
                      opacity: upgrading ? 0.7 : 1
                    }}
                  >
                    {upgrading ? '⏳ Processing...' : isCurrentPlan ? '✓ Current Plan' : price === 0 ? 'Select Free Plan' : '🚀 Upgrade Now'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment History */}
        {currentSubscription?.payments && currentSubscription.payments.length > 0 && (
          <div style={{...glassStyles.glassCard, padding: '32px'}}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: 'Blue' }}>
              📄 Payment History
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'Black', fontWeight: '600' }}>Invoice</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'Black', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'Black', fontWeight: '600' }}>Plan</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'Black', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'Black', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSubscription.payments.map((payment) => (
                    <tr key={payment._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <td style={{ padding: '12px', color: 'Black' }}>{payment.invoiceNumber || '-'}</td>
                      <td style={{ padding: '12px', color: 'Black' }}>
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td style={{ padding: '12px', color: 'Black' }}>{payment.planName}</td>
                      <td style={{ padding: '12px', color: 'Black', fontWeight: '700' }}>
                        ₹{payment.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '6px 12px',
                          background: payment.status === 'completed' 
                            ? 'rgba(209, 250, 229, 0.9)' 
                            : 'rgba(254, 226, 226, 0.9)',
                          color: payment.status === 'completed' ? '#065F46' : '#991B1B',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Subscription;