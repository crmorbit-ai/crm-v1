const mongoose = require('mongoose');
const ProductCategory = require('../models/ProductCategory');
const ProductItem = require('../models/ProductItem');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Create new product category
 * @route   POST /api/product-categories
 * @access  Private (Admin only)
 */
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return errorResponse(res, 400, 'Category name is required');
    }

    // Determine tenant
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) {
        return errorResponse(res, 400, 'Tenant is required');
      }
    } else {
      tenant = req.user.tenant;
    }

    // Check for duplicate
    const existingCategory = await ProductCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      tenant,
      isActive: true
    });

    if (existingCategory) {
      return errorResponse(res, 400, 'Category with this name already exists');
    }

    // Create category
    const category = await ProductCategory.create({
      name: name.trim(),
      description,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await logActivity(req, 'category.created', 'ProductCategory', category._id, {
      name: category.name
    });

    successResponse(res, 201, 'Category created successfully', category);
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 400, 'Category with this name already exists');
    }
    errorResponse(res, 500, error.message || 'Server error');
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/product-categories
 * @access  Private
 */
const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, isActive } = req.query;

    let query = {};

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    // Filters
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const total = await ProductCategory.countDocuments(query);

    const categories = await ProductCategory.find(query)
      .populate('createdBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 })
      .lean();

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await ProductItem.countDocuments({
          category: category.name,
          isActive: true
        });
        return {
          ...category,
          productCount
        };
      })
    );

    successResponse(res, 200, 'Categories retrieved successfully', {
      categories: categoriesWithCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single category
 * @route   GET /api/product-categories/:id
 * @access  Private
 */
const getCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('lastModifiedBy', 'firstName lastName');

    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (category.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Get product count
    const productCount = await ProductItem.countDocuments({
      category: category.name,
      isActive: true
    });

    const categoryData = category.toObject();
    categoryData.productCount = productCount;

    successResponse(res, 200, 'Category retrieved successfully', categoryData);
  } catch (error) {
    console.error('Get category error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/product-categories/:id
 * @access  Private (Admin only)
 */
const updateCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);

    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (category.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    const { name, description, isActive } = req.body;

    // If name is being changed, check for duplicates
    if (name && name !== category.name) {
      const existingCategory = await ProductCategory.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        tenant: category.tenant,
        isActive: true,
        _id: { $ne: category._id }
      });

      if (existingCategory) {
        return errorResponse(res, 400, 'Category with this name already exists');
      }

      // Update products with old category name to new name
      await ProductItem.updateMany(
        { category: category.name, tenant: category.tenant },
        { $set: { category: name.trim() } }
      );
    }

    // Update fields
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    
    category.lastModifiedBy = req.user._id;
    await category.save();

    await logActivity(req, 'category.updated', 'ProductCategory', category._id, {
      name: category.name
    });

    successResponse(res, 200, 'Category updated successfully', category);
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 400, 'Category with this name already exists');
    }
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/product-categories/:id
 * @access  Private (Admin only)
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);

    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (category.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Check if category is being used by products
    const productCount = await ProductItem.countDocuments({
      category: category.name,
      isActive: true
    });

    if (productCount > 0) {
      return errorResponse(
        res, 
        400, 
        `Cannot delete category. ${productCount} product(s) are using this category. Please reassign or delete those products first.`
      );
    }

    // Soft delete
    category.isActive = false;
    category.lastModifiedBy = req.user._id;
    await category.save();

    await logActivity(req, 'category.deleted', 'ProductCategory', category._id, {
      name: category.name
    });

    successResponse(res, 200, 'Category deleted successfully');
  } catch (error) {
    console.error('Delete category error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory
};