const PDFDocument = require('pdfkit');
const axios = require('axios');
const sharp = require('sharp');

/**
 * Generate Professional Proposal PDF - Clean Style
 */
const generateProposalPDF = async (proposal, tenant) => {
  // Download and process logo if URL
  let logoBuffer = null;
  const logoToUse = tenant.invoiceLogo || tenant.logo;
  if (logoToUse && logoToUse.startsWith('http')) {
    try {
      const response = await axios.get(logoToUse, { responseType: 'arraybuffer' });
      logoBuffer = await sharp(Buffer.from(response.data))
        .resize(140, 70, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } catch (err) {
      console.log('Logo download error:', err.message);
    }
  }

  // Download and process signature if URL
  let signatureBuffer = null;
  if (tenant.signature && tenant.signature.startsWith('http')) {
    try {
      const response = await axios.get(tenant.signature, { responseType: 'arraybuffer' });
      signatureBuffer = await sharp(Buffer.from(response.data))
        .resize(180, 60, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } catch (err) {
      console.log('Signature download error:', err.message);
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true
      });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Currency symbol - Fix superscript issue
      const getCurrencySymbol = (currency) => {
        const symbols = {
          'USD': '$',
          'EUR': '€',
          'GBP': '£',
          'INR': '₹'
        };
        return symbols[currency] || '₹';
      };
      const currencySymbol = getCurrencySymbol(proposal.currency);

      // ==================== HEADER ====================
      let yPos = 50;

      // Company Name - Left side
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937')
         .text(tenant.organizationName || 'Company Name', 50, yPos, { width: 300 });

      // Company Logo - Right side VERY TOP
      const logoX = 460;
      const logoY = 30; // Maximum upar
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, logoX, logoY, { width: 90 });
        } catch (err) {
          console.log('Logo render error:', err.message);
        }
      }

      // Date and RFP - Right side, below logo
      const dateX = 460;
      const dateY = 95; // Logo ke neeche
      doc.fontSize(7).font('Helvetica').fillColor('#1f2937');

      const dateText = `date- ${new Date(proposal.proposalDate).toLocaleDateString('en-GB')}`;
      doc.text(dateText, dateX, dateY, { width: 95, align: 'left' });

      // Clean RFP number
      const rfpText = proposal.rfpNumber ? String(proposal.rfpNumber).replace(/[^a-zA-Z0-9\/\-\s]/g, '').trim() : '';
      if (rfpText) {
        doc.text(rfpText, dateX, dateY + 9, { width: 95, align: 'left' });
      }

      yPos = 135;

      // ==================== TITLE ====================
      // Clean title - remove all special/unicode characters except basic punctuation
      const cleanTitle = (proposal.title || 'BUSINESS PROPOSAL').replace(/[^a-zA-Z0-9\s\&\-\,\.]/g, '').trim();
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#f97316')
         .text(cleanTitle, 50, yPos, { width: 495 });

      yPos += 42;

      // Info section - compact
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
      doc.text(`Proposal No: ${proposal.proposalNumber}`, 50, yPos);
      yPos += 12;
      doc.text(`Date: ${new Date(proposal.proposalDate).toLocaleDateString('en-IN')}`, 50, yPos);
      yPos += 12;
      if (rfpText) {
        doc.text(`RFP/Reference: ${rfpText}`, 50, yPos);
        yPos += 12;
      }
      doc.text(`Valid Until: ${new Date(proposal.validUntil).toLocaleDateString('en-IN')}`, 50, yPos);

      yPos += 25;

      // Customer Info Box - compact
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1f2937')
         .text('TO:', 50, yPos);

      yPos += 15;
      doc.fontSize(10).font('Helvetica-Bold')
         .text(proposal.customerName, 50, yPos);

      yPos += 13;
      if (proposal.customerEmail) {
        doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
           .text(proposal.customerEmail, 50, yPos);
        yPos += 11;
      }
      if (proposal.customerPhone) {
        doc.text(proposal.customerPhone, 50, yPos);
        yPos += 11;
      }

      yPos += 25;

      // ==================== SECTIONS ====================
      if (proposal.sections && proposal.sections.length > 0) {
        proposal.sections.forEach((section) => {
          // Only add page if really needed
          const estimatedHeight = 80 + (section.content ? section.content.length / 8 : 0);
          if (yPos + estimatedHeight > 750) {
            doc.addPage();
            yPos = 50;
          }

          // Section Title - Orange compact
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#f97316')
             .text(section.title, 50, yPos);

          yPos += 18;

          // Section Content - smaller font, less gap
          doc.fontSize(9).font('Helvetica').fillColor('#374151')
             .text(section.content || '', 50, yPos, { width: 495, align: 'justify', lineGap: 0.5 });

          const contentHeight = doc.heightOfString(section.content || '', { width: 495, lineGap: 0.5 });
          yPos += contentHeight + 18;
        });
      }

      // ==================== TIMELINE ====================
      if (proposal.milestones && proposal.milestones.length > 0) {
        const estimatedTableHeight = 100 + (proposal.milestones.length * 25);
        if (yPos + estimatedTableHeight > 750) { doc.addPage(); yPos = 50; }

        // Section Title
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#f97316')
           .text('Project Timeline', 50, yPos);

        yPos += 22;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
           .text('Estimated Duration (approx):', 50, yPos);

        yPos += 18;

        // Simple bordered table
        const tableTop = yPos;
        const col1X = 50;
        const col2X = 400;
        const rowHeight = 25;

        // Header
        doc.rect(col1X, tableTop, 495, rowHeight).strokeColor('#f97316').lineWidth(1.5).stroke();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Milestones', col1X + 10, tableTop + 8);
        doc.text('Duration (in Week)', col2X + 10, tableTop + 8);

        let currentY = tableTop + rowHeight;

        // Rows
        proposal.milestones.forEach((milestone) => {
          doc.rect(col1X, currentY, 495, rowHeight).strokeColor('#000000').lineWidth(0.5).stroke();
          doc.fontSize(9).font('Helvetica').fillColor('#000000');
          doc.text(milestone.name, col1X + 10, currentY + 8, { width: 340 });

          // Convert duration to weeks if needed
          let durationInWeeks = milestone.duration;
          if (milestone.durationUnit === 'Month' || milestone.durationUnit === 'Months') {
            durationInWeeks = milestone.duration * 4;
          } else if (milestone.durationUnit === 'Day' || milestone.durationUnit === 'Days') {
            durationInWeeks = Math.ceil(milestone.duration / 7);
          }

          doc.text(durationInWeeks.toString(), col2X + 10, currentY + 8);

          currentY += rowHeight;
        });

        // Total row
        doc.rect(col1X, currentY, 495, rowHeight).fillAndStroke('#fff5e6', '#f97316');
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Total Duration', col1X + 10, currentY + 8);

        const totalWeeks = proposal.milestones.reduce((sum, m) => {
          let weeks = m.duration;
          if (m.durationUnit === 'Month' || m.durationUnit === 'Months') weeks = m.duration * 4;
          else if (m.durationUnit === 'Day' || m.durationUnit === 'Days') weeks = Math.ceil(m.duration / 7);
          return sum + weeks;
        }, 0);

        doc.fillColor('#f97316').text(`${totalWeeks} Weeks`, col2X + 10, currentY + 8);

        yPos = currentY + rowHeight + 22;
      }

      // ==================== BUDGET ====================
      if (proposal.resources && proposal.resources.length > 0) {
        const estimatedTableHeight = 120 + (proposal.resources.length * 25);
        if (yPos + estimatedTableHeight > 750) { doc.addPage(); yPos = 50; }

        // Section Title
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#f97316')
           .text('Project Budget (Cost Estimation)', 50, yPos);

        yPos += 22;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
           .text('Resource Engagement:', 50, yPos);

        yPos += 18;

        // Simple 3-column table
        const tableTop = yPos;
        const col1X = 50;
        const col2X = 350;
        const col3X = 430;
        const rowHeight = 25;

        // Header
        doc.rect(col1X, tableTop, 495, rowHeight).strokeColor('#f97316').lineWidth(1.5).stroke();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Role of Resource', col1X + 10, tableTop + 8);
        doc.text('Man Power', col2X + 10, tableTop + 8);
        doc.text(`Cost (in ${proposal.currency})`, col3X + 10, tableTop + 8);

        let currentY = tableTop + rowHeight;

        // Rows
        proposal.resources.forEach((resource) => {
          doc.rect(col1X, currentY, 495, rowHeight).strokeColor('#000000').lineWidth(0.5).stroke();
          doc.fontSize(9).font('Helvetica').fillColor('#000000');
          doc.text(resource.role, col1X + 10, currentY + 8, { width: 290 });
          doc.text(resource.count.toString(), col2X + 25, currentY + 8);
          // Add currency symbol before amount
          doc.text(`${currencySymbol} ${resource.total.toLocaleString('en-IN')}`, col3X + 10, currentY + 8);

          currentY += rowHeight;
        });

        // Total row
        doc.rect(col1X, currentY, 495, rowHeight).fillAndStroke('#fff5e6', '#f97316');
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Total Cost', col1X + 10, currentY + 8);
        doc.fillColor('#3b82f6').text(`${currencySymbol} ${(proposal.subtotal || 0).toLocaleString('en-IN')}`, col3X + 10, currentY + 8);

        yPos = currentY + rowHeight + 22;
      }

      // ==================== PAYMENT TERMS ====================
      if (proposal.paymentTerms && proposal.paymentTerms.length > 0) {
        const estimatedTableHeight = 120 + (proposal.paymentTerms.length * 25);
        if (yPos + estimatedTableHeight > 750) { doc.addPage(); yPos = 50; }

        // Section Title
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#f97316')
           .text('Payment for Project Budget', 50, yPos);

        yPos += 22;

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
           .text('Payment Terms & Breakup:', 50, yPos);

        yPos += 20;

        // Simple 3-column table
        const tableTop = yPos;
        const col1X = 50;
        const col2X = 380;
        const col3X = 460;
        const rowHeight = 25;

        // Header
        doc.rect(col1X, tableTop, 495, rowHeight).strokeColor('#f97316').lineWidth(1.5).stroke();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Payment Terms', col1X + 10, tableTop + 8);
        doc.text('% of Total Cost', col2X + 5, tableTop + 8);
        doc.text(`Amount (in ${proposal.currency})`, col3X + 5, tableTop + 8);

        let currentY = tableTop + rowHeight;

        // Rows
        proposal.paymentTerms.forEach((term) => {
          doc.rect(col1X, currentY, 495, rowHeight).strokeColor('#000000').lineWidth(0.5).stroke();
          doc.fontSize(9).font('Helvetica').fillColor('#000000');
          doc.text(term.milestone, col1X + 10, currentY + 8, { width: 320 });
          doc.text(`${term.percentage}%`, col2X + 20, currentY + 8);
          // Add currency symbol before amount
          doc.text(`${currencySymbol} ${term.amount.toLocaleString('en-IN')}`, col3X + 5, currentY + 8);

          currentY += rowHeight;
        });

        // Total row
        const totalPercentage = proposal.paymentTerms.reduce((sum, t) => sum + t.percentage, 0);
        const totalAmount = proposal.paymentTerms.reduce((sum, t) => sum + t.amount, 0);

        doc.rect(col1X, currentY, 495, rowHeight).fillAndStroke('#e6f2ff', '#3b82f6');
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Total Payment', col1X + 10, currentY + 8);
        doc.fillColor('#3b82f6').text(`${totalPercentage}%`, col2X + 20, currentY + 8);
        doc.text(`${currencySymbol} ${totalAmount.toLocaleString('en-IN')}`, col3X + 5, currentY + 8);

        yPos = currentY + rowHeight + 22;
      }

      // ==================== TERMS & NOTES ====================
      if (proposal.terms || proposal.notes) {
        // Only add page if really needed
        const estimatedHeight = 100;
        if (yPos + estimatedHeight > 750) { doc.addPage(); yPos = 50; }

        if (proposal.terms) {
          doc.fontSize(13).font('Helvetica-Bold').fillColor('#f97316')
             .text('Terms & Conditions', 50, yPos);

          yPos += 18;

          doc.fontSize(8).font('Helvetica').fillColor('#4b5563')
             .text(proposal.terms, 50, yPos, { width: 495, align: 'justify', lineGap: 0.5 });

          yPos += doc.heightOfString(proposal.terms, { width: 495, lineGap: 0.5 }) + 15;
        }

        if (proposal.notes) {
          if (yPos > 720) { doc.addPage(); yPos = 50; }

          doc.fontSize(13).font('Helvetica-Bold').fillColor('#f97316')
             .text('Notes', 50, yPos);

          yPos += 18;

          doc.fontSize(8).font('Helvetica').fillColor('#4b5563')
             .text(proposal.notes, 50, yPos, { width: 495, align: 'justify', lineGap: 0.5 });

          yPos += doc.heightOfString(proposal.notes, { width: 495, lineGap: 0.5 }) + 15;
        }
      }

      // ==================== SIGNATURE ====================
      // Only add if space available on current page
      const needsSignature = signatureBuffer || tenant.organizationName;
      const signatureHeight = 100; // Approximate height needed

      if (needsSignature && (yPos + signatureHeight) < 750) {
        yPos += 20;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1f2937')
           .text('Authorized Signature', 50, yPos);

        yPos += 18;

        if (signatureBuffer) {
          try {
            doc.image(signatureBuffer, 50, yPos, { width: 150, height: 50 });
            yPos += 60;
          } catch (err) {
            console.log('Signature render error:', err.message);
            yPos += 35;
          }
        } else {
          yPos += 35;
        }

        doc.moveTo(50, yPos).lineTo(200, yPos).strokeColor('#9ca3af').stroke();
        yPos += 6;
        doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
           .text(tenant.organizationName || '', 50, yPos);
      }

      // ==================== FOOTER ON ALL PAGES ====================
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        // Footer text
        doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
           .text(
             `© ${new Date().getFullYear()} ${tenant.organizationName || 'Company'} | Page ${i + 1} of ${range.count}`,
             50,
             doc.page.height - 50,
             { align: 'center', width: 495 }
           );
      }

      doc.end();

    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
};

module.exports = { generateProposalPDF };
