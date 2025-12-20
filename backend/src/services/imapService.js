const Imap = require('imap');
const { simpleParser } = require('mailparser');
const emailTrackingService = require('./emailTrackingService');
const UserSettings = require('../models/UserSettings');

class ImapService {
  /**
   * Create IMAP connection using user's credentials
   */
  createImapConnection(smtpHost, smtpUser, smtpPassword) {
    // Convert SMTP host to IMAP host
    const imapHost = smtpHost.replace('smtp', 'imap');
    const imapPort = 993; // Standard IMAP SSL port

    return new Imap({
      user: smtpUser,
      password: smtpPassword,
      host: imapHost,
      port: imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
  }

  /**
   * Fetch new emails from INBOX
   */
  async fetchNewEmails(userId, tenantId) {
    try {
      // Get user's SMTP settings
      const settings = await UserSettings.findOne({ user: userId });

      if (!settings?.emailConfig?.premiumSmtp?.isVerified) {
        console.log(`⚠️ User ${userId} has no premium SMTP configured`);
        return { success: false, error: 'No premium SMTP configured' };
      }

      const { smtpHost, smtpUser } = settings.emailConfig.premiumSmtp;
      const smtpPassword = settings.getDecryptedSmtpPassword();

      if (!smtpPassword) {
        return { success: false, error: 'Failed to decrypt password' };
      }

      // Create IMAP connection
      const imap = this.createImapConnection(smtpHost, smtpUser, smtpPassword);

      return new Promise((resolve, reject) => {
        let processed = 0;
        let errors = 0;

        imap.once('ready', () => {
          console.log(`✅ IMAP connected for ${smtpUser}`);

          // Open INBOX
          imap.openBox('INBOX', false, async (err, box) => {
            if (err) {
              imap.end();
              return reject(err);
            }

            // Search for UNSEEN emails from last 7 days
            const searchCriteria = ['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]];

            imap.search(searchCriteria, (err, results) => {
              if (err) {
                imap.end();
                return reject(err);
              }

              if (results.length === 0) {
                console.log(`📭 No new emails for ${smtpUser}`);
                imap.end();
                return resolve({ success: true, processed: 0, errors: 0 });
              }

              console.log(`📬 Found ${results.length} new emails for ${smtpUser}`);

              const fetch = imap.fetch(results, {
                bodies: '',
                markSeen: false
              });

              fetch.on('message', (msg, seqno) => {
                let buffer = '';

                msg.on('body', (stream, info) => {
                  stream.on('data', (chunk) => {
                    buffer += chunk.toString('utf8');
                  });

                  stream.once('end', async () => {
                    try {
                      // Parse email
                      const parsed = await simpleParser(buffer);

                      // Clean headers - convert complex objects to strings
                      const cleanHeaders = {};
                      if (parsed.headers) {
                        for (const [key, value] of parsed.headers) {
                          if (typeof value === 'string') {
                            cleanHeaders[key] = value;
                          } else if (value && typeof value === 'object') {
                            // Convert object/array to string
                            if (value.text) cleanHeaders[key] = value.text;
                            else if (Array.isArray(value)) cleanHeaders[key] = value.join(', ');
                            else if (value.value) cleanHeaders[key] = value.value;
                            else cleanHeaders[key] = JSON.stringify(value);
                          }
                        }
                      }

                      // Track in database
                      await emailTrackingService.trackReceivedEmail({
                        messageId: parsed.messageId,
                        from: parsed.from?.text || parsed.from?.value?.[0]?.address,
                        to: parsed.to?.value?.map(t => t.address) || [],
                        cc: parsed.cc?.value?.map(c => c.address) || [],
                        subject: parsed.subject,
                        text: parsed.text,
                        html: parsed.html,
                        inReplyTo: parsed.inReplyTo,
                        references: parsed.references || [],
                        headers: cleanHeaders,
                        attachments: parsed.attachments?.map(a => ({
                          filename: a.filename,
                          contentType: a.contentType,
                          size: a.size
                        })) || [],
                        imapUid: seqno,
                        imapFolder: 'INBOX',
                        receivedAt: parsed.date || new Date(),
                        tenantId,
                        userId
                      });

                      processed++;
                      console.log(`📩 Tracked email ${processed}/${results.length}: ${parsed.subject}`);

                    } catch (error) {
                      console.error(`❌ Error processing email ${seqno}:`, error);
                      errors++;
                    }
                  });
                });
              });

              fetch.once('end', () => {
                console.log(`✅ Finished fetching emails for ${smtpUser}`);
                imap.end();
              });

              fetch.once('error', (err) => {
                console.error('Fetch error:', err);
                imap.end();
                reject(err);
              });
            });
          });
        });

        imap.once('error', (err) => {
          console.error('IMAP error:', err);
          reject(err);
        });

        imap.once('end', () => {
          console.log('IMAP connection ended');
          resolve({ success: true, processed, errors });
        });

        imap.connect();
      });

    } catch (error) {
      console.error('❌ IMAP fetch failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync emails for all premium users in a tenant
   */
  async syncTenantEmails(tenantId) {
    try {
      const User = require('../models/User');

      // Find all premium users in this tenant
      const premiumSettings = await UserSettings.find({
        'emailConfig.isPremium': true,
        'emailConfig.premiumSmtp.isVerified': true
      }).populate('user');

      const tenantSettings = premiumSettings.filter(s =>
        s.user && s.user.tenant && s.user.tenant.toString() === tenantId.toString()
      );

      console.log(`🔄 Syncing emails for ${tenantSettings.length} users in tenant ${tenantId}`);

      const results = [];
      for (const settings of tenantSettings) {
        const result = await this.fetchNewEmails(settings.user._id, tenantId);
        results.push({
          userId: settings.user._id,
          email: settings.emailConfig.premiumSmtp.smtpUser,
          ...result
        });
      }

      return results;

    } catch (error) {
      console.error('❌ Tenant sync failed:', error);
      return [];
    }
  }
}

module.exports = new ImapService();
