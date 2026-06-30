import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import proposalService from '../services/proposalService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
import '../styles/crm.css';

const ProposalForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState({
    // Customer Info
    customer: '',
    customerModel: 'Account',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerCompany: '',

    // Basic Info
    title: '',
    rfpNumber: '',
    proposalDate: new Date().toISOString().split('T')[0],
    validUntil: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    })(),
    currency: 'INR',

    // Sections
    sections: [
      { title: 'Project Overview', content: '', order: 1 },
      { title: 'Scope of Work', content: '', order: 2 },
    ],

    // Milestones
    milestones: [
      { name: 'Planning & Design', duration: 1, durationUnit: 'Week', order: 1 }
    ],

    // Resources
    resources: [
      { role: 'Project Manager', count: 1, rate: 0, total: 0, order: 1 }
    ],

    // Payment Terms
    paymentTerms: [
      { milestone: 'Project Start', percentage: 30, amount: 0, order: 1 },
      { milestone: 'Milestone 1', percentage: 40, amount: 0, order: 2 },
      { milestone: 'Project Completion', percentage: 30, amount: 0, order: 3 }
    ],

    terms: 'Payment terms as specified above. All amounts are exclusive of applicable taxes.',
    notes: '',
    internalNotes: ''
  });

  useEffect(() => {
    fetchCustomers();
    if (isEdit) fetchProposal();
  }, [id]);

  const fetchCustomers = async () => {
    try {
      // Fetch from DataCenter (Customer Database)
      const response = await fetch(`${API_URL}/data-center?limit=1000`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Customer API Response:', data); // Debug log

      // DataCenter response structure: data.data.candidates
      const customerList = data?.data?.candidates || data?.data || [];
      console.log('✅ Parsed Customers:', customerList.length, 'customers found'); // Debug log

      setCustomers(customerList);
    } catch (err) {
      console.error('❌ Fetch customers error:', err);
      setCustomers([]);
    }
  };

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await proposalService.getProposal(id);
      const proposal = response.data;
      setFormData({
        ...proposal,
        proposalDate: proposal.proposalDate?.split('T')[0],
        validUntil: proposal.validUntil?.split('T')[0],
      });
    } catch (err) {
      setError(err.message || 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    const customer = customers.find(c => c._id === customerId);

    if (customer) {
      console.log('Selected Customer:', customer); // Debug log

      // DataCenter customer fields
      const customerName = customer.name || customer.customerName || '';
      const customerEmail = customer.email || '';
      const customerPhone = customer.phone || '';
      const customerAddress = customer.address || '';
      const customerCompany = customer.company || '';

      setFormData(prev => ({
        ...prev,
        customer: customerId,
        customerModel: 'DataCenterCandidate',
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        customerCompany
      }));
    }
  };

  // Section handlers
  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { title: '', content: '', order: prev.sections.length + 1 }]
    }));
  };

  const updateSection = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const removeSection = (index) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  // Milestone handlers
  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { name: '', duration: 1, durationUnit: 'Week', order: prev.milestones.length + 1 }]
    }));
  };

  const updateMilestone = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  // Resource handlers
  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { role: '', count: 1, rate: 0, total: 0, order: prev.resources.length + 1 }]
    }));
  };

  const updateResource = (index, field, value) => {
    const resources = [...formData.resources];
    resources[index] = { ...resources[index], [field]: value };

    // Auto-calculate total
    if (field === 'count' || field === 'rate') {
      resources[index].total = resources[index].count * resources[index].rate;
    }

    setFormData(prev => ({ ...prev, resources }));

    // Recalculate payment amounts
    recalculatePayments(resources);
  };

  const removeResource = (index) => {
    const resources = formData.resources.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, resources }));
    recalculatePayments(resources);
  };

  // Payment term handlers
  const updatePaymentTerm = (index, field, value) => {
    const paymentTerms = [...formData.paymentTerms];
    paymentTerms[index] = { ...paymentTerms[index], [field]: value };

    // Auto-calculate amount based on percentage
    if (field === 'percentage') {
      const subtotal = formData.resources.reduce((sum, r) => sum + (r.total || 0), 0);
      paymentTerms[index].amount = Math.round((subtotal * value) / 100);
    }

    setFormData(prev => ({ ...prev, paymentTerms }));
  };

  const recalculatePayments = (resources) => {
    const subtotal = resources.reduce((sum, r) => sum + (r.total || 0), 0);

    setFormData(prev => ({
      ...prev,
      paymentTerms: prev.paymentTerms.map(pt => ({
        ...pt,
        amount: Math.round((subtotal * pt.percentage) / 100)
      }))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const submitData = {
        ...formData,
        subtotal: formData.resources.reduce((sum, r) => sum + (r.total || 0), 0),
        totalAmount: formData.resources.reduce((sum, r) => sum + (r.total || 0), 0),
      };

      if (isEdit) {
        await proposalService.updateProposal(id, submitData);
      } else {
        await proposalService.createProposal(submitData);
      }

      navigate('/proposals');
    } catch (err) {
      setError(err.message || 'Failed to save proposal');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = formData.resources.reduce((sum, r) => sum + (r.total || 0), 0);
  const currencySymbol = formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹';

  const ls = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' };
  const is = { width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#fff', boxSizing: 'border-box' };

  if (loading && isEdit) {
    return (
      <DashboardLayout title={isEdit ? "Edit Proposal" : "New Proposal"}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEdit ? "Edit Proposal" : "New Proposal"}>
      <form onSubmit={handleSubmit}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 40px' }}>

          {/* Header Actions */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate('/proposals')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Saving...' : isEdit ? 'Update Proposal' : 'Create Proposal'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🧑</span> Customer Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={ls}>Select Customer *</label>
                <select name="customer" value={formData.customer} onChange={handleCustomerSelect} required style={{ ...is, cursor: 'pointer' }}>
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name || c.customerName || 'Unnamed Customer'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={ls}>Customer Name *</label>
                <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} required style={is} />
              </div>

              <div>
                <label style={ls}>Email *</label>
                <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} required style={is} />
              </div>

              <div>
                <label style={ls}>Phone</label>
                <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} style={is} />
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📄</span> Proposal Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={ls}>Proposal Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g., Website Development Project" style={is} />
              </div>

              <div>
                <label style={ls}>RFP/Reference Number</label>
                <input type="text" name="rfpNumber" value={formData.rfpNumber} onChange={handleInputChange} placeholder="e.g., RFP/2024/001" style={is} />
              </div>

              <div>
                <label style={ls}>Currency</label>
                <select name="currency" value={formData.currency} onChange={handleInputChange} style={{ ...is, cursor: 'pointer' }}>
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="EUR">€ EUR (Euro)</option>
                  <option value="GBP">£ GBP (British Pound)</option>
                </select>
              </div>

              <div>
                <label style={ls}>Proposal Date *</label>
                <input type="date" name="proposalDate" value={formData.proposalDate} onChange={handleInputChange} required style={is} />
              </div>

              <div>
                <label style={ls}>Valid Until *</label>
                <input type="date" name="validUntil" value={formData.validUntil} onChange={handleInputChange} required style={is} />
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📝</span> Proposal Sections
              </h3>
              <button type="button" onClick={addSection} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #10b981', background: '#f0fdf4', color: '#059669', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                + Add Section
              </button>
            </div>

            {formData.sections.map((section, index) => (
              <div key={index} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f9fafb' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Section Title (e.g., Project Overview)"
                    value={section.title}
                    onChange={(e) => updateSection(index, 'title', e.target.value)}
                    style={{ flex: 1, ...is }}
                  />
                  <button type="button" onClick={() => removeSection(index)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
                <textarea
                  placeholder="Section content..."
                  value={section.content}
                  onChange={(e) => updateSection(index, 'content', e.target.value)}
                  rows="4"
                  style={{ ...is, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            ))}
          </div>

          {/* Timeline & Milestones */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📅</span> Project Timeline
              </h3>
              <button type="button" onClick={addMilestone} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #10b981', background: '#f0fdf4', color: '#059669', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                + Add Milestone
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Milestone</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '120px' }}>Duration</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '120px' }}>Unit</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.milestones.map((milestone, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          placeholder="Milestone name"
                          value={milestone.name}
                          onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="number"
                          min="0"
                          value={milestone.duration}
                          onChange={(e) => updateMilestone(index, 'duration', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <select
                          value={milestone.durationUnit}
                          onChange={(e) => updateMilestone(index, 'durationUnit', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <option value="Day">Day</option>
                          <option value="Week">Week</option>
                          <option value="Month">Month</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button type="button" onClick={() => removeMilestone(index)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626', fontSize: '11px', cursor: 'pointer' }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Budget & Resources */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>💰</span> Budget & Resources
              </h3>
              <button type="button" onClick={addResource} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #10b981', background: '#f0fdf4', color: '#059669', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                + Add Resource
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Role/Resource</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '100px' }}>Count</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '140px' }}>Rate ({currencySymbol})</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '140px' }}>Total ({currencySymbol})</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.resources.map((resource, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          placeholder="Role name"
                          value={resource.role}
                          onChange={(e) => updateResource(index, 'role', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="number"
                          min="1"
                          value={resource.count}
                          onChange={(e) => updateResource(index, 'count', parseInt(e.target.value) || 1)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="number"
                          min="0"
                          value={resource.rate}
                          onChange={(e) => updateResource(index, 'rate', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                        {resource.total.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button type="button" onClick={() => removeResource(index)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626', fontSize: '11px', cursor: 'pointer' }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f0fdf4', fontWeight: '700' }}>
                    <td colSpan="3" style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#0f172a' }}>Total Project Cost:</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', color: '#059669' }}>{currencySymbol}{subtotal.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Terms */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💳</span> Payment Terms
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Milestone</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '120px' }}>Percentage (%)</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '140px' }}>Amount ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.paymentTerms.map((term, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          placeholder="Payment milestone"
                          value={term.milestone}
                          onChange={(e) => updatePaymentTerm(index, 'milestone', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={term.percentage}
                          onChange={(e) => updatePaymentTerm(index, 'percentage', parseFloat(e.target.value) || 0)}
                          style={{ width: '80px', padding: '6px 10px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center' }}
                        />
                        %
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                        {term.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#eff6ff', fontWeight: '700', borderTop: '2px solid #3b82f6' }}>
                    <td style={{ padding: '12px' }}>Total</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#0f172a' }}>
                      {formData.paymentTerms.reduce((sum, t) => sum + t.percentage, 0)}%
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', color: '#059669' }}>
                      {currencySymbol}{formData.paymentTerms.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms & Notes */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📝</span> Terms & Notes
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={ls}>Terms & Conditions</label>
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleInputChange}
                rows="3"
                style={{ ...is, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={ls}>Notes (Visible to customer)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Additional notes for the customer..."
                style={{ ...is, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={ls}>Internal Notes (Not visible to customer)</label>
              <textarea
                name="internalNotes"
                value={formData.internalNotes}
                onChange={handleInputChange}
                rows="2"
                placeholder="Internal notes for your reference..."
                style={{ ...is, resize: 'vertical', fontFamily: 'inherit', background: '#fffbeb', border: '1.5px dashed #fbbf24' }}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'white', padding: '16px 0', borderTop: '2px solid #e2e8f0' }}>
            <button type="button" onClick={() => navigate('/proposals')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Saving...' : isEdit ? 'Update Proposal' : 'Create Proposal'}
            </button>
          </div>

        </div>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
};

export default ProposalForm;
