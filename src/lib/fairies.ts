export type FairyRarity = 'NORMAL' | 'RARE' | 'EPIC' | 'SPOT_EXCLUSIVE';

export interface FairyVisual {
  icon: string; // フォールバック絵文字
  imageUrl?: string; // プレミアムイラスト画像のパス
  colorFrom: string;
  colorTo: string;
  shadowColor: string;
  sparkleColor: string;
}

export interface IslandFairy {
  id: string;
  baseFairyId?: string; // コラボ等でベースとなる妖精ID
  name: string;
  theme: string;
  region_id?: string; // If tied to a region
  island_id?: string; // If tied to a specific island (e.g. for collab)
  rarity: FairyRarity;
  collabSponsor?: string;
  visual: FairyVisual;
  description: string;
}

export const FAIRIES_MASTER: IslandFairy[] = [
  {
    id: 'fairy_okinawa_main',
    name: 'ルリ (Ruri)',
    theme: '琉球の波の妖精',
    region_id: 'okinawa_main',
    rarity: 'NORMAL',
    visual: {
      icon: '🐬',
      imageUrl: '/fairies/ruri.png',
      colorFrom: 'from-cyan-400',
      colorTo: 'to-blue-600',
      shadowColor: 'shadow-cyan-500/50',
      sparkleColor: 'text-cyan-200'
    },
    description: '沖縄本島周辺の美しい波間に住む妖精。見つけた人に清らかな心と癒やしをもたらすと言われています。'
  },
  {
    id: 'fairy_yaeyama',
    name: 'ティダ (Tida)',
    theme: '八重山の太陽精霊',
    region_id: 'yaeyama',
    rarity: 'RARE',
    visual: {
      icon: '🌺',
      imageUrl: '/fairies/tida.png',
      colorFrom: 'from-rose-400',
      colorTo: 'to-orange-500',
      shadowColor: 'shadow-rose-500/50',
      sparkleColor: 'text-rose-200'
    },
    description: '八重山の力強い太陽の光から生まれた妖精。南国の情熱と底抜けの明るさで、旅人を笑顔にします。'
  },
  {
    id: 'fairy_amami',
    name: 'シダ (Shida)',
    theme: '奄美の深緑の妖精',
    region_id: 'amami',
    rarity: 'NORMAL',
    visual: {
      icon: '🌿',
      imageUrl: '/fairies/shida.png',
      colorFrom: 'from-emerald-400',
      colorTo: 'to-teal-600',
      shadowColor: 'shadow-emerald-500/50',
      sparkleColor: 'text-emerald-200'
    },
    description: 'アマミノクロウサギと仲良しの森の妖精。マングローブの森の奥深くにひっそりと暮らしています。'
  },
  {
    id: 'fairy_miyako',
    name: 'ブルー (Blue)',
    theme: '宮古ブルーの化身',
    region_id: 'miyako',
    rarity: 'EPIC',
    visual: {
      icon: '🦋',
      imageUrl: '/fairies/blue.png',
      colorFrom: 'from-sky-300',
      colorTo: 'to-blue-700',
      shadowColor: 'shadow-sky-500/60',
      sparkleColor: 'text-sky-100'
    },
    description: '東洋一美しいと言われる宮古島の海の青さが結晶化して生まれた奇跡の妖精。滅多に姿を現しません。'
  },
  {
    id: 'fairy_ogasawara',
    name: 'ホシ (Hoshi)',
    theme: 'ボニンブルーの星妖精',
    region_id: 'ogasawara',
    rarity: 'EPIC',
    visual: {
      icon: '🐋',
      colorFrom: 'from-indigo-400',
      colorTo: 'to-purple-700',
      shadowColor: 'shadow-indigo-500/50',
      sparkleColor: 'text-indigo-200'
    },
    description: '小笠原の深い海と、満天の星空を繋ぐクジラの妖精。はるか遠くの海から旅人を歓迎してくれます。'
  },
  {
    id: 'fairy_izu',
    name: 'ツバキ (Tsubaki)',
    theme: '伊豆の火の精霊',
    region_id: 'izu',
    rarity: 'NORMAL',
    visual: {
      icon: '🌸',
      colorFrom: 'from-pink-400',
      colorTo: 'to-rose-600',
      shadowColor: 'shadow-pink-500/50',
      sparkleColor: 'text-pink-200'
    },
    description: '伊豆大島の椿の花から生まれた妖精。温泉と暖かい場所が大好きで、湯けむりに乗って移動します。'
  },
  {
    id: 'fairy_okinawa_manza',
    name: 'ゾウ (Zou)',
    theme: '万座毛の崖精霊',
    island_id: 'okinawa_main',
    rarity: 'SPOT_EXCLUSIVE',
    visual: {
      icon: '🐘',
      imageUrl: '/fairies/zou.png',
      colorFrom: 'from-green-600',
      colorTo: 'to-slate-800',
      shadowColor: 'shadow-green-500/50',
      sparkleColor: 'text-green-200'
    },
    description: '沖縄本島の景勝地「万座毛」に棲む力強い精霊。雄大な自然のエネルギーを旅人に分け与えます。'
  },
  {
    id: 'fairy_ishigaki_kabira',
    name: 'カビラ (Kabira)',
    theme: '川平湾の透明な妖精',
    island_id: 'ishigaki',
    rarity: 'SPOT_EXCLUSIVE',
    visual: {
      icon: '🐠',
      imageUrl: '/fairies/kabira.png',
      colorFrom: 'from-teal-300',
      colorTo: 'to-emerald-600',
      shadowColor: 'shadow-teal-500/50',
      sparkleColor: 'text-teal-200'
    },
    description: '石垣島・川平湾の透き通る海面から生まれた妖精。太陽の光を浴びて七色に輝くと言われています。'
  },
  {
    id: 'fairy_miyako_yonaha',
    name: 'マイ (Mai)',
    theme: '与那覇前浜の砂妖精',
    island_id: 'miyako',
    rarity: 'SPOT_EXCLUSIVE',
    visual: {
      icon: '🐚',
      imageUrl: '/fairies/mai.png',
      colorFrom: 'from-amber-100',
      colorTo: 'to-orange-300',
      shadowColor: 'shadow-amber-500/50',
      sparkleColor: 'text-amber-100'
    },
    description: '東洋一白い砂浜と呼ばれる与那覇前浜ビーチのサラサラな砂から生まれた妖精。'
  },
  {
    id: 'fairy_amami_mangrove',
    name: 'グル (Guru)',
    theme: '黒潮マングローブの主',
    island_id: 'amami',
    rarity: 'SPOT_EXCLUSIVE',
    visual: {
      icon: '🐊',
      imageUrl: '/fairies/guru.png',
      colorFrom: 'from-lime-500',
      colorTo: 'to-green-900',
      shadowColor: 'shadow-lime-500/50',
      sparkleColor: 'text-lime-200'
    },
    description: '奄美大島のマングローブ林を静かに見守る古き森の主。大自然の神秘を肌で感じた者にのみ姿を現します。'
  },
  // --- 新規追加：全国エリア守護妖精（9体） ---
  {
    id: 'fairy_hokkaido',
    name: 'ユキ (Yuki)',
    theme: '北海道の雪キツネ',
    region_id: 'hokkaido',
    rarity: 'NORMAL',
    visual: { icon: '🦊', colorFrom: 'from-blue-100', colorTo: 'to-slate-300', shadowColor: 'shadow-blue-200/50', sparkleColor: 'text-blue-100' },
    description: '北海道のふかふかの雪から生まれたキタキツネの妖精。冷たい風に乗って旅人を優しく見守ります。'
  },
  {
    id: 'fairy_tohoku',
    name: 'リン (Rin)',
    theme: '東北の森とりんご',
    region_id: 'tohoku',
    rarity: 'NORMAL',
    visual: { icon: '🍎', colorFrom: 'from-red-400', colorTo: 'to-rose-700', shadowColor: 'shadow-red-500/50', sparkleColor: 'text-red-200' },
    description: '東北の豊かな森と美味しいりんごの精霊。出会うと心が温まり、お腹が空いてくると言われています。'
  },
  {
    id: 'fairy_kanto',
    name: 'ライト (Light)',
    theme: '関東の都会と海風',
    region_id: 'kanto',
    rarity: 'NORMAL',
    visual: { icon: '🏙️', colorFrom: 'from-slate-300', colorTo: 'to-indigo-600', shadowColor: 'shadow-slate-500/50', sparkleColor: 'text-slate-200' },
    description: '都会のネオンと港町の潮風が混ざり合って生まれた近代的な妖精。'
  },
  {
    id: 'fairy_hokuriku',
    name: 'カニヤ (Kaniya)',
    theme: '北陸の雪とカニ',
    region_id: 'hokuriku',
    rarity: 'NORMAL',
    visual: { icon: '🦀', colorFrom: 'from-orange-400', colorTo: 'to-red-600', shadowColor: 'shadow-orange-500/50', sparkleColor: 'text-orange-200' },
    description: '北陸の厳しい冬の海からやってきた陽気なカニの精霊。美味しい海の幸が集まる場所に現れます。'
  },
  {
    id: 'fairy_tokai',
    name: 'チャチャ (Chacha)',
    theme: '東海の茶葉と霊峰',
    region_id: 'tokai',
    rarity: 'NORMAL',
    visual: { icon: '🍵', colorFrom: 'from-green-400', colorTo: 'to-emerald-700', shadowColor: 'shadow-green-500/50', sparkleColor: 'text-green-200' },
    description: '香り高いお茶の葉と、遠くに見える富士山のパワーを宿したほっこり系の妖精。'
  },
  {
    id: 'fairy_kinki',
    name: 'ミヤビ (Miyabi)',
    theme: '近畿の歴史とシカ',
    region_id: 'kinki',
    rarity: 'NORMAL',
    visual: { icon: '🦌', colorFrom: 'from-amber-600', colorTo: 'to-orange-900', shadowColor: 'shadow-amber-700/50', sparkleColor: 'text-amber-200' },
    description: '古都の長い歴史を見守ってきたシカの精霊。雅なオーラで旅人を優雅な気持ちにさせます。'
  },
  {
    id: 'fairy_chugoku',
    name: 'レモ (Remo)',
    theme: '中国・瀬戸内のレモン',
    region_id: 'chugoku',
    rarity: 'NORMAL',
    visual: { icon: '🍋', colorFrom: 'from-yellow-300', colorTo: 'to-amber-500', shadowColor: 'shadow-yellow-500/50', sparkleColor: 'text-yellow-100' },
    description: '瀬戸内海の穏やかな気候と太陽をたっぷり浴びて育ったレモンの妖精。とてもフレッシュ。'
  },
  {
    id: 'fairy_shikoku',
    name: 'ミカ (Mika)',
    theme: '四国のお遍路みかん',
    region_id: 'shikoku',
    rarity: 'NORMAL',
    visual: { icon: '🍊', colorFrom: 'from-orange-300', colorTo: 'to-orange-600', shadowColor: 'shadow-orange-500/50', sparkleColor: 'text-orange-100' },
    description: '四国の温かい気候で育ったみかんの精霊。旅人の疲れを癒やすお接待の心を持っています。'
  },
  {
    id: 'fairy_kyushu',
    name: 'マグ (Magu)',
    theme: '九州の火山と温泉',
    region_id: 'kyushu',
    rarity: 'NORMAL',
    visual: { icon: '🌋', colorFrom: 'from-red-500', colorTo: 'to-slate-900', shadowColor: 'shadow-red-600/50', sparkleColor: 'text-red-300' },
    description: '九州の力強い火山と温泉の熱から生まれた情熱的な精霊。エネルギーに満ち溢れています。'
  },

  // --- 新規追加：人気・有名離島の固有妖精（10体） ---
  {
    id: 'fairy_niigata_sado',
    name: '朱鷺音 (Tokine)',
    theme: '佐渡のトキと金山',
    island_id: 'sado',
    rarity: 'RARE',
    visual: { icon: '🪶', colorFrom: 'from-rose-200', colorTo: 'to-yellow-600', shadowColor: 'shadow-yellow-500/50', sparkleColor: 'text-rose-100' },
    description: '佐渡島の上空を舞う美しいトキと、眠る金脈の輝きから生まれた優雅な妖精。'
  },
  {
    id: 'fairy_hyogo_awaji',
    name: 'タマ (Tama)',
    theme: '淡路の神話たまねぎ',
    island_id: 'awajishima',
    rarity: 'RARE',
    visual: { icon: '🧅', colorFrom: 'from-amber-200', colorTo: 'to-orange-400', shadowColor: 'shadow-amber-400/50', sparkleColor: 'text-amber-100' },
    description: '国生み神話の地、淡路島の甘いタマネギの精霊。涙ではなく笑顔を引き出します。'
  },
  {
    id: 'fairy_kagawa_shodo',
    name: 'オリビ (Oribi)',
    theme: '小豆島のオリーブの風',
    island_id: 'shodoshima',
    rarity: 'RARE',
    visual: { icon: '🫒', colorFrom: 'from-lime-400', colorTo: 'to-green-700', shadowColor: 'shadow-lime-500/50', sparkleColor: 'text-lime-200' },
    description: '小豆島のオリーブ畑を吹き抜ける風の妖精。平和と豊穣のシンボルです。'
  },
  {
    id: 'fairy_hiroshima_miyajima',
    name: 'イツク (Itsuku)',
    theme: '宮島の神鹿と鳥居',
    island_id: 'itsukushima',
    rarity: 'EPIC',
    visual: { icon: '⛩️', colorFrom: 'from-red-500', colorTo: 'to-orange-700', shadowColor: 'shadow-red-600/50', sparkleColor: 'text-red-200' },
    description: '海に浮かぶ大鳥居と神の使いである鹿の力を宿した神聖な妖精。'
  },
  {
    id: 'fairy_kanagawa_enoshima',
    name: 'リュウ (Ryu)',
    theme: '江の島の海龍',
    island_id: 'enoshima',
    rarity: 'RARE',
    visual: { icon: '🐉', colorFrom: 'from-teal-400', colorTo: 'to-blue-800', shadowColor: 'shadow-teal-500/50', sparkleColor: 'text-teal-200' },
    description: '江の島の伝説に伝わる五頭龍の末裔。湘南の海を颯爽と泳ぎ回ります。'
  },
  {
    id: 'fairy_nagasaki_tsushima',
    name: 'ヤマ (Yama)',
    theme: '対馬のヤマネコ',
    island_id: 'tsushima',
    rarity: 'RARE',
    visual: { icon: '🐈', colorFrom: 'from-stone-400', colorTo: 'to-stone-700', shadowColor: 'shadow-stone-500/50', sparkleColor: 'text-stone-200' },
    description: '国境の島、対馬の深い森に隠れ住むヤマネコの妖精。とても警戒心が強いが一度懐くと離れない。'
  },
  {
    id: 'fairy_kagoshima_yakushima',
    name: 'コダマ (Kodama)',
    theme: '屋久杉と苔の精',
    island_id: 'yakushima',
    rarity: 'EPIC',
    visual: { icon: '🌲', colorFrom: 'from-green-600', colorTo: 'to-emerald-900', shadowColor: 'shadow-green-700/50', sparkleColor: 'text-green-300' },
    description: '何千年も生きる屋久杉の森から生まれた古代の精霊。生命の神秘そのものです。'
  },
  {
    id: 'fairy_kagawa_naoshima',
    name: 'アート (Art)',
    theme: '直島の現代アート',
    island_id: 'naoshima',
    rarity: 'RARE',
    visual: { icon: '🎃', colorFrom: 'from-yellow-400', colorTo: 'to-red-500', shadowColor: 'shadow-yellow-500/50', sparkleColor: 'text-yellow-200' },
    description: '直島の現代アートから飛び出してきたような、前衛的でポップなカボチャの妖精。'
  },
  {
    id: 'fairy_shimane_oki',
    name: 'ウシマ (Ushima)',
    theme: '隠岐の島の潮風と牛',
    island_id: 'dogo', // 隠岐の島（島後）
    rarity: 'RARE',
    visual: { icon: '🐄', colorFrom: 'from-slate-200', colorTo: 'to-slate-600', shadowColor: 'shadow-slate-400/50', sparkleColor: 'text-slate-100' },
    description: '隠岐の島の絶壁に立つ力強い牛の妖精。日本海の荒波にも負けない力強さを持つ。'
  },
  {
    id: 'fairy_kagoshima_sakurajima',
    name: 'イグニ (Igni)',
    theme: '桜島の燃える火山弾',
    island_id: 'sakurajima',
    rarity: 'RARE',
    visual: { icon: '🔥', colorFrom: 'from-red-600', colorTo: 'to-orange-900', shadowColor: 'shadow-red-600/50', sparkleColor: 'text-red-300' },
    description: '桜島の噴火と共に生まれる情熱の妖精。触ると少し熱い。'
  },
  
  // --- ご当地動物・伝承キャラクター追加 ---
  {
    id: 'fairy_okinawa_shisa',
    name: 'シサ (Shisa)',
    theme: '沖縄の守り神シーサー',
    island_id: 'okinawa_main',
    rarity: 'RARE',
    visual: { icon: '🦁', colorFrom: 'from-orange-500', colorTo: 'to-red-700', shadowColor: 'shadow-orange-600/50', sparkleColor: 'text-orange-300' },
    description: '沖縄の家々を守るシーサーから生まれた力強い妖精。悪い運気を追い払ってくれます。'
  },
  {
    id: 'fairy_yonaguni_horse',
    name: 'ヨナ (Yona)',
    theme: '与那国馬と最西端の風',
    island_id: 'yonaguni',
    rarity: 'RARE',
    visual: { icon: '🐴', colorFrom: 'from-amber-400', colorTo: 'to-yellow-800', shadowColor: 'shadow-amber-500/50', sparkleColor: 'text-amber-200' },
    description: '日本最西端の与那国島で力強く生きる与那国馬の妖精。たくましい足腰を持っています。'
  },
  {
    id: 'fairy_miyako_horse',
    name: 'ミヤ (Miya)',
    theme: '宮古馬とサトウキビ畑',
    island_id: 'miyako',
    rarity: 'RARE',
    visual: { icon: '🐎', colorFrom: 'from-yellow-200', colorTo: 'to-amber-600', shadowColor: 'shadow-yellow-400/50', sparkleColor: 'text-yellow-100' },
    description: '宮古島の風土と共に育った宮古馬の妖精。のんびりとした性格で癒やされます。'
  },
  {
    id: 'fairy_hokkaido_shimaenaga',
    name: 'エナ (Ena)',
    theme: '雪の妖精シマエナガ',
    region_id: 'hokkaido',
    rarity: 'EPIC',
    visual: { icon: '🐦', colorFrom: 'from-slate-50', colorTo: 'to-slate-200', shadowColor: 'shadow-slate-300/50', sparkleColor: 'text-white' },
    description: '雪の妖精とも呼ばれるシマエナガの精霊。真っ白でふわふわな真ん丸の体をしています。'
  },
  {
    id: 'fairy_hateruma_cross',
    name: 'クロス (Cross)',
    theme: '波照間の南十字星',
    island_id: 'hateruma',
    rarity: 'EPIC',
    visual: { icon: '✨', colorFrom: 'from-indigo-300', colorTo: 'to-purple-800', shadowColor: 'shadow-indigo-400/50', sparkleColor: 'text-indigo-100' },
    description: '日本最南端・波照間島の夜空に輝く南十字星の妖精。星降る夜にだけ姿を見せます。'
  },

  // --- 架空コラボ版テスト（1体） ---
  {
    id: 'fairy_okinawa_main_kirahotel',
    baseFairyId: 'fairy_okinawa_main',
    name: 'ルリ (キラキラホテルVer)',
    theme: '特別ホテルリゾート衣装',
    island_id: 'okinawa_main', // 本来はスポット連携で入手
    collabSponsor: 'キラキラホテルリゾート',
    rarity: 'SPOT_EXCLUSIVE',
    visual: { 
      icon: '🏨', // 制限解除後に別衣装の画像を割り当て予定
      colorFrom: 'from-purple-400', 
      colorTo: 'to-pink-600', 
      shadowColor: 'shadow-purple-500/50', 
      sparkleColor: 'text-purple-200' 
    },
    description: 'キラキラホテルリゾートとの特別コラボ！ホテルの制服を着た激レアバージョンのルリです。'
  }
];
