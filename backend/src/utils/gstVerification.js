/**
 * GST Verification Utility
 *
 * Validates and verifies GST numbers
 */

/**
 * Validate GST Number format
 * Format: 22AAAAA0000A1Z5
 * - First 2 digits: State code (01-37)
 * - Next 10 characters: PAN number
 * - 13th character: Number of registrations (1-9, A-Z)
 * - 14th character: Z (default)
 * - 15th character: Check digit (0-9, A-Z)
 */
const validateGSTFormat = (gstNumber) => {
  if (!gstNumber || typeof gstNumber !== 'string') {
    return { valid: false, error: 'GST number is required' };
  }

  // Remove spaces and convert to uppercase
  const cleanGST = gstNumber.trim().toUpperCase();

  // Check length
  if (cleanGST.length !== 15) {
    return { valid: false, error: 'GST number must be 15 characters' };
  }

  // Validate format using regex
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstRegex.test(cleanGST)) {
    return { valid: false, error: 'Invalid GST number format' };
  }

  // Extract state code
  const stateCode = parseInt(cleanGST.substring(0, 2));

  // Validate state code (01-37 are valid state codes)
  if (stateCode < 1 || stateCode > 37) {
    return { valid: false, error: 'Invalid state code in GST number' };
  }

  // Extract PAN from GST (characters 3-12)
  const pan = cleanGST.substring(2, 12);

  return {
    valid: true,
    gstNumber: cleanGST,
    stateCode: stateCode,
    pan: pan,
    registrationNumber: cleanGST.charAt(12),
    checkDigit: cleanGST.charAt(14)
  };
};

/**
 * Validate PAN Number format
 * Format: ABCDE1234F
 * - First 3 characters: Alphabetic series (A-Z)
 * - 4th character: Type of holder (C=Company, P=Person, etc.)
 * - 5th character: First letter of surname/name
 * - Next 4 characters: Sequential number (0-9)
 * - Last character: Alphabetic check digit
 */
const validatePANFormat = (panNumber) => {
  if (!panNumber || typeof panNumber !== 'string') {
    return { valid: false, error: 'PAN number is required' };
  }

  // Remove spaces and convert to uppercase
  const cleanPAN = panNumber.trim().toUpperCase();

  // Check length
  if (cleanPAN.length !== 10) {
    return { valid: false, error: 'PAN number must be 10 characters' };
  }

  // Validate format using regex
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  if (!panRegex.test(cleanPAN)) {
    return { valid: false, error: 'Invalid PAN number format' };
  }

  // Extract holder type
  const holderType = cleanPAN.charAt(3);
  const holderTypes = {
    'C': 'Company',
    'P': 'Person',
    'H': 'HUF',
    'F': 'Firm',
    'A': 'AOP',
    'T': 'Trust',
    'B': 'BOI',
    'L': 'Local Authority',
    'J': 'Artificial Juridical Person',
    'G': 'Government'
  };

  return {
    valid: true,
    panNumber: cleanPAN,
    holderType: holderTypes[holderType] || 'Unknown',
    holderCode: holderType
  };
};

/**
 * Verify GST Number (with external API - placeholder)
 * In production, integrate with GST API from Government of India
 */
const verifyGSTWithAPI = async (gstNumber) => {
  // First validate format
  const formatValidation = validateGSTFormat(gstNumber);

  if (!formatValidation.valid) {
    return formatValidation;
  }

  try {
    // TODO: Integrate with actual GST verification API
    // Example: https://api.gst.gov.in/enriched/gst/verify
    // For now, we just return format validation

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      valid: true,
      verified: true,
      gstNumber: formatValidation.gstNumber,
      stateCode: formatValidation.stateCode,
      pan: formatValidation.pan,
      message: 'GST number format is valid'
      // In production, add:
      // - businessName
      // - registrationDate
      // - status (Active/Cancelled)
      // - address
    };

  } catch (error) {
    return {
      valid: false,
      verified: false,
      error: 'GST verification service unavailable',
      details: error.message
    };
  }
};

module.exports = {
  validateGSTFormat,
  validatePANFormat,
  verifyGSTWithAPI
};
