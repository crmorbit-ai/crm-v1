import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '';

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const submitFeedback = (data) =>
  axios.post(`${BASE}/api/feedback`, data, auth()).then(r => r.data);

export const getMyFeedback = (params = {}) =>
  axios.get(`${BASE}/api/feedback/mine`, { ...auth(), params }).then(r => r.data);

export const getAllFeedback = (params = {}) =>
  axios.get(`${BASE}/api/feedback`, { ...auth(), params }).then(r => r.data);

export const getFeedbackById = (id) =>
  axios.get(`${BASE}/api/feedback/${id}`, auth()).then(r => r.data);

export const replyToFeedback = (id, reply) =>
  axios.post(`${BASE}/api/feedback/${id}/reply`, { reply }, auth()).then(r => r.data);

export const updateFeedbackStatus = (id, status) =>
  axios.patch(`${BASE}/api/feedback/${id}/status`, { status }, auth()).then(r => r.data);

export const addInternalNote = (id, note) =>
  axios.post(`${BASE}/api/feedback/${id}/notes`, { note }, auth()).then(r => r.data);

export const deleteFeedback = (id) =>
  axios.delete(`${BASE}/api/feedback/${id}`, auth()).then(r => r.data);

export const getFeedbackAnalytics = (days = 30) =>
  axios.get(`${BASE}/api/feedback/analytics`, { ...auth(), params: { days } }).then(r => r.data);
