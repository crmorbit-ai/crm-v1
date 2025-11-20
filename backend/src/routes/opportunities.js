const express = require('express');
const router = express.Router();
const {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getOpportunityStats
} = require('../controllers/opportunityController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication
router.use(protect);

// Statistics route (must be before /:id route)
router.get('/stats', requirePermission('opportunity_management', 'read'), getOpportunityStats);

// CRUD routes
router.route('/')
  .get(requirePermission('opportunity_management', 'read'), getOpportunities)
  .post(requirePermission('opportunity_management', 'create'), createOpportunity);

router.route('/:id')
  .get(requirePermission('opportunity_management', 'read'), getOpportunity)
  .put(requirePermission('opportunity_management', 'update'), updateOpportunity)
  .delete(requirePermission('opportunity_management', 'delete'), deleteOpportunity);

module.exports = router;