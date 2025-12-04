import api from './api';

/**
 * Get all candidates from Data Center with filters
 */
export const getCandidates = async (params) => {
  return await api.get('/data-center', { params });
};

/**
 * Get single candidate
 */
export const getCandidate = async (id) => {
  return await api.get(`/data-center/${id}`);
};

/**
 * Create a new candidate
 */
export const createCandidate = async (data) => {
  return await api.post('/data-center', data);
};

/**
 * Get Data Center statistics
 */
export const getStats = async () => {
  return await api.get('/data-center/stats');
};

/**
 * Move selected candidates to Leads
 */
export const moveToLeads = async (data) => {
  return await api.post('/data-center/move-to-leads', data);
};

/**
 * Bulk import candidates
 */
export const bulkImportCandidates = async (candidates) => {
  return await api.post('/data-center/bulk-import', { candidates });
};

/**
 * Upload CSV/Excel file with candidates
 */
export const uploadFile = async (formData) => {
  return await api.post('/data-center/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * Export candidates to Excel
 */
export const exportCandidates = async (candidateIds) => {
  const response = await api.post('/data-center/export', { candidateIds }, {
    responseType: 'blob'
  });
  return response;
};

// 🆕 CUSTOM FIELD TEMPLATE APIs

/**
 * Get all custom field templates
 */
export const getCustomFieldTemplates = async () => {
  return await api.get('/data-center/custom-field-templates');
};

/**
 * Create new custom field template
 */
export const createCustomFieldTemplate = async (data) => {
  return await api.post('/data-center/custom-field-templates', data);
};

/**
 * Update custom field template
 */
export const updateCustomFieldTemplate = async (id, data) => {
  return await api.put(`/data-center/custom-field-templates/${id}`, data);
};

/**
 * Delete custom field template
 */
export const deleteCustomFieldTemplate = async (id) => {
  return await api.delete(`/data-center/custom-field-templates/${id}`);
};

/**
 * Use template (increment usage count)
 */
export const useTemplate = async (id) => {
  return await api.post(`/data-center/custom-field-templates/${id}/use`);
};

const dataCenterService = {
  getCandidates,
  getCandidate,
  createCandidate,
  getStats,
  moveToLeads,
  bulkImportCandidates,
  uploadFile,
  exportCandidates,
  getCustomFieldTemplates,
  createCustomFieldTemplate,
  updateCustomFieldTemplate,
  deleteCustomFieldTemplate,
  useTemplate
};

export default dataCenterService;