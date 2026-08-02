import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.split('\n').find(line => line.startsWith(key))?.split('=')[1]?.trim();
const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

async function run() {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
