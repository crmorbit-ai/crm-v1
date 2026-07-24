const mongoose = require('mongoose');

const landingPageSettingsSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      unique: true
    },

    // Home Page
    homePage: {
      topBanner: {
        image: String,
        heading: String,
        subheading: String
      },
      statsSection: {
        // Multiple images for carousel banner (full-width behind stats)
        images: [String], // Array of image URLs
        autoRotate: { type: Boolean, default: true },
        interval: { type: Number, default: 2000 } // milliseconds
      },
      connectSection: {
        // Video or image for "We Connect" section
        type: { type: String, enum: ['image', 'video'], default: 'video' },
        url: String, // Image or video URL
        heading: String,
        content: String
      },
      section1: {
        image: String,
        heading: String,
        content: String
      },
      section2: {
        image: String,
        heading: String,
        content: String
      },
      section3: {
        image: String,
        heading: String,
        content: String
      }
    },

    // About Page
    aboutPage: {
      banner: {
        image: String,
        heading: String,
        subheading: String
      },
      section1: {
        image: String,
        heading: String,
        content: String
      },
      section2: {
        image: String,
        heading: String,
        content: String
      }
    },

    // Products Page
    productsPage: {
      banner: {
        image: String,
        heading: String,
        subheading: String
      },
      section1: {
        image: String,
        heading: String,
        content: String
      },
      section2: {
        image: String,
        heading: String,
        content: String
      }
    },

    // Features Page
    featuresPage: {
      banner: {
        image: String,
        heading: String,
        subheading: String
      },
      section1: {
        image: String,
        heading: String,
        content: String
      },
      section2: {
        image: String,
        heading: String,
        content: String
      }
    },

    // Contact Page
    contactPage: {
      banner: {
        image: String,
        heading: String,
        subheading: String
      },
      section1: {
        image: String,
        heading: String,
        content: String
      }
    },


    isPublished: {
      type: Boolean,
      default: false
    },

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LandingPageSettings', landingPageSettingsSchema);
