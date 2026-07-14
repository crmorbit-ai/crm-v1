import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import SEO from '../components/SEO';

const GROUPS = {
  'lead-management': {
    icon: '📋', color: '#1EB980', gradient: 'linear-gradient(135deg,#1EB980,#22c55e)',
    title: 'Lead Management',
    subtitle: 'Capture, qualify and convert every lead — end to end.',
    desc: 'The complete sales front-door. Manage every prospect from first touch to closed deal with pipeline visibility, smart assignment, and full activity history.',
    modules: [
      {
        icon: '🎯', name: 'Leads', color: '#1EB980',
        tagline: 'Capture & convert prospects',
        about: 'Central hub for all incoming prospects. Log leads from web forms, CSV import, or manual entry. Move them through a customizable Kanban pipeline and convert to contacts or opportunities in one click.',
        features: ['Drag-and-drop Kanban pipeline', 'Bulk CSV import with field mapping', 'Smart auto-assignment (round-robin / territory)', 'Lead scoring & priority ranking', 'Activity timeline — calls, emails, notes', 'Duplicate detection & merge', 'Convert to Contact / Opportunity', 'Lead source & ROI tracking', 'Custom fields per pipeline stage'],
      },
      {
        icon: '👥', name: 'Contacts', color: '#22c55e',
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
        icon: '💼', name: 'Opportunities', color: '#1EB980',
        tagline: 'Sales pipeline & revenue forecasting',
        about: 'Track deals from qualification to close. See your weighted pipeline, forecast revenue by month or quarter, and understand where deals are stalling — before they slip.',
        features: ['Multi-stage drag-and-drop pipeline', 'Probability scoring per stage', 'Weighted revenue forecasting', 'Individual & team quota tracking', 'Deal timeline & activity log', 'Win / Loss reason cause', 'Link products, contacts & accounts', 'Expected close date alerts', 'One-click convert to invoice'],
      },
      {
        icon: '🤖', name: 'AI Assistant', color: '#f59e0b',
        tagline: 'Powered by Google Gemini',
        about: 'Built-in AI powered by Google Gemini that works across your entire CRM. Draft emails in seconds, score leads automatically, get sales insights, and receive smart recommendations based on your pipeline data.',
        features: ['AI-powered email drafting', 'Lead scoring suggestions', 'Sales insights & pipeline summaries', 'Smart follow-up recommendations', 'Revenue forecasting assistance', 'Powered by Google Gemini', 'Contextual suggestions per deal stage', 'One-click draft to send'],
      },
    ],
  },

  'meeting-management': {
    icon: '📅', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#06b6d4)',
    title: 'Meeting Management',
    subtitle: 'Schedule, track and follow up on every meeting — automatically.',
    desc: 'From scheduling to follow-up, manage every client and internal meeting inside your CRM. Auto-send invites, get reminders, log outcomes, and create follow-up tasks — all linked to the right deal or contact.',
    modules: [
      {
        icon: '📅', name: 'Schedule Meetings', color: '#10b981',
        tagline: 'Never miss a client meeting again',
        about: 'Schedule meetings directly inside the CRM. Add agenda, attendees, location or video link, and link the meeting to a lead, contact, deal, or support ticket. Get a complete calendar view — day, week, or month.',
        features: [
          'One-click meeting creation from any record',
          'Add agenda, description & meeting type',
          'Link to leads, contacts, accounts, deals',
          'Google Meet / Zoom / in-person support',
          'Calendar view — day, week, month',
          'Color-coded by meeting type',
          'Drag & reschedule from calendar',
          'Recurring meeting support',
        ],
      },
      {
        icon: '📧', name: 'Auto Invitations', color: '#06b6d4',
        tagline: 'Professional invites sent automatically',
        about: 'As soon as a meeting is saved, all attendees receive a professional email invitation with date, time, agenda, and the meeting link. No manual follow-up needed.',
        features: [
          'Auto email invite to all attendees',
          'Branded invitation template',
          'Meeting link included in invite',
          'Agenda & agenda details in email',
          'Invite update on reschedule',
          'Cancellation email on delete',
          'Reply-to organizer support',
          'Mobile-friendly email design',
        ],
      },
      {
        icon: '⏰', name: 'Reminders', color: '#f59e0b',
        tagline: 'Never walk into a meeting unprepared',
        about: 'Automatic reminder emails are sent 1 hour before every meeting to all attendees. Managers get daily digest of upcoming team meetings. Never miss a scheduled call again.',
        features: [
          '1-hour before reminder auto-sent',
          'Reminder to all attendees + organizer',
          'Daily meeting digest for managers',
          'In-app notification bell alert',
          'Custom reminder time (coming soon)',
          'Reminder on reschedule',
          'Missed meeting alert',
          'SMS reminder via Twilio (optional)',
        ],
      },
      {
        icon: '📝', name: 'Meeting Notes & Follow-up', color: '#a78bfa',
        tagline: 'Close the loop after every meeting',
        about: 'After the meeting, log outcome, add notes, and create follow-up tasks — all linked to the same record. Build a complete meeting history on every contact and deal so your team always knows what was discussed.',
        features: [
          'Post-meeting notes & outcome logging',
          'Meeting status — Scheduled / Completed / Cancelled',
          'Create follow-up task directly from meeting',
          'Meeting history on contact/lead profile',
          'Notes visible to entire team',
          'Attachment support (MoM, proposals)',
          'Meeting activity in audit log',
          'Manager view — all team meeting outcomes',
        ],
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
        icon: '✉️', name: 'Email Inbox', color: '#1EB980',
        tagline: 'CRM-connected email',
        about: 'Connect your Gmail, Outlook, or any IMAP inbox. Emails auto-link to matching contacts and leads. See open and click tracking in real time — so you know the exact moment to follow up.',
        features: ['Connect Gmail / Outlook / any IMAP', 'Two-way email sync', 'Real-time open & click tracking', 'Auto-link emails to leads & contacts', 'Full conversation thread view', 'Rich text composer + attachments', 'Inbox, Sent & Draft sync', 'Email-to-ticket conversion'],
      },
    ],
  },

  'sales-finance': {
    icon: '📄', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#22c55e)',
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
        icon: '📦', name: 'Purchase Orders', color: '#1EB980',
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
    icon: '💳', color: '#1EB980', gradient: 'linear-gradient(135deg,#1EB980,#1EB980)',
    title: 'Account Management',
    subtitle: 'Manage subscriptions and billing for your account.',
    desc: 'View and manage your active subscription plan, upgrade or downgrade, track billing history, and manage payment methods — all from one place.',
    modules: [
      {
        icon: '💳', name: 'Subscription & Billing', color: '#1EB980',
        tagline: 'Plan management & payment history',
        about: 'See your current active plan, the features it includes, and when it renews. Upgrade, downgrade, or cancel — and download invoices for every billing cycle.',
        features: ['Active plan details & features', 'Plan upgrade / downgrade', 'Billing cycle & renewal date', 'Payment history & invoices', 'Razorpay payment integration', 'Trial period countdown', 'Usage & limits overview', 'Auto-renewal notifications'],
      },
    ],
  },

  'automation': {
    icon: '⚡', color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#1EB980)',
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
        icon: '📑', name: 'Document Templates', color: '#1EB980',
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

  'document-templates': {
    icon: '📑', color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
    title: 'Templates',
    subtitle: 'One template hub — for modules, emails, documents, and org hierarchies.',
    desc: 'Four powerful template systems inside one CRM. Pre-fill default values for any CRM module so your team stops typing the same things twice. Build professional emails visually. Create document templates that export as Word, Excel, or PowerPoint. And design your org hierarchy once and auto-match leads by designation.',
    modules: [
      {
        icon: '📋', name: 'Module Templates', color: '#8b5cf6',
        tagline: 'Pre-filled defaults for Lead, Task, Meeting, Quotation, RFI, PO & Invoice',
        about: 'Create reusable templates for every CRM module — Lead, Task, Quotation, RFI, Meeting, Purchase Order, and Invoice. Each template stores a set of pre-filled default values. When a team member creates a new record, they pick a template and all the fields fill in automatically. No more typing the same source, priority, terms, or description over and over.',
        features: [
          'Templates for Lead, Task, Meeting, Quotation, RFI, Purchase Order, Invoice',
          'Pre-fill any field: source, priority, status, terms, description, notes',
          'Task templates — set due date as "X days from today" automatically',
          'Quotation & Invoice templates — pre-set expiry / due date offset',
          'Meeting templates — pre-fill type (Online/In-Person), duration, agenda',
          'Custom icon & color per template for instant visual identification',
          'Usage count — track which templates your team uses most',
          'Filter templates by module, search by name',
          'Edit or delete templates anytime without affecting past records',
        ],
      },
      {
        icon: '✉️', name: 'Email Templates', color: '#db2777',
        tagline: 'Visual drag-and-drop email builder with categories',
        about: 'Build professional email templates using a full visual drag-and-drop editor (powered by react-email-editor). Design layouts with columns, images, buttons, and text blocks — no HTML needed. Organize templates by category: Welcome, Follow-up, Proposal, Cold Outreach, Support, Promotional, Reminder. Preview before saving, then use any template from the email composer in one click.',
        features: [
          'Visual drag-and-drop email editor — no HTML needed',
          'Categories: Welcome, Follow-up, Proposal, Cold Outreach, Support, Promotional, Reminder',
          'Add subject line and description to each template',
          'Preview template before saving',
          'Sort by Most Recent, Most Used, or Name A–Z',
          'Search templates by name',
          'Filter by category',
          'One-click use from the email composer',
          'Usage count tracked per template',
          'Assign brand color to identify templates at a glance',
        ],
      },
      {
        icon: '📄', name: 'Document Templates', color: '#06b6d4',
        tagline: 'SOPs & docs — export as Word, Excel, or PowerPoint',
        about: 'Create a library of reusable document templates — Sales SOPs, HR & Onboarding guides, Finance docs, Operations checklists, and more. Write content with a rich text editor, choose the default export format, then download as Word (.docx), Excel (.xlsx), or PowerPoint (.pptx) in one click. Share with your team or generate a public link for external access.',
        features: [
          'Rich text editor — write full formatted content',
          'Categories: General, Lead Process, Sales SOP, HR & Onboarding, Finance, Operations, Support',
          'Export as Word (.docx), Excel (.xlsx), or PowerPoint (.pptx)',
          'PowerPoint auto-splits content into slides (max 6 lines per slide)',
          'Set default export format per template',
          'Generate a public share link — anyone with the link can view',
          'Revoke public link anytime',
          'Share with specific team members with View or Edit permission',
          'Remove a team member\'s access at any time',
          'Usage count — see how many times a template was accessed',
        ],
      },
      {
        icon: '🏢', name: 'Role Template Builder', color: '#10b981',
        tagline: 'Define your org hierarchy and auto-match leads by designation',
        about: 'Build your organization\'s role hierarchy as a template — define Company, Division, Department, Team, Role, and Person levels with parent-child relationships. Assign keywords to each role (e.g. "ceo", "chief executive", "md") so that when a lead comes in with a matching designation, the CRM automatically maps them to the right level in your hierarchy.',
        features: [
          'Define hierarchy with 6 node types: Company, Division, Department, Team, Role, Person',
          'Set level number and parent role for each node',
          'Add keyword tags to roles — used to auto-match incoming leads by designation',
          'Drag & reorder roles up or down within the template',
          'Color-coded by hierarchy level for easy visualization',
          '2-step builder: Define Roles → Preview & Generate',
          'Preview the hierarchy tree before saving',
          'One active hierarchy template per organization',
          'Edit the template anytime — changes reflect in lead matching instantly',
        ],
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
        icon: '📈', name: 'Audit Logs', color: '#1EB980',
        tagline: 'Complete compliance trail',
        about: 'Every action taken in the CRM is logged — who changed what, when, and from which IP. Filter by user, module, or date range and export for compliance reports.',
        features: ['Every action logged automatically', 'Who, what, when & IP tracked', 'Before / after field value diff', 'Real-time activity feed', 'Global audit log with filters', 'Export to CSV / Excel', 'Module-specific filtering', 'Suspicious activity alerts'],
      },
    ],
  },

  'support': {
    icon: '🎯', color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#1EB980)',
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
    icon: '🏗️', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    title: 'SaaS Platform',
    subtitle: 'Multi-tenant infrastructure, billing engine, and reseller program — all in one.',
    desc: 'The complete back-end for running a SaaS CRM business. Manage every tenant, define subscription plans with granular feature toggles, track real MRR and ARR, analyze churn with health segments, and run a reseller network with per-partner commission rates — secured by 4-digit PIN-gated tenant access.',
    modules: [
      {
        icon: '🏢', name: 'Tenant Management', color: '#6366f1',
        tagline: 'Every customer org — one place, fully isolated',
        about: 'See and manage every organization (tenant) registered on the platform from a single admin view. Filter by status, assign a Manager to any tenant, bulk-assign multiple tenants to a manager in one action, and drill into a tenant\'s full profile. Sensitive tenant data is protected behind a 4-digit viewing PIN that must be verified before the panel unlocks.',
        features: [
          'View all registered tenant organizations in one table',
          'Filter by status: Active, Trial, Suspended, Deletion Requested',
          'Search tenants by name, email, or organization',
          'Assign a Manager to any tenant — one click',
          'Bulk manager assignment — select multiple tenants at once',
          'Paginated list (20 per page) for large tenant bases',
          '4-digit viewing PIN gate — must verify before seeing tenant data',
          'Set, change, or reset viewing PIN via OTP to admin email',
          'Tenant detail panel — plan, status, user count, subscription dates',
        ],
      },
      {
        icon: '👨‍💼', name: 'SaaS Admin Panel', color: '#8b5cf6',
        tagline: 'Manage platform admins with OTP-verified onboarding',
        about: 'Add and manage the people who run the platform. Three distinct roles exist — Primary Owner (cannot be removed or deactivated), Manager (assigned to tenants), and Admin. New admins are created via a 2-step OTP flow: the platform owner initiates the invite, an OTP is sent to the new admin\'s email, and the owner verifies it before the account is created. Each admin can set a separate Viewing Credentials (ID + password) to access the sensitive tenant viewing panel.',
        features: [
          'Three admin roles: Primary Owner, Manager, Admin',
          '2-step OTP-verified admin creation — no unsafe invites',
          'OTP sent to new admin\'s email, verified by the Primary Owner',
          'Resend OTP if the first expires (10-minute window)',
          'Activate or deactivate any admin without deleting their account',
          'Direct password reset for any admin (Primary Owner only)',
          'Cannot deactivate or delete the Primary Owner account',
          'Admins set Viewing Credentials (ID + password) to unlock tenant data',
          'Forgot Viewing Credentials → OTP reset flow',
          'Filter admin list by role or active/inactive status',
        ],
      },
      {
        icon: '💳', name: 'Subscription Plans & Billing', color: '#10b981',
        tagline: 'Define plans, toggle features, set limits — live',
        about: 'Define 4 subscription tiers (Free, Basic, Professional, Enterprise) with full control over what each plan includes. Toggle individual features on or off per plan — Core features (Lead Management, Contact Management, Deal Tracking, Task Management), Advanced features (Email Integration, Custom Fields), and Premium features (Cross-Org Hierarchy, Sales Monetization). Set hard limits per plan for users, leads, contacts, deals, storage, and emails per day. Track every tenant\'s billing status with a real MRR area chart.',
        features: [
          'Four plan tiers: Free, Basic, Professional, Enterprise',
          'Feature toggles per plan — Core, Advanced, Premium groups',
          'Core: Lead Management, Contact Management, Deal Tracking, Task Management',
          'Advanced: Email Integration, Custom Fields',
          'Premium: Cross-Org Hierarchy, Sales Monetization',
          'Limits per plan: Max Users, Max Leads, Max Contacts, Max Deals, Storage (MB), Emails/Day',
          'Subscription statuses: Active, Trial, Expired, Suspended, Cancelled',
          'Real MRR area chart — actual revenue from subscription start/end dates',
          'Period filter: 1M, 3M, 6M, 1Y',
          'KPIs: MRR, ARR, Active subscriptions, Average revenue, Total paid',
        ],
      },
      {
        icon: '📊', name: 'Revenue, Churn & Upsell', color: '#f59e0b',
        tagline: 'MRR, ARR, churn analysis and customer health segments',
        about: 'The full monetization analytics suite. Track MRR, ARR, churn rate, trial count, and cancellations at a glance. Drill into the Revenue tab for plan-wise distribution and sparkline trends. The Churn tab shows customers at risk — segmented into Champion, Healthy, At Risk, and Critical health tiers. The Upsell tab surfaces tenants who are close to their plan limits and ready to upgrade.',
        features: [
          'KPI cards: MRR, ARR, Churn Rate, Trials, Cancelled',
          'Revenue tab — plan-wise revenue bars and total MRR trend',
          'Churn tab — ring chart of cancelled vs total, at-risk tenant list',
          'Customer health segments: Champion, Healthy, At Risk, Critical',
          'Upsell tab — tenants near usage limits flagged for upgrade',
          'Features tab — feature adoption rate across all tenants',
          'Plan distribution chart — how many tenants on each tier',
          'Subscription sparkline per tenant — usage trend at a glance',
        ],
      },
      {
        icon: '🤝', name: 'Reseller Program', color: '#0ea5e9',
        tagline: 'Partner network with per-partner commission rates',
        about: 'Run a full reseller / partner program from inside the admin panel. Each reseller application goes through an approval workflow — Pending → Approved or Rejected. Approved partners get a commission rate set individually by the platform owner. Track total partners, active partners, and pending approvals in real time. Suspend or reactivate resellers at any time without losing their history.',
        features: [
          'Reseller application approval workflow: Pending → Approved / Rejected',
          'Suspend or reactivate any reseller at any time',
          'Set a custom commission rate per approved reseller',
          'Stats bar: Total partners, Approved, Pending approval',
          'Reseller detail panel — commission rate, status, joined date',
          'Filter resellers by status: All, Approved, Pending, Rejected, Suspended',
          'Search resellers by name or email',
          'Commission rate editable at any time by the platform owner',
        ],
      },
    ],
  },

  'email-inbox': {
    icon: '✉️', color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    title: 'Email Inbox',
    subtitle: 'Two-way IMAP sync, real-time notifications, and full conversation threads — inside your CRM.',
    desc: 'Connect your own email account via IMAP and manage every conversation without leaving the CRM. Emails auto-link to leads, contacts, accounts, and meetings. Get real-time notifications via Socket.io the moment a new email lands. Reply, forward, and track open/delivered status on every message.',
    modules: [
      {
        icon: '📥', name: 'IMAP Sync', color: '#0ea5e9',
        tagline: 'Connect your mailbox — emails sync automatically',
        about: 'Connect any IMAP-supported email account (Gmail, Outlook, custom domain) by saving your SMTP/IMAP credentials in Settings. The CRM auto-converts the SMTP host to the IMAP host and connects on port 993 with TLS. New emails are fetched and stored in the CRM database — fully searchable, filterable, and linked to existing CRM records.',
        features: [
          'Connect any IMAP mailbox — Gmail, Outlook, custom domain',
          'Credentials saved in UserSettings with encryption',
          'Auto-converts SMTP host to IMAP host (e.g. smtp.gmail.com → imap.gmail.com)',
          'Connects on port 993 over TLS — secure by default',
          'Sync on demand — manual sync button in the inbox',
          'Background IMAP IDLE service — polls for new messages continuously',
          'Stores emails in CRM database — persist across sessions',
          'Tracks imapUid and imapFolder per message to avoid duplicates',
        ],
      },
      {
        icon: '⚡', name: 'Real-Time Notifications', color: '#6366f1',
        tagline: 'Socket.io push — know the instant an email arrives',
        about: 'The inbox is connected to a live Socket.io channel. The moment a new email arrives for your tenant, a push notification fires in the browser — with the email subject shown in a toast. A notification sound plays automatically. The email list and stats refresh instantly without any page reload.',
        features: [
          'Socket.io connection per tenant on inbox open',
          'Instant push notification on new email arrival',
          'Subject shown in notification toast',
          'Notification sound on new email (notification.mp3)',
          'Email list auto-refreshes on new message',
          'Stats counter auto-updates without page reload',
          'Socket connection cleaned up automatically on unmount',
          'Tenant-scoped channel — no cross-tenant leakage',
        ],
      },
      {
        icon: '💬', name: 'Compose, Reply & Forward', color: '#10b981',
        tagline: 'Full email composer with threading support',
        about: 'Write new emails, reply to any message, or forward with full context — all from inside the CRM. The composer supports To, CC, BCC, subject, rich HTML body, and attachments. Replies are automatically threaded using inReplyTo and threadId so the full conversation stays together in the inbox view.',
        features: [
          'Compose new email — To, CC, BCC, Subject, HTML body',
          'Reply to any email — pre-fills recipient and subject',
          'Forward email — includes original body',
          'Attachments supported — filename, contentType, size',
          'Threading via inReplyTo and threadId — full conversation view',
          'Full thread view — see all replies in chronological order',
          'Email types: manual, reply, meeting invitation, bulk, OTP',
          'Link email to Lead, Contact, Account, or Meeting record',
        ],
      },
      {
        icon: '📊', name: 'Tracking & Status', color: '#f59e0b',
        tagline: 'Know when emails are delivered, opened, or replied',
        about: 'Every outgoing email is tracked through its full delivery lifecycle. Status updates from sent → delivered → opened → replied are recorded with timestamps. Filter the inbox by status to find all bounced emails, all opened emails, or all unanswered messages. Full text search across subject, body, sender, and recipient is supported.',
        features: [
          'Delivery statuses: Sent, Delivered, Failed, Bounced, Opened, Replied',
          'Timestamps: sentAt, deliveredAt, openedAt, repliedAt',
          'Filter inbox by status — find bounced or unopened emails fast',
          'Filter by email type — manual, meeting invite, bulk, OTP',
          'Filter by direction — Inbox (received) or Sent',
          'Full-text search — subject, body, from email, to email',
          'Pagination — 50 emails per page',
          'Folders: Inbox, Sent, Drafts, Starred, Trash',
        ],
      },
    ],
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; overflow-x: hidden; background: #0f1e2e; }
  .fdp { font-family: 'Inter',-apple-system,sans-serif; background: #0f1e2e; color: #fff; min-height: 100vh; padding-top: 72px; }

  /* Secondary tab nav — like ServiceNow product page */
  .fdp-subnav {
    position: sticky; top: 72px; z-index: 90;
    background: #0f1e2e; border-bottom: 1px solid rgba(255,255,255,0.08);
    overflow-x: auto; scrollbar-width: none;
  }
  .fdp-subnav::-webkit-scrollbar { display: none; }
  .fdp-subnav-inner {
    max-width: 1280px; margin: 0 auto; padding: 0 40px;
    display: flex; gap: 0; min-width: max-content;
  }
  .fdp-subnav-tab {
    padding: 16px 20px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.55);
    background: none; border: none; cursor: pointer; font-family: inherit;
    border-bottom: 3px solid transparent; transition: all 0.18s; white-space: nowrap;
  }
  .fdp-subnav-tab:hover { color: rgba(255,255,255,0.85); }
  .fdp-subnav-tab.active { color: #fff; font-weight: 700; border-bottom-color: #1EB980; }

  /* Hero — two column like ServiceNow */
  .fdp-hero {
    background: linear-gradient(155deg, #091e0e 0%, #0f3222 30%, #145228 55%, #1b6838 75%, #1EB980 100%);
    padding: 64px 0 72px; position: relative; overflow: hidden;
  }
  .fdp-hero-inner {
    max-width: 1280px; margin: 0 auto; padding: 0 40px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
  }
  @media(max-width:900px){ .fdp-hero-inner { grid-template-columns: 1fr; } }
  .fdp-hero-label { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: rgba(255,255,255,0.6); margin-bottom: 16px; text-transform: uppercase; }
  .fdp-hero-h1 { font-size: clamp(36px,5vw,64px); font-weight: 800; letter-spacing: -1.5px; margin: 0 0 20px; line-height: 1.05; color: #fff; }
  .fdp-hero-desc { font-size: 18px; color: rgba(255,255,255,0.82); line-height: 1.7; margin: 0 0 36px; font-weight: 400; }
  .fdp-hero-btns { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
  .fdp-hero-cta { padding: 13px 28px; background: #1EB980; color: #fff; border: none; border-radius: 999px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .fdp-hero-cta:hover { background: #17a46f; transform: translateY(-1px); }
  .fdp-hero-ghost { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.85); background: none; border: none; cursor: pointer; font-family: inherit; transition: all 0.18s; }
  .fdp-hero-ghost:hover { color: #fff; gap: 10px; }
  /* Right visual card */
  .fdp-hero-visual {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
    border-radius: 20px; overflow: hidden; padding: 4px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.3);
  }
  .fdp-hero-visual-inner {
    background: #0f1e2e; border-radius: 17px; padding: 20px; min-height: 280px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .fdp-vis-topbar { display: flex; gap: 5px; margin-bottom: 8px; }
  .fdp-vis-dot { width: 10px; height: 10px; border-radius: 50%; }
  .fdp-vis-row { background: rgba(255,255,255,0.06); border-radius: 10px; padding: 11px 14px; display: flex; align-items: center; gap: 10px; }
  .fdp-vis-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .fdp-vis-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); }
  .fdp-vis-sub { font-size: 10px; color: rgba(255,255,255,0.38); margin-top: 1px; }
  .fdp-vis-badge { margin-left: auto; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }

  .fdp-body { max-width: 1280px; margin: 0 auto; padding: 48px 40px 80px; position: relative; z-index: 2; }

  .fdp-module { margin-bottom: 48px; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; background: #1a3654; }
  .fdp-module-header {
    display: flex; align-items: center; gap: 16px;
    padding: 24px 28px; cursor: pointer;
    background: rgba(255,255,255,0.02); transition: background 0.2s;
    border: none; width: 100%; text-align: left; font-family: inherit;
  }
  .fdp-module-header:hover { background: rgba(30,185,128,0.06); }
  .fdp-module-icon { width: 48px; height: 48px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .fdp-module-info { flex: 1; }
  .fdp-module-name { font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 3px; }
  .fdp-module-tagline { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; }
  .fdp-module-arrow { font-size: 12px; color: rgba(255,255,255,0.3); transition: transform 0.3s; }
  .fdp-module-arrow.open { transform: rotate(180deg); }

  .fdp-module-body { border-top: 1px solid rgba(255,255,255,0.06); overflow: hidden; transition: max-height 0.4s ease; }
  .fdp-module-content { padding: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  @media(max-width:700px){ .fdp-module-content { grid-template-columns: 1fr; } }

  .fdp-about { font-size: 14px; color: rgba(255,255,255,0.72); line-height: 1.75; }
  .fdp-feat-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; margin: 0 0 14px; }
  .fdp-feat-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 7px; }
  .fdp-feat-item { display: flex; align-items: flex-start; gap: 9px; font-size: 13px; color: rgba(255,255,255,0.72); }
  .fdp-check { width: 18px; height: 18px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; margin-top: 1px; }

  .fdp-cta { padding: 60px 40px; background: #0f1e2e; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; position: relative; z-index: 2; }
  .fdp-cta h2 { font-size: 28px; font-weight: 800; margin: 0 0 10px; }
  .fdp-cta p { font-size: 15px; color: rgba(255,255,255,0.45); margin: 0 0 28px; }
  .fdp-cta-btns { display: flex; gap: 12px; justify-content: center; }

  .fdp-related-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
  .fdp-cta-btns-row { display: flex; gap: 12px; flex-wrap: wrap; }

  @media(max-width:900px){
    .fdp-hero-inner { padding: 0 20px; grid-template-columns: 1fr; }
    .fdp-body { padding: 20px 20px 60px; }
    .fdp-related-grid { grid-template-columns: 1fr; gap: 32px; padding: 0 20px; }
    .fdp-subnav-inner { padding: 0 16px; }
    .fdp-hero { padding: 48px 0 56px; }
  }
  @media(max-width:600px){
    .fdp-hero-inner { padding: 0 16px; }
    .fdp-body { padding: 16px 16px 48px; }
    .fdp-cta { padding: 40px 16px; }
    .fdp-cta-btns-row { flex-direction: column; }
  }
  @media(max-width:480px){
    .fdp-module-content { padding: 20px 16px; }
    .fdp-module-header { padding: 18px 16px; }
  }
`;

export default function FeatureDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const group = GROUPS[slug];
  const [openIdx, setOpenIdx] = useState(null);
  const modulesRef = useRef(null);

  const handleTabClick = (i) => {
    setOpenIdx(i);
    setTimeout(() => {
      if (modulesRef.current) {
        modulesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  if (!group) {
    return (
      <div style={{ background: '#0f1e2e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>Page not found</h2>
        <button onClick={() => navigate('/')} style={{ padding: '10px 22px', background: '#1EB980', border: 'none', borderRadius: 999, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>← Back to Home</button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Feature Details - Unified CRM"
        description="Explore detailed CRM features. Learn about lead management, contact tracking, sales automation, and more capabilities."
        url="https://unifiedcrm.texora.ai/feature"
        keywords="CRM feature details, feature guide, capability overview, feature documentation"
      />
      <div className="fdp">
      <style>{CSS}</style>

      <SharedHeader />

      {/* SECONDARY TAB NAV — like ServiceNow product page */}
      <div className="fdp-subnav">
        <div className="fdp-subnav-inner">
          {group.modules.map((m, i) => (
            <button key={i} className={`fdp-subnav-tab${openIdx === i ? ' active' : ''}`}
              onClick={() => handleTabClick(i)}>
              {m.icon} {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* HERO — two column like image #33 */}
      <section className="fdp-hero">
        <div className="fdp-hero-inner">
          {/* Left: text */}
          <div>
            <div className="fdp-hero-label">INTRODUCING</div>
            <h1 className="fdp-hero-h1">{group.modules[openIdx]?.name || group.title}</h1>
            <p className="fdp-hero-desc">{group.modules[openIdx]?.tagline || group.desc}</p>
            <div className="fdp-hero-btns">
              <button className="fdp-hero-cta" onClick={() => navigate('/contact')}>Contact Us</button>
              <button className="fdp-hero-ghost" onClick={() => navigate('/register')}>
                Start Free Trial <span style={{ fontSize: 18 }}>→</span>
              </button>
            </div>
          </div>
          {/* Right: visual card */}
          <div className="fdp-hero-visual">
            <div className="fdp-hero-visual-inner">
              <div className="fdp-vis-topbar">
                <div className="fdp-vis-dot" style={{ background: '#ef4444' }} />
                <div className="fdp-vis-dot" style={{ background: '#f59e0b' }} />
                <div className="fdp-vis-dot" style={{ background: '#1EB980' }} />
                <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginLeft: 8 }} />
              </div>
              {group.modules.slice(0, 4).map((m, i) => (
                <div key={i} className="fdp-vis-row">
                  <div className="fdp-vis-icon" style={{ background: `${m.color}20` }}>{m.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="fdp-vis-label">{m.name}</div>
                    <div className="fdp-vis-sub">{m.tagline}</div>
                  </div>
                  <div className="fdp-vis-badge" style={{ background: `${m.color}20`, color: m.color }}>
                    {i === 0 ? 'Active' : i === 1 ? 'Running' : i === 2 ? 'New' : 'Live'}
                  </div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 4 }}>
                {[{l:'Total',v:'25+'},{l:'Active',v:'18'},{l:'Growth',v:'+34%'}].map((s,i)=>(
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1EB980' }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <div className="fdp-body" ref={modulesRef} style={{scrollMarginTop: '80px'}}>
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

      {/* Related links + CTA — like ServiceNow Image #36 */}
      <div style={{ background: '#162e48', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '60px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }} className="fdp-related-grid">
          {/* Related links */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' }}>Related links</div>
            {group.modules.map((m, i) => (
              <button key={i} onClick={() => navigate(`/feature/${Object.keys(GROUPS).find(k=>GROUPS[k].title===group.title)||'lead-management'}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', width: '100%', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontFamily: 'inherit', color: '#1EB980', fontSize: 14, fontWeight: 500, transition: 'gap 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.gap='12px'} onMouseLeave={e=>e.currentTarget.style.gap='8px'}>
                {m.icon} {m.name} <span style={{ marginLeft: 'auto', fontSize: 16 }}>→</span>
              </button>
            ))}
          </div>
          {/* CTA */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' }}>Get Started</div>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.5px' }}>
              Ready to use <span style={{ color: '#1EB980' }}>{group.title}</span>?
            </h3>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 28px' }}>
              Start your free trial today. No credit card required. Set up in minutes.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')} style={{ padding: '12px 28px', fontSize: 15, fontWeight: 600, color: '#fff', background: '#1EB980', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit' }}>
                Start Free Trial →
              </button>
              <button onClick={() => navigate('/contact')} style={{ padding: '12px 24px', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.8)', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit' }}>
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>

      <SharedFooter />
    </div>
    </>
  );
}
