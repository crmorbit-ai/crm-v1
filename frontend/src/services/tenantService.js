import api from './api';

export const tenantService = {
  getTenants: async (params) => {
    const response = await api.get('/tenants', { params });
    return response.data;
  },

  getTenant: async (id) => {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  updateTenant: async (id, tenantData) => {
    const response = await api.put(`/tenants/${id}`, tenantData);
    return response.data;
  },

  suspendTenant: async (id, reason) => {
    const response = await api.post(`/tenants/${id}/suspend`, { reason });
    return response.data;
  },

  activateTenant: async (id) => {
    const response = await api.post(`/tenants/${id}/activate`);
    return response.data;
  },

  deleteTenant: async (id) => {
    const response = await api.delete(`/tenants/${id}`);
    return response.data;
  },

  getTenantStats: async () => {
    const response = await api.get('/tenants/stats/overview');
    return response.data;
  }
};
