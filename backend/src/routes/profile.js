const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePassword,
  uploadProfilePicture,
  updateOrganization,
  uploadLogo
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

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

// Upload organization logo (multipart)
router.post('/upload-logo', upload.single('logo'), uploadLogo);

module.exports = router;
