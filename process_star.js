const sharp = require('sharp');
const path = require('path');

const inPath = '/Users/moritamasashi/Desktop/travel_app_v2/public/raw_media/IMG_1324.jpg';
const outPath = '/Users/moritamasashi/Desktop/travel_app_v2/public/hero/slide3.webp';

async function processStar() {
  console.log(`Processing ${inPath} -> ${outPath}`);
  await sharp(inPath)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outPath);
  console.log("Done processing starry sky image!");
}

processStar().catch(console.error);
