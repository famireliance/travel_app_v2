const fs = require('fs');
const path = require('path');

const fairiesPath = path.join(__dirname, '../src/lib/fairies.ts');
let content = fs.readFileSync(fairiesPath, 'utf8');

let tsArrayString = content.substring(content.indexOf('export const FAIRIES_MASTER: IslandFairy[] = [') + 'export const FAIRIES_MASTER: IslandFairy[] = ['.length - 1);
tsArrayString = tsArrayString.substring(0, tsArrayString.lastIndexOf('];') + 1);
const fairies = eval('(' + tsArrayString + ')');

const unusedImages = [
  'art.png',
  'mika.png',
  'miyabi.png',
  'oribi.png',
  'remo.png',
  'rin.png',
  'shimaenaga.jpg',
  'shisa.jpg',
  'tida.jpg',
  'tokine.png',
  'ushima.png',
  'yonaguni_horse.jpg',
  'zou.jpg'
];

let mappedCount = 0;
let imgIndex = 0;

for (const fairy of fairies) {
  if (fairy.visual.imageUrl && fairy.visual.imageUrl.includes('fairy_json')) {
    // Needs mapping
    const img = unusedImages[imgIndex % unusedImages.length];
    fairy.visual.imageUrl = '/fairies/' + img;
    mappedCount++;
    imgIndex++;
    console.log(`Mapped ${img} to ${fairy.name}`);
  }
}

const header = `export type FairyRarity = 'NORMAL' | 'RARE' | 'EPIC' | 'SPOT_EXCLUSIVE';
export type FairyAttribute = 'WATER' | 'NATURE' | 'FIRE' | 'LIGHT' | 'EARTH' | 'WIND' | 'ICE';

export interface FairyVisual {
  icon: string;
  imageUrl?: string;
  colorFrom: string;
  colorTo: string;
  shadowColor: string;
  sparkleColor: string;
}

export interface IslandFairy {
  id: string;
  baseFairyId?: string;
  name: string;
  theme: string;
  region_id?: string;
  island_id?: string;
  rarity: FairyRarity;
  attribute: FairyAttribute;
  collabSponsor?: string;
  visual: FairyVisual;
  description: string;
}

export const FAIRIES_MASTER: IslandFairy[] = `;

let newContent = header + JSON.stringify(fairies, null, 2) + ';\n';
fs.writeFileSync(fairiesPath, newContent);

console.log(`Mapped ${mappedCount} remaining fairies`);
