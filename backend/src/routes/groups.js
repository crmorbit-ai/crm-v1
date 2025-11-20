const express = require('express');
const router = express.Router();
const {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMembers,
  assignRoles,
  removeRoles
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes are protected
router.use(protect);

// Group CRUD routes
router.get('/', requirePermission('group_management', 'read'), getGroups);
router.get('/:id', requirePermission('group_management', 'read'), getGroup);
router.post('/', requirePermission('group_management', 'create'), createGroup);
router.put('/:id', requirePermission('group_management', 'update'), updateGroup);
router.delete('/:id', requirePermission('group_management', 'delete'), deleteGroup);

// Member management
router.post('/:id/members', requirePermission('group_management', 'manage'), addMembers);
router.delete('/:id/members', requirePermission('group_management', 'manage'), removeMembers);

// Role management
router.post('/:id/roles', requirePermission('group_management', 'manage'), assignRoles);
router.delete('/:id/roles', requirePermission('group_management', 'manage'), removeRoles);

module.exports = router;
