const axios = require('axios');

/**
 * ✅ EMAIL VERIFICATION SERVICE

 */
const verifyEmail = async (email) => {
  try {
    if (!email || !email.trim()) {
      return {
        isValid: false,
        status: 'invalid',
        message: 'Email is required'
      };
    }

    console.log('📧 Verifying email with ZeroBounce:', email);

    const response = await axios.get('https://api.zerobounce.net/v2/validate', {
      params: {
        api_key: process.env.ZEROBOUNCE_API_KEY,
        email: email.trim().toLowerCase(),
        ip_address: ''
      },
      timeout: 10000
    });

    const data = response.data;
    
    console.log('📧 ZeroBounce response:', data.status);
    
    const isValid = data.status === 'valid';
    const isRisky = ['catch-all', 'unknown'].includes(data.status);
    const isInvalid = ['invalid', 'spamtrap', 'abuse', 'do_not_mail'].includes(data.status);
    
    let status = 'unknown';
    if (isValid) {
      status = 'valid';
    } else if (isInvalid) {
      status = 'invalid';
    } else if (isRisky) {
      status = 'risky';
    }
    
    return {
      isValid: isValid,
      status: status,
      details: {
        quality_score: data.status === 'valid' ? 95 : 50,
        is_disposable: data.free_email || false,
        is_valid_format: !isInvalid,
        smtp_valid: data.smtp_provider !== null,
        deliverability: data.status.toUpperCase(),
        sub_status: data.sub_status || 'none',
        mx_found: data.mx_found || 'unknown',
        verifiedAt: new Date()
      },
      message: isValid 
        ? 'Email is valid and deliverable ✅' 
        : isInvalid
        ? 'Email is invalid or risky ❌'
        : 'Email verification inconclusive ⚠️'
    };
  } catch (error) {
    console.error('ZeroBounce email verification error:', error.message);
    
    return {
      isValid: null,
      status: 'unknown',
      details: null,
      message: 'Unable to verify email at this time',
      error: error.message
    };
  }
};

/**
 * ✅ PHONE VERIFICATION SERVICE
 * Smart Format Validation (Reliable for Indian numbers)
 */
const verifyPhone = async (phone) => {
  try {
    if (!phone || !phone.trim()) {
      return {
        isValid: false,
        status: 'invalid',
        message: 'Phone number is required'
      };
    }

    // Clean phone number
    const cleanPhone = phone.trim().replace(/[\s\-\(\)\+]/g, '');

    console.log('📱 Verifying phone format:', cleanPhone);

    // Remove country code if present (91 for India)
    let phoneNumber = cleanPhone;
    if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
      phoneNumber = phoneNumber.substring(2);
    }

    // Indian mobile validation: 10 digits, starts with 6-9
    const isIndianMobile = /^[6-9]\d{9}$/.test(phoneNumber);
    
    if (isIndianMobile) {
      console.log('📱 Valid Indian mobile number');
      return {
        isValid: true,
        status: 'valid',
        details: {
          type: 'mobile',
          carrier: 'Indian carrier',
          location: 'India',
          country: 'India',
          format: '+91-' + phoneNumber,
          verifiedAt: new Date()
        },
        message: 'Valid Indian mobile number ✅'
      };
    }

    // International format: 10-15 digits
    const isInternational = /^\d{10,15}$/.test(phoneNumber);
    
    if (isInternational) {
      console.log('📱 Valid international phone number');
      return {
        isValid: true,
        status: 'valid',
        details: {
          type: 'phone',
          carrier: 'International',
          location: 'Unknown',
          country: 'Unknown',
          format: phoneNumber,
          verifiedAt: new Date()
        },
        message: 'Valid phone number ✅'
      };
    }

    // Invalid format
    console.log('📱 Invalid phone format');
    return {
      isValid: false,
      status: 'invalid',
      details: null,
      message: 'Invalid phone number format (Indian: 10 digits starting with 6-9) ❌'
    };

  } catch (error) {
    console.error('Phone verification error:', error.message);
    
    return {
      isValid: null,
      status: 'unknown',
      details: null,
      message: 'Unable to verify phone at this time',
      error: error.message
    };
  }
};

module.exports = {
  verifyEmail,
  verifyPhone
};