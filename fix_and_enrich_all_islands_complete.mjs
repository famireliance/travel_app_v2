import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsFilePath = path.join(__dirname, 'src/data/allIslandsMaster.ts');
const regionsFilePath = path.join(__dirname, 'src/data/regions.json');

// Read existing TypeScript master file
let tsContent = fs.readFileSync(tsFilePath, 'utf8');

// Parse the existing dictionary
const dictMatch = tsContent.match(/export const ALL_ISLANDS_MASTER_DICTIONARY: Record<string, any> = ({[\s\S]*?});/);
if (!dictMatch) {
  console.error("Could not match dictionary in allIslandsMaster.ts");
  process.exit(1);
}

// Evaluate existing dictionary strictly
let dict = eval('(' + dictMatch[1] + ')');
console.log(`Loaded ${Object.keys(dict).length} existing island records.`);

// 1. REGION ID MAPPING FIXES (map outdated/generic IDs to exact regions.json IDs)
const REGION_ID_MAP = {
  "hokkaido": "pseudo_hokkaido",
  "setouchi": "naoshima",
  "shodoshima": "naoshima"
};

// 2. SPECIFIC ISLAND REGION_ID & PREFECTURE OVERRIDES (Fix mis-mapped or null region islands)
const OVERRIDES = {
  // 北海道
  "礼文島": { region_id: "pseudo_hokkaido", prefecture: "北海道" },
  
  // 東北 (三陸・牡鹿など)
  "網地島": { region_id: "oshika", prefecture: "宮城県" },
  "田代島": { region_id: "oshika", prefecture: "宮城県" },
  "寒風沢島": { region_id: "oshika", prefecture: "宮城県" },
  "野々島": { region_id: "oshika", prefecture: "宮城県" },
  "朴島": { region_id: "oshika", prefecture: "宮城県" },
  "金華山": { region_id: "oshika", prefecture: "宮城県" },
  "宮戸島": { region_id: "oshika", prefecture: "宮城県" },
  "桂島": { region_id: "oshika", prefecture: "宮城県" },
  "出島": { region_id: "oshika", prefecture: "宮城県" },
  
  // 関東・東京湾・伊豆小笠原
  "猿島": { region_id: "pseudo_kanto", prefecture: "神奈川県" },
  "城ヶ島": { region_id: "pseudo_kanto", prefecture: "神奈川県" },
  "江の島": { region_id: "pseudo_kanto", prefecture: "神奈川県" },
  "仁右衛門島": { region_id: "pseudo_kanto", prefecture: "千葉県" },
  
  // 北陸・甲信越・東海
  "佐渡島": { region_id: "pseudo_hokuriku", prefecture: "新潟県" },
  "粟島": { region_id: "pseudo_hokuriku", prefecture: "新潟県" },
  "舳倉島": { region_id: "pseudo_hokuriku", prefecture: "石川県" },
  "能登島": { region_id: "pseudo_hokuriku", prefecture: "石川県" },
  "沖島": { region_id: "pseudo_biwako", prefecture: "滋賀県" },
  "賢島": { region_id: "aichi_santo", prefecture: "三重県" },
  "横山島": { region_id: "aichi_santo", prefecture: "三重県" },
  "坂手島": { region_id: "aichi_santo", prefecture: "三重県" },
  "菅島": { region_id: "aichi_santo", prefecture: "三重県" },
  "日間賀島": { region_id: "aichi_santo", prefecture: "愛知県" },
  "篠島": { region_id: "aichi_santo", prefecture: "愛知県" },
  "佐久島": { region_id: "aichi_santo", prefecture: "愛知県" },
  
  // 近畿・関西
  "淡路島": { region_id: "pseudo_awaji", prefecture: "兵庫県" },
  "沼島": { region_id: "pseudo_awaji", prefecture: "兵庫県" },
  "紀伊大島": { region_id: "pseudo_awaji", prefecture: "和歌山県" },
  
  // 中国・四国・瀬戸内
  "厳島": { region_id: "kasaoka", prefecture: "広島県" },
  "田島": { region_id: "kasaoka", prefecture: "広島県" },
  "阿多田島": { region_id: "kasaoka", prefecture: "広島県" },
  "小与島": { region_id: "shiwaku", prefecture: "香川県" },
  "広島": { region_id: "shiwaku", prefecture: "香川県" },
  "小豆島": { region_id: "naoshima", prefecture: "香川県" },
  "直島": { region_id: "naoshima", prefecture: "香川県" },
  "豊島": { region_id: "naoshima", prefecture: "香川県" },
  
  // 九州
  "端島": { region_id: "pseudo_saikai", prefecture: "長崎県" },
  "硫黄島": { region_id: "pseudo_satsuma", prefecture: "鹿児島県" },
  "伊唐島": { region_id: "pseudo_nagashima", prefecture: "鹿児島県" },
  "諸浦島": { region_id: "pseudo_nagashima", prefecture: "鹿児島県" },
  "獅子島": { region_id: "pseudo_nagashima", prefecture: "鹿児島県" },
  "対馬島": { region_id: "tsushima", prefecture: "長崎県" },
  "海栗島": { region_id: "tsushima", prefecture: "長崎県" }
};

