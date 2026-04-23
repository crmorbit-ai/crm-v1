const FeatureUsageLog = require('../models/FeatureUsageLog');

// Map: route prefix → feature key (matches SubscriptionPlan.features keys)
const ROUTE_FEATURE_MAP = {
  // Core CRM
  '/api/leads':              'leadManagement',
  '/api/groups':             'leadManagement',
  '/api/contacts':           'contactManagement',
  '/api/accounts':           'contactManagement',
  '/api/opportunities':      'dealTracking',
  '/api/quotations':         'dealTracking',
  '/api/invoices':           'dealTracking',
  '/api/purchase-orders':    'dealTracking',
  '/api/rfi':                'dealTracking',
  '/api/products':           'dealTracking',
  '/api/tasks':              'taskManagement',
  // Communication
  '/api/emails':             'emailIntegration',
  '/api/meetings':           'calendarSync',
  '/api/calls':              'calendarSync',
  // Advanced
  '/api/field-definitions':  'customFields',
  '/api/templates':          'automation',
  '/api/document-templates': 'automation',
  '/api/email-templates':    'automation',
  '/api/data-center':        'advancedReports',
  // Org & Access
  '/api/org-nodes':          'crossOrgHierarchy',
  '/api/org-hierarchy':      'crossOrgHierarchy',
  '/api/role-templates':     'crossOrgHierarchy',
  '/api/activity-logs':      'advancedSecurity',
  // Platform
  '/api/monetization':       'salesMonetization',
  '/api/support-tickets':    'dedicatedSupport',
  '/api/social':             'customIntegrations',
  '/api/integrations':       'customIntegrations',
  '/api/features':           'apiAccess',
};

// fire-and-forget — never blocks the request
const logUsage = (tenantId, feature) => {
  if (!tenantId || !feature) return;
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  FeatureUsageLog.findOneAndUpdate(
    { tenant: tenantId, feature, date: today },
    { $inc: { count: 1 }, $set: { lastUsed: new Date() } },
    { upsert: true, new: true }
  ).catch(() => {}); // silent fail — never crash main request
};

// Middleware factory — call trackFeature('featureName') or use auto-detect
const trackFeature = (featureOverride) => (req, res, next) => {
  next(); // always proceed immediately
  try {
    const tenantId = req.user?.tenant;
    if (!tenantId) return;
    const feature = featureOverride || (() => {
      const url = req.originalUrl || req.url || '';
      for (const [prefix, feat] of Object.entries(ROUTE_FEATURE_MAP)) {
        if (url.startsWith(prefix)) return feat;
      }
      return null;
    })();
    if (feature) logUsage(tenantId.toString(), feature);
  } catch (_) {}
};

// Auto-detect middleware (attach globally)
// Uses res.on('finish') so req.user is fully set by auth middleware before we read it
const autoTrackFeature = (req, res, next) => {
  res.on('finish', () => {
    try {
      // Only track successful requests (2xx)
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      const tenantId = req.user?.tenant;
      if (!tenantId) return;
      const url = req.originalUrl || req.url || '';
      for (const [prefix, feat] of Object.entries(ROUTE_FEATURE_MAP)) {
        if (url.startsWith(prefix)) {
          logUsage(tenantId.toString(), feat);
          break;
        }
      }
    } catch (_) {}
  });
  next();
};

module.exports = { trackFeature, autoTrackFeature, logUsage };
