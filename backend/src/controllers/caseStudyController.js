const CaseStudy = require('../models/CaseStudy');
const cloudinary = require('../config/cloudinary');

const mkErr = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const SAAS_TYPES = ['SAAS_OWNER', 'SAAS_ADMIN'];
const isSaasUser = (user) => SAAS_TYPES.includes(user.userType);

/* ══════════════════════════════════════════════════════════
   PUBLIC API - No Auth Required
══════════════════════════════════════════════════════════ */

/* Get all published case studies for landing page */
exports.getPublishedCaseStudies = async (req, res, next) => {
  try {
    const { category, tag, limit = 10, page = 1 } = req.query;

    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      CaseStudy.find(filter)
        .sort({ isFeatured: -1, displayOrder: -1, publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-createdBy -lastModifiedBy')
        .lean(),
      CaseStudy.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (e) {
    next(e);
  }
};

/* Get single published case study by slug */
exports.getPublishedCaseStudyBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const caseStudy = await CaseStudy.findOne({
      slug,
      isPublished: true
    }).select('-createdBy -lastModifiedBy');

    if (!caseStudy) {
      throw mkErr('Case study not found', 404);
    }

    // Increment views
    caseStudy.views += 1;
    await caseStudy.save();

    res.json({ success: true, data: caseStudy });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   SAAS ADMIN API - Protected
══════════════════════════════════════════════════════════ */

/* Get all case studies (SAAS Admin only) */
exports.getAllCaseStudies = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied. SAAS admin only.', 403);
    }

    const { page = 1, limit = 20, status, category, search } = req.query;
    const filter = {};

    if (status === 'published') filter.isPublished = true;
    if (status === 'draft') filter.isPublished = false;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      CaseStudy.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email')
        .lean(),
      CaseStudy.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (e) {
    next(e);
  }
};

/* Get single case study by ID (SAAS Admin only) */
exports.getCaseStudyById = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied. SAAS admin only.', 403);
    }

    const caseStudy = await CaseStudy.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!caseStudy) {
      throw mkErr('Case study not found', 404);
    }

    res.json({ success: true, data: caseStudy });
  } catch (e) {
    next(e);
  }
};

