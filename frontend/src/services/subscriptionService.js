import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api.config';

const API_URL = `${BASE_API_URL}/subscriptions`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Get all subscription plans
export const getAllPlans = async () => {
  try {
    const response = await axios.get(`${API_URL}/plans`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get current subscription
export const getCurrentSubscription = async () => {
  try {
    const response = await axios.get(`${API_URL}/current`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Upgrade plan
export const upgradePlan = async (planId, billingCycle) => {
  try {
    const response = await axios.post(
      `${API_URL}/upgrade`,
      { planId, billingCycle },
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Complete payment
export const completePayment = async (paymentId, gatewayDetails) => {
  try {
    const response = await axios.post(
      `${API_URL}/complete-payment`,
      { paymentId, ...gatewayDetails },
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Cancel subscription
export const cancelSubscription = async (reason) => {
  try {
    const response = await axios.post(
      `${API_URL}/cancel`,
      { reason },
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all subscriptions (SAAS Admin)
export const getAllSubscriptions = async (filters) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}/all?${params}`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update tenant subscription (SAAS Admin)
export const updateTenantSubscription = async (tenantId, updates) => {
  try {
    const response = await axios.put(
      `${API_URL}/${tenantId}`,
      updates,
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const subscriptionService = {
  getAllPlans,
  getCurrentSubscription,
  upgradePlan,
  completePayment,
  cancelSubscription,
  getAllSubscriptions,
  updateTenantSubscription
};