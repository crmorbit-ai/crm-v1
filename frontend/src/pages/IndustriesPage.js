import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import SEO from '../components/SEO';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #0f1e2e; overflow-x: hidden; max-width: 100vw; }

  .ind { font-family: 'Inter', -apple-system, sans-serif; background: #0f1e2e; color: #fff; min-height: 100vh; padding-top: 72px; overflow-x: hidden; width: 100%; }

  /* ── Sticky Tab Bar ── */
  .ind-tabs {
    position: sticky; top: 72px; z-index: 90;
    background: #0f1e2e; border-bottom: 1px solid rgba(255,255,255,0.08);
    overflow-x: auto; scrollbar-width: none;
  }
  .ind-tabs::-webkit-scrollbar { display: none; }
  .ind-tabs-inner {
    max-width: 1440px; margin: 0 auto; padding: 0 40px;
    display: flex; gap: 0; min-width: max-content;
  }
  .ind-tab {
    padding: 16px 24px; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.5); background: none; border: none;
    cursor: pointer; font-family: inherit;
    border-bottom: 3px solid transparent; transition: all 0.18s; white-space: nowrap;
  }
  .ind-tab:hover { color: rgba(255,255,255,0.85); }
  .ind-tab.active { color: #fff; font-weight: 700; border-bottom-color: #1EB980; }

  /* ── Hero ── */
  .ind-hero {
    padding: 96px 0 88px; text-align: center; position: relative; overflow: hidden;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(30,185,128,0.18) 0%, transparent 60%),
      linear-gradient(180deg, #0b1e30 0%, #0f2840 35%, #0f1e2e 100%);
  }
  .ind-hero-inner { max-width: 820px; margin: 0 auto; padding: 0 32px; position: relative; z-index: 2; }
  .ind-hero-label {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(30,185,128,0.12); border: 1px solid rgba(30,185,128,0.28);
    border-radius: 999px; padding: 6px 18px; font-size: 11px; font-weight: 700;
    color: #1EB980; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 24px;
  }
  .ind-hero-title {
    font-size: clamp(38px, 6vw, 72px); font-weight: 900; line-height: 1.05;
    letter-spacing: -2px; margin: 0 0 22px;
  }
  .ind-hero-title .green { color: #1EB980; }
  .ind-hero-title .white { color: #fff; }
  .ind-hero-desc {
    font-size: 18px; color: rgba(255,255,255,0.62); max-width: 560px;
    margin: 0 auto 40px; line-height: 1.7; font-weight: 400;
  }
  .ind-hero-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 30px; background: #1EB980; color: #fff;
    border: none; border-radius: 999px; font-size: 15px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: all 0.22s;
    box-shadow: 0 4px 22px rgba(30,185,128,0.42);
  }
  .ind-hero-btn:hover { background: #17a46f; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(30,185,128,0.5); }
  .ind-hero-glow {
    position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
    width: 700px; height: 340px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(30,185,128,0.14) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── Section wrapper ── */
  .ind-section { max-width: 1440px; margin: 0 auto; padding: 80px 40px; }
  .ind-section-head { text-align: center; margin-bottom: 56px; }
  .ind-section-label {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(30,185,128,0.1); border: 1px solid rgba(30,185,128,0.25);
    border-radius: 999px; padding: 5px 16px; font-size: 11px; font-weight: 700;
    color: #1EB980; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px;
  }
  .ind-section-title {
    font-size: clamp(28px, 3.5vw, 46px); font-weight: 800; line-height: 1.1;
    letter-spacing: -1px; margin: 0 0 14px; color: #fff;
  }
  .ind-section-desc {
    font-size: 17px; color: rgba(255,255,255,0.55); line-height: 1.7;
    max-width: 520px; margin: 0 auto; font-weight: 400;
  }

  /* ── Industry Cards Grid ── */
  .ind-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  }
  .ind-card {
    background: #1a3654; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 22px; padding: 28px 24px; cursor: pointer;
    transition: all 0.28s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.18), 0 10px 36px rgba(0,0,0,0.12);
  }
  .ind-card:hover {
    transform: translateY(-4px);
    border-color: rgba(30,185,128,0.3);
    background: #1d3c5e;
    box-shadow: 0 8px 28px rgba(0,0,0,0.26), 0 0 0 1px rgba(30,185,128,0.12);
  }
  .ind-card-icon {
    font-size: 38px; margin-bottom: 16px; display: block; line-height: 1;
  }
  .ind-card-name {
    font-size: 17px; font-weight: 700; color: #fff; margin: 0 0 10px; line-height: 1.25;
  }
  .ind-card-desc {
    font-size: 13px; color: rgba(255,255,255,0.52); line-height: 1.65; margin: 0 0 20px;
  }
  .ind-card-link {
    font-size: 13px; font-weight: 700; color: #1EB980;
    display: inline-flex; align-items: center; gap: 5px;
    background: none; border: none; cursor: pointer; font-family: inherit;
    padding: 0; transition: gap 0.18s;
  }
  .ind-card:hover .ind-card-link { gap: 9px; }

  /* ── Customer Stories ── */
  .ind-stories-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
  }
  .ind-story-card {
    background: #1a3654; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px; padding: 36px 28px;
    transition: all 0.28s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.18);
    display: flex; flex-direction: column;
  }
  .ind-story-card:hover {
    transform: translateY(-4px);
    border-color: rgba(30,185,128,0.3);
    background: #1d3c5e;
  }
  .ind-story-company {
    font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.45);
    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;
  }
  .ind-story-stat {
    font-size: clamp(48px, 6vw, 72px); font-weight: 900;
    color: #1EB980; letter-spacing: -2px; line-height: 1; margin-bottom: 14px;
  }
  .ind-story-desc {
    font-size: 15px; color: rgba(255,255,255,0.65); line-height: 1.65;
    margin: 0 0 auto; flex: 1; padding-bottom: 24px;
  }
  .ind-story-link {
    font-size: 13px; font-weight: 700; color: #1EB980;
    display: inline-flex; align-items: center; gap: 5px;
    background: none; border: none; cursor: pointer; font-family: inherit;
    padding: 0; transition: gap 0.18s;
    border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; width: 100%;
  }
  .ind-story-card:hover .ind-story-link { gap: 9px; }

  /* ── Resources ── */
  .ind-resources-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    align-items: start;
  }
  .ind-res-right { display: flex; flex-direction: column; gap: 16px; }

  .ind-res-demo {
    background: linear-gradient(145deg, #0d2d3f 0%, #0f3347 40%, #12404f 70%, #0e3842 100%);
    border: 1px solid rgba(30,185,128,0.22);
    border-radius: 24px; padding: 44px 40px;
    position: relative; overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    transition: all 0.28s;
  }
  .ind-res-demo:hover { border-color: rgba(30,185,128,0.45); transform: translateY(-3px); }
  .ind-res-demo-glow {
    position: absolute; bottom: -40px; right: -40px;
    width: 220px; height: 220px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(30,185,128,0.2) 0%, transparent 70%);
    pointer-events: none;
  }
  .ind-res-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(30,185,128,0.15); border: 1px solid rgba(30,185,128,0.3);
    border-radius: 999px; padding: 4px 14px; font-size: 10px; font-weight: 800;
    color: #1EB980; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 20px;
  }
  .ind-res-demo-title {
    font-size: clamp(22px, 2.5vw, 30px); font-weight: 800; color: #fff;
    line-height: 1.2; margin: 0 0 32px; letter-spacing: -0.5px;
  }
  .ind-res-demo-link {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 15px; font-weight: 700; color: #1EB980;
    background: none; border: none; cursor: pointer; font-family: inherit;
    padding: 0; transition: gap 0.18s;
  }
  .ind-res-demo:hover .ind-res-demo-link { gap: 12px; }

  .ind-res-report {
    background: #1a3654; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; padding: 28px; transition: all 0.28s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.14);
  }
  .ind-res-report:hover { transform: translateY(-4px); border-color: rgba(30,185,128,0.3); background: #1d3c5e; }
  .ind-res-report-title {
    font-size: 17px; font-weight: 700; color: #fff; margin: 0 0 10px; line-height: 1.3;
  }
  .ind-res-report-desc {
    font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.65; margin: 0 0 20px;
  }
  .ind-res-report-link {
    font-size: 13px; font-weight: 700; color: #1EB980;
    display: inline-flex; align-items: center; gap: 5px;
    background: none; border: none; cursor: pointer; font-family: inherit;
    padding: 0; transition: gap 0.18s;
  }
  .ind-res-report:hover .ind-res-report-link { gap: 9px; }

  /* ── Floating sidebar buttons ── */
  .ind-float {
    position: fixed; right: 20px; top: 50%; transform: translateY(-50%);
    display: flex; flex-direction: column; gap: 10px; z-index: 200;
  }
  .ind-float-btn {
    writing-mode: vertical-rl; text-orientation: mixed;
    transform: rotate(180deg);
    padding: 16px 10px; background: #1EB980; color: #fff;
    border: none; border-radius: 999px; font-size: 12px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(30,185,128,0.4); letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .ind-float-btn:hover { background: #17a46f; box-shadow: 0 6px 22px rgba(30,185,128,0.55); transform: rotate(180deg) translateY(2px); }
  .ind-float-btn.ghost {
    background: #1a3654; color: #1EB980;
    border: 1.5px solid rgba(30,185,128,0.4);
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  }
  .ind-float-btn.ghost:hover { background: rgba(30,185,128,0.12); border-color: #1EB980; }

  /* ── Divider ── */
  .ind-divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 0; }

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .ind-grid { grid-template-columns: repeat(2, 1fr); }
    .ind-stories-grid { grid-template-columns: repeat(2, 1fr); }
    .ind-resources-grid { grid-template-columns: 1fr; }
    .ind-res-right { flex-direction: row; }
    .ind-float { display: none; }
  }
  @media (max-width: 700px) {
    .ind-section { padding: 56px 20px; }
    .ind-tabs-inner { padding: 0 16px; }
    .ind-grid { grid-template-columns: 1fr; }
    .ind-stories-grid { grid-template-columns: 1fr; }
    .ind-res-right { flex-direction: column; }
    .ind-hero { padding: 64px 0 56px; }
    .ind-hero-inner { padding: 0 20px; }
    .ind-hero-title { font-size: 36px; letter-spacing: -1px; }
    .ind-hero-desc { font-size: 15px; }
    .ind-res-demo { padding: 28px 24px; }
    .ind-resources-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) {
    .ind-section { padding: 40px 16px; }
    .ind-hero { padding: 48px 0 40px; }
    .ind-hero-inner { padding: 0 16px; }
    .ind-hero-title { font-size: 30px; }
    .ind-section-title { font-size: 26px; }
    .ind-story-stat { font-size: 48px; }
    .ind-res-demo { padding: 24px 20px; }
    .ind-story-card { padding: 24px 20px !important; }
    .ind-card { padding: 20px 16px !important; }
  }
`;

const INDUSTRIES = [
  {
    icon: '🏭',
    name: 'Manufacturing',
    desc: 'Manage vendor RFIs, purchase orders, and B2B workflows. Track production leads and automate your sales cycle.',
  },
  {
    icon: '🏦',
    name: 'Banking & Finance',
    desc: 'Manage client portfolios, track leads, monitor compliance, and automate document workflows for financial teams.',
  },
  {
    icon: '🏥',
    name: 'Healthcare',
    desc: 'Track patient leads, manage appointments, handle support tickets, and automate billing for healthcare providers.',
  },
  {
    icon: '🛒',
    name: 'Retail & E-commerce',
    desc: 'Manage customer relationships, track orders, handle support tickets, and grow repeat business with CRM.',
  },
  {
    icon: '🏗️',
    name: 'Real Estate',
    desc: 'Track property leads, manage site visits, handle negotiations, and close deals faster with a smart pipeline.',
  },
  {
    icon: '💻',
    name: 'Technology & SaaS',
    desc: 'Manage subscriptions, track MRR, run reseller programs, and automate billing for SaaS companies.',
  },
  {
    icon: '📚',
    name: 'Education',
    desc: 'Track student leads, manage admissions pipeline, handle fee collections, and communicate with prospects.',
  },
  {
    icon: '🚚',
    name: 'Logistics & Supply Chain',
    desc: 'Manage client accounts, track quotations, process purchase orders, and coordinate B2B deliveries.',
  },
];

const STORIES = [
  {
    company: 'TechVision Pvt Ltd',
    stat: '3x',
    desc: 'Increase in lead conversion rate within 6 months of deploying Unified CRM pipeline',
  },
  {
    company: 'RetailMax Solutions',
    stat: '65%',
    desc: 'Reduction in support ticket resolution time using automated SLA tracking',
  },
  {
    company: 'BuildCorp Infrastructure',
    stat: '₹2.4 Cr',
    desc: 'Active pipeline managed monthly across 3 regional sales teams',
  },
];

const IndustriesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <>
      <SEO
        title="Industries - Unified CRM"
        description="CRM solutions for various industries. Technology, manufacturing, real estate, healthcare, retail, and professional services."
        url="https://unifiedcrm.texora.ai/industries"
        keywords="industry CRM, vertical CRM, sector-specific CRM, industry solutions"
      />
      <div className="ind">
      <style>{CSS}</style>
      <SharedHeader />

      {/* ── Sticky Tabs ── */}
      <div className="ind-tabs">
        <div className="ind-tabs-inner">
          {[
            { id: 'all', label: 'All Industries' },
            { id: 'stories', label: 'Customer Stories' },
            { id: 'resources', label: 'Resources' },
          ].map(t => (
            <button
              key={t.id}
              className={`ind-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="ind-hero">
        <div className="ind-hero-glow" />
        <div className="ind-hero-inner">
          <div className="ind-hero-label">
            <span>◆</span> Industry Solutions
          </div>
          <h1 className="ind-hero-title">
            <span className="green">One Platform,</span><br />
            <span className="white">Any Industry</span>
          </h1>
          <p className="ind-hero-desc">
            Unified CRM adapts to how your industry works — with purpose-built workflows for sales,
            operations, billing, and customer management across every vertical.
          </p>
          <button className="ind-hero-btn" onClick={() => navigate('/demo')}>
            View Demos →
          </button>
        </div>
      </section>

      {/* ── All Industries Tab ── */}
      {activeTab === 'all' && (
        <div className="ind-section">
          <div className="ind-section-head">
            <div className="ind-section-label">8 Verticals</div>
            <h2 className="ind-section-title">CRM Built for Every Sector</h2>
            <p className="ind-section-desc">
              Whether you're managing RFIs for manufacturing or admission pipelines for education,
              Unified CRM fits your workflow out of the box.
            </p>
          </div>
          <div className="ind-grid">
            {INDUSTRIES.map((ind, i) => (
              <div key={i} className="ind-card">
                <span className="ind-card-icon">{ind.icon}</span>
                <div className="ind-card-name">{ind.name}</div>
                <p className="ind-card-desc">{ind.desc}</p>
                <button className="ind-card-link" onClick={() => navigate('/register')}>
                  Learn More →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Customer Stories Tab ── */}
      {activeTab === 'stories' && (
        <div className="ind-section">
          <div className="ind-section-head">
            <div className="ind-section-label">Real Results</div>
            <h2 className="ind-section-title">Customer Success Stories</h2>
            <p className="ind-section-desc">
              See how B2B businesses across India are transforming their sales and operations
              with Unified CRM.
            </p>
          </div>
          <div className="ind-stories-grid">
            {STORIES.map((s, i) => (
              <div key={i} className="ind-story-card">
                <div className="ind-story-company">{s.company}</div>
                <div className="ind-story-stat">{s.stat}</div>
                <p className="ind-story-desc">{s.desc}</p>
                <button className="ind-story-link" onClick={() => navigate('/contact')}>
                  Read Story →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Resources Tab ── */}
      {activeTab === 'resources' && (
        <div className="ind-section">
          <div className="ind-section-head">
            <div className="ind-section-label">Learn & Grow</div>
            <h2 className="ind-section-title">Resources for B2B Teams</h2>
            <p className="ind-section-desc">
              Demos, reports, and playbooks to help your team get the most out of Unified CRM.
            </p>
          </div>
          <div className="ind-resources-grid">
            {/* Left — large DEMO card */}
            <div className="ind-res-demo">
              <div className="ind-res-demo-glow" />
              <div className="ind-res-badge">▶ Demo</div>
              <div className="ind-res-demo-title">
                How to Set Up Your Sales Pipeline<br />in 10 Minutes
              </div>
              <button className="ind-res-demo-link" onClick={() => navigate('/demo')}>
                Watch Demo →
              </button>
            </div>

            {/* Right — two REPORT cards */}
            <div className="ind-res-right">
              <div className="ind-res-report">
                <div className="ind-res-badge">📄 Report</div>
                <div className="ind-res-report-title">B2B Sales Workflow Best Practices 2025</div>
                <p className="ind-res-report-desc">
                  Learn how high-performing sales teams automate their B2B document workflow
                  from RFI to invoice with zero manual data entry.
                </p>
                <button className="ind-res-report-link" onClick={() => navigate('/contact')}>
                  Read Report →
                </button>
              </div>

              <div className="ind-res-report">
                <div className="ind-res-badge">📄 Report</div>
                <div className="ind-res-report-title">Multi-Tenant SaaS Setup &amp; Growth Guide</div>
                <p className="ind-res-report-desc">
                  Everything you need to launch, manage, and scale a multi-tenant SaaS platform —
                  from tenant isolation to reseller commissions.
                </p>
                <button className="ind-res-report-link" onClick={() => navigate('/contact')}>
                  Read Report →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <hr className="ind-divider" />

      {/* ── Floating sidebar buttons ── */}
      <div className="ind-float">
        <button className="ind-float-btn" onClick={() => navigate('/contact')}>
          💬 Contact Us
        </button>
        <button className="ind-float-btn ghost" onClick={() => navigate('/demo')}>
          🖥 Book a Demo
        </button>
      </div>

      <SharedFooter />
    </div>
    </>
  );
};

export default IndustriesPage;
