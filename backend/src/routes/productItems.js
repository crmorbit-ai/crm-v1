const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getProductEnquiries
} = require('../controllers/productItemController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication
router.use(protect);

// Stats route (must be before /:id)
router.get('/stats', requirePermission(['product_management', 'master_inventory', 'product_inventory', 'service_inventory', 'lead_inventory', 'inventory_management'], 'read'), getProductStats);

// Main CRUD routes
router.route('/')
  .get(requirePermission(['product_management', 'master_inventory', 'product_inventory', 'service_inventory', 'lead_inventory', 'inventory_management'], 'read'), getAllProducts)
  .post(requirePermission(['product_management', 'master_inventory', 'product_inventory', 'service_inventory', 'lead_inventory', 'inventory_management'], 'create'), createProduct);

router.route('/:id')
  .get(requirePermission(['product_management', 'master_inventory', 'product_inventory', 'service_inventory', 'lead_inventory', 'inventory_management'], 'read'), getProduct)
  .put(requirePermission(['product_management', 'master_inventory', 'product_inventory', 'service_inventory', 'lead_inventory', 'inventory_management'], 'update'), updateProduct)
  .delete(requirePermission(['product_management', 'master_inventory', 'product_inventory', 'service_inventory', 'lead_inventory', 'inventory_management'], 'delete'), deleteProduct);

// Product enquiries
router.get('/:id/enquiries', requirePermission(['product_management', 'master_inventory', 'product_inventory', 'service_inventory', 'lead_inventory', 'inventory_management'], 'read'), getProductEnquiries);

module.exports = router;
