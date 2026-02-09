require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('./config/passport');
const connectDB = require('./config/database');
const { connectDataCenterDB } = require('./config/database');
const imapIdleService = require('./services/imapIdleService');
const emailSyncJob = require('./jobs/emailSyncJob');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Allowed Origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  ...(process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);

// CORS Configuration
const corsConfig = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};

// Socket.io
const io = new Server(server, { cors: corsConfig });

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-tenant', (tenantId) => {
    socket.join(`tenant-${tenantId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

global.io = io;

// Middlewares
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use('/uploads', express.static('uploads'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// Routes - Auth & Users
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/features', require('./routes/features'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/billings', require('./routes/billings'));
app.use('/api/activity-logs', require('./routes/activityLogs'));
app.use('/api/resellers', require('./routes/resellers'));

// Routes - CRM Core
app.use('/api/leads', require('./routes/leads'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/calls', require('./routes/callRoutes'));
app.use('/api/emails', require('./routes/emails'));

// Routes - Products & Data
app.use('/api/data-center', require('./routes/dataCenter'));
app.use('/api/products', require('./routes/products'));
app.use('/api/product-categories', require('./routes/productCategoryRoutes'));
app.use('/api/product-items', require('./routes/productItems'));
app.use('/api/field-definitions', require('./routes/fieldDefinitions'));
app.use('/api/rfi', require('./routes/rfi'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/user-settings', require('./routes/userSettings'));
app.use('/api/support-tickets', require('./routes/supportTickets'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/saas-admins', require('./routes/saasAdmins'));


app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    await connectDataCenterDB();

    server.listen(PORT, async () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      emailSyncJob.start();

      try {
        await imapIdleService.startAllIdleConnections();
      } catch (err) {
        console.error('❌ IMAP IDLE failed:', err.message);
      }
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error(`💡 Fix: lsof -ti:${PORT} | xargs kill -9\n`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down...`);
  server.close();
  await imapIdleService.stopAllIdleConnections().catch(() => {});
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
