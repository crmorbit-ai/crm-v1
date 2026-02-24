const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getProfile,
  updateProfile,
  updatePassword,
  uploadProfilePicture,
  updateOrganization,
  uploadLogo
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

// Memory storage for image uploads — files go to Cloudinary, no disk needed
const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

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
router.post('/upload-picture', imageUpload.single('profilePicture'), uploadProfilePicture);

// Update organization information
router.put('/organization', updateOrganization);

// Upload organization logo (multipart → Cloudinary)
router.post('/upload-logo', imageUpload.single('logo'), uploadLogo);

module.exports = router;
