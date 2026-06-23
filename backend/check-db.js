const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    console.log('\n🔍 Checking Database Connection...\n');

    // Connect to main database
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ TENANT DATABASE:');
    console.log('   Database Name:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('   URI:', process.env.MONGODB_URI.split('@')[1].split('?')[0]);

    // Check collections count
    const User = require('./src/models/User');
    const Tenant = require('./src/models/Tenant');

    const userCount = await User.countDocuments();
    const tenantCount = await Tenant.countDocuments();

    console.log('\n📊 Data Summary:');
    console.log('   Total Users:', userCount);
    console.log('   Total Tenants:', tenantCount);

    // Check master database connection
    const masterDB = mongoose.createConnection(process.env.DATA_CENTER_MONGODB_URI);
    await masterDB.asPromise();

    console.log('\n✅ MASTER DATABASE:');
    console.log('   Database Name:', masterDB.name);
    console.log('   Host:', masterDB.host);
    console.log('   URI:', process.env.DATA_CENTER_MONGODB_URI.split('@')[1].split('?')[0]);

    masterDB.close();

    console.log('\n✅ All connections OK!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
