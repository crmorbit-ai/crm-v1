const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl    = require('../controllers/roleTemplateController');

router.use(protect);

router.get('/',                ctrl.getTemplate);
router.post('/',               ctrl.saveTemplate);
router.post('/preview-match',  ctrl.previewMatch);
router.post('/generate-tree',  ctrl.generateTree);

module.exports = router;
