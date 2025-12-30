require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('../src/config/database');
const { connectDataCenterDB } = require('../src/config/database');

// Initialize express app
const app = express();

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

// Connect to database (only once per serverless function execution)
let isConnected = false;

const connectDatabases = async () => {
  if (isConnected) {
    return;
  }

  try {
    await connectDB();
    await connectDataCenterDB();
    isConnected = true;
    console.log('✅ Databases connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Middleware to ensure database connection
app.use(async (req, res, next) => {
  try {
    await connectDatabases();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'CRM API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth & User Routes
app.use('/api/auth', require('../src/routes/auth'));
app.use('/api/users', require('../src/routes/users'));
app.use('/api/tenants', require('../src/routes/tenants'));
app.use('/api/roles', require('../src/routes/roles'));
app.use('/api/groups', require('../src/routes/groups'));
app.use('/api/features', require('../src/routes/features'));
app.use('/api/subscriptions', require('../src/routes/subscriptions'));
app.use('/api/billings', require('../src/routes/billings'));
app.use('/api/activity-logs', require('../src/routes/activityLogs'));

// Reseller Routes
app.use('/api/resellers', require('../src/routes/resellers'));

// Data Center Routes
app.use('/api/data-center', require('../src/routes/dataCenter'));
app.use('/api/products', require('../src/routes/products'));
app.use('/api/user-settings', require('../src/routes/userSettings'));
app.use('/api/support-tickets', require('../src/routes/supportTickets'));

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
