import api from './api';

const invoiceService = {
  getInvoices: async (params) => {
    return api.get('/invoices', { params });
  },

  getInvoice: async (id) => {
    return api.get(`/invoices/${id}`);
  },

  createInvoice: async (data) => {
    return api.post('/invoices', data);
  },

  updateInvoice: async (id, data) => {
    return api.put(`/invoices/${id}`, data);
  },

  deleteInvoice: async (id) => {
    return api.delete(`/invoices/${id}`);
  },

  sendInvoice: async (id, data) => {
    return api.post(`/invoices/${id}/send`, data);
  },

  downloadPDF: async (id) => {
    return api.get(`/invoices/${id}/download-pdf`, { responseType: 'blob' });
  },

  addPayment: async (id, data) => {
    return api.post(`/invoices/${id}/payments`, data);
  },

  updateStatus: async (id, status) => {
    return api.patch(`/invoices/${id}/status`, { status });
  },

  getStats: async () => {
    return api.get('/invoices/stats');
  }
};

export default invoiceService;
