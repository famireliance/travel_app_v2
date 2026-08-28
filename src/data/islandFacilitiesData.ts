export interface AccommodationItem {
  id: string;
  name: string;
  type: 'minshuku' | 'hotel' | 'guesthouse' | 'resort';
  phone?: string;
  features: string; // 例: 「1泊2食付き / 島料理 / 港送迎あり」
  isSponsored?: boolean; // 有料特設ページ対象宿かどうか
  sponsoredId?: string; // /stay/[sponsoredId] へのリンク
  address?: string;
  priceRange?: string; // 例: 「¥8,500〜 / 1泊2食」
}

export interface TransportItem {
  id: string;
  name: string;
  type: 'car' | 'bike' | 'cycle' | 'bus' | 'taxi';
  phone?: string;
  features: string; // 例: 「軽トラ・普通車 / 港受渡OK」
  priceRange?: string; // 例: 「¥4,000〜 / 24時間」
}

export interface IslandFacilityData {
  islandId: string; // 島ID (例: '392', 'aogashima', etc.)
  islandName: string;
  accommodations: AccommodationItem[];
  transports: TransportItem[];
  transportNotes?: string; // 島内移動のアドバイス（「坂道が多いので原付または電動自転車推奨」など）
}

export const RAKUTEN_AFFILIATE_ID = '56ebd0d5.3e11f68e.56ebd0d6.3ff60376';

// 楽天トラベル 宿検索URL (アフィリエイトID自動付与)
export function getRakutenTravelSearchUrl(islandName: string): string {
  const targetUrl = `https://travel.rakuten.co.jp/share/hotellist/${encodeURIComponent(islandName)}`;
  return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${encodeURIComponent(targetUrl)}`;
}

// 楽天トラベル レンタカー検索URL
export function getRakutenRentacarSearchUrl(islandName: string): string {
  const targetUrl = `https://travel.rakuten.co.jp/cars/search/?keyword=${encodeURIComponent(islandName)}`;
  return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${encodeURIComponent(targetUrl)}`;
}

// じゃらん 宿検索URL
export function getJalanSearchUrl(islandName: string): string {
  return `https://www.jalan.net/uw/uwp2011/uww20111.do?keyword=${encodeURIComponent(islandName)}`;
}

