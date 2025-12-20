import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { leadService } from '../services/leadService';
import { productItemService } from '../services/productItemService';
import { productCategoryService } from '../services/productCategoryService';
import { verificationService, debounce } from '../services/verificationService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import TooltipButton from '../components/common/TooltipButton';
import DynamicField from '../components/DynamicField';
import '../styles/crm.css';
import BulkUploadForm from '../components/BulkUploadForm';

const Leads = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [emailVerification, setEmailVerification] = useState({
    status: 'pending',
    message: '',
    isValid: null
  });

  const [phoneVerification, setPhoneVerification] = useState({
    status: 'pending',
    message: '',
    isValid: null
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    leadStatus: '',
    leadSource: '',
    rating: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    qualified: 0,
    contacted: 0
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // All field definitions (standard + custom)
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  // Legacy formData for backward compatibility (product, productDetails)
  const [formData, setFormData] = useState({
    product: '',
    productDetails: {
      quantity: 1,
      requirements: '',
      estimatedBudget: '',
      priority: '',
      notes: ''
    }
  });

  const [productFormData, setProductFormData] = useState({
    name: '',
    articleNumber: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    loadLeads();
    loadProducts();
    loadCategories();
    loadCustomFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  const loadProducts = async () => {
    try {
      const response = await productItemService.getAllProducts({ isActive: 'true' }, 1, 1000);
      if (response && response.success === true && response.data) {
        setProducts(response.data.products || []);
      }
    } catch (err) {
      console.error('Load products error:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productCategoryService.getAllCategories({ isActive: 'true' }, 1, 100);
      if (response && response.success === true && response.data) {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Load categories error:', err);
    }
  };

  const loadCustomFields = async () => {
    try {
      console.log('🔍 Loading ALL field definitions for Lead...');
      const response = await fieldDefinitionService.getFieldDefinitions('Lead', false);
      console.log('📦 Field definitions response:', response);

      // Response is already unwrapped by axios interceptor
      if (response && Array.isArray(response)) {
        console.log('✅ Total fields received:', response.length);
        // Filter for active fields that should show in create form
        const createFields = response
          .filter(field => field.isActive && field.showInCreate)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        console.log('✅ Active fields for create form:', createFields.length);
        console.log('📋 Fields by section:', groupFieldsBySection(createFields));
        setFieldDefinitions(createFields);
      }
    } catch (err) {
      console.error('❌ Load field definitions error:', err);
    }
  };

  // Group fields by section
  const groupFieldsBySection = (fields) => {
    const grouped = {};
    fields.forEach(field => {
      const section = field.section || 'Additional Information';
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(field);
    });
    return grouped;
  };

  // Handle dynamic field value change
  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: null
    }));

    // Trigger verification for email and phone fields
    if (fieldName === 'email') {
      debouncedEmailVerify(value);
    } else if (fieldName === 'phone') {
      debouncedPhoneVerify(value);
    }
  };

  // Render dynamic field with special handling for email/phone
  const renderDynamicField = (field) => {
    const isEmail = field.fieldName === 'email';
    const isPhone = field.fieldName === 'phone';

    if (isEmail) {
      return (
        <div style={{ position: 'relative' }}>
          <DynamicField
            fieldDefinition={field}
            value={fieldValues[field.fieldName] || ''}
            onChange={handleFieldChange}
            error={fieldErrors[field.fieldName]}
          />
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <VerificationIcon status={emailVerification.status} message={emailVerification.message} />
          </div>
          {emailVerification.message && emailVerification.status !== 'pending' && (
            <div style={{ fontSize: '11px', marginTop: '4px', color: emailVerification.status === 'valid' ? '#10B981' : emailVerification.status === 'invalid' ? '#EF4444' : '#F59E0B' }}>
              {emailVerification.message}
            </div>
          )}
        </div>
      );
    }

    if (isPhone) {
      return (
        <div style={{ position: 'relative' }}>
          <DynamicField
            fieldDefinition={field}
            value={fieldValues[field.fieldName] || ''}
            onChange={handleFieldChange}
            error={fieldErrors[field.fieldName]}
          />
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <VerificationIcon status={phoneVerification.status} message={phoneVerification.message} />
          </div>
          {phoneVerification.message && phoneVerification.status !== 'pending' && (
            <div style={{ fontSize: '11px', marginTop: '4px', color: phoneVerification.status === 'valid' ? '#10B981' : phoneVerification.status === 'invalid' ? '#EF4444' : '#F59E0B' }}>
              {phoneVerification.message}
            </div>
          )}
        </div>
      );
    }

    return (
      <DynamicField
        fieldDefinition={field}
        value={fieldValues[field.fieldName] || ''}
        onChange={handleFieldChange}
        error={fieldErrors[field.fieldName]}
      />
    );
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await leadService.getLeads({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      if (response && response.success === true && response.data) {
        const leadsData = response.data.leads || [];
        setLeads(leadsData);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));

        const newLeads = leadsData.filter(l => l.leadStatus === 'New').length;
        const qualified = leadsData.filter(l => l.leadStatus === 'Qualified').length;
        const contacted = leadsData.filter(l => l.leadStatus === 'Contacted').length;

        setStats({
          total: response.data.pagination?.total || 0,
          new: newLeads,
          qualified,
          contacted
        });
      } else {
        setError(response?.message || 'Failed to load leads');
      }
    } catch (err) {
      console.error('Load leads error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email) => {
    if (!email || email.length < 5) {
      setEmailVerification({ status: 'pending', message: '', isValid: null });
      return;
    }

    setEmailVerification({ status: 'verifying', message: 'Verifying...', isValid: null });

    try {
      const result = await verificationService.verifyEmail(email);

      if (result.success && result.data) {
        const { isValid, status, message } = result.data;

        setEmailVerification({
          status: isValid ? 'valid' : status === 'unknown' ? 'unknown' : 'invalid',
          message: message || '',
          isValid: isValid
        });
      } else {
        setEmailVerification({
          status: 'unknown',
          message: 'Unable to verify',
          isValid: null
        });
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setEmailVerification({
        status: 'unknown',
        message: 'Verification failed',
        isValid: null
      });
    }
  };

  const verifyPhone = async (phone) => {
    if (!phone || phone.length < 10) {
      setPhoneVerification({ status: 'pending', message: '', isValid: null });
      return;
    }

    setPhoneVerification({ status: 'verifying', message: 'Verifying...', isValid: null });

    try {
      const result = await verificationService.verifyPhone(phone);

      if (result.success && result.data) {
        const { isValid, status, message } = result.data;

        setPhoneVerification({
          status: isValid ? 'valid' : status === 'unknown' ? 'unknown' : 'invalid',
          message: message || '',
          isValid: isValid
        });
      } else {
        setPhoneVerification({
          status: 'unknown',
          message: 'Unable to verify',
          isValid: null
        });
      }
    } catch (err) {
      console.error('Phone verification error:', err);
      setPhoneVerification({
        status: 'unknown',
        message: 'Verification failed',
        isValid: null
      });
    }
  };

  const debouncedEmailVerify = useCallback(
    debounce((email) => verifyEmail(email), 2000),
    []
  );

  const debouncedPhoneVerify = useCallback(
    debounce((phone) => verifyPhone(phone), 2000),
    []
  );

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Separate standard fields from custom fields
      const standardFields = {};
      const customFields = {};

      fieldDefinitions.forEach(field => {
        const value = fieldValues[field.fieldName];
        if (value !== undefined && value !== null && value !== '') {
          if (field.isStandardField) {
            standardFields[field.fieldName] = value;
          } else {
            customFields[field.fieldName] = value;
          }
        }
      });

      // Combine standard fields with product data and custom fields
      const leadData = {
        ...standardFields,  // Standard fields at top level
        product: formData.product,  // Product selection
        productDetails: formData.productDetails,  // Product details
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined  // Custom fields in nested object
      };

      console.log('📤 Submitting lead data:', leadData);
      console.log('  📋 Standard fields:', Object.keys(standardFields));
      console.log('  🎨 Custom fields:', Object.keys(customFields));

      await leadService.createLead(leadData);
      setSuccess('Lead created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadLeads();
      loadProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Create lead error:', err);
      setError(err.response?.data?.message || 'Failed to create lead');
    }
  };

  const handleCreateProductFromLead = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      const response = await productItemService.createProduct(productFormData);
      
      if (response && response.success && response.data) {
        setSuccess('Product created successfully!');
        
        setFormData(prev => ({
          ...prev,
          product: response.data._id
        }));
        
        setShowAddProductModal(false);
        resetProductForm();
        
        await loadProducts();
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openAddProductModal = () => {
    resetProductForm();
    setShowAddProductModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobilePhone: '',
      fax: '',
      company: '',
      jobTitle: '',
      website: '',
      leadSource: '',
      leadStatus: '',
      industry: '',
      numberOfEmployees: '',
      annualRevenue: '',
      rating: '',
      emailOptOut: false,
      skypeId: '',
      secondaryEmail: '',
      twitter: '',
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      flatHouseNo: '',
      latitude: '',
      longitude: '',
      description: '',
      product: '',
      productDetails: {
        quantity: 1,
        requirements: '',
        estimatedBudget: '',
        priority: '',
        notes: ''
      }
    });
    setEmailVerification({ status: 'pending', message: '', isValid: null });
    setPhoneVerification({ status: 'pending', message: '', isValid: null });
    setFieldValues({});
    setFieldErrors({});
  };

  const resetProductForm = () => {
    setProductFormData({
      name: '',
      articleNumber: '',
      category: '',
      price: '',
      stock: '',
      description: '',
      imageUrl: ''
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('productDetails.')) {
      const fieldName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        productDetails: {
          ...prev.productDetails,
          [fieldName]: value
        }
      }));
      return;
    }

    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (name === 'email') {
      debouncedEmailVerify(newValue);
    }

    if (name === 'phone') {
      debouncedPhoneVerify(newValue);
    }
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleLeadClick = (leadId) => {
    navigate(`/leads/${leadId}`);
  };

  const canCreateLead = hasPermission('lead_management', 'create');
  const canImportLeads = hasPermission('lead_management', 'import');
  const canManageProducts = hasPermission('product_management', 'create');

  const getRatingIcon = (rating) => {
    const icons = {
      'Hot': '🔥',
      'Warm': '🌤️',
      'Cold': '❄️'
    };
    return icons[rating] || '📊';
  };

  const VerificationIcon = ({ status, message }) => {
    if (status === 'pending') return null;

    if (status === 'verifying') {
      return (
        <span style={{ marginLeft: '8px', color: '#3B82F6', fontSize: '12px' }}>
          🔄 Verifying...
        </span>
      );
    }

    if (status === 'valid') {
      return (
        <span style={{ marginLeft: '8px', color: '#10B981', fontSize: '16px' }} title={message}>
          ✅
        </span>
      );
    }

    if (status === 'invalid') {
      return (
        <span style={{ marginLeft: '8px', color: '#EF4444', fontSize: '16px' }} title={message}>
          ❌
        </span>
      );
    }

    if (status === 'unknown') {
      return (
        <span style={{ marginLeft: '8px', color: '#F59E0B', fontSize: '16px' }} title={message}>
          ⚠️
        </span>
      );
    }

    return null;
  };

  const actionButton = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '8px', background: 'white', borderRadius: '8px', padding: '4px', border: '2px solid #e5e7eb' }}>
        <button
          className={`crm-btn crm-btn-sm ${viewMode === 'table' ? 'crm-btn-primary' : 'crm-btn-secondary'}`}
          onClick={() => setViewMode('table')}
          style={{ padding: '6px 12px' }}
        >
          ☰ Table
        </button>
        <button
          className={`crm-btn crm-btn-sm ${viewMode === 'grid' ? 'crm-btn-primary' : 'crm-btn-secondary'}`}
          onClick={() => setViewMode('grid')}
          style={{ padding: '6px 12px' }}
        >
          ⊞ Grid
        </button>
      </div>
      <TooltipButton
        className="crm-btn crm-btn-primary"
        onClick={openCreateModal}
        disabled={!canCreateLead}
        tooltipText="You don't have permission to create leads"
      >
        + New Lead
      </TooltipButton>
    </div>
  );

  return (
    <DashboardLayout title="Leads" actionButton={actionButton}>
      {success && <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>✓ {success}</div>}
      {error && <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>⚠ {error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Leads</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-change">All leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">New Leads</div>
          <div className="stat-value">{stats.new}</div>
          <div className="stat-change positive">Fresh prospects</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Qualified</div>
          <div className="stat-value">{stats.qualified}</div>
          <div className="stat-change positive">Ready to convert</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Contacted</div>
          <div className="stat-value">{stats.contacted}</div>
          <div className="stat-change">In progress</div>
        </div>
      </div>

      <div className="crm-card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>🔍 Search & Filter</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <input
              type="text"
              name="search"
              placeholder="Search leads..."
              className="crm-form-input"
              value={filters.search}
              onChange={handleFilterChange}
            />
            <select
              name="leadStatus"
              className="crm-form-select"
              value={filters.leadStatus}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
              <option value="Lost">Lost</option>
            </select>
            <select
              name="leadSource"
              className="crm-form-select"
              value={filters.leadSource}
              onChange={handleFilterChange}
            >
              <option value="">All Sources</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Campaign">Campaign</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Social Media">Social Media</option>
            </select>
            <select
              name="rating"
              className="crm-form-select"
              value={filters.rating}
              onChange={handleFilterChange}
            >
              <option value="">All Ratings</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
            {canImportLeads && (
              <button
                className="crm-btn crm-btn-secondary"
                onClick={() => setShowBulkUploadModal(true)}
              >
                📤 Bulk Upload
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">{viewMode === 'grid' ? 'Lead Cards' : 'Lead List'} ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b', fontSize: '15px', fontWeight: '600' }}>Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>No leads found</p>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Create your first lead to get started!</p>
            {canCreateLead && <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>+ Create First Lead</button>}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {leads.map((lead) => (
                  <div
                    key={lead._id}
                    onClick={() => handleLeadClick(lead._id)}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      border: '2px solid #e5e7eb',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(74, 144, 226, 0.2)';
                      e.currentTarget.style.borderColor = '#4A90E2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #4A90E2 0%, #2c5364 100%)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: '800',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                      }}>
                        {lead.firstName?.[0]}{lead.lastName?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#1e3c72' }}>
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <p style={{ margin: '0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                          {lead.jobTitle || 'No title'} {lead.company && `at ${lead.company}`}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`status-badge ${(lead.leadStatus || 'new').toLowerCase()}`}>
                        {lead.leadStatus || 'New'}
                      </span>
                      {lead.rating && (
                        <span className={`rating-badge ${lead.rating.toLowerCase()}`}>
                          {getRatingIcon(lead.rating)} {lead.rating}
                        </span>
                      )}
                    </div>
                    <div style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
                      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📧</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
                        {lead.emailVerified && <span style={{ color: '#10B981' }}>✅</span>}
                      </div>
                      {lead.phone && (
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📞</span>
                          <span>{lead.phone}</span>
                          {lead.phoneVerified && <span style={{ color: '#10B981' }}>✅</span>}
                        </div>
                      )}
                      {lead.leadSource && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🌐</span>
                          <span>{lead.leadSource}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Article Number</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rating</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead._id}
                        onClick={(e) => { if (e.target.tagName !== 'BUTTON') handleLeadClick(lead._id); }}
                        style={{
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderRadius: '12px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                          border: '2px solid #e5e7eb'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(74, 144, 226, 0.15)';
                          e.currentTarget.style.borderColor = '#4A90E2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              fontWeight: '800',
                              color: 'white',
                              boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                            }}>
                              {lead.firstName?.[0]}{lead.lastName?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px', marginBottom: '4px' }}>
                                {lead.firstName} {lead.lastName}
                              </div>
                              {lead.jobTitle && (
                                <div style={{ fontSize: '13px', color: '#64748b' }}>{lead.jobTitle}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                            {lead.company || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                              <span>📧</span>
                              <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
                              {lead.emailVerified && <span style={{ color: '#10B981' }}>✅</span>}
                            </div>
                            {lead.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                                <span>📞</span>
                                <span>{lead.phone}</span>
                                {lead.phoneVerified && <span style={{ color: '#10B981' }}>✅</span>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {lead.product ? (
                            <div style={{ fontWeight: '700', color: '#1e3c72', fontSize: '13px' }}>
                              {lead.product.articleNumber}
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '16px' }}>
                          {lead.product ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/products-management?productId=${lead.product._id}`);
                              }}
                              style={{
                                color: '#2563eb',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                transition: 'color 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                              onMouseLeave={(e) => e.target.style.color = '#2563eb'}
                            >
                              {lead.product.name}
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`status-badge ${(lead.leadStatus || 'new').toLowerCase()}`}>
                            {lead.leadStatus || 'New'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {lead.rating ? (
                            <span className={`rating-badge ${lead.rating.toLowerCase()}`}>
                              {getRatingIcon(lead.rating)} {lead.rating}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                            {lead.leadSource || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderTop: '2px solid #f1f5f9' }}>
                <button
                  className="crm-btn crm-btn-secondary"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  ← Previous
                </button>
                <span style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="crm-btn crm-btn-secondary"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          setError('');
        }}
        title="Create Lead"
        size="large"
      >
        <form onSubmit={handleCreateLead}>
          <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Lead Image
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #D1D5DB', overflow: 'hidden' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
          </div>

          {/* Dynamic Form Sections - Rendered from Field Definitions */}
          {(() => {
            const groupedFields = groupFieldsBySection(fieldDefinitions);
            const sectionOrder = ['Basic Information', 'Lead Classification', 'Business Information', 'Communication Preferences', 'Social Media', 'Address', 'Additional Information'];

            return sectionOrder.map(sectionName => {
              const sectionFields = groupedFields[sectionName];
              if (!sectionFields || sectionFields.length === 0) return null;

              return (
                <div key={sectionName} style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {sectionName}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
                    {/* Show Lead Owner only in Basic Information section */}
                    {sectionName === 'Basic Information' && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lead Owner</label>
                        <select className="crm-form-input" disabled style={{ background: '#F9FAFB' }}>
                          <option>{user?.firstName} {user?.lastName}</option>
                        </select>
                      </div>
                    )}

                    {sectionFields.map((field) => {
                      const isFullWidth = field.fieldType === 'textarea' || field.fieldType === 'text' && field.fieldName === 'description';

                      return (
                        <div key={field._id} style={isFullWidth ? { gridColumn: 'span 2' } : {}}>
                          {renderDynamicField(field)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}

          {/* Product Selection - Special Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Product Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 16px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Product (Optional)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  name="product"
                  className="crm-form-select"
                  value={formData.product}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                >
                  <option value="">-None-</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.articleNumber} - {product.name}
                    </option>
                  ))}
                </select>
                {canManageProducts && (
                  <button
                    type="button"
                    className="crm-btn crm-btn-primary"
                    onClick={openAddProductModal}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    + Add Product
                  </button>
                )}
              </div>
            </div>
          </div>

          {formData.product && (
            <div style={{ gridColumn: 'span 4', marginTop: '16px', padding: '16px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #BFDBFE', marginBottom: '24px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#1E40AF', marginBottom: '12px' }}>
                📋 Product Requirements
              </h5>
              
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', gap: '12px 16px', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Quantity</label>
                <div>
                  <input 
                    type="number" 
                    name="productDetails.quantity" 
                    className="crm-form-input" 
                    value={formData.productDetails.quantity} 
                    onChange={handleChange}
                    min="1"
                    placeholder="1"
                  />
                </div>

                <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Priority</label>
                <div>
                  <select 
                    name="productDetails.priority" 
                    className="crm-form-select" 
                    value={formData.productDetails.priority} 
                    onChange={handleChange}
                  >
                    <option value="">-None-</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Estimated Budget</label>
                <div style={{ gridColumn: 'span 3' }}>
                  <input 
                    type="number" 
                    name="productDetails.estimatedBudget" 
                    className="crm-form-input" 
                    value={formData.productDetails.estimatedBudget} 
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right', alignSelf: 'start', paddingTop: '8px' }}>Requirements</label>
                <div style={{ gridColumn: 'span 3' }}>
                  <textarea 
                    name="productDetails.requirements" 
                    className="crm-form-textarea" 
                    rows="2"
                    value={formData.productDetails.requirements} 
                    onChange={handleChange}
                    placeholder="e.g., Need custom reporting module, 24/7 support required"
                  />
                </div>

                <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right', alignSelf: 'start', paddingTop: '8px' }}>Notes</label>
                <div style={{ gridColumn: 'span 3' }}>
                  <textarea 
                    name="productDetails.notes" 
                    className="crm-form-textarea" 
                    rows="2"
                    value={formData.productDetails.notes} 
                    onChange={handleChange}
                    placeholder="Additional notes or special requests"
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Address Information
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', gap: '12px 16px', alignItems: 'start' }}>
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Flat/House No/<br/>Building/Apartment<br/>Name</label>
              <div>
                <input type="text" name="flatHouseNo" className="crm-form-input" value={formData.flatHouseNo} onChange={handleChange} />
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Street Address</label>
              <div>
                <input type="text" name="street" className="crm-form-input" value={formData.street} onChange={handleChange} />
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>City</label>
              <div>
                <input type="text" name="city" className="crm-form-input" value={formData.city} onChange={handleChange} />
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>State/Province</label>
              <div>
                <select name="state" className="crm-form-select" value={formData.state} onChange={handleChange}>
                  <option value="">-None-</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Gujarat">Gujarat</option>
                </select>
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Country/Region</label>
              <div>
                <select name="country" className="crm-form-select" value={formData.country} onChange={handleChange}>
                  <option value="">-None-</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                </select>
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Zip/Postal Code</label>
              <div>
                <input type="text" name="zipCode" className="crm-form-input" value={formData.zipCode} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Description Information
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 16px', alignItems: 'start' }}>
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right', paddingTop: '8px' }}>Description</label>
              <div>
                <textarea name="description" className="crm-form-textarea" rows="4" value={formData.description} onChange={handleChange} style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #E5E7EB', marginTop: '20px' }}>
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); setError(''); }}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showAddProductModal}
        onClose={() => {
          setShowAddProductModal(false);
          resetProductForm();
          setError('');
        }}
        title="Add New Product"
        size="medium"
      >
        <form onSubmit={handleCreateProductFromLead}>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
            <p style={{ fontSize: '13px', color: '#1E40AF', margin: 0 }}>
              💡 <strong></strong> Create a new product 
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              className="crm-form-input"
              value={productFormData.name}
              onChange={handleProductFormChange}
              required
              placeholder="e.g., CRM Software License"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Article Number  *
            </label>
            <input
              type="text"
              name="articleNumber"
              className="crm-form-input"
              value={productFormData.articleNumber}
              onChange={handleProductFormChange}
              required
              placeholder="e.g., CRM-001"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Category *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                name="category"
                className="crm-form-select"
                value={productFormData.category}
                onChange={handleProductFormChange}
                required
                style={{ flex: 1 }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="crm-btn crm-btn-secondary"
                onClick={() => {
                  window.open('/product-categories', '_blank');
                }}
                title="Manage Categories"
              >
                ⚙️
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Don't see your category? Click ⚙️ to manage categories in a new tab
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Price *
              </label>
              <input
                type="number"
                name="price"
                className="crm-form-input"
                value={productFormData.price}
                onChange={handleProductFormChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Stock (Optional)
              </label>
              <input
                type="number"
                name="stock"
                className="crm-form-input"
                value={productFormData.stock}
                onChange={handleProductFormChange}
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Description (Optional)
            </label>
            <textarea
              name="description"
              className="crm-form-input"
              value={productFormData.description}
              onChange={handleProductFormChange}
              rows="3"
              placeholder="Product description..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
            <button
              type="button"
              className="crm-btn crm-btn-secondary"
              onClick={() => {
                setShowAddProductModal(false);
                resetProductForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">
              Create & Select Product
            </button>
          </div>
        </form>
      </Modal>

      {showBulkUploadModal && (
        <Modal isOpen={showBulkUploadModal} onClose={() => setShowBulkUploadModal(false)} title="Bulk Upload Leads" size="large">
          <BulkUploadForm onClose={() => setShowBulkUploadModal(false)} onSuccess={loadLeads} />
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Leads;