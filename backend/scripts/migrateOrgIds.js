/**
 * Migration Script: Update Organization IDs to new format
 * Format: U + first 2 letters of org name + 5 digit number
 * Example: "Test Company" -> "UTE00001"
 *
 * Run: node scripts/migrateOrgIds.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Tenant = require('../src/models/Tenant');

const migrateOrgIds = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all tenants
    const tenants = await Tenant.find({}).sort({ createdAt: 1 });
    console.log(`Found ${tenants.length} tenants to process\n`);

    let counter = 1;
    const updates = [];

    for (const tenant of tenants) {
      const oldId = tenant.organizationId || 'N/A';

      // Get first 2 letters of organization name (uppercase)
      const orgPrefix = tenant.organizationName
        ? tenant.organizationName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase()
        : 'XX';

      // Generate new ID: U + 2 letters + 5 digit number
      const newId = `U${orgPrefix}${String(counter).padStart(5, '0')}`;

      updates.push({
        tenantId: tenant._id,
        organizationName: tenant.organizationName,
        oldId: oldId,
        newId: newId
      });

      counter++;
    }

    // Show preview
    console.log('Preview of changes:');
    console.log('='.repeat(70));
    updates.forEach(u => {
      console.log(`${u.organizationName.padEnd(30)} | ${u.oldId.padEnd(15)} -> ${u.newId}`);
    });
    console.log('='.repeat(70));
    console.log(`\nTotal: ${updates.length} tenants will be updated\n`);

    // Check if --run flag is passed
    const shouldRun = process.argv.includes('--run');

    if (shouldRun) {
      console.log('\nUpdating organization IDs...\n');

      for (const update of updates) {
        await Tenant.findByIdAndUpdate(update.tenantId, {
          organizationId: update.newId
        });
        console.log(`✓ Updated: ${update.organizationName} -> ${update.newId}`);
      }

      console.log('\n✅ Migration completed successfully!');
      await mongoose.disconnect();
      process.exit(0);
    } else {
      console.log('\nThis is a preview. To execute the migration, run:');
      console.log('node scripts/migrateOrgIds.js --run\n');
      await mongoose.disconnect();
      process.exit(0);
    }

  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

migrateOrgIds();
