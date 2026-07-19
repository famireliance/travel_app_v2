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
  }
];
