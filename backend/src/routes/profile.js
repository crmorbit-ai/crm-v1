const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePassword,
  uploadProfilePicture,
  updateOrganization
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

// ════════════════════════════════════════════════════════════════
// PROFILE ROUTES
// ════════════════════════════════════════════════════════════════

// All routes require authentication
router.use(protect);

// Get and update profile
router.route('/')
  .get(getProfile)
  .put(updateProfile);

// Update password
router.put('/password', updatePassword);

// Upload profile picture
router.post('/upload-picture', uploadProfilePicture);

// Update organization information
router.put('/organization', updateOrganization);

module.exports = router;
