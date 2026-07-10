import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import masterInventoryService from '../services/masterInventoryService';
import { groupService } from '../services/groupService';
import { Search, Edit2, Trash2, ArrowRight, Users, X, Clock, DollarSign, Activity } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function ServiceInventory({ fromTab }) {
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

  // 🆕 Bulk selection states
  const [selectedItems, setSelectedItems] = useState([]);

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
    name: '', type: 'service', department: 'service', status: 'new', description: '',
    serviceType: '', duration: '', serviceRate: 0, quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: ''
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
          errors.name = 'Service name is required';
        } else if (value.trim().length < 3) {
          errors.name = 'Service name must be at least 3 characters';
        } else if (value.trim().length > 100) {
          errors.name = 'Service name must be less than 100 characters';
        } else if (!/^[a-zA-Z0-9\s\-_.()&]+$/.test(value.trim())) {
          errors.name = 'Invalid characters in service name';
        } else {
          delete errors.name;
        }
        break;

      case 'serviceType':
        if (value && value.trim() && value.trim().length < 2) {
          errors.serviceType = 'Service type must be at least 2 characters';
        } else {
          delete errors.serviceType;
        }
        break;

      case 'duration':
        if (value && value.trim() && !/^[0-9\s]+[a-zA-Z\s]+$/.test(value.trim())) {
          errors.duration = 'Duration format invalid (e.g., "2 hours")';
        } else {
          delete errors.duration;
        }
        break;

      case 'serviceRate':
        if (value && (isNaN(value) || parseFloat(value) < 0)) {
          errors.serviceRate = 'Rate must be a valid positive number';
        } else {
          delete errors.serviceRate;
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
      const r = await masterInventoryService.getDashboard({ type: 'service' });
      if (r?.data) {
        const serviceCount = r.data.byType?.service || 0;
        setDashboard({ totalItems: serviceCount, byDept: r.data.byDept || {} });
      }
    } catch { err('Failed to load dashboard'); }
    finally { setLoading(false); }
  }, []);

  const loadItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit, search, type: 'service' };
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
  }, [search, deptFilter, limit, loadItems]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setEditingId(null);
    setEditData(null);
  };

  // 🆕 Bulk selection handlers
  const handleToggleSelectItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item._id));
    }
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
      ok('Service updated');
      setEditingId(null);
      setEditData(null);
      loadItems();
      loadDashboard();
      const updatedItem = items.find(i => i._id === editingId);
      if (updatedItem) {
        setSelectedItem({ ...updatedItem, ...editData });
      }
    } catch {
      err('Failed to update service');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleCreateService = async () => {
    // Clear previous errors
    setFieldErrors({});
    setError('');

    // Validation - field specific
    if (!formData.name.trim()) {
      setFieldError('name', 'Service Name is required');
      return;
    }
    if (formData.name.trim().length < 3) {
      setFieldError('name', 'Service Name must be at least 3 characters');
      return;
    }
    if (formData.name.trim().length > 100) {
      setFieldError('name', 'Service Name must be less than 100 characters');
      return;
    }
    if (!/^[a-zA-Z0-9\s\-_.()&]+$/.test(formData.name.trim())) {
      setFieldError('name', 'Service Name contains invalid characters');
      return;
    }
    if (!formData.department) {
      setFieldError('department', 'Department is required');
      return;
    }
    if (formData.serviceType && formData.serviceType.trim() && formData.serviceType.trim().length < 2) {
      setFieldError('serviceType', 'Service Type must be at least 2 characters');
      return;
    }
    if (formData.duration && formData.duration.trim() && !/^[0-9\s]+[a-zA-Z\s]+$/.test(formData.duration.trim())) {
      setFieldError('duration', 'Duration format invalid (e.g., "2 hours", "30 mins")');
      return;
    }
    if (formData.serviceRate && (isNaN(formData.serviceRate) || parseFloat(formData.serviceRate) < 0)) {
      setFieldError('serviceRate', 'Service Rate must be a valid positive number');
      return;
    }
    if (formData.description && formData.description.trim().length > 500) {
      err('❌ Description must be less than 500 characters');
      return;
    }

    setFormSubmitting(true);
    try {
      await masterInventoryService.create({...formData, type: 'service'});
      ok('✅ Service created successfully');
      setIsAddingNew(false);
      setFormData({ name: '', type: 'service', department: 'service', status: 'new', description: '', serviceType: '', duration: '', serviceRate: 0, quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: '' });
      loadItems();
      loadDashboard();
    } catch (error) {
      err(error?.response?.data?.message || 'Failed to create service');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setFormData({ name: '', type: 'service', department: 'service', status: 'new', description: '', serviceType: '', duration: '', serviceRate: 0, quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await masterInventoryService.delete(id);
      ok('Service deleted');
      if (selectedItem?._id === id) {
        setSelectedItem(null);
        setEditingId(null);
      }
      loadItems();
      loadDashboard();
    } catch { err('Failed to delete'); }
  };

  // 🆕 Bulk delete selected items
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      err('No items selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedItems.length} selected service${selectedItems.length > 1 ? 's' : ''}?`)) {
      return;
    }

    try {
      await Promise.all(selectedItems.map(id => masterInventoryService.delete(id)));
      ok(`${selectedItems.length} service${selectedItems.length > 1 ? 's' : ''} deleted successfully`);
      setSelectedItems([]);
      if (selectedItem && selectedItems.includes(selectedItem._id)) {
        setSelectedItem(null);
        setEditingId(null);
      }
      loadItems();
      loadDashboard();
    } catch (error) {
      err('Failed to delete some items');
    }
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
      err('Failed to assign service');
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
      err('Failed to relocate service');
    }
  };

  if (fromTab && loading && !items.length) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading services...</div>;
  }

  const content = (
    <>
      <style>{`
        @media (max-width: 768px) {
          .si-container { flex-direction: column !important; }
          .si-right-wrapper { order: 1 !important; }
          .si-detail-panel { flex: 0 0 100% !important; border-right: none !important; border-bottom: 1px solid #e2e8f0 !important; order: 2 !important; }
        }
      `}</style>
      <div className="si-container" style={{ display: 'flex', minHeight: 'calc(100vh - 200px)', gap: '0' }}>
        {/* LEFT: Detail Panel */}
        {(selectedItem || isAddingNew) && (
          <div className="si-detail-panel" style={{ flex: '0 0 35%', background: '#f8fafc', borderRight: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Header with Dark Gradient */}
          <div style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 50%,#312e81 100%)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              {/* Avatar with Violet Gradient for Services */}
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg,#8b5cf6 0%,#6366f1 50%,#0891b2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🔧</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isAddingNew ? 'Add New Service' : selectedItem.name}</div>
                <div style={{ fontSize: '10px', color: '#8b9ccc', marginTop: '2px' }}>{isAddingNew ? 'Service' : selectedItem.serviceType || '-'}</div>
              </div>
            </div>
            <button onClick={() => { isAddingNew ? handleCancelAdd() : setSelectedItem(null); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '5px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', flexShrink: 0, padding: 0 }}>✕</button>
          </div>

          {/* KPI Row - 3 Column Grid */}
          {!isAddingNew && !editingId && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ background: '#fff', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Type / Duration</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{selectedItem.serviceType || '-'}</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{selectedItem.duration || '-'}</div>
              </div>
              <div style={{ background: '#fffbeb', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Status</div>
                <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '4px' }}>
                  <span style={{ background: selectedItem.status === 'new' ? '#e0e7ff' : selectedItem.status === 'quoted' ? '#fef3c7' : selectedItem.status === 'won' ? '#d1fae5' : '#fee2e2', color: selectedItem.status === 'new' ? '#4f46e5' : selectedItem.status === 'quoted' ? '#d97706' : selectedItem.status === 'won' ? '#059669' : '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', textTransform: 'capitalize' }}>{selectedItem.status}</span>
                </div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Rate</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>₹{selectedItem.serviceRate || 0}</div>
              </div>
            </div>
          )}

          {isAddingNew ? (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, name: val});
                    validateField('name', val);
                  }}
                  placeholder="Service name"
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.name ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', textAlign: 'right' }}>
                  {formData.name.length}/100 characters
                </div>
                {fieldErrors.name && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.name}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Service Type</label>
                <input
                  type="text"
                  value={formData.serviceType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, serviceType: val});
                    validateField('serviceType', val);
                  }}
                  placeholder="Type of service"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.serviceType ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.serviceType && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.serviceType}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, duration: val});
                    validateField('duration', val);
                  }}
                  placeholder="e.g., 1 hour, 2 days"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.duration ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.duration && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.duration}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Rate</label>
                <input
                  type="number"
                  value={formData.serviceRate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, serviceRate: val});
                    validateField('serviceRate', val);
                  }}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.serviceRate ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.serviceRate && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.serviceRate}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Department</label>
                <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="service">Service</option>
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
                  placeholder="Service description"
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
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Quoted Amount</label>
                <input type="number" value={formData.quotedAmount} onChange={(e) => setFormData({...formData, quotedAmount: parseInt(e.target.value) || 0})} placeholder="0" style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Won Amount</label>
                <input type="number" value={formData.wonAmount} onChange={(e) => setFormData({...formData, wonAmount: parseInt(e.target.value) || 0})} placeholder="0" style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Received Amount</label>
                <input type="number" value={formData.receivedAmount} onChange={(e) => setFormData({...formData, receivedAmount: parseInt(e.target.value) || 0})} placeholder="0" style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
            </div>
          ) : editingId ? (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Name *</label>
                <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Service Type</label>
                <input type="text" value={editData.serviceType} onChange={(e) => setEditData({...editData, serviceType: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Duration</label>
                <input type="text" value={editData.duration} onChange={(e) => setEditData({...editData, duration: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Rate</label>
                <input type="number" value={editData.serviceRate} onChange={(e) => setEditData({...editData, serviceRate: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Department</label>
                <select value={editData.department} onChange={(e) => setEditData({...editData, department: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="service">Service</option>
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
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Received Amount</label>
                <input type="number" value={editData.receivedAmount} onChange={(e) => setEditData({...editData, receivedAmount: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
            </div>
          ) : !isAddingNew && (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {/* Basic Info Section - Indigo */}
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderLeft: '4px solid #6366f1' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Basic Info</h4>
                <div style={{ paddingLeft: '12px' }}>
                  {selectedItem.serialNumber && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Serial No:</span>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6366f1', fontWeight: '700', fontFamily: 'monospace' }}>{selectedItem.serialNumber}</p>
                    </div>
                  )}
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Name:</span>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#0f172a', fontWeight: '500' }}>{selectedItem.name}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Description:</span>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{selectedItem.description || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Service Details Section - Cyan */}
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderLeft: '4px solid #0891b2' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '700', color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service Details</h4>
                <div style={{ paddingLeft: '12px' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Type:</span>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#0f172a' }}>{selectedItem.serviceType || '-'}</p>
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Duration:</span>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#0f172a' }}>{selectedItem.duration || '-'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Rate:</span>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#0f172a', fontWeight: '600' }}>₹{selectedItem.serviceRate || 0}</p>
                  </div>
                </div>
              </div>

              {/* Financial Section - Green */}
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderLeft: '4px solid #10b981' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial</h4>
                <div style={{ paddingLeft: '12px' }}>
                  <div style={{ marginBottom: '6px', padding: '8px', background: '#f0fdf4', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Quoted:</span>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#10b981', fontWeight: '700' }}>₹{selectedItem.quotedAmount || 0}</p>
                  </div>
                  <div style={{ marginBottom: '6px', padding: '8px', background: '#f0fdf4', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Won:</span>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#10b981', fontWeight: '700' }}>₹{selectedItem.wonAmount || 0}</p>
                  </div>
                  <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Received:</span>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#10b981', fontWeight: '700' }}>₹{selectedItem.receivedAmount || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: '8px', flexDirection: 'column' }}>
            {isAddingNew ? (
              <>
                <button onClick={handleCreateService} disabled={formSubmitting} style={{ width: '100%', padding: '8px', background: formSubmitting ? '#cbd5e1' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: formSubmitting ? 'not-allowed' : 'pointer' }}>{formSubmitting ? 'Creating...' : '+ Create'}</button>
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
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>Assign Service</h3>

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
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>Relocate Service to Department</h3>
            <div style={{ marginBottom: '16px' }}>
              {['service', 'operations'].map(dept => (
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
        <div className="si-right-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Stats Wrapper */}
        {dashboard && (
          <div className="si-stats-wrapper" style={{ background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '20px 20px 12px 20px', position: 'sticky', top: '0', zIndex: 20 }}>
            {[
              { label: 'Total Services', value: dashboard.totalItems || 0, bg: 'linear-gradient(135deg, #14b8a6, #0d9488)', dept: '' },
              { label: 'Service Dept', value: dashboard.byDept?.service || 0, bg: 'linear-gradient(135deg, #f59e0b, #d97706)', dept: 'service' },
              { label: 'Operations Dept', value: dashboard.byDept?.operations || 0, bg: 'linear-gradient(135deg, #ec4899, #db2777)', dept: 'operations' }
            ].map((stat, i) => (
              <div key={i} onClick={(e) => { e.preventDefault(); setSearch(''); setDeptFilter(stat.dept); }} style={{ background: stat.bg, borderRadius: '8px', padding: '12px 14px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff', lineHeight: '1', marginBottom: '4px' }}>{stat.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
          </div>
        )}

        {/* Content Panel - Search, Filters & Table */}
        <div className="si-content-panel" style={{ display: 'flex', flexDirection: 'column', padding: '0' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center', padding: '0 20px' }}>
          {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '10px', borderRadius: '4px', marginBottom: '15px', width: '100%' }}>✓ {success}</div>}
          <button onClick={() => setIsAddingNew(true)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>+ Add Service</button>

          {/* 🆕 Bulk Delete Button */}
          {selectedItems.length > 0 && (
            <button
              onClick={handleBulkDelete}
              style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
            >
              <Trash2 size={14} />
              Delete ({selectedItems.length})
            </button>
          )}

          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', width: '13px', color: '#94a3b8' }} />
            <input type="text" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 28px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', background: '#f9fafb' }} />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', minWidth: '140px', background: '#f9fafb', fontWeight: '600', color: '#374151' }}>
            <option value="">All Departments</option>
            <option value="service">Service</option>
            <option value="operations">Operations</option>
          </select>
        </div>


        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', padding: '0 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#1e293b' }}>
                {/* 🆕 Select All Checkbox */}
                <th style={{ padding: '12px', textAlign: 'center', width: '40px', borderRight: '1px solid #334155' }}>
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedItems.length === items.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    title="Select All"
                  />
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px', borderRight: '1px solid #334155' }}>Serial No.</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px', borderRight: '1px solid #334155' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px', borderRight: '1px solid #334155' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px', borderRight: '1px solid #334155' }}>Department</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px', borderRight: '1px solid #334155' }}>Duration</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px', borderRight: '1px solid #334155' }}>Rate</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px', borderRight: '1px solid #334155' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No services found</td></tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'} onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8fafc'}>
                    {/* 🆕 Row checkbox */}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => handleToggleSelectItem(item._id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#6366f1', fontSize: '11px', fontFamily: 'monospace', fontWeight: '700' }}>{item.serialNumber || '—'}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a', fontWeight: '600' }}>{item.name}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a' }}>{item.serviceType || '-'}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px' }}>
                      <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>
                        {item.department?.replace('_', ' ') || 'sales'}
                      </span>
                    </td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a' }}>{item.duration || '-'}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a', textAlign: 'right', fontWeight: '700' }}>₹{item.serviceRate || 0}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px' }}><span style={{ background: item.status === 'new' ? '#e0e7ff' : item.status === 'quoted' ? '#fef3c7' : item.status === 'won' ? '#d1fae5' : '#fee2e2', color: item.status === 'new' ? '#4f46e5' : item.status === 'quoted' ? '#d97706' : item.status === 'won' ? '#059669' : '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{item.status}</span></td>
                    <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleSelectItem(item); setEditingId(item._id); setEditData({...item}); }} style={{ background: '#e0e7ff', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '6px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#c7d2fe'} onMouseLeave={(e) => e.currentTarget.style.background = '#e0e7ff'} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fca5a5'} onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'} title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: pag.page === 1 ? '#f8fafc' : '#fff',
                color: pag.page === 1 ? '#cbd5e1' : '#475569',
                cursor: pag.page === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ◄ Previous
            </button>
            <button
              onClick={() => loadItems(pag.page + 1)}
              disabled={pag.page === pag.pages}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: pag.page === pag.pages ? '#f8fafc' : '#fff',
                color: pag.page === pag.pages ? '#cbd5e1' : '#475569',
                cursor: pag.page === pag.pages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Next ►
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
      <DashboardLayout title="Service Inventory">
        {content}
      </DashboardLayout>
    );
  }

  return content;
}
