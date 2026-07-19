export interface CollabSpot {
  id: string;
  name: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  radius_m: number; // 判定半径（メートル）
  reward_fairy_id: string; // 獲得できる妖精
}

export const COLLAB_SPOTS: CollabSpot[] = [
  {
    id: 'spot_manza',
    name: '万座毛（沖縄本島）',
    description: '沖縄本島を代表する絶景スポット。象の鼻の形をした琉球石灰岩の断崖から、東シナ海の美しい青を満喫できます。',
    coordinates: {
      lat: 26.5048,
      lng: 127.8502,
    },
    radius_m: 500, // 半径500m
    reward_fairy_id: 'fairy_okinawa_manza'
  },
  {
    id: 'spot_kabira',
    name: '川平湾（石垣島）',
    description: 'ミシュラングリーンガイド三ツ星を獲得した石垣島随一の景勝地。グラスボートでの海中散歩が人気です。',
    coordinates: {
      lat: 24.4533,
      lng: 124.1437,
    },
    radius_m: 500,
    reward_fairy_id: 'fairy_ishigaki_kabira'
  },
  {
    id: 'spot_yonaha',
    name: '与那覇前浜ビーチ（宮古島）',
    description: '東洋一美しいとも称される、宮古島を代表するきめ細やかな白砂のロングビーチ。',
    coordinates: {
      lat: 24.7369,
      lng: 125.2612,
    },
    radius_m: 1000,
    reward_fairy_id: 'fairy_miyako_yonaha'
  },
  {
    id: 'spot_mangrove',
    name: '黒潮の森マングローブパーク（奄美大島）',
    description: '奄美大島の広大なマングローブ原生林。カヌーで探検でき、手つかずの大自然を肌で感じられます。',
    coordinates: {
      lat: 28.2711,
      lng: 129.4317,
    },
    radius_m: 1000,
    reward_fairy_id: 'fairy_amami_mangrove'
  },
  {
    id: 'spot_test_local',
    name: 'テスト用どこでもチェックイン（開発環境用）',
    description: '開発テスト用のスポットです。日本の中心（おおよそ）を中心に巨大な判定半径を持ちます。',
    coordinates: {
      lat: 36.2048,
      lng: 138.2529,
    },
    radius_m: 10000000, // 日本中どこでもチェックインできるように1万kmに設定
    reward_fairy_id: 'fairy_okinawa_manza'
  },
  {
    id: 'spot_kirahotel_test',
    name: 'キラキラホテルリゾート（テスト）',
    description: '架空のコラボホテル。GPSでこの地点にアクセスすると、ホテル制服を着た限定衣装のルリちゃんが手に入ります。',
    coordinates: {
      lat: 35.6812, // 東京駅付近を仮設定
      lng: 139.7671,
    },
    radius_m: 5000000, // テストしやすいため半径5000km
    reward_fairy_id: 'fairy_okinawa_main_kirahotel'
  }
];

// 2点間の距離を計算する関数（Haversine formula）
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 地球の半径 (m)
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // メートル単位の距離
}
