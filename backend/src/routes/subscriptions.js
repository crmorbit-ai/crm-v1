const express = require('express');
const router = express.Router();
const {
  getAllPlans,
  getCurrentSubscription,
  upgradePlan,
  createPaymentOrder,
  verifySubscriptionPayment,
  getPaymentHistory,
  downloadReceipt,
  cancelSubscription,
  getAllSubscriptions,
  updateTenantSubscription,
  updatePlan
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

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

// Tenant routes (protected with permission check)
router.get('/current', protect, requirePermission('subscription_management', 'read'), getCurrentSubscription);
router.post('/upgrade', protect, requirePermission('subscription_management', 'manage'), upgradePlan);
router.post('/create-order', protect, requirePermission('subscription_management', 'manage'), createPaymentOrder);
router.post('/verify-payment', protect, requirePermission('subscription_management', 'manage'), verifySubscriptionPayment);
router.post('/cancel', protect, requirePermission('subscription_management', 'manage'), cancelSubscription);
router.get('/payment-history', protect, requirePermission('subscription_management', 'read'), getPaymentHistory);
router.get('/receipt/:paymentId', protect, requirePermission('subscription_management', 'read'), downloadReceipt);

// SAAS Admin routes
router.get('/all', protect, requireSaasAccess, getAllSubscriptions);
router.put('/plans/:planId', protect, requireSaasAccess, updatePlan);
router.put('/:tenantId', protect, requireSaasAccess, updateTenantSubscription);

module.exports = router;
