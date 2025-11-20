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

  // Create opportunity
  createOpportunity: async (opportunityData) => {
    const response = await api.post('/opportunities', opportunityData);
    return response;
  },

  // Update opportunity
  updateOpportunity: async (id, opportunityData) => {
    const response = await api.put(`/opportunities/${id}`, opportunityData);
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
