const express = require('express');
const router = express.Router();
const {
  getTenants,
  getTenant,
  updateTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
  getTenantStats,
  requestDeletion,
  approveDeletion,
  rejectDeletion,
  recoverTenant
} = require('../controllers/tenantController');
const { protect, requireSaasAccess, requireTenant } = require('../middleware/auth');

// Tenant self-service: request deletion (no requireSaasAccess — tenant admin calls this)
router.post('/request-deletion', protect, requireTenant, requestDeletion);

// All routes below require SAAS access
router.use(protect);
router.use(requireSaasAccess);

// Tenant management routes
router.get('/', getTenants);
router.get('/stats/overview', getTenantStats);
router.get('/:id', getTenant);
router.put('/:id', updateTenant);
router.post('/:id/suspend', suspendTenant);
router.post('/:id/activate', activateTenant);
router.delete('/:id', deleteTenant);

// Deletion request management (SAAS Admin only)
router.post('/:id/approve-deletion', approveDeletion);
router.post('/:id/reject-deletion', rejectDeletion);
router.post('/:id/recover', recoverTenant);

module.exports = router;
