// オリジナル島旅コンパニオンキャラクター進化システム定義

export type CompanionId = 'shimamaru' | 'hoshidama' | 'nagisa' | 'iwabiko';

export interface CompanionStageInfo {
  stage: number;
  minLevel: number;
  name: string;
  title: string;
  icon: string;
  skillName: string;
  skillDesc: string;
  badgeGradient: string;
  textColor: string;
}

export interface CompanionCharacter {
  id: CompanionId;
  name: string;
  theme: string;
  categoryTag: string;
  description: string;
  stages: CompanionStageInfo[];
}

export const COMPANION_CHARACTERS: Record<CompanionId, CompanionCharacter> = {
  shimamaru: {
    id: 'shimamaru',
    name: 'シママル',
    theme: '海風と極上ケラマブルーの守護精霊',
    categoryTag: '海の透明度＆ダイビング',
    description: '澄み渡る離島のエメラルドグリーンの海から生まれたウミガメの精霊。旅人と共に島を巡ることで大海の竜神へと成長していく。',
    stages: [
      {
        stage: 1,
        minLevel: 1,
        name: '見習い子ガメ精霊 シママル',
        title: 'Lv.1〜9 ビーチウォーカー',
        icon: '🐢',
        skillName: 'ブルーウォーター探知',
        skillDesc: 'シュノーケリングに最適な透明度20m以上のビーチスポットを優先案内する',
        badgeGradient: 'from-emerald-500 to-teal-600',
        textColor: 'text-emerald-700'
      },
      {
        stage: 2,
        minLevel: 10,
        name: '蒼海の竜姫 シママル・エメラルド',
        title: 'Lv.10〜24 外洋サンゴの守護者',
        icon: '🐬',
        skillName: 'サンゴ礁と海流ナビゲート',
        skillDesc: 'ウミガメとの遭遇率が高い秘境ポイントやケラマブルー・ミヤコブルー絶景を検知',
        badgeGradient: 'from-teal-500 to-cyan-600',
        textColor: 'text-teal-700'
      },
      {
        stage: 3,
        minLevel: 25,
        name: '海神リヴァイアサン・シママル',
        title: 'Lv.25〜49 八百万の海の支配竜',
        icon: '🐉',
        skillName: '全海域・天候潮流パーフェクト予測',
        skillDesc: '絶海諸島へのフェリー欠航リスク回避と最高のシュノーケル日和を導き出す',
        badgeGradient: 'from-blue-600 to-indigo-700',
        textColor: 'text-blue-800'
      },
      {
        stage: 4,
        minLevel: 50,
        name: '神話の守護海神竜皇「極・シママル」',
        title: 'Lv.50〜 伝説の島旅王ガーディアン',
        icon: '👑🐉',
        skillName: '日本全国 338島 海洋踏破のキセキ',
        skillDesc: 'すべての離島海域で最高の祝福と透明度を誇る究極の海の守護竜',
        badgeGradient: 'from-amber-400 via-emerald-500 to-blue-600',
        textColor: 'text-emerald-900'
      }
    ]
  },
  hoshidama: {
    id: 'hoshidama',
    name: 'ホシダマ',
    theme: '国際星空保護区とダークスカイの天星精霊',
    categoryTag: '満天の星空＆天体観測',
    description: '人工光のない絶海離島の夜空から舞い降りた星屑のフクロウ。旅の夜を照らし、天の川と南十字星へと誘う。',
    stages: [
      {
        stage: 1,
        minLevel: 1,
        name: '星屑のフクロウ ホシダマ',
        title: 'Lv.1〜9 スターゲイザー',
        icon: '🦉',
        skillName: '天体観測地ファインダー',
        skillDesc: '街灯が少なく夜空が奇麗に見える島内の天体スポットをガイドする',
        badgeGradient: 'from-indigo-600 to-purple-600',
        textColor: 'text-indigo-700'
      },
      {
        stage: 2,
        minLevel: 10,
        name: '銀河の天星使者 ホシダマ・ルナ',
        title: 'Lv.10〜24 南十字星観測の賢者',
        icon: '🌌',
        skillName: 'ダークスカイ＆流星群キャッチ',
        skillDesc: '波照間島や神津島などで南十字星や天の川を完璧に捕捉する観測時間帯を案内',
        badgeGradient: 'from-purple-600 to-pink-600',
        textColor: 'text-purple-700'
      },
      {
        stage: 3,
        minLevel: 25,
        name: '鳳凰・ダークスカイフェニックス',
        title: 'Lv.25〜49 宇宙銀河を飛翔する神鳥',
        icon: '🦅✨',
        skillName: '月齢ゼロ・極夜天体パーフェクトナビ',
        skillDesc: '新月と快晴が重なる奇跡の夜空と小笠原・八重山・隠岐の秘密天体スポットを開放',
        badgeGradient: 'from-violet-600 to-indigo-900',
        textColor: 'text-violet-800'
      },
      {
        stage: 4,
        minLevel: 50,
        name: '極・大宇宙と銀河の天星神 ホシダマ',
        title: 'Lv.50〜 宇宙をまといし守護大天使',
        icon: '👑🌌',
        skillName: '日本全国 星空保護区コンプリート神話',
        skillDesc: '日本の夜空を愛するすべての人に捧ぐ、最も輝かしい星の精霊王',
        badgeGradient: 'from-amber-400 via-purple-600 to-indigo-950',
        textColor: 'text-purple-900'
      }
    ]
  },
  nagisa: {
    id: 'nagisa',
    name: 'ナギサ',
    theme: '女子旅・洗練カフェ＆リトリートの楽園妖精',
    categoryTag: '女子旅・カフェ・コスメ・安全快適',
    description: '瀬戸内のオリーブの風と沖縄の白砂ビーチが育んだ癒やしの妖精。女性一人旅や初心者も安心して楽しめる極上リトリートをナビゲート。',
    stages: [
      {
        stage: 1,
        minLevel: 1,
        name: 'サンゴとレモンの妖精 ナギサ',
        title: 'Lv.1〜9 島カフェ＆コスメ愛好家',
        icon: '🌺',
        skillName: 'おしゃれ島カフェ＆安全ナビ',
        skillDesc: '女性や初心者でも安心して入れるおしゃれな海辺カフェ・スイーツ店をセレクト',
        badgeGradient: 'from-pink-500 to-rose-500',
        textColor: 'text-pink-700'
      },
      {
        stage: 2,
        minLevel: 10,
        name: '癒やしとヴィラリトリートの女神 ナギサ',
        title: 'Lv.10〜24 フォトジェニック＆コスメの達人',
        icon: '🍹',
        skillName: '島ハーブスパ＆現代アート巡り',
        skillDesc: '直島アート銭湯や小豆島オリーブスパ、絶景オーシャンビューホテルなどのご褒美旅を厳選',
        badgeGradient: 'from-rose-500 to-amber-500',
        textColor: 'text-rose-700'
      },
      {
        stage: 3,
        minLevel: 25,
        name: '極上デトックスの楽園プリンセス',
        title: 'Lv.25〜49 五感を磨くリトリートマスター',
        icon: '👑💖',
        skillName: '隠れ家プライベートリトリート開拓',
        skillDesc: '心と体を究極に癒やすオーベルジュやヨガスポット、治安最高クラスの安心ルートを確約',
        badgeGradient: 'from-fuchsia-600 to-pink-600',
        textColor: 'text-fuchsia-800'
      },
      {
        stage: 4,
        minLevel: 50,
        name: '愛と楽園の太陽女神「極・ナギサ」',
        title: 'Lv.50〜 日本中の島々を魅了する女神',
        icon: '👑☀️',
        skillName: '日本全国 女子旅リトリート完全制覇',
        skillDesc: 'すべての旅行者に癒やしと最高の輝きを与える、太陽と美の最高守護神',
        badgeGradient: 'from-amber-400 via-pink-500 to-rose-600',
        textColor: 'text-rose-900'
      }
    ]
  },
  iwabiko: {
    id: 'iwabiko',
    name: 'イワビコ',
    theme: '絶景秘湯と極上サウナ＆ウェルネスの大地神',
    categoryTag: '絶景秘湯・温泉＆アウトドアサウナ',
    description: '島の火山と大地の熱脈を守り続ける温泉カピバラ神。屋久島の海中温泉から式根島・八丈島の大自然ロウリュまで、ととのいの極地へと導く。',
    stages: [
      {
        stage: 1,
        minLevel: 1,
        name: '温泉カピバラ精霊 イワビコ',
        title: 'Lv.1〜9 温泉巡りビギナー',
        icon: '♨️',
        skillName: '秘湯・島露天風呂ナビゲート',
        skillDesc: '港近くの島温泉や気軽に立ち寄れる絶景足湯スポットをピンポイントで案内',
        badgeGradient: 'from-amber-600 to-orange-600',
        textColor: 'text-amber-800'
      },
      {
        stage: 2,
        minLevel: 10,
        name: '秘湯とロウリュのシーサー神 イワビコ',
        title: 'Lv.10〜24 ととのい＆海中温泉探求者',
        icon: '🦁🔥',
        skillName: '潮見表＆絶景サウナタイミング導出',
        skillDesc: '平内海中温泉や地鉈温泉など、干満の差で現れる幻の野湯の入浴ベストタイムを予測',
        badgeGradient: 'from-orange-600 to-red-600',
        textColor: 'text-orange-800'
      },
      {
        stage: 3,
        minLevel: 25,
        name: 'マグニチュード秘湯の大地神獣',
        title: 'Lv.25〜49 極上の温浴＆ロウリュマスター',
        icon: '🌋🧖‍♂️',
        skillName: 'アウトドアテントサウナ＆絶景露天制覇',
        skillDesc: '日本各地のリゾートホテルサウナと、大自然の中での冷水浴スポットを完璧に網羅',
        badgeGradient: 'from-red-600 to-amber-700',
        textColor: 'text-red-900'
      },
      {
        stage: 4,
        minLevel: 50,
        name: '日本全国温泉とサウナの大霊神「極・イワビコ」',
        title: 'Lv.50〜 究極のととのい＆秘湯大王',
        icon: '👑🔥',
        skillName: '日本の島湯・サウナ聖地コンプリート',
        skillDesc: '大地の熱と海風を融合させ、あらゆる旅人に最高潮のととのいを与える温泉の大霊神',
        badgeGradient: 'from-yellow-400 via-orange-600 to-red-700',
        textColor: 'text-red-950'
      }
    ]
  }
};

/**
 * プレイヤーの経験値やレベルをもとに、選択したコンパニオンの進化段階情報を取得する
 */
export function getCompanionStageInfo(companionId: CompanionId, playerLevel: number): CompanionStageInfo {
  const char = COMPANION_CHARACTERS[companionId] || COMPANION_CHARACTERS.shimamaru;
  let currentStage = char.stages[0];

  for (const stage of char.stages) {
    if (playerLevel >= stage.minLevel) {
      currentStage = stage;
    }
  }

  return currentStage;
}
