import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if(key && val) env[key.trim()] = val.join('=').trim();
});

const islandNames = ['佐渡島', '奄美大島', '対馬', '屋久島', '西表島', '淡路島', '福江島', '小豆島', '種子島'];
const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/islands?name=in.(${encodeURIComponent('"' + islandNames.join('","') + '"')})&select=id,name,coordinates,checkin_radius_m,area`;

fetch(url, {
  headers: {
    'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  }
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
