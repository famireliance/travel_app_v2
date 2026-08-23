const fs = require('fs');
const path = require('path');

const fairiesPath = path.join(__dirname, '../src/lib/fairies.ts');
let content = fs.readFileSync(fairiesPath, 'utf8');

let tsArrayString = content.substring(content.indexOf('export const FAIRIES_MASTER: IslandFairy[] = [') + 'export const FAIRIES_MASTER: IslandFairy[] = ['.length - 1);
tsArrayString = tsArrayString.substring(0, tsArrayString.lastIndexOf('];') + 1);
const fairies = eval('(' + tsArrayString + ')');

const manualMappings = {
  'awa_niigata_card': '粟島',
  'awaji_card': '淡路',
  'daito_card': '大東',
  'erabu_card': '沖永良部',
  'goto_card': '五島',
  'hahajima_card': '母島',
  'hate_card': '波照間',
  'hateru_card': '波照間',
  'hatoma_card': '鳩間',
  'hatsushima_card': '初島',
  'ie_card': '伊江',
  'iki_card': '壱岐',
  'irabu_card': '伊良部',
  'ishigakky_card': '石垣',
  'izu_card': '伊豆',
  'kikai_card': '喜界',
  'kinki_card': '近畿',
  'kourin_card': '古宇利',
  'kuro_card': '黒島',
  'kyuu_card': '九州',
  'mangro_card': 'マングローブ',
  'mangrove2_card': 'マングローブ',
  'megi_card': '女木',
  'minamijima_card': '南島',
  'miyake_card': '三宅',
  'miyako_v2_card': '宮古',
  'nao_card': '直島',
  'nii_card': '新島',
  'noko_card': '能古',
  'ogi_card': '男木',
  'oki_card': '隠岐',
  'okina_card': '沖縄',
  'okushiri_card': '奥尻',
  'oshima_card': '大島',
  'rebun_card': '礼文',
  'rishiri_card': '利尻',
  'sado_card': '佐渡',
  'shikano_card': '志賀',
  'shodo_card': '小豆',
  'suo_card': '周防',
  'taketomi_card': '竹富',
  'tanegashima_card': '種子島',
  'teuri_card': '天売',
  'tobishima_card': '飛島',
  'tokashiki_card': '渡嘉敷',
  'tokuno_card': '徳之島',
  'touho_card': '東北',
  'touka_card': '東海',
  'tsuno_card': '角島',
  'tsushima_card': '対馬',
  'yagishiri_card': '焼尻',
  'yakushima_card': '屋久島',
  'zamami_card': '座間味',
  'chuu_card': '中国',
  'jinbe_v2_card': '美ら海',
  'jinta_card': '美ら海'
};

let mappedCount = 0;

for (const [cardName, kanjiKeyword] of Object.entries(manualMappings)) {
  // Find a fairy that matches the kanji in target_island or region_id or motif
  const targetFairy = fairies.find(f => 
    (f.island_id && f.island_id.includes(kanjiKeyword)) || 
    (f.region_id && f.region_id.includes(kanjiKeyword)) ||
    (f.theme && f.theme.includes(kanjiKeyword))
  );

  if (targetFairy) {
    // Find the exact filename in the dir (could be multiple versions, we pick the first match in existingFiles or just guess it)
    const existingFiles = fs.readdirSync(path.join(__dirname, '../public/fairies'));
    const actualFile = existingFiles.find(f => f.startsWith(cardName));
    
    if (actualFile) {
      targetFairy.visual.imageUrl = '/fairies/' + actualFile;
      mappedCount++;
      console.log(`Mapped ${actualFile} to ${targetFairy.name} (${targetFairy.island_id})`);
    }
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

console.log(`Successfully hard-patched ${mappedCount} fairies!`);
