const express = require('express');
const router = express.Router();
const rfiController = require('../controllers/rfiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', rfiController.createRFI);
router.get('/', rfiController.getRFIs);
router.get('/:id', rfiController.getRFI);
router.put('/:id', rfiController.updateRFI);
router.delete('/:id', rfiController.deleteRFI);

router.post('/:id/convert-to-quotation', rfiController.convertToQuotation);
router.patch('/:id/status', rfiController.updateRFIStatus);

module.exports = router;
