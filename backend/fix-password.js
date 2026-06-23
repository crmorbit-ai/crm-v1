const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPassword() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const User = require('./src/models/User');

    // Get user email from command line
    const email = process.argv[2];
    const newPassword = process.argv[3] || '123456';

    if (!email) {
      console.log('❌ Please provide email as argument');
      console.log('Usage: node fix-password.js <email> [password]');
      console.log('Example: node fix-password.js user@example.com mypassword');
      process.exit(1);
    }

    // Find user
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { loginName: email.toLowerCase() }
      ]
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\n👤 Found user: ${user.firstName} ${user.lastName}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Login Name: ${user.loginName}`);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      mustChangePassword: false
    });

    console.log(`\n✅ Password updated successfully!`);
    console.log(`🔐 New password: ${newPassword}`);
    console.log(`\nYou can now login with:`);
    console.log(`   Login Name: ${user.loginName}`);
    console.log(`   Password: ${newPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPassword();
