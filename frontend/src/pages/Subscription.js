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
  const [hoveredPlanId, setHoveredPlanId] = useState(null);
  const [hoveredStatCard, setHoveredStatCard] = useState(null);

  // Clean Professional Styles
  const glassStyles = {
    container: {
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: '40px 20px',
      position: 'relative'
    },
    glassCard: {
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      padding: '40px',
      marginBottom: '40px',
      color: '#1a1a1a',
      position: 'relative',
      overflow: 'hidden'
    },
    cardDecoration: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: '#5db9de',
      borderRadius: '16px 16px 0 0'
    },
    planCard: {
      background: '#ffffff',
      borderRadius: '16px',
      border: '2px solid #e5e7eb',
      padding: '32px',
      position: 'relative',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      minHeight: '550px',
      display: 'flex',
      flexDirection: 'column'
    },
    planCardHover: {
      transform: 'translateY(-8px)',
      boxShadow: '0 8px 24px rgba(93, 185, 222, 0.2)',
      borderColor: '#5db9de'
    },
    statCard: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '20px',
      textAlign: 'center',
      color: '#ffffff',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden'
    },
    statCardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)'
    },
    buttonPrimary: {
      background: '#5db9de',
      color: '#ffffff',
      border: 'none',
      padding: '14px 32px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '15px',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(93, 185, 222, 0.3)',
      transition: 'all 0.3s ease',
      width: '100%',
      marginTop: 'auto'
    },
    alertWarning: {
      background: '#fff3cd',
      borderRadius: '12px',
      border: '1px solid #ffc107',
      padding: '20px',
      color: '#856404',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)'
    },
    toggle: {
      background: '#f3f4f6',
      borderRadius: '12px',
      padding: '4px',
      display: 'inline-flex',
      gap: '4px',
      border: '1px solid #e5e7eb'
    },
    toggleButton: {
      padding: '10px 28px',
      borderRadius: '8px',
      border: 'none',
      background: 'transparent',
      color: '#6b7280',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px'
    },
    toggleButtonActive: {
      background: '#5db9de',
      color: '#ffffff',
      boxShadow: '0 2px 8px rgba(93, 185, 222, 0.3)'
    },
    popularBadge: {
      position: 'absolute',
      top: '-12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#ffc107',
      color: '#000',
      padding: '8px 20px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '700',
      boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)',
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    },
    currentBadge: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: '#10b981',
      color: '#ffffff',
      padding: '6px 14px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '600',
      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
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

      console.log('📊 Subscription Page - Full Data:', subscriptionData.data);
      console.log('📊 Usage Object:', subscriptionData.data?.usage);
      console.log('👥 Users:', subscriptionData.data?.usage?.users);
      console.log('📞 Leads:', subscriptionData.data?.usage?.leads);
      console.log('📇 Contacts:', subscriptionData.data?.usage?.contacts);
      console.log('💼 Deals:', subscriptionData.data?.usage?.deals);
      console.log('💾 Storage:', subscriptionData.data?.usage?.storage);

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
        <div style={{
          ...glassStyles.container,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          minHeight: '100vh'
        }}>
          <div style={{
            ...glassStyles.glassCard,
            textAlign: 'center',
            padding: '80px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              color: '#5db9de'
            }}>⏳</div>
            <p style={{
              color: '#6b7280',
              fontSize: '18px',
              fontWeight: '600'
            }}>Loading subscription details...</p>
          </div>
          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.05); }
            }
          `}</style>
        </div>
      </DashboardLayout>
    );
  }

  const sub = currentSubscription?.subscription;
  const status = currentSubscription?.status;

  return (
    <DashboardLayout title="💳 Subscription & Billing">
      <div style={{
        ...glassStyles.container,
        background: '#f8f9fa',
        minHeight: '100vh'
      }}>
        
        {/* Current Subscription Card */}
        <div style={{
          ...glassStyles.glassCard
        }}>
          <div style={{
            borderBottom: '2px solid #f3f4f6',
            paddingBottom: '20px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#1f2937',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '24px' }}>💎</span>
              Current Subscription
            </h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            
            {/* Plan Info */}
            <div
              style={{
                ...glassStyles.statCard,
                ...(hoveredStatCard === 'plan' ? glassStyles.statCardHover : {}),
                background: 'linear-gradient(135deg, rgb(33, 37, 51) 0%, rgb(118, 75, 162) 100%)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={() => setHoveredStatCard('plan')}
              onMouseLeave={() => setHoveredStatCard(null)}
            >
              <div style={{
                fontSize: '10px',
                marginBottom: '8px',
                opacity: 0.9,
                color: '#ffffff',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Current Plan</div>
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                marginBottom: '10px',
                color: '#ffffff',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                lineHeight: '1'
              }}>
                {sub?.planName || 'Free'}
              </div>
              {getStatusBadge(sub?.status || 'trial')}
            </div>

            {/* Billing Info */}
            <div
              style={{
                ...glassStyles.statCard,
                ...(hoveredStatCard === 'billing' ? glassStyles.statCardHover : {}),
                background: 'linear-gradient(135deg, rgb(10, 8, 10) 0%, rgb(245, 87, 108) 100%)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={() => setHoveredStatCard('billing')}
              onMouseLeave={() => setHoveredStatCard(null)}
            >
              <div style={{
                fontSize: '10px',
                marginBottom: '8px',
                opacity: 0.9,
                color: '#ffffff',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Monthly Cost</div>
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                marginBottom: '8px',
                color: '#ffffff',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                lineHeight: '1'
              }}>
                ₹{sub?.amount?.toLocaleString() || 0}
              </div>
              <div style={{
                fontSize: '11px',
                opacity: 0.9,
                color: '#ffffff',
                fontWeight: '500'
              }}>
                {sub?.billingCycle === 'yearly' ? 'Billed Yearly' : 'Billed Monthly'}
              </div>
            </div>

            {/* Trial Info */}
            {status?.isTrialActive && !status?.isTrialExpired && (
              <div
                style={{
                  ...glassStyles.statCard,
                  ...(hoveredStatCard === 'trial' ? glassStyles.statCardHover : {}),
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => setHoveredStatCard('trial')}
                onMouseLeave={() => setHoveredStatCard(null)}
              >
                <div style={{
                  fontSize: '10px',
                  marginBottom: '8px',
                  opacity: 0.9,
                  color: '#ffffff',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Trial Period</div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  color: '#ffffff',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  lineHeight: '1'
                }}>
                  {status.trialDaysRemaining}
                </div>
                <div style={{
                  fontSize: '11px',
                  opacity: 0.9,
                  color: '#ffffff',
                  fontWeight: '500'
                }}>days remaining</div>
              </div>
            )}
          </div>

          {/* Trial Warning */}
          {status?.isTrialActive && status?.trialDaysRemaining <= 5 && (
            <div style={glassStyles.alertWarning}>
              <div style={{
                fontWeight: '700',
                fontSize: '16px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#856404'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                Trial Ending Soon
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#856404',
                lineHeight: '1.5'
              }}>
                Your trial expires in <strong>{status.trialDaysRemaining} days</strong>. Upgrade now to continue using all features.
              </div>
            </div>
          )}

          {/* Usage Stats */}
          {currentSubscription?.usage && (
            <div style={{
              marginTop: '28px',
              padding: '24px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '16px',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>📊</span>
                Current Usage
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                <div
                  style={{
                    ...glassStyles.statCard,
                    ...(hoveredStatCard === 'users' ? glassStyles.statCardHover : {}),
                    background: 'linear-gradient(135deg, rgb(168, 237, 234) 0%, rgb(254, 214, 227) 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={() => setHoveredStatCard('users')}
                  onMouseLeave={() => setHoveredStatCard(null)}
                >
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    color: '#000000',
                    textShadow: 'none',
                    lineHeight: '1'
                  }}>
                    {currentSubscription.usage.users || 0}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    opacity: 0.9,
                    color: '#000000',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginTop: '6px'
                  }}>👥 Users</div>
                </div>
                <div
                  style={{
                    ...glassStyles.statCard,
                    ...(hoveredStatCard === 'leads' ? glassStyles.statCardHover : {}),
                    background: 'linear-gradient(135deg, rgb(168, 237, 234) 0%, rgb(254, 214, 227) 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={() => setHoveredStatCard('leads')}
                  onMouseLeave={() => setHoveredStatCard(null)}
                >
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    color: '#000000',
                    textShadow: 'none'
                  }}>
                    {currentSubscription.usage.leads || 0}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    opacity: 0.9,
                    color: '#000000',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginTop: '6px'
                  }}>📞 Leads</div>
                </div>
                <div
                  style={{
                    ...glassStyles.statCard,
                    ...(hoveredStatCard === 'contacts' ? glassStyles.statCardHover : {}),
                    background: 'linear-gradient(135deg, rgb(168, 237, 234) 0%, rgb(254, 214, 227) 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={() => setHoveredStatCard('contacts')}
                  onMouseLeave={() => setHoveredStatCard(null)}
                >
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    color: '#000000',
                    textShadow: 'none'
                  }}>
                    {currentSubscription.usage.contacts || 0}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    opacity: 0.9,
                    color: '#000000',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginTop: '6px'
                  }}>📇 Contacts</div>
                </div>
                <div
                  style={{
                    ...glassStyles.statCard,
                    ...(hoveredStatCard === 'storage' ? glassStyles.statCardHover : {}),
                    background: 'linear-gradient(135deg, rgb(168, 237, 234) 0%, rgb(254, 214, 227) 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={() => setHoveredStatCard('storage')}
                  onMouseLeave={() => setHoveredStatCard(null)}
                >
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    color: '#000000',
                    textShadow: 'none'
                  }}>
                    {Math.round(currentSubscription.usage.storage / 1024) || 0}GB
                  </div>
                  <div style={{
                    fontSize: '10px',
                    opacity: 0.9,
                    color: '#000000',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginTop: '6px'
                  }}>💾 Storage</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Billing Cycle Toggle */}
        <div style={{
          textAlign: 'center',
          margin: '32px 0',
          padding: '28px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>🔄</span>
            Choose Billing Cycle
          </h3>
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
                ...(billingCycle === 'yearly' ? glassStyles.toggleButtonActive : {}),
                position: 'relative'
              }}
            >
              Yearly{' '}
              <span style={{
                color: billingCycle === 'yearly' ? '#10b981' : '#fbbf24',
                fontSize: '12px',
                fontWeight: '800',
                marginLeft: '4px'
              }}>
                (Save 20%)
              </span>
            </button>
          </div>
        </div>

        {/* Available Plans */}
        <div style={{
          marginBottom: '32px',
          padding: '32px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '26px',
              fontWeight: '700',
              marginBottom: '8px',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '28px' }}>✨</span>
              Available Plans
            </h2>
            <p style={{
              fontSize: '15px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Choose the perfect plan for your business
            </p>
          </div>

         <div className="plans-grid" style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)', 
  gap: '20px',
  alignItems: 'stretch'
}}>
            {plans.map((plan) => {
              const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
              const isCurrentPlan = sub?.planName === plan.name;
              const isHovered = hoveredPlanId === plan._id;
              
              return (
                <div
                  key={plan._id}
                  style={{
                    ...glassStyles.planCard,
                    ...(isHovered ? glassStyles.planCardHover : {}),
                    border: isCurrentPlan ? '3px solid rgba(102, 126, 234, 0.8)' : '2px solid rgba(255, 255, 255, 0.5)'
                  }}
                  onMouseEnter={() => setHoveredPlanId(plan._id)}
                  onMouseLeave={() => setHoveredPlanId(null)}
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

                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      marginBottom: '8px',
                      color: '#1f2937'
                    }}>
                      {plan.displayName}
                    </h3>
                    <p style={{
                      color: '#6b7280',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      fontWeight: '400'
                    }}>
                      {plan.description}
                    </p>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        color: '#5db9de'
                      }}>
                        ₹{price.toLocaleString()}
                      </span>
                      <span style={{
                        color: '#9ca3af',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}>
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px', flex: 1 }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      marginBottom: '12px',
                      color: '#9ca3af',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>
                      Features Included:
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
                            background: '#10b981',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: '#ffffff',
                            fontWeight: '700'
                          }}>✓</div>
                          <span style={{
                            fontSize: '14px',
                            color: '#4b5563',
                            fontWeight: '400'
                          }}>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => !isCurrentPlan && handleUpgrade(plan)}
                    disabled={isCurrentPlan || upgrading}
                    style={{
                      ...glassStyles.buttonPrimary,
                      background: isCurrentPlan ? '#e5e7eb' : '#5db9de',
                      color: isCurrentPlan ? '#9ca3af' : '#ffffff',
                      cursor: isCurrentPlan ? 'not-allowed' : 'pointer',
                      opacity: upgrading ? 0.7 : 1,
                      border: isCurrentPlan ? '1px solid #d1d5db' : 'none',
                      boxShadow: isCurrentPlan ? 'none' : '0 2px 8px rgba(93, 185, 222, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentPlan && !upgrading) {
                        e.target.style.background = '#2a5298';
                        e.target.style.boxShadow = '0 4px 12px rgba(93, 185, 222, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentPlan && !upgrading) {
                        e.target.style.background = '#5db9de';
                        e.target.style.boxShadow = '0 2px 8px rgba(93, 185, 222, 0.3)';
                      }
                    }}
                  >
                    {upgrading ? 'Processing...' : isCurrentPlan ? 'Current Plan' : price === 0 ? 'Select Free Plan' : 'Upgrade Now'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment History */}
        {currentSubscription?.payments && currentSubscription.payments.length > 0 && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              borderBottom: '2px solid #f3f4f6',
              padding: '20px 28px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '22px' }}>📄</span>
                Payment History
              </h2>
            </div>

            <div style={{ overflowX: 'auto', padding: '28px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'transparent'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '2px solid #e5e7eb',
                    background: '#f9fafb'
                  }}>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: '700',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Invoice</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: '700',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Date</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: '700',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Plan</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: '700',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Amount</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: '700',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSubscription.payments.map((payment, index) => (
                    <tr key={payment._id} style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'all 0.3s ease',
                      background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'transparent'}>
                      <td style={{
                        padding: '16px 12px',
                        color: '#4b5563',
                        fontSize: '15px',
                        fontWeight: '500'
                      }}>{payment.invoiceNumber || '-'}</td>
                      <td style={{
                        padding: '16px 12px',
                        color: '#4b5563',
                        fontSize: '15px',
                        fontWeight: '500'
                      }}>
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        color: '#4b5563',
                        fontSize: '15px',
                        fontWeight: '500'
                      }}>{payment.planName}</td>
                      <td style={{
                        padding: '16px 12px',
                        color: '#1a1a1a',
                        fontWeight: '800',
                        fontSize: '16px'
                      }}>
                        ₹{payment.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          padding: '6px 12px',
                          background: payment.status === 'completed' ? '#d1fae5' : '#fee2e2',
                          border: payment.status === 'completed' ? '1px solid #10b981' : '1px solid #ef4444',
                          color: payment.status === 'completed' ? '#065f46' : '#991b1b',
                          borderRadius: '6px',
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

        {/* Responsive Grid for smaller screens */}
       <style>{`
  @media (min-width: 1200px) {
    .plans-grid {
      grid-template-columns: repeat(4, 1fr) !important; /* ← 4 columns */
    }
  }
  @media (max-width: 1199px) and (min-width: 769px) {
    .plans-grid {
      grid-template-columns: repeat(2, 1fr) !important; /* ← 2 columns tablet */
    }
  }
  @media (max-width: 768px) {
    .plans-grid {
      grid-template-columns: 1fr !important; /* ← 1 column mobile */
    }
  }
`}</style>

      </div>
    </DashboardLayout>
  );
};

export default Subscription;