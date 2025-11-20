import api from './api';

export const accountService = {
  // Get all accounts
  getAccounts: async (params) => {
    const response = await api.get('/accounts', { params });
    return response; // Interceptor already unwrapped to { success, message, data }
  },

  // Get single account
  getAccount: async (id) => {
    const response = await api.get(`/accounts/${id}`);
    return response;
  },

  // Create account
  createAccount: async (accountData) => {
    const response = await api.post('/accounts', accountData);
    return response;
  },

  // Update account
  updateAccount: async (id, accountData) => {
    const response = await api.put(`/accounts/${id}`, accountData);
    return response;
  },

  // Delete account
  deleteAccount: async (id) => {
    const response = await api.delete(`/accounts/${id}`);
    return response;
  },

  // Get account statistics
  getAccountStats: async () => {
    const response = await api.get('/accounts/stats');
    return response;
  }
};
