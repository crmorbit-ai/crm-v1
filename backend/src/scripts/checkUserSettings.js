require('dotenv').config();
const mongoose = require('mongoose');
const UserSettings = require('../models/UserSettings');
const User = require('../models/User');

/**
 * Check user settings in database
 */

async function checkUserSettings() {
  try {
    console.log('\n🔍 Checking User Settings...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get email from command line or use default
    const email = process.argv[2] || 'iasabhishek6200@gmail.com';

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`User: ${user.email} (${user.firstName} ${user.lastName})`);
    console.log(`User ID: ${user._id}\n`);

    // Find settings
    const settings = await UserSettings.findOne({ user: user._id });

    if (!settings) {
      console.log('❌ No settings found for this user\n');
    } else {
      console.log('✅ Settings found!\n');
      console.log('Email Config:');
      console.log(`  Display Name: ${settings.emailConfig?.displayName || 'Not set'}`);
      console.log(`  Reply To: ${settings.emailConfig?.replyToEmail || 'Not set'}`);
      console.log(`  Signature: ${settings.emailConfig?.emailSignature ? 'Set' : 'Not set'}`);
      console.log(`  Is Configured: ${settings.emailConfig?.isConfigured || false}`);
      console.log(`\nPremium SMTP:`);
      console.log(`  Is Premium: ${settings.emailConfig?.isPremium || false}`);

      if (settings.emailConfig?.premiumSmtp) {
        console.log(`  Host: ${settings.emailConfig.premiumSmtp.smtpHost || 'Not set'}`);
        console.log(`  Port: ${settings.emailConfig.premiumSmtp.smtpPort || 'Not set'}`);
        console.log(`  User: ${settings.emailConfig.premiumSmtp.smtpUser || 'Not set'}`);
        console.log(`  From: ${settings.emailConfig.premiumSmtp.fromEmail || 'Not set'}`);
        console.log(`  Password: ${settings.emailConfig.premiumSmtp.smtpPassword ? 'Encrypted ✓' : 'Not set'}`);
        console.log(`  Is Verified: ${settings.emailConfig.premiumSmtp.isVerified || false}`);
      } else {
        console.log('  Not configured');
      }

      console.log(`\nCreated: ${settings.createdAt}`);
      console.log(`Updated: ${settings.updatedAt}`);
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');
    process.exit(0);
  }
}

// Run the script
checkUserSettings();
