require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const https = require('https');

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
const regionsFile = 'src/data/regions.json';

const delay = ms => new Promise(res => setTimeout(res, ms));

function findPlace(query) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=photos&key=${API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Reading regions.json...');
  let regions = [];
  try {
    regions = JSON.parse(fs.readFileSync(regionsFile, 'utf8'));
  } catch (e) {
    console.error('Error reading regions.json:', e);
    return;
  }
  
  console.log(`Found ${regions.length} regions.`);
  let updatedCount = 0;
  
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    try {
      // Clean up the name for better search results if it contains '・'
      const searchName = region.name.split('（')[0].replace('の島々', '');
      
      const response = await findPlace(searchName);
      if (response.status === 'OK' && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.photos && candidate.photos.length > 0) {
          const photo_reference = candidate.photos[0].photo_reference;
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo_reference}&key=${API_KEY}`;
          
          region.hero_image_url = photoUrl;
          updatedCount++;
          console.log(`[${i+1}/${regions.length}] Updated ${region.name} (${searchName})`);
        } else {
          console.log(`[${i+1}/${regions.length}] No photos found for ${region.name}`);
        }
      } else {
        console.log(`[${i+1}/${regions.length}] No place found for ${region.name} (Status: ${response.status})`);
      }
    } catch (e) {
      console.error(`Error processing ${region.name}:`, e.message);
    }
    // Respect API rate limits
    await delay(200);
  }
  
  fs.writeFileSync(regionsFile, JSON.stringify(regions, null, 2), 'utf8');
  console.log(`Completed. Updated ${updatedCount} regions with real photos.`);
}

run();
