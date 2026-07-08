import api from './api';

const couponService = {
  // SAAS Admin - Create coupon
  createCoupon: async (data) => {
    const response = await api.post('/coupons', data);
    return response.data;
  },

  // SAAS Admin - Get all coupons
  getAllCoupons: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/coupons', { params });
    return response.data;
  },

  // Validate coupon code
  validateCoupon: async (code) => {
    const response = await api.get(`/coupons/validate/${code}`);
    return response.data;
  },

  // Tenant - Apply coupon
  applyCoupon: async (code) => {
    const response = await api.post('/coupons/apply', { code });
    return response.data;
  },

  // SAAS Admin - Revoke license
  revokeLicense: async (tenantId, reason) => {
    const response = await api.post(`/coupons/revoke/${tenantId}`, { reason });
    return response.data;
  },

  // SAAS Admin - Re-enable license
  reEnableLicense: async (tenantId, couponCode = null) => {
    const response = await api.post(`/coupons/re-enable/${tenantId}`, { couponCode });
    return response.data;
  },

  // SAAS Admin - Delete coupon
  deleteCoupon: async (couponId) => {
    const response = await api.delete(`/coupons/${couponId}`);
    return response.data;
  },

  // Get my license info
  getMyLicense: async () => {
    const response = await api.get('/coupons/my-license');
    return response.data;
  }
};

export default couponService;
