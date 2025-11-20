import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api.config';
import '../styles/crm.css';

const ResellerDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/reseller/login');
        return;
      }

      const response = await fetch(`${API_URL}/resellers/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/reseller/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <p style={{ color: '#EF4444', marginBottom: '16px' }}>{error}</p>
          <button onClick={() => navigate('/reseller/login')} className="btn btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const { reseller, stats, tenants } = dashboardData;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
            Reseller Dashboard
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '4px 0 0 0' }}>
            {reseller.name} • {reseller.companyName}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Logout
        </button>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Total Tenants */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>
                  Total Clients
                </p>
                <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                  {stats.totalTenants}
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#DBEAFE',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🏢
              </div>
            </div>
          </div>

          {/* Active Tenants */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>
                  Active Clients
                </p>
                <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#10B981', margin: 0 }}>
                  {stats.activeTenants}
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#D1FAE5',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                ✅
              </div>
            </div>
          </div>

          {/* Monthly Commission */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>
                  Monthly Commission
                </p>
                <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#8B5CF6', margin: 0 }}>
                  ₹{stats.totalMonthlyCommission?.toLocaleString() || 0}
                </h2>
                <p style={{ color: '#6B7280', fontSize: '12px', margin: '4px 0 0 0' }}>
                  {reseller.commissionRate}% per client
                </p>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#EDE9FE',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                💰
              </div>
            </div>
          </div>

          {/* Total Earned */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>
                  Total Earned
                </p>
                <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#F59E0B', margin: 0 }}>
                  ₹{stats.totalEarnedCommission?.toLocaleString() || 0}
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#FEF3C7',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🎯
              </div>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
              Your Clients ({stats.activeTenants})
            </h3>
          </div>

          {tenants && tenants.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#F9FAFB' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Organization
                    </th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Email
                    </th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Plan
                    </th>
                    <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Subscription
                    </th>
                    <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Your Commission
                    </th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Onboarded
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant, index) => (
                    <tr key={tenant._id} style={{ borderTop: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>
                        {tenant.name}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6B7280' }}>
                        {tenant.email}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: tenant.isActive ? '#DBEAFE' : '#FEE2E2',
                          color: tenant.isActive ? '#1E40AF' : '#991B1B',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {tenant.status || 'trial'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1F2937', textAlign: 'right', fontWeight: '600' }}>
                        ₹{tenant.monthlyAmount?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#8B5CF6', textAlign: 'right', fontWeight: '700' }}>
                        ₹{tenant.commission?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6B7280' }}>
                        {tenant.joinedDate ? new Date(tenant.joinedDate).toLocaleDateString() : 'Invalid Date'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <p style={{ color: '#6B7280', fontSize: '16px' }}>
                No clients onboarded yet. Start referring businesses to earn commission!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResellerDashboard;