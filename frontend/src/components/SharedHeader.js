import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .sh-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    padding: 14px 0; transition: all 0.3s;
    font-family: 'Inter', -apple-system, sans-serif;
  }
  .sh-nav.scrolled {
    background: rgba(6,11,20,0.9);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 10px 0;
  }
  .sh-inner {
    max-width: 1440px; margin: 0 auto; padding: 0 40px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .sh-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; cursor: pointer; }
  .sh-links { display: flex; align-items: center; gap: 6px; }
  .sh-link {
    padding: 8px 16px; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.65); background: none; border: none;
    cursor: pointer; border-radius: 8px; transition: all 0.2s;
    text-decoration: none; font-family: inherit;
  }
  .sh-link:hover { color: #fff; background: rgba(255,255,255,0.07); }
  .sh-outline {
    padding: 8px 18px; font-size: 14px; font-weight: 600;
    color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12); border-radius: 9px;
    cursor: pointer; transition: all 0.2s; font-family: inherit;
  }
  .sh-outline:hover { background: rgba(255,255,255,0.12); color: #fff; }
  .sh-primary {
    padding: 9px 22px; font-size: 14px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg,#7c3aed,#3b82f6);
    border: none; border-radius: 9px; cursor: pointer;
    box-shadow: 0 4px 20px rgba(124,58,237,0.35);
    transition: all 0.2s; font-family: inherit;
  }
  .sh-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(124,58,237,0.5); }
  @media(max-width:768px) { .sh-links { display: none; } .sh-inner { padding: 0 20px; } }
`;

export default function SharedHeader() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <nav className={`sh-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="sh-inner">
          <div className="sh-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px' }}>
              <img src="/logo.png" alt="Unified CRM" style={{ height: 20, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
          </div>
          <div className="sh-links">
            <button className="sh-link" onClick={() => navigate('/')}>Home</button>
            <button className="sh-link" onClick={() => navigate('/feature/lead-management')}>Features</button>
            <button className="sh-link" onClick={() => navigate('/about')}>About</button>
            <button className="sh-link" onClick={() => navigate('/reseller/register')}>Partners</button>
            <button className="sh-outline" onClick={() => navigate('/login')}>Sign In</button>
            <button className="sh-primary" onClick={() => navigate('/register')}>Get Started →</button>
          </div>
        </div>
      </nav>
    </>
  );
}
