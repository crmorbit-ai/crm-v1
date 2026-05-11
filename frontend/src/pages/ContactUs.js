import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import { API_URL } from '../config/api.config';

const SUBJECTS = ['General Inquiry', 'Sales', 'Technical Support', 'Partnership', 'Billing', 'Other'];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; overflow-x: hidden; background: #0f1e2e; }
  .cu { font-family: 'Inter',-apple-system,sans-serif; background: #0f1e2e; color: #fff; min-height: 100vh; overflow-x: hidden; padding-top: 72px; }


  /* ── HERO ── */
  .cu-hero { padding: 60px 0 70px; position: relative; text-align: center; background: #0f1e2e; }
  .cu-hero-inner { max-width: 760px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 2; }
  .cu-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    padding: 6px 18px; border-radius: 40px; margin-bottom: 24px;
    background: rgba(30,185,128,0.1); border: 1px solid rgba(30,185,128,0.3); color: #1EB980;
  }
  .cu-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #1EB980; box-shadow: 0 0 6px #1EB980; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .cu-h1 { font-size: clamp(36px,5.5vw,60px); font-weight: 900; letter-spacing: -2px; line-height: 1.08; margin: 0 0 18px; }
  .cu-h1 .grad { color: #1EB980; }
  .cu-sub { font-size: 17px; color: rgba(255,255,255,0.45); line-height: 1.75; margin: 0 0 40px; max-width: 560px; margin-left: auto; margin-right: auto; }

  /* Stats row */
  .cu-stats { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
  .cu-stat { text-align: center; }
  .cu-stat-val { font-size: 26px; font-weight: 900; letter-spacing: -1px; }
  .cu-stat-lbl { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.8px; }
  .cu-stat-div { width: 1px; background: rgba(255,255,255,0.1); height: 40px; align-self: center; }

  /* ── MAIN ── */
  .cu-main { max-width: 1160px; margin: 0 auto; padding: 60px 24px 80px; display: grid; grid-template-columns: 1fr 1.35fr; gap: 48px; position: relative; z-index: 2; align-items: start; background: #162e48; border-radius: 0; }
  @media(max-width:900px){ .cu-main{grid-template-columns:1fr;gap:32px;} }

  /* ── LEFT PANEL ── */
  .cu-left-title { font-size: 22px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.5px; }
  .cu-left-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.8; margin: 0 0 36px; }

  /* Contact items */
  .cu-contact-item {
    display: flex; align-items: flex-start; gap: 16px;
    padding: 18px 20px; border-radius: 14px; margin-bottom: 10px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    text-decoration: none; transition: all 0.25s;
  }
  .cu-contact-item:hover { background: rgba(255,255,255,0.06); transform: translateX(4px); border-color: rgba(255,255,255,0.12); }
  .cu-ci-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .cu-ci-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; }
  .cu-ci-value { font-size: 15px; font-weight: 700; color: #fff; margin: 0 0 2px; }
  .cu-ci-sub { font-size: 12px; color: rgba(255,255,255,0.35); margin: 0; }

  /* Response badge */
  .cu-resp-badge {
    display: inline-flex; align-items: center; gap: 8px; margin: 24px 0;
    background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
    border-radius: 10px; padding: 10px 16px; font-size: 13px; color: #34d399; font-weight: 600;
  }
  .cu-resp-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: pulse 2s infinite; flex-shrink: 0; }

  /* FAQ */
  .cu-faq-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 14px; }
  .cu-faq-item { padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .cu-faq-q { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); margin: 0 0 5px; }
  .cu-faq-a { font-size: 12px; color: rgba(255,255,255,0.4); margin: 0; line-height: 1.65; }

  /* ── FORM PANEL ── */
  .cu-form-panel {
    background: #1a3654;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px; padding: 36px;
    position: relative; overflow: hidden;
  }
  .cu-form-panel::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at top right, rgba(30,185,128,0.06) 0%, transparent 60%);
    pointer-events: none;
  }
  .cu-form-glow { position: absolute; width: 300px; height: 300px; top: -80px; right: -80px; background: radial-gradient(circle, rgba(30,185,128,0.08) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
  .cu-form-title { font-size: 22px; font-weight: 800; margin: 0 0 4px; position: relative; z-index: 1; letter-spacing: -0.5px; }
  .cu-form-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0 0 28px; position: relative; z-index: 1; }

  /* Inputs */
  .cu-field { margin-bottom: 16px; position: relative; z-index: 1; }
  .cu-label { display: block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.55); margin-bottom: 7px; letter-spacing: 0.2px; }
  .cu-inp {
    width: 100%; padding: 12px 14px; font-size: 14px;
    border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
    background: rgba(255,255,255,0.05); color: #fff; outline: none;
    font-family: inherit; box-sizing: border-box; transition: all 0.2s;
  }
  .cu-inp:focus { border-color: #1EB980; box-shadow: 0 0 0 3px rgba(30,185,128,0.15); background: rgba(30,185,128,0.06); }
  .cu-inp::placeholder { color: rgba(255,255,255,0.2); }
  .cu-inp.error { border-color: rgba(239,68,68,0.6); }
  .cu-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media(max-width:560px){ .cu-row{grid-template-columns:1fr;} }
  .cu-select { appearance: none; -webkit-appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px;
    color: inherit;
  }
  .cu-select option { background: #1e293b; color: #fff; }
  .cu-select.placeholder { color: rgba(255,255,255,0.2); }
  .cu-textarea { resize: vertical; min-height: 130px; line-height: 1.65; }
  .cu-char { font-size: 11px; color: rgba(255,255,255,0.25); text-align: right; margin-top: 4px; }
  .cu-err { font-size: 11px; color: #f87171; margin-top: 4px; display: flex; align-items: center; gap: 4px; }

  /* Submit */
  .cu-submit {
    width: 100%; padding: 14px; font-size: 15px; font-weight: 700; color: #fff;
    background: #1EB980;
    border: none; border-radius: 999px; cursor: pointer; font-family: inherit;
    box-shadow: 0 6px 24px rgba(30,185,128,0.35); transition: all 0.2s;
    position: relative; z-index: 1; margin-top: 4px;
  }
  .cu-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(30,185,128,0.5); }
  .cu-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .cu-secure { font-size: 12px; color: rgba(255,255,255,0.25); text-align: center; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 5px; position: relative; z-index: 1; }

  /* Success */
  .cu-success { text-align: center; padding: 48px 20px; position: relative; z-index: 1; }
  .cu-success-ring { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg,#10b981,#34d399); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 30px; box-shadow: 0 8px 32px rgba(16,185,129,0.4); }
  .cu-success-title { font-size: 22px; font-weight: 800; margin: 0 0 10px; }
  .cu-success-sub { font-size: 14px; color: rgba(255,255,255,0.45); margin: 0 0 28px; line-height: 1.7; }
  .cu-success-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

  /* API error */
  .cu-api-err { padding: 12px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; color: #f87171; margin-bottom: 16px; font-size: 13px; display: flex; gap: 8px; position: relative; z-index: 1; }

  /* FAQ grid */
  .cu-faq-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 0 48px; }

  @media(max-width:768px) {
    .cu-hero { padding: 40px 0 50px; }
    .cu-h1 { font-size: clamp(28px,7vw,48px); }
    .cu-sub { font-size: 15px; }
    .cu-stats { gap: 24px; }
    .cu-main { padding: 40px 16px 60px; }
    .cu-form-panel { padding: 24px 20px; }
    .cu-faq-grid { grid-template-columns: 1fr; }
  }
  @media(max-width:480px) {
    .cu-hero { padding: 32px 0 40px; }
    .cu-h1 { font-size: 28px; letter-spacing: -1px; }
    .cu-main { padding: 32px 12px 48px; }
    .cu-form-panel { padding: 20px 16px; }
    .cu-stat-div { display: none; }
  }
`;

export default function ContactUs() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'', message:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    const nameVal = form.name.trim();
    if (!nameVal || nameVal.length < 2) e.name = 'Please enter your full name (min 2 characters)';
    else if (!/^[A-Za-z\s\-']+$/.test(nameVal) || !/[A-Za-z]{2,}/.test(nameVal)) e.name = 'Please enter a valid name using letters only';
    const emailRx = /^[a-zA-Z0-9]([a-zA-Z0-9._%+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.\-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
    if (!emailRx.test(form.email.trim()) || /\.{2,}/.test(form.email)) e.email = 'Please enter a valid email address';
    if (form.phone.trim() && !/^\+?[0-9]{7,15}$/.test(form.phone.trim())) e.phone = 'Please enter a valid phone number (digits only, + at start)';
    if (!form.subject) e.subject = 'Please select a subject';
    if (!form.message.trim() || form.message.trim().length < 10) e.message = 'Message must be at least 10 characters';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && value && !/^\+?[0-9]*$/.test(value)) return;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/contact-inquiries`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); setForm({ name:'', email:'', phone:'', subject:'', message:'' }); setErrors({}); }
      else setApiError(data.message || 'Failed to send. Please try again.');
    } catch { setApiError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  const CONTACT_ITEMS = null; // replaced below

  return (
    <div className="cu">
      <style>{CSS}</style>

      {/* Glow orbs */}
      <div style={{ position:'fixed', width:600, height:600, top:-200, left:'50%', transform:'translateX(-50%)', background:'radial-gradient(ellipse,rgba(30,185,128,0.08) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', width:400, height:400, bottom:0, right:'-10%', background:'radial-gradient(ellipse,rgba(30,185,128,0.06) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none', zIndex:0 }} />

      <SharedHeader />

      {/* ── HERO ── */}
      <section className="cu-hero">
        <div className="cu-hero-inner">
          <div className="cu-badge">
            <div className="cu-badge-dot" />
            Contact Us
          </div>
          <h1 className="cu-h1">
            We'd love to <span className="grad">hear from you</span>
          </h1>
          <p className="cu-sub">
            Got a question, need a demo, or want to explore a partnership? Our team is ready to help — every message gets a personal response.
          </p>
        </div>
      </section>

      {/* ── MAIN ── */}
      <div className="cu-main">

        {/* ── LEFT ── */}
        <div>
          <h2 className="cu-left-title">Let's start a conversation</h2>
          <p className="cu-left-desc">
            Whether you're evaluating Unified CRM for your team, need technical help, or want to discuss a reseller partnership — we're just a message away and respond fast.
          </p>

          {/* Email Us */}
          <div className="cu-contact-item">
            <div className="cu-ci-icon" style={{ background:'rgba(30,185,128,0.15)', border:'1px solid rgba(30,185,128,0.3)' }}>✉️</div>
            <div>
              <div className="cu-ci-label" style={{ color:'#1EB980' }}>Email Us</div>
              <div style={{ marginTop:4 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:2 }}>Sales &amp; Partnerships</div>
                <a href="mailto:sales@texora.ai" style={{ fontSize:14, fontWeight:700, color:'#1EB980', textDecoration:'none' }}>sales@texora.ai</a>
              </div>
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:2 }}>Support</div>
                <a href="mailto:support@texora.ai" style={{ fontSize:14, fontWeight:700, color:'#1EB980', textDecoration:'none' }}>support@texora.ai</a>
              </div>
            </div>
          </div>

          {/* Response Time */}
          <div className="cu-contact-item">
            <div className="cu-ci-icon" style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)' }}>🕐</div>
            <div style={{ flex:1 }}>
              <div className="cu-ci-label" style={{ color:'#fbbf24' }}>Response Time</div>
              <div className="cu-ci-value">24/7 AI Support Available</div>
              <a href="https://wa.me/919205299338" target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:8, padding:'5px 12px', background:'rgba(37,211,102,0.12)', border:'1px solid rgba(37,211,102,0.25)', borderRadius:20, fontSize:12, fontWeight:700, color:'#4ade80', textDecoration:'none' }}>
                <span>💬</span> WhatsApp Us (+91 92052 99338)
              </a>
            </div>
          </div>

          {/* Office */}
          <div className="cu-contact-item">
            <div className="cu-ci-icon" style={{ background:'rgba(30,185,128,0.15)', border:'1px solid rgba(30,185,128,0.3)' }}>📍</div>
            <div>
              <div className="cu-ci-label" style={{ color:'#1EB980' }}>Office</div>
              <div className="cu-ci-value">7125 Silent Creek Ave SE</div>
              <p className="cu-ci-sub">Snoqualmie, WA 98065</p>
            </div>
          </div>

          {/* Follow Us — original SVG logos */}
          <div className="cu-contact-item">
            <div className="cu-ci-icon" style={{ background:'rgba(236,72,153,0.15)', border:'1px solid rgba(236,72,153,0.3)' }}>🌐</div>
            <div>
              <div className="cu-ci-label" style={{ color:'#f472b6' }}>Follow Us</div>
              <div style={{ display:'flex', gap:10, marginTop:10 }}>
                <a href="https://www.instagram.com/texoraai" target="_blank" rel="noopener noreferrer"
                  style={{ width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#f77737,#e1306c,#833ab4)',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',opacity:0.88,transition:'all 0.2s',flexShrink:0 }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.opacity='1';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.opacity='0.88';}}>
                  <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#fff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://www.linkedin.com/company/texora-ai/" target="_blank" rel="noopener noreferrer"
                  style={{ width:36,height:36,borderRadius:'50%',background:'#0a66c2',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',opacity:0.88,transition:'all 0.2s',flexShrink:0 }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.opacity='1';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.opacity='0.88';}}>
                  <svg width="17" height="17" fill="#fff" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://www.youtube.com/@Texoraai" target="_blank" rel="noopener noreferrer"
                  style={{ width:36,height:36,borderRadius:'50%',background:'#ff0000',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',opacity:0.88,transition:'all 0.2s',flexShrink:0 }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.opacity='1';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.opacity='0.88';}}>
                  <svg width="17" height="17" fill="#fff" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="https://x.com/texoraai" target="_blank" rel="noopener noreferrer"
                  style={{ width:36,height:36,borderRadius:'50%',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',opacity:0.88,transition:'all 0.2s',flexShrink:0 }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.opacity='1';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.opacity='0.88';}}>
                  <svg width="14" height="14" fill="#fff" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Response badge */}
          <div className="cu-resp-badge">
            <div className="cu-resp-dot" />
            Average response time under 24 hours · Team online now
          </div>
        </div>

        {/* ── FORM ── */}
        <div className="cu-form-panel">
          <div className="cu-form-glow" />

          {submitted ? (
            <div className="cu-success">
              <div className="cu-success-ring">✓</div>
              <h3 className="cu-success-title">Message Sent!</h3>
              <p className="cu-success-sub">
                Thank you for reaching out. Our team will review your message and get back to you personally within 24 hours.
              </p>
              <div className="cu-success-btns">
                <button onClick={() => setSubmitted(false)}
                  style={{ padding:'10px 22px', fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.7)', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, cursor:'pointer', fontFamily:'inherit' }}>
                  Send Another
                </button>
                <button onClick={() => navigate('/')}
                  style={{ padding:'10px 22px', fontSize:14, fontWeight:700, color:'#fff', background:'#1EB980', border:'none', borderRadius:999, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(30,185,128,0.3)' }}>
                  Back to Home →
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="cu-form-title">Send us a message</h3>
              <p className="cu-form-sub">Fill in your details and we'll get back to you shortly.</p>

              {apiError && <div className="cu-api-err"><span>⚠️</span>{apiError}</div>}

              <form onSubmit={handleSubmit} noValidate>

                <div className="cu-row">
                  <div className="cu-field">
                    <label className="cu-label">Full Name *</label>
                    <input className={`cu-inp${errors.name?' error':''}`} name="name" value={form.name} onChange={handleChange} placeholder="John Doe" maxLength={60} />
                    {errors.name && <div className="cu-err">⚠ {errors.name}</div>}
                  </div>
                  <div className="cu-field">
                    <label className="cu-label">Email Address *</label>
                    <input className={`cu-inp${errors.email?' error':''}`} type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@company.com" maxLength={40} />
                    {errors.email && <div className="cu-err">⚠ {errors.email}</div>}
                  </div>
                </div>

                <div className="cu-row">
                  <div className="cu-field">
                    <label className="cu-label">Phone <span style={{ color:'rgba(255,255,255,0.3)', fontWeight:400 }}>(optional)</span></label>
                    <input className={`cu-inp${errors.phone?' error':''}`} name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" maxLength={16} />
                    {errors.phone && <div className="cu-err">⚠ {errors.phone}</div>}
                  </div>
                  <div className="cu-field">
                    <label className="cu-label">Subject *</label>
                    <select className={`cu-inp cu-select${!form.subject?' placeholder':''}${errors.subject?' error':''}`} name="subject" value={form.subject} onChange={handleChange}>
                      <option value="" disabled>Select a topic…</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.subject && <div className="cu-err">⚠ {errors.subject}</div>}
                  </div>
                </div>

                <div className="cu-field">
                  <label className="cu-label">Message *</label>
                  <textarea className={`cu-inp cu-textarea${errors.message?' error':''}`} name="message" value={form.message} onChange={handleChange} placeholder="Tell us how we can help you…" maxLength={1000} />
                  <div className="cu-char">{form.message.length} / 1000</div>
                  {errors.message && <div className="cu-err">⚠ {errors.message}</div>}
                </div>

                <button type="submit" disabled={loading} className="cu-submit">
                  {loading
                    ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                        <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
                        Sending…
                      </span>
                    : 'Send Message →'
                  }
                </button>

                <div className="cu-secure">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7l-9-5z"/></svg>
                  Your information is secure and will never be shared with third parties.
                </div>

              </form>
            </>
          )}
        </div>
      </div>

      {/* ── FAQ — full width below ── */}
      <div style={{ maxWidth:1160, margin:'0 auto', padding:'0 24px 80px', position:'relative', zIndex:2 }}>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:48 }}>
          <div className="cu-faq-grid">
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:1, margin:'0 0 20px' }}>Common Questions</p>
              {[
                { q: 'How do I get started?', a: "Sign up for a free trial — no credit card required. You'll be up and running in minutes." },
                { q: 'Can I import my existing data?', a: 'Yes! We support bulk CSV import for leads, contacts, accounts, and more.' },
              ].map((faq,i)=>(
                <div key={i} className="cu-faq-item">
                  <p className="cu-faq-q">{faq.q}</p>
                  <p className="cu-faq-a">{faq.a}</p>
                </div>
              ))}
            </div>
            <div style={{ paddingTop:32 }}>
              {[
                { q: 'Do you offer custom pricing?', a: 'Absolutely. Contact our sales team and we will craft a plan that fits your needs.' },
                { q: 'Is support available in Hindi?', a: 'Yes, our support team is bilingual — English and Hindi both.' },
              ].map((faq,i)=>(
                <div key={i} className="cu-faq-item">
                  <p className="cu-faq-q">{faq.q}</p>
                  <p className="cu-faq-a">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <SharedFooter />
    </div>
  );
}
