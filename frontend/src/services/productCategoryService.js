import api from './api';

export const productCategoryService = {
  // Get all categories
  getAllCategories: async (filters = {}, page = 1, limit = 100) => {
    const response = await api.get('/product-categories', {
      params: { ...filters, page, limit }
    });
    return response;
  },

  // Get single category
  getCategory: async (id) => {
    const response = await api.get(`/product-categories/${id}`);
    return response;
  },

  // Create category
  createCategory: async (categoryData) => {
    const response = await api.post('/product-categories', categoryData);
    return response;
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/product-categories/${id}`, categoryData);
    return response;
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await api.delete(`/product-categories/${id}`);
    return response;
  }
};