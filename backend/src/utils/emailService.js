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
    console.log('✅ Email logo uploaded to Cloudinary:', LOGO_CDN_URL);
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
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://unified-crm.texora.ai';
const YEAR = new Date().getFullYear();

// ─── Send via SES ─────────────────────────────────────────────────────────────
const sendViaSES = async (to, subject, html) => {
  const command = new SendEmailCommand({
    Source: FROM_ADDRESS,
    Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: html, Charset: 'UTF-8' },
        Text: { Data: html.replace(/<[^>]*>/g, ''), Charset: 'UTF-8' },
      },
    },
  });
  const result = await sesClient.send(command);
  console.log('✅ SES email sent:', result.MessageId, '→', to);
  return result.MessageId;
};

const sendMail = async (opts) => {
  const toArr = Array.isArray(opts.to) ? opts.to : opts.to.split(/,\s*/);
  const messageId = await sendViaSES(toArr, opts.subject, opts.html);
  return { messageId };
};

const createTransporter = () => ({ verify: async () => {}, sendMail });

// ─── Base branded template ─────────────────────────────────────────────────────
const baseTemplate = ({ preheader = '', headerColor = '#0f1e2e', accentColor = '#1EB980', body }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>Unified CRM</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body,html{margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
    *{box-sizing:border-box;}
    a{color:${accentColor};}
    img{border:0;display:block;}
    .email-body{background:#f0f4f8;padding:40px 16px;}
    .email-card{max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);}
    .email-header{background:${headerColor};padding:36px 40px 32px;text-align:center;}
    .email-header-logo{display:inline-flex;align-items:center;gap:10px;margin-bottom:0;}
    .email-header-dot{width:10px;height:10px;border-radius:50%;background:${accentColor};display:inline-block;}
    .email-header-brand{font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;}
    .email-header-brand span{color:${accentColor};}
    .email-header-divider{width:40px;height:2px;background:${accentColor};border-radius:2px;margin:16px auto 0;opacity:0.7;}
    .email-content{padding:40px;}
    .email-footer{background:#f8fafc;border-top:1px solid #e8edf2;padding:28px 40px;text-align:center;}
    .email-footer p{margin:4px 0;font-size:12px;color:#94a3b8;line-height:1.6;}
    .email-footer a{color:#94a3b8;text-decoration:underline;}
    .btn{display:inline-block;padding:14px 32px;background:${accentColor};color:#ffffff !important;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.2px;}
    .btn-outline{display:inline-block;padding:13px 30px;background:transparent;color:${accentColor} !important;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;border:2px solid ${accentColor};}
    .info-card{background:#f8fafc;border-radius:10px;border:1px solid #e8edf2;padding:20px 24px;margin:20px 0;}
    .info-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #e8edf2;font-size:14px;}
    .info-row:last-child{border-bottom:none;padding-bottom:0;}
    .info-label{color:#6b7280;font-weight:500;}
    .info-value{color:#111827;font-weight:600;text-align:right;}
    .alert-box{border-radius:8px;padding:16px 20px;margin:20px 0;font-size:14px;line-height:1.6;}
    .alert-green{background:#f0fdf4;border-left:4px solid ${accentColor};color:#065f46;}
    .alert-yellow{background:#fffbeb;border-left:4px solid #f59e0b;color:#92400e;}
    .alert-red{background:#fef2f2;border-left:4px solid #ef4444;color:#991b1b;}
    .otp-block{background:${headerColor};border-radius:12px;padding:28px;text-align:center;margin:24px 0;}
    .otp-code{font-size:46px;font-weight:800;letter-spacing:14px;color:#ffffff;font-family:'Courier New',monospace;}
    .divider{height:1px;background:#e8edf2;margin:24px 0;}
    h1,h2,h3{margin:0 0 8px;color:#111827;}
    p{margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;}
    p:last-child{margin-bottom:0;}
    @media(max-width:600px){
      .email-content{padding:28px 24px;}
      .email-header{padding:28px 24px;}
      .email-footer{padding:20px 24px;}
      .info-row{flex-direction:column;align-items:flex-start;gap:4px;}
      .info-value{text-align:left;}
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f0f4f8;">${preheader}</div>` : ''}
  <div class="email-body">
    <div class="email-card">
      <div class="email-header">
        <div style="display:inline-block;background:#ffffff;border-radius:10px;padding:10px 20px;margin-bottom:16px;min-width:160px;text-align:center;">
          ${LOGO_CDN_URL
            ? `<img src="${LOGO_CDN_URL}" alt="Unified CRM" width="150" style="display:block;width:150px;height:auto;border:0;margin:0 auto;" />`
            : `<span style="font-size:20px;font-weight:800;color:#0f1e2e;font-family:Arial,sans-serif;letter-spacing:-0.5px;">Unified<span style="color:#1EB980;"> CRM</span></span>`
          }
        </div>
        <div class="email-header-divider"></div>
      </div>
      <div class="email-content">
        ${body}
      </div>
      <div class="email-footer">
        <p><strong style="color:#374151;">Unified CRM</strong> &mdash; powered by Texora</p>
        <p>no-reply@texora.ai &nbsp;&bull;&nbsp; <a href="${FRONTEND_URL}/help">Support</a> &nbsp;&bull;&nbsp; <a href="${FRONTEND_URL}">Website</a></p>
        <p style="margin-top:12px;">&copy; ${YEAR} Texora Technologies. All rights reserved.</p>
        <p>This is an automated email &mdash; please do not reply directly to this message.</p>
      </div>
    </div>
  </div>
</body>
</html>`;


// ─── 1. Password Reset OTP ────────────────────────────────────────────────────
const sendPasswordResetOTP = async (email, otp, userName) => {
  try {
    const html = baseTemplate({
      preheader: `Your password reset OTP: ${otp}. Valid for 3 minutes.`,
      body: `
        <h2 style="font-size:22px;margin-bottom:4px;">Password Reset Request</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">We received a request to reset your password.</p>
        <p>Hi <strong>${userName || 'there'}</strong>,</p>
        <p>Use the OTP below to reset your Unified CRM password. This code is valid for <strong>3 minutes</strong>.</p>
        <div class="otp-block">
          <p style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Your One-Time Password</p>
          <div class="otp-code">${otp}</div>
        </div>
        <div class="alert-yellow">
          <strong>Security notice:</strong> If you did not request a password reset, you can safely ignore this email. Your password will not change.
        </div>
      `
    });
    const messageId = await sendViaSES(email, 'Password Reset OTP — Unified CRM', html);
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
      subject: 'Verify Your Email — Unified CRM',
      html: baseTemplate({
        preheader: `Welcome! Your email verification code is ${otp}.`,
        body: `
          <h2 style="font-size:22px;margin-bottom:4px;">Verify Your Email Address</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Almost there! Just one step to go.</p>
          <p>Hello <strong>${userName || 'there'}</strong>,</p>
          <p>Thanks for signing up for Unified CRM. Enter the code below to verify your email address and complete your registration.</p>
          <div class="otp-block">
            <p style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Email Verification Code</p>
            <div class="otp-code">${otp}</div>
          </div>
          <div class="alert-green">
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
            <a href="${FRONTEND_URL}/dashboard" class="btn">Go to Dashboard &rarr;</a>
          </div>
          <div class="alert-green">
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
            <a href="${FRONTEND_URL}/login" class="btn">Sign In Now &rarr;</a>
          </div>
          <div class="alert-yellow">
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
            <a href="${FRONTEND_URL}/leads/${leadDetails.id}" class="btn">View Lead &rarr;</a>
          </div>
          <div class="alert-green">
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


// ─── 6. Meeting Invitation ────────────────────────────────────────────────────
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
            <a href="${meeting.meetingLink}" class="btn">Join Meeting &rarr;</a>
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
            <a href="${meeting.meetingLink}" class="btn" style="background:#f59e0b;">Join Meeting &rarr;</a>
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
          <div class="alert-red">
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
          <a href="${FRONTEND_URL}/subscription" class="btn">View Subscription &rarr;</a>
        </div>
        <p style="color:#6b7280;font-size:13px;">You can download your invoice from the <strong>Subscription &amp; Billing</strong> section in your dashboard.</p>
      `
    });
    await sendViaSES(email, `Payment Confirmed — ${planName} Plan Activated`, html);
    return { success: true };
  } catch (err) {
    console.error('sendPaymentSuccessEmail error:', err.message);
  }
};


// ─── 11–15. Org Deletion Flow ─────────────────────────────────────────────────
const sendDeletionRequestNotification = async (saasAdminEmail, tenant, reason) => {
  const requestDate = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const html = baseTemplate({
    preheader: `Deletion request received from ${tenant.organizationName}`,
    accentColor: '#ef4444',
    body: `
      <h2 style="font-size:22px;margin-bottom:4px;">Deletion Request Received</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">An organization has requested account deletion.</p>
      <div class="info-card">
        <div class="info-row"><span class="info-label">Organization</span><span class="info-value">${tenant.organizationName}</span></div>
        <div class="info-row"><span class="info-label">Org ID</span><span class="info-value">${tenant.organizationId || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Contact Email</span><span class="info-value">${tenant.contactEmail || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Request Date</span><span class="info-value">${requestDate}</span></div>
        ${reason ? `<div class="info-row"><span class="info-label">Reason</span><span class="info-value">${reason}</span></div>` : ''}
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/saas/tenants" class="btn" style="background:#ef4444;">View in Admin Dashboard &rarr;</a>
      </div>
      <p style="color:#6b7280;font-size:13px;">Please review and contact the organization admin before approving permanent deletion.</p>
    `
  });
  await sendMail({ to: saasAdminEmail, subject: `Deletion Request: ${tenant.organizationName}`, html });
  return { success: true };
};

const sendDeletionRequestConfirmation = async (tenantEmail, orgName, firstName) => {
  const html = baseTemplate({
    preheader: `We've received your deletion request for ${orgName}.`,
    accentColor: '#f59e0b',
    body: `
      <h2 style="font-size:22px;margin-bottom:4px;">Deletion Request Received</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">${orgName}</p>
      <p>Hi <strong>${firstName || 'Admin'}</strong>,</p>
      <p>We have received your request to delete the organization <strong>${orgName}</strong>. Our team will review it and get in touch with you shortly.</p>
      <div class="alert-yellow">
        <strong>What happens next?</strong><br/>
        Our SAAS admin will review your request &rarr; We may contact you for clarification &rarr; You will receive a decision email &rarr; If approved, you get a <strong>45-day recovery window</strong>.
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
        <div class="info-row"><span class="info-label">Recovery window</span><span class="info-value">45 days</span></div>
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
        <a href="${FRONTEND_URL}/login" class="btn">Login to Your Account &rarr;</a>
      </div>
      <p style="color:#6b7280;font-size:13px;">Questions? Contact us at <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER}</a>.</p>
    `
  });
  await sendMail({ to: tenantEmail, subject: `Account Recovered — ${orgName}`, html });
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
  sendLeadAssignmentEmail,
  sendDeletionRequestNotification,
  sendDeletionRequestConfirmation,
  sendDeletionApprovedEmail,
  sendDeletionRejectedEmail,
  sendAccountRecoveredEmail,
  sendContactInquiryReply,
  sendPaymentSuccessEmail,
  sendMail,
  createTransporter,
};
