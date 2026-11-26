import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { getIslandInfrastructure } from '@/lib/islandInfrastructure';
import { getIslandDifficulty } from '@/lib/difficulty';
import { getFerryInfoForIsland, REGION_FERRY_MAP } from '@/lib/ferryRoutes';

export interface DayTripBadge {
  label: string;
  tone: 'emerald' | 'amber' | 'rose';
  detail: string;
}

export interface IslandSeoFaq {
  question: string;
  answer: string;
}

export interface IslandAccessSpecs {
  departureHub: string;
  accessMethod: string;
  durationEstimate: string;
  roundTripBudget: string;
  dayTripBadge: DayTripBadge;
  recommendedStay: string;
  islandMobility: string;
  bestSeason: string;
  seoFaqs: IslandSeoFaq[];
}

// 全45諸島（region_id）別の出発港・玄関口マスター
const REGION_DEPARTURE_HUB_MAP: Record<string, string> = {
  pseudo_hokkaido: '稚内港フェリーターミナル・羽幌港・江差港 / 新千歳・丘珠空港',
  pseudo_sanriku: '気仙沼・大槌・山田湾・八戸沿岸各港（三陸海岸）',
  oshika: '石巻港（中央・門脇発着所）・女川港・マリンゲート塩釜（宮城県）',
  izu: '東京・竹芝客船ターミナル / 調布飛行場・羽田空港 / 熱海港・下田港',
  ogasawara: '東京・竹芝客船ターミナル（小笠原海運「おがさわら丸」）',
  pseudo_kanto: '横須賀・三笠桟橋 / 片瀬江ノ島・三崎港 / 熱海港 / 鴨川・館山沿岸',
  pseudo_hokuriku: '新潟港・直江津港・岩船港 / 七尾（能登島大橋）・輪島港 / 敦賀・三国沿岸',
  pseudo_biwako: '堀切港（近江八幡）・長浜港・今津港・彦根港（滋賀県・琵琶湖）',
  aichi_santo: '河和港・師崎港・一色港（愛知県） / 鳥羽マリンターミナル・賢島港（三重県）',
  pseudo_awaji: '神戸（明石海峡大橋・明石港）・鳴門・土生港 / 加太港・串本（関西圏）',
  ieshima: '姫路港（飾磨埠頭・兵庫県姫路市）',
  kasaoka: '笠岡港（住吉・伏越）・宇野港・日生港・牛窓港 / 丸亀港・高松港',
  kamijima: '尾道港・三原港・忠海港・竹原港・今治港・しまなみ海道（広島・愛媛）',
  suo_oshima: '広島港（宇品）・呉港・宮島口桟橋 / 柳井港・徳山港・大島大橋（広島・山口）',
  hagi: '萩港・仙崎港・下関（唐戸・特牛港・角島大橋）（山口県）',
  oki: '七類港（松江）・境港（鳥取） / 出雲空港・伊丹空港（隠岐世界ジオパーク空港便）',
  pseudo_san_in: '松江・境港エリア（江島大橋・中海沿岸）',
  naoshima: '高松港・宇野港・新岡山港・姫路港・神戸港',
  shiwaku: '丸亀港・多度津港・高松港・児島観光港（香川県・岡山県）',
  kutsuna: '松山観光港・三津浜港・高浜港（愛媛県松山市）',
  uwakai: '宇和島港（新内港）・八幡浜港（愛媛県南予エリア）',
  pseudo_tokushima: '牟岐港・答島港（阿南）・浅川港・鳴門エリア（徳島県）',
  pseudo_tosa: '宿毛片島港・柏島大橋・須崎沿岸（高知県）',
  tsushima: '博多埠頭・福岡空港・長崎空港（対馬やまねこ空港直行便）',
  iki: '博多埠頭（ベイサイドプレイス）・唐津東港・長崎空港（壱岐空港便）',
  goto: '長崎港（大波止ターミナル）・佐世保港・博多埠頭 / 福岡・長崎空港（五島福江便）',
  hirado: '平戸港・薄香港・生月大橋・前津吉港・伊万里湾各港（長崎・佐賀）',
  pseudo_saikai: '佐世保港（鯨瀬ターミナル）・相浦港・西海市瀬戸港（長崎県）',
  chikuzen: '姪浜旅客待合所・博多埠頭ベイサイドプレイス（福岡市）',
  genkai: '博多埠頭・新宮漁港・神湊港（宗像）・小倉浅野桟橋・唐津東港・呼子港',
  bungo: '佐伯港（葛港）・津久見港・伊美港（国東）・別府・大分エリア（大分県）',
  minami_naka: '宮崎・青島（弥生橋）・延岡島野浦港・日南目井津港（宮崎県）',
  amakusa: '三角港・本渡港・鬼池港・牛深港・棚底港・天草五橋（熊本県）',
  pseudo_nagashima: '蔵之元港・黒之瀬戸大橋（阿久根・出水）・水俣港（鹿児島・熊本）',
  koshiki: '川内港ターミナル（高速船）・串木野新港（フェリー）（鹿児島県）',
  osumi: '鹿児島本港（南埠頭：高速船トッピー＆ロケット・フェリー）・鹿児島空港',
  pseudo_satsuma: '鹿児島港（桜島フェリーターミナル）・指宿・南さつま沿岸（鹿児島県）',
  tokara: '鹿児島本港（南埠頭）・奄美大島名瀬港（十島村営「フェリーとしま2」）',
  amami: '羽田・伊丹・福岡・鹿児島・那覇空港（奄美群島各空港） / 鹿児島新港・那覇港',
  okinawa_main: '那覇泊港（とまりん）・本部港・運天港・安座真港・平敷屋港 / 那覇空港より連絡橋',
  kerama: '那覇泊港（とまりん・那覇空港から車・ゆいレール約15〜20分）',
  kume: '那覇空港（JTA/RAC直行便）・那覇泊港（とまりん）',
  daito: '那覇空港（RAC直行便）・那覇港（泊ふ頭・新港ふ頭：大東海運）',
  miyako: '宮古空港・みやこ下地島空港（羽田・関西・中部・福岡・那覇直行便） / 平良港',
  yaeyama: '石垣港離島ターミナル（南ぬ島石垣空港から直行バス・車で約30分）',
};

