const url = 'https://lpuxsjpdenrwzyxfnggo.supabase.co';
const key = 'sb_publishable_MhCfBWG7bfQ5vcnN1zw9Hw_6bVf9kOd';

async function check() {
  try {
    const res = await fetch(`${url}/rest/v1/islands?select=id,name,region_id,coordinates`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      const withCoords = data.filter(i => i.coordinates && i.coordinates !== 'null');
      console.log(`Islands with explicit DB coords (${withCoords.length}):`);
      withCoords.forEach(i => {
        console.log(`- [id:${i.id}] ${i.name} (reg:${i.region_id}) -> ${i.coordinates}`);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

check();
