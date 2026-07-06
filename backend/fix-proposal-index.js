require('dotenv').config();
const mongoose = require('mongoose');

const fixProposalIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Proposal = mongoose.model('Proposal', new mongoose.Schema({}, { strict: false }));

    // Get current indexes
    const indexes = await Proposal.collection.getIndexes();
    console.log('📋 Current indexes:');
    Object.keys(indexes).forEach(key => {
      console.log(`  - ${key}:`, JSON.stringify(indexes[key]));
    });

    // Drop the old unique proposalNumber index if it exists
    try {
      await Proposal.collection.dropIndex('proposalNumber_1');
      console.log('\n✅ Dropped old proposalNumber_1 unique index');
    } catch (error) {
      console.log('\n⚠️  Old index not found or already dropped:', error.message);
    }

    // Create new compound unique index
    try {
      await Proposal.collection.createIndex(
        { tenant: 1, proposalNumber: 1 },
        { unique: true, name: 'tenant_1_proposalNumber_1_unique' }
      );
      console.log('✅ Created new compound unique index: tenant + proposalNumber');
    } catch (error) {
      console.log('⚠️  Index creation note:', error.message);
    }

    // Verify new indexes
    const newIndexes = await Proposal.collection.getIndexes();
    console.log('\n📋 Updated indexes:');
    Object.keys(newIndexes).forEach(key => {
      console.log(`  - ${key}:`, JSON.stringify(newIndexes[key]));
    });

    console.log('\n✅ Index fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixProposalIndex();
