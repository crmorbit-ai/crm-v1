const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  assignRoles,
  assignGroups
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes are protected
router.use(protect);

// User CRUD routes
router.get('/', requirePermission('user_management', 'read'), getUsers);
router.get('/:id', requirePermission('user_management', 'read'), getUser);
router.post('/', requirePermission('user_management', 'create'), createUser);
router.put('/:id', requirePermission('user_management', 'update'), updateUser);
router.delete('/:id', requirePermission('user_management', 'delete'), deleteUser);

// Role and group assignment
router.post('/:id/assign-roles', requirePermission('user_management', 'manage'), assignRoles);
router.post('/:id/assign-groups', requirePermission('user_management', 'manage'), assignGroups);

module.exports = router;
