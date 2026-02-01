import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roleService } from '../services/roleService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const AVAILABLE_FEATURES = [
  { slug: 'user_management', name: 'User Management' },
  { slug: 'role_management', name: 'Role Management' },
  { slug: 'group_management', name: 'Group Management' },
  { slug: 'lead_management', name: 'Lead Management' },
  { slug: 'account_management', name: 'Account Management' },
  { slug: 'contact_management', name: 'Contact Management' },
  { slug: 'opportunity_management', name: 'Opportunity Management' },
  { slug: 'product_management', name: 'Product Management' },
  { slug: 'activity_management', name: 'Activity Management' },
  { slug: 'report_management', name: 'Report Management' },
  { slug: 'field_management', name: 'Field Management' }
];

const AVAILABLE_ACTIONS = ['create', 'read', 'update', 'delete', 'convert', 'import', 'export', 'manage'];

const Roles = () => {
  const { user, logout, hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Inline forms
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    loadRoles();
  }, [pagination.page]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await roleService.getRoles({
        page: pagination.page,
        limit: pagination.limit
      });
      setRoles(response.roles);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages
      }));
    } catch (err) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await roleService.createRole(formData);
      setSuccess('Role created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadRoles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await roleService.updateRole(selectedRole._id, formData);
      setSuccess('Role updated successfully!');
      setShowEditForm(false);
      setSelectedRole(null);
      resetForm();
      loadRoles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async () => {
    try {
      setError('');
      await roleService.deleteRole(selectedRole._id);
      setSuccess('Role deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedRole(null);
      loadRoles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const openEditForm = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowEditForm(true);
    setShowCreateForm(false);
    setShowDeleteConfirm(false);
  };

  const openDeleteConfirm = (role) => {
    setSelectedRole(role);
    setShowDeleteConfirm(true);
    setShowCreateForm(false);
    setShowEditForm(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      permissions: []
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handlePermissionToggle = (feature, action) => {
    setFormData(prev => {
      const permissions = [...prev.permissions];
      const featureIndex = permissions.findIndex(p => p.feature === feature);

      if (featureIndex === -1) {
        // Add new feature permission
        permissions.push({ feature, actions: [action] });
      } else {
        const actions = [...permissions[featureIndex].actions];
        const actionIndex = actions.indexOf(action);

        if (actionIndex === -1) {
          actions.push(action);
        } else {
          actions.splice(actionIndex, 1);
        }

        if (actions.length === 0) {
          permissions.splice(featureIndex, 1);
        } else {
          permissions[featureIndex] = { feature, actions };
        }
      }

      return { ...prev, permissions };
    });
  };

  const hasPermissionChecked = (feature, action) => {
    const perm = formData.permissions.find(p => p.feature === feature);
    return perm ? perm.actions.includes(action) : false;
  };

  const canCreateRole = hasPermission('role_management', 'create');
  const canUpdateRole = hasPermission('role_management', 'update');
  const canDeleteRole = hasPermission('role_management', 'delete');

  return (
    <DashboardLayout title="Role Management">
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Action Bar */}
      <div className="crm-card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Role Management</h3>
          {canCreateRole && (
            <button className="crm-btn crm-btn-primary" onClick={() => { setShowCreateForm(true); setShowEditForm(false); setShowDeleteConfirm(false); resetForm(); }}>+ New Role</button>
          )}
        </div>
      </div>

      {/* Inline Create Role Form */}
      {showCreateForm && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Create New Role</h3>
            <button onClick={() => { setShowCreateForm(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            <form onSubmit={handleCreateRole}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Role Name *</label>
                  <input type="text" name="name" className="crm-form-input" placeholder="e.g., Project Manager" value={formData.name} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Slug *</label>
                  <input type="text" name="slug" className="crm-form-input" placeholder="project-manager" value={formData.slug} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                  <input type="text" name="description" className="crm-form-input" placeholder="Role description..." value={formData.description} onChange={handleChange} style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Permissions</label>
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px' }}>
                  {AVAILABLE_FEATURES.map(feature => (
                    <div key={feature.slug} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>{feature.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {AVAILABLE_ACTIONS.map(action => (
                          <label key={action} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer', padding: '2px 6px', background: hasPermissionChecked(feature.slug, action) ? '#dbeafe' : '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                            <input type="checkbox" checked={hasPermissionChecked(feature.slug, action)} onChange={() => handlePermissionToggle(feature.slug, action)} style={{ width: '12px', height: '12px' }} />
                            {action}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline" onClick={() => { setShowCreateForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary">Create Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Edit Role Form */}
      {showEditForm && selectedRole && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Edit Role: {selectedRole.name}</h3>
            <button onClick={() => { setShowEditForm(false); setSelectedRole(null); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            <form onSubmit={handleUpdateRole}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Role Name *</label>
                  <input type="text" name="name" className="crm-form-input" value={formData.name} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                  <input type="text" name="description" className="crm-form-input" value={formData.description} onChange={handleChange} style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Permissions</label>
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px' }}>
                  {AVAILABLE_FEATURES.map(feature => (
                    <div key={feature.slug} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>{feature.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {AVAILABLE_ACTIONS.map(action => (
                          <label key={action} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer', padding: '2px 6px', background: hasPermissionChecked(feature.slug, action) ? '#dbeafe' : '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                            <input type="checkbox" checked={hasPermissionChecked(feature.slug, action)} onChange={() => handlePermissionToggle(feature.slug, action)} style={{ width: '12px', height: '12px' }} />
                            {action}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline" onClick={() => { setShowEditForm(false); setSelectedRole(null); resetForm(); }}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary">Update Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Delete Confirmation */}
      {showDeleteConfirm && selectedRole && (
        <div className="crm-card" style={{ marginBottom: '16px', border: '2px solid #FCA5A5' }}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#991B1B' }}>Delete Role: {selectedRole.name}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Users assigned to this role will lose their permissions. This action cannot be undone.</p>
              </div>
              <button className="crm-btn crm-btn-outline" onClick={() => { setShowDeleteConfirm(false); setSelectedRole(null); }}>Cancel</button>
              <button className="crm-btn crm-btn-danger" onClick={handleDeleteRole}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">All Roles ({pagination.total})</h2>
        </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '10px' }}>Loading roles...</p>
              </div>
            ) : roles.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <p>No roles found. Create your first role!</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Type</th>
                        <th>Permissions</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => (
                        <tr key={role._id}>
                          <td>
                            <strong>{role.name}</strong>
                            {role.description && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {role.description}
                              </div>
                            )}
                          </td>
                          <td><code>{role.slug}</code></td>
                          <td>
                            <span className={`badge ${role.roleType === 'system' ? 'badge-info' : 'badge-warning'}`}>
                              {role.roleType}
                            </span>
                          </td>
                          <td>
                            {role.permissions?.length > 0 ? (
                              <span>{role.permissions.length} permission(s)</span>
                            ) : (
                              <span style={{ color: '#999' }}>No permissions</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${role.isActive ? 'badge-success' : 'badge-danger'}`}>
                              {role.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-10">
                              {canUpdateRole && role.roleType !== 'system' && (
                                <button
                                  className="crm-btn crm-btn-sm crm-btn-secondary"
                                  onClick={() => openEditForm(role)}
                                >
                                  Edit
                                </button>
                              )}
                              {canDeleteRole && role.roleType !== 'system' && (
                                <button
                                  className="crm-btn crm-btn-sm crm-btn-danger"
                                  onClick={() => openDeleteConfirm(role)}
                                >
                                  Delete
                                </button>
                              )}
                              {role.roleType === 'system' && (
                                <span style={{ fontSize: '12px', color: '#999' }}>System role</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      className="crm-btn crm-btn-outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      className="crm-btn crm-btn-outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
      </div>
    </DashboardLayout>
  );
};

export default Roles;
