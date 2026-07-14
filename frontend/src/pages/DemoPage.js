import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import { API_URL } from '../config/api.config';
import SEO from '../components/SEO';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; overflow-x: hidden; background: #0f1e2e; }
  .demo-page { font-family: 'Inter',-apple-system,sans-serif; background: #0f1e2e; color:#fff; min-height:100vh; padding-top:72px; }

  .demo-main {
    min-height: calc(100vh - 72px);
    display: grid; grid-template-columns: 1fr 480px;
    max-width: 1280px; margin: 0 auto; padding: 72px 48px;
    gap: 80px; align-items: center;
  }
  @media(max-width:900px){ .demo-main { grid-template-columns:1fr; padding:40px 24px; gap:48px; } }
  @media(max-width:600px){
    .demo-main { padding: 28px 16px; }
    .demo-card { padding: 28px 20px; }
    .demo-visual { padding: 20px; }
    .demo-title { font-size: 28px; letter-spacing: -0.5px; }
    .demo-bullets { margin-bottom: 28px; }
  }
  @media(max-width:480px){
    .demo-main { padding: 20px 12px; gap: 32px; }
    .demo-card { padding: 22px 16px; }
    .demo-title { font-size: 24px; }
    .demo-desc { font-size: 15px; }
    .demo-bullet { font-size: 14px; }
  }

  /* Left */
  .demo-label { font-size: 12px; font-weight: 800; color: #1EB980; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }
  .demo-title { font-size: clamp(32px,5vw,56px); font-weight: 900; color: #fff; line-height: 1.08; letter-spacing: -1.5px; margin: 0 0 22px; }
  .demo-desc { font-size: 17px; color: rgba(255,255,255,0.62); line-height: 1.75; margin: 0 0 32px; max-width: 500px; }
  .demo-bullets { list-style: none; padding: 0; margin: 0 0 48px; display: flex; flex-direction: column; gap: 14px; }
  .demo-bullet { display: flex; align-items: center; gap: 12px; font-size: 16px; color: rgba(255,255,255,0.78); }
  .demo-bullet::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #1EB980; flex-shrink: 0; }

  /* Platform visual */
  .demo-visual { background: linear-gradient(145deg,#091e0e,#0f3222,#162e48); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px; position: relative; overflow: hidden; }
  .demo-vis-title { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 1px; margin-bottom: 20px; text-transform: uppercase; }
  .demo-vis-flow { display: flex; flex-direction: column; gap: 10px; }
  .demo-vis-step { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px 18px; }
  .demo-vis-num { width: 28px; height: 28px; border-radius: 50%; background: #1EB980; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
  .demo-vis-label { font-size: 14px; font-weight: 600; color: #fff; }
  .demo-vis-sub { font-size: 11px; color: rgba(255,255,255,0.42); margin-top: 1px; }
  .demo-vis-badge { margin-left: auto; padding: 3px 10px; background: rgba(30,185,128,0.15); border: 1px solid rgba(30,185,128,0.3); border-radius: 20px; font-size: 10px; font-weight: 700; color: #1EB980; }
  .demo-vis-arrow { text-align: center; color: rgba(255,255,255,0.2); font-size: 16px; margin: -2px 0; }

  /* Form card — white like ServiceNow */
  .demo-card { background: #fff; border-radius: 20px; padding: 40px 36px; box-shadow: 0 8px 48px rgba(0,0,0,0.35); }
  .demo-card-title { font-size: 22px; font-weight: 800; color: #111111; margin: 0 0 6px; letter-spacing: -0.3px; }
  .demo-card-sub { font-size: 14px; color: #5f6b7a; margin: 0 0 28px; }
  .demo-field { margin-bottom: 16px; }
  .demo-field label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
  .demo-field label span { color: #ef4444; }
  .demo-input {
    width: 100%; padding: 12px 14px; font-size: 14px;
    border: 1.5px solid #d1d5db; border-radius: 10px;
    outline: none; font-family: inherit; color: #111111;
    background: #fff; transition: border-color 0.2s;
  }
  .demo-input:focus { border-color: #1EB980; box-shadow: 0 0 0 3px rgba(30,185,128,0.1); }
  .demo-input::placeholder { color: #9ca3af; }
  .demo-check-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; cursor: pointer; }
  .demo-check-row input[type="checkbox"] { width: 16px; height: 16px; margin-top: 1px; accent-color: #1EB980; flex-shrink: 0; cursor: pointer; }
  .demo-check-text { font-size: 13px; color: #5f6b7a; line-height: 1.55; }
  .demo-check-text a { color: #1EB980; text-decoration: none; }
  .demo-submit {
    width: 100%; padding: 14px; font-size: 15px; font-weight: 700;
    background: #1EB980; color: #fff; border: none; border-radius: 999px;
    cursor: pointer; font-family: inherit; transition: all 0.2s;
    margin-top: 8px;
  }
  .demo-submit:hover:not(:disabled) { background: #17a46f; transform: translateY(-1px); }
  .demo-submit:disabled { background: #9ca3af; cursor: not-allowed; transform: none; }
  .demo-required-note { font-size: 12px; color: #ef4444; margin-top: 12px; display: flex; align-items: center; gap: 5px; }
  .demo-divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
  .demo-signin { font-size: 13px; color: #5f6b7a; text-align: center; }
  .demo-signin button { color: #1EB980; background: none; border: none; cursor: pointer; font-weight: 600; font-family: inherit; font-size: 13px; }
  .demo-success { background: #f0fdf4; border: 1.5px solid #a7f3d0; border-radius: 14px; padding: 24px; text-align: center; }
  .demo-success-icon { font-size: 40px; margin-bottom: 12px; }
  .demo-success-title { font-size: 18px; font-weight: 800; color: #065f46; margin: 0 0 8px; }
  .demo-success-desc { font-size: 14px; color: #047857; margin: 0; line-height: 1.6; }
`;

export default function DemoPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '' });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Use to continue.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/contact-inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || '',
          subject: 'Sales',
          message: `Demo Request from ${form.company}.\n\nCompany: ${form.company}\nPhone: ${form.phone || 'Not provided'}\n\nUser wants to watch a demo of Unified CRM.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        navigate('/demo/library');
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Request Demo - Unified CRM"
        description="Schedule a personalized demo of Unified CRM. See how our CRM solution can transform your sales and customer management process."
        url="https://unifiedcrm.texora.ai/demo"
        keywords="CRM demo, schedule demo, product demo, CRM trial, see CRM in action"
      />
      <div className="demo-page">
      <style>{CSS}</style>
      <SharedHeader />

      <div className="demo-main">

        {/* Left — description */}
        <div>
          <div className="demo-label">Demos</div>
          <h1 className="demo-title">See how Unified CRM gets work done</h1>
          <p className="demo-desc">
            Solve your biggest business challenges with Unified CRM. Learn how with easy-to-follow demos from our platform.
          </p>
          <ul className="demo-bullets">
            <li className="demo-bullet">Watch real workflows move from lead capture to closed deal.</li>
            <li className="demo-bullet">Learn how one platform connects your entire B2B sales stack.</li>
            <li className="demo-bullet">See AI execute tasks across sales, support, and operations.</li>
            <li className="demo-bullet">Explore multi-tenant SaaS management in under 10 minutes.</li>
          </ul>

          {/* Platform flow visual */}
          <div className="demo-visual">
            <div className="demo-vis-title">Platform Workflow</div>
            <div className="demo-vis-flow">
              <div className="demo-vis-step">
                <div className="demo-vis-num">1</div>
                <div>
                  <div className="demo-vis-label">Lead Captured</div>
                  <div className="demo-vis-sub">Web form → CRM pipeline automatically</div>
                </div>
                <div className="demo-vis-badge">Capture</div>
              </div>
              <div className="demo-vis-arrow">↓</div>
              <div className="demo-vis-step">
                <div className="demo-vis-num">2</div>
                <div>
                  <div className="demo-vis-label">AI Scores & Routes</div>
                  <div className="demo-vis-sub">Gemini AI assigns score and best sales rep</div>
                </div>
                <div className="demo-vis-badge">AI</div>
              </div>
              <div className="demo-vis-arrow">↓</div>
              <div className="demo-vis-step">
                <div className="demo-vis-num">3</div>
                <div>
                  <div className="demo-vis-label">Quotation Generated</div>
                  <div className="demo-vis-sub">PDF sent to client in one click</div>
                </div>
                <div className="demo-vis-badge">Execute</div>
              </div>
              <div className="demo-vis-arrow">↓</div>
              <div className="demo-vis-step">
                <div className="demo-vis-num">4</div>
                <div>
                  <div className="demo-vis-label">Deal Closed + Invoice</div>
                  <div className="demo-vis-sub">Payment tracked, audit log updated</div>
                </div>
                <div className="demo-vis-badge">Done ✓</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — form card */}
        <div className="demo-card">
          {success ? (
            <div className="demo-success">
              <div className="demo-success-icon">🎉</div>
              <div className="demo-success-title">Demo request received!</div>
              <p className="demo-success-desc">
                Our team will reach out within 24 hours to schedule your personalized demo of Unified CRM.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="demo-card-title">Watch Unified CRM demos</div>
              <div className="demo-card-sub">Already have an account? <button type="button" onClick={()=>navigate('/login')}>Sign in</button></div>

              <div className="demo-field">
                <label>Full Name <span>*</span></label>
                <input className="demo-input" type="text" placeholder="Priya Sharma" value={form.name}
                  onChange={e=>setForm({...form,name:e.target.value})} />
              </div>
              <div className="demo-field">
                <label>Business Email <span>*</span></label>
                <input className="demo-input" type="email" placeholder="priya@company.com" value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})} />
              </div>
              <div className="demo-field">
                <label>Company Name <span>*</span></label>
                <input className="demo-input" type="text" placeholder="TechCorp Pvt Ltd" value={form.company}
                  onChange={e=>setForm({...form,company:e.target.value})} />
              </div>
              <div className="demo-field">
                <label>Phone Number</label>
                <input className="demo-input" type="tel" placeholder="+91 98765 43210" value={form.phone}
                  onChange={e=>setForm({...form,phone:e.target.value})} />
              </div>

              <label className="demo-check-row">
                <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} />
                <span className="demo-check-text">
                  I have read and agree to the <a href="/contact">Terms of Use</a> and understand that my information will be used to contact me about this demo request.
                </span>
              </label>

              {error && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:8 }}>
                  ⚠ {error}
                </div>
              )}

              <button className="demo-submit" type="submit" disabled={loading}>
                {loading ? 'Submitting…' : 'Watch Demos'}
              </button>

              <div className="demo-required-note">
                ⚠ Form fields with an asterisk (*) are required.
              </div>
            </form>
          )}
        </div>

      </div>

      <SharedFooter />
    </div>
    </>
  );
}
