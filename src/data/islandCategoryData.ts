export type IslandCategoryType = 'major' | 'remote' | 'ferry_daytrip';

export interface FerryBoatItem {
  id: string;
  name: string; // 例: 「安室島・嘉比島 渡し船（阿真キャンプ場前）」
  departurePort: string; // 例: 「座間味島 阿真港・座間味港」
  phone?: string;
  priceRange?: string; // 例: 「往復 ¥1,500〜 / 人」
  features: string; // 例: 「事前予約推奨 / 無人島シュノーケル渡し」
}

export interface ActivityItem {
  id: string;
  name: string; // 例: 「青ヶ島 ひんぎゃ蒸気釜＆星空ナイトツアー」
  category: 'diving' | 'snorkeling' | 'sup' | 'night_tour' | 'nature' | 'fishing';
  phone?: string;
  priceRange?: string;
  features: string;
  bookingUrl?: string;
}

export interface IslandGuideLink {
  islandName: string;
  articleTitle: string;
  articleUrl: string;
  snippet: string;
}

// 離島のタイプ自動判定ロジック
export function getIslandCategoryType(islandId: string, islandName: string): IslandCategoryType {
  const cleanName = islandName ? islandName.replace(/（.*）|\(.*?\)/g, '').trim() : '';

  // 1. 【メジャー観光離島】 (大手予約サイトで宿が豊富に検索できる島)
  const majorIslands = [
    '石垣島', '宮古島', '奄美大島', '屋久島', '佐渡島', '淡路島', '小豆島', '直島', 
    '久米島', '西表島', '対馬', '壱岐', '種子島', '沖永良部島', '徳之島', '与論島', 
    '伊豆大島', '八丈島', '神津島', '新島', '三宅島', '慶良間', '渡嘉敷島', '座間味島'
  ];

  // 2. 【日帰り・無人島・渡し船移動島】
  const daytripIslands = [
    '猿島', '水納島', '友ヶ島', '軍艦島', '竹生島', '初島', '無人島', 
    '安室島', '嘉比島', 'コマカ島', '津堅島', 'ナガンヌ島'
  ];

  if (majorIslands.some(m => cleanName.includes(m) || m.includes(cleanName))) {
    return 'major';
  }

  if (daytripIslands.some(d => cleanName.includes(d) || d.includes(cleanName))) {
    return 'ferry_daytrip';
  }

  // 3. 【秘境・小規模離島】 (デフォルト: 青ヶ島、御蔵島、トカラ列島、大東諸島等)
  return 'remote';
}

// 無人島・日帰り渡し船マスターデータ
export const FERRY_BOATS_DICTIONARY: Record<string, FerryBoatItem[]> = {
  // 座間味周辺無人島（安室島・嘉比島等）
  'zamami_uninhabited': [
    {
      id: 'zamami_boat_1',
      name: '座間味無人島渡し船 (阿真マリン)',
      departurePort: '座間味島 阿真ビーチ前 / 座間味港',
      phone: '098-987-2232',
      priceRange: '往復 ¥1,500〜 / 人',
      features: '安室島・嘉比島・安慶名敷島への無人島渡し。シュノーケル用ビーチ傘レンタルあり。',
    }
  ],
  // 水納島 (沖縄本島本部発)
  'minna': [
    {
      id: 'minna_ferry',
      name: '水納島定期高速船「ニューウィングみんな」',
      departurePort: '沖縄本島 本部町 渡久地港',
      phone: '0980-47-5179',
      priceRange: '往復 ¥1,730 / 大人',
      features: '所要時間約15分。夏期増便あり。水納島ビーチへの絶好アクセス。',
    }
  ]
};

// アクティビティツアー掲載データ
export const ACTIVITIES_DICTIONARY: Record<string, ActivityItem[]> = {};

// guide.kira-tabi.com 連携リンク生成
export function getIslandGuideArticle(islandName: string): IslandGuideLink {
  const cleanName = islandName ? islandName.replace(/（.*）|\(.*?\)/g, '').trim() : '';

  return {
    islandName: cleanName,
    articleTitle: `【完全攻略】${cleanName}の観光・アクセス・おすすめスポットガイド`,
    articleUrl: `https://guide.kira-tabi.com/island/${encodeURIComponent(cleanName)}`,
    snippet: `${cleanName}のベストシーズン、絶景撮影ポイント、現地のローカルルールやおすすめルートをKIRATABI公式ガイド記事で詳しく解説中！`,
  };
}
