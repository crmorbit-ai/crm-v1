import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import SubscriptionAlert from '../components/SubscriptionAlert';
import { leadService } from '../services/leadService';
import { accountService } from '../services/accountService';
import { contactService } from '../services/contactService';
import { opportunityService } from '../services/opportunityService';
import { useAuth } from '../context/AuthContext';
import '../styles/crm.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    leads: null,
    accounts: null,
    contacts: null,
    opportunities: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Load all stats in parallel
      const [leadStats, accountStats, contactStats, opportunityStats] = await Promise.all([
        leadService.getLeadStats().catch(err => ({ data: null })),
        accountService.getAccountStats().catch(err => ({ data: null })),
        contactService.getContactStats().catch(err => ({ data: null })),
        opportunityService.getOpportunityStats().catch(err => ({ data: null }))
      ]);

      setStats({
        leads: leadStats.data,
        accounts: accountStats.data,
        contacts: contactStats.data,
        opportunities: opportunityStats.data
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <DashboardLayout title={`Welcome back, ${user?.firstName}! 👋`}>
      
      {/* ⭐ SUBSCRIPTION ALERT - NEW */}
      <SubscriptionAlert />

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Leads</div>
          <div className="stat-value">{loading ? '...' : stats?.leads?.total || 0}</div>
          <div className="stat-change">
            {loading ? '...' : stats?.leads?.newThisMonth || 0} new this month
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Accounts</div>
          <div className="stat-value">{loading ? '...' : stats?.accounts?.total || 0}</div>
          <div className="stat-change">
            {loading ? '...' : stats?.accounts?.newThisMonth || 0} new this month
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Contacts</div>
          <div className="stat-value">{loading ? '...' : stats?.contacts?.total || 0}</div>
          <div className="stat-change">
            {loading ? '...' : stats?.contacts?.newThisMonth || 0} new this month
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Pipeline</div>
          <div className="stat-value">
            {loading ? '...' : formatCurrency(stats?.opportunities?.totalValue || 0)}
          </div>
          <div className="stat-change positive">
            {loading ? '...' : stats?.opportunities?.total || 0} opportunities
          </div>
        </div>
      </div>

      {/* Opportunity Stats */}
      {stats.opportunities && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-label">Weighted Pipeline</div>
            <div className="stat-value" style={{ fontSize: '20px' }}>
              {formatCurrency(stats.opportunities.weightedValue || 0)}
            </div>
            <small className="stat-change">Expected value</small>
          </div>
          <div className="stat-card">
            <div className="stat-label">Closing This Month</div>
            <div className="stat-value">{stats.opportunities.closingThisMonth || 0}</div>
            <small className="stat-change">Opportunities</small>
          </div>
          <div className="stat-card">
            <div className="stat-label">Closed Won</div>
            <div className="stat-value">{stats.opportunities.wonCount || 0}</div>
            <small className="stat-change positive">Success</small>
          </div>
          <div className="stat-card">
            <div className="stat-label">Closed Lost</div>
            <div className="stat-value">{stats.opportunities.lostCount || 0}</div>
            <small className="stat-change">Lost deals</small>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">Quick Actions</h2>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* ⭐ NEW - Subscription Button */}
          <Link to="/subscription" className="crm-btn" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            💳 Manage Subscription
          </Link>
          <Link to="/leads" className="crm-btn crm-btn-primary">
            📋 View Leads
          </Link>
          <Link to="/accounts" className="crm-btn crm-btn-secondary">
            🏢 View Accounts
          </Link>
          <Link to="/contacts" className="crm-btn crm-btn-secondary">
            👤 View Contacts
          </Link>
          <Link to="/opportunities" className="crm-btn crm-btn-secondary">
            💰 View Opportunities
          </Link>
        </div>
      </div>

      {/* Opportunity Pipeline by Stage */}
      {stats.opportunities && stats.opportunities.byStage && stats.opportunities.byStage.length > 0 && (
        <div className="crm-card">
          <div className="crm-card-header">
            <h2 className="crm-card-title">Opportunity Pipeline by Stage</h2>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {stats.opportunities.byStage.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#F9FAFB',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <span style={{ fontWeight: '600', minWidth: '150px' }}>
                    {item._id || 'Unknown'}
                  </span>
                  <span style={{ color: '#6B7280' }}>
                    {item.count} {item.count === 1 ? 'opportunity' : 'opportunities'}
                  </span>
                </div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#10B981' }}>
                  {formatCurrency(item.totalAmount || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead Status Breakdown */}
      {stats.leads && stats.leads.byStatusDetailed && stats.leads.byStatusDetailed.length > 0 && (
        <div className="crm-card">
          <div className="crm-card-header">
            <h2 className="crm-card-title">Lead Pipeline</h2>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {stats.leads.byStatusDetailed.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#F9FAFB',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    className={`status-badge ${item._id?.toLowerCase() || 'new'}`}
                  >
                    {item._id || 'Unknown'}
                  </span>
                </div>
                <div style={{ fontWeight: '700', fontSize: '18px' }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Types */}
      {stats.accounts && stats.accounts.byType && stats.accounts.byType.length > 0 && (
        <div className="crm-card">
          <div className="crm-card-header">
            <h2 className="crm-card-title">Accounts by Type</h2>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {stats.accounts.byType.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#F9FAFB',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontWeight: '600' }}>{item._id || 'Unknown'}</div>
                <div style={{ fontWeight: '700', color: '#4A90E2' }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;