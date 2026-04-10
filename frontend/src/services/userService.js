import api from './api';

export const userService = {
  getUsers: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  assignRoles: async (id, roles) => {
    const response = await api.post(`/users/${id}/assign-roles`, { roles });
    return response.data;
  },

  assignGroups: async (id, groups) => {
    const response = await api.post(`/users/${id}/assign-groups`, { groups });
    return response.data;
  },

  resetUserPassword: async (id, newPassword) => {
    const response = await api.put(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  bulkCreateUsers: async (users) => {
    const response = await api.post('/users/bulk', { users });
    return response.data;
  }
};

export const orgHierarchyService = {
  getOrgList: async () => {
    const response = await api.get('/org-hierarchy/tenants');
    return response.data;
  },

  getOrgUsers: async (targetTenantId) => {
    const response = await api.get(`/org-hierarchy/${targetTenantId}/users`);
    return response.data;
  },
};
