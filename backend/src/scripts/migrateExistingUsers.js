require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for migration');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateExistingUsers = async () => {
  try {
    await connectDB();

    console.log('\n======================================');
    console.log('Starting User Migration');
    console.log('======================================\n');

    // Find all existing users that don't have the new fields set
    const usersToMigrate = await User.find({
      $or: [
        { emailVerified: { $exists: false } },
        { isProfileComplete: { $exists: false } },
        { authProvider: { $exists: false } },
        { isPendingVerification: { $exists: false } }
      ]
    });

    console.log(`Found ${usersToMigrate.length} users to migrate\n`);

    if (usersToMigrate.length === 0) {
      console.log('✅ No users need migration. All users are up to date!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersToMigrate) {
      try {
        // Update fields for existing users
        const updates = {};

        // Email verification: Mark existing users as verified
        if (user.emailVerified === undefined) {
          updates.emailVerified = true;
        }

        // Profile completion: Mark existing users as having completed profile
        // (since they registered through the old flow which included all details)
        if (user.isProfileComplete === undefined) {
          updates.isProfileComplete = true;
        }

        // Auth provider: Set to 'local' for existing users
        if (!user.authProvider) {
          updates.authProvider = 'local';
        }

        // Pending verification: Set to false for existing users
        if (user.isPendingVerification === undefined) {
          updates.isPendingVerification = false;
        }

        // Apply updates
        await User.updateOne({ _id: user._id }, { $set: updates });

        successCount++;
        console.log(`✓ Migrated user: ${user.email} (${user.userType})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating user ${user.email}:`, error.message);
      }
    }

    console.log('\n======================================');
    console.log('Migration Complete!');
    console.log('======================================\n');
    console.log(`✅ Successfully migrated: ${successCount} users`);
    if (errorCount > 0) {
      console.log(`❌ Failed to migrate: ${errorCount} users`);
    }
    console.log('\n');

    // Verify migration
    console.log('Verifying migration...');
    const verifyCount = await User.countDocuments({
      emailVerified: true,
      isProfileComplete: true,
      authProvider: 'local',
      isPendingVerification: false
    });
    console.log(`✅ ${verifyCount} users now have all required fields set\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  }
};

// Run migration
migrateExistingUsers();
