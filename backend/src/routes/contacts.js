const express = require('express');
const router = express.Router();
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactStats
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication
router.use(protect);

// Statistics route (must be before /:id route)
router.get('/stats', requirePermission('contact_management', 'read'), getContactStats);

// CRUD routes
router.route('/')
  .get(requirePermission('contact_management', 'read'), getContacts)
  .post(requirePermission('contact_management', 'create'), createContact);

router.route('/:id')
  .get(requirePermission('contact_management', 'read'), getContact)
  .put(requirePermission('contact_management', 'update'), updateContact)
  .delete(requirePermission('contact_management', 'delete'), deleteContact);

module.exports = router;
