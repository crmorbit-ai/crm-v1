const Feedback = require('../models/Feedback');

const mkErr = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const TENANT_ADMIN_TYPES = ['TENANT_ADMIN', 'TENANT_MANAGER'];
const SAAS_TYPES         = ['SAAS_OWNER', 'SAAS_ADMIN'];

const isTenantAdmin = (user) => TENANT_ADMIN_TYPES.includes(user.userType);
const isSaasUser    = (user) => SAAS_TYPES.includes(user.userType);

/* ══════════════════════════════════════════════════════════
   TIER 0 — Tenant User
══════════════════════════════════════════════════════════ */

/* Submit feedback */
exports.submitFeedback = async (req, res, next) => {
  try {
    const { type, category, title, description, rating, context, directToSaas } = req.body;

    // Tenant admin can submit directly to SAAS by passing directToSaas: true
    const isAdminDirectSubmit = directToSaas && isTenantAdmin(req.user);

    const fb = await Feedback.create({
      tenant:      req.user.tenant,
      submittedBy: req.user._id,
      type, category, title, description, rating, context,
      ...(isAdminDirectSubmit && {
        escalatedToSaas: true,
        escalatedAt:     new Date(),
        escalatedBy:     req.user._id,
        escalatedReason: 'Direct submission from tenant admin',
        tenantAdminStatus: 'escalated',
      }),
    });
    res.status(201).json({ success: true, data: fb });
  } catch (e) { next(e); }
};

/* Get my own feedback history */
exports.getMyFeedback = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, status, type, category } = req.query;
    const filter = { tenant: req.user.tenant, submittedBy: req.user._id };
    if (status)   filter.status   = status;
    if (type)     filter.type     = type;
    if (category) filter.category = category;

    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('submittedBy',         'firstName lastName email')
        .populate('tenantAdminRepliedBy', 'firstName lastName')
        .populate('repliedBy',            'firstName lastName'),
      Feedback.countDocuments(filter),
    ]);

    res.json({ success: true, data: items, total });
  } catch (e) { next(e); }
};

/* ══════════════════════════════════════════════════════════
   TIER 1 — Tenant Admin
══════════════════════════════════════════════════════════ */

/* Tenant admin: see all feedback for their org */
exports.getTenantInbox = async (req, res, next) => {
  try {
    if (!isTenantAdmin(req.user) && !isSaasUser(req.user)) {
      return next(mkErr('Tenant admin access required', 403));
    }
    const { page = 1, limit = 100, status, type, category, sentiment, search, tenantAdminStatus } = req.query;

    const filter = { tenant: req.user.tenant };
    if (status)            filter.status            = status;
    if (type)              filter.type              = type;
    if (category)          filter.category          = category;
    if (sentiment)         filter.sentiment         = sentiment;
    if (tenantAdminStatus) filter.tenantAdminStatus = tenantAdminStatus;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('submittedBy',         'firstName lastName email')
        .populate('tenantAdminRepliedBy', 'firstName lastName')
        .populate('escalatedBy',          'firstName lastName'),
      Feedback.countDocuments(filter),
    ]);

    res.json({ success: true, data: items, total });
  } catch (e) { next(e); }
};

/* Tenant admin: reply to a user's feedback */
exports.tenantAdminReply = async (req, res, next) => {
  try {
    if (!isTenantAdmin(req.user)) return next(mkErr('Tenant admin access required', 403));

    const { reply } = req.body;
    if (!reply?.trim()) return next(mkErr('Reply text is required', 400));

    const fb = await Feedback.findOne({ _id: req.params.id, tenant: req.user.tenant });
    if (!fb) return next(mkErr('Feedback not found', 404));

    fb.tenantAdminReply     = reply.trim();
    fb.tenantAdminRepliedBy = req.user._id;
    fb.tenantAdminRepliedAt = new Date();
    if (fb.tenantAdminStatus === 'pending') fb.tenantAdminStatus = 'in_review';
    if (fb.status === 'new') fb.status = 'acknowledged';
    await fb.save();

    await fb.populate('submittedBy',         'firstName lastName email');
    await fb.populate('tenantAdminRepliedBy', 'firstName lastName');
    res.json({ success: true, data: fb });
  } catch (e) { next(e); }
};

/* Tenant admin: update status */
exports.tenantAdminUpdateStatus = async (req, res, next) => {
  try {
    if (!isTenantAdmin(req.user)) return next(mkErr('Tenant admin access required', 403));

    const { tenantAdminStatus } = req.body;
    const valid = ['pending', 'in_review', 'resolved', 'escalated'];
    if (!valid.includes(tenantAdminStatus)) return next(mkErr('Invalid status', 400));

    const fb = await Feedback.findOne({ _id: req.params.id, tenant: req.user.tenant });
    if (!fb) return next(mkErr('Feedback not found', 404));

    fb.tenantAdminStatus = tenantAdminStatus;
    if (tenantAdminStatus === 'resolved') fb.status = 'resolved';
    await fb.save();

    res.json({ success: true, data: fb });
  } catch (e) { next(e); }
};

