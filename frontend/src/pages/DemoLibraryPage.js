import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';
import SEO from '../components/SEO';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; overflow-x: hidden; background: #0f1e2e; }
  .dl { font-family: 'Inter',-apple-system,sans-serif; background: #0f1e2e; color:#fff; min-height:100vh; padding-top:72px; }

  /* Hero */
  .dl-hero {
    background: linear-gradient(155deg,#091e0e 0%,#0f3222 35%,#162e48 70%,#1a3654 100%);
    padding: 64px 0 52px; position: relative; overflow: hidden;
  }
  .dl-hero::before { content:''; position:absolute; width:600px; height:600px; top:-200px; right:-100px; background:radial-gradient(ellipse,rgba(30,185,128,0.12) 0%,transparent 65%); border-radius:50%; pointer-events:none; }
  .dl-hero-inner { max-width:1280px; margin:0 auto; padding:0 48px; position:relative; z-index:2; }
  .dl-hero-title { font-size:clamp(32px,5vw,56px); font-weight:900; color:#fff; margin:0 0 16px; letter-spacing:-1.5px; line-height:1.08; }
  .dl-hero-desc { font-size:18px; color:rgba(255,255,255,0.62); max-width:640px; line-height:1.7; margin:0; }

  /* Layout */
  .dl-body { max-width:1280px; margin:0 auto; padding:48px 48px 80px; display:grid; grid-template-columns:280px 1fr; gap:40px; align-items:start; }
  @media(max-width:1024px){
    .dl-body { padding: 40px 24px 60px; grid-template-columns: 240px 1fr; gap: 28px; }
  }
  @media(max-width:900px){ .dl-body { grid-template-columns:1fr; padding:32px 24px 60px; } .dl-sidebar { position:relative; top:0; } }
  @media(max-width:700px){
    .dl-body { padding:24px 16px 60px; }
    .dl-page-btn { width:40px; height:40px; }
    .dl-hero-inner { padding:0 20px; }
    .dl-hero { padding: 48px 0 40px; }
    .dl-hero-title { font-size: clamp(24px,7vw,40px); }
    .dl-hero-desc { font-size: 15px; }
  }
  @media(max-width:480px){
    .dl-grid { grid-template-columns:1fr; }
    .dl-body { padding: 20px 12px 48px; }
    .dl-results-header { flex-direction: column; align-items: flex-start; }
    .dl-sort { width: 100%; justify-content: flex-start; }
  }

  /* Sidebar */
  .dl-sidebar { position:sticky; top:144px; }
  .dl-search-wrap { position:relative; margin-bottom:28px; }
  .dl-search { width:100%; padding:11px 40px 11px 16px; font-size:14px; background:#162e48; border:1px solid rgba(255,255,255,0.1); border-radius:999px; color:#fff; outline:none; font-family:inherit; transition:border-color 0.2s; }
  .dl-search:focus { border-color:#1EB980; }
  .dl-search::placeholder { color:rgba(255,255,255,0.35); }
  .dl-search-icon { position:absolute; right:14px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.4); pointer-events:none; }
  .dl-filter-group { margin-bottom:24px; border-bottom:1px solid rgba(255,255,255,0.07); padding-bottom:20px; }
  .dl-filter-group:last-child { border-bottom:none; }
  .dl-filter-head { display:flex; align-items:center; justify-content:space-between; cursor:pointer; margin-bottom:10px; background:none; border:none; width:100%; font-family:inherit; padding:0; }
  .dl-filter-title { font-size:15px; font-weight:800; color:#fff; }
  .dl-filter-arrow { font-size:12px; color:rgba(255,255,255,0.4); transition:transform 0.2s; }
  .dl-filter-arrow.open { transform:rotate(180deg); }
  .dl-filter-desc { font-size:12px; color:rgba(255,255,255,0.4); line-height:1.55; margin-bottom:14px; }
  .dl-check-row { display:flex; align-items:center; gap:10px; padding:5px 0; cursor:pointer; }
  .dl-check-row input[type=checkbox] { width:16px; height:16px; accent-color:#1EB980; cursor:pointer; flex-shrink:0; }
  .dl-check-label { font-size:13px; color:rgba(255,255,255,0.72); cursor:pointer; transition:color 0.15s; }
  .dl-check-row:hover .dl-check-label { color:#fff; }

  /* Results area */
  .dl-results-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:10px; }
  .dl-count { font-size:16px; font-weight:600; color:rgba(255,255,255,0.65); }
  .dl-active-filters { display:flex; gap:8px; flex-wrap:wrap; }
  .dl-filter-tag { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; background:rgba(30,185,128,0.15); border:1px solid rgba(30,185,128,0.35); border-radius:999px; font-size:12px; font-weight:600; color:#1EB980; }
  .dl-filter-tag button { background:none; border:none; color:#1EB980; cursor:pointer; font-size:13px; padding:0; line-height:1; }
  .dl-clear-all { font-size:13px; font-weight:600; color:rgba(255,255,255,0.5); background:none; border:none; cursor:pointer; font-family:inherit; transition:color 0.15s; }
  .dl-clear-all:hover { color:#fff; }
  .dl-sort { display:flex; align-items:center; gap:8px; font-size:13px; color:rgba(255,255,255,0.5); }
  .dl-sort select { background:#162e48; border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:13px; font-family:inherit; padding:5px 10px; outline:none; cursor:pointer; }

  /* Demo cards grid */
  .dl-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; }
  @media(max-width:700px){ .dl-grid { grid-template-columns:1fr; } }
  .dl-card { background:#162e48; border:1px solid rgba(255,255,255,0.08); border-radius:20px; overflow:hidden; cursor:pointer; transition:all 0.3s; }
  .dl-card:hover { transform:translateY(-4px); border-color:rgba(30,185,128,0.3); box-shadow:0 12px 40px rgba(0,0,0,0.3); }
  .dl-card-thumb { height:180px; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; }
  .dl-play { width:52px; height:52px; border-radius:50%; background:#1EB980; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 20px rgba(30,185,128,0.5); transition:all 0.2s; z-index:2; position:relative; }
  .dl-card:hover .dl-play { transform:scale(1.1); box-shadow:0 6px 28px rgba(30,185,128,0.7); }
  .dl-play-icon { font-size:20px; margin-left:3px; }
  .dl-thumb-duration { position:absolute; bottom:10px; right:12px; background:rgba(0,0,0,0.7); color:#fff; font-size:11px; font-weight:700; padding:2px 8px; border-radius:6px; }
  .dl-card-body { padding:20px 22px 22px; }
  .dl-card-tags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
  .dl-card-tag { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
  .dl-card-title { font-size:16px; font-weight:700; color:#fff; margin:0 0 8px; line-height:1.35; }
  .dl-card-desc { font-size:13px; color:rgba(255,255,255,0.52); line-height:1.6; margin:0 0 16px; }
  .dl-watch-link { display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:600; color:#1EB980; background:none; border:none; cursor:pointer; font-family:inherit; padding:0; transition:gap 0.15s; }
  .dl-watch-link:hover { gap:10px; }

  /* Pagination */
  .dl-pagination { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:40px; }
  .dl-page-btn { width:36px; height:36px; border-radius:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:600; font-family:inherit; transition:all 0.15s; }
  .dl-page-btn:hover { background:rgba(30,185,128,0.15); border-color:rgba(30,185,128,0.4); color:#1EB980; }
  .dl-page-btn.active { background:#1EB980; border-color:#1EB980; color:#fff; }
  .dl-page-btn:disabled { opacity:0.3; cursor:not-allowed; }

  /* Empty state */
  .dl-empty { text-align:center; padding:60px 20px; }
  .dl-empty-icon { font-size:48px; margin-bottom:16px; }
  .dl-empty-title { font-size:20px; font-weight:700; color:#fff; margin:0 0 8px; }
  .dl-empty-desc { font-size:14px; color:rgba(255,255,255,0.45); }
`;

const DEMOS = [
  {
    id:1, title:'How to Set Up Your Sales Pipeline in 10 Minutes',
    desc:'Walk through creating a full sales pipeline — from lead capture to deal closing — with automated assignment and stage tracking.',
    duration:'10:24', bg:'linear-gradient(145deg,#0a1c14,#1a4a2a)', products:['Lead Management'], industries:['Technology & SaaS','Retail'],
    tags:[{l:'Lead Management',c:'#1EB980'},{l:'Sales',c:'#38bdf8'}],
  },
  {
    id:2, title:'B2B Workflow: RFI → Quotation → Invoice in 8 Minutes',
    desc:'See how the complete B2B document workflow works end-to-end — from an incoming RFI to a signed quotation to a paid invoice.',
    duration:'8:17', bg:'linear-gradient(145deg,#0a1622,#1a3654)', products:['B2B Workflow'], industries:['Manufacturing','Logistics'],
    tags:[{l:'B2B Workflow',c:'#38bdf8'},{l:'Finance',c:'#f59e0b'}],
  },
  {
    id:3, title:'AI Lead Scoring & Auto-Assignment Demo',
    desc:'Watch Gemini AI automatically score incoming leads 0-100%, draft follow-up emails, and assign them to the best available sales rep.',
    duration:'6:45', bg:'linear-gradient(145deg,#1a160a,#2a2010)', products:['AI Assistant'], industries:['Technology & SaaS','Banking & Finance'],
    tags:[{l:'AI Assistant',c:'#f59e0b'},{l:'Automation',c:'#a78bfa'}],
  },
  {
    id:4, title:'Support Ticket Management with SLA Tracking',
    desc:'See how to create support tickets, set SLA targets, auto-escalate on breach, and resolve issues with internal notes and customer replies.',
    duration:'7:32', bg:'linear-gradient(145deg,#1a0a1a,#2a1035)', products:['Support Tickets'], industries:['Healthcare','Retail'],
    tags:[{l:'Support',c:'#a78bfa'},{l:'SLA',c:'#ec4899'}],
  },
  {
    id:5, title:'Multi-Tenant SaaS Setup & Tenant Management',
    desc:'Configure a multi-tenant SaaS environment — create tenants, set plans, manage billing, assign roles, and monitor from the SAAS admin panel.',
    duration:'12:08', bg:'linear-gradient(145deg,#180a2a,#200e35)', products:['Multi-Tenant SaaS'], industries:['Technology & SaaS'],
    tags:[{l:'SaaS Management',c:'#a78bfa'},{l:'Multi-Tenant',c:'#1EB980'}],
  },
  {
    id:6, title:'Email Inbox: IMAP Sync & CRM Entity Linking',
    desc:'Connect Gmail or Outlook via IMAP, sync emails in real time, track opens and clicks, and automatically link conversations to leads and contacts.',
    duration:'5:55', bg:'linear-gradient(145deg,#0a1622,#122640)', products:['Email Inbox'], industries:['Banking & Finance','Real Estate'],
    tags:[{l:'Email',c:'#38bdf8'},{l:'IMAP',c:'#14b8a6'}],
  },
  {
    id:7, title:'Bulk Lead Import, Deduplication & Assignment',
    desc:'Import thousands of leads from CSV, auto-detect duplicates, map fields, and bulk-assign to sales reps using smart rules.',
    duration:'9:14', bg:'linear-gradient(145deg,#0f1e10,#1a3520)', products:['Lead Management'], industries:['Education','Logistics'],
    tags:[{l:'Lead Management',c:'#1EB980'},{l:'Bulk Ops',c:'#34d399'}],
  },
  {
    id:8, title:'Product Catalog, Pricing & Quotation Builder',
    desc:'Build a product catalog with categories and multi-tier pricing, then add products to quotations with auto-calculated totals, GST, and PDF export.',
    duration:'11:20', bg:'linear-gradient(145deg,#0a1622,#0f2030)', products:['B2B Workflow'], industries:['Manufacturing','Retail'],
    tags:[{l:'Products',c:'#38bdf8'},{l:'Quotations',c:'#f59e0b'}],
  },
  {
    id:9, title:'Role-Based Access Control: Custom Roles & Permissions',
    desc:'Create custom roles with granular module-level permissions, assign to users and groups, and test field-level visibility controls.',
    duration:'8:40', bg:'linear-gradient(145deg,#1a1a0a,#262610)', products:['Access Management'], industries:['Banking & Finance','Healthcare'],
    tags:[{l:'Security',c:'#f59e0b'},{l:'RBAC',c:'#1EB980'}],
  },
  {
    id:10, title:'Reseller Program: Commission Setup & Partner Dashboard',
    desc:'Set up a reseller network, configure commission tiers, onboard a partner, and explore the partner dashboard with earnings tracking.',
    duration:'10:05', bg:'linear-gradient(145deg,#1a0a10,#2a1018)', products:['Multi-Tenant SaaS'], industries:['Technology & SaaS'],
    tags:[{l:'Reseller',c:'#ec4899'},{l:'Partners',c:'#f59e0b'}],
  },
  {
    id:11, title:'Feedback System: Sentiment Analysis & Escalation',
    desc:'Submit customer feedback, watch AI detect sentiment automatically, escalate from user to tenant admin to SAAS admin, and view analytics.',
    duration:'7:18', bg:'linear-gradient(145deg,#0a1020,#10203a)', products:['Support Tickets'], industries:['Retail','Education'],
    tags:[{l:'Feedback',c:'#a78bfa'},{l:'AI',c:'#f59e0b'}],
  },
  {
    id:12, title:'Data Center: Prospect Search, Filter & Bulk Assign',
    desc:'Search through thousands of prospects using multi-condition filters, segment by industry or company size, and bulk-assign to your sales team.',
    duration:'6:30', bg:'linear-gradient(145deg,#0a1614,#142a22)', products:['Data Center'], industries:['Manufacturing','Logistics'],
    tags:[{l:'Data Center',c:'#14b8a6'},{l:'Bulk Ops',c:'#1EB980'}],
  },
];

const PRODUCT_FILTERS = ['Lead Management','B2B Workflow','AI Assistant','Support Tickets','Email Inbox','Multi-Tenant SaaS','Access Management','Data Center'];
const INDUSTRY_FILTERS = ['Manufacturing','Banking & Finance','Healthcare','Retail & E-commerce','Real Estate','Technology & SaaS','Education','Logistics'];
const PER_PAGE = 6;

export default function DemoLibraryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [prodOpen, setProdOpen] = useState(true);
  const [indOpen, setIndOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('relevance');

  const toggleFilter = (val, list, setList) => {
    setList(prev => prev.includes(val) ? prev.filter(x=>x!==val) : [...prev, val]);
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = DEMOS.filter(d => {
      const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.desc.toLowerCase().includes(search.toLowerCase());
      const matchProduct = selectedProducts.length === 0 || d.products.some(p => selectedProducts.includes(p));
      const matchIndustry = selectedIndustries.length === 0 || d.industries.some(i => selectedIndustries.includes(i));
      return matchSearch && matchProduct && matchIndustry;
    });

    // Sort the results
    if (sortBy === 'newest') {
      result = [...result].reverse(); // Assuming DEMOS is already in order
    } else if (sortBy === 'popular') {
      // Sort by view count if available, otherwise keep original order
      result = [...result].sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    // 'relevance' keeps the original order

    return result;
  }, [search, selectedProducts, selectedIndustries, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const allActive = [...selectedProducts, ...selectedIndustries];

  return (
    <>
      <SEO
        title="Demo Library - Unified CRM"
        description="Watch video demos and tutorials. Learn how to use Unified CRM features with step-by-step guides and walkthroughs."
        url="https://unifiedcrm.texora.ai/demo/library"
        keywords="CRM demos, video tutorials, how-to videos, product walkthroughs, training videos"
      />
      <div className="dl">
      <style>{CSS}</style>
      <SharedHeader />

      {/* Hero */}
      <div className="dl-hero">
        <div className="dl-hero-inner">
          <h1 className="dl-hero-title">Unified CRM Demo Library</h1>
          <p className="dl-hero-desc">
            Get inspired, learn how it works, and accelerate your team's onboarding with step-by-step demo walkthroughs of every Unified CRM module.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="dl-body">

        {/* Sidebar */}
        <div className="dl-sidebar">
          {/* Search */}
          <div className="dl-search-wrap">
            <input className="dl-search" placeholder="Search by keyword" value={search}
              onChange={e=>{setSearch(e.target.value);setPage(1);}} />
            <span className="dl-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            </span>
          </div>

          {/* Products filter */}
          <div className="dl-filter-group">
            <button className="dl-filter-head" onClick={()=>setProdOpen(!prodOpen)}>
              <span className="dl-filter-title">Products</span>
              <span className={`dl-filter-arrow${prodOpen?' open':''}`}>▾</span>
            </button>
            {prodOpen && <>
              <div className="dl-filter-desc">Filter by product to explore deep dives into Unified CRM modules.</div>
              {PRODUCT_FILTERS.map(p=>(
                <label key={p} className="dl-check-row">
                  <input type="checkbox" checked={selectedProducts.includes(p)} onChange={()=>toggleFilter(p,selectedProducts,setSelectedProducts)} />
                  <span className="dl-check-label">{p}</span>
                </label>
              ))}
            </>}
          </div>

          {/* Industry filter */}
          <div className="dl-filter-group">
            <button className="dl-filter-head" onClick={()=>setIndOpen(!indOpen)}>
              <span className="dl-filter-title">Industry</span>
              <span className={`dl-filter-arrow${indOpen?' open':''}`}>▾</span>
            </button>
            {indOpen && <>
              <div className="dl-filter-desc">Filter by industry to explore business-relevant solutions for your sector.</div>
              {INDUSTRY_FILTERS.map(ind=>(
                <label key={ind} className="dl-check-row">
                  <input type="checkbox" checked={selectedIndustries.includes(ind)} onChange={()=>toggleFilter(ind,selectedIndustries,setSelectedIndustries)} />
                  <span className="dl-check-label">{ind}</span>
                </label>
              ))}
            </>}
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="dl-results-header">
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div className="dl-count">Showing {filtered.length} result{filtered.length!==1?'s':''}</div>
              {allActive.length > 0 && (
                <div className="dl-active-filters">
                  {allActive.slice(0,3).map(f=>(
                    <div key={f} className="dl-filter-tag">
                      {f}
                      <button onClick={()=>{
                        if(selectedProducts.includes(f)) setSelectedProducts(p=>p.filter(x=>x!==f));
                        else setSelectedIndustries(p=>p.filter(x=>x!==f));
                        setPage(1);
                      }}>×</button>
                    </div>
                  ))}
                  {allActive.length > 3 && <div className="dl-filter-tag">+{allActive.length-3} more</div>}
                  <button className="dl-clear-all" onClick={()=>{setSelectedProducts([]);setSelectedIndustries([]);setSearch('');setPage(1);}}>Clear All</button>
                </div>
              )}
            </div>
            <div className="dl-sort">
              Sort by:
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {paginated.length === 0 ? (
            <div className="dl-empty">
              <div className="dl-empty-icon">🔍</div>
              <div className="dl-empty-title">No demos found</div>
              <div className="dl-empty-desc">Try adjusting your filters or search terms.</div>
            </div>
          ) : (
            <div className="dl-grid">
              {paginated.map(d=>(
                <div key={d.id} className="dl-card" onClick={()=>navigate(`/feature/${d.products[0]==='Lead Management'?'lead-management':d.products[0]==='B2B Workflow'?'sales-finance':d.products[0]==='AI Assistant'?'automation':d.products[0]==='Support Tickets'?'support':d.products[0]==='Multi-Tenant SaaS'?'monetization':'access-management'}`)}>
                  <div className="dl-card-thumb" style={{
                    background: d.thumbnail ? `url(${d.thumbnail}) center/cover no-repeat, ${d.bg}` : d.bg,
                    position: 'relative'
                  }}>
                    {/* Overlay gradient for better play button visibility */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)'
                    }} />
                    <div className="dl-play" style={{ position: 'relative', zIndex: 2 }}>
                      <span className="dl-play-icon">▶</span>
                    </div>
                    <div className="dl-thumb-duration" style={{ zIndex: 2 }}>⏱ {d.duration}</div>
                  </div>
                  <div className="dl-card-body">
                    <div className="dl-card-tags">
                      {d.tags.map((t,i)=>(
                        <span key={i} className="dl-card-tag" style={{background:`${t.c}18`,color:t.c,border:`1px solid ${t.c}30`}}>{t.l}</span>
                      ))}
                    </div>
                    <div className="dl-card-title">{d.title}</div>
                    <div className="dl-card-desc">{d.desc}</div>
                    <button className="dl-watch-link">
                      <span>▶</span> Watch Demo <span style={{fontSize:15}}>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="dl-pagination">
              <button className="dl-page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                <button key={n} className={`dl-page-btn${page===n?' active':''}`} onClick={()=>setPage(n)}>{n}</button>
              ))}
              <button className="dl-page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
            </div>
          )}
        </div>
      </div>

      <SharedFooter />
    </div>
    </>
  );
}
