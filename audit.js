const fs = require('fs');
const https = require('https');

// Haversine distance function in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function fetchGeocode(name) {
  return new Promise((resolve) => {
    // Strip parentheses and their contents, e.g. "大島（宮城県）" -> "大島"
    const cleanName = name.replace(/（.*?）/g, '').replace(/・.*/g, '').trim();
    const query = encodeURIComponent(cleanName + ', 日本');
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    
    https.get(url, { headers: { 'User-Agent': 'TravelAppAudit/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.length > 0) {
            resolve({ lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) });
          } else {
            resolve(null);
          }
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function runAudit() {
  const content = fs.readFileSync('src/data/allIslandsMaster.ts', 'utf8');
  const lines = content.split('\n');
  const islands = [];
  let currentObj = null;

  for (const line of lines) {
    const idMatch = line.match(/^\s*"(\d+)": \{/);
    if (idMatch) {
      if (currentObj && currentObj.name && currentObj.coordinates) {
        islands.push(currentObj);
      }
      currentObj = { id: idMatch[1] };
    } else if (currentObj) {
      const nameMatch = line.match(/"name": "([^"]+)"/);
      if (nameMatch) currentObj.name = nameMatch[1];
      const coordMatch = line.match(/"coordinates": "([^"]+)"/);
      if (coordMatch) currentObj.coordinates = coordMatch[1];
      const regionMatch = line.match(/"region_id": "([^"]+)"/);
      if (regionMatch) currentObj.region_id = regionMatch[1];
    }
  }
  if (currentObj && currentObj.name && currentObj.coordinates) {
    islands.push(currentObj);
  }

  const results = {
    notFound: [],
    misaligned: [],
    ok: []
  };

  console.log(`Starting audit for ${islands.length} islands...`);

  // To speed up slightly, we can batch 2 requests at a time (OSM allows 1 req/sec, so wait 1 sec per batch)
  for (let i = 0; i < islands.length; i++) {
    const island = islands[i];
    if (i % 10 === 0) console.log(`Processing ${i}/${islands.length}...`);
    
    const [dbLat, dbLon] = island.coordinates.split(',').map(s => parseFloat(s.trim()));
    const apiCoords = await fetchGeocode(island.name);
    
    if (!apiCoords) {
      // Try just the name without ", 日本" as fallback
      const cleanName = island.name.replace(/（.*?）/g, '').replace(/・.*/g, '').trim();
      const fallbackCoords = await new Promise((resolve) => {
        setTimeout(() => {
          https.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanName)}&format=json&limit=1`, { headers: { 'User-Agent': 'TravelAppAudit/1.0' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                if (json && json.length > 0) {
                  resolve({ lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) });
                } else {
                  resolve(null);
                }
              } catch(e) { resolve(null); }
            });
          }).on('error', () => resolve(null));
        }, 1100);
      });
      
      if (!fallbackCoords) {
        results.notFound.push(island);
      } else {
        const dist = getDistance(dbLat, dbLon, fallbackCoords.lat, fallbackCoords.lon);
        if (dist > 3.0) {
          results.misaligned.push({ ...island, apiCoords: fallbackCoords, distKm: dist.toFixed(2) });
        } else {
          results.ok.push(island);
        }
      }
    } else {
      const dist = getDistance(dbLat, dbLon, apiCoords.lat, apiCoords.lon);
      if (dist > 3.0) { // More than 3km diff
        results.misaligned.push({ ...island, apiCoords, distKm: dist.toFixed(2) });
      } else {
        results.ok.push(island);
      }
    }
    
    // Sleep to respect API limits
    await new Promise(r => setTimeout(r, 1100));
  }
  
  fs.writeFileSync('audit_results.json', JSON.stringify(results, null, 2));
  console.log('Audit complete! Results saved to audit_results.json');
}

runAudit();
