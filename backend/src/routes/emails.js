const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const emailController = require('../controllers/emailController');

// All routes require authentication
router.use(protect);

// Email history
router.get('/',
  requirePermission('email_management', 'read'),
  emailController.getEmails
);

// Get single email
router.get('/:id',
  requirePermission('email_management', 'read'),
  emailController.getEmail
);

// Get email thread/conversation
router.get('/thread/:messageId',
  requirePermission('email_management', 'read'),
  emailController.getThread
);

// Get emails for specific entity (Lead, Contact, etc.)
router.get('/entity/:entityType/:entityId',
  requirePermission('email_management', 'read'),
  emailController.getEntityEmails
);

// Send email
router.post('/send',
  requirePermission('email_management', 'create'),
  emailController.sendEmail
);

// Manual sync
router.post('/sync',
  requirePermission('email_management', 'read'),
  emailController.syncEmails
);

// Email stats
router.get('/stats/overview',
  requirePermission('email_management', 'read'),
  emailController.getStats
);

// Mark as read
router.patch('/:id/read',
  requirePermission('email_management', 'read'),
  emailController.markAsRead
);

// Delete email (soft delete)
router.delete('/:id',
  requirePermission('email_management', 'delete'),
  emailController.deleteEmail
);

module.exports = router;
