import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { productItemService } from '../services/productItemService';
import { productCategoryService } from '../services/productCategoryService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import TooltipButton from '../components/common/TooltipButton';
import DynamicField from '../components/DynamicField';
import '../styles/crm.css';

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    isActive: 'true'
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    categories: 0
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Modal navigation - track which modal opened which
  const [modalStack, setModalStack] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    articleNumber: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    imageUrl: '',
    isActive: true
  });

  // Dynamic field definitions
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadCustomFields();
  }, [pagination.page, filters]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const productId = params.get('productId');
    if (productId && products.length > 0) {
      const element = document.getElementById(`product-${productId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.animation = 'highlight 2s ease-in-out';
      }
    }
  }, [location.search, products]);

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

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productItemService.getAllProducts(filters, pagination.page, pagination.limit);

      if (response && response.success === true && response.data) {
        const productsData = response.data.products || [];
        setProducts(productsData);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));

        const activeCount = productsData.filter(p => p.isActive).length;
        const lowStockCount = productsData.filter(p => p.stock < 10).length;
        const uniqueCategories = [...new Set(productsData.map(p => p.category))].length;

        setStats({
          total: response.data.pagination?.total || 0,
          active: activeCount,
          lowStock: lowStockCount,
          categories: uniqueCategories
        });
      } else {
        setError(response?.message || 'Failed to load products');
      }
    } catch (err) {
      console.error('Load products error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Product', false);
      if (response && Array.isArray(response)) {
        const createFields = response
          .filter(field => field.isActive && field.showInCreate)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        setFieldDefinitions(createFields);
      }
    } catch (err) {
      console.error('Load field definitions error:', err);
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
  };

  // Render dynamic field
  const renderDynamicField = (field) => {
    return (
      <DynamicField
        fieldDefinition={field}
        value={fieldValues[field.fieldName] || ''}
        onChange={handleFieldChange}
        error={fieldErrors[field.fieldName]}
      />
    );
  };

  const handleCreateProduct = async (e) => {
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

      // Combine standard fields with form data and custom fields
      const productData = {
        ...formData,
        ...standardFields,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined
      };

      if (editingProduct) {
        await productItemService.updateProduct(editingProduct._id, productData);
        setSuccess('Product updated successfully!');
      } else {
        await productItemService.createProduct(productData);
        setSuccess('Product created successfully!');
      }
      setShowCreateModal(false);
      resetForm();
      loadProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      articleNumber: product.articleNumber || '',
      category: product.category || '',
      price: product.price || '',
      stock: product.stock || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      isActive: product.isActive !== false
    });
    setShowCreateModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      setError('');
      await productItemService.deleteProduct(productId);
      setSuccess('Product deleted successfully!');
      loadProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingProduct(null);
    setShowCreateModal(true);
    setModalStack(['createProduct']);
  };

  const openCreateCategoryModal = () => {
    // Close parent modal and open this one
    setShowCreateModal(false);
    setShowCreateCategoryModal(true);
    setModalStack(['createProduct', 'createCategory']);
  };

  const closeCreateCategoryModal = () => {
    setShowCreateCategoryModal(false);
    setNewCategoryName('');
    setError('');
    // Reopen parent modal
    setShowCreateModal(true);
    setModalStack(['createProduct']);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      await productCategoryService.createCategory({ name: newCategoryName, isActive: true });
      setSuccess('Category created successfully!');
      setNewCategoryName('');

      // Close this modal and reopen parent
      setShowCreateCategoryModal(false);
      setShowCreateModal(true);
      setModalStack(['createProduct']);

      await loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      articleNumber: '',
      category: '',
      price: '',
      stock: '',
      description: '',
      imageUrl: '',
      isActive: true
    });
    setFieldValues({});
    setFieldErrors({});
    setEditingProduct(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleProductClick = (productId) => {
    navigate(`/products-management?productId=${productId}`);
  };

  const canCreateProduct = hasPermission('product_management', 'create');
  const canEditProduct = hasPermission('product_management', 'update');
  const canDeleteProduct = hasPermission('product_management', 'delete');
  const canManageCategories = hasPermission('product_management', 'create');

  return (
    <DashboardLayout title="Products Management">
      {success && (
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>
          ⚠ {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-change">All products</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Products</div>
          <div className="stat-value">{stats.active}</div>
          <div className="stat-change positive">Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value">{stats.lowStock}</div>
          <div className="stat-change negative">Need reorder</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{stats.categories}</div>
          <div className="stat-change">Active</div>
        </div>
      </div>

      <div className="crm-card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>
            🔍 Search & Filter
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <input
              type="text"
              name="search"
              placeholder="Search products..."
              className="crm-form-input"
              value={filters.search}
              onChange={handleFilterChange}
            />
            <select
              name="category"
              className="crm-form-select"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <select
              name="isActive"
              className="crm-form-select"
              value={filters.isActive}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '16px', borderTop: '2px solid #f1f5f9' }}>
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
            {canCreateProduct && (
              <TooltipButton
                className="crm-btn crm-btn-primary"
                onClick={openCreateModal}
                disabled={!canCreateProduct}
                tooltipText="You don't have permission to create products"
              >
                + New Product
              </TooltipButton>
            )}
          </div>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">
            {viewMode === 'grid' ? 'Product Cards' : 'Product List'} ({pagination.total})
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b', fontSize: '15px', fontWeight: '600' }}>
              Loading products...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>
              No products found
            </p>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Create your first product to get started!
            </p>
            {canCreateProduct && (
              <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>
                + Create First Product
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {products.map((product) => (
                  <div
                    key={product._id}
                    id={`product-${product._id}`}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      borderRadius: '16px',
                      padding: '24px',
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
                    
                    {product.imageUrl ? (
                      <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                        <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '180px', borderRadius: '12px', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '64px' }}>📦</span>
                      </div>
                    )}

                    <div style={{ marginBottom: '12px' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#1e3c72' }}>
                        {product.name}
                      </h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                        SKU: {product.articleNumber}
                      </p>
                    </div>

                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 12px', background: '#E0F2FE', color: '#0369A1', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        {product.category}
                      </span>
                      {product.isActive ? (
                        <span style={{ padding: '4px 12px', background: '#DCFCE7', color: '#166534', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                          Active
                        </span>
                      ) : (
                        <span style={{ padding: '4px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                          Inactive
                        </span>
                      )}
                    </div>

                    <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>Price:</span>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e3c72' }}>
                          ${Number(product.price).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>Stock:</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: product.stock < 10 ? '#DC2626' : '#059669' }}>
                          {product.stock} units
                        </span>
                      </div>
                    </div>

                    {product.description && (
                      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.6' }}>
                        {product.description.length > 100 ? `${product.description.substring(0, 100)}...` : product.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="crm-btn crm-btn-secondary"
                        onClick={() => handleProductClick(product._id)}
                        style={{ flex: 1, fontSize: '13px' }}
                      >
                        View Details
                      </button>
                      {canEditProduct && (
                        <button
                          className="crm-btn crm-btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProduct(product);
                          }}
                          style={{ flex: 1, fontSize: '13px' }}
                        >
                          Edit
                        </button>
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
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Product
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Category
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Price
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Stock
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Enquiries
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product._id}
                        id={`product-${product._id}`}
                        style={{
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderRadius: '12px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                          border: '2px solid #e5e7eb'
                        }}
                        onClick={(e) => {
                          if (e.target.tagName !== 'BUTTON') {
                            handleProductClick(product._id);
                          }
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
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                              }}>
                                📦
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px', marginBottom: '4px' }}>
                                {product.name}
                              </div>
                              <div style={{ fontSize: '13px', color: '#64748b' }}>
                                SKU: {product.articleNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ padding: '6px 12px', background: '#E0F2FE', color: '#0369A1', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
                            {product.category}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e3c72' }}>
                            ${Number(product.price).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: product.stock < 10 ? '#DC2626' : '#059669' }}>
                            {product.stock}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#4A90E2' }}>
                            {product.enquiryCount || 0}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {product.isActive ? (
                            <span style={{ padding: '6px 12px', background: '#DCFCE7', color: '#166534', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
                              Active
                            </span>
                          ) : (
                            <span style={{ padding: '6px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {canEditProduct && (
                              <button
                                className="crm-btn crm-btn-sm crm-btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProduct(product);
                                }}
                              >
                                Edit
                              </button>
                            )}
                            {canDeleteProduct && (
                              <button
                                className="crm-btn crm-btn-sm crm-btn-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProduct(product._id);
                                }}
                              >
                                Delete
                              </button>
                            )}
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
        title={editingProduct ? 'Edit Product' : 'Create Product'}
        size="large"
      >
        <form onSubmit={handleCreateProduct}>
          {/* Basic Information Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Basic Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  className="crm-form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter product name"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Article Number / SKU *
                </label>
                <input
                  type="text"
                  name="articleNumber"
                  className="crm-form-input"
                  value={formData.articleNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., PROD-001"
                />
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Category *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                name="category"
                className="crm-form-select"
                value={formData.category}
                onChange={handleChange}
                required
                style={{ flex: 1 }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {canManageCategories && (
                <button
                  type="button"
                  className="crm-btn crm-btn-secondary"
                  onClick={openCreateCategoryModal}
                  title="Create New Category"
                >
                  +
                </button>
              )}
            </div>
          </div>

          {/* Pricing & Inventory Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pricing & Inventory
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  className="crm-form-input"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  className="crm-form-input"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Additional Details
            </h4>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                name="description"
                className="crm-form-input"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Enter product description"
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                className="crm-form-input"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Active Product</span>
              </label>
            </div>
          </div>

          {/* Dynamic Form Sections - Only Custom Fields (excluding standard fields) */}
          {(() => {
            // Standard fields already rendered above - exclude them from dynamic rendering
            const standardFieldNames = ['name', 'articleNumber', 'category', 'price', 'stock', 'description', 'imageUrl', 'isActive'];
            const customFields = fieldDefinitions.filter(field => !standardFieldNames.includes(field.fieldName));

            if (customFields.length === 0) return null;

            const groupedFields = groupFieldsBySection(customFields);
            const sectionOrder = ['Custom Fields', 'Additional Information', 'Other'];

            return sectionOrder.map(sectionName => {
              const sectionFields = groupedFields[sectionName];
              if (!sectionFields || sectionFields.length === 0) return null;

              return (
                <div key={sectionName} style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {sectionName}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {sectionFields.map((field) => {
                      const isFullWidth = field.fieldType === 'textarea';

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
            <button
              type="button"
              className="crm-btn crm-btn-secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <Modal
          isOpen={showCreateCategoryModal}
          onClose={closeCreateCategoryModal}
          title="Create New Category"
          size="small"
        >
          <form onSubmit={handleCreateCategory}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Category Name *
              </label>
              <input
                type="text"
                className="crm-form-input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                placeholder="e.g., Software, Hardware, Services"
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
              <button
                type="button"
                className="crm-btn crm-btn-secondary"
                onClick={closeCreateCategoryModal}
              >
                Cancel
              </button>
              <button type="submit" className="crm-btn crm-btn-primary">
                Create Category
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Products;