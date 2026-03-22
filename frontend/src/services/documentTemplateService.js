import api from './api';

const documentTemplateService = {
  getAll:            (params)          => api.get('/document-templates', { params }),
  getOne:            (id)              => api.get(`/document-templates/${id}`),
  getByShareToken:   (token)           => api.get(`/document-templates/shared/${token}`),
  create:            (data)            => api.post('/document-templates', data),
  update:            (id, data)        => api.put(`/document-templates/${id}`, data),
  remove:            (id)              => api.delete(`/document-templates/${id}`),
  generateShareLink: (id)              => api.post(`/document-templates/${id}/share/link`),
  revokeShareLink:   (id)              => api.delete(`/document-templates/${id}/share/link`),
  shareWithUsers:    (id, userIds, permission) => api.post(`/document-templates/${id}/share/users`, { userIds, permission }),
  removeSharedUser:  (id, userId)      => api.delete(`/document-templates/${id}/share/users/${userId}`),
  download:          (id, format)      => api.get(`/document-templates/${id}/download/${format}`, { responseType: 'blob' }),
};

export default documentTemplateService;
