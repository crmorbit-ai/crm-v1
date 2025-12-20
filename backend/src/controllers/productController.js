const { getDataCenterConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

// Get DataCenter models dynamically
const getDataCenterModels = () => {
  const connection = getDataCenterConnection();
  if (!connection) {
    throw new Error('Data Center database not connected');
  }
  return {
    Product: connection.model('Product'),
    UserProduct: connection.model('UserProduct'),
  };
};

/**
 * @desc    Get all available products
 * @route   GET /api/products
 * @access  Private
 */
const getAllProducts = async (req, res) => {
  try {
    const { Product } = getDataCenterModels();

    const products = await Product.find({ isActive: true })
      .sort({ order: 1 })
      .select('-__v');

    return successResponse(res, products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return errorResponse(res, 'Error fetching products', 500);
  }
};

/**
 * @desc    Get user's purchased products with usage
 * @route   GET /api/products/my-products
 * @access  Private
 */
const getMyProducts = async (req, res) => {
  try {
    const { UserProduct } = getDataCenterModels();
    const tenantId = req.user.tenant;

    const myProducts = await UserProduct.find({
      tenant: tenantId,
      isActive: true,
    })
      .populate('product')
      .sort({ createdAt: -1 });

    return successResponse(res, myProducts);
  } catch (error) {
    console.error('Error fetching user products:', error);
    return errorResponse(res, 'Error fetching your products', 500);
  }
};

/**
 * @desc    Get specific product details with user's subscription
 * @route   GET /api/products/:productId
 * @access  Private
 */
const getProductDetails = async (req, res) => {
  try {
    const { Product, UserProduct } = getDataCenterModels();
    const { productId } = req.params;
    const tenantId = req.user.tenant;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return errorResponse(res, 'Product not found', 404);
    }

    // Check if user has this product
    const userProduct = await UserProduct.findOne({
      tenant: tenantId,
      product: productId,
      isActive: true,
    });

    return successResponse(res, {
      product,
      userProduct,
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return errorResponse(res, 'Error fetching product details', 500);
  }
};

/**
 * @desc    Purchase a product package
 * @route   POST /api/products/purchase
 * @access  Private
 */
const purchaseProduct = async (req, res) => {
  try {
    const { Product, UserProduct } = getDataCenterModels();
    const { productId, packageIndex, paymentInfo } = req.body;
    const tenantId = req.user.tenant;

    // Validate product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return errorResponse(res, 'Product not found', 400);
    }

    // Validate package
    if (packageIndex === undefined || !product.packages[packageIndex]) {
      return errorResponse(res, 'Invalid package selected', 400);
    }

    const selectedPackage = product.packages[packageIndex];

    // Find or create user product
    let userProduct = await UserProduct.findOne({
      tenant: tenantId,
      product: productId,
    });

    if (!userProduct) {
      userProduct = await UserProduct.create({
        tenant: tenantId,
        product: productId,
        status: 'active',
        isActive: true,
      });
    }

    // Add credits
    await userProduct.addCredits(
      selectedPackage.credits,
      selectedPackage.price,
      paymentInfo || {}
    );

    // Log activity
    await logActivity(req, 'product.purchase', 'Product', product._id, {
      productName: product.displayName,
      credits: selectedPackage.credits,
      price: selectedPackage.price,
    });

    const updatedUserProduct = await UserProduct.findById(userProduct._id).populate('product');

    return successResponse(
      res,
      updatedUserProduct,
      `Successfully purchased ${selectedPackage.credits} ${product.pricing.unit}(s)`,
      201
    );
  } catch (error) {
    console.error('Error purchasing product:', error);
    return errorResponse(res, error.message || 'Error purchasing product', 500);
  }
};

/**
 * @desc    Use product credits (for bulk operations from DataCenter)
 * @route   POST /api/products/use-credits
 * @access  Private
 */
const useProductCredits = async (req, res) => {
  try {
    const { UserProduct } = getDataCenterModels();
    const { productId, count, isBulk } = req.body;
    const tenantId = req.user.tenant;

    if (!count || count <= 0) {
      return errorResponse(res, 'Invalid count', 400);
    }

    // Find user product
    const userProduct = await UserProduct.findOne({
      tenant: tenantId,
      product: productId,
      isActive: true,
    }).populate('product');

    if (!userProduct) {
      return errorResponse(res, 'Product not purchased', 404);
    }

    // Check if enough credits
    if (!userProduct.hasCredits(count)) {
      return errorResponse(
        res,
        `Insufficient credits. You have ${userProduct.remainingCredits} remaining.`,
        400
      );
    }

    // Use credits
    await userProduct.useCredits(count, isBulk || false);

    // Log activity
    await logActivity(req, 'product.use_credits', 'Product', userProduct.product._id, {
      productName: userProduct.product.displayName,
      creditsUsed: count,
      remainingCredits: userProduct.remainingCredits,
      isBulk: isBulk || false,
    });

    return successResponse(res, {
      usedCredits: count,
      remainingCredits: userProduct.remainingCredits,
      product: userProduct.product,
    }, 'Credits used successfully');
  } catch (error) {
    console.error('Error using credits:', error);
    return errorResponse(res, error.message || 'Error using credits', 500);
  }
};

/**
 * @desc    Get usage statistics for all products
 * @route   GET /api/products/usage-stats
 * @access  Private
 */
const getUsageStats = async (req, res) => {
  try {
    const { UserProduct } = getDataCenterModels();
    const tenantId = req.user.tenant;

    const userProducts = await UserProduct.find({
      tenant: tenantId,
      isActive: true,
    }).populate('product');

    // Calculate totals
    const stats = {
      totalSpent: 0,
      totalCreditsUsed: 0,
      products: [],
    };

    userProducts.forEach((up) => {
      const totalSpent = up.purchases.reduce((sum, p) => sum + p.price, 0);
      stats.totalSpent += totalSpent;
      stats.totalCreditsUsed += up.usedCredits;

      stats.products.push({
        product: up.product,
        totalCredits: up.totalCredits,
        usedCredits: up.usedCredits,
        remainingCredits: up.remainingCredits,
        totalSpent: totalSpent,
        thisMonth: up.usage.thisMonth,
        lastMonth: up.usage.lastMonth,
        total: up.usage.total,
        lastUsedAt: up.usage.lastUsedAt,
        usageHistory: up.usageHistory,
      });
    });

    return successResponse(res, stats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return errorResponse(res, 'Error fetching usage statistics', 500);
  }
};

/**
 * @desc    Create Razorpay order for product purchase
 * @route   POST /api/products/create-order
 * @access  Private
 */
const createRazorpayOrder = async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const { Product } = getDataCenterModels();
    const { productId, packageIndex } = req.body;

    if (!productId || packageIndex === undefined) {
      return errorResponse(res, 'Product ID and package index are required', 400);
    }

    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    const selectedPackage = product.packages[packageIndex];
    if (!selectedPackage) {
      return errorResponse(res, 'Invalid package selected', 400);
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: selectedPackage.price * 100, // Convert to paise
      currency: 'INR',
      receipt: `${productId}_${Date.now()}`,
      notes: {
        productId: productId,
        packageIndex: packageIndex,
        tenantId: req.user.tenant.toString(),
        userId: req.user._id.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    return successResponse(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return errorResponse(res, 'Failed to create payment order', 500);
  }
};

/**
 * @desc    Verify Razorpay payment and complete purchase
 * @route   POST /api/products/verify-payment
 * @access  Private
 */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const crypto = require('crypto');
    const { Product, UserProduct } = getDataCenterModels();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      productId,
      packageIndex,
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return errorResponse(res, 'Invalid payment signature', 400);
    }

    // Payment verified, complete the purchase
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    const selectedPackage = product.packages[packageIndex];
    if (!selectedPackage) {
      return errorResponse(res, 'Invalid package selected', 400);
    }

    const tenantId = req.user.tenant;

    // Check if user already has this product
    let userProduct = await UserProduct.findOne({
      tenant: tenantId,
      product: productId,
    });

    if (userProduct) {
      // Add credits to existing product
      userProduct.totalCredits += selectedPackage.credits;
      userProduct.remainingCredits += selectedPackage.credits;
      userProduct.purchaseHistory.push({
        credits: selectedPackage.credits,
        amount: selectedPackage.price,
        discount: selectedPackage.discount,
      });
    } else {
      // Create new user product
      userProduct = new UserProduct({
        tenant: tenantId,
        product: productId,
        totalCredits: selectedPackage.credits,
        remainingCredits: selectedPackage.credits,
        usedCredits: 0,
        purchaseHistory: [
          {
            credits: selectedPackage.credits,
            amount: selectedPackage.price,
            discount: selectedPackage.discount,
          },
        ],
      });
    }

    await userProduct.save();

    // Populate product details
    await userProduct.populate('product');

    // Log activity
    try {
      await logActivity(
        req.user._id,
        req.user.tenant._id,
        'CREATE',
        'PRODUCT_PURCHASE',
        `Purchased ${selectedPackage.credits} ${product.name} credits`,
        { productId, packageIndex, paymentId: razorpay_payment_id }
      );
    } catch (logError) {
      console.error('Activity logging error:', logError);
    }

    return successResponse(res, userProduct, 'Product purchased successfully');
  } catch (error) {
    console.error('Error verifying payment:', error);
    return errorResponse(res, 'Failed to verify payment', 500);
  }
};

module.exports = {
  getAllProducts,
  getMyProducts,
  getProductDetails,
  purchaseProduct,
  useProductCredits,
  getUsageStats,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