/* Create case study (SAAS Admin only) */
exports.createCaseStudy = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied. SAAS admin only.', 403);
    }

    const caseStudyData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Parse JSON fields if they are strings
    const jsonFields = ['tags', 'results', 'timeline', 'productsUsed', 'beforeAfter',
                        'location', 'stakeholder', 'testimonial', 'duration',
                        'roi', 'financialImpact'];

    jsonFields.forEach(field => {
      if (typeof caseStudyData[field] === 'string') {
        try {
          caseStudyData[field] = JSON.parse(caseStudyData[field]);
        } catch (e) {
          // If parsing fails, handle special cases
          if (field === 'tags' && caseStudyData[field]) {
            caseStudyData[field] = caseStudyData[field].split(',').map(t => t.trim()).filter(Boolean);
          } else {
            caseStudyData[field] = undefined;
          }
        }
      }
    });

    // Handle file uploads if present
    if (req.files) {
      if (req.files.featuredImage) {
        const result = await cloudinary.uploader.upload(req.files.featuredImage[0].path, {
          folder: 'case-studies/featured'
        });
        caseStudyData.featuredImage = {
          url: result.secure_url,
          public_id: result.public_id
        };
      }

      if (req.files.clientLogo) {
        const result = await cloudinary.uploader.upload(req.files.clientLogo[0].path, {
          folder: 'case-studies/logos'
        });
        caseStudyData.clientLogo = {
          url: result.secure_url,
          public_id: result.public_id
        };
      }

      if (req.files.pdfDocument) {
        const result = await cloudinary.uploader.upload(req.files.pdfDocument[0].path, {
          folder: 'case-studies/pdfs',
          resource_type: 'raw', // Important for PDFs
          format: 'pdf'
        });
        caseStudyData.pdfDocument = {
          url: result.secure_url,
          public_id: result.public_id,
          filename: req.files.pdfDocument[0].originalname
        };
      }

      if (req.files.stakeholderPhoto) {
        const result = await cloudinary.uploader.upload(req.files.stakeholderPhoto[0].path, {
          folder: 'case-studies/stakeholders'
        });
        caseStudyData.stakeholder = {
          ...caseStudyData.stakeholder,
          photo: {
            url: result.secure_url,
            public_id: result.public_id
          }
        };
      }
    }

    // Handle status - Draft, Publish, or Schedule
    if (caseStudyData.status === 'scheduled' && caseStudyData.scheduledPublishDate) {
      const scheduleDate = new Date(caseStudyData.scheduledPublishDate);
      const now = new Date();

      if (scheduleDate > now) {
        // Valid future date
        caseStudyData.status = 'scheduled';
        caseStudyData.isPublished = false;
      } else {
        // Past date, publish immediately
        caseStudyData.status = 'published';
        caseStudyData.isPublished = true;
        caseStudyData.publishedAt = new Date();
      }
    } else if (caseStudyData.status === 'published') {
      caseStudyData.isPublished = true;
      caseStudyData.publishedAt = new Date();
    } else {
      // Default to draft
      caseStudyData.status = 'draft';
      caseStudyData.isPublished = false;
    }

    const caseStudy = await CaseStudy.create(caseStudyData);

    // Emit socket event for real-time update on landing page
    if (global.io && caseStudy.isPublished) {
      global.io.emit('case-study-published', {
        action: 'created',
        caseStudy: {
          _id: caseStudy._id,
          slug: caseStudy.slug,
          title: caseStudy.title,
          shortDescription: caseStudy.shortDescription,
          clientName: caseStudy.clientName,
          clientLogo: caseStudy.clientLogo,
          industry: caseStudy.industry,
          category: caseStudy.category,
          featuredImage: caseStudy.featuredImage,
          results: caseStudy.results
        }
      });
    }

    let message = 'Case study created successfully';
    if (caseStudy.status === 'draft') {
      message = 'Case study saved as draft 📝';
    } else if (caseStudy.status === 'published') {
      message = 'Case study published successfully! 🎉';
    } else if (caseStudy.status === 'scheduled') {
      const scheduleDate = new Date(caseStudy.scheduledPublishDate);
      message = `Case study scheduled for ${scheduleDate.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
      })} ⏰`;
    }

    res.status(201).json({
      success: true,
      message,
      data: caseStudy
    });
  } catch (e) {
    console.error('❌ Case study creation error:', e);
    next(e);
  }
};

/* Update case study (SAAS Admin only) */
exports.updateCaseStudy = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied. SAAS admin only.', 403);
    }

    const caseStudy = await CaseStudy.findById(req.params.id);
    if (!caseStudy) {
      throw mkErr('Case study not found', 404);
    }

    // Parse JSON fields if they are strings
    const jsonFields = ['tags', 'results', 'timeline', 'productsUsed', 'beforeAfter',
                        'location', 'stakeholder', 'testimonial', 'duration',
                        'roi', 'financialImpact'];

    jsonFields.forEach(field => {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          if (field === 'tags' && req.body[field]) {
            req.body[field] = req.body[field].split(',').map(t => t.trim()).filter(Boolean);
          } else {
            req.body[field] = undefined;
          }
        }
      }
    });

    // Handle file uploads
    if (req.files) {
      if (req.files.featuredImage) {
        // Delete old image from cloudinary
        if (caseStudy.featuredImage?.public_id) {
          await cloudinary.uploader.destroy(caseStudy.featuredImage.public_id);
        }
        const result = await cloudinary.uploader.upload(req.files.featuredImage[0].path, {
          folder: 'case-studies/featured'
        });
        req.body.featuredImage = {
          url: result.secure_url,
          public_id: result.public_id
        };
      }

      if (req.files.clientLogo) {
        // Delete old logo
        if (caseStudy.clientLogo?.public_id) {
          await cloudinary.uploader.destroy(caseStudy.clientLogo.public_id);
        }
        const result = await cloudinary.uploader.upload(req.files.clientLogo[0].path, {
          folder: 'case-studies/logos'
        });
        req.body.clientLogo = {
          url: result.secure_url,
          public_id: result.public_id
        };
      }
    }

    Object.assign(caseStudy, req.body, { lastModifiedBy: req.user._id });
    await caseStudy.save();

    res.json({
      success: true,
      message: 'Case study updated successfully',
      data: caseStudy
    });
  } catch (e) {
    console.error('❌ Case study update error:', e);
    next(e);
  }
};

