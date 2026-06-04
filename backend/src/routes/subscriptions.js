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
  refundPayment,
  getAllPayments,
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

// Tenant routes (protected - all tenant users can view/manage their subscription)
router.get('/current', protect, getCurrentSubscription);
router.post('/upgrade', protect, upgradePlan);
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify-payment', protect, verifySubscriptionPayment);
router.post('/cancel', protect, cancelSubscription);
router.get('/payment-history', protect, getPaymentHistory);
router.get('/receipt/:paymentId', protect, downloadReceipt);
router.post('/refund', protect, requireSaasAccess, refundPayment);

// SAAS Admin routes
router.get('/all', protect, requireSaasAccess, getAllSubscriptions);
router.get('/all-payments', protect, requireSaasAccess, getAllPayments);
router.put('/plans/:planId', protect, requireSaasAccess, updatePlan);
router.put('/:tenantId', protect, requireSaasAccess, updateTenantSubscription);

module.exports = router;
