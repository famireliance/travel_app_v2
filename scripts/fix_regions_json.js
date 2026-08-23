const fs = require('fs');
const path = require('path');
const https = require('https');

const regionsPath = path.join(__dirname, '../src/data/regions.json');
const regions = JSON.parse(fs.readFileSync(regionsPath, 'utf8'));
const destDir = path.join(__dirname, '../public/regions');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          if (redirectRes.statusCode !== 200) {
            return reject(new Error(`Redirect failed: ${redirectRes.statusCode}`));
          }
          const file = fs.createWriteStream(dest);
          redirectRes.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else {
        reject(new Error(`Failed: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function run() {
  for (const r of regions) {
    if (r.hero_image_url && r.hero_image_url.includes('maps.googleapis.com')) {
      const fileName = `hero_${r.id}.jpg`;
      const destPath = path.join(destDir, fileName);
      console.log(`Downloading ${r.id}...`);
      try {
        await downloadImage(r.hero_image_url, destPath);
        r.hero_image_url = `/regions/${fileName}`;
      } catch (e) {
        console.error(`Failed ${r.id}:`, e.message);
      }
    }
  }
  fs.writeFileSync(regionsPath, JSON.stringify(regions, null, 2), 'utf8');
  console.log('Done modifying regions.json');
}

run();
