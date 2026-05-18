import api from './api';

const profileService = {
  // Get user profile
  getProfile: async () => {
    return await api.get('/profile');
  },

  // Update user profile
  updateProfile: async (data) => {
    return await api.put('/profile', data);
  },

  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    return await api.put('/profile/password', {
      currentPassword,
      newPassword
    });
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    return await api.post('/profile/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Upload organization logo as file (multipart/form-data)
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return await api.post('/profile/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Update organization information (including logo, contacts, address, digital presence)
  updateOrganization: async (data) => {
    return await api.put('/profile/organization', data);
  },

  // Request organization deletion
  requestDeletion: async (reason) => {
    return await api.post('/tenants/request-deletion', { reason });
  }
};

export default profileService;
