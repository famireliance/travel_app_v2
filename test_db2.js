const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if(urlMatch && keyMatch) {
  // Use a custom fetch that skips WebSocket requirements
  const supabase = createClient(urlMatch[1], keyMatch[1], {
    auth: { persistSession: false },
    realtime: { transport: null }
  });
  supabase.from('fairies').select('id, fairy_key, island_id, region_id').then(({data, error}) => {
    if(error) console.error(error);
    else console.log(`DB Fairies count: ${data.length}\n`, data.slice(0, 3));
  });
}
