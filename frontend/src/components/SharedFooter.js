import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .sf {
    background: #f5f7f8;
    font-family: 'Inter', -apple-system, sans-serif;
    border-top: 1px solid #e5e7eb;
  }

  /* Main footer grid */
  .sf-main { max-width: 1280px; margin: 0 auto; padding: 52px 40px 40px; }
  .sf-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr 1fr 1fr;
    gap: 40px;
    padding-bottom: 40px;
    border-bottom: 1px solid #e5e7eb;
  }

  /* Brand col */
  .sf-desc {
    font-size: 14px; color: #5f6b7a; line-height: 1.75;
    margin: 12px 0 18px; max-width: 230px;
  }
  .sf-contact-row {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: #374151; margin-bottom: 8px;
    text-decoration: none;
  }
  .sf-contact-row:hover { color: #1EB980; }

  /* Link columns */
  .sf-col-head {
    font-size: 14px; font-weight: 700; color: #111111;
    margin: 0 0 16px; letter-spacing: 0;
  }
  .sf-link {
    display: block; font-size: 14px; color: #5f6b7a;
    margin-bottom: 10px; cursor: pointer; text-decoration: none;
    background: none; border: none; padding: 0; font-family: inherit;
    transition: color 0.18s; text-align: left; width: 100%;
  }
  .sf-link:hover { color: #1EB980; }

  /* CTA strip */
  .sf-cta-strip {
    text-align: center; padding: 52px 20px;
    border-top: 1px solid #e5e7eb;
    background: #fff;
  }
  .sf-cta-title {
    font-size: 24px; font-weight: 700; color: #111111;
    margin: 0 0 24px; letter-spacing: -0.4px;
  }
  .sf-cta-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 32px; font-size: 16px; font-weight: 600;
    color: #1EB980; background: transparent;
    border: 2px solid #1EB980; border-radius: 999px;
    cursor: pointer; font-family: inherit;
    transition: all 0.25s ease;
  }
  .sf-cta-btn:hover { background: #1EB980; color: #fff; transform: translateY(-1px); }

  /* Bottom identity bar */
  .sf-identity {
    background: #fff; border-top: 1px solid #e5e7eb;
    padding: 20px 40px;
    max-width: 100%;
  }
  .sf-identity-inner {
    max-width: 1280px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }
  .sf-identity-left {
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  }
  .sf-tagline {
    font-size: 15px; font-weight: 600; color: #111111;
    border-left: 1px solid #d1d5db; padding-left: 14px;
  }
  .sf-socials { display: flex; align-items: center; gap: 8px; }
  .sf-social-btn {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    text-decoration: none; transition: transform 0.2s, opacity 0.2s;
    opacity: 0.82; flex-shrink: 0;
  }
  .sf-social-btn:hover { transform: translateY(-2px); opacity: 1; }

  /* Legal row */
  .sf-legal {
    background: #f5f7f8; border-top: 1px solid #e5e7eb;
    padding: 14px 40px;
  }
  .sf-legal-inner {
    max-width: 1280px; margin: 0 auto;
    display: flex; align-items: center; flex-wrap: wrap;
    gap: 6px 20px;
  }
  .sf-legal-link {
    font-size: 12px; color: #6b7280;
    background: none; border: none; cursor: pointer;
    font-family: inherit; padding: 0; text-decoration: none;
    transition: color 0.15s;
  }
  .sf-legal-link:hover { color: #1EB980; }
  .sf-legal-dot { color: #d1d5db; font-size: 12px; }
  .sf-copy { font-size: 12px; color: #9ca3af; }
  .sf-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #1EB980; font-weight: 600; margin-left: auto; }
  .sf-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #1EB980; animation: sfpulse 2s infinite; }
  @keyframes sfpulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  @media(max-width:1024px){ .sf-grid { grid-template-columns: 1fr 1fr 1fr; gap: 28px; } }
  @media(max-width:768px){
    .sf-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
    .sf-main { padding: 40px 20px 32px; }
    .sf-cta-strip { padding: 40px 16px; }
    .sf-cta-title { font-size: 20px; }
  }
  @media(max-width:640px){
    .sf-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
    .sf-main { padding: 40px 20px 32px; }
    .sf-identity { padding: 18px 20px; }
    .sf-legal { padding: 12px 20px; }
    .sf-identity-inner { flex-direction: column; align-items: flex-start; gap: 12px; }
    .sf-tagline { border-left: none; padding-left: 0; }
  }
  @media(max-width:480px){
    .sf-grid { grid-template-columns: 1fr; gap: 20px; }
    .sf-main { padding: 32px 16px 24px; }
    .sf-legal-inner { flex-direction: column; gap: 4px; }
    .sf-legal-dot { display: none; }
    .sf-status { margin-left: 0; }
    .sf-cta-title { font-size: 18px; }
    .sf-cta-btn { padding: 12px 24px; font-size: 14px; }
  }
`;

export default function SharedFooter() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  return (
    <>
      <style>{CSS}</style>
      <footer className="sf">

        {/* Main link columns */}
        <div className="sf-main">
          <div className="sf-grid">

            {/* Brand */}
            <div>
              <div style={{ marginBottom: 12 }}>
                <img src="/logo.png" alt="Unified CRM" style={{ height: 20, display: 'block' }} />
              </div>
              <p className="sf-desc">
                The complete CRM platform for modern B2B teams — leads, deals, support, billing, and everything in between.
              </p>
              <a href="mailto:support@texora.ai" className="sf-contact-row">✉ support@texora.ai</a>
              <a href="https://texora.ai" target="_blank" rel="noopener noreferrer" className="sf-contact-row">🌐 texora.ai</a>
            </div>

            {/* Company */}
            <div>
              <div className="sf-col-head">Company</div>
              <button className="sf-link" onClick={() => navigate('/about')}>About Us</button>
              <a className="sf-link" href="https://texora.ai/career" target="_blank" rel="noopener noreferrer">Careers</a>
              <button className="sf-link" onClick={() => navigate('/contact')}>Contact Us</button>
              <a className="sf-link" href="https://texora.ai/blogs" target="_blank" rel="noopener noreferrer">Blog</a>
              <a className="sf-link" href="https://texora.ai/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </div>

            {/* Services */}
            <div>
              <div className="sf-col-head">Services & Support</div>
              <button className="sf-link" onClick={() => navigate('/#features')}>All Features</button>
              <button className="sf-link" onClick={() => navigate('/integrations')}>Integrations</button>
              <button className="sf-link" onClick={() => navigate('/feature/support')}>Support Tickets</button>
              <button className="sf-link" onClick={() => navigate('/#new')}>What's New</button>
              <button className="sf-link" onClick={() => navigate('/feature/support')}>Feedback System</button>
            </div>

            {/* Resources */}
            <div>
              <div className="sf-col-head">Resources</div>
              <button className="sf-link" onClick={() => navigate('/feature/lead-management')}>Lead Management</button>
              <button className="sf-link" onClick={() => navigate('/feature/sales-finance')}>Sales & Finance</button>
              <button className="sf-link" onClick={() => navigate('/feature/automation')}>Automation</button>
              <button className="sf-link" onClick={() => navigate('/feature/monetization')}>Monetization</button>
              <button className="sf-link" onClick={() => navigate('/feature/access-management')}>Access Control</button>
            </div>

            {/* My Account */}
            <div>
              <div className="sf-col-head">My Account</div>
              <button className="sf-link" onClick={() => navigate('/login')}>Sign In</button>
              <button className="sf-link" onClick={() => navigate('/register')}>Register</button>
              <button className="sf-link" onClick={() => navigate('/reseller/register')}>Become a Reseller</button>
              <button className="sf-link" onClick={() => navigate('/reseller/login')}>Partner Login</button>
            </div>

          </div>
        </div>

        {/* Contact CTA strip — exactly like ServiceNow image #16 */}
        <div className="sf-cta-strip">
          <div className="sf-cta-title">Request info or schedule a demo</div>
          <button className="sf-cta-btn" onClick={() => navigate('/contact')}>
            Contact Us
          </button>
        </div>

        {/* Identity bar — logo + tagline + social icons */}
        <div className="sf-identity">
          <div className="sf-identity-inner">
            <div className="sf-identity-left">
              <img src="/logo.png" alt="Unified CRM" style={{ height: 18, display: 'block' }} />
              <span className="sf-tagline">The CRM that works with your business™</span>
            </div>
            <div className="sf-socials">
              <a href="https://x.com/texoraai" target="_blank" rel="noopener noreferrer" className="sf-social-btn" style={{ background: '#000' }}>
                <svg width="14" height="14" fill="#fff" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.youtube.com/@Texoraai" target="_blank" rel="noopener noreferrer" className="sf-social-btn" style={{ background: '#ff0000' }}>
                <svg width="16" height="16" fill="#fff" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/texora-ai/" target="_blank" rel="noopener noreferrer" className="sf-social-btn" style={{ background: '#0a66c2' }}>
                <svg width="15" height="15" fill="#fff" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://www.instagram.com/texoraai" target="_blank" rel="noopener noreferrer" className="sf-social-btn" style={{ background: 'linear-gradient(135deg,#f77737,#e1306c,#833ab4)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#fff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Legal row — exactly like ServiceNow bottom */}
        <div className="sf-legal">
          <div className="sf-legal-inner">
            <span className="sf-copy">© {new Date().getFullYear()} Unified CRM by Texora AI. All rights reserved.</span>
            <span className="sf-legal-dot">·</span>
            <a href="https://texora.ai/privacy-policy" target="_blank" rel="noopener noreferrer" className="sf-legal-link">Privacy statement</a>
            <span className="sf-legal-dot">·</span>
            <button className="sf-legal-link" onClick={() => navigate('/contact')}>Site terms</button>
            <span className="sf-legal-dot">·</span>
            <button className="sf-legal-link" onClick={() => navigate('/contact')}>Accessibility</button>
            <span className="sf-legal-dot">·</span>
            <button className="sf-legal-link" onClick={() => navigate('/contact')}>Website feedback</button>
            <div className="sf-status">
              <div className="sf-status-dot" />
              All Systems Operational
            </div>
          </div>
        </div>

      </footer>
    </>
  );
}
