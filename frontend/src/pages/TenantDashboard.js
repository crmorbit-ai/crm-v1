import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/dashboard.css';

const TenantDashboard = () => {
  const { user, logout, hasPermission } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="flex-between">
            <h1>Dashboard</h1>
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
          <Link to="/dashboard" className="nav-item active">Dashboard</Link>
          {hasPermission('user_management', 'read') && (
            <Link to="/users" className="nav-item">Users</Link>
          )}
          {hasPermission('role_management', 'read') && (
            <Link to="/roles" className="nav-item">Roles</Link>
          )}
          {hasPermission('group_management', 'read') && (
            <Link to="/groups" className="nav-item">Groups</Link>
          )}
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{backgroundColor: '#e3f2fd'}}>👥</div>
              <div className="stat-info">
                <h3 className="stat-value">--</h3>
                <p className="stat-label">Total Users</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{backgroundColor: '#f3e5f5'}}>🔐</div>
              <div className="stat-info">
                <h3 className="stat-value">--</h3>
                <p className="stat-label">Active Roles</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{backgroundColor: '#e8f5e9'}}>👥</div>
              <div className="stat-info">
                <h3 className="stat-value">--</h3>
                <p className="stat-label">Groups</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{backgroundColor: '#fff3e0'}}>📊</div>
              <div className="stat-info">
                <h3 className="stat-value">{user?.tenant?.planType || 'Free'}</h3>
                <p className="stat-label">Current Plan</p>
              </div>
            </div>
          </div>

          <div className="card mt-20">
            <div className="card-header">Quick Actions</div>
            <div className="quick-actions">
              {hasPermission('user_management', 'create') && (
                <Link to="/users" className="btn btn-primary">
                  Add New User
                </Link>
              )}
              {hasPermission('role_management', 'create') && (
                <Link to="/roles" className="btn btn-secondary">
                  Create Role
                </Link>
              )}
              {hasPermission('group_management', 'create') && (
                <Link to="/groups" className="btn btn-success">
                  Create Group
                </Link>
              )}
            </div>
          </div>

          <div className="card mt-20">
            <div className="card-header">Organization Information</div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Organization:</span>
                <span className="info-value">{user?.tenant?.organizationName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Plan:</span>
                <span className="info-value">{user?.tenant?.planType?.toUpperCase()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Your Role:</span>
                <span className="info-value">{user?.userType?.replace(/_/g, ' ')}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value">
                  <span className={`badge ${user?.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenantDashboard;
