import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .sh-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    height: 72px; display: flex; align-items: center;
    background: #0f1e2e;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    font-family: 'Inter', -apple-system, sans-serif;
    transition: all 0.3s;
  }
  .sh-nav.scrolled {
    background: rgba(15,30,46,0.97);
    backdrop-filter: blur(12px);
    box-shadow: 0 2px 20px rgba(0,0,0,0.4);
  }
  .sh-inner {
    width: 100%; padding: 0 24px 0 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .sh-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; flex-shrink: 0; }
  /* Center links — same as landing page */
  .sh-links {
    display: flex; align-items: center; gap: 1px;
    flex: 1; justify-content: center;
  }
  .sh-link {
    padding: 7px 13px; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.72); background: none; border: none;
    cursor: pointer; border-radius: 7px; transition: all 0.18s;
    text-decoration: none; font-family: inherit; white-space: nowrap;
  }
  .sh-link:hover { color: #fff; background: rgba(255,255,255,0.07); }
  .sh-link .drop { font-size: 16px; opacity: 0.8; margin-left: 3px; transition: transform 0.2s; }
  .sh-link.active .drop { transform: rotate(180deg); }
  .sh-sep { width: 1px; height: 18px; background: rgba(255,255,255,0.12); margin: 0 8px; align-self: center; flex-shrink: 0; }
  .sh-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

  .sh-nav-item { position: relative; }

  /* Mega Menu */
  @keyframes megaIn { from{opacity:0;transform:translateY(-6px);clip-path:inset(0 0 100% 0)} to{opacity:1;transform:translateY(0);clip-path:inset(0 0 0% 0)} }
  .sh-mega-backdrop {
    position: fixed; top: 72px; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(5px);
    z-index: 1099;
  }
  .sh-mega-overlay {
    position: fixed; top: 72px; left: 0; right: 0;
    max-height: calc(100vh - 72px);
    overflow-y: auto;
    background: #0f1e2e; border-bottom: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 24px 60px rgba(0,0,0,0.55);
    z-index: 1100; animation: megaIn 0.22s ease;
  }
  .sh-mega-inner {
    max-width: 1440px; margin: 0 auto; padding: 0;
    display: grid; grid-template-columns: 260px 1fr 280px;
    min-height: min(460px, calc(100vh - 72px));
  }
  .sh-mega-left {
    background: #162e48; border-right: 1px solid rgba(255,255,255,0.08);
    padding: 24px 0; display: flex; flex-direction: column;
    overflow-y: auto;
  }
  .sh-mega-cat {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 20px; cursor: pointer; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.72); transition: all 0.15s;
    background: none; border: none; font-family: inherit; width: 100%; text-align: left;
  }
  .sh-mega-cat:hover { background: rgba(255,255,255,0.05); color: #fff; }
  .sh-mega-cat.active { background: #1a3654; color: #fff; font-weight: 600; border-left: 3px solid #1EB980; }
  .sh-mega-cat-arr { font-size: 12px; color: rgba(255,255,255,0.35); }
  .sh-mega-sep { height: 1px; background: rgba(255,255,255,0.08); margin: 10px 0; }
  .sh-mega-view-all { display: flex; align-items: center; gap: 6px; padding: 12px 20px; font-size: 13px; font-weight: 600; color: #1EB980; cursor: pointer; background: none; border: none; font-family: inherit; margin-top: auto; transition: gap 0.15s; }
  .sh-mega-view-all:hover { gap: 10px; }
  .sh-mega-center { padding: 28px 36px; overflow-y: auto; }
  .sh-mega-prod-title { font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 10px; letter-spacing: -0.5px; }
  .sh-mega-prod-desc { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.65; margin: 0 0 20px; max-width: 480px; }
  .sh-mega-see-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; font-size: 14px; font-weight: 600; color: #1EB980; background: transparent; border: 1.5px solid #1EB980; border-radius: 999px; cursor: pointer; font-family: inherit; transition: all 0.2s; margin-bottom: 28px; }
  .sh-mega-see-btn:hover { background: #1EB980; color: #fff; }
  .sh-mega-feat-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 16px; }
  .sh-mega-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .sh-mega-item { padding: 12px 14px; border-radius: 10px; cursor: pointer; transition: background 0.15s; }
  .sh-mega-item:hover { background: rgba(255,255,255,0.05); }
  .sh-mega-item-title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; }
  .sh-mega-item-desc { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.5; }
  .sh-mega-right {
    background: #1a3654; border-left: 1px solid rgba(255,255,255,0.08);
    padding: 28px 24px; display: flex; flex-direction: column; position: relative;
    overflow-y: auto;
  }
  .sh-mega-close { position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.15s; }
  .sh-mega-close:hover { background: rgba(255,255,255,0.15); color: #fff; }
  .sh-mega-card-label { font-size: 10px; font-weight: 700; color: #1EB980; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
  .sh-mega-card-title { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 14px; line-height: 1.25; }
  .sh-mega-card-desc { font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.7; margin-bottom: 24px; flex: 1; }
  .sh-mega-card-btn { display: inline-flex; align-items: center; gap: 6px; padding: 11px 22px; font-size: 14px; font-weight: 600; color: #1EB980; background: transparent; border: 1.5px solid #1EB980; border-radius: 999px; cursor: pointer; font-family: inherit; transition: all 0.2s; align-self: flex-start; }
  .sh-mega-card-btn:hover { background: #1EB980; color: #fff; }
  .sh-outline {
    padding: 8px 16px; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.82); background: none; border: none;
    border-radius: 999px; cursor: pointer; transition: all 0.18s; font-family: inherit;
    white-space: nowrap;
  }
  .sh-outline:hover { color: #fff; }
  .sh-search-icon {
    width: 36px; height: 36px; border-radius: 50%;
    background: none; border: none; color: rgba(255,255,255,0.6);
    cursor: pointer; transition: all 0.2s; font-family: inherit;
    display: flex; align-items: center; justify-content: center;
  }
  .sh-search-icon:hover { color: #1EB980; background: rgba(30,185,128,0.1); }
  .sh-primary {
    padding: 9px 20px; font-size: 14px; font-weight: 600; color: #fff;
    background: #1EB980; border: none; border-radius: 999px;
    cursor: pointer; transition: all 0.25s ease; font-family: inherit;
    white-space: nowrap; box-shadow: 0 2px 12px rgba(30,185,128,0.38);
  }
  .sh-primary:hover { background: #17a46f; transform: translateY(-1px); box-shadow: 0 4px 18px rgba(30,185,128,0.52); }

  /* Hamburger */
  .sh-burger {
    display: none; flex-direction: column; gap: 5px;
    background: none; border: none; cursor: pointer; padding: 6px; flex-shrink: 0;
  }
  .sh-burger span {
    display: block; width: 22px; height: 2px;
    background: rgba(255,255,255,0.85); border-radius: 2px;
    transition: all 0.25s ease;
  }
  .sh-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .sh-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .sh-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* Mobile drawer */
  .sh-drawer {
    position: fixed; top: 72px; left: 0; right: 0; bottom: 0;
    background: #0f1e2e; z-index: 999;
    display: flex; flex-direction: column; padding: 24px 20px;
    transform: translateX(100%); transition: transform 0.28s ease;
    border-top: 1px solid rgba(255,255,255,0.07);
    overflow-y: auto;
  }
  .sh-drawer.open { transform: translateX(0); }
  .sh-drawer-link {
    padding: 14px 16px; font-size: 16px; font-weight: 500;
    color: rgba(255,255,255,0.82); background: none; border: none;
    cursor: pointer; text-align: left; font-family: inherit;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: color 0.15s;
  }
  .sh-drawer-link:hover { color: #1EB980; }
  .sh-drawer-actions {
    display: flex; flex-direction: column; gap: 12px;
    margin-top: 24px; padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }
  .sh-drawer-signin {
    padding: 13px; font-size: 15px; font-weight: 600;
    color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12); border-radius: 999px;
    cursor: pointer; font-family: inherit; text-align: center;
  }
  .sh-drawer-cta {
    padding: 13px; font-size: 15px; font-weight: 700;
    color: #fff; background: #1EB980; border: none; border-radius: 999px;
    cursor: pointer; font-family: inherit; text-align: center;
    box-shadow: 0 4px 16px rgba(30,185,128,0.4);
  }

  @media(max-width:1024px) { .sh-links { display: none; } }
  @media(max-width:1024px) { .sh-burger { display: flex; } }
  @media(min-width:1025px) { .sh-drawer { display: none; } }
  @media(max-width:1024px) { .sh-inner { padding: 0 16px; } }
`;

export default function SharedHeader({ backTo, backLabel }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProductsDD, setShowProductsDD] = useState(false);
  const [megaCat, setMegaCat] = useState('featured');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const go = (path) => { navigate(path); setMenuOpen(false); };

  return (
    <>
      <style>{CSS}</style>
      <nav className={`sh-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="sh-inner">
          <div className="sh-logo" onClick={() => go('/')}>
            <div style={{ background: '#fff', borderRadius: 8, padding: '5px 10px' }}>
              <img src="/logo.png" alt="Unified CRM" style={{ height: 22, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
          </div>

          {/* Desktop nav — centered like landing page */}
          <div className="sh-links">
            <button className="sh-link" onClick={() => go('/')}>Home</button>

            {/* Products with mega menu */}
            <div className="sh-nav-item">
              <button className={`sh-link${showProductsDD?' active':''}`} onClick={() => { setShowProductsDD(!showProductsDD); setMegaCat('featured'); }}>
                Products <span className="drop">▾</span>
              </button>
            </div>

            <button className="sh-link" onClick={() => go('/partners')}>Partners</button>
            <button className="sh-link" onClick={() => go('/platform')}>Platform</button>
            <button className="sh-link" onClick={() => go('/about')}>About Us</button>
            <button className="sh-link" onClick={() => go('/contact')}>Contact Us</button>
            <div className="sh-sep" />
            <button className="sh-link" onClick={() => go('/help')}>Support</button>
          </div>

          {/* Right actions */}
          <div className="sh-actions">
            <button className="sh-outline" onClick={() => go('/login')}>Sign In</button>
            <button onClick={() => go('/demo')} style={{padding:'8px 16px',fontSize:14,fontWeight:600,color:'#1EB980',background:'transparent',border:'1.5px solid #1EB980',borderRadius:999,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.18s',fontFamily:'inherit'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#1EB980';e.currentTarget.style.color='#fff';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#1EB980';}}>
              Watch Demo
            </button>
            <button className="sh-primary" onClick={() => go('/register')}>Get Started →</button>
          </div>

          {/* Hamburger */}
          <button className={`sh-burger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`sh-drawer${menuOpen ? ' open' : ''}`}>
        <button className="sh-drawer-link" onClick={() => go('/')}>🏠 Home</button>
        <button className="sh-drawer-link" onClick={() => go('/all-features')}>📦 Products</button>
        <button className="sh-drawer-link" onClick={() => go('/partners')}>🤝 Partners</button>
        <button className="sh-drawer-link" onClick={() => go('/platform')}>🏗️ Platform</button>
        <button className="sh-drawer-link" onClick={() => go('/about')}>ℹ️ About Us</button>
        <button className="sh-drawer-link" onClick={() => go('/contact')}>📞 Contact Us</button>
        <button className="sh-drawer-link" onClick={() => go('/demo')}>▶ Watch Demo</button>
        <button className="sh-drawer-link" onClick={() => go('/help')}>🛠️ Support</button>
        <div className="sh-drawer-actions">
          <button className="sh-drawer-signin" onClick={() => go('/login')}>Sign In</button>
          <button className="sh-drawer-cta" onClick={() => go('/register')}>Get Started Free →</button>
        </div>
      </div>

      {/* Mega Menu */}
      {showProductsDD && (
        <>
          <div className="sh-mega-backdrop" onClick={() => setShowProductsDD(false)} />
          <div className="sh-mega-overlay">
            <div className="sh-mega-inner">
              {/* Left sidebar */}
              <div className="sh-mega-left">
                {[
                  { id:'featured',   label:'CRM Products' },
                  { id:'sales',      label:'Sales CRM' },
                  { id:'ops',        label:'B2B Operations' },
                  { id:'support',    label:'Support & Feedback' },
                  { id:'saas',       label:'SaaS Platform' },
                  { id:'solutions',  label:'Solutions' },
                  { id:'industries', label:'Industries' },
                ].map(c=>(
                  <button key={c.id} className={`sh-mega-cat${megaCat===c.id?' active':''}`}
                    onClick={()=>setMegaCat(c.id)}>
                    {c.label} <span className="sh-mega-cat-arr">›</span>
                  </button>
                ))}
                <div className="sh-mega-sep"/>
                <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:1,padding:'8px 20px 4px',textTransform:'uppercase'}}>Quick Access</div>
                {[
                  { label:'AI Assistant', path:'/feature/automation' },
                  { label:'Data Center',  path:'/all-features' },
                  { label:'Integrations', path:'/integrations' },
                ].map(l=>(
                  <button key={l.label} className="sh-mega-cat"
                    onClick={()=>{go(l.path);setShowProductsDD(false);}}>
                    {l.label} <span className="sh-mega-cat-arr">›</span>
                  </button>
                ))}
                <button className="sh-mega-view-all" onClick={() => { go('/all-features'); setShowProductsDD(false); }}>
                  View All Products →
                </button>
              </div>

              {/* Center content */}
              <div className="sh-mega-center">
                {megaCat === 'featured' && (<>
                  <div className="sh-mega-prod-title">Products</div>
                  <div className="sh-mega-prod-desc">Unify your sales, operations, and customer management with AI-powered modules built for modern B2B teams.</div>
                  <button className="sh-mega-see-btn" onClick={() => { go('/all-features'); setShowProductsDD(false); }}>See All Products</button>
                  <div className="sh-mega-feat-label">Featured Products</div>
                  <div className="sh-mega-grid">
                    {[
                      { t:'Lead Management',   d:'Capture, qualify & convert leads at scale',   path:'/feature/lead-management' },
                      { t:'B2B Sales Workflow', d:'RFI → Quote → PO → Invoice automated',        path:'/feature/sales-finance' },
                      { t:'Email Inbox',        d:'IMAP sync with real-time tracking',            path:'/feature/email-inbox' },
                      { t:'AI Assistant',       d:'Gemini AI for insights & email drafts',        path:'/feature/automation' },
                      { t:'Product Catalog',    d:'Products, pricing & marketplace',              path:'/feature/sales-finance' },
                      { t:'Support Tickets',    d:'SLA tracking & multi-tier escalation',         path:'/feature/support' },
                    ].map((p,i) => (
                      <div key={i} className="sh-mega-item" onClick={() => { go(p.path); setShowProductsDD(false); }}>
                        <div className="sh-mega-item-title">{p.t}</div>
                        <div className="sh-mega-item-desc">{p.d}</div>
                      </div>
                    ))}
                  </div>
                </>)}

                {megaCat === 'sales' && (<>
                  <div className="sh-mega-prod-title">Sales CRM</div>
                  <div className="sh-mega-prod-desc">Complete sales platform with pipeline visibility and forecasting.</div>
                  <button className="sh-mega-see-btn" onClick={() => { go('/feature/lead-management'); setShowProductsDD(false); }}>Explore Sales CRM</button>
                  <div className="sh-mega-feat-label">Key Features</div>
                  <div className="sh-mega-grid">
                    {[
                      { t:'Leads', d:'Capture & convert prospects' },
                      { t:'Contacts', d:'360° contact profiles' },
                      { t:'Opportunities', d:'Sales pipeline & forecasting' },
                      { t:'Accounts', d:'B2B org hierarchy' },
                    ].map((p,i) => (
                      <div key={i} className="sh-mega-item" onClick={() => { go('/feature/lead-management'); setShowProductsDD(false); }}>
                        <div className="sh-mega-item-title">{p.t}</div>
                        <div className="sh-mega-item-desc">{p.d}</div>
                      </div>
                    ))}
                  </div>
                </>)}

                {megaCat === 'ops' && (<>
                  <div className="sh-mega-prod-title">B2B Operations</div>
                  <div className="sh-mega-prod-desc">Complete document workflow from inquiry to invoice.</div>
                  <button className="sh-mega-see-btn" onClick={() => { go('/feature/sales-finance'); setShowProductsDD(false); }}>Explore Operations</button>
                  <div className="sh-mega-feat-label">Key Features</div>
                  <div className="sh-mega-grid">
                    {[
                      { t:'RFI', d:'Request for information' },
                      { t:'Quotations', d:'Professional quote builder' },
                      { t:'Purchase Orders', d:'PO management & tracking' },
                      { t:'Invoices', d:'Invoice & payment tracking' },
                    ].map((p,i) => (
                      <div key={i} className="sh-mega-item" onClick={() => { go('/feature/sales-finance'); setShowProductsDD(false); }}>
                        <div className="sh-mega-item-title">{p.t}</div>
                        <div className="sh-mega-item-desc">{p.d}</div>
                      </div>
                    ))}
                  </div>
                </>)}

                {megaCat === 'support' && (<>
                  <div className="sh-mega-prod-title">Support & Feedback</div>
                  <div className="sh-mega-prod-desc">Complete helpdesk with SLA tracking, escalation, and feedback management.</div>
                  <button className="sh-mega-see-btn" onClick={() => { go('/feature/support'); setShowProductsDD(false); }}>Explore Support</button>
                  <div className="sh-mega-feat-label">Support Modules</div>
                  <div className="sh-mega-grid">
                    {[
                      { t:'Support Tickets', d:'3-tier escalation & SLA' },
                      { t:'Feedback System', d:'Collect & prioritize feedback' },
                      { t:'Knowledge Base', d:'Self-service documentation' },
                      { t:'Live Chat', d:'Real-time support' },
                      { t:'Customer Portal', d:'Self-service portal' },
                      { t:'Satisfaction Surveys', d:'CSAT & NPS tracking' },
                    ].map((p,i) => (
                      <div key={i} className="sh-mega-item" onClick={() => { go('/feature/support'); setShowProductsDD(false); }}>
                        <div className="sh-mega-item-title">{p.t}</div>
                        <div className="sh-mega-item-desc">{p.d}</div>
                      </div>
                    ))}
                  </div>
                </>)}

                {megaCat === 'saas' && (<>
                  <div className="sh-mega-prod-title">SaaS Platform</div>
                  <div className="sh-mega-prod-desc">Multi-tenant architecture with 100% isolation, white-label branding, and complete monetization engine.</div>
                  <button className="sh-mega-see-btn" onClick={() => { go('/feature/monetization'); setShowProductsDD(false); }}>Explore Platform</button>
                  <div className="sh-mega-feat-label">Platform Features</div>
                  <div className="sh-mega-grid">
                    {[
                      { t:'Multi-Tenant', d:'Complete tenant isolation' },
                      { t:'Subscriptions', d:'Billing & trial management' },
                      { t:'Access Control', d:'RBAC & permissions' },
                      { t:'White Label', d:'Custom branding' },
                      { t:'Reseller Program', d:'Partner management' },
                      { t:'Analytics', d:'MRR & usage tracking' },
                    ].map((p,i) => (
                      <div key={i} className="sh-mega-item" onClick={() => { go('/feature/monetization'); setShowProductsDD(false); }}>
                        <div className="sh-mega-item-title">{p.t}</div>
                        <div className="sh-mega-item-desc">{p.d}</div>
                      </div>
                    ))}
                  </div>
                </>)}

                {megaCat === 'solutions' && (<>
                  <div className="sh-mega-prod-title">Solutions</div>
                  <div className="sh-mega-prod-desc">Complete solutions tailored for different business needs and use cases.</div>
                  <button className="sh-mega-see-btn" onClick={() => { go('/all-features'); setShowProductsDD(false); }}>View All Solutions</button>
                  <div className="sh-mega-feat-label">By Use Case</div>
                  <div className="sh-mega-grid">
                    {[
                      { t:'Sales Teams', d:'Pipeline & forecasting' },
                      { t:'Operations', d:'B2B document workflow' },
                      { t:'Customer Support', d:'Helpdesk & feedback' },
                      { t:'Enterprise', d:'Multi-tenant SaaS' },
                      { t:'Startups', d:'All-in-one CRM' },
                      { t:'Agencies', d:'Client management' },
                    ].map((p,i) => (
                      <div key={i} className="sh-mega-item" onClick={() => { go('/all-features'); setShowProductsDD(false); }}>
                        <div className="sh-mega-item-title">{p.t}</div>
                        <div className="sh-mega-item-desc">{p.d}</div>
                      </div>
                    ))}
                  </div>
                </>)}

                {megaCat === 'industries' && (<>
                  <div className="sh-mega-prod-title">Industries</div>
                  <div className="sh-mega-prod-desc">Purpose-built solutions for specific industries and business models.</div>
                  <button className="sh-mega-see-btn" onClick={() => { go('/industries'); setShowProductsDD(false); }}>View All Industries</button>
                  <div className="sh-mega-feat-label">Industry Solutions</div>
                  <div className="sh-mega-grid">
                    {[
                      { t:'Manufacturing', d:'B2B sales & operations' },
                      { t:'Technology & SaaS', d:'Multi-tenant platform' },
                      { t:'Healthcare', d:'Patient & care management' },
                      { t:'Real Estate', d:'Property & lead tracking' },
                      { t:'Education', d:'Student & course management' },
                      { t:'Finance', d:'Client & compliance tracking' },
                    ].map((p,i) => (
                      <div key={i} className="sh-mega-item" onClick={() => { go('/industries'); setShowProductsDD(false); }}>
                        <div className="sh-mega-item-title">{p.t}</div>
                        <div className="sh-mega-item-desc">{p.d}</div>
                      </div>
                    ))}
                  </div>
                </>)}
              </div>

              {/* Right card */}
              <div className="sh-mega-right">
                <button className="sh-mega-close" onClick={() => setShowProductsDD(false)}>×</button>
                <div className="sh-mega-card-label">NEW RELEASE</div>
                <div className="sh-mega-card-title">AI Assistant is live</div>
                <div className="sh-mega-card-desc">
                  Powered by Google Gemini. Draft emails, score leads, get insights — all inside your CRM.
                </div>
                <button className="sh-mega-card-btn" onClick={() => { go('/feature/automation'); setShowProductsDD(false); }}>
                  Learn More →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
