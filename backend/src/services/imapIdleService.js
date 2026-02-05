const Imap = require('imap');
const { simpleParser } = require('mailparser');
const emailTrackingService = require('./emailTrackingService');
const UserSettings = require('../models/UserSettings');

class ImapIdleService {
  constructor() {
    this.connections = new Map(); // userId -> { imap, reconnectTimer }
    this.isShuttingDown = false;
  }

  /**
   * Start IDLE monitoring for a specific user
   */
  async startIdleForUser(userId, tenantId, smtpHost, smtpUser, smtpPassword) {
    try {
      // Check if already connected
      if (this.connections.has(userId.toString())) {
        return;
      }

      // console.log(`🔄 Starting IMAP IDLE for ${smtpUser}...`);

      const imapHost = smtpHost.replace('smtp', 'imap');
      const imap = new Imap({
        user: smtpUser,
        password: smtpPassword,
        host: imapHost,
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        keepalive: {
          interval: 10000, // Send keepalive every 10 seconds
          idleInterval: 300000, // Re-IDLE every 5 minutes (Gmail requirement)
          forceNoop: true
        }
      });

      // Store connection info
      this.connections.set(userId.toString(), {
        imap,
        smtpUser,
        tenantId,
        userId,
        reconnectTimer: null
      });

      // Setup event handlers
      this.setupImapHandlers(imap, userId, tenantId, smtpUser, smtpHost, smtpPassword);

      // Connect
      imap.connect();

    } catch (error) {
      this.scheduleReconnect(userId, tenantId, smtpHost, smtpUser, smtpPassword);
    }
  }

