// 離島のアクセス難易度（5段階）とシリアルナンバー生成のマスターロジック

export interface DifficultyInfo {
  level: number; // 1 to 5
  stars: string;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  description: string;
}

// 既知の代表島難易度マッピング (名前またはIDからの部分一致)
// 一般立入禁止・無人火山の特殊対象外島 (コンプリート対象から除外 または EX枠)
const RESTRICTED_ISLANDS = ['硫黄島', '南鳥島', '沖大東島', '尖閣', '鳥島', '昭和硫黄島', 'ベヨネース', '須美寿島', '孀婦岩', '北硫黄島', '西之島', '沖ノ鳥島'];

// 一般人が実際に渡航可能な究極の到達困難島 (★5 レジェンド)
const LEGENDARY_ISLANDS = ['青ヶ島', '母島', '南大東島', '北大東島', '宝島', '中之島', '悪石島', '平島', '小宝島', '諏訪之瀬島', '口之島'];

// 一般人が渡航可能な本格秘境・遠隔島 (★4 エクストリーム)
const EXTREME_ISLANDS = ['与那国島', '波照間島', '父島', '喜界島', '粟国島', '多良間島', '舳倉島', '飛島', '神島'];

// 本格冒険島・定期便に注意が必要な島 (★3 アドベンチャー)
const ADVENTURE_ISLANDS = ['利尻島', '礼文島', '御蔵島', '三宅島', '神津島', '奥尻島', '与論島', '沖永良部島', '徳之島', '座間味島', '阿嘉島', '久米島', '渡嘉敷島', '隠岐の島'];

// 定期フェリー・インフラが整った島 (★2 スタンダード)
const STANDARD_ISLANDS = ['八丈島', '伊豆大島', '佐渡島', '屋久島', '宮古島', '西表島', '種子島', '壱岐', '対馬', '五島', '福江島', '中通島', '奄美大島', '新島', '式根島', '答志島', '日間賀島'];

/**
 * 島の名前や属性からアクセス難易度（★1〜★5 または 0:制限島）を判定・取得する
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getIslandDifficulty(island: any): DifficultyInfo {
  if (!island) {
    return getDifficultyInfoByLevel(1);
  }

  const name = island.name || '';

  // 一般立ち入り禁止・非公開島は対象外(0)を返す
  if (RESTRICTED_ISLANDS.some(k => name.includes(k))) {
    return {
      level: 0,
      stars: '⛔ 対象外',
      label: 'EX 一般立入制限島',
      shortLabel: '対象外/制限島',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/15',
      borderColor: 'border-slate-500/50',
      badgeColor: 'bg-slate-700 text-slate-300 border border-slate-500',
      description: '自衛隊気象観測施設や自然保護区、領土保全区域などのため一般人の渡航・上陸が不可能な島。コンプリート達成の対象外です。'
    };
  }

  // もしDBに difficulty フィールドがあれば優先
  if (island.difficulty && typeof island.difficulty === 'number' && island.difficulty >= 1 && island.difficulty <= 5) {
    return getDifficultyInfoByLevel(island.difficulty);
  }
  
  if (LEGENDARY_ISLANDS.some(k => name.includes(k))) {
    return getDifficultyInfoByLevel(5);
  }
  if (EXTREME_ISLANDS.some(k => name.includes(k))) {
    return getDifficultyInfoByLevel(4);
  }
  if (ADVENTURE_ISLANDS.some(k => name.includes(k))) {
    return getDifficultyInfoByLevel(3);
  }
  if (STANDARD_ISLANDS.some(k => name.includes(k))) {
    return getDifficultyInfoByLevel(2);
  }

  // デフォルト分類: 座標や地域から推定 (東京小笠原や沖縄離島等は★3以上、瀬戸内等は★1〜★2)
  if (island.region_id === 'tokyo' && (name.includes('島') || name.includes('列島'))) {
    return getDifficultyInfoByLevel(3);
  }
  if (island.region_id && ['okinawa', 'kagoshima', 'hokkaido'].includes(island.region_id)) {
    return getDifficultyInfoByLevel(2);
  }

  return getDifficultyInfoByLevel(1);
}

/**
 * 難易度レベル（1〜5）に応じたデザイン情報・説明を取得
 */
