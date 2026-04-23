const Subscription     = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Tenant           = require('../models/Tenant');
const Lead             = require('../models/Lead');
const Opportunity      = require('../models/Opportunity');
const Contact          = require('../models/Contact');
const User             = require('../models/User');
const ActivityLog      = require('../models/ActivityLog');
const FeatureUsageLog  = require('../models/FeatureUsageLog');
const PlanHistory      = require('../models/PlanHistory');

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const last12Months = () => {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      year: d.getFullYear(), month: d.getMonth() + 1,
      label: d.toLocaleString('en', { month: 'short' }) + " '" + String(d.getFullYear()).slice(2),
    });
  }
  return months;
};

const PLAN_ORDER = { Free: 0, Basic: 1, Professional: 2, Enterprise: 3 };

const getTenantMonthlyAmount = (t, planMap) => {
  const sub = t.subscription;
  const planName = (sub?.planName || '').toLowerCase();
  const amount = sub?.amount > 0 ? sub.amount : (planMap[planName] || 0);
  return sub?.billingCycle === 'yearly' ? amount / 12 : amount;
};

const getPlanPriceMap = async () => {
  const plans = await SubscriptionPlan.find({}, 'name price');
  const map = {};
  plans.forEach(p => { map[p.name.toLowerCase()] = p.price?.monthly || 0; });
  return map;
};

const FEATURE_LABELS = {
  leadManagement:     'Lead Management',
  contactManagement:  'Contact Management',
  dealTracking:       'Deal Tracking',
  taskManagement:     'Task Management',
  emailIntegration:   'Email Integration',
  calendarSync:       'Calendar & Meetings',
  advancedReports:    'Advanced Reports',
  customFields:       'Custom Fields',
  automation:         'Automation & Templates',
  apiAccess:          'API Access',
  crossOrgHierarchy:  'Org Hierarchy',
  salesMonetization:  'Sales Monetization',
  dedicatedSupport:   'Dedicated Support',
  customIntegrations: 'Social Media & Integrations',
  advancedSecurity:   'Advanced Security & Audit',
};
const featureLabel = k => FEATURE_LABELS[k] || k;

