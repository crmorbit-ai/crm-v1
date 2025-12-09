require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { connectDataCenterDB } = require('./config/database'); // 🚀 NEW

// Initialize express app
const app = express();

// Connect to databases
connectDB();
connectDataCenterDB(); // 🚀 NEW - Data Center DB

const corsOptions = {
  origin: function (origin, callback) {
    // Get allowed origins from environment variable or use defaults
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001';
    const allowedOrigins = allowedOriginsEnv.split(',').map(o => o.trim());

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Helmet with CORS-friendly settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Other middleware
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
// 🚀 DATA CENTER ROUTES - NEW
// ============================================
app.use('/api/data-center', require('./routes/dataCenter'));
app.use('/api/products', require('./routes/products'));
app.use('/api/user-settings', require('./routes/userSettings'));
app.use('/api/support-tickets', require('./routes/supportTickets'));
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
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

module.exports = app;