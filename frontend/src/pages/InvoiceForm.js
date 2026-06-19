import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import invoiceService from '../services/invoiceService';
import { productItemService } from '../services/productItemService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
import templateService from '../services/templateService';
import { getGstRateFromHsn } from '../utils/hsnGstMapping';
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
  const [validationErrors, setValidationErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [wizardStep, setWizardStep] = useState(0);
  const [invoiceTemplates, setInvoiceTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [verifyingGST, setVerifyingGST] = useState(false);
  const [gstVerifyMessage, setGstVerifyMessage] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    shippingAddress: '',
    customerGstin: '',
    customerPan: '',
    customerState: '',
    customerStateCode: '',
    placeOfSupply: '',
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

  const fetchProducts = async () => {
    try {
      const response = await productItemService.getProductItems();
      if (response?.data?.products) setProducts(response.data.products);
    } catch (err) { console.error('Failed to fetch products:', err); }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/data-center?limit=1000`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      const customerList = data?.data?.candidates || data?.data || [];
      setCustomers(customerList);
    } catch (err) { console.error('Failed to fetch customers:', err); setCustomers([]); }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c._id === customerId);
    if (customer) {
      // DataCenter customer - flexible fields (customerName is the main field)
      const customerName = customer.customerName || customer.name || customer.fullName || customer.firstName || '';
      const address = customer.address || customer.billingAddress || '';
      const gstin = customer.gstin || customer.gstNumber || '';
      const pan = customer.pan || customer.panNumber || (gstin && gstin.length === 15 ? gstin.substring(2, 12) : '');
      const state = customer.state || customer.billingState || '';

      setFormData(prev => ({
        ...prev,
        customer: customerId,
        customerModel: 'DataCenterCandidate',
        customerName,
        customerEmail: customer.email || '',
        customerPhone: customer.phone || customer.mobile || customer.contactNumber || '',
        customerAddress: address,
        customerGstin: gstin,
        customerPan: pan,
        customerState: state,
        customerStateCode: customer.stateCode || ''
      }));
      // Clear validation errors when customer is selected
      setValidationErrors(prev => ({
        ...prev,
        customer: '',
        customerName: '',
        customerEmail: ''
      }));
    }
  };

  const handleVerifyGSTIN = async () => {
    const gstin = formData.customerGstin?.trim().toUpperCase();

    if (!gstin || gstin.length !== 15) {
      setGstVerifyMessage({ type: 'error', text: '⚠️ Please enter a valid 15-character GSTIN' });
      return;
    }

    try {
      setVerifyingGST(true);
      setGstVerifyMessage(null);

      const response = await fetch(`${API_URL}/verify-gstin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ gstin })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Verification failed');
      }

      const data = result.data;

      if (data.verified) {
        // ✅ Successfully verified - auto-fill customer details
        setGstVerifyMessage({
          type: 'success',
          text: `✓ Verified: ${data.legalName || 'Company found'}`
        });

        setFormData(prev => ({
          ...prev,
          customerName: data.legalName || prev.customerName,
          customerAddress: data.address || prev.customerAddress,
          customerState: data.state || prev.customerState,
          customerStateCode: data.stateCode || prev.customerStateCode,
          placeOfSupply: data.state || prev.placeOfSupply
        }));
      } else {
        // ⚠️ Format valid but couldn't fetch details
        setGstVerifyMessage({
          type: 'warning',
          text: `⚠️ ${data.message || 'Format valid but could not fetch company details'}`
        });

        // Still auto-fill state code from GSTIN
        setFormData(prev => ({
          ...prev,
          customerStateCode: data.stateCode || prev.customerStateCode,
          customerState: data.state || prev.customerState,
          placeOfSupply: data.state || prev.placeOfSupply
        }));
      }

    } catch (error) {
      console.error('GST Verification Error:', error);
      setGstVerifyMessage({
        type: 'error',
        text: `❌ ${error.message || 'Verification failed'}`
      });
    } finally {
      setVerifyingGST(false);
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
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 18, hsnCode: '998314', total: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;

      // Auto-update GST rate when HSN code changes
      if (field === 'hsnCode' && value && value.length >= 4) {
        const gstRate = getGstRateFromHsn(value);
        newItems[index].tax = gstRate;
        console.log(`🔄 HSN ${value} → GST ${gstRate}%`);
      }

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

  // ✅ Validate current step before moving to next
  const validateStep = (step) => {
    const errors = {};

    // Step 0: Customer Info
    if (step === 0) {
      // Customer Name is mandatory (either from dropdown or manual entry)
      if (!formData.customerName || !formData.customerName.trim()) {
        errors.customerName = 'Customer Name is required';
      }
      // Customer Email is mandatory (either from dropdown or manual entry)
      if (!formData.customerEmail || !formData.customerEmail.trim()) {
        errors.customerEmail = 'Customer Email is required';
      } else {
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.customerEmail)) {
          errors.customerEmail = 'A valid customer email is required';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Next button click with validation
  const handleNext = () => {
    if (validateStep(wizardStep)) {
      setWizardStep(s => s + 1);
      setValidationErrors({});
    }
  };

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
              <label style={ls}>Select Customer (Optional)</label>
              <select style={is} onChange={e => handleCustomerSelect(e.target.value)} value={formData.customer || ''}>
                <option value="">-- Select Customer from Master Database --</option>
                {customers.map(c => {
                  const name = c.customerName || c.name || c.fullName || c.firstName || c.email || 'Customer';
                  const displayText = c.email ? `${name} - ${c.email}` : name;
                  return <option key={c._id} value={c._id}>{displayText}</option>;
                })}
              </select>
              <div style={{fontSize:'10px',color:'#64748b',marginTop:'3px'}}>💡 Select customer from Master Database to auto-fill details including GST</div>
            </div>

            {/* TEMPORARY TEST - GST FIELD HERE */}
            <div style={{ padding: '12px', background: '#ffeb3b', border: '2px solid red' }}>
              <label style={ls}>🔥 TEST GST Field (If you see this, code is working!)</label>
              <input
                type="text"
                name="customerGstin"
                value={formData.customerGstin || ''}
                onChange={handleChange}
                placeholder="Enter GST"
                style={{ ...is, border: '2px solid red' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={ls}>Customer Name *</label>
                <input style={{ ...is, borderColor: validationErrors.customerName ? '#ef4444' : '#e2e8f0' }} type="text" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Enter customer name or select from dropdown" />
                {validationErrors.customerName && <div style={{fontSize:'11px',color:'#ef4444',marginTop:'4px'}}>{validationErrors.customerName}</div>}
              </div>
              <div>
                <label style={ls}>Customer Email *</label>
                <input style={{ ...is, borderColor: validationErrors.customerEmail ? '#ef4444' : '#e2e8f0' }} type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} placeholder="Enter customer email or select from dropdown" />
                {validationErrors.customerEmail && <div style={{fontSize:'11px',color:'#ef4444',marginTop:'4px'}}>{validationErrors.customerEmail}</div>}
              </div>
              <div>
                <label style={ls}>Customer Phone</label>
                <input style={{ ...is, background: '#f5f5f5' }} type="text" name="customerPhone" value={formData.customerPhone} onChange={handleChange} readOnly />
              </div>
            </div>

            {/* Address - Full Width */}
            <div style={{ marginTop: '12px' }}>
              <label style={ls}>Address *</label>
              <textarea
                style={{ ...is, minHeight: '80px', resize: 'vertical', background: '#ffffff', lineHeight: '1.5' }}
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleChange}
                placeholder="Enter customer full address (House/Building, Street, Area, City, State, PIN)"
                rows={3}
              />
            </div>

            {/* GST Details Section - DEBUG */}
            <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '600', color: '#334155' }}>🧾 GST Details (Optional)</h4>
              <div style={{fontSize:'10px',color:'red',marginBottom:'8px'}}>DEBUG: GST section rendering - customerGstin = "{formData.customerGstin}"</div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={ls}>Customer GSTIN <span style={{ color: '#10b981', fontSize: '11px' }}>(15 characters)</span></label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <input
                      style={{ ...is, textTransform: 'uppercase', flex: 1 }}
                      type="text"
                      name="customerGstin"
                      value={formData.customerGstin}
                      onChange={handleChange}
                      placeholder="29ABCDE1234F1Z5"
                      maxLength={15}
                    />
                    {formData.customerGstin && formData.customerGstin.length === 15 && (
                      <button
                        type="button"
                        onClick={handleVerifyGSTIN}
                        disabled={verifyingGST}
                        style={{
                          padding: '10px 16px',
                          background: verifyingGST ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: verifyingGST ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {verifyingGST ? '⏳ Verifying...' : '✓ Verify'}
                      </button>
                    )}
                  </div>
                  {gstVerifyMessage && (
                    <div style={{
                      marginTop: '6px',
                      padding: '8px 12px',
                      background: gstVerifyMessage.type === 'success' ? '#d1fae5' : gstVerifyMessage.type === 'error' ? '#fee2e2' : '#fef3c7',
                      color: gstVerifyMessage.type === 'success' ? '#065f46' : gstVerifyMessage.type === 'error' ? '#991b1b' : '#92400e',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {gstVerifyMessage.text}
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={ls}>Place of Supply</label>
                    <input style={is} type="text" name="placeOfSupply" value={formData.placeOfSupply} onChange={handleChange} placeholder="e.g., Karnataka" />
                  </div>
                  <div>
                    <label style={ls}>State Code</label>
                    <input style={is} type="text" name="customerStateCode" value={formData.customerStateCode} onChange={handleChange} placeholder="e.g., 29" maxLength={2} />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address Section (Optional - if different from billing) */}
            <div style={{ marginTop: '20px', padding: '16px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>📦 Shipping Address (Optional)</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#78350f' }}>
                Leave blank if same as billing address. Fill only if shipping to a different location.
              </p>
              <div>
                <label style={ls}>Shipping Address</label>
                <textarea
                  style={{ ...is, minHeight: '60px', resize: 'vertical', background: '#ffffff' }}
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  placeholder="Enter shipping address if different from billing address"
                  rows={2}
                />
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
                        <label style={ls}>Tax % (GST)</label>
                        <input style={is} type="number" value={item.tax} onChange={e => updateItem(i, 'tax', parseFloat(e.target.value) || 0)} min="0" max="100" />
                      </div>
                      <div>
                        <label style={ls}>HSN/SAC Code <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '500' }}>✨ Auto GST</span></label>
                        <input style={is} type="text" value={item.hsnCode} onChange={e => updateItem(i, 'hsnCode', e.target.value.toUpperCase())} placeholder="998314" maxLength={8} />
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
            <button type="button" onClick={handleNext}
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
        {/* Compact Card Header - Teal Gradient */}
        <div className="crm-card" style={{
          marginBottom: '18px',
          padding: '0',
          background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(13, 148, 136, 0.12)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>🧑</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>Customer Information</h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', opacity: 0.85 }}>Select or enter customer details for invoice</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details Card */}
        <div className="crm-card" style={{
          marginBottom: '20px',
          padding: '28px',
          background: 'white',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          borderRadius: '16px'
        }}>
          <div className="crm-form-group" style={{ marginBottom: '16px' }}>
            <label className="crm-form-label">Select Customer *</label>
            <select onChange={e => handleCustomerSelect(e.target.value)} className="crm-form-select" value={formData.customer || ''}>
              <option value="">-- Select Customer from Master Database --</option>
              {customers.map(c => {
                const name = c.customerName || c.name || c.fullName || c.firstName || c.email || 'Customer';
                const displayText = c.email ? `${name} - ${c.email}` : name;
                return <option key={c._id} value={c._id}>{displayText}</option>;
              })}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="crm-form-group"><label className="crm-form-label">Customer Name *</label><input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required className="crm-form-input" placeholder="Customer name" /></div>
            <div className="crm-form-group"><label className="crm-form-label">Customer Email *</label><input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} required className="crm-form-input" placeholder="customer@email.com" /></div>
            <div className="crm-form-group"><label className="crm-form-label">Customer Phone</label><input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="crm-form-input" placeholder="Phone number" /></div>
            <div className="crm-form-group" style={{ gridColumn: '1 / -1' }}><label className="crm-form-label">Billing Address</label><textarea name="customerAddress" value={formData.customerAddress} onChange={handleChange} rows="2" className="crm-form-textarea" placeholder="Enter billing address" /></div>
            <div className="crm-form-group" style={{ gridColumn: '1 / -1' }}><label className="crm-form-label">Shipping Address (if different)</label><textarea name="shippingAddress" value={formData.shippingAddress || ''} onChange={handleChange} rows="2" className="crm-form-textarea" placeholder="Enter shipping address (optional - leave blank if same as billing)" /></div>
          </div>

          {/* Premium GST Details Section */}
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '12px',
            border: '1px solid #bae6fd',
            boxShadow: '0 2px 8px rgba(56, 189, 248, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
              }}>🧾</div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0c4a6e', letterSpacing: '-0.3px' }}>GST Information</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="crm-form-group">
                <label className="crm-form-label">Customer GSTIN <span style={{ color: '#10b981', fontSize: '11px' }}>(15 characters)</span></label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <input
                    type="text"
                    name="customerGstin"
                    value={formData.customerGstin || ''}
                    onChange={handleChange}
                    placeholder="29ABCDE1234F1Z5"
                    maxLength={15}
                    className="crm-form-input"
                    style={{ textTransform: 'uppercase', flex: 1 }}
                  />
                  {formData.customerGstin && formData.customerGstin.length === 15 && (
                    <button
                      type="button"
                      onClick={handleVerifyGSTIN}
                      disabled={verifyingGST}
                      style={{
                        padding: '10px 16px',
                        background: verifyingGST ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: verifyingGST ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {verifyingGST ? '⏳ Verifying...' : '✓ Verify GST'}
                    </button>
                  )}
                </div>
                {gstVerifyMessage && (
                  <div style={{
                    marginTop: '6px',
                    padding: '8px 12px',
                    background: gstVerifyMessage.type === 'success' ? '#d1fae5' : gstVerifyMessage.type === 'error' ? '#fee2e2' : '#fef3c7',
                    color: gstVerifyMessage.type === 'success' ? '#065f46' : gstVerifyMessage.type === 'error' ? '#991b1b' : '#92400e',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {gstVerifyMessage.text}
                  </div>
                )}
              </div>
              <div className="crm-form-group">
                <label className="crm-form-label">PAN Number <span style={{ color: '#64748b', fontSize: '11px' }}>(Auto-filled from GST)</span></label>
                <input
                  type="text"
                  name="customerPan"
                  value={formData.customerPan || ''}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="crm-form-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="crm-form-group">
                <label className="crm-form-label">Place of Supply</label>
                <input type="text" name="placeOfSupply" value={formData.placeOfSupply || ''} onChange={handleChange} placeholder="e.g., Karnataka" className="crm-form-input" />
              </div>
              <div className="crm-form-group">
                <label className="crm-form-label">State Code</label>
                <input type="text" name="customerStateCode" value={formData.customerStateCode || ''} onChange={handleChange} placeholder="e.g., 29" maxLength={2} className="crm-form-input" />
              </div>
            </div>
          </div>
        </div>

        {/* Compact Invoice Details - Indigo Gradient */}
        <div className="crm-card" style={{
          marginBottom: '18px',
          padding: '0',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(79, 70, 229, 0.12)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>📄</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>Invoice Details</h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', opacity: 0.85 }}>Configure invoice title, dates and description</p>
              </div>
            </div>
          </div>
        </div>

        <div className="crm-card" style={{
          marginBottom: '20px',
          padding: '28px',
          background: 'white',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          borderRadius: '16px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="crm-form-group"><label className="crm-form-label">Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="crm-form-input" placeholder="e.g., Website Development Invoice" /></div>
            <div className="crm-form-group"><label className="crm-form-label">Invoice Date *</label><input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} required className="crm-form-input" /></div>
            <div className="crm-form-group"><label className="crm-form-label">Due Date *</label><input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required className="crm-form-input" /></div>
            <div className="crm-form-group" style={{ gridColumn: '1 / -1' }}><label className="crm-form-label">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="crm-form-textarea" /></div>
          </div>
        </div>

        {/* Compact Items - Orange Gradient */}
        <div className="crm-card" style={{
          marginBottom: '18px',
          padding: '0',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.12)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>📦</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>Line Items</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', opacity: 0.85 }}>Add products and services to this invoice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addItem}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#d97706',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>+</span> Add Item
              </button>
            </div>
          </div>
        </div>

        <div className="crm-card" style={{
          marginBottom: '20px',
          padding: '28px',
          background: 'white',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          borderRadius: '16px'
        }}>
          {formData.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>No items added yet. Click "Add Item" to get started.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="crm-table">
                <thead><tr><th>Product</th><th>Description</th><th>HSN/SAC</th><th>Qty</th><th>Unit Price</th><th>Disc %</th><th>GST %</th><th>Total</th><th>Action</th></tr></thead>
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
                      <td><input type="text" value={item.hsnCode} onChange={e => updateItem(index, 'hsnCode', e.target.value.toUpperCase())} placeholder="998314" maxLength={8} className="crm-form-input" style={{ width: '80px' }} /></td>
                      <td><input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} min="1" className="crm-form-input" style={{ width: '60px' }} /></td>
                      <td><input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} min="0" className="crm-form-input" style={{ width: '80px' }} /></td>
                      <td><input type="number" value={item.discount} onChange={e => updateItem(index, 'discount', parseFloat(e.target.value) || 0)} min="0" max="100" className="crm-form-input" style={{ width: '60px' }} /></td>
                      <td><input type="number" value={item.tax} onChange={e => updateItem(index, 'tax', parseFloat(e.target.value) || 0)} min="0" className="crm-form-input" style={{ width: '60px' }} /></td>
                      <td style={{ fontWeight: '600' }}>{formatCurrency(item.total)}</td>
                      <td><button type="button" onClick={() => removeItem(index)} className="btn-icon">🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {formData.items.length > 0 && (
            <div style={{
              marginTop: '24px',
              padding: '24px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '12px',
              border: '2px solid #fbbf24',
              boxShadow: '0 4px 16px rgba(251, 191, 36, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '10px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '600', marginBottom: '4px' }}>💰 Invoice Summary</div>
                  <div style={{ fontSize: '11px', color: '#b45309' }}>Calculated totals with tax</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', gap: '60px', alignItems: 'center' }}>
                    <span style={{ color: '#78716c', fontSize: '14px' }}>Subtotal</span>
                    <span style={{ fontWeight: '600', fontSize: '15px', color: '#292524' }}>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.totalDiscount > 0 && (
                    <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', gap: '60px', alignItems: 'center' }}>
                      <span style={{ color: '#dc2626', fontSize: '14px' }}>Discount</span>
                      <span style={{ fontWeight: '600', fontSize: '15px', color: '#dc2626' }}>- {formatCurrency(totals.totalDiscount)}</span>
                    </div>
                  )}
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', gap: '60px', alignItems: 'center' }}>
                    <span style={{ color: '#78716c', fontSize: '14px' }}>Tax (GST)</span>
                    <span style={{ fontWeight: '600', fontSize: '15px', color: '#292524' }}>+ {formatCurrency(totals.totalTax)}</span>
                  </div>
                  <div style={{
                    paddingTop: '12px',
                    borderTop: '2px solid #fbbf24',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '60px',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#78350f' }}>Grand Total</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#78350f', letterSpacing: '-0.5px' }}>{formatCurrency(totals.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Terms & Notes - Emerald Gradient */}
        <div className="crm-card" style={{
          marginBottom: '18px',
          padding: '0',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.12)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>📑</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>Terms & Notes</h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', opacity: 0.85 }}>Add payment terms and additional notes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="crm-card" style={{
          marginBottom: '20px',
          padding: '28px',
          background: 'white',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          borderRadius: '16px'
        }}>
          <div className="crm-form-group" style={{ marginBottom: '16px' }}><label className="crm-form-label">Terms & Conditions</label><textarea name="terms" value={formData.terms} onChange={handleChange} rows="3" className="crm-form-textarea" /></div>
          <div className="crm-form-group"><label className="crm-form-label">Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="crm-form-textarea" /></div>
        </div>

        {/* Premium Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'flex-end',
          padding: '24px',
          background: 'linear-gradient(to top, #f8fafc 0%, white 100%)',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.02)'
        }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: '12px 28px',
              background: 'white',
              color: '#64748b',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 32px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '700',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(102, 126, 234, 0.35)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>⏳ Saving...</>
            ) : (
              <>{isEdit ? '✓ Update Invoice' : '✓ Create Invoice'}</>
            )}
          </button>
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
