import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import masterInventoryService from '../services/masterInventoryService';
import { groupService } from '../services/groupService';
import { Search, Edit2, Trash2, ArrowRight, Users } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function MasterInventory({ fromTab }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [items, setItems] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [pag, setPag] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
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
    name: '', type: 'product', department: 'sales', status: 'new', description: '',
    sku: '', category: '', productPrice: 0, stock: 0,
    serviceType: '', duration: '', serviceRate: 0,
    leadName: '', leadEmail: '', leadPhone: '', leadSource: '',
    quotedAmount: 0, wonAmount: 0, receivedAmount: 0,
    notes: '', tags: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const ok = m => { setSuccess(m); setTimeout(() => setSuccess(''), 3000); };
  const err = m => { setError(m); setTimeout(() => setError(''), 4000); };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const r = await masterInventoryService.getDashboard();
      if (r?.data) {
        setDashboard(r.data);
      }
    } catch { err('Failed to load dashboard'); }
    finally { setLoading(false); }
  }, []);

  const loadItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 50, search };
      if (typeFilter) params.type = typeFilter;
      if (deptFilter) params.department = deptFilter;
      const r = await masterInventoryService.getAll(params);
      if (r?.data) {
        setItems(r.data);
        setPag(r.pagination);
      }
    } catch { err('Failed to load items'); }
    finally { setLoading(false); }
  }, [search, typeFilter, deptFilter]);

  useEffect(() => {
    loadDashboard();
    loadItems();
  }, []);

  useEffect(() => {
    loadItems();
  }, [search, typeFilter, deptFilter]);

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
      ok('Item updated');
      setEditingId(null);
      setEditData(null);
      loadItems();
      const updatedItem = items.find(i => i._id === editingId);
      if (updatedItem) {
        setSelectedItem({ ...updatedItem, ...editData });
      }
    } catch {
      err('Failed to update item');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await masterInventoryService.delete(id);
      ok('Item deleted');
      if (selectedItem?._id === id) {
        setSelectedItem(null);
        setEditingId(null);
      }
      loadItems();
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
      const selectedGroupObj = groups.find(g => g._id === selectedGroup);
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
      err('Failed to assign item');
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
      err('Failed to relocate item');
    }
  };

  const getTypeLabel = (type) => {
    const types = { product: '📦 Product', service: '🔧 Service', lead: '👤 Lead' };
    return types[type] || type;
  };

  const getItemName = (item) => item.name || item.leadName || item.serviceName || '-';

  if (fromTab && loading && !items.length) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading inventory...</div>;
  }

  const content = (
    <>
      <style>{`
        @media (max-width: 768px) {
          .mi-container { flex-direction: column !important; }
          .mi-detail-panel { flex: 0 0 100% !important; border-right: none !important; border-bottom: 1px solid #e2e8f0 !important; }
          .mi-content-panel { flex: 0 0 100% !important; }
        }
      `}</style>
      <div className="mi-container" style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: '0' }}>
        {/* LEFT: Detail Panel */}
        {(selectedItem || isAddingNew) && (
          <div className="mi-detail-panel" style={{ flex: '0 0 35%', background: '#f8fafc', borderRight: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Dark Gradient Header */}
          <div style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 50%,#312e81 100%)', padding: '11px 14px 10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isAddingNew ? (
                <div style={{ width: 36, height: 36, borderRadius: 7, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: '700', color: '#a5b4fc' }}>➕</span>
                </div>
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 7, background: formData.type === 'product' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : formData.type === 'service' ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{selectedItem.name?.charAt(0)?.toUpperCase()}</span>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: '800', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isAddingNew ? 'Add New Item' : selectedItem.name}
                </div>
                {!isAddingNew && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{ background: selectedItem.status === 'new' ? '#e0e7ff' : selectedItem.status === 'quoted' ? '#fef3c7' : selectedItem.status === 'won' ? '#d1fae5' : '#fee2e2', color: selectedItem.status === 'new' ? '#4f46e5' : selectedItem.status === 'quoted' ? '#d97706' : selectedItem.status === 'won' ? '#059669' : '#dc2626', fontSize: 9, fontWeight: '700', padding: '1px 6px', borderRadius: 3, textTransform: 'uppercase' }}>{selectedItem.status}</span>
                    <span style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', fontSize: 9, fontWeight: '700', padding: '1px 6px', borderRadius: 3 }}>{selectedItem.type}</span>
                    <span style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: 9, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 3 }}>₹{selectedItem.quotedAmount || 0}</span>
                  </div>
                )}
              </div>
              <button onClick={() => { setSelectedItem(null); setIsAddingNew(false); }} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', width: 24, height: 24, borderRadius: 5, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            </div>
          </div>

          {/* KPI Row */}
          {!isAddingNew && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              {[
                { label: 'Department', value: selectedItem.department },
                { label: 'Status', value: selectedItem.status?.toUpperCase() },
                { label: 'Amount', value: `₹${selectedItem.quotedAmount || 0}` }
              ].map((item, i) => (
                <div key={i} style={{ padding: '7px 10px', textAlign: 'center', borderRight: i < 2 ? '1px solid #e2e8f0' : 'none', background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <div style={{ fontSize: 13, fontWeight: '800', color: '#1e293b' }}>{item.value}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginTop: 1 }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}

          {isAddingNew ? (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Type *</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Department</label>
                <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="sales">Sales</option>
                  <option value="service">Service</option>
                  <option value="lead_generation">Lead Gen</option>
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
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', minHeight: '60px', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
              {formData.type === 'product' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>SKU</label>
                    <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Category</label>
                    <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Price</label>
                    <input type="number" value={formData.productPrice} onChange={(e) => setFormData({...formData, productPrice: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Stock</label>
                    <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                </>
              )}
              {formData.type === 'service' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Service Type</label>
                    <input type="text" value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Duration</label>
                    <input type="text" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Rate</label>
                    <input type="number" value={formData.serviceRate} onChange={(e) => setFormData({...formData, serviceRate: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                </>
              )}
              {formData.type === 'lead' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Lead Name</label>
                    <input type="text" value={formData.leadName} onChange={(e) => setFormData({...formData, leadName: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Email</label>
                    <input type="email" value={formData.leadEmail} onChange={(e) => setFormData({...formData, leadEmail: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Phone</label>
                    <input type="tel" value={formData.leadPhone} onChange={(e) => setFormData({...formData, leadPhone: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Lead Source</label>
                    <input type="text" value={formData.leadSource} onChange={(e) => setFormData({...formData, leadSource: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                </>
              )}
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
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Department</label>
                <select value={editData.department} onChange={(e) => setEditData({...editData, department: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }}>
                  <option value="sales">Sales</option>
                  <option value="service">Service</option>
                  <option value="lead_generation">Lead Gen</option>
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
              {editData.type === 'product' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>SKU</label>
                    <input type="text" value={editData.sku} onChange={(e) => setEditData({...editData, sku: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Price</label>
                    <input type="number" value={editData.productPrice} onChange={(e) => setEditData({...editData, productPrice: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Stock</label>
                    <input type="number" value={editData.stock} onChange={(e) => setEditData({...editData, stock: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                </>
              )}
              {editData.type === 'service' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Service Type</label>
                    <input type="text" value={editData.serviceType} onChange={(e) => setEditData({...editData, serviceType: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Rate</label>
                    <input type="number" value={editData.serviceRate} onChange={(e) => setEditData({...editData, serviceRate: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                </>
              )}
              {editData.type === 'lead' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Email</label>
                    <input type="email" value={editData.leadEmail} onChange={(e) => setEditData({...editData, leadEmail: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Phone</label>
                    <input type="tel" value={editData.leadPhone} onChange={(e) => setEditData({...editData, leadPhone: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box', marginTop: '4px' }} />
                  </div>
                </>
              )}
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
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {/* Section 1: Basic Info */}
              <div style={{ marginBottom: 0 }}>
                <div style={{ background: 'linear-gradient(90deg,#6366f118 0%,transparent 100%)', borderLeft: '3px solid #6366f1', padding: '5px 10px', fontSize: 10, fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Basic Info</div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 0 }}>
                  <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Name</div>
                  <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: '500', color: '#1e293b', wordBreak: 'break-all' }}>{selectedItem.name}</div>
                  <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Type</div>
                  <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', background: '#fff', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>{selectedItem.type}</div>
                  {selectedItem.description && (
                    <>
                      <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Description</div>
                      <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: '500', color: '#475569', wordBreak: 'break-all' }}>{selectedItem.description}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 2: Details (Type Specific) */}
              <div style={{ marginBottom: 0, marginTop: '16px' }}>
                <div style={{ background: 'linear-gradient(90deg,#0891b218 0%,transparent 100%)', borderLeft: '3px solid #0891b2', padding: '5px 10px', fontSize: 10, fontWeight: '800', color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 0 }}>
                  {selectedItem.type === 'product' && (
                    <>
                      {selectedItem.sku && (
                        <>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>SKU</div>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: '500', color: '#6366f1', fontFamily: 'monospace' }}>{selectedItem.sku}</div>
                        </>
                      )}
                      {selectedItem.category && (
                        <>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Category</div>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', background: '#fff', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>{selectedItem.category}</div>
                        </>
                      )}
                      <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Price</div>
                      <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>₹{selectedItem.productPrice || 0}</div>
                      <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Stock</div>
                      <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', background: '#fff', fontSize: 12, fontWeight: '500', color: selectedItem.stock > 0 ? '#059669' : '#dc2626' }}>{selectedItem.stock} units</div>
                    </>
                  )}
                  {selectedItem.type === 'service' && (
                    <>
                      {selectedItem.serviceType && (
                        <>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Service Type</div>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>{selectedItem.serviceType}</div>
                        </>
                      )}
                      {selectedItem.duration && (
                        <>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Duration</div>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', background: '#fff', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>{selectedItem.duration}</div>
                        </>
                      )}
                      <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Rate</div>
                      <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>₹{selectedItem.serviceRate || 0}</div>
                    </>
                  )}
                  {selectedItem.type === 'lead' && (
                    <>
                      {selectedItem.leadEmail && (
                        <>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Email</div>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>{selectedItem.leadEmail}</div>
                        </>
                      )}
                      {selectedItem.leadPhone && (
                        <>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Phone</div>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', background: '#fff', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>{selectedItem.leadPhone}</div>
                        </>
                      )}
                      {selectedItem.leadSource && (
                        <>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Source</div>
                          <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>{selectedItem.leadSource}</div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Section 3: Financial */}
              <div style={{ marginBottom: 0, marginTop: '16px' }}>
                <div style={{ background: 'linear-gradient(90deg,#10b98118 0%,transparent 100%)', borderLeft: '3px solid #10b981', padding: '5px 10px', fontSize: 10, fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Financial</div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 0 }}>
                  <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Quoted</div>
                  <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>₹{selectedItem.quotedAmount || 0}</div>
                  <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Won</div>
                  <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', background: '#fff', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>₹{selectedItem.wonAmount || 0}</div>
                  <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Received</div>
                  <div style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: '500', color: '#1e293b' }}>₹{selectedItem.receivedAmount || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: '8px', flexDirection: 'column' }}>
            {isAddingNew ? (
              <>
                <button onClick={() => { if (!formData.name.trim()) { err('Name is required'); return; } setFormSubmitting(true); (async () => { try { const submitData = { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) }; await masterInventoryService.create(submitData); ok('Item created'); setIsAddingNew(false); setFormData({ name: '', type: 'product', department: 'sales', status: 'new', description: '', sku: '', category: '', productPrice: 0, stock: 0, serviceType: '', duration: '', serviceRate: 0, leadName: '', leadEmail: '', leadPhone: '', leadSource: '', quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: '' }); loadItems(); } catch { err('Failed to create item'); } finally { setFormSubmitting(false); } })(); }} disabled={formSubmitting} style={{ width: '100%', padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{formSubmitting ? 'Creating...' : '+ Create'}</button>
                <button onClick={() => { setIsAddingNew(false); setFormData({ name: '', type: 'product', department: 'sales', status: 'new', description: '', sku: '', category: '', productPrice: 0, stock: 0, serviceType: '', duration: '', serviceRate: 0, leadName: '', leadEmail: '', leadPhone: '', leadSource: '', quotedAmount: 0, wonAmount: 0, receivedAmount: 0, notes: '', tags: '' }); }} style={{ width: '100%', padding: '8px', background: '#f3f4f6', color: '#64748b', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
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
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>Assign Item</h3>

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
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>Relocate Item to Department</h3>
            <div style={{ marginBottom: '16px' }}>
              {['sales', 'service', 'lead_generation', 'operations'].map(dept => (
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
      <div className="mi-content-panel" style={{ flex: selectedItem ? '1' : '1', display: 'flex', flexDirection: 'column', padding: '0' }}>
        {/* Fixed Stats Container */}
        {dashboard && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', padding: '20px 20px 12px 20px', background: '#fff', position: 'sticky', top: '0', zIndex: 20 }}>
            {[
              { label: 'Products', value: dashboard.byType?.product || 0, bg: 'linear-gradient(135deg, #14b8a6, #0d9488)', type: 'product' },
              { label: 'Services', value: dashboard.byType?.service || 0, bg: 'linear-gradient(135deg, #14b8a6, #0d9488)', type: 'service' },
              { label: 'Leads', value: dashboard.byType?.lead || 0, bg: 'linear-gradient(135deg, #14b8a6, #0d9488)', type: 'lead' }
            ].map((stat, i) => (
              <div key={i} onClick={() => { setSearch(''); setTypeFilter(stat.type); setDeptFilter(''); }} style={{ position: 'relative', borderRadius: 6, padding: '12px 14px', overflow: 'hidden', cursor: 'pointer', background: stat.bg, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: 'monospace', marginBottom: 4 }}>{stat.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center', padding: '0 20px' }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px', borderRadius: '4px', marginBottom: '15px', width: '100%' }}>✕ {error}</div>}
          {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '10px', borderRadius: '4px', marginBottom: '15px', width: '100%' }}>✓ {success}</div>}
          <button onClick={() => setIsAddingNew(true)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add Item</button>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input type="text" placeholder="Search all items..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', minWidth: '120px' }}>
            <option value="">All Types</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="lead">Lead</option>
          </select>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', minWidth: '140px' }}>
            <option value="">All Departments</option>
            <option value="sales">Sales</option>
            <option value="service">Service</option>
            <option value="lead_generation">Lead Gen</option>
            <option value="operations">Operations</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto', flex: 1, padding: '0 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#1e293b', border: '1px solid #334155' }}>
                <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</th>
                <th style={{ padding: '7px 12px', textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '7px 12px', textAlign: 'right', fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                <th style={{ padding: '7px 12px', textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No items found</td></tr>
              ) : (
                items.map((item, i) => {
                  const isSelected = selectedItem?._id === item._id;
                  return (
                    <tr key={item._id} style={{ borderBottom: '1px solid #e2e8f0', background: isSelected ? '#e0e7ff' : i % 2 === 0 ? '#fff' : '#f9fafb', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#eff6ff')} onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f9fafb')}>
                      <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a', cursor: 'pointer', fontSize: 12 }}>{item.type}</td>
                      <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#0f172a', fontWeight: '500', cursor: 'pointer', fontSize: 12 }}>{getItemName(item)}</td>
                      <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>{item.department}</td>
                      <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}>
                        <span style={{ background: item.status === 'new' ? '#e0e7ff' : item.status === 'quoted' ? '#fef3c7' : item.status === 'won' ? '#d1fae5' : '#fee2e2', color: item.status === 'new' ? '#4f46e5' : item.status === 'quoted' ? '#d97706' : item.status === 'won' ? '#059669' : '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {item.status}
                        </span>
                      </td>
                      <td onClick={() => handleSelectItem(item)} style={{ padding: '12px', textAlign: 'right', color: '#0f172a', fontWeight: '600', cursor: 'pointer', fontSize: 12 }}>₹{item.quotedAmount || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleSelectItem(item); setEditingId(item._id); setEditData({...item}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px', transition: 'transform 0.1s', opacity: 0.7 }} onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.target.style.opacity = '0.7'; e.target.style.transform = 'scale(1)'; }} title="Edit"><Edit2 size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', transition: 'transform 0.1s', opacity: 0.7 }} onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.target.style.opacity = '0.7'; e.target.style.transform = 'scale(1)'; }} title="Delete"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })
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

  // If not in tab mode, wrap with DashboardLayout
  if (!fromTab) {
    return (
      <DashboardLayout title="Master Inventory">
        {content}
      </DashboardLayout>
    );
  }

  return content;
}
