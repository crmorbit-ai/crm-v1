import api from './api';

const inventoryService = {
  // Dashboard
  getDashboard: () => api.get('/inventory/dashboard'),

  // Stock overview
  getInventory: (params) => api.get('/inventory', { params }),

  // Transactions
  getTransactions: (params) => api.get('/inventory/transactions', { params }),

  // Low stock
  getLowStock: () => api.get('/inventory/low-stock'),

  // Manual adjustment
  adjustStock: (productId, data) => api.post(`/inventory/${productId}/adjust`, data),

  // Threshold settings
  updateThreshold: (productId, data) => api.patch(`/inventory/${productId}/threshold`, data),

  // PO Receive
  receivePO: (poId, data) => api.post(`/inventory/po/${poId}/receive`, data),

  // Reports
  getStockSummary: () => api.get('/inventory/reports/summary'),
  getStockValuation: () => api.get('/inventory/reports/valuation'),
  getABCAnalysis: () => api.get('/inventory/reports/abc'),
  getStockAging: () => api.get('/inventory/reports/aging'),
};

export default inventoryService;
