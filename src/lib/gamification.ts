import { getIslandDifficulty } from './difficulty';

export interface PlayerLevelInfo {
  level: number;
  title: string;
  currentXP: number;
  nextLevelXP: number;
  progressPct: number;
  badgeColor: string;
  icon: string;
}

export interface IslandMasteryInfo {
  rankLevel: number; // 0: 未訪問, 1: ビジター(初回), 2: フリーク(3回orスポット2), 3: マスター(5回or全制覇)
  rankName: string;
  badgeText: string;
  color: string;
  bgColor: string;
  borderColor: string;
  nextGoal: string;
}

export interface SpecialTitle {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number; // 0 to 100
  category: 'archipelago' | 'difficulty' | 'supreme';
}

// 1. 旅人プレイヤーレベルの経験値テーブルと称号定義
export const PLAYER_LEVEL_TABLE = [
  { maxLv: 4, reqXP: 0, step: 100, title: '🌱 見習い島旅人', badgeColor: 'from-emerald-500 to-teal-600', icon: '🌱' },
  { maxLv: 9, reqXP: 400, step: 200, title: '⛵ アイランドウォーカー', badgeColor: 'from-blue-500 to-cyan-600', icon: '⛵' },
  { maxLv: 19, reqXP: 1400, step: 350, title: '🧭 外洋航路の開拓者', badgeColor: 'from-indigo-500 to-blue-600', icon: '🧭' },
  { maxLv: 34, reqXP: 4900, step: 500, title: '🌟 秘境諸島ハンター', badgeColor: 'from-purple-500 to-indigo-600', icon: '🌟' },
  { maxLv: 49, reqXP: 12400, step: 800, title: '🌋 八百万の海を巡る冒険者', badgeColor: 'from-amber-500 to-yellow-600', icon: '🌋' },
  { maxLv: 74, reqXP: 24400, step: 1200, title: '👑 日本諸島グランドマスター', badgeColor: 'from-amber-600 to-orange-600', icon: '👑' },
  { maxLv: 98, reqXP: 54400, step: 2000, title: '🔱 全海域統治・海神の使徒', badgeColor: 'from-rose-600 to-red-600', icon: '🔱' },
  { maxLv: 99, reqXP: 102400, step: 0, title: '🐉 日本全国 離島王・ポセイドン', badgeColor: 'from-amber-400 via-rose-500 to-indigo-600', icon: '🐉' }
];

/**
 * 獲得合計経験値(XP)から現在のプレイヤーレベルと次のレベルへの進捗を取得
 */
export function getPlayerLevelInfo(totalXP: number): PlayerLevelInfo {
  const xp = Math.max(0, totalXP);
  let currentLv = 1;
  let title = PLAYER_LEVEL_TABLE[0].title;
  let badgeColor = PLAYER_LEVEL_TABLE[0].badgeColor;
  let icon = PLAYER_LEVEL_TABLE[0].icon;
  let baseXP = 0;
  let nextXP = 100;

  for (let i = 0; i < PLAYER_LEVEL_TABLE.length; i++) {
    const band = PLAYER_LEVEL_TABLE[i];
    const prevBandMaxXP = band.reqXP;
    if (xp >= prevBandMaxXP) {
      title = band.title;
      badgeColor = band.badgeColor;
      icon = band.icon;
      if (band.step === 0) {
        // Lv.99 MAX
        return {
          level: 99,
          title,
          currentXP: xp,
          nextLevelXP: xp,
          progressPct: 100,
          badgeColor,
          icon
        };
      }
      // バンド内でレベル計算
      const xpInBand = xp - prevBandMaxXP;
      const lvGain = Math.floor(xpInBand / band.step);
      const startLv = i === 0 ? 1 : PLAYER_LEVEL_TABLE[i - 1].maxLv + 1;
      currentLv = Math.min(band.maxLv, startLv + lvGain);
      
      baseXP = prevBandMaxXP + (currentLv - startLv) * band.step;
      nextXP = baseXP + band.step;
    } else {
      break;
    }
  }

  const progressPct = nextXP > baseXP ? Math.min(100, Math.round(((xp - baseXP) / (nextXP - baseXP)) * 100)) : 100;

  return {
    level: currentLv,
    title,
    currentXP: xp,
    nextLevelXP: nextXP,
    progressPct,
    badgeColor,
    icon
  };
}

/**
 * 島への訪問回数とチェックインスポット数から、その島の「島マイスターランク」を取得
 */
