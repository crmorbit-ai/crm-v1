import api from './api';

export const opportunityService = {
  // Get all opportunities
  getOpportunities: async (params) => {
    const response = await api.get('/opportunities', { params });
    return response;
  },

  // Get single opportunity
  getOpportunity: async (id) => {
    const response = await api.get(`/opportunities/${id}`);
    return response;
  },

  // Create opportunity (supports FormData for contract file upload)
  createOpportunity: async (opportunityData) => {
    const isFormData = opportunityData instanceof FormData;
    const response = await api.post('/opportunities', opportunityData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response;
  },

  // Update opportunity (supports FormData for contract file upload)
  updateOpportunity: async (id, opportunityData) => {
    const isFormData = opportunityData instanceof FormData;
    const response = await api.put(`/opportunities/${id}`, opportunityData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response;
  },

  // Delete opportunity
  deleteOpportunity: async (id) => {
    const response = await api.delete(`/opportunities/${id}`);
    return response;
  },

  // Get opportunity statistics
  getOpportunityStats: async () => {
    const response = await api.get('/opportunities/stats');
    return response;
  }
};
