const express = require('express');
const router  = express.Router();
const { protect, requireSaasAccess } = require('../middleware/auth');
const ctrl    = require('../controllers/monetizationController');

/* ── Tenant Routes ── */
router.get ('/tenant/check-access', protect, ctrl.tenantCheckAccess);
router.get ('/tenant/overview',     protect, ctrl.tenantOverview);
router.post('/tenant/cancel',       protect, ctrl.cancelSubscription);

/* ── SAAS Admin Routes ── */
router.use(protect, requireSaasAccess);

// Feature toggle
router.get ('/feature-status',         ctrl.getFeatureStatus);
router.put ('/feature-toggle/:planId', ctrl.toggleFeature);

// Analytics
router.get ('/overview',               ctrl.getOverview);
router.get ('/revenue-analytics',      ctrl.getRevenueAnalytics);
router.get ('/churn-management',       ctrl.getChurnManagement);
router.get ('/upsell-crosssell',       ctrl.getUpsellCrosssell);
router.get ('/feature-analytics',      ctrl.getFeatureAnalytics);
router.get ('/subscription-metrics',   ctrl.getSubscriptionMetrics);
router.get ('/health-scores',          ctrl.getHealthScores);
router.get ('/plan-history',           ctrl.getPlanHistory);

// Actions
router.post('/cancel',                 ctrl.cancelSubscription);
router.post('/change-plan',            ctrl.changePlan);
router.get ('/saas-users',             ctrl.getSaasUsers);
router.put ('/assign-manager/:tenantId', ctrl.assignManager);

module.exports = router;
