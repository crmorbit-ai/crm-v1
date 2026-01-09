import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  registerTenant: async (formData) => {
    const response = await api.post('/auth/register-tenant', formData);
    return response.data;
  },

  // NEW: Two-step registration with email verification
  registerStep1: async (formData) => {
    const response = await api.post('/auth/register-step1', formData);
    return response.data;
  },

  verifyEmail: async (email, otp) => {
    const response = await api.post('/auth/verify-email', { email, otp });
    return response.data;
  },

  resendOTP: async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  completeProfile: async (profileData) => {
    // Create FormData for multipart/form-data (logo upload)
    const formData = new FormData();

    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== null && profileData[key] !== undefined && profileData[key] !== '') {
        formData.append(key, profileData[key]);
      }
    });

    // Log FormData contents for debugging
    console.log('📤 Sending profile data:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    // Don't manually set Content-Type - axios will set it automatically with boundary
    const response = await api.post('/auth/complete-profile', formData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
  }
};
