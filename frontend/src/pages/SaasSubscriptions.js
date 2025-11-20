import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import '../styles/dashboard.css';

const SaasSubscriptions = () => {
  const { user, logout } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [revenue, setRevenue] = useState({ total: 0, monthlyRecurring: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    page: 1
  });
  const [pagination, setPagination] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, [filters]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getAllSubscriptions(filters);
      
      if (response.success) {
        setSubscriptions(response.data.subscriptions);
        setPagination(response.data.pagination);
        setRevenue(response.data.revenue);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const openEditModal = (tenant) => {
    setSelectedTenant(tenant);
    setShowModal(true);
  };

  const handleUpdateSubscription = async (updates) => {
    try {
      await subscriptionService.updateTenantSubscription(selectedTenant._id, updates);
      alert('Subscription updated successfully!');
      setShowModal(false);
      setSelectedTenant(null);
      loadSubscriptions();
    } catch (error) {
      alert(error.message || 'Failed to update subscription');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      trial: { bg: '#FEF3C7', color: '#92400E', text: '🔄 Trial' },
      active: { bg: '#D1FAE5', color: '#065F46', text: '✅ Active' },
      expired: { bg: '#FEE2E2', color: '#991B1B', text: '❌ Expired' },
      cancelled: { bg: '#F3F4F6', color: '#6B7280', text: '⏸️ Cancelled' },
      suspended: { bg: '#FECACA', color: '#991B1B', text: '🚫 Suspended' }
    };
    
    const style = styles[status] || styles.trial;
    
    return (
      <span style={{
        padding: '4px 12px',
        background: style.bg,
        color: style.color,
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {style.text}
      </span>
    );
  };

  const getPlanBadge = (planName) => {
    const colors = {
      'Free': '#6B7280',
      'Basic': '#3B82F6',
      'Professional': '#8B5CF6',
      'Enterprise': '#F59E0B'
    };
    
    return (
      <span style={{
        padding: '4px 12px',
        background: `${colors[planName] || '#6B7280'}20`,
        color: colors[planName] || '#6B7280',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {planName}
      </span>
    );
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="container">
          <div className="flex-between">
            <h1>Subscription Management</h1>
            <div className="flex gap-10">
              <span>Welcome, {user?.firstName} {user?.lastName}</span>
              <button onClick={logout} className="btn btn-outline">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="container">
          <Link to="/saas/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/saas/tenants" className="nav-item">Tenants</Link>
          <Link to="/saas/subscriptions" className="nav-item active">Subscriptions</Link>
          <Link to="/saas/billings" className="nav-item">Billings</Link>
          <Link to="/saas/resellers" className="nav-item">🤝 Resellers</Link>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="container">
          
          {/* Revenue Stats */}
          <div className="stats-grid" style={{ marginBottom: '32px' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>💰</div>
              <div className="stat-info">
                <h3 className="stat-value">₹{revenue.total?.toLocaleString() || 0}</h3>
                <p className="stat-label">Total Revenue</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>🔄</div>
              <div className="stat-info">
                <h3 className="stat-value">₹{revenue.monthlyRecurring?.toLocaleString() || 0}</h3>
                <p className="stat-label">Monthly Recurring Revenue</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>📊</div>
              <div className="stat-info">
                <h3 className="stat-value">{subscriptions.length}</h3>
                <p className="stat-label">Active Subscriptions</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>💳</div>
              <div className="stat-info">
                <h3 className="stat-value">
                  ₹{Math.round((revenue.total / subscriptions.length) || 0).toLocaleString()}
                </h3>
                <p className="stat-label">Average Revenue Per User</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Filter by Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Filter by Plan
                </label>
                <select
                  value={filters.plan}
                  onChange={(e) => handleFilterChange('plan', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">All Plans</option>
                  <option value="Free">Free</option>
                  <option value="Basic">Basic</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div style={{ flex: '0 0 auto' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', opacity: 0 }}>
                  Actions
                </label>
                <button
                  onClick={() => setFilters({ status: '', plan: '', page: 1 })}
                  className="btn btn-secondary"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>All Subscriptions ({pagination?.totalCount || 0})</span>
              <button onClick={loadSubscriptions} className="btn btn-sm btn-secondary">
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <p>Loading subscriptions...</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <p>No subscriptions found</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#F9FAFB' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                          ORGANIZATION
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                          PLAN
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                          STATUS
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                          AMOUNT
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                          USAGE
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                          RESELLER
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                          JOINED
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((tenant) => (
                        <tr key={tenant._id} style={{ borderTop: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {tenant.organizationName}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6B7280' }}>
                              {tenant.contactEmail}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {getPlanBadge(tenant.subscription?.planName)}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {getStatusBadge(tenant.subscription?.status)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1F2937' }}>
                              ₹{tenant.subscription?.amount?.toLocaleString() || 0}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                              /{tenant.subscription?.billingCycle || 'month'}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontSize: '13px' }}>
                              <div>👥 {tenant.usage?.users || 0} users</div>
                              <div style={{ color: '#6B7280' }}>
                                📊 {tenant.usage?.leads || 0} leads
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {tenant.reseller ? (
                              <div style={{ fontSize: '13px' }}>
                                <div style={{ fontWeight: '600' }}>
                                  {tenant.reseller.firstName} {tenant.reseller.lastName}
                                </div>
                                <div style={{ color: '#6B7280', fontSize: '12px' }}>
                                  {tenant.reseller.email}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Direct</span>
                            )}
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280' }}>
                            {new Date(tenant.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <button
                              onClick={() => openEditModal(tenant)}
                              className="btn btn-sm btn-primary"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div style={{
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    borderTop: '1px solid #E5E7EB'
                  }}>
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                      className="btn btn-sm btn-secondary"
                      style={{ opacity: filters.page === 1 ? 0.5 : 1 }}
                    >
                      ← Previous
                    </button>
                    
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>
                      Page {filters.page} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page === pagination.totalPages}
                      className="btn btn-sm btn-secondary"
                      style={{ opacity: filters.page === pagination.totalPages ? 0.5 : 1 }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </main>

      {/* Edit Modal */}
      {showModal && selectedTenant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
              Edit Subscription - {selectedTenant.organizationName}
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
                Current Plan: <strong>{selectedTenant.subscription?.planName}</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Status: <strong>{selectedTenant.subscription?.status}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTenant(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateSubscription({
                  status: selectedTenant.subscription.status === 'active' ? 'suspended' : 'active'
                })}
                className="btn btn-primary"
              >
                {selectedTenant.subscription.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SaasSubscriptions;