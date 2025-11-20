const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  // Invoice details
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  // Billing period
  billingPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  // Amount details
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'other']
  },
  transactionId: {
    type: String
  },
  // Line items
  items: [{
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  // Notes
  notes: {
    type: String
  },
  // Metadata
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for faster queries
billingSchema.index({ tenant: 1 });
billingSchema.index({ invoiceNumber: 1 });
billingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Billing', billingSchema);
