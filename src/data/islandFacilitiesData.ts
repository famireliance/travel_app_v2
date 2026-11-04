import { encodeShiftJisUrl } from '@/lib/shiftJisUrl';

export type InnPlanTier = 'free' | 'paid_standard' | 'paid_premium';

export interface AccommodationItem {
  id: string;
  name: string;
  type: 'minshuku' | 'hotel' | 'guesthouse' | 'resort';
  phone?: string;
  planTier: InnPlanTier; // 'free' (無料枠: 宿名＋確認済み電話のみ) | 'paid_standard' | 'paid_premium'
  features?: string; // 有料枠用: 詳細特徴・設備
  isSponsored?: boolean;
  sponsoredId?: string;
  address?: string;
  priceRange?: string; // 有料枠用: 正確な価格帯
  officialWebsite?: string;
  lineInquiryUrl?: string;
  imageUrl?: string;
}

export interface TransportItem {
  id: string;
  name: string;
  type: 'car' | 'bike' | 'cycle' | 'bus' | 'taxi';
  phone?: string;
  features: string;
  priceRange?: string;
}

export interface IslandFacilityData {
  islandId: string;
  islandName: string;
  townHallPhone?: string; // 役場・観光協会電話番号 (誤情報防止用)
  townHallName?: string; // 例: 「青ヶ島村役場 観光案内」
  accommodations: AccommodationItem[];
  transports: TransportItem[];
  transportNotes?: string;
}

export const RAKUTEN_AFFILIATE_ID = '56ebd0d5.3e11f68e.56ebd0d6.3ff60376';

// 詩的なエリア名・諸島名を実在の宿泊検索キーワードへ変換するマップ
export const REGION_SEARCH_KEYWORD_MAP: Record<string, string> = {
  '北の大地の島々': '北海道 利尻島 礼文島',
  '三陸海岸の離島': '宮城県 気仙沼 大島',
  '奥州・牡鹿の島々': '宮城県 石巻',
  '奥州 牡鹿の島々': '宮城県 石巻',
  '首都圏近海の離島': '神奈川県 横須賀 三浦',
  '日本海・北陸の島々': '新潟県 佐渡島',
  '日本海 北陸の島々': '新潟県 佐渡島',
  '三河湾の島々': '愛知県 日間賀島 篠島',
  '家島群島': '兵庫県 姫路 家島',
  '播磨灘の島々': '兵庫県 姫路 家島',
  '琵琶湖に浮かぶ島々': '滋賀県 長浜 竹生島',
  '備讃瀬戸の島々': '香川県 小豆島 丸亀',
  '響灘・長門の島々': '山口県 下関 萩',
  '響灘 長門の島々': '山口県 下関 萩',
  '隠岐諸島': '島根県 隠岐',
  '山陰海岸の島々': '島根県 隠岐',
  '防予諸島の島々': '山口県 周防大島',
  '忽那諸島': '愛媛県 松山 興居島',
  '上島諸島': '愛媛県 上島 弓削島',
  '直島・小豆島（瀬戸内アート）': '香川県 小豆島 直島',
  '直島・小豆島': '香川県 小豆島 直島',
  '直島 小豆島': '香川県 小豆島 直島',
  '塩飽諸島': '香川県 丸亀 多度津',
  '宇和海周辺': '愛媛県 宇和島',
  '阿波の島々': '徳島県 鳴門 阿南',
  '土佐湾の島々': '高知県 宿毛 須崎',
  '天草諸島': '熊本県 天草',
  '天草灘の島々': '熊本県 天草',
  '奄美群島（世界自然遺産）': '鹿児島県 奄美大島',
  '奄美群島': '鹿児島県 奄美大島',
  '豊後水道の島々': '大分県 佐伯 津久見',
  '博多湾・筑前の島々': '福岡県 福岡 糸島',
  '博多湾 筑前の島々': '福岡県 福岡 糸島',
  '玄界灘の島々': '福岡県 宗像 玄界灘',
  '五島列島（祈りの島々）': '長崎県 五島 福江',
  '五島列島': '長崎県 五島 福江',
  '平戸・松浦の島々': '長崎県 平戸 松浦',
  '平戸 松浦の島々': '長崎県 平戸 松浦',
  '壱岐諸島': '長崎県 壱岐',
  '日向灘の島々': '宮崎県 日南 延岡',
  'トカラ列島': '鹿児島県 十島村 奄美',
  '大隅群島': '鹿児島県 屋久島 種子島',
  '甑島列島': '鹿児島県 薩摩川内 甑島',
  '西海国立公園の島々': '長崎県 佐世保 九十九島',
  '薩摩半島の島々': '鹿児島県 薩摩川内 甑島',
  '大東諸島': '沖縄県 南大東島',
  '慶良間諸島': '沖縄県 座間味 渡嘉敷',
  '慶良間ブルーの島々': '沖縄県 座間味 渡嘉敷',
  '宮古列島': '沖縄県 宮古島',
  '宮古諸島': '沖縄県 宮古島',
  '宮古諸島（宮古ブルー）': '沖縄県 宮古島',
  '琉球弧の島々': '沖縄県 那覇 本島周辺',
  '八重山諸島': '沖縄県 石垣島 竹富島',
  '八重山諸島（美ら海）': '沖縄県 石垣島 竹富島',
  '久米島周辺の島々': '沖縄県 久米島',
};

