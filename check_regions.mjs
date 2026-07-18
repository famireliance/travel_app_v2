const url = 'https://lpuxsjpdenrwzyxfnggo.supabase.co';
const key = 'sb_publishable_MhCfBWG7bfQ5vcnN1zw9Hw_6bVf9kOd';

async function checkRegions() {
  try {
    const res = await fetch(`${url}/rest/v1/islands?select=id,name,region_id,coordinates`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      const regions = {};
      for (const i of data) {
        const reg = i.region_id || 'unknown';
        if (!regions[reg]) {
          regions[reg] = { count: 0, nullCoordsCount: 0, samples: [] };
        }
        regions[reg].count++;
        if (!i.coordinates || i.coordinates === 'null') {
          regions[reg].nullCoordsCount++;
        }
        if (regions[reg].samples.length < 3) {
          regions[reg].samples.push(`${i.name}(id:${i.id}, coord:${i.coordinates})`);
        }
      }
      console.log('Region distribution:', JSON.stringify(regions, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkRegions();
