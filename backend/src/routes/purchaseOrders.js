const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);

// CRUD routes with permission checks
router.post('/', requirePermission('purchase_order_management', 'create'), purchaseOrderController.uploadPODocument, purchaseOrderController.createPurchaseOrder);
router.get('/', requirePermission('purchase_order_management', 'read'), purchaseOrderController.getPurchaseOrders);
router.get('/:id', requirePermission('purchase_order_management', 'read'), purchaseOrderController.getPurchaseOrder);
router.put('/:id', requirePermission('purchase_order_management', 'update'), purchaseOrderController.uploadPODocument, purchaseOrderController.updatePurchaseOrder);
router.delete('/:id', requirePermission('purchase_order_management', 'delete'), purchaseOrderController.deletePurchaseOrder);

router.post('/:id/approve', requirePermission('purchase_order_management', 'manage'), purchaseOrderController.approvePurchaseOrder);
router.post('/:id/convert-to-invoice', requirePermission('purchase_order_management', 'update'), purchaseOrderController.convertToInvoice);
router.patch('/:id/status', requirePermission('purchase_order_management', 'update'), purchaseOrderController.updatePOStatus);
router.get('/:id/download-document', requirePermission('purchase_order_management', 'read'), purchaseOrderController.downloadPODocument);

module.exports = router;
