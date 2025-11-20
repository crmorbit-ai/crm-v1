const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Free', 'Basic', 'Professional', 'Enterprise']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Pricing
  price: {
    monthly: {
      type: Number,
      required: true,
      default: 0
    },
    yearly: {
      type: Number,
      default: 0
    }
  },
  
  // Trial
  trialDays: {
    type: Number,
    default: 15
  },
  
  // Limits
  limits: {
    users: {
      type: Number,
      required: true,
      default: 5
    },
    leads: {
      type: Number,
      default: 1000 // -1 for unlimited
    },
    contacts: {
      type: Number,
      default: 1000
    },
    deals: {
      type: Number,
      default: 100
    },
    storage: {
      type: Number, // in MB
      default: 1024 // 1GB
    },
    emailsPerDay: {
      type: Number,
      default: 100
    }
  },
  
  // Features
  features: {
    // Core Features
    leadManagement: {
      type: Boolean,
      default: true
    },
    contactManagement: {
      type: Boolean,
      default: true
    },
    dealTracking: {
      type: Boolean,
      default: true
    },
    taskManagement: {
      type: Boolean,
      default: true
    },
    
    // Advanced Features
    emailIntegration: {
      type: Boolean,
      default: false
    },
    calendarSync: {
      type: Boolean,
      default: false
    },
    advancedReports: {
      type: Boolean,
      default: false
    },
    customFields: {
      type: Boolean,
      default: false
    },
    automation: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    
    // Premium Features
    whiteLabeling: {
      type: Boolean,
      default: false
    },
    dedicatedSupport: {
      type: Boolean,
      default: false
    },
    customIntegrations: {
      type: Boolean,
      default: false
    },
    multiCurrency: {
      type: Boolean,
      default: false
    },
    advancedSecurity: {
      type: Boolean,
      default: false
    },
    sla: {
      type: Boolean,
      default: false
    }
  },
  
  // Support
  support: {
    type: String,
    enum: ['email', 'priority', 'dedicated', '24x7'],
    default: 'email'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  
  // Display Order
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Pre-save hook to generate slug
subscriptionPlanSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);