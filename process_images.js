const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const rawDir = '/Users/moritamasashi/Desktop/travel_app_v2/public/raw_media';
const outDir = '/Users/moritamasashi/Desktop/travel_app_v2/public/hero';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Select 5 images randomly or specifically
const selectedImages = [
  "dji_fly_20260507_113312_0813_1778156375359_photo.jpg",
  "IMG_0458.JPG",
  "IMG_0501.JPG",
  "IMG_1596.JPG",
  "IMG_1890.JPG"
];

async function processImages() {
  for (let i = 0; i < selectedImages.length; i++) {
    const file = selectedImages[i];
    const inPath = path.join(rawDir, file);
    const outPath = path.join(outDir, `slide${i + 1}.webp`);
    
    if (fs.existsSync(inPath)) {
      console.log(`Processing ${file} -> slide${i + 1}.webp`);
      await sharp(inPath)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outPath);
    } else {
      console.error(`File not found: ${file}`);
      // Fallback: pick the first available JPEG in rawDir
      const allFiles = fs.readdirSync(rawDir);
      const fallback = allFiles.find(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));
      if (fallback) {
        console.log(`Fallback processing ${fallback} -> slide${i + 1}.webp`);
        await sharp(path.join(rawDir, fallback))
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outPath);
      }
    }
  }
  console.log("Done processing images!");
}

processImages().catch(console.error);
