import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import React from "react";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  const crmFeatures = [
    { name: "Lead Management", icon: "🎯" },
    { name: "Contact & Account Management", icon: "👥" },
    { name: "Sales Pipeline", icon: "📊" },
    { name: "Email Integration", icon: "📧" },
    { name: "Task & Meeting Management", icon: "✅" },
    { name: "Quotations & Invoices", icon: "📄" },
    { name: "Support Tickets", icon: "🎫" },
    { name: "Multi-tenant SaaS", icon: "🏢" },
    { name: "AI Assistant", icon: "🤖" },
    { name: "Social Media Hub", icon: "📱" },
    { name: "Document Templates", icon: "📋" },
    { name: "Audit & Activity Logs", icon: "🔍" },
  ];

  const values = [
    { icon: "🎯", title: "Customer First", description: "Every feature we build starts with one question — does this make our customer's work easier?" },
    { icon: "💡", title: "Innovation", description: "We continuously evolve with AI, automation, and modern technology to stay ahead." },
    { icon: "🔒", title: "Security", description: "Enterprise-grade data protection with role-based access, encryption, and audit trails." },
    { icon: "🚀", title: "Simplicity", description: "Powerful features with a clean, intuitive interface — no training required." }
  ];

  const stats = [
    { value: "500+", label: "Businesses Growing" },
    { value: "25+", label: "Feature Modules" },
    { value: "99.9%", label: "Uptime Guaranteed" },
    { value: "18+", label: "Integrations" },
  ];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    .about-page { font-family: 'Inter', -apple-system, sans-serif; background: #0f1e2e; color: #fff; min-height: 100vh; overflow-x: hidden; display: flex; flex-direction: column; }
    .about-content { position: relative; z-index: 1; flex: 1; padding-top: 72px; }
    .about-section { position: relative; }
    .grad-text { color: #1EB980; }
    .about-card { background: #1a3654; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; transition: all 0.3s; }
    .about-card:hover { background: rgba(30,185,128,0.08); border-color: rgba(30,185,128,0.3); transform: translateY(-4px); }
    .about-feature-card { background: #1a3654; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px 16px; text-align: center; transition: all 0.3s; }
    .about-feature-card:hover { background: rgba(30,185,128,0.1); border-color: rgba(30,185,128,0.3); transform: translateY(-4px); }
    .orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
    .about-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; max-width: 720px; margin: 0 auto; }
    .about-story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
    .about-features-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
    .about-values-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; }
    @media (max-width: 1024px) {
      .about-features-grid { grid-template-columns: repeat(3,1fr); }
      .about-values-grid { grid-template-columns: repeat(2,1fr); }
    }
    @media (max-width: 768px) {
      .about-content { padding-top: 64px; }
      .about-stats-grid { grid-template-columns: repeat(2,1fr); }
      .about-story-grid { grid-template-columns: 1fr; gap: 36px; }
      .about-features-grid { grid-template-columns: repeat(2,1fr); }
      .about-values-grid { grid-template-columns: repeat(2,1fr); }
      .about-section-padding { padding: 60px 20px !important; }
    }
    @media (max-width: 480px) {
      .about-stats-grid { grid-template-columns: repeat(2,1fr); }
      .about-features-grid { grid-template-columns: 1fr 1fr; }
      .about-values-grid { grid-template-columns: 1fr; }
      .about-section-padding { padding: 48px 16px !important; }
    }
  `;

  return (
    <div className="about-page">
      <style>{css}</style>

      <SharedHeader />

      <div className="about-content">

        {/* Hero */}
        <section className="about-section-padding" style={{ padding: '60px 40px 60px', position: 'relative', textAlign: 'center', background: '#0f1e2e' }}>
          <div className="orb" style={{ width: 500, height: 500, background: 'rgba(30,185,128,0.1)', top: -100, left: '10%' }}></div>
          <div className="orb" style={{ width: 400, height: 400, background: 'rgba(30,185,128,0.07)', top: -80, right: '10%' }}></div>
          <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(30,185,128,0.08)', border: '1px solid rgba(30,185,128,0.2)', borderRadius: 40, padding: '6px 18px', marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1EB980', display: 'inline-block' }}></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>ABOUT UNIFIED CRM</span>
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, color: '#fff', marginBottom: 20, lineHeight: 1.08, letterSpacing: -2 }}>
              Building the Future of<br /><span className="grad-text">Business Management</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 48, maxWidth: 680, margin: '0 auto 48px' }}>
              Unified CRM is a complete, AI-powered SaaS platform built to help businesses manage sales, customers, and operations — all in one place.
            </p>
            {/* Stats */}
            <div className="about-stats-grid">
              {stats.map((s, i) => (
                <div key={i} style={{ background: '#1a3654', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 8px' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#1EB980', marginBottom: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="about-section-padding" style={{ padding: '80px 40px', position: 'relative', background: '#162e48' }}>
          <div className="orb" style={{ width: 400, height: 400, background: 'rgba(30,185,128,0.06)', top: '50%', left: -100 }}></div>
          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }} className="about-story-grid">
            <div>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#1EB980', background: 'rgba(30,185,128,0.1)', border: '1px solid rgba(30,185,128,0.2)', borderRadius: 40, padding: '4px 14px', marginBottom: 20, letterSpacing: 1 }}>OUR STORY</div>
              <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 24, lineHeight: 1.1, letterSpacing: -1 }}>Why We Built <span className="grad-text">Unified CRM</span></h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, marginBottom: 18 }}>
                Unified CRM was born from a simple observation — most businesses struggle with disconnected tools. Sales teams use one platform, support another, finance a third. The result is lost data, missed follow-ups, and frustrated teams.
              </p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, marginBottom: 18 }}>
                We built Unified CRM to solve exactly that. From lead capture to invoice generation, from support tickets to social media management — everything your business needs in a single platform.
              </p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8 }}>
                Powered by <strong style={{ color: '#1EB980' }}>Texora AI</strong>, we bring artificial intelligence into everyday business workflows — helping teams work smarter, close deals faster, and grow with confidence.
              </p>
            </div>

            {/* Illustration Card */}
            <div style={{ background: '#1a3654', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'rgba(30,185,128,0.06)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
              <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', borderRadius: 12, marginBottom: 28 }}>
                <defs>
                  <linearGradient id="bg-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0f172a"/><stop offset="100%" stopColor="#1e293b"/></linearGradient>
                  <linearGradient id="pu-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1EB980"/><stop offset="100%" stopColor="#22c55e"/></linearGradient>
                  <linearGradient id="gr-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#059669"/></linearGradient>
                </defs>
                <rect width="400" height="220" fill="url(#bg-g)" rx="12"/>
                <line x1="0" y1="55" x2="400" y2="55" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <line x1="0" y1="110" x2="400" y2="110" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <line x1="0" y1="165" x2="400" y2="165" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <line x1="80" y1="0" x2="80" y2="220" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <line x1="160" y1="0" x2="160" y2="220" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <line x1="240" y1="0" x2="240" y2="220" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <line x1="320" y1="0" x2="320" y2="220" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <rect x="20" y="20" width="170" height="100" rx="10" fill="rgba(30,185,128,0.15)" stroke="rgba(30,185,128,0.3)" strokeWidth="1"/>
                <rect x="30" y="30" width="60" height="6" rx="3" fill="rgba(167,139,250,0.6)"/>
                <rect x="30" y="42" width="40" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>
                <rect x="30" y="70" width="14" height="36" rx="3" fill="url(#pu-g)" opacity="0.9"/>
                <rect x="50" y="60" width="14" height="46" rx="3" fill="url(#pu-g)" opacity="0.7"/>
                <rect x="70" y="50" width="14" height="56" rx="3" fill="url(#pu-g)" opacity="0.9"/>
                <rect x="90" y="65" width="14" height="41" rx="3" fill="url(#pu-g)" opacity="0.6"/>
                <rect x="110" y="55" width="14" height="51" rx="3" fill="url(#pu-g)" opacity="0.8"/>
                <rect x="130" y="45" width="14" height="61" rx="3" fill="url(#pu-g)"/>
                <polyline points="37,80 57,68 77,55 97,70 117,58 144,45" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="37" cy="80" r="3" fill="#4ade80"/>
                <circle cx="77" cy="55" r="3" fill="#4ade80"/>
                <circle cx="144" cy="45" r="3" fill="#4ade80"/>
                <rect x="210" y="20" width="170" height="55" rx="10" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.25)" strokeWidth="1"/>
                <rect x="222" y="30" width="8" height="8" rx="2" fill="url(#gr-g)"/>
                <rect x="236" y="31" width="50" height="5" rx="2" fill="rgba(255,255,255,0.5)"/>
                <rect x="236" y="40" width="35" height="3" rx="2" fill="rgba(255,255,255,0.2)"/>
                <rect x="336" y="28" width="36" height="18" rx="6" fill="url(#gr-g)" opacity="0.9"/>
                <text x="354" y="41" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">+24%</text>
                <rect x="210" y="85" width="170" height="55" rx="10" fill="rgba(30,185,128,0.12)" stroke="rgba(30,185,128,0.25)" strokeWidth="1"/>
                <rect x="222" y="95" width="8" height="8" rx="2" fill="#22c55e"/>
                <rect x="236" y="96" width="45" height="5" rx="2" fill="rgba(255,255,255,0.5)"/>
                <rect x="222" y="115" width="30" height="14" rx="4" fill="rgba(30,185,128,0.6)"/>
                <rect x="257" y="115" width="25" height="14" rx="4" fill="rgba(30,185,128,0.6)"/>
                <rect x="287" y="115" width="20" height="14" rx="4" fill="rgba(16,185,129,0.6)"/>
                <rect x="312" y="115" width="14" height="14" rx="4" fill="rgba(245,158,11,0.6)"/>
                <rect x="20" y="135" width="170" height="45" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                <circle cx="35" cy="157" r="10" fill="url(#pu-g)" opacity="0.8"/>
                <text x="35" y="161" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">AI</text>
                <rect x="52" y="150" width="80" height="5" rx="2" fill="rgba(255,255,255,0.4)"/>
                <rect x="52" y="160" width="55" height="3" rx="2" fill="rgba(255,255,255,0.2)"/>
                <rect x="155" y="148" width="28" height="16" rx="5" fill="url(#pu-g)" opacity="0.8"/>
                <text x="169" y="160" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600">New</text>
                <rect x="210" y="150" width="170" height="45" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                <circle cx="228" cy="172" r="8" fill="rgba(30,185,128,0.6)" stroke="#1EB980" strokeWidth="1"/>
                <circle cx="242" cy="172" r="8" fill="rgba(30,185,128,0.6)" stroke="#22c55e" strokeWidth="1"/>
                <circle cx="256" cy="172" r="8" fill="rgba(16,185,129,0.6)" stroke="#10b981" strokeWidth="1"/>
                <circle cx="270" cy="172" r="8" fill="rgba(245,158,11,0.6)" stroke="#f59e0b" strokeWidth="1"/>
                <rect x="285" y="166" width="75" height="5" rx="2" fill="rgba(255,255,255,0.4)"/>
                <rect x="285" y="176" width="50" height="3" rx="2" fill="rgba(255,255,255,0.2)"/>
                <circle cx="105" cy="110" r="60" fill="rgba(30,185,128,0.05)"/>
                <circle cx="295" cy="110" r="50" fill="rgba(30,185,128,0.05)"/>
              </svg>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1EB980', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>What makes us different</div>
              </div>
              {[
                { title: "All-in-one platform", desc: "25+ modules covering every aspect of your business" },
                { title: "Multi-tenant SaaS", desc: "Built for agencies and teams managing multiple clients" },
                { title: "AI-powered", desc: "Google Gemini AI for email drafting, lead scoring, insights" },
                { title: "Reseller program", desc: "White-label and earn recurring commissions" },
                { title: "No credit card required", desc: "Start free, upgrade when you're ready" },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, background: '#1EB980', borderRadius: '50%', marginTop: 5, flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="about-section-padding" style={{ padding: '80px 40px', position: 'relative', background: '#0f1e2e' }}>
          <div className="orb" style={{ width: 500, height: 500, background: 'rgba(30,185,128,0.06)', top: '50%', right: -100 }}></div>
          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#1EB980', background: 'rgba(30,185,128,0.1)', border: '1px solid rgba(30,185,128,0.2)', borderRadius: 40, padding: '4px 14px', marginBottom: 20, letterSpacing: 1 }}>FEATURES</div>
              <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: -1 }}>What We <span className="grad-text">Offer</span></h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>A complete CRM solution — all in one platform</p>
            </div>
            <div className="about-features-grid">
              {crmFeatures.map((feature, i) => (
                <div key={i} className="about-feature-card">
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{feature.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{feature.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="about-section-padding" style={{ padding: '80px 40px', position: 'relative', background: '#162e48' }}>
          <div className="orb" style={{ width: 400, height: 400, background: 'rgba(30,185,128,0.06)', bottom: 0, left: '30%' }}></div>
          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#1EB980', background: 'rgba(30,185,128,0.1)', border: '1px solid rgba(30,185,128,0.2)', borderRadius: 40, padding: '4px 14px', marginBottom: 20, letterSpacing: 1 }}>OUR VALUES</div>
              <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: -1 }}>The Principles That <span className="grad-text">Guide Us</span></h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Everything we build is guided by these core values</p>
            </div>
            <div className="about-values-grid">
              {values.map((v, i) => (
                <div key={i} className="about-card" style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 44, marginBottom: 16 }}>{v.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{v.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="about-section-padding" style={{ padding: '80px 40px', position: 'relative', textAlign: 'center', background: '#0f1e2e' }}>
          <div className="orb" style={{ width: 600, height: 400, background: 'rgba(30,185,128,0.08)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}></div>
          <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: -1 }}>
              Ready to Get <span className="grad-text">Started?</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.7 }}>
              Try Unified CRM free for 15 days. No credit card required.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate("/register")} style={{ padding: '14px 32px', background: '#1EB980', color: '#fff', fontWeight: 700, borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 15, boxShadow: '0 4px 20px rgba(30,185,128,0.35)' }}>
                Start Free Trial →
              </button>
              <button onClick={() => navigate("/")} style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, borderRadius: 999, cursor: 'pointer', fontSize: 15 }}>
                Back to Home
              </button>
            </div>
          </div>
        </section>

      </div>

      <SharedFooter />
    </div>
  );
};

export default AboutUs;
