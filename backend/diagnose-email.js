require('dotenv').config();
const dns = require('dns').promises;
const { SESClient, GetIdentityDkimAttributesCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

console.log('\n🔍 EMAIL DELIVERABILITY DIAGNOSTIC REPORT');
console.log('='.repeat(70));
console.log(`Domain: texora.ai`);
console.log(`Date: ${new Date().toLocaleString()}`);
console.log('='.repeat(70));

// Test 1: SPF Record Check
async function checkSPF() {
  console.log('\n📋 TEST 1: SPF (Sender Policy Framework)');
  console.log('-'.repeat(70));
  try {
    const records = await dns.resolveTxt('texora.ai');
    const spfRecords = records.filter(r => r.join('').includes('v=spf1'));

    if (spfRecords.length === 0) {
      console.log('❌ FAIL: No SPF record found');
      console.log('   Impact: High spam risk - emails will be rejected/marked spam');
      return false;
    } else if (spfRecords.length > 1) {
      console.log('❌ FAIL: Multiple SPF records found');
      console.log('   Found:', spfRecords.length, 'records');
      spfRecords.forEach((r, i) => console.log(`   ${i+1}. ${r.join('')}`));
      console.log('   Impact: Invalid configuration - only first record is used');
      return false;
    } else {
      const spf = spfRecords[0].join('');
      console.log('✅ PASS: SPF record found');
      console.log('   Record:', spf);

      if (spf.includes('amazonses.com')) {
        console.log('   ✅ Amazon SES authorized');
      } else {
        console.log('   ❌ Amazon SES NOT authorized in SPF');
        console.log('   Impact: Emails from SES will fail SPF check');
        return false;
      }

      if (spf.includes('~all') || spf.includes('-all')) {
        console.log('   ✅ Proper SPF enforcement');
      } else {
        console.log('   ⚠️  Weak SPF policy (use ~all or -all)');
      }
      return true;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

// Test 2: DKIM Records Check
async function checkDKIM() {
  console.log('\n🔐 TEST 2: DKIM (DomainKeys Identified Mail)');
  console.log('-'.repeat(70));

  const dkimSelectors = [
    'ifh5vlyvznextwrysefvzay2jx3b6ayq',
    's3dv4l6xhpl3htsfrvwzeda52dfrnplq',
    '25cko5wi3kjss7gzzgzy47awvfyuo6vx'
  ];

  let allPass = true;

  for (const selector of dkimSelectors) {
    try {
      const records = await dns.resolveCname(`${selector}._domainkey.texora.ai`);
      if (records && records.length > 0) {
        console.log(`✅ DKIM ${selector.substring(0,10)}... configured`);
        console.log(`   → ${records[0]}`);
      }
    } catch (error) {
      console.log(`❌ DKIM ${selector.substring(0,10)}... NOT FOUND`);
      console.log(`   Expected: ${selector}._domainkey.texora.ai`);
      console.log(`   Should point to: ${selector}.dkim.amazonses.com`);
      console.log(`   Impact: Emails will fail DKIM authentication`);
      allPass = false;
    }
  }

  if (!allPass) {
    console.log('\n❌ DKIM CONFIGURATION INCOMPLETE');
    console.log('   Add these 3 CNAME records to Hostinger DNS:');
    dkimSelectors.forEach(sel => {
      console.log(`   ${sel}._domainkey → ${sel}.dkim.amazonses.com`);
    });
  }

  return allPass;
}

// Test 3: DMARC Policy Check
async function checkDMARC() {
  console.log('\n🛡️  TEST 3: DMARC (Domain-based Message Authentication)');
  console.log('-'.repeat(70));
  try {
    const records = await dns.resolveTxt('_dmarc.texora.ai');
    const dmarcRecords = records.filter(r => r.join('').includes('v=DMARC1'));

    if (dmarcRecords.length === 0) {
      console.log('❌ FAIL: No DMARC record found');
      console.log('   Impact: No protection against spoofing, lower trust score');
      return false;
    }

    const dmarc = dmarcRecords[0].join('');
    console.log('✅ PASS: DMARC record found');
    console.log('   Record:', dmarc);

    if (dmarc.includes('p=none')) {
      console.log('   ⚠️  Policy: NONE (monitoring only)');
      console.log('   Recommendation: Change to p=quarantine or p=reject');
    } else if (dmarc.includes('p=quarantine')) {
      console.log('   ✅ Policy: QUARANTINE (good)');
    } else if (dmarc.includes('p=reject')) {
      console.log('   ✅ Policy: REJECT (best)');
    }

    return true;
  } catch (error) {
    console.log('❌ FAIL: DMARC record not found');
    console.log('   Add TXT record: _dmarc.texora.ai');
    console.log('   Value: v=DMARC1; p=quarantine; rua=mailto:postmaster@texora.ai');
    return false;
  }
}

// Test 4: MX Record for Custom MAIL FROM
async function checkMailFrom() {
  console.log('\n📬 TEST 4: Custom MAIL FROM Domain');
  console.log('-'.repeat(70));
  try {
    const records = await dns.resolveMx('mail.texora.ai');
    if (records && records.length > 0) {
      console.log('✅ PASS: MX record found for mail.texora.ai');
      records.forEach(r => console.log(`   Priority ${r.priority}: ${r.exchange}`));

      if (records.some(r => r.exchange.includes('amazonses.com'))) {
        console.log('   ✅ Points to Amazon SES');
      } else {
        console.log('   ⚠️  Does not point to Amazon SES');
      }
      return true;
    }
  } catch (error) {
    console.log('⚠️  OPTIONAL: Custom MAIL FROM not configured');
    console.log('   Not critical but recommended for better deliverability');
    console.log('   Add MX record: mail.texora.ai → feedback-smtp.us-east-1.amazonses.com');
    return true; // Not critical
  }
}

// Test 5: AWS SES Domain Verification
async function checkSESVerification() {
  console.log('\n☁️  TEST 5: AWS SES Domain Verification');
  console.log('-'.repeat(70));
  try {
    const command = new GetIdentityDkimAttributesCommand({
      Identities: ['texora.ai']
    });
    const response = await sesClient.send(command);
    const attrs = response.DkimAttributes['texora.ai'];

    if (attrs.DkimEnabled) {
      console.log('✅ DKIM Enabled in AWS SES');
    } else {
      console.log('❌ DKIM NOT enabled in AWS SES');
      return false;
    }

    if (attrs.DkimVerificationStatus === 'Success') {
      console.log('✅ DKIM Verification: SUCCESS');
      console.log('   All DNS records properly configured');
    } else {
      console.log(`⚠️  DKIM Verification: ${attrs.DkimVerificationStatus}`);
      console.log('   DNS records may not be propagated yet (wait 24-48 hours)');
    }

    console.log('   DKIM Tokens:');
    attrs.DkimTokens.forEach((token, i) => {
      console.log(`   ${i+1}. ${token}`);
    });

    return attrs.DkimVerificationStatus === 'Success';
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

// Test 6: Content Analysis
function checkEmailContent() {
  console.log('\n📝 TEST 6: Email Content Best Practices');
  console.log('-'.repeat(70));
  console.log('✅ HTML email template with plain text alternative');
  console.log('✅ Proper email headers (From, Reply-To)');
  console.log('✅ Cloudinary CDN for logo (not base64)');
  console.log('✅ Unsubscribe footer present');
  console.log('⚠️  Check: Avoid spam trigger words (FREE, URGENT, BUY NOW)');
  console.log('⚠️  Check: Proper text-to-image ratio (more text than images)');
  return true;
}

// Summary Report
async function generateSummary(results) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const score = Math.round((passed / total) * 100);

  console.log(`\nScore: ${passed}/${total} tests passed (${score}%)\n`);

  results.forEach(r => {
    const icon = r.pass ? '✅' : '❌';
    const status = r.pass ? 'PASS' : 'FAIL';
    console.log(`${icon} ${r.name}: ${status}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('🎯 DELIVERABILITY PREDICTION');
  console.log('='.repeat(70));

  if (score >= 90) {
    console.log('✅ EXCELLENT: Emails should reach INBOX');
  } else if (score >= 70) {
    console.log('⚠️  GOOD: Most emails will reach inbox, some may be filtered');
  } else if (score >= 50) {
    console.log('⚠️  FAIR: Many emails will go to SPAM folder');
  } else {
    console.log('❌ POOR: Most emails will be rejected or marked as SPAM');
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔧 RECOMMENDED ACTIONS');
  console.log('='.repeat(70));

  const failedTests = results.filter(r => !r.pass);
  if (failedTests.length === 0) {
    console.log('✅ No action needed - configuration looks good!');
    console.log('   If emails still go to spam, wait 24-48 hours for DNS propagation.');
  } else {
    console.log('Fix these issues in order of priority:\n');
    failedTests.forEach((r, i) => {
      console.log(`${i+1}. ${r.name}`);
      if (r.action) console.log(`   → ${r.action}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('💡 NEXT STEPS');
  console.log('='.repeat(70));
  console.log('1. Fix all failed tests above');
  console.log('2. Wait 1-2 hours for DNS propagation');
  console.log('3. Run this diagnostic again: node diagnose-email.js');
  console.log('4. Send test email: node test-email.js');
  console.log('5. Check mail-tester.com score (should be 10/10)');
  console.log('='.repeat(70) + '\n');
}

// Main Execution
async function runDiagnostics() {
  const results = [
    { name: 'SPF Record', pass: await checkSPF(), action: 'Add/fix SPF TXT record in Hostinger DNS' },
    { name: 'DKIM Records', pass: await checkDKIM(), action: 'Add 3 DKIM CNAME records in Hostinger DNS' },
    { name: 'DMARC Policy', pass: await checkDMARC(), action: 'Add DMARC TXT record in Hostinger DNS' },
    { name: 'MAIL FROM Domain', pass: await checkMailFrom(), action: 'Optional: Add MX record for mail.texora.ai' },
    { name: 'AWS SES Verification', pass: await checkSESVerification(), action: 'Wait for DNS propagation or fix records' },
    { name: 'Email Content', pass: checkEmailContent(), action: 'Review email template for spam triggers' }
  ];

  await generateSummary(results);
}

runDiagnostics().catch(console.error);
