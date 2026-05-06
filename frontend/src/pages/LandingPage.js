import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SharedFooter from '../components/SharedFooter';

/* ── Animated counter hook ── */
const useCounter = (target, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

/* ── Intersection observer hook ── */
const useInView = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

/* ── CSS injected once ── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  * { box-sizing: border-box; }

  body { margin: 0; background: #060b14; }

  .lp { font-family: 'Inter', -apple-system, sans-serif; background: #060b14; color: #fff; overflow-x: hidden; }

  /* Stars */
  .stars-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 40% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 60% 50%, rgba(255,255,255,0.7) 0%, transparent 100%),
      radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 10% 70%, rgba(255,255,255,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 50% 60%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 70% 90%, rgba(255,255,255,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 15% 45%, rgba(255,255,255,0.8) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 55% 25%, rgba(255,255,255,0.7) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 75% 65%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 25% 15%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 45% 85%, rgba(255,255,255,0.6) 0%, transparent 100%);
    background-size: 800px 800px;
    animation: twinkle 8s ease-in-out infinite alternate;
  }
  @keyframes twinkle {
    0% { opacity: 0.6; }
    100% { opacity: 1; }
  }

  /* Nav */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 18px 0; transition: all 0.3s;
  }
  .lp-nav.scrolled {
    background: rgba(6,11,20,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 12px 0;
  }
  .lp-nav-inner {
    max-width: 1440px; margin: 0 auto; padding: 0 40px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .lp-logo { display: flex; align-items: center; gap: 10px; }
  .lp-logo-box {
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    border-radius: 10px; padding: 7px 10px;
    font-size: 16px; font-weight: 900; color: #fff; letter-spacing: -0.5px;
  }
  .lp-logo-text { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .lp-logo-badge {
    font-size: 10px; font-weight: 700; color: #a78bfa;
    background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3);
    padding: 2px 8px; border-radius: 20px; letter-spacing: 1px;
  }
  .lp-nav-links { display: flex; align-items: center; gap: 6px; }
  .lp-nav-link {
    padding: 8px 16px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.65);
    background: none; border: none; cursor: pointer; border-radius: 8px; transition: all 0.2s;
    text-decoration: none;
  }
  .lp-nav-link:hover { color: #fff; background: rgba(255,255,255,0.07); }
  .lp-btn-outline {
    padding: 8px 18px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8);
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 9px; cursor: pointer; transition: all 0.2s;
  }
  .lp-btn-outline:hover { background: rgba(255,255,255,0.12); color: #fff; }
  .lp-btn-primary {
    padding: 9px 22px; font-size: 14px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    border: none; border-radius: 9px; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 6px;
    box-shadow: 0 4px 20px rgba(124,58,237,0.35);
  }
  .lp-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(124,58,237,0.5); }

  /* Glow orbs */
  .orb {
    position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
  }

  /* Hero */
  .hero-section {
    position: relative; padding: 160px 0 100px; min-height: 100vh;
    display: flex; align-items: center;
  }
  .hero-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; position: relative; z-index: 2; }
  .hero-social-proof {
    display: inline-flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 40px; padding: 8px 18px 8px 8px; margin-bottom: 32px;
  }
  .hero-avatars { display: flex; }
  .hero-avatar {
    width: 28px; height: 28px; border-radius: 50%; border: 2px solid #060b14;
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    margin-left: -6px; background: linear-gradient(135deg, #7c3aed, #3b82f6);
    font-weight: 700; color: #fff;
  }
  .hero-avatar:first-child { margin-left: 0; }
  .hero-proof-text { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.75); }
  .hero-proof-text span { color: #a78bfa; }
  .hero-h1 {
    font-size: clamp(42px, 6vw, 76px); font-weight: 900; line-height: 1.07;
    letter-spacing: -2px; margin: 0 0 24px; color: #fff;
  }
  .hero-h1 .grad1 {
    background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-sub {
    font-size: 18px; color: rgba(255,255,255,0.5); line-height: 1.7;
    max-width: 560px; margin: 0 0 40px;
  }
  .hero-sub span { color: #60a5fa; font-weight: 600; }
  .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 48px; }
  .hero-cta-main {
    padding: 15px 32px; font-size: 16px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 8px 32px rgba(124,58,237,0.4);
  }
  .hero-cta-main:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.55); }
  .hero-cta-ghost {
    padding: 15px 32px; font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px; cursor: pointer; transition: all 0.2s;
  }
  .hero-cta-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .hero-badges { display: flex; gap: 24px; flex-wrap: wrap; }
  .hero-badge { display: flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(255,255,255,0.45); }
  .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }

  /* Hero split cards */
  .hero-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .hero-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px; padding: 24px; transition: all 0.3s;
    backdrop-filter: blur(10px);
  }
  .hero-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.15); transform: translateY(-3px); }
  .hero-card-badge {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 700;
    letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 14px;
  }
  .hero-card-title { font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 8px; }
  .hero-card-sub { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0 0 18px; line-height: 1.5; }
  .hero-card-modules { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .hero-card-module {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 9px; padding: 10px 12px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8);
    cursor: pointer; transition: all 0.2s;
  }
  .hero-card-module:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .hero-card-link {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06);
    font-size: 13px; font-weight: 600; cursor: pointer;
    background: none; border: none; width: 100%;
  }

  /* Trusted bar */
  .trusted-bar {
    background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.05); padding: 14px 0;
  }
  .trusted-inner {
    max-width: 1440px; margin: 0 auto; padding: 0 40px;
    display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap;
  }
  .trusted-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.4); }
  .trusted-sep { width: 1px; height: 20px; background: rgba(255,255,255,0.1); }

  /* Stats */
  .stats-section { padding: 80px 0; position: relative; }
  .stats-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
  .stat-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    padding: 36px 28px; text-align: center; transition: all 0.3s;
  }
  .stat-card:first-child { border-radius: 16px 0 0 16px; }
  .stat-card:last-child { border-radius: 0 16px 16px 0; }
  .stat-card:hover { background: rgba(255,255,255,0.07); }
  .stat-num { font-size: clamp(28px, 6vw, 48px); font-weight: 900; letter-spacing: -2px; line-height: 1; margin-bottom: 8px; }
  .stat-lbl { font-size: 14px; color: rgba(255,255,255,0.45); font-weight: 500; }

  /* Marquee */
  .marquee-wrap { padding: 20px 0; overflow: hidden; border-top: 1px solid rgba(255,255,255,0.05); }
  .marquee-track { display: flex; gap: 0; width: max-content; animation: marqueeRun 30s linear infinite; }
  .marquee-track:hover { animation-play-state: paused; }
  @keyframes marqueeRun { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .marquee-chip {
    display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px;
    font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.55);
    border-right: 1px solid rgba(255,255,255,0.06); white-space: nowrap;
    transition: color 0.2s;
  }
  .marquee-chip:hover { color: #fff; }

  /* Section label */
  .sec-label {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 20px; padding: 5px 14px; font-size: 11px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px;
  }
  .sec-label.purple { background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); color: #a78bfa; }
  .sec-label.blue   { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; }
  .sec-label.green  { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
  .sec-label.orange { background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; }
  .sec-label.pink   { background: rgba(236,72,153,0.15); border: 1px solid rgba(236,72,153,0.3); color: #f472b6; }

  .sec-title { font-size: clamp(30px, 4vw, 48px); font-weight: 900; line-height: 1.15; letter-spacing: -1.5px; margin: 0 0 16px; }
  .sec-sub { font-size: 17px; color: rgba(255,255,255,0.45); line-height: 1.7; max-width: 520px; }

  /* Feature spotlight */
  .spotlight-section { padding: 100px 0; position: relative; }
  .spotlight-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
  .spotlight-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  .spotlight-grid.reverse { direction: rtl; }
  .spotlight-grid.reverse > * { direction: ltr; }

  /* Mock UI cards */
  .mock-wrap {
    position: relative; padding: 4px;
    background: linear-gradient(135deg, rgba(124,58,237,0.4), rgba(59,130,246,0.2), rgba(124,58,237,0.1));
    border-radius: 20px;
  }
  .mock-inner {
    background: #0e1624; border-radius: 17px; padding: 20px; overflow: hidden;
  }
  .mock-topbar {
    display: flex; align-items: center; gap: 6px; margin-bottom: 16px; padding-bottom: 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .mock-dot { width: 10px; height: 10px; border-radius: 50%; }
  .mock-title-bar {
    flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; margin-left: 8px;
  }
  .mock-row {
    display: flex; align-items: center; gap: 12px; padding: 12px 14px;
    background: rgba(255,255,255,0.04); border-radius: 10px; margin-bottom: 8px;
    border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s;
  }
  .mock-row:hover { background: rgba(255,255,255,0.08); }
  .mock-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .mock-row-content { flex: 1; }
  .mock-row-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); margin-bottom: 3px; }
  .mock-row-sub { font-size: 11px; color: rgba(255,255,255,0.35); }
  .mock-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
  .mock-stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 12px; }
  .mock-stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; text-align: center; }
  .mock-stat-num { font-size: 22px; font-weight: 800; }
  .mock-stat-lbl { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 2px; }

  /* Feature checklist */
  .check-list { list-style: none; padding: 0; margin: 28px 0 36px; display: flex; flex-direction: column; gap: 14px; }
  .check-item { display: flex; align-items: flex-start; gap: 12px; font-size: 15px; color: rgba(255,255,255,0.7); line-height: 1.5; }
  .check-icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; margin-top: 1px; }

  /* Feature grid */
  .features-section { padding: 100px 0; background: rgba(255,255,255,0.01); }
  .features-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
  .features-head { text-align: center; margin-bottom: 60px; }
  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .feat-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 28px; transition: all 0.3s; cursor: pointer;
  }
  .feat-card:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); transform: translateY(-4px); }
  .feat-icon { width: 48px; height: 48px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 18px; }
  .feat-title { font-size: 17px; font-weight: 700; color: #fff; margin: 0 0 10px; }
  .feat-desc { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; margin: 0; }
  .feat-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
  .feat-tag { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); }

  /* New features */
  .new-section { padding: 100px 0; }
  .new-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
  .new-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 48px; }
  .new-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 28px; display: flex; gap: 20px; align-items: flex-start;
    transition: all 0.3s;
  }
  .new-card:hover { background: rgba(255,255,255,0.07); transform: translateY(-3px); }
  .new-card-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .new-card-body { flex: 1; }
  .new-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; padding: 2px 10px; border-radius: 20px; margin-bottom: 10px; display: inline-block; }
  .new-card-title { font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 8px; word-break: break-word; }
  .new-card-desc { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; margin: 0; word-break: break-word; }
  .new-card-points { list-style: none; padding: 0; margin: 14px 0 0; display: flex; flex-direction: column; gap: 6px; }
  .new-card-point { font-size: 12px; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 8px; }

  /* Partner/Reseller */
  .partner-section { padding: 100px 0; background: rgba(255,255,255,0.01); }
  .partner-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
  .partner-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .partner-card {
    background: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.08) 100%);
    border: 1px solid rgba(124,58,237,0.25); border-radius: 20px; padding: 36px;
  }
  .partner-feature { display: flex; gap: 16px; margin-bottom: 20px; }
  .partner-feat-icon { width: 42px; height: 42px; border-radius: 11px; background: rgba(124,58,237,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .partner-feat-title { font-size: 15px; font-weight: 700; color: #fff; margin: 0 0 4px; }
  .partner-feat-desc { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; }

  /* CTA */
  .cta-section { padding: 120px 0; position: relative; overflow: hidden; }
  .cta-inner { max-width: 800px; margin: 0 auto; padding: 0 28px; text-align: center; position: relative; z-index: 2; }
  .cta-card {
    background: linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(59,130,246,0.15) 100%);
    border: 1px solid rgba(124,58,237,0.3); border-radius: 28px; padding: 72px 60px;
    position: relative; overflow: hidden;
  }
  .cta-glow { position: absolute; inset: -50%; background: radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.3) 0%, transparent 60%); pointer-events: none; }
  .cta-title { font-size: clamp(32px, 5vw, 54px); font-weight: 900; line-height: 1.1; letter-spacing: -1.5px; margin: 0 0 20px; }
  .cta-sub { font-size: 17px; color: rgba(255,255,255,0.5); line-height: 1.7; margin: 0 0 40px; }
  .cta-buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .cta-btn-main {
    padding: 16px 38px; font-size: 16px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 8px 32px rgba(124,58,237,0.45);
  }
  .cta-btn-main:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.6); }
  .cta-btn-ghost {
    padding: 16px 38px; font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px; cursor: pointer; transition: all 0.2s;
  }
  .cta-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }

  /* Footer */
  .footer { padding: 56px 0 28px; background: #070c18; position: relative; }
  .footer::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg,#7c3aed,#3b82f6,#10b981,#f59e0b,#ec4899); }
  .footer-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
  .footer-top { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1.3fr; gap: 40px; margin-bottom: 40px; }
  .footer-brand-desc { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.75; margin: 14px 0 0; max-width: 240px; }
  .footer-col-title { font-size: 13px; font-weight: 800; letter-spacing: 0.3px; margin: 0 0 14px; }
  .footer-link { display: flex; align-items: center; gap: 7px; font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 8px; cursor: pointer; transition: all 0.2s; background: none; border: none; text-align: left; padding: 0; font-family: inherit; text-decoration: none; }
  .footer-link:hover { color: rgba(255,255,255,0.9); transform: translateX(3px); }
  .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.06); }
  .footer-copy { font-size: 12px; color: rgba(255,255,255,0.22); }

  /* Footer accordion */
  .facc-item { border-bottom: 1px solid rgba(255,255,255,0.06); }
  .facc-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; cursor: pointer; background: none; border: none; width: 100%; font-family: inherit; }
  .facc-header:hover .facc-title { color: rgba(255,255,255,0.9); }
  .facc-icon { font-size: 14px; flex-shrink: 0; }
  .facc-title { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5); flex: 1; text-align: left; margin-left: 7px; transition: color 0.2s; }
  .facc-arrow { font-size: 10px; color: rgba(255,255,255,0.25); transition: transform 0.25s; }
  .facc-arrow.open { transform: rotate(180deg); }
  .facc-body { overflow: hidden; transition: max-height 0.3s ease; }
  .facc-sub { display: flex; align-items: center; gap: 6px; padding: 5px 0 5px 21px; font-size: 12px; color: rgba(255,255,255,0.38); }
  .facc-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

  /* Fade-in animation */
  .fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .fade-in.visible { opacity: 1; transform: translateY(0); }

  /* Responsive */
  @media (max-width: 900px) {
    .hero-section { padding: 120px 0 60px; }
    .hero-h1 { font-size: 38px; }
    .hero-main-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .hero-cards { grid-template-columns: 1fr 1fr; }
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .stats-inner { padding: 0 20px !important; }
    .stat-card { padding: 24px 16px !important; }
    .stat-num { font-size: 36px !important; }
    .spotlight-grid { grid-template-columns: 1fr !important; }
    .spotlight-grid.reverse { direction: ltr !important; }
    .spotlight-grid.reverse > * { direction: ltr !important; }
    .spotlight-inner { padding: 0 20px !important; }
    .mock-wrap { width: 100% !important; max-width: 100% !important; overflow: hidden !important; }
    .features-grid { grid-template-columns: 1fr 1fr; }
    .new-grid { grid-template-columns: 1fr; }
    .partner-grid { grid-template-columns: 1fr; }
    .footer-top { grid-template-columns: 1fr 1fr; gap: 28px; }
    .lp-nav-links { display: none; }
    .cta-card { padding: 48px 28px; }
    .spotlight-section { padding: 60px 0 !important; }
  }
  @media (max-width: 600px) {
    .new-grid { grid-template-columns: 1fr !important; }
    .new-card { flex-direction: column !important; gap: 12px !important; }
    .new-card-icon { width: 40px !important; height: 40px !important; font-size: 18px !important; }
    .new-card-title { font-size: 15px !important; }
    .new-card-desc { font-size: 12px !important; }
    .new-inner { padding: 0 16px !important; }
    .hero-main-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
    .hero-cards { grid-template-columns: 1fr !important; }
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .stats-inner { padding: 0 16px !important; }
    .stat-card { padding: 20px 12px !important; }
    .stat-num { font-size: 28px !important; letter-spacing: -1px !important; }
    .stat-lbl { font-size: 11px !important; }
    .features-grid { grid-template-columns: 1fr; }
    .footer-top { grid-template-columns: 1fr; }
    .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
    .trusted-inner { gap: 16px; }
    .trusted-sep { display: none; }
    .hero-h1 { font-size: 28px !important; letter-spacing: -1px !important; }
    .hero-inner { padding: 0 20px !important; }
    .hero-section { padding: 100px 0 40px !important; }
    .hero-ctas { flex-direction: column !important; align-items: flex-start !important; }
    .section-inner { padding: 0 20px !important; }
    .spotlight-inner { padding: 0 20px !important; }
    .lp-nav-inner { padding: 0 20px !important; }
    .footer-inner { padding: 0 20px !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .testimonial-grid { grid-template-columns: 1fr !important; }
    .cta-card { padding: 32px 20px !important; }
    .hero-proof-text { font-size: 11px !important; }
    .hero-badges { flex-wrap: wrap !important; gap: 6px !important; }
    .hero-sub { font-size: 14px !important; }
    .mock-wrap { width: 100% !important; max-width: 100% !important; }
  }
  @media (max-width: 400px) {
    .hero-h1 { font-size: 22px !important; }
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .hero-cards { grid-template-columns: 1fr !important; }
    .hero-inner { padding: 0 16px !important; }
    .stat-num { font-size: 22px !important; }
  }
`;

/* ─── Spotlight Mock: CRM Pipeline ─── */
const PipelineMock = () => (
  <div className="mock-wrap">
    <div className="mock-inner">
      <div className="mock-topbar">
        <div className="mock-dot" style={{ background: '#ef4444' }}/>
        <div className="mock-dot" style={{ background: '#f59e0b' }}/>
        <div className="mock-dot" style={{ background: '#10b981' }}/>
        <div className="mock-title-bar" style={{ maxWidth: 120 }}/>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Sales Pipeline</div>
      </div>
      {[
        { name: 'TechCorp Ltd.', stage: 'Proposal', value: '₹2.4L', color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', icon: '🏢' },
        { name: 'GlobalTrade Inc.', stage: 'Negotiation', value: '₹8.1L', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '💼' },
        { name: 'StartupHub', stage: 'Closed Won', value: '₹1.2L', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🎯' },
        { name: 'RetailMax', stage: 'Qualified', value: '₹3.8L', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '📋' },
      ].map((r, i) => (
        <div key={i} className="mock-row">
          <div className="mock-icon" style={{ background: r.bg }}>{r.icon}</div>
          <div className="mock-row-content">
            <div className="mock-row-title">{r.name}</div>
            <div className="mock-row-sub">Opportunity · {r.value}</div>
          </div>
          <div className="mock-badge" style={{ background: r.bg, color: r.color }}>{r.stage}</div>
        </div>
      ))}
      <div className="mock-stat-row">
        {[{ n: '₹15.5L', l: 'Pipeline' }, { n: '34', l: 'Active Leads' }, { n: '78%', l: 'Win Rate' }].map((s, i) => (
          <div key={i} className="mock-stat">
            <div className="mock-stat-num" style={{ color: ['#a78bfa','#60a5fa','#34d399'][i] }}>{s.n}</div>
            <div className="mock-stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Spotlight Mock: B2B Workflow ─── */
const WorkflowMock = () => (
  <div className="mock-wrap" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.4), rgba(59,130,246,0.2), rgba(16,185,129,0.1))' }}>
    <div className="mock-inner">
      <div className="mock-topbar">
        <div className="mock-dot" style={{ background: '#ef4444' }}/>
        <div className="mock-dot" style={{ background: '#f59e0b' }}/>
        <div className="mock-dot" style={{ background: '#10b981' }}/>
        <div className="mock-title-bar" style={{ maxWidth: 100 }}/>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>B2B Workflow</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {['📄 RFI', '💰 Quotation', '📦 Purchase Order', '🧾 Invoice'].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ background: i < 3 ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)', border: `1px solid ${i < 3 ? 'rgba(16,185,129,0.35)' : 'rgba(59,130,246,0.35)'}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: i < 3 ? '#34d399' : '#60a5fa', whiteSpace: 'nowrap' }}>{step}</div>
            {i < 3 && <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>→</div>}
          </div>
        ))}
      </div>
      {[
        { doc: 'RFI-2024-089', company: 'TechVision Pvt Ltd', status: 'Converted', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
        { doc: 'QT-2024-112', company: 'DataFlow Systems', status: 'Approved', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
        { doc: 'PO-2024-047', company: 'CloudBase Inc.', status: 'Processing', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
        { doc: 'INV-2024-203', company: 'SmartWork Corp', status: 'Paid', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
      ].map((r, i) => (
        <div key={i} className="mock-row">
          <div className="mock-icon" style={{ background: r.bg, fontSize: 14 }}>📄</div>
          <div className="mock-row-content">
            <div className="mock-row-title">{r.doc}</div>
            <div className="mock-row-sub">{r.company}</div>
          </div>
          <div className="mock-badge" style={{ background: r.bg, color: r.color }}>{r.status}</div>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Spotlight Mock: Team & Roles ─── */
const TeamMock = () => (
  <div className="mock-wrap" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.4), rgba(236,72,153,0.2), rgba(245,158,11,0.1))' }}>
    <div className="mock-inner">
      <div className="mock-topbar">
        <div className="mock-dot" style={{ background: '#ef4444' }}/>
        <div className="mock-dot" style={{ background: '#f59e0b' }}/>
        <div className="mock-dot" style={{ background: '#10b981' }}/>
        <div className="mock-title-bar" style={{ maxWidth: 110 }}/>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Team Management</div>
      </div>
      {[
        { name: 'Priya Sharma', role: 'Sales Manager', perms: 'Full Access', avatar: 'PS', color: '#7c3aed' },
        { name: 'Rahul Kumar', role: 'Sales Executive', perms: 'CRM + Tasks', avatar: 'RK', color: '#3b82f6' },
        { name: 'Anjali Singh', role: 'Support Lead', perms: 'Support Only', avatar: 'AS', color: '#10b981' },
        { name: 'Dev Patel', role: 'Account Manager', perms: 'Accounts + CRM', avatar: 'DP', color: '#f59e0b' },
      ].map((u, i) => (
        <div key={i} className="mock-row">
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${u.color}80, ${u.color}40)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{u.avatar}</div>
          <div className="mock-row-content">
            <div className="mock-row-title">{u.name}</div>
            <div className="mock-row-sub">{u.role}</div>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{u.perms}</div>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Spotlight Mock: Feedback / Support ─── */
const FeedbackMock = () => (
  <div className="mock-wrap" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.4), rgba(124,58,237,0.2), rgba(236,72,153,0.1))' }}>
    <div className="mock-inner">
      <div className="mock-topbar">
        <div className="mock-dot" style={{ background: '#ef4444' }}/>
        <div className="mock-dot" style={{ background: '#f59e0b' }}/>
        <div className="mock-dot" style={{ background: '#10b981' }}/>
        <div className="mock-title-bar" style={{ maxWidth: 120 }}/>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Feedback Intelligence</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[{ l: 'Total', v: '128', c: '#a78bfa' }, { l: 'Resolved', v: '94', c: '#34d399' }, { l: 'Escalated', v: '8', c: '#f472b6' }].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      {[
        { type: 'Bug Report', msg: 'Invoice PDF not generating', status: 'In Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
        { type: 'Feature Request', msg: 'Add dark mode support', status: 'Pending', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
        { type: 'Praise', msg: 'CRM has transformed our sales!', status: 'Resolved', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
      ].map((r, i) => (
        <div key={i} className="mock-row">
          <div className="mock-icon" style={{ background: r.bg, fontSize: 13 }}>
            {['🐛','💡','🌟'][i]}
          </div>
          <div className="mock-row-content">
            <div style={{ fontSize: 10, color: r.color, fontWeight: 700, marginBottom: 2 }}>{r.type}</div>
            <div className="mock-row-title" style={{ fontSize: 12 }}>{r.msg}</div>
          </div>
          <div className="mock-badge" style={{ background: r.bg, color: r.color }}>{r.status}</div>
        </div>
      ))}
    </div>
  </div>
);


const MODULES_SALES = [
  { icon: '📋', label: 'Leads' },
  { icon: '👥', label: 'Contacts' },
  { icon: '🏢', label: 'Accounts' },
  { icon: '💼', label: 'Opportunities' },
];
const MODULES_OPS = [
  { icon: '📄', label: 'RFI' },
  { icon: '💰', label: 'Quotations' },
  { icon: '📦', label: 'Purchase Orders' },
  { icon: '🧾', label: 'Invoices' },
];

const ALL_FEATURES = [
  { icon: '📋', title: 'Lead Management', desc: 'Capture, qualify, and convert leads with bulk import, pipeline tracking, and smart assignment.', color: '#7c3aed', tags: ['Pipeline', 'Bulk Import', 'Auto-assign'], details: ['Drag-and-drop Kanban pipeline', 'Bulk CSV import with field mapping', 'Smart auto-assignment rules', 'Lead scoring & prioritization', 'Activity timeline per lead', 'Duplicate detection & merge', 'Convert lead to contact/deal', 'Custom fields support', 'Source tracking & ROI report', 'Role-based data access'] },
  { icon: '👥', title: 'Contacts & Accounts', desc: 'Complete B2B contact management with relationship mapping and organization hierarchy.', color: '#3b82f6', tags: ['B2B', 'Relationships', 'Import'], details: ['Full 360° contact profiles', 'Parent-child account hierarchy', 'Relationship mapping across companies', 'Bulk import with deduplication', 'Email & call history on profile', 'Custom segments & saved filters', 'Link to leads, deals & tickets', 'Export to CSV / Excel', 'Activity score tracking', 'Custom fields per entity'] },
  { icon: '💼', title: 'Opportunities', desc: 'Sales pipeline with stage tracking, probability scoring, and revenue forecasting.', color: '#8b5cf6', tags: ['Pipeline', 'Forecast', 'Stages'], details: ['Multi-stage drag-and-drop pipeline', 'Probability scoring per stage', 'Weighted revenue forecasting', 'Individual & team quota tracking', 'Deal activity & history log', 'Win / Loss reason tracking', 'Link products to deals', 'Expected close date alerts', 'One-click convert to invoice', 'Pipeline analytics dashboard'] },
  { icon: '📄', title: 'B2B Sales Workflow', desc: 'RFI → Quotation → PO → Invoice complete workflow with PDF export and approval flows.', color: '#10b981', tags: ['PDF', 'Approval', 'E2E'], details: ['RFI creation & tracking', 'Quotation builder with line items', 'GST / tax rule configuration', 'Purchase Order generation', 'Invoice with payment tracking', 'One-click branded PDF export', 'Multi-level approval workflow', 'Document versioning history', 'Currency & discount support', 'Full audit trail per document'] },
  { icon: '✉️', title: 'Email Inbox', desc: 'Built-in email with IMAP sync, real-time tracking, and entity linking to leads/contacts.', color: '#06b6d4', tags: ['IMAP', 'Tracking', 'Sync'], details: ['Connect Gmail / Outlook / any IMAP', 'Two-way email sync in real time', 'Real-time open & click tracking', 'Auto-link emails to leads & contacts', 'Full conversation thread view', 'Rich text composer + attachments', 'CC / BCC with auto-complete', 'Inbox, Sent, Draft sync', 'Bulk email actions', 'Email-to-ticket conversion'] },
  { icon: '✅', title: 'Tasks & Meetings', desc: 'Task management, meeting scheduling, and call logging with priority and reminder system.', color: '#f59e0b', tags: ['Reminders', 'Calendar', 'Calls'], details: ['Create tasks with due date & priority', 'Link tasks to any CRM entity', 'Meeting scheduling with agenda', 'Call logging with outcome notes', 'Email & in-app reminders', 'Calendar day / week / month view', 'Recurring task support', 'Team task visibility for managers', 'Overdue task alerts', 'Activity report by rep'] },
  { icon: '📦', title: 'Product Catalog', desc: 'Product management with categories, pricing, marketplace, and field customization.', color: '#ef4444', tags: ['Catalog', 'Pricing', 'Categories'], details: ['Unlimited products & categories', 'Multi-tier pricing (retail, wholesale)', 'Product images & media uploads', 'Custom attributes per category', 'Stock & availability flags', 'GST / tax config per product', 'One-click add to quotation', 'Marketplace listing support', 'Bulk product import via CSV', 'Product analytics in reports'] },
  { icon: '🎯', title: 'Support Tickets', desc: 'Complete helpdesk with SLA tracking, priority management, and multi-tier escalation.', color: '#ec4899', tags: ['SLA', 'Escalation', 'Helpdesk'], details: ['Ticket creation via email / portal', 'SLA targets per priority level', 'Critical / High / Medium / Low priorities', 'Auto-escalation on SLA breach', 'Internal notes + customer replies', 'Ticket categories & custom fields', 'Auto-assign by category rules', 'Real-time status updates to customer', 'Link tickets to contacts & accounts', 'Support analytics dashboard'] },
  { icon: '💬', title: 'Feedback Management', desc: 'Customer feedback system with sentiment analysis, tenant-to-SAAS escalation, and analytics.', color: '#a855f7', tags: ['Sentiment', 'Analytics', 'New'], details: ['Collect feedback via in-app forms', 'Auto sentiment detection (pos/neu/neg)', '4 categories: bug, feature, complaint, praise', '3-tier escalation workflow', 'Feedback status: open / in-review / resolved', 'Sentiment trend analytics dashboard', 'Team response & resolution tracking', 'Filter by type, date & sentiment', 'Export feedback data to CSV', 'SLA-based escalation rules'] },
  { icon: '🌐', title: 'Social Media', desc: 'Social media post scheduling, management, and engagement tracking across platforms.', color: '#0ea5e9', tags: ['Scheduling', 'Multi-platform', 'New'], details: ['Connect multiple social accounts', 'Schedule posts in advance', 'Content calendar drag-and-drop view', 'Post queue management', 'Engagement tracking per post', 'Reach & impression analytics', 'Image & media attachments', 'Platform-specific formatting', 'Team collaboration on drafts', 'Auto-publish at optimal times'] },
  { icon: '🏛️', title: 'Org Hierarchy', desc: 'Visual org chart builder with node management, role templates, and team structure mapping.', color: '#14b8a6', tags: ['Org Chart', 'Roles', 'New'], details: ['Visual drag-and-drop org tree', 'Unlimited depth levels', 'Custom node types & roles', 'Role template library', 'Add employees to each node', 'Department & team grouping', 'Export as PDF / image', 'Manager-report relationship tracking', 'Org chart versioning history', 'Access-controlled viewing'] },
  { icon: '🤝', title: 'Reseller Program', desc: 'Complete partner ecosystem with commission tracking, multi-tier resellers, and dashboards.', color: '#f97316', tags: ['Commissions', 'Partners', 'Multi-tier'], details: ['Multi-tier reseller hierarchy', 'Auto commission calculation', 'Custom rates per partner tier', 'Partner sales dashboard', 'Reseller-managed customer accounts', 'Partner onboarding portal', 'Commission payout history', 'Performance leaderboard', 'White-label branding support', 'Admin oversight of all partners'] },
  { icon: '👨‍💼', title: 'Users & Roles', desc: 'Role-based access control with granular permissions, groups, and custom role templates.', color: '#84cc16', tags: ['RBAC', 'Groups', 'Permissions'], details: ['Unlimited custom roles', 'Module-level: view/create/edit/delete', 'User group permission management', 'Built-in Admin / Manager / Rep templates', 'Field-level visibility per role', 'Invite users with pre-assigned role', 'Login & activity audit logs', 'Suspend / reactivate users', 'Manager-scoped data visibility', 'Google OAuth & SSO support'] },
  { icon: '🔧', title: 'Field Customization', desc: 'Custom field builder for any entity. Add, modify, and manage fields without any code.', color: '#f59e0b', tags: ['No-code', 'Custom Fields', 'Flexible'], details: ['Add fields to any entity', '8+ field types: text, number, date, dropdown…', 'Drag-and-drop field reordering', 'Required field validation', 'Default value configuration', 'Field grouping & sections', 'Role-based field visibility', 'Multi-select & lookup fields', 'Custom field data in exports', 'API access to all custom fields'] },
  { icon: '💰', title: 'Monetization', desc: 'Tenant-level revenue tracking, subscription management, and billing with Razorpay integration.', color: '#10b981', tags: ['Billing', 'Subscriptions', 'Razorpay'], details: ['Subscription plan builder', 'Razorpay payment integration', 'Auto billing cycles', 'Trial period management', 'Plan upgrade / downgrade flows', 'MRR, ARR & churn analytics', 'Invoice per billing cycle', 'Failed payment retry / dunning', 'Coupon & discount management', 'Tenant-level usage metering'] },
  { icon: '📊', title: 'Data Center', desc: 'Global prospect and candidate database with advanced filtering and bulk operations.', color: '#6366f1', tags: ['Global DB', 'Bulk Ops', 'Filter'], details: ['Centralized prospect database', 'Advanced multi-condition filtering', 'Bulk import & export', 'Deduplication & smart merge', 'Tag-based segmentation', 'Saved filter views', 'Bulk assign to reps', 'Export selected fields to CSV', 'Data quality health metrics', 'API access for sync'] },
  { icon: '📑', title: 'Document Templates', desc: 'Reusable document templates with variable substitution and one-click PDF generation.', color: '#ec4899', tags: ['Templates', 'PDF', 'Variables'], details: ['Reusable templates for any doc type', 'Dynamic variable system {{contact.name}}', 'One-click branded PDF generation', 'Rich text editor with formatting', 'Template versioning history', 'Company logo & branding', 'Template categories & library', 'Live preview with real data', 'Share templates across team', 'Export as PDF or Word'] },
  { icon: '📈', title: 'Activity & Audit Logs', desc: 'Complete audit trail of all actions across the platform with filtering and export.', color: '#8b5cf6', tags: ['Audit', 'Compliance', 'Logs'], details: ['Every action logged automatically', 'Who, what, when & IP tracked', 'Before / after field value comparison', 'Real-time activity feed per entity', 'Global audit log with filters', 'Export to CSV / Excel', 'User activity reports', 'Module-specific log filtering', 'Suspicious activity alerts', 'Retention policy configuration'] },
  { icon: '📞', title: 'Calls Management', desc: 'Log, track, and analyze all sales calls with outcome tracking and entity linking.', color: '#06b6d4', tags: ['Call Log', 'Outcomes', 'Tracking'], details: ['Log inbound & outbound calls', 'Duration, date & direction tracking', 'Custom outcome options', 'Post-call notes & follow-up tasks', 'Link calls to leads / contacts / tickets', 'Rep call volume analytics', 'Team leaderboard', 'Missed call tracking & alerts', 'Call frequency per contact report', 'Export call logs to CSV'] },
  { icon: '🔔', title: 'Notifications', desc: 'Real-time in-app notifications with smart alerts for tasks, deals, tickets, and team activity.', color: '#f97316', tags: ['Real-time', 'Alerts', 'Settings'], details: ['Real-time in-app notification bell', 'Task due date & overdue alerts', 'Deal stage change notifications', 'New lead assignment alerts', 'SLA breach warnings', 'Email open tracking notifications', '@mention notifications in notes', 'Daily / weekly digest email', 'Per-type preference control', 'Notification history & mark-read'] },
  { icon: '📧', title: 'Email Templates', desc: 'Pre-built and custom email templates for outreach, follow-ups, and automated campaigns.', color: '#3b82f6', tags: ['Templates', 'Outreach', 'Campaigns'], details: ['Unlimited custom email templates', 'Dynamic variables {{first_name}} etc.', 'Rich text editor + images & links', 'Template categories & library', 'Pre-built outreach templates', 'Live preview with CRM data', 'One-click send from contact page', 'Open & click rate tracking', 'Template performance analytics', 'Share templates with team'] },
  { icon: '💳', title: 'Subscriptions & Plans', desc: 'Full subscription lifecycle — plan creation, upgrades, billing cycles, and Razorpay payment integration.', color: '#10b981', tags: ['Plans', 'Billing', 'Razorpay'], details: ['Create plans with custom features', 'Free trial with auto-conversion', 'Plan upgrade / downgrade workflows', 'Proration for mid-cycle changes', 'Razorpay auto-billing', 'Subscription status tracking', 'Automated renewal invoices', 'Cancellation & retention flows', 'MRR & ARR analytics', 'Churn alerts & at-risk detection'] },
  { icon: '🏢', title: 'Multi-Tenant SaaS', desc: 'Complete SAAS architecture — tenant isolation, white-label, admin panel, and tenant analytics.', color: '#7c3aed', tags: ['Multi-tenant', 'White-label', 'Isolation'], details: ['100% tenant data isolation', 'White-label branding per tenant', 'SAAS admin panel with full control', 'Per-tenant feature flag toggles', 'Tenant usage analytics', 'Admin impersonation for support', 'Tenant onboarding workflow', 'Per-tenant billing management', 'Global search across tenants', 'Platform health monitoring'] },
];

const FEAT_SLUG = {
  'Lead Management':       'lead-management',
  'Contacts & Accounts':   'lead-management',
  'Opportunities':         'lead-management',
  'B2B Sales Workflow':    'sales-finance',
  'Email Inbox':           'task-management',
  'Tasks & Meetings':      'task-management',
  'Product Catalog':       'product',
  'Support Tickets':       'support',
  'Feedback Management':   'support',
  'Social Media':          'automation',
  'Org Hierarchy':         'access-management',
  'Reseller Program':      'monetization',
  'Users & Roles':         'access-management',
  'Field Customization':   'access-management',
  'Monetization':          'monetization',
  'Data Center':           'lead-management',
  'Document Templates':    'automation',
  'Activity & Audit Logs': 'access-management',
  'Calls Management':      'task-management',
  'Notifications':         'access-management',
  'Email Templates':       'automation',
  'Subscriptions & Plans': 'account-management',
  'Multi-Tenant SaaS':     'monetization',
};

const NEW_FEATURES = [
  {
    icon: '💬', color: '#a855f7', bg: 'rgba(168,85,247,0.15)', badge: 'NEW', badgeBg: 'rgba(168,85,247,0.2)', badgeColor: '#c084fc',
    title: 'Feedback Management',
    desc: 'End-to-end customer feedback system with 3-tier architecture — user → tenant admin → SAAS admin escalation.',
    points: ['Sentiment auto-detection (positive/neutral/negative)', 'Analytics dashboard with charts', 'Multi-tier escalation workflow', 'Bug reports, feature requests, complaints, praise'],
  },
  {
    icon: '🏛️', color: '#14b8a6', bg: 'rgba(20,184,166,0.15)', badge: 'NEW', badgeBg: 'rgba(20,184,166,0.2)', badgeColor: '#2dd4bf',
    title: 'Org Hierarchy Builder',
    desc: 'Visual drag-and-drop org chart with node management, custom role templates, and department mapping.',
    points: ['Visual org tree with infinite depth', 'Custom node types & roles', 'Role template library', 'Export org chart as PDF'],
  },
  {
    icon: '🌐', color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', badge: 'NEW', badgeBg: 'rgba(14,165,233,0.2)', badgeColor: '#38bdf8',
    title: 'Social Media Hub',
    desc: 'Schedule, publish, and track posts across multiple social platforms directly from within the CRM.',
    points: ['Multi-platform scheduling', 'Post queue management', 'Engagement tracking', 'Content calendar view'],
  },
  {
    icon: '💰', color: '#10b981', bg: 'rgba(16,185,129,0.15)', badge: 'UPGRADED', badgeBg: 'rgba(16,185,129,0.2)', badgeColor: '#34d399',
    title: 'Monetization Engine',
    desc: 'Advanced revenue management with subscription plans, Razorpay billing, and tenant-level analytics.',
    points: ['Subscription lifecycle management', 'Razorpay payment integration', 'Revenue analytics & forecasting', 'Plan upgrade/downgrade flows'],
  },
  {
    icon: '🤖', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', badge: 'AI POWERED', badgeBg: 'rgba(245,158,11,0.2)', badgeColor: '#fbbf24',
    title: 'AI Assistant',
    desc: 'Built-in AI powered by Google Gemini for sales insights, email drafting, and smart recommendations.',
    points: ['AI-powered email drafting', 'Lead scoring suggestions', 'Sales insights & summaries', 'Powered by Gemini AI'],
  },
  {
    icon: '📑', color: '#ec4899', bg: 'rgba(236,72,153,0.15)', badge: 'UPGRADED', badgeBg: 'rgba(236,72,153,0.2)', badgeColor: '#f472b6',
    title: 'Document Templates',
    desc: 'Advanced template system with dynamic variable substitution for quotations, POs, invoices, and more.',
    points: ['Dynamic variable system', 'One-click PDF generation', 'Template versioning', 'Multi-format export'],
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [statsRef, statsInView] = useInView(0.3);
  const c1 = useCounter(25, 1800, statsInView);
  const c2 = useCounter(500, 2000, statsInView);
  const c3 = useCounter(99, 1600, statsInView);
  const c4 = useCounter(18, 1400, statsInView);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="lp">
      <style>{CSS}</style>
      <div className="stars-bg" />

      {/* ── NAV ── */}
      <nav className={`lp-nav${isScrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px' }}>
              <img src="/logo.png" alt="CRM Logo" style={{ height: 22, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
          </div>
          <div className="lp-nav-links">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#new" className="lp-nav-link">What's New</a>
            <a href="#partner" className="lp-nav-link">Partners</a>
            <button className="lp-nav-link" onClick={() => navigate('/reseller/register')}>Become a Reseller</button>
            <button className="lp-btn-outline" onClick={() => navigate('/login')}>Sign In</button>
            <button className="lp-btn-primary" onClick={() => navigate('/register')}>
              Get Started →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ position: 'relative' }}>
        <div className="orb" style={{ width: 600, height: 600, top: -100, left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(ellipse, rgba(124,58,237,0.25) 0%, transparent 70%)' }} />
        <div className="hero-inner">
          <div className="hero-main-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 64, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div className="hero-social-proof">
                <div className="hero-avatars">
                  {['S','R','A','K','P'].map((l, i) => (
                    <div key={i} className="hero-avatar" style={{ background: ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ec4899'][i] }}>{l}</div>
                  ))}
                </div>
                <span className="hero-proof-text"><span>500+</span> businesses growing with us</span>
              </div>

              <h1 className="hero-h1">
                The CRM Platform<br />
                <span className="grad1">Your Business Deserves</span>
              </h1>

              <p className="hero-sub">
                All-in-one CRM with <span>25+ modules</span>, complete B2B workflow, AI assistant, and multi-tenant architecture — built for teams that mean business.
              </p>

              <div className="hero-ctas">
                <button className="hero-cta-main" onClick={() => navigate('/register')}>
                  Start Free Trial →
                </button>
                <button className="hero-cta-ghost" onClick={() => navigate('/login')}>
                  Sign In
                </button>
              </div>

              <div className="hero-badges">
                <div className="hero-badge"><div className="hero-badge-dot"/> Multi-Tenant SaaS</div>
                <div className="hero-badge"><div className="hero-badge-dot" style={{ background: '#3b82f6' }}/> AI Powered</div>
                <div className="hero-badge"><div className="hero-badge-dot" style={{ background: '#f59e0b' }}/> 25+ Modules</div>
                <div className="hero-badge"><div className="hero-badge-dot" style={{ background: '#ec4899' }}/> No-Code Fields</div>
              </div>
            </div>

            {/* Right – Split cards */}
            <div className="hero-cards">
              {/* Sales & CRM card */}
              <div className="hero-card">
                <div className="hero-card-badge" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                  🎯 FOR SALES TEAMS
                </div>
                <div className="hero-card-title">Drive More Revenue</div>
                <div className="hero-card-sub">Pipeline, leads, contacts, and B2B deals — all tracked in one place.</div>
                <div className="hero-card-modules">
                  {MODULES_SALES.map((m, i) => (
                    <div key={i} className="hero-card-module">{m.icon} {m.label}</div>
                  ))}
                </div>
                <button className="hero-card-link" onClick={() => navigate('/register')} style={{ color: '#a78bfa' }}>
                  <span>Explore Sales CRM</span>
                  <span style={{ fontSize: 18 }}>→</span>
                </button>
              </div>

              {/* Operations card */}
              <div className="hero-card">
                <div className="hero-card-badge" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                  ⚙️ FOR OPERATIONS
                </div>
                <div className="hero-card-title">Automate B2B Workflow</div>
                <div className="hero-card-sub">From inquiry to invoice — complete document workflow with PDF export.</div>
                <div className="hero-card-modules">
                  {MODULES_OPS.map((m, i) => (
                    <div key={i} className="hero-card-module">{m.icon} {m.label}</div>
                  ))}
                </div>
                <button className="hero-card-link" onClick={() => navigate('/register')} style={{ color: '#34d399' }}>
                  <span>Explore B2B Workflow</span>
                  <span style={{ fontSize: 18 }}>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BAR ── */}
      <div className="trusted-bar">
        <div className="trusted-inner">
          {[
            { icon: '⚡', text: 'Powered by Gemini AI' },
            { icon: '🏢', text: 'Multi-Tenant Architecture' },
            { icon: '🔒', text: 'Role-Based Access Control' },
            { icon: '📄', text: 'PDF Generation Built-in' },
            { icon: '🤝', text: 'Reseller Program' },
            { icon: '📧', text: 'IMAP Email Sync' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <div className="trusted-item">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
              {i < 5 && <div className="trusted-sep" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="stats-section" ref={statsRef}>
        <div className="stats-inner">
          <div className="stats-grid">
            {[
              { num: `${c1}+`, label: 'Feature Modules', color: '#a78bfa' },
              { num: `${c2}+`, label: 'Businesses Onboarded', color: '#60a5fa' },
              { num: `${c3}.9%`, label: 'Uptime Guaranteed', color: '#34d399' },
              { num: `${c4}+`, label: 'Integrations & APIs', color: '#fbbf24' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...Array(2)].map((_, r) =>
            ['📋 Leads', '👥 Contacts', '🏢 Accounts', '💼 Opportunities', '📄 RFI', '💰 Quotations',
             '📦 Purchase Orders', '🧾 Invoices', '✅ Tasks', '📅 Meetings', '📞 Calls', '✉️ Email Inbox',
             '📊 Data Center', '🎫 Support Tickets', '💬 Feedback', '🌐 Social Media', '🏛️ Org Hierarchy',
             '🤝 Resellers', '🔧 Field Builder', '📦 Products', '💰 Monetization', '🤖 AI Assistant',
             '👨‍💼 Users & Roles', '📑 Doc Templates', '📈 Audit Logs', '🔔 Notifications',
             '📧 Email Templates', '💳 Subscriptions & Plans', '🏢 Multi-Tenant', '🛒 Product Marketplace'].map((item, i) => (
              <span key={`${r}-${i}`} className="marquee-chip">{item}</span>
            ))
          )}
        </div>
      </div>

      {/* ── SPOTLIGHT 1: Pipeline ── */}
      <section className="spotlight-section">
        <div className="spotlight-inner">
          <div className="spotlight-grid">
            <div>
              <PipelineMock />
            </div>
            <div>
              <div className="sec-label purple">🎯 SALES CRM</div>
              <h2 className="sec-title">Close Deals <br /><span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>10x Faster</span></h2>
              <p className="sec-sub">Full-stack sales CRM with lead pipeline, contact management, and opportunity tracking — built for modern B2B teams.</p>
              <ul className="check-list">
                {[
                  ['📋', 'Leads with bulk import, group & product linking'],
                  ['👥', 'Contacts & Accounts with relationship mapping'],
                  ['💼', 'Opportunities pipeline with stage tracking & forecasting'],
                  ['📊', 'Real-time analytics & conversion dashboards'],
                  ['🔧', 'Custom fields — no code needed'],
                ].map(([icon, text], i) => (
                  <li key={i} className="check-item">
                    <div className="check-icon" style={{ background: 'rgba(124,58,237,0.15)' }}>{icon}</div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <button className="hero-cta-main" onClick={() => navigate('/register')}>Get Started Free →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT 2: B2B Workflow (reversed) ── */}
      <section className="spotlight-section" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="spotlight-inner">
          <div className="spotlight-grid reverse">
            <div>
              <WorkflowMock />
            </div>
            <div>
              <div className="sec-label green">⚙️ B2B WORKFLOW</div>
              <h2 className="sec-title">From RFI to Invoice,<br /><span style={{ background: 'linear-gradient(135deg,#34d399,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Fully Automated</span></h2>
              <p className="sec-sub">Complete document workflow with professional PDF generation, approval flows, and payment tracking — all in one place.</p>
              <ul className="check-list">
                {[
                  ['📄', 'RFI management with vendor responses'],
                  ['💰', 'Professional quotation with PDF export'],
                  ['📦', 'Purchase Order processing & approvals'],
                  ['🧾', 'Invoice creation with payment status tracking'],
                  ['📑', 'Reusable document templates with dynamic variables'],
                ].map(([icon, text], i) => (
                  <li key={i} className="check-item">
                    <div className="check-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>{icon}</div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <button className="hero-cta-main" style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6)' }} onClick={() => navigate('/register')}>Start Free Trial →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT 3: Team Management ── */}
      <section className="spotlight-section">
        <div className="spotlight-inner">
          <div className="spotlight-grid">
            <div>
              <TeamMock />
            </div>
            <div>
              <div className="sec-label orange">👥 TEAM MANAGEMENT</div>
              <h2 className="sec-title">Built for <br /><span style={{ background: 'linear-gradient(135deg,#fbbf24,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Enterprise Teams</span></h2>
              <p className="sec-sub">Advanced role-based access control, org hierarchy, team groups, and custom permissions — manage any org structure with ease.</p>
              <ul className="check-list">
                {[
                  ['👨‍💼', 'Role-based access with granular permissions'],
                  ['🏛️', 'Visual org hierarchy builder with custom nodes'],
                  ['📝', 'Role template library for quick team setup'],
                  ['👥', 'Team groups with permission inheritance'],
                  ['📈', 'Activity logs & audit trail for compliance'],
                ].map(([icon, text], i) => (
                  <li key={i} className="check-item">
                    <div className="check-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>{icon}</div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <button className="hero-cta-main" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)' }} onClick={() => navigate('/register')}>Get Started Free →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT 4: Feedback & Support ── */}
      <section className="spotlight-section" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="spotlight-inner">
          <div className="spotlight-grid reverse">
            <div>
              <FeedbackMock />
            </div>
            <div>
              <div className="sec-label pink">💬 CUSTOMER INTELLIGENCE</div>
              <h2 className="sec-title">Hear Every<br /><span style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Voice, Act Fast</span></h2>
              <p className="sec-sub">Unified support tickets + feedback management with 3-tier escalation, sentiment analysis, and real-time intelligence dashboards.</p>
              <ul className="check-list">
                {[
                  ['💬', 'Feedback with sentiment auto-detection (AI)'],
                  ['🎫', 'Support tickets with SLA & priority tracking'],
                  ['↑', '3-tier escalation: User → Tenant Admin → SAAS'],
                  ['📊', 'Analytics: bug reports, feature requests, praises'],
                  ['🔔', 'Real-time notifications & reply workflow'],
                ].map(([icon, text], i) => (
                  <li key={i} className="check-item">
                    <div className="check-icon" style={{ background: 'rgba(236,72,153,0.15)' }}>{icon}</div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <button className="hero-cta-main" style={{ background: 'linear-gradient(135deg,#ec4899,#7c3aed)' }} onClick={() => navigate('/register')}>Start Free Trial →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALL FEATURES GRID ── */}
      <section className="features-section" id="features">
        <div className="features-inner">
          <div className="features-head">
            <div className="sec-label purple" style={{ margin: '0 auto 16px' }}>✨ COMPLETE MODULE LIST</div>
            <h2 className="sec-title" style={{ textAlign: 'center' }}>
              Everything You Need,<br />
              <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Nothing You Don't</span>
            </h2>
            <p className="sec-sub" style={{ textAlign: 'center', margin: '16px auto 0' }}>25+ powerful modules covering every aspect of your sales, operations, and customer management.</p>
          </div>
          <div className="features-grid">
            {ALL_FEATURES.map((f, i) => (
              <div key={i} className="feat-card" onClick={() => navigate(`/feature/${FEAT_SLUG[f.title] || 'lead-management'}`)} style={{ cursor: 'pointer' }}>
                <div className="feat-icon" style={{ background: `${f.color}18` }}>{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <p className="feat-desc">{f.desc}</p>
                <div className="feat-tags">
                  {f.tags.map((t, j) => (
                    <span key={j} className="feat-tag" style={t === 'New' ? { color: '#a78bfa', background: 'rgba(124,58,237,0.15)' } : {}}>{t}</span>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, color: f.color, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Learn more <span style={{ fontSize: 13 }}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S NEW ── */}
      <section className="new-section" id="new">
        <div className="new-inner">
          <div style={{ textAlign: 'center', marginBottom: 0 }}>
            <div className="sec-label purple" style={{ margin: '0 auto 16px' }}>🚀 LATEST UPDATES</div>
            <h2 className="sec-title" style={{ textAlign: 'center' }}>
              What's <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>New</span>
            </h2>
            <p className="sec-sub" style={{ textAlign: 'center', margin: '16px auto 0' }}>Constantly shipping powerful features. Here's what landed recently.</p>
          </div>
          <div className="new-grid">
            {NEW_FEATURES.map((f, i) => (
              <div key={i} className="new-card">
                <div className="new-card-icon" style={{ background: f.bg }}>{f.icon}</div>
                <div className="new-card-body">
                  <span className="new-badge" style={{ background: f.badgeBg, color: f.badgeColor }}>{f.badge}</span>
                  <div className="new-card-title">{f.title}</div>
                  <div className="new-card-desc">{f.desc}</div>
                  <ul className="new-card-points">
                    {f.points.map((p, j) => (
                      <li key={j} className="new-card-point">
                        <span style={{ color: f.color, flexShrink: 0 }}>✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPCOMING FEATURES ── */}
      <section style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="sec-label blue" style={{ margin: '0 auto 16px' }}>🔮 COMING SOON</div>
            <h2 className="sec-title" style={{ textAlign: 'center' }}>
              What's <span style={{ background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Coming Next</span>
            </h2>
            <p className="sec-sub" style={{ textAlign: 'center', margin: '16px auto 0' }}>We're building powerful features — stay tuned for what's next.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: '🤖', title: 'AI Assistant', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', desc: 'Gemini AI powered assistant for email drafting, lead scoring, sales insights, and smart summaries — directly inside your CRM.', tags: ['Gemini AI', 'Auto-draft', 'Insights'] },
              { icon: '📱', title: 'Mobile App', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', desc: 'Native iOS & Android app to manage leads, tasks, and pipeline on the go — full offline support with smart sync.', tags: ['iOS', 'Android', 'Offline'] },
              { icon: '📊', title: 'Advanced Analytics', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', desc: 'Deep sales analytics with custom dashboards, revenue forecasting, team performance tracking, and exportable reports.', tags: ['Dashboards', 'Forecast', 'Reports'] },
            ].map((f, i) => (
              <div key={i} style={{ background: f.bg, border: `1px solid ${f.border}`, borderRadius: 18, padding: 28, position: 'relative', overflow: 'hidden', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                {/* Coming Soon badge */}
                <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', padding: '3px 10px', borderRadius: 20 }}>
                  Coming Soon
                </div>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, border: `1px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 18 }}>{f.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 16 }}>{f.desc}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {f.tags.map((t, j) => (
                    <span key={j} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: f.bg, color: f.color, border: `1px solid ${f.border}` }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESELLER / PARTNER ── */}
      <section className="partner-section" id="partner">
        <div className="partner-inner">
          <div className="partner-grid">
            <div>
              <div className="sec-label purple">🤝 PARTNER PROGRAM</div>
              <h2 className="sec-title">Grow Together.<br /><span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Earn Together.</span></h2>
              <p className="sec-sub" style={{ marginBottom: 36 }}>Join our reseller network and earn commissions by bringing businesses onto our platform. Full support, dashboard, and resources provided.</p>
              <div style={{ display: 'flex', gap: 14 }}>
                <button className="hero-cta-main" onClick={() => navigate('/reseller/register')}>Become a Reseller →</button>
                <button className="hero-cta-ghost" onClick={() => navigate('/login')}>View Dashboard</button>
              </div>
            </div>
            <div className="partner-card">
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 24 }}>Partner Benefits</div>
              {[
                { icon: '💰', title: 'Recurring Commissions', desc: 'Earn on every tenant you onboard and retain — monthly recurring revenue.' },
                { icon: '📊', title: 'Partner Dashboard', desc: 'Full visibility into your referred tenants, revenue, and commission status.' },
                { icon: '🛠️', title: 'White-Label Ready', desc: 'Present Unified CRM as your own product to your clients.' },
                { icon: '🎓', title: 'Training & Support', desc: 'Dedicated onboarding, training materials, and priority support.' },
              ].map((f, i) => (
                <div key={i} className="partner-feature">
                  <div className="partner-feat-icon">{f.icon}</div>
                  <div>
                    <div className="partner-feat-title">{f.title}</div>
                    <div className="partner-feat-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-card">
            <div className="cta-glow" />
            <div className="sec-label purple" style={{ margin: '0 auto 20px' }}>🚀 GET STARTED TODAY</div>
            <h2 className="cta-title">
              Ready to Transform<br />
              <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Your Business?</span>
            </h2>
            <p className="cta-sub">Join hundreds of businesses already using Unified CRM to close more deals, manage better, and grow faster.</p>
            <div className="cta-buttons">
              <button className="cta-btn-main" onClick={() => navigate('/register')}>Start Free Trial →</button>
              <button className="cta-btn-ghost" onClick={() => navigate('/reseller/register')}>Become a Partner</button>
            </div>
            <div style={{ marginTop: 32, display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['✅ No credit card required', '⚡ Setup in minutes', '🔒 Enterprise-grade security'].map((t, i) => (
                <span key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <SharedFooter />
    </div>
  );
};

export default LandingPage;
