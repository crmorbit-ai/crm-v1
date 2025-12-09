const mongoose = require('mongoose');
const crypto = require('crypto');

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emailConfig: {
    // Basic settings (free tier)
    displayName: {
      type: String,
      trim: true,
      default: ''
    },
    replyToEmail: {
      type: String,
      trim: true,
      default: ''
    },
    emailSignature: {
      type: String,
      default: ''
    },
    isConfigured: {
      type: Boolean,
      default: false
    },

    // Premium SMTP (when user purchases email product)
    isPremium: {
      type: Boolean,
      default: false
    },
    premiumSmtp: {
      smtpHost: {
        type: String,
        default: ''
      },
      smtpPort: {
        type: Number,
        default: 587
      },
      smtpUser: {
        type: String,
        default: ''
      },
      smtpPassword: {
        type: String, // Will be encrypted
        default: ''
      },
      fromEmail: {
        type: String,
        default: ''
      },
      isVerified: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true
});

// Encrypt SMTP password before saving
userSettingsSchema.pre('save', function(next) {
  if (this.emailConfig?.premiumSmtp?.smtpPassword &&
      this.isModified('emailConfig.premiumSmtp.smtpPassword') &&
      !this.emailConfig.premiumSmtp.smtpPassword.includes(':')) { // Not already encrypted

    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'my-super-secret-encryption-key-32';
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(this.emailConfig.premiumSmtp.smtpPassword, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    this.emailConfig.premiumSmtp.smtpPassword = iv.toString('hex') + ':' + encrypted;
  }
  next();
});

// Method to decrypt SMTP password
userSettingsSchema.methods.getDecryptedSmtpPassword = function() {
  if (!this.emailConfig?.premiumSmtp?.smtpPassword) return null;

  try {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'my-super-secret-encryption-key-32';

    const parts = this.emailConfig.premiumSmtp.smtpPassword.split(':');
    if (parts.length !== 2) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error decrypting SMTP password:', error);
    return null;
  }
};

module.exports = mongoose.model('UserSettings', userSettingsSchema);
