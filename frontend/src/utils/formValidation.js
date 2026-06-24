// Validation utilities and error display helper

export const showFieldError = (errorText) => {
  if (!errorText) return null;

  return `
    <div style="font-size: 11px; color: #ef4444; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style="flex-shrink: 0;">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <span>${errorText}</span>
    </div>
  `;
};

export const validateProductName = (name) => {
  if (!name || !name.trim()) {
    return 'Product name is required';
  }
  if (name.trim().length < 3) {
    return 'Product name must be at least 3 characters';
  }
  if (name.trim().length > 100) {
    return 'Product name must be less than 100 characters';
  }
  if (!/^[a-zA-Z0-9\s\-_.()&]+$/.test(name.trim())) {
    return 'Invalid characters in product name';
  }
  return null;
};

export const validateSKU = (sku) => {
  if (sku && sku.trim() && !/^[a-zA-Z0-9\-_]+$/.test(sku.trim())) {
    return 'SKU can only contain letters, numbers, hyphens and underscores';
  }
  return null;
};

export const validatePrice = (price) => {
  if (price && (isNaN(price) || parseFloat(price) < 0)) {
    return 'Price must be a valid positive number';
  }
  return null;
};

export const validateStock = (stock) => {
  if (stock && (isNaN(stock) || parseInt(stock) < 0)) {
    return 'Stock must be a valid positive number';
  }
  return null;
};

export const validateEmail = (email, required = false) => {
  if (required && (!email || !email.trim())) {
    return 'Email is required';
  }
  if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePhone = (phone) => {
  if (phone && phone.trim()) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return 'Please enter a valid 10-digit phone number';
    }
  }
  return null;
};

export const validateDescription = (desc) => {
  if (desc && desc.trim().length > 500) {
    return 'Description must be less than 500 characters';
  }
  return null;
};
