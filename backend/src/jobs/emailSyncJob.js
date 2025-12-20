const cron = require('node-cron');
const imapService = require('../services/imapService');
const Tenant = require('../models/Tenant');

class EmailSyncJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start method (disabled automatic cron - only manual sync available)
   */
  start() {
    console.log('✅ Email sync service ready (manual sync only)');
    // Automatic cron disabled - IMAP IDLE handles real-time sync
    // Manual sync still available via sync button
  }

  /**
   * Manual sync trigger
   */
  async syncNow(tenantId) {
    if (this.isRunning) {
      return { success: false, error: 'Sync already running' };
    }

    this.isRunning = true;
    try {
      const results = await imapService.syncTenantEmails(tenantId);
      return { success: true, results };
    } catch (error) {
      console.error('Manual sync failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = new EmailSyncJob();
