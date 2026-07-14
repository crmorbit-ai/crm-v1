const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const imageminPngquant = require('imagemin-pngquant');
const imageminMozjpeg = require('imagemin-mozjpeg');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const optimizedDir = path.join(publicDir, 'optimized');

// Create optimized directory if it doesn't exist
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

console.log('🖼️  Starting image optimization...\n');

// Compress PNG files
(async () => {
  try {
    const pngFiles = await imagemin([`${publicDir}/*.png`], {
      destination: optimizedDir,
      plugins: [
        imageminPngquant({
          quality: [0.6, 0.8],
          speed: 1
        })
      ]
    });

    console.log('✅ PNG files optimized:');
    pngFiles.forEach(file => {
      const originalSize = fs.statSync(file.sourcePath).size;
      const newSize = file.data.length;
      const savings = ((1 - newSize/originalSize) * 100).toFixed(1);
      console.log(`   ${path.basename(file.sourcePath)}: ${(originalSize/1024).toFixed(0)}KB → ${(newSize/1024).toFixed(0)}KB (${savings}% saved)`);
    });

    // Convert large images to WebP
    console.log('\n🔄 Converting large images to WebP...');
    const webpFiles = await imagemin([`${publicDir}/image_*.png`, `${publicDir}/crmimagee*.png`], {
      destination: optimizedDir,
      plugins: [
        imageminWebp({
          quality: 75
        })
      ]
    });

    console.log('✅ WebP files created:');
    webpFiles.forEach(file => {
      console.log(`   ${path.basename(file.destinationPath)}`);
    });

    console.log('\n✨ Optimization complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review files in public/optimized/');
    console.log('   2. Replace original files with optimized versions');
    console.log('   3. Update image references to use .webp where possible');

  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
