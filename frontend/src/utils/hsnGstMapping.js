/**
 * HSN/SAC to GST Rate Mapping
 * Based on Government of India GST Rate Schedule
 */

export const HSN_GST_RATES = {
  // Computers & Electronics (18%)
  '8471': 18,    // Computers, laptops
  '847130': 18,  // Portable computers (laptops)
  '847141': 18,  // Desktop computers
  '8473': 18,    // Computer parts/accessories
  '8517': 18,    // Mobile phones, telephones
  '8528': 18,    // Monitors, TVs
  '8518': 18,    // Microphones, speakers
  '8519': 18,    // Sound recording devices
  '8521': 18,    // Video recording devices
  '8522': 18,    // Parts of audio/video equipment

  // IT Services (18%)
  '998314': 18,  // IT Software Services
  '998313': 18,  // Information Technology Services
  '998316': 18,  // Data Processing Services
  '998317': 18,  // Web Hosting Services
  '998311': 18,  // Telecommunication Services
  '998312': 18,  // Online Information Services

  // Professional Services (18%)
  '999799': 18,  // Consulting Services
  '996511': 18,  // Marketing/Advertising Services
  '998212': 18,  // Legal Services
  '998211': 18,  // Accounting Services
  '998219': 18,  // Management Consulting
  '998215': 18,  // Architectural Services
  '998216': 18,  // Engineering Services

  // Furniture & Office Supplies (18%)
  '9403': 18,    // Office furniture
  '940330': 18,  // Wooden furniture
  '940340': 18,  // Kitchen furniture
  '940350': 18,  // Bedroom furniture
  '4820': 12,    // Stationery (registers, books, etc.)
  '482010': 12,  // Exercise books

  // Food Items (Variable Rates)
  '1001': 5,     // Wheat
  '1006': 5,     // Rice
  '0401': 0,     // Milk (0% GST)
  '0402': 5,     // Milk powder
  '0403': 5,     // Curd, yogurt
  '0404': 12,    // Whey, butter milk
  '1701': 5,     // Sugar
  '0901': 5,     // Coffee
  '0902': 5,     // Tea
  '2106': 28,    // Pan masala, tobacco products

  // Clothing & Textiles (5% or 12%)
  '6101': 5,     // Men's garments (cotton)
  '6102': 5,     // Women's garments (cotton)
  '6201': 12,    // Men's overcoats
  '6203': 12,    // Men's suits

  // Vehicles (28%)
  '8703': 28,    // Motor cars, passenger vehicles
  '8711': 28,    // Motorcycles
  '8712': 12,    // Bicycles

  // Books & Publications (0% or 5%)
  '4901': 0,     // Printed books
  '4902': 0,     // Newspapers
  '4903': 5,     // Children's picture books

  // Medicines & Healthcare (12% or 5%)
  '3004': 12,    // Medicaments
  '9018': 12,    // Medical instruments
  '9021': 12,    // Orthopaedic appliances

  // Construction Materials (Variable)
  '2523': 5,     // Cement
  '7308': 18,    // Iron/Steel structures
  '4407': 18,    // Wood/timber

  // Default fallback
  'default': 18  // Most common rate
};

/**
 * Get GST rate for a given HSN/SAC code
 * @param {string} hsnCode - HSN or SAC code (4, 6, or 8 digits)
 * @returns {number} GST rate percentage
 */
export const getGstRateFromHsn = (hsnCode) => {
  if (!hsnCode || typeof hsnCode !== 'string') {
    return HSN_GST_RATES.default;
  }

  const cleanHsn = hsnCode.trim().toUpperCase();

  // Try exact match first (8-digit, 6-digit, or 4-digit)
  if (HSN_GST_RATES[cleanHsn]) {
    return HSN_GST_RATES[cleanHsn];
  }

  // Try 6-digit match (if 8-digit entered)
  if (cleanHsn.length === 8) {
    const sixDigit = cleanHsn.substring(0, 6);
    if (HSN_GST_RATES[sixDigit]) {
      return HSN_GST_RATES[sixDigit];
    }
  }

  // Try 4-digit match (if 6 or 8 digit entered)
  if (cleanHsn.length >= 4) {
    const fourDigit = cleanHsn.substring(0, 4);
    if (HSN_GST_RATES[fourDigit]) {
      return HSN_GST_RATES[fourDigit];
    }
  }

  // Return default if no match
  return HSN_GST_RATES.default;
};

/**
 * Get HSN details including description
 * @param {string} hsnCode
 * @returns {object} { code, gstRate, description }
 */
export const getHsnDetails = (hsnCode) => {
  const gstRate = getGstRateFromHsn(hsnCode);

  const descriptions = {
    '8471': 'Computers & Laptops',
    '8517': 'Mobile Phones',
    '998314': 'IT Software Services',
    '9403': 'Furniture',
    '4820': 'Stationery',
    '8703': 'Motor Vehicles',
    '1001': 'Wheat',
    '0401': 'Milk'
  };

  return {
    code: hsnCode,
    gstRate: gstRate,
    description: descriptions[hsnCode] || 'Product/Service'
  };
};
