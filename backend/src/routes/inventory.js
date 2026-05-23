const express = require('express');
const router = express.Router();
const inv = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Dashboard
router.get('/dashboard', inv.getDashboard);

// Stock overview
router.get('/', inv.getInventory);

// Transactions
router.get('/transactions', inv.getTransactions);

// Low stock
router.get('/low-stock', inv.getLowStock);

// Reports
router.get('/reports/summary', inv.getStockSummary);
router.get('/reports/valuation', inv.getStockValuation);
router.get('/reports/abc', inv.getABCAnalysis);
router.get('/reports/aging', inv.getStockAging);

// PO Receive
router.post('/po/:poId/receive', inv.receivePO);

// Manual adjustment
router.post('/:productId/adjust', inv.adjustStock);

// Threshold / reorder settings
router.patch('/:productId/threshold', inv.updateThreshold);

module.exports = router;
