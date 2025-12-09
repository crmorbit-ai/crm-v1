/**
 * WhatsApp Service - Twilio Integration
 *
 * TESTING MODE (Free - Sandbox):
 * - Uses whatsapp:+14155238886
 * - Recipients must join sandbox first
 * - For testing only
 *
 * PRODUCTION MODE (Paid):
 * - Buy Twilio phone number + WhatsApp enabled
 * - OR use TWILIO_WHATSAPP_NUMBER from approved business
 * - Send to ANY number (no join required)
 * - See UPGRADE_GUIDE.md for details
 */

class WhatsAppService {
  constructor() {
    this.client = null;
    this.mode = 'sandbox'; // 'sandbox' or 'production'
    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log('⚠️  WhatsApp Service: Twilio credentials not configured');
        return;
      }

      const twilio = require('twilio');
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      // Check if production WhatsApp number is configured
      if (process.env.TWILIO_WHATSAPP_PRODUCTION_NUMBER) {
        this.mode = 'production';
        console.log('✅ WhatsApp Service initialized (PRODUCTION MODE)');
      } else {
        this.mode = 'sandbox';
        console.log('✅ WhatsApp Service initialized (SANDBOX MODE - Testing only)');
        console.log('   Recipients must join sandbox: Send "join <code>" to +1 415 523 8886');
      }
    } catch (error) {
      console.error('❌ WhatsApp Service failed:', error.message);
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('   Run: npm install twilio');
      }
    }
  }

  async sendMessage({ to, message }) {
    try {
      if (!this.client) {
        throw new Error('WhatsApp service not initialized');
      }

      // Format phone number for WhatsApp
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      // Use production number if available, otherwise sandbox
      const from = this.mode === 'production'
        ? process.env.TWILIO_WHATSAPP_PRODUCTION_NUMBER
        : (process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886');

      const result = await this.client.messages.create({
        body: message,
        from: from,
        to: formattedTo,
      });

      console.log(`✅ WhatsApp sent (${this.mode}):`, result.sid);
      return {
        success: true,
        messageId: result.sid,
        mode: this.mode,
      };
    } catch (error) {
      console.error('❌ WhatsApp failed:', error.message);

      // Helpful error messages
      if (error.message.includes('not a valid WhatsApp-enabled number')) {
        return {
          success: false,
          error: 'Recipient not registered with WhatsApp or not joined sandbox',
        };
      }

      return { success: false, error: error.message };
    }
  }

  async sendBulkMessages(recipients, message) {
    const results = { sent: 0, failed: 0, errors: [], mode: this.mode };

    if (!this.client) {
      return {
        sent: 0,
        failed: recipients.length,
        errors: [{ error: 'WhatsApp service not configured. Add Twilio credentials.' }],
      };
    }

    if (this.mode === 'sandbox') {
      console.log('⚠️  SANDBOX MODE: Recipients must have joined sandbox first!');
    }

    for (const recipient of recipients) {
      try {
        let personalizedMessage = message
          .replace(/\{\{firstName\}\}/g, recipient.firstName || '')
          .replace(/\{\{lastName\}\}/g, recipient.lastName || '');

        const result = await this.sendMessage({
          to: recipient.phone,
          message: personalizedMessage,
        });

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ phone: recipient.phone, error: result.error });
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        results.errors.push({ phone: recipient.phone, error: error.message });
      }
    }

    return results;
  }

  isConfigured() {
    return this.client !== null;
  }

  getMode() {
    return this.mode;
  }
}

module.exports = new WhatsAppService();
