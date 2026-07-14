const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const optimizedDir = path.join(publicDir, 'optimized');

// Create optimized directory
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

console.log('🖼️  Starting image optimization with Sharp...\n');

const imagesToOptimize = [
  'image_30a5b89a.png',
  'image_ddea1215.png',
  'crmimagee copy.png',
  'logo.png',
  'slide1.png',
  'slide3.png',
  'slide5.png',
  'favicon_logo.png'
];

async function optimizeImage(filename) {
  const inputPath = path.join(publicDir, filename);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  Skipping ${filename} - file not found`);
    return;
  }

  const originalSize = fs.statSync(inputPath).size;
  const outputPathPng = path.join(optimizedDir, filename);
  const outputPathWebp = path.join(optimizedDir, filename.replace(/\.(png|jpg|jpeg)$/i, '.webp'));

  try {
    // Optimize PNG/JPG
    await sharp(inputPath)
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputPathPng);

    const newSize = fs.statSync(outputPathPng).size;
    const savings = ((1 - newSize/originalSize) * 100).toFixed(1);

    console.log(`✅ ${filename}`);
    console.log(`   Original: ${(originalSize/1024/1024).toFixed(2)}MB`);
    console.log(`   Optimized: ${(newSize/1024/1024).toFixed(2)}MB`);
    console.log(`   Saved: ${savings}%`);

    // Also create WebP version for large images
    if (originalSize > 100000) { // > 100KB
      await sharp(inputPath)
        .webp({ quality: 75 })
        .toFile(outputPathWebp);

      const webpSize = fs.statSync(outputPathWebp).size;
      console.log(`   WebP: ${(webpSize/1024/1024).toFixed(2)}MB (${((1 - webpSize/originalSize) * 100).toFixed(1)}% saved)`);
    }

    console.log('');
  } catch (error) {
    console.error(`❌ Error optimizing ${filename}:`, error.message);
  }
}

(async () => {
  for (const img of imagesToOptimize) {
    await optimizeImage(img);
  }

  console.log('✨ Optimization complete!');
  console.log('\n📁 Optimized images saved to: public/optimized/');
  console.log('\n📝 Next steps:');
  console.log('   1. Review optimized images');
  console.log('   2. Replace original files: cp public/optimized/* public/');
  console.log('   3. Use WebP with PNG fallback in code');
})();
