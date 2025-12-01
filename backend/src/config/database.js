const mongoose = require('mongoose');

// Main CRM Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// ═══════════════════════════════════════════════════════════════
// 🚀 DATA CENTER DATABASE CONNECTION (SEPARATE)
// ═══════════════════════════════════════════════════════════════

let dataCenterConnection = null;

const connectDataCenterDB = async () => {
  try {
    // Use same MongoDB cluster but different database
    const dataCenterURI = process.env.DATA_CENTER_MONGODB_URI ||
      process.env.MONGODB_URI.replace('/crm-anand', '/crm-datacenter');

    // Create connection without deprecated options
    dataCenterConnection = mongoose.createConnection(dataCenterURI);

    // Wait for connection to open
    await dataCenterConnection.asPromise();

    // ✅ REGISTER DATA CENTER MODELS ON THIS CONNECTION
    const DataCenterCandidate = require('../models/DataCenterCandidate');

    // Re-register the model on this connection
    if (!dataCenterConnection.models.DataCenterCandidate) {
      dataCenterConnection.model('DataCenterCandidate', DataCenterCandidate.schema);
    }

    console.log(`✅ Data Center DB Connected: ${dataCenterConnection.host}`);

    // Handle connection events
    dataCenterConnection.on('error', (err) => {
      console.error('Data Center DB connection error:', err);
    });

    dataCenterConnection.on('disconnected', () => {
      console.log('Data Center DB disconnected');
    });

    return dataCenterConnection;

  } catch (error) {
    console.error(`Data Center DB Error: ${error.message}`);
    console.log('⚠️  Data Center features will be disabled');
    return null;
  }
};

const getDataCenterConnection = () => {
  return dataCenterConnection;
};

// Export connectDB as default for backward compatibility
module.exports = connectDB;

// Also export as named exports
module.exports.connectDB = connectDB;
module.exports.connectDataCenterDB = connectDataCenterDB;
module.exports.getDataCenterConnection = getDataCenterConnection;