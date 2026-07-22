import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Loading from './components/common/Loading';

// ── Eager imports (all main pages — no flash) ─────────────
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import CompleteProfile from './pages/CompleteProfile';
import OAuthCallback from './pages/OAuthCallback';
import LandingPage from './pages/LandingPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import SaasDashboard from './pages/SaasDashboard';
import TenantDashboard from './pages/TenantDashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import Opportunities from './pages/Opportunities';
// Lazy loaded pages (code splitting for better performance)
const DataCenter = lazy(() => import('./pages/DataCenter'));
const DataCenterDetail = lazy(() => import('./pages/DataCenterDetail'));
const MasterInventory = lazy(() => import('./pages/MasterInventory'));
const ProductInventory = lazy(() => import('./pages/ProductInventory'));
const ServiceInventory = lazy(() => import('./pages/ServiceInventory'));
const LeadInventory = lazy(() => import('./pages/LeadInventory'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Meetings = lazy(() => import('./pages/Meetings'));
const MeetingDetail = lazy(() => import('./pages/MeetingDetail'));
const Calls = lazy(() => import('./pages/Calls'));
const EmailInbox = lazy(() => import('./pages/EmailInbox'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const OrgChart = lazy(() => import('./pages/OrgChart'));
const OrgHierarchy = lazy(() => import('./pages/OrgHierarchy'));
const RoleTemplateBuilder = lazy(() => import('./pages/RoleTemplateBuilder'));
const TemplateManagement = lazy(() => import('./pages/TemplateManagement'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const DocumentTemplates = lazy(() => import('./pages/DocumentTemplates'));
const SocialMedia = lazy(() => import('./pages/SocialMedia'));
const Proposals = lazy(() => import('./pages/Proposals'));
const ProposalForm = lazy(() => import('./pages/ProposalForm'));
const ProposalDetail = lazy(() => import('./pages/ProposalDetail'));
const Quotations = lazy(() => import('./pages/Quotations'));
const QuotationForm = lazy(() => import('./pages/QuotationForm'));
const QuotationDetail = lazy(() => import('./pages/QuotationDetail'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Inventory = lazy(() => import('./pages/Inventory'));
const RFIs = lazy(() => import('./pages/RFIs'));
const RFIForm = lazy(() => import('./pages/RFIForm'));
const RFIDetail = lazy(() => import('./pages/RFIDetail'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const PurchaseOrderForm = lazy(() => import('./pages/PurchaseOrderForm'));
const PurchaseOrderDetail = lazy(() => import('./pages/PurchaseOrderDetail'));
const Products = lazy(() => import('./pages/Products'));
const ProductMarketplace = lazy(() => import('./pages/ProductMarketplace'));
const ProductCategories = lazy(() => import('./pages/ProductCategories'));
const Subscription = lazy(() => import('./pages/Subscription'));
const Monetization = lazy(() => import('./pages/Monetization'));
const TenantMonetization = lazy(() => import('./pages/TenantMonetization'));
const Billings = lazy(() => import('./pages/Billings'));
const CouponManagement = lazy(() => import('./pages/CouponManagement'));
const Support = lazy(() => import('./pages/Support'));
const SupportAdmin = lazy(() => import('./pages/SupportAdmin'));
const Feedback = lazy(() => import('./pages/Feedback'));
const SaasSubscriptions = lazy(() => import('./pages/SaasSubscriptions'));
const SaasPlans = lazy(() => import('./pages/SaasPlans'));
const SaasRefunds = lazy(() => import('./pages/SaasRefunds'));
const SaasAdmins = lazy(() => import('./pages/SaasAdmins'));
const SaasNotifications = lazy(() => import('./pages/SaasNotifications'));
const SaasContactInquiries = lazy(() => import('./pages/SaasContactInquiries'));
const Tenants = lazy(() => import('./pages/Tenants'));
const SaasTenantUsers = lazy(() => import('./pages/SaasTenantUsers'));
const TenantActivity = lazy(() => import('./pages/TenantActivity'));
const SaasActivityMonitor = lazy(() => import('./pages/SaasActivityMonitor'));
const ResellerManagement = lazy(() => import('./pages/ResellerManagement'));
const SaasCaseStudies = lazy(() => import('./pages/SaasCaseStudies'));
const PublicCaseStudies = lazy(() => import('./pages/PublicCaseStudies'));
const CaseStudyDetail = lazy(() => import('./pages/CaseStudyDetail'));
const MyCaseStudyTasks = lazy(() => import('./pages/MyCaseStudyTasks'));
const ResellerRegister = lazy(() => import('./pages/ResellerRegister'));
const ResellerLogin = lazy(() => import('./pages/ResellerLogin'));
const ResellerDashboard = lazy(() => import('./pages/ResellerDashboard'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const AllProductsPage = lazy(() => import('./pages/AllProductsPage'));
const PlatformPage = lazy(() => import('./pages/PlatformPage'));
const FeatureDetailPage = lazy(() => import('./pages/FeatureDetailPage'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Security = lazy(() => import('./pages/Security'));
const Integrations = lazy(() => import('./pages/Integrations'));
const PartnerResources = lazy(() => import('./pages/PartnerResources'));
const IndustriesPage = lazy(() => import('./pages/IndustriesPage'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const DemoLibraryPage = lazy(() => import('./pages/DemoLibraryPage'));
const DataCenterPage = lazy(() => import('./pages/DataCenterPage'));
const PartnersPage = lazy(() => import('./pages/PartnersPage'));
const AIChatWidget = lazy(() => import('./components/ai/AIChatWidget'));

// ── Only lazy-load the truly heavy page (react-email-editor ~1.5MB) ──
const EmailTemplates = lazy(() => import('./pages/EmailTemplates'));

// ── Route guards ──────────────────────────────────────────
const ProtectedRoute = ({ children, requireSaas = false, requireTenant = false, skipProfileCheck = false, allowManager = false }) => {
  const { user, loading, isSaasOwner } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  if (!skipProfileCheck && !isSaasOwner() && user.userType !== 'RESELLER') {
    if (!user.isProfileComplete) return <Navigate to="/complete-profile" replace />;
  }
  if (requireSaas && !isSaasOwner()) return <Navigate to="/dashboard" replace />;
  if (requireTenant && isSaasOwner()) return <Navigate to="/saas/dashboard" replace />;
  if (user.userType === 'SAAS_ADMIN' && user.saasRole === 'Manager' && !allowManager) {
    return <Navigate to="/saas/dashboard" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) {
    const defaultRoute = user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN'
      ? '/saas/dashboard' : '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }
  return children;
};

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public auth */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/complete-profile" element={<ProtectedRoute skipProfileCheck><CompleteProfile /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Public Case Studies */}
        <Route path="/case-studies" element={<PublicCaseStudies />} />
        <Route path="/case-study/:slug" element={<CaseStudyDetail />} />

        {/* Reseller */}
        <Route path="/reseller/register" element={<ResellerRegister />} />
        <Route path="/reseller/login" element={<ResellerLogin />} />
        <Route path="/reseller/dashboard" element={<ResellerDashboard />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute requireTenant><Dashboard /></ProtectedRoute>} />

        {/* CRM Core */}
        <Route path="/leads" element={<ProtectedRoute requireTenant><Leads /></ProtectedRoute>} />
        <Route path="/leads/:id" element={<ProtectedRoute requireTenant><LeadDetail /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute requireTenant><Contacts /></ProtectedRoute>} />
        <Route path="/contacts/:id" element={<ProtectedRoute requireTenant><ContactDetail /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute requireTenant><Accounts /></ProtectedRoute>} />
        <Route path="/accounts/:id" element={<ProtectedRoute requireTenant><AccountDetail /></ProtectedRoute>} />
        <Route path="/opportunities" element={<ProtectedRoute requireTenant><Opportunities /></ProtectedRoute>} />
        <Route path="/data-center" element={<ProtectedRoute><DataCenter /></ProtectedRoute>} />
        <Route path="/data-center/:id" element={<ProtectedRoute><DataCenterDetail /></ProtectedRoute>} />

        {/* Inventory Routes */}
        <Route path="/inventory/master" element={<ProtectedRoute><MasterInventory /></ProtectedRoute>} />
        <Route path="/inventory/products" element={<ProtectedRoute><ProductInventory /></ProtectedRoute>} />
        <Route path="/inventory/services" element={<ProtectedRoute><ServiceInventory /></ProtectedRoute>} />
        <Route path="/inventory/leads" element={<ProtectedRoute><LeadInventory /></ProtectedRoute>} />

        {/* Tasks & Activities */}
        <Route path="/tasks" element={<ProtectedRoute requireTenant><Tasks /></ProtectedRoute>} />
        <Route path="/meetings" element={<ProtectedRoute requireTenant><Meetings /></ProtectedRoute>} />
        <Route path="/meetings/:id" element={<ProtectedRoute requireTenant><MeetingDetail /></ProtectedRoute>} />
        <Route path="/calls" element={<ProtectedRoute requireTenant><Calls /></ProtectedRoute>} />
        <Route path="/emails" element={<ProtectedRoute requireTenant><EmailInbox /></ProtectedRoute>} />
        <Route path="/activity-logs" element={<ProtectedRoute requireTenant><ActivityLogs /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute requireTenant><AuditLogs /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute requireTenant><Notifications /></ProtectedRoute>} />

        {/* Finance */}
        <Route path="/rfi" element={<ProtectedRoute requireTenant><RFIs /></ProtectedRoute>} />
        <Route path="/rfi/new" element={<ProtectedRoute requireTenant><RFIForm /></ProtectedRoute>} />
        <Route path="/rfi/:id" element={<ProtectedRoute requireTenant><RFIDetail /></ProtectedRoute>} />
        <Route path="/rfi/:id/edit" element={<ProtectedRoute requireTenant><RFIForm /></ProtectedRoute>} />
        <Route path="/proposals" element={<ProtectedRoute requireTenant><Proposals /></ProtectedRoute>} />
        <Route path="/proposals/new" element={<ProtectedRoute requireTenant><ProposalForm /></ProtectedRoute>} />
        <Route path="/proposals/:id" element={<ProtectedRoute requireTenant><ProposalDetail /></ProtectedRoute>} />
        <Route path="/proposals/:id/edit" element={<ProtectedRoute requireTenant><ProposalForm /></ProtectedRoute>} />
        <Route path="/quotations" element={<ProtectedRoute requireTenant><Quotations /></ProtectedRoute>} />
        <Route path="/quotations/new" element={<ProtectedRoute requireTenant><QuotationForm /></ProtectedRoute>} />
        <Route path="/quotations/:id" element={<ProtectedRoute requireTenant><QuotationDetail /></ProtectedRoute>} />
        <Route path="/quotations/:id/edit" element={<ProtectedRoute requireTenant><QuotationForm /></ProtectedRoute>} />
        <Route path="/purchase-orders" element={<ProtectedRoute requireTenant><PurchaseOrders /></ProtectedRoute>} />
        <Route path="/purchase-orders/new" element={<ProtectedRoute requireTenant><PurchaseOrderForm /></ProtectedRoute>} />
        <Route path="/purchase-orders/:id" element={<ProtectedRoute requireTenant><PurchaseOrderDetail /></ProtectedRoute>} />
        <Route path="/purchase-orders/:id/edit" element={<ProtectedRoute requireTenant><PurchaseOrderForm /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute requireTenant><Inventory /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute requireTenant><Invoices /></ProtectedRoute>} />
        <Route path="/invoices/new" element={<ProtectedRoute requireTenant><InvoiceForm /></ProtectedRoute>} />
        <Route path="/invoices/:id" element={<ProtectedRoute requireTenant><InvoiceDetail /></ProtectedRoute>} />
        <Route path="/invoices/:id/edit" element={<ProtectedRoute requireTenant><InvoiceForm /></ProtectedRoute>} />

        {/* Products */}
        <Route path="/products" element={<ProtectedRoute><ProductMarketplace /></ProtectedRoute>} />
        <Route path="/products-management" element={<ProtectedRoute requireTenant><Products /></ProtectedRoute>} />
        <Route path="/product-categories" element={<ProtectedRoute requireTenant><ProductCategories /></ProtectedRoute>} />

        {/* Subscriptions */}
        <Route path="/subscription" element={<ProtectedRoute requireTenant><Subscription /></ProtectedRoute>} />
        <Route path="/monetization" element={<ProtectedRoute requireTenant><TenantMonetization /></ProtectedRoute>} />

        {/* Support */}
        <Route path="/support" element={<ProtectedRoute requireTenant><Support /></ProtectedRoute>} />
        <Route path="/support-admin" element={<ProtectedRoute requireSaas><SupportAdmin /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute requireTenant><Feedback /></ProtectedRoute>} />
        <Route path="/saas/feedback" element={<ProtectedRoute requireSaas><Feedback /></ProtectedRoute>} />

        {/* Settings */}
        <Route path="/users" element={<ProtectedRoute requireTenant><TeamManagement key={user?._id || 'no-user'} /></ProtectedRoute>} />
        <Route path="/org-chart" element={<ProtectedRoute requireTenant><OrgChart /></ProtectedRoute>} />
        <Route path="/org-hierarchy" element={<ProtectedRoute requireTenant><OrgHierarchy /></ProtectedRoute>} />
        <Route path="/role-template" element={<ProtectedRoute requireTenant><RoleTemplateBuilder /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute requireTenant><TemplateManagement /></ProtectedRoute>} />
        <Route path="/notification-settings" element={<ProtectedRoute requireTenant><NotificationSettings /></ProtectedRoute>} />
        <Route path="/document-templates" element={<ProtectedRoute requireTenant><DocumentTemplates /></ProtectedRoute>} />
        <Route path="/email-templates" element={
          <ProtectedRoute requireTenant>
            <Suspense fallback={<Loading />}>
              <EmailTemplates />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/social-media" element={<ProtectedRoute requireTenant><SocialMedia /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* SAAS Owner */}
        <Route path="/saas/dashboard" element={<ProtectedRoute requireSaas allowManager><SaasDashboard /></ProtectedRoute>} />
        <Route path="/saas/tenants" element={<ProtectedRoute requireSaas allowManager><Tenants /></ProtectedRoute>} />
        <Route path="/saas/activity-monitor" element={<ProtectedRoute requireSaas allowManager><SaasActivityMonitor /></ProtectedRoute>} />
        <Route path="/saas/tenants/:id/activity" element={<ProtectedRoute requireSaas allowManager><TenantActivity /></ProtectedRoute>} />
        <Route path="/saas/tenants/:tenantId/users" element={<ProtectedRoute requireSaas allowManager><SaasTenantUsers /></ProtectedRoute>} />
        <Route path="/saas/subscriptions" element={<ProtectedRoute requireSaas><SaasSubscriptions /></ProtectedRoute>} />
        <Route path="/saas/plans" element={<ProtectedRoute requireSaas><SaasPlans /></ProtectedRoute>} />
        <Route path="/saas/monetization" element={<ProtectedRoute requireSaas><Monetization /></ProtectedRoute>} />
        <Route path="/saas/resellers" element={<ProtectedRoute requireSaas><ResellerManagement /></ProtectedRoute>} />
        <Route path="/saas/billings" element={<ProtectedRoute requireSaas><Billings /></ProtectedRoute>} />
        <Route path="/saas/coupons" element={<ProtectedRoute requireSaas><CouponManagement /></ProtectedRoute>} />
        <Route path="/saas/refunds" element={<ProtectedRoute requireSaas><SaasRefunds /></ProtectedRoute>} />
        <Route path="/saas/admins" element={<ProtectedRoute requireSaas><SaasAdmins /></ProtectedRoute>} />
        <Route path="/saas/notifications" element={<ProtectedRoute requireSaas><SaasNotifications /></ProtectedRoute>} />
        <Route path="/saas/contact-inquiries" element={<ProtectedRoute requireSaas><SaasContactInquiries /></ProtectedRoute>} />
        <Route path="/saas/case-studies" element={<ProtectedRoute requireSaas><SaasCaseStudies /></ProtectedRoute>} />
        <Route path="/saas/my-tasks" element={<ProtectedRoute requireSaas><MyCaseStudyTasks /></ProtectedRoute>} />

        {/* Public info pages */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/all-features" element={<AllProductsPage />} />
        <Route path="/platform" element={<PlatformPage />} />
        <Route path="/feature/:slug" element={<FeatureDetailPage />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/security" element={<Security />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/partner-resources" element={<PartnerResources />} />
        <Route path="/industries" element={<IndustriesPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/demo/library" element={<DemoLibraryPage />} />
        <Route path="/data-center-feature" element={<DataCenterPage />} />
        <Route path="/partners" element={<PartnersPage />} />

        {/* Default */}
        <Route path="/" element={
          user ? (
            <Navigate to={
              user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN'
                ? '/saas/dashboard' : '/dashboard'
            } replace />
          ) : <LandingPage />
        } />
        <Route path="*" element={<div style={{ padding: '40px', textAlign: 'center' }}><h2>404 - Page Not Found</h2></div>} />
      </Routes>
      </Suspense>
    </>
  );
}

const AIChat = () => {
  const { user } = useAuth();
  if (!user || user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN') return null;
  return <AIChatWidget />;
};

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <ThemeProvider>
              <div className="App">
                <AppRoutes />
                {/* <AIChat /> */}
              </div>
            </ThemeProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