export function getIslandMastery(visitCount: number, spotsCount: number = 0, islandName: string = '離島'): IslandMasteryInfo {
  const totalScore = (visitCount * 2) + spotsCount; // 訪問1回=2pt, スポット1ヶ所=1pt換算

  if (visitCount <= 0 && spotsCount <= 0) {
    return {
      rankLevel: 0,
      rankName: '未訪問',
      badgeText: '未到達',
      color: 'text-slate-400',
      bgColor: 'bg-slate-800',
      borderColor: 'border-slate-700',
      nextGoal: '一度訪れて到達記録をつけるとビジターメダル獲得！'
    };
  }

  if (totalScore >= 10 || visitCount >= 5) {
    return {
      rankLevel: 3,
      rankName: '島マスター',
      badgeText: `👑 ${islandName} マスター`,
      color: 'text-amber-400',
      bgColor: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10',
      borderColor: 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      nextGoal: '最高峰ランク到達！あなたはこの島のオフィシャルマスターです。'
    };
  }

  if (totalScore >= 5 || visitCount >= 3) {
    return {
      rankLevel: 2,
      rankName: '島フリーク',
      badgeText: `🌟 ${islandName} フリーク`,
      color: 'text-purple-300',
      bgColor: 'bg-purple-500/15',
      borderColor: 'border-purple-500/40',
      nextGoal: `あと${Math.max(1, 5 - visitCount)}回の訪問またはスポット制覇でマスター獲得！`
    };
  }

  return {
    rankLevel: 1,
    rankName: 'ビジター',
    badgeText: `🏝️ ${islandName} ビジター`,
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/40',
    nextGoal: '複数回訪問するか、島内の観光スポットを巡ると「フリーク」へ昇格！'
  };
}

