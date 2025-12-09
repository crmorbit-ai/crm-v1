import api from './api';

// Get all available products
const getAllProducts = async () => {
  return await api.get('/products');
};

// Get user's purchased products
const getMyProducts = async () => {
  return await api.get('/products/my-products');
};

// Get product details
const getProductDetails = async (productId) => {
  return await api.get(`/products/${productId}`);
};

// Purchase a product package
const purchaseProduct = async (productId, packageIndex, paymentInfo = {}) => {
  return await api.post('/products/purchase', {
    productId,
    packageIndex,
    paymentInfo,
  });
};

// Use product credits (for bulk operations)
const useProductCredits = async (productId, count, isBulk = false) => {
  return await api.post('/products/use-credits', {
    productId,
    count,
    isBulk,
  });
};

// Get usage statistics
const getUsageStats = async () => {
  return await api.get('/products/usage-stats');
};

const productService = {
  getAllProducts,
  getMyProducts,
  getProductDetails,
  purchaseProduct,
  useProductCredits,
  getUsageStats,
};

export default productService;
