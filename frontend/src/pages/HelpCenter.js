import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import { API_URL } from '../config/api.config';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #0f1e2e; overflow-x: hidden; }
  .hc { font-family: 'Inter',-apple-system,sans-serif; background: #0f1e2e; color:#fff; min-height:100vh; padding-top:72px; overflow-x:hidden; }

  /* Hero */
  .hc-hero { background: linear-gradient(155deg,#091e0e 0%,#0f3222 35%,#162e48 100%); padding:64px 0 52px; text-align:center; position:relative; overflow:hidden; }
  .hc-hero-label { font-size:12px; font-weight:800; color:#1EB980; letter-spacing:2px; text-transform:uppercase; margin-bottom:16px; }
  .hc-hero-title { font-size:clamp(32px,5vw,56px); font-weight:900; color:#fff; margin:0 0 16px; letter-spacing:-1.5px; }
  .hc-hero-desc { font-size:18px; color:rgba(255,255,255,0.62); max-width:520px; margin:0 auto 32px; line-height:1.65; }
  .hc-search-wrap { max-width:480px; margin:0 auto; position:relative; }
  .hc-search { width:100%; padding:14px 50px 14px 20px; font-size:15px; background:rgba(255,255,255,0.1); border:1.5px solid rgba(255,255,255,0.2); border-radius:999px; color:#fff; outline:none; font-family:inherit; }
  .hc-search:focus { border-color:#1EB980; background:rgba(255,255,255,0.12); }
  .hc-search::placeholder { color:rgba(255,255,255,0.4); }
  .hc-search-icon { position:absolute; right:18px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.5); }

  /* Quick links */
  .hc-quick { max-width:1200px; margin:0 auto; padding:48px 40px; display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  @media(max-width:900px){ .hc-quick { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:480px){ .hc-quick { grid-template-columns:1fr 1fr; padding:32px 16px; gap:12px; } }
  .hc-quick-card { background:#162e48; border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:28px 24px; cursor:pointer; transition:all 0.25s; text-align:center; }
  .hc-quick-card:hover { border-color:rgba(30,185,128,0.3); transform:translateY(-4px); background:#1a3654; }
  .hc-quick-icon { font-size:32px; margin-bottom:12px; }
  .hc-quick-title { font-size:15px; font-weight:700; color:#fff; margin:0 0 6px; }
  .hc-quick-desc { font-size:13px; color:rgba(255,255,255,0.5); margin:0; line-height:1.5; }

  /* FAQ */
  .hc-faq { background:#162e48; padding:72px 0; }
  .hc-faq-inner { max-width:800px; margin:0 auto; padding:0 40px; }
  @media(max-width:480px){ .hc-faq-inner { padding:0 16px; } }
  .hc-faq-head { text-align:center; margin-bottom:48px; }
  .hc-faq-title { font-size:clamp(26px,4vw,40px); font-weight:800; color:#fff; margin:0 0 12px; letter-spacing:-0.8px; }
  .hc-faq-sub { font-size:16px; color:rgba(255,255,255,0.52); margin:0; }
  .hc-faq-item { border-bottom:1px solid rgba(255,255,255,0.08); }
  .hc-faq-q { width:100%; text-align:left; background:none; border:none; cursor:pointer; font-family:inherit; padding:20px 0; display:flex; align-items:center; justify-content:space-between; gap:16px; }
  .hc-faq-q-text { font-size:16px; font-weight:600; color:#fff; }
  .hc-faq-arrow { font-size:14px; color:rgba(255,255,255,0.4); transition:transform 0.2s; flex-shrink:0; }
  .hc-faq-arrow.open { transform:rotate(180deg); }
  .hc-faq-a { font-size:14px; color:rgba(255,255,255,0.62); line-height:1.75; padding:0 0 20px; }

  /* Contact options */
  .hc-contact { max-width:1200px; margin:0 auto; padding:72px 40px; }
  @media(max-width:480px){ .hc-contact { padding:48px 16px; } }
  .hc-contact-head { text-align:center; margin-bottom:48px; }
  .hc-contact-title { font-size:clamp(26px,4vw,40px); font-weight:800; color:#fff; margin:0 0 12px; letter-spacing:-0.8px; }
  .hc-contact-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  @media(max-width:768px){ .hc-contact-grid { grid-template-columns:1fr; } }
  .hc-contact-card { background:#162e48; border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:32px 28px; text-align:center; }
  .hc-contact-icon { font-size:36px; margin-bottom:16px; }
  .hc-contact-name { font-size:18px; font-weight:700; color:#fff; margin:0 0 8px; }
  .hc-contact-desc { font-size:14px; color:rgba(255,255,255,0.52); line-height:1.65; margin:0 0 20px; }
  .hc-contact-btn { padding:11px 24px; background:#1EB980; color:#fff; border:none; border-radius:999px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s; }
  .hc-contact-btn:hover { background:#17a46f; transform:translateY(-1px); }
  .hc-contact-btn.ghost { background:transparent; border:1.5px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.8); }
  .hc-contact-btn.ghost:hover { border-color:#1EB980; color:#1EB980; background:transparent; }

  /* Ticket form */
  .hc-ticket { background:#162e48; padding:72px 0; border-top:1px solid rgba(255,255,255,0.07); }
  .hc-ticket-inner { max-width:700px; margin:0 auto; padding:0 40px; }
  @media(max-width:480px){ .hc-ticket-inner { padding:0 16px; } }
  .hc-ticket-head { text-align:center; margin-bottom:40px; }
  .hc-ticket-title { font-size:clamp(24px,4vw,36px); font-weight:800; color:#fff; margin:0 0 10px; letter-spacing:-0.5px; }
  .hc-ticket-sub { font-size:15px; color:rgba(255,255,255,0.52); margin:0; }
  .hc-field { margin-bottom:16px; }
  .hc-field label { display:block; font-size:13px; font-weight:600; color:rgba(255,255,255,0.7); margin-bottom:6px; }
  .hc-field label span { color:#ef4444; }
  .hc-input { width:100%; padding:12px 14px; font-size:14px; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1); border-radius:10px; color:#fff; outline:none; font-family:inherit; transition:border-color 0.2s; }
  .hc-input:focus { border-color:#1EB980; background:rgba(255,255,255,0.08); }
  .hc-input::placeholder { color:rgba(255,255,255,0.3); }
  .hc-select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
  .hc-textarea { width:100%; min-height:120px; padding:12px 14px; font-size:14px; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1); border-radius:10px; color:#fff; outline:none; font-family:inherit; resize:vertical; transition:border-color 0.2s; }
  .hc-textarea:focus { border-color:#1EB980; }
  .hc-textarea::placeholder { color:rgba(255,255,255,0.3); }
  .hc-submit { width:100%; padding:14px; font-size:15px; font-weight:700; background:#1EB980; color:#fff; border:none; border-radius:999px; cursor:pointer; font-family:inherit; margin-top:8px; transition:all 0.2s; }
  .hc-submit:hover:not(:disabled) { background:#17a46f; transform:translateY(-1px); }
  .hc-submit:disabled { background:#9ca3af; cursor:not-allowed; }
  .hc-success { background:rgba(30,185,128,0.1); border:1.5px solid rgba(30,185,128,0.3); border-radius:14px; padding:24px; text-align:center; }
  .hc-error { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:10px 14px; font-size:13px; color:#fca5a5; margin-bottom:12px; }
`;

const FAQS = [
  { q: 'How do I reset my password?', a: 'Go to the login page and click "Forgot Password". Enter your registered email address and you will receive an OTP to reset your password within a few minutes.' },
  { q: 'Can I import my existing leads from Excel/CSV?', a: 'Yes. Go to Leads → Import, upload your CSV file, map the columns to CRM fields, and submit. Duplicates are auto-detected. You can import thousands of leads at once.' },
  { q: 'How does the B2B workflow (RFI → Invoice) work?', a: 'Create an RFI, convert it to a Quotation with line items and PDF export, get internal approval, convert to Purchase Order, and finally generate an Invoice — all linked in one chain.' },
  { q: 'Can I connect my Gmail or Outlook to the CRM?', a: 'Yes. Go to Integrations → Email Inbox, enter your IMAP credentials (Gmail/Outlook/any email), and your inbox will sync in real time with open and click tracking.' },
  { q: 'How do I add team members and set their permissions?', a: 'Go to Settings → Team Management, invite a user by email, assign them a role (Admin/Manager/Sales/Support), and configure module-level permissions.' },
  { q: 'Is my data secure and isolated from other tenants?', a: 'Yes. Every tenant has 100% data isolation. No cross-tenant data access is possible. All data is encrypted at rest (AES-256) and in transit (TLS 1.3).' },
  { q: 'How does the AI lead scoring work?', a: 'Gemini AI analyzes lead behavior, profile completeness, source, and engagement to assign a score from 0-100%. High-scoring leads are surfaced to your sales team automatically.' },
  { q: 'Can I export my CRM data?', a: 'Yes. All entities (leads, contacts, accounts, opportunities, etc.) can be exported to CSV or Excel from their respective list views using the Export button.' },
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', category:'General', message:'' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { setError('Please fill all required fields.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/contact-inquiries`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: form.name, email: form.email, phone:'', subject:'Technical Support', message: `[${form.category}] ${form.message}` }),
      });
      const d = await res.json();
      if (d.success) setSuccess(true);
      else setError(d.message || 'Something went wrong.');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="hc">
      <style>{CSS}</style>
      <SharedHeader />

      {/* Hero */}
      <div className="hc-hero">
        <div style={{ padding:'0 20px', position:'relative', zIndex:2 }}>
          <div className="hc-hero-label">Help Center</div>
          <h1 className="hc-hero-title">How can we help you?</h1>
          <p className="hc-hero-desc">Find answers, submit a support ticket, or get in touch with our team.</p>
          <div className="hc-search-wrap">
            <input className="hc-search" placeholder="Search for help topics..." />
            <span className="hc-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            </span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="hc-quick">
        {[
          { icon:'🚀', title:'Getting Started', desc:'Set up your account and import your first leads', path:'/feature/lead-management' },
          { icon:'📄', title:'B2B Workflow Guide', desc:'RFI → Quotation → PO → Invoice setup', path:'/feature/sales-finance' },
          { icon:'🤖', title:'AI Features', desc:'Lead scoring, email drafts & smart recommendations', path:'/feature/automation' },
          { icon:'🔒', title:'Security & Access', desc:'Roles, permissions and data protection', path:'/feature/access-management' },
        ].map((c,i) => (
          <div key={i} className="hc-quick-card" onClick={() => navigate(c.path)}>
            <div className="hc-quick-icon">{c.icon}</div>
            <div className="hc-quick-title">{c.title}</div>
            <div className="hc-quick-desc">{c.desc}</div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="hc-faq">
        <div className="hc-faq-inner">
          <div className="hc-faq-head">
            <h2 className="hc-faq-title">Frequently Asked Questions</h2>
            <p className="hc-faq-sub">Quick answers to the most common questions.</p>
          </div>
          {FAQS.map((f,i) => (
            <div key={i} className="hc-faq-item">
              <button className="hc-faq-q" onClick={() => setOpenFaq(openFaq===i ? null : i)}>
                <span className="hc-faq-q-text">{f.q}</span>
                <span className={`hc-faq-arrow${openFaq===i?' open':''}`}>▾</span>
              </button>
              {openFaq===i && <div className="hc-faq-a">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Contact options */}
      <div className="hc-contact">
        <div className="hc-contact-head">
          <h2 className="hc-contact-title">Still need help?</h2>
        </div>
        <div className="hc-contact-grid">
          <div className="hc-contact-card">
            <div className="hc-contact-icon">✉️</div>
            <div className="hc-contact-name">Email Support</div>
            <div className="hc-contact-desc">Send us an email and we'll respond within 24 hours on business days.</div>
            <button className="hc-contact-btn" onClick={() => window.open('mailto:support@texora.ai')}>support@texora.ai</button>
          </div>
          <div className="hc-contact-card">
            <div className="hc-contact-icon">💬</div>
            <div className="hc-contact-name">Submit a Ticket</div>
            <div className="hc-contact-desc">Describe your issue below and our support team will get back to you.</div>
            <button className="hc-contact-btn" onClick={() => document.getElementById('hc-ticket-form')?.scrollIntoView({behavior:'smooth'})}>Submit Ticket</button>
          </div>
          <div className="hc-contact-card">
            <div className="hc-contact-icon">🤝</div>
            <div className="hc-contact-name">Sales Enquiry</div>
            <div className="hc-contact-desc">Want a demo or have questions about pricing and plans?</div>
            <button className="hc-contact-btn ghost" onClick={() => navigate('/contact')}>Contact Sales</button>
          </div>
        </div>
      </div>

      {/* Ticket form */}
      <div className="hc-ticket" id="hc-ticket-form">
        <div className="hc-ticket-inner">
          <div className="hc-ticket-head">
            <h2 className="hc-ticket-title">Submit a Support Ticket</h2>
            <p className="hc-ticket-sub">Our team will respond within 24 hours.</p>
          </div>
          {success ? (
            <div className="hc-success" style={{ textAlign:'center', padding:32 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#1EB980', marginBottom:8 }}>Ticket submitted!</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.62)' }}>Our support team will respond to {form.email} within 24 hours.</div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="hc-field"><label>Full Name <span>*</span></label><input className="hc-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Priya Sharma" /></div>
              <div className="hc-field"><label>Email Address <span>*</span></label><input className="hc-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="priya@company.com" /></div>
              <div className="hc-field">
                <label>Category</label>
                <select className="hc-input hc-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {['General','Lead Management','B2B Workflow','Email & Integrations','Billing & Subscription','AI Features','Access & Permissions','Bug Report'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="hc-field"><label>Describe your issue <span>*</span></label><textarea className="hc-textarea" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Please describe your issue in detail..." /></div>
              {error && <div className="hc-error">⚠ {error}</div>}
              <button className="hc-submit" type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit Ticket'}</button>
            </form>
          )}
        </div>
      </div>

      <SharedFooter />
    </div>
  );
}
