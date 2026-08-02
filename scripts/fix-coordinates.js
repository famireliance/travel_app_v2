require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

// Polyfill global WebSocket for Supabase in Node 20
global.WebSocket = require('ws');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getCoordinatesFromNominatim(islandName, prefecture) {
  try {
    // Nominatim query format: "IslandName, Prefecture, Japan"
    const query = encodeURIComponent(`${islandName}, ${prefecture || ''}, 日本`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    
    // Nominatim requires a User-Agent
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'KiratabiTravelApp/1.0 (masahito@example.com)'
      }
    });

    const data = await res.json();
    if (data && data.length > 0) {
      return `${data[0].lat}, ${data[0].lon}`;
    }
    
    // Retry without prefecture if not found
    if (prefecture) {
      await sleep(1500);
      const fallbackQuery = encodeURIComponent(`${islandName}, 日本`);
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${fallbackQuery}&format=json&limit=1`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'KiratabiTravelApp/1.0 (masahito@example.com)'
        }
      });
      const fallbackData = await fallbackRes.json();
      if (fallbackData && fallbackData.length > 0) {
        return `${fallbackData[0].lat}, ${fallbackData[0].lon}`;
      }
    }
  } catch (err) {
    console.error(`Error fetching Nominatim for ${islandName}:`, err.message);
  }
  return null;
}

async function main() {
  console.log("Starting coordinate bulk correction via Nominatim...");
  
  const { data: islands, error } = await supabase.from('islands').select('id, name, prefecture, coordinates');
  if (error) {
    console.error("Failed to fetch islands", error);
    process.exit(1);
  }

  console.log(`Found ${islands.length} islands to process.`);
  let updatedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < islands.length; i++) {
    const island = islands[i];
    console.log(`[${i+1}/${islands.length}] Processing: ${island.name} (${island.prefecture})`);

    // Respect Nominatim rate limit (max 1 request per second)
    await sleep(1500);

    const newCoords = await getCoordinatesFromNominatim(island.name, island.prefecture);

    if (newCoords) {
      if (newCoords !== island.coordinates) {
        const { error: updateError } = await supabase
          .from('islands')
          .update({ coordinates: newCoords })
          .eq('id', island.id);
        
        if (updateError) {
          console.error(`  -> Failed to update DB for ${island.name}:`, updateError);
          failedCount++;
        } else {
          console.log(`  -> Updated: ${island.coordinates} => ${newCoords}`);
          updatedCount++;
        }
      } else {
        console.log(`  -> Unchanged (coords already match)`);
      }
    } else {
      console.log(`  -> No result found from Nominatim`);
      failedCount++;
    }
  }

  console.log(`\nFinished! Updated: ${updatedCount}, Failed/Not Found: ${failedCount}`);
}

main();
