require('dotenv').config();
const { SESClient, GetAccountSendingEnabledCommand } = require('@aws-sdk/client-ses');

const client = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function check() {
  try {
    const result = await client.send(new GetAccountSendingEnabledCommand({}));
    console.log('SES Sending Enabled:', result.Enabled);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
check();
