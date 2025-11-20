const express = require('express');
const router = express.Router();
const {
  getBillings,
  getBilling,
  createBilling,
  updateBilling,
  getBillingStats
} = require('../controllers/billingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getBillings);
router.get('/stats/overview', getBillingStats);
router.get('/:id', getBilling);
router.post('/', createBilling);
router.put('/:id', updateBilling);

module.exports = router;
