require('dotenv').config();
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testEmail() {
  try {
    const command = new SendEmailCommand({
      Source: 'no-reply@texora.ai',
      Destination: { ToAddresses: ['shashank1010933@gmail.com'] },
      ReplyToAddresses: ['support@texora.ai'],
      Message: {
        Subject: { Data: '✅ DNS Fix Test - Spam Check', Charset: 'UTF-8' },
        Body: {
          Html: {
            Data: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="UTF-8"></head>
              <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
                  <h1 style="color: white; margin: 0;">🎯 DNS Configuration Test</h1>
                </div>
                <div style="background: #f8f9fa; padding: 20px; margin-top: 20px; border-radius: 10px;">
                  <h2 style="color: #333;">Email Deliverability Test</h2>
                  <p style="color: #666; line-height: 1.6;">
                    If you receive this email in your <strong>INBOX</strong> (not spam),
                    then DNS records are configured correctly! ✅
                  </p>
                  <p style="color: #666; line-height: 1.6;">
                    <strong>Check:</strong>
                  </p>
                  <ul style="color: #666; line-height: 1.8;">
                    <li>Did this land in INBOX or SPAM folder?</li>
                    <li>Is sender shown as "via amazonses.com"?</li>
                    <li>Any warning messages?</li>
                  </ul>
                </div>
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                  <p>Unified CRM - DNS Test Email</p>
                  <p>Sent: ${new Date().toLocaleString()}</p>
                </div>
              </body>
              </html>
            `,
            Charset: 'UTF-8'
          },
          Text: {
            Data: 'DNS Fix Test - If you receive this in INBOX (not spam), configuration is correct!',
            Charset: 'UTF-8'
          }
        }
      }
    });

    const result = await sesClient.send(command);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', result.MessageId);
    console.log('📬 Check inbox: shashank1010933@gmail.com');
    console.log('\n⏰ DNS changes take 24-48 hours to propagate fully.');
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
  }
}

testEmail();
