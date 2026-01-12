import api from './api';

const fieldDefinitionService = {
  // Get all field definitions for an entity type
  getFieldDefinitions: async (entityType, includeInactive = false) => {
    const params = includeInactive ? { includeInactive: true } : {};
    const response = await api.get(`/field-definitions/${entityType}`, { params });
    return response.data;
  },

  // Get a single field definition by ID
  getFieldDefinition: async (id) => {
    const response = await api.get(`/field-definitions/detail/${id}`);
    return response.data;
  },

  // Create a new field definition
  createFieldDefinition: async (fieldData) => {
    const response = await api.post('/field-definitions', fieldData);
    return response.data;
  },

  // Update a field definition
  updateFieldDefinition: async (id, fieldData) => {
    const response = await api.put(`/field-definitions/${id}`, fieldData);
    return response.data;
  },

  // Toggle field active status (enable/disable)
  toggleFieldStatus: async (id, isActive) => {
    const response = await api.put(`/field-definitions/${id}`, { isActive });
    return response.data;
  },

  // Delete a field definition (soft delete)
  deleteFieldDefinition: async (id) => {
    const response = await api.delete(`/field-definitions/${id}`);
    return response.data;
  },

  // Permanently delete a field definition
  permanentDeleteFieldDefinition: async (id) => {
    const response = await api.delete(`/field-definitions/${id}/permanent`);
    return response.data;
  },

  // Reorder field definitions
  reorderFieldDefinitions: async (fields) => {
    const response = await api.put('/field-definitions/reorder', { fields });
    return response.data;
  },

  // Get field statistics
  getFieldStats: async (entityType) => {
    const response = await api.get(`/field-definitions/${entityType}/stats`);
    return response.data;
  },

  // Seed standard fields for current tenant
  seedStandardFields: async () => {
    const response = await api.post('/field-definitions/seed-standard-fields');
    return response.data;
  }
};

export default fieldDefinitionService;
