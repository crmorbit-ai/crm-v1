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
      const data = await tenantService.getTenantStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="flex-between">
            <h1>SAAS Platform Dashboard</h1>
            <div className="flex gap-10">
              <span>Welcome, {user?.firstName} {user?.lastName}</span>
              <button onClick={logout} className="btn btn-outline">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div className="container">
          <Link to="/saas/dashboard" className="nav-item active">Dashboard</Link>
          <Link to="/saas/tenants" className="nav-item">Tenants</Link>
          <Link to="/saas/subscriptions" className="nav-item">Subscriptions</Link>
          <Link to="/saas/billings" className="nav-item">Billings</Link>
          <Link to="/saas/resellers" className="nav-item">🤝 Resellers</Link>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="container">
          {loading ? (
            <p>Loading statistics...</p>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{backgroundColor: '#e3f2fd'}}>🏢</div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats?.totalTenants || 0}</h3>
                    <p className="stat-label">Total Tenants</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{backgroundColor: '#e8f5e9'}}>✅</div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats?.activeTenants || 0}</h3>
                    <p className="stat-label">Active Tenants</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{backgroundColor: '#fff3e0'}}>🔄</div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats?.trialTenants || 0}</h3>
                    <p className="stat-label">Trial Tenants</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{backgroundColor: '#ffebee'}}>⏸️</div>
                  <div className="stat-info">
                    <h3 className="stat-value">{stats?.suspendedTenants || 0}</h3>
                    <p className="stat-label">Suspended</p>
                  </div>
                </div>
              </div>

              <div className="card mt-20">
                <div className="card-header">Tenants by Plan</div>
                <div className="plan-stats">
                  <div className="plan-stat">
                    <span className="plan-name">Free</span>
                    <span className="plan-count">{stats?.tenantsByPlan?.free || 0}</span>
                  </div>
                  <div className="plan-stat">
                    <span className="plan-name">Basic</span>
                    <span className="plan-count">{stats?.tenantsByPlan?.basic || 0}</span>
                  </div>
                  <div className="plan-stat">
                    <span className="plan-name">Premium</span>
                    <span className="plan-count">{stats?.tenantsByPlan?.premium || 0}</span>
                  </div>
                  <div className="plan-stat">
                    <span className="plan-name">Enterprise</span>
                    <span className="plan-count">{stats?.tenantsByPlan?.enterprise || 0}</span>
                  </div>
                </div>
              </div>

              <div className="card mt-20">
                <div className="card-header">Quick Actions</div>
                <div className="quick-actions">
                  <Link to="/saas/tenants" className="btn btn-primary">
                    View All Tenants
                  </Link>
                  <Link to="/saas/subscriptions" className="btn btn-secondary">
                    Manage Subscriptions
                  </Link>
                  <Link to="/saas/billings" className="btn btn-success">
                    Billing Overview
                  </Link>
                  <Link to="/saas/resellers" className="btn btn-warning">
                    🤝 Manage Resellers
                  </Link>
                </div>
              </div>

              <div className="card mt-20">
                <div className="card-header">Recent Growth</div>
                <p className="stat-highlight">
                  {stats?.recentTenants || 0} new tenants in the last 30 days
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SaasDashboard;