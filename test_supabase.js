import { createClient } from '@supabase/supabase-js';

const url = 'https://lpuxsjpdenrwzyxfnggo.supabase.co';
const key = 'sb_publishable_MhCfBWG7bfQ5vcnN1zw9Hw_6bVf9kOd';

const supabase = createClient(url, key);

async function check() {
  console.log('Connecting to Supabase...');
  const { data, error } = await supabase.from('islands').select('*').limit(3);
  if (error) {
    console.error('Error fetching islands:', error);
  } else {
    console.log(`Fetched ${data.length} items.`);
    if (data.length > 0) {
      console.log('Sample item structure:', JSON.stringify(data[0], null, 2));
    }
  }
}

check();
