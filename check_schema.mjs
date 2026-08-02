import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.split('\n').find(line => line.startsWith(key))?.split('=')[1]?.trim();
const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const { data, error } = await supabase.from('user_profiles').select('*');
  console.log(data);
}
run();
