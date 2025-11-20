import api from './api';

export const noteService = {
  getNotes: async (params) => {
    const response = await api.get('/notes', { params });
    return response.data;
  },

  getNote: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  createNote: async (data) => {
    const response = await api.post('/notes', data);
    return response.data;
  },

  updateNote: async (id, data) => {
    const response = await api.put(`/notes/${id}`, data);
    return response.data;
  },

  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  }
};

export default noteService;