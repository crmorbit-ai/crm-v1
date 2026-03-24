import api from './api';

const socialService = {
  // Accounts
  getAccounts:       ()               => api.get('/social/accounts'),
  saveAccount:       (data)           => api.post('/social/accounts', data),
  disconnectAccount: (platform)       => api.delete(`/social/accounts/${platform}`),

  // Posts
  getPosts:  (params) => api.get('/social/posts', { params }),
  createPost:(data)   => api.post('/social/posts', data),
  updatePost:(id,data)=> api.put(`/social/posts/${id}`, data),
  deletePost:(id)     => api.delete(`/social/posts/${id}`),

  // Stats
  getStats: () => api.get('/social/stats'),

  // Media upload
  uploadMedia: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/social/upload-media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export default socialService;
