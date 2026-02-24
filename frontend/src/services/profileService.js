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
    // Clean up empty nested objects
    const cleanData = { ...data };

    // Remove empty string values from nested objects
    if (cleanData.socialMedia) {
      Object.keys(cleanData.socialMedia).forEach(key => {
        if (cleanData.socialMedia[key] === '') delete cleanData.socialMedia[key];
      });
      if (Object.keys(cleanData.socialMedia).length === 0) delete cleanData.socialMedia;
    }

    if (cleanData.headquarters) {
      Object.keys(cleanData.headquarters).forEach(key => {
        if (cleanData.headquarters[key] === '') delete cleanData.headquarters[key];
      });
      if (Object.keys(cleanData.headquarters).length === 0) delete cleanData.headquarters;
    }

    if (cleanData.keyContact) {
      Object.keys(cleanData.keyContact).forEach(key => {
        if (cleanData.keyContact[key] === '') delete cleanData.keyContact[key];
      });
      if (Object.keys(cleanData.keyContact).length === 0) delete cleanData.keyContact;
    }

    return await api.put('/profile/organization', cleanData);
  }
};

export default profileService;
