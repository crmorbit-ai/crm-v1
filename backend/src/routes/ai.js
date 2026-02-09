const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  chat,
  generateEmail,
  summarize,
  analyzeSentiment,
  getFollowUpSuggestions,
  processVoiceNote,
  smartSearch
} = require('../controllers/aiController');

// All routes require authentication
router.use(protect);

// AI Chat
router.post('/chat', chat);

// Generate Email Draft
router.post('/generate-email', generateEmail);

// Summarize Lead/Contact
router.post('/summarize', summarize);

// Analyze Email Sentiment
router.post('/analyze-sentiment', analyzeSentiment);

// Get Follow-up Suggestions
router.post('/follow-up-suggestions', getFollowUpSuggestions);

// Process Voice Note
router.post('/process-voice', processVoiceNote);

// Smart Search
router.post('/smart-search', smartSearch);

module.exports = router;
