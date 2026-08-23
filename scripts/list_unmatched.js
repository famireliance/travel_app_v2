const fs = require('fs');
const path = require('path');

const fairiesPath = path.join(__dirname, '../src/lib/fairies.ts');
const content = fs.readFileSync(fairiesPath, 'utf8');

// Find all imageUrls that end with 'fairy_json_X.png'
const matches = content.match(/\/fairies\/fairy_json_\d+\.png/g);

console.log(`Unmatched fairies count: ${matches ? matches.length : 0}`);
console.log(matches);
