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

  const NavItem = ({ to, label, permission }) => {
    const hasAccess = permission ? hasPermission(permission, 'read') : true;
    const active = isActive(to);

    if (!hasAccess) {
      return (
        <div className="px-3 py-2 text-sm text-white/100 cursor-not-allowed">
          {label}
        </div>
      );
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

  const NavSection = ({ title, section, children }) => (
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
                {/* Dashboard */}
                <NavItem to="/dashboard" label="Dashboard" />

                <div className="my-3 border-t border-white/20" />

                {/* Lead Management */}
                <NavSection title="Lead Management" section="leadManagement">
                  <NavItem to="/data-center" label="Customers" />
                  <NavItem to="/leads" label="Leads" permission="lead_management" />
                  <NavItem to="/contacts" label="Contacts" permission="contact_management" />
                  <NavItem to="/accounts" label="Accounts" permission="account_management" />
                  <NavItem to="/opportunities" label="Opportunities" permission="opportunity_management" />
                </NavSection>

                {/* Sales & Finance */}
                <NavSection title="Sales & Finance" section="salesFinance">
                  <NavItem to="/rfi" label="RFI" />
                  <NavItem to="/quotations" label="Quotations" />
                  <NavItem to="/purchase-orders" label="Purchase Orders" />
                  <NavItem to="/invoices" label="Invoices" />
                </NavSection>

                {/* Task Management */}
                <NavSection title="Task Management" section="taskManagement">
                  <NavItem to="/tasks" label="Tasks" />
                  <NavItem to="/meetings" label="Meetings" />
                  <NavItem to="/calls" label="Calls" />
                  <NavItem to="/emails" label="Email Inbox" />
                </NavSection>

                {/* Product */}
                <NavSection title="Product" section="product">
                  <NavItem to="/products-management" label="Product" permission="product_management" />
                  <NavItem to="/products" label="Product Marketplace" />
                </NavSection>

                {/* Account Management */}
                <NavSection title="Account Management" section="accountManagement">
                  <NavItem to="/subscription" label="Subscription & Billing" />
                </NavSection>

                {/* Role Management */}
                <NavSection title="Role Management" section="roleManagement">
                  <NavItem to="/settings/users" label="Users" permission="user_management" />
                  <NavItem to="/settings/roles" label="Roles" permission="role_management" />
                  <NavItem to="/settings/groups" label="Groups" permission="group_management" />
                  <NavItem to="/activity-logs" label="Audit Logs" />
                </NavSection>

                {/* Support */}
                <NavSection title="Support" section="support">
                  <NavItem to="/support" label="My Tickets" />
                </NavSection>

                {/* Customization */}
                <NavSection title="Customization" section="customization">
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
