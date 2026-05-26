import api from './api';

const masterInventoryService = {
  getDashboard: () => api.get('/master-inventory/dashboard').catch((err) => {
    console.error('getDashboard error:', err);
    return { data: { byType: { product: 0, service: 0, lead: 0 }, byDept: {}, total: 0 } };
  }),
  getAll: (params) => api.get('/master-inventory', { params }).catch((err) => {
    console.error('getAll error:', err);
    return { data: [], pagination: { page: 1, pages: 1, total: 0 } };
  }),
  getOne: (id) => api.get(`/master-inventory/${id}`).catch((err) => {
    console.error('getOne error:', err);
    return { data: null };
  }),
  create: (data) => api.post('/master-inventory', data).catch((err) => {
    console.error('create error:', err);
    throw err;
  }),
  update: (id, data) => api.patch(`/master-inventory/${id}`, data).catch((err) => {
    console.error('update error:', err);
    throw err;
  }),
  delete: (id) => api.delete(`/master-inventory/${id}`).catch((err) => {
    console.error('delete error:', err);
    throw err;
  }),
  getByType: (type, params) => api.get(`/master-inventory/type/${type}`, { params }).catch((err) => {
    console.error('getByType error:', err);
    return { data: [], pagination: { page: 1, pages: 1, total: 0 } };
  })
};

export default masterInventoryService;
