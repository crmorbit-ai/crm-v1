const express = require('express');
const router = express.Router();
const { 
  login, 
  registerTenant, 
  getMe, 
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// ════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ════════════════════════════════════════════════════════════════

// Authentication
router.post('/login', login);
router.post('/register-tenant', registerTenant);

// Password Reset - OTP Based System
router.post('/forgot-password', forgotPassword);      // Step 1: Send OTP to email
router.post('/verify-otp', verifyOTP);               // Step 2: Verify OTP code
router.post('/reset-password', resetPassword);       // Step 3: Reset password with verified OTP

// ════════════════════════════════════════════════════════════════
// PROTECTED ROUTES (Require Authentication)
// ════════════════════════════════════════════════════════════════

// User Profile
router.get('/me', protect, getMe);

// Logout
router.post('/logout', protect, logout);

// Change Password (Dashboard)
router.post('/change-password', protect, changePassword);

module.exports = router;