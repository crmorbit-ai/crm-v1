const mongoose = require('mongoose');

// 🔥 FULLY DYNAMIC SCHEMA - All fields from DataCenter can be preserved
const leadSchema = new mongoose.Schema({
  // 🔒 System Fields Only (Required for CRM workflow and multi-tenant isolation)

  // Status and Workflow
  leadStatus: {
    type: String,
    default: 'New'
  },

  source: {
    type: String,
    default: 'Website'
  },

  rating: {
    type: String,
    default: 'Warm'
  },

  // Verification Fields (system managed)
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

  // Communication Preferences
  emailOptOut: {
    type: Boolean,
    default: false
  },

  doNotCall: {
    type: Boolean,
    default: false
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

  // Product Information
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductItem',
    required: false
  },

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

  // Owner and Assignment
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  assignedGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },

  assignedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

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

  // Tenant Isolation
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

  // DataCenter Reference (to track where this lead came from)
  dataCenterCandidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataCenterCandidate'
  }

  // ⚡ ALL OTHER FIELDS ARE DYNAMIC - Accepts any field from DataCenter or manual entry
  // No predefined schema - any field can be stored directly at root level

}, {
  timestamps: true,
  strict: false  // 🔥 This allows any field to be saved to the document
});

// Basic indexes for system fields and common query patterns
leadSchema.index({ tenant: 1, isActive: 1 });
leadSchema.index({ owner: 1 });
leadSchema.index({ leadStatus: 1 });
leadSchema.index({ isConverted: 1 });
leadSchema.index({ emailVerified: 1 });
leadSchema.index({ phoneVerified: 1 });
leadSchema.index({ product: 1 });
leadSchema.index({ tenant: 1, createdAt: -1 });

// 🔥 Dynamic field indexes - created automatically by MongoDB when querying

// Pre-save middleware to set converted date
leadSchema.pre('save', function(next) {
  if (this.isModified('isConverted') && this.isConverted && !this.convertedDate) {
    this.convertedDate = new Date();
  }
  next();
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;