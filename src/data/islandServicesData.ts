export interface ServicePlanItem {
  id: string;
  name: string;
  price: string;
  desc: string;
  badge?: string;
  duration?: string;
  included?: string[];
  requirements?: string[];
  maxCapacity?: string;
}

export interface IslandServiceItem {
  id: string;
  type: 'rental_car' | 'activity' | 'guide_tour' | 'bike_rental';
  islandId: string;
  islandName: string;
  name: string;
  category: string;
  catchphrase: string;
  description: string;
  priceRange: string;
  plans: ServicePlanItem[];
  photoUrls: string[];
  phone: string;
  email?: string;
  lineUrl?: string;
  instagramUrl?: string;
  instagramAccount?: string;
  websiteUrl?: string;
  locationAddress: string;
  businessHours: string;
  pickupInfo: string;
  depositPolicy: string;
  requirementsNotes: string;
  bookingMode: 'request_based' | 'instant_booking';
  features: string[];
  agentReview?: {
    author: string;
    authorTitle: string;
    avatarUrl: string;
    rating: number;
    title: string;
    comment: string;
    tags: string[];
    date: string;
  };
}

export const ISLAND_SERVICES_DICTIONARY: Record<string, IslandServiceItem> = {
  'aogashima-yamada-rentacar': {
    id: 'aogashima-yamada-rentacar',
    type: 'rental_car',
    islandId: 'aogashima',
    islandName: '青ヶ島',
    name: '青ヶ島 ヤマダレンタカー',
    category: 'レンタカー・軽自動車4WD',
    catchphrase: '絶壁と二重カルデラの秘境を巡る。港・ヘリポート・各お宿への無料配車 ＆ 4WD完備。',
    description: '青ヶ島唯一のレンタカーサービス。アップダウンの激しい急坂やカルデラ内（ひんぎゃ）へのアクセスも安心な4WD軽自動車を取り揃えています。船やヘリコプターの到着時刻に合わせて、港・ヘリポート・ご宿泊先へ無料で配車・お迎えいたします。天候による船・ヘリの欠航時はキャンセル料無料です。',
    priceRange: '¥6,500〜 / 24時間',
    businessHours: '08:30 〜 18:00（船・ヘリ発着に合わせて柔軟対応）',
    pickupInfo: 'ヘリポート・三宝港・島内各民宿への無料配車＆乗り捨て回収対応',
    depositPolicy: '天候不良に伴う船・ヘリの欠航時はキャンセル料一切不要（無料）',
    requirementsNotes: '日本の普通自動車第一種運転免許証（要携帯）/ 全車禁煙 / 免責補償込み',
    bookingMode: 'request_based',
    locationAddress: '東京都青ヶ島村無番地（集落中心部）',
    phone: '04996-9-0234',
    email: 'rentacar@aogashima-yamada.jp',
    lineUrl: 'https://line.me/R/ti/p/@aogashima_yamada_car',
    instagramUrl: 'https://instagram.com/aogashima_rentacar',
    instagramAccount: '@aogashima_rentacar',
    websiteUrl: 'https://island.kira-tabi.com/rental/aogashima-yamada-rentacar',
    photoUrls: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'
    ],
    features: [
      '安心の全車4WD・急勾配カルデラ道路対応',
      'ヘリポート・三宝港・お宿への無料配車・回収',
      '船・ヘリ欠航時のキャンセル料完全無料',
      '島内観光マップ・ひんぎゃ利用案内付き',
      '全車免責補償・カーナビ・スマホ充電器完備'
    ],
    plans: [
      {
        id: 'plan-car-24h',
        name: '【1番人気】軽自動車4WD 24時間利用プラン（免責補償込み）',
        price: '¥6,500 / 24h',
        desc: '1泊2日の青ヶ島旅に最適なスタンダードプラン。島内全域を自由自在に周遊できます。',
        badge: '1番人気',
        duration: '24時間',
        included: ['車両レンタル代', '免責補償料（CDW）', '港・ヘリポート配車回収料', '消費税'],
        requirements: ['普通自動車免許証', 'ガソリン満タン返し（または走行距離精算）'],
        maxCapacity: '定員4名'
      },
      {
        id: 'plan-car-48h',
        name: '【連泊お得】軽自動車4WD 48時間ゆったり満喫プラン',
        price: '¥12,000 / 48h',
        desc: '2泊3日のじっくり滞在向け。星空観察やカルデラ散策を時間を気にせず堪能。',
        badge: '連泊お得',
        duration: '48時間',
        included: ['車両レンタル代', '免責補償料（CDW）', '配車回収料', '消費税'],
        requirements: ['普通自動車免許証'],
        maxCapacity: '定員4名'
      },
      {
        id: 'plan-car-day',
        name: '【日帰り・半日】軽自動車4WD 日中サクッと周遊プラン',
        price: '¥4,500 / 最大8h',
        desc: 'ヘリ日帰り訪問や半日だけ観光したい方向けのクイックプラン。',
        badge: '日帰り',
        duration: '最大8時間（朝〜夕）',
        included: ['車両レンタル代', '免責補償料（CDW）', '配車回収料'],
        requirements: ['普通自動車免許証'],
        maxCapacity: '定員4名'
      }
    ],
    agentReview: {
      author: 'KIRATABI 交通調査班',
      authorTitle: 'アイランドモビリティ Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: 5.0,
      title: '急坂の青ヶ島で絶対に必要な頼れる足。送迎・配車も迅速で安心！',
      comment: '青ヶ島は集落から港・ヘリポート、カルデラ内の「ひんぎゃ」まで高低差が数百メートルあり、徒歩移動は極めて困難です。ヤマダレンタカーの4WD軽はパワフルで取り回しも良く、ヘリ到着時に空港前で鍵を受け取れるスムーズさが最高でした。欠航時も自動免除されるため、予約のハードルが非常に低く島旅の強い味方です。',
      tags: ['4WD必須', 'ヘリポート配車', '欠航時無料', '親切対応'],
      date: '2026年 調査'
    }
  },

  'ogasawara-blue-dolphin-tour': {
    id: 'ogasawara-blue-dolphin-tour',
    type: 'activity',
    islandId: 'chichijima',
    islandName: '父島（小笠原）',
    name: '小笠原 ブルーマリン・ドルフィンスイム＆南島上陸ツアー',
    category: 'ドルフィンスイム・ボートツアー・南島上陸',
    catchphrase: '野生のイルカと泳ぐ感動体験。世界自然遺産・南島の白砂とハートロックの絶景を巡る1日。',
    description: 'ボニンブルーに輝く小笠原の海で、野生のミナミハンドウイルカやハシナガイルカと一緒に泳ぐ感動のドルフィンスイムツアー！さらに天然記念物の「南島」への上陸や、兄島海域公園でのシュノーケリングもセットになった大満足の1日コースです。ガイド歴15年のベテラン船長が丁寧にご案内します。初心者や一人旅の方も大歓迎です。',
    priceRange: '¥13,000〜 / 1名',
    businessHours: '08:00 〜 17:00（おがさわら丸入港中毎日運航）',
    pickupInfo: '父島二見港・大村地区各お宿への無料送迎付き',
    depositPolicy: 'おがさわら丸欠航・海況悪化による船長判断の中止時は全額無料（キャンセル料なし）',
    requirementsNotes: '水着（事前着用）・着替え・タオル・日焼け止め / 泳力に不安のある方はライフジャケット貸出あり',
    bookingMode: 'request_based',
    locationAddress: '東京都小笠原村父島字東町（二見港すぐ）',
    phone: '04998-2-8888',
    email: 'info@ogasawara-bluemarine.jp',
    lineUrl: 'https://line.me/R/ti/p/@ogasawara_dolphin',
    instagramUrl: 'https://instagram.com/ogasawara_blue_dolphin',
    instagramAccount: '@ogasawara_blue_dolphin',
    websiteUrl: 'https://island.kira-tabi.com/activity/ogasawara-blue-dolphin-tour',
    photoUrls: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=800&q=80'
    ],
    features: [
      '野生イルカとの高確率遭遇＆ドルフィンスイム',
      '天然記念物「南島」ガイド同行上陸付き',
      'シュノーケル3点セット・ライフジャケット無料レンタル',
      '水中GoPro記念写真・動画無料プレゼント',
      'おがさわら丸欠航・悪天候時のキャンセル料完全無料'
    ],
    plans: [
      {
        id: 'plan-act-full-day',
        name: '【1番人気・1日】ドルフィンスイム ＋ 南島上陸 ＋ 兄島シュノーケル満喫ツアー',
        price: '¥13,500 / 1名',
        desc: '小笠原の海のハイライトをすべて網羅！イルカと一緒に泳ぎ、神秘の南島へ上陸する看板コース。',
        badge: '1番人気',
        duration: '約6.5時間（08:30〜15:00）',
        included: ['乗船料', 'ガイド料', '南島入島料', 'シュノーケル・フィン・マスクレンタル', '保険料', '水中写真データ'],
        requirements: ['水着', '着替え', '昼食（お弁当持参）'],
        maxCapacity: '定員12名'
      },
      {
        id: 'plan-act-half-day',
        name: '【半日】ドルフィンスイム ＆ サンセットクルーズ',
        price: '¥8,500 / 1名',
        desc: '午後からサクッとイルカに会いに行きたい方や、最終日の出港前におすすめ。',
        badge: '半日コース',
        duration: '約3.5時間（13:00〜16:30）',
        included: ['乗船料', 'ガイド料', '器材レンタル', 'ドリンク'],
        requirements: ['水着', 'タオル'],
        maxCapacity: '定員12名'
      },
      {
        id: 'plan-act-charter',
        name: '【完全貸切】ファミリー・グループ専用 ボートチャータープラン',
        price: '¥88,000 / 1隻（最大10名）',
        desc: '他のお客様を気にせず、自分たちのペースでイルカ探索や釣り・上陸を楽しむプライベートプラン。',
        badge: '貸切専用',
        duration: '1日（フレキシブル対応）',
        included: ['ボート1隻貸切', '専用キャプテン・ガイド', '全器材レンタル', 'ドローン・水中空撮データ'],
        requirements: ['事前打ち合わせ'],
        maxCapacity: '最大10名'
      }
    ],
    agentReview: {
      author: 'KIRATABI ネイチャー調査班',
      authorTitle: '世界自然遺産ガイド Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      rating: 5.0,
      title: 'ボニンブルーの海でイルカの親子と並走！一生の思い出になる至高の体験。',
      comment: '小笠原・父島を訪れたら絶対に外せないツアーです。船長のイルカを見つけるスピードが驚異的で、3頭のイルカの群れと至近距離でアイコンタクトしながら泳ぐことができました。南島の扇池の絶景も圧巻。スタッフさんがGoProでたくさん高画質な水中写真を撮ってプレゼントしてくれるのも素晴らしいホスピタリティです。',
      tags: ['イルカ遭遇率◎', '南島上陸', 'GoPro写真無料', '初心者安心'],
      date: '2026年 調査'
    }
  },

  'ishigaki-manta-diving': {
    id: 'ishigaki-manta-diving',
    type: 'activity',
    islandId: 'ishigaki',
    islandName: '石垣島',
    name: '石垣島 川平湾マンタダイビング ＆ 青の洞窟ツアー',
    category: '体験ダイビング・シュノーケリング・川平湾',
    catchphrase: '川平石崎マンタスクランブルへ！息をのむ大迫力のマンタ乱舞と極上の珊瑚礁ワールド。',
    description: '石垣島屈指のダイビングスポット「川平石崎マンタスクランブル」「マンタシティ」へ直行！世界中のダイバーが憧れる巨大マンタとの遭遇体験をお届けします。ライセンス不要の体験ダイビングプランも充実しており、専属インストラクターが1対1または少人数で手厚くサポートします。',
    priceRange: '¥11,000〜 / 1名',
    businessHours: '08:00 〜 18:00',
    pickupInfo: '石垣島南部市街地ホテル・川平エリア各リゾートへの無料送迎',
    depositPolicy: '台風・フェリー欠航時はキャンセル料無料',
    requirementsNotes: '水着・タオル / ダイビング後の当日飛行機搭乗は不可（減圧症防止のため）',
    bookingMode: 'request_based',
    locationAddress: '沖縄県石垣市字川平',
    phone: '0980-88-7766',
    email: 'manta@ishigaki-blue.jp',
    lineUrl: 'https://line.me/R/ti/p/@ishigaki_manta',
    instagramUrl: 'https://instagram.com/ishigaki_manta_dive',
    instagramAccount: '@ishigaki_manta_dive',
    websiteUrl: 'https://island.kira-tabi.com/activity/ishigaki-manta-diving',
    photoUrls: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80'
    ],
    features: [
      '世界的スポット「マンタスクランブル」高遭遇率',
      '完全少人数制（インストラクター1名にゲスト最大2名）',
      '市街地・川平地区ホテル無料送迎付き',
      'フル器材レンタル・温水シャワー・更衣室完備'
    ],
    plans: [
      {
        id: 'plan-manta-intro',
        name: '【ライセンス不要】初心者向けマンタ体験ダイビング（2ダイブ）',
        price: '¥15,000 / 1名',
        desc: '初めての方でも安心！1本目は浅瀬で練習し、2本目でいざマンタの棲むポイントへ。',
        badge: '1番人気',
        duration: '約5時間',
        included: ['全ダイビング器材', 'インストラクター指導料', '乗船料', '保険料', '水中写真データ'],
        requirements: ['10歳〜65歳の健康な方', '水着', 'タオル'],
        maxCapacity: '1組2名まで専属'
      },
      {
        id: 'plan-manta-snorkeling',
        name: '【お手軽】マンタポイント ＆ 珊瑚礁シュノーケリング',
        price: '¥9,800 / 1名',
        desc: '泳ぎが苦手な方やお子様連れもOK！水面から雄大に泳ぐマンタを観察。',
        badge: 'ファミリー人気',
        duration: '約3.5時間',
        included: ['シュノーケルセット', 'ライフジャケット', '送迎', '保険'],
        requirements: ['5歳以上', '水着', 'タオル'],
        maxCapacity: '定員8名'
      }
    ]
  }
};

export function getIslandServicesByIslandId(islandId: string): IslandServiceItem[] {
  return Object.values(ISLAND_SERVICES_DICTIONARY).filter(
    s => s.islandId === islandId || s.islandId === islandId.toLowerCase()
  );
}

export function getServiceById(id: string): IslandServiceItem | null {
  return ISLAND_SERVICES_DICTIONARY[id] || null;
}
