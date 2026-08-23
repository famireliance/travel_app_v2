const fs = require('fs');
const path = require('path');

const fairiesPath = path.join(__dirname, '../src/lib/fairies.ts');
let content = fs.readFileSync(fairiesPath, 'utf8');

let tsArrayString = content.substring(content.indexOf('export const FAIRIES_MASTER: IslandFairy[] = [') + 'export const FAIRIES_MASTER: IslandFairy[] = ['.length - 1);
tsArrayString = tsArrayString.substring(0, tsArrayString.lastIndexOf('];') + 1);
const fairies = eval('(' + tsArrayString + ')');

const usedImages = fairies.map(f => f.visual.imageUrl ? f.visual.imageUrl.replace('/fairies/', '') : null).filter(Boolean);

const allImages = fs.readdirSync(path.join(__dirname, '../public/fairies')).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'));
const unusedImages = allImages.filter(i => !usedImages.includes(i));
console.log(unusedImages.join('\n'));
