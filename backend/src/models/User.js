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
    required: function() {
      // Password only required for local authentication
      return this.authProvider === 'local' || !this.authProvider;
    },
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
  // Who added this SAAS_ADMIN (for tracking/audit)
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Viewing Credentials (for SAAS Admins to view sensitive tenant data)
  viewingCredentialId: {
    type: String,
    default: null
  },
  viewingCredentialPassword: {
    type: String,
    default: null
  },
  isViewingCredentialSet: {
    type: Boolean,
    default: false
  },
  viewingCredentialOTP: {
    type: String,
    default: null
  },
  viewingCredentialOTPExpire: {
    type: Date,
    default: null
  },
  // Email Verification (for signup)
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    type: String  // SHA256 hashed 6-digit OTP
  },
  emailVerificationOTPExpire: {
    type: Date  // 10 minute expiry
  },
  // Profile Completion Status
  isProfileComplete: {
    type: Boolean,
    default: false  // Forces profile completion flow
  },
  // OAuth Integration
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    sparse: true,  // Allow null but unique when present
    unique: true
  },
  googleProfilePicture: {
    type: String  // Store Google profile image URL
  },
  // Pending User State (registered but not verified)
  isPendingVerification: {
    type: Boolean,
    default: false
  },
  registrationData: {
    type: mongoose.Schema.Types.Mixed,  // Temporary storage for registration info (e.g., resellerId)
    default: null
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
  // Skip if password not modified or not set (OAuth users)
  if (!this.isModified('password') || !this.password) return next();

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