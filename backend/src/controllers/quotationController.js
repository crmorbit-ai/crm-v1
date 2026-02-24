const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const Tenant = require('../models/Tenant');
const { logActivity } = require('../middleware/activityLogger');
const { generateQuotationPDF } = require('../services/pdfService');
const emailService = require('../services/emailService');
const path = require('path');
const fs = require('fs');

exports.createQuotation = async (req, res) => {
  try {
    const quotationData = {
      ...req.body,
      tenant: req.user.tenant,
      createdBy: req.user.id
    };

    if (!quotationData.expiryDate) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      quotationData.expiryDate = expiryDate;
    }

    const quotation = new Quotation(quotationData);
    await quotation.save();

    await logActivity(req, 'quotation.created', 'Quotation', quotation._id, {
      quotationNumber: quotation.quotationNumber,
      customerName: quotation.customerName,
      totalAmount: quotation.totalAmount
    });

    res.status(201).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating quotation',
      error: error.message
    });
  }
};

exports.getQuotations = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = { tenant: req.user.tenant };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const quotations = await Quotation.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('customer')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Quotation.countDocuments(query);

    res.json({
      success: true,
      data: quotations,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quotations',
      error: error.message
    });
  }
};

exports.getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('customer')
      .populate('invoice');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quotation',
      error: error.message
    });
  }
};

exports.updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.status === 'accepted' || quotation.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update accepted or converted quotation'
      });
    }

    Object.assign(quotation, req.body);
    quotation.lastModifiedBy = req.user.id;
    await quotation.save();

    await logActivity(req, 'quotation.updated', 'Quotation', quotation._id, {
      quotationNumber: quotation.quotationNumber
    });

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating quotation',
      error: error.message
    });
  }
};

exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete quotation that has been converted to invoice'
      });
    }

    await quotation.deleteOne();

    await logActivity(req, 'quotation.deleted', 'Quotation', quotation._id, {
      quotationNumber: quotation.quotationNumber
    });

    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting quotation',
      error: error.message
    });
  }
};

exports.sendQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const { recipients, subject, message } = req.body;
    const emailList = recipients || [quotation.customerEmail];

    quotation.status = 'sent';
    quotation.sentAt = new Date();
    quotation.sentTo = emailList;
    await quotation.save();

    await logActivity(req, 'quotation.sent', 'Quotation', quotation._id, {
      quotationNumber: quotation.quotationNumber,
      recipients: emailList
    });

    res.json({
      success: true,
      message: 'Quotation sent successfully',
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending quotation',
      error: error.message
    });
  }
};

exports.convertToInvoice = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Quotation already converted to invoice'
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = new Invoice({
      tenant: quotation.tenant,
      quotation: quotation._id,
      customer: quotation.customer,
      customerModel: quotation.customerModel,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerPhone: quotation.customerPhone,
      customerAddress: quotation.customerAddress,
      title: quotation.title,
      description: quotation.description,
      items: quotation.items,
      subtotal: quotation.subtotal,
      totalDiscount: quotation.totalDiscount,
      totalTax: quotation.totalTax,
      totalAmount: quotation.totalAmount,
      invoiceDate: new Date(),
      dueDate: dueDate,
      terms: quotation.terms,
      notes: quotation.notes,
      createdBy: req.user.id
    });

    await invoice.save();

    quotation.convertedToInvoice = true;
    quotation.invoice = invoice._id;
    quotation.status = 'accepted';
    await quotation.save();

    await logActivity(req, 'quotation.converted', 'Quotation', quotation._id, {
      quotationNumber: quotation.quotationNumber,
      invoiceNumber: invoice.invoiceNumber,
      invoiceId: invoice._id
    });

    res.json({
      success: true,
      message: 'Quotation converted to invoice successfully',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error converting quotation to invoice',
      error: error.message
    });
  }
};

exports.updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    quotation.status = status;
    if (status === 'viewed' && !quotation.viewedAt) {
      quotation.viewedAt = new Date();
    }
    await quotation.save();

    await logActivity(req, 'quotation.status_updated', 'Quotation', quotation._id, {
      quotationNumber: quotation.quotationNumber,
      newStatus: status
    });

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating quotation status',
      error: error.message
    });
  }
};

exports.downloadQuotationPDF = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    }).populate('createdBy', 'firstName lastName email');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const tenant = await Tenant.findById(req.user.tenant);

    const pdfResult = await generateQuotationPDF(quotation, tenant);

    if (!pdfResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF'
      });
    }

    res.download(pdfResult.filePath, pdfResult.fileName, (err) => {
      // Delete file after download (whether successful or not)
      fs.unlink(pdfResult.filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting PDF file:', unlinkErr);
        }
      });
      if (err) {
        console.error('Error downloading PDF:', err);
      }
    });
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
};

exports.sendQuotationEmail = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    }).populate('createdBy', 'firstName lastName email');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const tenant = await Tenant.findById(req.user.tenant);
    const { recipients, subject, message } = req.body;
    const emailList = recipients || [quotation.customerEmail];

    const pdfResult = await generateQuotationPDF(quotation, tenant);

    if (!pdfResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF'
      });
    }

    console.log('📄 PDF Generated:', {
      fileName: pdfResult.fileName,
      filePath: pdfResult.filePath,
      exists: require('fs').existsSync(pdfResult.filePath)
    });

    const emailSubject = subject || `Quotation ${quotation.quotationNumber} from ${tenant.companyName || 'Unified CRM'}`;
    const emailMessage = message || `
      Dear ${quotation.customerName},

      Please find attached the quotation for your review.

      Quotation Number: ${quotation.quotationNumber}
      Quotation Date: ${new Date(quotation.quotationDate).toLocaleDateString('en-IN')}
      Valid Until: ${new Date(quotation.expiryDate).toLocaleDateString('en-IN')}
      Total Amount: ₹${quotation.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

      If you have any questions, please don't hesitate to contact us.

      Best regards,
      ${tenant.companyName || 'Unified CRM'}
    `;

    for (const email of emailList) {
      const attachmentData = [{
        filename: pdfResult.fileName,
        path: pdfResult.filePath
      }];

      console.log('📧 Sending email to:', email);
      console.log('📎 Attachment:', attachmentData);

      await emailService.sendEmail(
        req.user.id,
        {
          to: email,
          subject: emailSubject,
          text: emailMessage,
          html: emailMessage.replace(/\n/g, '<br>'),
          attachments: attachmentData
        },
        req.user.tenant
      );

      console.log('✅ Email sent successfully to:', email);
    }

    quotation.status = 'sent';
    quotation.sentAt = new Date();
    quotation.sentTo = emailList;
    await quotation.save();

    await logActivity(req, 'quotation.sent', 'Quotation', quotation._id, {
      quotationNumber: quotation.quotationNumber,
      recipients: emailList
    });

    res.json({
      success: true,
      message: 'Quotation sent successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error sending quotation email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending quotation email',
      error: error.message
    });
  }
};