// 全34都道府県別のフォールバック出発港マスター
const PREFECTURE_DEPARTURE_HUB_MAP: Record<string, string> = {
  北海道: '稚内港・羽幌港・江差港・厚岸港 / 新千歳空港・丘珠空港・函館空港',
  青森県: 'JR八戸線 鮫駅・八戸港・青森沿岸（青森県）',
  岩手県: '宮古・山田湾・大槌・大船渡沿岸（岩手県三陸エリア）',
  宮城県: 'マリンゲート塩釜・石巻港・女川港・気仙沼大島大橋（宮城県）',
  山形県: '酒田港 定期船発着所（山形県酒田市）',
  東京都: '東京・竹芝客船ターミナル / 調布飛行場・羽田空港',
  神奈川県: '横須賀・三笠桟橋 / 片瀬江ノ島駅 / 三崎港・城ヶ島大橋（神奈川県）',
  千葉県: '鴨川市・太海浜渡船場 / 館山湾沿岸（千葉県南房総エリア）',
  新潟県: '新潟港（万代島）・直江津港・岩船港（新潟県）',
  石川県: '七尾市（能登島大橋・ツインブリッジのと）・輪島港（石川県）',
  福井県: '坂井市三国（東尋坊・雄島橋）・敦賀市色ヶ浜渡船場（福井県）',
  静岡県: '熱海港・伊東港・沼津内浦・西伊豆堂ヶ島・浜名湖弁天島（静岡県）',
  愛知県: '河和港・師崎港・一色港・蒲郡海岸（愛知県三河湾エリア）',
  三重県: '鳥羽マリンターミナル・賢島港・和具港（三重県伊勢志摩エリア）',
  滋賀県: '堀切港（近江八幡）・長浜港・今津港・彦根港（滋賀県琵琶湖）',
  京都府: '舞鶴港・宮津・天橋立周辺沿岸（京都府丹後エリア）',
  兵庫県: '明石港・神戸三宮・姫路港（飾磨埠頭）・土生港（兵庫県）',
  和歌山県: '和歌山市・加太港 / 串本町・くしもと大橋 / 紀伊勝浦港（和歌山県）',
  島根県: '七類港（松江）・境港 / 出雲空港・隠岐空港（島根県）',
  岡山県: '宇野港・新岡山港・笠岡港・日生港・牛窓港・児島観光港（岡山県）',
  広島県: '広島港（宇品）・呉港・尾道港・三原港・忠海港・宮島口桟橋（広島県）',
  山口県: '柳井港・徳山港・防府三田尻港・萩港・仙崎港・下関港（山口県）',
  徳島県: '牟岐港・阿南答島港・鳴門エリア（徳島県）',
  香川県: '高松港・丸亀港・多度津港・観音寺港（香川県）',
  愛媛県: '松山観光港・三津浜港・今治港・宇和島港・八幡浜港（愛媛県）',
  高知県: '宿毛片島港・大月町柏島大橋・須崎沿岸（高知県）',
  福岡県: '博多埠頭（ベイサイドプレイス）・姪浜渡船場・新宮漁港・神湊港・小倉港（福岡県）',
  佐賀県: '唐津東港（宝当桟橋）・呼子港・星賀港（佐賀県）',
  長崎県: '長崎港（大波止）・佐世保港・平戸港・博多埠頭 / 長崎空港・福岡空港（長崎県）',
  熊本県: '三角港・本渡港・牛深港・水俣港・天草五橋（熊本県）',
  大分県: '佐伯港・津久見港・伊美港（国東）・佐賀関港・別府エリア（大分県）',
  宮崎県: '宮崎市青島・延岡市島野浦港・日南市目井津港（宮崎県）',
  鹿児島県: '鹿児島本港（北・南埠頭）・鹿児島新港・川内港 / 鹿児島空港（鹿児島県）',
  沖縄県: '那覇空港・那覇泊港（とまりん）・石垣港離島ターミナル・宮古空港（沖縄県）',
};

