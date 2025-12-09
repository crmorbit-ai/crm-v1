const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getMyProducts,
  getProductDetails,
  purchaseProduct,
  useProductCredits,
  getUsageStats,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all available products
router.get('/', getAllProducts);

// Get user's purchased products
router.get('/my-products', getMyProducts);

// Get usage statistics
router.get('/usage-stats', getUsageStats);

// Get specific product details
router.get('/:productId', getProductDetails);

// Purchase a product package
router.post('/purchase', purchaseProduct);

// Use product credits (for bulk operations)
router.post('/use-credits', useProductCredits);

module.exports = router;
