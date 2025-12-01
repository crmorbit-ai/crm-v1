const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const Contact = require('../models/Contact');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const { sendMeetingInvitation, sendMeetingCancellation } = require('../utils/emailService');

const getMeetings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, relatedTo, relatedToId } = req.query;
    let query = { isActive: true };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') query.tenant = req.user.tenant;
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' }}, { location: { $regex: search, $options: 'i' }}];
    if (status) query.status = status;
    if (relatedTo) query.relatedTo = relatedTo;
    if (relatedToId) query.relatedToId = relatedToId;
    const total = await Meeting.countDocuments(query);
    const meetings = await Meeting.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('host', 'firstName lastName email')
      .populate('contactName', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .limit(limit * 1).skip((page - 1) * limit).sort({ from: -1 }).lean();
    successResponse(res, 200, 'Meetings retrieved successfully', {
      meetings, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('host', 'firstName lastName email')
      .populate('contactName', 'firstName lastName email phone')
      .populate('tenant', 'organizationName');
    if (!meeting) return errorResponse(res, 404, 'Meeting not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (meeting.tenant._id.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    successResponse(res, 200, 'Meeting retrieved successfully', meeting);
  } catch (error) {
    console.error('Get meeting error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const createMeeting = async (req, res) => {
  try {
    const {
      title, location, from, to, relatedTo, relatedToId, contactName,
      description, agenda, meetingType, participants,
      sendInvitation // NEW: Flag to send email invitation
    } = req.body;

    // Basic validation - only title, from, and to are required
    if (!title || !from || !to) {
      return errorResponse(res, 400, 'Please provide title, from, and to');
    }

    // If relatedTo is provided, relatedToId must also be provided
    if ((relatedTo && !relatedToId) || (!relatedTo && relatedToId)) {
      return errorResponse(res, 400, 'Both relatedTo and relatedToId must be provided together, or both left empty');
    }
    
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) return errorResponse(res, 400, 'Tenant is required');
    } else tenant = req.user.tenant;
    
    // ✅ AUTO-GENERATE JITSI MEETING LINK
    const meetingId = `crm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const meetingLink = `https://meet.jit.si/${meetingId}`;
    
    const meeting = await Meeting.create({
      title, location, from, to, relatedTo, relatedToId, contactName, description, agenda, meetingType, participants,
      meetingId,
      meetingLink,
      host: req.body.host || req.user._id, 
      owner: req.body.owner || req.user._id, 
      tenant, 
      createdBy: req.user._id, 
      lastModifiedBy: req.user._id
    });
    
    await meeting.populate('owner', 'firstName lastName email');
    await meeting.populate('host', 'firstName lastName email');

    // ============================================
    // 📧 SEND EMAIL INVITATIONS (ASYNC - NO WAIT)
    // ============================================
    if (sendInvitation !== false) {
      // Send emails in background without blocking the response
      (async () => {
        try {
          // Collect all attendee emails
          const attendeeEmails = [];

          // 1. Add participants array emails
          if (participants && participants.length > 0) {
            participants.forEach(email => {
              if (email && email.includes('@')) {
                attendeeEmails.push(email);
              }
            });
          }

          // 2. Get email from related entity (Lead/Contact)
          if (relatedTo === 'Lead' && relatedToId) {
            const lead = await Lead.findById(relatedToId).select('email firstName lastName');
            if (lead && lead.email) {
              attendeeEmails.push(lead.email);
            }
          } else if (relatedTo === 'Contact' && relatedToId) {
            const contact = await Contact.findById(relatedToId).select('email firstName lastName');
            if (contact && contact.email) {
              attendeeEmails.push(contact.email);
            }
          }

          // 3. Get email from contactName if provided
          if (contactName) {
            const contact = await Contact.findById(contactName).select('email');
            if (contact && contact.email && !attendeeEmails.includes(contact.email)) {
              attendeeEmails.push(contact.email);
            }
          }

          // Remove duplicates
          const uniqueEmails = [...new Set(attendeeEmails)];

          // Send invitations if we have emails
          if (uniqueEmails.length > 0) {
            const organizerName = `${req.user.firstName} ${req.user.lastName}`;
            await sendMeetingInvitation(meeting, uniqueEmails, organizerName);
            console.log('✅ Meeting invitations sent to:', uniqueEmails);
          } else {
            console.log('⚠️ No attendee emails found for meeting invitation');
          }
        } catch (emailError) {
          console.error('⚠️ Failed to send meeting invitation:', emailError.message);
        }
      })(); // Immediately invoked async function - fire and forget
    }

    await logActivity(req, 'meeting.created', 'Meeting', meeting._id, {
      title: meeting.title
    });

    // Send response immediately without waiting for emails
    successResponse(res, 201, 'Meeting created successfully! Email invitations are being sent.', {
      meeting
    });
    
  } catch (error) {
    console.error('Create meeting error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return errorResponse(res, 404, 'Meeting not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (meeting.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    
    const allowedFields = ['title', 'location', 'from', 'to', 'description', 'agenda', 'outcome', 'meetingType', 'status', 'participants', 'contactName'];
    allowedFields.forEach(field => { if (req.body[field] !== undefined) meeting[field] = req.body[field]; });
    meeting.lastModifiedBy = req.user._id;
    await meeting.save();
    await meeting.populate('owner', 'firstName lastName email');
    await logActivity(req, 'meeting.updated', 'Meeting', meeting._id);
    successResponse(res, 200, 'Meeting updated successfully', meeting);
  } catch (error) {
    console.error('Update meeting error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return errorResponse(res, 404, 'Meeting not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (meeting.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    
    // ============================================
    // 📧 SEND CANCELLATION EMAILS (Optional)
    // ============================================
    const { sendCancellation, cancellationReason } = req.body;
    
    if (sendCancellation) {
      try {
        const attendeeEmails = meeting.participants || [];
        
        // Get related entity email
        if (meeting.relatedTo === 'Lead' && meeting.relatedToId) {
          const lead = await Lead.findById(meeting.relatedToId).select('email');
          if (lead && lead.email) attendeeEmails.push(lead.email);
        } else if (meeting.relatedTo === 'Contact' && meeting.relatedToId) {
          const contact = await Contact.findById(meeting.relatedToId).select('email');
          if (contact && contact.email) attendeeEmails.push(contact.email);
        }
        
        const uniqueEmails = [...new Set(attendeeEmails.filter(e => e && e.includes('@')))];
        
        if (uniqueEmails.length > 0) {
          await sendMeetingCancellation(meeting, uniqueEmails, cancellationReason);
          console.log('✅ Cancellation emails sent');
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send cancellation emails:', emailError.message);
      }
    }
    
    meeting.isActive = false;
    meeting.status = 'Cancelled';
    meeting.lastModifiedBy = req.user._id;
    await meeting.save();
    
    await logActivity(req, 'meeting.deleted', 'Meeting', meeting._id, { title: meeting.title });
    successResponse(res, 200, 'Meeting deleted successfully');
  } catch (error) {
    console.error('Delete meeting error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

// ============================================
// 📧 RESEND MEETING INVITATION
// ============================================
const resendInvitation = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('host', 'firstName lastName email');
      
    if (!meeting) return errorResponse(res, 404, 'Meeting not found');
    
    // Collect emails
    const attendeeEmails = [];
    
    // From request body (specific emails)
    if (req.body.emails && Array.isArray(req.body.emails)) {
      attendeeEmails.push(...req.body.emails);
    } else {
      // From participants
      if (meeting.participants) {
        attendeeEmails.push(...meeting.participants.filter(e => e && e.includes('@')));
      }
      
      // From related entity
      if (meeting.relatedTo === 'Lead' && meeting.relatedToId) {
        const lead = await Lead.findById(meeting.relatedToId).select('email');
        if (lead && lead.email) attendeeEmails.push(lead.email);
      } else if (meeting.relatedTo === 'Contact' && meeting.relatedToId) {
        const contact = await Contact.findById(meeting.relatedToId).select('email');
        if (contact && contact.email) attendeeEmails.push(contact.email);
      }
    }
    
    const uniqueEmails = [...new Set(attendeeEmails)];
    
    if (uniqueEmails.length === 0) {
      return errorResponse(res, 400, 'No attendee emails found');
    }
    
    const organizerName = `${req.user.firstName} ${req.user.lastName}`;
    const result = await sendMeetingInvitation(meeting, uniqueEmails, organizerName);
    
    successResponse(res, 200, 'Invitation resent successfully', {
      sentTo: uniqueEmails,
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error('Resend invitation error:', error);
    errorResponse(res, 500, 'Failed to resend invitation: ' + error.message);
  }
};

module.exports = { 
  getMeetings, 
  getMeeting, 
  createMeeting, 
  updateMeeting, 
  deleteMeeting,
  resendInvitation // NEW
};