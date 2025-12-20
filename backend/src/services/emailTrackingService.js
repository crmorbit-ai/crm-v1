const EmailMessage = require('../models/EmailMessage');

class EmailTrackingService {
  /**
   * Track sent email after SMTP send success
   */
  async trackSentEmail({
    messageId,
    from,
    to,
    cc = [],
    bcc = [],
    subject,
    text,
    html,
    emailType,
    relatedTo = null,
    userId,
    tenantId,
    smtpMode = 'free',
    inReplyTo = null
  }) {
    try {
      // Parse email addresses
      const parseEmail = (email) => {
        if (typeof email === 'string') {
          const match = email.match(/<(.+)>/);
          return {
            email: match ? match[1] : email,
            name: match ? email.split('<')[0].trim().replace(/"/g, '') : ''
          };
        }
        return email;
      };

      const parseEmailArray = (emails) => {
        if (!Array.isArray(emails)) {
          emails = [emails];
        }
        return emails.filter(e => e).map(parseEmail);
      };

      // Determine threadId
      let threadId = messageId;
      if (inReplyTo) {
        const parent = await EmailMessage.findOne({
          messageId: inReplyTo,
          tenant: tenantId
        });
        if (parent) {
          threadId = parent.threadId;
        }
      }

      // Create email record
      const emailData = {
        messageId,
        direction: 'sent',
        from: parseEmail(from),
        to: parseEmailArray(to),
        cc: cc.length > 0 ? parseEmailArray(cc) : [],
        bcc: bcc.length > 0 ? parseEmailArray(bcc) : [],
        subject,
        bodyText: text || '',
        bodyHtml: html || '',
        emailType,
        status: 'sent',
        sentAt: new Date(),
        smtpMode,
        userId,
        tenant: tenantId,
        inReplyTo,
        threadId
      };

      // Only add relatedTo if it has valid type and id
      if (relatedTo && relatedTo.type && relatedTo.id) {
        emailData.relatedTo = relatedTo;
      }

      const emailMessage = await EmailMessage.create(emailData);

      console.log(`📧 Email tracked: ${messageId} (${emailType})`);
      return emailMessage;

    } catch (error) {
      console.error('❌ Email tracking failed:', error);
      // Don't throw - tracking failure shouldn't break email sending
      return null;
    }
  }

  /**
   * Track received email (from IMAP)
   */
  async trackReceivedEmail({
    messageId,
    from,
    to,
    cc = [],
    subject,
    text,
    html,
    inReplyTo,
    references = [],
    headers = {},
    attachments = [],
    imapUid,
    imapFolder = 'INBOX',
    receivedAt,
    tenantId,
    userId
  }) {
    try {
      // Check if already tracked
      const existing = await EmailMessage.findOne({
        messageId,
        tenant: tenantId
      });

      if (existing) {
        console.log(`⚠️ Email already tracked: ${messageId}`);
        return existing;
      }

      // 🔒 PRIVACY FILTER: Only track emails that are relevant to CRM conversations
      const fromEmail = this.parseEmailAddress(from).email;

      // Check if this is a reply to a CRM-sent email OR from someone we've communicated with
      const isRelevantEmail = await this.isRelevantEmail(fromEmail, inReplyTo, references, tenantId);

      if (!isRelevantEmail) {
        console.log(`🚫 Skipping irrelevant email from ${fromEmail} - not part of CRM conversations`);
        return null;
      }

      // Determine threadId and related entity
      let threadId = messageId;
      let relatedTo = null;
      let emailType = 'reply';

      // Try to find parent email
      if (inReplyTo) {
        const parent = await EmailMessage.findOne({
          messageId: inReplyTo,
          tenant: tenantId
        });

        if (parent) {
          threadId = parent.threadId;
          relatedTo = parent.relatedTo;

          // Update parent status
          parent.status = 'replied';
          parent.repliedAt = new Date();
          await parent.save();
        }
      }

      // Create email record
      const emailData = {
        messageId,
        direction: 'received',
        from: this.parseEmailAddress(from),
        to: Array.isArray(to) ? to.map(e => this.parseEmailAddress(e)) : [this.parseEmailAddress(to)],
        cc: cc.map(e => this.parseEmailAddress(e)),
        subject,
        bodyText: text || '',
        bodyHtml: html || '',
        emailType,
        status: 'delivered',
        sentAt: receivedAt || new Date(),
        deliveredAt: new Date(),
        userId,
        tenant: tenantId,
        inReplyTo,
        references,
        threadId,
        imapUid,
        imapFolder,
        headers,
        attachments
      };

      // Only add relatedTo if it has valid type and id
      if (relatedTo && relatedTo.type && relatedTo.id) {
        emailData.relatedTo = relatedTo;
      }

      const emailMessage = await EmailMessage.create(emailData);

      console.log(`📬 Received email tracked: ${messageId}`);
      return emailMessage;

    } catch (error) {
      console.error('❌ Received email tracking failed:', error);
      return null;
    }
  }

  /**
   * Parse email address string
   */
  parseEmailAddress(emailStr) {
    if (!emailStr) return { email: '', name: '' };

    // Handle IMAP parsed objects (from mailparser)
    if (typeof emailStr === 'object') {
      if (emailStr.address) {
        // mailparser format: {address: 'email@example.com', name: 'John Doe'}
        return {
          email: emailStr.address || '',
          name: emailStr.name || ''
        };
      }
      // Already in correct format {email: '', name: ''}
      if (emailStr.email !== undefined) {
        return emailStr;
      }
      // Unknown object format, try to extract
      return { email: '', name: '' };
    }

    // Format: "John Doe <john@example.com>" or "john@example.com"
    const match = emailStr.match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/);

    return {
      email: match ? match[2].trim() : emailStr.trim(),
      name: match && match[1] ? match[1].trim() : ''
    };
  }

