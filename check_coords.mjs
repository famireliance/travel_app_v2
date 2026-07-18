const url = 'https://lpuxsjpdenrwzyxfnggo.supabase.co';
const key = 'sb_publishable_MhCfBWG7bfQ5vcnN1zw9Hw_6bVf9kOd';

async function checkAll() {
  try {
    const res = await fetch(`${url}/rest/v1/islands?select=id,name,coordinates`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`Total islands fetched: ${data.length}`);
      const withCoords = data.filter(i => i.coordinates && i.coordinates !== 'null' && i.coordinates !== null);
      const nullCoords = data.filter(i => !i.coordinates || i.coordinates === 'null' || i.coordinates === null);
      console.log(`Islands with coordinates: ${withCoords.length}`);
      console.log(`Islands with NULL coordinates: ${nullCoords.length}`);
      if (withCoords.length > 0) {
        console.log('Sample with coords:', JSON.stringify(withCoords[0], null, 2));
      }
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

checkAll();