type BridgeKind = 'none' | 'mainland_direct' | 'miyako_bridge' | 'remote_inter_island';

function detectBridgeKind(island: any): BridgeKind {
  const name = String(island?.name || '');
  const reg = String(island?.region_id || '');
  const rawAccess = String(island?.access || '');
  const rawDesc = String(island?.description || '');

  // 渡船のみの島で「橋」の誤検知を防ぐ除外リスト
  if (
    name.includes('渡鹿野島') ||
    name.includes('間崎島') ||
    name.includes('浮島（山口県') ||
    name.includes('由布島')
  ) {
    return 'none';
  }

  // 「桟橋」「天の橋立」「橋経由・短時間連絡船」等の非架橋ワードを除外
  const cleaned = `${rawAccess} ${rawDesc}`
    .replace(/桟橋/g, '')
    .replace(/天の?橋立/g, '')
    .replace(/橋経由・短時間連絡船/g, '');

  if (
    /おがさわら丸|ははじま丸|渡船で約|船で約\d+分|遊覧船で上陸|連絡船で約/.test(rawAccess) &&
    !/大橋|歩道橋|橋を渡って|橋で本土|橋で本島|橋で結ばれ|陸路・橋|海中道路|砂州で陸続き/.test(cleaned)
  ) {
    return 'none';
  }

  const hasBridgeSignal = /橋|海中道路|直結|陸続き|徒歩で渡/.test(cleaned);
  if (!hasBridgeSignal) return 'none';

  // 宮古島から架橋されている島々（宮古島までは飛行機が必要）
  if (reg === 'miyako' && !name.includes('宮古島')) {
    return 'miyako_bridge';
  }

  // 遠隔諸島内で親島・隣接島と橋で結ばれている島々（親島までは船・飛行機が必要）
  const remoteInterIslandRegions = new Set(['tsushima', 'iki', 'goto', 'koshiki', 'kerama', 'amami', 'oki']);
  if (
    remoteInterIslandRegions.has(reg) ||
    name.includes('野甫島') ||
    name.includes('牧島（熊本県御所浦') ||
    name.includes('猪子島')
  ) {
    return 'remote_inter_island';
  }

  return 'mainland_direct';
}

