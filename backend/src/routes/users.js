const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  bulkCreateUsers,
  updateUser,
  deleteUser,
  assignRoles,
  assignGroups,
  resetUserPassword,
  deactivateUser,
  reactivateUser,
  permanentDeleteUser,
  sendUserCreationOTP,
  verifyUserCreationOTP
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All other routes are protected
router.use(protect);

// Simple list endpoint for assignment (protected but no permission check)
router.get('/list/all', async (req, res) => {
  try {
    const User = require('../models/User');
    console.log('📌 /users/list/all called, tenant:', req.user?.tenant);

    // Get users from same tenant
    const tenantId = req.user?.tenant;
    if (!tenantId) {
      console.log('⚠️ No tenant found');
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      tenant: tenantId,
      isActive: true
    })
      .select('_id firstName lastName email userType')
      .limit(100);

    console.log('✓ Returning', users.length, 'users for tenant', tenantId);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.json({ success: true, data: [] });
  }
});

// User CRUD routes
router.get('/', requirePermission('user_management', 'read'), getUsers);
router.get('/:id', requirePermission('user_management', 'read'), getUser);
router.post('/', requirePermission('user_management', 'create'), createUser);
router.post('/bulk', requirePermission('user_management', 'create'), bulkCreateUsers);
router.put('/:id', requirePermission('user_management', 'update'), updateUser);
router.delete('/:id', requirePermission('user_management', 'delete'), deleteUser);

// Role and group assignment
router.post('/:id/assign-roles', requirePermission('user_management', 'manage'), assignRoles);
router.post('/:id/assign-groups', requirePermission('user_management', 'manage'), assignGroups);

// Admin password reset
router.put('/:id/reset-password', requirePermission('user_management', 'manage'), resetUserPassword);

// User creation OTP verification
router.post('/send-creation-otp', sendUserCreationOTP);
router.post('/verify-creation-otp', verifyUserCreationOTP);

// SAAS Admin - User management
const { requireSaasAccess } = require('../middleware/auth');
router.post('/:id/deactivate', requireSaasAccess, deactivateUser);
router.post('/:id/reactivate', requireSaasAccess, reactivateUser);
router.delete('/:id/permanent', requireSaasAccess, permanentDeleteUser);

module.exports = router;
