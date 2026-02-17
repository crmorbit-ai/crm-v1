const express = require('express');
const router = express.Router();
const rfiController = require('../controllers/rfiController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);

// CRUD routes with permission checks
router.post('/', requirePermission('rfi_management', 'create'), rfiController.createRFI);
router.get('/', requirePermission('rfi_management', 'read'), rfiController.getRFIs);
router.get('/:id', requirePermission('rfi_management', 'read'), rfiController.getRFI);
router.put('/:id', requirePermission('rfi_management', 'update'), rfiController.updateRFI);
router.delete('/:id', requirePermission('rfi_management', 'delete'), rfiController.deleteRFI);

router.post('/:id/convert-to-quotation', requirePermission('rfi_management', 'update'), rfiController.convertToQuotation);
router.patch('/:id/status', requirePermission('rfi_management', 'update'), rfiController.updateRFIStatus);

module.exports = router;
