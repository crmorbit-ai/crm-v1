const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/roleController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes are protected
router.use(protect);

// Role CRUD routes
router.get('/', requirePermission('role_management', 'read'), getRoles);
router.get('/:id', requirePermission('role_management', 'read'), getRole);
router.post('/', requirePermission('role_management', 'create'), createRole);
router.put('/:id', requirePermission('role_management', 'update'), updateRole);
router.delete('/:id', requirePermission('role_management', 'delete'), deleteRole);

module.exports = router;
