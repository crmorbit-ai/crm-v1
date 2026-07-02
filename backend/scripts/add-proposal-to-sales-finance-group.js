const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const groupSchema = new mongoose.Schema({
  name: String,
  slug: String,
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  groupPermissions: [{
    feature: String,
    actions: [String]
  }]
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);

async function addProposalToSalesFinanceGroups() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all Sales & Finance groups
    const groups = await Group.find({
      slug: 'sales-finance-group'
    });

    console.log(`📋 Found ${groups.length} Sales & Finance Groups\n`);

    let updated = 0;

    for (const group of groups) {
      // Check if proposal_management already exists
      const hasProposal = group.groupPermissions.some(
        p => p.feature === 'proposal_management'
      );

      if (!hasProposal) {
        console.log(`➕ Adding proposal_management to group: ${group.name} (Tenant: ${group.tenant})`);

        // Add proposal_management after rfi_management
        const rfiIndex = group.groupPermissions.findIndex(p => p.feature === 'rfi_management');
        const insertIndex = rfiIndex >= 0 ? rfiIndex + 1 : 0;

        group.groupPermissions.splice(insertIndex, 0, {
          feature: 'proposal_management',
          actions: []
        });

        // Update description
        group.description = 'Manages proposals, RFI, quotations, purchase orders, and invoices';

        await group.save();
        updated++;
        console.log(`   ✅ Updated successfully\n`);
      } else {
        console.log(`⏭️  Skipping group: ${group.name} (already has proposal_management)\n`);
      }
    }

    console.log(`\n🎉 Migration Complete!`);
    console.log(`   Updated: ${updated} groups`);
    console.log(`   Skipped: ${groups.length - updated} groups\n`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addProposalToSalesFinanceGroups();
