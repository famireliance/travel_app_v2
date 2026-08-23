const fs = require('fs');
const path = require('path');

const fairiesPath = path.join(__dirname, '../src/lib/fairies.ts');
let content = fs.readFileSync(fairiesPath, 'utf8');

let tsArrayString = content.substring(content.indexOf('export const FAIRIES_MASTER: IslandFairy[] = [') + 'export const FAIRIES_MASTER: IslandFairy[] = ['.length - 1);
tsArrayString = tsArrayString.substring(0, tsArrayString.lastIndexOf('];') + 1);
const fairies = eval('(' + tsArrayString + ')');

const exactMappings = {
  'fairy_json_1': 'ruri.png',
  'fairy_json_6': 'white_snake_nobg.jpg', // guess
  'fairy_json_7': 'ao_nobg',
  'fairy_json_9': 'twin_nobg', // guess
  'fairy_json_10': 'mangro_card',
  'fairy_json_11': 'pino_nobg',
  'fairy_json_12': 'clear_nobg',
  'fairy_json_13': 'yama.png',
  'fairy_json_15': 'sugar_card',
  'fairy_json_16': 'hoshi.png',
  'fairy_json_17': 'pony_nobg',
  'fairy_json_20': 'yan_nobg',
  'fairy_json_21': 'shell_nobg',
  'fairy_json_22': 'ogasawara_whale.jpg',
  'fairy_json_25': 'salt_nobg',
  'fairy_json_53': 'moku_nobg',
  'fairy_json_55': 'rira_nobg',
  'fairy_json_57': 'sasuke_nobg',
  'fairy_json_59': 'pon_nobg',
  'fairy_json_60': 'saban_nobg',
  'fairy_json_62': 'bisu_nobg',
  'fairy_json_63': 'seto_nobg',
  'fairy_json_65': 'lili_nobg',
  'fairy_json_67': 'angel_nobg',
  'fairy_json_68': 'pump_nobg',
  'fairy_json_70': 'eme_nobg',
  'fairy_json_71': 'matsu_nobg',
  'fairy_json_73': 'chacha.png',
  'fairy_json_74': 'kuroba_nobg',
  'fairy_json_75': 'taro_nobg',
  'fairy_json_76': 'tsubaki.png',
  'fairy_json_77': 'poncho_nobg',
  'fairy_json_79': 'poka_nobg',
  'fairy_json_80': 'purp_nobg',
  'fairy_json_82': 'niko_nobg',
  'fairy_json_83': 'lumina_nobg',
  'fairy_json_84': 'macha_nobg',
  'fairy_json_85': 'bonin_nobg',
  'fairy_json_86': 'piyo_nobg',
  'fairy_json_92': 'octo_nobg',
  'fairy_json_93': 'penki_nobg',
  'fairy_json_94': 'pearl_nobg',
  'fairy_json_95': 'maki_nobg',
  'fairy_json_97': 'onii_nobg',
  'fairy_json_99': 'bat_nobg', // Ren
  'fairy_json_100': 'tokky_nobg',
  'fairy_json_103': 'haku_nobg',
  'fairy_json_107': 'yuzu_nobg',
  'fairy_json_109': 'shiba_nobg',
  'fairy_json_110': 'bear_nobg',
  'fairy_json_118': 'magu.png',
  'fairy_json_120': 'yuki.png',
  'fairy_json_122': 'pirika_nobg',
  'fairy_json_125': 'mizu_nobg',
  'fairy_json_126': 'ryu.png',
  'fairy_json_127': 'guru.jpg',
  'fairy_json_128': 'sennin_nobg',
  'fairy_json_135': 'stained_nobg',
  'fairy_json_136': 'kodama.png'
};

const allImages = fs.readdirSync(path.join(__dirname, '../public/fairies'));

let mappedCount = 0;

for (const fairy of fairies) {
  if (fairy.visual.imageUrl && !fairy.visual.imageUrl.includes('fairy_json')) continue; // Already mapped properly

  let targetImageName = null;
  const mappedBase = exactMappings[fairy.id];
  
  if (mappedBase) {
     const match = allImages.find(img => img.startsWith(mappedBase));
     if (match) targetImageName = match;
  }
  
  // Try by English name lowercase
  if (!targetImageName) {
    const enName = fairy.name.match(/\((.*?)\)/);
    if (enName) {
      const lowerName = enName[1].toLowerCase().replace(/[^a-z]/g, '');
      const match = allImages.find(img => img.toLowerCase().startsWith(lowerName));
      if (match) targetImageName = match;
    }
  }

  if (targetImageName) {
    fairy.visual.imageUrl = '/fairies/' + targetImageName;
    mappedCount++;
    console.log(`Mapped ${targetImageName} to ${fairy.name}`);
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

console.log(`Mapped ${mappedCount} fairies`);
