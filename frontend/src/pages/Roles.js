import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roleService } from '../services/roleService';
import Modal from '../components/common/Modal';
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

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
      setShowCreateModal(false);
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
      setShowEditModal(false);
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
      setShowDeleteModal(false);
      setSelectedRole(null);
      loadRoles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
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
    <DashboardLayout
      title="Role Management"
      actionButton={canCreateRole ? (
        <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Role
        </button>
      ) : null}
    >
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

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
                                  onClick={() => openEditModal(role)}
                                >
                                  Edit
                                </button>
                              )}
                              {canDeleteRole && role.roleType !== 'system' && (
                                <button
                                  className="crm-btn crm-btn-sm crm-btn-danger"
                                  onClick={() => openDeleteModal(role)}
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

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          setError('');
        }}
        title="Create New Role"
        size="large"
      >
        <form onSubmit={handleCreateRole}>
          <div className="form-group">
            <label className="form-label">Role Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g., Project Manager"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Slug *</label>
            <input
              type="text"
              name="slug"
              className="form-input"
              placeholder="project-manager"
              value={formData.slug}
              onChange={handleChange}
              required
            />
            <small className="form-hint">Auto-generated from name. Used for internal reference.</small>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              rows="3"
              placeholder="Describe this role's responsibilities..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Permissions</label>
            <div className="permissions-grid">
              {AVAILABLE_FEATURES.map(feature => (
                <div key={feature.slug} className="permission-group">
                  <h4>{feature.name}</h4>
                  <div className="permission-actions">
                    {AVAILABLE_ACTIONS.map(action => (
                      <label key={action} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={hasPermissionChecked(feature.slug, action)}
                          onChange={() => handlePermissionToggle(feature.slug, action)}
                        />
                        <span>{action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRole(null);
          resetForm();
          setError('');
        }}
        title="Edit Role"
        size="large"
      >
        <form onSubmit={handleUpdateRole}>
          <div className="form-group">
            <label className="form-label">Role Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              rows="3"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Permissions</label>
            <div className="permissions-grid">
              {AVAILABLE_FEATURES.map(feature => (
                <div key={feature.slug} className="permission-group">
                  <h4>{feature.name}</h4>
                  <div className="permission-actions">
                    {AVAILABLE_ACTIONS.map(action => (
                      <label key={action} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={hasPermissionChecked(feature.slug, action)}
                          onChange={() => handlePermissionToggle(feature.slug, action)}
                        />
                        <span>{action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedRole(null);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedRole(null);
        }}
        title="Delete Role"
        size="small"
      >
        <div>
          <p>Are you sure you want to delete this role?</p>
          <p style={{ marginTop: '10px' }}>
            <strong>{selectedRole?.name}</strong><br />
            <span style={{ color: '#666' }}>{selectedRole?.description}</span>
          </p>
          <p style={{ marginTop: '15px', color: 'var(--error-color)', fontSize: '14px' }}>
            This action cannot be undone. Users assigned to this role will lose their permissions.
          </p>

          <div className="modal-footer">
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedRole(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteRole}
            >
              Delete Role
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Roles;
