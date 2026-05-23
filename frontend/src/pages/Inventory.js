import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import inventoryService from '../services/inventoryService';
// Recharts removed — using CSS charts for reliability
import {
  Package, TrendingDown, AlertTriangle, XCircle, Plus, Minus,
  RefreshCw, Search, ChevronLeft, ChevronRight,
  BarChart2, FileText, Clock, ShoppingCart, CheckCircle,
  Zap, Activity, TrendingUp, ArrowUp, ArrowDown
} from 'lucide-react';

// ─── CSS Charts ───────────────────────────────────────────────────────────────
const CSSBarChart = ({ data, valueKey, nameKey, colorFn, height=160, formatVal }) => {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:8,height,padding:'0 4px'}}>
      {data.map((d, i) => {
        const pct = ((d[valueKey] || 0) / max) * 100;
        const color = colorFn ? colorFn(d, i) : ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9','#8b5cf6'][i % 6];
        return (
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,height:'100%',justifyContent:'flex-end'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#0f172a'}}>{formatVal ? formatVal(d[valueKey]) : d[valueKey]}</div>
            <div style={{width:'100%',maxWidth:44,background:`${color}20`,borderRadius:'4px 4px 0 0',height:`${Math.max(pct,2)}%`,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',bottom:0,left:0,right:0,background:color,borderRadius:'4px 4px 0 0',height:`${Math.max(pct,2)}%`}} />
            </div>
            <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{d[nameKey]}</div>
          </div>
        );
      })}
    </div>
  );
};

