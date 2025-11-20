const express = require('express');
const router = express.Router();
const {
  getAllPlans,
  getCurrentSubscription,
  upgradePlan,
  cancelSubscription,
  getAllSubscriptions,
  updateTenantSubscription
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Helper function for SAAS access check
const requireSaasAccess = (req, res, next) => {
  if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. SAAS admin only.'
  });
};

// Public routes
router.get('/plans', getAllPlans);

// Tenant routes (protected)
router.get('/current', protect, getCurrentSubscription);
router.post('/upgrade', protect, upgradePlan);
router.post('/cancel', protect, cancelSubscription);

// SAAS Admin routes
router.get('/all', protect, requireSaasAccess, getAllSubscriptions);
router.put('/:tenantId', protect, requireSaasAccess, updateTenantSubscription);

module.exports = router;