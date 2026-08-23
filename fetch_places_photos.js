require('dotenv').config({ path: '.env.local' });
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

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
  console.log('Fetching islands from Supabase...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/islands?select=id,name`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  
  if (!res.ok) {
    console.error('Failed to fetch islands', await res.text());
    return;
  }
  const islands = await res.json();
  console.log(`Found ${islands.length} islands.`);

  let updatedCount = 0;
  
  for (let i = 0; i < islands.length; i++) {
    const island = islands[i];
    try {
      const response = await findPlace(island.name);
      if (response.status === 'OK' && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.photos && candidate.photos.length > 0) {
          const photo_reference = candidate.photos[0].photo_reference;
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo_reference}&key=${API_KEY}`;
          
          const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/islands?id=eq.${island.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ hero_image_url: photoUrl })
          });
            
          if (updateRes.ok) {
            updatedCount++;
            console.log(`[${i+1}/${islands.length}] Updated ${island.name}`);
          } else {
            console.error(`Failed to update ${island.name}:`, await updateRes.text());
          }
        } else {
          console.log(`[${i+1}/${islands.length}] No photos found for ${island.name}`);
        }
      } else {
        console.log(`[${i+1}/${islands.length}] No place found for ${island.name} (Status: ${response.status})`);
      }
    } catch (e) {
      console.error(`Error processing ${island.name}:`, e.message);
    }
    // Respect API rate limits
    await delay(200);
  }
  
  console.log(`Completed. Updated ${updatedCount} islands with real photos.`);
}

run();
