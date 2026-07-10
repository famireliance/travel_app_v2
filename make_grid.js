const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const heroDir = '/Users/moritamasashi/Desktop/travel_app_v2/public/hero';
const outGrid = '/Users/moritamasashi/.gemini/antigravity/brain/68f9886a-eb02-40ea-9c97-28411c28e7f6/scratch/grid.jpg';

async function makeGrid() {
  const images = [];
  for (let i = 1; i <= 21; i++) {
    const webp = path.join(heroDir, `slide${i}.webp`);
    const mp4 = path.join(heroDir, `slide${i}.mp4`);
    const tempJpg = path.join(heroDir, `temp_${i}.jpg`);
    
    if (fs.existsSync(mp4)) {
      execSync(`"${ffmpeg}" -y -i "${mp4}" -vframes 1 -q:v 2 "${tempJpg}" 2>/dev/null`);
      images.push(tempJpg);
    } else if (fs.existsSync(webp)) {
      images.push(webp);
    }
  }

  const canvasWidth = 400 * 5;
  const canvasHeight = 225 * 5;
  
  const compositeArr = await Promise.all(images.map(async (img, index) => {
    const x = (index % 5) * 400;
    const y = Math.floor(index / 5) * 225;
    
    const svg = `<svg width="400" height="225">
      <rect x="0" y="0" width="120" height="40" fill="black" opacity="0.7"/>
      <text x="10" y="28" font-size="24" fill="white" font-family="Arial">Slide ${index + 1}</text>
    </svg>`;
    
    const resized = await sharp(img).resize(400, 225).composite([{input: Buffer.from(svg), top: 0, left: 0}]).toBuffer();
    
    return {
      input: resized,
      top: y,
      left: x
    };
  }));

  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
  .composite(compositeArr)
  .jpeg({ quality: 80 })
  .toFile(outGrid);
  
  console.log("Grid created!");
}
makeGrid().catch(console.error);
