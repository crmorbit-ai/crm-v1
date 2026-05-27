import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import rfiService from '../services/rfiService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
import templateService from '../services/templateService';
import '../styles/crm.css';

const STEPS = [
  { icon: '🧑', label: 'Customer', desc: 'Who is requesting information?' },
  { icon: '📋', label: 'RFI Details', desc: 'Title, priority and due date' },
  { icon: '📝', label: 'Requirements', desc: 'Specific questions and requirements' },
  { icon: '💬', label: 'Notes', desc: 'Additional internal notes' },
];

const ls = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' };
const is = { width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' };
const ss = { ...is, cursor: 'pointer' };

const RFIForm = ({ embedded, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [wizardStep, setWizardStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerType, setCustomerType] = useState('Lead');
  const [rfiTemplates, setRfiTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    customerName: '',
    customerEmail: '',
    customerSelection: '',
    title: ''
  });

  const [formData, setFormData] = useState({
    customerName: '', customerEmail: '', customerPhone: '', customerCompany: '',
    title: '', description: '', priority: 'medium', dueDate: '',
    requirements: [], notes: ''
  });

  useEffect(() => {
    fetchCustomers();
    if (isEdit) { fetchRFI(); }
    else {
      const d = new Date(); d.setDate(d.getDate() + 7);
      setFormData(p => ({ ...p, dueDate: d.toISOString().split('T')[0] }));
    }
    if (!isEdit) templateService.getTemplates('rfi').then(r => setRfiTemplates(r?.data || [])).catch(() => {});
  }, [id, isEdit]);

  useEffect(() => { fetchCustomers(); }, [customerType]);

  const fetchCustomers = async () => {
    try {
      const ep = customerType === 'Lead' ? '/leads' : customerType === 'Contact' ? '/contacts' : '/accounts';
      const res = await fetch(`${API_URL}${ep}?limit=1000`, { headers: getAuthHeaders() });
      const data = await res.json();
      let list = [];
      if (data?.data) {
        if (customerType === 'Lead') list = data.data.leads || [];
        else if (customerType === 'Contact') list = data.data.contacts || [];
        else list = data.data.accounts || [];
      }
      setCustomers(list);
    } catch { setCustomers([]); }
  };

  const handleCustomerSelect = (cid) => {
    const c = customers.find(x => x._id === cid);
    if (!c) return;
    let name = '';
    if (customerType === 'Account') name = c.companyName || c.accountName || c.name || '';
    else if (customerType === 'Lead') name = c.customerName || c.name || '';
    else name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
    setFormData(p => ({
      ...p, customer: cid, customerModel: customerType,
      customerName: name,
      customerEmail: c.email || '',
      customerPhone: c.phone || c.mobile || '',
      customerCompany: c.company || c.companyName || c.accountName || ''
    }));
  };

  const fetchRFI = async () => {
    try {
      setLoading(true);
      const res = await rfiService.getRFI(id);
      const r = res.data;
      setFormData({ ...r, dueDate: r.dueDate ? new Date(r.dueDate).toISOString().split('T')[0] : '' });
    } catch (err) { if (!err?.isPermissionDenied) setError(err.message || 'Failed to fetch'); }
    finally { setLoading(false); }
  };

  const inp = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    // Clear error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const errors = {};

    if (step === 0) {
      // Step 1: Customer validation

      // Check if customer is selected from dropdown (optional check - can be enabled if needed)
      // Uncomment below lines if SELECT CUSTOMER dropdown should be mandatory
      // if (!formData.customer) {
      //   errors.customerSelection = 'Please choose an existing contact profile to proceed';
      // }

      if (!formData.customerName || !formData.customerName.trim()) {
        errors.customerName = 'Customer Name is required';
      } else if (!/[a-zA-Z]/.test(formData.customerName.trim())) {
        errors.customerName = 'Name must contain letters, not just numbers or special characters';
      }
      if (!formData.customerEmail || !formData.customerEmail.trim()) {
        errors.customerEmail = 'A valid customer email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim())) {
        errors.customerEmail = 'Please enter a valid email format';
      }
    } else if (step === 1) {
      // Step 2: RFI Details validation
      if (!formData.title || !formData.title.trim()) {
        errors.title = 'RFI Title is a mandatory required field';
      } else if (!/[a-zA-Z]/.test(formData.title.trim())) {
        errors.title = 'Title must contain descriptive text letters';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(wizardStep)) {
      setWizardStep(s => s + 1);
    }
  };

  const addReq = () => setFormData(p => ({ ...p, requirements: [...p.requirements, { category: '', question: '', answer: '' }] }));
  const updReq = (i, f, v) => setFormData(p => ({ ...p, requirements: p.requirements.map((r, j) => j === i ? { ...r, [f]: v } : r) }));
  const delReq = (i) => setFormData(p => ({ ...p, requirements: p.requirements.filter((_, j) => j !== i) }));

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true); setError('');

    // Validate required fields before submission
    if (!formData.customerName || !formData.customerName.trim()) {
      setError('Customer Name is required');
      setLoading(false);
      return;
    }
    if (!formData.customerEmail || !formData.customerEmail.trim()) {
      setError('Customer Email is required');
      setLoading(false);
      return;
    }
    if (!formData.title || !formData.title.trim()) {
      setError('RFI Title is required');
      setLoading(false);
      return;
    }

    try {
      if (isEdit) {
        await rfiService.updateRFI(id, formData);
        alert('RFI updated successfully!');
        navigate('/rfi');
      } else {
        const res = await rfiService.createRFI(formData);
        if (embedded && onSuccess) {
          onSuccess(res.data);
        } else {
          alert('RFI created successfully!');
          navigate(res.data?._id ? `/rfi/${res.data._id}` : '/rfi');
        }
      }
    } catch (err) {
      if (!err?.isPermissionDenied) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to save RFI. Please check all required fields.';
        setError(errorMsg);
        console.error('RFI Save Error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const btnSty = (active) => ({
    padding: '10px 12px', borderRadius: '8px', border: active ? '2px solid #4361ee' : '2px solid #e0e0e0',
    backgroundColor: active ? '#e8f0fe' : 'white', color: active ? '#4361ee' : '#666',
    fontWeight: active ? '600' : '400', cursor: 'pointer', fontSize: '13px'
  });

  const renderStep = () => {
    switch (wizardStep) {
      case 0: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .rfiform-grid4,.rfiform-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .rfiform-grid2{grid-template-columns:1fr!important;}
    .rfiform-split{flex-direction:column!important;}
    .rfiform-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .rfiform-panel{width:100%!important;}
    .rfiform-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .rfiform-form-row{grid-template-columns:1fr!important;}
    .rfiform-hide{display:none!important;}
  }
  @media(max-width:480px){
    .rfiform-grid4,.rfiform-grid3,.rfiform-grid2{grid-template-columns:1fr!important;}
  }
`}</style>
          {!isEdit && rfiTemplates.length > 0 && (
            <div style={{ padding:'10px 12px', background:'#f0f9ff', borderRadius:'10px', border:'1px solid #bae6fd' }}>
              <div style={{ fontSize:'10px', fontWeight:'700', color:'#0369a1', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>⚡ Apply Template</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {rfiTemplates.map(t => (
                  <button key={t._id} type="button"
                    onClick={() => {
                      setSelectedTemplate(t._id);
                      const dv = t.defaultValues || {};
                      const updates = {};
                      if (dv.title) updates.title = dv.title;
                      if (dv.description) updates.description = dv.description;
                      if (dv.priority) updates.priority = dv.priority;
                      if (dv.notes) updates.notes = dv.notes;
                      setFormData(prev => ({ ...prev, ...updates }));
                      templateService.useTemplate(t._id).catch(() => {});
                    }}
                    style={{ padding:'5px 12px', borderRadius:'99px', border:`2px solid ${selectedTemplate===t._id ? t.color : '#e2e8f0'}`, background:selectedTemplate===t._id ? t.color+'18' : '#fff', color:selectedTemplate===t._id ? t.color : '#64748b', fontSize:'11px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                    {t.icon} {t.name} {selectedTemplate===t._id && '✓'}
                  </button>
                ))}
                {selectedTemplate && (
                  <button type="button" onClick={() => setSelectedTemplate(null)} style={{ padding:'5px 10px', borderRadius:'99px', border:'1px solid #fecaca', background:'#fee2e2', color:'#dc2626', fontSize:'11px', fontWeight:'600', cursor:'pointer' }}>✕ Clear</button>
                )}
              </div>
              {selectedTemplate && (() => {
                const t = rfiTemplates.find(x => x._id === selectedTemplate);
                const keys = Object.keys(t?.defaultValues||{}).filter(k => t.defaultValues[k]);
                return keys.length > 0 ? (
                  <div style={{ marginTop:'8px', display:'flex', flexWrap:'wrap', gap:'4px' }}>
                    {keys.map(k => <span key={k} style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'99px', background:t.color+'18', color:t.color, fontWeight:'700' }}>{k}: {String(t.defaultValues[k]).substring(0,20)}</span>)}
                  </div>
                ) : null;
              })()}
            </div>
          )}
          <div>
            <label style={ls}>Customer Type</label>
            <div className="resp-form-grid-3">
              {['Lead','Contact','Account'].map(t => <button key={t} type="button" onClick={() => setCustomerType(t)} style={btnSty(customerType===t)}>{t}</button>)}
            </div>
          </div>
          <div>
            <label style={ls}>Select Customer</label>
            <select style={ss} onChange={e => handleCustomerSelect(e.target.value)}>
              <option value="">Select {customerType}...</option>
              {customers.map(c => <option key={c._id} value={c._id}>{customerType === 'Account' ? (c.companyName || c.accountName || c.name) : customerType === 'Lead' ? (c.customerName || c.name || c.email) : `${c.firstName || ''} ${c.lastName || ''}`.trim()}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={ls}>Name *</label>
              <input name="customerName" value={formData.customerName} onChange={inp} style={{...is, border: fieldErrors.customerName ? '1px solid #EF4444' : '1.5px solid #e2e8f0'}} required />
              {fieldErrors.customerName && <div style={{ fontSize: '10px', color: '#DC2626', marginTop: '3px' }}>{fieldErrors.customerName}</div>}
            </div>
            <div>
              <label style={ls}>Email *</label>
              <input name="customerEmail" type="email" value={formData.customerEmail} onChange={inp} style={{...is, border: fieldErrors.customerEmail ? '1px solid #EF4444' : '1.5px solid #e2e8f0'}} required />
              {fieldErrors.customerEmail && <div style={{ fontSize: '10px', color: '#DC2626', marginTop: '3px' }}>{fieldErrors.customerEmail}</div>}
            </div>
            <div><label style={ls}>Phone</label><input name="customerPhone" value={formData.customerPhone} onChange={inp} style={is} /></div>
            <div><label style={ls}>Company</label><input name="customerCompany" value={formData.customerCompany} onChange={inp} style={is} /></div>
          </div>
        </div>
      );
      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={ls}>Title *</label>
            <input name="title" value={formData.title} onChange={inp} style={{...is, border: fieldErrors.title ? '1px solid #EF4444' : '1.5px solid #e2e8f0'}} placeholder="e.g., Product Information Request" required />
            {fieldErrors.title && <div style={{ fontSize: '10px', color: '#DC2626', marginTop: '3px' }}>{fieldErrors.title}</div>}
          </div>
          <div><label style={ls}>Description</label><textarea name="description" value={formData.description} onChange={inp} rows="3" style={{ ...is, resize: 'vertical' }} placeholder="Describe what information is needed..." /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={ls}>Priority</label>
              <select name="priority" value={formData.priority} onChange={inp} style={ss}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div><label style={ls}>Due Date</label><input name="dueDate" type="date" value={formData.dueDate} onChange={inp} style={is} /></div>
          </div>
        </div>
      );
      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button type="button" onClick={addReq}
            style={{ padding: '8px 14px', background: 'linear-gradient(135deg,#4338ca,#6366f1)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>
            + Add Requirement
          </button>
          {formData.requirements.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '20px' }}>No requirements yet. Click "Add Requirement" to start.</p>}
          {formData.requirements.map((req, i) => (
            <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>Requirement {i+1}</span>
                <button type="button" onClick={() => delReq(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px' }}>🗑️</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><label style={ls}>Category</label><input value={req.category} onChange={e=>updReq(i,'category',e.target.value)} style={is} placeholder="e.g., Technical, Pricing" /></div>
                <div><label style={ls}>Question *</label><textarea value={req.question} onChange={e=>updReq(i,'question',e.target.value)} rows="2" style={{ ...is, resize: 'vertical' }} required /></div>
                <div><label style={ls}>Answer</label><textarea value={req.answer} onChange={e=>updReq(i,'answer',e.target.value)} rows="2" style={{ ...is, resize: 'vertical' }} placeholder="Fill later..." /></div>
              </div>
            </div>
          ))}
        </div>
      );
      case 3: return (
        <div><label style={ls}>Notes</label><textarea name="notes" value={formData.notes} onChange={inp} rows="6" style={{ ...is, resize: 'vertical' }} placeholder="Additional internal notes..." /></div>
      );
      default: return null;
    }
  };

  if (loading && isEdit && !embedded) return <DashboardLayout title="Edit RFI"><div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div></DashboardLayout>;

  if (embedded) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Clean Simple Header */}
        <div style={{ background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', flexShrink: 0 }}>
          {/* Top bar */}
          <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '20px' }}>📋</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>New RFI</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Step {wizardStep+1} of {STEPS.length}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: 'white', cursor: 'pointer', fontSize: '16px', lineHeight: 1, fontWeight: '700' }}>✕</button>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '8px', padding: '0 14px 12px', justifyContent: 'center' }}>
            {STEPS.map((s, idx) => {
              const done = idx < wizardStep, active = idx === wizardStep;
              return (
                <div key={idx}
                  onClick={() => done && setWizardStep(idx)}
                  style={{
                    width: active ? '32px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: done || active ? 'white' : 'rgba(255,255,255,0.3)',
                    cursor: done ? 'pointer' : 'default',
                    transition: 'all 0.3s'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Step body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>{STEPS[wizardStep].icon}</span>
              {STEPS[wizardStep].label}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{STEPS[wizardStep].desc}</p>
          </div>
          {error && <div className="error-message" style={{ marginBottom: '12px' }}>{error}</div>}
          {renderStep()}
        </div>

        {/* Footer */}
        <div style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button type="button" onClick={() => wizardStep > 0 ? setWizardStep(s => s-1) : onClose()}
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            {wizardStep === 0 ? 'Cancel' : '← Back'}
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            {STEPS.map((_, idx) => (
              <div key={idx} style={{ width: idx === wizardStep ? '16px' : '5px', height: '5px', borderRadius: '99px', background: idx < wizardStep ? '#10b981' : idx === wizardStep ? '#6366f1' : '#e2e8f0', transition: 'all 0.25s' }} />
            ))}
          </div>
          {wizardStep < STEPS.length - 1 ? (
            <button type="button" onClick={handleNextStep}
              style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#4338ca 0%,#6366f1 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
              Next →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading}
              style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#4338ca 0%,#6366f1 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 8px rgba(99,102,241,0.25)' }}>
              {loading ? 'Saving...' : '✓ Save RFI'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Non-embedded (standalone page) mode
  return (
    <DashboardLayout title={isEdit ? 'Edit RFI' : 'New RFI'}>
      <div className="page-header">
        <div><h1>📋 {isEdit ? 'Edit RFI' : 'New Request for Information'}</h1><p className="page-subtitle">Gather information from customers</p></div>
        <button className="btn-secondary" onClick={() => navigate('/rfi')}>Cancel</button>
      </div>
      {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', marginTop: 0, fontSize: '18px', fontWeight: '600' }}>Customer Information</h2>
          <div className="resp-grid-2" style={{gap:'16px',marginBottom:'16px'}}>
            <div><label className="crm-form-label">Customer Type</label><select className="crm-form-select" value={customerType} onChange={e => setCustomerType(e.target.value)}><option value="Lead">Lead</option><option value="Contact">Contact</option><option value="Account">Account</option></select></div>
            <div><label className="crm-form-label">Select Customer</label><select className="crm-form-select" onChange={e => handleCustomerSelect(e.target.value)}><option value="">Select...</option>{customers.map(c => <option key={c._id} value={c._id}>{customerType === 'Account' ? (c.companyName || c.accountName || c.name) : customerType === 'Lead' ? (c.customerName || c.name || c.email) : `${c.firstName || ''} ${c.lastName || ''}`.trim()}</option>)}</select></div>
          </div>
          <div className="resp-grid-2" style={{gap:'16px'}}>
            <div><label className="crm-form-label">Name *</label><input name="customerName" value={formData.customerName} onChange={inp} className="crm-form-input" required /></div>
            <div><label className="crm-form-label">Email *</label><input type="email" name="customerEmail" value={formData.customerEmail} onChange={inp} className="crm-form-input" required /></div>
            <div><label className="crm-form-label">Phone</label><input name="customerPhone" value={formData.customerPhone} onChange={inp} className="crm-form-input" /></div>
            <div><label className="crm-form-label">Company</label><input name="customerCompany" value={formData.customerCompany} onChange={inp} className="crm-form-input" /></div>
          </div>
        </div>
        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', marginTop: 0, fontSize: '18px', fontWeight: '600' }}>RFI Details</h2>
          <div style={{ marginBottom: '16px' }}><label className="crm-form-label">Title *</label><input name="title" value={formData.title} onChange={inp} className="crm-form-input" required /></div>
          <div style={{ marginBottom: '16px' }}><label className="crm-form-label">Description</label><textarea name="description" value={formData.description} onChange={inp} className="crm-form-textarea" rows="4" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><label className="crm-form-label">Priority</label><select name="priority" value={formData.priority} onChange={inp} className="crm-form-select"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
            <div><label className="crm-form-label">Due Date</label><input type="date" name="dueDate" value={formData.dueDate} onChange={inp} className="crm-form-input" /></div>
          </div>
        </div>
        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Requirements</h2>
            <button type="button" className="btn-secondary" onClick={addReq}>+ Add Requirement</button>
          </div>
          {formData.requirements.map((req, i) => (
            <div key={i} style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: '600' }}>Requirement {i+1}</span>
                <button type="button" className="btn-icon" onClick={() => delReq(i)}>🗑️</button>
              </div>
              <div><label className="crm-form-label">Category</label><input value={req.category} onChange={e=>updReq(i,'category',e.target.value)} className="crm-form-input" style={{ marginBottom: '8px' }} /></div>
              <div><label className="crm-form-label">Question *</label><textarea value={req.question} onChange={e=>updReq(i,'question',e.target.value)} className="crm-form-textarea" rows="2" required style={{ marginBottom: '8px' }} /></div>
              <div><label className="crm-form-label">Answer</label><textarea value={req.answer} onChange={e=>updReq(i,'answer',e.target.value)} className="crm-form-textarea" rows="2" /></div>
            </div>
          ))}
        </div>
        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', marginTop: 0, fontSize: '18px', fontWeight: '600' }}>Notes</h2>
          <textarea name="notes" value={formData.notes} onChange={inp} className="crm-form-textarea" rows="4" />
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/rfi')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update RFI' : 'Create RFI'}</button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default RFIForm;
