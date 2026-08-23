const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if(urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  supabase.from('fairies').select('id, fairy_key, name, island_id').then(({data, error}) => {
    if(error) console.error(error);
    else console.log(`DB Fairies count: ${data.length}\nSample:`, data.slice(0, 5));
  });
} else {
  console.log('No env found');
}
