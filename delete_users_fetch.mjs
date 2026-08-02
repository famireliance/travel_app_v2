import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.split('\n').find(line => line.startsWith(key))?.split('=')[1]?.trim();
const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

async function run() {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await res.json();
  const users = data.users || [];
  console.log(`Found ${users.length} users.`);
  for (const user of users) {
    await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log(`Deleted ${user.email}`);
  }
}
run();
