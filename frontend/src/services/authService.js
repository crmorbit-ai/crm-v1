import api from './api';

// Note: api.js interceptor already returns response.data, so we return directly

export const authService = {
  login: async (loginName, password) => {
    const response = await api.post('/auth/login', { loginName, password });
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
      const value = profileData[key];

      // Handle File objects separately (logo)
      if (value instanceof File) {
        formData.append(key, value);
        console.log(`📎 Appending file: ${key} (${value.name}, ${value.size} bytes)`);
      }
      // Handle other non-empty values
      else if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
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
  },

  verifyTenantAdminPassword: async (password) => {
    const response = await api.post('/auth/verify-tenant-admin-password', { password });
    return response;
  }
};
