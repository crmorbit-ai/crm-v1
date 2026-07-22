import axios from 'axios';
import { API_URL } from '../config/api.config';

// Use centralized API URL from config

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token'); // Support both (migration)
    // Only add token if it's a valid string (not "null" or "undefined")
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Don't unwrap blob responses - return full response for file downloads
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Handle 401 unauthorized
      if (error.response.status === 401) {
        // Exception: Don't auto-logout for tenant admin password verification errors
        const isPasswordVerification = error.config?.url?.includes('/verify-tenant-admin-password');

        if (!isPasswordVerification) {
          sessionStorage.removeItem('token');
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }

      // Handle 403 permission denied — show global toast
      // Exception: account deletion errors are NOT permission errors, pass them through silently
      // Exception: All GET requests should fail silently (data fetches for stats, dropdowns, etc.)
      if (error.response.status === 403) {
        const responseData = error.response.data || {};
        const errorCode = responseData?.errors?.code;
        const isDeletionError = errorCode === 'ACCOUNT_DELETED' || errorCode === 'DELETION_PENDING';

        // Only show toast for non-GET requests (POST, PUT, DELETE actions)
        const isGetRequest = error.config?.method?.toLowerCase() === 'get';

        if (!isDeletionError && !isGetRequest) {
          const msg = responseData?.message || 'You do not have permission to perform this action';
          window.dispatchEvent(new CustomEvent('app:permission-denied', { detail: { message: msg } }));
        }

        return Promise.reject({ ...responseData, isPermissionDenied: !isDeletionError });
      }

      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
