const { sendPasswordExpiryWarning } = require('./src/utils/emailService');

async function test() {
  try {
    console.log('🧪 Testing email service...');
    const result = await sendPasswordExpiryWarning(
      'shashank1010933@gmail.com',
      'Test User',
      5
    );
    console.log('✅ Email sent:', result);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    console.error('Full error:', error);
  }
  process.exit(0);
}

test();
