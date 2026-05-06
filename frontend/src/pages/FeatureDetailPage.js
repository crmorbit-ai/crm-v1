import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';

const GROUPS = {
  'lead-management': {
    icon: '📋', color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
    title: 'Lead Management',
    subtitle: 'Capture, qualify and convert every lead — end to end.',
    desc: 'The complete sales front-door. Manage every prospect from first touch to closed deal with pipeline visibility, smart assignment, and full activity history.',
    modules: [
      {
        icon: '🎯', name: 'Leads', color: '#7c3aed',
        tagline: 'Capture & convert prospects',
        about: 'Central hub for all incoming prospects. Log leads from web forms, CSV import, or manual entry. Move them through a customizable Kanban pipeline and convert to contacts or opportunities in one click.',
        features: ['Drag-and-drop Kanban pipeline', 'Bulk CSV import with field mapping', 'Smart auto-assignment (round-robin / territory)', 'Lead scoring & priority ranking', 'Activity timeline — calls, emails, notes', 'Duplicate detection & merge', 'Convert to Contact / Opportunity', 'Lead source & ROI tracking', 'Custom fields per pipeline stage'],
      },
      {
        icon: '👥', name: 'Contacts', color: '#3b82f6',
        tagline: 'Full 360° contact profiles',
        about: 'Every person your business interacts with — stored, enriched, and linked. See the full history of every email, call, meeting, and deal on one profile page.',
        features: ['360° contact profile view', 'Link to accounts, leads & deals', 'Interaction timeline (email, call, meeting)', 'Custom fields & tags', 'Bulk import with deduplication', 'Segment & filter by any field', 'Export to CSV / Excel', 'Contact activity score tracking'],
      },
      {
        icon: '🏢', name: 'Accounts', color: '#06b6d4',
        tagline: 'B2B organization hierarchy',
        about: 'Track companies and organizations with parent-child hierarchy. Know exactly which contacts belong to which account and see all deals and tickets linked to that company.',
        features: ['Parent-child account hierarchy', 'All contacts linked to account', 'Company-level deal & ticket view', 'Relationship mapping across orgs', 'Custom account fields', 'Industry & size segmentation', 'Account health scoring', 'Bulk import accounts via CSV'],
      },
      {
        icon: '💼', name: 'Opportunities', color: '#8b5cf6',
        tagline: 'Sales pipeline & revenue forecasting',
        about: 'Track deals from qualification to close. See your weighted pipeline, forecast revenue by month or quarter, and understand where deals are stalling — before they slip.',
        features: ['Multi-stage drag-and-drop pipeline', 'Probability scoring per stage', 'Weighted revenue forecasting', 'Individual & team quota tracking', 'Deal timeline & activity log', 'Win / Loss reason capture', 'Link products, contacts & accounts', 'Expected close date alerts', 'One-click convert to invoice'],
      },
    ],
  },

  'task-management': {
    icon: '✅', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    title: 'Task Management',
    subtitle: 'Never miss a follow-up or meeting again.',
    desc: 'Keep your team on track with tasks, meetings, calls, and email — all linked to the right lead, contact, or deal so nothing falls through the cracks.',
    modules: [
      {
        icon: '📝', name: 'Tasks', color: '#f59e0b',
        tagline: 'Track every commitment',
        about: 'Create tasks for yourself or team members, link them to any CRM entity, set due dates and priorities, and get reminded before things go overdue.',
        features: ['Create tasks with due date & priority', 'Assign to any team member', 'Link to leads, contacts, deals, tickets', 'Email & in-app reminders', 'Recurring task support', 'Overdue task alerts', 'Team task visibility for managers', 'Activity report by rep'],
      },
      {
        icon: '📅', name: 'Meetings', color: '#10b981',
        tagline: 'Schedule & track meetings',
        about: 'Log customer meetings with agenda, attendees, and outcomes. View all upcoming meetings in calendar mode and set reminders so you are always prepared.',
        features: ['Meeting scheduling with agenda', 'Add attendees from contacts', 'Calendar day / week / month view', 'Meeting outcome & notes', 'Link meetings to any entity', 'Pre-meeting reminder notifications', 'Meeting history on contact profile', 'Follow-up task creation post-meeting'],
      },
      {
        icon: '📞', name: 'Calls', color: '#06b6d4',
        tagline: 'Log & analyze every call',
        about: 'Log every inbound and outbound call with duration, outcome, and notes. Build a complete call history per contact and track team call performance over time.',
        features: ['Log inbound & outbound calls', 'Duration, date & direction tracking', 'Custom outcome options', 'Post-call notes & follow-up tasks', 'Auto-link to leads / contacts', 'Rep call volume analytics', 'Team call leaderboard', 'Missed call follow-up alerts'],
      },
      {
        icon: '✉️', name: 'Email Inbox', color: '#8b5cf6',
        tagline: 'CRM-connected email',
        about: 'Connect your Gmail, Outlook, or any IMAP inbox. Emails auto-link to matching contacts and leads. See open and click tracking in real time — so you know the exact moment to follow up.',
        features: ['Connect Gmail / Outlook / any IMAP', 'Two-way email sync', 'Real-time open & click tracking', 'Auto-link emails to leads & contacts', 'Full conversation thread view', 'Rich text composer + attachments', 'Inbox, Sent & Draft sync', 'Email-to-ticket conversion'],
      },
    ],
  },

  'sales-finance': {
    icon: '📄', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#3b82f6)',
    title: 'Sales & Finance',
    subtitle: 'Complete B2B document workflow — RFI to Invoice.',
    desc: 'Handle the full B2B sales document lifecycle inside your CRM. From request for information to final invoice — with approvals, PDF export, and a full audit trail.',
    modules: [
      {
        icon: '📋', name: 'RFI', color: '#10b981',
        tagline: 'Request for Information tracking',
        about: 'Create and manage RFI documents when customers ask for product or pricing information. Track status, deadline, and response — all linked to the contact and account.',
        features: ['Create RFI from contact or account', 'Status tracking: open / in-progress / sent', 'Deadline management & reminders', 'Link to contacts & accounts', 'Document versioning', 'Convert RFI to Quotation', 'PDF export of RFI document', 'Full audit trail'],
      },
      {
        icon: '💰', name: 'Quotations', color: '#f59e0b',
        tagline: 'Professional quotation builder',
        about: 'Build professional quotations with line items, GST / tax rules, discounts, and custom terms. Get approvals internally before sending to customers.',
        features: ['Line item builder with auto-calculations', 'GST / tax rule configuration', 'Discount & custom terms', 'Multi-level approval workflow', 'One-click branded PDF export', 'Customer portal sharing', 'Convert quotation to PO', 'Document revision history'],
      },
      {
        icon: '📦', name: 'Purchase Orders', color: '#8b5cf6',
        tagline: 'PO management & tracking',
        about: 'Convert accepted quotations into Purchase Orders automatically. Track PO status, delivery timelines, and link everything back to the original opportunity.',
        features: ['Auto-generate PO from quotation', 'PO status tracking', 'Delivery timeline management', 'Vendor & supplier linking', 'PDF export of PO document', 'Link to opportunities & contacts', 'PO approval workflow', 'Convert PO to Invoice'],
      },
      {
        icon: '🧾', name: 'Invoices', color: '#ef4444',
        tagline: 'Invoice & payment tracking',
        about: 'Generate professional invoices from POs or directly. Track payment status, send reminders for overdue invoices, and maintain a complete financial record per client.',
        features: ['Generate invoices from PO or manually', 'Payment status: unpaid / partial / paid', 'Overdue invoice reminders', 'GST / tax included in invoice', 'Branded PDF generation', 'Payment history per client', 'Link to contacts & accounts', 'Revenue analytics dashboard'],
      },
    ],
  },

  'product': {
    icon: '📦', color: '#ef4444', gradient: 'linear-gradient(135deg,#ef4444,#f97316)',
    title: 'Product',
    subtitle: 'Manage your product catalog and marketplace.',
    desc: 'Centralize all products with categories, pricing tiers, and custom attributes. Make them available internally for quoting or externally via the product marketplace.',
    modules: [
      {
        icon: '🗂️', name: 'Product Catalog', color: '#ef4444',
        tagline: 'Centralized product management',
        about: 'Create and manage all your products in one place. Set categories, pricing tiers, custom attributes, and link products to quotations and invoices with one click.',
        features: ['Unlimited products & categories', 'Multi-tier pricing (retail, wholesale, custom)', 'Product images & media', 'Custom attributes per category', 'Stock & availability flags', 'GST / tax per product', 'One-click add to quotation', 'Bulk import via CSV', 'Product analytics in reports'],
      },
      {
        icon: '🛒', name: 'Product Marketplace', color: '#f97316',
        tagline: 'Customer-facing product portal',
        about: 'Publish products to a customer-facing marketplace so clients can browse, request quotes, or place orders directly. Control visibility per tenant or customer segment.',
        features: ['Publish / unpublish products', 'Customer-facing browse & search', 'Quote request from marketplace', 'Category filtering & sorting', 'Product detail pages', 'Tenant-level product visibility', 'Enquiry tracking from marketplace', 'Integrated with quotation workflow'],
      },
    ],
  },

  'account-management': {
    icon: '💳', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    title: 'Account Management',
    subtitle: 'Manage subscriptions and billing for your account.',
    desc: 'View and manage your active subscription plan, upgrade or downgrade, track billing history, and manage payment methods — all from one place.',
    modules: [
      {
        icon: '💳', name: 'Subscription & Billing', color: '#6366f1',
        tagline: 'Plan management & payment history',
        about: 'See your current active plan, the features it includes, and when it renews. Upgrade, downgrade, or cancel — and download invoices for every billing cycle.',
        features: ['Active plan details & features', 'Plan upgrade / downgrade', 'Billing cycle & renewal date', 'Payment history & invoices', 'Razorpay payment integration', 'Trial period countdown', 'Usage & limits overview', 'Auto-renewal notifications'],
      },
    ],
  },

  'automation': {
    icon: '⚡', color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    title: 'Automation',
    subtitle: 'Templates and tools that save your team hours every week.',
    desc: 'Build reusable templates for documents and emails. Schedule and manage social media posts. Automate the repetitive work so your team focuses on selling.',
    modules: [
      {
        icon: '📋', name: 'Templates', color: '#0ea5e9',
        tagline: 'Reusable document templates',
        about: 'Create master templates for quotations, POs, invoices, and any other document type. Dynamic variable substitution fills in CRM data automatically — one click to generate a PDF.',
        features: ['Templates for any document type', 'Dynamic variables {{contact.name}} etc.', 'One-click branded PDF generation', 'Rich text editor', 'Template versioning', 'Company branding on every doc', 'Live preview with real data', 'Share templates across team'],
      },
      {
        icon: '📑', name: 'Document Templates', color: '#8b5cf6',
        tagline: 'Advanced document automation',
        about: 'Advanced reusable document templates with multi-section layouts, conditional blocks, and approval-ready output. Perfect for complex proposals and contracts.',
        features: ['Multi-section document layouts', 'Conditional content blocks', 'Header, footer & page numbering', 'Approval-ready PDF output', 'Template library & categories', 'Version control & history', 'Export as PDF or Word', 'Bulk document generation'],
      },
      {
        icon: '📧', name: 'Email Templates', color: '#06b6d4',
        tagline: 'Personalized emails at scale',
        about: 'Write email templates once. Use them forever. Dynamic variables pull in contact name, company, and deal data automatically so every email feels personal — even at scale.',
        features: ['Unlimited email templates', 'Dynamic variables auto-fill', 'Rich text editor + images', 'Template categories & library', 'One-click send from contact page', 'Open & click rate tracking', 'Template performance analytics', 'Team sharing & collaboration'],
      },
      {
        icon: '🌐', name: 'Social Media', color: '#10b981',
        tagline: 'Schedule & track social posts',
        about: 'Connect your social media accounts and manage all posts from inside the CRM. Schedule in advance, track engagement, and keep your brand active — without the tab switching.',
        features: ['Connect multiple social accounts', 'Schedule posts in advance', 'Content calendar drag-and-drop', 'Post queue management', 'Engagement tracking per post', 'Reach & impression analytics', 'Team collaboration on drafts', 'Auto-publish at optimal times'],
      },
    ],
  },

  'access-management': {
    icon: '🔒', color: '#84cc16', gradient: 'linear-gradient(135deg,#84cc16,#10b981)',
    title: 'Access Management',
    subtitle: 'Control who sees what across your entire organization.',
    desc: 'Granular role-based access control, org charts, audit logs, and notification settings — the complete toolkit for keeping your CRM secure and organized.',
    modules: [
      {
        icon: '👥', name: 'Users', color: '#84cc16',
        tagline: 'User management & invites',
        about: 'Invite team members by email, assign roles, and manage access. Suspend or reactivate users without losing their data. Full user activity visible to admins.',
        features: ['Invite users by email', 'Role pre-assignment on invite', 'Suspend & reactivate users', 'User profile & activity view', 'Google OAuth / SSO support', 'Login history tracking', 'Bulk user management', 'Team structure grouping'],
      },
      {
        icon: '🏛️', name: 'Org Chart', color: '#10b981',
        tagline: 'Visual organization chart',
        about: 'Build a visual org chart for your company. Show reporting lines, departments, and teams. Export as PDF for presentations or onboarding new team members.',
        features: ['Visual drag-and-drop org tree', 'Reporting line tracking', 'Department & team grouping', 'Employee profile on each node', 'Export as PDF / image', 'Unlimited hierarchy depth', 'Role assignment per node', 'Org chart version history'],
      },
      {
        icon: '🏗️', name: 'Org Hierarchy', color: '#06b6d4',
        tagline: 'Advanced hierarchy builder',
        about: 'Advanced organization structure builder with custom node types, role templates, and multi-department management. Great for complex enterprise structures.',
        features: ['Custom node types & roles', 'Role template library', 'Multi-department management', 'Access-controlled viewing', 'Node detail profiles', 'Hierarchy change tracking', 'PDF export of full hierarchy', 'Unlimited depth & breadth'],
      },
      {
        icon: '🎭', name: 'Role Template', color: '#a855f7',
        tagline: 'Custom role & permission builder',
        about: 'Create custom roles with module-level permissions. Control view, create, edit, delete, and export access per module. Start from built-in templates or build from scratch.',
        features: ['Module-level RBAC', 'View / Create / Edit / Delete / Export per module', 'Built-in Admin, Manager, Rep templates', 'Custom role creation', 'User group permission sets', 'Field-level visibility control', 'Permission inheritance', 'Role change audit log'],
      },
      {
        icon: '🔔', name: 'Notifications', color: '#f97316',
        tagline: 'Real-time alerts & reminders',
        about: 'Real-time in-app notifications for task due dates, deal changes, SLA breaches, email opens, and team @mentions. Each user controls what they want to see.',
        features: ['Real-time in-app notification bell', 'Task due date & overdue alerts', 'Deal stage change notifications', 'SLA breach warnings', 'Email open tracking alerts', '@mention in notes', 'Daily / weekly digest email', 'Per-type preference control'],
      },
      {
        icon: '📈', name: 'Audit Logs', color: '#8b5cf6',
        tagline: 'Complete compliance trail',
        about: 'Every action taken in the CRM is logged — who changed what, when, and from which IP. Filter by user, module, or date range and export for compliance reports.',
        features: ['Every action logged automatically', 'Who, what, when & IP tracked', 'Before / after field value diff', 'Real-time activity feed', 'Global audit log with filters', 'Export to CSV / Excel', 'Module-specific filtering', 'Suspicious activity alerts'],
      },
    ],
  },

  'support': {
    icon: '🎯', color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
    title: 'Support',
    subtitle: 'Resolve customer issues fast with SLA tracking and escalation.',
    desc: 'Complete helpdesk system with SLA management, multi-tier escalation, and customer feedback — giving your support team full visibility and your customers quick resolutions.',
    modules: [
      {
        icon: '🎫', name: 'Support Tickets', color: '#ec4899',
        tagline: 'Helpdesk with SLA tracking',
        about: 'Create and manage support tickets from email, portal, or manually. Track SLA targets, auto-escalate on breach, and keep customers updated in real time.',
        features: ['Ticket creation via email / portal / manual', 'SLA targets per priority level', 'Critical / High / Medium / Low priorities', 'Auto-escalation on SLA breach', 'Internal notes + customer replies', 'Ticket categories & custom fields', 'Auto-assign by category', 'Real-time status updates', 'Analytics dashboard'],
      },
      {
        icon: '💬', name: 'Feedback', color: '#a855f7',
        tagline: 'Customer feedback & sentiment',
        about: 'Collect structured feedback from customers. Auto-detect sentiment (positive, neutral, negative) and route bug reports, feature requests, and complaints to the right team.',
        features: ['In-app feedback collection', 'Auto sentiment detection', '4 types: bug, feature, complaint, praise', '3-tier escalation workflow', 'Sentiment trend analytics', 'Feedback status tracking', 'Response & resolution tracking', 'Export feedback data to CSV'],
      },
    ],
  },

  'monetization': {
    icon: '💰', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#3b82f6)',
    title: 'Monetization',
    subtitle: 'Track revenue, subscriptions, and commissions.',
    desc: 'Full monetization dashboard for sales teams. See MRR, deal revenue, reseller commissions, and subscription analytics — the financial layer of your CRM.',
    modules: [
      {
        icon: '📊', name: 'Sales Dashboard', color: '#10b981',
        tagline: 'Revenue & commission analytics',
        about: 'See real-time revenue metrics — MRR, ARR, churn, and growth. Track reseller commissions, subscription plan distribution, and billing cycle health from one dashboard.',
        features: ['Real-time MRR & ARR tracking', 'Revenue by plan / period / rep', 'Reseller commission overview', 'Churn rate & at-risk customers', 'Subscription plan distribution', 'Billing cycle health', 'Failed payment tracking', 'Revenue forecasting'],
      },
    ],
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #060b14; }
  .fdp { font-family: 'Inter',-apple-system,sans-serif; background: #060b14; color: #fff; min-height: 100vh; }

  .stars-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 55% 40%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 75% 10%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 20% 70%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 45% 80%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,0.5) 0%, transparent 100%);
    background-size: 900px 900px;
    animation: tw 10s ease-in-out infinite alternate;
  }
  @keyframes tw { 0%{opacity:0.5} 100%{opacity:1} }

  .fdp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(6,11,20,0.85); backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.06); padding: 14px 0;
  }
  .fdp-nav-inner {
    max-width: 1200px; margin: 0 auto; padding: 0 40px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .fdp-back {
    display: flex; align-items: center; gap: 8px;
    background: none; border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 500;
    padding: 7px 14px; border-radius: 8px; cursor: pointer;
    transition: all 0.2s; font-family: inherit;
  }
  .fdp-back:hover { color: #fff; border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05); }
  .fdp-nav-logo { font-size: 16px; font-weight: 800; color: #fff; }
  .fdp-btn-primary {
    padding: 8px 18px; font-size: 13px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg,#7c3aed,#3b82f6); border: none;
    border-radius: 8px; cursor: pointer; font-family: inherit;
    box-shadow: 0 4px 14px rgba(124,58,237,0.3);
  }
  .fdp-btn-primary:hover { box-shadow: 0 6px 20px rgba(124,58,237,0.45); }

  .fdp-hero { padding: 110px 0 60px; position: relative; }
  .fdp-hero-inner { max-width: 1200px; margin: 0 auto; padding: 0 40px; position: relative; z-index: 2; }
  .fdp-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 700; letter-spacing: 1px;
    padding: 4px 14px; border-radius: 20px; margin-bottom: 20px;
  }
  .fdp-hero-h1 { font-size: clamp(32px,4vw,52px); font-weight: 900; letter-spacing: -1.5px; margin: 0 0 14px; }
  .fdp-hero-sub { font-size: 18px; font-weight: 600; margin: 0 0 12px; }
  .fdp-hero-desc { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.75; max-width: 680px; margin: 0; }

  .fdp-body { max-width: 1200px; margin: 0 auto; padding: 0 40px 80px; position: relative; z-index: 2; }

  .fdp-module { margin-bottom: 48px; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; }
  .fdp-module-header {
    display: flex; align-items: center; gap: 16px;
    padding: 24px 28px; cursor: pointer;
    background: rgba(255,255,255,0.03); transition: background 0.2s;
    border: none; width: 100%; text-align: left; font-family: inherit;
  }
  .fdp-module-header:hover { background: rgba(255,255,255,0.06); }
  .fdp-module-icon { width: 48px; height: 48px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .fdp-module-info { flex: 1; }
  .fdp-module-name { font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 3px; }
  .fdp-module-tagline { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; }
  .fdp-module-arrow { font-size: 12px; color: rgba(255,255,255,0.3); transition: transform 0.3s; }
  .fdp-module-arrow.open { transform: rotate(180deg); }

  .fdp-module-body { border-top: 1px solid rgba(255,255,255,0.06); overflow: hidden; transition: max-height 0.4s ease; }
  .fdp-module-content { padding: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  @media(max-width:700px){ .fdp-module-content { grid-template-columns: 1fr; } }

  .fdp-about { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.75; }
  .fdp-feat-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; margin: 0 0 14px; }
  .fdp-feat-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 7px; }
  .fdp-feat-item { display: flex; align-items: flex-start; gap: 9px; font-size: 13px; color: rgba(255,255,255,0.65); }
  .fdp-check { width: 18px; height: 18px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; margin-top: 1px; }

  .fdp-cta { padding: 60px 40px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); text-align: center; position: relative; z-index: 2; }
  .fdp-cta h2 { font-size: 28px; font-weight: 800; margin: 0 0 10px; }
  .fdp-cta p { font-size: 15px; color: rgba(255,255,255,0.45); margin: 0 0 28px; }
  .fdp-cta-btns { display: flex; gap: 12px; justify-content: center; }

  @media(max-width:900px){
    .fdp-nav-inner { padding: 0 20px; }
    .fdp-hero-inner { padding: 0 20px; }
    .fdp-body { padding: 0 20px 60px; }
  }
`;

export default function FeatureDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const group = GROUPS[slug];
  const [openIdx, setOpenIdx] = useState(0);

  if (!group) {
    return (
      <div style={{ background: '#060b14', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>Page not found</h2>
        <button onClick={() => navigate('/')} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>← Back to Home</button>
      </div>
    );
  }

  return (
    <div className="fdp">
      <style>{CSS}</style>
      <div className="stars-bg" />

      <SharedHeader />

      {/* HERO */}
      <section className="fdp-hero">
        <div style={{ position: 'absolute', width: 600, height: 600, top: -150, left: '50%', transform: 'translateX(-50%)', background: `radial-gradient(ellipse,${group.color}20 0%,transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div className="fdp-hero-inner">
          <div className="fdp-hero-badge" style={{ background: `${group.color}18`, border: `1px solid ${group.color}35`, color: group.color }}>
            {group.icon} CRM MODULE
          </div>
          <h1 className="fdp-hero-h1">{group.title}</h1>
          <p className="fdp-hero-sub" style={{ background: group.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {group.subtitle}
          </p>
          <p className="fdp-hero-desc">{group.desc}</p>

          {/* Module pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
            {group.modules.map((m, i) => (
              <button key={i} onClick={() => setOpenIdx(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  background: openIdx === i ? `${m.color}18` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${openIdx === i ? m.color + '50' : 'rgba(255,255,255,0.1)'}`,
                  color: openIdx === i ? m.color : 'rgba(255,255,255,0.5)',
                }}>
                {m.icon} {m.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <div className="fdp-body">
        {group.modules.map((m, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="fdp-module" style={{ borderColor: isOpen ? `${m.color}30` : 'rgba(255,255,255,0.07)' }}>
              <button className="fdp-module-header" onClick={() => setOpenIdx(isOpen ? null : i)}>
                <div className="fdp-module-icon" style={{ background: `${m.color}15` }}>{m.icon}</div>
                <div className="fdp-module-info">
                  <div className="fdp-module-name">{m.name}</div>
                  <div className="fdp-module-tagline">{m.tagline}</div>
                </div>
                <span className={`fdp-module-arrow${isOpen ? ' open' : ''}`}>▼</span>
              </button>

              <div className="fdp-module-body" style={{ maxHeight: isOpen ? '600px' : '0' }}>
                <div className="fdp-module-content">
                  <div>
                    <p className="fdp-about">{m.about}</p>
                  </div>
                  <div>
                    <div className="fdp-feat-label" style={{ color: m.color }}>✦ KEY FEATURES</div>
                    <ul className="fdp-feat-list">
                      {m.features.map((f, j) => (
                        <li key={j} className="fdp-feat-item">
                          <div className="fdp-check" style={{ background: `${m.color}15`, border: `1px solid ${m.color}30`, color: m.color }}>✓</div>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="fdp-cta">
        <div style={{ position: 'absolute', width: 500, height: 500, bottom: -150, left: '50%', transform: 'translateX(-50%)', background: `radial-gradient(ellipse,${group.color}15 0%,transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2>Ready to use <span style={{ background: group.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{group.title}</span>?</h2>
          <p>Start your free trial today. No credit card required.</p>
          <div className="fdp-cta-btns">
            <button onClick={() => navigate('/register')} style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700, color: '#fff', background: group.gradient, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 22px ${group.color}40` }}>
              Start Free Trial →
            </button>
            <button onClick={() => navigate('/')} style={{ padding: '12px 22px', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
              ← View All Features
            </button>
          </div>
        </div>
      </div>

      <SharedFooter />
    </div>
  );
}
