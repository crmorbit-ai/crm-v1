import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from '../components/SEO';

const Security = () => {
  const navigate = useNavigate();

  const securityFeatures = [
    {
      icon: "🔐",
      title: "JWT Authentication",
      description: "Secure token-based authentication with automatic expiry and refresh"
    },
    {
      icon: "🔒",
      title: "Password Encryption",
      description: "All passwords are hashed using bcryptjs - never stored in plain text"
    },
    {
      icon: "🛡️",
      title: "AES-256 Encryption",
      description: "Sensitive data like SMTP credentials encrypted at rest using AES-256-CBC"
    },
    {
      icon: "👥",
      title: "Role-Based Access Control",
      description: "Granular permissions with 5-tier user hierarchy and feature-level access"
    },
    {
      icon: "🏢",
      title: "Multi-Tenant Isolation",
      description: "Complete data separation between organizations - your data stays yours"
    },
    {
      icon: "📋",
      title: "Activity Logging",
      description: "Comprehensive audit trail tracking all user actions with IP and timestamps"
    }
  ];

  const authMethods = [
    { name: "Email & Password", icon: "📧" },
    { name: "Google OAuth 2.0", icon: "🔑" },
    { name: "OTP Verification", icon: "📱" }
  ];

  const userRoles = [
    { role: "SAAS Owner", level: "Full system access" },
    { role: "SAAS Admin", level: "Administrative access" },
    { role: "Tenant Admin", level: "Organization control" },
    { role: "Tenant Manager", level: "Team management" },
    { role: "Tenant User", level: "Standard access" }
  ];

  const dataProtection = [
    { icon: "✓", title: "Helmet.js Headers", desc: "Security headers protection" },
    { icon: "✓", title: "CORS Protection", desc: "Whitelist-based origin control" },
    { icon: "✓", title: "Input Validation", desc: "All inputs sanitized" },
    { icon: "✓", title: "Secure Sessions", desc: "Stateless JWT tokens" },
  ];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; background: #0f1e2e; }
    .sec-page { font-family: 'Inter', -apple-system, sans-serif; background: #0f1e2e; color: #fff; min-height: 100vh; padding-top: 72px; overflow-x: hidden; }
    .sec-card { background: #1a3654; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; transition: all 0.3s; }
    .sec-card:hover { background: rgba(30,185,128,0.08); border-color: rgba(30,185,128,0.3); transform: translateY(-4px); }
    .sec-section-pad { padding: 80px 24px; }
    .sec-auth-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
    @media(max-width:768px) {
      .sec-section-pad { padding: 60px 20px; }
      .sec-auth-grid { grid-template-columns: 1fr; gap: 32px; }
    }
    @media(max-width:480px) {
      .sec-section-pad { padding: 48px 16px; }
    }
  `;

  return (
    <>
      <SEO
        title="Security & Compliance - Unified CRM"
        description="Enterprise-grade security features. Data encryption, role-based access control, audit logs, and compliance certifications for your CRM data."
        url="https://unifiedcrm.texora.ai/security"
        keywords="CRM security, data encryption, GDPR compliance, secure CRM, enterprise security"
      />
      <div className="sec-page">
      <style>{css}</style>
      <SharedHeader />

      {/* Hero Section */}
      <section style={{ padding: '80px 24px 70px', position: 'relative', textAlign: 'center', background: '#0f1e2e', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '25%', width: 384, height: 384, background: 'rgba(30,185,128,0.08)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, right: '25%', width: 384, height: 384, background: 'rgba(30,185,128,0.06)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 896, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', padding: '6px 18px', background: 'rgba(30,185,128,0.1)', border: '1px solid rgba(30,185,128,0.25)', color: '#1EB980', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 24 }}>
            SECURITY
          </div>
          <h1 style={{ fontSize: 'clamp(36px,5.5vw,60px)', fontWeight: 900, marginBottom: 24, color: '#fff', letterSpacing: -2, lineHeight: 1.08 }}>
            Your Data is Protected
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', maxWidth: 600, margin: '0 auto' }}>
            Enterprise-grade security built into every layer of Unified CRM
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="sec-section-pad" style={{ background: '#162e48' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: -1 }}>Security Features</h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)' }}>Multiple layers of protection for your business data</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
            {securityFeatures.map((feature, index) => (
              <div key={index} className="sec-card" style={{ padding: 32 }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>{feature.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authentication Methods */}
      <section className="sec-section-pad" style={{ background: '#0f1e2e' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div className="sec-auth-grid">
            <div>
              <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: -1 }}>Authentication Methods</h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.75 }}>
                Multiple secure ways to access your account with built-in verification
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {authMethods.map((method, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#1a3654', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px' }}>
                    <span style={{ fontSize: 28 }}>{method.icon}</span>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{method.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#1a3654', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 32 }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 24 }}>User Role Hierarchy</h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {userRoles.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: index < userRoles.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{item.role}</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{item.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Protection */}
      <section className="sec-section-pad" style={{ background: '#162e48' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 0, letterSpacing: -1 }}>Data Protection</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
            {dataProtection.map((item, index) => (
              <div key={index} style={{ background: '#1a3654', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                <div style={{ color: '#1EB980', fontSize: 36, marginBottom: 12, fontWeight: 900 }}>{item.icon}</div>
                <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 8, fontSize: 15 }}>{item.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="sec-section-pad" style={{ background: '#0f1e2e', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '25%', width: 384, height: 384, background: 'rgba(30,185,128,0.07)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: -1 }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', marginBottom: 36 }}>
            Your data is safe with us
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <button
              onClick={() => navigate("/register")}
              style={{ padding: '14px 32px', background: '#1EB980', color: '#fff', fontWeight: 700, borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(30,185,128,0.35)' }}
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate("/")}
              style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, borderRadius: 999, cursor: 'pointer', fontSize: 15, fontFamily: 'inherit' }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </section>

      <SharedFooter />
    </div>
    </>
  );
};

export default Security;
