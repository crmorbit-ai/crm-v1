const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['lifetime', 'special_access'],
    default: 'lifetime',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'used', 'revoked', 'expired'],
    default: 'active'
  },
  description: {
    type: String,
    default: 'Lifetime unlimited access license'
  },
  // Who created this coupon
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Who used this coupon
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  usedAt: {
    type: Date
  },
  // Optional expiry (for special coupons)
  expiresAt: {
    type: Date
  },
  // Benefits of this coupon
  benefits: {
    unlimitedAccess: {
      type: Boolean,
      default: true
    },
    noExpiry: {
      type: Boolean,
      default: true
    },
    allFeatures: {
      type: Boolean,
      default: true
    },
    unlimitedUsers: {
      type: Boolean,
      default: true
    },
    unlimitedStorage: {
      type: Boolean,
      default: true
    }
  },
  // Notes (internal use by SAAS admin)
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for fast lookup
couponSchema.index({ code: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ createdBy: 1 });

// Method to check if coupon is valid for use
couponSchema.methods.isValidForUse = function() {
  if (!this.isActive) return { valid: false, reason: 'Coupon is deactivated' };
  if (this.status !== 'active') return { valid: false, reason: `Coupon is ${this.status}` };
  if (this.usedBy) return { valid: false, reason: 'Coupon already used' };
  if (this.expiresAt && new Date() > this.expiresAt) return { valid: false, reason: 'Coupon expired' };
  return { valid: true };
};

// Method to mark as used
couponSchema.methods.markAsUsed = function(tenantId) {
  this.status = 'used';
  this.usedBy = tenantId;
  this.usedAt = new Date();
  return this.save();
};

// Method to revoke
couponSchema.methods.revoke = function() {
  this.status = 'revoked';
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('Coupon', couponSchema);
