import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import purchaseOrderService from '../services/purchaseOrderService';
import quotationService from '../services/quotationService';
import { productItemService } from '../services/productItemService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
import '../styles/crm.css';

const PurchaseOrderForm = () => {
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
    if (isEdit) {
      fetchPurchaseOrder();
    } else if (location.state?.quotationId) {
      fetchQuotationData(location.state.quotationId);
    }
  }, [id, isEdit, location.state]);

  useEffect(() => {
    fetchCustomers();
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

  const fetchQuotations = async () => {
    try {
      const response = await quotationService.getQuotations({ status: 'accepted' });
      if (response && response.data) {
        setQuotations(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
    }
  };

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

  const handleQuotationSelect = (quotationId) => {
    if (!quotationId) {
      return;
    }
    fetchQuotationData(quotationId);
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
    } finally {
      setLoading(false);
    }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPoFile(file);
    }
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
      const formDataToSend = new FormData();

      Object.keys(formData).forEach(key => {
        if (key === 'items') {
          // Clean items - ensure product field is just ID if it's an object
          const cleanedItems = formData[key].map(item => {
            const cleanItem = { ...item };
            if (cleanItem.product && typeof cleanItem.product === 'object') {
              cleanItem.product = cleanItem.product._id || cleanItem.product.id;
            }
            return cleanItem;
          });
          formDataToSend.append(key, JSON.stringify(cleanedItems));
        } else if (key === 'customer') {
          // Handle customer - extract ID if it's an object
          const customerValue = formData[key];
          if (customerValue && typeof customerValue === 'object') {
            formDataToSend.append(key, customerValue._id || customerValue.id);
          } else if (customerValue) {
            formDataToSend.append(key, customerValue);
          }
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      formDataToSend.append('subtotal', totals.subtotal);
      formDataToSend.append('totalDiscount', totals.totalDiscount);
      formDataToSend.append('totalTax', totals.totalTax);
      formDataToSend.append('totalAmount', totals.totalAmount);

      if (poFile) {
        formDataToSend.append('poDocument', poFile);
      }

      if (isEdit) {
        await purchaseOrderService.updatePurchaseOrder(id, formDataToSend);
        alert('Purchase order updated successfully!');
      } else {
        const response = await purchaseOrderService.createPurchaseOrder(formDataToSend);
        alert('Purchase order created successfully!');
        if (response.data && response.data._id) {
          navigate(`/purchase-orders/${response.data._id}`);
          return;
        }
      }
      navigate('/purchase-orders');
    } catch (err) {
      setError(err.message || 'Failed to save purchase order');
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
      <DashboardLayout title={isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}>
      <div className="page-header">
        <div>
          <h1>📦 {isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
          <p className="page-subtitle">Create PO from customer order</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/purchase-orders')}>
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
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            PO Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="crm-form-label">Link to Quotation (Optional)</label>
              <select
                className="crm-form-select"
                onChange={(e) => handleQuotationSelect(e.target.value)}
                value={formData.quotation || ''}
                style={{ backgroundColor: '#e8f4fd', borderColor: '#4361ee' }}
              >
                <option value="">Select a quotation to auto-fill data...</option>
                {quotations.map((quot) => (
                  <option key={quot._id} value={quot._id}>
                    {quot.quotationNumber} - {quot.customerName} - ₹{quot.totalAmount?.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '12px', color: '#4361ee', marginTop: '4px', fontWeight: '500' }}>
                💡 Select a quotation to automatically fill customer details and items
              </div>
            </div>

            <div>
              <label className="crm-form-label">Customer PO Number *</label>
              <input
                type="text"
                name="customerPONumber"
                value={formData.customerPONumber}
                onChange={handleInputChange}
                className="crm-form-input"
                placeholder="Customer's PO number"
                required
              />
            </div>

            <div>
              <label className="crm-form-label">PO Document</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="crm-form-input"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Upload customer's PO document (PDF, DOC, Image)
              </div>
            </div>

            <div>
              <label className="crm-form-label">PO Date *</label>
              <input
                type="date"
                name="poDate"
                value={formData.poDate}
                onChange={handleInputChange}
                className="crm-form-input"
                required
              />
            </div>

            <div>
              <label className="crm-form-label">Delivery Date</label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                className="crm-form-input"
              />
            </div>
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
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
              <label className="crm-form-label">Address</label>
              <input
                type="text"
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleInputChange}
                className="crm-form-input"
              />
            </div>
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            PO Details
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label className="crm-form-label">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="crm-form-input"
              placeholder="Purchase Order Title"
              required
            />
          </div>

          <div>
            <label className="crm-form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="crm-form-textarea"
              rows="3"
              placeholder="Description of purchase order..."
            />
          </div>
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Items</h2>
            <button type="button" className="btn-secondary" onClick={addItem}>
              + Add Item
            </button>
          </div>

          {formData.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              No items added yet. Click "Add Item" to get started.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              {formData.items.map((item, index) => (
                <div key={index} style={{
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Item {index + 1}</h3>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeItem(index)}
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="crm-form-label">Select Product</label>
                      <select
                        className="crm-form-select"
                        onChange={(e) => selectProduct(index, e.target.value)}
                        value={item.product || ''}
                      >
                        <option value="">Select a product...</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} - {formatCurrency(product.price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="crm-form-label">Product Name *</label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                        className="crm-form-input"
                        placeholder="Product name"
                        required
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="crm-form-label">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="crm-form-textarea"
                        rows="2"
                        placeholder="Product description..."
                      />
                    </div>

                    <div>
                      <label className="crm-form-label">Quantity *</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="crm-form-input"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="crm-form-label">Unit Price *</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="crm-form-input"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="crm-form-label">Discount %</label>
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="crm-form-input"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="crm-form-label">Tax %</label>
                      <input
                        type="number"
                        value={item.tax}
                        onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                        className="crm-form-input"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#e8f0fe',
                        borderRadius: '6px',
                        textAlign: 'right'
                      }}>
                        <span style={{ fontSize: '14px', color: '#666', marginRight: '8px' }}>
                          Item Total:
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#4361ee' }}>
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {formData.items.length > 0 && (
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #4361ee'
            }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>Subtotal:</span>
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc3545' }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>Total Discount:</span>
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>-{formatCurrency(totals.totalDiscount)}</span>
                  </div>
                )}
                {totals.totalTax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>Total Tax:</span>
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>{formatCurrency(totals.totalTax)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '2px solid #dee2e6'
                }}>
                  <span style={{ fontSize: '20px', fontWeight: '700' }}>Total Amount:</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#4361ee' }}>
                    {formatCurrency(totals.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="crm-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Terms & Conditions
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label className="crm-form-label">Payment Terms</label>
            <textarea
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleInputChange}
              className="crm-form-textarea"
              rows="2"
              placeholder="Payment terms..."
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="crm-form-label">Terms & Conditions</label>
            <textarea
              name="terms"
              value={formData.terms}
              onChange={handleInputChange}
              className="crm-form-textarea"
              rows="3"
              placeholder="Terms and conditions..."
            />
          </div>

          <div>
            <label className="crm-form-label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="crm-form-textarea"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/purchase-orders')}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Purchase Order' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default PurchaseOrderForm;
