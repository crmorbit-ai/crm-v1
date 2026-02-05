import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import SaasLayout, { StatCard, Card, Badge, Button, Table, Select, DetailPanel, InfoRow } from '../components/layout/SaasLayout';

const Billings = () => {
  const [billings, setBillings] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, monthlyRevenue: 0, pendingPayments: 0, paidInvoices: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', month: '' });
  const [selectedBilling, setSelectedBilling] = useState(null);

  useEffect(() => {
    loadBillings();
  }, [filters]);

  const loadBillings = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getAllSubscriptions(filters);
      if (response.success) {
        const subs = response.data.subscriptions || [];
        setBillings(subs);
        const totalRevenue = subs.reduce((sum, t) => sum + (t.subscription?.amount || 0), 0);
        const activeCount = subs.filter(t => t.subscription?.status === 'active').length;
        setStats({
          totalRevenue,
          monthlyRevenue: response.data.revenue?.monthlyRecurring || totalRevenue,
          paidInvoices: activeCount,
          pendingPayments: subs.length - activeCount
        });
      }
    } catch (error) {
      console.error('Failed to load billings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    const map = { active: 'success', trial: 'warning', expired: 'danger', cancelled: 'default', suspended: 'danger' };
    return map[status] || 'default';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const columns = [
    {
      header: 'Organization',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '11px'
          }}>
            {row.organizationName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '12px' }}>{row.organizationName}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>{row.organizationId || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Plan',
      render: (row) => <Badge variant="info">{row.subscription?.planName || 'Free'}</Badge>
    },
    {
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '700', color: '#10b981', fontSize: '12px' }}>
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

  return (
    <SaasLayout title="Billing Management">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <StatCard icon="💰" value={`₹${stats.totalRevenue.toLocaleString()}`} label="Total Revenue" />
        <StatCard icon="📅" value={`₹${stats.monthlyRevenue.toLocaleString()}`} label="Monthly Recurring" />
        <StatCard icon="✅" value={stats.paidInvoices} label="Active Plans" />
        <StatCard icon="⏳" value={stats.pendingPayments} label="Inactive/Trial" />
      </div>

      {/* Main Content - Split View */}
      <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 280px)', minHeight: '500px' }}>
        {/* Left Panel */}
        <div style={{ flex: selectedBilling ? '0 0 55%' : '1', display: 'flex', flexDirection: 'column' }}>
          {/* Filters */}
          <Card>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'trial', label: 'Trial' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'suspended', label: 'Suspended' }
                ]}
                style={{ marginBottom: 0, minWidth: '140px' }}
              />
              <Button size="small" onClick={loadBillings}>Refresh</Button>
              {filters.status && (
                <Button size="small" variant="ghost" onClick={() => setFilters({ status: '', month: '' })}>Clear</Button>
              )}
            </div>
          </Card>

          {/* Table */}
          <Card title={`Subscriptions (${billings.length})`} noPadding style={{ flex: 1, marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ height: '100%', overflow: 'auto' }}>
              <Table
                columns={columns}
                data={billings}
                loading={loading}
                emptyMessage="No billing records found"
                onRowClick={setSelectedBilling}
                selectedId={selectedBilling?._id}
              />
            </div>
          </Card>
        </div>

        {/* Right Panel - Detail */}
        {selectedBilling && (
          <DetailPanel
            title={`${selectedBilling.organizationId || 'Billing'} - Details`}
            onClose={() => setSelectedBilling(null)}
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
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                {selectedBilling.organizationName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                  {selectedBilling.organizationName}
                </h3>
                <Badge variant={getStatusVariant(selectedBilling.subscription?.status)}>
                  {selectedBilling.subscription?.status || 'N/A'}
                </Badge>
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
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                ₹{(selectedBilling.subscription?.amount || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                per {selectedBilling.subscription?.billingCycle || 'month'}
              </div>
            </div>

            {/* Subscription Info */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Subscription Details
              </h4>
              <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '10px' }}>
                <InfoRow label="Organization ID" value={selectedBilling.organizationId} />
                <InfoRow label="Plan" value={selectedBilling.subscription?.planName || 'Free'} />
                <InfoRow label="Billing Cycle" value={selectedBilling.subscription?.billingCycle || 'monthly'} />
                <InfoRow label="Start Date" value={formatDate(selectedBilling.subscription?.startDate)} />
                <InfoRow label="End Date" value={formatDate(selectedBilling.subscription?.endDate)} />
                <InfoRow label="Renewal Date" value={formatDate(selectedBilling.subscription?.renewalDate)} />
                <InfoRow label="Auto Renew" value={selectedBilling.subscription?.autoRenew ? 'Yes' : 'No'} />
              </div>
            </div>

            {/* Payment History */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Payment Info
              </h4>
              <div style={{ background: '#eff6ff', borderRadius: '6px', padding: '10px', border: '1px solid #bfdbfe' }}>
                <InfoRow label="Last Payment" value={formatDate(selectedBilling.subscription?.lastPaymentDate)} />
                <InfoRow label="Last Amount" value={`₹${selectedBilling.subscription?.lastPaymentAmount || 0}`} />
                <InfoRow label="Total Paid" value={`₹${selectedBilling.subscription?.totalPaid || 0}`} />
                <InfoRow label="Currency" value={selectedBilling.subscription?.currency || 'INR'} />
              </div>
            </div>

            {/* Contact Info */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Contact
              </h4>
              <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '10px' }}>
                <InfoRow label="Email" value={selectedBilling.contactEmail} />
                <InfoRow label="Phone" value={selectedBilling.contactPhone} />
              </div>
            </div>

            {/* Trial Info */}
            {selectedBilling.subscription?.isTrialActive && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Trial Period
                </h4>
                <div style={{ background: '#fef3c7', borderRadius: '6px', padding: '10px', border: '1px solid #fcd34d' }}>
                  <InfoRow label="Trial Start" value={formatDate(selectedBilling.subscription?.trialStartDate)} />
                  <InfoRow label="Trial End" value={formatDate(selectedBilling.subscription?.trialEndDate)} />
                </div>
              </div>
            )}
          </DetailPanel>
        )}
      </div>
    </SaasLayout>
  );
};

export default Billings;
