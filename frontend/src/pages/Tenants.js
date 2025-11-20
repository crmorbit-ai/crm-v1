import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Tenants = () => {
  const { logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="flex-between">
            <h1>Tenant Management</h1>
            <button onClick={logout} className="btn btn-outline">Logout</button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div className="container">
          <Link to="/saas/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/saas/tenants" className="nav-item active">Tenants</Link>
          <Link to="/saas/subscriptions" className="nav-item">Subscriptions</Link>
          <Link to="/saas/billings" className="nav-item">Billings</Link>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="container">
          <div className="card">
            <div className="card-header">All Tenants</div>
            <p style={{padding: '20px'}}>Tenant list will be displayed here. Use tenantService to fetch and manage tenants.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tenants;
