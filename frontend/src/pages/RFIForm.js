import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import rfiService from '../services/rfiService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
import '../styles/crm.css';

const RFIForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerType, setCustomerType] = useState('Lead');

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    requirements: [],
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
    if (isEdit) {
      fetchRFI();
    } else {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      setFormData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    }
  }, [id, isEdit]);

  useEffect(() => {
    fetchCustomers();
  }, [customerType]);

  const fetchCustomers = async () => {
    try {
      const endpoint = customerType === 'Lead' ? '/leads' :
                      customerType === 'Contact' ? '/contacts' : '/accounts';

      const response = await fetch(`${API_URL}${endpoint}?limit=1000`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();

      let customerList = [];
      if (data && data.data) {
        if (customerType === 'Lead' && Array.isArray(data.data.leads)) {
          customerList = data.data.leads;
        } else if (customerType === 'Contact' && Array.isArray(data.data.contacts)) {
          customerList = data.data.contacts;
        } else if (customerType === 'Account' && Array.isArray(data.data.accounts)) {
          customerList = data.data.accounts;
        }
      }

      setCustomers(customerList);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c._id === customerId);
    if (customer) {
      let customerName = '';
      if (customerType === 'Lead' || customerType === 'Contact') {
        customerName = `${customer.firstName} ${customer.lastName}`;
      } else if (customerType === 'Account') {
        customerName = customer.accountName;
      }

      setFormData(prev => ({
        ...prev,
        customer: customerId,
        customerModel: customerType,
        customerName: customerName,
        customerEmail: customer.email,
        customerPhone: customer.phone || customer.mobile || '',
        customerCompany: customer.company || customer.accountName || ''
      }));
    }
  };

  const fetchRFI = async () => {
    try {
      setLoading(true);
      const response = await rfiService.getRFI(id);
      const rfi = response.data;
      setFormData({
        ...rfi,
        dueDate: rfi.dueDate ? new Date(rfi.dueDate).toISOString().split('T')[0] : ''
      });
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.message || 'Failed to fetch RFI');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        { category: '', question: '', answer: '' }
      ]
    }));
  };

  const updateRequirement = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? { ...req, [field]: value } : req
      )
    }));
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await rfiService.updateRFI(id, formData);
        alert('RFI updated successfully!');
      } else {
        const response = await rfiService.createRFI(formData);
        alert('RFI created successfully!');
        if (response.data && response.data._id) {
          navigate(`/rfi/${response.data._id}`);
          return;
        }
      }
      navigate('/rfi');
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.message || 'Failed to save RFI');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <DashboardLayout title={isEdit ? 'Edit RFI' : 'New RFI'}>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEdit ? 'Edit RFI' : 'New RFI'}>
      <div className="page-header">
        <div>
          <h1>📋 {isEdit ? 'Edit RFI' : 'New Request for Information'}</h1>
          <p className="page-subtitle">Gather information from customers</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/rfi')}>
          Cancel
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', marginTop: 0, fontSize: '18px', fontWeight: '600' }}>
            Customer Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="crm-form-label">Customer Type *</label>
              <select
                className="crm-form-select"
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                required
              >
                <option value="Lead">Lead</option>
                <option value="Contact">Contact</option>
                <option value="Account">Account</option>
              </select>
            </div>

            <div>
              <label className="crm-form-label">Select Customer</label>
              <select
                className="crm-form-select"
                onChange={(e) => handleCustomerSelect(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customerType === 'Account'
                      ? customer.accountName
                      : `${customer.firstName} ${customer.lastName}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label className="crm-form-label">Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="crm-form-input"
                required
              />
            </div>

            <div>
              <label className="crm-form-label">Email *</label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
                className="crm-form-input"
                required
              />
            </div>

            <div>
              <label className="crm-form-label">Phone</label>
              <input
                type="text"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                className="crm-form-input"
              />
            </div>

            <div>
              <label className="crm-form-label">Company</label>
              <input
                type="text"
                name="customerCompany"
                value={formData.customerCompany}
                onChange={handleInputChange}
                className="crm-form-input"
              />
            </div>
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', marginTop: 0, fontSize: '18px', fontWeight: '600' }}>
            RFI Details
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label className="crm-form-label">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="crm-form-input"
              placeholder="e.g., Product Information Request"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="crm-form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="crm-form-textarea"
              rows="4"
              placeholder="Describe what information is being requested..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label className="crm-form-label">Priority *</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="crm-form-select"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="crm-form-label">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="crm-form-input"
              />
            </div>
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Requirements</h2>
            <button type="button" className="btn-secondary" onClick={addRequirement}>
              + Add Requirement
            </button>
          </div>

          {formData.requirements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              No requirements added yet. Click "Add Requirement" to get started.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {formData.requirements.map((req, index) => (
                <div key={index} style={{
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Requirement {index + 1}</h3>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeRequirement(index)}
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label className="crm-form-label">Category</label>
                    <input
                      type="text"
                      value={req.category}
                      onChange={(e) => updateRequirement(index, 'category', e.target.value)}
                      className="crm-form-input"
                      placeholder="e.g., Technical, Pricing, Delivery"
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label className="crm-form-label">Question *</label>
                    <textarea
                      value={req.question}
                      onChange={(e) => updateRequirement(index, 'question', e.target.value)}
                      className="crm-form-textarea"
                      rows="2"
                      placeholder="Enter your question..."
                      required
                    />
                  </div>

                  <div>
                    <label className="crm-form-label">Answer</label>
                    <textarea
                      value={req.answer}
                      onChange={(e) => updateRequirement(index, 'answer', e.target.value)}
                      className="crm-form-textarea"
                      rows="3"
                      placeholder="Customer's response (can be filled later)..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', marginTop: 0, fontSize: '18px', fontWeight: '600' }}>
            Additional Notes
          </h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="crm-form-textarea"
            rows="4"
            placeholder="Any additional notes or internal comments..."
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/rfi')}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update RFI' : 'Create RFI'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default RFIForm;
