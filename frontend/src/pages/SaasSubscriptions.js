import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import SaasLayout, { StatCard, Card, Badge, Button, Table, Select, DetailPanel, InfoRow, useWindowSize } from '../components/layout/SaasLayout';

const SaasSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [revenue, setRevenue] = useState({ total: 0, monthlyRecurring: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', plan: '', page: 1 });
  const [pagination, setPagination] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const { isMobile } = useWindowSize();

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

  const handleUpdateSubscription = async (updates) => {
    try {
      await subscriptionService.updateTenantSubscription(selectedTenant._id, updates);
      alert('Subscription updated successfully!');
      setSelectedTenant(null);
      loadSubscriptions();
    } catch (error) {
      alert(error.message || 'Failed to update subscription');
    }
  };

  const getStatusVariant = (status) => {
    const map = { trial: 'warning', active: 'success', expired: 'danger', cancelled: 'default', suspended: 'danger' };
    return map[status] || 'default';
  };

  const getPlanVariant = (plan) => {
    const map = { Free: 'default', Basic: 'info', Professional: 'purple', Enterprise: 'warning' };
    return map[plan] || 'default';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Calculate stats
  const stats = {
    active: subscriptions.filter(s => s.subscription?.status === 'active').length,
    trial: subscriptions.filter(s => s.subscription?.status === 'trial').length
  };

  // Responsive columns
  const columns = isMobile ? [
    {
      header: 'Subscription',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '12px',
            flexShrink: 0
          }}>
            {row.organizationName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.organizationName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <Badge variant={getPlanVariant(row.subscription?.planName)}>{row.subscription?.planName || 'Free'}</Badge>
              <span style={{ fontWeight: '700', color: '#8b5cf6', fontSize: '11px' }}>
                ₹{(row.subscription?.amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )
    }
  ] : [
    {
      header: 'Organization',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '11px',
            flexShrink: 0
          }}>
            {row.organizationName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '12px' }}>{row.organizationName}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>{row.organizationId || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Plan',
      render: (row) => <Badge variant={getPlanVariant(row.subscription?.planName)}>{row.subscription?.planName || 'Free'}</Badge>
    },
    {
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '700', color: '#8b5cf6', fontSize: '12px' }}>
          ₹{(row.subscription?.amount || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => <Badge variant={getStatusVariant(row.subscription?.status)}>{row.subscription?.status || 'N/A'}</Badge>
    }
  ];

  const statsColumns = isMobile ? 2 : 4;

  return (
    <SaasLayout title="Subscription Management">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statsColumns}, 1fr)`, gap: '12px', marginBottom: '16px' }}>
        <StatCard icon="💰" value={`₹${(revenue.total || 0).toLocaleString()}`} label="Total Revenue" />
        <StatCard icon="🔄" value={`₹${(revenue.monthlyRecurring || 0).toLocaleString()}`} label="Monthly Recurring" />
        <StatCard icon="✅" value={stats.active} label="Active Subscriptions" />
        <StatCard icon="⏳" value={stats.trial} label="On Trial" />
      </div>

      {/* Main Content - Split View */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '16px',
        minHeight: isMobile ? 'auto' : '500px'
      }}>
        {/* Left Panel */}
        <div style={{
          flex: (!isMobile && selectedTenant) ? '0 0 55%' : '1',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Filters */}
          <Card>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'trial', label: 'Trial' },
                  { value: 'active', label: 'Active' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'suspended', label: 'Suspended' }
                ]}
                style={{ marginBottom: 0, minWidth: isMobile ? 'calc(50% - 6px)' : '130px', flex: isMobile ? '1' : 'none' }}
              />
              <Select
                label="Plan"
                value={filters.plan}
                onChange={(e) => handleFilterChange('plan', e.target.value)}
                options={[
                  { value: '', label: 'All Plans' },
                  { value: 'Free', label: 'Free' },
                  { value: 'Basic', label: 'Basic' },
                  { value: 'Professional', label: 'Professional' },
                  { value: 'Enterprise', label: 'Enterprise' }
                ]}
                style={{ marginBottom: 0, minWidth: isMobile ? 'calc(50% - 6px)' : '130px', flex: isMobile ? '1' : 'none' }}
              />
              {!isMobile && (
                <>
                  <Button size="small" onClick={loadSubscriptions}>Refresh</Button>
                  {(filters.status || filters.plan) && (
                    <Button size="small" variant="ghost" onClick={() => setFilters({ status: '', plan: '', page: 1 })}>Clear</Button>
                  )}
                </>
              )}
            </div>
            {isMobile && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <Button size="small" onClick={loadSubscriptions} style={{ flex: 1 }}>Refresh</Button>
                {(filters.status || filters.plan) && (
                  <Button size="small" variant="ghost" onClick={() => setFilters({ status: '', plan: '', page: 1 })} style={{ flex: 1 }}>Clear</Button>
                )}
              </div>
            )}
          </Card>

          {/* Table */}
          <Card
            title={`Subscriptions (${pagination?.totalCount || subscriptions.length})`}
            noPadding
            style={{ flex: 1, marginTop: '12px', overflow: 'hidden' }}
          >
            <div style={{ height: isMobile ? 'auto' : '100%', maxHeight: isMobile ? '400px' : 'none', overflow: 'auto' }}>
              <Table
                columns={columns}
                data={subscriptions}
                loading={loading}
                emptyMessage="No subscriptions found"
                onRowClick={setSelectedTenant}
                selectedId={selectedTenant?._id}
              />
            </div>
          </Card>

          {/* Pagination - Bottom */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '12px',
              padding: '12px',
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <Button
                size="small"
                variant="secondary"
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
              >
                Prev
              </Button>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                Page {filters.page} of {pagination.totalPages}
              </span>
              <Button
                size="small"
                variant="secondary"
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Right Panel - Detail */}
        {selectedTenant && (
          <DetailPanel
            title={`${selectedTenant.organizationId || 'Subscription'} - Details`}
            onClose={() => setSelectedTenant(null)}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                flexShrink: 0
              }}>
                {selectedTenant.organizationName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b', wordBreak: 'break-word' }}>
                  {selectedTenant.organizationName}
                </h3>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <Badge variant={getStatusVariant(selectedTenant.subscription?.status)}>
                    {selectedTenant.subscription?.status || 'N/A'}
                  </Badge>
                  <Badge variant={getPlanVariant(selectedTenant.subscription?.planName)}>
                    {selectedTenant.subscription?.planName || 'Free'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Amount Display */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '16px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '700', color: '#1e293b' }}>
                ₹{(selectedTenant.subscription?.amount || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                per {selectedTenant.subscription?.billingCycle || 'month'}
              </div>
            </div>

            {/* Subscription Details */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Subscription Details
              </h4>
              <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '10px' }}>
                <InfoRow label="Organization ID" value={selectedTenant.organizationId} />
                <InfoRow label="Plan" value={selectedTenant.subscription?.planName || 'Free'} />
                <InfoRow label="Billing Cycle" value={selectedTenant.subscription?.billingCycle || 'monthly'} />
                <InfoRow label="Start Date" value={formatDate(selectedTenant.subscription?.startDate)} />
                <InfoRow label="End Date" value={formatDate(selectedTenant.subscription?.endDate)} />
                <InfoRow label="Renewal Date" value={formatDate(selectedTenant.subscription?.renewalDate)} />
                <InfoRow label="Auto Renew" value={selectedTenant.subscription?.autoRenew ? 'Yes' : 'No'} />
              </div>
            </div>

            {/* Usage */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Usage
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{selectedTenant.usage?.users || 0}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Users</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{selectedTenant.usage?.leads || 0}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Leads</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{selectedTenant.usage?.contacts || 0}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Contacts</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{selectedTenant.usage?.deals || 0}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Deals</div>
                </div>
              </div>
            </div>

            {/* Reseller Info */}
            {selectedTenant.reseller && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Reseller
                </h4>
                <div style={{ background: '#eff6ff', borderRadius: '6px', padding: '10px', border: '1px solid #bfdbfe' }}>
                  <InfoRow label="Name" value={`${selectedTenant.reseller.firstName} ${selectedTenant.reseller.lastName}`} />
                  <InfoRow label="Email" value={selectedTenant.reseller.email} />
                  <InfoRow label="Commission Rate" value={`${selectedTenant.commissionRate || 0}%`} />
                </div>
              </div>
            )}

            {/* Trial Info */}
            {selectedTenant.subscription?.isTrialActive && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Trial Period
                </h4>
                <div style={{ background: '#fef3c7', borderRadius: '6px', padding: '10px', border: '1px solid #fcd34d' }}>
                  <InfoRow label="Trial Start" value={formatDate(selectedTenant.subscription?.trialStartDate)} />
                  <InfoRow label="Trial End" value={formatDate(selectedTenant.subscription?.trialEndDate)} />
                </div>
              </div>
            )}

            {/* Contact */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Contact
              </h4>
              <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '10px' }}>
                <InfoRow label="Email" value={selectedTenant.contactEmail} />
                <InfoRow label="Phone" value={selectedTenant.contactPhone} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant={selectedTenant.subscription?.status === 'active' ? 'danger' : 'success'}
                onClick={() => handleUpdateSubscription({
                  status: selectedTenant.subscription?.status === 'active' ? 'suspended' : 'active'
                })}
                style={{ flex: 1 }}
              >
                {selectedTenant.subscription?.status === 'active' ? 'Suspend' : 'Activate'}
              </Button>
            </div>
          </DetailPanel>
        )}
      </div>
    </SaasLayout>
  );
};

export default SaasSubscriptions;
