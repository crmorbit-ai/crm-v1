import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tenantService } from '../services/tenantService';
import '../styles/dashboard.css';

const Tenants = () => {
  const { user, logout } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.getTenants();
      setTenants(data.tenants || data || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setError(error.response?.data?.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to suspend this tenant?')) return;

    try {
      const response = await tenantService.suspendTenant(tenantId, 'Suspended by admin');
      console.log('Suspend response:', response);
      alert('✅ Tenant suspended successfully!');
      await loadTenants();
    } catch (error) {
      console.error('Suspend tenant error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert('❌ Failed to suspend tenant: ' + errorMsg);
    }
  };

  const handleActivateTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to activate this tenant?')) return;

    try {
      const response = await tenantService.activateTenant(tenantId);
      console.log('Activate response:', response);
      alert('✅ Tenant activated successfully!');
      await loadTenants();
    } catch (error) {
      console.error('Activate tenant error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert('❌ Failed to activate tenant: ' + errorMsg);
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone!')) return;

    try {
      const response = await tenantService.deleteTenant(tenantId);
      console.log('Delete response:', response);
      alert('✅ Tenant deleted successfully!');
      await loadTenants();
    } catch (error) {
      console.error('Delete tenant error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert('❌ Failed to delete tenant: ' + errorMsg);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch =
      tenant.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || tenant.subscription?.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || tenant.subscription?.planName?.toLowerCase() === filterPlan.toLowerCase();

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' },
      trial: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' },
      suspended: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' },
      expired: { background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', color: 'white' }
    };

    return (
      <span style={{
        ...styles[status] || styles.active,
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }}>
        {status}
      </span>
    );
  };

  const getPlanBadge = (plan) => {
    const styles = {
      free: { background: 'rgba(93, 185, 222, 0.15)', color: '#2a5298', border: '2px solid rgba(93, 185, 222, 0.3)' },
      basic: { background: 'rgba(16, 185, 129, 0.15)', color: '#065f46', border: '2px solid rgba(16, 185, 129, 0.3)' },
      professional: { background: 'rgba(147, 51, 234, 0.15)', color: '#6b21a8', border: '2px solid rgba(147, 51, 234, 0.3)' },
      enterprise: { background: 'rgba(234, 179, 8, 0.15)', color: '#854d0e', border: '2px solid rgba(234, 179, 8, 0.3)' }
    };

    return (
      <span style={{
        ...styles[plan?.toLowerCase()] || styles.free,
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {plan || 'Free'}
      </span>
    );
  };

  return (
    <div className="dashboard" style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
      minHeight: '100vh'
    }}>
      <header className="dashboard-header" style={{
        background: 'linear-gradient(135deg, #5db9de 0%, #47b9e1 25%, #1a2a35 50%, #95b5ef 75%, #2a5298 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
        padding: '-10px 0'
      }}>
        <div className="container" style={{ maxWidth: '1600px', margin: '0 auto' }}>
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
            }}>🏢 Tenant Management</h1>
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
          }}>Dashboard</Link>
          <Link to="/saas/tenants" style={{
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(93, 185, 222, 0.3)'
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
        </div>
      </nav>

      <main className="dashboard-content" style={{ padding: '32px 0' }}>
        <div className="container" style={{ maxWidth: '1600px', margin: '0 auto' }}>
          {/* Filters and Search */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            border: '2px solid rgba(93, 185, 222, 0.15)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              alignItems: 'end'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '700',
                  color: '#2a5298',
                  fontSize: '14px'
                }}>🔍 Search Tenants</label>
                <input
                  type="text"
                  placeholder="Search by company, email, or subdomain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid rgba(93, 185, 222, 0.3)',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5db9de';
                    e.target.style.boxShadow = '0 0 0 3px rgba(93, 185, 222, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(93, 185, 222, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '700',
                  color: '#2a5298',
                  fontSize: '14px'
                }}>Status Filter</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid rgba(93, 185, 222, 0.3)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '700',
                  color: '#2a5298',
                  fontSize: '14px'
                }}>Plan Filter</label>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid rgba(93, 185, 222, 0.3)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Plans</option>
                  <option value="Free">Free</option>
                  <option value="Basic">Basic</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <button
                onClick={loadTenants}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '14px',
                  background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(93, 185, 222, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(93, 185, 222, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(93, 185, 222, 0.3)';
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(93, 185, 222, 0.15) 0%, rgba(42, 82, 152, 0.1) 100%)',
            borderRadius: '16px',
            padding: '16px 24px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '2px solid rgba(93, 185, 222, 0.25)'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#2a5298' }}>
              📊 Showing {filteredTenants.length} of {tenants.length} tenants
            </div>
            {(searchTerm || filterStatus !== 'all' || filterPlan !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterPlan('all');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  background: 'rgba(93, 185, 222, 0.2)',
                  color: '#2a5298',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Tenants Table */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
            border: '2px solid rgba(93, 185, 222, 0.15)'
          }}>
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
                ⏳ Loading tenants...
              </div>
            ) : error ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                gap: '16px'
              }}>
                <div style={{
                  fontSize: '48px'
                }}>⚠️</div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#ef4444'
                }}>{error}</div>
                <button
                  onClick={loadTenants}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '14px',
                    background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(93, 185, 222, 0.3)'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : filteredTenants.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                gap: '16px'
              }}>
                <div style={{ fontSize: '64px' }}>🏢</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#2a5298'
                }}>
                  {tenants.length === 0 ? 'No tenants found' : 'No tenants match your filters'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  textAlign: 'center',
                  maxWidth: '400px'
                }}>
                  {tenants.length === 0
                    ? 'Tenants will appear here once they register on your platform.'
                    : 'Try adjusting your search or filter criteria.'}
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(135deg, rgba(93, 185, 222, 0.15) 0%, rgba(42, 82, 152, 0.1) 100%)',
                      borderBottom: '2px solid rgba(93, 185, 222, 0.3)'
                    }}>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '800',
                        color: '#2a5298',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Company</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '800',
                        color: '#2a5298',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Organization ID</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '800',
                        color: '#2a5298',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Admin Email</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '800',
                        color: '#2a5298',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Subdomain</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'center',
                        fontWeight: '800',
                        color: '#2a5298',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Plan</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'center',
                        fontWeight: '800',
                        color: '#2a5298',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Status</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'center',
                        fontWeight: '800',
                        color: '#2a5298',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((tenant, index) => (
                      <tr key={tenant._id || index} style={{
                        borderBottom: '1px solid rgba(93, 185, 222, 0.15)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(93, 185, 222, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}>
                        <td style={{
                          padding: '16px',
                          fontWeight: '700',
                          color: '#1a1a1a'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #5db9de 0%, #2a5298 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '800',
                              fontSize: '16px'
                            }}>
                              {tenant.organizationName?.charAt(0)?.toUpperCase() || '🏢'}
                            </span>
                            {tenant.organizationName || 'N/A'}
                          </div>
                        </td>
                        <td style={{
                          padding: '16px',
                          fontWeight: '700'
                        }}>
                          <span style={{
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            color: '#78350f',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '800',
                            letterSpacing: '1px',
                            display: 'inline-block',
                            boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)'
                          }}>
                            {tenant.organizationId || 'Not Assigned'}
                          </span>
                        </td>
                        <td style={{
                          padding: '16px',
                          color: '#4b5563',
                          fontWeight: '600'
                        }}>{tenant.contactEmail || 'N/A'}</td>
                        <td style={{
                          padding: '16px',
                          color: '#4b5563',
                          fontWeight: '600'
                        }}>
                          <code style={{
                            background: 'rgba(93, 185, 222, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#2a5298'
                          }}>
                            {tenant.slug || 'N/A'}
                          </code>
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          {getPlanBadge(tenant.subscription?.planName)}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          {getStatusBadge(tenant.subscription?.status)}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                          }}>
                            {tenant.subscription?.status === 'suspended' ? (
                              <button
                                onClick={() => handleActivateTenant(tenant._id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                                }}
                              >
                                ✅ Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspendTenant(tenant._id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                                }}
                              >
                                ⏸️ Suspend
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTenant(tenant._id)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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

export default Tenants;
