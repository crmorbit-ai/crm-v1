const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

/**
 * Send OTP for password reset
 */
const sendPasswordResetOTP = async (email, otp, userName) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const mailOptions = {
      from: `"UFS CRM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset OTP - UFS CRM',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
            .logo { font-size: 32px; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .otp-container { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 48px; font-weight: 700; letter-spacing: 12px; color: white; font-family: 'Courier New', monospace; }
            .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐</div>
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${userName || 'User'},</p>
              <p>Use the OTP code below to reset your password:</p>
              <div class="otp-container">
                <div class="otp-code">${otp}</div>
              </div>
              <p><strong>⏰ This OTP expires in 10 minutes.</strong></p>
            </div>
            <div class="footer">
              <p>UFS CRM © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent:', info.messageId);

    // Track sent email
    try {
      const User = require('../models/User');
      const emailTrackingService = require('../services/emailTrackingService');
      const user = await User.findOne({ email });

      if (user) {
        await emailTrackingService.trackSentEmail({
          messageId: info.messageId,
          from: mailOptions.from,
          to: email,
          subject: mailOptions.subject,
          html: mailOptions.html,
          emailType: 'otp',
          userId: user._id,
          tenantId: user.tenant,
          smtpMode: 'free'
        });
      }
    } catch (trackError) {
      console.error('Email tracking failed:', trackError);
      // Don't fail the email send if tracking fails
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ OTP email error:', error.message);
    throw new Error('Failed to send OTP email: ' + error.message);
  }
};

/**
 * Send Meeting Invitation Email
 */
const sendMeetingInvitation = async (meeting, attendeeEmails, organizerName) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified for meeting invitation');

    // Format date and time
    const meetingDate = new Date(meeting.from);
    const endDate = new Date(meeting.to);
    
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    
    const formattedDate = meetingDate.toLocaleDateString('en-IN', dateOptions);
    const startTime = meetingDate.toLocaleTimeString('en-IN', timeOptions);
    const endTime = endDate.toLocaleTimeString('en-IN', timeOptions);
    
    // Calculate duration
    const durationMs = endDate - meetingDate;
    const durationMinutes = Math.round(durationMs / 60000);
    const durationText = durationMinutes >= 60 
      ? `${Math.floor(durationMinutes / 60)} hour${Math.floor(durationMinutes / 60) > 1 ? 's' : ''} ${durationMinutes % 60 > 0 ? (durationMinutes % 60) + ' minutes' : ''}`
      : `${durationMinutes} minutes`;

    const mailOptions = {
      from: `"UFS CRM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: attendeeEmails.join(', '),
      subject: `📅 Meeting Invitation: ${meeting.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
            .header-icon { font-size: 48px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px 30px; }
            .meeting-card { background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(102, 126, 234, 0.2); }
            .meeting-title { font-size: 22px; font-weight: 700; color: #1F2937; margin-bottom: 20px; }
            .detail-row { display: flex; align-items: center; margin-bottom: 16px; }
            .detail-icon { font-size: 20px; width: 40px; height: 40px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
            .detail-content { flex: 1; }
            .detail-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
            .detail-value { font-size: 16px; color: #1F2937; font-weight: 600; }
            .join-button { display: block; width: 100%; padding: 18px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; text-align: center; border-radius: 12px; font-size: 18px; font-weight: 700; margin: 30px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s; }
            .join-button:hover { transform: translateY(-2px); }
            .link-box { background: #F3F4F6; border-radius: 8px; padding: 16px; margin-top: 20px; word-break: break-all; }
            .link-label { font-size: 12px; color: #6B7280; margin-bottom: 8px; }
            .link-url { font-size: 14px; color: #3B82F6; }
            .agenda-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid #E5E7EB; }
            .agenda-title { font-size: 16px; font-weight: 600; color: #1F2937; margin-bottom: 12px; }
            .agenda-content { font-size: 14px; color: #4B5563; line-height: 1.6; }
            .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
            .footer p { margin: 5px 0; color: #6B7280; font-size: 13px; }
            .organizer-info { background: #EFF6FF; border-radius: 8px; padding: 16px; margin-top: 20px; }
            .organizer-label { font-size: 12px; color: #3B82F6; margin-bottom: 4px; }
            .organizer-name { font-size: 16px; color: #1E40AF; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-icon">🎥</div>
              <h1>You're Invited to a Meeting!</h1>
              <p>Please join us at the scheduled time</p>
            </div>
            
            <div class="content">
              <div class="meeting-card">
                <div class="meeting-title">📌 ${meeting.title}</div>
                
                <div class="detail-row">
                  <div class="detail-icon">📅</div>
                  <div class="detail-content">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formattedDate}</div>
                  </div>
                </div>
                
                <div class="detail-row">
                  <div class="detail-icon">⏰</div>
                  <div class="detail-content">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${startTime} - ${endTime} IST</div>
                  </div>
                </div>
                
                <div class="detail-row">
                  <div class="detail-icon">⏱️</div>
                  <div class="detail-content">
                    <div class="detail-label">Duration</div>
                    <div class="detail-value">${durationText}</div>
                  </div>
                </div>
                
                ${meeting.location ? `
                <div class="detail-row">
                  <div class="detail-icon">📍</div>
                  <div class="detail-content">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${meeting.location}</div>
                  </div>
                </div>
                ` : ''}
                
                <div class="detail-row">
                  <div class="detail-icon">💻</div>
                  <div class="detail-content">
                    <div class="detail-label">Meeting Type</div>
                    <div class="detail-value">${meeting.meetingType || 'Online'}</div>
                  </div>
                </div>
              </div>
              
              <a href="${meeting.meetingLink}" class="join-button" target="_blank">
                🚀 Join Meeting Now
              </a>
              
              <div class="link-box">
                <div class="link-label">Or copy this link:</div>
                <div class="link-url">${meeting.meetingLink}</div>
              </div>
              
              ${meeting.description || meeting.agenda ? `
              <div class="agenda-section">
                <div class="agenda-title">📋 ${meeting.agenda ? 'Agenda' : 'Description'}</div>
                <div class="agenda-content">${meeting.agenda || meeting.description}</div>
              </div>
              ` : ''}
              
              <div class="organizer-info">
                <div class="organizer-label">Organized by</div>
                <div class="organizer-name">${organizerName}</div>
              </div>
            </div>
            
            <div class="footer">
              <p style="font-weight: 600; color: #1F2937;">UFS CRM</p>
              <p>© ${new Date().getFullYear()} All rights reserved.</p>
              <p style="font-size: 12px; margin-top: 15px;">
                This is an automated meeting invitation. Please do not reply.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Meeting invitation sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Sent to:', attendeeEmails.join(', '));
    
    return { success: true, messageId: info.messageId, sentTo: attendeeEmails };

  } catch (error) {
    console.error('❌ Meeting invitation email error:', error.message);
    throw new Error('Failed to send meeting invitation: ' + error.message);
  }
};

/**
 * Send Meeting Reminder Email (1 hour before)
 */
const sendMeetingReminder = async (meeting, attendeeEmails) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const meetingDate = new Date(meeting.from);
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const startTime = meetingDate.toLocaleTimeString('en-IN', timeOptions);

    const mailOptions = {
      from: `"UFS CRM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: attendeeEmails.join(', '),
      subject: `⏰ Reminder: Meeting "${meeting.title}" starts in 1 hour!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 40px 30px; text-align: center; color: white; }
            .header-icon { font-size: 48px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 40px 30px; text-align: center; }
            .meeting-title { font-size: 22px; font-weight: 700; color: #1F2937; margin-bottom: 16px; }
            .time-box { background: #FEF3C7; border-radius: 12px; padding: 20px; margin: 24px 0; }
            .time-value { font-size: 32px; font-weight: 700; color: #92400E; }
            .join-button { display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 12px; font-size: 18px; font-weight: 700; margin: 20px 0; }
            .footer { background-color: #F9FAFB; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-icon">⏰</div>
              <h1>Meeting Reminder!</h1>
            </div>
            <div class="content">
              <div class="meeting-title">📌 ${meeting.title}</div>
              <p>Your meeting starts in <strong>1 hour</strong></p>
              <div class="time-box">
                <div class="time-value">${startTime} IST</div>
              </div>
              <a href="${meeting.meetingLink}" class="join-button" target="_blank">
                🚀 Join Meeting
              </a>
              <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
                Link: ${meeting.meetingLink}
              </p>
            </div>
            <div class="footer">
              <p style="color: #6B7280; font-size: 13px;">UFS CRM © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Meeting reminder sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Meeting reminder error:', error.message);
    throw new Error('Failed to send meeting reminder: ' + error.message);
  }
};

/**
 * Send Meeting Cancellation Email
 */
const sendMeetingCancellation = async (meeting, attendeeEmails, reason = '') => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const meetingDate = new Date(meeting.from);
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = meetingDate.toLocaleDateString('en-IN', dateOptions);

    const mailOptions = {
      from: `"UFS CRM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: attendeeEmails.join(', '),
      subject: `❌ Meeting Cancelled: ${meeting.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 40px 30px; text-align: center; color: white; }
            .header-icon { font-size: 48px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 40px 30px; text-align: center; }
            .meeting-title { font-size: 22px; font-weight: 700; color: #1F2937; margin-bottom: 16px; text-decoration: line-through; color: #9CA3AF; }
            .cancelled-box { background: #FEE2E2; border-radius: 12px; padding: 20px; margin: 24px 0; }
            .footer { background-color: #F9FAFB; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-icon">❌</div>
              <h1>Meeting Cancelled</h1>
            </div>
            <div class="content">
              <div class="meeting-title">${meeting.title}</div>
              <p>The following meeting has been <strong>cancelled</strong>:</p>
              <div class="cancelled-box">
                <p style="margin: 0; color: #991B1B;">
                  📅 ${formattedDate}
                </p>
              </div>
              ${reason ? `<p style="color: #6B7280;"><strong>Reason:</strong> ${reason}</p>` : ''}
              <p style="color: #6B7280; margin-top: 20px;">
                We apologize for any inconvenience. A new meeting may be scheduled soon.
              </p>
            </div>
            <div class="footer">
              <p style="color: #6B7280; font-size: 13px;">UFS CRM © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Cancellation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Cancellation email error:', error.message);
    throw new Error('Failed to send cancellation email: ' + error.message);
  }
};

/**
 * Send User Invitation Email
 */
const sendUserInvitationEmail = async ({ email, firstName, lastName, organizationName, invitedBy, roles, temporaryPassword }) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified for user invitation');

    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const mailOptions = {
      from: `"UFS CRM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `🎉 You've been invited to join ${organizationName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #5db9de 0%, #47b9e1 25%, #1a2a35 50%, #95b5ef 75%, #2a5298 100%); padding: 40px 30px; text-align: center; color: white; }
            .header-icon { font-size: 48px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px 30px; }
            .welcome-box { background: linear-gradient(135deg, rgba(93, 185, 222, 0.1) 0%, rgba(42, 82, 152, 0.1) 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(93, 185, 222, 0.2); }
            .company-name { font-size: 24px; font-weight: 700; color: #1F2937; margin-bottom: 12px; }
            .role-badge { display: inline-block; background: linear-gradient(135deg, #5db9de 0%, #2a5298 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 8px 0; }
            .credentials-box { background: #F3F4F6; border-radius: 12px; padding: 20px; margin: 24px 0; }
            .credential-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #E5E7EB; }
            .credential-row:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
            .credential-label { font-size: 14px; color: #6B7280; font-weight: 600; }
            .credential-value { font-size: 16px; color: #1F2937; font-weight: 700; font-family: 'Courier New', monospace; }
            .login-button { display: block; width: 100%; padding: 18px 32px; background: linear-gradient(135deg, #5db9de 0%, #2a5298 100%); color: white; text-decoration: none; text-align: center; border-radius: 12px; font-size: 18px; font-weight: 700; margin: 30px 0; box-shadow: 0 4px 15px rgba(93, 185, 222, 0.4); }
            .info-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px; margin-top: 24px; border-radius: 4px; }
            .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
            .footer p { margin: 5px 0; color: #6B7280; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-icon">🎉</div>
              <h1>Welcome to the Team!</h1>
              <p>You've been invited to join ${organizationName}</p>
            </div>

            <div class="content">
              <div class="welcome-box">
                <div class="company-name">🏢 ${organizationName}</div>
                <p style="margin: 0; color: #6B7280; font-size: 16px;">
                  ${invitedBy} has invited you to join as:
                </p>
                <div class="role-badge">👤 ${roles}</div>
              </div>

              <p style="font-size: 16px; color: #1F2937; margin-bottom: 24px;">
                Hi ${firstName} ${lastName},
              </p>

              <p style="font-size: 15px; color: #4B5563; line-height: 1.8;">
                We're excited to have you on board! Your account has been created and you can now access UFS CRM.
                Use the credentials below to sign in and get started.
              </p>

              <div class="credentials-box">
                <div class="credential-row">
                  <span class="credential-label">📧 Email:</span>
                  <span class="credential-value">${email}</span>
                </div>
                <div class="credential-row">
                  <span class="credential-label">🔐 Password:</span>
                  <span class="credential-value">${temporaryPassword}</span>
                </div>
              </div>

              <a href="${loginUrl}/login" class="login-button" target="_blank">
                🚀 Sign In Now
              </a>

              <div class="info-box">
                <p style="margin: 0; color: #1E40AF; font-size: 14px; font-weight: 600;">
                  🔒 Security Tip
                </p>
                <p style="margin: 8px 0 0; color: #3B82F6; font-size: 13px;">
                  For security reasons, please change your password after your first login.
                </p>
              </div>

              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                If you have any questions or need assistance, please don't hesitate to reach out to ${invitedBy} or your team administrator.
              </p>
            </div>

            <div class="footer">
              <p style="font-weight: 600; color: #1F2937;">UFS CRM</p>
              <p>© ${new Date().getFullYear()} All rights reserved.</p>
              <p style="font-size: 12px; margin-top: 15px;">
                This is an automated invitation email. Please do not reply directly to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ User invitation email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Sent to:', email);

    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ User invitation email error:', error.message);
    throw new Error('Failed to send user invitation email: ' + error.message);
  }
};

/**
 * Send OTP for signup email verification
 */
const sendSignupVerificationOTP = async (email, otp, userName) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified for signup verification');

    const mailOptions = {
      from: `"UFS CRM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email - UFS CRM',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; color: white; }
            .logo { font-size: 32px; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .header p { margin: 10px 0 0; opacity: 0.95; font-size: 15px; }
            .content { padding: 40px 30px; }
            .welcome-text { font-size: 16px; color: #1F2937; margin-bottom: 24px; line-height: 1.6; }
            .otp-container { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 48px; font-weight: 700; letter-spacing: 12px; color: white; font-family: 'Courier New', monospace; }
            .info-box { background: #D1FAE5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px; }
            .info-text { margin: 0; color: #065F46; font-size: 14px; line-height: 1.6; }
            .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
            .footer p { margin: 5px 0; color: #6B7280; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✉️</div>
              <h1>Welcome to UFS CRM!</h1>
              <p>Complete your registration by verifying your email</p>
            </div>
            <div class="content">
              <p class="welcome-text">
                Hello <strong>${userName || 'there'}</strong>,
              </p>
              <p class="welcome-text">
                Thank you for registering with UFS CRM! To complete your registration and secure your account,
                please verify your email address using the OTP code below:
              </p>
              <div class="otp-container">
                <div class="otp-code">${otp}</div>
              </div>
              <div class="info-box">
                <p class="info-text">
                  <strong>⏰ This OTP expires in 10 minutes.</strong><br>
                  If you didn't request this verification, please ignore this email.
                </p>
              </div>
              <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
                Once verified, you'll be able to complete your profile and start using UFS CRM.
              </p>
            </div>
            <div class="footer">
              <p style="font-weight: 600; color: #1F2937;">UFS CRM</p>
              <p>© ${new Date().getFullYear()} All rights reserved.</p>
              <p style="font-size: 12px; margin-top: 15px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Signup verification OTP email sent:', info.messageId);

    // Track sent email
    try {
      const User = require('../models/User');
      const emailTrackingService = require('../services/emailTrackingService');
      const user = await User.findOne({ email });

      if (user) {
        await emailTrackingService.trackSentEmail({
          messageId: info.messageId,
          from: mailOptions.from,
          to: email,
          subject: mailOptions.subject,
          html: mailOptions.html,
          emailType: 'signup_verification',
          userId: user._id,
          tenantId: user.tenant,
          smtpMode: 'free'
        });
      }
    } catch (trackError) {
      console.error('Email tracking failed:', trackError);
      // Don't fail the email send if tracking fails
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Signup verification OTP email error:', error.message);
    throw new Error('Failed to send signup verification OTP email: ' + error.message);
  }
};

module.exports = {
  sendPasswordResetOTP,
  sendSignupVerificationOTP,
  sendMeetingInvitation,
  sendMeetingReminder,
  sendMeetingCancellation,
  sendUserInvitationEmail
};