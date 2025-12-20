const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: false,
    trim: true
  },
  
  lastName: {
    type: String,
    required: false,
    trim: true
  },
  
  salutation: {
    type: String,
    enum: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', '']
  },
  
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  
  phone: {
    type: String,
    trim: true
  },
  
  mobilePhone: {
    type: String,
    trim: true
  },
  
  homePhone: {
    type: String,
    trim: true
  },
  
  otherPhone: {
    type: String,
    trim: true
  },
  
  fax: {
    type: String,
    trim: true
  },
  
  // Professional Information
  jobTitle: {
    type: String,
    trim: true
  },
  
  department: {
    type: String,
    enum: [
      'Executive Management',
      'Sales',
      'Marketing',
      'Finance',
      'Operations',
      'Human Resources',
      'IT',
      'Customer Service',
      'Legal',
      'Research & Development',
      'Other'
    ]
  },
  
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  
  // Address Information
  mailingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  otherAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Additional Information
  leadSource: {
    type: String,
    enum: [
      'Advertisement',
      'Cold Call',
      'Employee Referral',
      'External Referral',
      'Partner',
      'Public Relations',
      'Trade Show',
      'Web Research',
      'Website',
      'Other'
    ]
  },
  
  birthdate: {
    type: Date
  },
  
  assistant: {
    type: String,
    trim: true
  },
  
  assistantPhone: {
    type: String,
    trim: true
  },
  
  // Social Media
  skypeId: {
    type: String,
    trim: true
  },
  
  twitter: {
    type: String,
    trim: true
  },
  
  linkedIn: {
    type: String,
    trim: true
  },
  
  secondaryEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Description
  description: {
    type: String,
    trim: true
  },
  
  // Email Preferences
  emailOptOut: {
    type: Boolean,
    default: false
  },
  
  doNotCall: {
    type: Boolean,
    default: false
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
contactSchema.index({ tenant: 1, isActive: 1 });
contactSchema.index({ account: 1 });
contactSchema.index({ owner: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Virtual for full name
contactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;