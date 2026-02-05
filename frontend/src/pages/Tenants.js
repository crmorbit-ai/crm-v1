import React, { useEffect, useState } from 'react';
import { tenantService } from '../services/tenantService';
import SaasLayout, { StatCard, Card, Badge, Button, Table, Select, DetailPanel, InfoRow, useWindowSize } from '../components/layout/SaasLayout';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const { isMobile, isTablet } = useWindowSize();

  useEffect(() => {
    loadTenants();
    loadStats();
  }, [pagination.page]);

  const loadStats = async () => {
    try {
      const data = await tenantService.getTenantStats();
      setStats({
        total: data.totalTenants || 0,
        active: data.activeTenants || 0,
        trial: data.trialTenants || 0,
        suspended: data.suspendedTenants || 0
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.getTenants({
        page: pagination.page,
        limit: pagination.limit
      });
      const tenantsList = data.tenants || data || [];
      setTenants(tenantsList);

      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          ...data.pagination,
          pages: data.pagination.pages || Math.ceil((data.pagination.total || tenantsList.length) / prev.limit)
        }));
      } else {
        setPagination(prev => ({
          ...prev,
          total: tenantsList.length,
          pages: 1
        }));
      }
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
      await tenantService.suspendTenant(tenantId, 'Suspended by admin');
      alert('Tenant suspended successfully!');
      setSelectedTenant(null);
      await loadTenants();
      await loadStats();
    } catch (error) {
      alert('Failed to suspend tenant: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleActivateTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to activate this tenant?')) return;
    try {
      await tenantService.activateTenant(tenantId);
      alert('Tenant activated successfully!');
      setSelectedTenant(null);
      await loadTenants();
      await loadStats();
    } catch (error) {
      alert('Failed to activate tenant: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone!')) return;
    try {
      await tenantService.deleteTenant(tenantId);
      alert('Tenant deleted successfully!');
      setSelectedTenant(null);
      await loadTenants();
      await loadStats();
    } catch (error) {
      alert('Failed to delete tenant: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch =
      tenant.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.organizationId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tenant.subscription?.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || tenant.subscription?.planName?.toLowerCase() === filterPlan.toLowerCase();
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusVariant = (status) => {
    const map = { active: 'success', trial: 'warning', suspended: 'danger', expired: 'default' };
    return map[status] || 'default';
  };

  const getPlanVariant = (plan) => {
    const map = { free: 'default', basic: 'info', professional: 'purple', enterprise: 'warning' };
    return map[plan?.toLowerCase()] || 'default';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Responsive columns for table
  const columns = isMobile ? [
    {
      header: 'Tenant',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.organizationName || 'N/A'}</div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
              <Badge variant={getPlanVariant(row.subscription?.planName)}>{row.subscription?.planName || 'Free'}</Badge>
              <Badge variant={getStatusVariant(row.subscription?.status)}>{row.subscription?.status || 'N/A'}</Badge>
            </div>
          </div>
        </div>
      )
    }
  ] : [
    {
      header: 'Org ID',
      render: (row) => (
        <span style={{
          background: '#fef3c7',
          color: '#92400e',
          padding: '3px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '700',
          fontFamily: 'monospace'
        }}>
          {row.organizationId || 'N/A'}
        </span>
      )
    },
    {
      header: 'Company',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '12px' }}>{row.organizationName || 'N/A'}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>{row.contactEmail || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Plan',
      align: 'center',
      render: (row) => <Badge variant={getPlanVariant(row.subscription?.planName)}>{row.subscription?.planName || 'Free'}</Badge>
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => <Badge variant={getStatusVariant(row.subscription?.status)}>{row.subscription?.status || 'N/A'}</Badge>
    }
  ];

  // Responsive stat grid columns
  const statsColumns = isMobile ? 2 : 4;

  return (
    <SaasLayout title="Tenant Management">
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statsColumns}, 1fr)`, gap: '12px', marginBottom: '16px' }}>
        <StatCard icon="🏢" value={stats.total} label="Total Tenants" />
        <StatCard icon="✅" value={stats.active} label="Active" />
        <StatCard icon="⏳" value={stats.trial} label="On Trial" />
        <StatCard icon="🚫" value={stats.suspended} label="Suspended" />
      </div>

      {/* Main Content - Split View (stacked on mobile) */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '16px',
        minHeight: isMobile ? 'auto' : '500px'
      }}>
        {/* Left Panel - List */}
        <div style={{
          flex: (!isMobile && selectedTenant) ? '0 0 55%' : '1',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Filters */}
          <Card>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: isMobile ? '100%' : '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#475569', marginBottom: '4px' }}>
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <Select
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'trial', label: 'Trial' },
                  { value: 'suspended', label: 'Suspended' }
                ]}
                style={{ marginBottom: 0, minWidth: isMobile ? 'calc(50% - 6px)' : '120px', flex: isMobile ? '1' : 'none' }}
              />
              <Select
                label="Plan"
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                options={[
                  { value: 'all', label: 'All Plans' },
                  { value: 'free', label: 'Free' },
                  { value: 'basic', label: 'Basic' },
                  { value: 'professional', label: 'Professional' },
                  { value: 'enterprise', label: 'Enterprise' }
                ]}
                style={{ marginBottom: 0, minWidth: isMobile ? 'calc(50% - 6px)' : '120px', flex: isMobile ? '1' : 'none' }}
              />
              {!isMobile && <Button size="small" onClick={() => { loadTenants(); loadStats(); }}>Refresh</Button>}
            </div>
            {isMobile && (
              <Button size="small" onClick={() => { loadTenants(); loadStats(); }} style={{ marginTop: '12px', width: '100%' }}>
                Refresh
              </Button>
            )}
          </Card>

          {/* Table */}
          <Card
            title={`Tenants (${pagination.total || filteredTenants.length})`}
            noPadding
            style={{ flex: 1, marginTop: '12px', overflow: 'hidden' }}
          >
            <div style={{ height: isMobile ? 'auto' : '100%', maxHeight: isMobile ? '400px' : 'none', overflow: 'auto' }}>
              {error ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#ef4444' }}>
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚠️</div>
                  <div style={{ fontSize: '12px' }}>{error}</div>
                  <Button onClick={loadTenants} size="small" style={{ marginTop: '12px' }}>Try Again</Button>
                </div>
              ) : (
                <Table
                  columns={columns}
                  data={filteredTenants}
                  loading={loading}
                  emptyMessage="No tenants found"
                  onRowClick={setSelectedTenant}
                  selectedId={selectedTenant?._id}
                />
              )}
            </div>
          </Card>

          {/* Pagination - Bottom */}
          {pagination.pages > 1 && (
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
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
              >
                Prev
              </Button>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                size="small"
                variant="secondary"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Right Panel - Detail */}
        {selectedTenant && (
          <DetailPanel
            title={`${selectedTenant.organizationId} - Details`}
            onClose={() => setSelectedTenant(null)}
          >
            {/* Header with Avatar */}
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
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
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

            {/* Organization Info */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Organization Info
              </h4>
              <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '10px' }}>
                <InfoRow label="Organization ID" value={selectedTenant.organizationId} />
                <InfoRow label="Subdomain" value={selectedTenant.slug} />
                <InfoRow label="Email" value={selectedTenant.contactEmail} />
                <InfoRow label="Phone" value={selectedTenant.contactPhone} />
                <InfoRow label="Business Type" value={selectedTenant.businessType} />
                <InfoRow label="Industry" value={selectedTenant.industry} />
              </div>
            </div>

            {/* Subscription Info */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Subscription
              </h4>
              <div style={{ background: '#eff6ff', borderRadius: '6px', padding: '10px', border: '1px solid #bfdbfe' }}>
                <InfoRow label="Plan" value={selectedTenant.subscription?.planName || 'Free'} />
                <InfoRow label="Billing Cycle" value={selectedTenant.subscription?.billingCycle || 'monthly'} />
                <InfoRow label="Amount" value={`₹${selectedTenant.subscription?.amount || 0}`} />
                <InfoRow label="Start Date" value={formatDate(selectedTenant.subscription?.startDate)} />
                <InfoRow label="End Date" value={formatDate(selectedTenant.subscription?.endDate)} />
                {selectedTenant.subscription?.isTrialActive && (
                  <>
                    <InfoRow label="Trial Start" value={formatDate(selectedTenant.subscription?.trialStartDate)} />
                    <InfoRow label="Trial End" value={formatDate(selectedTenant.subscription?.trialEndDate)} />
                  </>
                )}
              </div>
            </div>

            {/* Usage Stats */}
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

            {/* Timestamps */}
            <div style={{ marginBottom: '16px', fontSize: '11px', color: '#64748b' }}>
              <div>Created: {formatDate(selectedTenant.createdAt)}</div>
              <div>Updated: {formatDate(selectedTenant.updatedAt)}</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
              {selectedTenant.subscription?.status === 'suspended' ? (
                <Button variant="success" onClick={() => handleActivateTenant(selectedTenant._id)} style={{ flex: 1 }}>
                  Activate
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => handleSuspendTenant(selectedTenant._id)} style={{ flex: 1 }}>
                  Suspend
                </Button>
              )}
              <Button variant="danger" onClick={() => handleDeleteTenant(selectedTenant._id)} style={{ flex: 1 }}>
                Delete
              </Button>
            </div>
          </DetailPanel>
        )}
      </div>
    </SaasLayout>
  );
};

export default Tenants;