/* Delete case study (SAAS Admin only) */
exports.deleteCaseStudy = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied. SAAS admin only.', 403);
    }

    const caseStudy = await CaseStudy.findById(req.params.id);
    if (!caseStudy) {
      throw mkErr('Case study not found', 404);
    }

    // Delete associated images from cloudinary
    if (caseStudy.featuredImage?.public_id) {
      await cloudinary.uploader.destroy(caseStudy.featuredImage.public_id);
    }
    if (caseStudy.clientLogo?.public_id) {
      await cloudinary.uploader.destroy(caseStudy.clientLogo.public_id);
    }
    if (caseStudy.images?.length) {
      for (const img of caseStudy.images) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
    }

    await CaseStudy.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Case study deleted successfully'
    });
  } catch (e) {
    next(e);
  }
};

/* Toggle publish status (SAAS Admin only) */
exports.togglePublishStatus = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied. SAAS admin only.', 403);
    }

    const caseStudy = await CaseStudy.findById(req.params.id);
    if (!caseStudy) {
      throw mkErr('Case study not found', 404);
    }

    caseStudy.isPublished = !caseStudy.isPublished;
    if (caseStudy.isPublished && !caseStudy.publishedAt) {
      caseStudy.publishedAt = new Date();
    }
    caseStudy.lastModifiedBy = req.user._id;
    await caseStudy.save();

    // Emit socket event for real-time update
    if (global.io) {
      global.io.emit('case-study-published', {
        action: caseStudy.isPublished ? 'published' : 'unpublished',
        caseStudyId: caseStudy._id
      });
    }

    res.json({
      success: true,
      message: `Case study ${caseStudy.isPublished ? 'published' : 'unpublished'} successfully`,
      data: caseStudy
    });
  } catch (e) {
    next(e);
  }
};

/* Upload additional images (SAAS Admin only) */
exports.uploadImages = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied. SAAS admin only.', 403);
    }

    const caseStudy = await CaseStudy.findById(req.params.id);
    if (!caseStudy) {
      throw mkErr('Case study not found', 404);
    }

    if (!req.files || req.files.length === 0) {
      throw mkErr('No images provided', 400);
    }

    const uploadedImages = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'case-studies/gallery'
      });
      uploadedImages.push({
        url: result.secure_url,
        public_id: result.public_id,
        caption: req.body.caption || ''
      });
    }

    caseStudy.images = [...(caseStudy.images || []), ...uploadedImages];
    caseStudy.lastModifiedBy = req.user._id;
    await caseStudy.save();

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: caseStudy
    });
  } catch (e) {
    next(e);
  }
};

/* Remove image (SAAS Admin only) */
exports.removeImage = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied. SAAS admin only.', 403);
    }

    const { id, imageId } = req.params;
    const caseStudy = await CaseStudy.findById(id);

    if (!caseStudy) {
      throw mkErr('Case study not found', 404);
    }

    const image = caseStudy.images.id(imageId);
    if (!image) {
      throw mkErr('Image not found', 404);
    }

    // Delete from cloudinary
    if (image.public_id) {
      await cloudinary.uploader.destroy(image.public_id);
    }

    caseStudy.images.pull(imageId);
    caseStudy.lastModifiedBy = req.user._id;
    await caseStudy.save();

    res.json({
      success: true,
      message: 'Image removed successfully',
      data: caseStudy
    });
  } catch (e) {
    next(e);
  }
};