/* Tenant admin: escalate to SAAS */
exports.escalateFeedback = async (req, res, next) => {
  try {
    if (!isTenantAdmin(req.user)) return next(mkErr('Tenant admin access required', 403));

    const { reason } = req.body;
    const fb = await Feedback.findOne({ _id: req.params.id, tenant: req.user.tenant });
    if (!fb) return next(mkErr('Feedback not found', 404));

    fb.escalatedToSaas    = true;
    fb.escalatedAt        = new Date();
    fb.escalatedBy        = req.user._id;
    fb.escalatedReason    = reason?.trim() || '';
    fb.tenantAdminStatus  = 'escalated';
    await fb.save();

    res.json({ success: true, data: fb });
  } catch (e) { next(e); }
};

/* Tenant admin: analytics for their org */
exports.getTenantAnalytics = async (req, res, next) => {
  try {
    if (!isTenantAdmin(req.user)) return next(mkErr('Tenant admin access required', 403));

    const days   = parseInt(req.query.days) || 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match  = { tenant: req.user.tenant, createdAt: { $gte: cutoff } };

    const [total, byType, byCategory, bySentiment, byStatus, dailyTrend, avgRatings] = await Promise.all([
      Feedback.countDocuments(match),
      Feedback.aggregate([{ $match: match }, { $group: { _id: '$type',      count: { $sum: 1 } } }]),
      Feedback.aggregate([{ $match: match }, { $group: { _id: '$category',  count: { $sum: 1 } } }]),
      Feedback.aggregate([{ $match: match }, { $group: { _id: '$sentiment', count: { $sum: 1 } } }]),
      Feedback.aggregate([{ $match: match }, { $group: { _id: '$tenantAdminStatus', count: { $sum: 1 } } }]),
      Feedback.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }, { $limit: 30 },
      ]),
      Feedback.aggregate([
        { $match: { ...match, rating: { $ne: null } } },
        { $group: { _id: '$category', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const toMap = arr => arr.reduce((a, { _id, count }) => { a[_id] = count; return a; }, {});
    const sm    = toMap(byStatus);
    const sent  = toMap(bySentiment);

    res.json({
      success: true,
      data: {
        total,
        byType:      toMap(byType),
        byCategory:  toMap(byCategory),
        bySentiment: sent,
        byStatus:    sm,
        dailyTrend,
        avgRatingByCategory: avgRatings,
        open:        (sm['pending'] || 0) + (sm['in_review'] || 0),
        resolved:    sm['resolved'] || 0,
        escalated:   sm['escalated'] || 0,
        positiveRate: total ? Math.round(((sent['positive'] || 0) / total) * 100) : 0,
      },
    });
  } catch (e) { next(e); }
};

/* ══════════════════════════════════════════════════════════
   TIER 2 — SAAS Admin
══════════════════════════════════════════════════════════ */

/* SAAS admin: get all feedback (optionally filter escalated) */
exports.getAllFeedback = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, status, type, category, sentiment, search, days, escalatedOnly } = req.query;
    const filter = {};

    if (escalatedOnly === 'true') filter.escalatedToSaas = true;
    if (status)    filter.status    = status;
    if (type)      filter.type      = type;
    if (category)  filter.category  = category;
    if (sentiment) filter.sentiment = sentiment;
    if (days) filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ escalatedToSaas: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('tenant',              'organizationName contactEmail')
        .populate('submittedBy',         'firstName lastName email')
        .populate('tenantAdminRepliedBy', 'firstName lastName')
        .populate('escalatedBy',          'firstName lastName')
        .populate('repliedBy',            'firstName lastName'),
      Feedback.countDocuments(filter),
    ]);

    res.json({ success: true, data: items, total });
  } catch (e) { next(e); }
};

/* SAAS admin: get single feedback */
exports.getFeedbackById = async (req, res, next) => {
  try {
    const fb = await Feedback.findById(req.params.id)
      .populate('tenant',                'organizationName contactEmail')
      .populate('submittedBy',           'firstName lastName email')
      .populate('tenantAdminRepliedBy',  'firstName lastName')
      .populate('escalatedBy',           'firstName lastName')
      .populate('repliedBy',             'firstName lastName')
      .populate('internalNotes.addedBy', 'firstName lastName');

    if (!fb) return next(mkErr('Feedback not found', 404));

    // Tenant users can only read their own org's feedback
    if (!isSaasUser(req.user) && !isTenantAdmin(req.user)) {
      if (fb.tenant?._id?.toString() !== req.user.tenant?.toString() ||
          fb.submittedBy?._id?.toString() !== req.user._id?.toString()) {
        return next(mkErr('Access denied', 403));
      }
    } else if (isTenantAdmin(req.user)) {
      if (fb.tenant?._id?.toString() !== req.user.tenant?.toString()) {
        return next(mkErr('Access denied', 403));
      }
    }

    res.json({ success: true, data: fb });
  } catch (e) { next(e); }
};

