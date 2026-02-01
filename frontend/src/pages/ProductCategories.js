import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { productCategoryService } from '../services/productCategoryService';
import { useAuth } from '../context/AuthContext';
import TooltipButton from '../components/common/TooltipButton';
import '../styles/crm.css';

const ProductCategories = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    isActive: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadCategories();
  }, [pagination.page, filters]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productCategoryService.getAllCategories(filters, pagination.page, pagination.limit);

      if (response && response.success === true && response.data) {
        const categoriesData = response.data.categories || [];
        setCategories(categoriesData);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));

        const activeCount = categoriesData.filter(c => c.isActive).length;
        const inactiveCount = categoriesData.filter(c => !c.isActive).length;

        setStats({
          total: response.data.pagination?.total || 0,
          active: activeCount,
          inactive: inactiveCount
        });
      } else {
        setError(response?.message || 'Failed to load categories');
      }
    } catch (err) {
      console.error('Load categories error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (editingCategory) {
        await productCategoryService.updateCategory(editingCategory._id, formData);
        setSuccess('Category updated successfully!');
      } else {
        await productCategoryService.createCategory(formData);
        setSuccess('Category created successfully!');
      }
      setShowCreateForm(false);
      resetForm();
      loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      isActive: category.isActive !== false
    });
    setShowCreateForm(true);
  };

  const handleDeleteCategory = async (categoryId, productCount) => {
    if (productCount > 0) {
      setError(`Cannot delete category: ${productCount} product(s) are using this category. Please reassign or delete those products first.`);
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      setError('');
      await productCategoryService.deleteCategory(categoryId);
      setSuccess('Category deleted successfully!');
      loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const openCreateForm = () => {
    resetForm();
    setEditingCategory(null);
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true
    });
    setEditingCategory(null);
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

  const canCreateCategory = hasPermission('product_management', 'create');
  const canEditCategory = hasPermission('product_management', 'update');
  const canDeleteCategory = hasPermission('product_management', 'delete');

  return (
    <DashboardLayout title="Product Categories">
      {success && (
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="crm-card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Product Categories</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="crm-btn crm-btn-secondary" onClick={() => navigate('/products-management')}>Back to Products</button>
            <TooltipButton className="crm-btn crm-btn-primary" onClick={openCreateForm} disabled={!canCreateCategory} tooltipText="You don't have permission to create categories">+ New Category</TooltipButton>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Categories</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-change">All categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Categories</div>
          <div className="stat-value">{stats.active}</div>
          <div className="stat-change positive">In use</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inactive Categories</div>
          <div className="stat-value">{stats.inactive}</div>
          <div className="stat-change">Disabled</div>
        </div>
      </div>

      <div className="crm-card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Search & Filter</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <input type="text" name="search" placeholder="Search categories..." className="crm-form-input" value={filters.search} onChange={handleFilterChange} />
            <select name="isActive" className="crm-form-select" value={filters.isActive} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inline Create/Edit Category Form */}
      {showCreateForm && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>{editingCategory ? 'Edit Category' : 'Create New Category'}</h3>
            <button onClick={() => { setShowCreateForm(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            <form onSubmit={handleCreateCategory}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Category Name *</label>
                  <input type="text" name="name" className="crm-form-input" value={formData.name} onChange={handleChange} required placeholder="e.g., Electronics, Software" style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                  <input type="text" name="description" className="crm-form-input" value={formData.description} onChange={handleChange} placeholder="Brief description..." style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                    Active (visible for product selection)
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline" onClick={() => { setShowCreateForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary">{editingCategory ? 'Update Category' : 'Create Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">Categories List ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b', fontSize: '15px', fontWeight: '600' }}>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📂</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>No categories found</p>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Create your first category to organize products!</p>
            {canCreateCategory && (
              <button className="crm-btn crm-btn-primary" onClick={openCreateForm}>+ Create First Category</button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', padding: '0' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead>
                  <tr style={{ background: 'transparent' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Products</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category._id} style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', border: '2px solid #e5e7eb' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'white', fontWeight: '800', boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)' }}>📂</div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px', marginBottom: '2px' }}>{category.name}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Created {new Date(category.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', maxWidth: '400px' }}>
                          {category.description || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No description</span>}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '48px', height: '32px', padding: '0 12px', background: category.productCount > 0 ? '#DBEAFE' : '#F1F5F9', color: category.productCount > 0 ? '#1E40AF' : '#64748B', borderRadius: '8px', fontSize: '14px', fontWeight: '700' }}>
                          {category.productCount || 0}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {category.isActive ? (
                          <span style={{ padding: '6px 16px', background: '#DCFCE7', color: '#166534', borderRadius: '8px', fontSize: '13px', fontWeight: '700', display: 'inline-block' }}>Active</span>
                        ) : (
                          <span style={{ padding: '6px 16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '13px', fontWeight: '700', display: 'inline-block' }}>Inactive</span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {canEditCategory && (
                            <button className="crm-btn crm-btn-sm crm-btn-primary" onClick={() => handleEditCategory(category)} style={{ minWidth: '70px' }}>Edit</button>
                          )}
                          {canDeleteCategory && (
                            <button className="crm-btn crm-btn-sm crm-btn-danger" onClick={() => handleDeleteCategory(category._id, category.productCount)} style={{ minWidth: '70px' }}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderTop: '2px solid #f1f5f9' }}>
                <button className="crm-btn crm-btn-secondary" onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}>Previous</button>
                <span style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px' }}>Page {pagination.page} of {pagination.pages}</span>
                <button className="crm-btn crm-btn-secondary" onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProductCategories;
