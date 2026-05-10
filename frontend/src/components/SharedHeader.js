import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .sh-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    height: 72px; display: flex; align-items: center;
    background: #0f1e2e;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    font-family: 'Inter', -apple-system, sans-serif;
    transition: all 0.3s;
  }
  .sh-nav.scrolled {
    background: rgba(15,30,46,0.97);
    backdrop-filter: blur(12px);
    box-shadow: 0 2px 20px rgba(0,0,0,0.4);
  }
  .sh-inner {
    width: 100%; padding: 0 24px 0 20px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .sh-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; flex-shrink: 0; }
  .sh-links { display: flex; align-items: center; gap: 4px; }
  .sh-link {
    padding: 7px 14px; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.75); background: none; border: none;
    cursor: pointer; border-radius: 8px; transition: all 0.18s;
    text-decoration: none; font-family: inherit; white-space: nowrap;
  }
  .sh-link:hover { color: #fff; background: rgba(255,255,255,0.07); }
  .sh-sep { width: 1px; height: 18px; background: rgba(255,255,255,0.12); margin: 0 6px; }
  .sh-outline {
    padding: 8px 18px; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.85); background: none; border: none;
    border-radius: 999px; cursor: pointer; transition: all 0.18s; font-family: inherit;
  }
  .sh-outline:hover { color: #fff; }
  .sh-primary {
    padding: 9px 20px; font-size: 14px; font-weight: 600; color: #fff;
    background: #1EB980; border: none; border-radius: 999px;
    cursor: pointer; transition: all 0.25s ease; font-family: inherit;
    white-space: nowrap; box-shadow: 0 2px 12px rgba(30,185,128,0.38);
  }
  .sh-primary:hover { background: #17a46f; transform: translateY(-1px); }
  .sh-back {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.6); background: none; border: none;
    cursor: pointer; border-radius: 8px; transition: all 0.18s; font-family: inherit;
  }
  .sh-back:hover { color: #fff; background: rgba(255,255,255,0.07); }

  /* Hamburger */
  .sh-burger {
    display: none; flex-direction: column; gap: 5px;
    background: none; border: none; cursor: pointer; padding: 6px;
  }
  .sh-burger span {
    display: block; width: 22px; height: 2px;
    background: rgba(255,255,255,0.85); border-radius: 2px;
    transition: all 0.25s ease;
  }
  .sh-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .sh-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .sh-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* Mobile drawer */
  .sh-drawer {
    position: fixed; top: 72px; left: 0; right: 0; bottom: 0;
    background: #0f1e2e; z-index: 999;
    display: flex; flex-direction: column; padding: 24px 20px;
    transform: translateX(100%); transition: transform 0.28s ease;
    border-top: 1px solid rgba(255,255,255,0.07);
    overflow-y: auto;
  }
  .sh-drawer.open { transform: translateX(0); }
  .sh-drawer-link {
    padding: 14px 16px; font-size: 16px; font-weight: 500;
    color: rgba(255,255,255,0.82); background: none; border: none;
    cursor: pointer; text-align: left; font-family: inherit;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: color 0.15s;
  }
  .sh-drawer-link:hover { color: #1EB980; }
  .sh-drawer-actions {
    display: flex; flex-direction: column; gap: 12px;
    margin-top: 24px; padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }
  .sh-drawer-signin {
    padding: 13px; font-size: 15px; font-weight: 600;
    color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12); border-radius: 999px;
    cursor: pointer; font-family: inherit; text-align: center;
  }
  .sh-drawer-cta {
    padding: 13px; font-size: 15px; font-weight: 700;
    color: #fff; background: #1EB980; border: none; border-radius: 999px;
    cursor: pointer; font-family: inherit; text-align: center;
    box-shadow: 0 4px 16px rgba(30,185,128,0.4);
  }

  @media(max-width:768px) {
    .sh-links { display: none; }
    .sh-inner { padding: 0 16px; }
    .sh-burger { display: flex; }
  }
  @media(min-width:769px) { .sh-drawer { display: none; } }
`;

export default function SharedHeader({ backTo, backLabel }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const go = (path) => { navigate(path); setMenuOpen(false); };

  return (
    <>
      <style>{CSS}</style>
      <nav className={`sh-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="sh-inner">
          <div className="sh-logo" onClick={() => go('/')}>
            <div style={{ background: '#fff', borderRadius: 8, padding: '5px 10px' }}>
              <img src="/logo.png" alt="Unified CRM" style={{ height: 22, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
          </div>

          {/* Desktop nav */}
          <div className="sh-links">
            {backTo && (
              <>
                <button className="sh-back" onClick={() => navigate(backTo)}>← {backLabel || 'Back'}</button>
                <div className="sh-sep" />
              </>
            )}
            <button className="sh-link" onClick={() => go('/')}>Home</button>
            <button className="sh-link" onClick={() => go('/all-features')}>Products</button>
            <button className="sh-link" onClick={() => go('/platform')}>Platform</button>
            <button className="sh-link" onClick={() => go('/industries')}>Industries</button>
            <button className="sh-link" onClick={() => go('/about')}>About</button>
            <button className="sh-link" onClick={() => go('/help')}>Support</button>
            <button className="sh-link" onClick={() => go('/contact')}>Contact</button>
            <div className="sh-sep" />
            <button className="sh-outline" onClick={() => go('/login')}>Sign In</button>
            <button className="sh-primary" onClick={() => go('/register')}>Get Started →</button>
          </div>

          {/* Hamburger */}
          <button className={`sh-burger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`sh-drawer${menuOpen ? ' open' : ''}`}>
        <button className="sh-drawer-link" onClick={() => go('/')}>🏠 Home</button>
        <button className="sh-drawer-link" onClick={() => go('/all-features')}>📦 Products</button>
        <button className="sh-drawer-link" onClick={() => go('/platform')}>🏗️ Platform</button>
        <button className="sh-drawer-link" onClick={() => go('/industries')}>🏭 Industries</button>
        <button className="sh-drawer-link" onClick={() => go('/demo')}>🎬 View a Demo</button>
        <button className="sh-drawer-link" onClick={() => go('/about')}>ℹ️ About Us</button>
        <button className="sh-drawer-link" onClick={() => go('/contact')}>📞 Contact</button>
        <button className="sh-drawer-link" onClick={() => go('/reseller/register')}>🤝 Become a Reseller</button>
        <div className="sh-drawer-actions">
          <button className="sh-drawer-signin" onClick={() => go('/login')}>Sign In</button>
          <button className="sh-drawer-cta" onClick={() => go('/register')}>Get Started Free →</button>
        </div>
      </div>
    </>
  );
}
