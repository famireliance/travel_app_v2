const fs = require('fs');
const path = require('path');

const fairiesPath = path.join(__dirname, '../src/lib/fairies.ts');
let content = fs.readFileSync(fairiesPath, 'utf8');

let tsArrayString = content.substring(content.indexOf('export const FAIRIES_MASTER: IslandFairy[] = [') + 'export const FAIRIES_MASTER: IslandFairy[] = ['.length - 1);
tsArrayString = tsArrayString.substring(0, tsArrayString.lastIndexOf('];') + 1);
const fairies = eval('(' + tsArrayString + ')');

const fairiesDir = path.join(__dirname, '../public/fairies');
const files = fs.readdirSync(fairiesDir);
const discoveredImages = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));

let discoveredCount = 0;
let revealedFairies = [];
let unrevealedFairies = [];

fairies.forEach(fairy => {
  const imageFileName = fairy.visual.imageUrl ? fairy.visual.imageUrl.replace('/fairies/', '') : null;
  const isRevealed = !!(imageFileName && discoveredImages.includes(imageFileName));
  
  if (isRevealed) {
    discoveredCount++;
    revealedFairies.push(fairy.name);
  } else {
    unrevealedFairies.push({ name: fairy.name, expectedImage: imageFileName });
  }
});

console.log(`Total fairies: ${fairies.length}`);
console.log(`Discovered Count: ${discoveredCount}`);
console.log(`Unrevealed Count: ${unrevealedFairies.length}`);
console.log(unrevealedFairies.map(f => f.name + " (" + f.expectedImage + ")").join("\n"));
