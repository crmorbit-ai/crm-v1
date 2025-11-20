const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  // User type: 'SAAS_OWNER', 'SAAS_ADMIN', 'TENANT_ADMIN', 'TENANT_MANAGER', 'TENANT_USER'
  userType: {
    type: String,
    enum: ['SAAS_OWNER', 'SAAS_ADMIN', 'TENANT_ADMIN', 'TENANT_MANAGER', 'TENANT_USER'],
    required: true
  },
  // Reference to tenant (null for SAAS_OWNER and SAAS_ADMIN)
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  // Roles assigned to this user
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  // Groups this user belongs to
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  // Custom permissions (override role permissions)
  customPermissions: [{
    feature: {
      type: String,
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'manage']
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profilePicture: {
    type: String
  },
  phone: {
    type: String
  },
  // For SAAS_OWNER and SAAS_ADMIN: their department/role in SAAS company
  saasRole: {
    type: String
  },
  // Password reset fields - OTP based
  resetPasswordOTP: {
    type: String
  },
  resetPasswordOTPExpire: {
    type: Date
  },
  resetPasswordOTPVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);