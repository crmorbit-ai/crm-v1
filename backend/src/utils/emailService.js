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

/**
 * Send Welcome Email after profile completion
 */
const sendWelcomeEmail = async (email, userName, organizationName) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified for welcome email');

    const mailOptions = {
      from: `"UFS CRM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `Welcome to UFS CRM! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; color: white; }
            .logo-container { margin-bottom: 20px; }
            .logo { max-width: 200px; height: auto; }
            .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
            .header p { margin: 10px 0 0; opacity: 0.95; font-size: 18px; }
            .content { padding: 40px 30px; }
            .welcome-message { text-align: center; margin-bottom: 30px; }
            .welcome-icon { font-size: 64px; margin-bottom: 20px; }
            .welcome-title { font-size: 28px; font-weight: 700; color: #1F2937; margin-bottom: 12px; }
            .welcome-subtitle { font-size: 16px; color: #6B7280; line-height: 1.6; }
            .feature-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin: 30px 0; }
            .feature-card { background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%); border-radius: 12px; padding: 20px; border: 1px solid rgba(102, 126, 234, 0.2); }
            .feature-icon { font-size: 32px; margin-bottom: 12px; }
            .feature-title { font-size: 16px; font-weight: 700; color: #1F2937; margin-bottom: 6px; }
            .feature-desc { font-size: 14px; color: #6B7280; line-height: 1.5; margin: 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
            .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5); }
            .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
            .footer-text { font-size: 14px; color: #6B7280; margin: 5px 0; }
            .social-links { margin-top: 20px; }
            .social-links a { color: #667eea; text-decoration: none; margin: 0 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <img src="${process.env.FRONTEND_URL || 'https://crm-frontend-sooty-seven.vercel.app'}/ufsscrmlogo.png" alt="UFS CRM Logo" class="logo" />
              </div>
              <h1>Welcome to UFS CRM!</h1>
              <p>Your journey to better customer relationships starts here</p>
            </div>

            <div class="content">
              <div class="welcome-message">
                <div class="welcome-icon">🎉</div>
                <h2 class="welcome-title">Hi ${userName}!</h2>
                <p class="welcome-subtitle">
                  Thank you for completing your profile setup for <strong>${organizationName}</strong>.
                  We're excited to have you on board! Your organization is now ready to streamline operations and boost productivity.
                </p>
              </div>

              <div class="feature-grid">
                <div class="feature-card">
                  <div class="feature-icon">📊</div>
                  <div class="feature-title">Lead Management</div>
                  <p class="feature-desc">Track and manage your leads efficiently with our powerful CRM tools.</p>
                </div>

                <div class="feature-card">
                  <div class="feature-icon">👥</div>
                  <div class="feature-title">Customer Database</div>
                  <p class="feature-desc">Organize and access your customer data anytime, anywhere.</p>
                </div>

                <div class="feature-card">
                  <div class="feature-icon">💰</div>
                  <div class="feature-title">Sales & Finance</div>
                  <p class="feature-desc">Manage quotations, invoices, and track your revenue seamlessly.</p>
                </div>

                <div class="feature-card">
                  <div class="feature-icon">📈</div>
                  <div class="feature-title">Analytics & Reports</div>
                  <p class="feature-desc">Get insights with comprehensive dashboards and reports.</p>
                </div>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://crm-frontend-sooty-seven.vercel.app'}/dashboard" class="cta-button">
                  Get Started Now →
                </a>
              </div>

              <div style="background: #FEF3C7; border-radius: 12px; padding: 20px; margin-top: 30px; border: 1px solid #FDE68A;">
                <p style="margin: 0; font-size: 14px; color: #92400E;">
                  <strong>💡 Quick Tip:</strong> Start by inviting your team members and setting up your first lead.
                  Need help? Check out our <a href="#" style="color: #92400E; text-decoration: underline;">Getting Started Guide</a>.
                </p>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
                If you have any questions or need assistance, our support team is here to help.
                Reply to this email or visit our support center.
              </p>
            </div>

            <div class="footer">
              <p class="footer-text"><strong>UFS CRM</strong> - Empowering Businesses</p>
              <p class="footer-text">© ${new Date().getFullYear()} UFS CRM. All rights reserved.</p>
              <div class="social-links">
                <a href="#">Support</a> |
                <a href="#">Documentation</a> |
                <a href="#">Privacy Policy</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);

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
          emailType: 'welcome',
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
    console.error('❌ Welcome email error:', error.message);
    throw new Error('Failed to send welcome email: ' + error.message);
  }
};

/**
 * Send Lead Assignment Email
 */
