import api from './api';

const proposalService = {
  getProposals: async (params) => {
    return api.get('/proposals', { params });
  },

  getProposal: async (id) => {
    return api.get(`/proposals/${id}`);
  },

  createProposal: async (data) => {
    return api.post('/proposals', data);
  },

  updateProposal: async (id, data) => {
    return api.put(`/proposals/${id}`, data);
  },

  deleteProposal: async (id) => {
    return api.delete(`/proposals/${id}`);
  },

  sendProposal: async (id, recipients) => {
    return api.post(`/proposals/${id}/send`, { recipients });
  },

  cloneProposal: async (id) => {
    return api.post(`/proposals/${id}/clone`);
  }
};

export default proposalService;