const CSSHBarChart = ({ data, valueKey, nameKey, colorFn, formatVal }) => {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8,padding:'4px 0'}}>
      {data.map((d, i) => {
        const pct = ((d[valueKey] || 0) / max) * 100;
        const color = colorFn ? colorFn(d, i) : ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9','#8b5cf6'][i % 6];
        return (
          <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:80,fontSize:11,color:'#64748b',fontWeight:600,textAlign:'right',flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d[nameKey]}</div>
            <div style={{flex:1,height:20,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.max(pct,1)}%`,background:color,borderRadius:4,transition:'width 0.5s ease'}} />
            </div>
            <div style={{width:60,fontSize:11,fontWeight:700,color:'#0f172a',flexShrink:0}}>{formatVal ? formatVal(d[valueKey]) : d[valueKey]}</div>
          </div>
        );
      })}
    </div>
  );
};

const CSSDonut = ({ data }) => {
  const total = data.reduce((s,d)=>s+(d.value||0), 0) || 1;
  let cumulative = 0;
  const segments = data.map(d => {
    const pct = (d.value / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start };
  });
  const conicStops = segments.map(s => `${s.color} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`).join(', ');
  return (
    <div style={{display:'flex',alignItems:'center',gap:16,padding:'8px 0'}}>
      <div style={{width:80,height:80,borderRadius:'50%',background:`conic-gradient(${conicStops})`,flexShrink:0,position:'relative'}}>
        <div style={{position:'absolute',inset:16,borderRadius:'50%',background:'#fff'}} />
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6,flex:1}}>
        {data.map((d,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:10,height:10,borderRadius:2,background:d.color,flexShrink:0}} />
              <span style={{fontSize:11,color:'#64748b',fontWeight:600}}>{d.name}</span>
            </div>
            <span style={{fontSize:12,fontWeight:800,color:'#0f172a'}}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CSSGroupedBar = ({ data, keys, colors, height=160, formatVal }) => {
  const max = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0)), 1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:6,height,padding:'0 4px'}}>
      {data.map((d, i) => (
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,height:'100%',justifyContent:'flex-end'}}>
          <div style={{display:'flex',alignItems:'flex-end',gap:2,width:'100%',justifyContent:'center'}}>
            {keys.map((k, ki) => {
              const pct = ((d[k] || 0) / max) * 100;
              return (
                <div key={ki} style={{flex:1,maxWidth:20,background:colors[ki],borderRadius:'3px 3px 0 0',height:`${Math.max(pct,2)}%`,minHeight:3}} title={`${k}: ${formatVal ? formatVal(d[k]) : d[k]}`} />
              );
            })}
          </div>
          <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{d.name}</div>
        </div>
      ))}
    </div>
  );
};

const CSSMovementBars = ({ data, height=150 }) => {
  const maxVal = Math.max(...data.flatMap(d=>[d.in||0, d.out||0]), 1);
  const totalIn  = data.reduce((s,d)=>s+(d.in||0),0);
  const totalOut = data.reduce((s,d)=>s+(d.out||0),0);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {/* Legend + totals */}
      <div style={{display:'flex',gap:14}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <div style={{width:10,height:10,borderRadius:2,background:'#10b981'}} />
          <span style={{fontSize:10,color:'#64748b',fontWeight:600}}>Stock In</span>
          <span style={{fontSize:11,fontWeight:800,color:'#10b981',marginLeft:3}}>+{totalIn}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <div style={{width:10,height:10,borderRadius:2,background:'#dc2626'}} />
          <span style={{fontSize:10,color:'#64748b',fontWeight:600}}>Stock Out</span>
          <span style={{fontSize:11,fontWeight:800,color:'#dc2626',marginLeft:3}}>-{totalOut}</span>
        </div>
      </div>
      {/* Bars */}
      <div style={{display:'flex',alignItems:'flex-end',gap:data.length===1?24:6,height:height-50,paddingBottom:2}}>
        {data.map((d,i)=>{
          const inH  = Math.max(((d.in||0)/maxVal)*100, d.in?8:0);
          const outH = Math.max(((d.out||0)/maxVal)*100, d.out?8:0);
          return (
            <div key={i} style={{flex:1,maxWidth:data.length===1?60:undefined,display:'flex',flexDirection:'column',alignItems:'center',gap:4,height:'100%',justifyContent:'flex-end'}}>
              <div style={{display:'flex',alignItems:'flex-end',gap:3,width:'100%',justifyContent:'center',height:'90%'}}>
                {d.in>0 && <div style={{flex:1,maxWidth:20,background:'#10b981',borderRadius:'4px 4px 0 0',height:`${inH}%`}}>
                  <div style={{fontSize:9,fontWeight:800,color:'#10b981',textAlign:'center',marginTop:-14}}>{d.in}</div>
                </div>}
                {d.out>0 && <div style={{flex:1,maxWidth:20,background:'#dc2626',borderRadius:'4px 4px 0 0',height:`${outH}%`}}>
                  <div style={{fontSize:9,fontWeight:800,color:'#dc2626',textAlign:'center',marginTop:-14}}>{d.out}</div>
                </div>}
                {!d.in && !d.out && <div style={{flex:1,maxWidth:20,background:'#f1f5f9',borderRadius:'4px 4px 0 0',height:'4%'}} />}
              </div>
              <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,textAlign:'center',whiteSpace:'nowrap'}}>{d.date}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const fmtCur  = v => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0}).format(v||0);
const fmtNum  = v => new Intl.NumberFormat('en-IN').format(v||0);
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtDT   = d => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const fmtShort= v => v>=10000000?`₹${(v/10000000).toFixed(1)}Cr`:v>=100000?`₹${(v/100000).toFixed(1)}L`:v>=1000?`₹${(v/1000).toFixed(0)}K`:`₹${v||0}`;

const TABS = [
  {key:'dashboard', label:'Dashboard',    icon:'📊'},
  {key:'stock',     label:'Stock',        icon:'📦'},
  {key:'history',   label:'Movements',    icon:'📋'},
  {key:'summary',   label:'Summary',      icon:'📄'},
  {key:'valuation', label:'Valuation',    icon:'💰'},
  {key:'abc',       label:'ABC Analysis', icon:'⚡'},
  {key:'aging',     label:'Stock Aging',  icon:'🕐'},
];

const STAT_CARDS = (s, filt, setFilt, setTab) => [
  {label:'Total Products',  val:fmtNum(s?.totalProducts),    grad:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)', act:filt==='',       f:()=>setFilt('')},
  {label:'Stock Value',     val:fmtShort(s?.totalStockValue),grad:'linear-gradient(135deg,#10b981 0%,#16a34a 50%,#84cc16 100%)', act:false,           f:null, sub:'at cost'},
  {label:'Committed',       val:fmtNum(s?.totalCommitted),   grad:'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)', act:false,           f:null, sub:'in quotations'},
  {label:'Low Stock',       val:fmtNum(s?.lowStockCount),    grad:'linear-gradient(135deg,#f97316 0%,#ef4444 50%,#dc2626 100%)', act:filt==='low',    f:()=>{setFilt('low');setTab('stock');}},
  {label:'Out of Stock',    val:fmtNum(s?.outOfStockCount),  grad:'linear-gradient(135deg,#ec4899 0%,#dc2626 50%,#9f1239 100%)', act:filt==='out',    f:()=>{setFilt('out');setTab('stock');}},
  {label:'Pending POs',     val:fmtNum(s?.pendingPOCount),   grad:'linear-gradient(135deg,#0ea5e9 0%,#6366f1 50%,#8b5cf6 100%)', act:false,          f:null},
];

const TX_CFG = {
  stock_in:   {label:'Stock In',   color:'#10b981', bg:'#d1fae5'},
  stock_out:  {label:'Stock Out',  color:'#dc2626', bg:'#fee2e2'},
  adjustment: {label:'Adjustment', color:'#6366f1', bg:'#ede9fe'},
};

const STOCK_CFG = {
  in_stock    :{label:'In Stock',     color:'#059669', bg:'#d1fae5'},
  low_stock   :{label:'Low Stock',    color:'#d97706', bg:'#fef3c7'},
  out_of_stock:{label:'Out of Stock', color:'#dc2626', bg:'#fee2e2'},
};

const ABC_CFG = {
  A:{label:'Class A', color:'#d97706', bg:'#fef3c7'},
  B:{label:'Class B', color:'#6366f1', bg:'#ede9fe'},
  C:{label:'Class C', color:'#64748b', bg:'#f1f5f9'},
};

export default function Inventory() {
  const [tab, setTab]         = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts]   = useState([]);
  const [summary, setSummary]     = useState({});
  const [txList, setTxList]       = useState([]);
  const [stockSum, setStockSum]   = useState([]);
  const [valuation, setVal]       = useState(null);
  const [abcData, setAbc]         = useState(null);
  const [agingData, setAging]     = useState([]);
  const [pag, setPag]             = useState({page:1,pages:1,total:0});
  const [txPag, setTxPag]         = useState({page:1,pages:1,total:0});

  const [search, setSearch]       = useState('');
  const [filt, setFilt]           = useState('');
  const [selProduct, setSelProduct] = useState(null);

  const [adjModal, setAdjModal]   = useState(null);
  const [adjForm, setAdjForm]     = useState({type:'stock_in',qty:'',reasonLabel:'',reason:''});
  const [adjLoad, setAdjLoad]     = useState(false);
  const [adjErr, setAdjErr]       = useState('');
  const [thModal, setThModal]     = useState(null);
  const [thForm, setThForm]       = useState({lowStockThreshold:'',reorderPoint:'',reorderQuantity:''});

  const ok  = m => { setSuccess(m); setTimeout(()=>setSuccess(''),3000); };
  const err = m => { setError(m);   setTimeout(()=>setError(''),4000);   };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try { const r=await inventoryService.getDashboard(); if(r?.data) setDashboard(r.data); }
    catch { err('Failed to load'); } finally { setLoading(false); }
  },[]);

  const loadStock = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const r=await inventoryService.getInventory({search,stockStatus:filt,page,limit:25});
      if(r?.data){ setProducts(r.data.products||[]); setSummary(r.data.summary||{}); setPag(r.data.pagination); }
    } catch { err('Failed'); } finally { setLoading(false); }
  },[search,filt]);

  const loadTx = useCallback(async (page=1) => {
    setLoading(true);
    try { const r=await inventoryService.getTransactions({page,limit:30}); if(r?.data){ setTxList(r.data.transactions||[]); setTxPag(r.data.pagination); } }
    catch { err('Failed'); } finally { setLoading(false); }
  },[]);

  const loadReport = useCallback(async (type) => {
    setLoading(true);
    try {
      if(type==='summary')   { const r=await inventoryService.getStockSummary();  setStockSum(r?.data||[]); }
      if(type==='valuation') { const r=await inventoryService.getStockValuation(); setVal(r?.data||null); }
      if(type==='abc')       { const r=await inventoryService.getABCAnalysis();   setAbc(r?.data||null); }
      if(type==='aging')     { const r=await inventoryService.getStockAging();    setAging(r?.data||[]); }
    } catch { err('Failed'); } finally { setLoading(false); }
  },[]);

  useEffect(()=>{
    if(tab==='dashboard') loadDashboard();
    else if(tab==='stock') loadStock(1);
    else if(tab==='history') loadTx(1);
    else if(['summary','valuation','abc','aging'].includes(tab)) loadReport(tab);
  },[tab]);

  useEffect(()=>{ if(tab==='stock') loadStock(1); },[search,filt]);

  const handleAdjust = async () => {
    if(!adjForm.qty||Number(adjForm.qty)<=0){ setAdjErr('Enter a valid quantity.'); return; }
    setAdjLoad(true); setAdjErr('');
    try {
      await inventoryService.adjustStock(adjModal._id,{type:adjForm.type,quantity:Number(adjForm.qty),reason:adjForm.reasonLabel==='Other'?adjForm.reason:(adjForm.reasonLabel||'Manual adjustment')});
      ok(`Updated: ${adjModal.name}`); setAdjModal(null); loadStock(pag.page); if(tab==='dashboard') loadDashboard();
    } catch(e){ setAdjErr(e.error||e.message||'Failed'); } finally { setAdjLoad(false); }
  };

  const handleThSave = async () => {
    try {
      await inventoryService.updateThreshold(thModal._id,{lowStockThreshold:Number(thForm.lowStockThreshold),reorderPoint:Number(thForm.reorderPoint),reorderQuantity:Number(thForm.reorderQuantity)});
      ok('Settings updated'); setThModal(null); loadStock(pag.page);
    } catch { err('Failed'); }
  };

  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  const TabDashboard = () => {
    if(loading||!dashboard) return <Spin />;
    const {summary:s, topSelling, pendingPOs, lowStockItems, recentActivity} = dashboard;

    const pieData = [
      {name:'In Stock',    value:(s.totalProducts||0)-(s.outOfStockCount||0)-(s.lowStockCount||0), color:'#10b981'},
      {name:'Low Stock',   value:s.lowStockCount||0,  color:'#f59e0b'},
      {name:'Out of Stock',value:s.outOfStockCount||0, color:'#dc2626'},
    ].filter(d=>d.value>0);

    const barData = (topSelling||[]).map(p=>({
      name:p.productName?.length>12?p.productName.slice(0,12)+'…':p.productName,
      qty:p.totalQty
    }));

    const actMap = {};
    (recentActivity||[]).forEach(a=>{
      const d=new Date(a.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
      if(!actMap[d]) actMap[d]={date:d,in:0,out:0};
      if(a.type==='stock_in') actMap[d].in+=a.quantity;
      if(a.type==='stock_out') actMap[d].out+=a.quantity;
    });
    const actData = Object.values(actMap).slice(-7);

    return (
      <div style={{display:'flex',flexDirection:'column',gap:12}}>

        {/* Charts row — Top Selling + Stock Status */}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10}}>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden',minWidth:0}}>
            <div style={{background:'#1e293b',padding:'7px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:11,fontWeight:700,color:'#fff'}}>🏆 Top Selling Products</span>
              <span style={{fontSize:10,color:'#94a3b8'}}>by units sold</span>
            </div>
            <div style={{padding:'12px 14px'}}>
              {barData.length===0 ? <Empty text="No sales recorded yet — pay an invoice to see data" /> : (
                <CSSBarChart data={barData} valueKey="qty" nameKey="name" height={160} />
              )}
            </div>
          </div>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden',minWidth:0}}>
            <div style={{background:'#1e293b',padding:'7px 12px'}}>
              <span style={{fontSize:11,fontWeight:700,color:'#fff'}}>📊 Stock Status</span>
            </div>
            <div style={{padding:'12px 14px'}}>
              {pieData.length===0 ? <Empty text="No data" /> : <CSSDonut data={pieData} />}
            </div>
          </div>
        </div>

        {/* Movement trend + alerts + POs */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden',minWidth:0}}>
            <div style={{background:'#1e293b',padding:'7px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:11,fontWeight:700,color:'#fff'}}>📈 Movement Trend</span>
              <span style={{fontSize:10,color:'#94a3b8'}}>last 7 days</span>
            </div>
            <div style={{padding:'12px 14px'}}>
              {actData.length===0 ? <Empty text="No movements yet" /> : (
                <CSSMovementBars data={actData} height={155} />
              )}
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:10,minWidth:0}}>
            <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
              <div style={{background:'linear-gradient(135deg,#7c2d12,#ea580c)',padding:'7px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'nowrap'}}>
                <span style={{fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>⚠️ Low Stock</span>
                <span style={{fontSize:10,fontWeight:700,color:'#fff',background:'rgba(0,0,0,0.2)',padding:'1px 7px',borderRadius:99,flexShrink:0}}>{lowStockItems?.length||0}</span>
              </div>
              {!lowStockItems?.length ? <div style={{padding:12}}><Empty text="All well stocked ✓" /></div> : (
                <div>
                  {lowStockItems.slice(0,4).map((p,i)=>(
                    <div key={p._id} style={{display:'flex',alignItems:'center',padding:'8px 12px',borderBottom:i<3?'1px solid #f8fafc':'none',gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                        <div style={{height:4,background:'#f1f5f9',borderRadius:99,marginTop:4,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${Math.min(100,(p.stock/(p.lowStockThreshold*2||1))*100)}%`,background:p.stock===0?'#dc2626':'#f59e0b',borderRadius:99}} />
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:15,fontWeight:900,color:p.stock===0?'#dc2626':'#d97706'}}>{p.stock}</div>
                        <div style={{fontSize:9,color:'#94a3b8'}}>min {p.lowStockThreshold}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
              <div style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)',padding:'7px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'nowrap'}}>
                <span style={{fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>📦 Pending POs</span>
                <span style={{fontSize:10,fontWeight:700,color:'#fff',background:'rgba(0,0,0,0.2)',padding:'1px 7px',borderRadius:99,flexShrink:0}}>{pendingPOs?.length||0}</span>
              </div>
              {!pendingPOs?.length ? <div style={{padding:12}}><Empty text="All POs received ✓" /></div> : (
                <div>
                  {pendingPOs.slice(0,3).map((po,i)=>(
                    <div key={po._id} style={{display:'flex',alignItems:'center',padding:'8px 12px',borderBottom:i<2?'1px solid #f8fafc':'none',gap:10}}>
                      <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:'#0f172a',fontFamily:'monospace'}}>{po.poNumber}</div></div>
                      <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:po.receiveStatus==='partially_received'?'#fef3c7':'#fee2e2',color:po.receiveStatus==='partially_received'?'#92400e':'#991b1b'}}>
                        {po.receiveStatus==='partially_received'?'PARTIAL':'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent activity table */}
        <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
          <div style={{background:'#1e293b',padding:'7px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:11,fontWeight:700,color:'#fff'}}>🕐 Recent Activity</span>
            <button onClick={()=>setTab('history')} style={{fontSize:10,color:'#94a3b8',background:'none',border:'none',cursor:'pointer'}}>View all →</button>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  {['Time','Product','Type','Change','Before → After','Reason','Reference'].map(h=>(
                    <th key={h} className="xTh" style={{padding:'6px 10px',textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentActivity||[]).slice(0,6).map(t=>{
                  const cfg=TX_CFG[t.type]||TX_CFG.adjustment;
                  return (
                    <tr key={t._id} className="xRow">
                      <td className="xTd" style={{color:'#94a3b8',fontSize:11,whiteSpace:'nowrap'}}>{fmtDT(t.createdAt)}</td>
                      <td className="xTd" style={{fontWeight:700,fontSize:12}}>{t.productName}</td>
                      <td className="xTd"><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:cfg.bg,color:cfg.color}}>{cfg.label}</span></td>
                      <td className="xTd" style={{fontWeight:900,color:t.type==='stock_in'?'#10b981':'#dc2626',fontSize:14}}>{t.type==='stock_in'?'+':t.type==='stock_out'?'-':''}{t.quantity}</td>
                      <td className="xTd" style={{fontSize:12,color:'#64748b'}}><b style={{color:'#0f172a'}}>{t.previousStock}</b> → <b style={{color:'#0f172a'}}>{t.newStock}</b></td>
                      <td className="xTd" style={{fontSize:11,color:'#64748b',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis'}}>{t.reason||'—'}</td>
                      <td className="xTd" style={{fontSize:11,color:'#6366f1',fontFamily:'monospace',fontWeight:700}}>{t.referenceNumber||'—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!recentActivity?.length && <Empty text="No activity yet" />}
          </div>
        </div>
      </div>
    );
  };

  // ── STOCK ────────────────────────────────────────────────────────────────────
  const TabStock = () => (
    <div style={{display:'flex',gap:10,minHeight:500}}>
      {/* Table side */}
      <div style={{flex: selProduct ? '0 0 58%' : '1', minWidth:0, display:'flex', flexDirection:'column'}}>
        {/* Toolbar */}
        <div style={{background:'#fff',borderRadius:'8px 8px 0 0',border:'1px solid #d1d5db',borderBottom:'none',padding:'8px 12px',display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{position:'relative',flex:1,minWidth:140}}>
            <Search style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',width:13,color:'#94a3b8'}} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." style={{width:'100%',padding:'5px 10px 5px 28px',border:'1px solid #d1d5db',borderRadius:5,fontSize:12,outline:'none',background:'#f9fafb',boxSizing:'border-box'}} />
          </div>
          <select value={filt} onChange={e=>setFilt(e.target.value)} style={{padding:'5px 9px',border:'1px solid #d1d5db',borderRadius:5,fontSize:11,outline:'none',background:'#f9fafb',fontWeight:600,color:'#374151'}}>
            <option value="">All Stock</option>
            <option value="ok">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          {filt&&<button onClick={()=>setFilt('')} style={{background:'#fee2e2',color:'#dc2626',border:'1px solid #fecaca',padding:'5px 9px',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer'}}>✕ Clear</button>}
          <span style={{marginLeft:'auto',fontSize:10,color:'#94a3b8',fontWeight:600}}>{summary.totalProducts||0} products</span>
        </div>

        <div style={{overflowX:'auto',borderRadius:'0 0 8px 8px',border:'1px solid #d1d5db',background:'#fff',flex:1}}>
          {loading ? <Spin /> : products.length===0 ? <Empty text="No products found" /> : (
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  {['#','Product','Article #','On Hand','Committed','Available','Value','Status','Actions'].map(h=>(
                    <th key={h} className="xTh" style={{padding:'7px 10px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p,i)=>{
                  const avail=Math.max(0,p.stock-(p.committedStock||0));
                  const sc=STOCK_CFG[p.stockStatus]||STOCK_CFG.in_stock;
                  const isSel=selProduct?._id===p._id;
                  return (
                    <tr key={p._id} className={`xRow${isSel?' xSel':''}`} onClick={()=>setSelProduct(isSel?null:p)}>
                      <td className="xTd xNum">{(pag.page-1)*25+i+1}</td>
                      <td className="xTd" style={{fontWeight:700,fontSize:13}}>
                        {p.name}
                        <div style={{fontSize:10,color:'#94a3b8',fontWeight:400}}>{p.category}</div>
                      </td>
                      <td className="xTd" style={{fontFamily:'monospace',color:'#6366f1',fontWeight:700,fontSize:12}}>{p.articleNumber}</td>
                      <td className="xTd">
                        <span style={{fontSize:16,fontWeight:900,color:p.stock===0?'#dc2626':p.stock<=p.lowStockThreshold?'#d97706':'#0f172a'}}>{fmtNum(p.stock)}</span>
                        <span style={{fontSize:10,color:'#94a3b8',marginLeft:3}}>{p.unit||'pcs'}</span>
                        <div style={{height:3,background:'#f1f5f9',borderRadius:99,marginTop:3,width:60,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${Math.min(100,(p.stock/Math.max(p.lowStockThreshold*3,1))*100)}%`,background:p.stock===0?'#dc2626':p.stock<=p.lowStockThreshold?'#f59e0b':'#10b981',borderRadius:99}} />
                        </div>
                      </td>
                      <td className="xTd" style={{fontWeight:700,color:'#d97706'}}>{fmtNum(p.committedStock||0)}</td>
                      <td className="xTd" style={{fontWeight:700,color:'#10b981'}}>{fmtNum(avail)}</td>
                      <td className="xTd" style={{fontWeight:700,color:'#6366f1',fontSize:12}}>{fmtCur(p.stock*(p.costPrice||p.price))}</td>
                      <td className="xTd">
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:sc.bg,color:sc.color}}>{sc.label}</span>
                      </td>
                      <td className="xTd" onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={()=>{setAdjModal(p);setAdjForm({type:'stock_in',qty:'',reasonLabel:'',reason:''});setAdjErr('');}} style={{padding:'4px 9px',borderRadius:4,border:'none',background:'#d1fae5',color:'#059669',fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:2}}><ArrowUp style={{width:10}} />In</button>
                          <button onClick={()=>{setAdjModal(p);setAdjForm({type:'stock_out',qty:'',reasonLabel:'',reason:''});setAdjErr('');}} disabled={p.stock===0} style={{padding:'4px 9px',borderRadius:4,border:'none',background:p.stock===0?'#f1f5f9':'#fee2e2',color:p.stock===0?'#94a3b8':'#dc2626',fontSize:11,fontWeight:700,cursor:p.stock===0?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:2}}><ArrowDown style={{width:10}} />Out</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <Pager data={pag} onPage={loadStock} />
      </div>

      {/* Detail Panel */}
      {selProduct && (
        <div style={{flex:'0 0 40%',background:'#fff',borderRadius:8,border:'1px solid #d1d5db',overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{background:'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 40%,#0d1b4b 100%)',padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>{selProduct.name}</div>
              <div style={{fontSize:10,color:'#8b9ccc',marginTop:2,fontFamily:'monospace'}}>{selProduct.articleNumber}</div>
            </div>
            <button onClick={()=>setSelProduct(null)} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:5,width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13}}>✕</button>
          </div>

          {/* Stock numbers */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:1,background:'#f1f5f9'}}>
            {[
              {label:'On Hand',  val:selProduct.stock,                                    color:'#0f172a', bg:'#fff'},
              {label:'Committed',val:selProduct.committedStock||0,                        color:'#d97706', bg:'#fffbeb'},
              {label:'Available',val:Math.max(0,selProduct.stock-(selProduct.committedStock||0)), color:'#059669', bg:'#f0fdf4'},
            ].map(c=>(
              <div key={c.label} style={{background:c.bg,padding:'12px',textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:900,color:c.color}}>{fmtNum(c.val)}</div>
                <div style={{fontSize:10,color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',marginTop:2}}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div style={{flex:1,overflowY:'auto'}}>
            {[
              ['Category',      selProduct.category],
              ['Unit',          selProduct.unit||'piece'],
              ['Cost Price',    fmtCur(selProduct.costPrice)],
              ['Selling Price', fmtCur(selProduct.price)],
              ['Stock Value',   fmtCur(selProduct.stock*(selProduct.costPrice||selProduct.price))],
              ['Low Stock Alert',selProduct.lowStockThreshold],
              ['Reorder Point', selProduct.reorderPoint||5],
              ['Reorder Qty',   selProduct.reorderQuantity||10],
              ['Status',        <span style={{fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:4,background:(STOCK_CFG[selProduct.stockStatus]||STOCK_CFG.in_stock).bg,color:(STOCK_CFG[selProduct.stockStatus]||STOCK_CFG.in_stock).color}}>{(STOCK_CFG[selProduct.stockStatus]||STOCK_CFG.in_stock).label}</span>],
            ].map(([l,v],i)=>(
              <div key={l} style={{display:'grid',gridTemplateColumns:'110px 1fr',borderBottom:'1px solid #f1f5f9',minHeight:30,background:i%2===0?'#fff':'#f8fafc'}}>
                <div style={{fontSize:10,fontWeight:600,color:'#64748b',padding:'7px 12px',textTransform:'uppercase',letterSpacing:'0.3px'}}>{l}</div>
                <div style={{fontSize:12,fontWeight:500,color:'#1e293b',padding:'7px 12px',borderLeft:'1px solid #f1f5f9'}}>{v}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{padding:'10px 12px',borderTop:'1px solid #e2e8f0',display:'flex',gap:7,background:'#f8fafc'}}>
            <button onClick={()=>{setAdjModal(selProduct);setAdjForm({type:'stock_in',qty:'',reasonLabel:'',reason:''});setAdjErr('');}} style={{flex:1,padding:'7px',borderRadius:6,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>↑ Stock In</button>
            <button onClick={()=>{setAdjModal(selProduct);setAdjForm({type:'stock_out',qty:'',reasonLabel:'',reason:''});setAdjErr('');}} disabled={selProduct.stock===0} style={{flex:1,padding:'7px',borderRadius:6,border:'none',background:selProduct.stock===0?'#e2e8f0':'linear-gradient(135deg,#ef4444,#dc2626)',color:selProduct.stock===0?'#94a3b8':'#fff',fontSize:12,fontWeight:700,cursor:selProduct.stock===0?'not-allowed':'pointer'}}>↓ Stock Out</button>
            <button onClick={()=>{setThModal(selProduct);setThForm({lowStockThreshold:selProduct.lowStockThreshold,reorderPoint:selProduct.reorderPoint||5,reorderQuantity:selProduct.reorderQuantity||10});}} style={{flex:1,padding:'7px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:'#475569',fontSize:12,fontWeight:700,cursor:'pointer'}}>⚙ Settings</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── MOVEMENTS ────────────────────────────────────────────────────────────────
  const TabHistory = () => (
    <div style={{background:'#fff',borderRadius:8,border:'1px solid #d1d5db',overflow:'hidden'}}>
      {loading ? <Spin /> : txList.length===0 ? <Empty text="No movements yet" /> : (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['#','Date & Time','Product','Type','Qty','Before → After','Reason','Reference','By'].map(h=>(
                  <th key={h} className="xTh" style={{padding:'7px 10px'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txList.map((tx,i)=>{
                const cfg=TX_CFG[tx.type]||TX_CFG.adjustment;
                return (
                  <tr key={tx._id} className="xRow">
                    <td className="xTd xNum">{(txPag.page-1)*30+i+1}</td>
                    <td className="xTd" style={{color:'#94a3b8',fontSize:11,whiteSpace:'nowrap'}}>{fmtDT(tx.createdAt)}</td>
                    <td className="xTd" style={{fontWeight:700,fontSize:12}}>{tx.productName}</td>
                    <td className="xTd"><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:cfg.bg,color:cfg.color}}>{cfg.label}</span></td>
                    <td className="xTd" style={{fontWeight:900,color:tx.type==='stock_in'?'#10b981':'#dc2626',fontSize:15}}>{tx.type==='stock_in'?'+':tx.type==='stock_out'?'-':''}{tx.quantity}</td>
                    <td className="xTd" style={{fontSize:12}}><b>{tx.previousStock}</b> → <b>{tx.newStock}</b></td>
                    <td className="xTd" style={{fontSize:11,color:'#64748b',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis'}}>{tx.reason||'—'}</td>
                    <td className="xTd" style={{fontSize:11,color:'#6366f1',fontFamily:'monospace',fontWeight:700}}>{tx.referenceNumber||'—'}</td>
                    <td className="xTd" style={{fontSize:11,color:'#64748b'}}>{tx.createdBy?`${tx.createdBy.firstName} ${tx.createdBy.lastName}`:'—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pager data={txPag} onPage={loadTx} />
    </div>
  );

  // ── SUMMARY ──────────────────────────────────────────────────────────────────
  const TabSummary = () => (
    <div style={{background:'#fff',borderRadius:8,border:'1px solid #d1d5db',overflow:'hidden'}}>
      {loading ? <Spin /> : stockSum.length===0 ? <Empty text="No data" /> : (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['#','Product','Category','Stock In','Stock Out','Current','Committed','Available','Value','Status'].map(h=>(
                  <th key={h} className="xTh" style={{padding:'7px 10px'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockSum.map((p,i)=>{
                const sc=STOCK_CFG[p.stockStatus]||STOCK_CFG.in_stock;
                return (
                  <tr key={p._id} className="xRow">
                    <td className="xTd xNum">{i+1}</td>
                    <td className="xTd" style={{fontWeight:700,fontSize:13}}>{p.name}<div style={{fontSize:10,color:'#94a3b8',fontFamily:'monospace'}}>{p.articleNumber}</div></td>
                    <td className="xTd" style={{color:'#64748b',fontSize:12}}>{p.category}</td>
                    <td className="xTd" style={{fontWeight:800,color:'#10b981',fontSize:14}}>+{fmtNum(p.stockIn)}</td>
                    <td className="xTd" style={{fontWeight:800,color:'#dc2626',fontSize:14}}>-{fmtNum(p.stockOut)}</td>
                    <td className="xTd" style={{fontWeight:900,fontSize:16,color:'#0f172a'}}>{fmtNum(p.currentStock)}</td>
                    <td className="xTd" style={{fontWeight:700,color:'#d97706'}}>{fmtNum(p.committedStock)}</td>
                    <td className="xTd" style={{fontWeight:700,color:'#10b981'}}>{fmtNum(p.availableStock)}</td>
                    <td className="xTd" style={{fontWeight:700,color:'#6366f1',fontSize:12}}>{fmtCur(p.stockValue)}</td>
                    <td className="xTd"><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:sc.bg,color:sc.color}}>{sc.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ── VALUATION ────────────────────────────────────────────────────────────────
  const TabValuation = () => {
    if(loading) return <Spin />;
    if(!valuation) return <Empty text="No data" />;
    const barData = valuation.items.slice(0,8).map(p=>({name:p.name.length>12?p.name.slice(0,12)+'…':p.name,cost:p.stockValue,revenue:p.potentialRevenue}));
    return (
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[
            {label:'Total Stock Value',       val:fmtShort(valuation.totalValue),                             grad:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)',sub:'at cost price'},
            {label:'Potential Revenue',        val:fmtShort(valuation.totalPotentialRevenue),                  grad:'linear-gradient(135deg,#10b981 0%,#16a34a 50%,#84cc16 100%)',sub:'at selling price'},
            {label:'Gross Margin Potential',   val:fmtShort(valuation.totalPotentialRevenue-valuation.totalValue),grad:'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)',sub:'if all stock sold'},
          ].map((c,i)=>(
            <div key={i} className="sStat" style={{background:c.grad,borderRadius:8,padding:'14px 16px',boxShadow:'0 2px 10px rgba(0,0,0,0.15)'}}>
              <div style={{fontSize:24,fontWeight:900,color:'#fff',lineHeight:1}}>{c.val}</div>
              <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.85)',marginTop:5,textTransform:'uppercase',letterSpacing:'0.5px'}}>{c.label}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.6)',marginTop:2}}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
          <div style={{background:'#1e293b',padding:'7px 12px'}}>
            <span style={{fontSize:11,fontWeight:700,color:'#fff'}}>💰 Cost vs Revenue per Product</span>
          </div>
          <div style={{padding:'14px'}}>
            <div style={{display:'flex',gap:12,marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:10,height:10,borderRadius:2,background:'#6366f1'}} /><span style={{fontSize:10,color:'#64748b',fontWeight:600}}>Stock Value</span></div>
              <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:10,height:10,borderRadius:2,background:'#10b981'}} /><span style={{fontSize:10,color:'#64748b',fontWeight:600}}>Potential Revenue</span></div>
            </div>
            <CSSGroupedBar data={barData} keys={['cost','revenue']} colors={['#6366f1','#10b981']} height={160} formatVal={fmtShort} />
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:8,border:'1px solid #d1d5db',overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['#','Product','Stock','Cost Price','Sell Price','Stock Value','Potential Revenue','Margin %'].map(h=><th key={h} className="xTh" style={{padding:'7px 10px'}}>{h}</th>)}</tr></thead>
              <tbody>
                {valuation.items.map((p,i)=>{
                  const margin=p.potentialRevenue>0?((p.potentialRevenue-p.stockValue)/p.potentialRevenue*100).toFixed(1):0;
                  return (
                    <tr key={p._id} className="xRow">
                      <td className="xTd xNum">{i+1}</td>
                      <td className="xTd" style={{fontWeight:700,fontSize:13}}>{p.name}<div style={{fontSize:10,color:'#94a3b8',fontFamily:'monospace'}}>{p.articleNumber}</div></td>
                      <td className="xTd" style={{fontWeight:900,fontSize:15}}>{fmtNum(p.stock)}</td>
                      <td className="xTd" style={{color:'#64748b',fontSize:12}}>{fmtCur(p.costPrice)}</td>
                      <td className="xTd" style={{color:'#64748b',fontSize:12}}>{fmtCur(p.sellingPrice)}</td>
                      <td className="xTd" style={{fontWeight:700,color:'#6366f1',fontSize:12}}>{fmtCur(p.stockValue)}</td>
                      <td className="xTd" style={{fontWeight:700,color:'#10b981',fontSize:12}}>{fmtCur(p.potentialRevenue)}</td>
                      <td className="xTd">
                        <div style={{display:'flex',alignItems:'center',gap:7}}>
                          <div style={{width:50,height:5,background:'#f1f5f9',borderRadius:99,overflow:'hidden'}}>
                            <div style={{width:`${Math.min(100,margin)}%`,height:'100%',background:'#10b981',borderRadius:99}} />
                          </div>
                          <span style={{fontSize:11,fontWeight:800,color:'#10b981'}}>{margin}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── ABC ──────────────────────────────────────────────────────────────────────
  const TabABC = () => {
    if(loading) return <Spin />;
    if(!abcData) return <Empty text="No sales data yet — create and pay some invoices first" />;
    const abcPie=[
      {name:'Class A',value:abcData.summary.A,color:'#d97706'},
      {name:'Class B',value:abcData.summary.B,color:'#6366f1'},
      {name:'Class C',value:abcData.summary.C,color:'#64748b'},
    ].filter(d=>d.value>0);
    const topBar=abcData.items.slice(0,8).map(p=>({name:p.name.length>12?p.name.slice(0,12)+'…':p.name,revenue:p.totalRevenue,cls:p.abcClass}));
    return (
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[
            {cls:'A',count:abcData.summary.A,label:'High Value',sub:'Top 80% revenue',grad:'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ea580c 100%)'},
            {cls:'B',count:abcData.summary.B,label:'Medium Value',sub:'Next 15% revenue',grad:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)'},
            {cls:'C',count:abcData.summary.C,label:'Low Value',sub:'Remaining 5%',grad:'linear-gradient(135deg,#475569 0%,#64748b 50%,#94a3b8 100%)'},
          ].map(c=>(
            <div key={c.cls} className="sStat" style={{background:c.grad,borderRadius:8,padding:'14px 16px',boxShadow:'0 2px 10px rgba(0,0,0,0.15)'}}>
              <div style={{fontSize:36,fontWeight:900,color:'rgba(255,255,255,0.9)',lineHeight:1}}>{c.cls}</div>
              <div style={{fontSize:22,fontWeight:900,color:'#fff',marginTop:4}}>{c.count} products</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.85)',marginTop:4,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px'}}>{c.label}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.6)',marginTop:2}}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
            <div style={{background:'#1e293b',padding:'7px 12px'}}><span style={{fontSize:11,fontWeight:700,color:'#fff'}}>Revenue by Product</span></div>
            <div style={{padding:'14px'}}>
              {topBar.length===0 ? <Empty text="No sales data yet" /> : (
                <CSSHBarChart data={topBar} valueKey="revenue" nameKey="name" colorFn={(d)=>d.cls==='A'?'#d97706':d.cls==='B'?'#6366f1':'#64748b'} formatVal={fmtShort} />
              )}
            </div>
          </div>

          <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
            <div style={{background:'#1e293b',padding:'7px 12px'}}><span style={{fontSize:11,fontWeight:700,color:'#fff'}}>ABC Distribution</span></div>
            <div style={{padding:'14px'}}>
              {abcPie.length===0 ? <Empty text="No sales data yet" /> : <CSSDonut data={abcPie} />}
            </div>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:8,border:'1px solid #d1d5db',overflow:'hidden'}}>
          <div style={{background:'#1e293b',padding:'7px 12px',display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:11,fontWeight:700,color:'#fff'}}>Full ABC Table</span>
            <span style={{fontSize:10,color:'#94a3b8'}}>A = 80% revenue · B = 15% · C = 5%</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['#','Class','Product','Qty Sold','Revenue','Revenue %','Cumulative %'].map(h=><th key={h} className="xTh" style={{padding:'7px 10px'}}>{h}</th>)}</tr></thead>
              <tbody>
                {abcData.items.map((p,i)=>{
                  const ac=ABC_CFG[p.abcClass]||ABC_CFG.C;
                  return (
                    <tr key={p._id} className="xRow">
                      <td className="xTd xNum">{i+1}</td>
                      <td className="xTd"><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:ac.bg,color:ac.color}}>{ac.label}</span></td>
                      <td className="xTd" style={{fontWeight:700,fontSize:13}}>{p.name}<div style={{fontSize:10,color:'#94a3b8',fontFamily:'monospace'}}>{p.articleNumber}</div></td>
                      <td className="xTd" style={{fontWeight:800,fontSize:14}}>{fmtNum(p.totalQtySold)}</td>
                      <td className="xTd" style={{fontWeight:700,color:'#10b981',fontSize:12}}>{fmtCur(p.totalRevenue)}</td>
                      <td className="xTd" style={{fontWeight:600,color:'#64748b'}}>{p.revenuePercent}%</td>
                      <td className="xTd">
                        <div style={{display:'flex',alignItems:'center',gap:7}}>
                          <div style={{width:70,height:5,background:'#f1f5f9',borderRadius:99,overflow:'hidden'}}>
                            <div style={{width:`${p.cumulativePercent}%`,height:'100%',background:p.abcClass==='A'?'#d97706':p.abcClass==='B'?'#6366f1':'#64748b',borderRadius:99}} />
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:'#64748b'}}>{p.cumulativePercent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── AGING ────────────────────────────────────────────────────────────────────
  const TabAging = () => {
    if(loading) return <Spin />;
    if(!agingData.length) return <Empty text="No stock data" />;
    const bktCount={'0-30 days':0,'31-60 days':0,'61-90 days':0,'90+ days':0,'No receive recorded':0};
    agingData.forEach(p=>{ if(bktCount[p.agingBucket]!==undefined) bktCount[p.agingBucket]++; });
    const bktBar=Object.entries(bktCount).filter(([,v])=>v>0).map(([k,v])=>({name:k,count:v}));
    const bktColor={'0-30 days':'#10b981','31-60 days':'#f59e0b','61-90 days':'#f97316','90+ days':'#dc2626','No receive recorded':'#64748b'};
    return (
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
          <div style={{background:'#1e293b',padding:'7px 12px'}}><span style={{fontSize:11,fontWeight:700,color:'#fff'}}>🕐 Aging Distribution</span></div>
          <div style={{padding:'14px'}}>
            {bktBar.length===0 ? <Empty text="No data" /> : (
              <CSSBarChart data={bktBar} valueKey="count" nameKey="name" height={160} colorFn={(d)=>bktColor[d.name]||'#64748b'} />
            )}
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:8,border:'1px solid #d1d5db',overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['#','Product','Category','Stock','Last Received','Days','Bucket','Value'].map(h=><th key={h} className="xTh" style={{padding:'7px 10px'}}>{h}</th>)}</tr></thead>
              <tbody>
                {agingData.map((p,i)=>{
                  const bc=bktColor[p.agingBucket]||'#64748b';
                  return (
                    <tr key={p._id} className="xRow">
                      <td className="xTd xNum">{i+1}</td>
                      <td className="xTd" style={{fontWeight:700,fontSize:13}}>{p.name}<div style={{fontSize:10,color:'#94a3b8',fontFamily:'monospace'}}>{p.articleNumber}</div></td>
                      <td className="xTd" style={{color:'#64748b',fontSize:12}}>{p.category}</td>
                      <td className="xTd" style={{fontWeight:900,fontSize:16}}>{fmtNum(p.stock)}</td>
                      <td className="xTd" style={{color:'#94a3b8',fontSize:11}}>{fmtDate(p.lastReceiveDate)}</td>
                      <td className="xTd">
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:45,height:5,background:'#f1f5f9',borderRadius:99,overflow:'hidden'}}>
                            <div style={{width:`${Math.min(100,((p.daysSinceReceive||0)/120)*100)}%`,height:'100%',background:bc,borderRadius:99}} />
                          </div>
                          <span style={{fontWeight:800,color:bc,fontSize:12}}>{p.daysSinceReceive!==null?`${p.daysSinceReceive}d`:'—'}</span>
                        </div>
                      </td>
                      <td className="xTd"><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:bc+'20',color:bc}}>{p.agingBucket}</span></td>
                      <td className="xTd" style={{fontWeight:700,color:'#6366f1',fontSize:12}}>{fmtCur(p.stockValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const RENDER = {dashboard:TabDashboard,stock:TabStock,history:TabHistory,summary:TabSummary,valuation:TabValuation,abc:TabABC,aging:TabAging};

  return (
    <DashboardLayout title="Inventory">
      <style>{`
        .xTh{position:sticky;top:0;z-index:2;background:#1e293b;border:1px solid #334155;padding:7px 10px;font-size:10px;font-weight:700;color:#94a3b8;text-align:left;white-space:nowrap;user-select:none;letter-spacing:.5px;text-transform:uppercase;}
        .xTd{border:1px solid #e2e6eb;padding:0 10px;font-size:12px;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;height:38px;vertical-align:middle;}
        .xRow{cursor:pointer;}
        .xRow:hover .xTd{background:#eff6ff!important;}
        .xRow.xSel .xTd{background:#e0e7ff!important;border-color:#c7d2fe!important;}
        .xNum{position:sticky;left:0;z-index:1;background:#f8fafc!important;border:1px solid #d1d5db!important;padding:0 8px;font-size:10px;color:#94a3b8;text-align:center;width:32px;min-width:32px;font-weight:600;}
        .xRow.xSel .xNum{background:#e0e7ff!important;}
        .sStat{cursor:pointer;border-radius:8px;padding:10px 14px;transition:transform 0.18s ease,box-shadow 0.18s ease,filter 0.18s ease;}
        .sStat:hover{transform:translateY(-3px) scale(1.03);filter:brightness(1.15);box-shadow:0 8px 24px rgba(0,0,0,0.28)!important;}
        .sStat:active{transform:translateY(0) scale(0.98);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .inv-fade{animation:fadeUp 0.2s ease}
      `}</style>

      {/* Hero bar */}
      <div style={{background:'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 40%,#0d1b4b 100%)',borderRadius:12,marginBottom:10,padding:'11px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:8,background:'rgba(99,102,241,0.3)',border:'1px solid rgba(99,102,241,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📦</div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:'#fff',letterSpacing:'-0.3px'}}>Inventory Management</div>
            <div style={{fontSize:10,color:'#8b9ccc',marginTop:1}}>{summary.totalProducts||0} products · Real-time stock tracking & analytics</div>
          </div>
        </div>
        <button onClick={()=>{if(tab==='dashboard')loadDashboard();else if(tab==='stock')loadStock(1);else if(tab==='history')loadTx(1);else loadReport(tab);}}
          style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.07)',borderRadius:7,padding:'6px 12px',border:'1px solid rgba(255,255,255,0.15)',fontSize:11,color:'rgba(255,255,255,0.7)',cursor:'pointer',fontWeight:600}}>
          <RefreshCw style={{width:12}} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8,marginBottom:10}}>
        {STAT_CARDS(dashboard?.summary||summary, filt, setFilt, setTab).map((s,i)=>(
          <div key={i} onClick={s.f||undefined} className="sStat"
            style={{background:s.grad,boxShadow:s.act?'0 4px 18px rgba(0,0,0,0.3)':'0 2px 8px rgba(0,0,0,0.15)',outline:s.act?'2px solid rgba(255,255,255,0.5)':'none',outlineOffset:3,cursor:s.f?'pointer':'default'}}>
            <div style={{fontSize:22,fontWeight:900,color:'#fff',lineHeight:1,marginBottom:4,textShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>{s.val}</div>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.85)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{s.label}</div>
            {s.sub&&<div style={{fontSize:9,color:'rgba(255,255,255,0.6)',marginTop:2}}>{s.sub}</div>}
            {s.act&&<div style={{width:20,height:2,background:'rgba(255,255,255,0.6)',borderRadius:1,marginTop:5}} />}
          </div>
        ))}
      </div>

      {success&&<div style={{background:'#f0fdf4',border:'1px solid #86efac',color:'#166534',padding:'9px 14px',borderRadius:7,marginBottom:10,fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:7}}><CheckCircle style={{width:13}} /> {success}</div>}
      {error  &&<div style={{background:'#fef2f2',border:'1px solid #fca5a5',color:'#dc2626', padding:'9px 14px',borderRadius:7,marginBottom:10,fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:7}}><AlertTriangle style={{width:13}} /> {error}</div>}

      {/* Tab bar */}
      <div style={{display:'flex',gap:2,background:'#f1f5f9',borderRadius:8,padding:3,marginBottom:10,border:'1px solid #e2e8f0',overflowX:'auto'}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:6,border:'none',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s',
              background:tab===t.key?'#fff':'transparent',
              color:tab===t.key?'#0f172a':'#94a3b8',
              boxShadow:tab===t.key?'0 1px 6px rgba(0,0,0,0.1)':'none',
            }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="inv-fade" key={tab}>{RENDER[tab] ? RENDER[tab]() : null}</div>

      {/* Adjust Modal */}
      {adjModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(4px)'}}>
          <div style={{background:'#fff',borderRadius:12,width:'100%',maxWidth:420,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
            <div style={{background:'linear-gradient(135deg,#0f0c29,#1e1b4b)',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>Stock Adjustment</div>
                <div style={{fontSize:11,color:'#8b9ccc',marginTop:2}}>{adjModal.name} · On Hand: <b style={{color:'#fff'}}>{adjModal.stock}</b> · Available: <b style={{color:'#fff'}}>{Math.max(0,adjModal.stock-(adjModal.committedStock||0))}</b></div>
              </div>
              <button onClick={()=>setAdjModal(null)} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:5,width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13}}>✕</button>
            </div>
            <div style={{padding:'18px 18px',overflowY:'auto',flex:1,display:'flex',flexDirection:'column',gap:14}}>
              {adjErr&&<div style={{background:'#fef2f2',border:'1px solid #fca5a5',color:'#dc2626',padding:'9px 12px',borderRadius:7,fontSize:12,fontWeight:600}}>{adjErr}</div>}
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:0.5,marginBottom:7}}>Type</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7}}>
                  {[['stock_in','↑ Stock In','#10b981','#d1fae5'],['stock_out','↓ Stock Out','#dc2626','#fee2e2'],['adjustment','↔ Set Qty','#6366f1','#ede9fe']].map(([v,l,c,bg])=>(
                    <button key={v} onClick={()=>setAdjForm(f=>({...f,type:v,reasonLabel:'',reason:''}))}
                      style={{padding:'9px 6px',borderRadius:7,border:`2px solid ${adjForm.type===v?c:'#e2e8f0'}`,background:adjForm.type===v?bg:'#fff',color:adjForm.type===v?c:'#64748b',fontSize:11,fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:0.5,marginBottom:7}}>{adjForm.type==='adjustment'?'Set Stock To':'Quantity'}</div>
                <input type="number" min="1" value={adjForm.qty} onChange={e=>setAdjForm(f=>({...f,qty:e.target.value}))} placeholder="0"
                  style={{width:'100%',padding:'12px',border:'2px solid #e2e8f0',borderRadius:8,fontSize:20,fontWeight:900,outline:'none',boxSizing:'border-box',textAlign:'center',color:'#0f172a',background:'#f9fafb'}} />
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:0.5,marginBottom:7}}>Reason</div>
                <select value={adjForm.reasonLabel} onChange={e=>setAdjForm(f=>({...f,reasonLabel:e.target.value}))}
                  style={{width:'100%',padding:'10px 12px',border:'2px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none',boxSizing:'border-box',cursor:'pointer',background:'#f9fafb',color:'#374151'}}>
                  <option value="">Select reason...</option>
                  {adjForm.type==='stock_in'?<><option>Stock received from Purchase Order</option><option>Opening stock entry</option><option>Customer return</option><option>Stock correction</option><option>Other</option></>
                  :adjForm.type==='stock_out'?<><option>Damaged goods</option><option>Lost / Theft</option><option>Expired</option><option>Sample given</option><option>Stock correction</option><option>Other</option></>
                  :<><option>Physical count correction</option><option>Audit adjustment</option><option>Other</option></>}
                </select>
                {adjForm.reasonLabel==='Other'&&<input type="text" value={adjForm.reason} onChange={e=>setAdjForm(f=>({...f,reason:e.target.value}))} placeholder="Specify reason..." style={{width:'100%',padding:'10px 12px',border:'2px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none',boxSizing:'border-box',marginTop:7,background:'#f9fafb'}} />}
              </div>
            </div>
            <div style={{padding:'12px 18px',borderTop:'1px solid #f1f5f9',display:'flex',gap:8,justifyContent:'flex-end',background:'#f8fafc'}}>
              <button onClick={()=>setAdjModal(null)} style={{padding:'9px 18px',borderRadius:7,border:'1.5px solid #e2e8f0',background:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',color:'#64748b'}}>Cancel</button>
              <button onClick={handleAdjust} disabled={adjLoad} style={{padding:'9px 20px',borderRadius:7,border:'none',background:adjLoad?'#94a3b8':'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',fontSize:12,fontWeight:800,cursor:adjLoad?'not-allowed':'pointer',boxShadow:adjLoad?'none':'0 4px 14px rgba(99,102,241,0.4)'}}>
                {adjLoad?'Saving...':'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Modal */}
      {thModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(4px)'}}>
          <div style={{background:'#fff',borderRadius:12,width:'100%',maxWidth:380,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
            <div style={{background:'linear-gradient(135deg,#0f0c29,#1e1b4b)',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>Stock Settings</div>
                <div style={{fontSize:11,color:'#8b9ccc',marginTop:2}}>{thModal.name}</div>
              </div>
              <button onClick={()=>setThModal(null)} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:5,width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13}}>✕</button>
            </div>
            <div style={{padding:'18px',display:'flex',flexDirection:'column',gap:14}}>
              {[{k:'lowStockThreshold',l:'Low Stock Alert Level',h:'Alert when stock falls below this'},
                {k:'reorderPoint',l:'Reorder Point',h:'Minimum before reorder needed'},
                {k:'reorderQuantity',l:'Reorder Quantity',h:'Suggested reorder amount'},
              ].map(f=>(
                <div key={f.k}>
                  <div style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{f.l}</div>
                  <input type="number" min="0" value={thForm[f.k]} onChange={e=>setThForm(p=>({...p,[f.k]:e.target.value}))}
                    style={{width:'100%',padding:'10px 12px',border:'2px solid #e2e8f0',borderRadius:8,fontSize:14,fontWeight:700,outline:'none',boxSizing:'border-box',background:'#f9fafb'}} />
                  <div style={{fontSize:10,color:'#94a3b8',marginTop:3}}>{f.h}</div>
                </div>
              ))}
            </div>
            <div style={{padding:'12px 18px',borderTop:'1px solid #f1f5f9',display:'flex',gap:8,justifyContent:'flex-end',background:'#f8fafc'}}>
              <button onClick={()=>setThModal(null)} style={{padding:'9px 18px',borderRadius:7,border:'1.5px solid #e2e8f0',background:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',color:'#64748b'}}>Cancel</button>
              <button onClick={handleThSave} style={{padding:'9px 20px',borderRadius:7,border:'none',background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 14px rgba(245,158,11,0.4)'}}>Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const Spin = () => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:60}}>
    <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #e2e8f0',borderTopColor:'#6366f1',animation:'spin 0.7s linear infinite'}} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Empty = ({text}) => (
  <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>
    <div style={{fontSize:28,marginBottom:8}}>📭</div>
    <p style={{margin:0,fontSize:13,fontWeight:600}}>{text}</p>
  </div>
);

const Pager = ({data,onPage}) => {
  if(!data||data.pages<=1) return null;
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:'#f8fafc',borderTop:'1px solid #e2e8f0',borderRadius:'0 0 8px 8px'}}>
      <span style={{fontSize:11,color:'#94a3b8',fontWeight:600}}>{data.total} records</span>
      <div style={{display:'flex',gap:5,alignItems:'center'}}>
        <button onClick={()=>onPage(data.page-1)} disabled={data.page===1} style={{width:28,height:28,borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:data.page===1?.4:1}}><ChevronLeft style={{width:13}} /></button>
        <span style={{fontSize:12,fontWeight:700,color:'#0f172a',padding:'0 8px'}}>{data.page} / {data.pages}</span>
        <button onClick={()=>onPage(data.page+1)} disabled={data.page===data.pages} style={{width:28,height:28,borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:data.page===data.pages?.4:1}}><ChevronRight style={{width:13}} /></button>
      </div>
    </div>
  );
};
