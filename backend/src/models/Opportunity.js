const mongoose = require('mongoose');
const Counter = require('./Counter');

const opportunitySchema = new mongoose.Schema({
  // Deal ID (auto-generated)
  dealId: {
    type: String,
    unique: true,
    trim: true
  },

  // Basic Information
  opportunityName: {
    type: String,
    required: [true, 'Opportunity name is required'],
    trim: true
  },

  amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  closeDate: {
    type: Date,
    required: [true, 'Close date is required']
  },
  
  stage: {
    type: String,
    default: 'Qualification'
  },
  
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  type: {
    type: String,
    default: 'New Business'
  },
  
  leadSource: {
    type: String,
    trim: true
  },
  
  nextStep: {
    type: String,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Relationships
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Account is required']
  },
  
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  
  // Additional Fields
  expectedRevenue: {
    type: Number,
    default: 0
  },
  
  campaignSource: {
    type: String,
    trim: true
  },
  
  contactRole: {
    type: String,
    trim: true
  },
  
  // Account Manager (separate from owner)
  accountManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Contract Document
  contract: {
    url: { type: String },
    publicId: { type: String },
    fileName: { type: String },
    fileType: { type: String }
  },

  // Owner and Tenant
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Tags
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes
opportunitySchema.index({ tenant: 1, isActive: 1 });
opportunitySchema.index({ account: 1 });
opportunitySchema.index({ owner: 1 });
opportunitySchema.index({ stage: 1 });
opportunitySchema.index({ closeDate: 1 });
opportunitySchema.index({ opportunityName: 'text' });

// Virtual for days until close
opportunitySchema.virtual('daysUntilClose').get(function() {
  if (!this.closeDate) return null;
  const now = new Date();
  const diff = this.closeDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Auto-generate dealId - use timestamp for uniqueness
// Auto-generate Deal ID using atomic counter
opportunitySchema.pre('save', async function(next) {
  if (this.isNew && !this.dealId) {
    try {
      const year = new Date().getFullYear();

      const counter = await Counter.findOneAndUpdate(
        {
          name: 'deal',
          tenant: this.tenant,
          year: year
        },
        {
          $inc: { sequence: 1 }
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      const nextNumber = counter.sequence;

      this.dealId = `DEAL-${year}-${String(nextNumber).padStart(5, '0')}`;

    } catch (err) {
      return next(err);
    }
  }

  if (this.amount && this.probability) {
    this.expectedRevenue = (this.amount * this.probability) / 100;
  }

  next();
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

module.exports = Opportunity;