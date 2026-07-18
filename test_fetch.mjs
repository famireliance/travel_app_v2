const url = 'https://lpuxsjpdenrwzyxfnggo.supabase.co';
const key = 'sb_publishable_MhCfBWG7bfQ5vcnN1zw9Hw_6bVf9kOd';

async function testFetch() {
  try {
    const res = await fetch(`${url}/rest/v1/islands?select=*&limit=3`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log('Status:', res.status, res.statusText);
    if (res.ok) {
      const data = await res.json();
      console.log(`Fetched ${data.length} items.`);
      if (data.length > 0) {
        console.log('Sample item:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('Table "islands" returned 0 rows! Let us check what tables exist or if RLS is enabled.');
      }
    } else {
      const text = await res.text();
      console.log('Error response:', text);
    }
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

testFetch();
