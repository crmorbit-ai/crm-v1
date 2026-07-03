import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import masterInventoryService from '../services/masterInventoryService';
import { groupService } from '../services/groupService';
import { Search, Edit2, Trash2, ArrowRight, Users, X } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function ProductInventory({ fromTab }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [items, setItems] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [pag, setPag] = useState({ page: 1, pages: 1, total: 0 });
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Detail panel states
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Assign & Relocate modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRelocateModal, setShowRelocateModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedRelocateDept, setSelectedRelocateDept] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [formData, setFormData] = useState({
    name: '', type: 'product', department: 'sales', status: 'new', description: '',
    sku: '', category: '', productPrice: 0, stock: 0, quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const ok = m => { setSuccess(m); setTimeout(() => setSuccess(''), 3000); };
  const err = m => { setError(m); setTimeout(() => setError(''), 4000); };

  const setFieldError = (field, message) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };
  const clearFieldError = (field) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };

    switch(fieldName) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Product name is required';
        } else if (value.trim().length < 3) {
          errors.name = 'Product name must be at least 3 characters';
        } else if (value.trim().length > 100) {
          errors.name = 'Product name must be less than 100 characters';
        } else if (!/^[a-zA-Z0-9\s\-_.()&]+$/.test(value.trim())) {
          errors.name = 'Invalid characters in product name';
        } else {
          delete errors.name;
        }
        break;

      case 'sku':
        if (value && value.trim() && !/^[a-zA-Z0-9\-_]+$/.test(value.trim())) {
          errors.sku = 'SKU can only contain letters, numbers, hyphens and underscores';
        } else {
          delete errors.sku;
        }
        break;

      case 'category':
        if (value && value.trim() && value.trim().length < 2) {
          errors.category = 'Category must be at least 2 characters';
        } else {
          delete errors.category;
        }
        break;

      case 'productPrice':
        if (value && (isNaN(value) || parseFloat(value) < 0)) {
          errors.productPrice = 'Price must be a valid positive number';
        } else {
          delete errors.productPrice;
        }
        break;

      case 'stock':
        if (value && (isNaN(value) || parseInt(value) < 0)) {
          errors.stock = 'Stock must be a valid positive number';
        } else {
          delete errors.stock;
        }
        break;

      case 'description':
        if (value && value.trim().length > 500) {
          errors.description = 'Description must be less than 500 characters';
        } else {
          delete errors.description;
        }
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const r = await masterInventoryService.getDashboard({ type: 'product' });
      if (r?.data) {
        const productCount = r.data.byType?.product || 0;
        setDashboard({ totalItems: productCount, byDept: r.data.byDept || {} });
      }
    } catch { err('Failed to load dashboard'); }
    finally { setLoading(false); }
  }, []);

  const loadItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit, search, type: 'product' };
      if (deptFilter) params.department = deptFilter;
      const r = await masterInventoryService.getAll(params);
      if (r?.data) {
        setItems(r.data);
        setPag(r.pagination);
      }
    } catch { err('Failed to load items'); }
    finally { setLoading(false); }
  }, [search, deptFilter, limit]);

  useEffect(() => {
    loadDashboard();
    loadItems();
  }, []);

  useEffect(() => {
    loadItems();
  }, [search, deptFilter, loadItems]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setEditingId(null);
    setEditData(null);
    setIsAddingNew(false);
  };

  const handleStartEdit = () => {
    if (selectedItem) {
      setEditingId(selectedItem._id);
      setEditData({ ...selectedItem });
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.name.trim()) {
      err('Name is required');
      return;
    }
    try {
      await masterInventoryService.update(editingId, editData);
      ok('Product updated');
      setEditingId(null);
      setEditData(null);
      loadItems();
      loadDashboard();
      const updatedItem = items.find(i => i._id === editingId);
      if (updatedItem) {
        setSelectedItem({ ...updatedItem, ...editData });
      }
    } catch {
      err('Failed to update product');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleCreateProduct = async () => {
    // Clear previous errors
    setFieldErrors({});
    setError('');

    // Validation - field specific
    if (!formData.name.trim()) {
      setFieldError('name', 'Product Name is required');
      return;
    }
    if (formData.name.trim().length < 3) {
      setFieldError('name', 'Product Name must be at least 3 characters');
      return;
    }
    if (formData.name.trim().length > 100) {
      setFieldError('name', 'Product Name must be less than 100 characters');
      return;
    }
    if (!/^[a-zA-Z0-9\s\-_.()&]+$/.test(formData.name.trim())) {
      setFieldError('name', 'Product Name contains invalid characters');
      return;
    }
    if (!formData.department) {
      setFieldError('department', 'Department is required');
      return;
    }
    if (formData.sku && formData.sku.trim() && !/^[a-zA-Z0-9\-_]+$/.test(formData.sku.trim())) {
      setFieldError('sku', 'SKU can only contain letters, numbers, hyphens and underscores');
      return;
    }
    if (formData.category && formData.category.trim() && formData.category.trim().length < 2) {
      setFieldError('category', 'Category must be at least 2 characters');
      return;
    }
    if (formData.productPrice && (isNaN(formData.productPrice) || parseFloat(formData.productPrice) < 0)) {
      setFieldError('productPrice', 'Price must be a valid positive number');
      return;
    }
    if (formData.stock && (isNaN(formData.stock) || parseInt(formData.stock) < 0)) {
      setFieldError('stock', 'Stock must be a valid positive number');
      return;
    }
    if (formData.description && formData.description.trim().length > 500) {
      setFieldError('description', 'Description must be less than 500 characters');
      return;
    }

    setFormSubmitting(true);
    try {
      await masterInventoryService.create({
        ...formData,
        type: 'product',
        productPrice: parseInt(formData.productPrice) || 0,
        stock: parseInt(formData.stock) || 0
      });
      ok('✅ Product created successfully');
      setIsAddingNew(false);
      setFormData({ name: '', type: 'product', department: 'sales', status: 'new', description: '', sku: '', category: '', productPrice: 0, stock: 0, quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: '' });
      loadItems();
      loadDashboard();
    } catch (error) {
      err(error?.response?.data?.message || 'Failed to create product');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setFormData({ name: '', type: 'product', department: 'sales', status: 'new', description: '', sku: '', category: '', productPrice: 0, stock: 0, quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await masterInventoryService.delete(id);
      ok('Product deleted');
      if (selectedItem?._id === id) {
        setSelectedItem(null);
        setEditingId(null);
      }
      loadItems();
      loadDashboard();
    } catch { err('Failed to delete'); }
  };

  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const data = await groupService.getGroups();
      setGroups(Array.isArray(data) ? data : data?.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleAssignClick = async () => {
    await loadGroups();
    setShowAssignModal(true);
  };

  const handleGroupSelect = async (groupId) => {
    setSelectedGroup(groupId);
    try {
      const data = await groupService.getGroup(groupId);
      const members = data.members || [];
      setGroupMembers(members);
      setSelectedMembers(members.map(m => m._id));
    } catch (error) {
      console.error('Error loading group members:', error);
      setGroupMembers([]);
    }
  };

  const handleAssignMembers = async () => {
    if (!selectedGroup || selectedMembers.length === 0 || !selectedItem) return;
    try {
      const memberNames = groupMembers
        .filter(m => selectedMembers.includes(m._id))
        .map(m => `${m.firstName} ${m.lastName}`)
        .join(', ');

      await masterInventoryService.update(selectedItem._id, {
        ...selectedItem,
        assignedGroup: selectedGroup,
        assignedMembers: selectedMembers,
        assignedToName: memberNames
      });
      ok(`Assigned to ${memberNames}`);
      setShowAssignModal(false);
      setSelectedGroup(null);
      setSelectedMembers([]);
      setGroupMembers([]);
      loadItems();
    } catch {
      err('Failed to assign product');
    }
  };

  const handleRelocateDept = async () => {
    if (!selectedRelocateDept || !selectedItem) return;
    try {
      await masterInventoryService.update(selectedItem._id, {
        ...selectedItem,
        department: selectedRelocateDept
      });
      ok(`Relocated to ${selectedRelocateDept}`);
      setShowRelocateModal(false);
      setSelectedRelocateDept(null);
      loadItems();
      const updatedItem = items.find(i => i._id === selectedItem._id);
      if (updatedItem) {
        setSelectedItem({ ...updatedItem, department: selectedRelocateDept });
      }
    } catch {
      err('Failed to relocate product');
    }
  };

  if (fromTab && loading && !items.length) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading products...</div>;
  }

  const content = (
    <>
      <style>{`
        @media (max-width: 768px) {
          .pi-container { flex-direction: column !important; }
          .pi-right-wrapper { order: 1 !important; }
          .pi-detail-panel { flex: 0 0 100% !important; border-right: none !important; border-bottom: 1px solid #e2e8f0 !important; order: 2 !important; }
        }
      `}</style>
      <div className="pi-container" style={{ display: 'flex', minHeight: 'calc(100vh - 200px)', gap: '0' }}>
        {/* LEFT: Detail Panel */}
        {(selectedItem || isAddingNew) && (
          <div className="pi-detail-panel" style={{ flex: '0 0 35%', background: '#f8fafc', borderRight: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 50%,#312e81 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'linear-gradient(135deg,#4f46e5 0%,#6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📦</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#fff' }}>{isAddingNew ? 'Add New Product' : selectedItem.name}</h3>
              </div>
            </div>
            <button onClick={() => { isAddingNew ? handleCancelAdd() : setSelectedItem(null); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', color: '#fff', borderRadius: '5px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
          </div>

          {isAddingNew ? (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({...formData, name: e.target.value});
                    clearFieldError('name');
                  }}
                  placeholder="Product name"
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.name ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px',
                    outline: 'none'
                  }}
                />
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', textAlign: 'right' }}>
                  {formData.name.length}/100 characters
                </div>
                {fieldErrors.name && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>✕ {fieldErrors.name}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, sku: val});
                    validateField('sku', val);
                  }}
                  placeholder="SKU"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.sku ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.sku && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.sku}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, category: val});
                    validateField('category', val);
                  }}
                  placeholder="Category"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.category ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.category && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.category}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Price</label>
                <input
                  type="number"
                  value={formData.productPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, productPrice: val});
                    validateField('productPrice', val);
                  }}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.productPrice ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.productPrice && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.productPrice}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, stock: val});
                    validateField('stock', val);
                  }}
                  placeholder="0"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.stock ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.stock && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.stock}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Department</label>
                <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="sales">Sales</option>
                  <option value="operations">Operations</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="new">New</option>
                  <option value="quoted">Quoted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, description: val});
                    validateField('description', val);
                  }}
                  placeholder="Product description"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.description ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    minHeight: '60px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.description && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.description}</div>
                )}
              </div>
            </div>
          ) : !editingId && (
            <div style={{ padding: '0', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', fontSize: '11px' }}>
              <div style={{ padding: '10px 12px', borderRight: '1px solid #e2e8f0', textAlign: 'center', background: '#fff' }}>
                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Category</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{selectedItem.category || '-'}</div>
              </div>
              <div style={{ padding: '10px 12px', borderRight: '1px solid #e2e8f0', textAlign: 'center', background: '#f8fafc' }}>
                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>SKU</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginTop: '4px', fontFamily: 'monospace' }}>{selectedItem.sku || '-'}</div>
              </div>
              <div style={{ padding: '10px 12px', textAlign: 'center', background: '#fff' }}>
                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Amount</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>₹{selectedItem.productPrice || 0}</div>
              </div>
            </div>
          )}

          {editingId ? (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Name *</label>
                <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>SKU</label>
                <input type="text" value={editData.sku} onChange={(e) => setEditData({...editData, sku: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Category</label>
                <input type="text" value={editData.category} onChange={(e) => setEditData({...editData, category: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Price</label>
                <input type="number" value={editData.productPrice} onChange={(e) => setEditData({...editData, productPrice: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Stock</label>
                <input type="number" value={editData.stock} onChange={(e) => setEditData({...editData, stock: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Department</label>
                <select value={editData.department} onChange={(e) => setEditData({...editData, department: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="sales">Sales</option>
                  <option value="operations">Operations</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Status</label>
                <select value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="new">New</option>
                  <option value="quoted">Quoted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Description</label>
                <textarea value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', minHeight: '60px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Quoted Amount</label>
                <input type="number" value={editData.quotedAmount} onChange={(e) => setEditData({...editData, quotedAmount: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Won Amount</label>
                <input type="number" value={editData.wonAmount} onChange={(e) => setEditData({...editData, wonAmount: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
            </div>
          ) : !isAddingNew && (
            <div style={{ flex: 1, padding: '0', overflowY: 'auto' }}>
              <div style={{ marginBottom: '0', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ padding: '10px 12px', borderLeft: '3px solid #6366f1', background: '#fff' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Basic Info</h4>
                  {selectedItem.serialNumber && (
                    <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#6366f1', fontWeight: '700', fontFamily: 'monospace' }}>SN: {selectedItem.serialNumber}</p>
                  )}
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#0f172a', fontWeight: '600' }}>{selectedItem.name}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>{selectedItem.description || '-'}</p>
                </div>
              </div>
              <div style={{ marginBottom: '0', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ padding: '10px 12px', borderLeft: '3px solid #0891b2', background: '#fff' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: '700', color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product Details</h4>
                  <div style={{ fontSize: '11px', color: '#0f172a', marginBottom: '3px' }}><span style={{ fontWeight: '600' }}>SKU:</span> {selectedItem.sku || '-'}</div>
                  <div style={{ fontSize: '11px', color: '#0f172a', marginBottom: '3px' }}><span style={{ fontWeight: '600' }}>Stock:</span> {selectedItem.stock || 0}</div>
                  <div style={{ fontSize: '11px', color: '#0f172a' }}><span style={{ fontWeight: '600' }}>Price:</span> ₹{selectedItem.productPrice || 0}</div>
                </div>
              </div>
              {selectedItem.quotedAmount > 0 && (
                <div style={{ marginBottom: '0' }}>
                  <div style={{ padding: '10px 12px', borderLeft: '3px solid #10b981', background: '#fff' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial</h4>
                    <div style={{ fontSize: '11px', color: '#0f172a', marginBottom: '3px' }}><span style={{ fontWeight: '600' }}>Quoted:</span> ₹{selectedItem.quotedAmount}</div>
                    <div style={{ fontSize: '11px', color: '#0f172a' }}><span style={{ fontWeight: '600' }}>Won:</span> ₹{selectedItem.wonAmount || 0}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: '8px', flexDirection: 'column' }}>
            {isAddingNew ? (
              <>
                <button onClick={handleCreateProduct} disabled={formSubmitting} style={{ width: '100%', padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{formSubmitting ? 'Creating...' : '+ Create'}</button>
                <button onClick={handleCancelAdd} style={{ width: '100%', padding: '8px', background: '#f3f4f6', color: '#64748b', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              </>
            ) : editingId ? (
              <>
                <button onClick={handleSaveEdit} style={{ width: '100%', padding: '8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Save Changes</button>
                <button onClick={handleCancelEdit} style={{ width: '100%', padding: '8px', background: '#f3f4f6', color: '#64748b', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              </>
            ) : (
              <>
                <button onClick={handleAssignClick} style={{ width: '100%', padding: '8px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Users size={14} /> Assign</button>
                <button onClick={() => setShowRelocateModal(true)} style={{ width: '100%', padding: '8px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><ArrowRight size={14} /> Relocate</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', minWidth: '500px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>Assign Product</h3>

            {!selectedGroup ? (
              <>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Select Team/Group</h4>
                {loadingGroups ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Loading groups...</div>
                ) : groups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No groups found</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {groups.map(group => (
                      <div
                        key={group._id}
                        onClick={() => handleGroupSelect(group._id)}
                        style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s', textAlign: 'center' }}
                      >
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{group.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{group.members?.length || 0} members</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Select Members</h4>
                <div style={{ marginBottom: '12px', padding: '8px', background: '#f0fdf4', borderRadius: '4px', fontSize: '12px', color: '#166534' }}>
                  Group: <strong>{groups.find(g => g._id === selectedGroup)?.name}</strong>
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px' }}>
                  {groupMembers.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>No members in this group</div>
                  ) : (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          checked={selectedMembers.length === groupMembers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers(groupMembers.map(m => m._id));
                            } else {
                              setSelectedMembers([]);
                            }
                          }}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        Select All ({selectedMembers.length}/{groupMembers.length})
                      </label>
                      {groupMembers.map(member => (
                        <label key={member._id} style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', borderRadius: '4px', background: selectedMembers.includes(member._id) ? '#f3e8ff' : 'transparent' }}>
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembers([...selectedMembers, member._id]);
                              } else {
                                setSelectedMembers(selectedMembers.filter(id => id !== member._id));
                              }
                            }}
                            style={{ marginRight: '8px', cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{member.firstName} {member.lastName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{member.email}</div>
                          </div>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {selectedGroup && (
                <button onClick={() => { setSelectedGroup(null); setSelectedMembers([]); }} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>← Back</button>
              )}
              <button onClick={() => { setShowAssignModal(false); setSelectedGroup(null); setSelectedMembers([]); }} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              {selectedGroup && (
                <button onClick={handleAssignMembers} disabled={selectedMembers.length === 0} style={{ padding: '8px 16px', background: selectedMembers.length > 0 ? '#8b5cf6' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: selectedMembers.length > 0 ? 'pointer' : 'not-allowed' }}>Assign ({selectedMembers.length})</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RELOCATE MODAL */}
      {showRelocateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', minWidth: '400px', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>Relocate Product to Department</h3>
            <div style={{ marginBottom: '16px' }}>
              {['sales', 'operations'].map(dept => (
                <div key={dept} onClick={() => setSelectedRelocateDept(dept)} style={{ padding: '12px', border: selectedRelocateDept === dept ? '2px solid #f59e0b' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px', background: selectedRelocateDept === dept ? '#fffbeb' : '#f8fafc', transition: 'all 0.2s' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a', textTransform: 'capitalize' }}>{dept.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowRelocateModal(false); setSelectedRelocateDept(null); }} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRelocateDept} disabled={!selectedRelocateDept} style={{ padding: '8px 16px', background: selectedRelocateDept ? '#f59e0b' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: selectedRelocateDept ? 'pointer' : 'not-allowed' }}>Relocate</button>
            </div>
          </div>
        </div>
      )}

        {/* RIGHT: Stats + Content */}
        <div className="pi-right-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Stats Wrapper */}
        {dashboard && (
          <div className="pi-stats-wrapper" style={{ background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '20px 20px 12px 20px', position: 'sticky', top: '0', zIndex: 20 }}>
            {[
              { label: 'Total Products', value: dashboard.totalItems || 0, bg: 'linear-gradient(135deg, #14b8a6, #0d9488)', dept: '' },
              { label: 'Sales Team', value: dashboard.byDept?.sales || 0, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', dept: 'sales' },
              { label: 'Operations Team', value: dashboard.byDept?.operations || 0, bg: 'linear-gradient(135deg, #f59e0b, #d97706)', dept: 'operations' }
            ].map((stat, i) => (
              <div key={i} onClick={(e) => { e.preventDefault(); setSearch(''); setDeptFilter(stat.dept); }} style={{ padding: '12px', background: stat.bg, borderRadius: '6px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{stat.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
          </div>
        )}

        {/* Content Panel - Search, Filters & Table */}
        <div className="pi-content-panel" style={{ display: 'flex', flexDirection: 'column', padding: '0' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center', padding: '0 20px' }}>
          {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '10px', borderRadius: '4px', marginBottom: '15px', width: '100%' }}>✓ {success}</div>}
          <button onClick={() => setIsAddingNew(true)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add Product</button>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', minWidth: '140px' }}>
            <option value="">All Departments</option>
            <option value="sales">Sales</option>
            <option value="operations">Operations</option>
          </select>
        </div>


        <div style={{ overflowX: 'auto', padding: '0 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', background: '#1e293b' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Serial No.</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SKU</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No products found</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#6366f1', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer', fontWeight: '700' }}>{item.serialNumber || '—'}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a', cursor: 'pointer', fontWeight: '600' }}>{item.name}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a', fontSize: '12px', fontFamily: 'monospace', cursor: 'pointer', fontWeight: '600' }}>{item.sku || '-'}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#64748b', cursor: 'pointer' }}>{item.category || '-'}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', cursor: 'pointer' }}>
                      <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>
                        {item.department?.replace('_', ' ') || 'sales'}
                      </span>
                    </td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a', textAlign: 'right', cursor: 'pointer', fontWeight: '700' }}>₹{item.productPrice || 0}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: item.stock > 0 ? '#059669' : '#dc2626', textAlign: 'right', fontWeight: '700', cursor: 'pointer' }}>{item.stock || 0}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', cursor: 'pointer' }}><span style={{ background: item.status === 'new' ? '#e0e7ff' : item.status === 'quoted' ? '#fef3c7' : item.status === 'won' ? '#d1fae5' : '#fee2e2', color: item.status === 'new' ? '#4f46e5' : item.status === 'quoted' ? '#d97706' : item.status === 'won' ? '#059669' : '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{item.status}</span></td>
                    <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleSelectItem(item); setEditingId(item._id); setEditData({...item}); }} style={{ background: 'rgba(59,130,246,0.1)', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '6px 8px', borderRadius: '4px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'rgba(59,130,246,0.2)'} onMouseLeave={(e) => e.target.style.background = 'rgba(59,130,246,0.1)'} title="Edit"><Edit2 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px 8px', borderRadius: '4px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'rgba(239,68,68,0.2)'} onMouseLeave={(e) => e.target.style.background = 'rgba(239,68,68,0.1)'} title="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          background: '#fafafa',
          marginTop: '20px'
        }}>
          {/* Left: Count & Rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              Showing <strong>{((pag.page - 1) * limit) + 1}-{Math.min(pag.page * limit, pag.total)}</strong> of <strong>{pag.total}</strong>
            </span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPag(p => ({ ...p, page: 1 })); }}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: '#fff',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>

          {/* Right: Page controls */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => loadItems(pag.page - 1)}
              disabled={pag.page === 1}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '600',
                border: '1px solid #e2e8f0',
                borderRadius: '7px',
                background: pag.page === 1 ? '#f8fafc' : '#fff',
                color: pag.page === 1 ? '#cbd5e1' : '#475569',
                cursor: pag.page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Previous
            </button>
            <span style={{ padding: '7px 12px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
              Page {pag.page} of {pag.pages}
            </span>
            <button
              onClick={() => loadItems(pag.page + 1)}
              disabled={pag.page === pag.pages}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '600',
                border: '1px solid #e2e8f0',
                borderRadius: '7px',
                background: pag.page === pag.pages ? '#f8fafc' : '#fff',
                color: pag.page === pag.pages ? '#cbd5e1' : '#475569',
                cursor: pag.page === pag.pages ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>
          </div>
        </div>
        </div>
        </div>
      </div>
    </>
  );

  if (!fromTab) {
    return (
      <DashboardLayout title="Product Inventory">
        {content}
      </DashboardLayout>
    );
  }

  return content;
}
