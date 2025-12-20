const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  // Basic Information
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true
  },
  
  accountType: {
    type: String,
    enum: [
      'Analyst',
      'Competitor',
      'Customer',
      'Distributor',
      'Integrator',
      'Investor',
      'Partner',
      'Press',
      'Prospect',
      'Reseller',
      'Supplier',
      'Vendor',
      'Other'
    ],
    default: 'Prospect'
  },
  
  industry: {
    type: String,
    enum: [
      '',
      'Agriculture',
      'Apparel',
      'Banking',
      'Biotechnology',
      'Chemicals',
      'Communications',
      'Construction',
      'Consulting',
      'Education',
      'Electronics',
      'Energy',
      'Engineering',
      'Entertainment',
      'Environmental',
      'Finance',
      'Food & Beverage',
      'Government',
      'Healthcare',
      'Hospitality',
      'Insurance',
      'IT',
      'Machinery',
      'Manufacturing',
      'Media',
      'Not For Profit',
      'Recreation',
      'Retail',
      'Shipping',
      'Technology',
      'Telecommunications',
      'Transportation',
      'Utilities',
      'Other'
    ]
  },
  
  website: {
    type: String,
    trim: true
  },
  
  phone: {
    type: String,
    trim: true
  },
  
  fax: {
    type: String,
    trim: true
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Financial Information
  annualRevenue: {
    type: Number,
    min: 0
  },
  
  numberOfEmployees: {
    type: Number,
    min: 0
  },
  
  // Address Information
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Parent Account
  parentAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  
  // Additional Information
  rating: {
    type: String,
    enum: ['Hot', 'Warm', 'Cold']
  },
  
  ownership: {
    type: String,
    trim: true
  },
  
  tickerSymbol: {
    type: String,
    trim: true
  },
  
  SICCode: {
    type: String,
    trim: true
  },
  
  description: {
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
  }],

  // Custom Fields (Dynamic fields defined by Product Team)
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
accountSchema.index({ tenant: 1, isActive: 1 });
accountSchema.index({ owner: 1 });
accountSchema.index({ accountType: 1 });
accountSchema.index({ industry: 1 });
accountSchema.index({ accountName: 'text', email: 'text' });

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;