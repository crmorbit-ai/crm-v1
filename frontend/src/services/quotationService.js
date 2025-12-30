import api from './api';

const quotationService = {
  getQuotations: async (params) => {
    return api.get('/quotations', { params });
  },

  getQuotation: async (id) => {
    return api.get(`/quotations/${id}`);
  },

  createQuotation: async (data) => {
    return api.post('/quotations', data);
  },

  updateQuotation: async (id, data) => {
    return api.put(`/quotations/${id}`, data);
  },

  deleteQuotation: async (id) => {
    return api.delete(`/quotations/${id}`);
  },

  sendQuotation: async (id, data) => {
    return api.post(`/quotations/${id}/send`, data);
  },

  convertToInvoice: async (id) => {
    return api.post(`/quotations/${id}/convert-to-invoice`);
  },

  updateStatus: async (id, status) => {
    return api.patch(`/quotations/${id}/status`, { status });
  },

  sendEmail: async (id, data = {}) => {
    return api.post(`/quotations/${id}/send-email`, data);
  },

  downloadPDF: async (id) => {
    return api.get(`/quotations/${id}/download-pdf`, { responseType: 'blob' });
  }
};

export default quotationService;
