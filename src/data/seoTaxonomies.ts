import { ALL_ISLANDS_MASTER_DICTIONARY } from './allIslandsMaster';

export interface PrefectureSeoEntry {
  slug: string;
  name: string;
  shortName: string;
  area: string;
  hubAccess: string;
  leadText: string;
}

export const PREFECTURE_SEO_LIST: PrefectureSeoEntry[] = [
  { slug: 'okinawa', name: '沖縄県', shortName: '沖縄', area: '沖縄', hubAccess: '那覇空港・泊港（とまりん）・石垣港離島ターミナル・宮古空港・平敷屋港・運天港', leadText: '沖縄本島周辺離島・慶良間諸島・久米島・宮古列島・八重山諸島・大東諸島まで、ケラマブルーやサンゴ礁の絶景ビーチが広がる上陸対象離島を完全網羅。橋で車で行ける島から高速船15分の日帰り離島、バラス島・幻の島などの人気上陸無人島、日本最西端・最南端の島まで比較できます。' },
  { slug: 'nagasaki', name: '長崎県', shortName: '長崎', area: '九州', hubAccess: '長崎港・佐世保港・博多港・福岡空港・対馬空港・福江空港・壱岐空港', leadText: '五島列島・壱岐・対馬・九十九島・平戸諸島など日本有数の多島美と潜伏キリシタン世界遺産の島々が集まる長崎県の離島一覧。各島のフェリー航路・日帰り可否・島内インフラを比較できます。' },
  { slug: 'kagoshima', name: '鹿児島県', shortName: '鹿児島', area: '九州', hubAccess: '鹿児島港（本港区・新港区）・鹿児島空港・奄美空港・屋久島空港・種子島空港', leadText: '世界自然遺産の屋久島・奄美大島・徳之島をはじめ、種子島、与論島、沖永良部島、トカラ列島（十島村）、三島村、甑島列島まで個性豊かな南西諸島・薩南諸島の離島ガイド。' },
  { slug: 'ehime', name: '愛媛県', shortName: '愛媛', area: '四国・瀬戸内', hubAccess: '松山観光港・三津浜港・今治港・宇和島港・しまなみ海道', leadText: 'しまなみ海道（芸予諸島）・忽那諸島・宇和海諸島など、サイクリングや柑橘の島旅、猫の島として知られる青島まで瀬戸内・宇和海の穏やかな離島を網羅しています。' },
  { slug: 'hiroshima', name: '広島県', shortName: '広島', area: '中国・瀬戸内', hubAccess: '広島港（宇品）・呉港・尾道港・忠海港・宮島口桟橋', leadText: '世界遺産の厳島（宮島）、うさぎの島・大久野島、しまなみ海道の生口島・因島、とびしま海道、江田島・倉橋島など船旅・橋ドライブの双方が楽しめる瀬戸内離島ガイド。' },
  { slug: 'kagawa', name: '香川県', shortName: '香川', area: '四国・瀬戸内', hubAccess: '高松港・丸亀港・多度津港・観音寺港・宇野港', leadText: '小豆島・直島・豊島・犬島・女木島・男木島・粟島など、瀬戸内国際芸術祭の舞台となる現代アートの島々とオリーブ香るリゾート離島を一覧で比較できます。' },
  { slug: 'yamaguchi', name: '山口県', shortName: '山口', area: '中国・瀬戸内', hubAccess: '柳井港・徳山港・防府三田尻港・萩港・仙崎港・角島大橋', leadText: '角島大橋で有名な角島、周防大島（屋代島）、祝島、萩沖の見島・相島・大島など、日本海の荒波と瀬戸内海の多島美の両面を持つ山口県の離島ディレクトリ。' },
  { slug: 'okayama', name: '岡山県', shortName: '岡山', area: '中国・瀬戸内', hubAccess: '宇野港・笠岡港・日生港・児島観光港・牛窓港', leadText: '笠岡諸島（北木島・白石島・真鍋島・六島など）、犬島、日生諸島（頭島・鹿久居島）、牛窓の前島など花崗岩と潮待ち港の歴史が息づく瀬戸内の島々を収録。' },
  { slug: 'tokyo', name: '東京都', shortName: '東京', area: '関東・伊豆小笠原', hubAccess: '竹芝客船ターミナル・調布飛行場・羽田空港（八丈島便）・下田港', leadText: '伊豆諸島（大島・利島・新島・式根島・神津島・三宅島・御蔵島・八丈島・青ヶ島）から世界自然遺産の小笠原諸島（父島・母島・南島）まで、東京都に属する全12の冒険離島ガイド。' },
  { slug: 'kumamoto', name: '熊本県', shortName: '熊本', area: '九州', hubAccess: '三角港・本渡港・牛深港・水俣港・天草五橋', leadText: '天草五橋で結ばれる上島・下島をはじめ、イルカウォッチングの通詞島、湯島（談合島）、御所浦島など穏やかな不知火海・天草灘の島々をご案内します。' },
  { slug: 'miyagi', name: '宮城県', shortName: '宮城', area: '東北', hubAccess: '塩釜港（マリンゲート塩釜）・石巻港・女川港・気仙沼港', leadText: '日本三景・松島の浦戸諸島（桂島・野々島・寒風沢島・朴島）、猫の島として世界的に有名な田代島、金華山・網地島、気仙沼大島など三陸・仙台湾の離島一覧。' },
  { slug: 'fukuoka', name: '福岡県', shortName: '福岡', area: '九州', hubAccess: '博多ふ頭（ベイサイドプレイス）・姪浜渡船場・新宮漁港・小倉港', leadText: '福岡市中心部から船で10分の能古島、志賀島、猫の島・相島（新宮町）、玄界島、大島（宗像）、藍島・馬島など日帰りで気軽に渡れる玄界灘・響灘の離島群。' },
  { slug: 'mie', name: '三重県', shortName: '三重', area: '東海・伊勢志摩', hubAccess: '鳥羽マリンターミナル・賢島港・和具港・わたかの対岸渡船', leadText: '鳥羽湾の答志島・神島・菅島・坂手島や、英虞湾の間崎島・賢島・渡鹿野島など、伊勢志摩国立公園のリアス海岸と極上の海鮮グルメを堪能できる離島一覧。' },
  { slug: 'saga', name: '佐賀県', shortName: '佐賀', area: '九州', hubAccess: '唐津東港・呼子港・星賀港', leadText: '唐津城を望む高島（宝当神社）、呼子沖の加部島・神集島・小川島・馬渡島・松島・向島など、イカの活き造りと玄界灘の絶景を楽しめる佐賀県の離島一覧。' },
  { slug: 'hokkaido', name: '北海道', shortName: '北海道', area: '北海道', hubAccess: '稚内港・新千歳空港・丘珠空港・羽幌港・江差港・瀬棚港', leadText: '高山植物の花畑が広がる礼文島、利尻富士そびえる利尻島、海鳥の楽園・天売島＆焼尻島、日本海最西端の奥尻島、厚岸の小島まで北の大自然を体感する離島ガイド。' },
  { slug: 'shimane', name: '島根県', shortName: '島根', area: '中国・日本海', hubAccess: '七類港・境港・隠岐空港・菱浦港・別府港・来居港', leadText: 'ユネスコ世界ジオパーク認定の隠岐諸島（島後・西ノ島・中ノ島・知夫里島）や大根島など、国賀海岸の断崖絶壁と古代からの歴史ロマンが息づく離島一覧。' },
  { slug: 'hyogo', name: '兵庫県', shortName: '兵庫', area: '関西・瀬戸内', hubAccess: '姫路港・明石海峡大橋・洲本港・土生港・赤穂港', leadText: '瀬戸内海最大の淡路島、国生み神話の沼島、姫路沖の家島諸島（家島・坊勢島・男鹿島）など関西圏からすぐ行ける歴史と美食の離島を収録。' },
  { slug: 'tokushima', name: '徳島県', shortName: '徳島', area: '四国', hubAccess: '鳴門・阿南答島港・浅川港・牟岐港', leadText: '牟岐沖の出羽島（国の重要伝統的建造物群保存地区）、伊島、大毛島・島田島など、黒潮の恵みと懐かしい漁村風景が残る徳島県の離島一覧。' },
  { slug: 'oita', name: '大分県', shortName: '大分', area: '九州', hubAccess: '佐伯港・津久見港・別府港・姫島岐部港', leadText: 'アサギマダラ飛来と車えびで知られる国東半島の姫島、イルカ島の津久見・保戸島、深島（猫と味噌の島）、大入島・屋形島など豊後水道の魅力的な島々。' },
  { slug: 'aichi', name: '愛知県', shortName: '愛知', area: '東海', hubAccess: '河和港・師崎港・一色港・伊良湖港', leadText: '名古屋から1時間圏内で日帰り旅が大人気の三河湾3島（タコとフグの日間賀島、現代アートの佐久島、万葉ロマンの篠島）へのアクセス・観光ガイド。' },
  { slug: 'kochi', name: '高知県', shortName: '高知', area: '四国', hubAccess: '宿毛片島港・柏島大橋', leadText: '船が宙に浮いて見える驚異の透明度を誇る柏島、宿毛沖の沖の島・鵜来島など、黒潮ダイビングと秘境集落が魅力の高知県離島ガイド。' },
  { slug: 'kanagawa', name: '神奈川県', shortName: '神奈川', area: '関東', hubAccess: '片瀬江ノ島駅・三笠桟橋（横須賀）・三崎港', leadText: '首都圏から電車・徒歩や10分の船旅で渡れる江の島・猿島・城ヶ島など、週末の日帰りお出かけに最適な神奈川県の島一覧。' },
  { slug: 'niigata', name: '新潟県', shortName: '新潟', area: '北陸・日本海', hubAccess: '新潟港・直江津港・岩船港', leadText: '世界文化遺産「佐渡島の金山」とたらい舟で知られる日本海最大の離島・佐渡島と、満天の星空とわっぱ煮の粟島（粟島浦村）の完全ガイド。' },
  { slug: 'ishikawa', name: '石川県', shortName: '石川', area: '北陸', hubAccess: '輪島港・ツインブリッジのと・能登島大橋', leadText: '野生のミナミハンドウイルカが暮らす七尾湾の能登島と、輪島沖約50kmの日本海に浮かぶ海女漁と渡り鳥の楽園・舳倉島の離島ガイド。' },
  { slug: 'shiga', name: '滋賀県', shortName: '滋賀', area: '関西・琵琶湖', hubAccess: '堀切港（近江八幡）・今津港・長浜港', leadText: '日本最大の湖・琵琶湖に浮かぶ「日本で唯一の淡水湖の有人島」沖島や、パワースポットとして名高い竹生島など独自の湖島文化を紹介。' },
  { slug: 'wakayama', name: '和歌山県', shortName: '和歌山', area: '関西', hubAccess: '加太港・串本（くしもと大橋）', leadText: 'ラピュタの世界観のような砲台跡が残る無人の友ヶ島（沖ノ島）や、本州最南端の潮岬と橋で結ばれる紀伊大島など和歌山の島旅ガイド。' },
  { slug: 'miyazaki', name: '宮崎県', shortName: '宮崎', area: '九州', hubAccess: '目井津港（日南）・島野浦港（延岡）・青島（弥生橋）', leadText: '鬼の洗濯板に囲まれた亜熱帯植物の島・青島や、サンゴ群落と漁業の島・島野浦島、野生サルが暮らす幸島など日向灘の離島一覧。' },
  { slug: 'yamagata', name: '山形県', shortName: '山形', area: '東北・日本海', hubAccess: '酒田港（定期船とびしま）', leadText: '鳥海山の恵みとウミネコ繁殖地・天然記念物のタブノキ林が広がる山形県唯一の有人離島「飛島」への行き方・宿泊・設備ガイド。' },
  { slug: 'shizuoka', name: '静岡県', shortName: '静岡', area: '東海・伊豆', hubAccess: '熱海港（高速船約30分）・沼津・堂ヶ島・弁天島', leadText: '首都圏から最も近いリゾートアイランド「初島」をはじめ、専用船で渡る駿河湾の淡島、トンボロ現象で歩いて渡れる西伊豆・三四郎島、浜名湖の弁天島まで静岡県の観光島ガイド。' },
  { slug: 'chiba', name: '千葉県', shortName: '千葉', area: '関東・房総', hubAccess: '太海（鴨川市・手漕ぎ渡し舟）・館山湾', leadText: '千葉県唯一の有人観光島で二丁櫓の渡し舟で渡る名勝「仁右衛門島」や、砂州で歩いて渡れるシュノーケリングの名所「館山・沖ノ島」など房総半島の離島ガイド。' },
  { slug: 'fukui', name: '福井県', shortName: '福井', area: '北陸・若狭湾', hubAccess: '東尋坊・三国・敦賀色ヶ浜渡船', leadText: '東尋坊沖に浮かび朱塗りの橋で渡る神秘の島「雄島」や、「北陸のハワイ」と称される透明度の高い無人ビーチ島「水島」など福井県の観光島ガイド。' },
  { slug: 'aomori', name: '青森県', shortName: '青森', area: '東北', hubAccess: 'JR鮫駅（八戸市）', leadText: '国の天然記念物・ウミネコ繁殖地として約3万〜4万羽が飛来する八戸市の神聖な観光島「蕪島」へのアクセス・散策ガイド。' },
  { slug: 'iwate', name: '岩手県', shortName: '岩手', area: '東北・三陸', hubAccess: '大槌・山田湾・陸前高田沿岸', leadText: '三陸復興国立公園のリアス海岸に浮かぶ景勝島・椿島をはじめとする岩手県沿岸の島々をご案内します。' },
];

