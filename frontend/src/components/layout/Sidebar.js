import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import {
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();
  const { hasPermission, isSaasOwner } = useAuth();

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
          "block px-3 py-2 text-sm rounded-md transition-all duration-200",
          active
            ? "bg-yellow-400 text-gray-900 font-semibold shadow-lg"
            : "text-white/90 hover:bg-white/10 hover:text-white"
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
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 rounded-md transition-colors"
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

  // Sidebar styles with original gradient
  const sidebarStyle = {
    background: 'linear-gradient(135deg, #5db9de 0%, #47b9e1 25%, #131d21 50%, #95b5ef 75%, #2a5298 100%)',
    backgroundSize: '400% 400%',
    animation: 'gradientShift 15s ease infinite',
  };

  return (
    <>
      {/* Gradient animation keyframes */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div
        style={sidebarStyle}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 shadow-2xl",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 bg-white border-b border-blue-300/30">
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
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {/* SAAS Owner Navigation */}
            {isSaasOwner() ? (
              <>
                {/* SAAS Dashboard */}
                <NavItem to="/saas/dashboard" label="SAAS Dashboard" />

                <div className="my-3 border-t border-white/20" />

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
                {/* Dashboard - always visible */}
                <NavItem to="/dashboard" label="Dashboard" />

                <div className="my-3 border-t border-white/20" />

                {/* Lead Management */}
                <NavSection title="Lead Management" section="leadManagement" permissions={['data_center', 'lead_management', 'contact_management', 'account_management', 'opportunity_management']}>
                  <NavItem to="/data-center" label="Customers" permission="data_center" />
                  <NavItem to="/leads" label="Leads" permission="lead_management" />
                  <NavItem to="/contacts" label="Contacts" permission="contact_management" />
                  <NavItem to="/accounts" label="Accounts" permission="account_management" />
                  <NavItem to="/opportunities" label="Opportunities" permission="opportunity_management" />
                </NavSection>

                {/* Sales & Finance */}
                <NavSection title="Sales & Finance" section="salesFinance" permissions={['rfi_management', 'quotation_management', 'purchase_order_management', 'invoice_management']}>
                  <NavItem to="/rfi" label="RFI" permission="rfi_management" />
                  <NavItem to="/quotations" label="Quotations" permission="quotation_management" />
                  <NavItem to="/purchase-orders" label="Purchase Orders" permission="purchase_order_management" />
                  <NavItem to="/invoices" label="Invoices" permission="invoice_management" />
                </NavSection>

                {/* Task Management */}
                <NavSection title="Task Management" section="taskManagement" permissions={['task_management', 'meeting_management', 'call_management', 'email_management']}>
                  <NavItem to="/tasks" label="Tasks" permission="task_management" />
                  <NavItem to="/meetings" label="Meetings" permission="meeting_management" />
                  <NavItem to="/calls" label="Calls" permission="call_management" />
                  <NavItem to="/emails" label="Email Inbox" permission="email_management" />
                </NavSection>

                {/* Product */}
                <NavSection title="Product" section="product" permissions={['product_management']}>
                  <NavItem to="/products-management" label="Product" permission="product_management" />
                  <NavItem to="/products" label="Product Marketplace" permission="product_management" />
                </NavSection>

                {/* Account Management - visible to admins only */}
                <NavSection title="Account Management" section="accountManagement" permissions={['subscription_management']}>
                  <NavItem to="/subscription" label="Subscription & Billing" permission="subscription_management" />
                </NavSection>

                {/* Access Management */}
                <NavSection title="Access Management" section="accessManagement" permissions={['user_management', 'audit_logs']}>
                  <NavItem to="/settings/team" label="Users" permission="user_management" />
                  <NavItem to="/activity-logs" label="Audit Logs" permission="audit_logs" />
                </NavSection>

                {/* Support - always visible */}
                <NavSection title="Support" section="support">
                  <NavItem to="/support" label="My Tickets" />
                </NavSection>

                {/* Customization */}
                <NavSection title="Customization" section="customization" permissions={['field_management']}>
                  <NavItem to="/admin/field-builder" label="Field Builder" permission="field_management" />
                </NavSection>
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 text-center">
          <p className="text-xs text-white/70">© 2026 Unified crm</p>
          <p className="text-xs text-white/70 mt-1">Version 1.0.0</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
