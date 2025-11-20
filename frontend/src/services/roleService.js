import api from './api';

export const roleService = {
  getRoles: async (params) => {
    const response = await api.get('/roles', { params });
    return response.data;
  },

  getRole: async (id) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  createRole: async (roleData) => {
    const response = await api.post('/roles', roleData);
    return response.data;
  },

  updateRole: async (id, roleData) => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  },

  deleteRole: async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  }
};
