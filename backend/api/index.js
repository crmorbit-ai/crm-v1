// Wrap entire initialization in try-catch
try {
  require('dotenv').config();
} catch (error) {
  console.error('Error loading .env:', error);
}

let app;
try {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const mongoose = require('mongoose');

  console.log('✅ Core modules loaded');

  // Initialize express app
  app = express();
  console.log('✅ Express app initialized');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load core modules:', error);
  throw error;
}

// Global error handler for uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// CRITICAL: CORS must be the FIRST middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow all Vercel deployments and localhost
  if (origin && (origin.endsWith('.vercel.app') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// CORS options
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ];

  if (process.env.ALLOWED_ORIGINS) {
    const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    origins.push(...customOrigins);
  }

  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  return origins;
};

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    console.log('⚠️ CORS Request from:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🆕 Initialize Passport for Google OAuth
try {
  const passport = require('../src/config/passport');
  app.use(passport.initialize());
  console.log('✅ Passport initialized');
} catch (error) {
  console.error('⚠️ Passport initialization failed:', error.message);
}

// 🆕 Serve uploaded files (logos) - Note: This won't work in Vercel serverless
// Consider using cloud storage (S3, Cloudinary) for production
app.use('/uploads', express.static('uploads'));

// Database connection management for serverless
let cachedDb = null;
let cachedDataCenterDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedDb = conn;
    console.log('✅ Main DB connected');
    return conn;
  } catch (error) {
    console.error('❌ Main DB connection failed:', error.message);
    throw error;
  }
};

const connectToDataCenterDB = async () => {
  if (cachedDataCenterDb && cachedDataCenterDb.readyState === 1) {
    return cachedDataCenterDb;
  }

  try {
    const dataCenterURI = process.env.DATA_CENTER_MONGODB_URI;

    if (!dataCenterURI) {
      console.log('⚠️ DATA_CENTER_MONGODB_URI not set, skipping data center DB');
      return null;
    }

    cachedDataCenterDb = mongoose.createConnection(dataCenterURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await cachedDataCenterDb.asPromise();

    // ✅ REGISTER DATA CENTER MODELS ON THIS CONNECTION
    const DataCenterCandidate = require('../src/models/DataCenterCandidate');
    const Product = require('../src/models/Product');
    const UserProduct = require('../src/models/UserProduct');

    // Re-register the models on this connection
    if (!cachedDataCenterDb.models.DataCenterCandidate) {
      cachedDataCenterDb.model('DataCenterCandidate', DataCenterCandidate.schema);
    }
    if (!cachedDataCenterDb.models.Product) {
      cachedDataCenterDb.model('Product', Product.schema);
    }
    if (!cachedDataCenterDb.models.UserProduct) {
      cachedDataCenterDb.model('UserProduct', UserProduct.schema);
    }

    // ✅ SET THE CONNECTION GLOBALLY SO CONTROLLERS CAN ACCESS IT
    const { setDataCenterConnection } = require('../src/config/database');
    setDataCenterConnection(cachedDataCenterDb);

    console.log('✅ Data Center DB connected and models registered');
    return cachedDataCenterDb;
  } catch (error) {
    console.error('❌ Data Center DB connection failed:', error.message);
    return null;
  }
};

// Health check routes (no DB required)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CRM API is running on Vercel',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
    hasMongoUri: !!process.env.MONGODB_URI
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    envVars: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasDataCenterUri: !!process.env.DATA_CENTER_MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'CRM API is running',
    timestamp: new Date().toISOString()
  });
});

// Middleware to ensure database connection (skip for health checks)
app.use(async (req, res, next) => {
  // Skip DB connection for health check routes
  if (req.path === '/' || req.path === '/health' || req.path === '/api') {
    return next();
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await connectToDatabase();
    await connectToDataCenterDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Load routes with error handling
try {
  console.log('📂 Loading routes...');

  // Auth & User Routes
  app.use('/api/auth', require('../src/routes/auth'));
  console.log('  ✅ auth routes loaded');

  app.use('/api/users', require('../src/routes/users'));
  app.use('/api/tenants', require('../src/routes/tenants'));
  app.use('/api/roles', require('../src/routes/roles'));
  app.use('/api/groups', require('../src/routes/groups'));
  app.use('/api/features', require('../src/routes/features'));
  app.use('/api/subscriptions', require('../src/routes/subscriptions'));
  app.use('/api/billings', require('../src/routes/billings'));
  app.use('/api/activity-logs', require('../src/routes/activityLogs'));
  console.log('  ✅ core routes loaded');

  // Reseller Routes
  app.use('/api/resellers', require('../src/routes/resellers'));

  // Data Center Routes
  app.use('/api/data-center', require('../src/routes/dataCenter'));
  app.use('/api/products', require('../src/routes/products'));
  app.use('/api/user-settings', require('../src/routes/userSettings'));
  app.use('/api/support-tickets', require('../src/routes/supportTickets'));
  console.log('  ✅ data center routes loaded');

  // Product Management Routes
  app.use('/api/product-categories', require('../src/routes/productCategoryRoutes'));
  app.use('/api/product-items', require('../src/routes/productItems'));

  // Field Customization Routes
  app.use('/api/field-definitions', require('../src/routes/fieldDefinitions'));

  // B2B Workflow Routes
  app.use('/api/rfi', require('../src/routes/rfi'));
  app.use('/api/quotations', require('../src/routes/quotations'));
  app.use('/api/purchase-orders', require('../src/routes/purchaseOrders'));
  app.use('/api/invoices', require('../src/routes/invoices'));
  console.log('  ✅ B2B workflow routes loaded');

  // CRM Routes
  app.use('/api/leads', require('../src/routes/leads'));
  app.use('/api/accounts', require('../src/routes/accounts'));
  app.use('/api/contacts', require('../src/routes/contacts'));
  app.use('/api/opportunities', require('../src/routes/opportunities'));
  app.use('/api/tasks', require('../src/routes/taskRoutes'));
  app.use('/api/notes', require('../src/routes/noteRoutes'));
  app.use('/api/meetings', require('../src/routes/meetingRoutes'));
  app.use('/api/calls', require('../src/routes/callRoutes'));
  app.use('/api/emails', require('../src/routes/emails'));
  console.log('  ✅ CRM routes loaded');

  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  console.error('❌ Stack:', error.stack);
  // Don't throw - let the app start anyway for debugging
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  const response = {
    success: false,
    message: err.message || 'Internal server error'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(response);
});

module.exports = app;
