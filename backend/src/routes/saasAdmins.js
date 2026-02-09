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
  resetViewingCredentials
} = require('../controllers/saasAdminController');

// All routes require SAAS access
router.use(protect);
router.use(requireSaasAccess);

// Middleware to check if user is Primary Owner
const requirePrimaryOwner = (req, res, next) => {
  const primaryEmail = process.env.SAAS_OWNER_EMAIL?.toLowerCase();

  if (req.user.email.toLowerCase() !== primaryEmail) {
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

// Routes only for Primary Owner
router.get('/', requirePrimaryOwner, getAllSaasAdmins);
router.post('/initiate', requirePrimaryOwner, initiateSaasAdmin);
router.post('/verify', requirePrimaryOwner, verifySaasAdmin);
router.post('/resend-otp', requirePrimaryOwner, resendOtp);
router.put('/:id', requirePrimaryOwner, updateSaasAdmin);
router.delete('/:id', requirePrimaryOwner, removeSaasAdmin);
router.post('/:id/reset-password', requirePrimaryOwner, resetPassword);

module.exports = router;
