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
const RESTRICTED_ISLANDS = ['硫黄島（小笠原', '北硫黄島', '南硫黄島', '南鳥島', '沖大東島', '尖閣', '鳥島', '昭和硫黄島', 'ベヨネース', '須美寿島', '孀婦岩', '西之島', '沖ノ鳥島'];

// 日本最難関の絶海孤島・トカラ列島・南北大東・小笠原諸島 (★5 レジェンド)
const LEGENDARY_ISLANDS = [
  '父島', '母島', '兄島', '弟島', 
  '口之島', '中之島', '諏訪之瀬島', '平島', '悪石島', '小宝島', '宝島', 
  '南大東島', '北大東島', '礼文島', '利尻島'
];

// 外洋航路4時間以上・高い欠航リスク・遠隔秘境離島 (★4 エクストリーム)
const EXTREME_ISLANDS = [
  '青ヶ島', '御蔵島', '薩摩硫黄島', '硫黄島（鹿児島', '黒島（鹿児島', '竹島（鹿児島', '口永良部島', 
  '与那国島', '波照間島', '多良間島', '粟国島', '渡名喜島', 
  '喜界島', '徳之島', '沖永良部島', '与論島', '奄美大島', 
  '舳倉島', '飛島', '青島（愛媛', '神島（三重'
];

// 本格離島・中長距離定期船・航路1.5〜3時間 (★3 アドベンチャー)
const ADVENTURE_ISLANDS = [
  '八丈島', '伊豆大島', '神津島', '新島', '式根島', '三宅島', 
  '佐渡島', '粟島（新潟', 
  '隠岐の島', '西ノ島', '中ノ島（隠岐', '知夫里島', 
  '屋久島', '種子島', '壱岐', '対馬', '福江島', '中通島', '奈留島', '若松島', '小値賀島', 
  '久米島', '座間味島', '阿嘉島', '渡嘉敷島', '伊江島', '伊平屋島', '伊是名島', '水納島（沖縄', 
  '奥尻島', '天売島', '焼尻島'
];

// 高頻度近海フェリー・短時間アクセス・手軽な観光島 (★2 スタンダード)
const STANDARD_ISLANDS = [
  '初島', '答志島', '菅島', '坂手島', '日間賀島', '篠島', '佐久島', 
  '直島', '小豆島', '男木島', '女木島', '本島（香川', '犬島', '豊島（香川', 
  '友ヶ島', '家島', '男鹿島', '坊勢島', '仙酔島', '能美島', '似島', '厳島', '宮島', '興居島', '中島（愛媛', 
  '志賀島', '能古島', '姫島（大分', '桜島', '大島（山口'
];

// 本土・主島から「橋」で陸続きで渡れるイージーアクセス島 (★1 イージー)
const EASY_BRIDGED_ISLANDS = [
  '江の島', '城ヶ島', '古宇利島', '瀬底島', '屋ヶ地島', '浜比嘉島', '平安座島', '宮城島', '伊計島', '奥武島', 
  '能登島', '向島', '因島', '生口島', '大三島', '伯方島', '大島（愛媛', '周防大島', '屋代島', '角島', '彦島', 
  '渡鹿野島', '賢島', '竹島（愛知', '沖島（愛知', '新月島'
];

/**
 * 島の名前や属性からアクセス難易度（★1〜★5 または 0:制限島）を判定・取得する
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getIslandDifficulty(island: any): DifficultyInfo {
  if (!island) {
    return getDifficultyInfoByLevel(1);
  }

  const name = island.name || '';
  const access = island.access || '';
  const desc = island.description || '';

  // 鹿児島県・薩摩硫黄島は定期便フェリー「みしま」で一般上陸可能
  const isSatsumaIwo = name.includes('薩摩硫黄島') || (name.includes('鹿児島') && name.includes('硫黄島')) || String(island.id) === '343';

  // 一般立ち入り禁止・非公開島は対象外(0)を返す（小笠原の硫黄島等）
  if (!isSatsumaIwo && (RESTRICTED_ISLANDS.some(k => name.includes(k)) || island.is_conquest_target === false)) {
    return {
      level: 0,
      stars: '🔒 対象外',
      label: '🔒 渡航制限島（制覇対象外）',
      shortLabel: '渡航制限島（対象外）',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/15',
      borderColor: 'border-slate-500/50',
      badgeColor: 'bg-slate-700 text-slate-300 border border-slate-500',
      description: '自衛隊基地や自然保護区などのため一般人の渡航・上陸が不可能な島。ゲーム制覇・コンプリート達成の対象外（番外枠）です。'
    };
  }

  // 明示的なマッピング判定
  if (LEGENDARY_ISLANDS.some(k => name.includes(k))) return getDifficultyInfoByLevel(5);
  if (EXTREME_ISLANDS.some(k => name.includes(k))) return getDifficultyInfoByLevel(4);
  if (ADVENTURE_ISLANDS.some(k => name.includes(k))) return getDifficultyInfoByLevel(3);
  if (EASY_BRIDGED_ISLANDS.some(k => name.includes(k)) || access.includes('橋') || desc.includes('橋')) return getDifficultyInfoByLevel(1);
  if (STANDARD_ISLANDS.some(k => name.includes(k))) return getDifficultyInfoByLevel(2);

  // 地域・属性に応じた合理的なフォールバック推定
  const reg = island.region_id || '';
  if (['ogasawara', 'tokara'].includes(reg) || name.includes('小笠原') || name.includes('大東')) {
    return getDifficultyInfoByLevel(5);
  }
  if (['amami', 'yaeyama', 'remote'].includes(reg) || name.includes('トカラ') || name.includes('五島')) {
    return getDifficultyInfoByLevel(4);
  }
  if (['izu', 'okinawa', 'kagoshima', 'hokkaido', 'tsushima', 'iki', 'oki'].includes(reg)) {
    return getDifficultyInfoByLevel(3);
  }
  if (['sanriku', 'setouchi', 'biwako', 'kanto', 'chugoku', 'kyushu'].includes(reg)) {
    return getDifficultyInfoByLevel(2);
  }

  return getDifficultyInfoByLevel(2);
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
