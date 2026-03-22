const DocumentTemplate = require('../models/DocumentTemplate');
const { successResponse, errorResponse } = require('../utils/response');
const crypto = require('crypto');

// ── GET all (own + shared with me) ──────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { category, format, search } = req.query;
    const query = {
      tenant: req.user.tenant,
      isActive: true,
      $or: [
        { createdBy: req.user._id },
        { 'sharedWith.user': req.user._id },
        { isPublic: true }
      ]
    };
    if (category) query.category = category;
    if (format)   query.format   = format;
    if (search)   query.title    = { $regex: search, $options: 'i' };

    const docs = await DocumentTemplate.find(query)
      .populate('createdBy', 'name email')
      .populate('sharedWith.user', 'name email')
      .sort({ updatedAt: -1 });

    return successResponse(res, 200, 'Document templates fetched', docs);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ── GET one ─────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const doc = await DocumentTemplate.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      isActive: true
    }).populate('createdBy', 'name email').populate('sharedWith.user', 'name email');

    if (!doc) return errorResponse(res, 404, 'Document template not found');
    doc.usageCount += 1;
    await doc.save();
    return successResponse(res, 200, 'Fetched', doc);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ── GET by share token (public) ──────────────────────────────────
exports.getByShareToken = async (req, res) => {
  try {
    const doc = await DocumentTemplate.findOne({
      shareToken: req.params.token,
      isPublic: true,
      isActive: true
    }).populate('createdBy', 'name');

    if (!doc) return errorResponse(res, 404, 'Link is invalid or expired');
    return successResponse(res, 200, 'Fetched', doc);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ── CREATE ───────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { title, description, category, content, format, icon, color } = req.body;
    if (!title) return errorResponse(res, 400, 'Title is required');

    const doc = await DocumentTemplate.create({
      tenant: req.user.tenant,
      createdBy: req.user._id,
      title, description, category, content,
      format: format || 'word',
      icon: icon || '📄',
      color: color || '#2563eb'
    });

    return successResponse(res, 201, 'Document template created', doc);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ── UPDATE ───────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const doc = await DocumentTemplate.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    if (!doc) return errorResponse(res, 404, 'Not found');

    const fields = ['title','description','category','content','format','icon','color'];
    fields.forEach(f => { if (req.body[f] !== undefined) doc[f] = req.body[f]; });
    await doc.save();
    return successResponse(res, 200, 'Updated', doc);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ── DELETE ───────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    await DocumentTemplate.findOneAndUpdate(
      { _id: req.params.id, tenant: req.user.tenant },
      { isActive: false }
    );
    return successResponse(res, 200, 'Deleted');
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ── SHARE: generate public link ───────────────────────────────────
exports.generateShareLink = async (req, res) => {
  try {
    const doc = await DocumentTemplate.findOne({
      _id: req.params.id, tenant: req.user.tenant
    });
    if (!doc) return errorResponse(res, 404, 'Not found');

    doc.isPublic = true;
    if (!doc.shareToken) doc.shareToken = crypto.randomBytes(16).toString('hex');
    await doc.save();

    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/doc-templates/shared/${doc.shareToken}`;
    return successResponse(res, 200, 'Share link generated', { link, shareToken: doc.shareToken });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ── SHARE: revoke public link ─────────────────────────────────────
exports.revokeShareLink = async (req, res) => {
  try {
    await DocumentTemplate.findOneAndUpdate(
      { _id: req.params.id, tenant: req.user.tenant },
      { isPublic: false }
    );
    return successResponse(res, 200, 'Link revoked');
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ── SHARE: share with team users ─────────────────────────────────
exports.shareWithUsers = async (req, res) => {
  try {
    const { userIds, permission = 'view' } = req.body; // userIds: array
    const doc = await DocumentTemplate.findOne({
      _id: req.params.id, tenant: req.user.tenant
    });
    if (!doc) return errorResponse(res, 404, 'Not found');

    userIds.forEach(uid => {
      const existing = doc.sharedWith.find(s => s.user.toString() === uid);
      if (existing) {
        existing.permission = permission;
      } else {
        doc.sharedWith.push({ user: uid, permission });
      }
    });
    await doc.save();
    await doc.populate('sharedWith.user', 'name email');
    return successResponse(res, 200, 'Shared with team', doc.sharedWith);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ── SHARE: remove user ────────────────────────────────────────────
exports.removeSharedUser = async (req, res) => {
  try {
    const doc = await DocumentTemplate.findOne({
      _id: req.params.id, tenant: req.user.tenant
    });
    if (!doc) return errorResponse(res, 404, 'Not found');

    doc.sharedWith = doc.sharedWith.filter(s => s.user.toString() !== req.params.userId);
    await doc.save();
    return successResponse(res, 200, 'Removed');
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ── DOWNLOAD ─────────────────────────────────────────────────────
exports.download = async (req, res) => {
  try {
    const doc = await DocumentTemplate.findOne({
      _id: req.params.id, isActive: true,
      $or: [
        { tenant: req.user.tenant },
        { isPublic: true }
      ]
    });
    if (!doc) return errorResponse(res, 404, 'Not found');

    const format = req.params.format || doc.format;

    const safeTitle = doc.title.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_') || 'document';

    const stripHtml = (html) => (html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\r\n/g, '\n')
      .trim();

    const sendFile = (buffer, contentType, filename) => {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Encoding', 'identity'); // prevent gzip corruption
      res.setHeader('Cache-Control', 'no-cache');
      res.end(buffer);
    };

    if (format === 'word') {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

      const lines = stripHtml(doc.content).split('\n').filter(l => l.trim());

      const children = [
        new Paragraph({ text: doc.title, heading: HeadingLevel.HEADING_1 }),
      ];
      if (doc.description) {
        children.push(new Paragraph({
          children: [new TextRun({ text: doc.description, italics: true, color: '64748b', size: 22 })]
        }));
      }
      children.push(new Paragraph({ text: '' }));
      lines.forEach(line => {
        children.push(new Paragraph({
          children: [new TextRun({ text: line.trim(), size: 24 })]
        }));
      });

      const wordDoc = new Document({ sections: [{ properties: {}, children }] });
      const buffer = await Packer.toBuffer(wordDoc);
      return sendFile(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', `${safeTitle}.docx`);
    }

    if (format === 'excel') {
      const XLSX = require('xlsx');
      const lines = stripHtml(doc.content).split('\n').filter(l => l.trim());

      const wsData = [
        [doc.title],
        [doc.description || ''],
        [],
        ...lines.map(l => [l.trim()])
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 80 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Document');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      return sendFile(buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `${safeTitle}.xlsx`);
    }

    if (format === 'powerpoint') {
      const pptxgen = require('pptxgenjs');
      const pptx = new pptxgen();
      const lines = stripHtml(doc.content).split('\n').filter(l => l.trim());

      // Title slide
      let slide = pptx.addSlide();
      slide.addText(doc.title, { x: 0.5, y: 1.5, w: '90%', h: 1.5, fontSize: 36, bold: true, color: '1252E3', align: 'center' });
      if (doc.description) {
        slide.addText(doc.description, { x: 0.5, y: 3.2, w: '90%', h: 0.8, fontSize: 16, color: '64748b', align: 'center' });
      }

      // Content slides (max 6 lines per slide)
      const chunkSize = 6;
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        slide = pptx.addSlide();
        slide.addText(doc.title, { x: 0.5, y: 0.3, w: '90%', h: 0.5, fontSize: 18, bold: true, color: '0f172a' });
        slide.addText(
          chunk.map((l, idx) => ({ text: `${i + idx + 1}. ${l}`, options: { bullet: false, breakLine: true } })),
          { x: 0.5, y: 1.0, w: '90%', h: 4.5, fontSize: 14, color: '374151', valign: 'top' }
        );
      }

      const buffer = await pptx.write({ outputType: 'nodebuffer' });
      return sendFile(buffer, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', `${safeTitle}.pptx`);
    }

    return errorResponse(res, 400, 'Invalid format');
  } catch (err) {
    console.error('Download error:', err);
    return errorResponse(res, 500, err.message);
  }
};
