const fs = require('fs');
const path = require('path');

const regionsPath = path.join(__dirname, '../src/data/regions.json');
const publicRegionsPath = path.join(__dirname, '../public/regions');

let hasError = false;

try {
  const regionsData = JSON.parse(fs.readFileSync(regionsPath, 'utf-8'));
  
  console.log(`Checking ${regionsData.length} regions...`);
  
  regionsData.forEach(region => {
    // Check if hero_image_url is defined
    if (!region.hero_image_url) {
      console.error(`[ERROR] Region missing hero_image_url: ${region.id} (${region.name})`);
      hasError = true;
      return;
    }
    
    // Check for mismatch in naming convention
    const expectedFilename = `hero_${region.id}.jpg`;
    const actualFilename = path.basename(region.hero_image_url);
    
    if (actualFilename !== expectedFilename) {
      console.warn(`[WARNING] Potential mismatch for ${region.id}: Expected ${expectedFilename}, but got ${actualFilename}`);
    }
    
    // Check if file exists on disk
    const imagePath = path.join(__dirname, '../public', region.hero_image_url);
    if (!fs.existsSync(imagePath)) {
      console.error(`[ERROR] Image file not found on disk: ${imagePath} (for region ${region.id})`);
      hasError = true;
    }
  });
  
  if (hasError) {
    console.error('\nValidation failed! Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\nValidation passed! All regions have valid images.');
  }
} catch (err) {
  console.error('[FATAL] Failed to read or parse regions.json:', err);
  process.exit(1);
}
