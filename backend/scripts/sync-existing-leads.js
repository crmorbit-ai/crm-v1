/**
 * Migration Script: Sync Existing Leads to Customer Database
 *
 * This script creates DataCenterCandidate (Customer) records for all existing leads
 * that don't have a corresponding customer entry yet.
 *
 * Run: node scripts/sync-existing-leads.js
 */

const mongoose = require('mongoose');
const Lead = require('../src/models/Lead');
const DataCenterCandidate = require('../src/models/DataCenterCandidate');

// Load environment variables
require('dotenv').config();

async function syncLeads() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/crm-anand';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    // Get all active leads
    const leads = await Lead.find({ isActive: true }).lean();
    console.log(`\n📊 Found ${leads.length} active leads`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const lead of leads) {
      try {
        // Check if customer already exists for this lead
        const existingCustomer = await DataCenterCandidate.findOne({
          leadId: lead._id,
          tenant: lead.tenant
        });

        if (existingCustomer) {
          console.log(`⏭️  Skip: Lead "${lead.name || lead.firstName || lead._id}" - Customer already exists`);
          skipped++;
          continue;
        }

        // Get next customer number for this tenant
        const lastCustomer = await DataCenterCandidate.findOne({ tenant: lead.tenant })
          .sort({ customerNumber: -1 })
          .select('customerNumber')
          .lean();

        const nextCustomerNumber = (lastCustomer?.customerNumber || 0) + 1;

        // Create customer data (copy all lead fields)
        const customerData = {
          ...lead,
          _id: undefined, // Remove lead's _id to create new customer _id
          leadId: lead._id, // Link back to lead
          status: 'Lead',
          dataSource: 'Lead',
          movedBy: lead.createdBy,
          movedToLeadsAt: new Date(),
          movedToTenant: lead.tenant,
          importedBy: lead.createdBy,
          importedAt: new Date(),
          customerNumber: nextCustomerNumber,
          isActive: true
        };

        // Create customer
        await DataCenterCandidate.create(customerData);
        console.log(`✅ Created: Lead "${lead.name || lead.firstName || lead._id}" → Customer #${nextCustomerNumber}`);
        created++;

      } catch (err) {
        console.error(`❌ Error: Lead "${lead.name || lead.firstName || lead._id}":`, err.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Created:  ${created} customers`);
    console.log(`⏭️  Skipped:  ${skipped} (already synced)`);
    console.log(`❌ Errors:   ${errors}`);
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('\n🎉 Migration complete! Check Customer Database page to verify.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
syncLeads();
