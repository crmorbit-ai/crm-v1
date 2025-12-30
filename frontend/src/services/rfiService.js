import api from './api';

const rfiService = {
  getRFIs: async (params) => {
    return api.get('/rfi', { params });
  },

  getRFI: async (id) => {
    return api.get(`/rfi/${id}`);
  },

  createRFI: async (data) => {
    return api.post('/rfi', data);
  },

  updateRFI: async (id, data) => {
    return api.put(`/rfi/${id}`, data);
  },

  deleteRFI: async (id) => {
    return api.delete(`/rfi/${id}`);
  },

  convertToQuotation: async (id, data = {}) => {
    return api.post(`/rfi/${id}/convert-to-quotation`, data);
  },

  updateStatus: async (id, status) => {
    return api.patch(`/rfi/${id}/status`, { status });
  }
};

export default rfiService;
