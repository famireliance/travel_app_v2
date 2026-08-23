const https = require('https');
const islandName = "宮古島";
const url = `https://ja.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(islandName)}&prop=pageimages&format=json&pithumbsize=800`;

https.get(url, { headers: { 'User-Agent': 'Kiratabi/1.0 (contact@example.com)' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
}).on('error', err => console.log(err));
