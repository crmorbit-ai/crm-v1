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

  // Update organization information
  updateOrganization: async (data) => {
    return await api.put('/profile/organization', data);
  }
};

export default profileService;
