import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import invoiceService from '../services/invoiceService';
import { productItemService } from '../services/productItemService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerType, setCustomerType] = useState('Lead');

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
      setFormData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerType]);

  const fetchProducts = async () => {
    try {
      const response = await productItemService.getProductItems();
      if (response && response.data && Array.isArray(response.data.products)) {
        setProducts(response.data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const endpoint = customerType === 'Lead' ? '/leads' :
                      customerType === 'Contact' ? '/contacts' : '/accounts';

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api${endpoint}?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        tax: 18,
        total: 0
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;

      const item = newItems[index];
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const itemTaxableAmount = itemSubtotal - itemDiscount;
      const itemTax = (itemTaxableAmount * item.tax) / 100;
      item.total = itemTaxableAmount + itemTax;

      return {
        ...prev,
        items: newItems
      };
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
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    formData.items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const itemTaxableAmount = itemSubtotal - itemDiscount;
      const itemTax = (itemTaxableAmount * item.tax) / 100;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;
    });

    return {
      subtotal,
      totalDiscount,
      totalTax,
      totalAmount: subtotal - totalDiscount + totalTax
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const totals = calculateTotals();
      const data = {
        ...formData,
        ...totals
      };

      if (isEdit) {
        await invoiceService.updateInvoice(id, data);
        alert('Invoice updated successfully!');
      } else {
        const response = await invoiceService.createInvoice(data);
        alert('Invoice created successfully!');
        if (response.data && response.data._id) {
          navigate(`/invoices/${response.data._id}`);
          return;
        }
      }

      navigate('/invoices');
    } catch (err) {
      setError(err.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const totals = calculateTotals();

  if (loading && isEdit) {
    return (
      <DashboardLayout title={isEdit ? 'Edit Invoice' : 'New Invoice'}>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEdit ? 'Edit Invoice' : 'New Invoice'}>
      <div className="page-header">
        <div>
          <h1>🧾 {isEdit ? 'Edit Invoice' : 'Create New Invoice'}</h1>
          <p className="page-subtitle">Create invoices for customers</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/invoices')}>
          Cancel
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="crm-card" style={{ marginBottom: '20px', padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', marginTop: 0 }}>Customer Information</h3>

          {/* Customer Type Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setCustomerType('Lead')}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: customerType === 'Lead' ? '2px solid #4361ee' : '2px solid #e0e0e0',
                backgroundColor: customerType === 'Lead' ? '#e8f0fe' : 'white',
                color: customerType === 'Lead' ? '#4361ee' : '#666',
                fontWeight: customerType === 'Lead' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              Lead
            </button>
            <button
              type="button"
              onClick={() => setCustomerType('Contact')}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: customerType === 'Contact' ? '2px solid #4361ee' : '2px solid #e0e0e0',
                backgroundColor: customerType === 'Contact' ? '#e8f0fe' : 'white',
                color: customerType === 'Contact' ? '#4361ee' : '#666',
                fontWeight: customerType === 'Contact' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => setCustomerType('Account')}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: customerType === 'Account' ? '2px solid #4361ee' : '2px solid #e0e0e0',
                backgroundColor: customerType === 'Account' ? '#e8f0fe' : 'white',
                color: customerType === 'Account' ? '#4361ee' : '#666',
                fontWeight: customerType === 'Account' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              Account
            </button>
          </div>

          {/* Customer Selector */}
          <div className="crm-form-group" style={{ marginBottom: '16px' }}>
            <label className="crm-form-label">Select Customer *</label>
            <select
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="crm-form-select"
              value={formData.customer || ''}
            >
              <option value="">-- Select {customerType} --</option>
              {Array.isArray(customers) && customers.map(customer => {
                let displayName = '';
                if (customerType === 'Lead' || customerType === 'Contact') {
                  displayName = `${customer.firstName} ${customer.lastName}`;
                } else if (customerType === 'Account') {
                  displayName = customer.accountName;
                }
                return (
                  <option key={customer._id} value={customer._id}>
                    {displayName} - {customer.email}
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div className="crm-form-group">
              <label className="crm-form-label">Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                className="crm-form-input"
                readOnly
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Customer Email *</label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                required
                className="crm-form-input"
                readOnly
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Customer Phone</label>
              <input
                type="text"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                className="crm-form-input"
                readOnly
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
            <div className="crm-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="crm-form-label">Customer Address</label>
              <textarea
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleChange}
                rows="2"
                className="crm-form-textarea"
                readOnly
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '20px', padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', marginTop: 0 }}>Invoice Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div className="crm-form-group">
              <label className="crm-form-label">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="crm-form-input"
                placeholder="e.g., Website Development Invoice"
              />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Invoice Date *</label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleChange}
                required
                className="crm-form-input"
              />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Due Date *</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className="crm-form-input"
              />
            </div>
            <div className="crm-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="crm-form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="crm-form-textarea"
              />
            </div>
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary">
              + Add Item
            </button>
          </div>

          {formData.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              No items added yet. Click "Add Item" to get started.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Discount %</th>
                    <th>Tax %</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={item.product || ''}
                          onChange={(e) => selectProduct(index, e.target.value)}
                          className="crm-form-select"
                          style={{ minWidth: '150px' }}
                        >
                          <option value="">Select Product</option>
                          {Array.isArray(products) && products.map(product => (
                            <option key={product._id} value={product._id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        {!item.product && (
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => updateItem(index, 'productName', e.target.value)}
                            placeholder="Or enter custom"
                            className="crm-form-input"
                            style={{ marginTop: '4px' }}
                          />
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="crm-form-input"
                          style={{ minWidth: '150px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="1"
                          className="crm-form-input"
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          className="crm-form-input"
                          style={{ width: '100px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          className="crm-form-input"
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.tax}
                          onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                          min="0"
                          className="crm-form-input"
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {formatCurrency(item.total)}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="btn-icon"
                          title="Remove"
                        >
                          🗑️
                        </button>
                      </td>
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
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Subtotal:</strong> {formatCurrency(totals.subtotal)}
                  </div>
                  <div style={{ marginBottom: '8px', color: '#dc3545' }}>
                    <strong>Discount:</strong> - {formatCurrency(totals.totalDiscount)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Tax:</strong> + {formatCurrency(totals.totalTax)}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#198754' }}>
                    <strong>Total:</strong> {formatCurrency(totals.totalAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="crm-card" style={{ marginBottom: '20px', padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', marginTop: 0 }}>Terms & Notes</h3>
          <div className="crm-form-group" style={{ marginBottom: '16px' }}>
            <label className="crm-form-label">Terms & Conditions</label>
            <textarea
              name="terms"
              value={formData.terms}
              onChange={handleChange}
              rows="3"
              className="crm-form-textarea"
            />
          </div>
          <div className="crm-form-group">
            <label className="crm-form-label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="crm-form-textarea"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Update Invoice' : 'Create Invoice')}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default InvoiceForm;
