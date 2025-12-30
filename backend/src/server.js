require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { connectDataCenterDB } = require('./config/database');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS - Smart Origin Handling
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ];

  // Add custom origins from env
  if (process.env.ALLOWED_ORIGINS) {
    const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    origins.push(...customOrigins);
  }

  // Auto-allow Vercel deployments
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  return origins;
};

const allowedOrigins = getAllowedOrigins();

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow any vercel.app subdomain for development
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join tenant room for isolated communication
  socket.on('join-tenant', (tenantId) => {
    socket.join(`tenant-${tenantId}`);
    console.log(`✅ Socket ${socket.id} joined tenant room: tenant-${tenantId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io available globally for other services
global.io = io;

// IMAP IDLE service for real-time email notifications
const imapIdleService = require('./services/imapIdleService');
const emailService = require('./services/emailService');

// Start email sync cron job (backup - now less frequent since we have IDLE)
const emailSyncJob = require('./jobs/emailSyncJob');
emailSyncJob.start();

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Allow any *.vercel.app domain (for preview deployments)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Production fallback - log and allow (temporary for debugging)
    console.log('⚠️ CORS Request from:', origin);

    // Reject other origins
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

// Additional CORS headers as fallback
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow Vercel deployments
  if (origin && origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth & User Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/features', require('./routes/features'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/billings', require('./routes/billings'));
app.use('/api/activity-logs', require('./routes/activityLogs'));

// ============================================
// 🚀 RESELLER ROUTES
// ============================================
app.use('/api/resellers', require('./routes/resellers'));

// ============================================
// 🚀 DATA CENTER ROUTES
// ============================================
app.use('/api/data-center', require('./routes/dataCenter'));
app.use('/api/products', require('./routes/products'));
app.use('/api/user-settings', require('./routes/userSettings'));
app.use('/api/support-tickets', require('./routes/supportTickets'));

// ============================================
// 📦 PRODUCT MANAGEMENT ROUTES (CRM Products)
// ============================================
app.use('/api/product-categories', require('./routes/productCategoryRoutes')); // ✅ NEW
app.use('/api/product-items', require('./routes/productItems'));
// ============================================

// ============================================
// 🎨 FIELD CUSTOMIZATION ROUTES (Dynamic Fields)
// ============================================
app.use('/api/field-definitions', require('./routes/fieldDefinitions'));
// ============================================

// ============================================
// 💰 B2B WORKFLOW ROUTES (RFI → RFQ → PO → Invoice)
// ============================================
app.use('/api/rfi', require('./routes/rfi'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/invoices', require('./routes/invoices'));
// ============================================

// CRM Routes
app.use('/api/leads', require('./routes/leads'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/calls', require('./routes/callRoutes'));
app.use('/api/emails', require('./routes/emails'));

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

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(response);
});

// Start server
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // Connect to databases first
    await connectDB();
    await connectDataCenterDB();

    // Start server with error handling
    server.listen(PORT, async () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Socket.io server ready`);

      // Start IMAP IDLE service for real-time email notifications
      try {
        await imapIdleService.startAllIdleConnections();
      } catch (error) {
        console.error('❌ Failed to start IMAP IDLE service:', error.message);
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error(`\n💡 SOLUTION: Kill the existing process using one of these commands:\n`);
        console.error(`   Option 1: pkill -f "node src/server.js"`);
        console.error(`   Option 2: lsof -ti:${PORT} | xargs kill -9`);
        console.error(`   Option 3: npx kill-port ${PORT}\n`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error.message);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Stop IMAP IDLE connections
  try {
    await imapIdleService.stopAllIdleConnections();
  } catch (error) {
    console.error('❌ Error stopping IMAP IDLE:', error.message);
  }

  // Exit process
  process.exit(0);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;