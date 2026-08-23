const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

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
    if (data.message) {
      console.log("Error:", data);
    } else {
      console.log(`Found ${data.length} fairies in DB!`);
      console.log(data.slice(0, 3));
    }
  })
  .catch(console.error);
}
