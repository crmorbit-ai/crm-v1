const express = require('express');
const router = express.Router();
const {
  getProposals,
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  sendProposal,
  cloneProposal,
  generatePDF
} = require('../controllers/proposalController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication
router.use(protect);

// PDF route (before /:id routes)
router.get('/:id/pdf',
  requirePermission('proposal_management', 'read'),
  generatePDF
);

// Clone route (before /:id routes)
router.post('/:id/clone',
  requirePermission('proposal_management', 'create'),
  cloneProposal
);

// Send route
router.post('/:id/send',
  requirePermission('proposal_management', 'update'),
  sendProposal
);

// CRUD routes
router.route('/')
  .get(requirePermission('proposal_management', 'read'), getProposals)
  .post(requirePermission('proposal_management', 'create'), createProposal);

router.route('/:id')
  .get(requirePermission('proposal_management', 'read'), getProposal)
  .put(requirePermission('proposal_management', 'update'), updateProposal)
  .delete(requirePermission('proposal_management', 'delete'), deleteProposal);

module.exports = router;
