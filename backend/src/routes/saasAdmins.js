const express = require('express');
const router = express.Router();
const { protect, requireSaasAccess } = require('../middleware/auth');
const {
  getAllSaasAdmins,
  initiateSaasAdmin,
  verifySaasAdmin,
  resendOtp,
  updateSaasAdmin,
  removeSaasAdmin,
  resetPassword,
  getMyProfile,
  setViewingCredentials,
  verifyViewingCredentials,
  forgotViewingCredentials,
  resetViewingCredentials,
  getViewingPinStatus,
  setViewingPin,
  verifyViewingPin,
  changeViewingPin,
  forgotViewingPin,
  resetViewingPin
} = require('../controllers/saasAdminController');

// All routes require SAAS access
router.use(protect);
router.use(requireSaasAccess);

// Middleware to check if user is Primary Owner
// All emails in SAAS_ADMIN_EMAILS are treated as primary owners
const requirePrimaryOwner = (req, res, next) => {
  const saasAdminEmails = (process.env.SAAS_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e);

  if (!saasAdminEmails.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({
      success: false,
      message: 'Only Primary Owner can perform this action'
    });
  }

  next();
};

// Routes accessible by all SAAS admins
router.get('/me', getMyProfile);
router.post('/set-viewing-credentials', setViewingCredentials);
router.post('/verify-viewing-credentials', verifyViewingCredentials);
router.post('/forgot-viewing-credentials', forgotViewingCredentials);
router.post('/reset-viewing-credentials', resetViewingCredentials);

// Viewing PIN routes
router.get('/viewing-pin/status', getViewingPinStatus);
router.post('/viewing-pin/set', setViewingPin);
router.post('/viewing-pin/verify', verifyViewingPin);
router.post('/viewing-pin/change', changeViewingPin);
router.post('/viewing-pin/forgot', forgotViewingPin);
router.post('/viewing-pin/reset', resetViewingPin);

// Routes only for Primary Owner
router.get('/', requirePrimaryOwner, getAllSaasAdmins);
router.post('/initiate', requirePrimaryOwner, initiateSaasAdmin);
router.post('/verify', requirePrimaryOwner, verifySaasAdmin);
router.post('/resend-otp', requirePrimaryOwner, resendOtp);
router.put('/:id', requirePrimaryOwner, updateSaasAdmin);
router.delete('/:id', requirePrimaryOwner, removeSaasAdmin);
router.post('/:id/reset-password', requirePrimaryOwner, resetPassword);

module.exports = router;
