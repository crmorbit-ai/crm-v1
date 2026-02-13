const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  setViewingPin,
  verifyViewingPin,
  changeViewingPin,
  getPinStatus,
  logAccess,
  getAuditLogs,
  forgotViewingPin,
  resetViewingPin
} = require('../controllers/viewingPinController');

// All routes require authentication
router.use(protect);

// PIN management routes
router.get('/status', getPinStatus);
router.post('/set', setViewingPin);
router.post('/verify', verifyViewingPin);
router.post('/change', changeViewingPin);
router.post('/forgot', forgotViewingPin);
router.post('/reset', resetViewingPin);

// Access logging
router.post('/log-access', logAccess);

// Audit logs (for admins)
router.get('/audit-logs', getAuditLogs);

module.exports = router;
