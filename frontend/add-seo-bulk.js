const fs = require('fs');
const path = require('path');

const pages = [
  {
    file: 'Security.js',
    title: 'Security & Compliance - Unified CRM',
    description: 'Enterprise-grade security features. Data encryption, role-based access control, audit logs, and compliance certifications for your CRM data.',
    url: 'https://unifiedcrm.texora.ai/security',
    keywords: 'CRM security, data encryption, GDPR compliance, secure CRM, enterprise security'
  },
  {
    file: 'Integrations.js',
    title: 'Integrations - Unified CRM',
    description: 'Connect Unified CRM with your favorite tools. Email, calendar, payment gateways, marketing automation, and 100+ integrations.',
    url: 'https://unifiedcrm.texora.ai/integrations',
    keywords: 'CRM integrations, API integration, email integration, third-party apps, automation'
  },
  {
    file: 'PlatformPage.js',
    title: 'Platform Overview - Unified CRM',
    description: 'Explore the Unified CRM platform. Complete B2B solution with lead management, sales automation, analytics, and team collaboration.',
    url: 'https://unifiedcrm.texora.ai/platform',
    keywords: 'CRM platform, B2B CRM, sales platform, lead management platform, business automation'
  },
  {
    file: 'AllProductsPage.js',
    title: 'All Features - Unified CRM',
    description: 'Discover all Unified CRM features. Lead management, contact tracking, deal pipeline, quotations, invoices, reports, and more.',
    url: 'https://unifiedcrm.texora.ai/all-features',
    keywords: 'CRM features, lead management, contact management, sales features, CRM capabilities'
  },
  {
    file: 'IndustriesPage.js',
    title: 'Industries - Unified CRM',
    description: 'CRM solutions for various industries. Technology, manufacturing, real estate, healthcare, retail, and professional services.',
    url: 'https://unifiedcrm.texora.ai/industries',
    keywords: 'industry CRM, vertical CRM, sector-specific CRM, industry solutions'
  },
  {
    file: 'DemoPage.js',
    title: 'Request Demo - Unified CRM',
    description: 'Schedule a personalized demo of Unified CRM. See how our CRM solution can transform your sales and customer management process.',
    url: 'https://unifiedcrm.texora.ai/demo',
    keywords: 'CRM demo, schedule demo, product demo, CRM trial, see CRM in action'
  },
  {
    file: 'HelpCenter.js',
    title: 'Help Center - Unified CRM',
    description: 'Get help with Unified CRM. Documentation, guides, FAQs, video tutorials, and support resources to maximize your CRM usage.',
    url: 'https://unifiedcrm.texora.ai/help',
    keywords: 'CRM help, user guide, documentation, support, how-to, tutorials'
  },
  {
    file: 'PartnersPage.js',
    title: 'Partners - Unified CRM',
    description: 'Join the Unified CRM partner program. Become a reseller, implementation partner, or technology integration partner.',
    url: 'https://unifiedcrm.texora.ai/partners',
    keywords: 'CRM partners, reseller program, partnership, implementation partners'
  }
];

const pagesDir = path.join(__dirname, 'src', 'pages');

pages.forEach(page => {
  const filePath = path.join(pagesDir, page.file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${page.file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if SEO already imported
  if (content.includes("import SEO from '../components/SEO'")) {
    console.log(`⚠️  SEO already imported in ${page.file}`);
    return;
  }

  // Add SEO import after last import
  const lastImportMatch = content.match(/^import .+;$/gm);
  if (lastImportMatch && lastImportMatch.length > 0) {
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    content = content.replace(lastImport, `${lastImport}\nimport SEO from '../components/SEO';`);
  }

  // Find return statement and add SEO + fragment wrapper
  const returnMatch = content.match(/  return \(\n    <div/);
  if (returnMatch) {
    const seoComponent = `  return (
    <>
      <SEO
        title="${page.title}"
        description="${page.description}"
        url="${page.url}"
        keywords="${page.keywords}"
      />
      <div`;

    content = content.replace(/  return \(\n    <div/, seoComponent);

    // Add closing fragment
    // Find the last closing div and add fragment close
    const lines = content.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '</div>' && lines[i + 1] && lines[i + 1].trim() === ');') {
        lines[i] = lines[i] + '\n    </>';
        break;
      }
    }
    content = lines.join('\n');
  }

  // Write back
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Added SEO to ${page.file}`);
});

console.log('\n✨ Done!');