const sendLeadAssignmentEmail = async (assignedUserEmail, assignedUserName, leadDetails, assignedByName) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified for lead assignment email');

    const mailOptions = {
      from: `"UFS CRM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: assignedUserEmail,
      subject: `🎯 New Lead Assigned: ${leadDetails.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
            .header-icon { font-size: 48px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .header p { margin: 10px 0 0; opacity: 0.95; font-size: 16px; }
            .content { padding: 40px 30px; }
            .lead-card { background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(102, 126, 234, 0.2); }
            .lead-title { font-size: 22px; font-weight: 700; color: #1F2937; margin-bottom: 16px; }
            .detail-row { display: flex; margin-bottom: 12px; }
            .detail-label { font-size: 13px; color: #6B7280; min-width: 120px; font-weight: 600; }
            .detail-value { font-size: 14px; color: #1F2937; font-weight: 500; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 20px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
            .info-box { background: #EFF6FF; border-radius: 10px; padding: 16px; margin: 20px 0; border: 1px solid #BFDBFE; }
            .info-box p { margin: 0; font-size: 14px; color: #1E40AF; }
            .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
            .footer-text { font-size: 14px; color: #6B7280; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-icon">🎯</div>
              <h1>New Lead Assigned!</h1>
              <p>You have a new lead to follow up</p>
            </div>

            <div class="content">
              <p style="font-size: 16px; color: #1F2937; margin-bottom: 24px;">
                Hi <strong>${assignedUserName}</strong>,
              </p>
              <p style="font-size: 15px; color: #6B7280; margin-bottom: 24px;">
                <strong>${assignedByName}</strong> has assigned a new lead to you. Here are the details:
              </p>

              <div class="lead-card">
                <div class="lead-title">${leadDetails.name}</div>

                ${leadDetails.company ? `
                <div class="detail-row">
                  <span class="detail-label">Company:</span>
                  <span class="detail-value">${leadDetails.company}</span>
                </div>` : ''}

                ${leadDetails.email ? `
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${leadDetails.email}</span>
                </div>` : ''}

                ${leadDetails.phone ? `
                <div class="detail-row">
                  <span class="detail-label">Phone:</span>
                  <span class="detail-value">${leadDetails.phone}</span>
                </div>` : ''}

                ${leadDetails.jobTitle ? `
                <div class="detail-row">
                  <span class="detail-label">Job Title:</span>
                  <span class="detail-value">${leadDetails.jobTitle}</span>
                </div>` : ''}

                ${leadDetails.leadSource ? `
                <div class="detail-row">
                  <span class="detail-label">Source:</span>
                  <span class="detail-value">${leadDetails.leadSource}</span>
                </div>` : ''}

                ${leadDetails.leadStatus ? `
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value">${leadDetails.leadStatus}</span>
                </div>` : ''}

                ${leadDetails.rating ? `
                <div class="detail-row">
                  <span class="detail-label">Rating:</span>
                  <span class="detail-value">${leadDetails.rating}</span>
                </div>` : ''}
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://crm-frontend-sooty-seven.vercel.app'}/leads/${leadDetails.id}" class="cta-button">
                  View Lead Details →
                </a>
              </div>

              <div class="info-box">
                <p>
                  <strong>📌 Next Steps:</strong> Review the lead details and reach out to them as soon as possible to increase conversion chances.
                </p>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
                You can manage this lead and update its status from your CRM dashboard.
              </p>
            </div>

            <div class="footer">
              <p class="footer-text"><strong>UFS CRM</strong> - Lead Management System</p>
              <p class="footer-text">© ${new Date().getFullYear()} UFS CRM. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Lead assignment email sent:', info.messageId);

    // Track sent email
    try {
      const User = require('../models/User');
      const emailTrackingService = require('../services/emailTrackingService');
      const user = await User.findOne({ email: assignedUserEmail });

      if (user) {
        await emailTrackingService.trackSentEmail({
          messageId: info.messageId,
          from: mailOptions.from,
          to: assignedUserEmail,
          subject: mailOptions.subject,
          html: mailOptions.html,
          emailType: 'lead_assignment',
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
    console.error('❌ Lead assignment email error:', error.message);
    throw new Error('Failed to send lead assignment email: ' + error.message);
  }
};

module.exports = {
  sendPasswordResetOTP,
  sendSignupVerificationOTP,
  sendMeetingInvitation,
  sendMeetingReminder,
  sendMeetingCancellation,
  sendUserInvitationEmail,
  sendWelcomeEmail,
  sendLeadAssignmentEmail
};