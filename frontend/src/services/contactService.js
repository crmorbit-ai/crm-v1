import api from './api';

export const contactService = {
  // Get all contacts
  getContacts: async (params) => {
    const response = await api.get('/contacts', { params });
    return response;
  },

  // Get single contact
  getContact: async (id) => {
    const response = await api.get(`/contacts/${id}`);
    return response;
  },

  // Create contact
  createContact: async (contactData) => {
    const response = await api.post('/contacts', contactData);
    return response;
  },

  // Update contact
  updateContact: async (id, contactData) => {
    const response = await api.put(`/contacts/${id}`, contactData);
    return response;
  },

  // Delete contact
  deleteContact: async (id) => {
    const response = await api.delete(`/contacts/${id}`);
    return response;
  },

  // Get contact statistics
  getContactStats: async () => {
    const response = await api.get('/contacts/stats');
    return response;
  }
};
