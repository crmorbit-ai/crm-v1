const RFI = require('../models/RFI');
const Quotation = require('../models/Quotation');
const Tenant = require('../models/Tenant');
const { logActivity } = require('../middleware/activityLogger');

exports.createRFI = async (req, res) => {
  try {
    const rfiData = {
      ...req.body,
      tenant: req.user.tenant,
      createdBy: req.user.id
    };

    const rfi = new RFI(rfiData);
    await rfi.save();

    await logActivity(req, 'rfi.created', 'RFI', rfi._id, {
      rfiNumber: rfi.rfiNumber,
      customerName: rfi.customerName
    });

    res.status(201).json({
      success: true,
      data: rfi
    });
  } catch (error) {
    console.error('Error creating RFI:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating RFI',
      error: error.message
    });
  }
};

exports.getRFIs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = { tenant: req.user.tenant };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { rfiNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const rfis = await RFI.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('customer')
      .populate('rfq')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await RFI.countDocuments(query);

    res.json({
      success: true,
      data: rfis,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching RFIs',
      error: error.message
    });
  }
};

exports.getRFI = async (req, res) => {
  try {
    const rfi = await RFI.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('customer')
      .populate('rfq');

    if (!rfi) {
      return res.status(404).json({
        success: false,
        message: 'RFI not found'
      });
    }

    res.json({
      success: true,
      data: rfi
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching RFI',
      error: error.message
    });
  }
};

exports.updateRFI = async (req, res) => {
  try {
    const rfi = await RFI.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!rfi) {
      return res.status(404).json({
        success: false,
        message: 'RFI not found'
      });
    }

    if (rfi.convertedToRFQ) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update RFI that has been converted to quotation'
      });
    }

    Object.assign(rfi, req.body);
    await rfi.save();

    await logActivity(req, 'rfi.updated', 'RFI', rfi._id, {
      rfiNumber: rfi.rfiNumber
    });

    res.json({
      success: true,
      data: rfi
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating RFI',
      error: error.message
    });
  }
};

exports.deleteRFI = async (req, res) => {
  try {
    const rfi = await RFI.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!rfi) {
      return res.status(404).json({
        success: false,
        message: 'RFI not found'
      });
    }

    if (rfi.convertedToRFQ) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete RFI that has been converted to quotation'
      });
    }

    await rfi.deleteOne();

    await logActivity(req, 'rfi.deleted', 'RFI', rfi._id, {
      rfiNumber: rfi.rfiNumber
    });

    res.json({
      success: true,
      message: 'RFI deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting RFI',
      error: error.message
    });
  }
};

exports.convertToQuotation = async (req, res) => {
  try {
    const rfi = await RFI.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!rfi) {
      return res.status(404).json({
        success: false,
        message: 'RFI not found'
      });
    }

    if (rfi.convertedToRFQ) {
      return res.status(400).json({
        success: false,
        message: 'RFI already converted to quotation'
      });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const quotation = new Quotation({
      tenant: rfi.tenant,
      customer: rfi.customer,
      customerModel: rfi.customerModel,
      customerName: rfi.customerName,
      customerEmail: rfi.customerEmail,
      customerPhone: rfi.customerPhone,
      customerAddress: rfi.customerAddress,
      title: rfi.title,
      description: rfi.description,
      quotationDate: new Date(),
      expiryDate: expiryDate,
      createdBy: req.user.id,
      ...req.body
    });

    await quotation.save();

    rfi.convertedToRFQ = true;
    rfi.rfq = quotation._id;
    rfi.status = 'converted';
    await rfi.save();

    await logActivity(req, 'rfi.converted', 'RFI', rfi._id, {
      rfiNumber: rfi.rfiNumber,
      quotationNumber: quotation.quotationNumber,
      quotationId: quotation._id
    });

    res.json({
      success: true,
      message: 'RFI converted to quotation successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error converting RFI to quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error converting RFI to quotation',
      error: error.message
    });
  }
};

exports.updateRFIStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const rfi = await RFI.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!rfi) {
      return res.status(404).json({
        success: false,
        message: 'RFI not found'
      });
    }

    rfi.status = status;
    if (status === 'responded' && !rfi.responseDate) {
      rfi.responseDate = new Date();
    }
    await rfi.save();

    await logActivity(req, 'rfi.status_updated', 'RFI', rfi._id, {
      rfiNumber: rfi.rfiNumber,
      newStatus: status
    });

    res.json({
      success: true,
      data: rfi
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating RFI status',
      error: error.message
    });
  }
};
