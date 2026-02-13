// Script to reset all viewing PINs
// Run: node scripts/resetAllPins.js

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function resetAllPins() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    // Reset all viewing PINs
    const result = await mongoose.connection.db.collection('users').updateMany(
      {},
      {
        $set: {
          viewingPin: null,
          isViewingPinSet: false,
          viewingPinOTP: null,
          viewingPinOTPExpiry: null
        }
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} users' viewing PINs`);

    // Verify
    const sample = await mongoose.connection.db.collection('users')
      .find({}, { projection: { email: 1, isViewingPinSet: 1 } })
      .limit(5)
      .toArray();

    console.log('\nSample users after reset:');
    sample.forEach(u => console.log(`  ${u.email}: isViewingPinSet = ${u.isViewingPinSet}`));

    await mongoose.disconnect();
    console.log('\n✅ Done! All PINs have been reset.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetAllPins();
