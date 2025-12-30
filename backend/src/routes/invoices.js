const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', invoiceController.createInvoice);
router.get('/', invoiceController.getInvoices);
router.get('/stats', invoiceController.getInvoiceStats);
router.get('/:id', invoiceController.getInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);
router.get('/:id/download-pdf', invoiceController.downloadInvoicePDF);
router.post('/:id/send', invoiceController.sendInvoice);
router.post('/:id/payments', invoiceController.addPayment);
router.patch('/:id/status', invoiceController.updateInvoiceStatus);

module.exports = router;
