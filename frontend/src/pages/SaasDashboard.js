import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import '../styles/dashboard.css';

const SaasDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getTenantStats();
      console.log('Stats loaded:', data);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set default stats to show 0s instead of errors
      setStats({
        totalTenants: 0,
        activeTenants: 0,
        suspendedTenants: 0,
        trialTenants: 0,
        recentTenants: 0,
        tenantsByPlan: {
          free: 0,
          basic: 0,
          professional: 0,
          enterprise: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard" style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
      minHeight: '80vh'
    }}>
      <header className="dashboard-header" style={{
        background: 'linear-gradient(135deg, rgb(28 31 32) 0%, rgb(103 133 143) 25%, rgb(59 82 98) 50%, rgb(34 41 56) 75%, rgb(60 66 74) 100%) 0% 0% / 400% 400%',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
        padding: '-10px 0'
      }}>
        <div className="container" style={{ maxWidth: '1600px',margin: '0 auto' }}>
          <div className="flex-between">
            <h1 style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '28px',
              fontWeight: '800',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
              margin: 0
            }}>🚀 SAAS Platform Dashboard</h1>
            <div className="flex gap-10" style={{ alignItems: 'center' }}>
              <span style={{
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '8px 16px',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)'
              }}>
                👋 Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button onClick={logout} style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav" style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        borderBottom: '1px solid rgba(93, 185, 222, 0.2)',
        padding: '0'
      }}>
        <div className="container" style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 20px',
          maxWidth: '1400px'
        }}>
          <Link to="/saas/dashboard" style={{
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(93, 185, 222, 0.3)'
          }}>Dashboard</Link>
          <Link to="/saas/tenants" style={{
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'rgba(93, 185, 222, 0.1)',
            color: '#2a5298',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(93, 185, 222, 0.2)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(93, 185, 222, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }}>Tenants</Link>
          <Link to="/saas/subscriptions" style={{
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'rgba(93, 185, 222, 0.1)',
            color: '#2a5298',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(93, 185, 222, 0.2)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(93, 185, 222, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }}>Subscriptions</Link>
          <Link to="/saas/billings" style={{
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'rgba(93, 185, 222, 0.1)',
            color: '#2a5298',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(93, 185, 222, 0.2)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(93, 185, 222, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }}>Billings</Link>
          <Link to="/saas/resellers" style={{
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'rgba(93, 185, 222, 0.1)',
            color: '#2a5298',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(93, 185, 222, 0.2)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(93, 185, 222, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }}>🤝 Resellers</Link>
          <Link to="/support-admin" style={{
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'rgba(93, 185, 222, 0.1)',
            color: '#2a5298',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(93, 185, 222, 0.2)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(93, 185, 222, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }}>🎫 Support Tickets</Link>
        </div>
      </nav>

      <main className="dashboard-content" style={{ padding: '32px 0' }}>
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              fontSize: '18px',
              fontWeight: '600',
              color: '#2a5298'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '32px 48px',
                borderRadius: '16px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
              }}>
                ⏳ Loading statistics...
              </div>
            </div>
          ) : (
            <>
              <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: '28px',
                  border: '2px solid rgba(59, 130, 246, 0.2)',
                  boxShadow: '0 12px 32px rgba(59, 130, 246, 0.15)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 48px rgba(59, 130, 246, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.15)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="stat-icon" style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
                    }}>🏢</div>
                    <div className="stat-info">
                      <h3 className="stat-value" style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        margin: '0 0 4px 0',
                        color: '#1e40af'
                      }}>{stats?.totalTenants || 0}</h3>
                      <p className="stat-label" style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: 0,
                        color: '#3b82f6'
                      }}>Total Tenants</p>
                    </div>
                  </div>
                </div>

                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: '28px',
                  border: '2px solid rgba(16, 185, 129, 0.2)',
                  boxShadow: '0 12px 32px rgba(16, 185, 129, 0.15)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 48px rgba(16, 185, 129, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.15)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="stat-icon" style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
                    }}>✅</div>
                    <div className="stat-info">
                      <h3 className="stat-value" style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        margin: '0 0 4px 0',
                        color: '#065f46'
                      }}>{stats?.activeTenants || 0}</h3>
                      <p className="stat-label" style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: 0,
                        color: '#10b981'
                      }}>Active Tenants</p>
                    </div>
                  </div>
                </div>

                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: '28px',
                  border: '2px solid rgba(245, 158, 11, 0.2)',
                  boxShadow: '0 12px 32px rgba(245, 158, 11, 0.15)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 48px rgba(245, 158, 11, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.15)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="stat-icon" style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)'
                    }}>🔄</div>
                    <div className="stat-info">
                      <h3 className="stat-value" style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        margin: '0 0 4px 0',
                        color: '#92400e'
                      }}>{stats?.trialTenants || 0}</h3>
                      <p className="stat-label" style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: 0,
                        color: '#f59e0b'
                      }}>Trial Tenants</p>
                    </div>
                  </div>
                </div>

                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: '28px',
                  border: '2px solid rgba(239, 68, 68, 0.2)',
                  boxShadow: '0 12px 32px rgba(239, 68, 68, 0.15)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 48px rgba(239, 68, 68, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(239, 68, 68, 0.15)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="stat-icon" style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
                    }}>⏸️</div>
                    <div className="stat-info">
                      <h3 className="stat-value" style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        margin: '0 0 4px 0',
                        color: '#991b1b'
                      }}>{stats?.suspendedTenants || 0}</h3>
                      <p className="stat-label" style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: 0,
                        color: '#ef4444'
                      }}>Suspended</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                border: '2px solid rgba(93, 185, 222, 0.15)',
                marginBottom: '24px'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  marginBottom: '24px',
                  color: '#1a1a1a',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(93, 185, 222, 0.2)'
                }}>📊 Tenants by Plan</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(93, 185, 222, 0.1) 0%, rgba(42, 82, 152, 0.05) 100%)',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '2px solid rgba(93, 185, 222, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#2a5298' }}>Free</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#5db9de' }}>{stats?.tenantsByPlan?.free || 0}</span>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '2px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#065f46' }}>Basic</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{stats?.tenantsByPlan?.basic || 0}</span>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(126, 34, 206, 0.05) 100%)',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '2px solid rgba(147, 51, 234, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#6b21a8' }}>Professional</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#9333ea' }}>{stats?.tenantsByPlan?.professional || 0}</span>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(202, 138, 4, 0.05) 100%)',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '2px solid rgba(234, 179, 8, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#854d0e' }}>Enterprise</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#eab308' }}>{stats?.tenantsByPlan?.enterprise || 0}</span>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                border: '2px solid rgba(93, 185, 222, 0.15)',
                marginBottom: '24px'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  marginBottom: '24px',
                  color: '#1a1a1a',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(93, 185, 222, 0.2)'
                }}>⚡ Quick Actions</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <Link to="/saas/tenants" style={{
                    padding: '16px 24px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '15px',
                    background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 20px rgba(93, 185, 222, 0.3)',
                    border: 'none',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 12px 32px rgba(93, 185, 222, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 20px rgba(93, 185, 222, 0.3)';
                  }}>
                    View All Tenants
                  </Link>
                  <Link to="/saas/subscriptions" style={{
                    padding: '16px 24px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '15px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                    border: 'none',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
                  }}>
                    Manage Subscriptions
                  </Link>
                  <Link to="/saas/billings" style={{
                    padding: '16px 24px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '15px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.3)',
                    border: 'none',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.3)';
                  }}>
                    Billing Overview
                  </Link>
                  <Link to="/saas/resellers" style={{
                    padding: '16px 24px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '15px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.3)',
                    border: 'none',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.3)';
                  }}>
                    🤝 Manage Resellers
                  </Link>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(93, 185, 222, 0.15) 0%, rgba(42, 82, 152, 0.1) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 12px 40px rgba(93, 185, 222, 0.15)',
                border: '2px solid rgba(93, 185, 222, 0.25)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  marginBottom: '16px',
                  color: '#1a1a1a'
                }}>📈 Recent Growth</div>
                <p style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  margin: 0,
                  background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {stats?.recentTenants || 0} new tenants
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '8px 0 0 0',
                  color: '#4b5563'
                }}>in the last 30 days</p>
              </div>
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default SaasDashboard;