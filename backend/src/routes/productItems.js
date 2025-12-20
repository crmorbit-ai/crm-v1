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

// All routes require authentication
router.use(protect);

// Stats route (must be before /:id)
router.get('/stats', getProductStats);

// Main CRUD routes
router.route('/')
  .get(getAllProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

// Product enquiries
router.get('/:id/enquiries', getProductEnquiries);

module.exports = router;
