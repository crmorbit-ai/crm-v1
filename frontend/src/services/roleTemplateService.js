import api from './api';
const BASE = '/role-templates';
export const getTemplate    = ()       => api.get(BASE);
export const saveTemplate   = (data)   => api.post(BASE, data);
export const previewMatch   = (data)   => api.post(`${BASE}/preview-match`, data);
export const generateTree   = (data)   => api.post(`${BASE}/generate-tree`, data);
