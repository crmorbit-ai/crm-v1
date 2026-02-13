import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import SaasLayout, { StatCard, Card, Button, useWindowSize } from '../components/layout/SaasLayout';

// Simple Bar Chart Component - Responsive
const BarChart = ({ data, maxValue }) => {
  const { isMobile } = useWindowSize();
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? '8px' : '12px', height: isMobile ? '140px' : '180px', padding: '10px 0' }}>
      {data.map((item, index) => (
        <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '100%',
            maxWidth: isMobile ? '40px' : '60px',
            height: `${Math.max((item.value / max) * (isMobile ? 100 : 140), 8)}px`,
            background: item.color || `linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)`,
            borderRadius: '6px 6px 0 0',
            transition: 'height 0.5s ease',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              top: '-22px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              {item.value}
            </span>
          </div>
          <span style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Donut Chart Component - Responsive
const DonutChart = ({ data }) => {
  const { isMobile } = useWindowSize();
  const size = isMobile ? 100 : 140;
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        {data.map((item, index) => {
          const percent = item.value / total;
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += percent;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = percent > 0.5 ? 1 : 0;

          if (percent === 0) return null;

          return (
            <path
              key={index}
              d={`M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`}
              fill={item.color}
              stroke="#fff"
              strokeWidth="0.04"
            />
          );
        })}
        <circle cx="0" cy="0" r="0.6" fill="#fff" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {data.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: isMobile ? '10px' : '12px', color: '#64748b' }}>{item.label}</span>
            <span style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '700', color: '#1e293b' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ label, value, max, color }) => {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{value}</span>
      </div>
      <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: color || '#3b82f6',
          borderRadius: '4px',
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );
};

const SaasDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet } = useWindowSize();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getTenantStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        totalTenants: 0,
        activeTenants: 0,
        suspendedTenants: 0,
        trialTenants: 0,
        recentTenants: 0,
        tenantsByPlan: { free: 0, basic: 0, professional: 0, enterprise: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const planChartData = [
    { label: 'Free', value: stats?.tenantsByPlan?.free || 0, color: 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)' },
    { label: 'Basic', value: stats?.tenantsByPlan?.basic || 0, color: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)' },
    { label: 'Pro', value: stats?.tenantsByPlan?.professional || 0, color: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)' },
    { label: 'Enterprise', value: stats?.tenantsByPlan?.enterprise || 0, color: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)' }
  ];

  const statusChartData = [
    { label: 'Active', value: stats?.activeTenants || 0, color: '#22c55e' },
    { label: 'Trial', value: stats?.trialTenants || 0, color: '#f59e0b' },
    { label: 'Suspended', value: stats?.suspendedTenants || 0, color: '#ef4444' }
  ];

  // Responsive grid columns
  const statsColumns = isMobile ? 2 : 4;
  const chartsColumns = isMobile ? 1 : isTablet ? 2 : 3;
  const bottomColumns = isMobile ? 1 : 2;

  return (
    <SaasLayout title="Dashboard">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#64748b' }}>
          Loading...
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statsColumns}, 1fr)`, gap: '12px', marginBottom: '20px' }}>
            <StatCard icon="🏢" value={stats?.totalTenants || 0} label="Total Tenants" to="/saas/tenants" />
            <StatCard icon="✅" value={stats?.activeTenants || 0} label="Active" to="/saas/tenants?status=active" />
            <StatCard icon="⏳" value={stats?.trialTenants || 0} label="On Trial" to="/saas/tenants?status=trial" />
            <StatCard icon="🚫" value={stats?.suspendedTenants || 0} label="Suspended" to="/saas/tenants?status=suspended" />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${chartsColumns}, 1fr)`, gap: '16px', marginBottom: '16px' }}>
            {/* Bar Chart - Tenants by Plan */}
            <Card title="Tenants by Plan">
              <BarChart data={planChartData} />
            </Card>

            {/* Donut Chart - Status Distribution */}
            <Card title="Status Distribution">
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                <DonutChart data={statusChartData} />
              </div>
            </Card>

            {/* Monthly Growth Card */}
            <Card title="This Month">
              <div style={{ textAlign: 'center', padding: isMobile ? '12px 0' : '20px 0' }}>
                <div style={{
                  fontSize: isMobile ? '36px' : '52px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '8px'
                }}>
                  +{stats?.recentTenants || 0}
                </div>
                <div style={{ fontSize: isMobile ? '11px' : '13px', color: '#64748b', fontWeight: '500', marginBottom: '16px' }}>
                  new tenants (30 days)
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  <span style={{ fontSize: isMobile ? '11px' : '13px', color: '#15803d', fontWeight: '600' }}>
                    📈 {stats?.totalTenants > 0 ? Math.round((stats?.recentTenants / stats?.totalTenants) * 100) : 0}% growth rate
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${bottomColumns}, 1fr)`, gap: '16px', marginBottom: '16px' }}>
            {/* Plan Distribution Progress */}
            <Card title="Plan Distribution">
              <ProgressBar
                label="Free Plan"
                value={stats?.tenantsByPlan?.free || 0}
                max={stats?.totalTenants || 1}
                color="#94a3b8"
              />
              <ProgressBar
                label="Basic Plan"
                value={stats?.tenantsByPlan?.basic || 0}
                max={stats?.totalTenants || 1}
                color="#3b82f6"
              />
              <ProgressBar
                label="Professional Plan"
                value={stats?.tenantsByPlan?.professional || 0}
                max={stats?.totalTenants || 1}
                color="#8b5cf6"
              />
              <ProgressBar
                label="Enterprise Plan"
                value={stats?.tenantsByPlan?.enterprise || 0}
                max={stats?.totalTenants || 1}
                color="#f59e0b"
              />
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions">
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                <Link to="/saas/tenants" style={{ textDecoration: 'none' }}>
                  <Button style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}>
                    🏢 Tenants
                  </Button>
                </Link>
                <Link to="/saas/subscriptions" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}>
                    📊 Subscriptions
                  </Button>
                </Link>
                <Link to="/saas/billings" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}>
                    💰 Billings
                  </Button>
                </Link>
                <Link to="/saas/resellers" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}>
                    🤝 Resellers
                  </Button>
                </Link>
                <Link to="/saas/support" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}>
                    🎧 Support
                  </Button>
                </Link>
                <Button variant="ghost" onClick={loadStats} style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}>
                  🔄 Refresh
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </SaasLayout>
  );
};

export default SaasDashboard;
