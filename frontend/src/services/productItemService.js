import api from './api';

export const productItemService = {
  // Get all products
  getAllProducts: async (filters = {}, page = 1, limit = 20) => {
    const response = await api.get('/product-items', {
      params: { ...filters, page, limit }
    });
    return response;
  },

  // Get single product
  getProduct: async (id) => {
    const response = await api.get(`/product-items/${id}`);
    return response;
  },

  // Create product
  createProduct: async (productData) => {
    const response = await api.post('/product-items', productData);
    return response;
  },

  // Update product
  updateProduct: async (id, productData) => {
    const response = await api.put(`/product-items/${id}`, productData);
    return response;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/product-items/${id}`);
    return response;
  },

  // Get product statistics
  getProductStats: async () => {
    const response = await api.get('/product-items/stats');
    return response;
  },

  // Get product enquiries
  getProductEnquiries: async (id, page = 1, limit = 20) => {
    const response = await api.get(`/product-items/${id}/enquiries`, {
      params: { page, limit }
    });
    return response;
  }
};
