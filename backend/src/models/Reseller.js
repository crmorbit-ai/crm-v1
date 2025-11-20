const mongoose = require('mongoose');

const resellerSchema = new mongoose.Schema({
  // Basic Information
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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  
  // Business Information
  companyName: {
    type: String,
    required: true
  },
  occupation: {
    type: String,
    required: true
  },
  website: {
    type: String
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Why want to become reseller
  reason: {
    type: String,
    required: true
  },
  
  // Unique Reseller Code (Optional)
  code: {
    type: String,
    sparse: true, // Allow null values without unique constraint
    index: true
  },
  
  // Commission
  commissionRate: {
    type: Number,
    default: 10 // 10%
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  // Onboarded Tenants
  onboardedTenants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  }],
  
  // Total Commission
  totalCommission: {
    type: Number,
    default: 0
  },
  
  // Payment Details
  paymentDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String
  },
  
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  
  // Login
  lastLogin: {
    type: Date
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before save
resellerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
resellerSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Reseller', resellerSchema);