function resolveSpecificDepartureHub(island: any, bridgeKind: BridgeKind): string {
  const id = String(island?.id || '');
  const name = String(island?.name || '');
  const reg = String(island?.region_id || '');
  const pref = String(island?.prefecture || '');

  if (id === '1' || id === '2' || name.includes('礼文') || name.includes('利尻')) {
    return '稚内港フェリーターミナル / 新千歳・丘珠空港（利尻空港直行便）';
  }
  if (id === '3' || id === '4' || name.includes('天売') || name.includes('焼尻')) {
    return '羽幌港フェリーターミナル（北海道苫前郡羽幌町）';
  }
  if (id === '5' || name.includes('奥尻')) {
    return '江差港・せたな港フェリーターミナル / 函館空港';
  }
  if (id === '56' || name === '八丈島') {
    return '羽田空港（ANA直行便 1日3便） / 東京・竹芝客船ターミナル（橘丸）';
  }
  if (id === '58' || name.includes('青ヶ島')) {
    return '八丈島空港・八丈島底土港（羽田空港または東京・竹芝桟橋より八丈島乗継）';
  }
  if (id === '63' || name.includes('父島') || name.includes('南島')) {
    return '東京・竹芝客船ターミナル（小笠原海運「おがさわら丸」）';
  }
  if (id === '64' || name.includes('母島')) {
    return '父島・二見港（東京・竹芝客船ターミナルより「おがさわら丸」乗継）';
  }
  if (id === '74' || name === '猿島') {
    return '横須賀・三笠桟橋（京急横須賀中央駅より徒歩約15分）';
  }
  if (name === '初島') {
    return '熱海港（JR熱海駅よりバス約15分）';
  }
  if (id === '76' || name.includes('佐渡')) {
    return '新潟港（万代島ターミナル）・直江津港（佐渡汽船）';
  }
  if (name.includes('粟島') && pref === '新潟県') {
    return '岩船港（新潟県村上市・粟島汽船）';
  }
  if (name.includes('飛島') && pref === '山形県') {
    return '酒田港 定期船「とびしま」発着所（山形県酒田市）';
  }
  if (name.includes('舳倉島')) {
    return '輪島港（石川県輪島市・へぐら航路）';
  }
  if (id === '340' || name.includes('屋久島') || id === '339' || name.includes('種子島')) {
    return '鹿児島本港（南埠頭）・鹿児島空港 / 伊丹・福岡空港（直行便）';
  }
  if (id === '386' || name === '宮古島') {
    return '羽田・成田・関西・中部・福岡・那覇空港（宮古空港・みやこ下地島空港直行便）';
  }
  if (reg === 'miyako') {
    return bridgeKind === 'miyako_bridge'
      ? '宮古空港・みやこ下地島空港（連絡大橋経由でレンタカー・バス直結）'
      : '宮古島・平良港 / 宮古空港（RAC多良間便・マリンツアー船）';
  }
  if (id === '392' || name === '石垣島') {
    return '羽田・成田・関西・中部・福岡・那覇空港（南ぬ島石垣空港直行便）';
  }
  if (id === '401' || name.includes('与那国')) {
    return '那覇空港・南ぬ島石垣空港（RAC直行便） / 石垣港（フェリーよなぐに）';
  }
  if (name.includes('由布島')) {
    return '石垣港離島ターミナル → 西表島大原港 → 美原「水牛車乗場」';
  }
  if (reg === 'okinawa_main') {
    if (bridgeKind === 'mainland_direct') {
      return '那覇空港より沖縄自動車道・本島幹線道路＆連絡大橋で車直結';
    }
    if (name.includes('伊江島') || name.includes('水納島')) {
      return '沖縄本島北部・本部港 / 渡久地港（那覇空港より車・やんばる急行バス約90分）';
    }
    if (name.includes('伊平屋') || name.includes('伊是名') || name.includes('野甫')) {
      return '沖縄本島北部・運天港（今帰仁村・那覇空港より車約1時間40分）';
    }
    if (name.includes('久高島')) {
      return '沖縄本島南部・安座真港（南城市・那覇空港より車約45分）';
    }
    if (name.includes('津堅島')) {
      return '沖縄本島中部・平敷屋港（うるま市・那覇空港より車約60分）';
    }
    return '那覇泊港（とまりん）・沖縄本島各港';
  }
  if (reg === 'kume' && !name.includes('久米島')) {
    return '久米島・泊フィッシャリーナ（那覇空港・那覇泊港より久米島経由）';
  }

  if (reg === 'aichi_santo' && pref === '三重県') {
    return '鳥羽マリンターミナル・賢島港・和具港（三重県鳥羽市・志摩市）';
  }
  if (reg === 'aichi_santo' && pref === '愛知県') {
    return '河和港・師崎港・一色港・伊良湖港（愛知県知多半島・西尾市）';
  }
  if (reg === 'kasaoka' && pref === '岡山県') {
    return '笠岡港（住吉・伏越）・宇野港・日生港・牛窓港（岡山県）';
  }
  if (reg === 'kasaoka' && pref === '香川県') {
    return '丸亀港・多度津港・高松港・観音寺港（香川県）';
  }
  if (reg === 'suo_oshima' && pref === '山口県') {
    return '柳井港・徳山港・大島大橋・笠戸大橋（山口県瀬戸内沿岸）';
  }
  if (reg === 'suo_oshima' && pref === '広島県') {
    return '広島港（宇品）・呉港・宮島口桟橋・音戸大橋（広島県）';
  }

  if (reg && REGION_DEPARTURE_HUB_MAP[reg]) {
    return REGION_DEPARTURE_HUB_MAP[reg];
  }
  if (pref && PREFECTURE_DEPARTURE_HUB_MAP[pref]) {
    return PREFECTURE_DEPARTURE_HUB_MAP[pref];
  }

  const ferryList = getFerryInfoForIsland(id, reg, pref);
  if (ferryList.length > 0 && ferryList[0].mainPorts && !REGION_FERRY_MAP[reg]) {
    return ferryList[0].mainPorts;
  }

  return '最寄り沿岸主要港・定期船ターミナル';
}