function cleanPrimaryIslandName(rawName?: string): string {
  if (!rawName) return '';
  const withoutParens = String(rawName).replace(/（.*?）|\(.*?\)/g, '').trim();
  if (withoutParens.includes('・')) {
    const parts = withoutParens.split('・').map((s) => s.trim()).filter(Boolean);
    const nonGroup = parts.find((p) => !p.endsWith('諸島') && !p.endsWith('列島') && !p.endsWith('群島') && !p.endsWith('湾'));
    return nonGroup || parts[parts.length - 1];
  }
  return withoutParens;
}

export function getPrefectureBySlug(slug: string): PrefectureSeoEntry | undefined {
  return PREFECTURE_SEO_LIST.find((p) => p.slug === slug);
}

export function getPrefectureByName(name?: string): PrefectureSeoEntry | undefined {
  if (!name) return undefined;
  return PREFECTURE_SEO_LIST.find((p) => p.name === name || name.includes(p.shortName));
}

export interface FeatureSeoEntry {
  slug: string;
  title: string;
  shortLabel: string;
  description: string;
  leadText: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matcher: (island: any) => boolean;
}

export const FEATURE_SEO_LIST: FeatureSeoEntry[] = [
  {
    slug: 'okinawa-daytrip',
    title: '那覇・沖縄本島から日帰りで行ける離島おすすめ一覧【高速船・橋アクセス比較】',
    shortLabel: '沖縄・日帰り離島',
    description: '那覇（泊港・三重城港）や沖縄本島から日帰りで行ける離島を徹底比較！慶良間諸島（渡嘉敷島・座間味島・阿嘉島・ナガンヌ島）、水納島、津堅島、久高島、伊江島、瀬長島、古宇利島など所要時間と特徴を網羅。',
    leadText: '沖縄旅行に1日プラスするだけで体験できる「沖縄本島から日帰りで行ける離島」を厳選。那覇・泊港から高速船で20〜50分のケラマブルーの島々や、本島からフェリー15分の透明ビーチ島、レンタカーで橋を渡って行ける絶景島まで一覧で比較できます。',
    matcher: (i) =>
      i.prefecture === '沖縄県' &&
      i.is_conquest_target !== false &&
      i.is_published !== false &&
      (['okinawa_main', 'kerama', 'kume'].includes(i.region_id) &&
        (i.day_trip !== false || /橋|海中道路|15分|20分|30分|35分|50分/.test(String(i.access || '') + String(i.description || '')))),
  },
  {
    slug: 'bridge-islands',
    title: '橋・海中道路で車で行ける日本の離島一覧【レンタカー＆ドライブ旅】',
    shortLabel: '橋で渡れる離島',
    description: 'フェリー欠航の心配なし！車・レンタカーや徒歩で橋・海中道路を渡って上陸できる日本全国の離島一覧。古宇利島・瀬長島・宮古諸島（伊良部大橋・来間島・池間島）・角島・しまなみ海道・淡路島・江の島など網羅。',
    leadText: '船酔いやフェリー欠航の心配がなく、レンタカーやドライブ・徒歩でそのまま渡れる「橋・海中道路でつながる離島」を全国から集めました。初めての離島旅や小さなお子様連れの家族旅行にも最適です。',
    matcher: (i) =>
      i.is_conquest_target !== false &&
      i.is_published !== false &&
      /橋|海中道路|連絡橋|海道|直結/.test(String(i.access || '') + String(i.description || '')),
  },
  {
    slug: 'daytrip',
    title: '本土から日帰りで行ける離島おすすめ一覧【関東・関西・東海・九州・沖縄】',
    shortLabel: '全国の日帰り離島',
    description: '週末にふらっと船旅へ！東京・神奈川・愛知・関西・瀬戸内・福岡・沖縄から片道1時間以内で日帰り観光できる日本の人気離島をエリア別に紹介。',
    leadText: '宿泊なしでも非日常の島時間を楽しめる、本土・主要港から短時間のフェリーや高速船でアクセスできる日帰り離島を厳選しました。',
    matcher: (i) =>
      i.is_conquest_target !== false &&
      i.is_published !== false &&
      (['江の島', '猿島', '初島', '友ヶ島', '日間賀島', '佐久島', '篠島', '能古島', '相島', '水納島', '伊江島', '久高島', '津堅島', '直島', '女木島', '男木島', '厳島', '大久野島', '田代島', '竹富島'].some(
        (n) => String(i.name || '').includes(n)
      ) || i.day_trip === true),
  },
  {
    slug: 'transparency',
    title: '海の透明度が高い日本の絶景離島ランキング・おすすめ一覧【シュノーケル＆ダイビング】',
    shortLabel: '海の透明度・絶景ビーチ',
    description: '世界屈指のケラマブルー・ミヤコブルー・八重山ブルーから高知・柏島、伊豆諸島・神津島まで、ウミガメやサンゴ礁と泳げる海の透明度抜群の離島を厳選。',
    leadText: '国立公園指定海域や世界的なダイビング・シュノーケリングスポットとして実証された、息をのむ透明度を誇る日本の絶景ビーチ離島です。',
    matcher: (i) =>
      i.is_conquest_target !== false &&
      i.is_published !== false &&
      ['座間味島', '阿嘉島', '渡嘉敷島', '宮古島', '伊良部島', '下地島', '池間島', '来間島', 'ユニの浜', 'バラス島', '浜島', '波照間島', '水納島', 'ハテの浜', '与論島', '柏島', '神津島', '式根島', '父島', '南島'].includes(
        cleanPrimaryIslandName(i.name)
      ),
  },
  {
    slug: 'stars',
    title: '満天の星空・天の川が見える日本の離島特集【国際星空保護区＆南十字星】',
    shortLabel: '満天の星空・保護区',
    description: '国際ダークスカイ協会「星空保護区」認定の西表石垣国立公園・神津島や、南十字星が輝く波照間島・小笠原など、街灯のない絶海の夜空を楽しめる離島一覧。',
    leadText: '周囲を海に囲まれ光害が極めて少ない離島は、日本最高峰の天然プラネタリウム。国際星空保護区や南十字星観測地として名高い島々を紹介します。',
    matcher: (i) => {
      if (i.is_conquest_target === false || i.is_published === false) return false;
      const cn = cleanPrimaryIslandName(i.name);
      if (cn === '黒島') return i.prefecture === '沖縄県';
      if (cn === '粟島') return i.prefecture === '新潟県';
      return ['波照間島', '神津島', '石垣島', '西表島', '竹富島', '小浜島', '青ヶ島', '父島', '母島', '与那国島'].includes(cn);
    },
  },
  {
    slug: 'retreat',
    title: '女子旅・ひとり旅におすすめの離島一覧【アート・島カフェ・癒やしリトリート】',
    shortLabel: '女子旅・ひとり旅',
    description: '現代アートの聖地・直島や豊島、オリーブ香る小豆島、赤瓦の竹富島、おしゃれカフェが集まる瀬長島・古宇利島など、治安が良く一人旅や女子旅に人気の離島特集。',
    leadText: 'レンタサイクルで巡れるコンパクトな島や、洗練された美術館・海辺カフェ・リゾートホテルが整った、ひとり旅＆女子旅に安心の離島を厳選しました。',
    matcher: (i) =>
      i.is_conquest_target !== false &&
      ['直島', '豊島', '小豆島', '古宇利島', '瀬長島', '瀬底島', '生口島', '竹富島', '与論島', '佐久島', '初島'].some((n) =>
        String(i.name || '').includes(n)
      ),
  },
  {
    slug: 'family',
    title: '子連れ・家族旅行におすすめの離島一覧【安全な遠浅ビーチ＆自然体験】',
    shortLabel: '子連れ・家族旅行',
    description: '病院や売店などの島内設備が整い、波の穏やかなビーチやイルカ・動物ふれあい体験が充実している、小さなお子様連れのファミリー旅行に安心な離島一覧。',
    leadText: '島内の医療・買い物インフラが安定しており、飛行機直行便や大型フェリー・橋で無理なくアクセスできるファミリー向け人気離島です。',
    matcher: (i) =>
      i.is_conquest_target !== false &&
      ['石垣島', '宮古島', '淡路島', '伊豆大島', '佐渡島', '小豆島', '初島', '能登島', '大久野島', 'マリン', '日間賀島'].some((n) =>
        String(i.name || '').includes(n)
      ),
  },
  {
    slug: 'onsen-sauna',
    title: '絶景の海中温泉・野湯・サウナがある日本の離島一覧',
    shortLabel: '秘湯・海中温泉・サウナ',
    description: '干潮時だけ現れる屋久島・式根島・硫黄島の海中温泉や、火山の地熱サウナで知られる青ヶ島、八丈島など温泉好き必見の離島ガイド。',
    leadText: '波打ち際の岩場から湧き出す絶景の露天・海中温泉や、火山島ならではの天然地熱釜・サウナを体験できる個性派アイランド集。',
    matcher: (i) =>
      i.is_conquest_target !== false &&
      ['式根島', '屋久島', '硫黄島', '八丈島', '青ヶ島', '直島', '伊豆大島', '新島'].some((n) =>
        String(i.name || '').includes(n)
      ),
  },
  {
    slug: 'remote',
    title: '一度は行きたい日本の秘境島・絶海の孤島一覧【上陸難易度MAX】',
    shortLabel: '秘境島・絶海の孤島',
    description: '二重カルデラの青ヶ島、クレーン上陸で知られる南大東島・北大東島、フェリー週2便のトカラ列島（悪石島・宝島）、おがさわら丸24時間の小笠原など冒険心をくすぐる秘境離島。',
    leadText: '定期船の就航率や長い航海時間を乗り越えた旅人だけが辿り着ける、日本の誇る絶海の秘境離島リストです。上陸後の公式到達証明書の価値もひとしおです。',
    matcher: (i) =>
      i.is_conquest_target !== false &&
      ['青ヶ島', '南大東島', '北大東島', '悪石島', '宝島', '口之島', '中之島', '諏訪之瀬島', '与那国島', '波照間島', '母島', '父島', '渡名喜島', '粟国島', '舳倉島', '飛島'].some((n) =>
        String(i.name || '').includes(n)
      ),
  },
  {
    slug: 'nature',
    title: '世界自然遺産・野生のイルカやクジラに出会える日本の離島特集',
    shortLabel: '世界遺産・野生動物',
    description: '屋久島・奄美大島・徳之島・西表島・小笠原諸島のユネスコ世界自然遺産5エリアや、野生イルカと泳げる御蔵島・利島、ザトウクジラが集う座間味島など大自然の離島一覧。',
    leadText: '独自の生態系を育む「東洋のガラパゴス」や原生林・マングローブ・ホエールウォッチングの聖地を網羅しました。',
    matcher: (i) =>
      i.is_conquest_target !== false &&
      ['西表島', '屋久島', '父島', '母島', '奄美大島', '徳之島', '御蔵島', '利島', '座間味島', '天売島'].some((n) =>
        String(i.name || '').includes(n)
      ),
  },
  {
    slug: 'gourmet',
    title: '海鮮・島グルメが美味しい日本の美食離島おすすめ一覧',
    shortLabel: '島グルメ・海鮮美食',
    description: '利尻・礼文の極上エゾバフンウニ、日間賀島のタコとフグ、壱岐牛とウニめし、淡路島の玉ねぎと鱧、奥武島の沖縄天ぷらなど島ならではの絶品グルメ旅ガイド。',
    leadText: 'その島に渡らなければ味わえない獲れたてのウニ・伊勢海老・ブランド島牛・伝統郷土料理が自慢の美食アイランドを厳選しました。',
    matcher: (i) =>
      i.is_conquest_target !== false &&
      ['淡路島', '小豆島', '壱岐島', '福江島', '利尻島', '礼文島', '佐渡島', '日間賀島', '篠島', '答志島', '姫島', '奥武島'].some((n) =>
        String(i.name || '').includes(n)
      ),
  },
];

export function getFeatureBySlug(slug: string): FeatureSeoEntry | undefined {
  return FEATURE_SEO_LIST.find((f) => f.slug === slug);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getConquestIslandsForPrefecture(prefName: string): any[] {
  return Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter(
    (i) => i.prefecture === prefName && i.is_conquest_target !== false && i.is_published !== false
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getConquestIslandsForFeature(feature: FeatureSeoEntry): any[] {
  return Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter(feature.matcher);
}
