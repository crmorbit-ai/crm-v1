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
    const token = localStorage.getItem('token');
    if (token) {
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
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      // Handle 403 permission denied — show global toast
      if (error.response.status === 403) {
        const msg = error.response.data?.message || 'You do not have permission to perform this action';
        window.dispatchEvent(new CustomEvent('app:permission-denied', { detail: { message: msg } }));
        return Promise.reject({ ...(error.response.data || {}), isPermissionDenied: true });
      }

      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