function resolveDurationEstimate(island: any, bridgeKind: BridgeKind, difficultyLevel: number): string {
  const id = String(island?.id || '');
  const name = String(island?.name || '');
  const reg = String(island?.region_id || '');
  const access = String(island?.access || '');

  if (island?.is_conquest_target === false || difficultyLevel === 0) {
    return '一般旅客便なし（上陸制限エリア）';
  }

  if (id === '393' || name === '竹富島') return '石垣港から高速船で約10〜15分（15〜30分間隔で高頻度運航）';
  if (name === '小浜島' || (name.includes('黒島') && reg === 'yaeyama')) return '石垣港から高速船で約25〜30分';
  if (id === '396' || name === '西表島') return '石垣港から高速船で大原港へ約40分・上原港へ約45〜50分';
  if (name.includes('波照間')) return '石垣港から高速船で約60〜80分（貨客フェリーは約2時間）';
  if (id === '392' || name === '石垣島') return '羽田から直行便で約3時間15分 / 関西約2時間40分 / 那覇約1時間';
  if (id === '386' || name === '宮古島') return '羽田から直行便で約3時間 / 関西約2時間30分 / 那覇約50分';
  if (id === '401' || name.includes('与那国')) return '那覇空港から飛行機で約1時間20分 / 石垣空港から約30分（船は約4時間）';
  if (id === '376' || name.includes('座間味')) return '那覇泊港から高速船「クイーンざまみ」で約50分（フェリー約2時間）';
  if (id === '377' || name.includes('阿嘉島')) return '那覇泊港から高速船で約50〜70分（フェリー約1時間30分）';
  if (name.includes('渡嘉敷')) return '那覇泊港から高速船「マリンライナーとかしき」で約35分（フェリー約70分）';
  if (id === '375' || id === '380' || name === '久米島') return '那覇空港から飛行機で約35分（那覇泊港からフェリーで約3〜3.5時間）';
  if (id === '63' || name.includes('父島')) return '東京・竹芝桟橋から「おがさわら丸」で片道約24時間（週1便程度）';
  if (id === '64' || name.includes('母島')) return '竹芝から父島まで約24時間＋父島から「ははじま丸」で約2時間';
  if (id === '58' || name.includes('青ヶ島')) return '八丈島からヘリで約20分 / 定期船「あおがしま丸」で約2時間30分〜3時間';
  if (id === '56' || name === '八丈島') return '羽田空港から飛行機で約55分 / 東京・竹芝から夜行大型船で約10時間20分';
  if (id === '49' || name === '伊豆大島') return '東京・竹芝から高速ジェット船で約1時間45分 / 熱海港から約45分';
  if (id === '76' || name.includes('佐渡')) return '新潟港からジェットフォイルで約67分（カーフェリー約2時間30分）';
  if (id === '195' || name === '直島') return '高松港からフェリーで約50分（高速旅客船約30分） / 宇野港から約20分';
  if (id === '197' || name === '小豆島') return '高松港からフェリーで約60分（高速艇約35分） / 新岡山港から約70分';
  if (id === '340' || name.includes('屋久島')) return '鹿児島本港から高速船で約1時間50分〜2時間40分 / 鹿児島空港から飛行機約35分';
  if (id === '352' || name === '奄美大島') return '羽田から直行便で約2時間20分 / 伊丹約1時間45分 / 鹿児島約50分';
  if (id === '1' || id === '2' || name.includes('礼文') || name.includes('利尻')) {
    return '稚内港からフェリーで約1時間40分〜1時間55分（利尻空港へは新千歳・丘珠から約50〜55分）';
  }

  const explicitTimeMatch = access.match(/(?:片道)?(?:約)?\d+(?:\.\d+)?(?:〜\d+)?(?:時間(?:\d+分)?|分)/);
  if (explicitTimeMatch && !access.includes('沿岸各港より')) {
    return access;
  }

  if (bridgeKind === 'mainland_direct') {
    return reg === 'okinawa_main'
      ? '那覇空港からレンタカー・車で約35〜95分（連絡橋の通行は数分）'
      : '最寄り駅・ICから連絡橋を渡って車・バスで約10〜35分';
  }
  if (bridgeKind === 'miyako_bridge') {
    return '宮古空港・下地島空港から連絡大橋を渡って車で約15〜30分（宮古島までは直行航空便）';
  }
  if (bridgeKind === 'remote_inter_island') {
    return '拠点島まで船・航空機で移動後、島間連絡橋を渡って車・バスで約10〜25分';
  }

  if (difficultyLevel >= 5) return '出発港から大型定期船で約6〜24時間（航空便設定島は約1〜1.5時間）';
  if (difficultyLevel === 4) return '拠点港から外洋フェリー・高速船で約2〜5時間（または小型機・ヘリ約20〜60分）';
  if (difficultyLevel === 3) return '最寄り港から高速船・フェリーで約40分〜2時間30分（航空便は約35〜60分）';
  return '最寄り乗船港から定期船・渡船で約10〜40分';
}

