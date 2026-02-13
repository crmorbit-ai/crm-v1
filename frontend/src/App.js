import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';


// Auth components
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import CompleteProfile from './pages/CompleteProfile';
import OAuthCallback from './pages/OAuthCallback';
import LandingPage from './pages/LandingPage';

// Dashboard components
import Dashboard from './pages/Dashboard';
import TenantDashboard from './pages/TenantDashboard';
import SaasDashboard from './pages/SaasDashboard';
import Tasks from './pages/Tasks';
import Meetings from './pages/Meetings';
import Calls from './pages/Calls';
import EmailInbox from './pages/EmailInbox';

// CRM pages
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Accounts from './pages/Accounts';
import Contacts from './pages/Contacts';
import Opportunities from './pages/Opportunities';
import MeetingDetail from './pages/MeetingDetail';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Profile from './pages/Profile';

// User management (Settings)
import Users from './pages/Users';
import Roles from './pages/Roles';
import Groups from './pages/Groups';

// SAAS Owner pages
import Tenants from './pages/Tenants';
import SaasAdmins from './pages/SaasAdmins';

import Billings from './pages/Billings';

import ActivityLogs from './pages/ActivityLogs';


// 💰 SUBSCRIPTION PAGES - NEW

import Subscription from './pages/Subscription';
import SaasSubscriptions from './pages/SaasSubscriptions';



import DataCenter from './pages/DataCenter';
import DataCenterDetail from './pages/DataCenterDetail';
import ProductMarketplace from './pages/ProductMarketplace';
import Products from './pages/Products';
import Support from './pages/Support';
import SupportAdmin from './pages/SupportAdmin';
import ProductCategories from './pages/ProductCategories';

// Field Customization (Product Team)
import FieldBuilder from './pages/FieldBuilder';

// Quotation & Invoice Pages
import Quotations from './pages/Quotations';
import QuotationForm from './pages/QuotationForm';
import QuotationDetail from './pages/QuotationDetail';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import InvoiceForm from './pages/InvoiceForm';

// RFI & Purchase Order Pages
import RFIs from './pages/RFIs';
import RFIForm from './pages/RFIForm';
import RFIDetail from './pages/RFIDetail';
import PurchaseOrders from './pages/PurchaseOrders';
import PurchaseOrderForm from './pages/PurchaseOrderForm';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';

// RESELLER PAGES

import ResellerRegister from './pages/ResellerRegister';
import ResellerLogin from './pages/ResellerLogin';
import ResellerDashboard from './pages/ResellerDashboard';
import ResellerManagement from './pages/ResellerManagement';


import AccountDetail from './pages/AccountDetail';
import ContactDetail from './pages/ContactDetail';
import AuditLogs from './pages/AuditLogs';

// Common components
import Loading from './components/common/Loading';

// AI Components
import AIChatWidget from './components/ai/AIChatWidget';