export function getDifficultyInfoByLevel(level: number): DifficultyInfo {
  switch (level) {
    case 5:
      return {
        level: 5,
        stars: '★★★★★',
        label: '★5 レジェンド到達困難島',
        shortLabel: '★5 レジェンド',
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/15',
        borderColor: 'border-rose-500/50',
        badgeColor: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-rose-500/30',
        description: '定期船がなくチャーター船や特別巡航船等でのみ接近・上陸が許される究極の到達困難島。'
      };
    case 4:
      return {
        level: 4,
        stars: '★★★★☆',
        label: '★4 エクストリーム秘境島',
        shortLabel: '★4 エクストリーム',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/15',
        borderColor: 'border-purple-500/50',
        badgeColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/30',
        description: '週数便の航路または10時間以上の長期航路、欠航リスクが高く強い冒険心が求められる秘境離島。'
      };
    case 3:
      return {
        level: 3,
        stars: '★★★☆☆',
        label: '★3 アドベンチャー離島',
        shortLabel: '★3 アドベンチャー',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/15',
        borderColor: 'border-amber-500/50',
        badgeColor: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-amber-500/30',
        description: '1日1〜2便の定期船や天候による運休を考慮し、事前の計画と宿泊手配が必要な本格離島。'
      };
    case 2:
      return {
        level: 2,
        stars: '★★☆☆☆',
        label: '★2 スタンダード離島',
        shortLabel: '★2 スタンダード',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/15',
        borderColor: 'border-blue-500/50',
        badgeColor: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-500/30',
        description: '1日複数便のフェリーや高速船があり、週末の旅行や1〜2泊で手軽かつ充実した旅が楽しめる人気の島。'
      };
    case 1:
    default:
      return {
        level: 1,
        stars: '★☆☆☆☆',
        label: '★1 イージーアクセス',
        shortLabel: '★1 イージー',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/15',
        borderColor: 'border-emerald-500/50',
        badgeColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/30',
        description: '本土と橋で接続されているか高頻度フェリーがあり、日帰りで気軽・快適に訪れられる観光島。'
      };
  }
}

/**
 * 到達証明書の一連シリアルナンバーを生成（No.0001形式＋ハッシュ）
 */
export function getFormattedSerial(islandId?: string, visitNum?: number): string {
  const idStr = (islandId || 'ISL').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const numberPart = visitNum && visitNum > 0 ? String(visitNum).padStart(4, '0') : String(Math.floor(1001 + Math.random() * 8999));
  const yearStr = new Date().getFullYear();
  return `KT-${yearStr}-${idStr.slice(0, 4)}-No.${numberPart}`;
}

/**
 * 全島とユーザー到達ステータスから、難易度別（★1〜★5）の到達数・トロフィー達成状況を算出
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateDifficultyStats(islands: any[], statuses: Record<string, string>) {
  const stats = {
    level1: { total: 0, visited: 0, title: '★1 イージー制覇', icon: '🌱' },
    level2: { total: 0, visited: 0, title: '★2 スタンダード制覇', icon: '⛵' },
    level3: { total: 0, visited: 0, title: '★3 アドベンチャー制覇', icon: '🧭' },
    level4: { total: 0, visited: 0, title: '★4 エクストリーム秘境島制覇', icon: '🌋' },
    level5: { total: 0, visited: 0, title: '★5 レジェンド到達困難島制覇', icon: '👑' },
  };

  islands.forEach(island => {
    const diff = getIslandDifficulty(island);
    if (!diff || diff.level < 1 || diff.level > 5) return; // 制限島(Level 0)などは踏破母数から除外
    const lvl = diff.level as 1 | 2 | 3 | 4 | 5;
    const key = `level${lvl}` as keyof typeof stats;
    if (stats[key]) {
      stats[key].total += 1;
      if (statuses[island.id] === 'visited') {
        stats[key].visited += 1;
      }
    }
  });

  return stats;
}