export function getIslandAccessSpecs(island: any): IslandAccessSpecs {
  const idStr = String(island?.id || '');
  const master = idStr ? ALL_ISLANDS_MASTER_DICTIONARY[idStr] : undefined;
  const merged = {
    ...(master || {}),
    ...(island || {}),
  };

  const islandName = String(merged.name || 'この島');
  const pref = String(merged.prefecture || '');
  const reg = String(merged.region_id || '');
  const accessText = String(merged.access || '');
  const descText = String(merged.description || '');
  const areaKm2 = Number(merged.area) || 0;

  const infra = getIslandInfrastructure(merged);
  const difficulty = getIslandDifficulty(merged);
  const ferryList = getFerryInfoForIsland(idStr, reg, pref);
  const isRestricted = merged.is_conquest_target === false || difficulty.level === 0;
  const bridgeKind = detectBridgeKind(merged);
  const isTombolo = /トンボロ|干潮時.*歩|砂州.*歩/.test(`${accessText} ${descText}`);

  const departureHub = isRestricted
    ? '一般旅客の出発港なし（自衛隊管理・自然保護区等のため上陸不可）'
    : resolveSpecificDepartureHub(merged, bridgeKind);

  let accessMethod = '定期フェリー・高速船・旅客船';
  if (isRestricted) {
    accessMethod = '一般渡航不可（行政・防衛管理島または立入制限区域）';
  } else if (isTombolo) {
    accessMethod = '干潮時の砂州（トンボロ現象）を徒歩横断、または現地観光船';
  } else if (islandName.includes('由布島')) {
    accessMethod = '石垣港から高速船で西表島へ渡り、浅瀬を名物の水牛車で横断';
  } else if (bridgeKind === 'mainland_direct') {
    accessMethod = '大橋・道路で本土/本島と直結（マイカー・レンタカー・路線バスで通行可）';
  } else if (bridgeKind === 'miyako_bridge') {
    accessMethod = '宮古空港／下地島空港へ航空便＋連絡大橋（無料）をレンタカー等で通行';
  } else if (bridgeKind === 'remote_inter_island') {
    accessMethod = '拠点島まで定期船・航空便で渡航後、島間の連絡大橋を車・バス・自転車で通行';
  } else if (reg === 'ogasawara') {
    accessMethod = infra.is_uninhabited
      ? 'おがさわら丸で父島へ渡航後、現地公認ガイドボートツアーで上陸'
      : islandName.includes('母島')
        ? '大型客船「おがさわら丸」＋父島二見港から「ははじま丸」乗継'
        : '大型定期客船「おがさわら丸」（航空便なし・船旅のみ）';
  } else if (idStr === '58' || islandName.includes('青ヶ島')) {
    accessMethod = '八丈島から東京愛らんどシャトル（9人乗りヘリ）または定期船「あおがしま丸」';
  } else if (
    /空港|航空|飛行機|直行便|ヘリ/.test(accessText) ||
    ['392', '386', '375', '380', '401', '384', '385', '352', '356', '357', '358', '340', '339', '269', '275', '296', '56', '137', '2'].includes(idStr)
  ) {
    accessMethod = '直行航空便（飛行機）または定期フェリー・高速船';
  } else if (infra.is_uninhabited) {
    accessMethod = /定期|高速船|フェリー/.test(accessText)
      ? '季節運航の渡船・定期船、または現地発着マリンツアー船'
      : '現地マリンツアー船・観光渡船・海上タクシー（要事前予約・天候確認）';
  } else if (/高速船|ジェット|マリンライナー|クイーン/.test(accessText)) {
    accessMethod = '高速船（ジェット船）または定期フェリー';
  }

  const durationEstimate = resolveDurationEstimate(merged, bridgeKind, difficulty.level);

  let roundTripBudget = '乗船港からの往復船賃 目安 ¥1,500〜¥5,000前後';
  if (isRestricted) {
    roundTripBudget = '一般向け乗船券販売なし';
  } else if (bridgeKind === 'mainland_direct') {
    roundTripBudget =
      reg === 'kamijima' || reg === 'pseudo_awaji' || islandName.includes('与島')
        ? '高速・連絡橋通行料＋ガソリン・バス代（往復目安 ¥1,500〜¥6,500 / 自転車・徒歩は数百円〜）'
        : '連絡橋は通行無料（ガソリン代・路線バス代のみ 目安 ¥500〜¥2,500前後）';
  } else if (bridgeKind === 'miyako_bridge') {
    roundTripBudget = '連絡大橋は通行無料（宮古島までの往復航空券 目安 ¥20,000〜¥55,000＋レンタカー代）';
  } else if (reg === 'ogasawara') {
    roundTripBudget = 'おがさわら丸2等往復 目安 ¥58,000〜¥76,000前後（※燃料油価格変動調整金で変動）';
  } else if (difficulty.level >= 5) {
    roundTripBudget =
      reg === 'pseudo_hokkaido'
        ? '稚内発フェリー往復 約¥6,000〜¥7,500（道外からの航空券込目安 ¥35,000〜¥75,000）'
        : '拠点空港・港からの往復船賃/航空券 目安 ¥18,000〜¥48,000前後';
  } else if (
    ['392', '386', '352', '356', '357', '358', '340', '339', '56', '401', '375', '380'].includes(idStr)
  ) {
    roundTripBudget = '航空券または大型船・高速船 往復目安 ¥16,000〜¥55,000前後（早割・LCC利用で節約可）';
  } else if (infra.is_uninhabited) {
    roundTripBudget =
      reg === 'yaeyama' || reg === 'kerama' || reg === 'kume' || reg === 'miyako' || reg === 'okinawa_main'
        ? '現地発マリンツアー・上陸渡船 目安 ¥4,000〜¥13,000前後（※沖縄拠点までの航空券別途）'
        : '最寄り港からの往復渡船・ツアー代 目安 ¥1,500〜¥6,500前後';
  } else if (difficulty.level === 4) {
    roundTripBudget = '乗継船・高速船・コミューター便 往復目安 ¥8,500〜¥28,000前後';
  } else if (difficulty.level === 3) {
    roundTripBudget =
      pref === '沖縄県'
        ? '那覇・石垣等からの往復船賃 目安 ¥2,500〜¥8,500前後（※沖縄までの航空券別途）'
        : '出発港からの往復フェリー・高速船 目安 ¥4,500〜¥16,000前後';
  } else {
    roundTripBudget =
      pref === '沖縄県'
        ? '最寄り港からの往復船賃 目安 ¥1,200〜¥4,500前後（※沖縄までの航空券別途）'
        : '最寄り乗船港からの往復船賃 目安 ¥600〜¥3,800前後';
  }

  let dayTripBadge: DayTripBadge;
  if (isRestricted) {
    dayTripBadge = {
      label: '▲ 宿泊または複数日日程が必須（一般上陸制限島）',
      tone: 'rose',
      detail: '自衛隊管理区域や自然保護区などの理由により、一般旅行者の日帰り・宿泊上陸はできません。',
    };
  } else if (
    bridgeKind === 'mainland_direct' ||
    bridgeKind === 'miyako_bridge' ||
    (infra.is_uninhabited && reg !== 'ogasawara') ||
    (infra.day_trip === true && difficulty.level <= 2)
  ) {
    dayTripBadge = {
      label: '◎ 日帰り観光可能',
      tone: 'emerald',
      detail:
        infra.day_trip_desc ||
        '便数が安定しているか連絡橋・近距離渡船でアクセスできるため、半日〜日帰りでも十分に満喫できます。',
    };
  } else if (infra.day_trip === true) {
    dayTripBadge = {
      label: '◯ 1泊2日以上推奨（早朝便で日帰り可）',
      tone: 'amber',
      detail:
        infra.day_trip_desc ||
        '朝便・最終便を組み合わせれば日帰り観光も可能ですが、島の夕景・星空やゆとりある滞在には1泊以上が推奨されます。',
    };
  } else {
    dayTripBadge = {
      label: '▲ 宿泊または複数日日程が必須',
      tone: 'rose',
      detail:
        infra.day_trip_desc ||
        '船便・航空便が1日1便または隔日・週数便ダイヤのため日帰り往復は困難です。天候予備日を含めた宿泊計画を立てましょう。',
    };
  }

  let recommendedStay = '半日〜日帰り（3〜6時間）または1泊2日';
  if (isRestricted) {
    recommendedStay = '上陸不可（洋上・対岸からの遠望のみ）';
  } else if (reg === 'ogasawara') {
    recommendedStay = '5泊6日（船中2泊＋現地3〜4泊が基本サイクル）';
  } else if (infra.is_uninhabited) {
    recommendedStay = '約2〜5時間（半日マリンツアー・日帰り上陸滞在）';
  } else if (bridgeKind === 'mainland_direct' || bridgeKind === 'miyako_bridge') {
    recommendedStay =
      areaKm2 >= 20 ? '日帰りドライブ（5〜8時間）〜1泊2日' : '半日〜日帰り（2〜5時間）';
  } else if (difficulty.level >= 5) {
    recommendedStay = '2泊3日〜4泊5日（船便ダイヤ・天候予備日を含む）';
  } else if (difficulty.level === 4 || infra.day_trip !== true) {
    recommendedStay = '2泊3日〜3泊4日（欠航リスクに備えた余裕日程推奨）';
  } else if (difficulty.level === 3 || areaKm2 >= 15) {
    recommendedStay = '1泊2日〜2泊3日';
  }

  let islandMobility = '徒歩・レンタサイクルで散策可能';
  if (isRestricted) {
    islandMobility = '一般立入不可';
  } else if (infra.is_uninhabited) {
    islandMobility = '無人島のため徒歩のみ（マリンシューズ・飲料水・日除け装備必携）';
  } else if (bridgeKind === 'mainland_direct' || bridgeKind === 'miyako_bridge') {
    islandMobility =
      areaKm2 >= 8
        ? '拠点空港・本土側から乗り入れたレンタカー・マイカー推奨（バス・自転車も可）'
        : 'レンタカー・マイカーで橋を渡り、島内は車・レンタサイクル・徒歩で快適散策';
  } else if (
    areaKm2 >= 20 ||
    ['392', '386', '396', '375', '380', '401', '352', '356', '357', '358', '340', '339', '269', '275', '296', '76', '197', '49', '55', '56', '58', '137', '2'].includes(idStr)
  ) {
    islandMobility = 'レンタカー・原付バイク推奨（台数限定のため事前予約必須・一部路線バスあり）';
  } else if (areaKm2 >= 4 || difficulty.level >= 3) {
    islandMobility = '電動アシスト自転車・レンタルバイク・島内路線バス・徒歩（宿送迎も活用）';
  }

  let bestSeason = '4月〜11月（気候が穏やかな春〜秋が島歩き・船旅のベストシーズン）';
  if (pref === '沖縄県' || ['okinawa_main', 'kerama', 'kume', 'miyako', 'yaeyama', 'daito'].includes(reg)) {
    bestSeason =
      '3月〜6月・10月〜11月（梅雨明け6月下旬〜7月の夏本番も絶景ブルー、8〜9月は台風による船便欠航に注意）';
  } else if (idStr === '340' || islandName.includes('屋久島')) {
    bestSeason =
      '4月〜6月（新緑・ヤクシマシャクナゲ）・10月〜11月（快晴率が高く縄文杉トレッキングに最適）';
  } else if (['amami', 'tokara', 'osumi'].includes(reg)) {
    bestSeason =
      '4月〜7月上旬・10月〜11月（初夏〜梅雨明けのサンゴ礁と秋の快適気候、夏〜秋口は台風情報を要確認）';
  } else if (reg === 'ogasawara') {
    bestSeason =
      '5月〜10月（ボニンブルーの海況が安定するベスト期 / 1月〜4月はザトウクジラのホエールウォッチング最盛期）';
  } else if (reg === 'izu' || pref === '東京都') {
    bestSeason =
      '5月〜10月（海水浴・シュノーケル・満天の星空に最適 / 冬〜春は椿と絶景温泉、冬季の西風欠航に注意）';
  } else if (reg === 'pseudo_hokkaido' || pref === '北海道') {
    bestSeason =
      '6月〜9月（高山植物の開花と濃厚生ウニ漁解禁が重なる6〜8月が最高潮、冬季は高波・暴風雪に注意）';
  } else if (
    ['pseudo_sanriku', 'oshika', 'pseudo_hokuriku', 'oki', 'pseudo_san_in', 'hagi'].includes(reg) ||
    ['青森県', '岩手県', '宮城県', '山形県', '新潟県', '石川県', '福井県', '島根県', '京都府'].includes(pref)
  ) {
    bestSeason =
      '4月下旬〜10月（日本海・三陸の波が穏やかな春〜秋が快適、11月〜3月は北西季節風による時化に注意）';
  } else if (
    ['naoshima', 'shiwaku', 'kasaoka', 'kamijima', 'suo_oshima', 'kutsuna', 'ieshima', 'pseudo_awaji'].includes(reg) ||
    ['香川県', '岡山県', '広島県', '愛媛県', '兵庫県'].includes(pref)
  ) {
    bestSeason =
      '3月〜5月・9月〜11月（雨が少ない温暖な瀬戸内海式気候で通年快適、春・秋は島めぐり＆サイクリング最適期）';
  } else if (
    pref === '鹿児島県' ||
    pref === '長崎県' ||
    pref === '福岡県' ||
    pref === '佐賀県' ||
    pref === '熊本県' ||
    pref === '大分県' ||
    pref === '宮崎県'
  ) {
    bestSeason =
      '4月〜10月（7〜8月は透明度抜群のマリンブルー、春・秋は旬の活魚・海鮮グルメと絶景散策に最適）';
  }

  const primaryFerryName = ferryList[0]?.name ? `（主な運行案内：${ferryList[0].name}）` : '';

  const seoFaqs: IslandSeoFaq[] = [
    {
      question: `${islandName}への行き方・出発港はどこですか？`,
      answer: `${islandName}${pref ? `（${pref}）` : ''}への玄関口・出発拠点は「${departureHub}」です。アクセス手段は「${accessMethod}」${primaryFerryName}で、所要時間の目安は「${durationEstimate}」、現地交通費の目安は「${roundTripBudget}」となっています。`,
    },
    {
      question: `${islandName}は日帰りで観光できますか？滞在時間の目安は？`,
      answer: `${islandName}の日帰り判定は「${dayTripBadge.label}」です。${dayTripBadge.detail}おすすめの滞在日数は「${recommendedStay}」で、島内移動は「${islandMobility}」が基本となります。`,
    },
    {
      question: `${islandName}にコンビニやATM、レンタカーはありますか？`,
      answer: infra.is_uninhabited
        ? `${islandName}は定住者のいない無人島のため、コンビニ・売店、ATM、レンタカーや医療機関などの常設インフラはありません。乗船前に出発港エリアで飲料水・食料・現金・日除け装備を必ず準備して渡航してください。`
        : `${islandName}の商店・コンビニ環境は「${infra.store_status}」（${infra.store_desc}）、ATM・金融機関は「${infra.atm_status}」（${infra.atm_desc}）です。島内の移動手段は「${islandMobility}」、携帯電波は「${infra.signal_status}」が目安です。${infra.cash_advice_text}`,
    },
    {
      question: `${islandName}のベストシーズンと注意点は？`,
      answer: `${islandName}のベストシーズンは「${bestSeason}」です。離島航路や小型機は強風・高波・台風などで欠航する場合があるため、当日は船会社・航空会社の最新運航状況を確認し、宿・レンタカーの事前予約と現金の携行を心がけると安心です。`,
    },
  ];

  return {
    departureHub,
    accessMethod,
    durationEstimate,
    roundTripBudget,
    dayTripBadge,
    recommendedStay,
    islandMobility,
    bestSeason,
    seoFaqs,
  };
}
