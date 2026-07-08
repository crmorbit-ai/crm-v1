const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const couponController = require('../controllers/couponController');

// Tenant routes - require authentication
router.get('/my-license', protect, couponController.getMyLicense);
router.get('/validate/:code', protect, couponController.validateCoupon);
router.post('/apply', protect, couponController.applyCoupon);

// SAAS Admin only routes
router.post('/', protect, restrictTo('SAAS_OWNER', 'SAAS_ADMIN'), couponController.createCoupon);
router.get('/', protect, restrictTo('SAAS_OWNER', 'SAAS_ADMIN'), couponController.getAllCoupons);
router.post('/revoke/:tenantId', protect, restrictTo('SAAS_OWNER', 'SAAS_ADMIN'), couponController.revokeLicense);
router.post('/re-enable/:tenantId', protect, restrictTo('SAAS_OWNER', 'SAAS_ADMIN'), couponController.reEnableLicense);
router.delete('/:couponId', protect, restrictTo('SAAS_OWNER', 'SAAS_ADMIN'), couponController.deleteCoupon);

module.exports = router;
