const cron = require('node-cron');
const User = require('../models/User');
const { sendPasswordExpiryWarning, sendPasswordExpiredEmail } = require('../utils/emailService');

const PASSWORD_VALIDITY_DAYS = 90;
const WARNING_DAYS = [10, 7, 3, 1]; // Send warnings at these days remaining

/**
 * Check for expiring passwords and send notifications
 * Runs daily at 9 AM
 */
const checkPasswordExpiry = async () => {
  try {
    console.log('🔐 Running password expiry check...');

    const now = new Date();
    const users = await User.find({
      isActive: true,
      userType: { $in: ['TENANT_ADMIN', 'TENANT_MANAGER', 'TENANT_USER'] }, // Skip SAAS users
      authProvider: { $ne: 'google' }, // Skip Google OAuth users (no password)
      $or: [
        { passwordChangedAt: { $exists: true } },
        { createdAt: { $exists: true } }
      ]
    }).select('email firstName lastName passwordChangedAt passwordExpiryNotificationSent createdAt authProvider');

    let warned = 0;
    let expired = 0;

    for (const user of users) {
      const passwordDate = user.passwordChangedAt || user.createdAt;
      const daysSinceChange = Math.floor((now - passwordDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = PASSWORD_VALIDITY_DAYS - daysSinceChange;

      // Password already expired
      if (daysRemaining < 0) {
        // Send expired email only once
        const alreadySentExpired = user.passwordExpiryNotificationSent?.some(n => n.daysRemaining === 0);
        if (!alreadySentExpired) {
          try {
            await sendPasswordExpiredEmail(
              user.email,
              `${user.firstName} ${user.lastName}`
            );
            user.passwordExpiryNotificationSent.push({ daysRemaining: 0, sentAt: now });
            await user.save();
            expired++;
            console.log(`  ❌ Expired: ${user.email} (${Math.abs(daysRemaining)} days ago)`);
          } catch (err) {
            console.error(`  ⚠️ Failed to send expired email to ${user.email}:`, err.message);
          }
        }
        continue;
      }

      // Check if warning should be sent
      if (WARNING_DAYS.includes(daysRemaining)) {
        const alreadySent = user.passwordExpiryNotificationSent?.some(
          n => n.daysRemaining === daysRemaining
        );

        if (!alreadySent) {
          try {
            await sendPasswordExpiryWarning(
              user.email,
              `${user.firstName} ${user.lastName}`,
              daysRemaining
            );

            user.passwordExpiryNotificationSent.push({ daysRemaining, sentAt: now });
            await user.save();
            warned++;
            console.log(`  ⏰ Warning sent: ${user.email} (${daysRemaining} days remaining)`);
          } catch (err) {
            console.error(`  ⚠️ Failed to send warning to ${user.email}:`, err.message);
          }
        }
      }
    }

    console.log(`✅ Password expiry check complete: ${warned} warnings sent, ${expired} expired notifications`);
  } catch (error) {
    console.error('❌ Password expiry check failed:', error);
  }
};

/**
 * Schedule password expiry checker
 * Runs every day at 9:00 AM
 */
const startPasswordExpiryChecker = () => {
  // Run at 9 AM every day
  cron.schedule('0 9 * * *', checkPasswordExpiry, {
    timezone: 'Asia/Kolkata'
  });

  console.log('✅ Password expiry checker scheduled (daily at 9:00 AM IST)');

  // Run once on startup (for testing)
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      console.log('🔍 Running initial password expiry check...');
      checkPasswordExpiry();
    }, 5000);
  }
};

module.exports = {
  startPasswordExpiryChecker,
  checkPasswordExpiry
};
