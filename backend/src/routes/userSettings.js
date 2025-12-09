const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserSettings,
  updateEmailConfig,
  testEmailConfig,
  configurePremiumSmtp
} = require('../controllers/userSettingsController');

// All routes are protected
router.use(protect);

// Get user settings
router.get('/', getUserSettings);

// Update email configuration (free tier)
router.put('/email-config', updateEmailConfig);

// Configure premium SMTP (after purchasing product)
router.post('/premium-smtp', configurePremiumSmtp);

// Test email configuration
router.post('/test-email', testEmailConfig);

module.exports = router;
