const SupportTicket = require('../models/SupportTicket');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Create new support ticket
 * @route   POST /api/support-tickets
 * @access  Private (Tenant users)
 */
const createTicket = async (req, res) => {
  try {
    const { summary, description, category, priority } = req.body;

    if (!summary || !description) {
      return errorResponse(res, 'Summary and description are required', 400);
    }

    const ticket = await SupportTicket.create({
      summary,
      description,
      category: category || 'Other',
      priority: priority || 'Medium',
      createdBy: req.user._id,
      tenant: req.user.tenant,
      status: 'Open'
    });

    await ticket.populate('createdBy', 'firstName lastName email');
    await ticket.populate('tenant', 'organizationName');

    // Log activity
    await logActivity(req, 'support.ticket_created', 'SupportTicket', ticket._id, {
      ticketNumber: ticket.ticketNumber,
      summary: ticket.summary
    });

    return successResponse(res, ticket, 'Support ticket created successfully', 201);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return errorResponse(res, 'Error creating ticket', 500);
  }
};

/**
 * @desc    Get all tickets (filtered by role)
 * @route   GET /api/support-tickets
 * @access  Private
 */
const getAllTickets = async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20, search } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      // SAAS admins see all tickets
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
    } else {
      // Tenant users see only their tenant's tickets
      query.tenant = req.user.tenant;
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
    }

    // Search by ticket number or summary
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await SupportTicket.countDocuments(query);

    const tickets = await SupportTicket.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .populate('assignedTo', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    return successResponse(res, {
      tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return errorResponse(res, 'Error fetching tickets', 500);
  }
};

/**
 * @desc    Get single ticket by ID
 * @route   GET /api/support-tickets/:id
 * @access  Private
 */
const getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email userType')
      .populate('tenant', 'organizationName email contactPerson')
      .populate('assignedTo', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName')
      .populate('messages.sender', 'firstName lastName email userType');

    if (!ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Check access permission
    const isSaasAdmin = req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN';
    const isTenantUser = ticket.tenant._id.toString() === req.user.tenant?.toString();

    if (!isSaasAdmin && !isTenantUser) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Mark as read if SAAS admin
    if (isSaasAdmin && !ticket.isRead) {
      ticket.isRead = true;
      await ticket.save();
    }

    return successResponse(res, ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return errorResponse(res, 'Error fetching ticket', 500);
  }
};

/**
 * @desc    Add message to ticket
 * @route   POST /api/support-tickets/:id/messages
 * @access  Private
 */
const addMessage = async (req, res) => {
  try {
    const { message, isInternal } = req.body;

    if (!message) {
      return errorResponse(res, 'Message is required', 400);
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Determine sender type
    const senderType = (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN')
      ? 'SAAS_ADMIN'
      : 'TENANT_USER';

    // Only SAAS admins can add internal notes
    const isInternalNote = (senderType === 'SAAS_ADMIN' && isInternal) || false;

    await ticket.addMessage(req.user._id, senderType, message, isInternalNote);

    await ticket.populate('messages.sender', 'firstName lastName email');

    // Log activity
    await logActivity(req, 'support.message_added', 'SupportTicket', ticket._id, {
      ticketNumber: ticket.ticketNumber,
      senderType
    });

    return successResponse(res, ticket, 'Message added successfully');
  } catch (error) {
    console.error('Error adding message:', error);
    return errorResponse(res, 'Error adding message', 500);
  }
};

/**
 * @desc    Update ticket status
 * @route   PUT /api/support-tickets/:id/status
 * @access  Private (SAAS Admin only)
 */
const updateTicketStatus = async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;

    // Only SAAS admins can update status
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      return errorResponse(res, 'Only SAAS admins can update ticket status', 403);
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    await ticket.updateStatus(status, req.user._id);

    if (resolutionNotes) {
      ticket.resolutionNotes = resolutionNotes;
      await ticket.save();
    }

    await ticket.populate('createdBy', 'firstName lastName email');
    await ticket.populate('tenant', 'organizationName');
    await ticket.populate('assignedTo', 'firstName lastName');
    await ticket.populate('resolvedBy', 'firstName lastName');

    // Log activity
    await logActivity(req, 'support.status_updated', 'SupportTicket', ticket._id, {
      ticketNumber: ticket.ticketNumber,
      newStatus: status
    });

    return successResponse(res, ticket, 'Ticket status updated successfully');
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return errorResponse(res, 'Error updating ticket status', 500);
  }
};

/**
 * @desc    Assign ticket to SAAS admin
 * @route   PUT /api/support-tickets/:id/assign
 * @access  Private (SAAS Admin only)
 */
const assignTicket = async (req, res) => {
  try {
    const { assignTo } = req.body;

    // Only SAAS admins can assign tickets
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      return errorResponse(res, 'Only SAAS admins can assign tickets', 403);
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    ticket.assignedTo = assignTo || req.user._id;

    // Auto-update status to In Progress if it's Open
    if (ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();
    await ticket.populate('assignedTo', 'firstName lastName email');

    return successResponse(res, ticket, 'Ticket assigned successfully');
  } catch (error) {
    console.error('Error assigning ticket:', error);
    return errorResponse(res, 'Error assigning ticket', 500);
  }
};

/**
 * @desc    Get ticket statistics
 * @route   GET /api/support-tickets/stats
 * @access  Private (SAAS Admin only)
 */
const getTicketStats = async (req, res) => {
  try {
    // Only SAAS admins can view stats
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      return errorResponse(res, 'Only SAAS admins can view statistics', 403);
    }

    const stats = await SupportTicket.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgResponseTime: { $avg: '$responseTime' },
                avgResolutionTime: { $avg: '$resolutionTime' }
              }
            }
          ]
        }
      }
    ]);

    return successResponse(res, {
      byStatus: stats[0].byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: stats[0].byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byCategory: stats[0].byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      overall: stats[0].overall[0] || { total: 0, avgResponseTime: 0, avgResolutionTime: 0 }
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    return errorResponse(res, 'Error fetching statistics', 500);
  }
};

/**
 * @desc    Delete ticket (soft delete - close)
 * @route   DELETE /api/support-tickets/:id
 * @access  Private (SAAS Admin only)
 */
const deleteTicket = async (req, res) => {
  try {
    // Only SAAS admins can delete tickets
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      return errorResponse(res, 'Only SAAS admins can delete tickets', 403);
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return errorResponse(res, 'Ticket not found', 404);
    }

    // Soft delete - just close the ticket
    ticket.status = 'Closed';
    ticket.closedAt = new Date();
    await ticket.save();

    return successResponse(res, null, 'Ticket closed successfully');
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return errorResponse(res, 'Error deleting ticket', 500);
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicket,
  addMessage,
  updateTicketStatus,
  assignTicket,
  getTicketStats,
  deleteTicket
};