function resolveHotelSearchQuery(islandName: string, prefecture?: string): string {
  const trimmed = (islandName || '').trim();
  if (REGION_SEARCH_KEYWORD_MAP[trimmed]) {
    return REGION_SEARCH_KEYWORD_MAP[trimmed];
  }
  const withoutParens = trimmed.replace(/（.*）|\(.*?\)/g, '').trim();
  if (REGION_SEARCH_KEYWORD_MAP[withoutParens]) {
    return REGION_SEARCH_KEYWORD_MAP[withoutParens];
  }
  const cleanName = withoutParens.replace(/・/g, ' ').replace(/\s+/g, ' ').trim();
  if (REGION_SEARCH_KEYWORD_MAP[cleanName]) {
    return REGION_SEARCH_KEYWORD_MAP[cleanName];
  }
  return prefecture ? `${prefecture} ${cleanName}` : cleanName;
}

// 楽天トラベル・公式宿検索URL (都道府県＋島名で地域絞り込み ＋ Shift-JIS URLエンコード)
export function getRakutenTravelSearchUrl(islandName: string, prefecture?: string): string {
  const fullQuery = resolveHotelSearchQuery(islandName, prefecture);
  const sjisKeyword = encodeShiftJisUrl(fullQuery);
  const targetUrl = `https://kw.travel.rakuten.co.jp/keyword/Search.do?f_query=${sjisKeyword}`;
  const encodedTarget = encodeURIComponent(targetUrl);
  return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${encodedTarget}&m=${encodedTarget}`;
}

// 楽天レンタカー検索URL
export function getRakutenRentacarSearchUrl(islandName: string, prefecture?: string): string {
  // 楽天レンタカーには単純なキーワード検索URLがないため、レンタカートップページへ遷移させます
  const targetUrl = `https://travel.rakuten.co.jp/cars/`;
  const encodedTarget = encodeURIComponent(targetUrl);
  return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${encodedTarget}&m=${encodedTarget}`;
}

// バリューコマース（じゃらん）のアフィリエイト情報
export const JALAN_VC_SID = '3780092';
export const JALAN_VC_PID = '892688780';
export const JALAN_AFFILIATE_BASE_URL = `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${JALAN_VC_SID}&pid=${JALAN_VC_PID}`;

// じゃらんレンタカー検索URL (バリューコマースのアフィリエイトリンク)
export function getJalanRentacarSearchUrl(islandName: string, prefecture?: string): string {
  return `${JALAN_AFFILIATE_BASE_URL}&vc_url=${encodeURIComponent('https://www.jalan.net/rentacar/')}`;
}

// じゃらん・公式宿検索URL (バリューコマースのアフィリエイトリンク ＋ カスタム遷移)
export function getJalanSearchUrl(islandName: string, prefecture?: string): string {
  const fullQuery = resolveHotelSearchQuery(islandName, prefecture);
  const sjisKeyword = encodeShiftJisUrl(fullQuery);
  const targetUrl = `https://www.jalan.net/uw/uwp2011/uww2011init.do?keyword=${sjisKeyword}`;
  
  return `${JALAN_AFFILIATE_BASE_URL}&vc_url=${encodeURIComponent(targetUrl)}`;
}

