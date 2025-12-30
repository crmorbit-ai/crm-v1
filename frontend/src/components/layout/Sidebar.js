import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/crm.css';

const Sidebar = () => {
  const location = useLocation();
  const { hasPermission, isSaasOwner } = useAuth();

  // State for managing dropdown sections with localStorage persistence
  const [openSections, setOpenSections] = useState(() => {
    const saved = localStorage.getItem('sidebarOpenSections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          taskManagement: false,
          roleManagement: false,
          leadManagement: false,
          salesManagement: false,
          salesFinance: false,
          product: false,
          accountManagement: false,
          support: false,
          customization: false
        };
      }
    }
    return {
      taskManagement: false,
      roleManagement: false,
      leadManagement: false,
      salesManagement: false,
      salesFinance: false,
      product: false,
      accountManagement: false,
      support: false,
      customization: false
    };
  });

  const toggleSection = (section) => {
    setOpenSections(prev => {
      const newState = {
        ...prev,
        [section]: !prev[section]
      };
      // Save to localStorage
      localStorage.setItem('sidebarOpenSections', JSON.stringify(newState));
      return newState;
    });
  };

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
            {label}
          </div>
          <span className="crm-tooltip-text">You don't have access</span>
        </div>
      );
    }

    return (
      <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
        {label}
      </Link>
    );
  };

  return (
    <div className="crm-sidebar">
      <div className="sidebar-logo">
        <h2>🚀 UFS CRM</h2>
      </div>

      <nav className="sidebar-nav">
        {/* 1. Dashboard - Single Item */}
        <Link
          to="/dashboard"
          className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
        >
          Dashboard
        </Link>

        {/* 2. Sales Management - Dropdown */}
        <div
          className="nav-section-title clickable"
          onClick={() => toggleSection('salesManagement')}
          style={{ cursor: 'pointer', userSelect: 'none', padding: '10px 16px', marginTop: '4px' }}
        >
          <span>Sales Management</span>
          <span style={{ float: 'right' }}>{openSections.salesManagement ? '▼' : '▶'}</span>
        </div>
        {openSections.salesManagement && (
          <>
            <Link
              to="/data-center"
              className={`nav-item ${isActive('/data-center') ? 'active' : ''}`}
            >
              Sales
            </Link>
          </>
        )}

        {/* 3. Lead Management - Dropdown */}
        <div
          className="nav-section-title clickable"
          onClick={() => toggleSection('leadManagement')}
          style={{ cursor: 'pointer', userSelect: 'none', padding: '10px 16px', marginTop: '4px' }}
        >
          <span>Lead Management</span>
          <span style={{ float: 'right' }}>{openSections.leadManagement ? '▼' : '▶'}</span>
        </div>
        {openSections.leadManagement && (
          <>
            <NavItem
              to="/leads"
              icon="📋"
              label="Leads"
              permission="lead_management"
            />
            <NavItem
              to="/contacts"
              icon="👤"
              label="Contacts"
              permission="contact_management"
            />
            <NavItem
              to="/accounts"
              icon="🏢"
              label="Accounts"
              permission="account_management"
            />
            <NavItem
              to="/opportunities"
              icon="💰"
              label="Opportunities"
              permission="opportunity_management"
            />
          </>
        )}

        {/* 4. Sales & Finance - Dropdown */}
        <div
          className="nav-section-title clickable"
          onClick={() => toggleSection('salesFinance')}
          style={{ cursor: 'pointer', userSelect: 'none', padding: '10px 16px', marginTop: '4px' }}
        >
          <span>Sales & Finance</span>
          <span style={{ float: 'right' }}>{openSections.salesFinance ? '▼' : '▶'}</span>
        </div>
        {openSections.salesFinance && (
          <>
            <Link
              to="/rfi"
              className={`nav-item ${isActive('/rfi') ? 'active' : ''}`}
            >
              RFI
            </Link>
            <Link
              to="/quotations"
              className={`nav-item ${isActive('/quotations') ? 'active' : ''}`}
            >
              Quotations
            </Link>
            <Link
              to="/purchase-orders"
              className={`nav-item ${isActive('/purchase-orders') ? 'active' : ''}`}
            >
              Purchase Orders
            </Link>
            <Link
              to="/invoices"
              className={`nav-item ${isActive('/invoices') ? 'active' : ''}`}
            >
              Invoices
            </Link>
          </>
        )}

        {/* 5. Task Management - Dropdown */}
        <div
          className="nav-section-title clickable"
          onClick={() => toggleSection('taskManagement')}
          style={{ cursor: 'pointer', userSelect: 'none', padding: '10px 16px', marginTop: '4px' }}
        >
          <span>Task Management</span>
          <span style={{ float: 'right' }}>{openSections.taskManagement ? '▼' : '▶'}</span>
        </div>
        {openSections.taskManagement && (
          <>
            <Link
              to="/tasks"
              className={`nav-item ${isActive('/tasks') ? 'active' : ''}`}
            >
              Tasks
            </Link>
            <Link
              to="/meetings"
              className={`nav-item ${isActive('/meetings') ? 'active' : ''}`}
            >
              Meetings
            </Link>
            <Link
              to="/calls"
              className={`nav-item ${isActive('/calls') ? 'active' : ''}`}
            >
              Calls
            </Link>
            <Link
              to="/emails"
              className={`nav-item ${isActive('/emails') ? 'active' : ''}`}
            >
              Email Inbox
            </Link>
          </>
        )}

        {/* 6. Product - Dropdown */}
        <div
          className="nav-section-title clickable"
          onClick={() => toggleSection('product')}
          style={{ cursor: 'pointer', userSelect: 'none', padding: '10px 16px', marginTop: '4px' }}
        >
          <span>Product</span>
          <span style={{ float: 'right' }}>{openSections.product ? '▼' : '▶'}</span>
        </div>
        {openSections.product && (
          <>
            <NavItem
              to="/products-management"
              icon="📦"
              label="Product"
              permission="product_management"
            />
            <Link
              to="/products"
              className={`nav-item ${isActive('/products') ? 'active' : ''}`}
            >
              Product Marketplace
            </Link>
          </>
        )}

        {/* 7. Account Management - Dropdown */}
        <div
          className="nav-section-title clickable"
          onClick={() => toggleSection('accountManagement')}
          style={{ cursor: 'pointer', userSelect: 'none', padding: '10px 16px', marginTop: '4px' }}
        >
          <span>Account Management</span>
          <span style={{ float: 'right' }}>{openSections.accountManagement ? '▼' : '▶'}</span>
        </div>
        {openSections.accountManagement && (
          <>
            <Link
              to="/subscription"
              className={`nav-item ${isActive('/subscription') ? 'active' : ''}`}
            >
              Subscription & Billing
            </Link>
          </>
        )}

        {/* 8. Role Management - Dropdown */}
        <div
          className="nav-section-title clickable"
          onClick={() => toggleSection('roleManagement')}
          style={{ cursor: 'pointer', userSelect: 'none', padding: '10px 16px', marginTop: '4px' }}
        >
          <span>Role Management</span>
          <span style={{ float: 'right' }}>{openSections.roleManagement ? '▼' : '▶'}</span>
        </div>
        {openSections.roleManagement && (
          <>
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
            <Link
              to="/activity-logs"
              className={`nav-item ${isActive('/activity-logs') ? 'active' : ''}`}
            >
              Audit Logs
            </Link>
          </>
        )}

        {/* 9. Support - Dropdown */}
        <div
          className="nav-section-title clickable"
          onClick={() => toggleSection('support')}
          style={{ cursor: 'pointer', userSelect: 'none', padding: '10px 16px', marginTop: '4px' }}
        >
          <span>Support</span>
          <span style={{ float: 'right' }}>{openSections.support ? '▼' : '▶'}</span>
        </div>
        {openSections.support && (
          <>
            {isSaasOwner() ? (
              <Link
                to="/support-admin"
                className={`nav-item ${isActive('/support-admin') ? 'active' : ''}`}
              >
                Support Dashboard
              </Link>
            ) : (
              <Link
                to="/support"
                className={`nav-item ${isActive('/support') ? 'active' : ''}`}
              >
                My Tickets
              </Link>
            )}
          </>
        )}

        {/* 10. Customization - Dropdown */}
        <div
          className="nav-section-title clickable"
          onClick={() => toggleSection('customization')}
          style={{ cursor: 'pointer', userSelect: 'none', padding: '10px 16px', marginTop: '4px' }}
        >
          <span>Customization</span>
          <span style={{ float: 'right' }}>{openSections.customization ? '▼' : '▶'}</span>
        </div>
        {openSections.customization && (
          <>
            <NavItem
              to="/admin/field-builder"
              icon="🎨"
              label="Field Builder"
              permission="field_management"
            />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div>© 2024 CRM Platform</div>
        <div style={{ marginTop: '4px', fontSize: '11px' }}>Version 1.0.0</div>
      </div>
    </div>
  );
};

export default Sidebar;