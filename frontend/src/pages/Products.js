import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { productItemService } from '../services/productItemService';
import { productCategoryService } from '../services/productCategoryService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import { useAuth } from '../context/AuthContext';
import DynamicField from '../components/DynamicField';
import ManageFieldsPanel from '../components/ManageFieldsPanel';
import { Settings } from 'lucide-react';
import '../styles/crm.css';

const DEFAULT_PRODUCT_FIELDS = [
  { fieldName: 'name',          label: 'Product Name',         fieldType: 'text',     section: 'Product Information', displayOrder: 1, required: true,  isActive: true },
  { fieldName: 'articleNumber', label: 'Article Number / SKU', fieldType: 'text',     section: 'Product Information', displayOrder: 2, required: true,  isActive: true },
  { fieldName: 'category',      label: 'Category',             fieldType: 'select',   section: 'Product Information', displayOrder: 3, required: true,  isActive: true },
  { fieldName: 'price',         label: 'Price',                fieldType: 'number',   section: 'Product Information', displayOrder: 4, required: true,  isActive: true },
  { fieldName: 'stock',         label: 'Stock Quantity',       fieldType: 'number',   section: 'Product Information', displayOrder: 5, required: false, isActive: true },
  { fieldName: 'imageUrl',      label: 'Image URL',            fieldType: 'url',      section: 'Media & Status',      displayOrder: 6, required: false, isActive: true },
  { fieldName: 'isActive',      label: 'Active Product',       fieldType: 'checkbox', section: 'Media & Status',      displayOrder: 7, required: false, isActive: true },
  { fieldName: 'description',   label: 'Description',          fieldType: 'textarea', section: 'Description',         displayOrder: 8, required: false, isActive: true },
];

const PROD_DISABLED_KEY = 'crm_prod_std_disabled';
const getProdDisabled = () => { try { return JSON.parse(localStorage.getItem(PROD_DISABLED_KEY) || '[]'); } catch { return []; } };
const PRODUCT_SECTIONS = ['Product Information', 'Media & Status', 'Description'];

