const mongoose = require('mongoose');
const ProductItem = require('../models/ProductItem');
const ProductCategory = require('../models/ProductCategory');
const Lead = require('../models/Lead');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Create new product
 * @route   POST /api/product-items
 * @access  Private (Tenant Admin)
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      articleNumber,
      category,
      price,
      stock,
      description,
      imageUrl
    } = req.body;

    // Validation
    if (!name || !articleNumber || !category || price === undefined) {
      return errorResponse(res, 400, 'Please provide name, article number, category, and price');
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

    // Validate category exists
    const categoryExists = await ProductCategory.findOne({
      name: category,
      tenant,
      isActive: true
    });

    if (!categoryExists) {
      return errorResponse(res, 400, 'Invalid category. Please select a valid category or create a new one.');
    }

    // Check for duplicate article number in same tenant
    const existingProduct = await ProductItem.findOne({
      articleNumber: articleNumber.toUpperCase(),
      tenant,
      isActive: true
    });

    if (existingProduct) {
      return errorResponse(res, 400, 'A product with this article number already exists');
    }

    // Create product
    const product = await ProductItem.create({
      name,
      articleNumber: articleNumber.toUpperCase(),
      category: category.trim(),
      price,
      stock: stock || 0,
      description,
      imageUrl,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await logActivity(req, 'product.created', 'ProductItem', product._id, {
      name: product.name,
      articleNumber: product.articleNumber
    });

    successResponse(res, 201, 'Product created successfully', product);
  } catch (error) {
    console.error('Create product error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return errorResponse(res, 400, 'A product with this article number already exists');
    }

    errorResponse(res, 500, error.message || 'Server error');
  }
};

/**
 * @desc    Get all products
 * @route   GET /api/product-items
 * @access  Private
 */
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      isActive
    } = req.query;

    let query = {};

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    // Filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { articleNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const total = await ProductItem.countDocuments(query);

    const products = await ProductItem.find(query)
      .populate('createdBy', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate enquiry count for each product
    const productsWithEnquiries = await Promise.all(
      products.map(async (product) => {
        const enquiryCount = await Lead.countDocuments({
          product: product._id,
          isActive: true
        });
        return {
          ...product,
          enquiryCount
        };
      })
    );

    successResponse(res, 200, 'Products retrieved successfully', {
      products: productsWithEnquiries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single product
 * @route   GET /api/product-items/:id
 * @access  Private
 */
const getProduct = async (req, res) => {
  try {
    const product = await ProductItem.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (product.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Get enquiry count
    const enquiryCount = await Lead.countDocuments({
      product: product._id,
      isActive: true
    });

    const productData = product.toObject();
    productData.enquiryCount = enquiryCount;

    successResponse(res, 200, 'Product retrieved successfully', productData);
  } catch (error) {
    console.error('Get product error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/product-items/:id
 * @access  Private
 */
const updateProduct = async (req, res) => {
  try {
    const product = await ProductItem.findById(req.params.id);

    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (product.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Validate category if provided
    if (req.body.category) {
      const categoryExists = await ProductCategory.findOne({
        name: req.body.category,
        tenant: product.tenant,
        isActive: true
      });

      if (!categoryExists) {
        return errorResponse(res, 400, 'Invalid category. Please select a valid category.');
      }
    }

    // If article number is being changed, check for duplicates
    if (req.body.articleNumber && req.body.articleNumber !== product.articleNumber) {
      const existingProduct = await ProductItem.findOne({
        articleNumber: req.body.articleNumber.toUpperCase(),
        tenant: product.tenant,
        isActive: true,
        _id: { $ne: product._id }
      });

      if (existingProduct) {
        return errorResponse(res, 400, 'A product with this article number already exists');
      }
    }

    // Update fields
    const allowedFields = [
      'name', 'articleNumber', 'category', 'price', 'stock',
      'description', 'imageUrl', 'isActive'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'articleNumber') {
          product[field] = req.body[field].toUpperCase();
        } else if (field === 'category') {
          product[field] = req.body[field].trim();
        } else {
          product[field] = req.body[field];
        }
      }
    });

    product.lastModifiedBy = req.user._id;
    await product.save();

    await logActivity(req, 'product.updated', 'ProductItem', product._id, {
      name: product.name,
      articleNumber: product.articleNumber
    });

    successResponse(res, 200, 'Product updated successfully', product);
  } catch (error) {
    console.error('Update product error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return errorResponse(res, 400, 'A product with this article number already exists');
    }

    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete product (soft delete)
 * @route   DELETE /api/product-items/:id
 * @access  Private
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await ProductItem.findById(req.params.id);

    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (product.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Soft delete
    product.isActive = false;
    product.lastModifiedBy = req.user._id;
    await product.save();

    await logActivity(req, 'product.deleted', 'ProductItem', product._id, {
      name: product.name,
      articleNumber: product.articleNumber
    });

    successResponse(res, 200, 'Product deleted successfully');
  } catch (error) {
    console.error('Delete product error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get product statistics
 * @route   GET /api/product-items/stats
 * @access  Private
 */
const getProductStats = async (req, res) => {
  try {
    let query = { isActive: true };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    // Total products
    const totalProducts = await ProductItem.countDocuments(query);

    // Active products
    const activeProducts = totalProducts;

    // Low stock products (stock < 10)
    const lowStockProducts = await ProductItem.countDocuments({
      ...query,
      stock: { $lt: 10 }
    });

    // Products by category
    const productsByCategory = await ProductItem.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top products by enquiry count
    const allProducts = await ProductItem.find(query).select('_id name articleNumber').lean();

    const topProductsData = await Promise.all(
      allProducts.map(async (product) => {
        const enquiryCount = await Lead.countDocuments({
          product: product._id,
          isActive: true
        });
        return {
          ...product,
          enquiryCount
        };
      })
    );

    const topProducts = topProductsData
      .sort((a, b) => b.enquiryCount - a.enquiryCount)
      .slice(0, 5);

    // Categories count
    const categoriesCount = productsByCategory.length;

    successResponse(res, 200, 'Product statistics retrieved successfully', {
      totalProducts,
      activeProducts,
      lowStockProducts,
      categoriesCount,
      productsByCategory: productsByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topProducts
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get all leads for a specific product
 * @route   GET /api/product-items/:id/enquiries
 * @access  Private
 */
const getProductEnquiries = async (req, res) => {
  try {
    const product = await ProductItem.findById(req.params.id);

    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (product.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    const {
      page = 1,
      limit = 20
    } = req.query;

    const query = {
      product: product._id,
      isActive: true
    };

    const total = await Lead.countDocuments(query);

    const leads = await Lead.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('product', 'name articleNumber')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();

    successResponse(res, 200, 'Product enquiries retrieved successfully', {
      product: {
        _id: product._id,
        name: product.name,
        articleNumber: product.articleNumber
      },
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get product enquiries error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getProductEnquiries
};