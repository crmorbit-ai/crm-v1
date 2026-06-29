/**
 * Migration Script: Generate Formatted Lead IDs
 *
 * This script generates formatted lead IDs (L + OrgPrefix + 5-digit number)
 * for all existing leads that don't have a leadId yet.
 *
 * Format: L{OrgPrefix}{Number}
 * Example: LAN00001, LAN00002 (for "Anand" organization)
 *
 * Run: node scripts/generate-lead-ids.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function generateLeadIds() {
  try {
    // Connect to tenant database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm-anand');
    console.log('✅ Connected to database');

    // Get models
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({
      organizationName: String
    }, { strict: false }));

    const Lead = mongoose.model('Lead', new mongoose.Schema({
      tenant: mongoose.Schema.Types.ObjectId,
      leadNumber: Number,
      leadId: String
    }, { strict: false, timestamps: true }));

    // Get all unique tenants from leads
    const tenantIds = await Lead.distinct('tenant');
    console.log(`\n📊 Found ${tenantIds.length} unique tenants\n`);

    let totalUpdated = 0;

    for (const tenantId of tenantIds) {
      try {
        // Get tenant info
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
          console.log(`⚠️  Tenant ${tenantId} not found, skipping...`);
          continue;
        }

        const orgName = tenant.organizationName || 'ORG';
        const orgPrefix = orgName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() || 'OR';

        console.log(`\n🏢 Organization: ${orgName} (Prefix: ${orgPrefix})`);

        // Get all leads for this tenant without leadId
        const leads = await Lead.find({
          tenant: tenantId,
          $or: [
            { leadId: { $exists: false } },
            { leadId: null },
            { leadId: '' }
          ]
        }).sort({ leadNumber: 1 });

        console.log(`   Found ${leads.length} leads without leadId`);

        let updated = 0;
        for (const lead of leads) {
          const leadNumber = lead.leadNumber || 0;
          const formattedId = `L${orgPrefix}${String(leadNumber).padStart(5, '0')}`;

          await Lead.updateOne(
            { _id: lead._id },
            { $set: { leadId: formattedId } }
          );

          console.log(`   ✅ ${lead.customerName || lead.firstName || 'Unknown'}: ${formattedId}`);
          updated++;
          totalUpdated++;
        }

        console.log(`   📊 Updated ${updated} leads for ${orgName}`);

      } catch (err) {
        console.error(`   ❌ Error processing tenant ${tenantId}:`, err.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Total leads updated: ${totalUpdated}`);
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
    console.log('\n🎉 Migration complete! Check Leads page to verify.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
generateLeadIds();
