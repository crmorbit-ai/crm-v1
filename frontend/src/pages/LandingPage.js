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

  body { margin: 0; background: #0f1e2e; }

  .lp { font-family: 'Inter', -apple-system, sans-serif; background: #0f1e2e; color: #fff; overflow-x: hidden; }

  /* Subtle green particle bg */
  .stars-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      radial-gradient(1px 1px at 20% 30%, rgba(74,222,128,0.25) 0%, transparent 100%),
      radial-gradient(1px 1px at 60% 50%, rgba(74,222,128,0.2) 0%, transparent 100%),
      radial-gradient(1px 1px at 80% 20%, rgba(74,222,128,0.15) 0%, transparent 100%),
      radial-gradient(1px 1px at 10% 70%, rgba(74,222,128,0.2) 0%, transparent 100%),
      radial-gradient(1px 1px at 40% 85%, rgba(74,222,128,0.15) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 55% 25%, rgba(74,222,128,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 85% 75%, rgba(74,222,128,0.2) 0%, transparent 100%);
    background-size: 800px 800px;
    animation: twinkle 8s ease-in-out infinite alternate;
  }
  @keyframes twinkle {
    0% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  /* Nav */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 0; height: 72px; display: flex; align-items: center;
    background: #0f1e2e;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    transition: all 0.3s;
  }
  .lp-nav.scrolled {
    background: rgba(15,30,46,0.97);
    backdrop-filter: blur(12px);
    box-shadow: 0 2px 20px rgba(0,0,0,0.4);
  }
  .lp-nav-inner {
    width: 100%; padding: 0 24px 0 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .lp-logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .lp-logo-box {
    background: #1EB980;
    border-radius: 10px; padding: 7px 10px;
    font-size: 15px; font-weight: 900; color: #fff; letter-spacing: -0.5px;
  }
  .lp-logo-text { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
  .lp-logo-badge {
    font-size: 9px; font-weight: 700; color: #1EB980;
    background: rgba(30,185,128,0.15); border: 1px solid rgba(30,185,128,0.3);
    padding: 2px 8px; border-radius: 20px; letter-spacing: 1px;
  }
  .lp-nav-center { display: flex; align-items: center; gap: 1px; flex: 1; justify-content: center; }
  .lp-nav-links { display: flex; align-items: center; gap: 1px; }
  .lp-nav-link {
    padding: 7px 13px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.72);
    background: none; border: none; cursor: pointer; border-radius: 7px; transition: all 0.18s;
    text-decoration: none; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;
  }
  .lp-nav-link:hover { color: #fff; background: rgba(255,255,255,0.07); }
  .lp-nav-link .drop { font-size: 9px; opacity: 0.55; margin-top: 1px; }
  .lp-nav-sep { width: 1px; height: 18px; background: rgba(255,255,255,0.12); margin: 0 8px; }
  .lp-nav-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
  .lp-search-btn {
    width: 34px; height: 34px; border-radius: 7px; background: none; border: none;
    color: rgba(255,255,255,0.55); cursor: pointer; display: flex; align-items: center;
    justify-content: center; transition: all 0.18s; flex-shrink: 0;
  }
  .lp-search-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }
  .lp-btn-outline {
    padding: 8px 16px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.82);
    background: none; border: none; border-radius: 999px; cursor: pointer; transition: all 0.18s;
    white-space: nowrap;
  }
  .lp-btn-outline:hover { color: #fff; }
  .lp-btn-primary {
    padding: 9px 20px; font-size: 14px; font-weight: 600; color: #fff;
    background: #1EB980; border: none; border-radius: 999px; cursor: pointer;
    transition: all 0.25s ease; display: inline-flex; align-items: center; gap: 5px;
    white-space: nowrap; box-shadow: 0 2px 12px rgba(30,185,128,0.38);
  }
  .lp-btn-primary:hover { background: #17a46f; transform: translateY(-1px); box-shadow: 0 4px 18px rgba(30,185,128,0.52); }
  @media (max-width: 1024px) { .lp-nav-center { display: none; } }

  /* ── Mega Menu ── */
  @keyframes megaIn { from{opacity:0;transform:translateY(-6px);clip-path:inset(0 0 100% 0)} to{opacity:1;transform:translateY(0);clip-path:inset(0 0 0% 0)} }
  .lp-mega-backdrop {
    position: fixed; top: 72px; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 399;
  }
  .lp-mega-overlay {
    position: fixed; top: 72px; left: 0; right: 0;
    max-height: calc(100vh - 72px);
    overflow-y: auto;
    background: #0f1e2e; border-bottom: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 24px 60px rgba(0,0,0,0.55);
    z-index: 400; animation: megaIn 0.22s ease;
  }
  .lp-mega-inner {
    max-width: 1440px; margin: 0 auto; padding: 0;
    display: grid; grid-template-columns: 260px 1fr 280px;
    min-height: min(460px, calc(100vh - 72px));
  }
  /* Left sidebar */
  .lp-mega-left {
    background: #162e48; border-right: 1px solid rgba(255,255,255,0.08);
    padding: 24px 0; display: flex; flex-direction: column;
    overflow-y: auto;
  }
  .lp-mega-cat {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 20px; cursor: pointer; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.72); transition: all 0.15s;
    background: none; border: none; font-family: inherit; width: 100%; text-align: left;
  }
  .lp-mega-cat:hover { background: rgba(255,255,255,0.05); color: #fff; }
  .lp-mega-cat.active { background: #1a3654; color: #fff; font-weight: 600; border-left: 3px solid #1EB980; }
  .lp-mega-cat-arr { font-size: 12px; color: rgba(255,255,255,0.35); }
  .lp-mega-sep { height: 1px; background: rgba(255,255,255,0.08); margin: 10px 0; }
  .lp-mega-sec-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 1px; padding: 8px 20px 4px; text-transform: uppercase; }
  .lp-mega-view-all { display: flex; align-items: center; gap: 6px; padding: 12px 20px; font-size: 13px; font-weight: 600; color: #1EB980; cursor: pointer; background: none; border: none; font-family: inherit; margin-top: auto; transition: gap 0.15s; }
  .lp-mega-view-all:hover { gap: 10px; }
  /* Center */
  .lp-mega-center { padding: 28px 36px; overflow-y: auto; }
  .lp-mega-prod-title { font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 10px; letter-spacing: -0.5px; }
  .lp-mega-prod-desc { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.65; margin: 0 0 20px; max-width: 480px; }
  .lp-mega-see-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; font-size: 14px; font-weight: 600; color: #1EB980; background: transparent; border: 1.5px solid #1EB980; border-radius: 999px; cursor: pointer; font-family: inherit; transition: all 0.2s; margin-bottom: 28px; }
  .lp-mega-see-btn:hover { background: #1EB980; color: #fff; }
  .lp-mega-feat-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 16px; }
  .lp-mega-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .lp-mega-item { padding: 12px 14px; border-radius: 10px; cursor: pointer; transition: background 0.15s; }
  .lp-mega-item:hover { background: rgba(255,255,255,0.05); }
  .lp-mega-item-title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; }
  .lp-mega-item-desc { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.5; }
  /* Right card */
  .lp-mega-right {
    background: #1a3654; border-left: 1px solid rgba(255,255,255,0.08);
    padding: 28px 24px; display: flex; flex-direction: column; position: relative;
    overflow-y: auto;
  }
  .lp-mega-close { position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.15s; }
  .lp-mega-close:hover { background: rgba(255,255,255,0.15); color: #fff; }
  .lp-mega-card-label { font-size: 10px; font-weight: 700; color: #1EB980; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
  .lp-mega-card-title { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 14px; line-height: 1.25; }
  .lp-mega-card-desc { font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.7; margin-bottom: 24px; flex: 1; }
  .lp-mega-card-btn { display: inline-flex; align-items: center; gap: 6px; padding: 11px 22px; font-size: 14px; font-weight: 600; color: #1EB980; background: transparent; border: 1.5px solid #1EB980; border-radius: 999px; cursor: pointer; font-family: inherit; transition: all 0.2s; align-self: flex-start; }
  .lp-mega-card-btn:hover { background: #1EB980; color: #fff; }

  /* Mobile hamburger */
  .lp-burger {
    display: none; flex-direction: column; gap: 5px;
    background: none; border: none; cursor: pointer; padding: 6px; flex-shrink: 0;
  }
  .lp-burger span {
    display: block; width: 22px; height: 2px;
    background: rgba(255,255,255,0.85); border-radius: 2px;
    transition: all 0.25s ease;
  }
  .lp-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .lp-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .lp-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* Mobile drawer */
  .lp-drawer {
    position: fixed; top: 72px; left: 0; right: 0; bottom: 0;
    background: #0f1e2e; z-index: 399;
    display: flex; flex-direction: column; padding: 20px;
    transform: translateX(100%); transition: transform 0.28s ease;
    border-top: 1px solid rgba(255,255,255,0.07);
    overflow-y: auto;
  }
  .lp-drawer.open { transform: translateX(0); }
  .lp-drawer-link {
    padding: 14px 16px; font-size: 16px; font-weight: 500;
    color: rgba(255,255,255,0.82); background: none; border: none;
    cursor: pointer; text-align: left; font-family: inherit;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: color 0.15s;
  }
  .lp-drawer-link:hover { color: #1EB980; }
  .lp-drawer-btns {
    display: flex; flex-direction: column; gap: 12px;
    margin-top: 24px; padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }
  .lp-drawer-signin {
    padding: 13px; font-size: 15px; font-weight: 600;
    color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12); border-radius: 999px;
    cursor: pointer; font-family: inherit; text-align: center;
  }
  .lp-drawer-cta {
    padding: 13px; font-size: 15px; font-weight: 700;
    color: #fff; background: #1EB980; border: none; border-radius: 999px;
    cursor: pointer; font-family: inherit; text-align: center;
    box-shadow: 0 4px 16px rgba(30,185,128,0.4);
  }

  /* Nav dropdown — React state controlled */
  .lp-nav-item { position: relative; }
  .lp-nav-trigger {
    padding: 7px 13px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.72);
    background: none; border: none; cursor: pointer; border-radius: 7px; transition: all 0.18s;
    display: inline-flex; align-items: center; gap: 4px; font-family: inherit; white-space: nowrap;
  }
  .lp-nav-trigger:hover, .lp-nav-trigger.active { color: #fff; background: rgba(255,255,255,0.07); }
  .lp-nav-trigger .drop { font-size: 9px; opacity: 0.55; transition: transform 0.2s; }
  .lp-nav-trigger.active .drop { transform: rotate(180deg); opacity: 0.9; }

  @keyframes dropIn { from { opacity:0; transform:translateX(-50%) translateY(-8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
  .lp-dropdown {
    position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%);
    background: #0f1e2e; border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px; padding: 10px; min-width: 240px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.3);
    z-index: 500; animation: dropIn 0.18s ease;
  }
  .lp-dd-header {
    font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35);
    text-transform: uppercase; letter-spacing: 1px;
    padding: 4px 10px 8px; margin-top: 2px;
  }
  .lp-dd-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 9px; cursor: pointer;
    font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.82);
    text-decoration: none; background: none; border: none;
    font-family: inherit; width: 100%; text-align: left;
    transition: all 0.14s;
  }
  .lp-dd-item:hover { background: rgba(30,185,128,0.12); color: #1EB980; }
  .lp-dd-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(30,185,128,0.12); border: 1px solid rgba(30,185,128,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
  }
  .lp-dd-text { flex: 1; }
  .lp-dd-title { font-size: 13px; font-weight: 600; line-height: 1.2; }
  .lp-dd-sub { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 1px; line-height: 1.3; }
  .lp-dd-sep { height: 1px; background: rgba(255,255,255,0.08); margin: 6px 0; }
  .lp-dd-footer {
    margin: 6px 0 2px; padding: 8px 10px; border-radius: 9px;
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: #1EB980; cursor: pointer;
    background: none; border: none; font-family: inherit; width: 100%;
    transition: background 0.14s;
  }
  .lp-dd-footer:hover { background: rgba(30,185,128,0.1); }

  /* Glow orbs */
  .orb {
    position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
  }

  /* Hero */
  .hero-section {
    position: relative; padding: 152px 0 100px; min-height: 100vh;
    display: flex; align-items: center;
    background:
      radial-gradient(ellipse at 82% 8%, #1EB980 0%, rgba(30,185,128,0.55) 28%, transparent 55%),
      radial-gradient(ellipse at 5% 90%, #0a1622 0%, transparent 42%),
      linear-gradient(150deg, #0a1622 0%, #0d1c2e 15%, #10243a 30%, #132d46 45%, #163654 58%, #194060 68%, #1c4e62 76%, #1d5c58 84%, #1e7050 91%, #1EB980 100%);
  }

  /* ── CURSOR GLOW ── */
  .lp-cursor-glow {
    position:fixed; pointer-events:none; z-index:9999; border-radius:50%;
    width:400px; height:400px; margin-left:-200px; margin-top:-200px;
    background:radial-gradient(circle, rgba(30,185,128,0.10) 0%, rgba(30,185,128,0.04) 35%, transparent 70%);
    filter:blur(2px); transition:opacity 0.3s;
  }

  /* ── FLOWING GRADIENT TEXT ── */
  @keyframes gradientFlow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .hero-rotate-word {
    background: linear-gradient(270deg, #1EB980, #4ade80, #22d3ee, #1EB980, #86efac) !important;
    background-size: 300% 300% !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    animation: gradientFlow 4s ease infinite !important;
  }

  /* ── 3D CARD TILT ── */
  .tilt-card {
    transform-style: preserve-3d;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    will-change: transform;
  }
  .tilt-card:hover {
    box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 40px rgba(30,185,128,0.12) !important;
  }
  .tilt-card-shine {
    position:absolute; inset:0; border-radius:inherit;
    background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.06) 0%, transparent 65%);
    pointer-events:none; z-index:2;
  }

  /* ── 1. Floating hero orbs ── */
  @keyframes floatOrb1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(30px,-40px) scale(1.08); }
    66%      { transform: translate(-20px,20px) scale(0.95); }
  }
  @keyframes floatOrb2 {
    0%,100% { transform: translate(0,0) scale(1); }
    40%     { transform: translate(-35px,25px) scale(1.05); }
    70%     { transform: translate(20px,-30px) scale(0.97); }
  }
  @keyframes floatOrb3 {
    0%,100% { transform: translate(0,0); }
    50%     { transform: translate(25px,35px); }
  }
  .hero-orb1 {
    position:absolute; width:560px; height:560px; border-radius:50%;
    background:radial-gradient(ellipse,rgba(30,185,128,0.22) 0%,transparent 65%);
    top:-15%; right:-8%; pointer-events:none; filter:blur(48px); z-index:1;
    animation: floatOrb1 12s ease-in-out infinite;
  }
  .hero-orb2 {
    position:absolute; width:420px; height:420px; border-radius:50%;
    background:radial-gradient(ellipse,rgba(30,185,128,0.14) 0%,transparent 65%);
    bottom:-10%; left:-5%; pointer-events:none; filter:blur(55px); z-index:1;
    animation: floatOrb2 16s ease-in-out infinite;
  }
  .hero-orb3 {
    position:absolute; width:300px; height:300px; border-radius:50%;
    background:radial-gradient(ellipse,rgba(74,222,128,0.12) 0%,transparent 65%);
    top:20%; left:15%; pointer-events:none; filter:blur(65px); z-index:1;
    animation: floatOrb3 20s ease-in-out infinite;
  }

  /* ── 2. Scroll-reveal ── */
  .reveal {
    opacity:0; transform:translateY(36px);
    transition: opacity 0.75s cubic-bezier(0.4,0,0.2,1), transform 0.75s cubic-bezier(0.4,0,0.2,1);
  }
  .reveal.visible { opacity:1; transform:translateY(0); }
  .reveal-d1 { transition-delay:0.1s; }
  .reveal-d2 { transition-delay:0.2s; }
  .reveal-d3 { transition-delay:0.3s; }
  .reveal-d4 { transition-delay:0.4s; }

  /* ── 4. Tab slide ── */
  .sp-slide-in {
    animation: slideInTab 0.38s cubic-bezier(0.4,0,0.2,1);
  }
  @keyframes slideInTab {
    from { opacity:0; transform:translateX(28px); }
    to   { opacity:1; transform:translateX(0); }
  }

  /* ── 5. Dual marquee ── */
  .marquee-wrap { padding:0; overflow:hidden; border-top:1px solid rgba(255,255,255,0.05); }
  .marquee-row { padding:12px 0; overflow:hidden; }
  .marquee-row:first-child { border-bottom:1px solid rgba(255,255,255,0.06); }
  .marquee-track { display:flex; gap:0; width:max-content; animation:marqueeRun 30s linear infinite; }
  .marquee-track.reverse { animation:marqueeRunRev 28s linear infinite; }
  .marquee-track:hover { animation-play-state:paused; }
  @keyframes marqueeRunRev { from{transform:translateX(-50%)} to{transform:translateX(0)} }

  /* ── 6. Badge pulse ── */
  @keyframes badgePulse {
    0%,100% { box-shadow:0 0 0 0 rgba(30,185,128,0.4); }
    50%     { box-shadow:0 0 0 8px rgba(30,185,128,0); }
  }
  .sec-label.pulse-badge {
    animation: badgePulse 2.5s ease-in-out infinite;
  }

  /* ── 7. Feature card stagger ── */
  .stagger-card {
    opacity:0; transform:translateY(28px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .stagger-card.visible { opacity:1; transform:translateY(0); }

  /* Scroll progress bar */
  .lp-scroll-bar {
    position:fixed; top:0; left:0; height:3px; z-index:9999;
    background:linear-gradient(90deg,#1EB980,#4ade80);
    transition:width 0.08s linear;
    box-shadow:0 0 10px rgba(30,185,128,0.7);
  }

  /* Floating orbs (page-level) */
  .lp-orb {
    position:fixed; border-radius:50%; pointer-events:none; z-index:0;
    filter:blur(80px); transition:all 1s ease;
  }
  .hero-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; position: relative; z-index: 2; }
  .hero-social-proof {
    display: inline-flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
    border-radius: 40px; padding: 8px 18px 8px 8px; margin-bottom: 32px;
    backdrop-filter: blur(8px);
  }
  .hero-avatars { display: flex; }
  .hero-avatar {
    width: 30px; height: 30px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    margin-left: -6px; background: #1EB980;
    font-weight: 700; color: #fff;
  }
  .hero-avatar:first-child { margin-left: 0; }
  .hero-proof-text { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.95); }
  .hero-proof-text span { color: #fff; font-weight: 700; }
  .hero-h1 {
    font-size: clamp(42px, 6vw, 72px); font-weight: 700; line-height: 1.05;
    letter-spacing: -2px; margin: 0 0 28px; color: #fff;
    animation: heroFadeUp 0.8s ease both;
  }
  .hero-h1 .grad1 {
    color: #1EB980;
    background: linear-gradient(135deg,#1EB980,#4ade80);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: heroFadeUp 1s ease 0.2s both;
    display: inline-block;
  }
  @keyframes heroFadeUp {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .hero-sub { animation: heroFadeUp 0.9s ease 0.35s both; }
  .hero-ctas { animation: heroFadeUp 0.9s ease 0.5s both; }
  .hero-social-proof { animation: heroFadeUp 0.7s ease 0.1s both; }

  /* Continuously rotating feature text */
  .hero-rotate-wrap {
    display:inline-block; height:1.15em; overflow:hidden; vertical-align:bottom;
  }
  .hero-rotate-track {
    display:flex; flex-direction:column;
    animation: rotateWords 9s cubic-bezier(0.4,0,0.2,1) infinite;
  }
  .hero-rotate-word {
    height:1.15em; line-height:1.15em; white-space:nowrap;
    background:linear-gradient(135deg,#1EB980,#4ade80);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  @keyframes rotateWords {
    0%,16%  { transform:translateY(0); }
    20%,36% { transform:translateY(-16.66%); }
    40%,56% { transform:translateY(-33.33%); }
    60%,76% { transform:translateY(-50%); }
    80%,96% { transform:translateY(-66.66%); }
    100%    { transform:translateY(-83.33%); }
  }

  /* Spotlight tabs — pill style like image 2 */
  .sp-tabs-wrap {
    display:flex; justify-content:center; padding:0 40px;
  }
  .sp-tabs {
    display:inline-flex; gap:4px;
    background:rgba(255,255,255,0.08);
    border-radius:999px; padding:5px;
    overflow-x:auto; scrollbar-width:none;
  }
  .sp-tabs::-webkit-scrollbar { display:none; }
  .sp-tab {
    padding:10px 24px; font-size:14px; font-weight:600; font-family:inherit;
    color:rgba(255,255,255,0.55); background:none; border:none; cursor:pointer;
    border-radius:999px; white-space:nowrap; transition:all .25s;
  }
  .sp-tab:hover { color:rgba(255,255,255,0.9); background:rgba(255,255,255,0.06); }
  .sp-tab.active {
    color:#0f1e2e; background:#e8f5e9;
    box-shadow:0 2px 12px rgba(0,0,0,0.25);
  }
  .sp-content { animation: spFadeIn 0.35s ease; }
  @keyframes spFadeIn { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
  .hero-sub {
    font-size: 19px; color: rgba(255,255,255,0.82); line-height: 1.65;
    max-width: 600px; margin: 0 0 44px; font-weight: 400;
  }
  .hero-sub span { color: #fff; font-weight: 600; }
  .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 48px; }
  .hero-cta-main {
    padding: 14px 28px; font-size: 16px; font-weight: 600; color: #fff;
    background: #1EB980;
    border: none; border-radius: 999px; cursor: pointer; transition: all 0.25s ease;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(30,185,128,0.4);
  }
  .hero-cta-main:hover { background: #17a46f; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(30,185,128,0.5); }
  .hero-cta-ghost {
    padding: 14px 28px; font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.9);
    background: transparent; border: 1px solid rgba(255,255,255,0.35);
    border-radius: 999px; cursor: pointer; transition: all 0.25s ease;
  }
  .hero-cta-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.6); }
  .hero-badges { display: flex; gap: 24px; flex-wrap: wrap; }
  .hero-badge { display: flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
  .hero-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; }

  /* Hero split cards */
  .hero-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .hero-card {
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 18px; padding: 24px; transition: all 0.3s;
    backdrop-filter: blur(12px);
  }
  .hero-card:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.3); transform: translateY(-3px); }
  .hero-card-badge {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 700;
    letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 14px;
  }
  .hero-card-title { font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 8px; }
  .hero-card-sub { font-size: 13px; color: rgba(255,255,255,0.8); margin: 0 0 18px; line-height: 1.5; }
  .hero-card-modules { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .hero-card-module {
    display: flex; align-items: center; justify-content: center; gap: 5px;
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 10px; padding: 8px 10px; font-size: 11px; font-weight: 700; color: #fff;
    cursor: pointer; transition: all 0.2s;
    height: 56px; width: 100%; box-sizing: border-box;
    text-align: center; word-break: break-word; line-height: 1.35;
  }
  .hero-card-module:hover { background: rgba(255,255,255,0.25); }
  .hero-card-module:hover { background: rgba(255,255,255,0.25); }
  .hero-card-link {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.2);
    font-size: 13px; font-weight: 600; cursor: pointer;
    background: none; border: none; width: 100%; color: rgba(255,255,255,0.9);
  }

  /* Trusted bar */
  .trusted-bar {
    background: #162e48; border-top: 1px solid rgba(255,255,255,0.07);
    border-bottom: 1px solid rgba(255,255,255,0.07); padding: 18px 0;
  }
  .trusted-inner {
    max-width: 1440px; margin: 0 auto; padding: 0 40px;
    display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap;
  }
  .trusted-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: rgba(255,255,255,0.55); font-weight: 500; }
  .trusted-sep { width: 1px; height: 20px; background: rgba(255,255,255,0.12); }

  /* Stats */
  .stats-section { padding: 80px 0; position: relative; background: #162e48; }
  .stats-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: rgba(255,255,255,0.08); border-radius: 24px; overflow: hidden; }
  .stat-card {
    background: #1a3654; border: none;
    padding: 40px 28px; text-align: center; transition: all 0.3s;
  }
  .stat-card:hover { background: #1e3e62; }
  .stat-num { font-size: clamp(28px, 6vw, 52px); font-weight: 700; letter-spacing: -2px; line-height: 1; margin-bottom: 10px; color: #1EB980; white-space: nowrap; }
  .stat-lbl { font-size: 15px; color: rgba(255,255,255,0.65); font-weight: 500; }

  /* Marquee — defined in animation block above, no duplicates */
  @keyframes marqueeRun { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .marquee-chip {
    display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px;
    font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.55);
    border-left: 1px solid rgba(255,255,255,0.08); white-space: nowrap;
    transition: color 0.2s;
  }
  .marquee-chip:hover { color: #fff; }

  /* Section label */
  .sec-label {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 20px; padding: 5px 14px; font-size: 11px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px;
  }
  .sec-label.purple { background: rgba(30,185,128,0.15); border: 1px solid rgba(30,185,128,0.3); color: #1EB980; }
  .sec-label.blue   { background: rgba(30,185,128,0.1); border: 1px solid rgba(30,185,128,0.25); color: #25d494; }
  .sec-label.green  { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
  .sec-label.orange { background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; }
  .sec-label.pink   { background: rgba(236,72,153,0.15); border: 1px solid rgba(236,72,153,0.3); color: #f472b6; }

  .sec-title { font-size: clamp(28px, 3.5vw, 48px); font-weight: 700; line-height: 1.1; letter-spacing: -1px; margin: 0 0 16px; }
  .sec-sub { font-size: 18px; color: rgba(255,255,255,0.6); line-height: 1.7; max-width: 520px; font-weight: 400; }

  /* Feature spotlight */
  .spotlight-section { padding: 100px 0; position: relative; background: #0f1e2e; }
  .spotlight-inner { max-width: 1280px; margin: 0 auto; padding: 0 40px; }
  .spotlight-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .spotlight-grid.reverse { direction: rtl; }
  .spotlight-grid.reverse > * { direction: ltr; }

  /* Mock UI cards */
  .mock-wrap {
    position: relative; padding: 1px;
    background: linear-gradient(135deg, rgba(30,185,128,0.5), rgba(26,54,84,0.8), rgba(30,185,128,0.2));
    border-radius: 20px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.35);
  }
  .mock-inner {
    background: #0f1e2e; border-radius: 19px; padding: 20px; overflow: hidden;
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
  .check-item { display: flex; align-items: flex-start; gap: 12px; font-size: 16px; color: rgba(255,255,255,0.78); line-height: 1.6; }
  .check-icon { width: 24px; height: 24px; border-radius: 6px; background: rgba(30,185,128,0.2); border: 1px solid rgba(30,185,128,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; margin-top: 2px; color: #1EB980; }

  /* Feature grid */
  .features-section { padding: 100px 0; background: #162e48; }
  .features-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
  .features-head { text-align: center; margin-bottom: 60px; }
  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .feat-card {
    background: #1a3654; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px; padding: 28px; transition: all 0.3s; cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1), 0 12px 40px rgba(0,0,0,0.15);
  }
  .feat-card:hover { background: #1e3e62; border-color: rgba(30,185,128,0.3); transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
  .feat-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 18px; }
  .feat-title { font-size: 17px; font-weight: 700; color: #fff; margin: 0 0 10px; }
  .feat-desc { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.65; margin: 0; }
  .feat-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
  .feat-tag { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; background: rgba(30,185,128,0.1); color: rgba(30,185,128,0.85); border: 1px solid rgba(30,185,128,0.2); }

  /* New features */
  .new-section { padding: 100px 0; background: #0f1e2e; }
  .new-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
  .new-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 48px; }
  .new-card {
    background: #1a3654; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px; padding: 32px; display: flex; gap: 20px; align-items: flex-start;
    transition: all 0.3s;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1), 0 12px 40px rgba(0,0,0,0.15);
  }
  .new-card:hover { background: #1e3e62; border-color: rgba(30,185,128,0.25); transform: translateY(-3px); }
  .new-card-icon { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .new-card-body { flex: 1; }
  .new-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; margin-bottom: 10px; display: inline-block; }
  .new-card-title { font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 10px; word-break: break-word; }
  .new-card-desc { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.65; margin: 0; word-break: break-word; }
  .new-card-points { list-style: none; padding: 0; margin: 14px 0 0; display: flex; flex-direction: column; gap: 6px; }
  .new-card-point { font-size: 12px; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 8px; }

  /* Partner/Reseller */
  .partner-section { padding: 100px 0; background: #162e48; }
  .partner-inner { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
  .partner-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .partner-card {
    background: #1a3654;
    border: 1px solid rgba(30,185,128,0.2); border-radius: 24px; padding: 40px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15), 0 12px 40px rgba(0,0,0,0.2);
  }
  .partner-feature { display: flex; gap: 16px; margin-bottom: 24px; }
  .partner-feat-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(30,185,128,0.15); border: 1px solid rgba(30,185,128,0.25); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .partner-feat-title { font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 4px; }
  .partner-feat-desc { font-size: 14px; color: rgba(255,255,255,0.55); margin: 0; line-height: 1.6; }

  /* CTA */
  .cta-section { padding: 120px 0; position: relative; overflow: hidden; background: #0f1e2e; }
  .cta-inner { max-width: 800px; margin: 0 auto; padding: 0 28px; text-align: center; position: relative; z-index: 2; }
  .cta-card {
    background: linear-gradient(145deg, #1a3654 0%, #162e48 50%, #1a4060 100%);
    border: 1px solid rgba(30,185,128,0.25); border-radius: 32px; padding: 80px 60px;
    position: relative; overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.3);
  }
  .cta-glow { position: absolute; inset: -50%; background: radial-gradient(ellipse at 50% 0%, rgba(30,185,128,0.2) 0%, transparent 55%); pointer-events: none; }
  .cta-title { font-size: clamp(32px, 5vw, 54px); font-weight: 900; line-height: 1.1; letter-spacing: -1.5px; margin: 0 0 20px; }
  .cta-sub { font-size: 17px; color: rgba(255,255,255,0.5); line-height: 1.7; margin: 0 0 40px; }
  .cta-buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .cta-btn-main {
    padding: 16px 38px; font-size: 16px; font-weight: 600; color: #fff;
    background: #1EB980;
    border: none; border-radius: 999px; cursor: pointer; transition: all 0.25s ease;
    box-shadow: 0 4px 20px rgba(30,185,128,0.4);
  }
  .cta-btn-main:hover { background: #17a46f; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(30,185,128,0.5); }
  .cta-btn-ghost {
    padding: 16px 38px; font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px; cursor: pointer; transition: all 0.2s;
  }
  .cta-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }

  /* Footer */
  .footer { padding: 56px 0 28px; background: #0a1622; position: relative; }
  .footer::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg,#1EB980,#17a46f,#1EB980,#25d494,#1EB980); }
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
  /* Industries spotlight grid and coming-soon grid */
  .lp-industries-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; border-left: 1px solid rgba(255,255,255,0.07); padding-left: 40px; }
  .lp-coming-soon-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

  @media (max-width: 1024px) {
    .features-grid { grid-template-columns: repeat(2, 1fr); }
    .features-inner { padding: 0 24px !important; }
    .partner-inner { padding: 0 24px !important; }
    .new-inner { padding: 0 24px !important; }
    .lp-industries-grid { grid-template-columns: repeat(2, 1fr); }
    .lp-coming-soon-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 1100px) {
    .spotlight-grid { gap: 36px; }
    .spotlight-inner { padding: 0 28px; }
    .mock-wrap { overflow: hidden; }
  }
  @media (max-width: 900px) {
    .hero-section { padding: 120px 0 60px; }
    .hero-h1 { font-size: 42px !important; letter-spacing: -1.5px !important; }
    .hero-main-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .hero-cards { grid-template-columns: 1fr 1fr; }
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .stats-inner { padding: 0 20px !important; }
    .stat-card { padding: 24px 16px !important; }
    .stat-num { font-size: 36px !important; }
    .spotlight-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
    .spotlight-grid.reverse { direction: ltr !important; }
    .spotlight-grid.reverse > * { direction: ltr !important; }
    .spotlight-inner { padding: 0 20px !important; }
    .mock-wrap { display: none !important; }
    .features-grid { grid-template-columns: 1fr 1fr; }
    .features-inner { padding: 0 20px !important; }
    .new-grid { grid-template-columns: 1fr; }
    .partner-grid { grid-template-columns: 1fr; }
    .partner-inner { padding: 0 20px !important; }
    .footer-top { grid-template-columns: 1fr 1fr; gap: 28px; }
    .lp-nav-links { display: none; }
    .lp-nav-center { display: none; }
    .lp-nav-actions { display: none; }
    .lp-burger { display: flex !important; }
    .cta-card { padding: 48px 28px; }
    .spotlight-section { padding: 60px 0 !important; }
    .lp-industries-grid { grid-template-columns: repeat(2,1fr); padding-left: 20px; }
    .lp-coming-soon-grid { grid-template-columns: 1fr; }
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
    .hero-h1 { font-size: 32px !important; letter-spacing: -1px !important; }
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
    .lp-industries-grid { grid-template-columns: 1fr 1fr !important; padding-left: 16px !important; border-left: none !important; }
    .lp-coming-soon-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 400px) {
    .hero-h1 { font-size: 30px !important; }
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
        { name: 'TechCorp Ltd.', stage: 'Proposal', value: '₹2.4L', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: '🏢' },
        { name: 'GlobalTrade Inc.', stage: 'Negotiation', value: '₹8.1L', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '💼' },
        { name: 'StartupHub', stage: 'Closed Won', value: '₹1.2L', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🎯' },
        { name: 'RetailMax', stage: 'Qualified', value: '₹3.8L', color: '#4ade80', bg: 'rgba(74,222,128,0.15)', icon: '📋' },
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
            <div className="mock-stat-num" style={{ color: ['#4ade80','#22c55e','#34d399'][i] }}>{s.n}</div>
            <div className="mock-stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Spotlight Mock: B2B Workflow ─── */
const WorkflowMock = () => (
  <div className="mock-wrap" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.45), rgba(16,185,129,0.2), rgba(22,163,74,0.1))' }}>
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
            <div style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.35)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#4ade80', whiteSpace: 'nowrap', minWidth: 110, textAlign: 'center' }}>{step}</div>
            {i < 3 && <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>→</div>}
          </div>
        ))}
      </div>
      {[
        { doc: 'RFI-2024-089', company: 'TechVision Pvt Ltd', status: 'Converted', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
        { doc: 'QT-2024-112', company: 'DataFlow Systems', status: 'Approved', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
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
        { name: 'Priya Sharma', role: 'Sales Manager', perms: 'Full Access', avatar: 'PS', color: '#22c55e' },
        { name: 'Rahul Kumar', role: 'Sales Executive', perms: 'CRM + Tasks', avatar: 'RK', color: '#16a34a' },
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
  <div className="mock-wrap" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.45), rgba(16,185,129,0.25), rgba(22,163,74,0.1))' }}>
    <div className="mock-inner">
      <div className="mock-topbar">
        <div className="mock-dot" style={{ background: '#ef4444' }}/>
        <div className="mock-dot" style={{ background: '#f59e0b' }}/>
        <div className="mock-dot" style={{ background: '#10b981' }}/>
        <div className="mock-title-bar" style={{ maxWidth: 120 }}/>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Feedback Intelligence</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[{ l: 'Total', v: '128', c: '#4ade80' }, { l: 'Resolved', v: '94', c: '#34d399' }, { l: 'Escalated', v: '8', c: '#f59e0b' }].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      {[
        { type: 'Bug Report', msg: 'Invoice PDF not generating', status: 'In Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
        { type: 'Feature Request', msg: 'Add dark mode support', status: 'Pending', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
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
  { icon: '📦', label: 'Purchase Order' },
  { icon: '🧾', label: 'Invoices' },
];

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
  const [openDrop, setOpenDrop] = useState(null);
  const [megaCat, setMegaCat] = useState('featured');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [spotlightTab, setSpotlightTab] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mouse, setMouse] = useState({ x: -999, y: -999 });
  const [mouseSmooth, setMouseSmooth] = useState({ x: -999, y: -999 });
  const mouseRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    document.body.style.overflow = mobileMenu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenu]);

  const goTo = (path) => { navigate(path); setMobileMenu(false); setOpenDrop(null); };
  const [statsRef, statsInView] = useInView(0.3);
  const c1 = useCounter(25, 1800, statsInView);
  const c2 = useCounter(500, 2000, statsInView);
  const c3 = useCounter(99, 1600, statsInView);
  const c4 = useCounter(18, 1400, statsInView);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 40);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const closeOnOutside = (e) => {
      if (!e.target.closest('.lp-nav-item')) setOpenDrop(null);
    };
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, []);

  // Mouse cursor glow — smooth follow
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    // Smooth lerp loop
    let raf;
    const lerp = (a, b, t) => a + (b - a) * t;
    const loop = () => {
      setMouseSmooth(prev => ({
        x: lerp(prev.x, mouseRef.current.x, 0.1),
        y: lerp(prev.y, mouseRef.current.y, 0.1),
      }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  // Scroll reveal — runs after paint so elements exist in DOM
  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(el => {
          if (el.isIntersecting) {
            el.target.classList.add('visible');
            observer.unobserve(el.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
      return () => observer.disconnect();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="lp" style={{
      background: `linear-gradient(170deg,
        hsl(${210 + scrollProgress * 30}, ${40 + scrollProgress * 20}%, ${8 + scrollProgress * 4}%) 0%,
        hsl(${215 + scrollProgress * 25}, ${45 + scrollProgress * 15}%, ${10 + scrollProgress * 5}%) 50%,
        hsl(${160 - scrollProgress * 20}, ${50 + scrollProgress * 10}%, ${8 + scrollProgress * 6}%) 100%)`
    }}>
      {/* Scroll progress bar */}
      <div className="lp-scroll-bar" style={{ width: `${scrollProgress * 100}%` }} />


      {/* Floating ambient orbs */}
      <div className="lp-orb" style={{
        width: 500, height: 500,
        background: `radial-gradient(circle, rgba(30,185,128,${0.06 + scrollProgress * 0.08}) 0%, transparent 70%)`,
        top: `${-10 + scrollProgress * 20}%`,
        right: `${-5 + scrollProgress * 10}%`,
      }}/>
      <div className="lp-orb" style={{
        width: 400, height: 400,
        background: `radial-gradient(circle, rgba(14,165,233,${0.04 + scrollProgress * 0.06}) 0%, transparent 70%)`,
        bottom: `${10 - scrollProgress * 15}%`,
        left: `${-8 + scrollProgress * 5}%`,
      }}/>
      <style>{CSS}</style>

      {/* ── NAV ── */}
      <nav className={`lp-nav${isScrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-inner">
          {/* Logo */}
          <div className="lp-logo">
            <div style={{ background: '#fff', borderRadius: 8, padding: '5px 10px' }}>
              <img src="/logo.png" alt="CRM Logo" style={{ height: 22, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
          </div>

          {/* Center Nav */}
          <div className="lp-nav-center">

            {/* Products — Mega Menu */}
            <div className="lp-nav-item">
              <button className={`lp-nav-trigger${openDrop==='products'?' active':''}`}
                onClick={()=>{ setOpenDrop(openDrop==='products'?null:'products'); setMegaCat('featured'); }}>
                Products <span className="drop">▾</span>
              </button>
            </div>

            <button className="lp-nav-link" onClick={() => navigate('/partners')}>Partners</button>

            <button className="lp-nav-link" onClick={() => navigate('/platform')}>Platform</button>
            <button className="lp-nav-link" onClick={() => navigate('/about')}>About Us</button>
            <button className="lp-nav-link" onClick={() => navigate('/contact')}>Contact Us</button>
            <div className="lp-nav-sep" />
            <button className="lp-nav-link" onClick={() => navigate('/help')}>Support</button>
          </div>

          {/* Actions */}
          <div className="lp-nav-actions">
            <button className="lp-search-btn" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
              </svg>
            </button>
            <button className="lp-btn-outline" onClick={() => navigate('/login')}>Sign In</button>
            <button className="lp-btn-primary" onClick={() => navigate('/register')}>Get Started →</button>
          </div>

          {/* Hamburger — mobile only */}
          <button className={`lp-burger${mobileMenu ? ' open' : ''}`} onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`lp-drawer${mobileMenu ? ' open' : ''}`}>
        <button className="lp-drawer-link" onClick={() => goTo('/all-features')}>📦 Products</button>
        <button className="lp-drawer-link" onClick={() => goTo('/platform')}>🏗️ Platform</button>
        <button className="lp-drawer-link" onClick={() => goTo('/demo')}>🎬 View a Demo</button>
        <button className="lp-drawer-link" onClick={() => goTo('/partners')}>🤝 Partners</button>
        <button className="lp-drawer-link" onClick={() => goTo('/partners')}>💼 Become a Reseller</button>
        <button className="lp-drawer-link" onClick={() => goTo('/about')}>ℹ️ About Us</button>
        <button className="lp-drawer-link" onClick={() => goTo('/contact')}>📞 Contact Us</button>
        <div className="lp-drawer-btns">
          <button className="lp-drawer-signin" onClick={() => goTo('/login')}>Sign In</button>
          <button className="lp-drawer-cta" onClick={() => goTo('/register')}>Get Started Free →</button>
        </div>
      </div>

      {/* ── MEGA MENU — Products ── */}
      {openDrop === 'products' && (
        <>
        <div className="lp-mega-backdrop" onClick={()=>setOpenDrop(null)} />
        <div className="lp-mega-overlay" onMouseDown={e=>e.stopPropagation()}>
          <div className="lp-mega-inner">

            {/* Left sidebar */}
            <div className="lp-mega-left">
              {[
                { id:'featured',   label:'CRM Products' },
                { id:'sales',      label:'Sales CRM' },
                { id:'ops',        label:'B2B Operations' },
                { id:'support',    label:'Support & Feedback' },
                { id:'saas',       label:'SaaS Platform' },
                { id:'solutions',  label:'Solutions' },
                { id:'industries', label:'Industries' },
              ].map(c=>(
                <button key={c.id} className={`lp-mega-cat${megaCat===c.id?' active':''}`}
                  onClick={()=>setMegaCat(c.id)}>
                  {c.label} <span className="lp-mega-cat-arr">›</span>
                </button>
              ))}
              <div className="lp-mega-sep"/>
              <div className="lp-mega-sec-label">Quick Access</div>
              {[
                { label:'AI Assistant', path:'/feature/lead-management' },
                { label:'Data Center',  path:'/data-center-feature' },
                { label:'Integrations', path:'/integrations' },
              ].map(l=>(
                <button key={l.label} className="lp-mega-cat"
                  onClick={()=>{navigate(l.path);setOpenDrop(null);}}>
                  {l.label} <span className="lp-mega-cat-arr">›</span>
                </button>
              ))}
              <button className="lp-mega-view-all" onClick={()=>{navigate('/all-features');setOpenDrop(null);}}>
                View All Products →
              </button>
            </div>

            {/* Center content */}
            <div className="lp-mega-center">
              {megaCat === 'featured' && <>
                <div className="lp-mega-prod-title">Products</div>
                <div className="lp-mega-prod-desc">Unify your sales, operations, and customer management with AI-powered modules built for modern B2B teams.</div>
                <button className="lp-mega-see-btn" onClick={()=>{navigate('/all-features');setOpenDrop(null);}}>See All Products</button>
                <div className="lp-mega-feat-label">Featured Products</div>
                <div className="lp-mega-grid">
                  {[
                    { t:'Lead Management',   d:'Capture, qualify & convert leads at scale',   path:'/feature/lead-management' },
                    { t:'B2B Sales Workflow', d:'RFI → Quote → PO → Invoice automated',        path:'/feature/sales-finance' },
                    { t:'Email Inbox',        d:'IMAP sync with real-time tracking',            path:'/feature/lead-management' },
                    { t:'AI Assistant',       d:'Gemini AI for insights & email drafts',        path:'/feature/lead-management' },
                    { t:'Product Catalog',    d:'Products, pricing & marketplace',              path:'/feature/sales-finance' },
                    { t:'Support Tickets',    d:'SLA tracking & multi-tier escalation',         path:'/feature/support' },
                  ].map((p,i)=>(
                    <div key={i} className="lp-mega-item" onClick={()=>{navigate(p.path);setOpenDrop(null);}}>
                      <div className="lp-mega-item-title">{p.t}</div>
                      <div className="lp-mega-item-desc">{p.d}</div>
                    </div>
                  ))}
                </div>
              </>}
              {megaCat === 'sales' && <>
                <div className="lp-mega-prod-title">Sales CRM</div>
                <div className="lp-mega-prod-desc">A complete sales platform — leads, contacts, accounts, opportunities, pipeline, and revenue forecasting in one place.</div>
                <button className="lp-mega-see-btn" onClick={()=>{navigate('/feature/lead-management');setOpenDrop(null);}}>Explore Sales CRM</button>
                <div className="lp-mega-feat-label">Sales Modules</div>
                <div className="lp-mega-grid">
                  {[{t:'Leads',d:'Pipeline & bulk import',path:'/feature/lead-management'},{t:'Contacts',d:'360° profiles',path:'/feature/lead-management'},{t:'Accounts',d:'B2B hierarchy',path:'/feature/lead-management'},{t:'Opportunities',d:'Stage tracking & forecast',path:'/feature/lead-management'},{t:'Email Inbox',d:'IMAP sync & tracking',path:'/feature/lead-management'},{t:'Calls',d:'Log & analyze calls',path:'/feature/lead-management'}].map((p,i)=>(
                    <div key={i} className="lp-mega-item" onClick={()=>{navigate(p.path);setOpenDrop(null);}}>
                      <div className="lp-mega-item-title">{p.t}</div>
                      <div className="lp-mega-item-desc">{p.d}</div>
                    </div>
                  ))}
                </div>
              </>}
              {megaCat === 'ops' && <>
                <div className="lp-mega-prod-title">B2B Operations</div>
                <div className="lp-mega-prod-desc">Complete document workflow from inquiry to invoice — with PDF generation, approvals, and payment tracking.</div>
                <button className="lp-mega-see-btn" onClick={()=>{navigate('/feature/sales-finance');setOpenDrop(null);}}>Explore Operations</button>
                <div className="lp-mega-feat-label">Operations Modules</div>
                <div className="lp-mega-grid">
                  {[{t:'RFI',d:'Request management'},{t:'Quotations',d:'PDF with line items'},{t:'Purchase Orders',d:'PO with approvals'},{t:'Invoices',d:'Payment tracking'},{t:'Product Catalog',d:'Pricing & categories'},{t:'Document Templates',d:'Dynamic variables'}].map((p,i)=>(
                    <div key={i} className="lp-mega-item" onClick={()=>{navigate('/feature/sales-finance');setOpenDrop(null);}}>
                      <div className="lp-mega-item-title">{p.t}</div>
                      <div className="lp-mega-item-desc">{p.d}</div>
                    </div>
                  ))}
                </div>
              </>}
              {megaCat === 'support' && <>
                <div className="lp-mega-prod-title">Support & Feedback</div>
                <div className="lp-mega-prod-desc">Complete helpdesk with SLA, ticket management, and a 3-tier feedback system with sentiment analysis.</div>
                <button className="lp-mega-see-btn" onClick={()=>{navigate('/feature/support');setOpenDrop(null);}}>Explore Support</button>
                <div className="lp-mega-feat-label">Support Modules</div>
                <div className="lp-mega-grid">
                  {[{t:'Support Tickets',d:'SLA & escalation'},{t:'Feedback System',d:'Sentiment analysis'},{t:'Notifications',d:'Real-time alerts'},{t:'Activity Logs',d:'Full audit trail'},{t:'Email Templates',d:'Outreach & campaigns'},{t:'Tasks & Meetings',d:'Scheduling & reminders'}].map((p,i)=>(
                    <div key={i} className="lp-mega-item" onClick={()=>{navigate('/feature/support');setOpenDrop(null);}}>
                      <div className="lp-mega-item-title">{p.t}</div>
                      <div className="lp-mega-item-desc">{p.d}</div>
                    </div>
                  ))}
                </div>
              </>}
              {megaCat === 'solutions' && <>
                <div className="lp-mega-prod-title">Solutions</div>
                <div className="lp-mega-prod-desc">Purpose-built CRM solutions for every business challenge — from sales acceleration to full B2B automation.</div>
                <button className="lp-mega-see-btn" onClick={()=>{navigate('/all-features');setOpenDrop(null);}}>Explore All Solutions</button>
                <div className="lp-mega-feat-label">By Use Case</div>
                <div className="lp-mega-grid">
                  {[
                    {t:'Sales Acceleration',   d:'Close more deals faster with AI-powered pipeline',       path:'/feature/lead-management'},
                    {t:'B2B Workflow',          d:'Automate RFI → Quote → PO → Invoice end-to-end',        path:'/feature/sales-finance'},
                    {t:'Customer Support',     d:'Resolve tickets faster with SLA & escalation',           path:'/feature/support'},
                    {t:'Team Collaboration',   d:'RBAC, org charts, and permission management',            path:'/feature/access-management'},
                    {t:'Revenue Management',   d:'Subscriptions, billing, and monetization engine',        path:'/feature/monetization'},
                    {t:'Partner Program',      d:'Reseller portal with commission tracking',               path:'/partners'},
                  ].map((p,i)=>(
                    <div key={i} className="lp-mega-item" onClick={()=>{navigate(p.path);setOpenDrop(null);}}>
                      <div className="lp-mega-item-title">{p.t}</div>
                      <div className="lp-mega-item-desc">{p.d}</div>
                    </div>
                  ))}
                </div>
              </>}
              {megaCat === 'industries' && <>
                <div className="lp-mega-prod-title">Industries</div>
                <div className="lp-mega-prod-desc">Unified CRM adapts to your industry's unique workflows, compliance needs, and customer journey.</div>
                <button className="lp-mega-see-btn" onClick={()=>{navigate('/industries');setOpenDrop(null);}}>Explore All Industries</button>
                <div className="lp-mega-feat-label">By Industry</div>
                <div className="lp-mega-grid">
                  {[
                    {t:'IT & Technology',      d:'Lead management for SaaS and IT service companies'},
                    {t:'Manufacturing',        d:'B2B workflow, RFI, PO & invoice for manufacturers'},
                    {t:'Financial Services',   d:'Client pipeline, compliance tracking & reporting'},
                    {t:'Healthcare',           d:'Patient relationship and referral management'},
                    {t:'Real Estate',          d:'Property pipeline, deals & contact management'},
                    {t:'Education',            d:'Student enrollment, leads & course management'},
                    {t:'Consulting',           d:'Project tracking, client accounts & proposals'},
                    {t:'Retail & E-commerce',  d:'Customer accounts, orders & feedback management'},
                  ].map((p,i)=>(
                    <div key={i} className="lp-mega-item" onClick={()=>{navigate('/industries');setOpenDrop(null);}}>
                      <div className="lp-mega-item-title">{p.t}</div>
                      <div className="lp-mega-item-desc">{p.d}</div>
                    </div>
                  ))}
                </div>
              </>}
              {megaCat === 'saas' && <>
                <div className="lp-mega-prod-title">SaaS Platform</div>
                <div className="lp-mega-prod-desc">Multi-tenant architecture with full tenant isolation, role-based access, custom fields, and a complete monetization engine.</div>
                <button className="lp-mega-see-btn" onClick={()=>{navigate('/feature/monetization');setOpenDrop(null);}}>Explore Platform</button>
                <div className="lp-mega-feat-label">Platform Modules</div>
                <div className="lp-mega-grid">
                  {[
                    {t:'Multi-Tenant SaaS',    d:'100% data isolation',      path:'/feature/monetization'},
                    {t:'Users & Roles',         d:'Granular permissions',      path:'/feature/access-management'},
                    {t:'Monetization',          d:'Razorpay billing',          path:'/feature/monetization'},
                    {t:'Reseller Program',      d:'Partner commissions',       path:'/feature/monetization'},
                    {t:'Field Customization',   d:'No-code custom fields',     path:'/feature/access-management'},
                    {t:'Org Hierarchy',         d:'Visual org chart',          path:'/feature/access-management'},
                  ].map((p,i)=>(
                    <div key={i} className="lp-mega-item" onClick={()=>{navigate(p.path);setOpenDrop(null);}}>
                      <div className="lp-mega-item-title">{p.t}</div>
                      <div className="lp-mega-item-desc">{p.d}</div>
                    </div>
                  ))}
                </div>
              </>}
            </div>

            {/* Right card */}
            <div className="lp-mega-right">
              <button className="lp-mega-close" onClick={()=>setOpenDrop(null)}>×</button>
              <div className="lp-mega-card-label">Start Today</div>
              <div className="lp-mega-card-title">The CRM platform your team will actually use</div>
              <div className="lp-mega-card-desc">
                25+ integrated modules, AI assistance, B2B workflow, and a complete SaaS engine — all in one platform. No integrations needed.
                <br/><br/>
                Join 500+ businesses already growing with Unified CRM.
              </div>
              <button className="lp-mega-card-btn" onClick={()=>{navigate('/register');setOpenDrop(null);}}>
                Start Free Trial →
              </button>
            </div>

          </div>

          {/* Bottom "View a Demo" bar — like ServiceNow */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 48px', display: 'flex', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <button onClick={()=>{navigate('/demo');setOpenDrop(null);}}
              style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'color 0.15s' }}
              onMouseEnter={e=>e.target.style.color='#fff'}
              onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.6)'}>
              View a Demo →
            </button>
          </div>

        </div>
        </>
      )}

      {/* ── INDUSTRIES MEGA OVERLAY — full-width like ServiceNow ── */}
      {openDrop === 'industries' && (
        <>
          <div className="lp-mega-backdrop" onClick={()=>setOpenDrop(null)} />
          <div style={{
            position: 'fixed', top: 72, left: 0, right: 0, zIndex: 400,
            background: '#0f1e2e', borderBottom: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 60px rgba(0,0,0,0.5)',
            animation: 'megaIn 0.2s ease',
          }} onMouseDown={e=>e.stopPropagation()}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 48px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 60, alignItems: 'start' }}>

                {/* Left — heading + description + CTA */}
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.5px' }}>Industries</h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 24px' }}>
                    Browse CRM solutions tailored for the complex business challenges unique to your industry.
                  </p>
                  <button onClick={()=>{navigate('/industries');setOpenDrop(null);}}
                    style={{ padding: '10px 22px', background: 'transparent', color: '#1EB980', border: '2px solid #1EB980', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.2s' }}
                    onMouseEnter={e=>{e.target.style.background='#1EB980';e.target.style.color='#fff';}}
                    onMouseLeave={e=>{e.target.style.background='transparent';e.target.style.color='#1EB980';}}>
                    Learn More
                  </button>
                </div>

                {/* Right — 4-column industry grid */}
                <div className="lp-industries-grid">
                  {[
                    { name: 'Manufacturing',     desc: 'Manage vendor RFIs, purchase orders, and B2B workflows end-to-end.' },
                    { name: 'Banking & Finance',  desc: 'Track client portfolios, manage leads, and automate compliance docs.' },
                    { name: 'Healthcare',         desc: 'Patient lead pipeline, appointment tracking, and billing automation.' },
                    { name: 'Retail & E-commerce',desc: 'Customer CRM, order management, and support ticket resolution.' },
                    { name: 'Real Estate',        desc: 'Property leads, site visit tracking, and deal closing pipeline.' },
                    { name: 'Technology & SaaS',  desc: 'Subscription management, reseller programs, and MRR tracking.' },
                    { name: 'Education',          desc: 'Student admissions pipeline, fee management, and communications.' },
                    { name: 'Logistics',          desc: 'Client accounts, quotations, purchase orders, and delivery tracking.' },
                  ].map((ind, i) => (
                    <div key={i}
                      style={{ padding: '16px 18px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(30,185,128,0.06)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      onClick={()=>{navigate('/industries');setOpenDrop(null);}}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{ind.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>{ind.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom "View a Demo" bar */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 32, padding: '14px 48px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <button onClick={()=>{navigate('/demo');setOpenDrop(null);}}
                style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                View a Demo →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── HERO ── */}
      <section className="hero-section" style={{ position: 'relative' }}>
        {/* Floating orbs — 1 */}
        <div className="hero-orb1"/><div className="hero-orb2"/><div className="hero-orb3"/>
        <div className="hero-inner">
          <div className="hero-main-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 64, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div className="hero-social-proof">
                <div className="hero-avatars">
                  {['S','R','A','K','P'].map((l, i) => (
                    <div key={i} className="hero-avatar" style={{ background: ['#15803d','#16a34a','#22c55e','#f59e0b','#10b981'][i] }}>{l}</div>
                  ))}
                </div>
                <span className="hero-proof-text"><span>500+</span> businesses growing with us</span>
              </div>

              <h1 className="hero-h1">
                The CRM Platform<br />
                <span className="hero-rotate-wrap">
                  <span className="hero-rotate-track">
                    {['Your Business Deserves','Built for Sales Teams','For B2B Operations','For Enterprise Teams','For Support & CX','That Grows With You'].map((w,i)=>(
                      <span key={i} className="hero-rotate-word">{w}</span>
                    ))}
                  </span>
                </span>
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
                <div className="hero-badge"><div className="hero-badge-dot"/> AI Powered</div>
                <div className="hero-badge"><div className="hero-badge-dot"/> 25+ Modules</div>
                <div className="hero-badge"><div className="hero-badge-dot"/> No-Code Fields</div>
              </div>
            </div>

            {/* Right – Split cards */}
            <div className="hero-cards">
              {/* Sales & CRM card */}
              <div className="hero-card">
                <div className="hero-card-badge" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
                  🎯 FOR SALES TEAMS
                </div>
                <div className="hero-card-title">Drive More Revenue</div>
                <div className="hero-card-sub">Pipeline, leads, contacts, and B2B deals — all tracked in one place.</div>
                <div className="hero-card-modules">
                  {MODULES_SALES.map((m, i) => (
                    <div key={i} className="hero-card-module">{m.icon} {m.label}</div>
                  ))}
                </div>
                <button className="hero-card-link" onClick={() => navigate('/register')} style={{ color: '#fff' }}>
                  <span>Explore Sales CRM</span>
                  <span style={{ fontSize: 18 }}>→</span>
                </button>
              </div>

              {/* Operations card */}
              <div className="hero-card">
                <div className="hero-card-badge" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
                  ⚙️ FOR OPERATIONS
                </div>
                <div className="hero-card-title">Automate B2B Workflow</div>
                <div className="hero-card-sub">From inquiry to invoice — complete document workflow with PDF export.</div>
                <div className="hero-card-modules">
                  {MODULES_OPS.map((m, i) => (
                    <div key={i} className="hero-card-module">{m.icon} {m.label}</div>
                  ))}
                </div>
                <button className="hero-card-link" onClick={() => navigate('/register')} style={{ color: '#fff' }}>
                  <span>Explore B2B Workflow</span>
                  <span style={{ fontSize: 18 }}>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-section" ref={statsRef}>
        <div className="stats-inner">
          <div className="stats-grid">
            {[
              { num: `${c1}+`, label: 'Feature Modules', color: '#4ade80' },
              { num: `${c2}+`, label: 'Businesses Onboarded', color: '#86efac' },
              { num: `${c3}.9%`, label: 'Uptime Guaranteed', color: '#34d399' },
              { num: `${c4}+`, label: 'Integrations & APIs', color: '#fbbf24' },
            ].map((s, i) => (
              <div key={i} className={`stat-card reveal reveal-d${i+1}`}>
                <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        {/* Row 1 — left to right */}
        <div className="marquee-row">
          <div className="marquee-track">
            {[...Array(2)].map((_, r) =>
              ['📋 Leads', '👥 Contacts', '🏢 Accounts', '💼 Opportunities', '📄 RFI', '💰 Quotations',
               '📦 Purchase Orders', '🧾 Invoices', '✅ Tasks', '📅 Meetings', '📞 Calls', '✉️ Email Inbox',
               '📊 Data Center', '🎫 Support Tickets', '💬 Feedback', '🌐 Social Media'].map((item, i) => (
                <span key={`a${r}-${i}`} className="marquee-chip">{item}</span>
              ))
            )}
          </div>
        </div>
        {/* Row 2 — right to left */}
        <div className="marquee-row">
          <div className="marquee-track reverse">
            {[...Array(2)].map((_, r) =>
              ['🏛️ Org Hierarchy', '🤝 Resellers', '🔧 Field Builder', '📦 Products', '💰 Monetization',
               '🤖 AI Assistant', '👨‍💼 Users & Roles', '📑 Doc Templates', '📈 Audit Logs', '🔔 Notifications',
               '📧 Email Templates', '💳 Subscriptions & Plans', '🏢 Multi-Tenant', '🛒 Product Marketplace',
               '🔒 RBAC Security', '📊 Analytics'].map((item, i) => (
                <span key={`b${r}-${i}`} className="marquee-chip">{item}</span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── SPOTLIGHT TABS ── */}
      <section className="spotlight-section" style={{ padding: '80px 0 0' }}>
        <div className="spotlight-inner">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="sec-label purple pulse-badge" style={{ margin: '0 auto 12px' }}>🚀 CRM PLATFORM</div>
            <h2 className="sec-title">Everything Your Business Needs</h2>
          </div>

          {/* Tab bar — pill style */}
          <div className="sp-tabs-wrap">
            <div className="sp-tabs">
              {[
                { label: '🎯 Sales CRM', idx: 0 },
                { label: '⚙️ B2B Workflow', idx: 1 },
                { label: '👥 Team Management', idx: 2 },
                { label: '💬 Customer Intelligence', idx: 3 },
              ].map(t => (
                <button key={t.idx} className={`sp-tab${spotlightTab === t.idx ? ' active' : ''}`}
                  onClick={() => setSpotlightTab(t.idx)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div key={spotlightTab} className="sp-content sp-slide-in" style={{ background: spotlightTab % 2 === 0 ? '#0f1e2e' : '#162e48' }}>
          <div className="spotlight-inner" style={{ padding: '60px 40px' }}>
            <div className="spotlight-grid" style={{ direction: spotlightTab % 2 === 1 ? 'rtl' : 'ltr' }}>
              <div style={{ direction: 'ltr' }}>
                {spotlightTab === 0 && <PipelineMock />}
                {spotlightTab === 1 && <WorkflowMock />}
                {spotlightTab === 2 && <TeamMock />}
                {spotlightTab === 3 && <FeedbackMock />}
              </div>
              <div style={{ direction: 'ltr' }}>
                {spotlightTab === 0 && <>
                  <div className="sec-label purple">🎯 SALES CRM</div>
                  <h2 className="sec-title">Close Deals <br /><span style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>10x Faster</span></h2>
                  <p className="sec-sub">Full-stack sales CRM with lead pipeline, contact management, and opportunity tracking — built for modern B2B teams.</p>
                  <ul className="check-list">
                    {[['📋','Leads with bulk import, group & product linking'],['👥','Contacts & Accounts with relationship mapping'],['💼','Opportunities pipeline with stage tracking & forecasting'],['📊','Real-time analytics & conversion dashboards'],['🔧','Custom fields — no code needed']].map(([icon, text], i) => (
                      <li key={i} className="check-item"><div className="check-icon" style={{ background: 'rgba(22,163,74,0.15)' }}>{icon}</div><span>{text}</span></li>
                    ))}
                  </ul>
                  <button className="hero-cta-main" onClick={() => navigate('/register')}>Get Started Free →</button>
                </>}
                {spotlightTab === 1 && <>
                  <div className="sec-label green">⚙️ B2B WORKFLOW</div>
                  <h2 className="sec-title">From RFI to Invoice,<br /><span style={{ background: 'linear-gradient(135deg,#34d399,#4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Fully Automated</span></h2>
                  <p className="sec-sub">Complete document workflow with professional PDF generation, approval flows, and payment tracking — all in one place.</p>
                  <ul className="check-list">
                    {[['📄','RFI management with vendor responses'],['💰','Professional quotation with PDF export'],['📦','Purchase Order processing & approvals'],['🧾','Invoice creation with payment status tracking'],['📑','Reusable document templates with dynamic variables']].map(([icon, text], i) => (
                      <li key={i} className="check-item"><div className="check-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>{icon}</div><span>{text}</span></li>
                    ))}
                  </ul>
                  <button className="hero-cta-main" onClick={() => navigate('/register')}>Start Free Trial →</button>
                </>}
                {spotlightTab === 2 && <>
                  <div className="sec-label orange">👥 TEAM MANAGEMENT</div>
                  <h2 className="sec-title">Built for <br /><span style={{ background: 'linear-gradient(135deg,#fbbf24,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Enterprise Teams</span></h2>
                  <p className="sec-sub">Advanced role-based access control, org hierarchy, team groups, and custom permissions — manage any org structure with ease.</p>
                  <ul className="check-list">
                    {[['👨‍💼','Role-based access with granular permissions'],['🏛️','Visual org hierarchy builder with custom nodes'],['📝','Role template library for quick team setup'],['👥','Team groups with permission inheritance'],['📈','Activity logs & audit trail for compliance']].map(([icon, text], i) => (
                      <li key={i} className="check-item"><div className="check-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>{icon}</div><span>{text}</span></li>
                    ))}
                  </ul>
                  <button className="hero-cta-main" onClick={() => navigate('/register')}>Get Started Free →</button>
                </>}
                {spotlightTab === 3 && <>
                  <div className="sec-label pink">💬 CUSTOMER INTELLIGENCE</div>
                  <h2 className="sec-title">Hear Every<br /><span style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Voice, Act Fast</span></h2>
                  <p className="sec-sub">Unified support tickets + feedback management with 3-tier escalation, sentiment analysis, and real-time dashboards.</p>
                  <ul className="check-list">
                    {[['💬','Feedback with sentiment auto-detection (AI)'],['🎫','Support tickets with SLA & priority tracking'],['↑','3-tier escalation: User → Tenant Admin → SAAS'],['📊','Analytics: bug reports, feature requests, praises'],['🔔','Real-time notifications & reply workflow']].map(([icon, text], i) => (
                      <li key={i} className="check-item"><div className="check-icon" style={{ background: 'rgba(236,72,153,0.15)' }}>{icon}</div><span>{text}</span></li>
                    ))}
                  </ul>
                  <button className="hero-cta-main" onClick={() => navigate('/register')}>Start Free Trial →</button>
                </>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALL FEATURES GRID ── */}
      {/* ── PLATFORM CAPABILITIES ── */}
      <section id="features" className="reveal" style={{ background: '#162e48', padding: '100px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }}>

          {/* Section intro */}
          <div style={{ maxWidth: 680, marginBottom: 64 }}>
            <div className="sec-label purple" style={{ marginBottom: 16 }}>🏗️ PLATFORM OVERVIEW</div>
            <h2 className="sec-title" style={{ marginBottom: 20 }}>
              One platform.<br />Every business need.
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, margin: 0, fontWeight: 400 }}>
              Unified CRM brings together sales, operations, support, and SaaS management into a single, cohesive platform — eliminating the need to juggle multiple tools across your organization.
            </p>
          </div>

          {/* 3 capability areas */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 20, marginBottom: 60 }}>
            {[
              {
                label: 'SALES & CRM',
                icon: '🎯',
                color: '#1EB980',
                title: 'Close more deals, faster',
                desc: 'A complete sales platform with intelligent lead capture, pipeline visibility, and account management — built for the way modern B2B teams work.',
                features: ['Lead & opportunity pipeline', 'Contact & account management', 'Email inbox with IMAP sync', 'Call & meeting logging', 'Revenue forecasting'],
                slug: 'lead-management',
              },
              {
                label: 'OPERATIONS',
                icon: '⚙️',
                color: '#38bdf8',
                title: 'Automate your entire workflow',
                desc: 'From the first inquiry to the final invoice — manage every document, approval, and transaction in one place with full audit trail and PDF export.',
                features: ['RFI → Quotation → PO → Invoice', 'Product catalog with pricing', 'Document templates & PDF export', 'Multi-level approval flows', 'Payment & billing tracking'],
                slug: 'sales-finance',
              },
              {
                label: 'SAAS PLATFORM',
                icon: '🏢',
                color: '#a78bfa',
                title: 'Built to scale with you',
                desc: 'A multi-tenant architecture with complete tenant isolation, role-based access control, custom fields, and a full monetization engine — ready for enterprise.',
                features: ['Multi-tenant isolation', 'Granular role-based access', 'Custom field builder', 'Subscription & billing engine', 'Reseller partner program'],
                slug: 'monetization',
              },
            ].map((cap, i) => (
              <div key={i} className={`reveal reveal-d${i+1} tilt-card`}
                style={{ background: '#1a3654', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 36, display: 'flex', flexDirection: 'column', gap: 20, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position:'relative', overflow:'hidden' }}
                onMouseMove={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - r.left) / r.width - 0.5) * 16;
                  const y = ((e.clientY - r.top) / r.height - 0.5) * -16;
                  const mx = ((e.clientX - r.left) / r.width * 100).toFixed(1);
                  const my = ((e.clientY - r.top) / r.height * 100).toFixed(1);
                  e.currentTarget.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) scale(1.03)`;
                  e.currentTarget.style.borderColor = `${cap.color}50`;
                  const shine = e.currentTarget.querySelector('.tilt-card-shine');
                  if (shine) { shine.style.setProperty('--mx', `${mx}%`); shine.style.setProperty('--my', `${my}%`); }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
                onClick={()=>navigate(`/feature/${cap.slug}`)}>
                <div className="tilt-card-shine"/>
                {/* Header */}
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${cap.color}15`, border: `1px solid ${cap.color}30`, borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 700, color: cap.color, letterSpacing: 1, marginBottom: 16 }}>
                    {cap.icon} {cap.label}
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.25 }}>{cap.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.58)', lineHeight: 1.7, margin: 0 }}>{cap.desc}</p>
                </div>
                {/* Feature list */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {cap.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, background: `${cap.color}20`, border: `1px solid ${cap.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: cap.color, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {/* CTA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 600, color: cap.color }}>
                  <span>Explore {cap.label.split(' ')[0].toLowerCase()} features</span>
                  <span style={{ fontSize: 16 }}>→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom content strip — editorial style like ServiceNow */}
          <div style={{ background: '#0f1e2e', borderRadius: 24, padding: isMobile ? '32px 24px' : '48px 56px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 48, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1EB980', marginBottom: 12, letterSpacing: 0.5 }}>WHY UNIFIED CRM</div>
                <h3 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 20px', lineHeight: 1.25, letterSpacing: '-0.5px' }}>
                  The platform that grows with your business
                </h3>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.75, margin: '0 0 16px' }}>
                  We built Unified CRM for teams that need more than a basic contact manager. From day one, you get a full-stack platform — leads, pipeline, B2B documents, support tickets, and a complete multi-tenant SaaS engine.
                </p>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.75, margin: 0 }}>
                  This is exactly what growing B2B companies need — a single platform that eliminates the cost and complexity of stitching together five different tools.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { num: '25+', label: 'Integrated Modules', sub: 'Everything connected' },
                  { num: '500+', label: 'Businesses Onboarded', sub: 'And growing daily' },
                  { num: '99.9%', label: 'Uptime SLA', sub: 'Enterprise reliability' },
                  { num: '18+', label: 'Integrations & APIs', sub: 'Connect your stack' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#162e48', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 18px' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#1EB980', letterSpacing: '-1px', lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 8 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 3 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ── RESELLER / PARTNER ── */}
      <section className="partner-section reveal" id="partner">
        <div className="partner-inner">
          <div className="partner-grid">
            <div>
              <div className="sec-label purple">🤝 PARTNER PROGRAM</div>
              <h2 className="sec-title">Grow Together.<br /><span style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Earn Together.</span></h2>
              <p className="sec-sub" style={{ marginBottom: 36 }}>Join our reseller network and earn commissions by bringing businesses onto our platform. Full support, dashboard, and resources provided.</p>
              <div style={{ display: 'flex', gap: 14 }}>
                <button className="hero-cta-main" onClick={() => navigate('/partners')}>Become a Reseller →</button>
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
              <span style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Your Business?</span>
            </h2>
            <p className="cta-sub">Join hundreds of businesses already using Unified CRM to close more deals, manage better, and grow faster.</p>
            <div className="cta-buttons">
              <button className="cta-btn-main" onClick={() => navigate('/register')}>Start Free Trial →</button>
              <button className="cta-btn-ghost" onClick={() => navigate('/partners')}>Become a Partner</button>
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
