const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const cloudinary = require('cloudinary').v2;
const fs   = require('fs');
const path = require('path');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Logo URL — loaded from Cloudinary CDN (works in Gmail, Outlook, mobile, everywhere)
let LOGO_CDN_URL = '';

const initLogoUrl = async () => {
  if (LOGO_CDN_URL) return;
  try {
    // Check if already uploaded to Cloudinary
    const existing = await cloudinary.api.resource('unified-crm-email-logo').catch(() => null);
    if (existing?.secure_url) {
      LOGO_CDN_URL = existing.secure_url;
      console.log('✅ Email logo from Cloudinary (cached):', LOGO_CDN_URL);
      return;
    }
    // Upload fresh
    const logoPaths = [
      path.join(__dirname, '../../assets/logo.png'),
      path.join(__dirname, '../../../frontend/public/logo.png'),
    ];
    let logoFile = logoPaths.find(p => fs.existsSync(p));
    if (!logoFile) { console.warn('⚠️  Logo file not found for Cloudinary upload'); return; }

    const result = await cloudinary.uploader.upload(logoFile, {
      public_id: 'unified-crm-email-logo',
      overwrite:  true,
      folder:     'crm-assets',
    });
    LOGO_CDN_URL = result.secure_url;
    // console.log('✅ Email logo uploaded to Cloudinary:', LOGO_CDN_URL);
  } catch (e) {
    console.warn('⚠️  Cloudinary logo upload failed:', e.message);
  }
};

// Run on startup — non-blocking
initLogoUrl();

// AWS SES Client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const FROM_ADDRESS = `"${process.env.SES_FROM_NAME || 'Unified CRM'}" <${process.env.SES_FROM_EMAIL || 'no-reply@texora.ai'}>`;
const FROM_ADDRESS_NOREPLY = `"${process.env.SES_FROM_NAME || 'Unified CRM'}" <no-reply@texora.ai>`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://unifiedcrm.texora.ai';
const YEAR = new Date().getFullYear();

// ─── Send via SES ─────────────────────────────────────────────────────────────
const sendViaSES = async (to, subject, html, fromAddress = FROM_ADDRESS, plainText = null) => {
  const command = new SendEmailCommand({
    Source: fromAddress,
    Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
    ReplyToAddresses: ['support@texora.ai'],
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: html, Charset: 'UTF-8' },
        Text: { Data: plainText || html.replace(/<[^>]*>/g, ''), Charset: 'UTF-8' },
      },
    },
  });
  const result = await sesClient.send(command);
  console.log('✅ SES email sent:', result.MessageId, '→', to, 'from', fromAddress);
  console.log('📧 Subject:', subject);
  console.log('📧 To:', to);
  return result.MessageId;
};

const sendMail = async (opts) => {
  const toArr = Array.isArray(opts.to) ? opts.to : opts.to.split(/,\s*/);
  const fromAddress = opts.fromNoreply ? FROM_ADDRESS_NOREPLY : FROM_ADDRESS;
  const messageId = await sendViaSES(toArr, opts.subject, opts.html, fromAddress, opts.text || null);
  return { messageId };
};

const createTransporter = () => ({ verify: async () => {}, sendMail });

