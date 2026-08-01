import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if(key && val) env[key.trim()] = val.join('=').trim();
});

const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/islands?name=eq.${encodeURIComponent('石垣島')}`;

fetch(url, {
  method: 'PATCH',
  headers: {
    'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({ checkin_radius_m: 20000 })
})
.then(r => r.json())
.then(data => console.log('Successfully updated Ishigaki Island radius to 20km:', data))
.catch(console.error);
