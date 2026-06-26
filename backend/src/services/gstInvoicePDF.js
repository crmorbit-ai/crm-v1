const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const axios = require('axios');
const sharp = require('sharp');

/**
 * Generate Professional GST Invoice PDF - Teal Theme (Reference Style)
 * Compact, table-based layout with teal headers and bank details
 */
exports.generateGSTInvoicePDF = async (invoice, tenant) => {
  // Colors - Teal/Cyan theme
  const TEAL = '#17808a';
  const TEAL_DARK = '#115e67';
  const WHITE = '#ffffff';
  const BLACK = '#000000';
  const GRAY = '#666666';
  const LIGHT_GRAY = '#f5f5f5';

  // Download invoice logo if URL (use invoiceLogo first, fallback to logo)
  let logoBuffer = null;
  const logoToUse = tenant.invoiceLogo || tenant.logo;
  if (logoToUse && logoToUse.startsWith('http')) {
    try {
      const response = await axios.get(logoToUse, { responseType: 'arraybuffer' });
      // Preserve transparency, don't flatten to white background
      logoBuffer = await sharp(Buffer.from(response.data))
        .resize(120, 60, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } catch (err) {
      console.log('Logo error:', err.message);
    }
  }

  // Download signature if URL (DOUBLE SIZE - MAXIMUM)
  let signatureBuffer = null;
  if (tenant.signature && tenant.signature.startsWith('http')) {
    try {
      const response = await axios.get(tenant.signature, { responseType: 'arraybuffer' });
      signatureBuffer = await sharp(Buffer.from(response.data))
        .resize(400, 160, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .toBuffer();
    } catch (err) {
      console.log('Signature error:', err.message);
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });

      const uploadsDir = process.env.VERCEL ? '/tmp/invoices' : path.join(__dirname, '../../uploads/invoices');
      try {
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      } catch (error) {
        console.error('Error creating directory:', error);
      }

      const fileName = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      let yPos = 40;

      // ============= HEADER SECTION WITH TEAL =============

      // Logo - MAXIMUM SIZE with white background
      if (logoBuffer) {
        // White box for logo - MAXIMUM
        doc.rect(40, yPos, 240, 80).fill(WHITE).stroke('#cccccc');

        try {
          // Logo MAXIMUM SIZE - 220x70
          doc.image(logoBuffer, 50, yPos + 5, { width: 220, height: 70, fit: [220, 70] });
        } catch (err) {
          doc.fontSize(16).fillColor(BLACK).font('Helvetica-Bold')
             .text(tenant.organizationName || 'Company', 50, yPos + 30, { width: 220, align: 'center' });
        }
      }

      // Teal bar - starts exactly from where "TAX INVOICE" begins
      const tealStartX = logoBuffer ? 285 : 40;
      const tealWidth = logoBuffer ? 270 : 515;
      doc.rect(tealStartX, yPos, tealWidth, 80).fill(TEAL);

      // Company details in header (right side) - TAX INVOICE
      doc.fontSize(14).fillColor(WHITE).font('Helvetica-Bold')
         .text('TAX INVOICE', 370, yPos + 5, { width: 175, align: 'right' });

      // Header info table (compact)
      const headerInfoY = yPos + 23;
      doc.fontSize(7).fillColor(WHITE).font('Helvetica');

      const headerInfo = [
        ['Invoice No', invoice.invoiceNumber],
        ['Date', new Date(invoice.invoiceDate).toLocaleDateString('en-IN')],
        ['PAN', tenant.panNumber || (tenant.gstin ? tenant.gstin.substring(2, 12) : 'N/A')],
        ['GST IN', tenant.gstin || 'N/A']
      ];

      let infoY = headerInfoY;
      headerInfo.forEach(([label, value]) => {
        doc.text(label, 370, infoY, { width: 70, align: 'left' });
        doc.text(value, 445, infoY, { width: 100, align: 'right' });
        infoY += 10;
      });

      yPos += 85;

      // Company full address below header
      doc.rect(40, yPos, 515, 50).stroke('#cccccc');
      doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
         .text((tenant.organizationName || 'COMPANY NAME').toUpperCase(), 45, yPos + 5);

      doc.fontSize(7).font('Helvetica').fillColor(GRAY);

      // Build company address with GST and PAN
      const companyAddrParts = [];

      // Address line111
      const addrLine = `Reg. Office: ${tenant.headquarters?.street || ''}, ${tenant.headquarters?.city || ''}, ${tenant.headquarters?.state || ''}, ${tenant.headquarters?.zipCode || ''}`.trim();
      if (addrLine && addrLine !== 'Reg. Office:') companyAddrParts.push(addrLine);

      // GST and PAN line
      const gstPanParts = [];
      if (tenant.gstin) gstPanParts.push(`GST: ${tenant.gstin}`);
      if (tenant.panNumber) gstPanParts.push(`PAN: ${tenant.panNumber}`);
      if (gstPanParts.length > 0) companyAddrParts.push(gstPanParts.join(' | '));

      // Email and Website
      const contactParts = [];
      if (tenant.contactEmail) contactParts.push(`Email: ${tenant.contactEmail}`);
      if (tenant.website) contactParts.push(`Website: ${tenant.website}`);
      if (contactParts.length > 0) companyAddrParts.push(contactParts.join(' | '));

      const companyAddr = companyAddrParts.join('\n');
      doc.text(companyAddr, 45, yPos + 18, { width: 500 });

      yPos += 55;

      // ============= CONSIGNEE SECTION (TEAL BAR) =============

      doc.rect(40, yPos, 515, 18).fill(TEAL);
      doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold')
         .text('Consignee', 250, yPos + 5, { width: 100, align: 'center' });

      yPos += 18;

      // Bill to & Ship to columns
      doc.rect(40, yPos, 257.5, 15).fill(LIGHT_GRAY).stroke('#cccccc');
      doc.rect(297.5, yPos, 257.5, 15).fill(LIGHT_GRAY).stroke('#cccccc');

      doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
         .text('Bill to:', 45, yPos + 4)
         .text('Ship to party:', 302, yPos + 4);

      yPos += 15;

      // Customer details - BILL TO box (taller for all info)
      const billHeight = 100;
      doc.rect(40, yPos, 257.5, billHeight).stroke('#cccccc');
      doc.rect(297.5, yPos, 257.5, billHeight).stroke('#cccccc');

      // Bill To section
      doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
         .text(invoice.customerName, 45, yPos + 5, { width: 240 });

      doc.fontSize(7).font('Helvetica').fillColor(GRAY);
      const billAddr = invoice.customerAddress || '';
      doc.text(billAddr, 45, yPos + 18, { width: 240, height: 25 });

      let billInfoY = yPos + 48;
      if (invoice.customerGstin) {
        doc.font('Helvetica-Bold').fillColor(BLACK).text('GST Code: ', 45, billInfoY, { continued: true });
        doc.font('Helvetica').fillColor(GRAY).text(invoice.customerGstin);
        billInfoY += 10;
      }
      if (invoice.customerStateCode) {
        doc.font('Helvetica-Bold').fillColor(BLACK).text('STATE CODE: ', 45, billInfoY, { continued: true });
        doc.font('Helvetica').fillColor(GRAY).text(invoice.customerStateCode);
        billInfoY += 10;
      }
      if (invoice.customerPan) {
        doc.font('Helvetica-Bold').fillColor(BLACK).text('PAN: ', 45, billInfoY, { continued: true });
        doc.font('Helvetica').fillColor(GRAY).text(invoice.customerPan);
        billInfoY += 10;
      }
      doc.font('Helvetica-Bold').fillColor(BLACK).text('Email: ', 45, billInfoY, { continued: true });
      doc.font('Helvetica').fillColor(GRAY).text(invoice.customerEmail, { width: 200 });
      billInfoY += 10;
      if (invoice.customerPhone) {
        doc.font('Helvetica-Bold').fillColor(BLACK).text('Mobile: ', 45, billInfoY, { continued: true });
        doc.font('Helvetica').fillColor(GRAY).text(invoice.customerPhone);
      }

      // Ship to (use shipping address if available, otherwise same as billing)
      const shipAddr = invoice.shippingAddress || invoice.customerAddress || '';
      doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
         .text(invoice.customerName, 302, yPos + 5, { width: 240 });

      doc.fontSize(7).font('Helvetica').fillColor(GRAY);
      doc.text(shipAddr, 302, yPos + 18, { width: 240, height: 75 });

      yPos += billHeight;

      // ============= ITEMS TABLE =============

      // Table header (TEAL)
      doc.rect(40, yPos, 515, 18).fill(TEAL);

      const cols = {
        sno: 45,
        name: 75,
        hsn: 250,
        qty: 310,
        rate: 355,
        amount: 440
      };

      doc.fontSize(8).fillColor(WHITE).font('Helvetica-Bold')
         .text('S.No', cols.sno, yPos + 5, { width: 25 })
         .text('Name of Sales', cols.name, yPos + 5, { width: 170 })
         .text('HSN/SAC', cols.hsn, yPos + 5, { width: 55 })
         .text('Qty', cols.qty, yPos + 5, { width: 35, align: 'center' })
         .text('Rate', cols.rate, yPos + 5, { width: 80, align: 'right' })
         .text('Amount', cols.amount, yPos + 5, { width: 110, align: 'right' });

      yPos += 18;

      // Items rows
      invoice.items.forEach((item, index) => {
        const rowHeight = 25;
        doc.rect(40, yPos, 515, rowHeight).stroke('#cccccc');

        doc.fontSize(8).fillColor(BLACK).font('Helvetica')
           .text(index + 1, cols.sno, yPos + 8, { width: 25 })
           .text(item.productName, cols.name, yPos + 8, { width: 170 })
           .text(item.hsnCode || '998314', cols.hsn, yPos + 8, { width: 55 })
           .text(item.quantity.toString(), cols.qty, yPos + 8, { width: 35, align: 'center' })
           .text(`₹${item.unitPrice.toLocaleString('en-IN')}`, cols.rate, yPos + 8, { width: 80, align: 'right' })
           .text(`₹${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cols.amount, yPos + 8, { width: 110, align: 'right' });

        yPos += rowHeight;
      });

      // Add empty rows to fill space (if less items)
      const minRows = 5;
      const emptyRows = Math.max(0, minRows - invoice.items.length);
      for (let i = 0; i < emptyRows; i++) {
        doc.rect(40, yPos, 515, 25).stroke('#cccccc');
        yPos += 25;
      }

      // ============= TAX CALCULATION =============

      doc.rect(40, yPos, 350, 15).stroke('#cccccc');
      doc.rect(390, yPos, 165, 15).fill(LIGHT_GRAY).stroke('#cccccc');

      doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
         .text('Amounts before Tax', 400, yPos + 4, { width: 90, align: 'left' })
         .text(`₹${invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, yPos + 4, { width: 70, align: 'right' });

      yPos += 15;

      // Tax lines
      const taxLines = invoice.taxType === 'CGST+SGST'
        ? [
            [`Add CGST@ ${((invoice.totalCgst || invoice.totalTax / 2) / invoice.subtotal * 100).toFixed(1)}%`, invoice.totalCgst || invoice.totalTax / 2],
            [`Add SGST@ ${((invoice.totalSgst || invoice.totalTax / 2) / invoice.subtotal * 100).toFixed(1)}%`, invoice.totalSgst || invoice.totalTax / 2]
          ]
        : [[`Add IGST@ ${(invoice.totalTax / invoice.subtotal * 100).toFixed(1)}%`, invoice.totalIgst || invoice.totalTax]];

      taxLines.forEach(([label, amount]) => {
        doc.rect(40, yPos, 350, 15).stroke('#cccccc');
        doc.rect(390, yPos, 165, 15).stroke('#cccccc');

        doc.fontSize(8).fillColor(BLACK).font('Helvetica')
           .text(label, 400, yPos + 4, { width: 90, align: 'left' })
           .text(`₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, yPos + 4, { width: 70, align: 'right' });

        yPos += 15;
      });

      // Total GST
      doc.rect(40, yPos, 350, 15).stroke('#cccccc');
      doc.rect(390, yPos, 165, 15).stroke('#cccccc');

      doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
         .text('Total Amounts of GST', 400, yPos + 4, { width: 90, align: 'left' })
         .text(`₹${invoice.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, yPos + 4, { width: 70, align: 'right' });

      yPos += 15;

      // Reverse charges
      doc.rect(40, yPos, 350, 15).stroke('#cccccc');
      doc.rect(390, yPos, 165, 15).stroke('#cccccc');

      doc.fontSize(8).fillColor(BLACK).font('Helvetica')
         .text('GST Payable on Reverse Charges', 395, yPos + 4, { width: 140 });

      doc.fontSize(8).fillColor(BLACK).font('Helvetica')
         .text('NL', 535, yPos + 4, { width: 20, align: 'left' });

      yPos += 15;

      // Grand total
      doc.rect(40, yPos, 350, 18).fill(TEAL).stroke(TEAL);
      doc.rect(390, yPos, 165, 18).fill(TEAL).stroke(TEAL);

      doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold')
         .text('Total Amounts', 395, yPos + 5, { width: 155, align: 'left' });

      doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold')
         .text(`₹${invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 460, yPos + 5, { width: 90, align: 'right' });

      yPos += 23;

      // Amount in words
      doc.rect(40, yPos, 515, 20).fill(TEAL).stroke(TEAL);
      doc.fontSize(8).fillColor(WHITE).font('Helvetica-Bold')
         .text(`In words (favours): ${numberToWords(invoice.totalAmount)} Only`, 45, yPos + 6, { width: 500 });

      yPos += 25;

      // ============= BANK DETAILS =============

      if (tenant.bankDetails) {
        doc.rect(40, yPos, 515, 15).fill(LIGHT_GRAY).stroke('#cccccc');
        doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
           .text('Bank e-Funds', 45, yPos + 4);

        yPos += 15;

        doc.rect(40, yPos, 515, 30).stroke('#cccccc');

        const bankInfo = [
          `ACCOUNT NAME: ${tenant.organizationName || 'N/A'}`,
          `A/C NO: ${tenant.bankDetails.accountNumber || 'N/A'}`,
          `BANK NAME: ${tenant.bankDetails.bankName || 'N/A'}`,
          `BANK IFSC/NEFT: ${tenant.bankDetails.ifscCode || 'N/A'}`,
          tenant.bankDetails.swiftCode ? `SWIFT NO: ${tenant.bankDetails.swiftCode}` : null,
          `BRANCH: ${tenant.bankDetails.branch || 'N/A'}`
        ].filter(Boolean).join(' | ');

        doc.fontSize(7).fillColor(BLACK).font('Helvetica')
           .text(bankInfo, 45, yPos + 5, { width: 500 });

        yPos += 35;
      }

      // Payment terms & Signature section - reference image style
      const termsY = yPos;

      // Left section - Payment terms & Computer Generated text
      if (invoice.terms) {
        doc.fontSize(8).fillColor(BLACK).font('Helvetica')
           .text(`Payment Terms- ${invoice.terms}`, 40, termsY, { width: 250 });
      }

      doc.fontSize(7).fillColor(GRAY).font('Helvetica')
         .text('This is a Computer Generated Invoice', 40, termsY + 20, { width: 250 });

      if (tenant.website) {
        doc.fontSize(7).fillColor(BLACK).font('Helvetica')
           .text(`Please visit, ${tenant.website}`, 40, termsY + 32, { width: 250 });
      }

      // Right section - Thank you message & Signature BOX
      const rightX = 300;

      // Thank you message
      doc.fontSize(8).fillColor(BLACK).font('Helvetica')
         .text('Thank you for Business with us.', rightX, termsY, { width: 255, align: 'right' });

      // Signature section - DOUBLE SIZE BOX with label
      if (signatureBuffer) {
        try {
          const sigBoxX = 330;
          const sigBoxY = termsY + 12;
          const sigBoxWidth = 225;
          const sigBoxHeight = 140;

          // Signature box with border - BIGGER
          doc.rect(sigBoxX, sigBoxY, sigBoxWidth, sigBoxHeight).stroke('#cccccc');

          // "Authorized Signatory" label at top of box
          doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
             .text('Authorized Signatory', sigBoxX + 5, sigBoxY + 8, { width: sigBoxWidth - 10, align: 'center' });

          // Signature image DOUBLE SIZE - perfectly centered
          const sigImgWidth = 200;
          const sigImgHeight = 100;
          const sigImgX = sigBoxX + (sigBoxWidth - sigImgWidth) / 2;
          const sigImgY = sigBoxY + 30;

          doc.image(signatureBuffer, sigImgX, sigImgY, { width: sigImgWidth, height: sigImgHeight, fit: [sigImgWidth, sigImgHeight] });
        } catch (err) {
          console.log('Signature render error:', err);
        }
      }

      yPos += 155;

      doc.end();

      stream.on('finish', () => resolve({ filePath, fileName }));
      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
};

// Helper: Number to Words
function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees';

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';
  let remaining = rupees;
  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  const hundred = Math.floor(remaining / 100);
  remaining %= 100;

  if (crore > 0) result += convertTwoDigit(crore) + ' Crore ';
  if (lakh > 0) result += convertTwoDigit(lakh) + ' Lakh ';
  if (thousand > 0) result += convertTwoDigit(thousand) + ' Thousand ';
  if (hundred > 0) result += a[hundred] + ' Hundred ';
  if (remaining > 0) result += convertTwoDigit(remaining);

  result = result.trim() + ' Rupees';

  if (paise > 0) {
    result += ' and ' + convertTwoDigit(paise) + ' Paise';
  }

  return result;

  function convertTwoDigit(n) {
    if (n < 20) return a[n] || '';
    const tens = b[Math.floor(n / 10)] || '';
    const ones = a[n % 10] || '';
    return (tens + (ones ? ' ' + ones : '')).trim();
  }
}
