const UserSettings = require('../models/UserSettings');

// Get user settings
const getUserSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });

    if (!settings) {
      // Create default settings with user's name and email
      settings = await UserSettings.create({
        user: req.user._id,
        emailConfig: {
          displayName: req.user.name || '',
          replyToEmail: req.user.email || '',
          emailSignature: '',
          isConfigured: false
        }
      });
    }

    // Hide SMTP password in response
    const settingsObj = settings.toObject();
    if (settingsObj.emailConfig?.premiumSmtp?.smtpPassword) {
      settingsObj.emailConfig.premiumSmtp.smtpPassword = '********';
    }

    res.json(settingsObj);
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ message: 'Failed to get settings' });
  }
};

// Update email configuration
const updateEmailConfig = async (req, res) => {
  try {
    const { displayName, replyToEmail, emailSignature } = req.body;

    let settings = await UserSettings.findOne({ user: req.user._id });

    if (!settings) {
      settings = new UserSettings({ user: req.user._id });
    }

    settings.emailConfig = {
      displayName: displayName || req.user.name,
      replyToEmail: replyToEmail || req.user.email,
      emailSignature: emailSignature || '',
      isConfigured: true
    };

    await settings.save();

    res.json({
      message: 'Email configuration updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating email config:', error);
    res.status(500).json({ message: 'Failed to update email configuration' });
  }
};

// Test email configuration - send test email
const testEmailConfig = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ user: req.user._id });

    if (!settings || !settings.emailConfig?.isConfigured) {
      return res.status(400).json({ message: 'Email not configured yet' });
    }

    // Use centralized email service to send test
    const emailService = require('../services/emailService');

    await emailService.sendEmail(req.user._id, {
      to: settings.emailConfig.replyToEmail,
      subject: 'Test Email - CRM System',
      text: `Hi ${settings.emailConfig.displayName},\n\nThis is a test email from your CRM system. Your email configuration is working correctly!\n\n${settings.emailConfig.emailSignature || ''}`,
    });

    res.json({ message: 'Test email sent successfully! Check your inbox at ' + settings.emailConfig.replyToEmail });
  } catch (error) {
    console.error('Error testing email:', error);
    res.status(500).json({
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

// Configure premium SMTP (after purchasing email product)
const configurePremiumSmtp = async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail } = req.body;

    console.log('📧 SMTP Configuration Request:', {
      userId: req.user._id,
      tenantId: req.user.tenant,
      smtpHost,
      smtpPort,
      smtpUser,
      fromEmail
    });

    // 🔧 FIX: Check if user has email product from Data Center database
    const { getDataCenterConnection } = require('../config/database');
    const dataCenterConnection = getDataCenterConnection();

    if (!dataCenterConnection) {
      console.error('❌ Data Center database not available');
      return res.status(500).json({
        message: 'Data Center database not available'
      });
    }

    const UserProduct = dataCenterConnection.model('UserProduct');
    const Product = dataCenterConnection.model('Product');

    // Find email product
    const emailProductDoc = await Product.findOne({ type: 'email', isActive: true });
    console.log('📦 Email Product:', emailProductDoc ? emailProductDoc._id : 'Not found');

    if (!emailProductDoc) {
      console.error('❌ Email product not found in system');
      return res.status(500).json({
        message: 'Email product not found in system'
      });
    }

    // Check if user has purchased it
    const userEmailProduct = await UserProduct.findOne({
      tenant: req.user.tenant,
      product: emailProductDoc._id,
      isActive: true,
      remainingCredits: { $gt: 0 }
    }).populate('product');

    console.log('🛒 User Product:', userEmailProduct ? 'Found ✓' : 'Not found ✗');

    if (!userEmailProduct) {
      console.error('❌ User has not purchased email product');
      return res.status(403).json({
        message: 'Please purchase Email product first to use premium SMTP'
      });
    }

    // Verify SMTP settings before saving
    console.log('🔍 Verifying SMTP settings...');
    const emailService = require('../services/emailService');
    const verification = await emailService.verifySmtpSettings(
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword
    );

    console.log('✅ SMTP Verification:', verification.success ? 'Success' : 'Failed');

    if (!verification.success) {
      console.error('❌ SMTP verification failed:', verification.error);
      return res.status(400).json({
        message: 'SMTP verification failed. Please check your settings.',
        error: verification.error
      });
    }

    // Save to database
    console.log('💾 Saving to database...');
    let settings = await UserSettings.findOne({ user: req.user._id });

    if (!settings) {
      console.log('📝 Creating new settings document');
      settings = new UserSettings({ user: req.user._id });
    } else {
      console.log('📝 Updating existing settings');
    }

    settings.emailConfig.isPremium = true;
    settings.emailConfig.premiumSmtp = {
      smtpHost,
      smtpPort: smtpPort || 587,
      smtpUser,
      smtpPassword, // Will be encrypted by pre-save hook
      fromEmail,
      isVerified: true
    };

    await settings.save();
    console.log('✅ Settings saved successfully!');

    res.json({
      message: 'Premium SMTP configured successfully! You can now send emails from your own email.',
      settings: {
        ...settings.toObject(),
        emailConfig: {
          ...settings.emailConfig,
          premiumSmtp: {
            ...settings.emailConfig.premiumSmtp,
            smtpPassword: '********' // Hide password in response
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Error configuring premium SMTP:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      message: 'Failed to configure premium SMTP',
      error: error.message
    });
  }
};

module.exports = {
  getUserSettings,
  updateEmailConfig,
  testEmailConfig,
  configurePremiumSmtp
};
