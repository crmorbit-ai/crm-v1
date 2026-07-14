import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedFooter from '../components/SharedFooter';
import SEO from '../components/SEO';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  .ap { font-family: 'Inter', -apple-system, sans-serif; background: #fff; color: #111111; overflow-x: hidden; }

  /* Sticky top nav */
  .ap-nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.96); backdrop-filter: blur(12px);
    border-bottom: 1px solid #e5e7eb;
    display: flex; align-items: center; padding: 0 48px; height: 64px;
    justify-content: space-between;
  }
  .ap-nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .ap-nav-back { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: #5f6b7a; cursor: pointer; background: none; border: none; font-family: inherit; transition: color 0.15s; }
  .ap-nav-back:hover { color: #1EB980; }
  .ap-nav-right { display: flex; align-items: center; gap: 10px; }
  .ap-btn-outline { padding: 9px 20px; font-size: 14px; font-weight: 600; border: 1.5px solid #d1d5db; border-radius: 999px; background: #fff; color: #111111; cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .ap-btn-outline:hover { border-color: #1EB980; color: #1EB980; }
  .ap-btn-green { padding: 9px 20px; font-size: 14px; font-weight: 600; border: none; border-radius: 999px; background: #1EB980; color: #fff; cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .ap-btn-green:hover { background: #17a46f; transform: translateY(-1px); }

  /* Hero */
  .ap-hero {
    max-width: 1280px; margin: 0 auto; padding: 72px 48px 56px;
    display: grid; grid-template-columns: 1fr 420px; gap: 48px; align-items: center;
  }
  .ap-hero-title { font-size: clamp(36px, 5vw, 60px); font-weight: 800; color: #111111; line-height: 1.1; letter-spacing: -1.5px; margin: 0 0 20px; }
  .ap-hero-desc { font-size: 18px; color: #5f6b7a; line-height: 1.7; margin: 0 0 32px; max-width: 520px; }
  .ap-hero-ctas { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .ap-hero-cta-main { padding: 14px 28px; font-size: 16px; font-weight: 600; background: #1EB980; color: #fff; border: none; border-radius: 999px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .ap-hero-cta-main:hover { background: #17a46f; transform: translateY(-1px); }
  .ap-hero-cta-ghost { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 600; color: #111111; background: none; border: none; cursor: pointer; font-family: inherit; transition: color 0.2s; }
  .ap-hero-cta-ghost:hover { color: #1EB980; }
  .ap-hero-visual {
    background: linear-gradient(145deg, #0f1e2e 0%, #162e48 40%, #1a3654 70%, #1d6b50 100%);
    border-radius: 24px; padding: 28px; min-height: 280px; display: flex; flex-direction: column; gap: 12px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.12);
  }
  .ap-mock-bar { display: flex; gap: 6px; margin-bottom: 4px; }
  .ap-mock-dot { width: 10px; height: 10px; border-radius: 50%; }
  .ap-mock-row { background: rgba(255,255,255,0.07); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
  .ap-mock-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(30,185,128,0.2); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
  .ap-mock-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); }
  .ap-mock-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
  .ap-mock-badge { margin-left: auto; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; background: rgba(30,185,128,0.2); color: #1EB980; }

  /* Tab bar */
  .ap-tabs { border-bottom: 1px solid #e5e7eb; background: #fff; position: sticky; top: 64px; z-index: 90; }
  .ap-tabs-inner { max-width: 1280px; margin: 0 auto; padding: 0 48px; display: flex; gap: 0; }
  .ap-tab { padding: 18px 32px; font-size: 16px; font-weight: 500; color: #5f6b7a; background: none; border: none; cursor: pointer; font-family: inherit; border-bottom: 3px solid transparent; transition: all 0.2s; }
  .ap-tab:hover { color: #111111; }
  .ap-tab.active { color: #111111; font-weight: 600; border-bottom-color: #111111; }

  /* Floating buttons */
  .ap-float { position: fixed; right: 24px; bottom: 100px; display: flex; flex-direction: column; gap: 10px; z-index: 200; }
  .ap-float-btn { display: flex; align-items: center; gap: 8px; padding: 12px 18px; background: #1EB980; color: #fff; border: none; border-radius: 999px; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; box-shadow: 0 4px 20px rgba(30,185,128,0.4); transition: all 0.2s; }
  .ap-float-btn:hover { background: #17a46f; transform: translateY(-2px); }

  /* Section */
  .ap-section { max-width: 1280px; margin: 0 auto; padding: 64px 48px; }
  .ap-section-head { margin-bottom: 40px; }
  .ap-section-title { font-size: 36px; font-weight: 800; color: #111111; margin: 0 0 14px; letter-spacing: -0.8px; }
  .ap-section-desc { font-size: 16px; color: #5f6b7a; line-height: 1.65; margin: 0 0 20px; max-width: 600px; }
  .ap-view-az { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; font-size: 14px; font-weight: 600; color: #111111; border: 1.5px solid #d1d5db; border-radius: 999px; background: #fff; cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .ap-view-az:hover { border-color: #1EB980; color: #1EB980; }

  /* Product cards */
  .ap-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .ap-card { border: 2px solid #e5e7eb; border-radius: 20px; overflow: hidden; cursor: pointer; transition: all 0.25s; background: #fff; }
  .ap-card:hover { transform: translateY(-5px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); border-color: rgba(30,185,128,0.5); }
  .ap-card-img { height: 220px; background: linear-gradient(145deg, #0f1e2e, #162e48); display: flex; align-items: stretch; overflow: hidden; border-bottom: 2px solid #e5e7eb; }
  .ap-card-body { padding: 24px; }
  .ap-card-title { font-size: 22px; font-weight: 700; color: #111111; margin: 0 0 10px; }
  .ap-card-desc { font-size: 14px; color: #5f6b7a; line-height: 1.65; margin: 0 0 20px; }
  .ap-card-link { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #111111; background: none; border: none; cursor: pointer; font-family: inherit; padding: 0; transition: color 0.15s; }
  .ap-card-link:hover { color: #1EB980; }

  /* A-Z section */
  .ap-az-section { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 64px 0; }
  .ap-az-inner { max-width: 1280px; margin: 0 auto; padding: 0 48px; }
  .ap-az-alpha { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 40px; }
  .ap-az-letter { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; color: #374151; background: #fff; border: 1px solid #e5e7eb; cursor: pointer; transition: all 0.15s; }
  .ap-az-letter:hover { background: #1EB980; color: #fff; border-color: #1EB980; }
  .ap-az-letter.inactive { color: #d1d5db; cursor: default; }
  .ap-az-letter.inactive:hover { background: #fff; color: #d1d5db; border-color: #e5e7eb; }
  .ap-az-title { font-size: 28px; font-weight: 800; color: #111111; margin: 0 0 32px; }
  .ap-az-group { margin-bottom: 36px; }
  .ap-az-group-letter { font-size: 20px; font-weight: 800; color: #1EB980; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #d1fae5; }
  .ap-az-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
  .ap-az-item { padding: 8px 0; font-size: 14px; color: #374151; cursor: pointer; background: none; border: none; font-family: inherit; text-align: left; transition: color 0.15s; }
  .ap-az-item:hover { color: #1EB980; }

  /* Expert CTA */
  .ap-expert { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 64px 48px; text-align: center; }
  .ap-expert-title { font-size: 28px; font-weight: 700; color: #111111; margin: 0 0 16px; }
  .ap-expert-desc { font-size: 16px; color: #5f6b7a; margin: 0 0 28px; }

  @media(max-width:1024px){
    .ap-hero { grid-template-columns: 1fr; padding: 48px 24px 40px; }
    .ap-hero-visual { display: none; }
    .ap-cards { grid-template-columns: 1fr 1fr; }
  }
  @media(max-width:900px){
    .ap-hero { grid-template-columns: 1fr; }
    .ap-hero-visual { display: none; }
    .ap-cards { grid-template-columns: 1fr 1fr; }
    .ap-az-list { grid-template-columns: 1fr 1fr; }
    .ap-section { padding: 48px 20px; }
    .ap-az-inner { padding: 0 20px; }
    .ap-nav { padding: 0 20px; }
    .ap-tabs-inner { padding: 0 20px; }
    .ap-tab { padding: 14px 18px; font-size: 15px; }
    .ap-expert { padding: 48px 20px; }
  }
  @media(max-width:600px){
    .ap-float { display: none; }
    .ap-tabs-inner { padding: 0 16px; }
    .ap-az-inner { padding: 0 16px; }
    .ap-section { padding: 40px 16px; }
    .ap-cards { grid-template-columns: 1fr; }
    .ap-az-list { grid-template-columns: 1fr; }
    .ap-hero { padding: 32px 16px 28px; }
    .ap-hero-title { font-size: 28px; }
    .ap-hero-desc { font-size: 16px; }
    .ap-section-title { font-size: 26px; }
    .ap-tab { padding: 12px 14px; font-size: 14px; }
  }
  @media(max-width:480px){
    .ap-nav { height: auto; padding: 12px 16px; }
    .ap-hero-ctas { flex-direction: column; align-items: flex-start; gap: 12px; }
    .ap-az-alpha { gap: 6px; }
    .ap-az-letter { width: 30px; height: 30px; font-size: 13px; }
  }
`;



const MockVisual = ({ icon, title, badge, color }) => (
  <div className="ap-mock-row">
    <div className="ap-mock-icon">{icon}</div>
    <div style={{ flex: 1 }}>
      <div className="ap-mock-label">{title}</div>
      <div className="ap-mock-sub">Unified CRM Module</div>
    </div>
    <div className="ap-mock-badge" style={{ background: `${color}20`, color }}>{badge}</div>
  </div>
);

/* Mini mock UIs for each product card */
const CardMockLeads = () => (
  <div style={{ width: '100%', height: '100%', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
      {['New','Qualified','Proposal','Won'].map((s,i) => (
        <div key={i} style={{ flex: 1, background: ['rgba(30,185,128,0.3)','rgba(56,189,248,0.3)','rgba(245,158,11,0.3)','rgba(16,185,129,0.5)'][i], borderRadius: 6, padding: '5px 0', textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{s}</div>
      ))}
    </div>
    {[{n:'TechCorp',v:'₹2.4L',c:'#1EB980'},{n:'GlobalTrade',v:'₹8L',c:'#38bdf8'},{n:'StartupHub',v:'₹1.2L',c:'#f59e0b'}].map((r,i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: `${r.c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🏢</div>
        <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{r.n}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: r.c }}>{r.v}</div>
      </div>
    ))}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 4 }}>
      {[{l:'Pipeline',v:'₹15L'},{l:'Leads',v:'34'},{l:'Win %',v:'78%'}].map((s,i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1EB980' }}>{s.v}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.l}</div>
        </div>
      ))}
    </div>
  </div>
);

const CardMockWorkflow = () => (
  <div style={{ width: '100%', height: '100%', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', gap: 4, overflow: 'hidden' }}>
      {['📄 RFI','💰 Quote','📦 PO','🧾 Invoice'].map((s,i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ background: i < 3 ? 'rgba(30,185,128,0.25)' : 'rgba(56,189,248,0.25)', border: `1px solid ${i < 3 ? 'rgba(30,185,128,0.4)' : 'rgba(56,189,248,0.4)'}`, borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 600, color: i < 3 ? '#1EB980' : '#38bdf8' }}>{s}</div>
          {i < 3 && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>›</span>}
        </div>
      ))}
    </div>
    {[{d:'INV-2024-203',c:'TechVision',s:'Paid',col:'#1EB980'},{d:'QT-2024-112',c:'DataFlow',s:'Approved',col:'#38bdf8'},{d:'PO-2024-047',c:'CloudBase',s:'Processing',col:'#f59e0b'}].map((r,i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: `${r.col}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>📄</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{r.d}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{r.c}</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${r.col}20`, color: r.col }}>{r.s}</div>
      </div>
    ))}
  </div>
);

const CardMockSupport = () => (
  <div style={{ width: '100%', height: '100%', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 4 }}>
      {[{l:'Open',v:'24',c:'#f59e0b'},{l:'Resolved',v:'94',c:'#1EB980'},{l:'SLA',v:'98%',c:'#38bdf8'}].map((s,i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.l}</div>
        </div>
      ))}
    </div>
    {[{t:'Invoice PDF not generating',p:'High',c:'#ef4444'},{t:'Add export to Excel',p:'Medium',c:'#f59e0b'},{t:'CRM transformed our sales!',p:'Praise',c:'#1EB980'}].map((r,i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.c, flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.t}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: r.c, flexShrink: 0 }}>{r.p}</div>
      </div>
    ))}
  </div>
);

const CardMockSaaS = () => (
  <div style={{ width: '100%', height: '100%', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 2 }}>
      {[{l:'Tenants',v:'48',c:'#1EB980'},{l:'MRR',v:'₹4.2L',c:'#38bdf8'},{l:'Active',v:'96%',c:'#f59e0b'},{l:'Resellers',v:'12',c:'#a78bfa'}].map((s,i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.l}</div>
        </div>
      ))}
    </div>
    {[{n:'Acme Corp',p:'Pro Plan',s:'Active',c:'#1EB980'},{n:'TechVision',p:'Starter',s:'Trial',c:'#38bdf8'}].map((r,i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: `${r.c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🏢</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{r.n}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{r.p}</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: r.c }}>{r.s}</div>
      </div>
    ))}
  </div>
);

const CardMockAI = () => (
  <div style={{ width: '100%', height: '100%', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>🤖 AI ASSISTANT</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>"Draft a follow-up email for TechCorp deal..."</div>
    </div>
    <div style={{ background: 'rgba(30,185,128,0.1)', border: '1px solid rgba(30,185,128,0.25)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>Hi Rahul, following up on our proposal from last week. I'd love to discuss how we can help TechCorp scale their sales operations...</div>
    </div>
    <div style={{ display: 'flex', gap: 6 }}>
      {['Lead Score: 89%','Sentiment: 😊 Positive','Action: Follow up'].map((t,i) => (
        <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '5px 6px', fontSize: 9, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{t}</div>
      ))}
    </div>
  </div>
);

const CardMockData = () => (
  <div style={{ width: '100%', height: '100%', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 10px', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>🔍 Search 50,000+ prospects...</div>
      <div style={{ padding: '6px 12px', background: '#1EB980', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff' }}>Filter</div>
    </div>
    {[{n:'Priya Sharma',r:'CTO',c:'TechCorp',t:'🏷 SaaS'},{n:'Rahul Mehta',r:'VP Sales',c:'DataFlow',t:'🏷 B2B'},{n:'Anjali Singh',r:'Founder',c:'StartupX',t:'🏷 Tech'}].map((r,i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1EB98030', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#1EB980' }}>{r.n[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{r.n} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>· {r.r}</span></div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{r.c}</div>
        </div>
        <div style={{ fontSize: 10, color: '#1EB980' }}>{r.t}</div>
      </div>
    ))}
  </div>
);

const PRODUCTS = {
  featured: [
    { Mock: CardMockLeads,    title: 'Lead Management',   desc: 'Capture, qualify, and convert leads with bulk import, pipeline tracking, and smart auto-assignment rules.',          slug: 'lead-management', color: '#1EB980' },
    { Mock: CardMockWorkflow, title: 'B2B Sales Workflow', desc: 'Complete RFI → Quotation → Purchase Order → Invoice workflow with PDF generation and approval flows.',              slug: 'sales-finance',   color: '#38bdf8' },
    { Mock: CardMockAI,       title: 'AI Assistant',       desc: 'Gemini AI powered assistant for email drafting, lead scoring, sales insights, and smart recommendations.',          slug: 'automation',      color: '#f59e0b' },
    { Mock: CardMockSupport,  title: 'Support Tickets',    desc: 'Complete helpdesk with SLA tracking, priority management, multi-tier escalation, and real-time status updates.',   slug: 'support',         color: '#a78bfa' },
    { Mock: CardMockSaaS,     title: 'Multi-Tenant SaaS',  desc: 'Complete SaaS architecture with 100% tenant isolation, white-label branding, and full admin control panel.',       slug: 'monetization',    color: '#ec4899' },
    { Mock: CardMockData,     title: 'Data Center',         desc: 'Global prospect database with advanced multi-condition filtering, bulk operations, and smart deduplication.',      slug: 'lead-management', color: '#14b8a6' },
  ],
  solutions: [
    { photo: true, photoBg: 'linear-gradient(145deg,#1a3a2a,#1EB980)', photoIcon: '🎯', photoLabel: 'SALES', title: 'Sales CRM',            desc: 'Harness the power of AI to transform your sales process. Leads, pipeline, contacts, and revenue — all connected.', slug: 'lead-management', color: '#1EB980' },
    { photo: true, photoBg: 'linear-gradient(145deg,#1a2a3a,#0284c7)', photoIcon: '⚙️', photoLabel: 'OPERATIONS', title: 'Operations',  desc: 'Automate your entire B2B workflow from inquiry to invoice with multi-level approvals and PDF generation.', slug: 'sales-finance', color: '#38bdf8' },
    { photo: true, photoBg: 'linear-gradient(145deg,#2a1a3a,#7c3aed)', photoIcon: '💬', photoLabel: 'SUPPORT',    title: 'Customer Intelligence', desc: 'Unified support tickets and feedback system with AI sentiment analysis and 3-tier escalation workflow.', slug: 'support', color: '#a78bfa' },
    { photo: true, photoBg: 'linear-gradient(145deg,#2a2a1a,#ca8a04)', photoIcon: '🤝', photoLabel: 'PARTNERS',   title: 'Partner Program',   desc: 'Build and manage a multi-tier reseller network with automated commissions and partner dashboards.', slug: 'monetization', color: '#f59e0b' },
    { photo: true, photoBg: 'linear-gradient(145deg,#2a1a1a,#dc2626)', photoIcon: '🏢', photoLabel: 'ENTERPRISE',  title: 'Enterprise Platform',   desc: 'Role-based access, org hierarchy, custom fields, audit logs, and compliance tools built for scale.', slug: 'access-management', color: '#ec4899' },
    { photo: true, photoBg: 'linear-gradient(145deg,#1a2a2a,#0d9488)', photoIcon: '💰', photoLabel: 'MONETIZE',   title: 'Monetization Engine',   desc: 'Complete subscription lifecycle management with Razorpay billing, trial management, and MRR analytics.', slug: 'monetization', color: '#14b8a6' },
  ],
  platform: [
    { Mock: CardMockSaaS,     title: 'Access Management',    desc: 'Granular RBAC with custom roles, group permissions, field-level visibility, and audit trail.',     slug: 'access-management',color: '#1EB980' },
    { Mock: CardMockLeads,    title: 'Field Customization',  desc: 'No-code custom field builder for any entity — 8+ field types with drag-and-drop reordering.',     slug: 'access-management',color: '#38bdf8' },
    { Mock: CardMockWorkflow, title: 'Email Inbox',           desc: 'Built-in email with IMAP sync, real-time open/click tracking, and automatic CRM entity linking.', slug: 'email-inbox',        color: '#f59e0b' },
    { Mock: CardMockData,     title: 'Social Media',          desc: 'Schedule and publish posts across platforms with content calendar and engagement analytics.',      slug: 'automation',         color: '#a78bfa' },
    { Mock: CardMockAI,       title: 'Document Templates',    desc: 'Dynamic templates with variable substitution, rich text editor, and one-click PDF generation.',   slug: 'document-templates', color: '#ec4899' },
    { Mock: CardMockSupport,  title: 'Notifications',         desc: 'Real-time in-app alerts for tasks, deals, tickets, and team activity with preference controls.',  slug: 'access-management',color: '#14b8a6' },
  ],
};

const AZ_PRODUCTS = {
  A: ['Activity & Audit Logs', 'Accounts Management', 'AI Assistant'],
  B: ['Bulk Import Tools', 'B2B Sales Workflow', 'Billing & Invoicing'],
  C: ['Calls Management', 'Contacts & Accounts', 'Custom Field Builder'],
  D: ['Data Center', 'Document Templates', 'Deal Pipeline'],
  E: ['Email Inbox', 'Email Templates'],
  F: ['Feedback Management', 'Field Customization'],
  G: ['Group Permissions'],
  I: ['Integrations & APIs', 'Invoice Management'],
  L: ['Lead Management', 'Lead Scoring'],
  M: ['Meetings & Scheduling', 'Monetization Engine', 'Multi-Tenant SaaS'],
  N: ['Notifications & Alerts'],
  O: ['Opportunities Pipeline', 'Org Hierarchy Builder'],
  P: ['Product Catalog', 'Purchase Orders'],
  Q: ['Quotation Builder'],
  R: ['Reseller Program', 'RFI Management', 'Role-Based Access Control'],
  S: ['Sales Pipeline', 'Social Media Hub', 'Support Tickets', 'Subscriptions & Plans'],
  T: ['Task Management', 'Team Management'],
  U: ['Users & Roles'],
  W: ['Workflow Automation'],
};

const AZ_SLUG_MAP = {
  'Activity & Audit Logs':       'access-management',
  'Accounts Management':         'lead-management',
  'AI Assistant':                'lead-management',
  'Bulk Import Tools':           'lead-management',
  'B2B Sales Workflow':          'sales-finance',
  'Billing & Invoicing':         'account-management',
  'Calls Management':            'meeting-management',
  'Contacts & Accounts':         'lead-management',
  'Custom Field Builder':        'access-management',
  'Data Center':                 'lead-management',
  'Document Templates':          'document-templates',
  'Deal Pipeline':               'lead-management',
  'Email Inbox':                 'email-inbox',
  'Email Templates':             'document-templates',
  'Feedback Management':         'support',
  'Field Customization':         'access-management',
  'Group Permissions':           'access-management',
  'Integrations & APIs':         'automation',
  'Invoice Management':          'sales-finance',
  'Lead Management':             'lead-management',
  'Lead Scoring':                'lead-management',
  'Meetings & Scheduling':       'meeting-management',
  'Monetization Engine':         'monetization',
  'Multi-Tenant SaaS':           'monetization',
  'Notifications & Alerts':      'access-management',
  'Opportunities Pipeline':      'lead-management',
  'Org Hierarchy Builder':       'access-management',
  'Product Catalog':             'product',
  'Purchase Orders':             'sales-finance',
  'Quotation Builder':           'sales-finance',
  'Reseller Program':            'monetization',
  'RFI Management':              'sales-finance',
  'Role-Based Access Control':   'access-management',
  'Sales Pipeline':              'lead-management',
  'Social Media Hub':            'automation',
  'Support Tickets':             'support',
  'Subscriptions & Plans':       'account-management',
  'Task Management':             'task-management',
  'Team Management':             'access-management',
  'Users & Roles':               'access-management',
  'Workflow Automation':         'automation',
};


export default function AllProductsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');

  const tabProducts = activeTab === 'products' ? PRODUCTS.featured : activeTab === 'solutions' ? PRODUCTS.solutions : PRODUCTS.platform;

  return (
    <>
      <SEO
        title="All Features - Unified CRM"
        description="Discover all Unified CRM features. Lead management, contact tracking, deal pipeline, quotations, invoices, reports, and more."
        url="https://unifiedcrm.texora.ai/all-features"
        keywords="CRM features, lead management, contact management, sales features, CRM capabilities"
      />
      <div className="ap">
      <style>{CSS}</style>

      {/* Top Nav */}
      <nav className="ap-nav">
        <button className="ap-nav-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 10px' }}>
            <img src="/logo.png" alt="Unified CRM" style={{ height: 20, display: 'block' }} />
          </div>
        </div>
        <div className="ap-nav-right">
          <button className="ap-btn-outline" onClick={() => navigate('/login')}>Sign In</button>
          <button className="ap-btn-green" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div className="ap-hero">
          <div>
            <h1 className="ap-hero-title">All products and solutions</h1>
            <p className="ap-hero-desc">Put AI to work across your B2B sales, operations, and customer management — all modules connected in one platform.</p>
            <div className="ap-hero-ctas">
              <button className="ap-hero-cta-main" onClick={() => navigate('/register')}>Start Free Trial</button>
              <button className="ap-hero-cta-ghost" onClick={() => navigate('/contact')}>
                Explore Platform <span style={{ fontSize: 18 }}>→</span>
              </button>
            </div>
          </div>
          <div className="ap-hero-visual">
            <div className="ap-mock-bar">
              <div className="ap-mock-dot" style={{ background: '#ef4444' }} />
              <div className="ap-mock-dot" style={{ background: '#f59e0b' }} />
              <div className="ap-mock-dot" style={{ background: '#1EB980' }} />
            </div>
            <MockVisual icon="📋" title="Lead Management" badge="Active" color="#1EB980" />
            <MockVisual icon="💼" title="B2B Workflow" badge="Running" color="#38bdf8" />
            <MockVisual icon="🤖" title="AI Assistant" badge="AI" color="#f59e0b" />
            <MockVisual icon="🎫" title="Support Tickets" badge="3 new" color="#a78bfa" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ap-tabs">
        <div className="ap-tabs-inner">
          {[['products', 'Products'], ['solutions', 'Solutions'], ['platform', 'Platform']].map(([id, label]) => (
            <button key={id} className={`ap-tab${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div className="ap-section">
        <div className="ap-section-head">
          <h2 className="ap-section-title">Featured products</h2>
          <p className="ap-section-desc">
            Unified CRM brings together every module you need — sales, operations, support, and SaaS management — all powered by AI and built to scale.
          </p>
          <button className="ap-view-az" onClick={() => document.getElementById('ap-az')?.scrollIntoView({ behavior: 'smooth' })}>
            View All Products A-Z
          </button>
        </div>
        <div className="ap-cards">
          {tabProducts.map((p, i) => (
            <div key={i} className="ap-card" onClick={() => navigate(`/feature/${p.slug}`)}>
              {p.photo ? (
                /* Photo-style card (Solutions tab) */
                <div className="ap-card-img" style={{ background: p.photoBg, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '3px 12px', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>{p.photoLabel}</div>
                  <div style={{ fontSize: 64, filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))' }}>{p.photoIcon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{p.title}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['AI-Powered','Enterprise','Scalable'].map((t,j)=>(
                      <div key={j} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{t}</div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Mock UI card (Products/Platform tab) */
                <div className="ap-card-img" style={{ background: `linear-gradient(145deg, #0a1622 0%, #0f1e2e 40%, ${p.color}22 100%)` }}>
                  <p.Mock />
                </div>
              )}
              <div className="ap-card-body">
                <div className="ap-card-title">{p.title}</div>
                <div className="ap-card-desc">{p.desc}</div>
                <button className="ap-card-link">Learn More <span style={{ fontSize: 16 }}>→</span></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* A-Z Section */}
      <div className="ap-az-section" id="ap-az">
        <div className="ap-az-inner">
          <h2 className="ap-az-title">All products A-Z</h2>
          <div className="ap-az-alpha">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
              <div key={l} className={`ap-az-letter${AZ_PRODUCTS[l] ? '' : ' inactive'}`}
                onClick={() => AZ_PRODUCTS[l] && document.getElementById(`az-${l}`)?.scrollIntoView({ behavior: 'smooth' })}>
                {l}
              </div>
            ))}
          </div>
          {Object.entries(AZ_PRODUCTS).map(([letter, items]) => (
            <div key={letter} className="ap-az-group" id={`az-${letter}`}>
              <div className="ap-az-group-letter">{letter}</div>
              <div className="ap-az-list">
                {items.map((item, i) => (
                  <button key={i} className="ap-az-item" onClick={() => navigate(`/feature/${AZ_SLUG_MAP[item] || 'lead-management'}`)}>{item}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expert CTA */}
      <div className="ap-expert">
        <h2 className="ap-expert-title">Talk to an expert</h2>
        <p className="ap-expert-desc">Connect with our team to find the right solution for your business and get started today.</p>
        <button className="ap-btn-green" style={{ fontSize: 15, padding: '12px 28px' }} onClick={() => navigate('/contact')}>Get Started</button>
      </div>

      {/* Floating buttons */}
      <div className="ap-float">
        <button className="ap-float-btn" onClick={() => navigate('/contact')}>💬 Contact</button>
        <button className="ap-float-btn" onClick={() => navigate('/register')}>🖥 Demo</button>
      </div>

      <SharedFooter />
    </div>
    </>
  );
}
