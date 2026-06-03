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
  const cmd = new SendEmailCommand({
    Source: '"Texora CRM" <no-reply@texora.ai>',
    Destination: { ToAddresses: ['shashank1010933@gmail.com'] },
    Message: {
      Subject: { Data: 'Test - Plain Email', Charset: 'UTF-8' },
      Body: {
        Text: { Data: 'This is a plain text test email without any spam triggers.', Charset: 'UTF-8' },
      },
    },
  });
  
  const result = await client.send(cmd);
  console.log('✅ Sent! MessageId:', result.MessageId);
}

send().catch(e => console.error('❌', e.message));
