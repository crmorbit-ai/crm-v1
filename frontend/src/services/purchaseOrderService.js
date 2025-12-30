import api from './api';

const purchaseOrderService = {
  getPurchaseOrders: async (params) => {
    return api.get('/purchase-orders', { params });
  },

  getPurchaseOrder: async (id) => {
    return api.get(`/purchase-orders/${id}`);
  },

  createPurchaseOrder: async (formData) => {
    return api.post('/purchase-orders', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  updatePurchaseOrder: async (id, formData) => {
    return api.put(`/purchase-orders/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  deletePurchaseOrder: async (id) => {
    return api.delete(`/purchase-orders/${id}`);
  },

  approvePurchaseOrder: async (id) => {
    return api.post(`/purchase-orders/${id}/approve`);
  },

  convertToInvoice: async (id) => {
    return api.post(`/purchase-orders/${id}/convert-to-invoice`);
  },

  updateStatus: async (id, status) => {
    return api.patch(`/purchase-orders/${id}/status`, { status });
  },

  downloadDocument: async (id) => {
    return api.get(`/purchase-orders/${id}/download-document`, {
      responseType: 'blob'
    });
  }
};

export default purchaseOrderService;