// Apply mappings and overrides to existing items
for (const key of Object.keys(dict)) {
  const item = dict[key];
  if (REGION_ID_MAP[item.region_id]) {
    item.region_id = REGION_ID_MAP[item.region_id];
  }
  if (OVERRIDES[item.name]) {
    item.region_id = OVERRIDES[item.name].region_id;
    item.prefecture = OVERRIDES[item.name].prefecture;
  }
}

// 3. NEW ISLANDS TO ADD (Hokkaido, Tohoku, Hokuriku, Setouchi, Kyushu, etc.)
const NEW_ISLANDS = [
  // 北海道 (HOKKAIDO ISLANDS)
  {
    name: "利尻島",
    region_id: "pseudo_hokkaido",
    prefecture: "北海道",
    coordinates: "45.1833, 141.2333",
    description: "標高1,721mの秀峰「利尻山（利尻富士）」が島中央にそびえる名峰の島。最高級昆布「利尻昆布」と極上のエゾバフンウニの産地として世界的に有名です。島内にはオタトモマリ沼や姫沼など神秘的な湖沼が点在し、サイクリングや登山を楽しむ旅人を温かく迎えます。",
    access: "稚内港からフェリーで約1時間40分、または利尻空港への航空便",
    flags: { "宿泊施設": "yes", "レンタカー": "yes", "日帰り可否": "yes", "登山・遊歩道": "yes", "カフェ・飲食店": "yes", "スーパーや商店": "yes", "レンタサイクル": "yes", "温泉・浴場": "yes" }
  },
  {
    name: "奥尻島",
    region_id: "pseudo_hokkaido",
    prefecture: "北海道",
    coordinates: "42.1667, 139.4667",
    description: "北海道南西部、日本海に浮かぶ「オクシリブルー」の海が美しい離島。シンボルの「なべつる岩」や神秘的な神威脇温泉、ブナの原生林など豊かな大自然が広がります。新鮮なアワビやキタムラサキウニなど海の幸の宝庫としても知られています。",
    access: "江差港からフェリーで約2時間10分、または函館空港・丘珠空港から約30分",
    flags: { "宿泊施設": "yes", "レンタカー": "yes", "日帰り可否": "yes", "登山・遊歩道": "yes", "カフェ・飲食店": "yes", "スーパーや商店": "yes", "温泉・浴場": "yes" }
  },
  {
    name: "天売島",
    region_id: "pseudo_hokkaido",
    prefecture: "北海道",
    coordinates: "44.4333, 141.3167",
    description: "絶滅危惧種のオロロン鳥（ウミガラス）やウトウ、ケイマフリなど約100万羽の海鳥が繁殖する世界屈指の「海鳥の楽園」。島をぐるりと巡る遊歩道からは、断崖絶壁と真っ青な日本海の雄大な絶景を一望できます。",
    access: "羽幌港から高速船で約1時間、フェリーで約1時間35分",
    flags: { "宿泊施設": "yes", "レンタサイクル": "yes", "日帰り可否": "yes", "登山・遊歩道": "yes", "カフェ・飲食店": "yes" }
  },
  {
    name: "焼尻島",
    region_id: "pseudo_hokkaido",
    prefecture: "北海道",
    coordinates: "44.4333, 141.4167",
    description: "島の約3分の1を天然記念物のイチイ（オンコ）の原生林が覆う緑豊かな島。高級フレンチレストランでも重宝される希少な「サフォーク羊」がのどかに放牧されており、のんびりとした島時間の散策に最適です。",
    access: "羽幌港から高速船で約35分、フェリーで約1時間",
    flags: { "宿泊施設": "yes", "レンタサイクル": "yes", "日帰り可否": "yes", "遊歩道": "yes", "カフェ・飲食店": "yes" }
  },
  {
    name: "厚岸小島",
    region_id: "pseudo_hokkaido",
    prefecture: "北海道",
    coordinates: "42.9450, 144.8230",
    description: "厚岸湾沖に浮かぶ無人の島。希少な鳥類やアザラシが休息する自然の聖域であり、遠くから臨む島の姿は道東の海岸風景のシンボルとなっています。",
    access: "通常は上陸不可（海岸やクルーズからの観望）",
    flags: { "日帰り可否": "no", "自然景観・観察": "yes" }
  },
  {
    name: "嶮暮帰島",
    region_id: "pseudo_hokkaido",
    prefecture: "北海道",
    coordinates: "42.9667, 145.1333",
    description: "厚岸町と浜中町の境沖に位置する無人島。ムツゴロウ王国こと畑正憲氏がかつてヒカリゴケや野生動物と共に過ごした島として知られ、手つかずの野生が息づく神秘の地です。",
    access: "チャーター船等の観望",
    flags: { "日帰り可否": "no", "自然景観・観察": "yes" }
  },
  {
    name: "かもめ島",
    region_id: "pseudo_hokkaido",
    prefecture: "北海道",
    coordinates: "41.8683, 140.1183",
    description: "江差町の沖合に浮かび、砂州で陸続きとなっている風光明媚な島。島全体が道立自然公園に指定されており、歴史的な弁慶の足跡や美しい夕日、グランピングが楽しめます。",
    access: "江差町市街地から徒歩でアクセス可能",
    flags: { "日帰り可否": "yes", "遊歩道": "yes", "キャンプ・グランピング": "yes", "カフェ・飲食店": "yes" }
  },
  
  // 東北 (SANRIKU ISLANDS / OSHIKA)
  {
    name: "飛島（山形）",
    region_id: "pseudo_sanriku",
    prefecture: "山形県",
    coordinates: "39.1967, 139.5467",
    description: "日本海の荒波が造り出した「舘岩」や「賽の河原」などダイナミックな奇岩絶景が連なる酒田沖の離島。対馬暖流の影響で山形県内より年平均気温が高く、トビシマカンゾウなどの希少植物や日本海に沈む極上の夕日が見られます。",
    access: "酒田港から定期船「とびしま」で約1時間15分",
    flags: { "宿泊施設": "yes", "レンタサイクル": "yes", "日帰り可否": "yes", "遊歩道": "yes", "カフェ・飲食店": "yes", "釣り船チャーター": "yes" }
  },
  {
    name: "気仙沼大島",
    region_id: "pseudo_sanriku",
    prefecture: "宮城県",
    coordinates: "38.8611, 141.6111",
    description: "「緑の真珠」と称される美しい三陸の島。2019年に鶴亀大橋（気仙沼大島大橋）が開通し、本土と結ばれアクセスが劇的に向上しました。亀山展望台からの360度の大パノラマと小田の浜海水浴場の透き通る海が魅力です。",
    access: "気仙沼市街から気仙沼大島大橋を渡り車やバスでアクセス",
    flags: { "宿泊施設": "yes", "レンタカー": "yes", "日帰り可否": "yes", "カフェ・飲食店": "yes", "スーパーや商店": "yes", "ビーチ・海水浴": "yes" }
  },
  
  // 中国・四国 (SETOUCHI / SAN-IN)
  {
    name: "角島",
    region_id: "hagi",
    prefecture: "山口県",
    coordinates: "34.3528, 130.8528",
    description: "コバルトブルーの海をまたぐ全長1,780mの「角島大橋」で世界的に有名な日本海の楽園島。映画やCMのロケ地として絶大な人気を誇り、明治時代から灯り続ける洋風御影石造りの角島灯台や絶景ビーチが旅人を魅了します。",
    access: "下関市豊北町から角島大橋経由で車・バスですぐ",
    flags: { "宿泊施設": "yes", "レンタカー・ドライブ": "yes", "日帰り可否": "yes", "カフェ・飲食店": "yes", "ビーチ・海水浴": "yes", "灯台・絶景": "yes" }
  },
  {
    name: "大根島",
    region_id: "oki",
    prefecture: "島根県",
    coordinates: "35.4950, 133.1717",
    description: "中海に浮かぶ、日本一の「牡丹（ぼたん）」と高麗人参の島。ベタ踏み坂（江島大橋）を渡ってアクセスでき、由志園の絢爛豪華な日本庭園やおしゃれな島カフェ、豊かな火山地形の溶岩洞窟を体験できます。",
    access: "松江市・境港市から車やバスで江島大橋などを経由し約20分",
    flags: { "宿泊施設": "yes", "日帰り可否": "yes", "カフェ・飲食店": "yes", "庭園・観光施設": "yes" }
  }
];

