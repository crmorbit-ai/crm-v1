const mongoose = require('mongoose');

// Section Schema for flexible content (Project Overview, Scope of Work, etc.)
const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String, // HTML content from rich text editor
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
});

// Milestone Schema for Timeline
const milestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  durationUnit: {
    type: String,
    enum: ['Day', 'Week', 'Month'],
    default: 'Week'
  },
  order: {
    type: Number,
    default: 0
  }
});

// Resource Schema for Budget/Cost Estimation
const resourceSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    trim: true
  },
  count: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true
  },
  order: {
    type: Number,
    default: 0
  }
});

// Payment Term Schema
const paymentTermSchema = new mongoose.Schema({
  milestone: {
    type: String,
    required: true,
    trim: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  order: {
    type: Number,
    default: 0
  }
});

const proposalSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  // Auto-generated Proposal Number
  proposalNumber: {
    type: String,
    unique: true,
    index: true
  },

  // Relations
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'customerModel',
    required: false
  },
  customerModel: {
    type: String,
    enum: ['Lead', 'Contact', 'Account', 'DataCenterCandidate'],
    required: false
  },
  opportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: false
  },

  // Customer Details (copied at creation for snapshot)
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: String,
  customerAddress: String,
  customerCompany: String,

  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  rfpNumber: {
    type: String,
    trim: true
  },
  proposalDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    default: 'draft',
    index: true
  },

  // Assignment & Review
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  reviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'revision_needed'],
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  },

  // Content Sections (flexible, can add multiple sections)
  sections: [sectionSchema],

  // Timeline & Milestones
  milestones: [milestoneSchema],
  totalDuration: {
    type: Number,
    default: 0
  },
  totalDurationUnit: {
    type: String,
    enum: ['Day', 'Week', 'Month'],
    default: 'Week'
  },

  // Budget & Resources
  resources: [resourceSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR', 'GBP'],
    default: 'INR'
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },

  // Payment Terms
  paymentTerms: [paymentTermSchema],

  // Additional Fields
  terms: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    trim: true
  },
  internalNotes: {
    type: String,
    trim: true
  },

  // Email tracking
  sentAt: Date,
  sentTo: [String],
  viewedAt: Date,
  viewedBy: String,

  // Conversion tracking
  convertedToInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  convertedAt: Date,

  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
proposalSchema.index({ tenant: 1, proposalNumber: 1 });
proposalSchema.index({ tenant: 1, status: 1 });
proposalSchema.index({ tenant: 1, customer: 1 });
proposalSchema.index({ tenant: 1, createdAt: -1 });

// Auto-generate proposal number before save
proposalSchema.pre('save', async function(next) {
  if (!this.proposalNumber) {
    const Counter = mongoose.model('Counter');
    const currentYear = new Date().getFullYear();

    const counter = await Counter.findOneAndUpdate(
      { name: 'Proposal', tenant: this.tenant, year: currentYear },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    this.proposalNumber = `PROP-${String(counter.sequence).padStart(4, '0')}`;
  }

  // Calculate totals
  this.subtotal = this.resources.reduce((sum, r) => sum + (r.total || 0), 0);
  this.totalAmount = this.subtotal;

  next();
});

// Method to check if expired
proposalSchema.methods.checkExpiry = function() {
  if (this.status !== 'expired' && this.validUntil < new Date()) {
    this.status = 'expired';
    return true;
  }
  return false;
};

module.exports = mongoose.model('Proposal', proposalSchema);
