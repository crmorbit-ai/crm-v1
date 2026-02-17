const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const {
  getActivityLogs,
  getActivityStats,
  exportActivityLogs,
  getAuditReport,
  getLoginReport,
  exportAuditReport,
  exportLoginReport
} = require('../controllers/activityLogController');

router.use(protect);

// Use role-based permissions for audit_logs
router.get('/stats', requirePermission('audit_logs', 'read'), getActivityStats);
router.get('/export', requirePermission('audit_logs', 'export'), exportActivityLogs);

// Audit Report Routes
router.get('/audit-report/export', requirePermission('audit_logs', 'export'), exportAuditReport);
router.get('/audit-report', requirePermission('audit_logs', 'read'), getAuditReport);

// Login Report Routes
router.get('/login-report/export', requirePermission('audit_logs', 'export'), exportLoginReport);
router.get('/login-report', requirePermission('audit_logs', 'read'), getLoginReport);

router.get('/', requirePermission('audit_logs', 'read'), getActivityLogs);

module.exports = router;