const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', quotationController.createQuotation);
router.get('/', quotationController.getQuotations);
router.get('/:id', quotationController.getQuotation);
router.put('/:id', quotationController.updateQuotation);
router.delete('/:id', quotationController.deleteQuotation);
router.get('/:id/download-pdf', quotationController.downloadQuotationPDF);
router.post('/:id/send-email', quotationController.sendQuotationEmail);
router.post('/:id/convert-to-invoice', quotationController.convertToInvoice);
router.patch('/:id/status', quotationController.updateQuotationStatus);

module.exports = router;
