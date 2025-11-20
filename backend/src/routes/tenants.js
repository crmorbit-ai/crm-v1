const express = require('express');
const router = express.Router();
const {
  getTenants,
  getTenant,
  updateTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
  getTenantStats
} = require('../controllers/tenantController');
const { protect, requireSaasAccess } = require('../middleware/auth');

// All routes require SAAS access
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

module.exports = router;
