import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import purchaseOrderService from '../services/purchaseOrderService';
import quotationService from '../services/quotationService';
import { productItemService } from '../services/productItemService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
import templateService from '../services/templateService';
import '../styles/crm.css';

const STEPS = [
  { icon: '📋', label: 'PO Info', desc: 'PO details & dates' },
  { icon: '🧑', label: 'Customer', desc: 'Customer information' },
  { icon: '📦', label: 'Items', desc: 'Line items & pricing' },
  { icon: '📑', label: 'Terms', desc: 'Terms & conditions' },
];

const PurchaseOrderForm = ({ embedded, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [customerType, setCustomerType] = useState('Lead');
  const [poFile, setPoFile] = useState(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [poTemplates, setPoTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [formData, setFormData] = useState({
    customerPONumber: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    title: '',
    description: '',
    items: [],
    poDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    paymentTerms: 'Payment due within 30 days.',
    terms: 'Standard terms and conditions apply.',
    notes: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchQuotations();
    if (isEdit) fetchPurchaseOrder();
    else {
      if (location.state?.quotationId) fetchQuotationData(location.state.quotationId);
      templateService.getTemplates('purchase_order').then(r => setPoTemplates(r?.data || [])).catch(() => {});
    }
  }, [id, isEdit, location.state]);

  useEffect(() => { fetchCustomers(); }, [customerType]);

  const fetchProducts = async () => {
    try {
      const response = await productItemService.getProductItems();
      if (response?.data?.products) setProducts(response.data.products);
    } catch (err) { console.error('Failed to fetch products:', err); }
  };

  const fetchQuotations = async () => {
    try {
      const response = await quotationService.getQuotations({ status: 'accepted' });
      if (response?.data) setQuotations(response.data);
    } catch (err) { console.error('Failed to fetch quotations:', err); }
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

  const handleQuotationSelect = (quotationId) => { if (quotationId) fetchQuotationData(quotationId); };

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

  const fetchQuotationData = async (quotationId) => {
    try {
      setLoading(true);
      const response = await quotationService.getQuotation(quotationId);
      const quotation = response.data;
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 30);
      setFormData({
        quotation: quotationId,
        customer: quotation.customer,
        customerModel: quotation.customerModel,
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone,
        customerAddress: quotation.customerAddress,
        title: quotation.title,
        description: quotation.description,
        items: quotation.items,
        poDate: new Date().toISOString().split('T')[0],
        deliveryDate: deliveryDate.toISOString().split('T')[0],
        paymentTerms: quotation.terms || 'Payment due within 30 days.',
        terms: 'Standard terms and conditions apply.',
        notes: quotation.notes || '',
        customerPONumber: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch quotation');
    } finally { setLoading(false); }
  };

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrderService.getPurchaseOrder(id);
      const po = response.data;
      setFormData({
        ...po,
        poDate: new Date(po.poDate).toISOString().split('T')[0],
        deliveryDate: po.deliveryDate ? new Date(po.deliveryDate).toISOString().split('T')[0] : ''
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch purchase order');
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => { const file = e.target.files[0]; if (file) setPoFile(file); };

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

  const handleCancel = () => { if (embedded && onClose) onClose(); else navigate('/purchase-orders'); };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const totals = calculateTotals();
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'items') {
          const cleanedItems = formData[key].map(item => {
            const cleanItem = { ...item };
            if (cleanItem.product && typeof cleanItem.product === 'object') cleanItem.product = cleanItem.product._id || cleanItem.product.id;
            return cleanItem;
          });
          formDataToSend.append(key, JSON.stringify(cleanedItems));
        } else if (key === 'customer') {
          const cv = formData[key];
          if (cv && typeof cv === 'object') formDataToSend.append(key, cv._id || cv.id);
          else if (cv) formDataToSend.append(key, cv);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      formDataToSend.append('subtotal', totals.subtotal);
      formDataToSend.append('totalDiscount', totals.totalDiscount);
      formDataToSend.append('totalTax', totals.totalTax);
      formDataToSend.append('totalAmount', totals.totalAmount);
      if (poFile) formDataToSend.append('poDocument', poFile);

      if (isEdit) {
        await purchaseOrderService.updatePurchaseOrder(id, formDataToSend);
        alert('Purchase order updated successfully!');
        navigate('/purchase-orders');
      } else {
        const response = await purchaseOrderService.createPurchaseOrder(formDataToSend);
        if (embedded && onSuccess) {
          onSuccess(response?.data);
        } else {
          alert('Purchase order created successfully!');
          if (response.data?._id) { navigate(`/purchase-orders/${response.data._id}`); return; }
          navigate('/purchase-orders');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save purchase order');
    } finally { setLoading(false); }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
  const totals = calculateTotals();

  if (loading && isEdit) {
    if (embedded) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    return <DashboardLayout title="Edit Purchase Order"><div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div></DashboardLayout>;
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
    .purchase-grid4,.purchase-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .purchase-grid2{grid-template-columns:1fr!important;}
    .purchase-split{flex-direction:column!important;}
    .purchase-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .purchase-panel{width:100%!important;}
    .purchase-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .purchase-form-row{grid-template-columns:1fr!important;}
    .purchase-hide{display:none!important;}
  }
  @media(max-width:480px){
    .purchase-grid4,.purchase-grid3,.purchase-grid2{grid-template-columns:1fr!important;}
  }
`}</style>
            {!isEdit && poTemplates.length > 0 && (
              <div style={{ padding:'10px 12px', background:'#faf5ff', borderRadius:'10px', border:'1px solid #e9d5ff' }}>
                <div style={{ fontSize:'10px', fontWeight:'700', color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>⚡ Apply Template</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {poTemplates.map(t => (
                    <button key={t._id} type="button"
                      onClick={() => {
                        setSelectedTemplate(t._id);
                        const dv = t.defaultValues || {};
                        const updates = {};
                        if (dv.title) updates.title = dv.title;
                        if (dv.description) updates.description = dv.description;
                        if (dv.paymentTerms) updates.paymentTerms = dv.paymentTerms;
                        if (dv.terms) updates.terms = dv.terms;
                        if (dv.notes) updates.notes = dv.notes;
                        if (dv.deliveryDays) { const d = new Date(); d.setDate(d.getDate() + Number(dv.deliveryDays)); updates.deliveryDate = d.toISOString().split('T')[0]; }
                        setFormData(prev => ({ ...prev, ...updates }));
                        templateService.useTemplate(t._id).catch(() => {});
                      }}
                      style={{ padding:'5px 12px', borderRadius:'99px', border:`2px solid ${selectedTemplate===t._id ? t.color : '#e2e8f0'}`, background:selectedTemplate===t._id ? t.color+'18' : '#fff', color:selectedTemplate===t._id ? t.color : '#64748b', fontSize:'11px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                      {t.icon} {t.name} {selectedTemplate===t._id && '✓'}
                    </button>
                  ))}
                  {selectedTemplate && <button type="button" onClick={() => setSelectedTemplate(null)} style={{ padding:'5px 10px', borderRadius:'99px', border:'1px solid #fecaca', background:'#fee2e2', color:'#dc2626', fontSize:'11px', fontWeight:'600', cursor:'pointer' }}>✕ Clear</button>}
                </div>
                {selectedTemplate && (() => { const t = poTemplates.find(x => x._id === selectedTemplate); const keys = Object.keys(t?.defaultValues||{}).filter(k => t.defaultValues[k]); return keys.length > 0 ? <div style={{ marginTop:'8px', display:'flex', flexWrap:'wrap', gap:'4px' }}>{keys.map(k => <span key={k} style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'99px', background:t.color+'18', color:t.color, fontWeight:'700' }}>{k}: {String(t.defaultValues[k]).substring(0,20)}</span>)}</div> : null; })()}
              </div>
            )}
            <div>
              <label style={ls}>Link to Quotation (Optional)</label>
              <select style={is} onChange={e => handleQuotationSelect(e.target.value)} value={formData.quotation || ''}>
                <option value="">Select a quotation to auto-fill...</option>
                {quotations.map(q => <option key={q._id} value={q._id}>{q.quotationNumber} - {q.customerName} - ₹{q.totalAmount?.toLocaleString('en-IN')}</option>)}
              </select>
              <div style={{ fontSize: '11px', color: '#4361ee', marginTop: '3px' }}>💡 Select to auto-fill customer & items</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={ls}>Customer PO Number *</label>
                <input style={is} type="text" name="customerPONumber" value={formData.customerPONumber} onChange={handleInputChange} placeholder="Customer's PO number" />
              </div>
              <div>
                <label style={ls}>PO Document</label>
                <input style={is} type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
              </div>
              <div>
                <label style={ls}>PO Date *</label>
                <input style={is} type="date" name="poDate" value={formData.poDate} onChange={handleInputChange} />
              </div>
              <div>
                <label style={ls}>Delivery Date</label>
                <input style={is} type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <label style={ls}>Title *</label>
              <input style={is} type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Purchase Order Title" />
            </div>
            <div>
              <label style={ls}>Description</label>
              <textarea style={ta} name="description" value={formData.description} onChange={handleInputChange} rows={2} placeholder="Description..." />
            </div>
          </div>
        );
        case 1: return (
          <div style={{ display: 'grid', gap: '14px' }}>
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
              <select style={is} onChange={e => handleCustomerSelect(e.target.value)} value={formData.customer?._id || formData.customer || ''}>
                <option value="">-- Select {customerType} --</option>
                {customers.map(c => <option key={c._id} value={c._id}>{customerType === 'Account' ? c.accountName : `${c.firstName} ${c.lastName}`} - {c.email}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={ls}>Customer Name *</label>
                <input style={{ ...is, background: '#f5f5f5' }} type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} readOnly />
              </div>
              <div>
                <label style={ls}>Email *</label>
                <input style={{ ...is, background: '#f5f5f5' }} type="email" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} readOnly />
              </div>
              <div>
                <label style={ls}>Phone</label>
                <input style={{ ...is, background: '#f5f5f5' }} type="text" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} readOnly />
              </div>
              <div>
                <label style={ls}>Address</label>
                <input style={{ ...is, background: '#f5f5f5' }} type="text" name="customerAddress" value={formData.customerAddress} onChange={handleInputChange} readOnly />
              </div>
            </div>
          </div>
        );
        case 2: return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Line Items</span>
              <button type="button" onClick={addItem} style={{ padding: '6px 14px', borderRadius: '6px', background: 'linear-gradient(135deg,#b45309,#f59e0b)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>+ Add Item</button>
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
                        <select style={is} onChange={e => selectProduct(i, e.target.value)} value={item.product || ''}>
                          <option value="">Select product...</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name} - {formatCurrency(p.price)}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={ls}>Product Name *</label>
                        <input style={is} type="text" value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)} placeholder="Product name" />
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
                        <strong style={{ color: '#4361ee' }}>{formatCurrency(item.total)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {formData.items.length > 0 && (
              <div style={{ marginTop: '12px', padding: '14px', background: '#f0f4ff', borderRadius: '8px', border: '2px solid #4361ee' }}>
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
                  <span style={{ fontWeight: '700', fontSize: '18px', color: '#4361ee' }}>{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>
            )}
          </div>
        );
        case 3: return (
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={ls}>Payment Terms</label>
              <textarea style={ta} name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} rows={2} placeholder="Payment terms..." />
            </div>
            <div>
              <label style={ls}>Terms & Conditions</label>
              <textarea style={ta} name="terms" value={formData.terms} onChange={handleInputChange} rows={3} placeholder="Terms and conditions..." />
            </div>
            <div>
              <label style={ls}>Notes</label>
              <textarea style={ta} name="notes" value={formData.notes} onChange={handleInputChange} rows={3} placeholder="Additional notes..." />
            </div>
          </div>
        );
        default: return null;
      }
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Dark gradient header */}
        <div style={{ background: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>📦</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>New Purchase Order</div>
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
                    background: active ? 'rgba(245,158,11,0.22)' : done ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                    borderBottom: active ? '2px solid #f59e0b' : done ? '2px solid #fcd34d' : '2px solid transparent' }}>
                  <div style={{ fontSize: '12px', color: active ? '#fde68a' : done ? '#fcd34d' : 'rgba(255,255,255,0.25)', fontWeight: '700' }}>{done ? '✓' : s.icon}</div>
                  <div style={{ fontSize: '9px', color: active ? 'rgba(255,255,255,0.65)' : done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>{s.label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', margin: '0 10px 8px' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#f59e0b,#d97706)', borderRadius: '99px', width: `${(wizardStep / STEPS.length) * 100}%`, transition: 'width 0.35s ease' }} />
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
              <div key={idx} style={{ width: idx === wizardStep ? '16px' : '5px', height: '5px', borderRadius: '99px', background: idx < wizardStep ? '#d97706' : idx === wizardStep ? '#f59e0b' : '#e2e8f0', transition: 'all 0.25s' }} />
            ))}
          </div>
          {wizardStep < STEPS.length - 1 ? (
            <button type="button" onClick={() => setWizardStep(s => s + 1)}
              style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#b45309 0%,#f59e0b 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(245,158,11,0.25)' }}>
              Next →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading}
              style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#b45309 0%,#f59e0b 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 8px rgba(245,158,11,0.25)' }}>
              {loading ? 'Saving...' : '✓ Save PO'}
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
        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>PO Information</h2>
          <div className="resp-grid-2" style={{gap:'16px',marginBottom:'16px'}}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="crm-form-label">Link to Quotation (Optional)</label>
              <select className="crm-form-select" onChange={e => handleQuotationSelect(e.target.value)} value={formData.quotation || ''} style={{ backgroundColor: '#e8f4fd', borderColor: '#4361ee' }}>
                <option value="">Select a quotation to auto-fill data...</option>
                {quotations.map(q => <option key={q._id} value={q._id}>{q.quotationNumber} - {q.customerName} - ₹{q.totalAmount?.toLocaleString('en-IN')}</option>)}
              </select>
              <div style={{ fontSize: '12px', color: '#4361ee', marginTop: '4px', fontWeight: '500' }}>💡 Select a quotation to automatically fill customer details and items</div>
            </div>
            <div>
              <label className="crm-form-label">Customer PO Number *</label>
              <input type="text" name="customerPONumber" value={formData.customerPONumber} onChange={handleInputChange} className="crm-form-input" placeholder="Customer's PO number" required />
            </div>
            <div>
              <label className="crm-form-label">PO Document</label>
              <input type="file" onChange={handleFileChange} className="crm-form-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
            </div>
            <div>
              <label className="crm-form-label">PO Date *</label>
              <input type="date" name="poDate" value={formData.poDate} onChange={handleInputChange} className="crm-form-input" required />
            </div>
            <div>
              <label className="crm-form-label">Delivery Date</label>
              <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleInputChange} className="crm-form-input" />
            </div>
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Customer Information</h2>
          <div className="resp-grid-2" style={{gap:'16px',marginBottom:'16px'}}>
            <div>
              <label className="crm-form-label">Customer Type *</label>
              <select className="crm-form-select" value={customerType} onChange={e => setCustomerType(e.target.value)} required>
                <option value="Lead">Lead</option>
                <option value="Contact">Contact</option>
                <option value="Account">Account</option>
              </select>
            </div>
            <div>
              <label className="crm-form-label">Select Customer</label>
              <select className="crm-form-select" onChange={e => handleCustomerSelect(e.target.value)}>
                <option value="">Select a customer...</option>
                {customers.map(c => <option key={c._id} value={c._id}>{customerType === 'Account' ? c.accountName : `${c.firstName} ${c.lastName}`}</option>)}
              </select>
            </div>
          </div>
          <div className="resp-grid-2" style={{gap:'16px'}}>
            <div><label className="crm-form-label">Customer Name *</label><input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className="crm-form-input" required /></div>
            <div><label className="crm-form-label">Email *</label><input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} className="crm-form-input" required /></div>
            <div><label className="crm-form-label">Phone</label><input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} className="crm-form-input" /></div>
            <div><label className="crm-form-label">Address</label><input type="text" name="customerAddress" value={formData.customerAddress} onChange={handleInputChange} className="crm-form-input" /></div>
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>PO Details</h2>
          <div style={{ marginBottom: '16px' }}><label className="crm-form-label">Title *</label><input type="text" name="title" value={formData.title} onChange={handleInputChange} className="crm-form-input" placeholder="Purchase Order Title" required /></div>
          <div><label className="crm-form-label">Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} className="crm-form-textarea" rows="3" placeholder="Description..." /></div>
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Items</h2>
            <button type="button" className="btn-secondary" onClick={addItem}>+ Add Item</button>
          </div>
          {formData.items.map((item, index) => (
            <div key={index} style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Item {index + 1}</h3>
                <button type="button" className="btn-icon" onClick={() => removeItem(index)}>🗑️</button>
              </div>
              <div className="resp-grid-2" style={{gap:'12px'}}>
                <div style={{ gridColumn: 'span 2' }}><label className="crm-form-label">Select Product</label><select className="crm-form-select" onChange={e => selectProduct(index, e.target.value)} value={item.product || ''}><option value="">Select a product...</option>{products.map(p => <option key={p._id} value={p._id}>{p.name} - {formatCurrency(p.price)}</option>)}</select></div>
                <div style={{ gridColumn: 'span 2' }}><label className="crm-form-label">Product Name *</label><input type="text" value={item.productName} onChange={e => updateItem(index, 'productName', e.target.value)} className="crm-form-input" required /></div>
                <div><label className="crm-form-label">Quantity *</label><input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} className="crm-form-input" min="1" required /></div>
                <div><label className="crm-form-label">Unit Price *</label><input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="crm-form-input" min="0" step="0.01" required /></div>
                <div><label className="crm-form-label">Discount %</label><input type="number" value={item.discount} onChange={e => updateItem(index, 'discount', parseFloat(e.target.value) || 0)} className="crm-form-input" min="0" max="100" /></div>
                <div><label className="crm-form-label">Tax %</label><input type="number" value={item.tax} onChange={e => updateItem(index, 'tax', parseFloat(e.target.value) || 0)} className="crm-form-input" min="0" max="100" /></div>
              </div>
            </div>
          ))}
          {formData.items.length > 0 && (
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '2px solid #4361ee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span style={{ fontWeight: '600' }}>{formatCurrency(totals.subtotal)}</span></div>
              {totals.totalDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc3545' }}><span>Discount:</span><span>-{formatCurrency(totals.totalDiscount)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax:</span><span style={{ fontWeight: '600' }}>{formatCurrency(totals.totalTax)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #dee2e6' }}><span style={{ fontSize: '20px', fontWeight: '700' }}>Total:</span><span style={{ fontSize: '24px', fontWeight: '700', color: '#4361ee' }}>{formatCurrency(totals.totalAmount)}</span></div>
            </div>
          )}
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Terms & Conditions</h2>
          <div style={{ marginBottom: '16px' }}><label className="crm-form-label">Payment Terms</label><textarea name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} className="crm-form-textarea" rows="2" /></div>
          <div style={{ marginBottom: '16px' }}><label className="crm-form-label">Terms & Conditions</label><textarea name="terms" value={formData.terms} onChange={handleInputChange} className="crm-form-textarea" rows="3" /></div>
          <div><label className="crm-form-label">Notes</label><textarea name="notes" value={formData.notes} onChange={handleInputChange} className="crm-form-textarea" rows="3" /></div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Purchase Order' : 'Create Purchase Order'}</button>
        </div>
      </form>
    </>
  );

  return (
    <DashboardLayout title={isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}>
      <div className="page-header">
        <div><h1>📦 {isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h1><p className="page-subtitle">Create PO from customer order</p></div>
        <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
      </div>
      {formContent}
    </DashboardLayout>
  );
};

export default PurchaseOrderForm;
