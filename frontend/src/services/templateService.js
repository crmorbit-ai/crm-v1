import api from './api';

const templateService = {
  getTemplates: (module) => api.get('/templates', { params: module ? { module } : {} }),
  createTemplate: (data) => api.post('/templates', data),
  updateTemplate: (id, data) => api.put(`/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
  useTemplate: (id) => api.patch(`/templates/${id}/use`),
};

export default templateService;
