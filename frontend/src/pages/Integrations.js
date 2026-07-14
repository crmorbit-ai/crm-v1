import React from 'react';
import { useNavigate } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import SEO from '../components/SEO';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;background:#0f1e2e;}
.int-wrap{ font-family:'Inter',-apple-system,sans-serif; background:#0f1e2e; color:#fff; overflow-x:hidden; }
.int-hero{
  padding:120px 0 80px; text-align:center; position:relative; overflow:hidden;
  background:
    radial-gradient(ellipse at 70% 10%, rgba(30,185,128,0.13) 0%, transparent 50%),
    radial-gradient(ellipse at 10% 80%, rgba(30,185,128,0.07) 0%, transparent 45%),
    #0f1e2e;
}
.int-hero::before{
  content:''; position:absolute; inset:0; pointer-events:none;
  background-image:radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size:32px 32px;
}
.int-container{ max-width:1200px; margin:0 auto; padding:0 40px; }
@media(max-width:768px){ .int-container{ padding:0 20px; } }
.int-badge{
  display:inline-flex; align-items:center; gap:6px;
  padding:5px 14px; background:rgba(30,185,128,0.1); border:1px solid rgba(30,185,128,0.25);
  border-radius:999px; font-size:11px; font-weight:800; color:#1EB980; letter-spacing:1.5px;
  text-transform:uppercase; margin-bottom:20px;
}
.int-h1{ font-size:clamp(36px,5vw,58px); font-weight:900; color:#fff; margin:0 0 16px; letter-spacing:-1px; line-height:1.15; }
.int-hero-sub{ font-size:18px; color:rgba(255,255,255,0.55); max-width:560px; margin:0 auto 40px; line-height:1.7; }
.int-btn-primary{
  padding:14px 32px; font-size:15px; font-weight:700; font-family:inherit;
  color:#fff; background:#1EB980; border:none; border-radius:999px; cursor:pointer;
  transition:background .2s,box-shadow .2s; box-shadow:0 4px 18px rgba(30,185,128,0.35);
}
.int-btn-primary:hover{ background:#19a872; box-shadow:0 6px 26px rgba(30,185,128,0.5); }
.int-section{ padding:80px 0; }
.int-section-alt{ padding:80px 0; background:#162e48; }
.int-sec-label{ font-size:11px; font-weight:800; color:#1EB980; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; }
.int-sec-title{ font-size:clamp(28px,3.5vw,40px); font-weight:900; color:#fff; margin:0 0 14px; letter-spacing:-0.5px; }
.int-sec-sub{ font-size:16px; color:rgba(255,255,255,0.5); margin:0 0 48px; line-height:1.7; max-width:560px; }
.int-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.int-grid-4{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
@media(max-width:900px){ .int-grid{ grid-template-columns:1fr 1fr; } .int-grid-4{ grid-template-columns:1fr 1fr; } }
@media(max-width:520px){ .int-grid{ grid-template-columns:1fr; } .int-grid-4{ grid-template-columns:1fr; } }
.int-card{
  background:#1a3654; border:1px solid rgba(255,255,255,0.08);
  border-radius:16px; padding:28px 24px; transition:all .2s;
}
.int-card:hover{ background:#1e3f64; border-color:rgba(30,185,128,0.25); transform:translateY(-3px); }
.int-card-icon{ font-size:28px; margin-bottom:14px; }
.int-card-cat{ font-size:10px; font-weight:700; color:#1EB980; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
.int-card-name{ font-size:16px; font-weight:700; color:#fff; margin-bottom:8px; }
.int-card-desc{ font-size:13px; color:rgba(255,255,255,0.5); line-height:1.6; }
.int-feat-card{
  background:#1a3654; border:1px solid rgba(255,255,255,0.08);
  border-radius:16px; padding:28px 24px;
}
.int-feat-title{ font-size:16px; font-weight:700; color:#fff; margin-bottom:18px; }
.int-check{ display:flex; align-items:center; gap:10px; margin-bottom:10px; font-size:14px; color:rgba(255,255,255,0.65); }
.int-check-dot{ width:6px; height:6px; border-radius:50%; background:#1EB980; flex-shrink:0; }
.int-cta{ padding:80px 0; text-align:center; background:#0a1622; }
.int-cta-title{ font-size:clamp(28px,4vw,42px); font-weight:900; color:#fff; margin:0 0 14px; letter-spacing:-0.5px; }
.int-cta-sub{ font-size:16px; color:rgba(255,255,255,0.5); margin:0 0 36px; }
.int-btn-outline{
  padding:13px 28px; font-size:14px; font-weight:600; font-family:inherit;
  color:#1EB980; background:transparent; border:1.5px solid #1EB980; border-radius:999px;
  cursor:pointer; transition:all .2s;
}
.int-btn-outline:hover{ background:#1EB980; color:#fff; }
`;

const INTEGRATIONS = [
  { icon:'🔐', name:'Google OAuth',    cat:'Authentication', desc:'One-click login with Google account. Secure SSO across all users.' },
  { icon:'📧', name:'SMTP Email',       cat:'Email',           desc:'Send emails directly from CRM with your own SMTP or shared service.' },
  { icon:'📥', name:'IMAP Sync',        cat:'Email',           desc:'Real-time email sync — receive and track emails within the CRM.' },
  { icon:'💬', name:'Twilio SMS',       cat:'Communication',   desc:'Send SMS messages to leads and contacts directly from CRM.' },
  { icon:'✅', name:'ZeroBounce',       cat:'Verification',    desc:'Verify email addresses to maintain clean, high-quality lead data.' },
  { icon:'📞', name:'Numverify',        cat:'Verification',    desc:'Validate phone numbers for accurate and reliable contact data.' },
  { icon:'💳', name:'Razorpay',         cat:'Payments',        desc:'Collect subscription payments and manage billing cycles end-to-end.' },
  { icon:'🤖', name:'Gemini AI',        cat:'AI',              desc:'AI-powered lead scoring, email drafts, and revenue forecasting.' },
  { icon:'🔔', name:'Webhook Support',  cat:'Automation',      desc:'Trigger external workflows on CRM events via real-time webhooks.' },
  { icon:'📊', name:'Google Analytics', cat:'Analytics',       desc:'Track user behaviour and campaign performance within the platform.' },
  { icon:'🔒', name:'JWT Auth',         cat:'Security',        desc:'Secure token-based authentication for every API request.' },
  { icon:'🌐', name:'REST APIs',        cat:'Developer',       desc:'Full REST API access to build custom integrations and automate workflows.' },
];

const CATEGORIES = [
  { title:'Email & Communication', items:['Send emails from CRM','IMAP sync for incoming emails','Email templates & tracking','Bulk email campaigns','Twilio SMS messaging','Custom SMTP support'] },
  { title:'AI & Automation', items:['Gemini AI lead scoring','AI email draft generation','Revenue forecasting','Webhook-based automation','Trigger on CRM events','Custom workflow rules'] },
  { title:'Payments & Security', items:['Razorpay subscription billing','Automated invoice generation','JWT secure authentication','Google OAuth SSO','Email address verification','Phone number validation'] },
];

const Integrations = () => {
  const navigate = useNavigate();
  return (
    <>
      <SEO
        title="Integrations - Unified CRM"
        description="Connect Unified CRM with your favorite tools. Email, calendar, payment gateways, marketing automation, and 100+ integrations."
        url="https://unifiedcrm.texora.ai/integrations"
        keywords="CRM integrations, API integration, email integration, third-party apps, automation"
      />
      <div className="int-wrap">
      <style>{CSS}</style>
      <SharedHeader/>

      {/* Hero */}
      <section className="int-hero" style={{paddingTop:100}}>
        <div className="int-container" style={{position:'relative',zIndex:1}}>
          <div className="int-badge">⚡ Integrations</div>
          <h1 className="int-h1">Connect Everything.<br/>Work Smarter.</h1>
          <p className="int-hero-sub">Unified CRM connects with the tools your team already uses — email, payments, AI, and more. No extra setup needed.</p>
          <button className="int-btn-primary" onClick={()=>navigate('/register')}>Start Free Trial →</button>
        </div>
      </section>

      {/* Integrations grid */}
      <section className="int-section">
        <div className="int-container">
          <div style={{marginBottom:48}}>
            <div className="int-sec-label">Available Now</div>
            <h2 className="int-sec-title">All Integrations</h2>
            <p className="int-sec-sub">Built-in integrations — no third-party tools or extra subscriptions required.</p>
          </div>
          <div className="int-grid-4">
            {INTEGRATIONS.map((ig,i) => (
              <div key={i} className="int-card">
                <div className="int-card-icon">{ig.icon}</div>
                <div className="int-card-cat">{ig.cat}</div>
                <div className="int-card-name">{ig.name}</div>
                <div className="int-card-desc">{ig.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature breakdown */}
      <section className="int-section-alt">
        <div className="int-container">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="int-sec-label">Capabilities</div>
            <h2 className="int-sec-title">What You Can Do</h2>
          </div>
          <div className="int-grid">
            {CATEGORIES.map((cat,i) => (
              <div key={i} className="int-feat-card">
                <div className="int-feat-title">{cat.title}</div>
                {cat.items.map((item,j) => (
                  <div key={j} className="int-check">
                    <div className="int-check-dot"/>
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="int-cta">
        <div className="int-container">
          <div className="int-sec-label" style={{justifyContent:'center',display:'flex',marginBottom:16}}>Get Started</div>
          <h2 className="int-cta-title">Ready to Connect?</h2>
          <p className="int-cta-sub">All integrations included in every plan. No extra cost, no extra setup.</p>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
            <button className="int-btn-primary" onClick={()=>navigate('/register')}>Start Free Trial →</button>
            <button className="int-btn-outline" onClick={()=>navigate('/')}>← Back to Home</button>
          </div>
        </div>
      </section>

      <SharedFooter/>
    </div>
    </>
  );
};

export default Integrations;
