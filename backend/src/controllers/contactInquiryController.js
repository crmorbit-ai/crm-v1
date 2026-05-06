const ContactInquiry = require('../models/ContactInquiry');
const { sendContactInquiryReply } = require('../utils/emailService');

const successResponse = (res, status, message, data = {}) =>
  res.status(status).json({ success: true, message, ...data });

const errorResponse = (res, status, message) =>
  res.status(status).json({ success: false, message });

// Public — Submit contact form
const submitInquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return errorResponse(res, 400, 'Please fill in all required fields');
    }

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 400, 'Please enter a valid email address');
    }

    if (name.trim().length < 2) {
      return errorResponse(res, 400, 'Name must be at least 2 characters');
    }

    if (message.trim().length < 10) {
      return errorResponse(res, 400, 'Message must be at least 10 characters');
    }

    const inquiry = await ContactInquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      subject,
      message: message.trim(),
      ipAddress: req.ip || '',
    });

    return successResponse(res, 201, 'Your message has been sent successfully! We will get back to you soon.', {
      inquiry: { id: inquiry._id, name: inquiry.name, subject: inquiry.subject }
    });

  } catch (error) {
    console.error('Contact inquiry error:', error);
    return errorResponse(res, 500, 'Failed to send message. Please try again.');
  }
};

// SAAS Admin — Get all inquiries
const getAllInquiries = async (req, res) => {
  try {
    const { status, subject, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'All') filter.status = status;
    if (subject && subject !== 'All') filter.subject = subject;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await ContactInquiry.countDocuments(filter);
    const inquiries = await ContactInquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const stats = {
      total: await ContactInquiry.countDocuments(),
      New: await ContactInquiry.countDocuments({ status: 'New' }),
      Read: await ContactInquiry.countDocuments({ status: 'Read' }),
      Replied: await ContactInquiry.countDocuments({ status: 'Replied' }),
    };

    return successResponse(res, 200, 'Inquiries fetched', { inquiries, total, stats, page: Number(page), pages: Math.ceil(total / limit) });

  } catch (error) {
    console.error('Get inquiries error:', error);
    return errorResponse(res, 500, 'Failed to fetch inquiries');
  }
};

// SAAS Admin — Update status
const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const allowed = ['New', 'Read', 'Replied'];
    if (status && !allowed.includes(status)) {
      return errorResponse(res, 400, 'Invalid status');
    }

    const inquiry = await ContactInquiry.findByIdAndUpdate(
      id,
      { ...(status && { status }), ...(adminNote !== undefined && { adminNote }) },
      { new: true }
    );

    if (!inquiry) return errorResponse(res, 404, 'Inquiry not found');

    return successResponse(res, 200, 'Inquiry updated', { inquiry });

  } catch (error) {
    console.error('Update inquiry error:', error);
    return errorResponse(res, 500, 'Failed to update inquiry');
  }
};

// SAAS Admin — Delete inquiry
const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return errorResponse(res, 404, 'Inquiry not found');
    return successResponse(res, 200, 'Inquiry deleted');
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete inquiry');
  }
};

// SAAS Admin — Reply to inquiry (sends email to sender)
const replyToInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;

    if (!replyText || !replyText.trim()) {
      return errorResponse(res, 400, 'Reply text is required');
    }

    const inquiry = await ContactInquiry.findById(id);
    if (!inquiry) return errorResponse(res, 404, 'Inquiry not found');

    await sendContactInquiryReply({
      toName: inquiry.name,
      toEmail: inquiry.email,
      subject: inquiry.subject,
      originalMessage: inquiry.message,
      replyText: replyText.trim(),
    });

    const updated = await ContactInquiry.findByIdAndUpdate(
      id,
      { status: 'Replied', adminReply: replyText.trim(), repliedAt: new Date() },
      { new: true }
    );

    return successResponse(res, 200, 'Reply sent successfully', { inquiry: updated });
  } catch (error) {
    console.error('Reply inquiry error:', error);
    return errorResponse(res, 500, 'Failed to send reply: ' + error.message);
  }
};

module.exports = { submitInquiry, getAllInquiries, updateInquiryStatus, deleteInquiry, replyToInquiry };
