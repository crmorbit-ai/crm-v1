/**
 * Migration Script: Generate Formatted Customer IDs
 *
 * This script generates formatted customer IDs (C + OrgPrefix + 5-digit number)
 * for all existing customers that don't have a customerId yet.
 *
 * Format: C{OrgPrefix}{Number}
 * Example: CAN00001, CAN00002 (for "Anand" organization)
 *
 * Run: node scripts/generate-customer-ids.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function generateCustomerIds() {
  try {
    // Connect to both databases
    const tenantConn = await mongoose.createConnection(process.env.MONGO_URI || 'mongodb://localhost:27017/crm-anand');
    const masterConn = await mongoose.createConnection(process.env.MASTER_DB_URI || 'mongodb://localhost:27017/master-database');

    console.log('✅ Connected to databases');

    // Get models
    const Tenant = tenantConn.model('Tenant', new mongoose.Schema({
      organizationName: String
    }, { strict: false }));

    const DataCenterCandidate = masterConn.model('DataCenterCandidate', new mongoose.Schema({
      tenant: mongoose.Schema.Types.ObjectId,
      customerNumber: Number,
      customerId: String
    }, { strict: false, timestamps: true }));

    // Get all unique tenants from customers
    const tenantIds = await DataCenterCandidate.distinct('tenant');
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

        // Get all customers for this tenant without customerId
        const customers = await DataCenterCandidate.find({
          tenant: tenantId,
          $or: [
            { customerId: { $exists: false } },
            { customerId: null },
            { customerId: '' }
          ]
        }).sort({ customerNumber: 1 });

        console.log(`   Found ${customers.length} customers without customerId`);

        let updated = 0;
        for (const customer of customers) {
          const customerNumber = customer.customerNumber || 0;
          const formattedId = `C${orgPrefix}${String(customerNumber).padStart(5, '0')}`;

          await DataCenterCandidate.updateOne(
            { _id: customer._id },
            { $set: { customerId: formattedId } }
          );

          console.log(`   ✅ ${customer.customerName || 'Unknown'}: ${formattedId}`);
          updated++;
          totalUpdated++;
        }

        console.log(`   📊 Updated ${updated} customers for ${orgName}`);

      } catch (err) {
        console.error(`   ❌ Error processing tenant ${tenantId}:`, err.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Total customers updated: ${totalUpdated}`);
    console.log('='.repeat(60));

    await tenantConn.close();
    await masterConn.close();
    console.log('\n✅ Disconnected from databases');
    console.log('\n🎉 Migration complete! Check Customer Database page to verify.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
generateCustomerIds();