// 青ヶ島データ
const AOGASHIMA_FACILITY_DATA: IslandFacilityData = {
  islandId: '58',
  islandName: '青ヶ島',
  townHallName: '青ヶ島村役場（総務課 観光担当）',
  townHallPhone: '04996-9-0111',
  transportNotes: '島内は急勾配の坂道が多く、公共バスはありません。基本的にはレンタカー（事前電話予約必須）または徒歩移動となります。',
  accommodations: [
    {
      id: 'aogashima_aogashimaya',
      name: '民宿 あおがしま屋',
      type: 'minshuku',
      phone: '04996-9-0141',
      planTier: 'free',
      address: '東京都青ヶ島村本村',
    },
    {
      id: 'aogashima_matsumiso',
      name: '民宿 マツミ荘',
      type: 'minshuku',
      phone: '04996-9-0103',
      planTier: 'free',
      address: '東京都青ヶ島村本村',
    },
    {
      id: 'aogashima_suginosawa',
      name: '民宿 杉の沢',
      type: 'minshuku',
      phone: '04996-9-0153',
      planTier: 'free',
      address: '東京都青ヶ島村本村',
    },
    {
      id: 'aogashima_nakazato',
      name: 'ビジネス宿 中里',
      type: 'minshuku',
      phone: '04996-9-0032',
      planTier: 'free',
      address: '東京都青ヶ島村本村',
    },
    {
      id: 'aogashima_kaiyumaru',
      name: '民宿 かいゆう丸',
      type: 'minshuku',
      phone: '04996-9-0114',
      planTier: 'free',
      address: '東京都青ヶ島村本村',
    },
    {
      id: 'aogashima_tametomo',
      name: 'お泊り処 御宿 為朝',
      type: 'minshuku',
      phone: '04996-9-0260',
      planTier: 'free',
      address: '東京都青ヶ島村本村',
    }
  ],
  transports: [
    {
      id: 'aogashima_rentacar',
      name: '青ヶ島レンタカー（青ヶ島整備工場）',
      type: 'car',
      phone: '04996-9-0022',
      features: '軽自動車・軽トラック完備 / ヘリポート・港での受渡対応',
      priceRange: '¥4,500〜 / 24時間',
    }
  ]
};

// 父島データ
const CHICHIJIMA_FACILITY_DATA: IslandFacilityData = {
  islandId: '63',
  islandName: '父島（小笠原諸島）',
  townHallName: '小笠原村観光協会',
  townHallPhone: '04998-2-2587',
  transportNotes: '集落内は徒歩・レンタル自転車で回れますが、島内観光やビーチ巡りにはレンタルバイク（原付）やレンタカーが絶大にお勧めです。村営バスも運行中。',
  accommodations: [
    {
      id: 'chichijima_view',
      name: 'ホテルアザレア / パパスダイビング＆ゲストハウス',
      type: 'guesthouse',
      phone: '04998-2-2345',
      planTier: 'free',
    },
    {
      id: 'tetsuya',
      name: 'ペンション てつ家',
      type: 'minshuku',
      phone: '04998-2-3300',
      planTier: 'free',
    }
  ],
  transports: [
    {
      id: 'ogasawara_rentacar',
      name: '小笠原レンタカー',
      type: 'car',
      phone: '04998-2-2580',
      features: '普通車・軽自動車・オープンカー / 二見港近く',
      priceRange: '¥6,000〜 / 日',
    },
    {
      id: 'chichijima_bike',
      name: '小笠原観光 レンタルバイク・E-Bike',
      type: 'bike',
      phone: '04998-2-2051',
      features: '50cc原付・電動アシスト自転車 / 坂道楽々',
      priceRange: '¥2,500〜 / 日',
    }
  ]
};

// 石垣島データ (メジャー観光島)
const ISHIGAKI_FACILITY_DATA: IslandFacilityData = {
  islandId: '392',
  islandName: '石垣島',
  townHallName: '石垣市市役所 観光文化課',
  townHallPhone: '0980-82-1535',
  transportNotes: '離島ターミナル周辺以外は広い島のため、空港でのレンタカー手配がベスト。路線バス（東バス）やタクシーも充実しています。',
  accommodations: [],
  transports: [
    {
      id: 'ishigaki_car_times',
      name: 'タイムズカー 新石垣空港店',
      type: 'car',
      phone: '0980-84-4141',
      features: '新石垣空港送迎バス無料 / 24時間Web予約対応',
      priceRange: '¥5,000〜 / 24時間',
    }
  ]
};

// 竹富島データ
const TAKETOMI_FACILITY_DATA: IslandFacilityData = {
  islandId: '393',
  islandName: '竹富島',
  townHallName: '竹富島観光協会',
  townHallPhone: '0980-82-5445',
  transportNotes: '島内は白砂の道のためレンタカーは不要です。港に各レンタサイクル会社や水牛車の送迎マイクロバスが待機しています。',
  accommodations: [
    {
      id: 'taketomi_takana',
      name: '竹富島 民宿 たかな',
      type: 'minshuku',
      phone: '0980-85-2151',
      planTier: 'free',
    }
  ],
  transports: [
    {
      id: 'taketomi_cycle',
      name: '新田観光 レンタサイクル・水牛車',
      type: 'cycle',
      phone: '0980-85-2103',
      features: '竹富港からの往復送迎付き / 普通自転車・チャイルドシート付',
      priceRange: '¥1,500〜 / 日',
    }
  ]
};

