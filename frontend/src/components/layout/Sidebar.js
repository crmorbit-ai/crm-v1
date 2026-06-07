import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tenantCheckAccess } from '../../services/monetizationService';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, isMobile, isDesktopOpen }) => {
  const location = useLocation();
  const { hasPermission, isSaasOwner, user } = useAuth();
  const [hasMonetization, setHasMonetization] = useState(false);
  const isTenantAdmin = ['TENANT_ADMIN', 'TENANT_MANAGER'].includes(user?.userType);
  const scrollRef = useRef(null);

  // BUG-87: Save scroll position before route changes
  const getViewport = () => {
    if (!scrollRef.current) return null;
    return scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      || scrollRef.current.querySelector('[style*="overflow"]')
      || scrollRef.current;
  };

  // Save scroll on every scroll event
  const handleScrollSave = () => {
    const el = getViewport();
    if (el) sessionStorage.setItem('sidebar-scroll', String(el.scrollTop));
  };

  // Restore scroll BEFORE browser paints — no flicker
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem('sidebar-scroll');
    if (!saved) return;
    const el = getViewport();
    if (el) el.scrollTop = parseInt(saved, 10);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSaasOwner()) {
      tenantCheckAccess().then(d => setHasMonetization(!!d?.hasAccess)).catch(() => {});
    }
  }, []);

  const [openSections, setOpenSections] = useState(() => {
    const saved = localStorage.getItem('sidebarOpenSections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const toggleSection = (section) => {
    setOpenSections(prev => {
      const newState = { ...prev, [section]: !prev[section] };
      localStorage.setItem('sidebarOpenSections', JSON.stringify(newState));
      return newState;
    });
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Check if user has permission - hide item completely if no access
  const NavItem = ({ to, label, permission }) => {
    const hasAccess = permission ? hasPermission(permission, 'read') : true;
    const active = isActive(to);

    // Hide completely if no permission
    if (!hasAccess) {
      return null;
    }

    return (
      <Link
        to={to}
        onClick={handleNavClick}
        className={cn(
          "block px-3 py-2 text-sm rounded-md",
          active ? "sidebar-nav-item-active" : "sidebar-nav-item"
        )}
      >
        {label}
      </Link>
    );
  };

  // Check if any child has permission - hide section if all children are hidden
  const NavSection = ({ title, section, children, permissions = [] }) => {
    // If permissions array is provided, check if user has ANY of them
    const hasAnyPermission = permissions.length === 0 || permissions.some(p => hasPermission(p, 'read'));

    if (!hasAnyPermission) {
      return null;
    }

    // Filter out null children (items without permission)
    const validChildren = React.Children.toArray(children).filter(child => child !== null);

    // Hide section if no valid children
    if (validChildren.length === 0) {
      return null;
    }

    return (
      <div className="mb-1">
        <button
          onClick={() => toggleSection(section)}
          className="sidebar-section-btn flex items-center justify-between w-full px-3 py-1.5 rounded-md"
        >
          <span>{title}</span>
          {openSections[section] ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {openSections[section] && (
          <div className="ml-2 mt-1 space-y-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Sidebar styles — screenshot teal with movement
  const sidebarStyle = {
    background: 'linear-gradient(135deg, #1e3045, #1a4a42, #1d3d55, #153d35, #1e3a4a, #163832, #1e3045)',
    backgroundSize: '400% 400%',
    animation: 'sidebarFlow 8s ease infinite',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
  };

  return (
    <>
      <style>{`
        @keyframes sidebarFlow {
          0%   { background-position: 0% 50%; }
          25%  { background-position: 100% 0%; }
          50%  { background-position: 100% 100%; }
          75%  { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        .sidebar-nav-item-active {
          background: rgba(255,255,255,0.15);
          color: #ffffff !important;
          font-weight: 600;
          border-left: 3px solid #7dd3fc;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .sidebar-nav-item {
          color: #ffffff !important;
          border-left: 3px solid transparent;
          transition: all 0.18s ease;
        }
        .sidebar-nav-item:hover {
          background: rgba(255,255,255,0.12);
          color: #ffffff !important;
          border-left: 3px solid rgba(255,255,255,0.7);
        }
        .sidebar-section-btn {
          color: #ffffff !important;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          transition: all 0.15s ease;
        }
        .sidebar-section-btn:hover {
          color: #ffffff !important;
          background: rgba(255,255,255,0.08);
        }
        .sidebar-section-btn svg { color: #ffffff !important; }
        .sidebar-divider { border-color: rgba(255,255,255,0.1); }
      `}</style>

      <div
        className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col shadow-2xl"
        style={{
          ...sidebarStyle,
          transform: isMobile
            ? (isOpen ? 'translateX(0)' : 'translateX(-100%)')
            : (isDesktopOpen ? 'translateX(0)' : 'translateX(-100%)'),
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 bg-white border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <img
            src="/logo.png"
            alt="CRM"
            className="h-10 w-auto object-contain"
          />
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-700">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4" onScroll={handleScrollSave} style={{overflowY:'auto'}}>
          <nav className="space-y-1">
            {/* SAAS Owner Navigation */}
            {isSaasOwner() ? (
              <>
                {/* SAAS Dashboard */}
                <NavItem to="/saas/dashboard" label="SAAS Dashboard" />

                <div className="my-3 border-t sidebar-divider" />

                {/* Tenant Management */}
                <NavSection title="Tenant Management" section="tenantManagement">
                  <NavItem to="/saas/tenants" label="All Tenants" />
                  <NavItem to="/saas/subscriptions" label="Subscriptions" />
                  <NavItem to="/saas/billings" label="Billings" />
                </NavSection>

                {/* Reseller Management */}
                <NavSection title="Reseller Management" section="resellerManagement">
                  <NavItem to="/saas/resellers" label="Resellers" />
                </NavSection>

                {/* Support */}
                <NavSection title="Support" section="support">
                  <NavItem to="/support-admin" label="Support Dashboard" />
                </NavSection>

                {/* Data Center */}
                <NavSection title="Data Center" section="dataCenter">
                  <NavItem to="/data-center" label="Global Data" />
                </NavSection>
              </>
            ) : (
              <>
                {/* Tenant User Navigation */}
                {/* Dashboard - only show if user has at least one permission */}
                {(hasPermission('lead_management', 'read') ||
                  hasPermission('contact_management', 'read') ||
                  hasPermission('account_management', 'read') ||
                  hasPermission('task_management', 'read') ||
                  hasPermission('product_management', 'read') ||
                  hasPermission('user_management', 'read')) && (
                  <NavItem to="/dashboard" label="Dashboard" />
                )}

                <div className="my-3 border-t sidebar-divider" />

                {/* Sales */}
                <NavSection title="Sales" section="sales" permissions={['data_center']}>
                  <NavItem to="/data-center" label="Customers" permission="data_center" />
                </NavSection>

                {/* Lead Management */}
                <NavSection title="Lead Management" section="leadManagement" permissions={['lead_management', 'contact_management', 'account_management', 'opportunity_management']}>
                  <NavItem to="/leads" label="Leads" permission="lead_management" />
                  <NavItem to="/contacts" label="Contacts" permission="contact_management" />
                  <NavItem to="/accounts" label="Account" permission="account_management" />
                  <NavItem to="/opportunities" label="Opportunities" permission="opportunity_management" />
                </NavSection>

                {/* Task Management */}
                <NavSection title="Task Management" section="taskManagement" permissions={['task_management', 'meeting_management', 'call_management', 'email_management']}>
                  <NavItem to="/tasks" label="Tasks" permission="task_management" />
                  <NavItem to="/meetings" label="Meetings" permission="meeting_management" />
                  <NavItem to="/calls" label="Calls" permission="call_management" />
                  <NavItem to="/emails" label="Email Inbox" permission="email_management" />
                </NavSection>

                {/* Sales & Finance */}
                <NavSection title="Sales & Finance" section="salesFinance" permissions={['rfi_management', 'quotation_management', 'purchase_order_management', 'invoice_management']}>
                  <NavItem to="/rfi" label="RFI" permission="rfi_management" />
                  <NavItem to="/quotations" label="Quotations" permission="quotation_management" />
                  <NavItem to="/purchase-orders" label="Purchase Orders" permission="purchase_order_management" />
                  <NavItem to="/invoices" label="Invoices" permission="invoice_management" />
                </NavSection>

                {/* Product */}
                <NavSection title="Product" section="product" permissions={['product_management']}>
                  <NavItem to="/products-management" label="Product" permission="product_management" />
                  <NavItem to="/inventory" label="Inventory" permission="product_management" />
                  <NavItem to="/products" label="Product Marketplace" permission="product_management" />
                </NavSection>

                {/* Account Management - visible to admins only */}
                <NavSection title="Account Management" section="accountManagement" permissions={['subscription_management']}>
                  <NavItem to="/subscription" label="Subscription & Billing" permission="subscription_management" />
                </NavSection>

                {/* Automation */}
                <NavSection title="Automation" section="automation" permissions={['user_management', 'templates', 'document_templates', 'email_templates', 'social_media']}>
                  <NavItem to="/templates" label="Templates" permission="templates" />
                  <NavItem to="/document-templates" label="Document Templates" permission="document_templates" />
                  <NavItem to="/email-templates" label="Email Templates" permission="email_templates" />
                  <NavItem to="/social-media" label="Social Media" permission="social_media" />
                </NavSection>

                <div className="my-3 border-t sidebar-divider" />

                {/* Access Management */}
                <NavSection title="Access Management" section="accessManagement" permissions={['user_management', 'audit_logs', 'role_template', 'org_chart', 'org_hierarchy']}>
                  <NavItem to="/users" label="Users" permission="user_management" />
                  <NavItem to="/org-chart" label="Org Chart" permission="org_chart" />
                  <NavItem to="/org-hierarchy" label="Org Hierarchy" permission="org_hierarchy" />
                  <NavItem to="/role-template" label="Role Template" permission="role_template" />
                  <NavItem to="/activity-logs" label="Audit Logs" permission="audit_logs" />
                </NavSection>

                {/* Notifications - only for users with management permissions */}
                {(hasPermission('user_management', 'read') ||
                  hasPermission('lead_management', 'read') ||
                  hasPermission('task_management', 'read')) && (
                  <NavSection title="Notifications" section="notifications">
                    <NavItem to="/notifications" label="Notifications" />
                    <NavItem to="/notification-settings" label="Notification Settings" />
                  </NavSection>
                )}

                {/* Sales Monetization — only if plan has feature */}
                {hasMonetization && (
                  <NavSection title="Monetization" section="monetization">
                    <NavItem to="/monetization" label="Sales Dashboard" />
                  </NavSection>
                )}

                {/* Support - only for users with management permissions or tenant admin */}
                {(isTenantAdmin ||
                  hasPermission('user_management', 'read') ||
                  hasPermission('lead_management', 'read') ||
                  hasPermission('task_management', 'read')) && (
                  <NavSection title="Support" section="support">
                    <NavItem to="/support" label="My Tickets" />
                    <NavItem to="/feedback" label={isTenantAdmin ? "Feedback Inbox" : "Feedback"} />
                  </NavSection>
                )}

              </>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)' }}>
          <p className="text-xs" style={{ color: '#ffffff' }}>© 2026 Unified CRM</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Version 1.0.0</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
