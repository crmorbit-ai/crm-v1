const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/documentTemplateController');

// Public share link (no auth needed)
router.get('/shared/:token', ctrl.getByShareToken);

// All routes below require auth
router.use(protect);

router.get('/',                            ctrl.getAll);
router.get('/:id',                         ctrl.getOne);
router.post('/',                           ctrl.create);
router.put('/:id',                         ctrl.update);
router.delete('/:id',                      ctrl.remove);

// Download: /api/document-templates/:id/download/:format
router.get('/:id/download/:format',        ctrl.download);
router.get('/:id/download',                ctrl.download);

// Sharing
router.post('/:id/share/link',             ctrl.generateShareLink);
router.delete('/:id/share/link',           ctrl.revokeShareLink);
router.post('/:id/share/users',            ctrl.shareWithUsers);
router.delete('/:id/share/users/:userId',  ctrl.removeSharedUser);

module.exports = router;
