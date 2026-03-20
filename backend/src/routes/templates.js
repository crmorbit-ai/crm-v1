const express = require('express');
const router = express.Router();
const { getTemplates, createTemplate, updateTemplate, deleteTemplate, useTemplate } = require('../controllers/templateController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getTemplates);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);
router.patch('/:id/use', useTemplate);

module.exports = router;
