const axios = require('axios');

/**
 * FREE GST Verification Service
 * Uses government GST portal public search
 */

/**
 * Verify GSTIN and fetch company details
 * @param {string} gstin - 15 character GSTIN
 * @returns {object} Company details
 */
exports.verifyGSTIN = async (gstin) => {
  try {
    // Step 1: Validate GSTIN format
    if (!gstin || gstin.length !== 15) {
      throw new Error('Invalid GSTIN format. Must be 15 characters.');
    }

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(gstin)) {
      throw new Error('Invalid GSTIN format');
    }

    // Step 2: Extract basic info from GSTIN structure
    const stateCode = gstin.substring(0, 2);
    const panNumber = gstin.substring(2, 12);

    // State code mapping
    const stateMap = {
      '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
      '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
      '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
      '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
      '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
      '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
      '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
      '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
      '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli', '27': 'Maharashtra',
      '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa',
      '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
      '34': 'Puducherry', '35': 'Andaman and Nicobar Islands', '36': 'Telangana',
      '37': 'Andhra Pradesh', '38': 'Ladakh'
    };

    const state = stateMap[stateCode] || 'Unknown';

    // Step 3: Try multiple FREE API methods

    // Method 1: Try GST API India (Free public endpoint)
    try {
      console.log(`🔍 Trying API 1: gst-api.org for ${gstin}`);
      const response1 = await axios.get(`https://gst-api.org/search/${gstin}`, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      });

      if (response1.data && response1.data.taxpayerInfo) {
        const data = response1.data.taxpayerInfo;
        console.log('✅ API 1 Success:', data.legalName);
        return {
          success: true,
          verified: true,
          gstin: gstin,
          legalName: data.legalName || data.tradeName || '',
          tradeName: data.tradeName || '',
          address: data.pradr?.adr || data.address || '',
          state: state,
          stateCode: stateCode,
          pan: panNumber,
          registrationDate: data.rgdt || '',
          taxpayerType: data.dty || '',
          status: data.sts || 'Active',
          source: 'GST API India'
        };
      }
    } catch (apiError1) {
      console.log('⚠️ API 1 failed:', apiError1.message);
    }

    // Method 2: Try GSTIN Search (Alternative free endpoint)
    try {
      console.log(`🔍 Trying API 2: gstinsearch.com for ${gstin}`);
      const response2 = await axios.get(`https://api.gstinsearch.com/search/${gstin}`, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      });

      if (response2.data && response2.data.data) {
        const data = response2.data.data;
        console.log('✅ API 2 Success:', data.lgnm);
        return {
          success: true,
          verified: true,
          gstin: gstin,
          legalName: data.lgnm || data.legal_name || '',
          tradeName: data.tradeNam || data.trade_name || '',
          address: formatAddress(data),
          state: state,
          stateCode: stateCode,
          pan: panNumber,
          registrationDate: data.rgdt || data.registration_date || '',
          taxpayerType: data.dty || data.taxpayer_type || '',
          status: data.sts || data.status || 'Active',
          source: 'GSTIN Search'
        };
      }
    } catch (apiError2) {
      console.log('⚠️ API 2 failed:', apiError2.message);
    }

    // Method 3: Try original gstincheck endpoint
    try {
      console.log(`🔍 Trying API 3: gstincheck.co.in for ${gstin}`);
      const response3 = await axios.get(`https://sheet.gstincheck.co.in/check/${gstin}`, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      });

      if (response3.data && response3.data.data) {
        const data = response3.data.data;
        console.log('✅ API 3 Success:', data.lgnm);
        return {
          success: true,
          verified: true,
          gstin: gstin,
          legalName: data.lgnm || data.legal_name || '',
          tradeName: data.tradeNam || data.trade_name || '',
          address: formatAddress(data),
          state: state,
          stateCode: stateCode,
          pan: panNumber,
          registrationDate: data.rgdt || data.registration_date || '',
          taxpayerType: data.dty || data.taxpayer_type || '',
          status: data.sts || data.status || 'Active',
          source: 'GST Check'
        };
      }
    } catch (apiError3) {
      console.log('⚠️ API 3 failed:', apiError3.message);
    }

    console.log('❌ All free APIs failed, using fallback validation');

    // Fallback: Return basic validation with extracted data
    return {
      success: true,
      verified: false,
      gstin: gstin,
      legalName: '', // User will enter manually
      tradeName: '',
      address: '',
      state: state,
      stateCode: stateCode,
      pan: panNumber,
      registrationDate: '',
      taxpayerType: '',
      status: 'Format Valid',
      source: 'Format Validation Only',
      message: 'GSTIN format is valid. Please verify manually at https://services.gst.gov.in/services/searchtp'
    };

  } catch (error) {
    throw new Error(error.message || 'GST verification failed');
  }
};

/**
 * Format address from GST API response
 */
function formatAddress(data) {
  const parts = [];

  if (data.pradr) {
    const addr = data.pradr;
    if (addr.bno) parts.push(addr.bno);
    if (addr.bnm) parts.push(addr.bnm);
    if (addr.st) parts.push(addr.st);
    if (addr.loc) parts.push(addr.loc);
    if (addr.dst) parts.push(addr.dst);
    if (addr.stcd) parts.push(addr.stcd);
    if (addr.pncd) parts.push('- ' + addr.pncd);
  } else if (data.address) {
    return data.address;
  }

  return parts.join(', ');
}

/**
 * Validate GSTIN checksum (last digit)
 */
function validateChecksum(gstin) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let factor = 2;
  let sum = 0;

  for (let i = gstin.length - 2; i >= 0; i--) {
    let codePoint = chars.indexOf(gstin[i]);
    let digit = factor * codePoint;
    factor = (factor === 2) ? 1 : 2;
    digit = Math.floor(digit / chars.length) + (digit % chars.length);
    sum += digit;
  }

  const checkDigit = (chars.length - (sum % chars.length)) % chars.length;
  return checkDigit === chars.indexOf(gstin[gstin.length - 1]);
}
