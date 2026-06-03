require('dotenv').config();

console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
console.log('AWS_REGION:', process.env.AWS_REGION || 'Not set');
console.log('SES_FROM_EMAIL:', process.env.SES_FROM_EMAIL || 'Not set');
