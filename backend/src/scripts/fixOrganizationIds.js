/**
 * Script to fix duplicate organization IDs
 * Run: node src/scripts/fixOrganizationIds.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Tenant = require('../models/Tenant');

const fixOrganizationIds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all tenants sorted by createdAt
    const tenants = await Tenant.find({}).sort({ createdAt: 1 });
    console.log(`Found ${tenants.length} tenants`);

    // Assign unique organization IDs
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      const newOrgId = `UFS${String(i + 1).padStart(3, '0')}`;

      if (tenant.organizationId !== newOrgId) {
        console.log(`Updating ${tenant.organizationName}: ${tenant.organizationId || 'null'} -> ${newOrgId}`);
        await Tenant.updateOne(
          { _id: tenant._id },
          { $set: { organizationId: newOrgId } }
        );
      }
    }

    console.log('\n✅ All organization IDs fixed!');

    // Verify
    const updated = await Tenant.find({}).select('organizationId organizationName').sort({ organizationId: 1 });
    console.log('\nUpdated Organization IDs:');
    updated.forEach(t => {
      console.log(`  ${t.organizationId} - ${t.organizationName}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixOrganizationIds();
