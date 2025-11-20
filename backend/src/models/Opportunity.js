const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
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
    enum: [
      'Qualification',
      'Needs Analysis', 
      'Value Proposition',
      'Id. Decision Makers',
      'Perception Analysis',
      'Proposal/Price Quote',
      'Negotiation/Review',
      'Closed Won',
      'Closed Lost'
    ],
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
    enum: ['New Business', 'Existing Business', 'New Customer', 'Existing Customer'],
    default: 'New Business'
  },
  
  leadSource: {
    type: String,
    enum: [
      '',
      'Advertisement',
      'Cold Call',
      'Employee Referral',
      'External Referral',
      'Partner',
      'Public Relations',
      'Sales Mail Alias',
      'Seminar Partner',
      'Trade Show',
      'Web Research',
      'Website',
      'Chat',
      'Other'
    ]
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

// Calculate expected revenue based on amount and probability
opportunitySchema.pre('save', function(next) {
  if (this.amount && this.probability) {
    this.expectedRevenue = (this.amount * this.probability) / 100;
  }
  next();
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

module.exports = Opportunity;