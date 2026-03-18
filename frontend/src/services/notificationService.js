import api from './api';

const notificationService = {
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response;
  },

  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response;
  },

  getPreferences: async () => {
    const response = await api.get('/notifications/preferences');
    return response;
  },

  updatePreferences: async (prefs) => {
    const response = await api.put('/notifications/preferences', prefs);
    return response;
  }
};

export default notificationService;