/* ═══════════════════════════════════════════════════
   1. OVERVIEW — real counts from DB
═══════════════════════════════════════════════════ */
exports.getOverview = async (req, res) => {
  try {
    const [allTenants, planMap] = await Promise.all([
      Tenant.find({}).select('subscription createdAt isActive organizationName'),
      getPlanPriceMap(),
    ]);

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const prevMonth = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const active    = allTenants.filter(t => t.subscription?.status === 'active');
    const trials    = allTenants.filter(t => t.subscription?.status === 'trial');
    // cancelled = tenants who ever cancelled (have cancelledAt set), regardless of current status
    const cancelled = allTenants.filter(t => !!t.subscription?.cancelledAt);
    const expired   = allTenants.filter(t => t.subscription?.status === 'expired');

    const mrr = active.reduce((sum, t) => sum + getTenantMonthlyAmount(t, planMap), 0);

    // Previous month MRR — active tenants whose subscription started before last 30 days
    const prevActive = allTenants.filter(t =>
      t.subscription?.status === 'active' && new Date(t.subscription?.startDate) < prevMonth
    );
    const prevMrr = prevActive.reduce((sum, t) => sum + getTenantMonthlyAmount(t, planMap), 0);
    const mrrGrowth = prevMrr > 0 ? Math.round(((mrr - prevMrr) / prevMrr) * 100) : 0;

    // Churn rate = cancelled in last 30 days / total active at start of period
    const recentChurn = allTenants.filter(t => {
      const ca = t.subscription?.cancelledAt;
      return ca && new Date(ca) >= thirtyDaysAgo;
    }).length;
    const churnRate = (active.length + recentChurn) > 0
      ? Math.round((recentChurn / (active.length + recentChurn)) * 100)
      : 0;

    // New this month
    const newThisMonth = allTenants.filter(t => new Date(t.createdAt) >= thirtyDaysAgo).length;

    // Plan breakdown
    const planBreakdown = {};
    allTenants.forEach(t => {
      const p = t.subscription?.planName || 'Free';
      planBreakdown[p] = (planBreakdown[p] || 0) + 1;
    });

    res.json({
      success: true, data: {
        mrr: Math.round(mrr), arr: Math.round(mrr * 12), mrrGrowth,
        activeTenants: active.length, trialTenants: trials.length,
        cancelledTenants: cancelled.length, expiredTenants: expired.length,
        totalTenants: allTenants.length, churnRate, newThisMonth, planBreakdown,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   2. REVENUE ANALYTICS — 12-month real data
═══════════════════════════════════════════════════ */
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const [allTenants, planMap] = await Promise.all([
      Tenant.find({}).select('subscription createdAt organizationName'),
      getPlanPriceMap(),
    ]);

    const months = last12Months();

    const revenueChart = months.map(m => {
      const mStart = new Date(m.year, m.month - 1, 1);
      const mEnd   = new Date(m.year, m.month, 0, 23, 59, 59);
      // Active tenants that month = started before mEnd and (no endDate OR endDate after mStart)
      const activeThatMonth = allTenants.filter(t => {
        const sub = t.subscription;
        if (!sub) return false;
        const started = new Date(sub.startDate || t.createdAt);
        const ended   = sub.cancelledAt ? new Date(sub.cancelledAt) : null;
        return started <= mEnd && (!ended || ended >= mStart) && sub.status !== 'trial';
      });
      const revenue = activeThatMonth.reduce((sum, t) => sum + getTenantMonthlyAmount(t, planMap), 0);
      return { label: m.label, revenue: Math.round(revenue), tenants: activeThatMonth.length };
    });

    // Plan-wise revenue
    const planRevenue = {};
    allTenants.filter(t => t.subscription?.status === 'active').forEach(t => {
      const p = t.subscription?.planName || 'Free';
      planRevenue[p] = (planRevenue[p] || 0) + getTenantMonthlyAmount(t, planMap);
    });

    // Top revenue tenants
    const topTenants = allTenants
      .filter(t => t.subscription?.status === 'active')
      .map(t => ({
        id: t._id, name: t.organizationName,
        plan: t.subscription?.planName || 'Free',
        mrr: Math.round(getTenantMonthlyAmount(t, planMap)),
        since: t.subscription?.startDate || t.createdAt,
      }))
      .sort((a, b) => b.mrr - a.mrr)
      .slice(0, 10);

    res.json({
      success: true, data: { revenueChart, planRevenue, topTenants },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   3. CHURN MANAGEMENT — real cancellation data
═══════════════════════════════════════════════════ */
exports.getChurnManagement = async (req, res) => {
  try {
    const [allTenants, planMap] = await Promise.all([
      Tenant.find({}).select('subscription createdAt organizationName isActive'),
      getPlanPriceMap(),
    ]);
    const now            = new Date();
    const ninetyDaysAgo  = new Date(now - 90  * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo  = new Date(now - 30  * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo= new Date(now - 14  * 24 * 60 * 60 * 1000);
    const thirtyDaysLater= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const tenantIds = allTenants.map(t => t._id);

    // Real activity from ActivityLog — last activity + count in last 30 days per tenant
    const activityData = await ActivityLog.aggregate([
      { $match: { tenant: { $in: tenantIds } } },
      { $group: {
        _id: '$tenant',
        lastActivity: { $max: '$createdAt' },
        count30d: { $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] } },
      }},
    ]);
    const actMap = Object.fromEntries(activityData.map(a => [a._id.toString(), a]));

    // Usage counts per tenant
    const [leadCounts, dealCounts] = await Promise.all([
      Lead.aggregate([{ $match: { isActive: true, tenant: { $in: tenantIds } } }, { $group: { _id: '$tenant', c: { $sum: 1 } } }]),
      Opportunity.aggregate([{ $match: { isActive: true, tenant: { $in: tenantIds } } }, { $group: { _id: '$tenant', c: { $sum: 1 } } }]),
    ]);
    const leadMap = Object.fromEntries(leadCounts.map(x => [x._id.toString(), x.c]));
    const dealMap = Object.fromEntries(dealCounts.map(x => [x._id.toString(), x.c]));

    // ── AT RISK ───────────────────────────────────────────────
    // 1. Trial expiring in next 30 days (upcoming)
    // 2. Trial ALREADY expired, never upgraded (overdue)
    const atRisk = allTenants.filter(t => {
      const sub = t.subscription;
      if (sub?.status !== 'trial' || !sub?.trialEndDate) return false;
      const end = new Date(sub.trialEndDate);
      const upcoming = end >= now && end <= thirtyDaysLater;    // expiring soon
      const overdue  = end < now;                                // already expired
      return upcoming || overdue;
    }).map(t => {
      const tid = t._id.toString();
      const end = new Date(t.subscription.trialEndDate);
      const daysLeft = Math.ceil((end - now) / 86400000); // negative = overdue
      const isOverdue = daysLeft < 0;
      return {
        id: t._id,
        name: t.organizationName,
        plan: t.subscription?.planName || 'Free',
        daysLeft,
        isOverdue,
        trialEndDate: t.subscription.trialEndDate,
        usage: {
          leads: leadMap[tid] || 0,
          deals: dealMap[tid] || 0,
          activity30d: actMap[tid]?.count30d || 0,
        },
        riskLevel: isOverdue ? 'critical' : daysLeft <= 7 ? 'high' : 'medium',
        lastActivity: actMap[tid]?.lastActivity || null,
      };
    }).sort((a, b) => a.daysLeft - b.daysLeft); // overdue first

    // ── RECENTLY CHURNED ──────────────────────────────────────
    // Tenants with cancelledAt set in last 90 days
    const recentlyChurned = allTenants.filter(t => {
      const ca = t.subscription?.cancelledAt;
      return ca && new Date(ca) >= ninetyDaysAgo;
    }).map(t => {
      const tid = t._id.toString();
      return {
        id: t._id,
        name: t.organizationName,
        plan: t.subscription?.planName || 'Unknown',
        amount: Math.round(getTenantMonthlyAmount(t, planMap)),
        cancelledAt: t.subscription.cancelledAt,
        reason: t.subscription.cancellationReason || 'Not specified',
        daysSinceCancelled: Math.ceil((now - new Date(t.subscription.cancelledAt)) / 86400000),
        usage: { leads: leadMap[tid] || 0, deals: dealMap[tid] || 0 },
      };
    }).sort((a, b) => a.daysSinceCancelled - b.daysSinceCancelled);

    const churnReasons = {};
    recentlyChurned.forEach(t => { churnReasons[t.reason] = (churnReasons[t.reason] || 0) + 1; });

    // Win-back: churned but had real usage
    const winBack = recentlyChurned.filter(t => t.usage.leads > 3 || t.usage.deals > 1);

    // ── INACTIVE TENANTS ──────────────────────────────────────
    // ANY tenant (trial or active) with no activity in last 14 days
    const inactiveTenants = allTenants.filter(t => {
      const tid = t._id.toString();
      const act = actMap[tid];
      const hasRecent = act?.lastActivity && new Date(act.lastActivity) >= fourteenDaysAgo;
      const isOldEnough = new Date(t.createdAt) < fourteenDaysAgo; // joined > 14 days ago
      return !hasRecent && isOldEnough;
    }).map(t => {
      const tid = t._id.toString();
      const act = actMap[tid];
      return {
        id: t._id,
        name: t.organizationName,
        plan: t.subscription?.planName || 'Free',
        status: t.subscription?.status || 'trial',
        daysSinceJoined: Math.ceil((now - new Date(t.createdAt)) / 86400000),
        lastActivity: act?.lastActivity || null,
        daysSinceActivity: act?.lastActivity
          ? Math.ceil((now - new Date(act.lastActivity)) / 86400000)
          : Math.ceil((now - new Date(t.createdAt)) / 86400000),
        usage: { leads: leadMap[tid] || 0, deals: dealMap[tid] || 0, activity30d: act?.count30d || 0 },
      };
    }).sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);

    // ── MONTHLY TREND ─────────────────────────────────────────
    const months = last12Months();
    const churnTrend = months.map(m => {
      const mStart = new Date(m.year, m.month - 1, 1);
      const mEnd   = new Date(m.year, m.month, 0, 23, 59, 59);
      const churned   = allTenants.filter(t => {
        const ca = t.subscription?.cancelledAt;
        return ca && new Date(ca) >= mStart && new Date(ca) <= mEnd;
      }).length;
      const newJoined = allTenants.filter(t => {
        const d = new Date(t.createdAt);
        return d >= mStart && d <= mEnd;
      }).length;
      return { label: m.label, churned, new: newJoined, net: newJoined - churned };
    });

    res.json({
      success: true, data: {
        atRisk,
        recentlyChurned,
        churnReasons,
        winBack,
        inactiveTenants,
        churnTrend,
        summary: {
          atRiskCount:    atRisk.length,
          churnedCount:   recentlyChurned.length,
          winBackCount:   winBack.length,
          inactiveCount:  inactiveTenants.length,
          overdueCount:   atRisk.filter(t => t.isOverdue).length,
        },
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   4. UPSELL / CROSS-SELL — real usage vs plan limits
═══════════════════════════════════════════════════ */
exports.getUpsellCrosssell = async (req, res) => {
  try {
    const allTenants = await Tenant.find({ 'subscription.status': { $in: ['active', 'trial'] } })
      .populate('subscription.plan', 'name limits features price order')
      .select('subscription createdAt organizationName');

    const tenantIds = allTenants.map(t => t._id);

    const [leadCounts, contactCounts, dealCounts, userCounts] = await Promise.all([
      Lead.aggregate([{ $match: { isActive: true, tenant: { $in: tenantIds } } }, { $group: { _id: '$tenant', c: { $sum: 1 } } }]),
      Contact.aggregate([{ $match: { isActive: true, tenant: { $in: tenantIds } } }, { $group: { _id: '$tenant', c: { $sum: 1 } } }]),
      Opportunity.aggregate([{ $match: { isActive: true, tenant: { $in: tenantIds } } }, { $group: { _id: '$tenant', c: { $sum: 1 } } }]),
      User.aggregate([{ $match: { isActive: true, tenant: { $in: tenantIds } } }, { $group: { _id: '$tenant', c: { $sum: 1 } } }]),
    ]);

    const leadMap    = Object.fromEntries(leadCounts.map(x => [x._id.toString(), x.c]));
    const contactMap = Object.fromEntries(contactCounts.map(x => [x._id.toString(), x.c]));
    const dealMap    = Object.fromEntries(dealCounts.map(x => [x._id.toString(), x.c]));
    const userMap    = Object.fromEntries(userCounts.map(x => [x._id.toString(), x.c]));

    const plans = await SubscriptionPlan.find({ isActive: true }).sort('order');
    const planOrderMap = Object.fromEntries(plans.map(p => [p.name, p.order ?? PLAN_ORDER[p.name] ?? 0]));
    const maxPlanOrder = Math.max(...plans.map(p => p.order ?? 0));

    const upsellCandidates = [];
    const crossSellOpps    = [];

    allTenants.forEach(t => {
      const tid  = t._id.toString();
      const sub  = t.subscription;
      const plan = sub?.plan;
      if (!plan) return;

      const limits   = plan.limits || {};
      const features = plan.features || {};
      const planName = sub?.planName || plan.name || 'Free';
      const currentOrder = planOrderMap[planName] ?? 0;
      const isTopPlan = currentOrder >= maxPlanOrder;

      const usage = {
        leads:    leadMap[tid]    || 0,
        contacts: contactMap[tid] || 0,
        deals:    dealMap[tid]    || 0,
        users:    userMap[tid]    || 0,
      };

      const limitPct = {
        leads:    limits.leads    > 0 ? Math.round((usage.leads    / limits.leads)    * 100) : 0,
        contacts: limits.contacts > 0 ? Math.round((usage.contacts / limits.contacts) * 100) : 0,
        deals:    limits.deals    > 0 ? Math.round((usage.deals    / limits.deals)    * 100) : 0,
        users:    limits.users    > 0 ? Math.round((usage.users    / limits.users)    * 100) : 0,
      };
      const maxUsagePct = Math.max(...Object.values(limitPct));

      // Upsell: hitting 70%+ of any limit and NOT on top plan
      if (maxUsagePct >= 70 && !isTopPlan) {
        const hitLimits = Object.entries(limitPct).filter(([, pct]) => pct >= 70).map(([k, pct]) => ({ field: k, pct }));
        const nextPlan = plans.find(p => (p.order ?? PLAN_ORDER[p.name] ?? 0) > currentOrder);
        upsellCandidates.push({
          id: t._id, name: t.organizationName, currentPlan: planName,
          suggestedPlan: nextPlan?.name || 'Enterprise',
          maxUsagePct, hitLimits, usage,
          revenue: t.subscription?.amount || 0,
        });
      }

      // Cross-sell: features NOT in their plan that higher plans have
      if (!isTopPlan) {
        const missingFeatures = Object.entries(FEATURE_LABELS)
          .filter(([key]) => features[key] === false || features[key] === undefined)
          .map(([key, label]) => ({ key, label }))
          .slice(0, 5);
        if (missingFeatures.length > 0) {
          crossSellOpps.push({
            id: t._id, name: t.organizationName, currentPlan: planName,
            missingFeatures, engagement: Math.min(100, (usage.leads + usage.contacts) / 2),
          });
        }
      }
    });

    upsellCandidates.sort((a, b) => b.maxUsagePct - a.maxUsagePct);
    crossSellOpps.sort((a, b) => b.engagement - a.engagement);

    res.json({
      success: true, data: {
        upsellCandidates: upsellCandidates.slice(0, 20),
        crossSellOpps: crossSellOpps.slice(0, 20),
        summary: {
          upsellCount: upsellCandidates.length,
          crossSellCount: crossSellOpps.length,
          potentialMRR: upsellCandidates.length * 500, // rough estimate
        },
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   5. FEATURE ANALYTICS — real FeatureUsageLog data
═══════════════════════════════════════════════════ */
exports.getFeatureAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [plans, allTenants, usageLogs] = await Promise.all([
      SubscriptionPlan.find({ isActive: true }).sort('order'),
      Tenant.find({}).select('subscription organizationName'),
      FeatureUsageLog.aggregate([
        { $match: { lastUsed: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$feature', totalHits: { $sum: '$count' }, uniqueTenants: { $addToSet: '$tenant' } } },
      ]),
    ]);

    const totalTenants = allTenants.length;

    // Build feature usage from real FeatureUsageLog
    const usageMap = Object.fromEntries(
      usageLogs.map(u => [u._id, { hits: u.totalHits, tenants: u.uniqueTenants.length }])
    );

    // Build plan features lookup by plan name (avoids populate)
    const planFeaturesMap = {};
    plans.forEach(p => {
      const pf = p.features?.toObject ? p.features.toObject() : (p.features || {});
      planFeaturesMap[p.name] = pf;
    });

    // Count plan-based adoption using planName match (no populate needed)
    const planAdoption = {};
    allTenants.forEach(t => {
      const planName = t.subscription?.planName;
      const planFeatures = planFeaturesMap[planName] || {};
      Object.entries(FEATURE_LABELS).forEach(([key]) => {
        if (planFeatures[key] === true) {
          planAdoption[key] = (planAdoption[key] || 0) + 1;
        }
      });
    });

    const featureList = Object.entries(FEATURE_LABELS).map(([key, label]) => ({
      key, label,
      hits30d:       usageMap[key]?.hits    || 0,
      activeUsers:   usageMap[key]?.tenants || 0,
      planAdoption:  planAdoption[key]      || 0,
      adoptionRate:  totalTenants > 0 ? parseFloat(((usageMap[key]?.tenants || 0) / totalTenants * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.hits30d - a.hits30d);

    // Plan matrix — which features in which plan
    const planMatrix = plans.map(p => {
      const pf = p.features?.toObject ? p.features.toObject() : (p.features || {});
      return {
        plan: p.name,
        price: p.price?.monthly || 0,
        tenants: allTenants.filter(t => t.subscription?.planName === p.name).length,
        features: Object.entries(FEATURE_LABELS).filter(([k]) => pf[k] === true).map(([k, v]) => ({ key: k, label: v })),
      };
    });

    // Daily trend for top 5 features (last 30 days)
    const top5Keys = featureList.slice(0, 5).map(f => f.key);
    const dailyTrend = await FeatureUsageLog.aggregate([
      { $match: { feature: { $in: top5Keys }, lastUsed: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { feature: '$feature', date: '$date' }, hits: { $sum: '$count' } } },
      { $sort: { '_id.date': 1 } },
    ]);

    res.json({
      success: true, data: {
        featureList, planMatrix, dailyTrend,
        mostUsed:  featureList.find(f => f.hits30d > 0) || featureList[0],
        leastUsed: [...featureList].reverse().find(f => f.planAdoption > 0) || featureList[featureList.length - 1],
        totalTenants,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   6. CUSTOMER HEALTH SCORES — real activity data
═══════════════════════════════════════════════════ */
exports.getHealthScores = async (req, res) => {
  try {
    const allTenants = await Tenant.find({ 'subscription.status': { $in: ['active', 'trial'] } })
      .select('subscription createdAt organizationName assignedManager assignedManagerAt')
      .populate('assignedManager', 'firstName lastName email');
    const tenantIds = allTenants.map(t => t._id);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

    const [activityData, leadCounts, dealCounts, featureUsage] = await Promise.all([
      ActivityLog.aggregate([
        { $match: { tenant: { $in: tenantIds } } },
        { $group: {
          _id: '$tenant',
          lastActivity: { $max: '$createdAt' },
          count30d: { $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] } },
          count7d:  { $sum: { $cond: [{ $gte: ['$createdAt', sevenDaysAgo] }, 1, 0] } },
        }},
      ]),
      Lead.aggregate([{ $match: { isActive: true, tenant: { $in: tenantIds } } }, { $group: { _id: '$tenant', c: { $sum: 1 } } }]),
      Opportunity.aggregate([{ $match: { isActive: true, tenant: { $in: tenantIds } } }, { $group: { _id: '$tenant', c: { $sum: 1 } } }]),
      FeatureUsageLog.aggregate([
        { $match: { tenant: { $in: tenantIds }, lastUsed: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$tenant', featuresUsed: { $addToSet: '$feature' } } },
      ]),
    ]);

    const actMap     = Object.fromEntries(activityData.map(a => [a._id.toString(), a]));
    const leadMap    = Object.fromEntries(leadCounts.map(x => [x._id.toString(), x.c]));
    const dealMap    = Object.fromEntries(dealCounts.map(x => [x._id.toString(), x.c]));
    const featureMap = Object.fromEntries(featureUsage.map(x => [x._id.toString(), x.featuresUsed.length]));

    const scored = allTenants.map(t => {
      const tid    = t._id.toString();
      const act    = actMap[tid];
      const leads  = leadMap[tid]  || 0;
      const deals  = dealMap[tid]  || 0;
      const feats  = featureMap[tid] || 0;
      const act30  = act?.count30d  || 0;
      const act7   = act?.count7d   || 0;

      // Health score 0-100
      const actScore     = Math.min(30, act30 / 2);       // max 30 pts
      const recencyScore = act7 > 0 ? 20 : act30 > 0 ? 10 : 0; // max 20 pts
      const dataScore    = Math.min(20, (leads + deals) / 5); // max 20 pts
      const featScore    = Math.min(20, feats * 4);        // max 20 pts
      const tenureScore  = Math.min(10, Math.floor((Date.now() - new Date(t.createdAt)) / (30 * 24 * 60 * 60 * 1000))); // max 10 pts

      const score = Math.round(actScore + recencyScore + dataScore + featScore + tenureScore);
      const segment = score >= 70 ? 'champion' : score >= 40 ? 'healthy' : score >= 20 ? 'at_risk' : 'critical';

      const mgr = t.assignedManager;
      return {
        id: t._id, name: t.organizationName,
        plan: t.subscription?.planName || 'Free',
        status: t.subscription?.status || 'trial',
        score, segment,
        metrics: { activity30d: act30, activity7d: act7, leads, deals, featuresUsed: feats },
        lastActivity: act?.lastActivity || null,
        accountManager: mgr ? { id: mgr._id, name: `${mgr.firstName} ${mgr.lastName}`.trim(), email: mgr.email } : null,
      };
    }).sort((a, b) => b.score - a.score);

    const segments = { champion: 0, healthy: 0, at_risk: 0, critical: 0 };
    scored.forEach(t => { segments[t.segment]++; });

    res.json({
      success: true, data: { tenants: scored, segments, total: scored.length },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   7. SUBSCRIPTION METRICS — plan distribution
═══════════════════════════════════════════════════ */
exports.getSubscriptionMetrics = async (req, res) => {
  try {
    const [allTenants, planMap, planHistory] = await Promise.all([
      Tenant.find({}).select('subscription createdAt organizationName'),
      getPlanPriceMap(),
      PlanHistory.find({}).populate('tenant', 'organizationName').sort('-changedAt').limit(50).lean(),
    ]);

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Status breakdown
    const statusBreakdown = { active: 0, trial: 0, downgraded: 0, expired: 0, suspended: 0 };
    allTenants.forEach(t => {
      // Tenants who cancelled are now on Basic (status=active). Track them separately via cancelledAt.
      if (t.subscription?.cancelledAt) {
        statusBreakdown.downgraded++;
      } else {
        const s = t.subscription?.status || 'trial';
        statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
      }
    });

    // Plan distribution with revenue
    const planDist = {};
    allTenants.forEach(t => {
      const p = t.subscription?.planName || 'Free';
      if (!planDist[p]) planDist[p] = { count: 0, revenue: 0 };
      planDist[p].count++;
      if (t.subscription?.status === 'active') planDist[p].revenue += getTenantMonthlyAmount(t, planMap);
    });

    // New subscriptions this month
    const newThisMonth = allTenants.filter(t =>
      t.subscription?.status === 'active' && new Date(t.subscription?.startDate || t.createdAt) >= thirtyDaysAgo
    ).length;

    // Renewal list: active tenants with endDate in next 30 days
    const upcomingRenewals = allTenants.filter(t => {
      const end = t.subscription?.endDate || t.subscription?.renewalDate;
      if (!end) return false;
      const d = new Date(end);
      return d >= now && d <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }).map(t => ({
      id: t._id, name: t.organizationName,
      plan: t.subscription?.planName, renewalDate: t.subscription?.endDate || t.subscription?.renewalDate,
      amount: Math.round(getTenantMonthlyAmount(t, planMap)),
    }));

    res.json({
      success: true, data: {
        statusBreakdown, planDist, newThisMonth, upcomingRenewals,
        recentPlanChanges: planHistory,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   8. CANCEL SUBSCRIPTION — capture reason, save history
═══════════════════════════════════════════════════ */
exports.cancelSubscription = async (req, res) => {
  try {
    // tenantId comes from body (SAAS admin) OR from JWT (tenant self-cancel)
    const tenantId = req.body.tenantId || req.user?.tenant?._id || req.user?.tenant;
    const { reason, details } = req.body;
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId required' });

    const [tenant, basicPlan] = await Promise.all([
      Tenant.findById(tenantId),
      SubscriptionPlan.findOne({ name: 'Basic', isActive: true }),
    ]);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    if (!basicPlan) return res.status(404).json({ success: false, message: 'Basic plan not found' });

    const fromPlan = tenant.subscription?.planName || 'Unknown';
    const cancelNote = `${reason || 'Plan cancelled'}${details ? ': ' + details : ''}`;

    // Record downgrade history with cancel reason
    await PlanHistory.create({
      tenant: tenantId, fromPlan, toPlan: 'Basic',
      changeType: 'downgrade',
      reason: cancelNote,
      billingCycle: 'monthly',
      amount: 0,
      changedBy: req.body.tenantId ? 'admin' : 'tenant',
      changedAt: new Date(),
    });

    // Downgrade to Basic — no payment needed, keep status active
    tenant.subscription.plan           = basicPlan._id;
    tenant.subscription.planName       = 'Basic';
    tenant.subscription.status         = 'active';
    tenant.subscription.billingCycle   = 'monthly';
    tenant.subscription.amount         = 0;
    tenant.subscription.isTrialActive  = false;
    tenant.subscription.autoRenew      = false;
    tenant.subscription.cancellationReason = cancelNote;
    // Keep cancelledAt so churn analytics can optionally track "was ever cancelled"
    tenant.subscription.cancelledAt    = new Date();
    await tenant.save();

    res.json({ success: true, message: `Plan downgraded to Basic. Previous plan: ${fromPlan}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   9. UPGRADE / DOWNGRADE PLAN — save history
═══════════════════════════════════════════════════ */
exports.changePlan = async (req, res) => {
  try {
    const { tenantId, newPlanName, billingCycle, changedBy } = req.body;
    if (!tenantId || !newPlanName) return res.status(400).json({ success: false, message: 'tenantId and newPlanName required' });

    const [tenant, newPlan] = await Promise.all([
      Tenant.findById(tenantId),
      SubscriptionPlan.findOne({ name: newPlanName }),
    ]);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    if (!newPlan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const fromPlan = tenant.subscription?.planName || 'Free';
    const fromOrder = PLAN_ORDER[fromPlan] ?? 0;
    const toOrder   = PLAN_ORDER[newPlanName] ?? 0;
    const changeType = toOrder > fromOrder ? 'upgrade' : toOrder < fromOrder ? 'downgrade' : 'new';

    await PlanHistory.create({
      tenant: tenantId, fromPlan, toPlan: newPlanName,
      changeType, billingCycle: billingCycle || 'monthly',
      amount: billingCycle === 'yearly' ? newPlan.price?.yearly : newPlan.price?.monthly,
      changedBy: changedBy || 'admin', changedAt: new Date(),
    });

    tenant.subscription.plan      = newPlan._id;
    tenant.subscription.planName  = newPlanName;
    tenant.subscription.status    = 'active';
    tenant.subscription.startDate = tenant.subscription.startDate || new Date();
    if (billingCycle) tenant.subscription.billingCycle = billingCycle;
    await tenant.save();

    res.json({ success: true, message: `Plan changed from ${fromPlan} to ${newPlanName}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   10. PLAN HISTORY — full audit trail
═══════════════════════════════════════════════════ */
exports.getPlanHistory = async (req, res) => {
  try {
    const { tenantId } = req.query;
    const filter = tenantId ? { tenant: tenantId } : {};
    const history = await PlanHistory.find(filter)
      .populate('tenant', 'organizationName')
      .sort('-changedAt')
      .limit(100)
      .lean();
    res.json({ success: true, data: history });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   11. FEATURE STATUS & TOGGLE (plan-level)
═══════════════════════════════════════════════════ */
exports.getFeatureStatus = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({}, 'name displayName features isActive');
    res.json({
      success: true, data: {
        plans: plans.map(p => ({
          _id: p._id, name: p.name, display: p.displayName,
          features: p.features,
          enabled: !!p.features?.salesMonetization,
        })),
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.toggleFeature = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    const { feature, enabled } = req.body;
    if (!feature) return res.status(400).json({ success: false, message: 'feature name required' });
    plan.features[feature] = !!enabled;
    await plan.save();
    res.json({ success: true, message: `${feature} ${enabled ? 'enabled' : 'disabled'} for ${plan.name}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   12. TENANT — check own access & overview
═══════════════════════════════════════════════════ */
exports.tenantCheckAccess = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenant).populate('subscription.plan', 'features name displayName');
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const features = tenant.subscription?.plan?.features || {};
    res.json({
      success: true, data: {
        hasAccess: !!features.salesMonetization,
        plan: tenant.subscription?.planName,
        planDisplay: tenant.subscription?.plan?.displayName,
        features,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.tenantOverview = async (req, res) => {
  try {
    const tenantId = req.user.tenant;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [tenant, leadCount, contactCount, dealCount, featureUsage, planHistory] = await Promise.all([
      Tenant.findById(tenantId).populate('subscription.plan', 'name displayName features limits price'),
      Lead.countDocuments({ tenant: tenantId, isActive: true }),
      Contact.countDocuments({ tenant: tenantId, isActive: true }),
      Opportunity.countDocuments({ tenant: tenantId, isActive: true }),
      FeatureUsageLog.find({ tenant: tenantId, lastUsed: { $gte: thirtyDaysAgo } }).lean(),
      PlanHistory.find({ tenant: tenantId }).sort('-changedAt').limit(10).lean(),
    ]);

    const plan   = tenant.subscription?.plan;
    const limits = plan?.limits || {};
    const usedFeatures = featureUsage.map(f => ({ feature: f.feature, label: FEATURE_LABELS[f.feature] || f.feature, hits: f.count, lastUsed: f.lastUsed }));

    res.json({
      success: true, data: {
        tenant: { name: tenant.organizationName, plan: tenant.subscription?.planName, status: tenant.subscription?.status, billingCycle: tenant.subscription?.billingCycle, amount: tenant.subscription?.amount, renewalDate: tenant.subscription?.renewalDate },
        usage: { leads: leadCount, contacts: contactCount, deals: dealCount },
        limits: { leads: limits.leads, contacts: limits.contacts, deals: limits.deals, users: limits.users },
        usedFeatures, planHistory,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   ASSIGN ACCOUNT MANAGER TO TENANT
═══════════════════════════════════════════════════ */
exports.assignManager = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { managerId } = req.body; // null to unassign

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    if (managerId) {
      const manager = await User.findById(managerId).select('firstName lastName email');
      if (!manager) return res.status(404).json({ success: false, message: 'User not found' });
      tenant.assignedManager   = managerId;
      tenant.assignedManagerAt = new Date();
      tenant.assignedManagerBy = req.user._id;
    } else {
      tenant.assignedManager   = null;
      tenant.assignedManagerAt = null;
    }

    await tenant.save();
    const updated = await Tenant.findById(tenantId).populate('assignedManager', 'firstName lastName email');
    const mgr = updated.assignedManager;
    res.json({
      success: true,
      message: mgr ? `Assigned to ${mgr.firstName} ${mgr.lastName}` : 'Manager unassigned',
      data: { accountManager: mgr ? { id: mgr._id, name: `${mgr.firstName} ${mgr.lastName}`.trim(), email: mgr.email } : null },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/* ═══════════════════════════════════════════════════
   GET SAAS TEAM USERS (for manager dropdown)
═══════════════════════════════════════════════════ */
exports.getSaasUsers = async (req, res) => {
  try {
    // Return users who are SAAS-level (no tenant, or isSystemUser)
    const users = await User.find({ $or: [{ tenant: null }, { tenant: { $exists: false } }] })
      .select('firstName lastName email')
      .sort('firstName')
      .limit(100);
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
