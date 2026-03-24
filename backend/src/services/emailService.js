const nodemailer = require('nodemailer');
const UserSettings = require('../models/UserSettings');
const UserProduct = require('../models/UserProduct');

/**
 * Email Service - Dual Mode (Free + Premium)
 * Free: Centralized SMTP with Reply-To
 * Premium: User's own SMTP (from DB)
 */

class EmailService {
  constructor() {
    this.systemTransporter = null;
    this.initialize();
  }

  /**
   * Initialize system-wide SMTP transporter (for free tier)
   */
  initialize() {
    try {
      this.systemTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      // console.log('✅ Email Service initialized (Free + Premium)');
    } catch (error) {
      console.error('❌ Email Service initialization failed:', error);
    }
  }

  /**
   * Check if user has premium email product
   */
  async hasPremiumEmail(userId, tenantId) {
    try {
      // 🔧 FIX: Check from Data Center database
      const { getDataCenterConnection } = require('../config/database');
      const dataCenterConnection = getDataCenterConnection();

      if (!dataCenterConnection) {
        console.error('Data Center database not available');
        return false;
      }

      const UserProduct = dataCenterConnection.model('UserProduct');
      const Product = dataCenterConnection.model('Product');

      // Find email product
      const emailProductDoc = await Product.findOne({ type: 'email', isActive: true });

      if (!emailProductDoc) {
        return false;
      }

      // Check if user's tenant has purchased it
      const emailProduct = await UserProduct.findOne({
        tenant: tenantId,
        product: emailProductDoc._id,
        isActive: true,
        remainingCredits: { $gt: 0 }
      }).populate('product');

      return emailProduct !== null;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  /**
   * Create transporter based on user's tier
   */
  async createTransporter(userId, tenantId) {
    try {
      // Check if user has premium email
      const isPremium = await this.hasPremiumEmail(userId, tenantId);

      if (!isPremium) {
        // Use system SMTP (free tier)
        return {
          transporter: this.systemTransporter,
          mode: 'free'
        };
      }

      // Get user's premium SMTP settings
      const settings = await UserSettings.findOne({ user: userId });

      if (settings?.emailConfig?.isPremium &&
          settings?.emailConfig?.premiumSmtp?.isVerified) {

        // Decrypt password
        const password = settings.getDecryptedSmtpPassword();

        if (!password) {
          console.log('⚠️ Failed to decrypt SMTP password, using system SMTP');
          return {
            transporter: this.systemTransporter,
            mode: 'free'
          };
        }

        // Create user's own transporter
        const userTransporter = nodemailer.createTransport({
          host: settings.emailConfig.premiumSmtp.smtpHost,
          port: settings.emailConfig.premiumSmtp.smtpPort,
          secure: false,
          auth: {
            user: settings.emailConfig.premiumSmtp.smtpUser,
            pass: password
          }
        });

        console.log(`✅ Using premium SMTP for user: ${userId}`);
        return {
          transporter: userTransporter,
          mode: 'premium',
          fromEmail: settings.emailConfig.premiumSmtp.fromEmail
        };
      }

      // Fallback to system SMTP
      return {
        transporter: this.systemTransporter,
        mode: 'free'
      };

    } catch (error) {
      console.error('❌ Error creating transporter:', error);
      return {
        transporter: this.systemTransporter,
        mode: 'free'
      };
    }
  }

  /**
   * Get user's display settings
   */
  async getUserDisplaySettings(userId) {
    try {
      const settings = await UserSettings.findOne({ user: userId });

      if (settings && settings.emailConfig?.isConfigured) {
        return {
          displayName: settings.emailConfig.displayName,
          replyToEmail: settings.emailConfig.replyToEmail,
          signature: settings.emailConfig.emailSignature || '',
        };
      }

      // Fallback
      const User = require('../models/User');
      const user = await User.findById(userId);

      return {
        displayName: user?.name || 'CRM User',
        replyToEmail: user?.email || process.env.EMAIL_FROM,
        signature: '',
      };
    } catch (error) {
      console.error('❌ Failed to get user display settings:', error);
      return {
        displayName: 'CRM User',
        replyToEmail: process.env.EMAIL_FROM,
        signature: '',
      };
    }
  }

  /**
   * Send single email
   */
  async sendEmail(userId, { to, subject, text, html, attachments }, tenantId = null) {
    try {
      const { transporter, mode, fromEmail } = await this.createTransporter(userId, tenantId);
      const userSettings = await this.getUserDisplaySettings(userId);

      if (!transporter) {
        throw new Error('Email transporter not available');
      }

      // Add signature
      let finalText = text;
      if (userSettings.signature) {
        finalText += `\n\n---\n${userSettings.signature}`;
      }

      let mailOptions;

      if (mode === 'premium') {
        // Premium: Send from user's email
        mailOptions = {
          from: `"${userSettings.displayName}" <${fromEmail}>`,
          to,
          subject,
          text: finalText,
          html: html || finalText.replace(/\n/g, '<br>'),
          attachments: attachments || []
        };
      } else {
        // Free: Send from system with Reply-To
        mailOptions = {
          from: `"${userSettings.displayName} (via CRM)" <${process.env.EMAIL_FROM}>`,
          replyTo: userSettings.replyToEmail,
          to,
          subject,
          text: finalText,
          html: html || finalText.replace(/\n/g, '<br>'),
          attachments: attachments || []
        };
      }

      const info = await transporter.sendMail(mailOptions);

      // Track sent email
      const emailTrackingService = require('./emailTrackingService');
      await emailTrackingService.trackSentEmail({
        messageId: info.messageId,
        from: mailOptions.from,
        to: mailOptions.to,
        cc: mailOptions.cc,
        bcc: mailOptions.bcc,
        subject: mailOptions.subject,
        text: mailOptions.text,
        html: mailOptions.html,
        emailType: 'manual',
        userId,
        tenantId,
        smtpMode: mode
      });

      console.log(`✅ Email sent [${mode}]: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        mode
      };
    } catch (error) {
      console.error('❌ Email send failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(userId, recipients, subject, message, tenantId = null) {
    const results = {
      sent: 0,
      failed: 0,
      errors: [],
    };

    const { transporter, mode, fromEmail } = await this.createTransporter(userId, tenantId);
    const userSettings = await this.getUserDisplaySettings(userId);

    if (!transporter) {
      throw new Error('Email transporter not available');
    }

    for (const recipient of recipients) {
      try {
        // Personalize message
        let personalizedMessage = message
          .replace(/\{\{firstName\}\}/g, recipient.firstName || '')
          .replace(/\{\{lastName\}\}/g, recipient.lastName || '');

        // Detect if message is already a full HTML document
        const isHtml = personalizedMessage.trim().startsWith('<!DOCTYPE') || personalizedMessage.trim().startsWith('<html');

        let htmlBody, textBody;
        if (isHtml) {
          // Already a full HTML email — use as-is, strip tags for plain text fallback
          htmlBody = personalizedMessage;
          textBody = personalizedMessage
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s{3,}/g, '\n')
            .trim();
        } else {
          // Plain text — add signature then convert newlines to <br>
          if (userSettings.signature) {
            personalizedMessage += `\n\n---\n${userSettings.signature}`;
          }
          textBody = personalizedMessage;
          htmlBody = personalizedMessage.replace(/\n/g, '<br>');
        }

        let mailOptions;

        if (mode === 'premium') {
          // Premium: From user's email
          mailOptions = {
            from: `"${userSettings.displayName}" <${fromEmail}>`,
            to: recipient.email,
            subject,
            text: textBody,
            html: htmlBody,
          };
        } else {
          // Free: From system with Reply-To
          mailOptions = {
            from: `"${userSettings.displayName} (via CRM)" <${process.env.EMAIL_FROM}>`,
            replyTo: userSettings.replyToEmail,
            to: recipient.email,
            subject,
            text: textBody,
            html: htmlBody,
          };
        }

        const info = await transporter.sendMail(mailOptions);

        // Track sent email
        const emailTrackingService = require('./emailTrackingService');
        await emailTrackingService.trackSentEmail({
          messageId: info.messageId,
          from: mailOptions.from,
          to: recipient.email,
          subject,
          text: textBody,
          html: htmlBody,
          emailType: 'bulk',
          relatedTo: recipient.relatedTo,
          userId,
          tenantId,
          smtpMode: mode
        });

        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: recipient.email,
          error: error.message,
        });
      }
    }

    console.log(`✅ Bulk email completed [${mode}]: ${results.sent} sent, ${results.failed} failed`);
    return results;
  }

  /**
   * Verify SMTP connection (for premium setup)
   */
  async verifySmtpSettings(smtpHost, smtpPort, smtpUser, smtpPassword) {
    try {
      const testTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPassword
        }
      });

      await testTransporter.verify();
      console.log('✅ SMTP verification successful');
      return { success: true };
    } catch (error) {
      console.error('❌ SMTP verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
