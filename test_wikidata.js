const https = require('https');
const islandName = "小豆島";
const sparqlQuery = `
  SELECT ?image WHERE {
    ?item rdfs:label "${islandName}"@ja.
    ?item wdt:P18 ?image.
  } LIMIT 1
`;
const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;

https.get(url, { headers: { 'User-Agent': 'Kiratabi/1.0', 'Accept': 'application/sparql-results+json' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(parsed.results.bindings);
    } catch(e) {
      console.log(data);
    }
  });
}).on('error', err => console.log(err));
