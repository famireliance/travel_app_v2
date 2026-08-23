const fs = require('fs');
const path = require('path');

const fairiesPath = path.join(__dirname, '../src/lib/fairies.ts');
let content = fs.readFileSync(fairiesPath, 'utf8');

let tsArrayString = content.substring(content.indexOf('export const FAIRIES_MASTER: IslandFairy[] = [') + 'export const FAIRIES_MASTER: IslandFairy[] = ['.length - 1);
tsArrayString = tsArrayString.substring(0, tsArrayString.lastIndexOf('];') + 1);
const fairies = eval('(' + tsArrayString + ')');

const unrevealed = fairies.filter(f => !f.visual.imageUrl || !fs.existsSync(path.join(__dirname, '../public', f.visual.imageUrl)));
console.log(unrevealed.map(f => `${f.id} | ${f.name} | ${f.theme}`).join('\n'));
