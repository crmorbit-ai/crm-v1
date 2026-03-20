import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import quotationService from '../services/quotationService';
import { productItemService } from '../services/productItemService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
import templateService from '../services/templateService';
import '../styles/crm.css';

const STEPS = [
  { icon: '🧑', label: 'Customer', desc: 'Select customer for this quotation' },
  { icon: '📄', label: 'Details', desc: 'Title, dates and description' },
  { icon: '📦', label: 'Items', desc: 'Products and pricing' },
  { icon: '📑', label: 'Terms', desc: 'Terms, conditions and notes' },
];

const ls = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' };
const is = { width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' };
const ss = { ...is, cursor: 'pointer' };

const QuotationForm = ({ embedded, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [wizardStep, setWizardStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerType, setCustomerType] = useState('Lead');
  const [quotationTemplates, setQuotationTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '', customerEmail: '', customerPhone: '', customerAddress: '',
    title: '', description: '',
    items: [],
    quotationDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    terms: 'Payment due within 30 days. Prices are subject to change without notice.',
    notes: ''
  });

  useEffect(() => {
    fetchProducts(); fetchCustomers();
    if (isEdit) { fetchQuotation(); }
    else { const d = new Date(); d.setDate(d.getDate()+30); setFormData(p => ({ ...p, expiryDate: d.toISOString().split('T')[0] })); }
    if (!isEdit) templateService.getTemplates('quotation').then(r => setQuotationTemplates(r?.data || [])).catch(() => {});
  }, [id, isEdit]);
  useEffect(() => { fetchCustomers(); }, [customerType]);

  const fetchProducts = async () => {
    try { const r = await productItemService.getProductItems(); setProducts(r?.data?.products || []); } catch { setProducts([]); }
  };

  const fetchCustomers = async () => {
    try {
      const ep = customerType==='Lead' ? '/leads' : customerType==='Contact' ? '/contacts' : '/accounts';
      const res = await fetch(`${API_URL}${ep}?limit=1000`, { headers: getAuthHeaders() });
      const data = await res.json();
      let list = [];
      if (data?.data) { if (customerType==='Lead') list=data.data.leads||[]; else if (customerType==='Contact') list=data.data.contacts||[]; else list=data.data.accounts||[]; }
      setCustomers(list);
    } catch { setCustomers([]); }
  };

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const r = await quotationService.getQuotation(id);
      const q = r.data;
      setFormData({ ...q, quotationDate: new Date(q.quotationDate).toISOString().split('T')[0], expiryDate: new Date(q.expiryDate).toISOString().split('T')[0] });
    } catch (err) { setError(err.message||'Failed to fetch'); } finally { setLoading(false); }
  };

  const handleCustomerSelect = (cid) => {
    const c = customers.find(x => x._id===cid); if (!c) return;
    setFormData(p => ({ ...p, customer: cid, customerModel: customerType,
      customerName: customerType==='Account' ? c.accountName : `${c.firstName} ${c.lastName}`,
      customerEmail: c.email, customerPhone: c.phone||c.mobile||'', customerAddress: c.address||c.billingAddress||'' }));
  };

  const inp = (e) => { const {name,value}=e.target; setFormData(p=>({...p,[name]:value})); };

  const addItem = () => setFormData(p => ({ ...p, items: [...p.items, { productName:'', description:'', quantity:1, unitPrice:0, discount:0, tax:18, total:0 }] }));
  const removeItem = (i) => setFormData(p => ({ ...p, items: p.items.filter((_,j)=>j!==i) }));
  const updateItem = (i, f, v) => setFormData(p => {
    const items = [...p.items]; items[i][f]=v;
    const it=items[i], sub=it.quantity*it.unitPrice, disc=(sub*it.discount)/100, tax=((sub-disc)*it.tax)/100;
    items[i].total=sub-disc+tax; return {...p, items};
  });
  const selectProduct = (i, pid) => {
    const pr = products.find(p=>p._id===pid); if (!pr) return;
    updateItem(i,'productName',pr.name); updateItem(i,'description',pr.description||''); updateItem(i,'unitPrice',pr.price||0); updateItem(i,'product',pid);
  };

  const calcTotals = () => {
    let sub=0,disc=0,tax=0;
    formData.items.forEach(it => { const s=it.quantity*it.unitPrice, d=(s*it.discount)/100, t=((s-d)*it.tax)/100; sub+=s; disc+=d; tax+=t; });
    return { subtotal:sub, totalDiscount:disc, totalTax:tax, totalAmount:sub-disc+tax };
  };

  const fmtCur = (v) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0}).format(v||0);

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = { ...formData, ...calcTotals() };
      if (isEdit) { await quotationService.updateQuotation(id, data); navigate('/quotations'); }
      else {
        const res = await quotationService.createQuotation(data);
        if (embedded && onSuccess) onSuccess(res?.data);
        else navigate('/quotations');
      }
    } catch (err) { setError(err.message||'Failed to save'); } finally { setLoading(false); }
  };

  const totals = calcTotals();
  const btnSty = (active) => ({ padding:'10px 12px', borderRadius:'8px', border: active?'2px solid #4361ee':'2px solid #e0e0e0', backgroundColor: active?'#e8f0fe':'white', color: active?'#4361ee':'#666', fontWeight: active?'600':'400', cursor:'pointer', fontSize:'13px' });

  const renderStep = () => {
    switch (wizardStep) {
      case 0: return (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {/* Template selector — shown at the very start */}
          {!isEdit && quotationTemplates.length > 0 && (
            <div style={{ padding:'10px 12px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0' }}>
              <div style={{ fontSize:'10px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>⚡ Apply Template</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {quotationTemplates.map(t => (
                  <button key={t._id} type="button"
                    onClick={() => {
                      setSelectedTemplate(t._id);
                      const dv = t.defaultValues || {};
                      const updates = {};
                      if (dv.title) updates.title = dv.title;
                      if (dv.description) updates.description = dv.description;
                      if (dv.terms) updates.terms = dv.terms;
                      if (dv.notes) updates.notes = dv.notes;
                      if (dv.expiryDays) {
                        const d = new Date(); d.setDate(d.getDate() + Number(dv.expiryDays));
                        updates.expiryDate = d.toISOString().split('T')[0];
                      }
                      setFormData(prev => ({ ...prev, ...updates }));
                      templateService.useTemplate(t._id).catch(() => {});
                    }}
                    style={{ padding:'5px 12px', borderRadius:'99px', border:`2px solid ${selectedTemplate===t._id ? t.color : '#e2e8f0'}`,
                      background: selectedTemplate===t._id ? t.color+'18' : '#fff',
                      color: selectedTemplate===t._id ? t.color : '#64748b',
                      fontSize:'11px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                    {t.icon} {t.name} {selectedTemplate===t._id && '✓'}
                  </button>
                ))}
                {selectedTemplate && (
                  <button type="button" onClick={() => setSelectedTemplate(null)}
                    style={{ padding:'5px 10px', borderRadius:'99px', border:'1px solid #fecaca', background:'#fee2e2', color:'#dc2626', fontSize:'11px', fontWeight:'600', cursor:'pointer' }}>
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>
          )}
          <div>
            <label style={ls}>Customer Type</label>
            <div className="resp-form-grid-3">
              {['Lead','Contact','Account'].map(t => <button key={t} type="button" onClick={()=>setCustomerType(t)} style={btnSty(customerType===t)}>{t}</button>)}
            </div>
          </div>
          <div><label style={ls}>Select Customer</label>
            <select style={ss} onChange={e=>handleCustomerSelect(e.target.value)} value={formData.customer||''}>
              <option value="">-- Select {customerType} --</option>
              {customers.map(c => <option key={c._id} value={c._id}>{customerType==='Account'?c.accountName:`${c.firstName} ${c.lastName}`} - {c.email}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div><label style={ls}>Name *</label><input name="customerName" value={formData.customerName} readOnly style={{ ...is, background:'#f0f0f0' }} /></div>
            <div><label style={ls}>Email *</label><input name="customerEmail" value={formData.customerEmail} readOnly style={{ ...is, background:'#f0f0f0' }} /></div>
            <div><label style={ls}>Phone</label><input name="customerPhone" value={formData.customerPhone} readOnly style={{ ...is, background:'#f0f0f0' }} /></div>
            <div><label style={ls}>Address</label><input name="customerAddress" value={formData.customerAddress} readOnly style={{ ...is, background:'#f0f0f0' }} /></div>
          </div>
        </div>
      );
      case 1: return (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div><label style={ls}>Title *</label><input name="title" value={formData.title} onChange={inp} style={is} required /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div><label style={ls}>Quotation Date *</label><input name="quotationDate" type="date" value={formData.quotationDate} onChange={inp} style={is} required /></div>
            <div><label style={ls}>Expiry Date *</label><input name="expiryDate" type="date" value={formData.expiryDate} onChange={inp} style={is} required /></div>
          </div>
          <div><label style={ls}>Description</label><textarea name="description" value={formData.description} onChange={inp} rows="3" style={{ ...is, resize:'vertical' }} /></div>
        </div>
      );
      case 2: return (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <button type="button" onClick={addItem} style={{ padding:'8px 14px', background:'linear-gradient(135deg,#065f46,#10b981)', color:'#fff', border:'none', borderRadius:'8px', fontWeight:'600', cursor:'pointer', fontSize:'12px' }}>+ Add Item</button>
          {formData.items.length===0 && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:'12px', padding:'20px' }}>No items yet. Click "Add Item" to start.</p>}
          {formData.items.map((item, i) => (
            <div key={i} style={{ padding:'12px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'12px', fontWeight:'700', color:'#374151' }}>Item {i+1}</span>
                <button type="button" onClick={()=>removeItem(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444' }}>🗑️</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <div><label style={ls}>Product</label>
                  <select style={ss} value={item.product||''} onChange={e=>selectProduct(i,e.target.value)}>
                    <option value="">Select product...</option>
                    {products.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  {!item.product && <input value={item.productName} onChange={e=>updateItem(i,'productName',e.target.value)} placeholder="Or type custom name" style={{ ...is, marginTop:'6px' }} />}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px' }}>
                  <div><label style={ls}>Qty</label><input type="number" value={item.quantity} onChange={e=>updateItem(i,'quantity',parseFloat(e.target.value)||0)} min="1" style={is} /></div>
                  <div><label style={ls}>Unit Price</label><input type="number" value={item.unitPrice} onChange={e=>updateItem(i,'unitPrice',parseFloat(e.target.value)||0)} min="0" style={is} /></div>
                  <div><label style={ls}>Disc %</label><input type="number" value={item.discount} onChange={e=>updateItem(i,'discount',parseFloat(e.target.value)||0)} min="0" max="100" style={is} /></div>
                  <div><label style={ls}>Tax %</label><input type="number" value={item.tax} onChange={e=>updateItem(i,'tax',parseFloat(e.target.value)||0)} min="0" style={is} /></div>
                </div>
                <div style={{ textAlign:'right', padding:'8px', background:'#e8f0fe', borderRadius:'6px', fontWeight:'700', color:'#4361ee', fontSize:'13px' }}>Total: {fmtCur(item.total)}</div>
              </div>
            </div>
          ))}
          {formData.items.length>0 && (
            <div style={{ padding:'12px', background:'#f8fafc', borderRadius:'8px', border:'2px solid #4361ee' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}><span>Subtotal:</span><span>{fmtCur(totals.subtotal)}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', color:'#dc3545', marginBottom:'4px' }}><span>Discount:</span><span>-{fmtCur(totals.totalDiscount)}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}><span>Tax:</span><span>+{fmtCur(totals.totalTax)}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'8px', borderTop:'2px solid #e2e8f0', fontWeight:'700', fontSize:'15px', color:'#4361ee' }}><span>Total:</span><span>{fmtCur(totals.totalAmount)}</span></div>
            </div>
          )}
        </div>
      );
      case 3: return (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div><label style={ls}>Terms & Conditions</label><textarea name="terms" value={formData.terms} onChange={inp} rows="4" style={{ ...is, resize:'vertical' }} /></div>
          <div><label style={ls}>Notes</label><textarea name="notes" value={formData.notes} onChange={inp} rows="3" style={{ ...is, resize:'vertical' }} /></div>
        </div>
      );
      default: return null;
    }
  };

  if (embedded) {
    return (
      <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
        <div style={{ background:'linear-gradient(135deg, #022c22 0%, #064e3b 100%)', flexShrink:0 }}>
          <div style={{ padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>💰</div>
              <div>
                <div style={{ fontSize:'13px', fontWeight:'700', color:'white' }}>New Quotation</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.45)' }}>{selectedTemplate ? '⚡ Template Mode — Quick Create' : `Step ${wizardStep+1} of ${STEPS.length}`}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'7px', padding:'5px 9px', color:'white', cursor:'pointer', fontSize:'15px', lineHeight:1 }}>✕</button>
          </div>
          {!selectedTemplate && (
            <>
              <div style={{ display:'flex', padding:'8px 10px 0' }}>
                {STEPS.map((s,idx) => { const done=idx<wizardStep, active=idx===wizardStep; return (
                  <div key={idx} onClick={()=>done&&setWizardStep(idx)} style={{ flex:1, textAlign:'center', padding:'5px 2px', borderRadius:'6px 6px 0 0', cursor:done?'pointer':'default', background:active?'rgba(16,185,129,0.22)':done?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.04)', borderBottom:active?'2px solid #10b981':done?'2px solid #34d399':'2px solid transparent' }}>
                    <div style={{ fontSize:'12px', color:active?'#6ee7b7':done?'#6ee7b7':'rgba(255,255,255,0.25)', fontWeight:'700' }}>{done?'✓':s.icon}</div>
                    <div style={{ fontSize:'9px', color:active?'rgba(255,255,255,0.65)':done?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'1px' }}>{s.label}</div>
                  </div>
                ); })}
              </div>
              <div style={{ height:'3px', background:'rgba(255,255,255,0.08)', margin:'0 10px 8px' }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg,#10b981,#059669)', borderRadius:'99px', width:`${(wizardStep/STEPS.length)*100}%`, transition:'width 0.35s ease' }} />
              </div>
            </>
          )}
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>
          {error && <div className="error-message" style={{ marginBottom:'12px' }}>{error}</div>}
          {selectedTemplate ? (() => {
            const appliedTemplate = quotationTemplates.find(t => t._id === selectedTemplate);
            const dv = appliedTemplate?.defaultValues || {};
            const prefilledKeys = ['title','description','terms','notes'].filter(k => dv[k]);
            if (dv.expiryDays) prefilledKeys.push('expiryDate');
            const labelMap = { title:'Title', description:'Description', terms:'Terms & Conditions', notes:'Notes', expiryDate:'Expiry Date' };
            const valueMap = { ...dv, expiryDate: formData.expiryDate };
            return (
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {/* Template banner */}
                <div style={{ padding:'10px 13px', background:`${appliedTemplate?.color||'#10b981'}12`, border:`1.5px solid ${appliedTemplate?.color||'#10b981'}40`, borderRadius:'10px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ fontSize:'22px' }}>{appliedTemplate?.icon||'📄'}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'12px', fontWeight:'700', color:appliedTemplate?.color||'#10b981' }}>{appliedTemplate?.name}</div>
                    <div style={{ fontSize:'11px', color:'#64748b', marginTop:'1px' }}>{prefilledKeys.length} field{prefilledKeys.length!==1?'s':''} pre-filled automatically</div>
                  </div>
                </div>
                {/* Customer — always required */}
                <div>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Required — Select Customer</div>
                  <div className="resp-form-grid-3" style={{ marginBottom:'8px' }}>
                    {['Lead','Contact','Account'].map(t=><button key={t} type="button" onClick={()=>setCustomerType(t)} style={btnSty(customerType===t)}>{t}</button>)}
                  </div>
                  <select style={ss} onChange={e=>handleCustomerSelect(e.target.value)} value={formData.customer||''}>
                    <option value="">-- Select {customerType} --</option>
                    {customers.map(c=><option key={c._id} value={c._id}>{customerType==='Account'?c.accountName:`${c.firstName} ${c.lastName}`} - {c.email}</option>)}
                  </select>
                  {formData.customerName && <div style={{ marginTop:'6px', padding:'6px 10px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'7px', fontSize:'12px', color:'#166534', fontWeight:'600' }}>✓ {formData.customerName}</div>}
                </div>
                {/* Title if not pre-filled */}
                {!formData.title && (
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:'700', color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Required — Title</div>
                    <input name="title" value={formData.title} onChange={inp} style={is} placeholder="Quotation title..." />
                  </div>
                )}
                {/* Items — always needed */}
                <div>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Required — Add Items</div>
                  <button type="button" onClick={addItem} style={{ padding:'7px 14px', background:'linear-gradient(135deg,#065f46,#10b981)', color:'#fff', border:'none', borderRadius:'8px', fontWeight:'600', cursor:'pointer', fontSize:'12px', marginBottom:'8px' }}>+ Add Item</button>
                  {formData.items.map((item,i) => (
                    <div key={i} style={{ padding:'10px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'8px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                        <span style={{ fontSize:'11px', fontWeight:'700', color:'#374151' }}>Item {i+1}</span>
                        <button type="button" onClick={()=>removeItem(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:'13px' }}>🗑️</button>
                      </div>
                      <select style={{ ...ss, marginBottom:'6px' }} value={item.product||''} onChange={e=>selectProduct(i,e.target.value)}>
                        <option value="">Select product...</option>
                        {products.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      {!item.product && <input value={item.productName} onChange={e=>updateItem(i,'productName',e.target.value)} placeholder="Or type custom name" style={{ ...is, marginBottom:'6px' }} />}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'6px' }}>
                        <div><label style={ls}>Qty</label><input type="number" value={item.quantity} onChange={e=>updateItem(i,'quantity',parseFloat(e.target.value)||0)} min="1" style={is} /></div>
                        <div><label style={ls}>Price</label><input type="number" value={item.unitPrice} onChange={e=>updateItem(i,'unitPrice',parseFloat(e.target.value)||0)} min="0" style={is} /></div>
                        <div><label style={ls}>Disc%</label><input type="number" value={item.discount} onChange={e=>updateItem(i,'discount',parseFloat(e.target.value)||0)} min="0" max="100" style={is} /></div>
                        <div><label style={ls}>Tax%</label><input type="number" value={item.tax} onChange={e=>updateItem(i,'tax',parseFloat(e.target.value)||0)} min="0" style={is} /></div>
                      </div>
                      <div style={{ textAlign:'right', marginTop:'6px', fontSize:'12px', fontWeight:'700', color:'#4361ee' }}>Total: {fmtCur(item.total)}</div>
                    </div>
                  ))}
                </div>
                {/* Pre-filled preview */}
                {prefilledKeys.length > 0 && (
                  <div style={{ padding:'12px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0' }}>
                    <div style={{ fontSize:'10px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>📋 Pre-filled by template</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {prefilledKeys.map(key => (
                        <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'#fff', borderRadius:'7px', border:'1px solid #e2e8f0' }}>
                          <span style={{ fontSize:'11px', color:'#64748b', fontWeight:'600' }}>{labelMap[key]||key}</span>
                          <span style={{ fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'99px', background:`${appliedTemplate?.color||'#10b981'}12`, color:appliedTemplate?.color||'#10b981', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {String(valueMap[key]).substring(0,40)}{String(valueMap[key]).length>40?'…':''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })() : (
            <>
              <div style={{ marginBottom:'14px', paddingBottom:'10px', borderBottom:'1px solid #f1f5f9' }}>
                <h4 style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:'700', color:'#0f172a' }}>{STEPS[wizardStep].icon} {STEPS[wizardStep].label}</h4>
                <p style={{ margin:0, fontSize:'11px', color:'#94a3b8' }}>{STEPS[wizardStep].desc}</p>
              </div>
              {renderStep()}
            </>
          )}
        </div>
        <div style={{ padding:'11px 14px', borderTop:'1px solid #f1f5f9', background:'#fafbfc', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <button type="button"
            onClick={() => selectedTemplate ? setSelectedTemplate(null) : wizardStep>0 ? setWizardStep(s=>s-1) : onClose()}
            style={{ padding:'7px 14px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#fff', color:'#64748b', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
            {selectedTemplate ? '← Change Template' : wizardStep===0 ? 'Cancel' : '← Back'}
          </button>
          {selectedTemplate ? (
            <button type="button" onClick={handleSubmit} disabled={loading}
              style={{ padding:'8px 24px', borderRadius:'8px', border:'none', background:loading?'#94a3b8':'linear-gradient(135deg,#059669 0%,#10b981 100%)', color:'#fff', fontSize:'13px', fontWeight:'700', cursor:loading?'not-allowed':'pointer', boxShadow:loading?'none':'0 2px 8px rgba(16,185,129,0.3)' }}>
              {loading?'Saving...':'⚡ Save Quotation'}
            </button>
          ) : (
            <>
              <div style={{ display:'flex', gap:'4px' }}>
                {STEPS.map((_,idx)=><div key={idx} style={{ width:idx===wizardStep?'16px':'5px', height:'5px', borderRadius:'99px', background:idx<wizardStep?'#059669':idx===wizardStep?'#10b981':'#e2e8f0', transition:'all 0.25s' }} />)}
              </div>
              {wizardStep<STEPS.length-1 ? (
                <button type="button" onClick={()=>setWizardStep(s=>s+1)} style={{ padding:'7px 18px', borderRadius:'8px', border:'none', background:'linear-gradient(135deg,#065f46 0%,#10b981 100%)', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', boxShadow:'0 2px 8px rgba(16,185,129,0.25)' }}>Next →</button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading} style={{ padding:'7px 18px', borderRadius:'8px', border:'none', background:loading?'#94a3b8':'linear-gradient(135deg,#059669 0%,#10b981 100%)', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:loading?'not-allowed':'pointer', boxShadow:loading?'none':'0 2px 8px rgba(16,185,129,0.25)' }}>
                  {loading?'Saving...':'✓ Save Quotation'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title={isEdit?'Edit Quotation':'New Quotation'}>
      <div className="page-header">
        <div><h1>💰 {isEdit?'Edit Quotation':'Create New Quotation'}</h1><p className="page-subtitle">Create price quotations for customers</p></div>
        <button className="btn-secondary" onClick={()=>navigate('/quotations')}>Cancel</button>
      </div>
      {error && <div className="error-message" style={{ marginBottom:'20px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="crm-card" style={{ marginBottom:'20px', padding:'24px' }}>
          <h3 style={{ marginBottom:'20px', marginTop:0 }}>Customer</h3>
          <div className="resp-form-grid-3" style={{marginBottom:'16px'}}>
            {['Lead','Contact','Account'].map(t=><button key={t} type="button" onClick={()=>setCustomerType(t)} style={btnSty(customerType===t)}>{t}</button>)}
          </div>
          <select onChange={e=>handleCustomerSelect(e.target.value)} className="crm-form-select" value={formData.customer||''} style={{ marginBottom:'12px' }}>
            <option value="">-- Select {customerType} --</option>
            {customers.map(c=><option key={c._id} value={c._id}>{customerType==='Account'?c.accountName:`${c.firstName} ${c.lastName}`} - {c.email}</option>)}
          </select>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'16px' }}>
            <div><label className="crm-form-label">Name *</label><input name="customerName" value={formData.customerName} readOnly className="crm-form-input" style={{ background:'#f5f5f5' }} /></div>
            <div><label className="crm-form-label">Email *</label><input name="customerEmail" value={formData.customerEmail} readOnly className="crm-form-input" style={{ background:'#f5f5f5' }} /></div>
            <div><label className="crm-form-label">Phone</label><input name="customerPhone" value={formData.customerPhone} readOnly className="crm-form-input" style={{ background:'#f5f5f5' }} /></div>
          </div>
        </div>
        {/* Quotation Templates */}
        {!isEdit && quotationTemplates.length > 0 && (
          <div className="crm-card" style={{ marginBottom:'16px', padding:'14px 16px' }}>
            <div style={{ fontSize:'11px', fontWeight:'700', color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>
              ⚡ Quick Start — Apply Template
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {quotationTemplates.map(t => (
                <button key={t._id} type="button"
                  onClick={() => {
                    setSelectedTemplate(t._id);
                    const dv = t.defaultValues || {};
                    const updates = {};
                    if (dv.title) updates.title = dv.title;
                    if (dv.description) updates.description = dv.description;
                    if (dv.terms) updates.terms = dv.terms;
                    if (dv.notes) updates.notes = dv.notes;
                    if (dv.expiryDays) {
                      const d = new Date(); d.setDate(d.getDate() + Number(dv.expiryDays));
                      updates.expiryDate = d.toISOString().split('T')[0];
                    }
                    setFormData(prev => ({ ...prev, ...updates }));
                    templateService.useTemplate(t._id).catch(() => {});
                  }}
                  style={{ padding:'6px 14px', borderRadius:'99px', border:`2px solid ${selectedTemplate===t._id ? t.color : '#e2e8f0'}`,
                    background: selectedTemplate===t._id ? t.color+'18' : '#fff',
                    color: selectedTemplate===t._id ? t.color : '#64748b',
                    fontSize:'12px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                  {t.icon} {t.name} {selectedTemplate===t._id && '✓'}
                </button>
              ))}
              {selectedTemplate && (
                <button type="button" onClick={() => setSelectedTemplate(null)}
                  style={{ padding:'6px 12px', borderRadius:'99px', border:'1px solid #fecaca', background:'#fee2e2', color:'#dc2626', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
        )}

        <div className="crm-card" style={{ marginBottom:'20px', padding:'24px' }}>
          <h3 style={{ marginBottom:'20px', marginTop:0 }}>Details</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'16px' }}>
            <div><label className="crm-form-label">Title *</label><input name="title" value={formData.title} onChange={inp} className="crm-form-input" required /></div>
            <div><label className="crm-form-label">Quotation Date *</label><input name="quotationDate" type="date" value={formData.quotationDate} onChange={inp} className="crm-form-input" required /></div>
            <div><label className="crm-form-label">Expiry Date *</label><input name="expiryDate" type="date" value={formData.expiryDate} onChange={inp} className="crm-form-input" required /></div>
            <div style={{ gridColumn:'1/-1' }}><label className="crm-form-label">Description</label><textarea name="description" value={formData.description} onChange={inp} rows="3" className="crm-form-textarea" /></div>
          </div>
        </div>
        <div className="crm-card" style={{ marginBottom:'20px', padding:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <h3 style={{ margin:0 }}>Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary">+ Add Item</button>
          </div>
          {formData.items.map((item,i)=>(
            <div key={i} style={{ padding:'12px', background:'#f8f9fa', borderRadius:'8px', border:'1px solid #dee2e6', marginBottom:'12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontWeight:'600' }}>Item {i+1}</span>
                <button type="button" className="btn-icon" onClick={()=>removeItem(i)}>🗑️</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:'8px' }}>
                <div style={{ gridColumn:'1/-1' }}><label className="crm-form-label">Product</label>
                  <select className="crm-form-select" value={item.product||''} onChange={e=>selectProduct(i,e.target.value)}><option value="">Select...</option>{products.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select>
                  {!item.product && <input value={item.productName} onChange={e=>updateItem(i,'productName',e.target.value)} className="crm-form-input" style={{ marginTop:'4px' }} />}
                </div>
                <div><label className="crm-form-label">Qty</label><input type="number" value={item.quantity} onChange={e=>updateItem(i,'quantity',parseFloat(e.target.value)||0)} min="1" className="crm-form-input" /></div>
                <div><label className="crm-form-label">Unit Price</label><input type="number" value={item.unitPrice} onChange={e=>updateItem(i,'unitPrice',parseFloat(e.target.value)||0)} className="crm-form-input" /></div>
                <div><label className="crm-form-label">Disc %</label><input type="number" value={item.discount} onChange={e=>updateItem(i,'discount',parseFloat(e.target.value)||0)} className="crm-form-input" /></div>
                <div><label className="crm-form-label">Tax %</label><input type="number" value={item.tax} onChange={e=>updateItem(i,'tax',parseFloat(e.target.value)||0)} className="crm-form-input" /></div>
                <div style={{ display:'flex', alignItems:'flex-end' }}><span style={{ fontWeight:'700', color:'#198754' }}>{fmtCur(item.total)}</span></div>
              </div>
            </div>
          ))}
          {formData.items.length>0 && <div style={{ padding:'12px', background:'#f8f9fa', borderRadius:'8px', textAlign:'right' }}>
            <div>Subtotal: {fmtCur(totals.subtotal)}</div><div style={{ color:'#dc3545' }}>Discount: -{fmtCur(totals.totalDiscount)}</div>
            <div>Tax: +{fmtCur(totals.totalTax)}</div><div style={{ fontSize:'18px', fontWeight:'700', color:'#198754' }}>Total: {fmtCur(totals.totalAmount)}</div>
          </div>}
        </div>
        <div className="crm-card" style={{ marginBottom:'20px', padding:'24px' }}>
          <h3 style={{ marginBottom:'20px', marginTop:0 }}>Terms & Notes</h3>
          <div style={{ marginBottom:'12px' }}><label className="crm-form-label">Terms</label><textarea name="terms" value={formData.terms} onChange={inp} rows="3" className="crm-form-textarea" /></div>
          <div><label className="crm-form-label">Notes</label><textarea name="notes" value={formData.notes} onChange={inp} rows="3" className="crm-form-textarea" /></div>
        </div>
        <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
          <button type="button" onClick={()=>navigate('/quotations')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading?'Saving...':isEdit?'Update':'Create Quotation'}</button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default QuotationForm;
