/**
 * SMS Service - Twilio Integration
 *
 * TESTING MODE (Free):
 * - Uses Twilio trial account
 * - Can send to verified numbers only
 *
 * PRODUCTION MODE (Paid):
 * - Buy Twilio phone number ($15/month)
 * - Send to ANY number
 * - See UPGRADE_GUIDE.md for details
 */

class SMSService {
  constructor() {
    this.client = null;
    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log('⚠️  SMS Service: Twilio credentials not configured');
        return;
      }

      const twilio = require('twilio');
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      console.log('✅ SMS Service initialized');
    } catch (error) {
      console.error('❌ SMS Service failed:', error.message);
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('   Run: npm install twilio');
      }
    }
  }

  async sendSMS({ to, message }) {
    try {
      if (!this.client) {
        throw new Error('SMS service not initialized');
      }

      if (!process.env.TWILIO_PHONE_NUMBER) {
        throw new Error('TWILIO_PHONE_NUMBER not configured. Need to buy phone number for SMS.');
      }

      const result = await this.client.messages.create({
        body: message.substring(0, 160), // SMS limit
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to,
      });

      console.log('✅ SMS sent:', result.sid);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('❌ SMS failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendBulkSMS(recipients, message) {
    const results = { sent: 0, failed: 0, errors: [] };

    if (!this.client) {
      return {
        sent: 0,
        failed: recipients.length,
        errors: [{ error: 'SMS service not configured. Add Twilio credentials.' }],
      };
    }

    for (const recipient of recipients) {
      try {
        let personalizedMessage = message
          .replace(/\{\{firstName\}\}/g, recipient.firstName || '')
          .replace(/\{\{lastName\}\}/g, recipient.lastName || '');

        const result = await this.sendSMS({
          to: recipient.phone,
          message: personalizedMessage,
        });

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ phone: recipient.phone, error: result.error });
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        results.errors.push({ phone: recipient.phone, error: error.message });
      }
    }

    return results;
  }

  isConfigured() {
    return this.client !== null && process.env.TWILIO_PHONE_NUMBER;
  }
}

module.exports = new SMSService();
