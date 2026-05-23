import api from './api';

const inventoryService = {
  // Dashboard
  getDashboard: () => api.get('/inventory/dashboard'),

  // Stock overview
  getInventory: (params) => api.get('/inventory', { params }),

  // By item type
  getInventoryByType: (params) => api.get('/inventory/by-type', { params }),
  getServiceInventory: (params) => api.get('/inventory/service', { params }),
  getLeadInventory: (params) => api.get('/inventory/lead', { params }),

  // HR Visibility
  getHRVisibility: (params) => api.get('/inventory/hr-visibility', { params }),

  // Categories breakdown
  getCategoriesBreakdown: () => api.get('/inventory/categories-breakdown'),

  // Check availability
  checkAvailability: (data) => api.post('/inventory/check-availability', data),

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
