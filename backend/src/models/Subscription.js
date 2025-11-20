

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  planType: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'trial', 'expired', 'cancelled'],
    default: 'trial'
  },
  // Pricing details
  pricing: {
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    }
  },
  // Subscription period
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  trialEndDate: {
    type: Date
  },
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true
  },
  // Usage limits based on plan
  limits: {
    maxUsers: {
      type: Number,
      default: 10
    },
    maxStorage: {
      type: Number,
      default: 1024 // in MB
    },
    maxProjects: {
      type: Number,
      default: 5
    },
    maxApiCalls: {
      type: Number,
      default: 1000
    }
  },
  // Current usage
  currentUsage: {
    users: {
      type: Number,
      default: 0
    },
    storage: {
      type: Number,
      default: 0
    },
    projects: {
      type: Number,
      default: 0
    },
    apiCalls: {
      type: Number,
      default: 0
    }
  },
  // Payment method reference
  paymentMethod: {
    type: String
  },
  // Cancellation details
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
subscriptionSchema.index({ tenant: 1 });
subscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
