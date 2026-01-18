const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  // Unique Organization ID (UFS001, UFS002, etc.)
  organizationId: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },

  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },

  // Contact Information
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  
  // Business Details
  businessType: {
    type: String,
    enum: ['B2B', 'B2C', 'B2B2C', 'Other'],
    default: 'B2B'
  },
  industry: {
    type: String,
    trim: true
  },
  
  // ============================================
  // 💰 SUBSCRIPTION DETAILS - COMPLETE
  // ============================================
  subscription: {
    // Current Plan
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true
    },
    planName: {
      type: String,
      enum: ['Free', 'Basic', 'Professional', 'Enterprise'],
      default: 'Free'
    },
    
    // Status
    status: {
      type: String,
      enum: ['trial', 'active', 'expired', 'suspended', 'cancelled'],
      default: 'trial'
    },
    
    // Trial
    isTrialActive: {
      type: Boolean,
      default: true
    },
    trialStartDate: {
      type: Date,
      default: Date.now
    },
    trialEndDate: {
      type: Date,
      default: function() {
        const date = new Date();
        date.setDate(date.getDate() + 15); // 15 days trial
        return date;
      }
    },
    
    // Subscription Dates
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    renewalDate: {
      type: Date
    },
    
    // Billing
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    
    // Payment
    lastPaymentDate: {
      type: Date
    },
    lastPaymentAmount: {
      type: Number,
      default: 0
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    
    // Auto-renewal
    autoRenew: {
      type: Boolean,
      default: true
    },
    
    // Cancellation
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String
    }
  },
  
  // Usage Tracking
  usage: {
    users: {
      type: Number,
      default: 1 // Admin user
    },
    leads: {
      type: Number,
      default: 0
    },
    contacts: {
      type: Number,
      default: 0
    },
    deals: {
      type: Number,
      default: 0
    },
    storage: {
      type: Number, // in MB
      default: 0
    },
    emailsSentToday: {
      type: Number,
      default: 0
    },
    lastEmailResetDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // ============================================
  // 🚀 RESELLER INTEGRATION
  // ============================================
  reseller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reseller',
    default: null
  },
  commissionRate: {
    type: Number,
    default: 0
  },
  totalCommissionPaid: {
    type: Number,
    default: 0
  },
  monthlySubscriptionAmount: {
    type: Number,
    default: 0
  },
  
  // ============================================
  // LEGACY FIELDS (for backward compatibility)
  // ============================================
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'professional', 'enterprise'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['trial', 'active', 'suspended', 'cancelled'],
    default: 'trial'
  },
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionEndDate: Date,
  maxUsers: {
    type: Number,
    default: 5
  },
  maxStorage: {
    type: Number,
    default: 1024
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: {
    type: String
  },
  
  // Branding
  logo: String,
  primaryColor: String,
  
  // Settings
  settings: {
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    currency: {
      type: String,
      default: 'INR'
    }
  }
}, {
  timestamps: true
});

// ============================================
// METHODS
// ============================================

// Check if trial is expired
tenantSchema.methods.isTrialExpired = function() {
  if (!this.subscription.isTrialActive) return false;
  return new Date() > this.subscription.trialEndDate;
};

// Check if subscription is active
tenantSchema.methods.hasActiveSubscription = function() {
  if (this.subscription.isTrialActive && !this.isTrialExpired()) {
    return true;
  }
  return this.subscription.status === 'active' && 
         (!this.subscription.endDate || new Date() < this.subscription.endDate);
};

// Check if feature is available
tenantSchema.methods.hasFeature = async function(featureName) {
  await this.populate('subscription.plan');
  return this.subscription.plan.features[featureName] === true;
};

// Check if limit is reached
tenantSchema.methods.hasReachedLimit = async function(limitType) {
  await this.populate('subscription.plan');
  const limit = this.subscription.plan.limits[limitType];
  if (limit === -1) return false; // Unlimited
  return this.usage[limitType] >= limit;
};

// Get days remaining in trial
tenantSchema.methods.getTrialDaysRemaining = function() {
  if (!this.subscription.isTrialActive) return 0;
  const now = new Date();
  const diff = this.subscription.trialEndDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ============================================
// PRE-SAVE HOOK: Auto-generate Organization ID
// ============================================
tenantSchema.pre('save', async function(next) {
  // Only generate if organizationId doesn't exist
  if (!this.organizationId && this.isNew) {
    try {
      // Find the highest organizationId
      const Tenant = this.constructor;
      const lastTenant = await Tenant.findOne({
        organizationId: { $exists: true, $ne: null }
      })
        .sort({ organizationId: -1 })
        .select('organizationId')
        .lean();

      let nextNumber = 1;
      if (lastTenant && lastTenant.organizationId) {
        // Extract number from format like UFS001
        const match = lastTenant.organizationId.match(/UFS(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      // Generate new organizationId with padding (UFS001, UFS002, etc.)
      this.organizationId = `UFS${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating organizationId:', error);
      // Continue without organizationId (it's not required)
    }
  }
  next();
});

// ============================================
// INDEXES
// ============================================
// slug index removed - already created by unique: true
tenantSchema.index({ isActive: 1 });
tenantSchema.index({ 'subscription.status': 1 });
tenantSchema.index({ 'subscription.endDate': 1 });
tenantSchema.index({ reseller: 1 });
tenantSchema.index({ organizationId: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);