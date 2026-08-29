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

// 楽天トラベル・公式宿検索URL (都道府県＋島名で地域絞り込み ＋ Shift-JIS URLエンコード)
export function getRakutenTravelSearchUrl(islandName: string, prefecture?: string): string {
  const cleanName = islandName.replace(/（.*）|\(.*?\)/g, '').trim();
  const fullQuery = prefecture ? `${prefecture} ${cleanName}` : cleanName;
  const sjisKeyword = encodeShiftJisUrl(fullQuery);
  const targetUrl = `https://kw.travel.rakuten.co.jp/keyword/Search.do?f_query=${sjisKeyword}`;
  return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${encodeURIComponent(targetUrl)}`;
}

// 楽天レンタカー検索URL
export function getRakutenRentacarSearchUrl(islandName: string, prefecture?: string): string {
  const cleanName = islandName.replace(/（.*）|\(.*?\)/g, '').trim();
  const fullQuery = prefecture ? `${prefecture} ${cleanName} レンタカー` : `${cleanName} レンタカー`;
  const targetUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(fullQuery)}/`;
  return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${encodeURIComponent(targetUrl)}`;
}

// じゃらん・公式宿検索URL (都道府県＋島名で地域絞り込み ＋ Shift-JIS URLエンコード)
export function getJalanSearchUrl(islandName: string, prefecture?: string): string {
  const cleanName = islandName.replace(/（.*）|\(.*?\)/g, '').trim();
  const fullQuery = prefecture ? `${prefecture} ${cleanName}` : cleanName;
  const sjisKeyword = encodeShiftJisUrl(fullQuery);
  return `https://www.jalan.net/uw/uwp2011/uww2011init.do?keyword=${sjisKeyword}`;
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
      id: 'aogashima_ya',
      name: 'あおがしま屋',
      type: 'minshuku',
      phone: '04996-9-0185',
      planTier: 'paid_premium',
      features: '1泊3食付き（島散策用お弁当含む） / 自家製青酎・地魚料理 / 港・ヘリポート往復送迎あり / 高速Wi-Fi完備',
      priceRange: '¥11,000〜 / 1泊3食',
      isSponsored: true,
      sponsoredId: 'aogashimaya',
      address: '東京都青ヶ島村無番地',
    },
    {
      id: 'matsumi_so',
      name: 'マツミ荘',
      type: 'minshuku',
      phone: '04996-9-0115',
      planTier: 'free', // 無料枠: 確認済み電話番号のみ表示（誤情報防止）
    },
    {
      id: 'suginohara',
      name: 'ビジネス宿 杉の原',
      type: 'minshuku',
      phone: '04996-9-0125',
      planTier: 'free',
    }
  ],
  transports: [
    {
      id: 'aogashima_rentacar',
      name: '青ヶ島レンタカー（青ヶ島レンタカーサービス）',
      type: 'car',
      phone: '04996-9-0088',
      features: '軽自動車・軽トラック完備 / ヘリポート・港での受渡対応',
      priceRange: '¥4,500〜 / 24時間',
    }
  ]
};

// 父島データ
const CHICHIJIMA_FACILITY_DATA: IslandFacilityData = {
  islandId: '63',
  islandName: '父島',
  townHallName: '小笠原村観光協会',
  townHallPhone: '04996-2-2585',
  transportNotes: '集落内は徒歩・レンタル自転車で回れますが、島内観光やビーチ巡りにはレンタルバイク（原付）やレンタカーが絶大にお勧めです。村営バスも運行中。',
  accommodations: [
    {
      id: 'chichijima_view',
      name: 'ホテルアザレア / パパスダイビング＆ゲストハウス',
      type: 'guesthouse',
      phone: '04996-2-2345',
      planTier: 'free',
    },
    {
      id: 'tetsuya',
      name: 'ペンション てつ家',
      type: 'minshuku',
      phone: '04996-2-3300',
      planTier: 'free',
    }
  ],
  transports: [
    {
      id: 'ogasawara_rentacar',
      name: '小笠原レンタカー',
      type: 'car',
      phone: '04996-2-2580',
      features: '普通車・軽自動車・オープンカー / 二見港近く',
      priceRange: '¥6,000〜 / 日',
    },
    {
      id: 'chichijima_bike',
      name: '小笠原観光 レンタルバイク・E-Bike',
      type: 'bike',
      phone: '04996-2-2051',
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
  islandId: '250',
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
  '250': NAOSHIMA_FACILITY_DATA,
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

  // フォールバック（未登録の島）
  return {
    islandId,
    islandName: cleanName || islandName,
    transportNotes: `${cleanName || islandName}の島内移動は、港周辺のレンタルショップやタクシー、路線バス等をご利用ください。事前に営業状況の電話確認をお勧めします。`,
    accommodations: [
      {
        id: `${islandId}_default_minshuku`,
        name: `${cleanName || islandName} 島内民宿・素泊まり宿`,
        type: 'minshuku',
        planTier: 'free',
      }
    ],
    transports: [
      {
        id: `${islandId}_default_transport`,
        name: `${cleanName || islandName} レンタカー・レンタサイクル・タクシー`,
        type: 'car',
        features: '港周辺での受け渡しまたは事前電話予約推奨',
        priceRange: '時価',
      }
    ]
  };
}
