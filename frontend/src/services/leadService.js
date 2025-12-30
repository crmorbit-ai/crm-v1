import api from './api';

export const leadService = {
  // Get all leads
  getLeads: async (params) => {
    const response = await api.get('/leads', { params });
    return response; // Interceptor already unwrapped to { success, message, data }
  },

  // Get single lead
  getLead: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response;
  },

  // Create lead
  createLead: async (leadData) => {
    const response = await api.post('/leads', leadData);
    return response;
  },

  // Update lead
  updateLead: async (id, leadData) => {
    const response = await api.put(`/leads/${id}`, leadData);
    return response;
  },

  // Delete lead
  deleteLead: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response;
  },

  // Convert lead
  convertLead: async (id, conversionData) => {
    const response = await api.post(`/leads/${id}/convert`, conversionData);
    return response;
  },

  // Bulk upload leads
  bulkUploadLeads: async (leads, options) => {
    const response = await api.post('/leads/bulk-upload', { leads, options });
    return response;
  },

  // Get lead statistics
  getLeadStats: async () => {
    const response = await api.get('/leads/stats');
    return response;
  },

  // 🆕 Assign leads to group (with optional specific members)
  assignLeadsToGroup: async (leadIds, groupId, memberIds = null) => {
    const response = await api.post('/leads/assign-to-group', { leadIds, groupId, memberIds });
    return response;
  },

  // 🆕 Assign lead to user
  assignLeadToUser: async (leadId, userId, role) => {
    const response = await api.post(`/leads/${leadId}/assign`, { userId, role });
    return response;
  }
};
