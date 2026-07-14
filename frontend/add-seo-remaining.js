const fs = require('fs');
const path = require('path');

const pages = [
  {
    file: 'DemoLibraryPage.js',
    title: 'Demo Library - Unified CRM',
    description: 'Watch video demos and tutorials. Learn how to use Unified CRM features with step-by-step guides and walkthroughs.',
    url: 'https://unifiedcrm.texora.ai/demo/library',
    keywords: 'CRM demos, video tutorials, how-to videos, product walkthroughs, training videos'
  },
  {
    file: 'DataCenterPage.js',
    title: 'Data Center - Unified CRM',
    description: 'Centralized customer data management. Import, organize, and manage all your customer data in one secure location.',
    url: 'https://unifiedcrm.texora.ai/data-center-feature',
    keywords: 'data center, customer database, data management, bulk import, data organization'
  },
  {
    file: 'FeatureDetailPage.js',
    title: 'Feature Details - Unified CRM',
    description: 'Explore detailed CRM features. Learn about lead management, contact tracking, sales automation, and more capabilities.',
    url: 'https://unifiedcrm.texora.ai/feature',
    keywords: 'CRM feature details, feature guide, capability overview, feature documentation'
  },
  {
    file: 'PartnerResources.js',
    title: 'Partner Resources - Unified CRM',
    description: 'Resources for Unified CRM partners. Marketing materials, technical documentation, training guides, and support.',
    url: 'https://unifiedcrm.texora.ai/partner-resources',
    keywords: 'partner resources, reseller materials, partner portal, training resources'
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

  // Add SEO import
  const lastImportMatch = content.match(/^import .+;$/gm);
  if (lastImportMatch && lastImportMatch.length > 0) {
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    content = content.replace(lastImport, `${lastImport}\nimport SEO from '../components/SEO';`);
  }

  // Find return and add SEO
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
    const lines = content.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '</div>' && lines[i + 1] && lines[i + 1].trim() === ');') {
        lines[i] = lines[i] + '\n    </>';
        break;
      }
    }
    content = lines.join('\n');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Added SEO to ${page.file}`);
});

console.log('\n✨ All public pages now have SEO!');
