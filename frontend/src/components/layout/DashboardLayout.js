import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../../lib/utils';

// Map backend feature slugs → readable names
const FEATURE_NAMES = {
  data_center: 'Customer Data',
  lead_management: 'Leads',
  contact_management: 'Contacts',
  account_management: 'Accounts',
  opportunity_management: 'Opportunities',
  quotation_management: 'Quotations',
  invoice_management: 'Invoices',
  purchase_order_management: 'Purchase Orders',
  rfi_management: 'RFI',
  product_management: 'Products',
  task_management: 'Tasks',
  meeting_management: 'Meetings',
  call_management: 'Calls',
  email_management: 'Emails',
  user_management: 'Team Members',
  role_management: 'Roles',
  group_management: 'Groups',
  field_management: 'Custom Fields',
  audit_logs: 'Audit Logs',
  subscription_management: 'Subscription & Billing',
};

// Map backend action slugs → readable verbs
const ACTION_NAMES = {
  create: 'create',
  read: 'view',
  update: 'edit',
  delete: 'delete',
  manage: 'manage',
  import: 'import',
  export: 'export',
  move_to_leads: 'move records to Leads',
  move_to_contacts: 'move records to Contacts',
  assign: 'assign',
  approve: 'approve',
  reject: 'reject',
};

const formatPermissionMessage = (raw) => {
  // Backend sends: "Permission denied: feature.action"
  const match = raw && raw.match(/Permission denied:\s*([a-z_]+)\.([a-z_]+)/i);
  if (!match) return raw; // fallback — show original if format is unexpected

  const [, feature, action] = match;
  const featureName = FEATURE_NAMES[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const actionName = ACTION_NAMES[action] || action.replace(/_/g, ' ');

  return `You don't have permission to ${actionName} in ${featureName}.`;
};

const DashboardLayout = ({ children, title, actionButton }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [permissionToast, setPermissionToast] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let timer;
    const handlePermissionDenied = (e) => {
      setPermissionToast(formatPermissionMessage(e.detail.message));
      clearTimeout(timer);
      timer = setTimeout(() => setPermissionToast(null), 5000);
    };
    window.addEventListener('app:permission-denied', handlePermissionDenied);
    return () => {
      window.removeEventListener('app:permission-denied', handlePermissionDenied);
      clearTimeout(timer);
    };
  }, []);

  const handleOverlayClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Permission Denied Toast */}
      {permissionToast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#1e293b', color: '#fff',
          padding: '14px 18px', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          maxWidth: '380px', minWidth: '260px',
          borderLeft: '4px solid #ef4444',
          animation: 'slideInRight 0.3s ease'
        }}>
          <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>🚫</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px', color: '#f87171' }}>
              Access Restricted
            </div>
            <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '5px' }}>
              {permissionToast}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Contact your admin to request access.
            </div>
          </div>
          <button
            onClick={() => setPermissionToast(null)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0', flexShrink: 0 }}
          >×</button>
        </div>
      )}
      <style>{`@keyframes slideInRight { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
          onClick={handleOverlayClick}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      <div className={cn("flex flex-col min-h-screen", !isMobile && "ml-64")}>
        <Header
          title={title}
          actionButton={actionButton}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />
        <main className="flex-1 p-4 md:p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
