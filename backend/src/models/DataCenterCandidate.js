const mongoose = require('mongoose');

const dataCenterCandidateSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  
  lastName: {
    type: String,
    required: false,
    trim: true
  },
  
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  phone: {
    type: String,
    required: false,
    trim: true
  },
  
  alternatePhone: {
    type: String,
    trim: true
  },
  
  // Professional Information
  currentCompany: {
    type: String,
    trim: true
  },
  
  currentDesignation: {
    type: String,
    trim: true
  },
  
  totalExperience: {
    type: Number, // in years
    required: false,
    min: 0
  },
  
  relevantExperience: {
    type: Number, // in years
    min: 0
  },
  
  // Skills and Qualifications
  skills: [{
    type: String,
    trim: true
  }],
  
  primarySkills: [{
    type: String,
    trim: true
  }],
  
  secondarySkills: [{
    type: String,
    trim: true
  }],
  
  certifications: [{
    type: String,
    trim: true
  }],
  
  education: {
    type: String,
    trim: true
  },
  
  highestQualification: {
    type: String,
    trim: true
  },
  
  // Location Information
  currentLocation: {
    type: String,
    required: false,
    trim: true
  },
  
  preferredLocations: [{
    type: String,
    trim: true
  }],
  
  willingToRelocate: {
    type: Boolean,
    default: false
  },
  
  // Salary Information
  currentCTC: {
    type: Number, // in INR
    min: 0
  },
  
  expectedCTC: {
    type: Number, // in INR
    min: 0
  },
  
  noticePeriod: {
    type: Number, // in days
    default: 30
  },
  
  // Availability
  availability: {
    type: String,
    enum: ['Immediate', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'Serving Notice'],
    default: 'Immediate'
  },
  
  lastWorkingDay: {
    type: Date
  },
  
  // Resume and Links
  resumeUrl: {
    type: String,
    trim: true
  },
  
  linkedInUrl: {
    type: String,
    trim: true
  },
  
  githubUrl: {
    type: String,
    trim: true
  },
  
  portfolioUrl: {
    type: String,
    trim: true
  },
  
  // Job Portal Information
  sourceWebsite: {
    type: String,
    enum: ['Naukri', 'LinkedIn', 'Monster', 'Indeed', 'TimesJobs', 'Shine', 'Glassdoor', 'AngelList', 'Manual Upload', 'Other'],
    required: true
  },
  
  profileId: {
    type: String, // External profile ID from job portal
    trim: true
  },
  
  lastActiveOn: {
    type: Date,
    required: true
  },
  
  profileLastUpdated: {
    type: Date
  },
  
  // Activity Tracking
  profileViews: {
    type: Number,
    default: 0
  },
  
  searchAppearances: {
    type: Number,
    default: 0
  },
  
  // Job Preferences
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'],
    default: 'Full-time'
  },
  
  workMode: {
    type: String,
    enum: ['Work from Office', 'Work from Home', 'Hybrid', 'Flexible'],
    default: 'Flexible'
  },
  
  industry: [{
    type: String,
    trim: true
  }],
  
  functionalArea: [{
    type: String,
    trim: true
  }],
  
  // Status and Tracking
  status: {
    type: String,
    enum: ['Available', 'Moved to Leads', 'Contacted', 'Not Interested', 'Invalid'],
    default: 'Available'
  },
  
  movedToLeadsAt: {
    type: Date
  },
  
  movedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  movedToTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  
  // Additional Information
  summary: {
    type: String,
    trim: true
  },
  
  keySkillsHighlight: {
    type: String,
    trim: true
  },
  
  languagesKnown: [{
    type: String,
    trim: true
  }],
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  notes: {
    type: String,
    trim: true
  },

  // Custom Fields (Dynamic fields defined via Field Builder)
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Import Information
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  importedAt: {
    type: Date,
    default: Date.now
  },

  dataSource: {
    type: String,
    trim: true
  },

  // 🔒 Tenant Isolation (NEW)
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
dataCenterCandidateSchema.index({ email: 1 });
dataCenterCandidateSchema.index({ phone: 1 });
dataCenterCandidateSchema.index({ status: 1 });
dataCenterCandidateSchema.index({ totalExperience: 1 });
dataCenterCandidateSchema.index({ currentLocation: 1 });
dataCenterCandidateSchema.index({ lastActiveOn: -1 });
dataCenterCandidateSchema.index({ skills: 1 });
dataCenterCandidateSchema.index({ primarySkills: 1 });
dataCenterCandidateSchema.index({ availability: 1 });
dataCenterCandidateSchema.index({ sourceWebsite: 1 });
dataCenterCandidateSchema.index({ isActive: 1 });
dataCenterCandidateSchema.index({ firstName: 'text', lastName: 'text', email: 'text', skills: 'text' });

// Virtual for full name
dataCenterCandidateSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for experience range
dataCenterCandidateSchema.virtual('experienceRange').get(function() {
  const exp = this.totalExperience;
  if (exp < 1) return '0-1 years';
  if (exp < 3) return '1-3 years';
  if (exp < 5) return '3-5 years';
  if (exp < 7) return '5-7 years';
  if (exp < 10) return '7-10 years';
  return '10+ years';
});

const DataCenterCandidate = mongoose.model('DataCenterCandidate', dataCenterCandidateSchema);

module.exports = DataCenterCandidate;