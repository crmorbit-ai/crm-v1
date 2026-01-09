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
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer'); // For logo uploads
const passport = require('../config/passport'); // For Google OAuth

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

module.exports = router;