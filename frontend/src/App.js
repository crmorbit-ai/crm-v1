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

// Common components
import Loading from './components/common/Loading';

// Protected route wrapper
const ProtectedRoute = ({ children, requireSaas = false, skipProfileCheck = false }) => {
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

  if (requireSaas && !isSaasOwner()) {
    return <Navigate to="/dashboard" replace />;
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
      

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

     
      {/* 💰 SUBSCRIPTION ROUTE - NEW */}
 
      <Route path="/subscription" element={
        <ProtectedRoute>
          <Subscription />
        </ProtectedRoute>
      } />

      <Route path="/activity-logs" element={
  <ProtectedRoute>
    <ActivityLogs />
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
  <ProtectedRoute>
    <ProductCategories />
  </ProtectedRoute>
} />






{/* 📦 PRODUCT MANAGEMENT ROUTE (CRM Products) */}
<Route path="/products-management" element={
  <ProtectedRoute>
    <Products />
  </ProtectedRoute>
} />

{/* 💰 B2B WORKFLOW ROUTES (RFI → RFQ → PO → Invoice) */}

{/* RFI Routes */}
<Route path="/rfi" element={
  <ProtectedRoute>
    <RFIs />
  </ProtectedRoute>
} />
<Route path="/rfi/new" element={
  <ProtectedRoute>
    <RFIForm />
  </ProtectedRoute>
} />
<Route path="/rfi/:id" element={
  <ProtectedRoute>
    <RFIDetail />
  </ProtectedRoute>
} />
<Route path="/rfi/:id/edit" element={
  <ProtectedRoute>
    <RFIForm />
  </ProtectedRoute>
} />

{/* Quotation Routes */}
<Route path="/quotations" element={
  <ProtectedRoute>
    <Quotations />
  </ProtectedRoute>
} />
<Route path="/quotations/new" element={
  <ProtectedRoute>
    <QuotationForm />
  </ProtectedRoute>
} />
<Route path="/quotations/:id" element={
  <ProtectedRoute>
    <QuotationDetail />
  </ProtectedRoute>
} />
<Route path="/quotations/:id/edit" element={
  <ProtectedRoute>
    <QuotationForm />
  </ProtectedRoute>
} />

{/* Purchase Order Routes */}
<Route path="/purchase-orders" element={
  <ProtectedRoute>
    <PurchaseOrders />
  </ProtectedRoute>
} />
<Route path="/purchase-orders/new" element={
  <ProtectedRoute>
    <PurchaseOrderForm />
  </ProtectedRoute>
} />
<Route path="/purchase-orders/:id" element={
  <ProtectedRoute>
    <PurchaseOrderDetail />
  </ProtectedRoute>
} />
<Route path="/purchase-orders/:id/edit" element={
  <ProtectedRoute>
    <PurchaseOrderForm />
  </ProtectedRoute>
} />

{/* Invoice Routes */}
<Route path="/invoices" element={
  <ProtectedRoute>
    <Invoices />
  </ProtectedRoute>
} />
<Route path="/invoices/new" element={
  <ProtectedRoute>
    <InvoiceForm />
  </ProtectedRoute>
} />
<Route path="/invoices/:id/edit" element={
  <ProtectedRoute>
    <InvoiceForm />
  </ProtectedRoute>
} />
<Route path="/invoices/:id" element={
  <ProtectedRoute>
    <InvoiceDetail />
  </ProtectedRoute>
} />

{/* 🎫 SUPPORT TICKET ROUTES */}
<Route path="/support" element={
  <ProtectedRoute>
    <Support />
  </ProtectedRoute>
} />
<Route path="/support-admin" element={
  <ProtectedRoute requireSaas>
    <SupportAdmin />
  </ProtectedRoute>
} />

      {/* CRM Routes */}
      <Route path="/leads" element={
        <ProtectedRoute>
          <Leads />
        </ProtectedRoute>
      } />
      <Route path="/leads/:id" element={
        <ProtectedRoute>
          <LeadDetail />
        </ProtectedRoute>
      } />
      <Route path="/accounts" element={
        <ProtectedRoute>
          <Accounts />
        </ProtectedRoute>
      } />
      <Route path="/contacts" element={
        <ProtectedRoute>
          <Contacts />
        </ProtectedRoute>
      } />
      <Route path="/opportunities" element={
        <ProtectedRoute>
          <Opportunities />
        </ProtectedRoute>
      } />
      <Route path="/activities/*" element={
        <ProtectedRoute>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Activities</h2>
            <p>Coming in Phase 2...</p>
          </div>
        </ProtectedRoute>
      } />

      {/* Settings Routes (User management moved here) */}
      <Route path="/settings/users" element={
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/settings/roles" element={
        <ProtectedRoute>
          <Roles />
        </ProtectedRoute>
      } />
      <Route path="/settings/groups" element={
        <ProtectedRoute>
          <Groups />
        </ProtectedRoute>
      } />

      {/* Admin/Product Team routes */}
      <Route path="/admin/field-builder" element={
        <ProtectedRoute>
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
     

      <Route path="/accounts/:id" element={<ProtectedRoute><AccountDetail /></ProtectedRoute>} />
      <Route path="/contacts/:id" element={<ProtectedRoute><ContactDetail /></ProtectedRoute>} />

      <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
      <Route path="/calls" element={<ProtectedRoute><Calls /></ProtectedRoute>} />
      <Route path="/emails" element={<ProtectedRoute><EmailInbox /></ProtectedRoute>} />
      <Route path="/meetings/:id" element={<ProtectedRoute><MeetingDetail /></ProtectedRoute>} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="/tasks" element={
        <ProtectedRoute>
          <Tasks />
        </ProtectedRoute>
      } />

      <Route path="/saas/billings" element={
        <ProtectedRoute requireSaas>
          <Billings />
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;