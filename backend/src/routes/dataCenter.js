const express = require('express');
const router = express.Router();
const {
  getCandidates,
  getCandidate,
  createCandidate,
  deleteCandidates,
  getStats,
  moveToLeads,
  bulkImportCandidates,
  exportCandidates,
  uploadCandidatesFile,
  sendBulkEmail,
  sendBulkWhatsApp,
  sendBulkSMS,
  downloadSampleTemplate
} = require('../controllers/dataCenterController');
const { protect, requireSaasAccess } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// ════════════════════════════════════════════════════════════════
// DATA CENTER ROUTES
// ════════════════════════════════════════════════════════════════

// All routes require authentication
router.use(protect);

// Stats route (BEFORE /:id route)
router.get('/stats',
  requirePermission('data_center', 'read'),
  getStats
);

// Move to leads route
router.post('/move-to-leads',
  requirePermission('data_center', 'move_to_leads'),
  moveToLeads
);

// Delete candidates route
router.delete('/delete',
  requirePermission('data_center', 'delete'),
  deleteCandidates
);

// Download template route
router.get('/download-template',
  requirePermission('data_center', 'read'),
  downloadSampleTemplate
);

// Bulk import route (SAAS_OWNER only)
router.post('/bulk-import',
  requireSaasAccess,
  bulkImportCandidates
);

// 🚀 Upload CSV/Excel route (NEW)
router.post('/upload',
  requirePermission('data_center', 'create'),
  uploadCandidatesFile
);

// Export route
router.post('/export',
  requirePermission('data_center', 'export'),
  exportCandidates
);

// Bulk Communication routes
router.post('/bulk-email',
  requirePermission('data_center', 'read'),
  sendBulkEmail
);

router.post('/bulk-whatsapp',
  requirePermission('data_center', 'read'),
  sendBulkWhatsApp
);

router.post('/bulk-sms',
  requirePermission('data_center', 'read'),
  sendBulkSMS
);

// CRUD routes
router.route('/')
  .get(requirePermission('data_center', 'read'), getCandidates)
  .post(requirePermission('data_center', 'create'), createCandidate);

// Dynamic /:id routes (LAST)
router.route('/:id')
  .get(requirePermission('data_center', 'read'), getCandidate);

module.exports = router;



