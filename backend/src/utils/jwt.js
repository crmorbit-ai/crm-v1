const jwt = require('jsonwebtoken');

/**
 * Generate JWT token with user information
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  // Only store tenant ID, not the full populated object
  const tenantId = user.tenant
    ? (user.tenant._id ? user.tenant._id.toString() : user.tenant.toString())
    : null;

  const payload = {
    id: user._id,
    email: user.email,
    userType: user.userType,
    tenant: tenantId
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken
};
