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
  const [hoveredStatCard, setHoveredStatCard] = useState(null);

  // Premium Advanced Styles
  const glassStyles = {
    container: {
      minHeight: '100vh',
      background: '#ffffff',
      padding: '40px 20px',
      position: 'relative'
    },
    glassCard: {
      background: 'linear-gradient(145deg, var(--crm-gray-300) 0%, rgb(248, 249, 250) 100%)',
      borderRadius: '24px',
      border: '1px solid #e0e7ff',
      boxShadow: '0 20px 60px rgba(93, 185, 222, 0.15), 0 8px 24px rgba(42, 82, 152, 0.08)',
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
      background: 'linear-gradient(90deg, #5db9de 0%, #2a5298 100%)',
      borderRadius: '24px 24px 0 0'
    },
    planCard: {
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '24px',
      border: '2px solid #e0e7ff',
      padding: '36px',
      position: 'relative',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 10px 40px rgba(93, 185, 222, 0.12), 0 4px 16px rgba(42, 82, 152, 0.08)',
      overflow: 'hidden'
    },
    planCardHover: {
      transform: 'translateY(-12px)',
      boxShadow: '0 25px 70px rgba(93, 185, 222, 0.25), 0 12px 40px rgba(42, 82, 152, 0.15)',
      borderColor: '#5db9de',
      background: 'linear-gradient(145deg, #ffffff 0%, #f0f9ff 100%)'
    },
    statCard: {
      background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '28px',
      textAlign: 'center',
      color: '#ffffff',
      boxShadow: '0 12px 40px rgba(93, 185, 222, 0.3), 0 4px 16px rgba(42, 82, 152, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden'
    },
    statCardHover: {
      transform: 'translateY(-6px) scale(1.02)',
      boxShadow: '0 20px 60px rgba(93, 185, 222, 0.4), 0 8px 24px rgba(42, 82, 152, 0.3)',
      background: 'linear-gradient(135deg, #47b9e1 0%, #2a5298 100%)'
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
      color: '#ffffff',
      border: 'none',
      padding: '16px 36px',
      borderRadius: '14px',
      fontWeight: '700',
      fontSize: '16px',
      cursor: 'pointer',
      boxShadow: '0 6px 24px rgba(93, 185, 222, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: '100%',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    alertWarning: {
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      borderRadius: '20px',
      border: '2px solid #fbbf24',
      padding: '24px',
      color: '#92400e',
      marginBottom: '28px',
      boxShadow: '0 8px 32px rgba(251, 191, 36, 0.2)'
    },
    toggle: {
      background: '#f3f4f6',
      borderRadius: '16px',
      padding: '6px',
      display: 'inline-flex',
      gap: '6px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
    },
    toggleButton: {
      padding: '12px 32px',
      borderRadius: '12px',
      border: 'none',
      background: 'transparent',
      color: '#6b7280',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '15px'
    },
    toggleButtonActive: {
      background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
      color: '#ffffff',
      boxShadow: '0 6px 20px rgba(93, 185, 222, 0.4)'
    },
    popularBadge: {
      position: 'absolute',
      top: '-14px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      color: '#1a2a35',
      padding: '10px 24px',
      borderRadius: '24px',
      fontSize: '11px',
      fontWeight: '800',
      boxShadow: '0 6px 20px rgba(251, 191, 36, 0.5)',
      letterSpacing: '1px',
      textTransform: 'uppercase'
    },
    currentBadge: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      backdropFilter: 'blur(8px)',
      color: '#ffffff',
      padding: '8px 18px',
      borderRadius: '14px',
      fontSize: '12px',
      fontWeight: '700',
      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
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
        <div style={glassStyles.container}>
          <div style={{...glassStyles.glassCard, textAlign: 'center', padding: '80px'}}>
            <div style={{
              fontSize: '64px',
              marginBottom: '24px',
              animation: 'pulse 2s ease-in-out infinite'
            }}>⏳</div>
            <p style={{
              color: '#6b7280',
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}>Loading subscription details...</p>
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
          <div style={glassStyles.cardDecoration}></div>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '800',
            marginBottom: '32px',
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            💳 Current Subscription
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            
            {/* Plan Info */}
            <div
              style={{
                ...glassStyles.statCard,
                ...(hoveredStatCard === 'plan' ? glassStyles.statCardHover : {})
              }}
              onMouseEnter={() => setHoveredStatCard('plan')}
              onMouseLeave={() => setHoveredStatCard(null)}
            >
              <div style={{
                fontSize: '13px',
                marginBottom: '12px',
                opacity: 0.9,
                color: '#ffffff',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Current Plan</div>
              <div style={{
                fontSize: '36px',
                fontWeight: '900',
                marginBottom: '12px',
                color: '#ffffff',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
                {sub?.planName || 'Free'}
              </div>
              {getStatusBadge(sub?.status || 'trial')}
            </div>

            {/* Billing Info */}
            <div
              style={{
                ...glassStyles.statCard,
                ...(hoveredStatCard === 'billing' ? glassStyles.statCardHover : {})
              }}
              onMouseEnter={() => setHoveredStatCard('billing')}
              onMouseLeave={() => setHoveredStatCard(null)}
            >
              <div style={{
                fontSize: '13px',
                marginBottom: '12px',
                opacity: 0.9,
                color: '#ffffff',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Monthly Cost</div>
              <div style={{
                fontSize: '36px',
                fontWeight: '900',
                marginBottom: '12px',
                color: '#ffffff',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
                ₹{sub?.amount?.toLocaleString() || 0}
              </div>
              <div style={{
                fontSize: '14px',
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
                  ...(hoveredStatCard === 'trial' ? glassStyles.statCardHover : {})
                }}
                onMouseEnter={() => setHoveredStatCard('trial')}
                onMouseLeave={() => setHoveredStatCard(null)}
              >
                <div style={{
                  fontSize: '13px',
                  marginBottom: '12px',
                  opacity: 0.9,
                  color: '#ffffff',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>Trial Period</div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  marginBottom: '12px',
                  color: '#ffffff',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}>
                  {status.trialDaysRemaining}
                </div>
                <div style={{
                  fontSize: '14px',
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
              <h3 style={{
                fontSize: '22px',
                fontWeight: '700',
                marginBottom: '20px',
                color: '#1a1a1a',
                letterSpacing: '0.5px'
              }}>
                📊 Current Usage
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div
                  style={{
                    ...glassStyles.statCard,
                    ...(hoveredStatCard === 'users' ? glassStyles.statCardHover : {})
                  }}
                  onMouseEnter={() => setHoveredStatCard('users')}
                  onMouseLeave={() => setHoveredStatCard(null)}
                >
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#ffffff',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}>
                    {currentSubscription.usage.users || 0}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    opacity: 0.9,
                    color: '#ffffff',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginTop: '8px'
                  }}>Users</div>
                </div>
                <div
                  style={{
                    ...glassStyles.statCard,
                    ...(hoveredStatCard === 'leads' ? glassStyles.statCardHover : {})
                  }}
                  onMouseEnter={() => setHoveredStatCard('leads')}
                  onMouseLeave={() => setHoveredStatCard(null)}
                >
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#ffffff',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}>
                    {currentSubscription.usage.leads || 0}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    opacity: 0.9,
                    color: '#ffffff',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginTop: '8px'
                  }}>Leads</div>
                </div>
                <div
                  style={{
                    ...glassStyles.statCard,
                    ...(hoveredStatCard === 'contacts' ? glassStyles.statCardHover : {})
                  }}
                  onMouseEnter={() => setHoveredStatCard('contacts')}
                  onMouseLeave={() => setHoveredStatCard(null)}
                >
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#ffffff',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}>
                    {currentSubscription.usage.contacts || 0}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    opacity: 0.9,
                    color: '#ffffff',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginTop: '8px'
                  }}>Contacts</div>
                </div>
                <div
                  style={{
                    ...glassStyles.statCard,
                    ...(hoveredStatCard === 'storage' ? glassStyles.statCardHover : {})
                  }}
                  onMouseEnter={() => setHoveredStatCard('storage')}
                  onMouseLeave={() => setHoveredStatCard(null)}
                >
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#ffffff',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}>
                    {Math.round(currentSubscription.usage.storage / 1024) || 0}GB
                  </div>
                  <div style={{
                    fontSize: '13px',
                    opacity: 0.9,
                    color: '#ffffff',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginTop: '8px'
                  }}>Storage</div>
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
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '900',
            marginBottom: '48px',
            textAlign: 'center',
            color: '#1a1a1a',
            letterSpacing: '1px',
            background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
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

                  <div style={{ marginBottom: '28px' }}>
                    <h3 style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      marginBottom: '12px',
                      color: '#1a1a1a',
                      letterSpacing: '0.5px'
                    }}>
                      {plan.displayName}
                    </h3>
                    <p style={{
                      color: '#6b7280',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      fontWeight: '500'
                    }}>
                      {plan.description}
                    </p>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span style={{
                        fontSize: '52px',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        ₹{price.toLocaleString()}
                      </span>
                      <span style={{
                        color: '#9ca3af',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}>
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      marginBottom: '16px',
                      color: '#9ca3af',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase'
                    }}>
                      FEATURES INCLUDED:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        `${plan.limits.users === -1 ? 'Unlimited' : plan.limits.users} Users`,
                        `${plan.limits.leads === -1 ? 'Unlimited' : plan.limits.leads} Leads`,
                        `${Math.round(plan.limits.storage / 1024)}GB Storage`,
                        plan.features.emailIntegration && 'Email Integration',
                        plan.features.advancedReports && 'Advanced Reports',
                        `${plan.support} Support`
                      ].filter(Boolean).map((feature, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            color: '#ffffff',
                            fontWeight: '900',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}>✓</div>
                          <span style={{
                            fontSize: '15px',
                            color: '#4b5563',
                            fontWeight: '500'
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
                      background: isCurrentPlan
                        ? '#e5e7eb'
                        : 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                      color: isCurrentPlan ? '#9ca3af' : '#ffffff',
                      cursor: isCurrentPlan ? 'not-allowed' : 'pointer',
                      opacity: upgrading ? 0.7 : 1,
                      border: isCurrentPlan ? '2px solid #d1d5db' : 'none',
                      boxShadow: isCurrentPlan ? 'none' : '0 6px 24px rgba(93, 185, 222, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentPlan && !upgrading) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 32px rgba(93, 185, 222, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentPlan && !upgrading) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 6px 24px rgba(93, 185, 222, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                      }
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
          <div style={{...glassStyles.glassCard, padding: '40px'}}>
            <div style={glassStyles.cardDecoration}></div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '800',
              marginBottom: '32px',
              color: '#1a1a1a',
              letterSpacing: '0.5px',
              background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              📄 Payment History
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: '700',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Invoice</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: '700',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Date</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: '700',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Plan</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: '700',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Amount</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: '700',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSubscription.payments.map((payment) => (
                    <tr key={payment._id} style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'all 0.3s ease'
                    }}>
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
                          padding: '8px 16px',
                          background: payment.status === 'completed'
                            ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                            : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                          border: payment.status === 'completed'
                            ? '1px solid #10b981'
                            : '1px solid #ef4444',
                          color: payment.status === 'completed' ? '#065f46' : '#991b1b',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
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