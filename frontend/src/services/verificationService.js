import api from './api';

/**
 * ✅ VERIFICATION SERVICE
 * Real-time email and phone verification
 */
export const verificationService = {
  /**
   * Verify email address
   * @param {string} email - Email to verify
   * @returns {Promise} Verification result
   */
  verifyEmail: async (email) => {
    try {
      const response = await api.post('/leads/verify-email', { email });
      return response;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },

  /**
   * Verify phone number
   * @param {string} phone - Phone to verify
   * @returns {Promise} Verification result
   */
  verifyPhone: async (phone) => {
    try {
      const response = await api.post('/leads/verify-phone', { phone });
      return response;
    } catch (error) {
      console.error('Phone verification error:', error);
      throw error;
    }
  }
};

/**
 * ✅ DEBOUNCE FUNCTION
 * Delays function execution until after wait time
 */
export const debounce = (func, wait = 2000) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};