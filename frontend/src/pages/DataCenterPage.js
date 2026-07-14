import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import SEO from '../components/SEO';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;background:#0f1e2e;}
.dc-wrap{ font-family:'Inter',-apple-system,sans-serif; background:#0f1e2e; color:#fff; overflow-x:hidden; }
.dc-hero{
  padding:120px 0 80px; text-align:center; position:relative; overflow:hidden;
  background:
    radial-gradient(ellipse at 75% 8%, rgba(30,185,128,0.14) 0%, transparent 50%),
    radial-gradient(ellipse at 8% 85%, rgba(30,185,128,0.07) 0%, transparent 45%),
    #0f1e2e;
}
.dc-hero::before{
  content:''; position:absolute; inset:0; pointer-events:none;
  background-image:radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size:32px 32px;
}
.dc-container{ max-width:1200px; margin:0 auto; padding:0 40px; }
@media(max-width:768px){ .dc-container{ padding:0 20px; } }
.dc-badge{
  display:inline-flex; align-items:center; gap:6px;
  padding:5px 14px; background:rgba(30,185,128,0.1); border:1px solid rgba(30,185,128,0.25);
  border-radius:999px; font-size:11px; font-weight:800; color:#1EB980; letter-spacing:1.5px;
  text-transform:uppercase; margin-bottom:20px;
}
.dc-h1{ font-size:clamp(36px,5vw,58px); font-weight:900; color:#fff; margin:0 0 16px; letter-spacing:-1px; line-height:1.15; }
.dc-hero-sub{ font-size:18px; color:rgba(255,255,255,0.55); max-width:580px; margin:0 auto 40px; line-height:1.7; }
.dc-btn-primary{
  padding:14px 32px; font-size:15px; font-weight:700; font-family:inherit;
  color:#fff; background:#1EB980; border:none; border-radius:999px; cursor:pointer;
  transition:background .2s,box-shadow .2s; box-shadow:0 4px 18px rgba(30,185,128,0.35);
}
.dc-btn-primary:hover{ background:#19a872; box-shadow:0 6px 26px rgba(30,185,128,0.5); }
.dc-btn-outline{
  padding:13px 28px; font-size:14px; font-weight:600; font-family:inherit;
  color:#1EB980; background:transparent; border:1.5px solid #1EB980; border-radius:999px;
  cursor:pointer; transition:all .2s;
}
.dc-btn-outline:hover{ background:#1EB980; color:#fff; }

/* Mock UI */
.dc-mock{
  background:#162e48; border:1px solid rgba(255,255,255,0.08); border-radius:20px;
  padding:20px; max-width:860px; margin:56px auto 0; position:relative; z-index:1;
}
.dc-mock-header{ display:flex; align-items:center; gap:8px; margin-bottom:16px; }
.dc-mock-dot{ width:10px; height:10px; border-radius:50%; }
.dc-mock-bar{
  display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;
}
.dc-mock-tag{
  padding:5px 12px; background:#1a3654; border:1px solid rgba(255,255,255,0.1);
  border-radius:999px; font-size:11px; color:rgba(255,255,255,0.55); font-weight:600;
}
.dc-mock-tag.active{ background:rgba(30,185,128,0.15); border-color:rgba(30,185,128,0.35); color:#1EB980; }
.dc-candidate-row{
  display:flex; align-items:center; gap:12px; padding:12px 14px;
  background:#1a3654; border-radius:10px; margin-bottom:8px;
  border:1px solid rgba(255,255,255,0.06);
}
.dc-avatar{ width:32px; height:32px; border-radius:50%; background:rgba(30,185,128,0.2); display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
.dc-cand-name{ font-size:13px; font-weight:700; color:#fff; }
.dc-cand-role{ font-size:11px; color:rgba(255,255,255,0.45); }
.dc-cand-tag{ padding:2px 8px; border-radius:999px; font-size:10px; font-weight:600; background:rgba(30,185,128,0.12); color:#1EB980; border:1px solid rgba(30,185,128,0.25); }
.dc-cand-action{ margin-left:auto; padding:5px 12px; background:#1EB980; border:none; border-radius:999px; color:#fff; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; }

.dc-section{ padding:80px 0; }
.dc-section-alt{ padding:80px 0; background:#162e48; }
.dc-sec-label{ font-size:11px; font-weight:800; color:#1EB980; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; }
.dc-sec-title{ font-size:clamp(28px,3.5vw,40px); font-weight:900; color:#fff; margin:0 0 14px; letter-spacing:-0.5px; }
.dc-sec-sub{ font-size:16px; color:rgba(255,255,255,0.5); margin:0 0 48px; line-height:1.7; max-width:560px; }
.dc-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
@media(max-width:900px){ .dc-grid{ grid-template-columns:1fr 1fr; } }
@media(max-width:520px){ .dc-grid{ grid-template-columns:1fr; } }
.dc-card{
  background:#1a3654; border:1px solid rgba(255,255,255,0.08);
  border-radius:16px; padding:28px 24px; transition:all .2s;
}
.dc-card:hover{ background:#1e3f64; border-color:rgba(30,185,128,0.25); transform:translateY(-3px); }
.dc-card-icon{ font-size:28px; margin-bottom:14px; }
.dc-card-title{ font-size:16px; font-weight:700; color:#fff; margin-bottom:8px; }
.dc-card-desc{ font-size:13px; color:rgba(255,255,255,0.5); line-height:1.6; }
.dc-check{ display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; font-size:14px; color:rgba(255,255,255,0.65); }
.dc-check-dot{ width:6px; height:6px; border-radius:50%; background:#1EB980; flex-shrink:0; margin-top:5px; }
.dc-two-col{ display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:center; }
@media(max-width:768px){ .dc-two-col{ grid-template-columns:1fr; } }
.dc-feat-card{
  background:#1a3654; border:1px solid rgba(255,255,255,0.08);
  border-radius:16px; padding:28px 24px;
}
.dc-feat-title{ font-size:16px; font-weight:700; color:#fff; margin-bottom:18px; }
.dc-cta{ padding:80px 0; text-align:center; background:#0a1622; }
`;

const FEATURES = [
  { icon:'🔍', title:'Smart Search',               desc:'Search across your entire database by name, skills, designation, company, or location.' },
  { icon:'🎯', title:'Advanced Filters',            desc:'Filter by skills, experience (min/max), current CTC, expected CTC, availability, status, source website, and last active date.' },
  { icon:'🚀', title:'Move to Leads',               desc:'Convert selected customers/prospects directly into CRM Leads with one click — no data re-entry.' },
  { icon:'📧', title:'Bulk Email',                  desc:'Send bulk emails to selected records directly from the Data Center using your configured SMTP.' },
  { icon:'💬', title:'Bulk WhatsApp & SMS',         desc:'Send bulk WhatsApp messages and SMS to selected contacts powered by Twilio integration.' },
  { icon:'📥', title:'CSV / Excel Import',          desc:'Upload a CSV or Excel file to bulk-import hundreds of records into the Data Center instantly.' },
  { icon:'📤', title:'Export Database',             desc:'Export your full database or filtered results to CSV/Excel for offline use or reporting.' },
  { icon:'🔧', title:'Manage Custom Fields',        desc:'Enable/disable standard fields and add custom fields (text, dropdown, number, date) per your business needs.' },
  { icon:'📋', title:'Table & Grid View',           desc:'Switch between table view and grid view. All columns are driven by your active field configuration.' },
];

const CANDIDATES = [
  { emoji:'👨‍💻', name:'Rahul Sharma',   role:'Full Stack Developer · Delhi',        tag:'Available',     ctc:'₹12L' },
  { emoji:'👩‍💼', name:'Priya Mehta',    role:'Product Manager · Mumbai',            tag:'Immediate',     ctc:'₹18L' },
  { emoji:'🧑‍🔬', name:'Amit Verma',    role:'Data Scientist · Bangalore',           tag:'30 Days',       ctc:'₹15L' },
  { emoji:'👩‍🎨', name:'Neha Singh',    role:'UI/UX Designer · Hyderabad',           tag:'Available',     ctc:'₹9L' },
];

export default function DataCenterPage() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Data Center - Unified CRM"
        description="Centralized customer data management. Import, organize, and manage all your customer data in one secure location."
        url="https://unifiedcrm.texora.ai/data-center-feature"
        keywords="data center, customer database, data management, bulk import, data organization"
      />
      <div className="dc-wrap">
      <style>{CSS}</style>
      <SharedHeader/>

      {/* Hero */}
      <section className="dc-hero" style={{paddingTop:100}}>
        <div className="dc-container" style={{position:'relative',zIndex:1}}>
          <div className="dc-badge">🗄️ Data Center</div>
          <h1 className="dc-h1">Your Candidate &<br/>Prospect Database</h1>
          <p className="dc-hero-sub">Search, filter, and manage your entire talent and prospect pool — then convert them into CRM leads with one click.</p>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:56}}>
            <button className="dc-btn-primary" onClick={()=>navigate('/register')}>Start Free Trial →</button>
            <button className="dc-btn-outline" onClick={()=>navigate('/login')}>Sign In to Access</button>
          </div>

          {/* Mock UI */}
          <div className="dc-mock">
            <div className="dc-mock-header">
              <div className="dc-mock-dot" style={{background:'#ef4444'}}/>
              <div className="dc-mock-dot" style={{background:'#f59e0b'}}/>
              <div className="dc-mock-dot" style={{background:'#10b981'}}/>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.4)',fontWeight:600,marginLeft:8}}>Data Center — Candidate Database</span>
              <span style={{marginLeft:'auto',fontSize:11,color:'rgba(255,255,255,0.3)'}}>247 candidates</span>
            </div>

            {/* Stats row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
              {[['247','Total Records'],['142','Available'],['38','Immediate Joiners'],['61','Active This Week']].map(([v,l],i)=>(
                <div key={i} style={{background:'#1a3654',borderRadius:10,padding:'10px 12px',textAlign:'center',border:'1px solid rgba(255,255,255,0.06)'}}>
                  <div style={{fontSize:18,fontWeight:800,color:'#1EB980'}}>{v}</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>

            {/* Filter tags */}
            <div className="dc-mock-bar">
              <span className="dc-mock-tag active">🔍 Search</span>
              <span className="dc-mock-tag active">📍 Delhi</span>
              <span className="dc-mock-tag active">⚡ Immediate</span>
              <span className="dc-mock-tag">Skills</span>
              <span className="dc-mock-tag">Exp Range</span>
              <span className="dc-mock-tag">CTC</span>
              <span className="dc-mock-tag">Status</span>
            </div>

            {/* Candidate rows */}
            {CANDIDATES.map((c,i) => (
              <div key={i} className="dc-candidate-row">
                <input type="checkbox" style={{accentColor:'#1EB980',flexShrink:0}}/>
                <div className="dc-avatar">{c.emoji}</div>
                <div style={{flex:1}}>
                  <div className="dc-cand-name">{c.name}</div>
                  <div className="dc-cand-role">{c.role}</div>
                </div>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginRight:8}}>{c.ctc} CTC</span>
                <span className="dc-cand-tag">{c.tag}</span>
                <button className="dc-cand-action">Move to Lead →</button>
              </div>
            ))}

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14,paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.07)'}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.35)'}}>4 of 247 shown</span>
              <div style={{display:'flex',gap:8}}>
                <button style={{padding:'6px 14px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:999,color:'rgba(255,255,255,0.6)',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>📤 Export</button>
                <button style={{padding:'6px 14px',background:'rgba(30,185,128,0.15)',border:'1px solid rgba(30,185,128,0.3)',borderRadius:999,color:'#1EB980',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>📢 Bulk Message</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="dc-section">
        <div className="dc-container">
          <div className="dc-sec-label">What It Does</div>
          <h2 className="dc-sec-title">Everything You Need to Manage Your Prospect Pool</h2>
          <p className="dc-sec-sub">The Data Center is your central repository for candidates and prospects — before they become leads.</p>
          <div className="dc-grid">
            {FEATURES.map((f,i) => (
              <div key={i} className="dc-card">
                <div className="dc-card-icon">{f.icon}</div>
                <div className="dc-card-title">{f.title}</div>
                <div className="dc-card-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it fits */}
      <section className="dc-section-alt">
        <div className="dc-container">
          <div className="dc-two-col">
            <div>
              <div className="dc-sec-label">Workflow</div>
              <h2 className="dc-sec-title">From Prospect to Lead in One Click</h2>
              <p style={{fontSize:16,color:'rgba(255,255,255,0.5)',lineHeight:1.7,marginBottom:28}}>
                Data Center sits at the top of your sales funnel. Find the right prospects, filter by your criteria, and push them directly into your CRM pipeline — no copy-paste, no data loss.
              </p>
              {[
                'Add records manually or bulk import via CSV/Excel',
                'Filter by skills, CTC, experience, location, availability',
                'Checkbox select multiple records at once',
                'Move to CRM Leads with one click — no re-entry',
                'Send Bulk Email, WhatsApp, or SMS to selected contacts',
                'Status tracking: Available / Not Available / Placed',
                'Customer types: Customer, Prospect, Partner, Reseller',
                'Enable/disable standard fields & add custom fields',
              ].map((item,i) => (
                <div key={i} className="dc-check">
                  <div className="dc-check-dot"/>
                  {item}
                </div>
              ))}
            </div>
            <div className="dc-feat-card">
              <div className="dc-feat-title">Filters Available</div>
              {[
                ['🔍','Search by name, company, skills'],
                ['💼','Designation & Current Company'],
                ['🛠️','Skills (comma-separated)'],
                ['📅','Experience: Min – Max years'],
                ['💰','Current CTC & Expected CTC range'],
                ['📍','Country → State → City'],
                ['⚡','Availability: Immediate / 15 / 30 / 45 / 60 Days'],
                ['🔖','Status: Available / Not Available / Placed'],
                ['🕐','Last Active Date'],
                ['🌐','Source Website'],
              ].map(([icon,label],i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:i<8?'1px solid rgba(255,255,255,0.06)':'none'}}>
                  <span style={{fontSize:15}}>{icon}</span>
                  <span style={{fontSize:13,color:'rgba(255,255,255,0.65)'}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="dc-cta">
        <div className="dc-container">
          <div className="dc-badge" style={{margin:'0 auto 16px'}}>Get Started</div>
          <h2 style={{fontSize:'clamp(28px,4vw,42px)',fontWeight:900,color:'#fff',margin:'0 0 14px',letterSpacing:'-0.5px'}}>
            Build Your Prospect Database Today
          </h2>
          <p style={{fontSize:16,color:'rgba(255,255,255,0.5)',margin:'0 0 36px'}}>
            Data Center is included in every Unified CRM plan. No extra cost.
          </p>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
            <button className="dc-btn-primary" onClick={()=>navigate('/register')}>Start Free Trial →</button>
            <button className="dc-btn-outline" onClick={()=>navigate('/')}>← Back to Home</button>
          </div>
        </div>
      </section>

      <SharedFooter/>
    </div>
    </>
  );
}