// Protected route wrapper
const ProtectedRoute = ({ children, requireSaas = false, requireTenant = false, skipProfileCheck = false }) => {
  const { user, loading, isSaasOwner } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check profile completion (skip for SAAS owners and specific routes)
  if (!skipProfileCheck && !isSaasOwner() && user.userType !== 'RESELLER') {
    if (!user.isProfileComplete) {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  // SAAS owners can only access SAAS routes
  if (requireSaas && !isSaasOwner()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Tenant routes are blocked for SAAS owners
  if (requireTenant && isSaasOwner()) {
    return <Navigate to="/saas/dashboard" replace />;
  }

  return children;
};

// Public route wrapper (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (user) {
    const defaultRoute = user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN'
      ? '/saas/dashboard'
      : '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes - Login & Register Pages */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* 🆕 NEW: Two-step registration routes */}
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route path="/complete-profile" element={
        <ProtectedRoute skipProfileCheck={true}>
          <CompleteProfile />
        </ProtectedRoute>
      } />

      {/* Forgot/Reset Password */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* 🚀 RESELLER PUBLIC ROUTES */}
     
      <Route path="/reseller/register" element={<ResellerRegister />} />
      <Route path="/reseller/login" element={<ResellerLogin />} />
      

      {/* 🚀 RESELLER PROTECTED ROUTES */}
      
      <Route path="/reseller/dashboard" element={<ResellerDashboard />} />
      

      {/* Protected routes - Tenant Only */}
      <Route path="/dashboard" element={
        <ProtectedRoute requireTenant>
          <Dashboard />
        </ProtectedRoute>
      } />


      {/* 💰 SUBSCRIPTION ROUTE - Tenant Only */}

      <Route path="/subscription" element={
        <ProtectedRoute requireTenant>
          <Subscription />
        </ProtectedRoute>
      } />

      <Route path="/activity-logs" element={
  <ProtectedRoute requireTenant>
    <ActivityLogs />
  </ProtectedRoute>
} />

      <Route path="/audit-logs" element={
  <ProtectedRoute requireTenant>
    <AuditLogs />
  </ProtectedRoute>
} />

      {/* 🚀 DATA CENTER ROUTES - NEW */}
<Route path="/data-center" element={
  <ProtectedRoute>
    <DataCenter />
  </ProtectedRoute>
} />
<Route path="/data-center/:id" element={
  <ProtectedRoute>
    <DataCenterDetail />
  </ProtectedRoute>
} />

{/* 📦 PRODUCT MARKETPLACE ROUTE */}
<Route path="/products" element={
  <ProtectedRoute>
    <ProductMarketplace />
  </ProtectedRoute>
} />




<Route path="/product-categories" element={
  <ProtectedRoute requireTenant>
    <ProductCategories />
  </ProtectedRoute>
} />






{/* 📦 PRODUCT MANAGEMENT ROUTE (CRM Products) - Tenant Only */}
<Route path="/products-management" element={
  <ProtectedRoute requireTenant>
    <Products />
  </ProtectedRoute>
} />

{/* 💰 B2B WORKFLOW ROUTES (RFI → RFQ → PO → Invoice) - Tenant Only */}

{/* RFI Routes */}
<Route path="/rfi" element={
  <ProtectedRoute requireTenant>
    <RFIs />
  </ProtectedRoute>
} />
<Route path="/rfi/new" element={
  <ProtectedRoute requireTenant>
    <RFIForm />
  </ProtectedRoute>
} />
<Route path="/rfi/:id" element={
  <ProtectedRoute requireTenant>
    <RFIDetail />
  </ProtectedRoute>
} />
<Route path="/rfi/:id/edit" element={
  <ProtectedRoute requireTenant>
    <RFIForm />
  </ProtectedRoute>
} />

{/* Quotation Routes */}
<Route path="/quotations" element={
  <ProtectedRoute requireTenant>
    <Quotations />
  </ProtectedRoute>
} />
<Route path="/quotations/new" element={
  <ProtectedRoute requireTenant>
    <QuotationForm />
  </ProtectedRoute>
} />
<Route path="/quotations/:id" element={
  <ProtectedRoute requireTenant>
    <QuotationDetail />
  </ProtectedRoute>
} />
<Route path="/quotations/:id/edit" element={
  <ProtectedRoute requireTenant>
    <QuotationForm />
  </ProtectedRoute>
} />

{/* Purchase Order Routes */}
<Route path="/purchase-orders" element={
  <ProtectedRoute requireTenant>
    <PurchaseOrders />
  </ProtectedRoute>
} />
<Route path="/purchase-orders/new" element={
  <ProtectedRoute requireTenant>
    <PurchaseOrderForm />
  </ProtectedRoute>
} />
<Route path="/purchase-orders/:id" element={
  <ProtectedRoute requireTenant>
    <PurchaseOrderDetail />
  </ProtectedRoute>
} />
<Route path="/purchase-orders/:id/edit" element={
  <ProtectedRoute requireTenant>
    <PurchaseOrderForm />
  </ProtectedRoute>
} />

{/* Invoice Routes */}
<Route path="/invoices" element={
  <ProtectedRoute requireTenant>
    <Invoices />
  </ProtectedRoute>
} />
<Route path="/invoices/new" element={
  <ProtectedRoute requireTenant>
    <InvoiceForm />
  </ProtectedRoute>
} />
<Route path="/invoices/:id/edit" element={
  <ProtectedRoute requireTenant>
    <InvoiceForm />
  </ProtectedRoute>
} />
<Route path="/invoices/:id" element={
  <ProtectedRoute requireTenant>
    <InvoiceDetail />
  </ProtectedRoute>
} />

{/* 🎫 SUPPORT TICKET ROUTES */}
<Route path="/support" element={
  <ProtectedRoute requireTenant>
    <Support />
  </ProtectedRoute>
} />
<Route path="/support-admin" element={
  <ProtectedRoute requireSaas>
    <SupportAdmin />
  </ProtectedRoute>
} />

      {/* CRM Routes - Tenant Only */}
      <Route path="/leads" element={
        <ProtectedRoute requireTenant>
          <Leads />
        </ProtectedRoute>
      } />
      <Route path="/leads/:id" element={
        <ProtectedRoute requireTenant>
          <LeadDetail />
        </ProtectedRoute>
      } />
      <Route path="/accounts" element={
        <ProtectedRoute requireTenant>
          <Accounts />
        </ProtectedRoute>
      } />
      <Route path="/contacts" element={
        <ProtectedRoute requireTenant>
          <Contacts />
        </ProtectedRoute>
      } />
      <Route path="/opportunities" element={
        <ProtectedRoute requireTenant>
          <Opportunities />
        </ProtectedRoute>
      } />
      <Route path="/activities/*" element={
        <ProtectedRoute requireTenant>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Activities</h2>
            <p>Coming in Phase 2...</p>
          </div>
        </ProtectedRoute>
      } />

      {/* Settings Routes - Tenant Only */}
      <Route path="/settings/users" element={
        <ProtectedRoute requireTenant>
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/settings/roles" element={
        <ProtectedRoute requireTenant>
          <Roles />
        </ProtectedRoute>
      } />
      <Route path="/settings/groups" element={
        <ProtectedRoute requireTenant>
          <Groups />
        </ProtectedRoute>
      } />

      {/* Admin/Product Team routes - Tenant Only */}
      <Route path="/admin/field-builder" element={
        <ProtectedRoute requireTenant>
          <FieldBuilder />
        </ProtectedRoute>
      } />

      {/* SAAS Owner routes */}
      <Route path="/saas/dashboard" element={
        <ProtectedRoute requireSaas>
          <SaasDashboard />
        </ProtectedRoute>
      } />
      <Route path="/saas/tenants" element={
        <ProtectedRoute requireSaas>
          <Tenants />
        </ProtectedRoute>
      } />

     
      {/* 💰 SAAS SUBSCRIPTIONS - NEW */}
     
      <Route path="/saas/subscriptions" element={
        <ProtectedRoute requireSaas>
          <SaasSubscriptions />
        </ProtectedRoute>
      } />
      

     
      {/* 🚀 RESELLER MANAGEMENT (SAAS ADMIN) */}
     
      <Route path="/saas/resellers" element={
        <ProtectedRoute requireSaas>
          <ResellerManagement />
        </ProtectedRoute>
      } />
     

      <Route path="/accounts/:id" element={<ProtectedRoute requireTenant><AccountDetail /></ProtectedRoute>} />
      <Route path="/contacts/:id" element={<ProtectedRoute requireTenant><ContactDetail /></ProtectedRoute>} />

      <Route path="/meetings" element={<ProtectedRoute requireTenant><Meetings /></ProtectedRoute>} />
      <Route path="/calls" element={<ProtectedRoute requireTenant><Calls /></ProtectedRoute>} />
      <Route path="/emails" element={<ProtectedRoute requireTenant><EmailInbox /></ProtectedRoute>} />
      <Route path="/meetings/:id" element={<ProtectedRoute requireTenant><MeetingDetail /></ProtectedRoute>} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="/tasks" element={
        <ProtectedRoute requireTenant>
          <Tasks />
        </ProtectedRoute>
      } />

      <Route path="/saas/billings" element={
        <ProtectedRoute requireSaas>
          <Billings />
        </ProtectedRoute>
      } />

      <Route path="/saas/admins" element={
        <ProtectedRoute requireSaas>
          <SaasAdmins />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={
        user ? (
          <Navigate to={
            user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN'
              ? '/saas/dashboard'
              : '/dashboard'
          } replace />
        ) : (
          <LandingPage />
        )
      } />

      {/* 404 */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

// AI Chat Wrapper - only show for logged in tenant users
const AIChat = () => {
  const { user } = useAuth();

  // Show AI chat for logged in users (except SAAS owners)
  if (!user || user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN') {
    return null;
  }

  return <AIChatWidget />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="App">
            <AppRoutes />
            <AIChat />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;