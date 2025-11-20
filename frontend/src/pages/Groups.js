import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupService } from '../services/groupService';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import Modal from '../components/common/Modal';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const Groups = () => {
  const { user, logout, hasPermission } = useAuth();
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
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
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  // Member management
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Role management
  const [selectedRoles, setSelectedRoles] = useState([]);

  useEffect(() => {
    loadGroups();
    loadUsers();
    loadRoles();
  }, [pagination.page]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await groupService.getGroups({
        page: pagination.page,
        limit: pagination.limit
      });
      setGroups(response.groups);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages
      }));
    } catch (err) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers({ limit: 100 });
      setAllUsers(response.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await roleService.getRoles({ limit: 100 });
      setAllRoles(response.roles || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await groupService.createGroup(formData);
      setSuccess('Group created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create group');
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await groupService.updateGroup(selectedGroup._id, formData);
      setSuccess('Group updated successfully!');
      setShowEditModal(false);
      setSelectedGroup(null);
      resetForm();
      loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update group');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setError('');
      await groupService.deleteGroup(selectedGroup._id);
      setSuccess('Group deleted successfully!');
      setShowDeleteModal(false);
      setSelectedGroup(null);
      loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete group');
    }
  };

  const handleUpdateMembers = async () => {
    try {
      setError('');

      // Get current member IDs
      const currentMemberIds = selectedGroup.members.map(m => m._id);

      // Find members to add and remove
      const membersToAdd = selectedMembers.filter(id => !currentMemberIds.includes(id));
      const membersToRemove = currentMemberIds.filter(id => !selectedMembers.includes(id));

      // Add new members
      if (membersToAdd.length > 0) {
        await groupService.addMembers(selectedGroup._id, membersToAdd);
      }

      // Remove members
      if (membersToRemove.length > 0) {
        await groupService.removeMembers(selectedGroup._id, membersToRemove);
      }

      setSuccess('Group members updated successfully!');
      setShowMembersModal(false);
      setSelectedGroup(null);
      setSelectedMembers([]);
      loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update members');
    }
  };

  const handleUpdateRoles = async () => {
    try {
      setError('');

      // Get current role IDs
      const currentRoleIds = selectedGroup.roles?.map(r => r._id) || [];

      // Find roles to add and remove
      const rolesToAdd = selectedRoles.filter(id => !currentRoleIds.includes(id));
      const rolesToRemove = currentRoleIds.filter(id => !selectedRoles.includes(id));

      // Add new roles
      if (rolesToAdd.length > 0) {
        await groupService.assignRoles(selectedGroup._id, rolesToAdd);
      }

      // Remove roles
      if (rolesToRemove.length > 0) {
        await groupService.removeRoles(selectedGroup._id, rolesToRemove);
      }

      setSuccess('Group roles updated successfully!');
      setShowRolesModal(false);
      setSelectedGroup(null);
      setSelectedRoles([]);
      loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update roles');
    }
  };

  const openEditModal = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      slug: group.slug,
      description: group.description || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (group) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const openMembersModal = (group) => {
    setSelectedGroup(group);
    setSelectedMembers(group.members.map(m => m._id));
    setShowMembersModal(true);
  };

  const openRolesModal = (group) => {
    setSelectedGroup(group);
    setSelectedRoles(group.roles?.map(r => r._id) || []);
    setShowRolesModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: ''
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

  const handleMemberToggle = (userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleRoleToggle = (roleId) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const canCreateGroup = hasPermission('group_management', 'create');
  const canUpdateGroup = hasPermission('group_management', 'update');
  const canDeleteGroup = hasPermission('group_management', 'delete');
  const canManageGroup = hasPermission('group_management', 'manage');

  return (
    <DashboardLayout
      title="Group Management"
      actionButton={canCreateGroup ? (
        <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Group
        </button>
      ) : null}
    >
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">All Groups ({pagination.total})</h2>
        </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '10px' }}>Loading groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <p>No groups found. Create your first group!</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Members</th>
                        <th>Roles</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => (
                        <tr key={group._id}>
                          <td>
                            <strong>{group.name}</strong>
                            {group.description && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {group.description}
                              </div>
                            )}
                          </td>
                          <td><code>{group.slug}</code></td>
                          <td>
                            <span className="badge badge-info">
                              {group.members?.length || 0} member(s)
                            </span>
                          </td>
                          <td>
                            {group.roles?.length > 0 ? (
                              <span>{group.roles.length} role(s)</span>
                            ) : (
                              <span style={{ color: '#999' }}>No roles</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${group.isActive ? 'badge-success' : 'badge-danger'}`}>
                              {group.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-10">
                              {canManageGroup && (
                                <>
                                  <button
                                    className="crm-btn crm-btn-sm crm-btn-primary"
                                    onClick={() => openMembersModal(group)}
                                  >
                                    Members
                                  </button>
                                  <button
                                    className="crm-btn crm-btn-sm crm-btn-primary"
                                    onClick={() => openRolesModal(group)}
                                  >
                                    Roles
                                  </button>
                                </>
                              )}
                              {canUpdateGroup && (
                                <button
                                  className="crm-btn crm-btn-sm crm-btn-secondary"
                                  onClick={() => openEditModal(group)}
                                >
                                  Edit
                                </button>
                              )}
                              {canDeleteGroup && (
                                <button
                                  className="crm-btn crm-btn-sm crm-btn-danger"
                                  onClick={() => openDeleteModal(group)}
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

      {/* Create Group Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          setError('');
        }}
        title="Create New Group"
      >
        <form onSubmit={handleCreateGroup}>
          <div className="form-group">
            <label className="form-label">Group Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g., Engineering Team"
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
              placeholder="engineering-team"
              value={formData.slug}
              onChange={handleChange}
              required
            />
            <small className="form-hint">Auto-generated from name.</small>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              rows="3"
              placeholder="Describe this group's purpose..."
              value={formData.description}
              onChange={handleChange}
            />
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
              Create Group
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGroup(null);
          resetForm();
          setError('');
        }}
        title="Edit Group"
      >
        <form onSubmit={handleUpdateGroup}>
          <div className="form-group">
            <label className="form-label">Group Name *</label>
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

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedGroup(null);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Group
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Members Modal */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false);
          setSelectedGroup(null);
          setSelectedMembers([]);
        }}
        title={`Manage Members - ${selectedGroup?.name}`}
        size="medium"
      >
        <div>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            Select users to add or remove from this group:
          </p>

          <div className="members-list">
            {allUsers.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                No users available
              </p>
            ) : (
              allUsers.map(u => (
                <label key={u._id} className="member-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(u._id)}
                    onChange={() => handleMemberToggle(u._id)}
                  />
                  <div className="member-info">
                    <strong>{u.firstName} {u.lastName}</strong>
                    <span>{u.email}</span>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowMembersModal(false);
                setSelectedGroup(null);
                setSelectedMembers([]);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateMembers}
            >
              Update Members ({selectedMembers.length})
            </button>
          </div>
        </div>
      </Modal>

      {/* Manage Roles Modal */}
      <Modal
        isOpen={showRolesModal}
        onClose={() => {
          setShowRolesModal(false);
          setSelectedGroup(null);
          setSelectedRoles([]);
        }}
        title={`Manage Roles - ${selectedGroup?.name}`}
        size="medium"
      >
        <div>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            Select roles to assign to this group. All group members will inherit these permissions:
          </p>

          <div className="role-checkboxes">
            {allRoles.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                No roles available
              </p>
            ) : (
              allRoles.map(role => (
                <label key={role._id} className="role-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role._id)}
                    onChange={() => handleRoleToggle(role._id)}
                  />
                  <div className="role-info">
                    <strong>{role.name}</strong>
                    {role.description && <span>{role.description}</span>}
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowRolesModal(false);
                setSelectedGroup(null);
                setSelectedRoles([]);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateRoles}
            >
              Update Roles ({selectedRoles.length})
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGroup(null);
        }}
        title="Delete Group"
        size="small"
      >
        <div>
          <p>Are you sure you want to delete this group?</p>
          <p style={{ marginTop: '10px' }}>
            <strong>{selectedGroup?.name}</strong><br />
            <span style={{ color: '#666' }}>{selectedGroup?.description}</span>
          </p>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Members: {selectedGroup?.members?.length || 0}
          </p>
          <p style={{ marginTop: '15px', color: 'var(--error-color)', fontSize: '14px' }}>
            This action cannot be undone. Members will be removed from this group.
          </p>

          <div className="modal-footer">
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedGroup(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteGroup}
            >
              Delete Group
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Groups;
