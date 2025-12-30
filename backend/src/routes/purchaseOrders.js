const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', purchaseOrderController.uploadPODocument, purchaseOrderController.createPurchaseOrder);
router.get('/', purchaseOrderController.getPurchaseOrders);
router.get('/:id', purchaseOrderController.getPurchaseOrder);
router.put('/:id', purchaseOrderController.uploadPODocument, purchaseOrderController.updatePurchaseOrder);
router.delete('/:id', purchaseOrderController.deletePurchaseOrder);

router.post('/:id/approve', purchaseOrderController.approvePurchaseOrder);
router.post('/:id/convert-to-invoice', purchaseOrderController.convertToInvoice);
router.patch('/:id/status', purchaseOrderController.updatePOStatus);
router.get('/:id/download-document', purchaseOrderController.downloadPODocument);

module.exports = router;
