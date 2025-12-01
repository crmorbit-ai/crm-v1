const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
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

// Only TENANT_ADMIN, SAAS_ADMIN, SAAS_OWNER can access
router.get('/stats', restrictTo('TENANT_ADMIN', 'SAAS_ADMIN', 'SAAS_OWNER'), getActivityStats);
router.get('/export', restrictTo('TENANT_ADMIN', 'SAAS_ADMIN', 'SAAS_OWNER'), exportActivityLogs);

// Audit Report Routes
router.get('/audit-report/export', restrictTo('TENANT_ADMIN', 'SAAS_ADMIN', 'SAAS_OWNER'), exportAuditReport);
router.get('/audit-report', restrictTo('TENANT_ADMIN', 'SAAS_ADMIN', 'SAAS_OWNER'), getAuditReport);

// Login Report Routes
router.get('/login-report/export', restrictTo('TENANT_ADMIN', 'SAAS_ADMIN', 'SAAS_OWNER'), exportLoginReport);
router.get('/login-report', restrictTo('TENANT_ADMIN', 'SAAS_ADMIN', 'SAAS_OWNER'), getLoginReport);

router.get('/', restrictTo('TENANT_ADMIN', 'SAAS_ADMIN', 'SAAS_OWNER'), getActivityLogs);

module.exports = router;