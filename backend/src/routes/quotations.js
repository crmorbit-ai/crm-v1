const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);

// CRUD routes with permission checks
router.post('/', requirePermission('quotation_management', 'create'), quotationController.createQuotation);
router.get('/', requirePermission('quotation_management', 'read'), quotationController.getQuotations);
router.get('/:id', requirePermission('quotation_management', 'read'), quotationController.getQuotation);
router.put('/:id', requirePermission('quotation_management', 'update'), quotationController.updateQuotation);
router.delete('/:id', requirePermission('quotation_management', 'delete'), quotationController.deleteQuotation);

router.get('/:id/download-pdf', requirePermission('quotation_management', 'read'), quotationController.downloadQuotationPDF);
router.post('/:id/send-email', requirePermission('quotation_management', 'update'), quotationController.sendQuotationEmail);
router.post('/:id/convert-to-invoice', requirePermission('quotation_management', 'update'), quotationController.convertToInvoice);
router.patch('/:id/status', requirePermission('quotation_management', 'update'), quotationController.updateQuotationStatus);

module.exports = router;
