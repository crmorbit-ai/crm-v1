const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const landingPageController = require('../controllers/landingPageController');

// Public routes
router.get('/public/:tenantSlug', landingPageController.getPublicLandingPage);
router.get('/public-settings', landingPageController.getSettings); // Public endpoint for landing page display

// Protected routes - SAAS Admin only
router.get('/settings', protect, landingPageController.getSettings);
router.put('/settings', protect, landingPageController.updateSettings);
router.post('/upload', protect, landingPageController.uploadMiddleware, landingPageController.uploadMedia);
router.delete('/media/:filename', protect, landingPageController.deleteMedia);
router.patch('/toggle-publish', protect, landingPageController.togglePublish);

module.exports = router;
