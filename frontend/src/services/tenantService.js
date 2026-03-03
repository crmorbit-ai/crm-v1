import api from './api';

export const tenantService = {
  getTenants: async (params) => {
    const response = await api.get('/tenants', { params });
    return response.data.data || response.data;
  },

  getTenant: async (id) => {
    const response = await api.get(`/tenants/${id}`);
    return response.data.data || response.data;
  },

  updateTenant: async (id, tenantData) => {
    const response = await api.put(`/tenants/${id}`, tenantData);
    return response.data.data || response.data;
  },

  suspendTenant: async (id, reason) => {
    const response = await api.post(`/tenants/${id}/suspend`, { reason });
    return response.data.data || response.data;
  },

  activateTenant: async (id) => {
    const response = await api.post(`/tenants/${id}/activate`);
    return response.data.data || response.data;
  },

  deleteTenant: async (id) => {
    const response = await api.delete(`/tenants/${id}`);
    return response.data.data || response.data;
  },

  getTenantStats: async () => {
    const response = await api.get('/tenants/stats/overview');
    return response.data.data || response.data;
  },

  approveDeletion: async (id) => {
    const response = await api.post(`/tenants/${id}/approve-deletion`);
    return response.data.data || response.data;
  },

  rejectDeletion: async (id, rejectionReason) => {
    const response = await api.post(`/tenants/${id}/reject-deletion`, { rejectionReason });
    return response.data.data || response.data;
  },

  recoverTenant: async (id) => {
    const response = await api.post(`/tenants/${id}/recover`);
    return response.data.data || response.data;
  }
};
