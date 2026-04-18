import api from './api';

const BASE = '/org-nodes';

export const getTree           = (tenantId) => api.get(`${BASE}${tenantId ? `?tenantId=${tenantId}` : ''}`);
export const getTenantUsers    = (tenantId) => api.get(`${BASE}/tenant-users${tenantId ? `?tenantId=${tenantId}` : ''}`);
export const searchEmployees   = (q, tenantId) => api.get(`${BASE}/search?q=${encodeURIComponent(q)}${tenantId ? `&tenantId=${tenantId}` : ''}`);
export const createNode        = (data) => api.post(BASE, data);
export const updateNode        = (id, data) => api.put(`${BASE}/${id}`, data);
export const moveNode          = (id, data) => api.put(`${BASE}/${id}/move`, data);
export const deleteNode        = (id, deleteChildren = false) => api.delete(`${BASE}/${id}?deleteChildren=${deleteChildren}`);
export const bulkReorder       = (items) => api.put(`${BASE}/bulk-reorder`, { items });
export const clearAll          = () => api.delete(`${BASE}/clear-all`);
