const mongoose = require('mongoose');

async function deleteOldCollection() {
  try {
    // Connect to crm-main database
    const conn = await mongoose.createConnection('mongodb+srv://crmorbit:conyaO2cR9T5BEKW@crmorbit.reumvbf.mongodb.net/crm-main');

    console.log('✅ Connected to crm-main database');

    // Check if collection exists
    const collections = await conn.db.listCollections({ name: 'masterinventoryitems' }).toArray();
    
    if (collections.length > 0) {
      console.log('📦 Found masterinventoryitems collection in crm-main');
      
      // Count documents first
      const count = await conn.db.collection('masterinventoryitems').countDocuments();
      console.log(`📊 Collection has ${count} documents`);
      
      // Drop the collection
      await conn.db.dropCollection('masterinventoryitems');
      console.log('🗑️  ✅ Deleted masterinventoryitems from crm-main');
    } else {
      console.log('⚠️  Collection masterinventoryitems not found in crm-main (already clean)');
    }

    await conn.close();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteOldCollection();
