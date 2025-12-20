const EmailMessage = require('../models/EmailMessage');
const emailTrackingService = require('../services/emailTrackingService');
const emailService = require('../services/emailService');
const emailSyncJob = require('../jobs/emailSyncJob');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Get all emails with filters
 * @route   GET /api/emails
 * @access  Private
 */
exports.getEmails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      direction,
      emailType,
      status,
      search,
      startDate,
      endDate,
      entityType,
      entityId,
      conversationsOnly
    } = req.query;

    // Build query
    let query = {
      tenant: req.user.tenant,
      isDeleted: false
    };

    console.log('📧 getEmails - User Tenant:', req.user.tenant);
    console.log('📧 getEmails - conversationsOnly:', conversationsOnly);

    // Conversations only - show only emails that are part of sent conversations
    if (conversationsOnly === 'true') {
      // Get all sent email threadIds
      const sentEmails = await EmailMessage.find({
        tenant: req.user.tenant,
        direction: 'sent',
        isDeleted: false
      }).select('threadId');

      const sentThreadIds = [...new Set(sentEmails.map(e => e.threadId))];

      // Filter to only show emails in these threads
      if (sentThreadIds.length > 0) {
        query.threadId = { $in: sentThreadIds };
      } else {
        // No sent emails, return empty
        query._id = { $exists: false };
      }
    }

    // Filters
    if (direction) query.direction = direction;
    if (emailType) query.emailType = emailType;
    if (status) query.status = status;
    if (entityType && entityId) {
      query['relatedTo.type'] = entityType;
      query['relatedTo.id'] = entityId;
    }

    // Date range
    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) query.sentAt.$gte = new Date(startDate);
      if (endDate) query.sentAt.$lte = new Date(endDate);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await EmailMessage.countDocuments(query);

    // Fetch emails
    const emails = await EmailMessage.find(query)
      .sort({ sentAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name email')
      .populate('relatedTo.id')
      .select('-bodyHtml -headers');

    console.log('📧 getEmails - Found emails:', emails.length, '/ Total:', total);
    if (emails.length > 0) {
      console.log('📧 First email:', {
        subject: emails[0].subject,
        direction: emails[0].direction,
        from: emails[0].from?.email,
        to: emails[0].to?.[0]?.email
      });
    }

    return successResponse(res, {
      emails,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get emails error:', error);
    return errorResponse(res, 'Error fetching emails', 500);
  }
};

/**
 * @desc    Get single email with full details
 * @route   GET /api/emails/:id
 * @access  Private
 */
exports.getEmail = async (req, res) => {
  try {
    const email = await EmailMessage.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    })
    .populate('userId', 'name email')
    .populate('relatedTo.id');

    if (!email) {
      return errorResponse(res, 'Email not found', 404);
    }

    // Mark as read
    if (!email.isRead) {
      email.isRead = true;
      await email.save();
    }

    return successResponse(res, email);

  } catch (error) {
    console.error('Get email error:', error);
    return errorResponse(res, 'Error fetching email', 500);
  }
};

/**
 * @desc    Get email thread/conversation
 * @route   GET /api/emails/thread/:messageId
 * @access  Private
 */
exports.getThread = async (req, res) => {
  try {
    const thread = await emailTrackingService.getThread(
      req.params.messageId,
      req.user.tenant
    );

    return successResponse(res, { thread });

  } catch (error) {
    console.error('Get thread error:', error);
    return errorResponse(res, 'Error fetching thread', 500);
  }
};

/**
 * @desc    Get emails for specific entity
 * @route   GET /api/emails/entity/:entityType/:entityId
 * @access  Private
 */
exports.getEntityEmails = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const emails = await emailTrackingService.getEntityEmails(
      entityType,
      entityId,
      req.user.tenant
    );

    return successResponse(res, { emails });

  } catch (error) {
    console.error('Get entity emails error:', error);
    return errorResponse(res, 'Error fetching entity emails', 500);
  }
};

/**
 * @desc    Send email from CRM
 * @route   POST /api/emails/send
 * @access  Private
 */
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, text, html, relatedTo } = req.body;

    if (!to || !subject || !text) {
      return errorResponse(res, 'Please provide to, subject, and text', 400);
    }

    // Send email using email service
    const result = await emailService.sendEmail(
      req.user._id,
      { to, subject, text, html },
      req.user.tenant
    );

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result, 'Email sent successfully');

  } catch (error) {
    console.error('Send email error:', error);
    return errorResponse(res, 'Error sending email', 500);
  }
};

/**
 * @desc    Trigger manual email sync
 * @route   POST /api/emails/sync
 * @access  Private
 */
exports.syncEmails = async (req, res) => {
  try {
    const result = await emailSyncJob.syncNow(req.user.tenant);

    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result, 'Email sync completed');

  } catch (error) {
    console.error('Sync emails error:', error);
    return errorResponse(res, 'Error syncing emails', 500);
  }
};

/**
 * @desc    Get email statistics
 * @route   GET /api/emails/stats/overview
 * @access  Private
 */
exports.getStats = async (req, res) => {
  try {
    const tenantFilter = { tenant: req.user.tenant, isDeleted: false };
    console.log('📊 getStats - User Tenant:', req.user.tenant);

    const [
      totalSent,
      totalReceived,
      totalReplies,
      sentLast24h,
      receivedLast24h,
      byType,
      byStatus
    ] = await Promise.all([
      EmailMessage.countDocuments({ ...tenantFilter, direction: 'sent' }),
      EmailMessage.countDocuments({ ...tenantFilter, direction: 'received' }),
      EmailMessage.countDocuments({ ...tenantFilter, status: 'replied' }),
      EmailMessage.countDocuments({
        ...tenantFilter,
        direction: 'sent',
        sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      EmailMessage.countDocuments({
        ...tenantFilter,
        direction: 'received',
        sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      EmailMessage.aggregate([
        { $match: tenantFilter },
        { $group: { _id: '$emailType', count: { $sum: 1 } } }
      ]),
      EmailMessage.aggregate([
        { $match: tenantFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    console.log('📊 Stats:', { totalSent, totalReceived, totalReplies, sentLast24h });

    return successResponse(res, {
      totalSent,
      totalReceived,
      totalReplies,
      sentLast24h,
      receivedLast24h,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return errorResponse(res, 'Error fetching statistics', 500);
  }
};

/**
 * @desc    Mark email as read
 * @route   PATCH /api/emails/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const email = await EmailMessage.findOneAndUpdate(
      { _id: req.params.id, tenant: req.user.tenant },
      { isRead: true },
      { new: true }
    );

    if (!email) {
      return errorResponse(res, 'Email not found', 404);
    }

    return successResponse(res, email, 'Email marked as read');

  } catch (error) {
    console.error('Mark as read error:', error);
    return errorResponse(res, 'Error marking email as read', 500);
  }
};

/**
 * @desc    Delete email (soft delete)
 * @route   DELETE /api/emails/:id
 * @access  Private
 */
exports.deleteEmail = async (req, res) => {
  try {
    const email = await EmailMessage.findOneAndUpdate(
      { _id: req.params.id, tenant: req.user.tenant },
      { isDeleted: true },
      { new: true }
    );

    if (!email) {
      return errorResponse(res, 'Email not found', 404);
    }

    return successResponse(res, { deleted: true }, 'Email deleted successfully');

  } catch (error) {
    console.error('Delete email error:', error);
    return errorResponse(res, 'Error deleting email', 500);
  }
};
