require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('ad_campaigns').select('*').limit(1);
  if (error) {
    console.error('Error details:', error);
  } else {
    console.log('Success, data:', data);
  }
}

test();