const buildProdFields = (disabled, customs) => {
  const stdFields = DEFAULT_PRODUCT_FIELDS
    .map(f => ({ ...f, isStandardField: true, isActive: !disabled.includes(f.fieldName) }))
    .filter(f => f.isActive);
  return [...stdFields, ...(customs || []).filter(f => f.isActive)].sort((a, b) => a.displayOrder - b.displayOrder);
};

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [panelWidth, setPanelWidth] = useState(38);

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', category: '', isActive: 'true' });
  const [stats, setStats] = useState({ total: 0, active: 0, lowStock: 0, categories: 0 });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateCategoryForm, setShowCreateCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formData, setFormData] = useState({ name: '', articleNumber: '', category: '', price: '', stock: '', description: '', imageUrl: '', isActive: true });

  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [showManageFields, setShowManageFields] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [disabledStdFields, setDisabledStdFields] = useState([]);
  const [togglingField, setTogglingField] = useState(null);

  useEffect(() => { loadProducts(); loadCategories(); loadCustomFields(); }, [pagination.page, filters]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const productId = params.get('productId');
    if (productId && products.length > 0) {
      const element = document.getElementById(`product-${productId}`);
      if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); element.style.animation = 'highlight 2s ease-in-out'; }
    }
  }, [location.search, products]);

  const loadCategories = async () => {
    try {
      const response = await productCategoryService.getAllCategories({ isActive: 'true' }, 1, 100);
      if (response?.success && response.data) setCategories(response.data.categories || []);
    } catch (err) { console.error('Load categories error:', err); }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productItemService.getAllProducts(filters, pagination.page, pagination.limit);
      if (response?.success && response.data) {
        const pData = response.data.products || [];
        setProducts(pData);
        setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0, pages: response.data.pagination?.pages || 0 }));
        setStats({
          total: response.data.pagination?.total || 0,
          active: pData.filter(p => p.isActive).length,
          lowStock: pData.filter(p => p.stock < 10).length,
          categories: [...new Set(pData.map(p => p.category))].length
        });
      } else {
        setError(response?.message || 'Failed to load products');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load products');
    } finally { setLoading(false); }
  };

  const loadCustomFields = async () => {
    try {
      const disabled = getProdDisabled();
      setDisabledStdFields(disabled);
      const response = await fieldDefinitionService.getFieldDefinitions('Product', true);
      if (response && Array.isArray(response)) {
        const customs = response.filter(f => !f.isStandardField);
        setCustomFieldDefs(customs);
        setFieldDefinitions(buildProdFields(disabled, customs));
      } else {
        setFieldDefinitions(buildProdFields(disabled, []));
      }
    } catch (err) {
      setFieldDefinitions(buildProdFields(getProdDisabled(), []));
    }
  };

  const allFieldDefs = [
    ...DEFAULT_PRODUCT_FIELDS.map(f => ({ ...f, isStandardField: true, isActive: !disabledStdFields.includes(f.fieldName) })),
    ...customFieldDefs,
  ];

  const handleToggleField = async (field) => {
    if (field.isStandardField) {
      const current = getProdDisabled();
      const newDisabled = current.includes(field.fieldName) ? current.filter(n => n !== field.fieldName) : [...current, field.fieldName];
      localStorage.setItem(PROD_DISABLED_KEY, JSON.stringify(newDisabled));
      setDisabledStdFields(newDisabled);
      setFieldDefinitions(buildProdFields(newDisabled, customFieldDefs));
    } else {
      setTogglingField(field._id);
      try {
        await fieldDefinitionService.updateFieldDefinition(field._id, { isActive: !field.isActive });
        const updatedCustoms = customFieldDefs.map(f => f._id === field._id ? { ...f, isActive: !f.isActive } : f);
        setCustomFieldDefs(updatedCustoms);
        setFieldDefinitions(buildProdFields(disabledStdFields, updatedCustoms));
      } finally { setTogglingField(null); }
    }
  };

  const handleAddCustomField = async (fieldData) => {
    const created = await fieldDefinitionService.createFieldDefinition({ entityType: 'Product', isStandardField: false, showInCreate: true, showInEdit: true, showInDetail: true, ...fieldData });
    const updated = [...customFieldDefs, { ...created, isActive: true }].sort((a, b) => a.displayOrder - b.displayOrder);
    setCustomFieldDefs(updated);
    setFieldDefinitions(buildProdFields(disabledStdFields, updated));
  };

  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const customFields = {};
      customFieldDefs.filter(f => f.isActive).forEach(field => {
        const value = fieldValues[field.fieldName];
        if (value !== undefined && value !== null && value !== '') customFields[field.fieldName] = value;
      });
      const productData = { ...formData, ...(Object.keys(customFields).length > 0 ? { customFields } : {}) };
      if (editingProduct) {
        await productItemService.updateProduct(editingProduct._id, productData);
        setSuccess('Product updated successfully!');
      } else {
        await productItemService.createProduct(productData);
        setSuccess('Product created successfully!');
      }
      setShowCreateForm(false);
      resetForm();
      loadProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({ name: product.name || '', articleNumber: product.articleNumber || '', category: product.category || '', price: product.price || '', stock: product.stock || '', description: product.description || '', imageUrl: product.imageUrl || '', isActive: product.isActive !== false });
    setShowCreateForm(true);
    setShowCreateCategoryForm(false);
    setShowManageFields(false);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      setError('');
      await productItemService.deleteProduct(productId);
      setSuccess('Product deleted!');
      loadProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const openCreateForm = () => {
    resetForm();
    setEditingProduct(null);
    setShowCreateForm(true);
    setShowCreateCategoryForm(false);
    setShowManageFields(false);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) { setError('Category name is required'); return; }
    try {
      await productCategoryService.createCategory({ name: newCategoryName, isActive: true });
      setSuccess('Category created!');
      setNewCategoryName('');
      setShowCreateCategoryForm(false);
      await loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', articleNumber: '', category: '', price: '', stock: '', description: '', imageUrl: '', isActive: true });
    setFieldValues({});
    setFieldErrors({});
    setEditingProduct(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('products-split-container');
    if (!container) return;
    const startX = e.clientX, startW = panelWidth, cW = container.getBoundingClientRect().width;
    const onMove = (mv) => { const d = ((mv.clientX - startX) / cW) * 100; setPanelWidth(Math.max(25, Math.min(60, startW + d))); };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const canCreateProduct = hasPermission('product_management', 'create');
  const canEditProduct = hasPermission('product_management', 'update');
  const canDeleteProduct = hasPermission('product_management', 'delete');
  const canManageCategories = hasPermission('product_management', 'create');

  const fmtPrice = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  const sectionColors = ['#6366f1', '#8b5cf6', '#10b981'];

  const renderStdField = (field) => {
    const lStyle = { display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#475569' };
    const iStyle = { width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1.5px solid #e2e8f0', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
    switch (field.fieldName) {
      case 'name':
        return <div key="name"><label style={lStyle}>Product Name {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label><input type="text" name="name" value={formData.name} onChange={handleChange} required style={iStyle} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>;
      case 'articleNumber':
        return <div key="articleNumber"><label style={lStyle}>SKU {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label><input type="text" name="articleNumber" value={formData.articleNumber} onChange={handleChange} required style={iStyle} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>;
      case 'category':
        return (
          <div key="category"><label style={lStyle}>Category {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <select name="category" value={formData.category} onChange={handleChange} required style={{ ...iStyle, flex: 1, cursor: 'pointer' }}>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
              </select>
              {canManageCategories && <button type="button" onClick={() => setShowCreateCategoryForm(true)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#6366f1' }}>+</button>}
            </div>
          </div>
        );
      case 'price':
        return <div key="price"><label style={lStyle}>Price {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label><input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" style={iStyle} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>;
      case 'stock':
        return <div key="stock"><label style={lStyle}>Stock Qty</label><input type="number" name="stock" value={formData.stock} onChange={handleChange} min="0" style={iStyle} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>;
      case 'imageUrl':
        return <div key="imageUrl" style={{ gridColumn: 'span 2' }}><label style={lStyle}>Image URL</label><input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} style={iStyle} placeholder="https://..." onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>;
      case 'isActive':
        return (
          <div key="isActive" style={{ display: 'flex', alignItems: 'center', paddingTop: '22px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} style={{ width: '16px', height: '16px', accentColor: '#6366f1' }} />
              Active Product
            </label>
          </div>
        );
      case 'description':
        return <div key="description" style={{ gridColumn: 'span 2' }}><label style={lStyle}>Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" style={{ ...iStyle, resize: 'vertical', lineHeight: '1.5' }} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>;
      default: return null;
    }
  };

  const statCards = [
    { label: 'Total Products', value: stats.total,      icon: '📦', bg: '#eff6ff', border: '#93c5fd', left: '#3b82f6', labelColor: '#2563eb', valColor: '#1e3a8a', iconBg: '#dbeafe' },
    { label: 'Active',         value: stats.active,     icon: '✅', bg: '#f0fdf4', border: '#6ee7b7', left: '#10b981', labelColor: '#059669', valColor: '#064e3b', iconBg: '#d1fae5' },
    { label: 'Low Stock',      value: stats.lowStock,   icon: '⚠️', bg: '#fff7ed', border: '#fdba74', left: '#f97316', labelColor: '#ea580c', valColor: '#7c2d12', iconBg: '#ffedd5' },
    { label: 'Categories',     value: stats.categories, icon: '🏷️', bg: '#fdf4ff', border: '#e879f9', left: '#d946ef', labelColor: '#c026d3', valColor: '#701a75', iconBg: '#fae8ff' },
  ];

  const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: '#f8fafc' };
  const tdStyle = { padding: '12px 14px', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };

  if (loading) return (
    <DashboardLayout title="Products">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Loading Products...</span>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Products">
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* Fixed top */}
        <div style={{ flexShrink: 0, padding: '0 16px 10px 16px' }}>

          {/* Header banner */}
          <div style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: '14px', padding: '16px 22px', marginBottom: '10px', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', flexShrink: 0 }}>📦</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e1b4b' }}>Products</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#6366f1', fontWeight: '500', marginTop: '2px' }}>Manage your product catalog, pricing & inventory</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="resp-grid-4">
            {statCards.map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: '12px', padding: '12px 16px', border: `1px solid ${s.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.left}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: s.labelColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: s.valColor, lineHeight: 1 }}>{s.value}</div>
                  </div>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '8px 12px', marginTop: '8px', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {canCreateProduct && (
              <button onClick={openCreateForm}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                + New Product
              </button>
            )}
            <div style={{ flex: '1', minWidth: '160px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', opacity: 0.45 }}>🔍</span>
              <input type="text" name="search" placeholder="Search products..." value={filters.search} onChange={handleFilterChange}
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <select name="category" value={filters.category} onChange={handleFilterChange}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', cursor: 'pointer', color: '#374151' }}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
            </select>
            <select name="isActive" value={filters.isActive} onChange={handleFilterChange}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f8fafc', cursor: 'pointer', color: '#374151' }}>
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {/* View mode toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
              {['table','grid'].map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: viewMode === m ? 'white' : 'transparent', color: viewMode === m ? '#6366f1' : '#64748b', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: viewMode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                  {m === 'table' ? '☰ Table' : '⊞ Grid'}
                </button>
              ))}
            </div>
            {hasPermission('field_management', 'read') && (
              <button onClick={() => { setShowManageFields(v => !v); setShowCreateForm(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #c7d2fe', background: showManageFields ? '#eef2ff' : 'white', color: '#6366f1', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                <Settings size={13} /> Fields
              </button>
            )}
            {success && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>✓ {success}</span>}
            {error && <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>{error}</span>}
          </div>
        </div>

        {/* Split panel */}
        <div id="products-split-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Left: Create/Edit Product Form */}
          {showCreateForm && (
            <div style={{ flex: `0 0 ${panelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {/* Form header */}
              <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)', flexShrink: 0, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>📦</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{editingProduct ? 'Edit Product' : 'New Product'}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Fill in product details below</div>
                  </div>
                </div>
                <button onClick={() => { setShowCreateForm(false); resetForm(); }}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '7px', padding: '5px 9px', color: 'white', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
              </div>

              {/* Form body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <form onSubmit={handleCreateProduct}>
                  {PRODUCT_SECTIONS.map((section, sIdx) => {
                    const sectionFields = fieldDefinitions.filter(f => f.section === section);
                    if (sectionFields.length === 0) return null;
                    const color = sectionColors[sIdx % sectionColors.length];
                    return (
                      <div key={section} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px', paddingBottom: '6px', borderBottom: `2px solid ${color}25` }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{section}</span>
                        </div>
                        <div className="resp-grid-2" style={{gap:'10px'}}>
                          {sectionFields.map(field => {
                            if (!field.isStandardField) {
                              return (
                                <div key={field._id} style={field.fieldType === 'textarea' ? { gridColumn: 'span 2' } : {}}>
                                  <DynamicField fieldDefinition={field} value={fieldValues[field.fieldName] || ''} onChange={handleFieldChange} error={fieldErrors[field.fieldName]} />
                                </div>
                              );
                            }
                            return renderStdField(field);
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Category quick-add */}
                  {showCreateCategoryForm && (
                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🏷️ Add New Category</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Category name..."
                          style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                          onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                        <button type="button" onClick={handleCreateCategory}
                          style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Add</button>
                        <button type="button" onClick={() => { setShowCreateCategoryForm(false); setNewCategoryName(''); }}
                          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontSize: '12px', cursor: 'pointer', color: '#64748b' }}>✕</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <button type="button" onClick={() => { setShowCreateForm(false); resetForm(); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit"
                      style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#1e1b4b 0%,#6366f1 100%)', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                      {editingProduct ? '✓ Update Product' : '✓ Create Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Divider */}
          {showCreateForm && (
            <div onMouseDown={handleDividerDrag} title="Drag to resize"
              style={{ width: '6px', flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = '#a5b4fc'}
              onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}>
              <div style={{ width: '2px', height: '40px', borderRadius: '99px', background: 'rgba(0,0,0,0.15)' }} />
            </div>
          )}

          {/* Right: Products Content */}
          <div style={{ flex: showCreateForm ? `0 0 ${100 - panelWidth}%` : '1 1 100%', minWidth: 0, overflowY: 'auto', padding: '0 16px 16px 12px' }}>

            {/* Manage Fields Panel */}
            {showManageFields && (
              <div style={{ marginBottom: '12px' }}>
                <ManageFieldsPanel
                  allFieldDefs={allFieldDefs}
                  togglingField={togglingField}
                  onToggle={handleToggleField}
                  onClose={() => setShowManageFields(false)}
                  onAdd={handleAddCustomField}
                  canAdd={hasPermission('field_management', 'create')}
                  canToggle={hasPermission('field_management', 'update')}
                  entityLabel="Product"
                  sections={PRODUCT_SECTIONS}
                />
              </div>
            )}

            {/* Products Table or Grid */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

              {products.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '42px', marginBottom: '10px' }}>📦</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>No products found</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Create your first product to get started</div>
                  {canCreateProduct && (
                    <button onClick={openCreateForm} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>+ Create First Product</button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {products.map(product => (
                    <div key={product._id} id={`product-${product._id}`}
                      style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = '#a5b4fc'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                      <div style={{ height: '3px', background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)' }} />
                      {product.imageUrl ? (
                        <div style={{ height: '140px', overflow: 'hidden' }}><img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                      ) : (
                        <div style={{ height: '100px', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px' }}>📦</div>
                      )}
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '800', color: '#1e1b4b', fontSize: '14px', marginBottom: '2px' }}>{product.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>SKU: {product.articleNumber}</div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '2px 8px', background: '#eef2ff', color: '#6366f1', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{product.category}</span>
                          <span style={{ padding: '2px 8px', background: product.isActive ? '#dcfce7' : '#fee2e2', color: product.isActive ? '#166534' : '#991b1b', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{product.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e1b4b' }}>{fmtPrice(product.price)}</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: product.stock < 10 ? '#dc2626' : '#059669' }}>{product.stock} units</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => navigate(`/products-management?productId=${product._id}`)}
                            style={{ flex: 1, padding: '7px', borderRadius: '7px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>View</button>
                          {canEditProduct && <button onClick={() => handleEditProduct(product)}
                            style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Edit</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        {['Product','Category','Price','Stock','Status','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product._id} id={`product-${product._id}`}
                          style={{ transition: 'background 0.1s', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}
                          onClick={e => { if (e.target.tagName !== 'BUTTON') navigate(`/products-management?productId=${product._id}`); }}>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📦</div>
                              )}
                              <div>
                                <div style={{ fontWeight: '700', color: '#1e1b4b', fontSize: '13px' }}>{product.name}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>SKU: {product.articleNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ padding: '3px 10px', background: '#eef2ff', color: '#6366f1', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{product.category}</span>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: '800', color: '#1e1b4b' }}>{fmtPrice(product.price)}</td>
                          <td style={{ ...tdStyle, fontWeight: '700', color: product.stock < 10 ? '#dc2626' : '#059669' }}>{product.stock}</td>
                          <td style={tdStyle}>
                            <span style={{ padding: '3px 10px', background: product.isActive ? '#dcfce7' : '#fee2e2', color: product.isActive ? '#166534' : '#991b1b', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{product.isActive ? 'Active' : 'Inactive'}</span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={e => { e.stopPropagation(); navigate(`/products-management?productId=${product._id}`); }} title="View"
                                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>👁️</button>
                              {canEditProduct && <button onClick={e => { e.stopPropagation(); handleEditProduct(product); }} title="Edit"
                                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #c7d2fe', background: '#eef2ff', cursor: 'pointer', fontSize: '13px' }}>✏️</button>}
                              {canDeleteProduct && <button onClick={e => { e.stopPropagation(); handleDeleteProduct(product._id); }} title="Delete"
                                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {products.length > 0 && (
                <div style={{ padding: '10px 14px', borderTop: '1px solid #f8fafc', background: '#f5f3ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Showing <strong style={{ color: '#374151' }}>{products.length}</strong> of {pagination.total} products</span>
                  {pagination.pages > 1 && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}
                        style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: pagination.page === 1 ? 'default' : 'pointer', fontSize: '12px', color: '#374151', opacity: pagination.page === 1 ? 0.5 : 1 }}>← Prev</button>
                      <span style={{ padding: '5px 8px', fontSize: '12px', color: '#64748b' }}>Page {pagination.page} of {pagination.pages}</span>
                      <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.pages}
                        style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: pagination.page === pagination.pages ? 'default' : 'pointer', fontSize: '12px', color: '#374151', opacity: pagination.page === pagination.pages ? 0.5 : 1 }}>Next →</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Products;
