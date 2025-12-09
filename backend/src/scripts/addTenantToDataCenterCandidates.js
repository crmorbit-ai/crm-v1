require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Migration script to add tenant field to existing Data Center candidates
 * This script will:
 * 1. Connect to Data Center database
 * 2. Find all candidates without tenant field
 * 3. Assign them to their creator's tenant (based on importedBy)
 * 4. For candidates without importedBy, prompt for tenant assignment
 */

async function addTenantToDataCenterCandidates() {
  try {
    console.log('\n🚀 Starting Data Center Tenant Migration...\n');

    // Connect to main database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to main database');

    // Connect to Data Center database
    const dataCenterURI = process.env.DATA_CENTER_MONGODB_URI ||
      process.env.MONGODB_URI.replace('/crm-anand', '/crm-global-data');

    const dataCenterConnection = mongoose.createConnection(dataCenterURI);
    await dataCenterConnection.asPromise();
    console.log('✓ Connected to Data Center database\n');

    // Get models
    const DataCenterCandidate = dataCenterConnection.model('DataCenterCandidate', require('../models/DataCenterCandidate').schema);

    // Find all candidates without tenant
    const candidatesWithoutTenant = await DataCenterCandidate.find({
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`Found ${candidatesWithoutTenant.length} candidates without tenant\n`);

    if (candidatesWithoutTenant.length === 0) {
      console.log('✅ All candidates already have tenant assigned!');
      return;
    }

    let updated = 0;
    let failed = 0;
    let noImporter = 0;

    for (const candidate of candidatesWithoutTenant) {
      try {
        if (candidate.importedBy) {
          // Find the user who imported this candidate
          const importer = await User.findById(candidate.importedBy);

          if (importer && importer.tenant) {
            candidate.tenant = importer.tenant;
            await candidate.save();
            updated++;
            console.log(`✓ Assigned tenant to: ${candidate.firstName} ${candidate.lastName} (${candidate.email})`);
          } else {
            console.log(`⚠️  Importer not found or has no tenant: ${candidate.email}`);
            noImporter++;
          }
        } else {
          console.log(`⚠️  No importer info: ${candidate.email}`);
          noImporter++;
        }
      } catch (error) {
        console.error(`❌ Failed to update: ${candidate.email}`, error.message);
        failed++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
    console.log(`   • Total candidates: ${candidatesWithoutTenant.length}`);
    console.log(`   • Successfully updated: ${updated}`);
    console.log(`   • No importer/tenant info: ${noImporter}`);
    console.log(`   • Failed: ${failed}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (noImporter > 0) {
      console.log('⚠️  Warning: Some candidates could not be assigned to a tenant.');
      console.log('   You may need to manually assign them or delete them.\n');

      // List candidates without tenant
      const stillWithoutTenant = await DataCenterCandidate.find({
        $or: [
          { tenant: { $exists: false } },
          { tenant: null }
        ]
      }).limit(10);

      console.log('First 10 candidates still without tenant:');
      stillWithoutTenant.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.firstName} ${c.lastName} (${c.email})`);
      });
      console.log('');
    }

    // Close connections
    await dataCenterConnection.close();
    await mongoose.disconnect();
    console.log('✓ Disconnected from databases\n');

    console.log('✅ Migration completed!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addTenantToDataCenterCandidates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
