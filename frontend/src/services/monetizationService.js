import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api.config';

const API_URL = `${BASE_API_URL}/monetization`;

const h = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  },
});

// Tenant
export const tenantCheckAccess = () => axios.get(`${API_URL}/tenant/check-access`, h()).then(r => r.data);
export const tenantGetOverview = () => axios.get(`${API_URL}/tenant/overview`,      h()).then(r => r.data);
export const tenantCancel      = (reason, details) => axios.post(`${API_URL}/tenant/cancel`, { reason, details }, h()).then(r => r.data);

// SAAS Admin — Analytics
export const getOverview            = () => axios.get(`${API_URL}/overview`,              h()).then(r => r.data);
export const getRevenueAnalytics    = () => axios.get(`${API_URL}/revenue-analytics`,     h()).then(r => r.data);
export const getChurnManagement     = () => axios.get(`${API_URL}/churn-management`,      h()).then(r => r.data);
export const getUpsellCrosssell     = () => axios.get(`${API_URL}/upsell-crosssell`,      h()).then(r => r.data);
export const getFeatureAnalytics    = () => axios.get(`${API_URL}/feature-analytics`,     h()).then(r => r.data);
export const getSubscriptionMetrics = () => axios.get(`${API_URL}/subscription-metrics`,  h()).then(r => r.data);
export const getHealthScores        = () => axios.get(`${API_URL}/health-scores`,         h()).then(r => r.data);
export const getPlanHistory         = (tid) => axios.get(`${API_URL}/plan-history${tid ? `?tenantId=${tid}` : ''}`, h()).then(r => r.data);

// SAAS Admin — Actions
export const getFeatureStatus = ()                         => axios.get(`${API_URL}/feature-status`, h()).then(r => r.data);
export const toggleFeature    = (planId, feature, enabled) => axios.put(`${API_URL}/feature-toggle/${planId}`, { feature, enabled }, h()).then(r => r.data);
export const cancelSubscription = (data)                   => axios.post(`${API_URL}/cancel`,       data, h()).then(r => r.data);
export const changePlan         = (data)                   => axios.post(`${API_URL}/change-plan`,  data, h()).then(r => r.data);
export const getSaasUsers       = ()                        => axios.get(`${API_URL}/saas-users`,    h()).then(r => r.data);
export const assignManager      = (tenantId, managerId)    => axios.put(`${API_URL}/assign-manager/${tenantId}`, { managerId }, h()).then(r => r.data);
