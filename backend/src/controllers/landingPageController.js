const LandingPageSettings = require('../models/LandingPageSettings');
const Tenant = require('../models/Tenant');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const mkErr = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/landing-pages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('📤 Upload attempt:', { name: file.originalname, mimetype: file.mimetype });

  // Just accept all images and videos - be lenient
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');

  if (isImage || isVideo) {
    console.log('✅ File accepted');
    cb(null, true);
  } else {
    console.log('❌ File rejected - not image/video');
    cb(new Error('Only images and videos are allowed'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (for videos and high-quality images)
    fieldSize: 50 * 1024 * 1024
  },
  fileFilter
});

console.log('✅ Multer configured with 50MB limit');

/* ══════════════════════════════════════════════════════════
   GET LANDING PAGE SETTINGS
══════════════════════════════════════════════════════════ */
exports.getSettings = async (req, res, next) => {
  try {
    // For public endpoint: req.user will be undefined
    // For protected endpoint: req.user exists
    let settings;

    if (req.user) {
      // Protected route - get by tenant
      const tenantId = req.user.tenantId || req.user._id;
      settings = await LandingPageSettings.findOne({ tenant: tenantId });

      if (!settings) {
        // Create default settings for logged-in user
        settings = await LandingPageSettings.create({
          tenant: tenantId,
          homePage: {
            topBanner: { image: '', heading: '', subheading: '' },
            section1: { image: '', heading: '', content: '' },
            section2: { image: '', heading: '', content: '' },
            section3: { image: '', heading: '', content: '' }
          }
        });
      }
    } else {
      // Public route - get first published settings (or any settings for demo)
      settings = await LandingPageSettings.findOne().sort({ updatedAt: -1 });

      if (!settings) {
        // Return empty structure if nothing exists
        return res.json({
          success: true,
          data: {
            homePage: {
              topBanner: { image: '', heading: '', subheading: '' },
              section1: { image: '', heading: '', content: '' },
              section2: { image: '', heading: '', content: '' },
              section3: { image: '', heading: '', content: '' }
            }
          }
        });
      }
    }

    res.json({ success: true, data: settings });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE LANDING PAGE SETTINGS
══════════════════════════════════════════════════════════ */
exports.updateSettings = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || req.user._id;

    let settings = await LandingPageSettings.findOne({ tenant: tenantId });

    if (!settings) {
      settings = await LandingPageSettings.create({
        tenant: tenantId,
        ...req.body,
        lastModifiedBy: req.user._id
      });
    } else {
      Object.assign(settings, req.body);
      settings.lastModifiedBy = req.user._id;
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Landing page settings updated successfully',
      data: settings
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   UPLOAD IMAGE/VIDEO
══════════════════════════════════════════════════════════ */
exports.uploadMedia = async (req, res, next) => {
  try {
    console.log('📥 Upload handler called');
    console.log('📦 File received:', req.file ? 'YES' : 'NO');

    if (!req.file) {
      throw mkErr('No file uploaded', 400);
    }

    console.log('📦 File details:', {
      name: req.file.originalname,
      size: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
      mimetype: req.file.mimetype
    });

    const fileUrl = `/uploads/landing-pages/${req.file.filename}`;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        url: fileUrl,
        type: req.file.mimetype.startsWith('video') ? 'video' : 'image'
      }
    });
  } catch (e) {
    console.log('❌ Upload error:', e.message);
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   DELETE IMAGE/VIDEO
══════════════════════════════════════════════════════════ */
exports.deleteMedia = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/landing-pages', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      throw mkErr('File not found', 404);
    }
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   PUBLISH/UNPUBLISH LANDING PAGE
══════════════════════════════════════════════════════════ */
exports.togglePublish = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || req.user._id;

    const settings = await LandingPageSettings.findOne({ tenant: tenantId });
    if (!settings) {
      throw mkErr('Landing page settings not found', 404);
    }

    settings.isPublished = !settings.isPublished;
    settings.lastModifiedBy = req.user._id;
    await settings.save();

    res.json({
      success: true,
      message: `Landing page ${settings.isPublished ? 'published' : 'unpublished'} successfully`,
      data: settings
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   GET PUBLIC LANDING PAGE (for visitors)
══════════════════════════════════════════════════════════ */
exports.getPublicLandingPage = async (req, res, next) => {
  try {
    const { tenantSlug } = req.params;

    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) {
      throw mkErr('Tenant not found', 404);
    }

    const settings = await LandingPageSettings.findOne({
      tenant: tenant._id,
      isPublished: true
    });

    if (!settings) {
      throw mkErr('Landing page not published', 404);
    }

    res.json({ success: true, data: settings });
  } catch (e) {
    next(e);
  }
};

exports.uploadMiddleware = upload.single('file');
