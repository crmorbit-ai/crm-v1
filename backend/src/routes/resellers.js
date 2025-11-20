const express = require('express');
const router = express.Router();
const {
  registerReseller,
  resellerLogin,
  getResellerDashboard,
  getAllResellers,
  getResellerById,
  updateResellerStatus,
  updateResellerCommission
} = require('../controllers/resellerController');
const { protect, requireSaasAccess, requireReseller } = require('../middleware/auth');

// Public routes
router.post('/register', registerReseller);
router.post('/login', resellerLogin);

// Reseller protected routes (only resellers can access)
router.get('/dashboard', protect, requireReseller, getResellerDashboard);

// SAAS Admin routes (only SAAS admin can access)
router.get('/', protect, requireSaasAccess, getAllResellers);
router.get('/:id', protect, requireSaasAccess, getResellerById);
router.put('/:id/status', protect, requireSaasAccess, updateResellerStatus);
router.put('/:id/commission', protect, requireSaasAccess, updateResellerCommission);

module.exports = router;