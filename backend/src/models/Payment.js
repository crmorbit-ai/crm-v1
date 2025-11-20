const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Tenant Info
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  
  // Plan Info
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Billing
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'one-time'],
    required: true
  },
  billingPeriodStart: {
    type: Date,
    required: true
  },
  billingPeriodEnd: {
    type: Date,
    required: true
  },
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Payment Gateway
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'stripe', 'paypal', 'bank_transfer', 'cash', 'manual', 'demo'],
    default: 'razorpay'
  },
  
  // Gateway Response
  gatewayTransactionId: {
    type: String
  },
  gatewayOrderId: {
    type: String
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Invoice
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceUrl: {
    type: String
  },
  
  // Payment Info
  paidAt: {
    type: Date
  },
  paymentType: {
    type: String,
    enum: ['subscription', 'upgrade', 'renewal', 'addon'],
    default: 'subscription'
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Notes
  notes: {
    type: String
  },
  
  // Refund
  refundedAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  }
}, {
  timestamps: true
});

// Generate invoice number
paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber && this.status === 'completed') {
    const count = await mongoose.model('Payment').countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
paymentSchema.index({ tenant: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ invoiceNumber: 1 });
paymentSchema.index({ gatewayTransactionId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);