const express = require('express');
const router = express.Router();
const {
  login,
  registerTenant,
  registerStep1, // NEW
  verifyEmailSignup, // NEW
  resendVerificationOTP, // NEW
  completeProfile, // NEW
  googleOAuthInitiate, // NEW
  googleOAuthCallback, // NEW
  getMe,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  verifyTenantAdminPassword // NEW
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const passport = require('../config/passport'); // For Google OAuth
// Memory storage — logo goes to Cloudinary, no disk needed
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ════════════════════════════════════════════════════════════════

// Authentication
router.post('/login', login);
router.post('/register-tenant', registerTenant); // OLD (kept for backward compatibility)

// 🆕 NEW Two-Step Registration with Email Verification
router.post('/register-step1', registerStep1);           // Step 1: Initial signup (sends OTP)
router.post('/verify-email', verifyEmailSignup);         // Step 2: Verify email with OTP
router.post('/resend-otp', resendVerificationOTP);       // Resend verification OTP

// 🆕 Google OAuth Routes
router.get('/google', googleOAuthInitiate);                                                    // Initiate OAuth flow
router.get('/google/callback', passport.authenticate('google', { session: false }), googleOAuthCallback); // OAuth callback

// Password Reset - OTP Based System
router.post('/forgot-password', forgotPassword);      // Step 1: Send OTP to email
router.post('/verify-otp', verifyOTP);               // Step 2: Verify OTP code
router.post('/reset-password', resetPassword);       // Step 3: Reset password with verified OTP

// ════════════════════════════════════════════════════════════════
// PROTECTED ROUTES (Require Authentication)
// ════════════════════════════════════════════════════════════════

// User Profile
router.get('/me', protect, getMe);

// 🆕 Profile Completion (with file upload for logo)
router.post('/complete-profile', protect, upload.single('logo'), completeProfile);

// Logout
router.post('/logout', protect, logout);

// Change Password (Dashboard)
router.post('/change-password', protect, changePassword);

// Verify Tenant Admin Password (used when creating user without email)
router.post('/verify-tenant-admin-password', protect, verifyTenantAdminPassword);

module.exports = router;