// 直島データ
const NAOSHIMA_FACILITY_DATA: IslandFacilityData = {
  islandId: '195',
  islandName: '直島',
  townHallName: '直島町観光協会',
  townHallPhone: '087-892-2299',
  transportNotes: '港（宮ノ浦港）近くにレンタサイクルショップが多数。電動アシスト自転車がアートめぐりや坂道移動に大人気です。町営バスも100円〜200円で運行中。',
  accommodations: [
    {
      id: 'naoshima_yurt',
      name: 'つつじ荘（パオ・トレーラーハウス）',
      type: 'guesthouse',
      phone: '087-892-2838',
      planTier: 'free',
    }
  ],
  transports: [
    {
      id: 'tvumv_cycle',
      name: 'T.V.C.直島レンタルサービス (宮ノ浦港前)',
      type: 'cycle',
      phone: '087-892-3251',
      features: '電動アシスト自転車・原付バイク / 予約可能',
      priceRange: '¥1,500〜 / 日',
    }
  ]
};

// 池間島データ
const IKEMA_FACILITY_DATA: IslandFacilityData = {
  islandId: '388',
  islandName: '池間島',
  townHallName: '宮古島市観光協会',
  townHallPhone: '0980-79-6611',
  transportNotes: '宮古島本島から池間大橋を渡って車でアクセス可能です。八重干瀬シュノーケルツアーの出発点でもあります。',
  accommodations: [
    {
      id: 'ikema_house',
      name: '池間島 ゲストハウス',
      type: 'guesthouse',
      phone: '0980-75-2010',
      planTier: 'free',
    }
  ],
  transports: [
    {
      id: 'ikema_car',
      name: '宮古島・池間島 レンタカー（宮古空港手配）',
      type: 'car',
      phone: '0980-72-0001',
      features: '宮古空港からのレンタカーで池間大橋を渡り車移動',
      priceRange: '¥4,000〜 / 日',
    }
  ]
};

// 重複マッチング用辞書
export const ISLAND_FACILITIES_DICTIONARY: Record<string, IslandFacilityData> = {
  '58': AOGASHIMA_FACILITY_DATA,
  '青ヶ島': AOGASHIMA_FACILITY_DATA,
  '63': CHICHIJIMA_FACILITY_DATA,
  '父島': CHICHIJIMA_FACILITY_DATA,
  '父島（小笠原諸島）': CHICHIJIMA_FACILITY_DATA,
  '392': ISHIGAKI_FACILITY_DATA,
  '石垣島': ISHIGAKI_FACILITY_DATA,
  '393': TAKETOMI_FACILITY_DATA,
  '竹富島': TAKETOMI_FACILITY_DATA,
  '195': NAOSHIMA_FACILITY_DATA,
  '直島': NAOSHIMA_FACILITY_DATA,
  '388': IKEMA_FACILITY_DATA,
  '池間島': IKEMA_FACILITY_DATA,
};

export function getIslandFacilityDataOrDefault(islandId: string, islandName: string): IslandFacilityData {
  const cleanName = islandName ? islandName.replace(/（.*）|\(.*?\)/g, '').trim() : '';

  if (ISLAND_FACILITIES_DICTIONARY[islandId]) {
    return ISLAND_FACILITIES_DICTIONARY[islandId];
  }
  if (ISLAND_FACILITIES_DICTIONARY[islandName]) {
    return ISLAND_FACILITIES_DICTIONARY[islandName];
  }
  if (cleanName && ISLAND_FACILITIES_DICTIONARY[cleanName]) {
    return ISLAND_FACILITIES_DICTIONARY[cleanName];
  }

  // フォールバック（未登録の島）— 架空施設は生成しない。空の配列を返してUIの空状態（じゃらん・楽天リンク）を表示
  return {
    islandId,
    islandName: cleanName || islandName,
    transportNotes: `${cleanName || islandName}の島内移動は、港周辺のレンタルショップやタクシー、路線バス等をご利用ください。事前に現地観光協会や役場への問い合わせをお勧めします。`,
    accommodations: [],
    transports: []
  };
}
