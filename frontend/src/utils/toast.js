/**
 * Toast notification utilities
 * Auto-dismisses success/error messages after timeout
 */

/**
 * Show success message with auto-dismiss
 * @param {Function} setSuccess - State setter for success message
 * @param {string} message - Success message to display
 * @param {number} duration - Duration in ms (default: 3000)
 */
export const showSuccessToast = (setSuccess, message, duration = 3000) => {
  setSuccess(message);
  setTimeout(() => {
    setSuccess('');
  }, duration);
};

/**
 * Show error message with auto-dismiss
 * @param {Function} setError - State setter for error message
 * @param {string} message - Error message to display
 * @param {number} duration - Duration in ms (default: 5000)
 */
export const showErrorToast = (setError, message, duration = 5000) => {
  setError(message);
  setTimeout(() => {
    setError('');
  }, duration);
};

/**
 * Clear success message immediately
 * @param {Function} setSuccess - State setter for success message
 */
export const clearSuccess = (setSuccess) => {
  setSuccess('');
};

/**
 * Clear error message immediately
 * @param {Function} setError - State setter for error message
 */
export const clearError = (setError) => {
  setError('');
};
