import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import invoiceService from '../services/invoiceService';
import { productItemService } from '../services/productItemService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
import templateService from '../services/templateService';
import '../styles/crm.css';

const STEPS = [
  { icon: '🧑', label: 'Customer', desc: 'Customer information' },
  { icon: '📄', label: 'Details', desc: 'Invoice details' },
  { icon: '📦', label: 'Items', desc: 'Line items & pricing' },
  { icon: '📑', label: 'Terms', desc: 'Terms & notes' },
];

const InvoiceForm = ({ embedded, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerType, setCustomerType] = useState('Lead');
  const [wizardStep, setWizardStep] = useState(0);
  const [invoiceTemplates, setInvoiceTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    title: '',
    description: '',
    items: [],
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    terms: 'Payment due within 30 days.',
    notes: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    if (isEdit) {
      fetchInvoice();
    } else {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      setFormData(prev => ({ ...prev, dueDate: dueDate.toISOString().split('T')[0] }));
      templateService.getTemplates('invoice').then(r => setInvoiceTemplates(r?.data || [])).catch(() => {});
    }
  }, [id, isEdit]);

  useEffect(() => { fetchCustomers(); }, [customerType]);

  const fetchProducts = async () => {
    try {
      const response = await productItemService.getProductItems();
      if (response?.data?.products) setProducts(response.data.products);
    } catch (err) { console.error('Failed to fetch products:', err); }
  };

  const fetchCustomers = async () => {
    try {
      const endpoint = customerType === 'Lead' ? '/leads' : customerType === 'Contact' ? '/contacts' : '/accounts';
      const response = await fetch(`${API_URL}${endpoint}?limit=1000`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      let customerList = [];
      if (data?.data) {
        if (customerType === 'Lead' && Array.isArray(data.data.leads)) customerList = data.data.leads;
        else if (customerType === 'Contact' && Array.isArray(data.data.contacts)) customerList = data.data.contacts;
        else if (customerType === 'Account' && Array.isArray(data.data.accounts)) customerList = data.data.accounts;
      }
      setCustomers(customerList);
    } catch (err) { console.error('Failed to fetch customers:', err); setCustomers([]); }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c._id === customerId);
    if (customer) {
      const customerName = customerType === 'Account' ? customer.accountName : `${customer.firstName} ${customer.lastName}`;
      setFormData(prev => ({
        ...prev,
        customer: customerId,
        customerModel: customerType,
        customerName,
        customerEmail: customer.email,
        customerPhone: customer.phone || customer.mobile || '',
        customerAddress: customer.address || customer.billingAddress || ''
      }));
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoice(id);
      const invoice = response.data;
      setFormData({
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate).toISOString().split('T')[0],
        dueDate: new Date(invoice.dueDate).toISOString().split('T')[0]
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch invoice');
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 18, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      const item = newItems[index];
      const sub = item.quantity * item.unitPrice;
      const disc = (sub * item.discount) / 100;
      const taxable = sub - disc;
      item.total = taxable + (taxable * item.tax) / 100;
      return { ...prev, items: newItems };
    });
  };

  const selectProduct = (index, productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      updateItem(index, 'productName', product.name);
      updateItem(index, 'description', product.description || '');
      updateItem(index, 'unitPrice', product.price || 0);
      updateItem(index, 'product', productId);
    }
  };

  const calculateTotals = () => {
    let subtotal = 0, totalDiscount = 0, totalTax = 0;
    formData.items.forEach(item => {
      const sub = item.quantity * item.unitPrice;
      const disc = (sub * item.discount) / 100;
      const taxable = sub - disc;
      subtotal += sub; totalDiscount += disc; totalTax += (taxable * item.tax) / 100;
    });
    return { subtotal, totalDiscount, totalTax, totalAmount: subtotal - totalDiscount + totalTax };
  };

  const handleCancel = () => { if (embedded && onClose) onClose(); else navigate('/invoices'); };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const totals = calculateTotals();
      const data = { ...formData, ...totals };
      if (isEdit) {
        await invoiceService.updateInvoice(id, data);
        alert('Invoice updated successfully!');
        navigate('/invoices');
      } else {
        const response = await invoiceService.createInvoice(data);
        if (embedded && onSuccess) {
          onSuccess(response?.data);
        } else {
          alert('Invoice created successfully!');
          if (response.data?._id) { navigate(`/invoices/${response.data._id}`); return; }
          navigate('/invoices');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save invoice');
    } finally { setLoading(false); }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
  const totals = calculateTotals();

  if (loading && isEdit) {
    if (embedded) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    return <DashboardLayout title="Edit Invoice"><div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div></DashboardLayout>;
  }

  /* ─── WIZARD (embedded mode) ─────────────────────────────────────── */
  if (embedded) {
    const ls = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' };
    const is = { width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' };
    const ta = { ...is, resize: 'vertical' };

    const renderStep = () => {
      switch (wizardStep) {
        case 0: return (
          <div style={{ display: 'grid', gap: '14px' }}>
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .invoicef-grid4,.invoicef-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .invoicef-grid2{grid-template-columns:1fr!important;}
    .invoicef-split{flex-direction:column!important;}
    .invoicef-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .invoicef-panel{width:100%!important;}
    .invoicef-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .invoicef-form-row{grid-template-columns:1fr!important;}
    .invoicef-hide{display:none!important;}
  }
  @media(max-width:480px){
    .invoicef-grid4,.invoicef-grid3,.invoicef-grid2{grid-template-columns:1fr!important;}
  }
`}</style>
            {!isEdit && invoiceTemplates.length > 0 && (
              <div style={{ padding:'10px 12px', background:'#fff1f2', borderRadius:'10px', border:'1px solid #fecdd3' }}>
                <div style={{ fontSize:'10px', fontWeight:'700', color:'#dc2626', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>⚡ Apply Template</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {invoiceTemplates.map(t => (
                    <button key={t._id} type="button"
                      onClick={() => {
                        setSelectedTemplate(t._id);
                        const dv = t.defaultValues || {};
                        const updates = {};
                        if (dv.title) updates.title = dv.title;
                        if (dv.description) updates.description = dv.description;
                        if (dv.terms) updates.terms = dv.terms;
                        if (dv.notes) updates.notes = dv.notes;
                        if (dv.dueDays) { const d = new Date(); d.setDate(d.getDate() + Number(dv.dueDays)); updates.dueDate = d.toISOString().split('T')[0]; }
                        setFormData(prev => ({ ...prev, ...updates }));
                        templateService.useTemplate(t._id).catch(() => {});
                      }}
                      style={{ padding:'5px 12px', borderRadius:'99px', border:`2px solid ${selectedTemplate===t._id ? t.color : '#e2e8f0'}`, background:selectedTemplate===t._id ? t.color+'18' : '#fff', color:selectedTemplate===t._id ? t.color : '#64748b', fontSize:'11px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                      {t.icon} {t.name} {selectedTemplate===t._id && '✓'}
                    </button>
                  ))}
                  {selectedTemplate && <button type="button" onClick={() => setSelectedTemplate(null)} style={{ padding:'5px 10px', borderRadius:'99px', border:'1px solid #fecaca', background:'#fee2e2', color:'#dc2626', fontSize:'11px', fontWeight:'600', cursor:'pointer' }}>✕ Clear</button>}
                </div>
                {selectedTemplate && (() => { const t = invoiceTemplates.find(x => x._id === selectedTemplate); const keys = Object.keys(t?.defaultValues||{}).filter(k => t.defaultValues[k]); return keys.length > 0 ? <div style={{ marginTop:'8px', display:'flex', flexWrap:'wrap', gap:'4px' }}>{keys.map(k => <span key={k} style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'99px', background:t.color+'18', color:t.color, fontWeight:'700' }}>{k}: {String(t.defaultValues[k]).substring(0,20)}</span>)}</div> : null; })()}
              </div>
            )}
            <div>
              <label style={ls}>Customer Type</label>
              <div className="resp-form-grid-3">
                {['Lead', 'Contact', 'Account'].map(t => (
                  <button key={t} type="button" onClick={() => setCustomerType(t)}
                    style={{ padding: '10px', borderRadius: '8px', border: customerType === t ? '2px solid #4361ee' : '2px solid #e0e0e0', background: customerType === t ? '#e8f0fe' : 'white', color: customerType === t ? '#4361ee' : '#666', fontWeight: customerType === t ? '600' : '400', cursor: 'pointer', fontSize: '13px' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={ls}>Select Customer</label>
              <select style={is} onChange={e => handleCustomerSelect(e.target.value)} value={formData.customer || ''}>
                <option value="">-- Select {customerType} --</option>
                {customers.map(c => {
                  const name = customerType === 'Account' ? c.accountName : `${c.firstName} ${c.lastName}`;
                  return <option key={c._id} value={c._id}>{name} - {c.email}</option>;
                })}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={ls}>Customer Name *</label>
                <input style={{ ...is, background: '#f5f5f5' }} type="text" name="customerName" value={formData.customerName} onChange={handleChange} readOnly />
              </div>
              <div>
                <label style={ls}>Customer Email *</label>
                <input style={{ ...is, background: '#f5f5f5' }} type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} readOnly />
              </div>
              <div>
                <label style={ls}>Customer Phone</label>
                <input style={{ ...is, background: '#f5f5f5' }} type="text" name="customerPhone" value={formData.customerPhone} onChange={handleChange} readOnly />
              </div>
              <div>
                <label style={ls}>Address</label>
                <input style={{ ...is, background: '#f5f5f5' }} type="text" name="customerAddress" value={formData.customerAddress} onChange={handleChange} readOnly />
              </div>
            </div>
          </div>
        );
        case 1: return (
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={ls}>Title *</label>
              <input style={is} type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Website Development Invoice" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={ls}>Invoice Date *</label>
                <input style={is} type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} />
              </div>
              <div>
                <label style={ls}>Due Date *</label>
                <input style={is} type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label style={ls}>Description</label>
              <textarea style={ta} name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Invoice description..." />
            </div>
          </div>
        );
        case 2: return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Line Items</span>
              <button type="button" onClick={addItem} style={{ padding: '6px 14px', borderRadius: '6px', background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>+ Add Item</button>
            </div>
            {formData.items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #e2e8f0' }}>
                No items yet. Click "+ Add Item" to begin.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {formData.items.map((item, i) => (
                  <div key={i} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a' }}>Item {i + 1}</span>
                      <button type="button" onClick={() => removeItem(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '4px', color: '#dc3545', cursor: 'pointer', padding: '2px 8px', fontSize: '12px' }}>Remove</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={ls}>Product</label>
                        <select style={is} value={item.product || ''} onChange={e => selectProduct(i, e.target.value)}>
                          <option value="">Select product...</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        {!item.product && (
                          <input style={{ ...is, marginTop: '6px' }} type="text" value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)} placeholder="Or enter custom name" />
                        )}
                      </div>
                      <div>
                        <label style={ls}>Description</label>
                        <input style={is} type="text" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                      </div>
                      <div>
                        <label style={ls}>Qty *</label>
                        <input style={is} type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} min="1" />
                      </div>
                      <div>
                        <label style={ls}>Unit Price *</label>
                        <input style={is} type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} min="0" step="0.01" />
                      </div>
                      <div>
                        <label style={ls}>Discount %</label>
                        <input style={is} type="number" value={item.discount} onChange={e => updateItem(i, 'discount', parseFloat(e.target.value) || 0)} min="0" max="100" />
                      </div>
                      <div>
                        <label style={ls}>Tax %</label>
                        <input style={is} type="number" value={item.tax} onChange={e => updateItem(i, 'tax', parseFloat(e.target.value) || 0)} min="0" max="100" />
                      </div>
                      <div style={{ gridColumn: 'span 2', textAlign: 'right', padding: '8px', background: '#e8f0fe', borderRadius: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Item Total: </span>
                        <strong style={{ color: '#2563eb' }}>{formatCurrency(item.total)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {formData.items.length > 0 && (
              <div style={{ marginTop: '12px', padding: '14px', background: '#eff6ff', borderRadius: '8px', border: '2px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal</span><span style={{ fontWeight: '600' }}>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.totalDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#dc3545' }}>
                  <span>Discount</span><span>-{formatCurrency(totals.totalDiscount)}</span>
                </div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Tax</span><span style={{ fontWeight: '600' }}>{formatCurrency(totals.totalTax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1.5px solid #c7d2fe' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>Total</span>
                  <span style={{ fontWeight: '700', fontSize: '18px', color: '#1e3a8a' }}>{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>
            )}
          </div>
        );
        case 3: return (
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={ls}>Terms & Conditions</label>
              <textarea style={ta} name="terms" value={formData.terms} onChange={handleChange} rows={3} placeholder="Terms and conditions..." />
            </div>
            <div>
              <label style={ls}>Notes</label>
              <textarea style={ta} name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Additional notes..." />
            </div>
          </div>
        );
        default: return null;
      }
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Dark gradient header */}
        <div style={{ background: 'linear-gradient(135deg, #172554 0%, #1e3a8a 100%)', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🧾</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>New Invoice</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>Step {wizardStep + 1} of {STEPS.length}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '7px', padding: '5px 9px', color: 'white', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: 'flex', padding: '8px 10px 0' }}>
            {STEPS.map((s, idx) => {
              const done = idx < wizardStep, active = idx === wizardStep;
              return (
                <div key={idx} onClick={() => done && setWizardStep(idx)}
                  style={{ flex: 1, textAlign: 'center', padding: '5px 2px', borderRadius: '6px 6px 0 0', cursor: done ? 'pointer' : 'default',
                    background: active ? 'rgba(59,130,246,0.22)' : done ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                    borderBottom: active ? '2px solid #3b82f6' : done ? '2px solid #10b981' : '2px solid transparent' }}>
                  <div style={{ fontSize: '12px', color: active ? '#93c5fd' : done ? '#6ee7b7' : 'rgba(255,255,255,0.25)', fontWeight: '700' }}>{done ? '✓' : s.icon}</div>
                  <div style={{ fontSize: '9px', color: active ? 'rgba(255,255,255,0.65)' : done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>{s.label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', margin: '0 10px 8px' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#3b82f6,#2563eb)', borderRadius: '99px', width: `${(wizardStep / STEPS.length) * 100}%`, transition: 'width 0.35s ease' }} />
          </div>
        </div>

        {/* Step body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
            <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{STEPS[wizardStep].icon} {STEPS[wizardStep].label}</h4>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{STEPS[wizardStep].desc}</p>
          </div>
          {error && <div className="error-message" style={{ marginBottom: '12px' }}>{error}</div>}
          {renderStep()}
        </div>

        {/* Footer */}
        <div style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button type="button" onClick={() => wizardStep > 0 ? setWizardStep(s => s - 1) : onClose()}
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            {wizardStep === 0 ? 'Cancel' : '← Back'}
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            {STEPS.map((_, idx) => (
              <div key={idx} style={{ width: idx === wizardStep ? '16px' : '5px', height: '5px', borderRadius: '99px', background: idx < wizardStep ? '#10b981' : idx === wizardStep ? '#3b82f6' : '#e2e8f0', transition: 'all 0.25s' }} />
            ))}
          </div>
          {wizardStep < STEPS.length - 1 ? (
            <button type="button" onClick={() => setWizardStep(s => s + 1)}
              style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.25)' }}>
              Next →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading}
              style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 8px rgba(59,130,246,0.25)' }}>
              {loading ? 'Saving...' : '✓ Save Invoice'}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ─── STANDALONE (non-embedded) mode ────────────────────────────── */
  const formContent = (
    <>
      {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="crm-card" style={{ marginBottom: '20px', padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', marginTop: 0 }}>Customer Information</h3>
          <div className="resp-form-grid-3" style={{marginBottom:'20px'}}>
            {['Lead', 'Contact', 'Account'].map(t => (
              <button key={t} type="button" onClick={() => setCustomerType(t)}
                style={{ padding: '12px', borderRadius: '8px', border: customerType === t ? '2px solid #4361ee' : '2px solid #e0e0e0', backgroundColor: customerType === t ? '#e8f0fe' : 'white', color: customerType === t ? '#4361ee' : '#666', fontWeight: customerType === t ? '600' : '400', cursor: 'pointer' }}>
                {t}
              </button>
            ))}
          </div>
          <div className="crm-form-group" style={{ marginBottom: '16px' }}>
            <label className="crm-form-label">Select Customer *</label>
            <select onChange={e => handleCustomerSelect(e.target.value)} className="crm-form-select" value={formData.customer || ''}>
              <option value="">-- Select {customerType} --</option>
              {customers.map(c => {
                const name = customerType === 'Account' ? c.accountName : `${c.firstName} ${c.lastName}`;
                return <option key={c._id} value={c._id}>{name} - {c.email}</option>;
              })}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="crm-form-group"><label className="crm-form-label">Customer Name *</label><input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required className="crm-form-input" readOnly style={{ backgroundColor: '#f5f5f5' }} /></div>
            <div className="crm-form-group"><label className="crm-form-label">Customer Email *</label><input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} required className="crm-form-input" readOnly style={{ backgroundColor: '#f5f5f5' }} /></div>
            <div className="crm-form-group"><label className="crm-form-label">Customer Phone</label><input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="crm-form-input" readOnly style={{ backgroundColor: '#f5f5f5' }} /></div>
            <div className="crm-form-group" style={{ gridColumn: '1 / -1' }}><label className="crm-form-label">Customer Address</label><textarea name="customerAddress" value={formData.customerAddress} onChange={handleChange} rows="2" className="crm-form-textarea" readOnly style={{ backgroundColor: '#f5f5f5' }} /></div>
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '20px', padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', marginTop: 0 }}>Invoice Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="crm-form-group"><label className="crm-form-label">Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="crm-form-input" placeholder="e.g., Website Development Invoice" /></div>
            <div className="crm-form-group"><label className="crm-form-label">Invoice Date *</label><input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} required className="crm-form-input" /></div>
            <div className="crm-form-group"><label className="crm-form-label">Due Date *</label><input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required className="crm-form-input" /></div>
            <div className="crm-form-group" style={{ gridColumn: '1 / -1' }}><label className="crm-form-label">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="crm-form-textarea" /></div>
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary">+ Add Item</button>
          </div>
          {formData.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>No items added yet. Click "Add Item" to get started.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="crm-table">
                <thead><tr><th>Product</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Discount %</th><th>Tax %</th><th>Total</th><th>Action</th></tr></thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <select value={item.product || ''} onChange={e => selectProduct(index, e.target.value)} className="crm-form-select" style={{ minWidth: '150px' }}>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        {!item.product && <input type="text" value={item.productName} onChange={e => updateItem(index, 'productName', e.target.value)} placeholder="Or enter custom" className="crm-form-input" style={{ marginTop: '4px' }} />}
                      </td>
                      <td><input type="text" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="crm-form-input" style={{ minWidth: '120px' }} /></td>
                      <td><input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} min="1" className="crm-form-input" style={{ width: '70px' }} /></td>
                      <td><input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} min="0" className="crm-form-input" style={{ width: '90px' }} /></td>
                      <td><input type="number" value={item.discount} onChange={e => updateItem(index, 'discount', parseFloat(e.target.value) || 0)} min="0" max="100" className="crm-form-input" style={{ width: '70px' }} /></td>
                      <td><input type="number" value={item.tax} onChange={e => updateItem(index, 'tax', parseFloat(e.target.value) || 0)} min="0" className="crm-form-input" style={{ width: '70px' }} /></td>
                      <td style={{ fontWeight: '600' }}>{formatCurrency(item.total)}</td>
                      <td><button type="button" onClick={() => removeItem(index)} className="btn-icon">🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {formData.items.length > 0 && (
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '40px' }}>
                <div>
                  <div style={{ marginBottom: '8px' }}><strong>Subtotal:</strong> {formatCurrency(totals.subtotal)}</div>
                  <div style={{ marginBottom: '8px', color: '#dc3545' }}><strong>Discount:</strong> - {formatCurrency(totals.totalDiscount)}</div>
                  <div style={{ marginBottom: '8px' }}><strong>Tax:</strong> + {formatCurrency(totals.totalTax)}</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#198754' }}><strong>Total:</strong> {formatCurrency(totals.totalAmount)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="crm-card" style={{ marginBottom: '20px', padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', marginTop: 0 }}>Terms & Notes</h3>
          <div className="crm-form-group" style={{ marginBottom: '16px' }}><label className="crm-form-label">Terms & Conditions</label><textarea name="terms" value={formData.terms} onChange={handleChange} rows="3" className="crm-form-textarea" /></div>
          <div className="crm-form-group"><label className="crm-form-label">Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="crm-form-textarea" /></div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Invoice' : 'Create Invoice'}</button>
        </div>
      </form>
    </>
  );

  return (
    <DashboardLayout title={isEdit ? 'Edit Invoice' : 'New Invoice'}>
      <div className="page-header">
        <div><h1>🧾 {isEdit ? 'Edit Invoice' : 'Create New Invoice'}</h1><p className="page-subtitle">Create invoices for customers</p></div>
        <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
      </div>
      {formContent}
    </DashboardLayout>
  );
};

export default InvoiceForm;
