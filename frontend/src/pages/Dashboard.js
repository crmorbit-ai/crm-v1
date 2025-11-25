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
        <div className="crm-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* ⭐ NEW - Subscription Button */}
            <Link to="/subscription" className="crm-btn" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}>
              💳 Subscription
            </Link>
            <Link to="/leads" className="crm-btn crm-btn-primary">
              📋 Leads
            </Link>
            <Link to="/accounts" className="crm-btn crm-btn-secondary">
              🏢 Accounts
            </Link>
            <Link to="/contacts" className="crm-btn crm-btn-secondary">
              👤 Contacts
            </Link>
            <Link to="/opportunities" className="crm-btn crm-btn-secondary">
              💰 Opportunities
            </Link>
          </div>
        </div>
      </div>

      {/* Opportunity Pipeline by Stage */}
      {stats.opportunities && stats.opportunities.byStage && stats.opportunities.byStage.length > 0 && (
        <div className="crm-card">
          <div className="crm-card-header">
            <h2 className="crm-card-title">Opportunity Pipeline by Stage</h2>
          </div>
          <div className="crm-card-body">
            <div style={{ display: 'grid', gap: '14px' }}>
              {stats.opportunities.byStage.map((item, index) => (
                <div
                  key={item._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '18px 20px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.borderColor = '#4A90E2';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: `linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)`
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, paddingLeft: '12px' }}>
                    <span style={{
                      fontWeight: '700',
                      minWidth: '150px',
                      fontSize: '15px',
                      color: '#1e3c72'
                    }}>
                      {item._id || 'Unknown'}
                    </span>
                    <span style={{
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {item.count} {item.count === 1 ? 'opportunity' : 'opportunities'}
                    </span>
                  </div>
                  <div style={{
                    fontWeight: '800',
                    fontSize: '18px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {formatCurrency(item.totalAmount || 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lead Status Breakdown */}
      {stats.leads && stats.leads.byStatusDetailed && stats.leads.byStatusDetailed.length > 0 && (
        <div className="crm-card">
          <div className="crm-card-header">
            <h2 className="crm-card-title">Lead Pipeline</h2>
          </div>
          <div className="crm-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {stats.leads.byStatusDetailed.map((item) => (
                <div
                  key={item._id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 16px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#4A90E2';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(74, 144, 226, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span
                    className={`status-badge ${item._id?.toLowerCase() || 'new'}`}
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                  >
                    {item._id || 'Unknown'}
                  </span>
                  <div style={{
                    fontWeight: '800',
                    fontSize: '32px',
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account Types */}
      {stats.accounts && stats.accounts.byType && stats.accounts.byType.length > 0 && (
        <div className="crm-card">
          <div className="crm-card-header">
            <h2 className="crm-card-title">Accounts by Type</h2>
          </div>
          <div className="crm-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
              {stats.accounts.byType.map((item) => (
                <div
                  key={item._id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px 16px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = '#4A90E2';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(74, 144, 226, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    fontWeight: '700',
                    fontSize: '14px',
                    color: '#64748b',
                    textAlign: 'center'
                  }}>
                    {item._id || 'Unknown'}
                  </div>
                  <div style={{
                    fontWeight: '800',
                    fontSize: '28px',
                    background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;