  /**
   * Setup IMAP event handlers
   */
  setupImapHandlers(imap, userId, tenantId, smtpUser, smtpHost, smtpPassword) {
    imap.once('ready', () => {
      // console.log(`✅ IMAP IDLE connected for ${smtpUser}`);

      // Open INBOX in read-write mode
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          this.handleDisconnect(userId, tenantId, smtpHost, smtpUser, smtpPassword);
          return;
        }

        // console.log(`📬 INBOX opened for ${smtpUser}, starting IDLE...`);

        // Start IDLE mode
        imap.on('mail', (numNewMsgs) => {
          // Silent processing - no console spam
          this.handleNewMail(imap, userId, tenantId, smtpUser);
        });

        // Handle expunge (email deleted) - silent
        imap.on('expunge', (seqno) => {
          // Silent
        });

        // Handle update (flags changed) - silent
        imap.on('update', (seqno, info) => {
          // Silent
        });
      });
    });

    imap.once('error', (err) => {
      this.handleDisconnect(userId, tenantId, smtpHost, smtpUser, smtpPassword);
    });

    imap.once('end', () => {
      this.handleDisconnect(userId, tenantId, smtpHost, smtpUser, smtpPassword);
    });

    imap.once('close', (hadError) => {
      this.handleDisconnect(userId, tenantId, smtpHost, smtpUser, smtpPassword);
    });
  }

  /**
   * Handle new mail notification
   */
  async handleNewMail(imap, userId, tenantId, smtpUser) {
    try {
      // Search for UNSEEN emails
      imap.search(['UNSEEN'], async (err, results) => {
        if (err) {
          return;
        }

        if (results.length === 0) {
          return;
        }

        // Silent processing

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
                const parsed = await simpleParser(buffer);

                // Silent processing - logs disabled

                // Clean headers
                const cleanHeaders = {};
                if (parsed.headers) {
                  for (const [key, value] of parsed.headers) {
                    if (typeof value === 'string') {
                      cleanHeaders[key] = value;
                    } else if (value && typeof value === 'object') {
                      if (value.text) cleanHeaders[key] = value.text;
                      else if (Array.isArray(value)) cleanHeaders[key] = value.join(', ');
                      else if (value.value) cleanHeaders[key] = value.value;
                      else cleanHeaders[key] = JSON.stringify(value);
                    }
                  }
                }

                // Track in database
                const trackedEmail = await emailTrackingService.trackReceivedEmail({
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

                // Emit real-time event to frontend via Socket.io
                if (global.io) {
                  global.io.to(`tenant-${tenantId}`).emit('new-email', {
                    email: trackedEmail,
                    notification: {
                      title: 'New Email Received',
                      message: `From: ${parsed.from?.text || parsed.from?.value?.[0]?.address}`,
                      subject: parsed.subject
                    }
                  });
                }

              } catch (error) {
                // Silent error - email processing failed
              }
            });
          });
        });

        fetch.once('error', (err) => {
          // Silent fetch error
        });

        fetch.once('end', () => {
          // Silent - finished processing
        });
      });

    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Handle disconnection and schedule reconnect
   */
  handleDisconnect(userId, tenantId, smtpHost, smtpUser, smtpPassword) {
    const userIdStr = userId.toString();
    const conn = this.connections.get(userIdStr);

    if (conn) {
      // Clear existing reconnect timer
      if (conn.reconnectTimer) {
        clearTimeout(conn.reconnectTimer);
      }

      // Remove connection
      this.connections.delete(userIdStr);
    }

    // Schedule reconnect if not shutting down
    if (!this.isShuttingDown) {
      this.scheduleReconnect(userId, tenantId, smtpHost, smtpUser, smtpPassword);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect(userId, tenantId, smtpHost, smtpUser, smtpPassword) {
    if (this.isShuttingDown) return;

    const reconnectTimer = setTimeout(() => {
      this.startIdleForUser(userId, tenantId, smtpHost, smtpUser, smtpPassword);
    }, 30000); // Reconnect after 30 seconds

    // Store timer reference
    const conn = this.connections.get(userId.toString());
    if (conn) {
      conn.reconnectTimer = reconnectTimer;
    }
  }

  /**
   * Start IDLE for all premium users
   */
  async startAllIdleConnections() {
    try {
      // console.log('\n🚀 Starting IMAP IDLE service for all premium users...\n');

      const premiumSettings = await UserSettings.find({
        'emailConfig.isPremium': true,
        'emailConfig.premiumSmtp.isVerified': true
      }).populate('user');

      // console.log(`📊 Found ${premiumSettings.length} premium users\n`);

      for (const settings of premiumSettings) {
        if (!settings.user) continue;

        const { smtpHost, smtpUser } = settings.emailConfig.premiumSmtp;
        const smtpPassword = settings.getDecryptedSmtpPassword();

        if (!smtpPassword) {
          continue;
        }

        await this.startIdleForUser(
          settings.user._id,
          settings.user.tenant,
          smtpHost,
          smtpUser,
          smtpPassword
        );

        // Add small delay between connections to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Silent start - IMAP IDLE service running
    } catch (error) {
      // Silent error
    }
  }

  /**
   * Stop IDLE for a specific user
   */
  stopIdleForUser(userId) {
    const userIdStr = userId.toString();
    const conn = this.connections.get(userIdStr);

    if (!conn) return;

    // Clear reconnect timer
    if (conn.reconnectTimer) {
      clearTimeout(conn.reconnectTimer);
    }

    // End IMAP connection
    if (conn.imap) {
      conn.imap.end();
    }

    // Remove from connections
    this.connections.delete(userIdStr);
  }

  /**
   * Stop all IDLE connections
   */
  async stopAllIdleConnections() {
    this.isShuttingDown = true;

    for (const [userId, conn] of this.connections) {
      // Clear reconnect timer
      if (conn.reconnectTimer) {
        clearTimeout(conn.reconnectTimer);
      }

      // End IMAP connection
      if (conn.imap) {
        conn.imap.end();
      }
    }

    this.connections.clear();
  }

  /**
   * Get connection status
   */
  getStatus() {
    const status = [];
    for (const [userId, conn] of this.connections) {
      status.push({
        userId,
        email: conn.smtpUser,
        connected: conn.imap && conn.imap.state === 'authenticated'
      });
    }
    return status;
  }
}

module.exports = new ImapIdleService();
