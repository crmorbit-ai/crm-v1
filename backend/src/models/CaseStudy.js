const mongoose = require('mongoose');

const caseStudySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 300
  },
  executiveSummary: {
    type: String,
    maxlength: 500
  },

  // Content
  content: {
    type: String,
    required: true
  },

  // Client Details
  clientName: {
    type: String,
    required: true
  },
  clientLogo: {
    url: String,
    public_id: String
  },
  industry: {
    type: String,
    required: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+', 'Enterprise'],
  },
  location: {
    country: String,
    city: String,
    region: String
  },
  website: String,

  // Project Details
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years']
    },
    displayText: String // e.g., "6 months", "2 years"
  },
  projectStartDate: Date,
  projectEndDate: Date,

  // Stakeholder
  stakeholder: {
    name: String,
    designation: String,
    photo: {
      url: String,
      public_id: String
    }
  },

  // Testimonial
  testimonial: {
    quote: String,
    author: String,
    authorTitle: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // Media
  featuredImage: {
    url: String,
    public_id: String
  },
  images: [{
    url: String,
    public_id: String,
    caption: String
  }],
  videos: [{
    url: String,
    public_id: String,
    thumbnail: String,
    caption: String,
    embedCode: String, // YouTube/Vimeo embed
    type: {
      type: String,
      enum: ['youtube', 'vimeo', 'custom', 'upload']
    }
  }],

  // PDF Download
  pdfDocument: {
    url: String,
    public_id: String,
    filename: String
  },

  // Results & Metrics
  results: [{
    metric: String,
    value: String,
    description: String,
    icon: String, // emoji or icon name
    type: {
      type: String,
      enum: ['percentage', 'currency', 'number', 'time', 'custom']
    }
  }],

  // Before & After Comparison
  beforeAfter: {
    before: [{
      metric: String,
      value: String
    }],
    after: [{
      metric: String,
      value: String
    }]
  },

  // ROI & Financial Impact
  roi: {
    percentage: Number,
    description: String,
    timeframe: String // e.g., "within 6 months"
  },
  financialImpact: {
    costSavings: String,
    revenueIncrease: String,
    timeReduction: String
  },

  // Implementation Timeline
  timeline: [{
    phase: String,
    description: String,
    duration: String,
    milestone: String,
    date: Date
  }],

  // Products/Features Used
  productsUsed: [{
    name: String,
    description: String,
    icon: String
  }],

  // Categorization
  tags: [String],
  category: {
    type: String,
    enum: ['Sales', 'Marketing', 'Support', 'Operations', 'Technology', 'Other'],
    default: 'Other'
  },

  // Challenge & Solution
  challenge: String,
  solution: String,

  // SEO
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],

  // Publishing
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  scheduledPublishDate: Date, // Future date for auto-publish

  // Display Order
  displayOrder: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // Analytics
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },

  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate slug from title before saving
caseStudySchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Set published date when publishing
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Indexes
caseStudySchema.index({ slug: 1 });
caseStudySchema.index({ isPublished: 1, displayOrder: -1 });
caseStudySchema.index({ category: 1, isPublished: 1 });
caseStudySchema.index({ tags: 1 });

module.exports = mongoose.model('CaseStudy', caseStudySchema);
