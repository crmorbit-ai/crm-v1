require('dotenv').config();
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const client = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function send() {
  // Using shashank email as FROM (if verified in SES)
  const cmd = new SendEmailCommand({
    Source: '"Texora CRM" <shashank1010933@gmail.com>',
    Destination: { ToAddresses: ['shashank1010933@gmail.com'] },
    Message: {
      Subject: { Data: 'Test - From Verified Email', Charset: 'UTF-8' },
      Body: {
        Text: { Data: 'Testing from verified Gmail address instead of no-reply@texora.ai', Charset: 'UTF-8' },
      },
    },
  });
  
  const result = await client.send(cmd);
  console.log('✅ Sent! MessageId:', result.MessageId);
}

send().catch(e => console.error('❌', e.message));
