const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if(urlMatch && keyMatch) {
  const url = `${urlMatch[1]}/rest/v1/fairies?select=*`;
  fetch(url, {
    headers: {
      'apikey': keyMatch[1],
      'Authorization': `Bearer ${keyMatch[1]}`
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log(`Found ${data.length} fairies in DB!`);
    fs.writeFileSync('db_fairies.json', JSON.stringify(data, null, 2));
    console.log(data.slice(0, 2));
  })
  .catch(console.error);
}
