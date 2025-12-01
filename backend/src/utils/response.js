/**
 * Success response
 * @param {Object} res - Express response object
 * @param {Number|Object} statusCodeOrData - HTTP status code OR data object
 * @param {String} message - Success message
 * @param {Object} data - Response data
 */
const successResponse = (res, statusCodeOrData = 200, message = 'Success', data = null) => {
  // If second parameter is an object, treat it as data (for backward compatibility)
  if (typeof statusCodeOrData === 'object' && statusCodeOrData !== null) {
    return res.status(200).json({
      success: true,
      message: 'Success',
      data: statusCodeOrData
    });
  }

  // Otherwise, use the normal signature
  return res.status(statusCodeOrData).json({
    success: true,
    message,
    data
  });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {String|Number} messageOrStatusCode - Error message OR status code
 * @param {Number} statusCode - HTTP status code (if first param is message)
 * @param {Array} errors - Validation errors
 */
const errorResponse = (res, messageOrStatusCode = 500, statusCode = 500, errors = null) => {
  // If second parameter is a string, treat it as message (for backward compatibility)
  if (typeof messageOrStatusCode === 'string') {
    return res.status(statusCode).json({
      success: false,
      message: messageOrStatusCode,
      errors
    });
  }

  // Otherwise, treat it as status code
  return res.status(messageOrStatusCode).json({
    success: false,
    message: statusCode || 'Internal server error',
    errors
  });
};

module.exports = {
  successResponse,
  errorResponse
};
