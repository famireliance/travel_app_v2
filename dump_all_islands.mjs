const url = 'https://lpuxsjpdenrwzyxfnggo.supabase.co';
const key = 'sb_publishable_MhCfBWG7bfQ5vcnN1zw9Hw_6bVf9kOd';

async function dump() {
  try {
    const res = await fetch(`${url}/rest/v1/islands?select=id,name,region_id,coordinates`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`Fetched ${data.length} islands.`);
      const yagaji = data.filter(i => i.name.includes('屋我地') || i.name.includes('古宇利') || i.name.includes('沖縄') || i.region_id === 'unknown');
      console.log('Sample Yagaji/Okinawa/unknown islands:', JSON.stringify(yagaji.slice(0, 15), null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

dump();
