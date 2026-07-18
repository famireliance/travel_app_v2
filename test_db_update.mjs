const url = 'https://lpuxsjpdenrwzyxfnggo.supabase.co';
const key = 'sb_publishable_MhCfBWG7bfQ5vcnN1zw9Hw_6bVf9kOd';

async function testUpdate() {
  try {
    console.log('Testing PATCH on island id=378 (屋我地島)...');
    const res = await fetch(`${url}/rest/v1/islands?id=eq.378`, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        coordinates: '26.6534, 128.0142',
        region_id: 'okinawa_main'
      })
    });
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Update test error:', err);
  }
}

testUpdate();
