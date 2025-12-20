const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/productCategoryController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication
router.use(protect);

// CRUD routes
router.route('/')
  .get(requirePermission('product_management', 'read'), getAllCategories)
  .post(requirePermission('product_management', 'create'), createCategory);

router.route('/:id')
  .get(requirePermission('product_management', 'read'), getCategory)
  .put(requirePermission('product_management', 'update'), updateCategory)
  .delete(requirePermission('product_management', 'delete'), deleteCategory);

module.exports = router;