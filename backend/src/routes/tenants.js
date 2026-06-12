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
  recoverTenant,
  assignManager,
  bulkAssignManager,
  forceReactivateUsers,
  getTenantActivity
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
router.get('/:id/activity', getTenantActivity);  // NEW - Tenant activity tracking
router.put('/:id', updateTenant);
router.post('/:id/suspend', suspendTenant);
router.post('/:id/activate', activateTenant);
router.delete('/:id', deleteTenant);

// Manager assignment (SAAS Owner only)
router.post('/bulk-assign-manager', bulkAssignManager);
router.post('/:id/assign-manager', assignManager);

// Deletion request management (SAAS Admin only)
router.post('/:id/approve-deletion', approveDeletion);
router.post('/:id/reject-deletion', rejectDeletion);
router.post('/:id/recover', recoverTenant);
router.post('/:id/reactivate-users', forceReactivateUsers); // Emergency fix

module.exports = router;