// 主要・代表的離島の宿＆交通マスターデータ
export const ISLAND_FACILITIES_DICTIONARY: Record<string, IslandFacilityData> = {
  // 青ヶ島 (Aogashima - 388 or aogashima)
  '388': {
    islandId: '388',
    islandName: '青ヶ島',
    transportNotes: '島内は急勾配の坂道が多く、公共バスはありません。基本的にはレンタカー（要事前電話予約）か徒歩散策となります。',
    accommodations: [
      {
        id: 'aogashima_ya',
        name: 'あおがしま屋',
        type: 'minshuku',
        phone: '04996-9-0141',
        features: '1泊2食付き / 島料理・自家製焼酎 / 港・ヘリポート送迎あり / Wi-Fi完備',
        priceRange: '¥9,500〜 / 1泊2食',
        isSponsored: true,
        sponsoredId: 'aogashimaya',
      },
      {
        id: 'matsumi_so',
        name: 'マツミ荘',
        type: 'minshuku',
        phone: '04996-9-0115',
        features: '1泊2食付き / 伝統的アットホーム民宿 / 港送迎要相談',
        priceRange: '¥9,000〜 / 1泊2食',
      },
      {
        id: 'suginohara',
        name: 'ビジネス宿 杉の原',
        type: 'minshuku',
        phone: '04996-9-0125',
        features: '素泊まり・1泊2食選択可 / 商店近くで便利な立地',
        priceRange: '¥7,500〜 / 1泊',
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
  },

  // 小笠原・父島 ('389')
  '389': {
    islandId: '389',
    islandName: '父島',
    transportNotes: '集落内は徒歩・レンタル自転車で回れますが、島内観光やビーチ巡りにはレンタルバイク（原付）やレンタカーが絶大にお勧めです。村営バスも運行中。',
    accommodations: [
      {
        id: 'chichijima_view',
        name: 'ホテルアザレア / パパスダイビング＆ゲストハウス',
        type: 'guesthouse',
        phone: '04996-2-2345',
        features: '海近く / アクティビティツアー併設 / 大浴場・Wi-Fi',
        priceRange: '¥8,000〜 / 素泊まり',
      },
      {
        id: 'tetsuya',
        name: 'ペンション てつ家',
        type: 'minshuku',
        phone: '04996-2-3300',
        features: '1泊2食 / 小笠原の地魚料理 / 温かいおもてなし',
        priceRange: '¥12,000〜 / 1泊2食',
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
  },

  // 石垣島 ('392')
  '392': {
    islandId: '392',
    islandName: '石垣島',
    transportNotes: '離島ターミナル周辺以外は広い島のため、空港でのレンタカー手配がベスト。路線バス（東バス）やタクシーも充実しています。',
    accommodations: [
      {
        id: 'ishigaki_resort',
        name: 'ANAインターコンチネンタル石垣リゾート',
        type: 'resort',
        phone: '0980-88-7111',
        features: '高級オーシャンビューリゾート / 屋外プール・スパ・ビーチ直結',
        priceRange: '¥25,000〜 / 泊',
      },
      {
        id: 'fusaki_resort',
        name: 'フサキビーチリゾート ホテル＆ヴィラズ',
        type: 'resort',
        phone: '0980-88-7000',
        features: 'サンセットビーチ直結 / 大浴場・天然温泉・ファミリー人気',
        priceRange: '¥18,000〜 / 泊',
      }
    ],
    transports: [
      {
        id: 'ishigaki_car_times',
        name: 'タイムズカー 新石垣空港店',
        type: 'car',
        phone: '0980-84-4141',
        features: '新石垣空港送迎バス無料 / 24時間Web予約対応',
        priceRange: '¥5,000〜 / 24時間',
      },
      {
        id: 'ots_rentacar',
        name: 'OTSレンタカー 石垣空港店',
        type: 'car',
        phone: '0980-84-4323',
        features: '免責補償・ドライブインフォメーション充実',
        priceRange: '¥4,500〜 / 24時間',
      }
    ]
  },

  // 竹富島 ('393')
  '393': {
    islandId: '393',
    islandName: '竹富島',
    transportNotes: '島内は白砂の道のためレンタカーは不要です。港に各レンタサイクル会社や水牛車の送迎マイクロバスが待機しています。',
    accommodations: [
      {
        id: 'hoshinoya_taketomi',
        name: '星のや竹富島',
        type: 'resort',
        phone: '0570-073-066',
        features: '伝統的な琉球赤瓦集落リゾート / プール・泡盛バー・星空ナイト',
        priceRange: '¥60,000〜 / 泊',
      },
      {
        id: 'taketomi_takana',
        name: '竹富島 民宿 たかな',
        type: 'minshuku',
        phone: '0980-85-2151',
        features: '最古の歴史ある赤瓦の伝統民宿 / 1泊2食 / 三線演奏あり',
        priceRange: '¥8,000〜 / 1泊2食',
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
  },

  // 直島 ('250' or naoshima)
  '250': {
    islandId: '250',
    islandName: '直島',
    transportNotes: '港（宮ノ浦港）近くにレンタサイクルショップが多数。電動アシスト自転車がアートめぐりや坂道移動に大人気です。町営バスも100円〜200円で運行中。',
    accommodations: [
      {
        id: 'benesse_house',
        name: 'ベネッセハウス (Benesse House)',
        type: 'hotel',
        phone: '087-892-2030',
        features: '美術館と一体化した最高級アートホテル / 宿泊者限定夜間鑑賞',
        priceRange: '¥35,000〜 / 泊',
      },
      {
        id: 'naoshima_yurt',
        name: 'つつじ荘（パオ・トレーラーハウス）',
        type: 'guesthouse',
        phone: '087-892-2838',
        features: 'ビーチ直結のモンゴル式パオ・トレーラー / コスパ抜群',
        priceRange: '¥4,500〜 / 泊',
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
  }
};

// 汎用フォールバック用: データが未登録の島でも動的に作成
export function getIslandFacilityDataOrDefault(islandId: string, islandName: string): IslandFacilityData {
  if (ISLAND_FACILITIES_DICTIONARY[islandId]) {
    return ISLAND_FACILITIES_DICTIONARY[islandId];
  }

  // デフォルト生成データ
  return {
    islandId,
    islandName,
    transportNotes: `${islandName}の島内移動は、港周辺のレンタルショップやタクシー、路線バス等をご利用ください。事前に営業状況の電話確認をお勧めします。`,
    accommodations: [
      {
        id: `${islandId}_default_minshuku`,
        name: `${islandName} 島内民宿・素泊まり宿`,
        type: 'minshuku',
        features: '1泊2食 / 素泊まり / 各自治体観光協会またはお電話にて空室確認',
        priceRange: '¥6,000〜¥10,000前後',
      }
    ],
    transports: [
      {
        id: `${islandId}_default_transport`,
        name: `${islandName} レンタカー・レンタサイクル・タクシー`,
        type: 'car',
        features: '港周辺での受け渡しまたは事前電話予約推奨',
        priceRange: '時価',
      }
    ]
  };
}
