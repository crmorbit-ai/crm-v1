import api from './api';

const emailService = {
  // Get all emails with filters
  getEmails: (params = {}) => {
    return api.get('/emails', { params });
  },

  // Get single email
  getEmail: (id) => {
    return api.get(`/emails/${id}`);
  },

  // Get email thread
  getThread: (messageId) => {
    return api.get(`/emails/thread/${messageId}`);
  },

  // Get emails for entity (Lead, Contact, etc.)
  getEntityEmails: (entityType, entityId) => {
    return api.get(`/emails/entity/${entityType}/${entityId}`);
  },

  // Send email
  sendEmail: (data) => {
    return api.post('/emails/send', data);
  },

  // Sync emails
  syncEmails: () => {
    return api.post('/emails/sync');
  },

  // Get stats
  getStats: () => {
    return api.get('/emails/stats/overview');
  },

  // Mark as read
  markAsRead: (id) => {
    return api.patch(`/emails/${id}/read`);
  },

  // Delete email
  deleteEmail: (id) => {
    return api.delete(`/emails/${id}`);
  }
};

export default emailService;
