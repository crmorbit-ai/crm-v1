import api from './api';

export const taskService = {
  getTasks: async (params) => {
    return await api.get('/tasks', { params });
  },

  getTask: async (id) => {
    return await api.get(`/tasks/${id}`);
  },

  createTask: async (data) => {
    return await api.post('/tasks', data);
  },

  updateTask: async (id, data) => {
    return await api.put(`/tasks/${id}`, data);
  },

  deleteTask: async (id) => {
    return await api.delete(`/tasks/${id}`);
  }
};

export default taskService;