  /**
   * Get email thread/conversation
   */
  async getThread(messageId, tenantId) {
    try {
      const message = await EmailMessage.findOne({
        messageId,
        tenant: tenantId
      });

      if (!message) return [];

      return await EmailMessage.find({
        threadId: message.threadId,
        tenant: tenantId,
        isDeleted: false
      })
      .sort({ sentAt: 1 })
      .populate('userId', 'name email')
      .populate('relatedTo.id');

    } catch (error) {
      console.error('❌ Get thread failed:', error);
      return [];
    }
  }

  /**
   * Get email history for an entity (Lead, Contact, etc.)
   */
  async getEntityEmails(entityType, entityId, tenantId) {
    try {
      return await EmailMessage.find({
        'relatedTo.type': entityType,
        'relatedTo.id': entityId,
        tenant: tenantId,
        isDeleted: false
      })
      .sort({ sentAt: -1 })
      .populate('userId', 'name email');

    } catch (error) {
      console.error('❌ Get entity emails failed:', error);
      return [];
    }
  }

  /**
   * Check if received email is relevant to CRM conversations
   * Only track emails that are:
   * 1. Direct replies to CRM-sent emails (inReplyTo matches)
   * 2. Part of existing conversation threads (references match)
   * 3. From someone we've sent emails to before
   */
  async isRelevantEmail(fromEmail, inReplyTo, references = [], tenantId) {
    try {
      // Case 1: Direct reply to our sent email
      if (inReplyTo) {
        const parentEmail = await EmailMessage.findOne({
          messageId: inReplyTo,
          tenant: tenantId,
          direction: 'sent'
        });

        if (parentEmail) {
          console.log(`✅ Relevant: Reply to CRM-sent email (${inReplyTo})`);
          return true;
        }
      }

      // Case 2: Part of existing thread (check references)
      if (references && references.length > 0) {
        const threadEmail = await EmailMessage.findOne({
          messageId: { $in: references },
          tenant: tenantId,
          direction: 'sent'
        });

        if (threadEmail) {
          console.log(`✅ Relevant: Part of CRM conversation thread`);
          return true;
        }
      }

      // Case 3: From someone we've sent emails to before
      const sentToThisPerson = await EmailMessage.findOne({
        tenant: tenantId,
        direction: 'sent',
        $or: [
          { 'to.email': fromEmail.toLowerCase() },
          { 'cc.email': fromEmail.toLowerCase() }
        ]
      });

      if (sentToThisPerson) {
        console.log(`✅ Relevant: From someone we've emailed before (${fromEmail})`);
        return true;
      }

      // Not relevant - likely spam, social media notification, newsletter, etc.
      console.log(`❌ Not relevant: ${fromEmail} - no prior CRM communication`);
      return false;

    } catch (error) {
      console.error('❌ Error checking email relevance:', error);
      // On error, be conservative and track the email
      return true;
    }
  }
}

module.exports = new EmailTrackingService();
