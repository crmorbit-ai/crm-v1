import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import masterInventoryService from '../services/masterInventoryService';
import { groupService } from '../services/groupService';
import { Search, Edit2, Trash2, ArrowRight, Users } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function LeadInventory({ fromTab }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [items, setItems] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [pag, setPag] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

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
    name: '', type: 'lead', department: 'lead_generation', status: 'new', description: '',
    leadEmail: '', leadPhone: '', leadSource: '', quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const ok = m => { setSuccess(m); setTimeout(() => setSuccess(''), 3000); };
  const err = m => { setError(m); setTimeout(() => setError(''), 4000); };

  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };

    switch(fieldName) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Lead name is required';
        } else if (value.trim().length < 3) {
          errors.name = 'Lead name must be at least 3 characters';
        } else if (value.trim().length > 100) {
          errors.name = 'Lead name must be less than 100 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors.name = 'Lead name can only contain letters and spaces';
        } else {
          delete errors.name;
        }
        break;

      case 'leadEmail':
        if (!value || !value.trim()) {
          errors.leadEmail = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors.leadEmail = 'Please enter a valid email address';
        } else {
          delete errors.leadEmail;
        }
        break;

      case 'leadPhone':
        if (value && value.trim()) {
          const cleanPhone = value.replace(/\D/g, '');
          if (cleanPhone.length !== 10) {
            errors.leadPhone = 'Please enter a valid 10-digit phone number';
          } else {
            delete errors.leadPhone;
          }
        } else {
          delete errors.leadPhone;
        }
        break;

      case 'leadSource':
        if (value && value.trim() && value.trim().length < 2) {
          errors.leadSource = 'Lead source must be at least 2 characters';
        } else {
          delete errors.leadSource;
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
      const r = await masterInventoryService.getDashboard({ type: 'lead' });
      if (r?.data) {
        const leadCount = r.data.byType?.lead || 0;
        setDashboard({ totalItems: leadCount, byDept: r.data.byDept || {} });
      }
    } catch { err('Failed to load dashboard'); }
    finally { setLoading(false); }
  }, []);

  const loadItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 50, search, type: 'lead' };
      if (deptFilter) params.department = deptFilter;
      const r = await masterInventoryService.getAll(params);
      if (r?.data) {
        setItems(r.data);
        setPag(r.pagination);
      }
    } catch { err('Failed to load items'); }
    finally { setLoading(false); }
  }, [search, deptFilter]);

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
      ok('Lead updated');
      setEditingId(null);
      setEditData(null);
      loadItems();
      loadDashboard();
      const updatedItem = items.find(i => i._id === editingId);
      if (updatedItem) {
        setSelectedItem({ ...updatedItem, ...editData });
      }
    } catch {
      err('Failed to update lead');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleCreateLead = async () => {
    // Validation
    if (!formData.name.trim()) {
      err('❌ Lead Name is required');
      return;
    }
    if (formData.name.trim().length < 3) {
      err('❌ Lead Name must be at least 3 characters');
      return;
    }
    if (formData.name.trim().length > 100) {
      err('❌ Lead Name must be less than 100 characters');
      return;
    }
    if (!/^[a-zA-Z0-9\s\-_.()&]+$/.test(formData.name.trim())) {
      err('❌ Lead Name contains invalid characters');
      return;
    }
    if (!formData.department) {
      err('❌ Department is required');
      return;
    }
    if (!formData.leadEmail || !formData.leadEmail.trim()) {
      err('❌ Email is required for leads');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.leadEmail.trim())) {
      err('❌ Please enter a valid email address');
      return;
    }
    if (formData.leadPhone && formData.leadPhone.trim()) {
      const cleanPhone = formData.leadPhone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        err('❌ Please enter a valid 10-digit phone number');
        return;
      }
    }
    if (formData.leadSource && formData.leadSource.trim() && formData.leadSource.trim().length < 2) {
      err('❌ Lead Source must be at least 2 characters');
      return;
    }
    if (formData.description && formData.description.trim().length > 500) {
      err('❌ Description must be less than 500 characters');
      return;
    }

    setFormSubmitting(true);
    try {
      await masterInventoryService.create({...formData, type: 'lead'});
      ok('✅ Lead created successfully');
      setIsAddingNew(false);
      setSelectedItem(null);
      setFormData({
        name: '', type: 'lead', department: 'lead_generation', status: 'new', description: '',
        leadEmail: '', leadPhone: '', leadSource: '', quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: ''
      });
      loadItems();
      loadDashboard();
    } catch (error) {
      err(error?.response?.data?.message || 'Failed to create lead');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setFormData({
      name: '', type: 'lead', department: 'lead_generation', status: 'new', description: '',
      leadEmail: '', leadPhone: '', leadSource: '', quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await masterInventoryService.delete(id);
      ok('Lead deleted');
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
      err('Failed to assign lead');
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
      err('Failed to relocate lead');
    }
  };

  if (fromTab && loading && !items.length) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading leads...</div>;
  }

  const content = (
    <>
      <style>{`
        @media (max-width: 768px) {
          .li-container { flex-direction: column !important; }
          .li-detail-panel { flex: 0 0 100% !important; border-right: none !important; border-bottom: 1px solid #e2e8f0 !important; }
          .li-content-panel { flex: 0 0 100% !important; }
        }
      `}</style>
      <div className="li-container" style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: '0' }}>
        {/* LEFT: Detail Panel */}
        {(selectedItem || isAddingNew) && (
          <div className="li-detail-panel" style={{ flex: '0 0 35%', background: '#f8fafc', borderRight: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {!isAddingNew && !editingId && selectedItem && (
            <>
              <div style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 50%,#312e81 100%)', padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: '700' }}>
                    {selectedItem.name?.[0]?.toUpperCase() || 'L'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#fff' }}>{selectedItem.name}</h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>Lead</span>
                      <span style={{ background: selectedItem.status === 'new' ? 'rgba(229, 231, 235, 0.3)' : selectedItem.status === 'quoted' ? 'rgba(254, 243, 199, 0.3)' : selectedItem.status === 'won' ? 'rgba(209, 250, 229, 0.3)' : 'rgba(254, 226, 226, 0.3)', color: selectedItem.status === 'new' ? '#e0e7ff' : selectedItem.status === 'quoted' ? '#fef3c7' : selectedItem.status === 'won' ? '#d1fae5' : '#fee2e2', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{selectedItem.status}</span>
                      {selectedItem.quotedAmount > 0 && <span style={{ background: 'rgba(34, 197, 94, 0.3)', color: '#86efac', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>₹{selectedItem.quotedAmount}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => { setSelectedItem(null); setIsAddingNew(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>✕</button>
              </div>

              <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '11px' }}>
                <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontWeight: '600', fontSize: '10px' }}>SOURCE</div>
                  <div style={{ color: '#0f172a', fontWeight: '700', marginTop: '4px' }}>{selectedItem.leadSource || '-'}</div>
                </div>
                <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontWeight: '600', fontSize: '10px' }}>STATUS</div>
                  <div style={{ color: '#0f172a', fontWeight: '700', marginTop: '4px', textTransform: 'capitalize' }}>{selectedItem.status}</div>
                </div>
                <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontWeight: '600', fontSize: '10px' }}>AMOUNT</div>
                  <div style={{ color: '#0f172a', fontWeight: '700', marginTop: '4px' }}>₹{selectedItem.quotedAmount || 0}</div>
                </div>
              </div>
            </>
          )}

          {isAddingNew && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>👤 Add New Lead</h3>
              <button onClick={() => { setIsAddingNew(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
          )}

          {editingId && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>✎ Edit Lead</h3>
              <button onClick={() => { setEditingId(null); setEditData(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
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
                  placeholder="Lead name"
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
                {fieldErrors.name && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.name}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Email *</label>
                <input
                  type="email"
                  value={formData.leadEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, leadEmail: val});
                    validateField('leadEmail', val);
                  }}
                  placeholder="email@example.com"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.leadEmail ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.leadEmail && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.leadEmail}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Phone</label>
                <input
                  type="tel"
                  value={formData.leadPhone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, leadPhone: val});
                    validateField('leadPhone', val);
                  }}
                  placeholder="10-digit phone number"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.leadPhone ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.leadPhone && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.leadPhone}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Source</label>
                <input
                  type="text"
                  value={formData.leadSource}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, leadSource: val});
                    validateField('leadSource', val);
                  }}
                  placeholder="Lead source"
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: fieldErrors.leadSource ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    marginTop: '4px'
                  }}
                />
                {fieldErrors.leadSource && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>⚠ {fieldErrors.leadSource}</div>
                )}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Department</label>
                <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="lead_generation">Lead Gen</option>
                  <option value="sales">Sales</option>
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
                  placeholder="Lead description"
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
                <input type="number" value={formData.quotedAmount} onChange={(e) => setFormData({...formData, quotedAmount: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Won Amount</label>
                <input type="number" value={formData.wonAmount} onChange={(e) => setFormData({...formData, wonAmount: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Received Amount</label>
                <input type="number" value={formData.receivedAmount} onChange={(e) => setFormData({...formData, receivedAmount: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
            </div>
          ) : editingId ? (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Name *</label>
                <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Email</label>
                <input type="email" value={editData.leadEmail} onChange={(e) => setEditData({...editData, leadEmail: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Phone</label>
                <input type="tel" value={editData.leadPhone} onChange={(e) => setEditData({...editData, leadPhone: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Source</label>
                <input type="text" value={editData.leadSource} onChange={(e) => setEditData({...editData, leadSource: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Department</label>
                <select value={editData.department} onChange={(e) => setEditData({...editData, department: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="lead_generation">Lead Gen</option>
                  <option value="sales">Sales</option>
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
          ) : !isAddingNew && !editingId && selectedItem && (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '16px', borderLeft: '3px solid #6366f1', background: 'linear-gradient(90deg,#6366f118 0%,transparent 100%)', padding: '12px 12px 12px 16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Basic Info</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px 12px', fontSize: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Name</span>
                  <span style={{ color: '#0f172a' }}>{selectedItem.name || '-'}</span>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Type</span>
                  <span style={{ color: '#0f172a', textTransform: 'capitalize' }}>Lead</span>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Description</span>
                  <span style={{ color: '#0f172a' }}>{selectedItem.description || '-'}</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px', borderLeft: '3px solid #0891b2', background: 'linear-gradient(90deg,#0891b218 0%,transparent 100%)', padding: '12px 12px 12px 16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lead Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px 12px', fontSize: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Email</span>
                  <span style={{ color: '#0f172a' }}>{selectedItem.leadEmail || '-'}</span>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Phone</span>
                  <span style={{ color: '#0f172a' }}>{selectedItem.leadPhone || '-'}</span>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Source</span>
                  <span style={{ color: '#0f172a' }}>{selectedItem.leadSource || '-'}</span>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Department</span>
                  <span style={{ color: '#0f172a', textTransform: 'capitalize' }}>{selectedItem.department || '-'}</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px', borderLeft: '3px solid #10b981', background: 'linear-gradient(90deg,#10b98118 0%,transparent 100%)', padding: '12px 12px 12px 16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px 12px', fontSize: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Quoted Amount</span>
                  <span style={{ color: '#0f172a' }}>₹{selectedItem.quotedAmount || 0}</span>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Won Amount</span>
                  <span style={{ color: '#0f172a' }}>₹{selectedItem.wonAmount || 0}</span>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Received Amount</span>
                  <span style={{ color: '#0f172a' }}>₹{selectedItem.receivedAmount || 0}</span>
                </div>
              </div>

              {selectedItem.assignedGroup && (
                <div style={{ marginBottom: '16px', borderLeft: '3px solid #8b5cf6', background: 'linear-gradient(90deg,#8b5cf618 0%,transparent 100%)', padding: '12px 12px 12px 16px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assignment</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px 12px', fontSize: '12px' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Assigned Group</span>
                    <span style={{ color: '#0f172a' }}>{selectedItem.assignedGroup || '-'}</span>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Assigned To</span>
                    <span style={{ color: '#0f172a' }}>{selectedItem.assignedToName || '-'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: '8px', flexDirection: 'column' }}>
            {isAddingNew ? (
              <>
                <button onClick={handleCreateLead} disabled={formSubmitting} style={{ width: '100%', padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{formSubmitting ? 'Creating...' : '+ Create'}</button>
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
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>Assign Lead</h3>

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
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>Relocate Lead to Department</h3>
            <div style={{ marginBottom: '16px' }}>
              {['lead_generation', 'sales'].map(dept => (
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

      {/* RIGHT: List */}
      <div className="li-content-panel" style={{ flex: selectedItem ? '1' : '1', display: 'flex', flexDirection: 'column', padding: '0' }}>
        {/* Fixed Stats Container */}
        {dashboard && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '20px 20px 12px 20px', background: '#fff', position: 'sticky', top: '0', zIndex: 20 }}>
            {[
              { label: 'Total Leads', value: dashboard.totalItems || 0, bg: 'linear-gradient(135deg, #14b8a6, #0d9488)', dept: '' },
              { label: 'Sales Dept', value: dashboard.byDept?.sales || 0, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', dept: 'sales' },
              { label: 'Lead Gen Dept', value: dashboard.byDept?.lead_generation || 0, bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', dept: 'lead_generation' }
            ].map((stat, i) => (
              <div key={i} onClick={(e) => { e.preventDefault(); setSearch(''); setDeptFilter(stat.dept); }} style={{ padding: '12px', background: stat.bg, borderRadius: '6px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center', padding: '0 20px' }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px', borderRadius: '4px', marginBottom: '15px', width: '100%' }}>✕ {error}</div>}
          {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '10px', borderRadius: '4px', marginBottom: '15px', width: '100%' }}>✓ {success}</div>}
          <button onClick={() => setIsAddingNew(true)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add Lead</button>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input type="text" placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', minWidth: '140px' }}>
            <option value="">All Departments</option>
            <option value="sales">Sales</option>
            <option value="lead_generation">Lead Gen</option>
          </select>
        </div>


        <div style={{ overflowX: 'auto', padding: '0 20px', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No leads found</td></tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item._id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'} onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f9fafb'}>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a', cursor: 'pointer', fontWeight: '500' }}>{item.name}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a', fontSize: '12px', cursor: 'pointer' }}>{item.leadEmail || '-'}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a', cursor: 'pointer' }}>{item.leadPhone || '-'}</td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', cursor: 'pointer' }}>
                      <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>
                        {item.department?.replace('_', ' ') || 'sales'}
                      </span>
                    </td>
                    <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', cursor: 'pointer' }}><span style={{ background: item.status === 'new' ? '#e0e7ff' : item.status === 'quoted' ? '#fef3c7' : item.status === 'won' ? '#d1fae5' : '#fee2e2', color: item.status === 'new' ? '#4f46e5' : item.status === 'quoted' ? '#d97706' : item.status === 'won' ? '#059669' : '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>{item.status}</span></td>
                    <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleSelectItem(item); setEditingId(item._id); setEditData({...item}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#3b82f6'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'} title="Edit"><Edit2 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#ef4444'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'} title="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pag.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px', padding: '0 20px' }}>
            <button onClick={() => loadItems(pag.page - 1)} disabled={pag.page === 1} style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: pag.page === 1 ? 'default' : 'pointer', opacity: pag.page === 1 ? 0.5 : 1 }}>Prev</button>
            <div style={{ padding: '6px 12px', fontSize: '12px' }}>Page {pag.page} of {pag.pages}</div>
            <button onClick={() => loadItems(pag.page + 1)} disabled={pag.page === pag.pages} style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: pag.page === pag.pages ? 'default' : 'pointer', opacity: pag.page === pag.pages ? 0.5 : 1 }}>Next</button>
          </div>
        )}
      </div>
    </div>
    </>
  );

  if (!fromTab) {
    return (
      <DashboardLayout title="Lead Inventory">
        {content}
      </DashboardLayout>
    );
  }

  return content;
}
