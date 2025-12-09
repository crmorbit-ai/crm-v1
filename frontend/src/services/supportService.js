import api from './api';

const supportService = {
  // Create new ticket
  createTicket: async (ticketData) => {
    return api.post('/support-tickets', ticketData);
  },

  // Get all tickets (filtered by role automatically on backend)
  getAllTickets: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/support-tickets?${queryParams}`);
  },

  // Get single ticket
  getTicket: async (id) => {
    return api.get(`/support-tickets/${id}`);
  },

  // Add message to ticket
  addMessage: async (id, message, isInternal = false) => {
    return api.post(`/support-tickets/${id}/messages`, { message, isInternal });
  },

  // Update ticket status (SAAS Admin only)
  updateStatus: async (id, status, resolutionNotes = '') => {
    return api.put(`/support-tickets/${id}/status`, { status, resolutionNotes });
  },

  // Assign ticket (SAAS Admin only)
  assignTicket: async (id, assignTo = null) => {
    return api.put(`/support-tickets/${id}/assign`, { assignTo });
  },

  // Get statistics (SAAS Admin only)
  getStats: async () => {
    return api.get('/support-tickets/stats');
  },

  // Delete ticket (SAAS Admin only)
  deleteTicket: async (id) => {
    return api.delete(`/support-tickets/${id}`);
  }
};

export default supportService;
