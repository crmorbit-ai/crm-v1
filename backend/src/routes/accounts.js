const express = require('express');
const router = express.Router();
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountStats
} = require('../controllers/accountController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication
router.use(protect);

// Statistics route (must be before /:id route)
router.get('/stats', requirePermission('account_management', 'read'), getAccountStats);

// CRUD routes
router.route('/')
  .get(requirePermission('account_management', 'read'), getAccounts)
  .post(requirePermission('account_management', 'create'), createAccount);

router.route('/:id')
  .get(requirePermission('account_management', 'read'), getAccount)
  .put(requirePermission('account_management', 'update'), updateAccount)
  .delete(requirePermission('account_management', 'delete'), deleteAccount);

module.exports = router;
