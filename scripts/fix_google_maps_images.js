require('dotenv').config({ path: '.env.local' });
global.WebSocket = require('ws'); // Fix Supabase Node 20 WebSocket issue
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const PLACES_DIR = path.join(__dirname, '..', 'public', 'places');
if (!fs.existsSync(PLACES_DIR)) {
  fs.mkdirSync(PLACES_DIR, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects (Google Maps API returns 302 to the actual image URL)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          if (redirectRes.statusCode !== 200) {
            reject(new Error(`Failed to download after redirect, status code: ${redirectRes.statusCode}`));
            return;
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
        reject(new Error(`Failed to download, status code: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function fixRegions() {
  const { data: regions, error } = await supabase.from('regions').select('*');
  if (error) { console.error('Error fetching regions:', error); return; }
  
  for (const region of regions) {
    let updated = false;
    let updates = {};

    if (region.imageUrl && region.imageUrl.includes('maps.googleapis.com')) {
      const fileName = `region_${region.id}.jpg`;
      const destPath = path.join(PLACES_DIR, fileName);
      console.log(`Downloading imageUrl for region ${region.id}...`);
      try {
        await downloadImage(region.imageUrl, destPath);
        updates.imageUrl = `/places/${fileName}`;
        updated = true;
      } catch (e) {
        console.error(`Failed to download imageUrl for region ${region.id}:`, e);
      }
    }
    
    if (region.hero_image_url && region.hero_image_url.includes('maps.googleapis.com')) {
      const fileName = `region_hero_${region.id}.jpg`;
      const destPath = path.join(PLACES_DIR, fileName);
      console.log(`Downloading hero_image_url for region ${region.id}...`);
      try {
        await downloadImage(region.hero_image_url, destPath);
        updates.hero_image_url = `/places/${fileName}`;
        updated = true;
      } catch (e) {
        console.error(`Failed to download hero_image_url for region ${region.id}:`, e);
      }
    }

    if (updated) {
      await supabase.from('regions').update(updates).eq('id', region.id);
      console.log(`Updated region ${region.id} in DB.`);
    }
  }
}

async function fixIslands() {
  const { data: islands, error } = await supabase.from('islands').select('*');
  if (error) { console.error('Error fetching islands:', error); return; }
  
  for (const island of islands) {
    let updated = false;
    let updates = {};

    if (island.image_url && island.image_url.includes('maps.googleapis.com')) {
      const fileName = `island_${island.id}.jpg`;
      const destPath = path.join(PLACES_DIR, fileName);
      console.log(`Downloading image_url for island ${island.id}...`);
      try {
        await downloadImage(island.image_url, destPath);
        updates.image_url = `/places/${fileName}`;
        updated = true;
      } catch (e) {
        console.error(`Failed to download image_url for island ${island.id}:`, e);
      }
    }
    
    if (island.hero_image_url && island.hero_image_url.includes('maps.googleapis.com')) {
      const fileName = `island_hero_${island.id}.jpg`;
      const destPath = path.join(PLACES_DIR, fileName);
      console.log(`Downloading hero_image_url for island ${island.id}...`);
      try {
        await downloadImage(island.hero_image_url, destPath);
        updates.hero_image_url = `/places/${fileName}`;
        updated = true;
      } catch (e) {
        console.error(`Failed to download hero_image_url for island ${island.id}:`, e);
      }
    }

    if (updated) {
      await supabase.from('islands').update(updates).eq('id', island.id);
      console.log(`Updated island ${island.id} in DB.`);
    }
  }
}

async function main() {
  console.log('Starting Google Maps image fix...');
  await fixRegions();
  await fixIslands();
  console.log('Done!');
}
main();