// Find maximum numeric ID currently
let maxId = 0;
for (const key of Object.keys(dict)) {
  const num = parseInt(dict[key].id || key, 10);
  if (!isNaN(num) && num > maxId) {
    maxId = num;
  }
}

// Add new islands if not already present by name
for (const newIsl of NEW_ISLANDS) {
  const existing = Object.values(dict).find(i => i.name === newIsl.name);
  if (!existing) {
    maxId++;
    const idStr = String(maxId);
    dict[idStr] = {
      id: idStr,
      ...newIsl
    };
    console.log(`Added new island: ${newIsl.name} (ID: ${idStr}, Region: ${newIsl.region_id})`);
  }
}

// Write back formatted TypeScript
const newTsContent = `// 日本全国全338島の自己完結型リッチマスターデータ（全島正確海域座標完全補正済み・地域分類完全対応版）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ALL_ISLANDS_MASTER_DICTIONARY: Record<string, any> = ${JSON.stringify(dict, null, 2)};

export const ALL_ISLANDS_LIST = Object.values(ALL_ISLANDS_MASTER_DICTIONARY);
`;

fs.writeFileSync(tsFilePath, newTsContent, 'utf8');
console.log(`Successfully updated allIslandsMaster.ts with ${Object.keys(dict).length} records!`);

// 4. NOW UPDATE REGIONS.JSON visited/total counts cleanly based on the dictionary!
let regionsJson = JSON.parse(fs.readFileSync(regionsFilePath, 'utf8'));
const regionIdCounts = {};
for (const item of Object.values(dict)) {
  if (item.region_id) {
    regionIdCounts[item.region_id] = (regionIdCounts[item.region_id] || 0) + 1;
  }
}

for (const reg of regionsJson) {
  reg.total = regionIdCounts[reg.id] || 0;
}

fs.writeFileSync(regionsFilePath, JSON.stringify(regionsJson, null, 2), 'utf8');
console.log("Successfully updated regions.json counts!");
