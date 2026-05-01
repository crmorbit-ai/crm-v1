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
    .about-page { font-family: 'Inter', -apple-system, sans-serif; background: #060b14; color: #fff; min-height: 100vh; overflow-x: hidden; display: flex; flex-direction: column; }
    .about-stars {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image:
        radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6) 0%, transparent 100%),
        radial-gradient(1px 1px at 40% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(1px 1px at 60% 50%, rgba(255,255,255,0.7) 0%, transparent 100%),
        radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 100%),
        radial-gradient(1px 1px at 10% 70%, rgba(255,255,255,0.6) 0%, transparent 100%),
        radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(1px 1px at 50% 60%, rgba(255,255,255,0.3) 0%, transparent 100%),
        radial-gradient(1px 1px at 70% 90%, rgba(255,255,255,0.6) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 15% 45%, rgba(255,255,255,0.8) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 55% 25%, rgba(255,255,255,0.7) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 75% 65%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.5) 0%, transparent 100%);
      background-size: 800px 800px;
      animation: twinkle 8s ease-in-out infinite alternate;
    }
    @keyframes twinkle { 0% { opacity: 0.6; } 100% { opacity: 1; } }
    .about-nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(6,11,20,0.85); backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding: 14px 0;
    }
    .about-nav-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; display: flex; justify-content: space-between; align-items: center; }
    .about-content { position: relative; z-index: 1; flex: 1; }
    .about-section { position: relative; }
    .grad-text { background: linear-gradient(135deg, #a78bfa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .about-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; transition: all 0.3s; }
    .about-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(124,58,237,0.3); transform: translateY(-4px); }
    .about-feature-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px 16px; text-align: center; transition: all 0.3s; }
    .about-feature-card:hover { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.3); transform: translateY(-4px); }
    .about-footer { position: relative; z-index: 1; background: rgba(6,11,20,0.95); border-top: 1px solid rgba(255,255,255,0.06); padding: 60px 0 32px; }
    .about-footer-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
    .about-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
    .footer-col-title { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    .footer-link { display: block; font-size: 14px; color: rgba(255,255,255,0.45); margin-bottom: 10px; cursor: pointer; background: none; border: none; padding: 0; text-align: left; text-decoration: none; transition: color 0.2s; }
    .footer-link:hover { color: rgba(255,255,255,0.85); }
    .orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
    @media (max-width: 768px) {
      .about-nav-inner { padding: 0 20px; }
      .about-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
    }
  `;

  return (
    <div className="about-page">
      <style>{css}</style>
      <div className="about-stars"></div>

      {/* Nav */}
      <nav className="about-nav">
        <div className="about-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate("/")}>
            <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px' }}>
              <img src="/logo.png" alt="Logo" style={{ height: 20, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => navigate("/login")} style={{ padding: '8px 18px', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, cursor: 'pointer' }}>Sign In</button>
            <button onClick={() => navigate("/register")} style={{ padding: '9px 22px', fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>Get Started →</button>
          </div>
        </div>
      </nav>

      <div className="about-content">

        {/* Hero */}
        <section style={{ padding: '60px 40px 60px', position: 'relative', textAlign: 'center' }}>
          <div className="orb" style={{ width: 500, height: 500, background: 'rgba(124,58,237,0.15)', top: -100, left: '10%' }}></div>
          <div className="orb" style={{ width: 400, height: 400, background: 'rgba(59,130,246,0.12)', top: -80, right: '10%' }}></div>
          <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 40, padding: '6px 18px', marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }}></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>ABOUT UNIFIED CRM</span>
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, color: '#fff', marginBottom: 20, lineHeight: 1.08, letterSpacing: -2 }}>
              Building the Future of<br /><span className="grad-text">Business Management</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 48, maxWidth: 680, margin: '0 auto 48px' }}>
              Unified CRM is a complete, AI-powered SaaS platform built to help businesses manage sales, customers, and operations — all in one place.
            </p>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, maxWidth: 720, margin: '0 auto' }}>
              {stats.map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 8px' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section style={{ padding: '80px 40px', position: 'relative' }}>
          <div className="orb" style={{ width: 400, height: 400, background: 'rgba(124,58,237,0.08)', top: '50%', left: -100 }}></div>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#a78bfa', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 40, padding: '4px 14px', marginBottom: 20, letterSpacing: 1 }}>OUR STORY</div>
              <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 24, lineHeight: 1.1, letterSpacing: -1 }}>Why We Built <span className="grad-text">Unified CRM</span></h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 18 }}>
                Unified CRM was born from a simple observation — most businesses struggle with disconnected tools. Sales teams use one platform, support another, finance a third. The result is lost data, missed follow-ups, and frustrated teams.
              </p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 18 }}>
                We built Unified CRM to solve exactly that. From lead capture to invoice generation, from support tickets to social media management — everything your business needs in a single platform.
              </p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
                Powered by <strong style={{ color: '#a78bfa' }}>Texora AI</strong>, we bring artificial intelligence into everyday business workflows — helping teams work smarter, close deals faster, and grow with confidence.
              </p>
            </div>

            {/* Illustration Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'rgba(124,58,237,0.08)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
              <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', borderRadius: 12, marginBottom: 28 }}>
                <defs>
                  <linearGradient id="bg-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0f172a"/><stop offset="100%" stopColor="#1e293b"/></linearGradient>
                  <linearGradient id="pu-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient>
                  <linearGradient id="gr-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#059669"/></linearGradient>
                </defs>
                <rect width="400" height="220" fill="url(#bg-g)" rx="12"/>
                <line x1="0" y1="55" x2="400" y2="55" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                <line x1="0" y1="110" x2="400" y2="110" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                <line x1="0" y1="165" x2="400" y2="165" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                <line x1="80" y1="0" x2="80" y2="220" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                <line x1="160" y1="0" x2="160" y2="220" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                <line x1="240" y1="0" x2="240" y2="220" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                <line x1="320" y1="0" x2="320" y2="220" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                <rect x="20" y="20" width="170" height="100" rx="10" fill="rgba(124,58,237,0.15)" stroke="rgba(124,58,237,0.3)" strokeWidth="1"/>
                <rect x="30" y="30" width="60" height="6" rx="3" fill="rgba(167,139,250,0.6)"/>
                <rect x="30" y="42" width="40" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>
                <rect x="30" y="70" width="14" height="36" rx="3" fill="url(#pu-g)" opacity="0.9"/>
                <rect x="50" y="60" width="14" height="46" rx="3" fill="url(#pu-g)" opacity="0.7"/>
                <rect x="70" y="50" width="14" height="56" rx="3" fill="url(#pu-g)" opacity="0.9"/>
                <rect x="90" y="65" width="14" height="41" rx="3" fill="url(#pu-g)" opacity="0.6"/>
                <rect x="110" y="55" width="14" height="51" rx="3" fill="url(#pu-g)" opacity="0.8"/>
                <rect x="130" y="45" width="14" height="61" rx="3" fill="url(#pu-g)"/>
                <polyline points="37,80 57,68 77,55 97,70 117,58 144,45" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="37" cy="80" r="3" fill="#a78bfa"/>
                <circle cx="77" cy="55" r="3" fill="#a78bfa"/>
                <circle cx="144" cy="45" r="3" fill="#a78bfa"/>
                <rect x="210" y="20" width="170" height="55" rx="10" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.25)" strokeWidth="1"/>
                <rect x="222" y="30" width="8" height="8" rx="2" fill="url(#gr-g)"/>
                <rect x="236" y="31" width="50" height="5" rx="2" fill="rgba(255,255,255,0.5)"/>
                <rect x="236" y="40" width="35" height="3" rx="2" fill="rgba(255,255,255,0.2)"/>
                <rect x="336" y="28" width="36" height="18" rx="6" fill="url(#gr-g)" opacity="0.9"/>
                <text x="354" y="41" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">+24%</text>
                <rect x="210" y="85" width="170" height="55" rx="10" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.25)" strokeWidth="1"/>
                <rect x="222" y="95" width="8" height="8" rx="2" fill="#3b82f6"/>
                <rect x="236" y="96" width="45" height="5" rx="2" fill="rgba(255,255,255,0.5)"/>
                <rect x="222" y="115" width="30" height="14" rx="4" fill="rgba(124,58,237,0.6)"/>
                <rect x="257" y="115" width="25" height="14" rx="4" fill="rgba(59,130,246,0.6)"/>
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
                <circle cx="228" cy="172" r="8" fill="rgba(124,58,237,0.6)" stroke="#7c3aed" strokeWidth="1"/>
                <circle cx="242" cy="172" r="8" fill="rgba(59,130,246,0.6)" stroke="#3b82f6" strokeWidth="1"/>
                <circle cx="256" cy="172" r="8" fill="rgba(16,185,129,0.6)" stroke="#10b981" strokeWidth="1"/>
                <circle cx="270" cy="172" r="8" fill="rgba(245,158,11,0.6)" stroke="#f59e0b" strokeWidth="1"/>
                <rect x="285" y="166" width="75" height="5" rx="2" fill="rgba(255,255,255,0.4)"/>
                <rect x="285" y="176" width="50" height="3" rx="2" fill="rgba(255,255,255,0.2)"/>
                <circle cx="105" cy="110" r="60" fill="rgba(124,58,237,0.05)"/>
                <circle cx="295" cy="110" r="50" fill="rgba(59,130,246,0.05)"/>
              </svg>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>What makes us different</div>
              </div>
              {[
                { title: "All-in-one platform", desc: "25+ modules covering every aspect of your business" },
                { title: "Multi-tenant SaaS", desc: "Built for agencies and teams managing multiple clients" },
                { title: "AI-powered", desc: "Google Gemini AI for email drafting, lead scoring, insights" },
                { title: "Reseller program", desc: "White-label and earn recurring commissions" },
                { title: "No credit card required", desc: "Start free, upgrade when you're ready" },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', borderRadius: '50%', marginTop: 5, flexShrink: 0 }}></div>
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
        <section style={{ padding: '80px 40px', position: 'relative' }}>
          <div className="orb" style={{ width: 500, height: 500, background: 'rgba(59,130,246,0.07)', top: '50%', right: -100 }}></div>
          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#a78bfa', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 40, padding: '4px 14px', marginBottom: 20, letterSpacing: 1 }}>FEATURES</div>
              <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: -1 }}>What We <span className="grad-text">Offer</span></h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>A complete CRM solution — all in one platform</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
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
        <section style={{ padding: '80px 40px', position: 'relative' }}>
          <div className="orb" style={{ width: 400, height: 400, background: 'rgba(124,58,237,0.08)', bottom: 0, left: '30%' }}></div>
          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#a78bfa', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 40, padding: '4px 14px', marginBottom: 20, letterSpacing: 1 }}>OUR VALUES</div>
              <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: -1 }}>The Principles That <span className="grad-text">Guide Us</span></h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Everything we build is guided by these core values</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
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
        <section style={{ padding: '80px 40px', position: 'relative', textAlign: 'center' }}>
          <div className="orb" style={{ width: 600, height: 400, background: 'rgba(124,58,237,0.12)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}></div>
          <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: -1 }}>
              Ready to Get <span className="grad-text">Started?</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.7 }}>
              Try Unified CRM free for 15 days. No credit card required.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate("/register")} style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: '#fff', fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                Start Free Trial →
              </button>
              <button onClick={() => navigate("/")} style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontSize: 15 }}>
                Back to Home
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-footer-inner">
          <div className="about-footer-grid">
            <div>
              <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', display: 'inline-block', marginBottom: 16 }}>
                <img src="/logo.png" alt="Logo" style={{ height: 20, width: 'auto', objectFit: 'contain', display: 'block' }} />
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: 260, marginBottom: 20 }}>
                Complete CRM solution with B2B workflow, email integration, team management, and more.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { href: "https://www.instagram.com/texoraai", svg: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#fff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
                  { href: "https://x.com/texoraai", svg: <svg width="14" height="14" fill="#fff" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                  { href: "https://www.linkedin.com/company/texora-ai/", svg: <svg width="16" height="16" fill="#0A66C2" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                  { href: "https://www.youtube.com/@Texoraai", svg: <svg width="16" height="16" fill="#FF0000" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>{s.svg}</a>
                ))}
              </div>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <button className="footer-link" onClick={() => navigate('/')}>Features</button>
              <button className="footer-link" onClick={() => navigate('/security')}>Security</button>
              <button className="footer-link" onClick={() => navigate('/integrations')}>Integrations</button>
              <button className="footer-link" onClick={() => navigate('/about')}>About Us</button>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <a href="https://texora.ai/career" target="_blank" rel="noopener noreferrer" className="footer-link">Careers</a>
              <a href="https://texora.ai/contact" target="_blank" rel="noopener noreferrer" className="footer-link">Contact</a>
              <a href="https://texora.ai/blogs" target="_blank" rel="noopener noreferrer" className="footer-link">Blog</a>
            </div>
            <div>
              <div className="footer-col-title">Partners</div>
              <button className="footer-link" onClick={() => navigate('/reseller/register')}>Become a Partner</button>
              <button className="footer-link" onClick={() => navigate('/reseller/login')}>Partner Login</button>
              <button className="footer-link" onClick={() => navigate('/login')}>Sign In</button>
              <button className="footer-link" onClick={() => navigate('/register')}>Get Started Free</button>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0 }}>© 2026 Unified CRM by Texora AI. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 20 }}>
              <a href="https://texora.ai/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="https://texora.ai/terms-of-service" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
