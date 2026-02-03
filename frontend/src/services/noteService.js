import api from './api';

export const noteService = {
  getNotes: async (params) => {
    return await api.get('/notes', { params });
  },

  getNote: async (id) => {
    return await api.get(`/notes/${id}`);
  },

  createNote: async (data) => {
    return await api.post('/notes', data);
  },

  updateNote: async (id, data) => {
    return await api.put(`/notes/${id}`, data);
  },

  deleteNote: async (id) => {
    return await api.delete(`/notes/${id}`);
  }
};

export default noteService;