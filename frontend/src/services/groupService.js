import api from './api';

export const groupService = {
  getGroups: async (params) => {
    const response = await api.get('/groups', { params });
    return response.data;
  },

  getGroup: async (id) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  updateGroup: async (id, groupData) => {
    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
  },

  deleteGroup: async (id) => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },

  addMembers: async (id, members) => {
    const response = await api.post(`/groups/${id}/members`, { members });
    return response.data;
  },

  removeMembers: async (id, members) => {
    const response = await api.delete(`/groups/${id}/members`, { data: { members } });
    return response.data;
  },

  assignRoles: async (id, roles) => {
    const response = await api.post(`/groups/${id}/roles`, { roles });
    return response.data;
  },

  removeRoles: async (id, roles) => {
    const response = await api.delete(`/groups/${id}/roles`, { data: { roles } });
    return response.data;
  }
};
