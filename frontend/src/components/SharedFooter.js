import React from 'react';
import { useNavigate } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .sf {
    background: #0a0f1f;
    position: relative;
    font-family: 'Inter', -apple-system, sans-serif;
    overflow: hidden;
  }

  /* Rainbow top border */
  .sf::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #7c3aed, #3b82f6, #10b981, #f59e0b, #ec4899, #ef4444);
  }

  /* Subtle glow blobs */
  .sf-blob1 {
    position: absolute; pointer-events: none;
    width: 400px; height: 400px;
    top: -100px; left: -80px;
    background: radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%);
    border-radius: 50%;
  }
  .sf-blob2 {
    position: absolute; pointer-events: none;
    width: 350px; height: 350px;
    bottom: -80px; right: 5%;
    background: radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%);
    border-radius: 50%;
  }

  .sf-main { max-width: 1440px; margin: 0 auto; padding: 52px 40px 0; position: relative; z-index: 1; }

  /* Top grid */
  .sf-grid {
    display: grid;
    grid-template-columns: 1.8fr 1fr 1fr 1fr 1.2fr;
    gap: 48px;
    padding-bottom: 44px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  /* Brand column */
  .sf-desc {
    font-size: 13px; color: rgba(255,255,255,0.38); line-height: 1.8;
    margin: 14px 0 20px; max-width: 250px;
  }
  .sf-contact-item {
    display: flex; align-items: center; gap: 9px;
    font-size: 13px; color: rgba(255,255,255,0.45);
    margin-bottom: 9px; text-decoration: none;
  }
  .sf-contact-icon {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; flex-shrink: 0;
  }
  .sf-socials { display: flex; gap: 10px; margin-top: 22px; }
  .sf-social-btn {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    text-decoration: none; transition: transform 0.2s, opacity 0.2s;
    opacity: 0.88; flex-shrink: 0;
  }
  .sf-social-btn:hover { transform: translateY(-3px); opacity: 1; }

  /* Nav columns */
  .sf-col-head {
    font-size: 13px; font-weight: 800; letter-spacing: 0.2px;
    margin: 0 0 18px; display: flex; align-items: center; gap: 7px;
  }
  .sf-link {
    display: flex; align-items: center; gap: 9px;
    font-size: 13px; color: rgba(255,255,255,0.5);
    margin-bottom: 10px; cursor: pointer; text-decoration: none;
    background: none; border: none; padding: 0; font-family: inherit;
    transition: all 0.2s; text-align: left; width: 100%;
  }
  .sf-link:hover { color: rgba(255,255,255,0.92); transform: translateX(4px); }
  .sf-link-icon {
    width: 22px; height: 22px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; flex-shrink: 0; transition: all 0.2s;
  }
  .sf-link:hover .sf-link-icon { opacity: 1; }

  /* Bottom bar */
  .sf-bottom {
    max-width: 1440px; margin: 0 auto; padding: 18px 40px;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 12px;
  }
  .sf-copy { font-size: 12px; color: rgba(255,255,255,0.22); }
  .sf-bottom-right { display: flex; align-items: center; gap: 20px; }
  .sf-version { font-size: 12px; color: rgba(255,255,255,0.25); }
  .sf-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #10b981; font-weight: 600; }
  .sf-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

  @media(max-width:1200px){ .sf-grid { grid-template-columns: 1fr 1fr 1fr; gap: 32px; } }
  @media(max-width:700px){ .sf-grid { grid-template-columns: 1fr 1fr; gap: 24px; } .sf-main { padding: 40px 20px 0; } .sf-bottom { padding: 16px 20px; flex-direction: column; text-align: center; } }
  @media(max-width:460px){ .sf-grid { grid-template-columns: 1fr; } }
`;

const LinkItem = ({ icon, label, color, onClick, href }) => {
  const style = {
    background: `${color}15`,
    color: color,
    border: `1px solid ${color}25`,
  };
  if (href) return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="sf-link">
      <span className="sf-link-icon" style={style}>{icon}</span>
      {label}
    </a>
  );
  return (
    <button className="sf-link" onClick={onClick}>
      <span className="sf-link-icon" style={style}>{icon}</span>
      {label}
    </button>
  );
};

export default function SharedFooter() {
  const navigate = useNavigate();

  return (
    <>
      <style>{CSS}</style>
      <footer className="sf">
        <div className="sf-blob1" />
        <div className="sf-blob2" />

        <div className="sf-main">
          <div className="sf-grid">

            {/* ── Brand ── */}
            <div>
              <div style={{ background: '#fff', borderRadius: 8, padding: '6px 12px', display: 'inline-block', marginBottom: 4 }}>
                <img src="/logo.png" alt="Unified CRM" style={{ height: 20, display: 'block' }} />
              </div>
              <p className="sf-desc">
                The complete CRM platform for B2B sales teams — leads, deals, support, billing, and everything in between.
              </p>

              {/* Contact */}
              <a href="mailto:support@texora.ai" className="sf-contact-item">
                <span className="sf-contact-icon" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>✉</span>
                support@texora.ai
              </a>
              <a href="https://texora.ai" target="_blank" rel="noopener noreferrer" className="sf-contact-item">
                <span className="sf-contact-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>🌐</span>
                texora.ai
              </a>

              {/* Social icons — original SVG, untouched */}
              <div className="sf-socials">
                <a href="https://www.instagram.com/texoraai" target="_blank" rel="noopener noreferrer" className="sf-social-btn"
                  style={{ background: 'linear-gradient(135deg,#f77737,#e1306c,#833ab4)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#fff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/texora-ai/" target="_blank" rel="noopener noreferrer" className="sf-social-btn"
                  style={{ background: '#0a66c2' }}>
                  <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/@Texoraai" target="_blank" rel="noopener noreferrer" className="sf-social-btn"
                  style={{ background: '#ff0000' }}>
                  <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="https://x.com/texoraai" target="_blank" rel="noopener noreferrer" className="sf-social-btn"
                  style={{ background: '#000' }}>
                  <svg width="15" height="15" fill="#fff" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* ── Product ── */}
            <div>
              <div className="sf-col-head" style={{ color: '#60a5fa' }}>
                <span style={{ fontSize: 16 }}>🔷</span> Product
              </div>
              <LinkItem icon="⚡" label="All Features"     color="#60a5fa" onClick={() => navigate('/#features')} />
              <LinkItem icon="🛡️" label="Security"         color="#60a5fa" onClick={() => navigate('/security')} />
              <LinkItem icon="🔌" label="Integrations"     color="#60a5fa" onClick={() => navigate('/integrations')} />
              <LinkItem icon="ℹ️" label="About Us"         color="#60a5fa" onClick={() => navigate('/about')} />
              <LinkItem icon="🆕" label="What's New"       color="#60a5fa" onClick={() => navigate('/#new')} />
            </div>

            {/* ── Company ── */}
            <div>
              <div className="sf-col-head" style={{ color: '#34d399' }}>
                <span style={{ fontSize: 16 }}>🏢</span> Company
              </div>
              <LinkItem icon="👋" label="About Us"         color="#34d399" onClick={() => navigate('/about')} />
              <LinkItem icon="💼" label="Careers"          color="#34d399" href="https://texora.ai/career" />
              <LinkItem icon="📞" label="Contact Us"       color="#34d399" href="https://texora.ai/contact" />
              <LinkItem icon="📝" label="Blog"             color="#34d399" href="https://texora.ai/blogs" />
              <LinkItem icon="🔒" label="Privacy Policy"   color="#34d399" href="https://texora.ai/privacy-policy" />
            </div>

            {/* ── Partners ── */}
            <div>
              <div className="sf-col-head" style={{ color: '#fb923c' }}>
                <span style={{ fontSize: 16 }}>🤝</span> Partners
              </div>
              <LinkItem icon="🚀" label="Become a Partner" color="#fb923c" onClick={() => navigate('/reseller/register')} />
              <LinkItem icon="🔑" label="Partner Login"    color="#fb923c" onClick={() => navigate('/reseller/login')} />
              <LinkItem icon="📦" label="Partner Resources" color="#fb923c" onClick={() => navigate('/partner-resources')} />
              <LinkItem icon="📊" label="Commission Rates" color="#fb923c" onClick={() => navigate('/reseller/register')} />
              <LinkItem icon="→"  label="Sign In"          color="#fb923c" onClick={() => navigate('/login')} />
            </div>

            {/* ── Features ── */}
            <div>
              <div className="sf-col-head" style={{ color: '#a78bfa' }}>
                <span style={{ fontSize: 16 }}>⚡</span> Features
              </div>
              <LinkItem icon="📋" label="Lead Management"    color="#a78bfa" onClick={() => navigate('/feature/lead-management')} />
              <LinkItem icon="✅" label="Task Management"    color="#a78bfa" onClick={() => navigate('/feature/task-management')} />
              <LinkItem icon="📄" label="Sales & Finance"    color="#a78bfa" onClick={() => navigate('/feature/sales-finance')} />
              <LinkItem icon="📦" label="Product"            color="#a78bfa" onClick={() => navigate('/feature/product')} />
              <LinkItem icon="⚙️" label="Automation"         color="#a78bfa" onClick={() => navigate('/feature/automation')} />
              <LinkItem icon="🔒" label="Access Management"  color="#a78bfa" onClick={() => navigate('/feature/access-management')} />
              <LinkItem icon="🎯" label="Support"            color="#a78bfa" onClick={() => navigate('/feature/support')} />
              <LinkItem icon="💰" label="Monetization"       color="#a78bfa" onClick={() => navigate('/feature/monetization')} />
            </div>

          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="sf-bottom">
          <div className="sf-copy">© {new Date().getFullYear()} Unified CRM by Texora AI · All rights reserved.</div>
          <div className="sf-bottom-right">
            <span className="sf-version">Version 1.0.0</span>
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