// ─── Base branded template ─────────────────────────────────────────────────────
const baseTemplate = ({ preheader = '', headerColor = '#1a365d', accentColor = '#2563eb', body }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>Unified CRM</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body,html{margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
    *{box-sizing:border-box;}
    a{color:${accentColor};text-decoration:none;}
    img{border:0;display:block;outline:none;text-decoration:none;}
    table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;}
    .email-wrapper{width:100%;background:#f5f7fa;padding:40px 20px;}
    .email-container{max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);border:1px solid #e2e8f0;}
    .email-header{background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%);padding:32px 40px;text-align:center;border-bottom:3px solid #2563eb;}
    .email-logo-container{display:inline-block;background:#ffffff;border-radius:6px;padding:12px 24px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
    .email-logo-text{font-size:26px;font-weight:800;color:#0f172a;letter-spacing:0.5px;margin:0;text-transform:uppercase;}
    .email-logo-text span{color:#2563eb;font-weight:900;}
    .email-body{padding:48px 40px;}
    .email-footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:32px 40px;text-align:center;}
    .email-footer-company{font-size:14px;font-weight:600;color:#334155;margin:0 0 12px 0;}
    .email-footer-links{font-size:13px;color:#64748b;margin:8px 0;}
    .email-footer-links a{color:#64748b;text-decoration:none;margin:0 8px;}
    .email-footer-links a:hover{color:#2563eb;}
    .email-footer-copyright{font-size:12px;color:#94a3b8;margin:16px 0 0 0;line-height:1.6;}
    .btn-primary{display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff !important;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;text-align:center;transition:background 0.2s;}
    .btn-primary:hover{background:#1d4ed8;}
    .btn-secondary{display:inline-block;padding:12px 24px;background:#f1f5f9;color:#334155 !important;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;border:1px solid #e2e8f0;}
    .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;}
    .info-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;}
    .info-row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;}
    .info-row:last-child{border-bottom:none;}
    .info-label{color:#64748b;font-weight:500;}
    .info-value{color:#1e293b;font-weight:600;}
    .alert-info{background:#eff6ff;border-left:4px solid #2563eb;border-radius:6px;padding:16px 20px;margin:24px 0;font-size:14px;color:#1e40af;}
    .alert-success{background:#f0fdf4;border-left:4px solid #10b981;border-radius:6px;padding:16px 20px;margin:24px 0;font-size:14px;color:#065f46;}
    .alert-warning{background:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;padding:16px 20px;margin:24px 0;font-size:14px;color:#92400e;}
    .alert-danger{background:#fef2f2;border-left:4px solid #ef4444;border-radius:6px;padding:16px 20px;margin:24px 0;font-size:14px;color:#991b1b;}
    .otp-container{background:#f8fafc;border:3px solid #2563eb;border-radius:8px;padding:32px 24px;text-align:center;margin:28px 0;}
    .otp-label{font-size:11px;font-weight:600;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px 0;}
    .otp-code{font-size:48px;font-weight:800;letter-spacing:16px;color:#1e293b;font-family:'Courier New',Courier,monospace;margin:0;background:#ffffff;padding:16px 24px;border-radius:6px;display:inline-block;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
    .divider{height:1px;background:#e2e8f0;margin:32px 0;}
    h1{font-size:28px;font-weight:700;color:#1e293b;margin:0 0 16px 0;line-height:1.3;}
    h2{font-size:22px;font-weight:600;color:#1e293b;margin:0 0 12px 0;line-height:1.4;}
    h3{font-size:18px;font-weight:600;color:#334155;margin:0 0 8px 0;}
    p{margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;}
    p:last-child{margin-bottom:0;}
    strong{color:#1e293b;font-weight:600;}
    .text-muted{color:#64748b;font-size:14px;}
    .text-center{text-align:center;}
    @media only screen and (max-width:600px){
      .email-wrapper{padding:20px 12px;}
      .email-header{padding:24px 20px;}
      .email-body{padding:32px 24px;}
      .email-footer{padding:24px 20px;}
      .otp-code{font-size:36px;letter-spacing:8px;}
      .info-row{flex-direction:column;gap:6px;}
      .info-value{text-align:left;}
      h1{font-size:24px;}
      h2{font-size:20px;}
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f5f7fa;">${preheader}</div>` : ''}
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="email-logo-container">
          ${LOGO_CDN_URL
            ? `<img src="${LOGO_CDN_URL}" alt="Unified CRM" width="160" style="display:block;width:160px;height:auto;margin:0 auto;" />`
            : `<h1 class="email-logo-text">Unified<span> CRM</span></h1>`
          }
        </div>
      </div>
      <div class="email-body">
        ${body}
      </div>
      <div class="email-footer">
        <p class="email-footer-company">Unified CRM — Powered by Texora Technologies</p>
        <p class="email-footer-links">
          <a href="${FRONTEND_URL}">Dashboard</a> |
          <a href="${FRONTEND_URL}/help">Help Center</a> |
          <a href="mailto:support@texora.ai">Contact Support</a>
        </p>
        <p class="email-footer-copyright">
          &copy; ${YEAR} Texora Technologies Pvt Ltd. All rights reserved.<br/>
          Texora Technologies, Bangalore, Karnataka, India<br/>
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;


// ─── 1. Password Reset OTP ────────────────────────────────────────────────────
const sendPasswordResetOTP = async (email, otp, userName) => {
  try {
    const plainText = `Hi ${userName || 'there'},\n\nWe received a request to reset your Unified CRM password.\n\nYour one-time password is: ${otp}\n\nThis code is valid for 3 minutes.\n\nSecurity notice: If you did not request a password reset, you can safely ignore this email. Your password will not change.\n\nBest regards,\nUnified CRM Team\nTexora Technologies`;

    const html = baseTemplate({
      preheader: `Your password reset OTP: ${otp}. Valid for 3 minutes.`,
      body: `
        <h2 style="font-size:22px;margin-bottom:4px;">Password Reset Request</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">We received a request to reset your password.</p>
        <p>Hi <strong>${userName || 'there'}</strong>,</p>
        <p>Use the OTP below to reset your Unified CRM password. This code is valid for <strong>3 minutes</strong>.</p>
        <div class="otp-container">
          <p class="otp-label">Your One-Time Password</p>
          <p class="otp-code">${otp}</p>
        </div>
        <div class="alert-warning">
          <strong>Security notice:</strong> If you did not request a password reset, you can safely ignore this email. Your password will not change.
        </div>
      `
    });
    const messageId = await sendViaSES(email, 'Password Reset Code - Unified CRM', html, FROM_ADDRESS, plainText);
    return { success: true, messageId };
  } catch (error) {
    console.error('❌ OTP email error:', error.message);
    throw new Error('Failed to send OTP email: ' + error.message);
  }
};


// ─── 2. Signup Verification OTP ───────────────────────────────────────────────
const sendSignupVerificationOTP = async (email, otp, userName) => {
  try {
    const mailOptions = {
      to: email,
      subject: 'Verify Your Email Address - Unified CRM',
      text: `Hello ${userName || 'there'},\n\nThanks for signing up for Unified CRM.\n\nYour email verification code is: ${otp}\n\nThis code expires in 3 minutes.\n\nIf you didn't create an account, you can safely ignore this email.\n\nBest regards,\nUnified CRM Team\nTexora Technologies`,
      html: baseTemplate({
        preheader: `Welcome! Your email verification code is ${otp}.`,
        body: `
          <h2 style="font-size:22px;margin-bottom:4px;">Verify Your Email Address</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Almost there! Just one step to go.</p>
          <p>Hello <strong>${userName || 'there'}</strong>,</p>
          <p>Thanks for signing up for Unified CRM. Enter the code below to verify your email address and complete your registration.</p>
          <div class="otp-container">
            <p class="otp-label">Email Verification Code</p>
            <p class="otp-code">${otp}</p>
          </div>
          <div class="alert-success">
            <strong>Code expires in 3 minutes.</strong> If you didn't create an account, you can safely ignore this email.
          </div>
          <p style="color:#6b7280;font-size:13px;">Once verified, you'll complete your profile and start using all CRM features.</p>
        `
      })
    };
    const info = await sendMail(mailOptions);

    try {
      const User = require('../models/User');
      const emailTrackingService = require('../services/emailTrackingService');
      const user = await User.findOne({ email });
      if (user) {
        await emailTrackingService.trackSentEmail({ messageId: info.messageId, from: FROM_ADDRESS, to: email, subject: mailOptions.subject, html: mailOptions.html, emailType: 'signup_verification', userId: user._id, tenantId: user.tenant, smtpMode: 'free' });
      }
    } catch {}

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Signup OTP error:', error.message);
    throw new Error('Failed to send signup verification OTP: ' + error.message);
  }
};


// ─── 3. Welcome Email ─────────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, userName, organizationName) => {
  try {
    const mailOptions = {
      to: email,
      subject: `Welcome to Unified CRM, ${userName}!`,
      text: `Hi ${userName},\n\nWelcome aboard! Your organization ${organizationName} is all set up and ready to go.\n\nYour Unified CRM account is live and ready to use. You can now:\n\n- Track leads through your full sales pipeline\n- Manage quotations, POs, and invoices\n- Invite your team and assign roles\n- Use AI-powered features for email drafting and lead scoring\n\nGet started: ${FRONTEND_URL}/dashboard\n\nNeed help? Visit our support center at ${FRONTEND_URL}/help\n\nBest regards,\nUnified CRM Team\nTexora Technologies`,
      html: baseTemplate({
        preheader: `Your CRM account for ${organizationName} is ready. Let's get started.`,
        body: `
          <h2 style="font-size:24px;margin-bottom:4px;">Welcome aboard!</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:28px;">Your organization is all set up and ready to go.</p>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Congratulations on completing your profile setup for <strong>${organizationName}</strong>. Your Unified CRM account is live and ready to use.</p>
          <div class="info-card">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
              <div style="width:40px;height:40px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">📊</div>
              <div><strong style="color:#111827;">Lead Management</strong><p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Track leads through your full sales pipeline</p></div>
            </div>
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
              <div style="width:40px;height:40px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">📄</div>
              <div><strong style="color:#111827;">Sales & Finance</strong><p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Quotations, POs, and invoices in one place</p></div>
            </div>
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
              <div style="width:40px;height:40px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">👥</div>
              <div><strong style="color:#111827;">Team Collaboration</strong><p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Invite your team and assign roles instantly</p></div>
            </div>
            <div style="display:flex;align-items:center;gap:14px;">
              <div style="width:40px;height:40px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🤖</div>
              <div><strong style="color:#111827;">AI Assistant</strong><p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Powered by Gemini — draft emails and score leads</p></div>
            </div>
          </div>
          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/dashboard" class="btn-primary">Go to Dashboard &rarr;</a>
          </div>
          <div class="alert-success">
            <strong>Quick tip:</strong> Start by inviting your team members from Settings &rarr; Users. Need help? Visit our <a href="${FRONTEND_URL}/help" style="color:#065f46;">support center</a>.
          </div>
        `
      })
    };
    const info = await sendMail(mailOptions);

    try {
      const User = require('../models/User');
      const emailTrackingService = require('../services/emailTrackingService');
      const user = await User.findOne({ email });
      if (user) {
        await emailTrackingService.trackSentEmail({ messageId: info.messageId, from: FROM_ADDRESS, to: email, subject: mailOptions.subject, html: mailOptions.html, emailType: 'welcome', userId: user._id, tenantId: user.tenant, smtpMode: 'free' });
      }
    } catch {}

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Welcome email error:', error.message);
    throw new Error('Failed to send welcome email: ' + error.message);
  }
};


// ─── 4. User Invitation ───────────────────────────────────────────────────────
const sendUserInvitationEmail = async ({ email, firstName, lastName, organizationName, invitedBy, roles, temporaryPassword }) => {
  try {
    const mailOptions = {
      to: email,
      subject: `You've been invited to join ${organizationName} on Unified CRM`,
      text: `Hi ${firstName} ${lastName},\n\nYou've been invited to join ${organizationName} on Unified CRM by ${invitedBy}.\n\nYour login credentials:\nEmail: ${email}\nTemporary Password: ${temporaryPassword}\nOrganization: ${organizationName}\nRole: ${roles}\n\nSign in now: ${FRONTEND_URL}/login\n\nSecurity: Please change your password immediately after your first login from Profile → Change Password.\n\nBest regards,\nUnified CRM Team\nTexora Technologies`,
      html: baseTemplate({
        preheader: `${invitedBy} has invited you to ${organizationName}. Your credentials are inside.`,
        body: `
          <h2 style="font-size:22px;margin-bottom:4px;">You're invited!</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:28px;">${invitedBy} has added you to <strong>${organizationName}</strong>.</p>
          <p>Hi <strong>${firstName} ${lastName}</strong>,</p>
          <p>You've been invited to join <strong>${organizationName}</strong> on Unified CRM as <strong>${roles}</strong>. Use the credentials below to sign in and get started.</p>
          <div class="info-card">
            <div class="info-row"><span class="info-label">Email</span><span class="info-value">${email}</span></div>
            <div class="info-row"><span class="info-label">Temporary Password</span><span class="info-value" style="font-family:'Courier New',monospace;font-size:15px;">${temporaryPassword}</span></div>
            <div class="info-row"><span class="info-label">Organization</span><span class="info-value">${organizationName}</span></div>
            <div class="info-row"><span class="info-label">Role</span><span class="info-value">${roles}</span></div>
          </div>
          <div style="text-align:center;margin:28px 0;">
            <a href="${FRONTEND_URL}/login" class="btn-primary">Sign In Now &rarr;</a>
          </div>
          <div class="alert-warning">
            <strong>Security:</strong> Please change your password immediately after your first login from Profile &rarr; Change Password.
          </div>
        `
      })
    };
    const info = await sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ User invitation email error:', error.message);
    throw new Error('Failed to send user invitation email: ' + error.message);
  }
};


// ─── 5. Lead Assignment ───────────────────────────────────────────────────────
const sendLeadAssignmentEmail = async (assignedUserEmail, assignedUserName, leadDetails, assignedByName) => {
  try {
    const rows = [
      leadDetails.company   && ['Company',    leadDetails.company],
      leadDetails.email     && ['Email',       leadDetails.email],
      leadDetails.phone     && ['Phone',       leadDetails.phone],
      leadDetails.jobTitle  && ['Job Title',   leadDetails.jobTitle],
      leadDetails.leadSource&& ['Source',      leadDetails.leadSource],
      leadDetails.leadStatus&& ['Status',      leadDetails.leadStatus],
      leadDetails.rating    && ['Rating',      leadDetails.rating],
    ].filter(Boolean);

    const mailOptions = {
      to: assignedUserEmail,
      subject: `New Lead Assigned: ${leadDetails.name}`,
      html: baseTemplate({
        preheader: `${assignedByName} assigned ${leadDetails.name} to you. Act now to boost conversion.`,
        body: `
          <h2 style="font-size:22px;margin-bottom:4px;">New Lead Assigned to You</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Assigned by <strong>${assignedByName}</strong></p>
          <p>Hi <strong>${assignedUserName}</strong>,</p>
          <p><strong>${assignedByName}</strong> has assigned the following lead to you. Reach out as soon as possible to maximize conversion.</p>
          <div class="info-card">
            <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:16px;">${leadDetails.name}</div>
            ${rows.map(([l,v]) => `<div class="info-row"><span class="info-label">${l}</span><span class="info-value">${v}</span></div>`).join('')}
          </div>
          <div style="text-align:center;margin:28px 0;">
            <a href="${FRONTEND_URL}/leads/${leadDetails.id}" class="btn-primary">View Lead &rarr;</a>
          </div>
          <div class="alert-success">
            <strong>Next step:</strong> Review the lead, log a call or send an email, and update the status from your dashboard.
          </div>
        `
      })
    };
    const info = await sendMail(mailOptions);

    try {
      const User = require('../models/User');
      const emailTrackingService = require('../services/emailTrackingService');
      const user = await User.findOne({ email: assignedUserEmail });
      if (user) {
        await emailTrackingService.trackSentEmail({ messageId: info.messageId, from: FROM_ADDRESS, to: assignedUserEmail, subject: mailOptions.subject, html: mailOptions.html, emailType: 'lead_assignment', userId: user._id, tenantId: user.tenant, smtpMode: 'free' });
      }
    } catch {}

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Lead assignment email error:', error.message);
    throw new Error('Failed to send lead assignment email: ' + error.message);
  }
};


// ─── 6. Send User Credentials Email ──────────────────────────────────────────
const sendUserCredentialsEmail = async ({ userEmail, userName, loginName, password, organizationName, permissions }) => {
  try {
    const permissionsList = permissions && permissions.length > 0
      ? permissions.map(p => `<li style="margin:4px 0;">${p}</li>`).join('')
      : '<li style="margin:4px 0;color:#94a3b8;">No specific permissions assigned</li>';

    const mailOptions = {
      to: userEmail,
      subject: `Welcome to ${organizationName} - Your Login Credentials`,
      text: `Hi ${userName},\n\nWelcome to ${organizationName} on Unified CRM!\n\nYour login credentials:\nLogin Username: ${loginName}\nPassword: ${password}\nOrganization: ${organizationName}\n\nYou can sign in at: ${FRONTEND_URL}/login\n\nYour Permissions:\n${permissions?.join(', ') || 'Contact admin for details'}\n\nBest regards,\n${organizationName}\nUnified CRM`,
      html: baseTemplate({
        preheader: `Your account credentials for ${organizationName}. Welcome aboard!`,
        body: `
          <h2 style="font-size:24px;margin-bottom:4px;">Welcome to ${organizationName}!</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:28px;">Your account is ready. Here are your login details.</p>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Welcome aboard! Your account has been created for <strong>${organizationName}</strong> on Unified CRM.</p>

          <div class="info-card">
            <h3 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 16px 0;">Login Credentials</h3>
            <div class="info-row"><span class="info-label">Login Username</span><span class="info-value" style="font-family:'Courier New',monospace;font-size:15px;">${loginName}</span></div>
            <div class="info-row"><span class="info-label">Password</span><span class="info-value" style="font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#dc2626;">${password}</span></div>
            <div class="info-row"><span class="info-label">Email</span><span class="info-value">${userEmail}</span></div>
            <div class="info-row"><span class="info-label">Organization</span><span class="info-value">${organizationName}</span></div>
          </div>

          <div style="text-align:center;margin:28px 0;">
            <a href="${FRONTEND_URL}/login" class="btn-primary">Sign In Now &rarr;</a>
          </div>

          <div class="info-card" style="background:#f0fdf4;border-left:4px solid #10b981;">
            <h3 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 12px 0;">Your Permissions</h3>
            <ul style="margin:0;padding-left:20px;color:#065f46;font-size:13px;">
              ${permissionsList}
            </ul>
          </div>

          <div class="alert-success">
            <strong>Need help?</strong> Contact your administrator or visit our <a href="${FRONTEND_URL}/help" style="color:#065f46;">support center</a>.
          </div>
        `
      })
    };

    const info = await sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ User credentials email error:', error.message);
    throw new Error('Failed to send user credentials email: ' + error.message);
  }
};


// ─── 7. Meeting Invitation ────────────────────────────────────────────────────
const sendMeetingInvitation = async (meeting, attendeeEmails, organizerName, organizerEmail = '') => {
  try {
    const meetingDate = new Date(meeting.from);
    const endDate     = new Date(meeting.to);
    const formattedDate = meetingDate.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const startTime     = meetingDate.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
    const endTime       = endDate.toLocaleTimeString('en-IN',     { hour:'2-digit', minute:'2-digit', hour12:true });
    const durationMins  = Math.round((endDate - meetingDate) / 60000);
    const durationText  = durationMins >= 60
      ? `${Math.floor(durationMins/60)}h ${durationMins%60>0 ? durationMins%60+'m' : ''}`.trim()
      : `${durationMins} minutes`;

    const mailOptions = {
      to: attendeeEmails.join(', '),
      ...(organizerEmail ? { replyTo: `"${organizerName}" <${organizerEmail}>` } : {}),
      subject: `Meeting Invitation: ${meeting.title}`,
      html: baseTemplate({
        preheader: `You're invited: ${meeting.title} on ${formattedDate} at ${startTime}.`,
        body: `
          <h2 style="font-size:22px;margin-bottom:4px;">You're invited to a meeting</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Organized by <strong>${organizerName}</strong></p>
          <div class="info-card">
            <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:16px;">${meeting.title}</div>
            <div class="info-row"><span class="info-label">Date</span><span class="info-value">${formattedDate}</span></div>
            <div class="info-row"><span class="info-label">Time</span><span class="info-value">${startTime} – ${endTime} IST</span></div>
            <div class="info-row"><span class="info-label">Duration</span><span class="info-value">${durationText}</span></div>
            <div class="info-row"><span class="info-label">Type</span><span class="info-value">${meeting.meetingType || 'Online'}</span></div>
            ${meeting.location ? `<div class="info-row"><span class="info-label">Location</span><span class="info-value">${meeting.location}</span></div>` : ''}
          </div>
          ${meeting.meetingLink ? `
          <div style="text-align:center;margin:28px 0;">
            <a href="${meeting.meetingLink}" class="btn-primary">Join Meeting &rarr;</a>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;word-break:break-all;">Or copy link: ${meeting.meetingLink}</p>
          ` : ''}
          ${meeting.description || meeting.agenda ? `
          <div class="divider"></div>
          <p style="font-weight:700;color:#111827;margin-bottom:8px;">Agenda</p>
          <p style="color:#374151;font-size:14px;">${meeting.agenda || meeting.description}</p>
          ` : ''}
          ${organizerEmail ? `
          <div class="alert-green" style="margin-top:20px;">
            Organized by <strong>${organizerName}</strong> &mdash; reply to <a href="mailto:${organizerEmail}" style="color:#065f46;">${organizerEmail}</a>
          </div>
          ` : ''}
        `
      })
    };
    const info = await sendMail(mailOptions);
    return { success: true, messageId: info.messageId, sentTo: attendeeEmails };
  } catch (error) {
    console.error('❌ Meeting invitation error:', error.message);
    throw new Error('Failed to send meeting invitation: ' + error.message);
  }
};


// ─── 7. Meeting Reminder ──────────────────────────────────────────────────────
const sendMeetingReminder = async (meeting, attendeeEmails) => {
  try {
    const meetingDate = new Date(meeting.from);
    const startTime   = meetingDate.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });

    const mailOptions = {
      to: attendeeEmails.join(', '),
      subject: `Reminder: "${meeting.title}" starts in 1 hour`,
      html: baseTemplate({
        preheader: `Your meeting "${meeting.title}" starts at ${startTime} IST — 1 hour from now.`,
        accentColor: '#f59e0b',
        body: `
          <h2 style="font-size:22px;margin-bottom:4px;">Meeting starts in 1 hour</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Time to get ready.</p>
          <div class="info-card">
            <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:16px;">${meeting.title}</div>
            <div class="info-row"><span class="info-label">Starts At</span><span class="info-value" style="color:#f59e0b;font-size:17px;">${startTime} IST</span></div>
            ${meeting.meetingType ? `<div class="info-row"><span class="info-label">Type</span><span class="info-value">${meeting.meetingType}</span></div>` : ''}
          </div>
          ${meeting.meetingLink ? `
          <div style="text-align:center;margin:28px 0;">
            <a href="${meeting.meetingLink}" class="btn-primary" style="background:#f59e0b;">Join Meeting &rarr;</a>
          </div>
          ` : ''}
        `
      })
    };
    const info = await sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Meeting reminder error:', error.message);
    throw new Error('Failed to send meeting reminder: ' + error.message);
  }
};


// ─── 8. Meeting Cancellation ──────────────────────────────────────────────────
const sendMeetingCancellation = async (meeting, attendeeEmails, reason = '') => {
  try {
    const meetingDate   = new Date(meeting.from);
    const formattedDate = meetingDate.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    const mailOptions = {
      to: attendeeEmails.join(', '),
      subject: `Meeting Cancelled: ${meeting.title}`,
      html: baseTemplate({
        preheader: `The meeting "${meeting.title}" scheduled for ${formattedDate} has been cancelled.`,
        accentColor: '#ef4444',
        body: `
          <h2 style="font-size:22px;margin-bottom:4px;">Meeting Cancelled</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">We're sorry for any inconvenience.</p>
          <div class="info-card">
            <div style="font-size:18px;font-weight:700;color:#9ca3af;text-decoration:line-through;margin-bottom:16px;">${meeting.title}</div>
            <div class="info-row"><span class="info-label">Was Scheduled</span><span class="info-value">${formattedDate}</span></div>
            <div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color:#ef4444;font-weight:700;">Cancelled</span></div>
          </div>
          ${reason ? `
          <div class="alert-danger">
            <strong>Cancellation reason:</strong> ${reason}
          </div>
          ` : ''}
          <p style="color:#6b7280;font-size:14px;">A new meeting may be rescheduled. You'll receive a fresh invitation when it's set up.</p>
        `
      })
    };
    const info = await sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Cancellation email error:', error.message);
    throw new Error('Failed to send cancellation email: ' + error.message);
  }
};


// ─── 9. Contact Inquiry Reply ─────────────────────────────────────────────────
const sendContactInquiryReply = async ({ toName, toEmail, subject, originalMessage, replyText }) => {
  const mailOptions = {
    to: toEmail,
    subject: `Re: ${subject} — Unified CRM`,
    html: baseTemplate({
      preheader: `Our response to your inquiry: ${subject}`,
      body: `
        <h2 style="font-size:22px;margin-bottom:4px;">Reply to Your Inquiry</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Subject: ${subject}</p>
        <p>Hello <strong>${toName}</strong>,</p>
        <p>Thank you for reaching out to us. Here is our response:</p>
        <div style="background:#f0fdf4;border-left:4px solid #1EB980;border-radius:0 8px 8px 0;padding:18px 20px;margin:20px 0;white-space:pre-wrap;font-size:14px;color:#111827;line-height:1.7;">${replyText}</div>
        <div class="divider"></div>
        <p style="font-size:12px;font-weight:700;color:#9ca3af;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:8px;">Your Original Message</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;font-size:13px;color:#6b7280;line-height:1.6;">${originalMessage}</div>
      `
    })
  };
  const info = await sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};


// ─── 10. Payment Success ──────────────────────────────────────────────────────
const sendPaymentSuccessEmail = async ({ email, userName, orgName, planName, amount, billingCycle, invoiceNumber, startDate, endDate }) => {
  try {
    const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

    const plainText = `Hi ${userName},\n\nPayment Successful! Your ${planName} plan is now active.\n\nInvoice Details:\nInvoice Number: ${invoiceNumber}\nOrganization: ${orgName}\nPlan: ${planName}\nBilling Cycle: ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'}\nValid From: ${fmt(startDate)}\nValid Until: ${fmt(endDate)}\nAmount Paid: ₹${Number(amount||0).toLocaleString('en-IN')}\n\nView your subscription: ${FRONTEND_URL}/subscription\n\nYou can download your invoice from the Subscription & Billing section in your dashboard.\n\nThank you for subscribing to Unified CRM!\n\nBest regards,\nUnified CRM Team\nTexora Technologies`;

    const html = baseTemplate({
      preheader: `Payment confirmed! Your ${planName} plan is now active.`,
      body: `
        <h2 style="font-size:22px;margin-bottom:4px;">Payment Successful</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Your ${planName} plan is now active.</p>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Thank you for subscribing to Unified CRM. Your payment has been confirmed and your subscription is live.</p>
        <div class="info-card">
          <div class="info-row"><span class="info-label">Invoice Number</span><span class="info-value">${invoiceNumber}</span></div>
          <div class="info-row"><span class="info-label">Organization</span><span class="info-value">${orgName}</span></div>
          <div class="info-row"><span class="info-label">Plan</span><span class="info-value">${planName}</span></div>
          <div class="info-row"><span class="info-label">Billing Cycle</span><span class="info-value">${billingCycle === 'yearly' ? 'Annual' : 'Monthly'}</span></div>
          <div class="info-row"><span class="info-label">Valid From</span><span class="info-value">${fmt(startDate)}</span></div>
          <div class="info-row"><span class="info-label">Valid Until</span><span class="info-value">${fmt(endDate)}</span></div>
          <div class="info-row" style="border-top:2px solid #e8edf2;padding-top:16px;margin-top:8px;">
            <span class="info-label" style="font-size:16px;font-weight:700;color:#111827;">Amount Paid</span>
            <span class="info-value" style="font-size:20px;color:#1EB980;">₹${Number(amount||0).toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="${FRONTEND_URL}/subscription" class="btn-primary">View Subscription &rarr;</a>
        </div>
        <p style="color:#6b7280;font-size:13px;">You can download your invoice from the <strong>Subscription &amp; Billing</strong> section in your dashboard.</p>
      `
    });
    await sendViaSES(email, `Payment Confirmed - ${planName} Plan Activated`, html, FROM_ADDRESS, plainText);
    return { success: true };
  } catch (err) {
    console.error('sendPaymentSuccessEmail error:', err.message);
  }
};


// ─── 11–15. Org Deletion Flow ─────────────────────────────────────────────────
const sendDeletionRequestNotification = async (saasAdminEmail, tenant, reason) => {
  const requestDate = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const requestId = tenant.deletionRequest?.requestId || 'N/A';
  const html = baseTemplate({
    preheader: `Deletion request received from ${tenant.organizationName}`,
    accentColor: '#ef4444',
    body: `
      <h2 style="font-size:22px;margin-bottom:4px;">🚨 Deletion Request Received</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">An organization has requested account deletion.</p>
      <div class="info-card">
        <div class="info-row"><span class="info-label">Request ID</span><span class="info-value" style="font-family:monospace;font-weight:700;color:#ef4444;">${requestId}</span></div>
        <div class="info-row"><span class="info-label">Organization</span><span class="info-value">${tenant.organizationName}</span></div>
        <div class="info-row"><span class="info-label">Org ID</span><span class="info-value">${tenant.organizationId || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Contact Email</span><span class="info-value">${tenant.contactEmail || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Request Date</span><span class="info-value">${requestDate}</span></div>
        ${reason ? `<div class="info-row"><span class="info-label">Reason</span><span class="info-value">${reason}</span></div>` : ''}
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/saas/tenants" class="btn-primary" style="background:#ef4444;">View in Admin Dashboard &rarr;</a>
      </div>
      <p style="color:#6b7280;font-size:13px;">Please review and contact the organization admin before approving permanent deletion.</p>
    `
  });
  await sendMail({ to: saasAdminEmail, subject: `🚨 Deletion Request ${requestId}: ${tenant.organizationName}`, html });
  return { success: true };
};

const sendDeletionRequestConfirmation = async (tenantEmail, orgName, firstName, requestId) => {
  const html = baseTemplate({
    preheader: `We've received your deletion request for ${orgName}.`,
    accentColor: '#f59e0b',
    body: `
      <h2 style="font-size:22px;margin-bottom:4px;">Deletion Request Received</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">${orgName}</p>
      <p>Hi <strong>${firstName || 'Admin'}</strong>,</p>
      <p>We have received your request to delete the organization <strong>${orgName}</strong>. Our team will review it and get in touch with you shortly.</p>
      ${requestId ? `
      <div class="info-card">
        <div class="info-row"><span class="info-label">Request ID</span><span class="info-value" style="font-family:monospace;font-weight:700;color:#f59e0b;">${requestId}</span></div>
      </div>
      ` : ''}
      <div class="alert-yellow">
        <strong>What happens next?</strong><br/>
        Our SAAS admin will review your request &rarr; We may contact you for clarification &rarr; You will receive a decision email &rarr; If approved, you get a <strong>30-day recovery window</strong>.
      </div>
      <p style="color:#6b7280;font-size:13px;">If you wish to cancel this request, please contact us at <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER}</a>.</p>
    `
  });
  await sendMail({ to: tenantEmail, subject: `Deletion Request Received — ${orgName}`, html });
  return { success: true };
};

const sendDeletionApprovedEmail = async (tenantEmail, orgName, permanentDeleteAt, firstName) => {
  const deleteDate = new Date(permanentDeleteAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const html = baseTemplate({
    preheader: `Your deletion request for ${orgName} has been approved.`,
    accentColor: '#ef4444',
    body: `
      <h2 style="font-size:22px;margin-bottom:4px;">Account Deletion Approved</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">${orgName}</p>
      <p>Hi <strong>${firstName || 'Admin'}</strong>,</p>
      <p>Your request to delete <strong>${orgName}</strong> has been approved. Your account has been deactivated.</p>
      <div class="info-card">
        <div class="info-row"><span class="info-label">Organization</span><span class="info-value">${orgName}</span></div>
        <div class="info-row"><span class="info-label">Permanent deletion on</span><span class="info-value" style="color:#ef4444;">${deleteDate}</span></div>
        <div class="info-row"><span class="info-label">Recovery window</span><span class="info-value">30 days</span></div>
      </div>
      <div class="alert-green">
        <strong>Recovery window active:</strong> Contact our support before <strong>${deleteDate}</strong> to restore your account and all data.
      </div>
      <p style="color:#6b7280;font-size:13px;">Questions? Contact us at <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER}</a>.</p>
    `
  });
  await sendMail({ to: tenantEmail, subject: `Account Deletion Approved — ${orgName}`, html });
  return { success: true };
};

const sendDeletionRejectedEmail = async (tenantEmail, orgName, rejectionReason, firstName) => {
  const html = baseTemplate({
    preheader: `Your deletion request for ${orgName} has been rejected — account remains active.`,
    body: `
      <h2 style="font-size:22px;margin-bottom:4px;">Deletion Request Rejected</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">${orgName} — your account remains fully active.</p>
      <p>Hi <strong>${firstName || 'Admin'}</strong>,</p>
      <p>Your deletion request for <strong>${orgName}</strong> has been reviewed and <strong>rejected</strong>. Your account remains active with all data intact.</p>
      ${rejectionReason ? `
      <div class="info-card">
        <p style="font-size:13px;font-weight:700;color:#374151;margin-bottom:8px;">Reason from Admin</p>
        <p style="font-size:14px;color:#4b5563;margin:0;">${rejectionReason}</p>
      </div>
      ` : ''}
      <div class="alert-green">Your leads, contacts, and all CRM data remain unchanged.</div>
      <p style="color:#6b7280;font-size:13px;">Still want to delete your account? Contact us at <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER}</a>.</p>
    `
  });
  await sendMail({ to: tenantEmail, subject: `Deletion Request Rejected — ${orgName}`, html });
  return { success: true };
};

const sendAccountRecoveredEmail = async (tenantEmail, orgName, firstName) => {
  const html = baseTemplate({
    preheader: `Your account ${orgName} has been successfully recovered.`,
    body: `
      <h2 style="font-size:22px;margin-bottom:4px;">Account Recovered Successfully</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">${orgName}</p>
      <p>Hi <strong>${firstName || 'Admin'}</strong>,</p>
      <p>Great news! Your organization <strong>${orgName}</strong> has been fully recovered. Your account is active and all data is intact.</p>
      <div class="alert-green">
        All leads, contacts, accounts, and team members have been restored. You can log in right now.
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/login" class="btn-primary">Login to Your Account &rarr;</a>
      </div>
      <p style="color:#6b7280;font-size:13px;">Questions? Contact us at <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER}</a>.</p>
    `
  });
  await sendMail({ to: tenantEmail, subject: `Account Recovered — ${orgName}`, html });
  return { success: true };
};

// Password Expiry Warning Email
const sendPasswordExpiryWarning = async (userEmail, userName, daysRemaining) => {
  const plainText = `Hi ${userName},\n\nYour password will expire in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}.\n\nSecurity Policy: Passwords must be changed every 90 days to keep your account secure.\n\nAfter expiry, you'll be required to change your password before accessing your account.\n\nChange password now: ${FRONTEND_URL}/security\n\nNeed help? Contact support at ${process.env.SMTP_USER}.\n\nBest regards,\nUnified CRM Team`;

  const html = baseTemplate({
    preheader: `Your password expires in ${daysRemaining} days. Change it now to keep your account secure.`,
    body: `
      <h2 style="font-size:22px;margin-bottom:4px;">Password Expiry Warning</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Your password will expire in <strong style="color:#dc2626;font-size:18px;">${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}</strong>.</p>
      <div class="alert-warning">
        <strong>Security Policy:</strong> Passwords must be changed every 90 days to keep your account secure.
      </div>
      <p>After expiry, you'll be required to change your password before accessing your account.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/security" class="btn-primary">Change Password Now &rarr;</a>
      </div>
      <p style="color:#6b7280;font-size:13px;">Need help? Contact support at <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER}</a>.</p>
    `
  });
  await sendMail({ to: userEmail, subject: `Password Expires in ${daysRemaining} Days - Unified CRM`, html, text: plainText, fromNoreply: true });
  return { success: true };
};

// Password Expired Email
const sendPasswordExpiredEmail = async (userEmail, userName) => {
  const plainText = `Hi ${userName},\n\nYour password has expired as per our 90-day security policy.\n\nYou must reset your password before you can log in again.\n\nReset password now: ${FRONTEND_URL}/forgot-password\n\nThis is a security measure to protect your account. Thank you for understanding.\n\nBest regards,\nUnified CRM Team`;

  const html = baseTemplate({
    preheader: 'Your password has expired. Reset it now to access your account.',
    body: `
      <h2 style="font-size:22px;margin-bottom:4px;">Password Expired</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Your password has expired as per our 90-day security policy.</p>
      <div class="alert-danger">
        You must reset your password before you can log in again.
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/forgot-password" class="btn-primary">Reset Password Now &rarr;</a>
      </div>
      <p style="color:#6b7280;font-size:13px;">This is a security measure to protect your account. Thank you for understanding.</p>
    `
  });
  await sendMail({ to: userEmail, subject: 'Password Expired - Action Required - Unified CRM', html, text: plainText, fromNoreply: true });
  return { success: true };
};

module.exports = {
  sendPasswordResetOTP,
  sendSignupVerificationOTP,
  sendMeetingInvitation,
  sendMeetingReminder,
  sendMeetingCancellation,
  sendUserInvitationEmail,
  sendWelcomeEmail,
  sendUserCredentialsEmail,
  sendLeadAssignmentEmail,
  sendDeletionRequestNotification,
  sendDeletionRequestConfirmation,
  sendDeletionApprovedEmail,
  sendDeletionRejectedEmail,
  sendAccountRecoveredEmail,
  sendContactInquiryReply,
  sendPaymentSuccessEmail,
  sendPasswordExpiryWarning,
  sendPasswordExpiredEmail,
  sendMail,
  createTransporter,
};
