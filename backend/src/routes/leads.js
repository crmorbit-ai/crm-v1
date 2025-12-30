const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  bulkImportLeads,
  bulkUploadLeads,
  downloadSampleTemplate,
  getLeadStats,
  assignLeadsToGroup,
  assignLeadToUser
} = require('../controllers/leadController');
const {
  verifyEmailAddress,
  verifyPhoneNumber
} = require('../controllers/verificationController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Configure multer for file uploads
const fs = require('fs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use /tmp for Vercel serverless, uploads for local
    const uploadDir = process.env.VERCEL ? '/tmp' : 'uploads/';

    // Create directory if it doesn't exist
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `leads-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls' && ext !== '.csv') {
      return cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ════════════════════════════════════════════════════════════════
// IMPORTANT: SPECIFIC ROUTES FIRST, DYNAMIC ROUTES LAST!
// ════════════════════════════════════════════════════════════════

// All routes require authentication
router.use(protect);

// ✅ VERIFICATION ROUTES (NEW)
router.post('/verify-email', 
  requirePermission('lead_management', 'create'), 
  verifyEmailAddress
);

router.post('/verify-phone', 
  requirePermission('lead_management', 'create'), 
  verifyPhoneNumber
);

// Bulk upload routes (BEFORE /:id routes)
router.post('/bulk-upload', 
  requirePermission('lead_management', 'import'), 
  upload.single('file'), 
  bulkUploadLeads
);

router.get('/download-template', 
  requirePermission('lead_management', 'import'), 
  downloadSampleTemplate
);

// Bulk import route (JSON)
router.post('/bulk-import', 
  requirePermission('lead_management', 'import'), 
  bulkImportLeads
);

// Stats route (BEFORE /:id route)
router.get('/stats', 
  requirePermission('lead_management', 'read'), 
  getLeadStats
);

// Convert lead route (BEFORE /:id route)
router.post('/:id/convert',
  requirePermission('lead_management', 'convert'),
  convertLead
);

// 🆕 Group assignment routes
router.post('/assign-to-group',
  requirePermission('lead_management', 'update'),
  assignLeadsToGroup
);

router.post('/:id/assign',
  requirePermission('lead_management', 'update'),
  assignLeadToUser
);

// CRUD routes
router.route('/')
  .get(requirePermission('lead_management', 'read'), getLeads)
  .post(requirePermission('lead_management', 'create'), createLead);

// Dynamic /:id routes (LAST)
router.route('/:id')
  .get(requirePermission('lead_management', 'read'), getLead)
  .put(requirePermission('lead_management', 'update'), updateLead)
  .delete(requirePermission('lead_management', 'delete'), deleteLead);

module.exports = router;