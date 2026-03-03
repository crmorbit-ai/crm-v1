const cron = require('node-cron');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Account = require('../models/Account');
const Opportunity = require('../models/Opportunity');
const Note = require('../models/Note');
const Task = require('../models/Task');
const Call = require('../models/Call');
const Meeting = require('../models/Meeting');
const ActivityLog = require('../models/ActivityLog');
const FieldDefinition = require('../models/FieldDefinition');
const DataCenterCandidate = require('../models/DataCenterCandidate');
const Group = require('../models/Group');
const Role = require('../models/Role');

/**
 * Permanently deletes all data for tenants whose 45-day recovery window has expired.
 * Runs daily at midnight.
 */
const runDeletionCleanup = async () => {
  console.log('🗑️  [DeletionCleanup] Running scheduled permanent deletion check...');

  try {
    const expiredTenants = await Tenant.find({
      'deletionRequest.status': 'approved',
      'deletionRequest.permanentDeleteAt': { $lte: new Date() },
      isActive: false
    }).select('_id organizationName organizationId contactEmail deletionRequest');

    if (expiredTenants.length === 0) {
      console.log('🗑️  [DeletionCleanup] No expired tenants found. Skipping.');
      return;
    }

    console.log(`🗑️  [DeletionCleanup] Found ${expiredTenants.length} tenant(s) to permanently delete.`);

    for (const tenant of expiredTenants) {
      try {
        console.log(`🗑️  [DeletionCleanup] Permanently deleting: ${tenant.organizationName} (${tenant.organizationId})`);

        // Delete all tenant data in parallel (child collections first)
        await Promise.all([
          Lead.deleteMany({ tenant: tenant._id }),
          Contact.deleteMany({ tenant: tenant._id }),
          Account.deleteMany({ tenant: tenant._id }),
          Opportunity.deleteMany({ tenant: tenant._id }),
          Note.deleteMany({ tenant: tenant._id }),
          Task.deleteMany({ tenant: tenant._id }),
          Call.deleteMany({ tenant: tenant._id }),
          Meeting.deleteMany({ tenant: tenant._id }),
          ActivityLog.deleteMany({ tenant: tenant._id }),
          FieldDefinition.deleteMany({ tenant: tenant._id }),
          DataCenterCandidate.deleteMany({ tenant: tenant._id }),
          Group.deleteMany({ tenant: tenant._id }),
          Role.deleteMany({ tenant: tenant._id }),
        ]);

        // Delete users
        await User.deleteMany({ tenant: tenant._id });

        // Finally delete the tenant itself
        await Tenant.deleteOne({ _id: tenant._id });

        console.log(`✅ [DeletionCleanup] Successfully deleted: ${tenant.organizationName}`);
      } catch (tenantError) {
        console.error(`❌ [DeletionCleanup] Failed to delete tenant ${tenant.organizationName}:`, tenantError.message);
        // Continue with next tenant even if one fails
      }
    }

    console.log('🗑️  [DeletionCleanup] Cleanup completed.');
  } catch (error) {
    console.error('❌ [DeletionCleanup] Cron job error:', error.message);
  }
};

/**
 * Registers the deletion cleanup cron job.
 * Call this from server.js after DB connection.
 */
const startDeletionCleanupJob = () => {
  // Run daily at midnight: '0 0 * * *'
  cron.schedule('0 0 * * *', runDeletionCleanup, {
    timezone: 'Asia/Kolkata'
  });

  console.log('✅ [DeletionCleanup] Scheduled permanent deletion cron job (daily midnight IST).');
};

module.exports = { startDeletionCleanupJob, runDeletionCleanup };