/**
 * 全島データと訪問状況から、各諸島の特別称号および全国の究極称号の獲得状況を取得
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSpecialTitles(islands: any[], visitCounts: Record<string, number>): SpecialTitle[] {
  // 諸島ごとのターゲット名定義
  const ARCHIPELAGOS = [
    {
      id: 'izu',
      name: '伊豆七島の主（ロード・オブ・イズ）',
      description: '大島・利島・新島・式根島・神津島・三宅島・八丈島をはじめとする伊豆諸島を制覇',
      icon: '🏝️',
      keywords: ['大島', '利島', '新島', '式根島', '神津島', '三宅島', '御蔵島', '八丈島', '青ヶ島'],
      reqCount: 5, // 5島以上でアンロック
      category: 'archipelago' as const
    },
    {
      id: 'ogasawara',
      name: '東洋のガラパゴスの守護者（ボニン・マスター）',
      description: '東京から1000km、絶海の楽園・小笠原諸島（父島・母島）に到達し両島を踏破',
      icon: '🐋',
      keywords: ['父島', '母島'],
      reqCount: 2,
      category: 'archipelago' as const
    },
    {
      id: 'yaeyama',
      name: '南十字星を望む海王（ヤエヤマ・レジェンド）',
      description: '石垣島・西表島・竹富島・小浜島・黒島・波照間島・与那国島など八重山諸島を制覇',
      icon: '🌺',
      keywords: ['石垣島', '西表島', '竹富島', '小浜島', '黒島', '波照間島', '与那国島', '鳩間島', '新城島'],
      reqCount: 5,
      category: 'archipelago' as const
    },
    {
      id: 'tokara',
      name: '秘境十島を制せし冒険神（トカラ・アドベンチャラー）',
      description: '週数便のフェリーと荒波を乗り越え、トカラ列島（宝島・中之島・悪石島など）に到達',
      icon: '🌋',
      keywords: ['宝島', '中之島', '悪石島', '平島', '小宝島', '諏訪之瀬島', '口之島', '臥蛇島'],
      reqCount: 3,
      category: 'archipelago' as const
    },
    {
      id: 'amami',
      name: '奄美結の語り部（あまみ・ゆいの主）',
      description: '奄美大島・喜界島・徳之島・沖永良部島・与論島など奄美群島を巡礼・踏破',
      icon: '🌴',
      keywords: ['奄美大島', '喜界島', '徳之島', '沖永良部島', '与論島', '加計呂麻島', '請島', '与路島'],
      reqCount: 4,
      category: 'archipelago' as const
    },
    {
      id: 'miyako',
      name: '美ら海とサンゴの賢者（ミヤコブルー・マスター）',
      description: '宮古島・池間島・来間島・伊良部島・下地島・多良間島など宮古諸島の極上の海を踏破',
      icon: '🐬',
      keywords: ['宮古島', '池間島', '来間島', '伊良部島', '下地島', '多良間島', '大神島'],
      reqCount: 4,
      category: 'archipelago' as const
    },
    {
      id: 'daito',
      name: '絶海フロンティア開拓者（ダイトウ・マスター）',
      description: 'クレーン上陸で有名な絶海の孤島、北大東島・南大東島への上陸を達成',
      icon: '🏗️',
      keywords: ['北大東島', '南大東島'],
      reqCount: 2,
      category: 'archipelago' as const
    },
    {
      id: 'goto',
      name: '祈りと巡礼の海将（ゴトウ・マイスター）',
      description: '福江島・中通島・若松島・奈留島・久賀島など長崎五島列島の教会と島々を踏破',
      icon: '⛪',
      keywords: ['福江島', '中通島', '若松島', '奈留島', '久賀島', '小値賀島', '宇久島'],
      reqCount: 4,
      category: 'archipelago' as const
    },
    {
      id: 'setouchi',
      name: '多島美を愛でる瀬戸内の風（セトウチ・マスター）',
      description: '小豆島・直島・豊島・大三島・伯方島・因島など瀬戸内海の豊かなアートと自然の島々を踏破',
      icon: '🍋',
      keywords: ['小豆島', '直島', '豊島', '大三島', '伯方島', '因島', '生口島', '男木島', '女木島', '佐柳島'],
      reqCount: 6,
      category: 'archipelago' as const
    },
    {
      id: 'hokkaido',
      name: '北海の極致を極めしトラベラー（ノース・レジェンド）',
      description: '利尻島・礼文島・奥尻島・天売島・焼尻島など北海道の大自然溢れる離島群を踏破',
      icon: '🏔️',
      keywords: ['利尻島', '礼文島', '奥尻島', '天売島', '焼尻島'],
      reqCount: 3,
      category: 'archipelago' as const
    },
    {
      id: 'oki',
      name: 'ジオパークと神話の覇者（オキ・マイスター）',
      description: '島前・島後をはじめとする島根県隠岐諸島の壮大な地球の歴史を踏破',
      icon: '⛩️',
      keywords: ['島後', '西ノ島', '中之島', '知夫里島', '隠岐の島'],
      reqCount: 3,
      category: 'archipelago' as const
    },
    {
      id: 'osumi',
      name: '太古の森と黒潮の守護神（オオスム・マスター）',
      description: '屋久島・種子島・口永良部島・竹島・硫黄島・黒島・馬毛島など鹿児島大隅諸島と三島村を踏破',
      icon: '🌲',
      keywords: ['屋久島', '種子島', '口永良部島', '竹島', '硫黄島', '黒島', '馬毛島', '三島村'],
      reqCount: 3,
      category: 'archipelago' as const
    },
    {
      id: 'kerama_kume',
      name: '慶良間ブルーと琉球神話の語り部（ケラマ・クメ覇者）',
      description: '座間味島・阿嘉島・渡嘉敷島・久米島・久高島・伊江島・津堅島など沖縄本島周辺の離島群を踏破',
      icon: '🐠',
      keywords: ['座間味島', '阿嘉島', '渡嘉敷島', '久米島', '久高島', '伊江島', '津堅島', '伊是名島', '伊平屋島', '粟国島', '渡名喜島', '慶留間島'],
      reqCount: 4,
      category: 'archipelago' as const
    },
    {
      id: 'tsushima_iki',
      name: '国境の守り人・国創り神話の覇者（ツシマ・イキ マスター）',
      description: '対馬・壱岐および平戸・九十九島の島々（度島・的山大島・生月島・鷹島など）を踏破',
      icon: '🛡️',
      keywords: ['対馬', '壱岐', '度島', '的山大島', '生月島', '鷹島', '青島', '高島'],
      reqCount: 3,
      category: 'archipelago' as const
    },
    {
      id: 'koshiki',
      name: '断崖伝説・甑島列島縦断マスター（コシキ・レジェンド）',
      description: '上甑島・中甑島・下甑島および周辺離島の壮大なナポレオン岩と断崖絶壁を踏破',
      icon: '🦅',
      keywords: ['上甑島', '中甑島', '下甑島', '甑島'],
      reqCount: 2,
      category: 'archipelago' as const
    },
    {
      id: 'amakusa',
      name: '天草キリシタンと多島海の巡礼者（アマクサ・マイスター）',
      description: '天草下島・天草上島・御所浦島・湯島・獅子島など熊本・八代海の豊かな多島海を踏破',
      icon: '✝️',
      keywords: ['天草下島', '天草上島', '御所浦島', '湯島', '獅子島', '桂島', '牧島', '横浦島'],
      reqCount: 3,
      category: 'archipelago' as const
    },
    {
      id: 'bungo_uwakai',
      name: '豊後水道と黒潮交差路を極めし航海神',
      description: '愛媛の宇和海離島（日振島・戸島等）、大分の島（姫島・保戸島等）、宮崎の島野浦島を踏破',
      icon: '⚓',
      keywords: ['日振島', '戸島', '嘉島', '姫島', '保戸島', '大入島', '無垢島', '島野浦島', '津久見島'],
      reqCount: 4,
      category: 'archipelago' as const
    },
    {
      id: 'kanto_tokai',
      name: '首都圏・東海フェリー航路の達人（カントウ・トウカイ主）',
      description: '江の島・猿島・初島・答志島・菅島・神島など関東＆三重県の近海有人離島を踏破',
      icon: '🚢',
      keywords: ['江の島', '猿島', '初島', '答志島', '菅島', '神島', '坂手島', '間崎島', '渡鹿野島'],
      reqCount: 3,
      category: 'archipelago' as const
    },
    {
      id: 'sea_of_japan',
      name: '日本海荒波の覇者・佐渡と北国の孤島を極めし者',
      description: '黄金の歴史ある佐渡島、舳倉島、飛島、金華山、田代島（ネコ島）など北日本の孤島群を踏破',
      icon: '🌊',
      keywords: ['佐渡島', '舳倉島', '飛島', '金華山', '田代島', '網地島', '寒風沢島', '桂島', '野々島'],
      reqCount: 3,
      category: 'archipelago' as const
    },
    {
      id: 'genkai_bocho',
      name: '玄界灘と防長諸島を渡る海風（ゲンカイ・ボウチョウ王）',
      description: '能古島・志賀島・相島・玄界島および山口県関門・周防灘の島々（角島・見島・周防大島等）を踏破',
      icon: '💨',
      keywords: ['能古島', '志賀島', '相島', '玄界島', '小川島', '加唐島', '松島', '角島', '見島', '周防大島', '柱島', '情島', '浮島', '前島', '蓋井島'],
      reqCount: 5,
      category: 'archipelago' as const
    }
  ];

  // 各諸島の判定
  const titles: SpecialTitle[] = ARCHIPELAGOS.map(arch => {
    const matchingIslands = islands.filter(i => arch.keywords.some(k => (i.name || '').includes(k)));
    const visitedInArch = matchingIslands.filter(i => (visitCounts[i.id] || 0) > 0);
    const progress = Math.min(100, Math.round((visitedInArch.length / arch.reqCount) * 100));
    return {
      id: arch.id,
      name: arch.name,
      description: arch.description,
      icon: arch.icon,
      unlocked: visitedInArch.length >= arch.reqCount,
      progress,
      category: arch.category
    };
  });

  // 難易度別特別称号
  const visitedLegendaryCount = islands.filter(i => (visitCounts[i.id] || 0) > 0 && getIslandDifficulty(i).level === 5).length;
  titles.push({
    id: 'legend_5',
    name: '絶海を愛しすぎた冒険神（極・秘境王）',
    description: '最も到達困難な★5 レジェンド島（青ヶ島・母島・大東諸島・トカラなど）を3島以上踏破',
    icon: '🐉',
    unlocked: visitedLegendaryCount >= 3,
    progress: Math.min(100, Math.round((visitedLegendaryCount / 3) * 100)),
    category: 'difficulty'
  });

  // 究極称号（戦時中の「大日本」を排除し、現代的で壮大・名誉ある名称へ改称）
  const totalVisitedIslandsCount = islands.filter(i => (visitCounts[i.id] || 0) > 0 && getIslandDifficulty(i).level > 0).length;
  titles.push({
    id: 'supreme_50',
    name: '日本全国 離島王（グランド・アイランド・マスター）',
    description: '日本全国432島のうち、合計50島以上の島々に到達した栄誉あるトラベラーに贈られる最高峰称号',
    icon: '👑',
    unlocked: totalVisitedIslandsCount >= 50,
    progress: Math.min(100, Math.round((totalVisitedIslandsCount / 50) * 100)),
    category: 'supreme'
  });

  titles.push({
    id: 'supreme_100',
    name: '八百万の離島を極めし海王（ポセイドン・オブ・ジャパン）',
    description: '日本全国100島以上の有人離島を踏破し、海と島の全魅力と文化を知り尽くした伝説の旅人',
    icon: '🔱',
    unlocked: totalVisitedIslandsCount >= 100,
    progress: Math.min(100, Math.round((totalVisitedIslandsCount / 100) * 100)),
    category: 'supreme'
  });

  return titles;
}

/**
 * 島の難易度と訪問回数、スポット巡りから今回獲得する経験値(XP)を算出
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateIslandXP(island: any, isFirstVisit: boolean, newSpotsVisited: number = 0): number {
  const diff = getIslandDifficulty(island);
  if (diff.level <= 0) return 0; // 制限島はXPなし

  let baseXP = 50; // ★1 default
  if (diff.level === 5) baseXP = 500;
  else if (diff.level === 4) baseXP = 350;
  else if (diff.level === 3) baseXP = 200;
  else if (diff.level === 2) baseXP = 100;

  const visitXP = isFirstVisit ? baseXP : Math.round(baseXP * 0.5); // 2回目以降のリピート訪問もベースの50%を獲得！
  const spotsXP = newSpotsVisited * Math.round(baseXP * 0.1); // スポット1箇所につきベースの10%ボーナス

  return visitXP + spotsXP;
}
