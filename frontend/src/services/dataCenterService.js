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
 * 🚀 Upload CSV/Excel file with candidates
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

const dataCenterService = {
  getCandidates,
  getCandidate,
  getStats,
  moveToLeads,
  bulkImportCandidates,
  uploadFile,
  exportCandidates
};

export default dataCenterService;