/* SAAS admin: reply to tenant admin */
exports.replyToFeedback = async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim()) return next(mkErr('Reply text is required', 400));

    const existing = await Feedback.findById(req.params.id);
    if (!existing) return next(mkErr('Feedback not found', 404));

    const newStatus = ['new', 'acknowledged'].includes(existing.status) ? 'in_progress' : existing.status;

    const fb = await Feedback.findByIdAndUpdate(
      req.params.id,
      { adminReply: reply.trim(), repliedAt: new Date(), repliedBy: req.user._id, tenantNotified: true, status: newStatus },
      { new: true }
    )
      .populate('tenant',      'organizationName contactEmail')
      .populate('submittedBy', 'firstName lastName email')
      .populate('repliedBy',   'firstName lastName');

    res.json({ success: true, data: fb });
  } catch (e) { next(e); }
};

/* SAAS admin: update status */
exports.updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['new', 'acknowledged', 'in_progress', 'resolved', 'closed'];
    if (!valid.includes(status)) return next(mkErr('Invalid status', 400));

    const update = { status };
    const now = new Date();
    if (status === 'acknowledged') update.acknowledgedAt = now;
    if (status === 'resolved')     update.resolvedAt     = now;
    if (status === 'closed')       update.closedAt       = now;

    const fb = await Feedback.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('tenant',      'organizationName contactEmail')
      .populate('submittedBy', 'firstName lastName email');

    if (!fb) return next(mkErr('Feedback not found', 404));
    res.json({ success: true, data: fb });
  } catch (e) { next(e); }
};

/* SAAS admin: add internal note */
exports.addInternalNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note?.trim()) return next(mkErr('Note is required', 400));

    const fb = await Feedback.findByIdAndUpdate(
      req.params.id,
      { $push: { internalNotes: { note: note.trim(), addedBy: req.user._id, addedAt: new Date() } } },
      { new: true }
    ).populate('internalNotes.addedBy', 'firstName lastName');

    if (!fb) return next(mkErr('Feedback not found', 404));
    res.json({ success: true, data: fb });
  } catch (e) { next(e); }
};

/* SAAS admin: delete */
exports.deleteFeedback = async (req, res, next) => {
  try {
    const fb = await Feedback.findByIdAndDelete(req.params.id);
    if (!fb) return next(mkErr('Feedback not found', 404));
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
};

/* SAAS admin: global analytics */
exports.getFeedbackAnalytics = async (req, res, next) => {
  try {
    const days   = parseInt(req.query.days) || 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match  = { createdAt: { $gte: cutoff } };

    const [total, byType, byCategory, bySentiment, byStatus, byPriority, escalated, dailyTrend, avgRatings] =
      await Promise.all([
        Feedback.countDocuments(match),
        Feedback.aggregate([{ $match: match }, { $group: { _id: '$type',      count: { $sum: 1 } } }]),
        Feedback.aggregate([{ $match: match }, { $group: { _id: '$category',  count: { $sum: 1 } } }]),
        Feedback.aggregate([{ $match: match }, { $group: { _id: '$sentiment', count: { $sum: 1 } } }]),
        Feedback.aggregate([{ $match: match }, { $group: { _id: '$status',    count: { $sum: 1 } } }]),
        Feedback.aggregate([{ $match: match }, { $group: { _id: '$priority',  count: { $sum: 1 } } }]),
        Feedback.countDocuments({ ...match, escalatedToSaas: true }),
        Feedback.aggregate([
          { $match: match },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }, { $limit: 30 },
        ]),
        Feedback.aggregate([
          { $match: { ...match, rating: { $ne: null } } },
          { $group: { _id: '$category', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
          { $sort: { avg: -1 } },
        ]),
      ]);

    const toMap = arr => arr.reduce((a, { _id, count }) => { a[_id] = count; return a; }, {});
    const sm   = toMap(byStatus);
    const sent = toMap(bySentiment);

    res.json({
      success: true,
      data: {
        total, escalated,
        byType:      toMap(byType),
        byCategory:  toMap(byCategory),
        bySentiment: sent,
        byStatus:    sm,
        byPriority:  toMap(byPriority),
        dailyTrend,
        avgRatingByCategory: avgRatings,
        open:         (sm['new'] || 0) + (sm['acknowledged'] || 0) + (sm['in_progress'] || 0),
        resolved:     (sm['resolved'] || 0) + (sm['closed'] || 0),
        positiveRate: total ? Math.round(((sent['positive'] || 0) / total) * 100) : 0,
        negativeRate: total ? Math.round(((sent['negative'] || 0) / total) * 100) : 0,
      },
    });
  } catch (e) { next(e); }
};
