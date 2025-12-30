const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    trim: true
  },
  
  lastName: {
    type: String,
    trim: true
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // EMAIL VERIFICATION FIELDS
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationStatus: {
    type: String,
    enum: ['pending', 'valid', 'invalid', 'risky', 'unknown'],
    default: 'pending'
  },
  emailVerificationDetails: {
    quality_score: Number,
    is_disposable: Boolean,
    is_valid_format: Boolean,
    smtp_valid: Boolean,
    deliverability: String,
    verifiedAt: Date
  },
  
  phone: {
    type: String,
    trim: true
  },
  
  // PHONE VERIFICATION FIELDS
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationStatus: {
    type: String,
    enum: ['pending', 'valid', 'invalid', 'unknown'],
    default: 'pending'
  },
  phoneVerificationDetails: {
    type: String, // mobile/landline/voip
    carrier: String,
    location: String,
    format: String,
    verifiedAt: Date
  },
  
  mobilePhone: {
    type: String,
    trim: true
  },
  
  fax: {
    type: String,
    trim: true
  },
  
  company: {
    type: String,
    trim: true
  },
  
  jobTitle: {
    type: String,
    trim: true
  },
  
  website: {
    type: String,
    trim: true
  },
  
  // Lead Details
  leadSource: {
    type: String,
    enum: [
      'Advertisement',
      'Cold Call',
      'Employee Referral',
      'External Referral',
      'Online Store',
      'Partner',
      'Public Relations',
      'Sales Mail Alias',
      'Seminar Partner',
      'Internal Seminar',
      'Trade Show',
      'Web Download',
      'Web Research',
      'Chat',
      'Twitter',
      'Facebook',
      'Google+',
      'Website',
      'Campaign',
      'Social Media',
      'Other',
      ''
    ]
  },
  
  leadStatus: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Lost', 'Converted', ''],
    default: 'New'
  },
  
  industry: {
    type: String,
    trim: true
  },
  
  numberOfEmployees: {
    type: Number,
    min: 0
  },
  
  annualRevenue: {
    type: Number,
    min: 0
  },
  
  rating: {
    type: String,
    enum: ['Hot', 'Warm', 'Cold', '']
  },
  
  // Communication Preferences
  emailOptOut: {
    type: Boolean,
    default: false
  },
  
  doNotCall: {
    type: Boolean,
    default: false
  },
  
  // Social Media
  skypeId: {
    type: String,
    trim: true
  },
  
  secondaryEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  twitter: {
    type: String,
    trim: true
  },
  
  linkedIn: {
    type: String,
    trim: true
  },
  
  // Address Information
  street: {
    type: String,
    trim: true
  },
  
  city: {
    type: String,
    trim: true
  },
  
  state: {
    type: String,
    trim: true
  },
  
  country: {
    type: String,
    trim: true
  },
  
  zipCode: {
    type: String,
    trim: true
  },
  
  flatHouseNo: {
    type: String,
    trim: true
  },
  
  latitude: {
    type: String,
    trim: true
  },
  
  longitude: {
    type: String,
    trim: true
  },
  
  // Description
  description: {
    type: String,
    trim: true
  },
  
  // Conversion Information
  isConverted: {
    type: Boolean,
    default: false
  },
  
  convertedDate: {
    type: Date
  },
  
  convertedAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  
  convertedContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  
  convertedOpportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity'
  },

  // Product Information (link to ProductItem)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductItem',
    required: false
  },

  // NEW - Product Details with Rich Information
  productDetails: {
    quantity: {
      type: Number,
      min: 1,
      default: 1
    },
    requirements: {
      type: String,
      trim: true
    },
    estimatedBudget: {
      type: Number,
      min: 0
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent', ''],
      default: ''
    },
    notes: {
      type: String,
      trim: true
    },
    linkedDate: {
      type: Date,
      default: Date.now
    }
  },

  // Owner and Tenant
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // 🔧 Changed to false to allow UNASSIGNED leads
  },

  // 🆕 Group Assignment
  assignedGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },

  // 🆕 Specific Members Assigned (from the group)
  assignedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // 🆕 Assignment Chain (tracks hierarchy)
  assignmentChain: [{
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'assignmentChain.assignedToModel'
    },
    assignedToModel: {
      type: String,
      enum: ['User', 'Group']
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['senior_manager', 'manager', 'team_lead', 'member', 'owner']
    }
  }],

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

// Indexes for better query performance
leadSchema.index({ tenant: 1, isActive: 1 });
leadSchema.index({ owner: 1 });
leadSchema.index({ leadStatus: 1 });
leadSchema.index({ leadSource: 1 });
leadSchema.index({ isConverted: 1 });
leadSchema.index({ email: 1, tenant: 1 });
leadSchema.index({ emailVerified: 1 });
leadSchema.index({ phoneVerified: 1 });
leadSchema.index({ product: 1 });
leadSchema.index({ firstName: 'text', lastName: 'text', company: 'text', email: 'text' });

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Pre-save middleware to set converted date
leadSchema.pre('save', function(next) {
  if (this.isModified('isConverted') && this.isConverted && !this.convertedDate) {
    this.convertedDate = new Date();
  }
  next();
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;