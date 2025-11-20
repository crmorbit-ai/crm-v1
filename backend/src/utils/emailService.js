const nodemailer = require('nodemailer');

/**
 * Send OTP for password reset
 */
const sendPasswordResetOTP = async (email, otp, userName) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const mailOptions = {
      from: `"CRM System" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset OTP - CRM System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .logo {
              font-size: 32px;
              margin-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #1F2937;
              margin-bottom: 20px;
            }
            .message {
              color: #4B5563;
              font-size: 15px;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .otp-container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-label {
              color: white;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 15px;
            }
            .otp-code {
              font-size: 48px;
              font-weight: 700;
              letter-spacing: 12px;
              color: white;
              font-family: 'Courier New', monospace;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            }
            .warning-box {
              background-color: #FEF2F2;
              border-left: 4px solid #EF4444;
              padding: 16px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .warning-box p {
              margin: 0;
              color: #991B1B;
              font-size: 14px;
            }
            .info-box {
              background-color: #EFF6FF;
              border-left: 4px solid #3B82F6;
              padding: 16px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .info-box p {
              margin: 5px 0;
              color: #1E40AF;
              font-size: 14px;
            }
            .footer {
              background-color: #F9FAFB;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #E5E7EB;
            }
            .footer p {
              margin: 5px 0;
              color: #6B7280;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐</div>
              <h1>Password Reset Request</h1>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${userName || 'User'},</div>
              
              <div class="message">
                We received a request to reset your password. Use the OTP code below to complete the password reset process:
              </div>
              
              <div class="otp-container">
                <div class="otp-label">Your OTP Code</div>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning-box">
                <p><strong>⏰ Important:</strong> This OTP will expire in 10 minutes.</p>
              </div>
              
              <div class="info-box">
                <p><strong>🔒 Security Tips:</strong></p>
                <p>• Do not share this OTP with anyone</p>
                <p>• Our team will never ask for your OTP</p>
                <p>• If you didn't request this, please ignore this email</p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                <h3 style="color: #1F2937; font-size: 16px; margin-bottom: 12px;">Didn't request this?</h3>
                <p style="color: #4B5563; font-size: 14px;">
                  If you didn't request a password reset, you can safely ignore this email. 
                  Your password will remain unchanged.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p style="font-weight: 600; color: #1F2937;">CRM System</p>
              <p>© ${new Date().getFullYear()} All rights reserved.</p>
              <p style="font-size: 12px; margin-top: 15px;">
                This is an automated email. Please do not reply.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Sent to:', email);
    
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ OTP email send error:', error.message);
    console.error('Full error:', error);
    throw new Error('Failed to send OTP email: ' + error.message);
  }
};

module.exports = {
  sendPasswordResetOTP
};