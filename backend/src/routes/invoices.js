const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);

// CRUD routes with permission checks
router.post('/', requirePermission('invoice_management', 'create'), invoiceController.createInvoice);
router.get('/', requirePermission('invoice_management', 'read'), invoiceController.getInvoices);
router.get('/stats', requirePermission('invoice_management', 'read'), invoiceController.getInvoiceStats);
router.get('/:id', requirePermission('invoice_management', 'read'), invoiceController.getInvoice);
router.put('/:id', requirePermission('invoice_management', 'update'), invoiceController.updateInvoice);
router.delete('/:id', requirePermission('invoice_management', 'delete'), invoiceController.deleteInvoice);

router.get('/:id/download-pdf', requirePermission('invoice_management', 'read'), invoiceController.downloadInvoicePDF);
router.post('/:id/send', requirePermission('invoice_management', 'update'), invoiceController.sendInvoice);
router.post('/:id/payments', requirePermission('invoice_management', 'update'), invoiceController.addPayment);
router.patch('/:id/status', requirePermission('invoice_management', 'update'), invoiceController.updateInvoiceStatus);

module.exports = router;
