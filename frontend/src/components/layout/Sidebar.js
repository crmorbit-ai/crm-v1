import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/crm.css';

const Sidebar = () => {
  const location = useLocation();
  const { hasPermission, isSaasOwner } = useAuth();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const NavItem = ({ to, icon, label, permission }) => {
    const hasAccess = permission ? hasPermission(permission, 'read') : true;
    const active = isActive(to);

    if (!hasAccess) {
      return (
        <div className="crm-tooltip">
          <div className={`nav-item disabled`}>
            <span className="nav-item-icon">{icon}</span>
            {label}
          </div>
          <span className="crm-tooltip-text">You don't have access</span>
        </div>
      );
    }

    return (
      <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
        <span className="nav-item-icon">{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <div className="crm-sidebar">
      <div className="sidebar-logo">
        <h2>🚀  UFS CRM </h2>
      </div>

      <nav className="sidebar-nav">
        {/* Dashboard & Admin Section */}
        <div className="nav-section">
          <Link
            to="/dashboard"
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">🏠</span>
            Dashboard
          </Link>
          
          <Link
            to="/subscription"
            className={`nav-item ${isActive('/subscription') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">💳</span>
            Subscription & Billing
          </Link>

          <Link
            to="/data-center"
            className={`nav-item ${isActive('/data-center') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">👥</span>
            Customer
          </Link>

          <Link
            to="/products"
            className={`nav-item ${isActive('/products') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">📦</span>
            Product
          </Link>

          <Link
            to="/activity-logs"
            className={`nav-item ${isActive('/activity-logs') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">📋</span>
            Audit Logs
          </Link>
        </div>

        {/* CRM Section */}
        <div className="nav-section">
          <div className="nav-section-title">CRM</div>
          <NavItem
            to="/leads"
            icon="📋"
            label="Leads"
            permission="lead_management"
          />
          <NavItem
            to="/accounts"
            icon="🏢"
            label="Accounts"
            permission="account_management"
          />
          <NavItem
            to="/contacts"
            icon="👤"
            label="Contacts"
            permission="contact_management"
          />
          <NavItem
            to="/opportunities"
            icon="💰"
            label="Opportunities"
            permission="opportunity_management"
          />
        </div>

        {/* Activities Section */}
        <div className="nav-section">
          <div className="nav-section-title">Activities</div>
          <Link
            to="/tasks"
            className={`nav-item ${isActive('/tasks') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">✓</span>
            Tasks
          </Link>
          <Link
            to="/meetings"
            className={`nav-item ${isActive('/meetings') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">📅</span>
            Meetings
          </Link>
          <Link
            to="/calls"
            className={`nav-item ${isActive('/calls') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">📞</span>
            Calls
          </Link>
          <Link
            to="/activities/emails"
            className={`nav-item ${isActive('/activities/emails') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">✉</span>
            Emails
          </Link>
        </div>

        {/* Settings Section */}
        <div className="nav-section">
          <div className="nav-section-title">Settings</div>
          <NavItem
            to="/settings/users"
            icon="👥"
            label="Users"
            permission="user_management"
          />
          <NavItem
            to="/settings/roles"
            icon="🎭"
            label="Roles"
            permission="role_management"
          />
          <NavItem
            to="/settings/groups"
            icon="👪"
            label="Groups"
            permission="group_management"
          />
        </div>

        {/* Support Section */}
        <div className="nav-section">
          <div className="nav-section-title">Support</div>
          {isSaasOwner() ? (
            <Link
              to="/support-admin"
              className={`nav-item ${isActive('/support-admin') ? 'active' : ''}`}
            >
              <span className="nav-item-icon">🎫</span>
              Support Dashboard
            </Link>
          ) : (
            <Link
              to="/support"
              className={`nav-item ${isActive('/support') ? 'active' : ''}`}
            >
              <span className="nav-item-icon">🎫</span>
              My Tickets
            </Link>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div>© 2024 CRM Platform</div>
        <div style={{ marginTop: '4px', fontSize: '11px' }}>Version 1.0.0</div>
      </div>
    </div>
  );
};

export default Sidebar;