import api from './api';

// Note: api.js interceptor already returns response.data, so we return directly

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
  },

  registerTenant: async (formData) => {
    const response = await api.post('/auth/register-tenant', formData);
    return response;
  },

  // Two-step registration with email verification
  registerStep1: async (formData) => {
    const response = await api.post('/auth/register-step1', formData);
    return response;
  },

  verifyEmail: async (email, otp) => {
    const response = await api.post('/auth/verify-email', { email, otp });
    return response;
  },

  resendOTP: async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response;
  },

  completeProfile: async (profileData) => {
    const formData = new FormData();

    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== null && profileData[key] !== undefined && profileData[key] !== '') {
        formData.append(key, profileData[key]);
      }
    });

    const response = await api.post('/auth/complete-profile', formData);
    return response;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
  },

  // Register method (alias for registerStep1)
  register: async (formData) => {
    const response = await api.post('/auth/register-step1', formData);
    return response;
  }
};
