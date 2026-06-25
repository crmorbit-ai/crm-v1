const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactStats,
  bulkUploadContacts,
  downloadContactTemplate
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.VERCEL ? '/tmp' : 'uploads/';
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
    cb(null, `contacts-${Date.now()}${path.extname(file.originalname)}`);
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

// All routes require authentication
router.use(protect);

// Specific routes first (before dynamic /:id route)
router.get('/stats', requirePermission('contact_management', 'read'), getContactStats);
router.get('/download-template', requirePermission('contact_management', 'read'), downloadContactTemplate);
router.post('/bulk-upload', requirePermission('contact_management', 'create'), upload.single('file'), bulkUploadContacts);

// CRUD routes
router.route('/')
  .get(requirePermission('contact_management', 'read'), getContacts)
  .post(requirePermission('contact_management', 'create'), createContact);

router.route('/:id')
  .get(requirePermission('contact_management', 'read'), getContact)
  .put(requirePermission('contact_management', 'update'), updateContact)
  .delete(requirePermission('contact_management', 'delete'), deleteContact);

module.exports = router;
