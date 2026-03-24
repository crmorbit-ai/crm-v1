const express = require('express');
const router = express.Router();
const {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getOpportunityStats,
  downloadContract
} = require('../controllers/opportunityController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const uploadDoc = require('../config/multerDocs');

// All routes require authentication
router.use(protect);

// Statistics route (must be before /:id route)
router.get('/stats', requirePermission('opportunity_management', 'read'), getOpportunityStats);

// Contract download
router.get('/:id/download-contract', requirePermission('opportunity_management', 'read'), downloadContract);

// CRUD routes
router.route('/')
  .get(requirePermission('opportunity_management', 'read'), getOpportunities)
  .post(requirePermission('opportunity_management', 'create'), uploadDoc.single('contract'), createOpportunity);

router.route('/:id')
  .get(requirePermission('opportunity_management', 'read'), getOpportunity)
  .put(requirePermission('opportunity_management', 'update'), uploadDoc.single('contract'), updateOpportunity)
  .delete(requirePermission('opportunity_management', 'delete'), deleteOpportunity);

module.exports = router;