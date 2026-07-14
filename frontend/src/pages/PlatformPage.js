import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import SEO from '../components/SEO';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; overflow-x: hidden; background: #0f1e2e; }
  .plat { font-family: 'Inter',-apple-system,sans-serif; background: #0f1e2e; color:#fff; min-height:100vh; padding-top:72px; }

  .plat-subnav {
    position: sticky; top: 72px; z-index: 90;
    background: #0f1e2e; border-bottom: 1px solid rgba(255,255,255,0.08);
    overflow-x: auto; scrollbar-width: none;
  }
  .plat-subnav::-webkit-scrollbar { display: none; }
  .plat-subnav-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; display: flex; gap: 0; min-width: max-content; }
  .plat-tab { padding: 16px 22px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.5); background: none; border: none; cursor: pointer; font-family: inherit; border-bottom: 3px solid transparent; transition: all 0.18s; white-space: nowrap; }
  .plat-tab:hover { color: rgba(255,255,255,0.85); }
  .plat-tab.active { color: #fff; font-weight: 700; border-bottom-color: #1EB980; }

  .plat-hero { padding: 88px 0 80px; text-align: center; position: relative; background: linear-gradient(180deg,#091e0e 0%,#0f1e2e 100%); overflow: hidden; }
  .plat-hero-label { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.45); margin-bottom: 20px; letter-spacing: 0.5px; }
  .plat-hero-title { font-size: clamp(40px,6vw,80px); font-weight: 900; line-height: 1.04; letter-spacing: -2px; margin: 0 0 22px; }
  .plat-hero-title .green { color: #1EB980; }
  .plat-hero-desc { font-size: 20px; color: rgba(255,255,255,0.62); max-width: 580px; margin: 0 auto 40px; line-height: 1.65; font-weight: 400; }
  .plat-hero-btns { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
  .plat-cta { padding: 14px 30px; background: #1EB980; color: #fff; border: none; border-radius: 999px; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .plat-cta:hover { background: #17a46f; transform: translateY(-1px); }
  .plat-ghost { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.78); background: none; border: none; cursor: pointer; font-family: inherit; transition: all 0.18s; }
  .plat-ghost:hover { color: #fff; gap: 12px; }

  /* Architecture */
  .arch-outer { max-width: 1100px; margin: 0 auto; padding: 64px 40px; }
  .arch-box { border: 1px solid rgba(255,255,255,0.12); border-radius: 28px; overflow: hidden; box-shadow: 0 8px 60px rgba(0,0,0,0.45); }
  .arch-row { padding: 14px 28px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; background: rgba(255,255,255,0.01); }
  .arch-pill { padding: 7px 18px; border: 1px solid rgba(255,255,255,0.14); border-radius: 999px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.65); white-space: nowrap; }
  .arch-pill.hi { background: #1EB980; border-color: #1EB980; color: #fff; font-weight: 700; }
  .arch-pill.dim { color: rgba(255,255,255,0.35); border-color: rgba(255,255,255,0.07); }
  .arch-modules { display: grid; grid-template-columns: repeat(8,1fr); gap: 8px; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.01); }
  .arch-mod { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 6px; text-align: center; font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 500; line-height: 1.4; }
  .arch-mod-icon { font-size: 18px; display: block; margin-bottom: 4px; }
  .arch-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; }
  .arch-card { padding: 40px 28px; text-align: center; position: relative; }
  .arch-card + .arch-card { border-left: 1px solid rgba(255,255,255,0.08); }
  .arch-card-num { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 1px; margin-bottom: 10px; }
  .arch-card-title { font-size: 42px; font-weight: 900; color: #fff; margin-bottom: 14px; letter-spacing: -1px; }
  .arch-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid rgba(255,255,255,0.2); color: #fff; background: rgba(255,255,255,0.1); }
  .arch-secure { background: linear-gradient(135deg,#052e16,#064e3b,#065f46,#047857); padding: 28px; text-align: center; }
  .arch-secure-title { font-size: 38px; font-weight: 900; color: #fff; margin-bottom: 10px; }
  .arch-int-row { padding: 16px 28px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.07); }
  .arch-int { padding: 5px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.55); }
  .arch-base { background: linear-gradient(90deg,#059669,#1EB980,#34d399); padding: 20px; text-align: center; }
  .arch-base-text { font-size: 16px; font-weight: 900; color: #fff; letter-spacing: 3px; text-transform: uppercase; }

  /* Tabs section */
  .tab-sec { background: #162e48; padding: 88px 0; }
  .tab-sec-inner { max-width: 1280px; margin: 0 auto; padding: 0 40px; }
  .tab-sec-head { text-align: center; margin-bottom: 52px; }
  .tab-sec-title { font-size: clamp(28px,4vw,48px); font-weight: 800; color: #fff; margin: 0 0 14px; letter-spacing: -1px; }
  .tab-sec-sub { font-size: 18px; color: rgba(255,255,255,0.5); max-width: 520px; margin: 0 auto; line-height: 1.65; }
  .tab-pills { display: flex; background: #0f1e2e; border-radius: 999px; padding: 4px; margin-bottom: 48px; max-width: 520px; margin-left: auto; margin-right: auto; }
  .tab-pill { flex: 1; padding: 11px 16px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.45); background: none; border: none; border-radius: 999px; cursor: pointer; font-family: inherit; transition: all 0.2s; text-align: center; white-space: nowrap; }
  .tab-pill.active { background: #fff; color: #111111; }
  .tab-body { background: #0f1e2e; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 52px; display: grid; grid-template-columns: 1fr 1fr; gap: 52px; align-items: center; }
  @media(max-width:800px){ .tab-body { grid-template-columns:1fr; padding:28px; } }
  .plat-subcontent-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .plat-bottom-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .plat-bottom-cta { padding: 80px 40px; }
  .plat-subcontent-wrapper { padding: 0 40px; }

  @media(max-width:1024px){
    .plat-subcontent-grid { grid-template-columns: repeat(2,1fr); }
  }
  @media(max-width:768px){
    .plat-subnav-inner { padding: 0 16px; }
    .arch-outer { padding: 32px 20px; }
    .arch-modules { grid-template-columns: repeat(4,1fr); }
    .arch-cards { grid-template-columns: 1fr; }
    .arch-card + .arch-card { border-left: none; border-top: 1px solid rgba(255,255,255,0.08); }
    .arch-row { padding: 12px 16px; }
    .arch-int-row { padding: 12px 16px; }
    .plat-float { display: none; }
    .tab-sec-inner { padding: 0 20px; }
    .prod-inner { padding: 0 20px; }
    .prod-grid { grid-template-columns: 1fr; }
    .plat-subcontent-grid { grid-template-columns: 1fr; }
    .plat-hero { padding: 60px 0 56px; }
    .plat-bottom-cta { padding: 60px 20px; }
    .plat-subcontent-wrapper { padding: 0 20px; }
  }
  @media(max-width:480px){
    .arch-modules { grid-template-columns: repeat(4,1fr); gap:6px; padding:12px; }
    .arch-mod { padding: 8px 4px; font-size: 10px; }
    .arch-mod-icon { font-size: 14px; }
    .plat-hero-btns { flex-direction: column; align-items: center; }
    .tab-pills { flex-direction: row; flex-wrap: wrap; }
    .tab-pill { padding: 9px 12px; font-size: 13px; }
    .plat-bottom-cta { padding: 48px 16px; }
    .plat-subcontent-wrapper { padding: 0 16px; }
    .tab-body { padding: 20px 16px; }
  }
  .tab-label { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.35); letter-spacing: 2px; margin-bottom: 14px; text-transform: uppercase; }
  .tab-title { font-size: clamp(24px,3vw,38px); font-weight: 800; color: #fff; margin: 0 0 18px; letter-spacing: -0.5px; line-height: 1.2; }
  .tab-desc { font-size: 16px; color: rgba(255,255,255,0.6); line-height: 1.75; margin: 0 0 28px; }
  .tab-btn { padding: 12px 26px; background: transparent; color: #1EB980; border: 2px solid #1EB980; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .tab-btn:hover { background: #1EB980; color: #fff; }
  .tab-links-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 1px; margin: 28px 0 10px; text-transform: uppercase; }
  .tab-link { display: flex; align-items: center; padding: 10px 0; color: #1EB980; font-size: 14px; font-weight: 500; background: none; border: none; border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer; font-family: inherit; width: 100%; transition: all 0.15s; }
  .tab-link:hover { color: #4ade80; }
  .tab-link span { margin-left: auto; font-size: 16px; }
  .tab-screenshot { background: #0a1622; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 18px; box-shadow: 0 8px 40px rgba(0,0,0,0.4); }
  .ts-topbar { display: flex; gap: 5px; margin-bottom: 14px; align-items: center; }
  .ts-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .ts-bar { flex: 1; height: 7px; background: rgba(255,255,255,0.06); border-radius: 4px; margin-left: 8px; }
  .ts-row { background: rgba(255,255,255,0.05); border-radius: 10px; padding: 10px 13px; margin-bottom: 7px; display: flex; align-items: center; gap: 10px; }
  .ts-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
  .ts-t { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); }
  .ts-s { font-size: 10px; color: rgba(255,255,255,0.38); margin-top: 1px; }
  .ts-b { margin-left: auto; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
  .ts-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; margin-top: 10px; }
  .ts-stat { background: rgba(255,255,255,0.04); border-radius: 10px; padding: 10px; text-align: center; }

  /* Products */
  .prod-sec { background: #0f1e2e; padding: 88px 0; }
  .prod-inner { max-width: 1280px; margin: 0 auto; padding: 0 40px; }
  .prod-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 24px; margin-top: 52px; }
  @media(max-width:768px){ .prod-grid { grid-template-columns: 1fr; } }
  .prod-card { background: #1a3654; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; overflow: hidden; cursor: pointer; transition: all 0.3s; }
  .prod-card:hover { transform: translateY(-4px); border-color: rgba(30,185,128,0.3); box-shadow: 0 16px 48px rgba(0,0,0,0.3); }
  .prod-ss { height: 230px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid rgba(255,255,255,0.06); overflow: hidden; }
  .prod-body { padding: 32px; }
  .prod-title { font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 12px; text-align: center; }
  .prod-desc { font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.7; text-align: center; margin: 0 0 22px; }
  .prod-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 26px; background: transparent; color: rgba(255,255,255,0.75); border: 1.5px solid rgba(255,255,255,0.2); border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; margin: 0 auto; transition: all 0.2s; }
  .prod-btn:hover { border-color: #1EB980; color: #1EB980; }

  .plat-float { position: fixed; right: 24px; bottom: 100px; display: flex; flex-direction: column; gap: 10px; z-index: 200; }
  .plat-float-btn { display: flex; align-items: center; gap: 8px; padding: 11px 18px; background: #1EB980; color: #fff; border: none; border-radius: 999px; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; box-shadow: 0 4px 20px rgba(30,185,128,0.4); transition: all 0.2s; }
  .plat-float-btn:hover { background: #17a46f; transform: translateY(-2px); }
`;

const SUB_TABS = ['Platform Overview','Sales CRM','B2B Operations','AI & Automation','SaaS Management','Security & Access'];

const SUB_HERO = {
  'Platform Overview': {
    label: 'Unified CRM Platform',
    title: <><span className="green">The complete business platform</span><br/>for modern B2B teams</>,
    desc: 'Capture every signal, make AI-powered decisions, execute workflows end-to-end, and secure everything — on a single connected platform.',
    cta: 'Start Free Trial', ghost: 'Schedule a Demo →',
  },
  'Sales CRM': {
    label: 'Sales & Revenue',
    title: <><span className="green">Close more deals,</span><br/>faster than ever</>,
    desc: 'Full-stack sales CRM with lead pipeline, contact management, opportunity tracking, and AI-powered revenue forecasting — all in one place.',
    cta: 'Explore Sales CRM', ghost: 'View Pipeline Demo →',
  },
  'B2B Operations': {
    label: 'B2B Document Workflow',
    title: <><span className="green">From inquiry to invoice</span><br/>fully automated</>,
    desc: 'Complete RFI → Quotation → Purchase Order → Invoice workflow with PDF generation, multi-level approval flows, and payment tracking.',
    cta: 'Explore B2B Workflow', ghost: 'See Document Flow →',
  },
  'AI & Automation': {
    label: 'Gemini AI Powered',
    title: <><span className="green">AI that works for you,</span><br/>not the other way</>,
    desc: 'Gemini-powered AI that scores leads, drafts emails, routes tickets, predicts revenue, and recommends next-best-actions automatically.',
    cta: 'Explore AI Features', ghost: 'See AI in Action →',
  },
  'SaaS Management': {
    label: 'Multi-Tenant Architecture',
    title: <><span className="green">Scale your SaaS business</span><br/>without limits</>,
    desc: 'Complete multi-tenant SaaS with 100% data isolation, white-label branding, reseller partner program, and subscription billing engine.',
    cta: 'Explore SaaS Platform', ghost: 'View Tenant Demo →',
  },
  'Security & Access': {
    label: 'Enterprise Security',
    title: <><span className="green">Enterprise-grade security</span><br/>at every layer</>,
    desc: 'Role-based access control, field-level permissions, AES-256 encryption, complete audit trails, and 100% tenant isolation — zero compromise.',
    cta: 'Explore Security', ghost: 'View Compliance Docs →',
  },
};

const SUB_CONTENT = {
  'Sales CRM': {
    heading: 'Everything your sales team needs',
    subheading: 'From the first lead to the closed deal — manage your entire sales motion in Unified CRM.',
    modules: [
      { icon: '📋', t: 'Lead Management', d: 'Capture, qualify, and convert leads with bulk import, smart assignment, and Kanban pipeline.', slug: 'lead-management' },
      { icon: '👥', t: 'Contacts & Accounts', d: 'Complete B2B contact profiles with relationship mapping, activity history, and org hierarchy.', slug: 'lead-management' },
      { icon: '💼', t: 'Opportunities', d: 'Sales pipeline with stage tracking, probability scoring, and weighted revenue forecasting.', slug: 'lead-management' },
      { icon: '✉️', t: 'Email Inbox', d: 'Built-in IMAP email with real-time open/click tracking and auto-linking to CRM entities.', slug: 'task-management' },
      { icon: '📞', t: 'Calls & Meetings', d: 'Log calls, schedule meetings, and track outcomes with automatic follow-up task creation.', slug: 'task-management' },
      { icon: '📊', t: 'Data Center', d: 'Global prospect database with advanced filtering, bulk operations, and smart deduplication.', slug: 'lead-management' },
    ],
  },
  'B2B Operations': {
    heading: 'End-to-end B2B document workflow',
    subheading: 'Every business document — from the first RFI to the final invoice — managed and automated.',
    modules: [
      { icon: '📄', t: 'RFI Management', d: 'Create and track requests for information with vendor response management and conversion tracking.', slug: 'sales-finance' },
      { icon: '💰', t: 'Quotation Builder', d: 'Professional quotations with line items, GST/tax config, discounts, and one-click PDF export.', slug: 'sales-finance' },
      { icon: '📦', t: 'Purchase Orders', d: 'Generate POs from approved quotations with multi-level approval workflow and vendor tracking.', slug: 'sales-finance' },
      { icon: '🧾', t: 'Invoice Management', d: 'Create invoices with payment status tracking, reminders, and complete audit trail.', slug: 'sales-finance' },
      { icon: '📑', t: 'Document Templates', d: 'Reusable templates with dynamic variable substitution for all document types.', slug: 'automation' },
      { icon: '📦', t: 'Product Catalog', d: 'Manage products with categories, multi-tier pricing, images, and marketplace listing.', slug: 'product' },
    ],
  },
  'AI & Automation': {
    heading: 'AI working across every module',
    subheading: 'Gemini AI is embedded into every workflow — scoring, drafting, routing, and predicting in real time.',
    modules: [
      { icon: '🤖', t: 'AI Lead Scoring', d: 'Automatically score every lead 0-100% based on behavior, profile, and engagement signals.', slug: 'automation' },
      { icon: '💬', t: 'Email Draft Generator', d: 'AI writes personalized follow-up emails, proposals, and responses using your CRM context.', slug: 'automation' },
      { icon: '🎯', t: 'Smart Auto-Assignment', d: 'Route leads and tickets to the best team member based on skills, workload, and history.', slug: 'automation' },
      { icon: '📊', t: 'Revenue Forecasting', d: 'AI-powered revenue predictions with confidence scores based on your pipeline and historical data.', slug: 'automation' },
      { icon: '💬', t: 'Sentiment Analysis', d: 'Automatically detect customer sentiment in feedback, emails, and support tickets.', slug: 'support' },
      { icon: '📑', t: 'Document AI', d: 'Auto-fill templates, extract key data from uploaded documents, and generate summaries.', slug: 'automation' },
    ],
  },
  'SaaS Management': {
    heading: 'Built for SaaS companies at scale',
    subheading: 'Everything you need to run, grow, and manage a multi-tenant SaaS business.',
    modules: [
      { icon: '🏢', t: 'Multi-Tenant Isolation', d: '100% data separation per tenant with white-label branding and custom domain support.', slug: 'monetization' },
      { icon: '💳', t: 'Subscription & Billing', d: 'Create plans, manage trials, handle upgrades/downgrades, and automate billing with Razorpay.', slug: 'monetization' },
      { icon: '🤝', t: 'Reseller Program', d: 'Multi-tier reseller network with commission tracking, partner dashboards, and payout management.', slug: 'monetization' },
      { icon: '👨‍💼', t: 'Users & Roles', d: 'Granular RBAC with custom roles, group permissions, and field-level visibility controls.', slug: 'access-management' },
      { icon: '🏛️', t: 'Org Hierarchy', d: 'Visual org chart builder with custom node types, role templates, and department mapping.', slug: 'access-management' },
      { icon: '🔧', t: 'Field Customization', d: 'No-code custom fields for any entity — 8+ field types with drag-and-drop ordering.', slug: 'access-management' },
    ],
  },
  'Security & Access': {
    heading: 'Security built into every layer',
    subheading: 'Enterprise-grade protection with zero-trust architecture, full audit visibility, and compliance tools.',
    modules: [
      { icon: '🔒', t: 'Role-Based Access', d: 'Define granular roles with module-level create/read/update/delete permissions per user.', slug: 'access-management' },
      { icon: '📋', t: 'Audit & Activity Logs', d: 'Every action logged with who, what, when, IP address, and before/after field values.', slug: 'access-management' },
      { icon: '🏢', t: 'Tenant Data Isolation', d: '100% data separation — each tenant\'s data is fully isolated with no cross-tenant access.', slug: 'monetization' },
      { icon: '🛡️', t: 'Field-Level Encryption', d: 'Sensitive fields encrypted at rest with AES-256. Data protected in transit with TLS 1.3.', slug: 'access-management' },
      { icon: '🔑', t: 'SSO & OAuth', d: 'Google OAuth, SSO integration, and secure session management with automatic token refresh.', slug: 'access-management' },
      { icon: '🔔', t: 'Security Alerts', d: 'Real-time alerts for suspicious logins, bulk exports, permission changes, and failed access.', slug: 'access-management' },
    ],
  },
};

const CAPTURE_DECIDE_EXECUTE = {
  Capture: {
    label: 'DATA CAPTURE',
    title: 'Every lead, signal & interaction — in one place',
    desc: 'Connect all your touchpoints — emails, calls, forms, social media, and web — into a single unified data layer. No more switching between tools.',
    links: ['Lead Management', 'Email Inbox with IMAP', 'Data Center & Prospects', 'Social Media Hub'],
    rows: [
      { icon: '📧', t: 'New email synced — TechCorp', s: 'IMAP · Gmail connected', bc: '#1EB980', b: 'Synced' },
      { icon: '📋', t: 'Lead captured — Rahul Mehta', s: 'Source: Web Form · Score: 89%', bc: '#f59e0b', b: 'New' },
      { icon: '📞', t: 'Call logged — 12 min', s: 'Priya S. · Outcome: Interested', bc: '#38bdf8', b: 'Done' },
      { icon: '🌐', t: 'Social mention captured', s: 'LinkedIn · Sentiment: Positive', bc: '#1EB980', b: 'AI' },
    ],
    stats: [{l:'Leads',v:'342'},{l:'Emails',v:'1.2K'},{l:'Calls',v:'89'}],
  },
  Analyze: {
    label: 'AI INTELLIGENCE',
    title: 'AI-powered scoring, routing & recommendations',
    desc: 'Unified CRM\'s Gemini AI engine automatically scores leads, routes support tickets, drafts follow-up emails, and suggests next-best-actions — all in real time.',
    links: ['AI Lead Scoring', 'Smart Auto-Assignment', 'Email Draft Generator', 'Sentiment Analysis'],
    rows: [
      { icon: '🤖', t: 'Lead score: TechCorp — 92%', s: 'High intent · Recommend: Call today', bc: '#a78bfa', b: 'AI' },
      { icon: '💬', t: 'Email draft ready to send', s: 'Subject: Following up on your demo', bc: '#1EB980', b: 'Draft' },
      { icon: '🎯', t: 'Ticket routed → Priya S.', s: 'Best match: Enterprise support', bc: '#38bdf8', b: 'Routed' },
      { icon: '📊', t: 'Revenue forecast: ₹14L', s: 'Confidence: 86% · 12 open deals', bc: '#f59e0b', b: 'AI' },
    ],
    stats: [{l:'AI Actions',v:'284'},{l:'Accuracy',v:'91%'},{l:'Time Saved',v:'6hr/day'}],
  },
  Execute: {
    label: 'WORKFLOW EXECUTION',
    title: 'Close deals, resolve tickets & process invoices',
    desc: 'From generating a quotation to closing a deal, resolving a support ticket, or processing an invoice — Unified CRM automates the entire workflow with zero manual effort.',
    links: ['B2B Sales Workflow', 'Support Ticket Resolution', 'Invoice & Payment Tracking', 'Document Templates'],
    rows: [
      { icon: '📄', t: 'Quotation auto-generated', s: 'QT-2024-089 · TechCorp · ₹4.2L', bc: '#1EB980', b: 'Sent' },
      { icon: '🧾', t: 'Invoice created & emailed', s: 'INV-2024-203 · Payment pending', bc: '#38bdf8', b: 'Active' },
      { icon: '🎫', t: 'Ticket resolved via AI', s: 'SLA met · Customer notified', bc: '#1EB980', b: 'Closed' },
      { icon: '✅', t: 'Follow-up task scheduled', s: 'Reminder: 3 days · Assigned: Rahul', bc: '#f59e0b', b: 'Set' },
    ],
    stats: [{l:'Deals Closed',v:'₹48L'},{l:'Tickets',v:'94% SLA'},{l:'Invoices',v:'203'}],
  },
  Protect: {
    label: 'SECURITY & COMPLIANCE',
    title: 'Enterprise-grade security at every layer',
    desc: 'Role-based access control, field-level permissions, 100% tenant data isolation, complete audit trails, and session management — your data is always protected.',
    links: ['Role-Based Access Control', 'Complete Audit Logs', 'Multi-Tenant Isolation', 'Field-Level Permissions'],
    rows: [
      { icon: '🔒', t: 'RBAC: 5 roles configured', s: 'Admin, Manager, Sales, Support, View', bc: '#1EB980', b: 'Active' },
      { icon: '📋', t: 'Audit log — 1,847 events today', s: 'All changes tracked with IP & timestamp', bc: '#38bdf8', b: 'Live' },
      { icon: '🏢', t: 'Tenant isolated: AcmeCorp', s: '100% data separation enforced', bc: '#1EB980', b: 'Secure' },
      { icon: '🛡️', t: 'Encryption: AES-256', s: 'At rest & in transit · Certified', bc: '#f59e0b', b: 'On' },
    ],
    stats: [{l:'Tenants',v:'48'},{l:'Uptime',v:'99.9%'},{l:'Events',v:'1.8K/day'}],
  },
};

const PRODUCTS = [
  {
    title: 'AI Assistant',
    desc: 'Gemini-powered AI that drafts emails, scores leads, predicts revenue, and delivers smart recommendations — directly inside your CRM.',
    slug: 'automation', color: '#f59e0b',
    bg: 'linear-gradient(145deg,#1a160a,#241c0e)',
    rows: [
      { icon: '🤖', t: '✦ Hi Priya, what can I help with?', s: 'Ask Claude to search for anything' },
      { icon: '💬', t: 'Draft: Follow-up email — TechCorp', s: 'Deal value ₹8.4L · 78% close prob.' },
      { icon: '📊', t: 'Revenue forecast: ₹14.2L this month', s: 'Confidence: 86% · 12 open deals' },
    ],
  },
  {
    title: 'Sales Pipeline',
    desc: 'Full-stack deal management with Kanban pipeline, stage tracking, bulk operations, and real-time revenue forecasting for your entire team.',
    slug: 'lead-management', color: '#1EB980',
    bg: 'linear-gradient(145deg,#0a1c14,#0f261a)',
    rows: [
      { icon: '🏢', t: 'TechCorp Ltd. — Proposal', s: '₹8.4L · Close: 14 May · 78% prob.' },
      { icon: '💼', t: 'GlobalTrade — Negotiation', s: '₹12L · Senior contact involved' },
      { icon: '🎯', t: 'StartupHub — Won ✓', s: '₹1.2L · Invoice sent · Payment pending' },
    ],
  },
  {
    title: 'B2B Document Workflow',
    desc: 'Complete RFI → Quotation → Purchase Order → Invoice workflow with one-click PDF generation, approval flows, and payment tracking.',
    slug: 'sales-finance', color: '#38bdf8',
    bg: 'linear-gradient(145deg,#0a1622,#0f1e2e)',
    rows: [
      { icon: '📄', t: 'RFI-089 → Quotation generated', s: 'TechVision · ₹4.2L · PDF sent' },
      { icon: '📦', t: 'PO-047 approved by manager', s: 'CloudBase Inc. · Processing' },
      { icon: '🧾', t: 'INV-203 paid — ₹2.8L received', s: 'SmartWork Corp · Reconciled ✓' },
    ],
  },
  {
    title: 'Multi-Tenant SaaS',
    desc: 'Complete SaaS infrastructure with 100% tenant data isolation, white-label branding, reseller program, and full SAAS admin control panel.',
    slug: 'monetization', color: '#a78bfa',
    bg: 'linear-gradient(145deg,#180a2a,#200e35)',
    rows: [
      { icon: '🏢', t: '48 tenants · MRR ₹4.2L', s: '+12% MoM · Churn: 1.2%' },
      { icon: '🤝', t: 'Reseller network: 12 partners', s: 'Commission disbursed: ₹84,000' },
      { icon: '📊', t: 'NPS Score: 72 · CSAT: 91%', s: 'All systems operational · 99.9%' },
    ],
  },
];

export default function PlatformPage() {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState('Platform Overview');
  const [activeCapability, setActiveCapability] = useState('Capture');
  const cap = CAPTURE_DECIDE_EXECUTE[activeCapability];
  const hero = SUB_HERO[activeSubTab] || SUB_HERO['Platform Overview'];
  const subContent = SUB_CONTENT[activeSubTab] || null;

  return (
    <>
      <SEO
        title="Platform Overview - Unified CRM"
        description="Explore the Unified CRM platform. Complete B2B solution with lead management, sales automation, analytics, and team collaboration."
        url="https://unifiedcrm.texora.ai/platform"
        keywords="CRM platform, B2B CRM, sales platform, lead management platform, business automation"
      />
      <div className="plat">
      <style>{CSS}</style>
      <SharedHeader />

      {/* Sub nav */}
      <div className="plat-subnav">
        <div className="plat-subnav-inner">
          {SUB_TABS.map(t => (
            <button key={t} className={`plat-tab${activeSubTab===t?' active':''}`} onClick={()=>setActiveSubTab(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Hero — dynamic based on sub-tab */}
      <section className="plat-hero">
        <div style={{ position:'absolute', width:900, height:600, top:-100, left:'50%', transform:'translateX(-50%)', background:'radial-gradient(ellipse,rgba(30,185,128,0.1) 0%,transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:2, padding:'0 40px' }}>
          <div className="plat-hero-label">{hero.label}</div>
          <h1 className="plat-hero-title">{hero.title}</h1>
          <p className="plat-hero-desc">{hero.desc}</p>
          <div className="plat-hero-btns">
            <button className="plat-cta" onClick={()=>navigate('/register')}>{hero.cta}</button>
            <button className="plat-ghost" onClick={()=>navigate('/contact')}>
              {hero.ghost}
            </button>
          </div>
        </div>
      </section>

      {/* Sub-tab specific module grid */}
      {subContent && (
        <div style={{ background:'#162e48', padding:'80px 0' }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }} className="plat-subcontent-wrapper">
            <div style={{ marginBottom:52 }}>
              <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:800, color:'#fff', margin:'0 0 14px', letterSpacing:'-1px' }}>{subContent.heading}</h2>
              <p style={{ fontSize:18, color:'rgba(255,255,255,0.55)', margin:0, maxWidth:600 }}>{subContent.subheading}</p>
            </div>
            <div className="plat-subcontent-grid">
              {subContent.modules.map((m,i) => (
                <div key={i} onClick={()=>navigate(`/feature/${m.slug}`)}
                  style={{ background:'#1a3654', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:'28px 24px', cursor:'pointer', transition:'all 0.25s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(30,185,128,0.35)'; e.currentTarget.style.transform='translateY(-4px)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.transform='translateY(0)'; }}>
                  <div style={{ width:46, height:46, borderRadius:13, background:'rgba(30,185,128,0.12)', border:'1px solid rgba(30,185,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16 }}>{m.icon}</div>
                  <div style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:8 }}>{m.t}</div>
                  <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.65, margin:'0 0 16px' }}>{m.d}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, fontWeight:600, color:'#1EB980' }}>
                    Learn more <span style={{fontSize:15}}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Architecture diagram */}
      <div className="arch-outer">
        <div className="arch-box">

          {/* Input channels */}
          <div className="arch-row">
            <span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:1,marginRight:4}}>INPUT CHANNELS</span>
            {['Email / IMAP','Phone Calls','Web Forms','Social Media','Live Chat','Documents','API / Webhooks'].map((c,i)=>(
              <div key={i} className={`arch-pill${i===3?' hi':''}`}>{c}</div>
            ))}
          </div>

          {/* CRM Modules grid */}
          <div className="arch-modules">
            {[
              {icon:'📋',name:'Leads'},{icon:'👥',name:'Contacts'},{icon:'🏢',name:'Accounts'},
              {icon:'💼',name:'Opportunities'},{icon:'📄',name:'Quotations'},{icon:'📦',name:'Orders'},
              {icon:'🧾',name:'Invoices'},{icon:'🎫',name:'Support'},{icon:'💬',name:'Feedback'},
              {icon:'🤖',name:'AI Assistant'},{icon:'📊',name:'Analytics'},{icon:'🌐',name:'Social'},
              {icon:'🔔',name:'Notifications'},{icon:'📑',name:'Templates'},{icon:'🏛️',name:'Org Chart'},{icon:'📈',name:'Audit Logs'},
            ].map((m,i)=>(
              <div key={i} className="arch-mod">
                <span className="arch-mod-icon">{m.icon}</span>
                {m.name}
              </div>
            ))}
          </div>

          {/* Category row */}
          <div className="arch-row">
            <span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:1,marginRight:4}}>BY FUNCTION</span>
            {['Sales CRM','B2B Finance','Customer Support','Team Management','SaaS & Billing','Automation'].map((c,i)=>(
              <div key={i} className={`arch-pill${i===2?' hi':''}`}>{c}</div>
            ))}
          </div>

          {/* 3 main capability cards */}
          <div className="arch-cards">
            <div className="arch-card" style={{background:'linear-gradient(145deg,#3730a3,#4f46e5,#6d28d9)'}}>
              <div className="arch-card-num">01</div>
              <div className="arch-card-title">Capture</div>
              <div className="arch-badge">✦ Any Data Source</div>
            </div>
            <div className="arch-card" style={{background:'linear-gradient(145deg,#5b21b6,#7c3aed,#0d9488)'}}>
              <div className="arch-card-num">02</div>
              <div className="arch-card-title">Analyze</div>
              <div className="arch-badge">✦ Gemini AI Model</div>
            </div>
            <div className="arch-card" style={{background:'linear-gradient(145deg,#0e7490,#0284c7,#1d4ed8)'}}>
              <div className="arch-card-num">03</div>
              <div className="arch-card-title">Execute</div>
              <div className="arch-badge">✦ Any Workflow</div>
            </div>
          </div>

          {/* Protect bar */}
          <div className="arch-secure">
            <div className="arch-secure-title">Protect</div>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 18px',borderRadius:999,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.25)',fontSize:12,fontWeight:700,color:'#fff'}}>
              ✦ RBAC · Encryption · Audit Logs · Tenant Isolation
            </div>
          </div>

          {/* Integrations */}
          <div className="arch-int-row">
            <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:1}}>INTEGRATIONS</div>
            {['Gmail','Outlook','Razorpay','Gemini AI','WhatsApp','Zapier','REST API','Slack','Any System'].map((s,i)=>(
              <div key={i} className="arch-int">{s}</div>
            ))}
          </div>

          {/* Base bar */}
          <div className="arch-base">
            <div className="arch-base-text">Unified CRM Platform</div>
          </div>
        </div>
      </div>

      {/* Architecture description */}
      <div style={{textAlign:'center',padding:'0 40px 80px',maxWidth:700,margin:'0 auto'}}>
        <h2 style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,color:'#fff',margin:'0 0 16px',letterSpacing:'-1px'}}>
          The Unified CRM Platform Architecture
        </h2>
        <p style={{fontSize:17,color:'rgba(255,255,255,0.52)',lineHeight:1.75,margin:0}}>
          Every module shares data, AI, and security — eliminating silos and giving your team a complete, connected view of every customer, deal, and workflow.
        </p>
      </div>

      {/* Capture / Analyze / Execute / Protect tabs */}
      <div className="tab-sec">
        <div className="tab-sec-inner">
          <div className="tab-sec-head">
            <h2 className="tab-sec-title">Four capabilities. One platform.</h2>
            <p className="tab-sec-sub">Each layer works together seamlessly — from capturing raw data to protecting every action.</p>
          </div>

          <div className="tab-pills">
            {['Capture','Analyze','Execute','Protect'].map(t=>(
              <button key={t} className={`tab-pill${activeCapability===t?' active':''}`} onClick={()=>setActiveCapability(t)}>{t}</button>
            ))}
          </div>

          <div className="tab-body">
            <div>
              <div className="tab-label">{cap.label}</div>
              <h3 className="tab-title">{cap.title}</h3>
              <p className="tab-desc">{cap.desc}</p>
              <button className="tab-btn" onClick={()=>navigate('/all-features')}>Explore Features</button>
              <div className="tab-links-title">Related capabilities</div>
              {cap.links.map((l,i)=>(
                <button key={i} className="tab-link" onClick={()=>navigate('/feature/lead-management')}>
                  {l} <span>→</span>
                </button>
              ))}
            </div>
            <div className="tab-screenshot">
              <div className="ts-topbar">
                <div className="ts-dot" style={{background:'#ef4444'}}/>
                <div className="ts-dot" style={{background:'#f59e0b'}}/>
                <div className="ts-dot" style={{background:'#1EB980'}}/>
                <div className="ts-bar"/>
              </div>
              {cap.rows.map((r,i)=>(
                <div key={i} className="ts-row">
                  <div className="ts-icon" style={{background:`${r.bc}18`}}>{r.icon}</div>
                  <div style={{flex:1}}>
                    <div className="ts-t">{r.t}</div>
                    <div className="ts-s">{r.s}</div>
                  </div>
                  <div className="ts-b" style={{background:`${r.bc}20`,color:r.bc}}>{r.b}</div>
                </div>
              ))}
              <div className="ts-grid">
                {cap.stats.map((s,i)=>(
                  <div key={i} className="ts-stat">
                    <div style={{fontSize:20,fontWeight:800,color:'#1EB980'}}>{s.v}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:2}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured capabilities grid */}
      <div className="prod-sec">
        <div className="prod-inner">
          <div style={{textAlign:'center'}}>
            <h2 style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,color:'#fff',margin:'0 0 14px',letterSpacing:'-1px'}}>Featured capabilities</h2>
            <p style={{fontSize:17,color:'rgba(255,255,255,0.5)',margin:0}}>The four modules that power your entire business operation.</p>
          </div>
          <div className="prod-grid">
            {PRODUCTS.map((p,i)=>(
              <div key={i} className="prod-card" onClick={()=>navigate(`/feature/${p.slug}`)}>
                <div className="prod-ss" style={{background:p.bg}}>
                  <div style={{width:'85%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:16}}>
                    <div style={{display:'flex',gap:5,marginBottom:12}}>
                      {['#ef4444','#f59e0b','#1EB980'].map((c,j)=>(<div key={j} style={{width:8,height:8,borderRadius:'50%',background:c}}/>))}
                    </div>
                    {p.rows.map((r,j)=>(
                      <div key={j} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'9px 10px',marginBottom:6}}>
                        <span style={{fontSize:15}}>{r.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.85)'}}>{r.t}</div>
                          <div style={{fontSize:10,color:'rgba(255,255,255,0.38)',marginTop:1}}>{r.s}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="prod-body">
                  <div className="prod-title">{p.title}</div>
                  <div className="prod-desc">{p.desc}</div>
                  <button className="prod-btn">Learn More →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{background:'#162e48',textAlign:'center'}} className="plat-bottom-cta">
        <h2 style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,color:'#fff',margin:'0 0 16px',letterSpacing:'-1px'}}>
          Build on the <span style={{color:'#1EB980'}}>Unified CRM Platform</span>
        </h2>
        <p style={{fontSize:18,color:'rgba(255,255,255,0.52)',margin:'0 0 36px'}}>
          Join 500+ businesses already running on Unified CRM.
        </p>
        <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={()=>navigate('/register')} style={{padding:'14px 32px',background:'#1EB980',color:'#fff',border:'none',borderRadius:999,fontSize:16,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',boxShadow:'0 4px 20px rgba(30,185,128,0.4)'}}>
            Start Free Trial →
          </button>
          <button onClick={()=>navigate('/contact')} style={{padding:'14px 32px',background:'transparent',color:'rgba(255,255,255,0.8)',border:'1.5px solid rgba(255,255,255,0.25)',borderRadius:999,fontSize:16,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Talk to an Expert
          </button>
        </div>
      </div>

      <div className="plat-float">
        <button className="plat-float-btn" onClick={()=>navigate('/contact')}>💬 Contact Us</button>
        <button className="plat-float-btn" onClick={()=>navigate('/demo')}>🖥 Demo</button>
      </div>

      <SharedFooter />
    </div>
    </>
  );
}
