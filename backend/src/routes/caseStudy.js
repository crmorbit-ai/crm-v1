const express = require('express');
const router = express.Router();
const {
  getPublishedCaseStudies,
  getPublishedCaseStudyBySlug,
  getAllCaseStudies,
  getCaseStudyById,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  togglePublishStatus,
  uploadImages,
  removeImage
} = require('../controllers/caseStudyController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/case-studies/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// ════════════════════════════════════════════════════════════════
// PUBLIC ROUTES - No authentication required
// ════════════════════════════════════════════════════════════════

// Get all published case studies for landing page
router.get('/public', getPublishedCaseStudies);

// Get single published case study by slug
router.get('/public/:slug', getPublishedCaseStudyBySlug);

// ════════════════════════════════════════════════════════════════
// PROTECTED ROUTES - SAAS Admin only
// ════════════════════════════════════════════════════════════════

// Get all case studies (admin view - includes drafts)
router.get('/', protect, getAllCaseStudies);

// Get single case study by ID
router.get('/:id', protect, getCaseStudyById);

// Create new case study
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'clientLogo', maxCount: 1 },
    { name: 'pdfDocument', maxCount: 1 },
    { name: 'stakeholderPhoto', maxCount: 1 }
  ]),
  createCaseStudy
);

// Update case study
router.put(
  '/:id',
  protect,
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'clientLogo', maxCount: 1 }
  ]),
  updateCaseStudy
);

// Delete case study
router.delete('/:id', protect, deleteCaseStudy);

// Toggle publish/unpublish status
router.patch('/:id/toggle-publish', protect, togglePublishStatus);

// Upload additional images to case study
router.post('/:id/images', protect, upload.array('images', 10), uploadImages);

// Remove image from case study
router.delete('/:id/images/:imageId', protect, removeImage);

module.exports = router;
