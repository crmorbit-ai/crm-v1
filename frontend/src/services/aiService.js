import axios from 'axios';
import { API_URL } from '../config/api.config';

// Get auth token (use central config)
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const aiService = {
  // AI Chat
  chat: async (message, context = {}) => {
    const response = await axios.post(
      `${API_URL}/ai/chat`,
      { message, context },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Generate Email Draft
  generateEmail: async ({ to, subject, purpose, tone, entityType, entityId }) => {
    const response = await axios.post(
      `${API_URL}/ai/generate-email`,
      { to, subject, purpose, tone, entityType, entityId },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Summarize Lead/Contact
  summarize: async (entityType, entityId) => {
    const response = await axios.post(
      `${API_URL}/ai/summarize`,
      { entityType, entityId },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Analyze Email Sentiment
  analyzeSentiment: async (emailContent) => {
    const response = await axios.post(
      `${API_URL}/ai/analyze-sentiment`,
      { emailContent },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get Follow-up Suggestions
  getFollowUpSuggestions: async (entityType, entityId) => {
    const response = await axios.post(
      `${API_URL}/ai/follow-up-suggestions`,
      { entityType, entityId },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Process Voice Note
  processVoiceNote: async (transcription) => {
    const response = await axios.post(
      `${API_URL}/ai/process-voice`,
      { transcription },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Smart Search
  smartSearch: async (query) => {
    const response = await axios.post(
      `${API_URL}/ai/smart-search`,
      { query },
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};

export default aiService;
