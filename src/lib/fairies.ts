export type FairyRarity = 'NORMAL' | 'RARE' | 'EPIC' | 'SPOT_EXCLUSIVE';
export type FairyAttribute = 'WATER' | 'NATURE' | 'FIRE' | 'LIGHT' | 'EARTH' | 'WIND' | 'ICE';

export interface FairyVisual {
  icon: string;
  imageUrl?: string;
  colorFrom: string;
  colorTo: string;
  shadowColor: string;
  sparkleColor: string;
}

export interface IslandFairy {
  id: string;
  baseFairyId?: string;
  name: string;
  theme: string;
  region_id?: string;
  island_id?: string;
  rarity: FairyRarity;
  attribute: FairyAttribute;
  collabSponsor?: string;
  visual: FairyVisual;
  description: string;
}

export const FAIRIES_MASTER: IslandFairy[] = [
  {
    "id": "fairy_okinawa_main",
    "name": "ルリ (Ruri)",
    "theme": "琉球の波の妖精",
    "region_id": "okinawa_main",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "🐬",
      "imageUrl": "/fairies/ruri.jpg",
      "colorFrom": "from-cyan-400",
      "colorTo": "to-blue-600",
      "shadowColor": "shadow-cyan-500/50",
      "sparkleColor": "text-cyan-200"
    },
    "description": "沖縄本島周辺の美しい波間に住む妖精。見つけた人に清らかな心と癒やしをもたらすと言われています。"
  },
  {
    "id": "fairy_yaeyama",
    "name": "ティダ (Tida)",
    "theme": "八重山の太陽精霊",
    "region_id": "yaeyama",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🌺",
      "imageUrl": "/fairies/tida.jpg",
      "colorFrom": "from-rose-400",
      "colorTo": "to-orange-500",
      "shadowColor": "shadow-rose-500/50",
      "sparkleColor": "text-rose-200"
    },
    "description": "八重山の力強い太陽の光から生まれた妖精。南国の情熱と底抜けの明るさで、旅人を笑顔にします。"
  },
  {
    "id": "fairy_amami",
    "name": "シダ (Shida)",
    "theme": "奄美の深緑の妖精",
    "region_id": "amami",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌿",
      "imageUrl": "/fairies/shida.jpg",
      "colorFrom": "from-emerald-400",
      "colorTo": "to-teal-600",
      "shadowColor": "shadow-emerald-500/50",
      "sparkleColor": "text-emerald-200"
    },
    "description": "アマミノクロウサギと仲良しの森の妖精。マングローブの森の奥深くにひっそりと暮らしています。"
  },
  {
    "id": "fairy_miyako",
    "name": "ブルー (Blue)",
    "theme": "宮古ブルーの化身",
    "region_id": "miyako",
    "rarity": "EPIC",
    "attribute": "WATER",
    "visual": {
      "icon": "🦋",
      "imageUrl": "/fairies/miyako_v2_card_1786460907169.jpg",
      "colorFrom": "from-sky-300",
      "colorTo": "to-blue-700",
      "shadowColor": "shadow-sky-500/60",
      "sparkleColor": "text-sky-100"
    },
    "description": "東洋一美しいと言われる宮古島の海の青さが結晶化して生まれた奇跡の妖精。滅多に姿を現しません。"
  },
  {
    "id": "fairy_ogasawara",
    "name": "ホシ (Hoshi)",
    "theme": "ボニンブルーの星妖精",
    "region_id": "ogasawara",
    "rarity": "EPIC",
    "attribute": "LIGHT",
    "visual": {
      "icon": "🐋",
      "imageUrl": "/fairies/hoshi.jpg",
      "colorFrom": "from-indigo-400",
      "colorTo": "to-purple-700",
      "shadowColor": "shadow-indigo-500/50",
      "sparkleColor": "text-indigo-200"
    },
    "description": "小笠原の深い海と、満天の星空を繋ぐクジラの妖精。はるか遠くの海から旅人を歓迎してくれます。"
  },
  {
    "id": "fairy_izu",
    "name": "ツバキ (Tsubaki)",
    "theme": "伊豆の火の精霊",
    "region_id": "izu",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🌸",
      "imageUrl": "/fairies/izu_card_1786465985290.jpg",
      "colorFrom": "from-pink-400",
      "colorTo": "to-rose-600",
      "shadowColor": "shadow-pink-500/50",
      "sparkleColor": "text-pink-200"
    },
    "description": "伊豆大島の椿の花から生まれた妖精。温泉と暖かい場所が大好きで、湯けむりに乗って移動します。"
  },
  {
    "id": "fairy_okinawa_manza",
    "name": "ゾウ (Zou)",
    "theme": "万座毛の崖精霊",
    "island_id": "okinawa_main",
    "rarity": "SPOT_EXCLUSIVE",
    "attribute": "EARTH",
    "visual": {
      "icon": "🐘",
      "imageUrl": "/fairies/zou.jpg",
      "colorFrom": "from-green-600",
      "colorTo": "to-slate-800",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "沖縄本島の景勝地「万座毛」に棲む力強い精霊。雄大な自然のエネルギーを旅人に分け与えます。"
  },
  {
    "id": "fairy_ishigaki_kabira",
    "name": "カビラ (Kabira)",
    "theme": "川平湾の透明な妖精",
    "island_id": "ishigaki",
    "rarity": "SPOT_EXCLUSIVE",
    "attribute": "WATER",
    "visual": {
      "icon": "🐠",
      "imageUrl": "/fairies/kabira.jpg",
      "colorFrom": "from-teal-300",
      "colorTo": "to-emerald-600",
      "shadowColor": "shadow-teal-500/50",
      "sparkleColor": "text-teal-200"
    },
    "description": "石垣島・川平湾の透き通る海面から生まれた妖精。太陽の光を浴びて七色に輝くと言われています。"
  },
  {
    "id": "fairy_miyako_yonaha",
    "name": "マイ (Mai)",
    "theme": "与那覇前浜の砂妖精",
    "island_id": "miyako",
    "rarity": "SPOT_EXCLUSIVE",
    "attribute": "EARTH",
    "visual": {
      "icon": "🐚",
      "imageUrl": "/fairies/mai.jpg",
      "colorFrom": "from-amber-100",
      "colorTo": "to-orange-300",
      "shadowColor": "shadow-amber-500/50",
      "sparkleColor": "text-amber-100"
    },
    "description": "東洋一白い砂浜と呼ばれる与那覇前浜ビーチのサラサラな砂から生まれた妖精。"
  },
  {
    "id": "fairy_amami_mangrove",
    "name": "グル (Guru)",
    "theme": "黒潮マングローブの主",
    "island_id": "amami",
    "rarity": "SPOT_EXCLUSIVE",
    "attribute": "NATURE",
    "visual": {
      "icon": "🐊",
      "imageUrl": "/fairies/mangrove2_card_1786463054758.jpg",
      "colorFrom": "from-lime-500",
      "colorTo": "to-green-900",
      "shadowColor": "shadow-lime-500/50",
      "sparkleColor": "text-lime-200"
    },
    "description": "奄美大島のマングローブ林を静かに見守る古き森の主。大自然の神秘を肌で感じた者にのみ姿を現します。"
  },
  {
    "id": "fairy_hokkaido",
    "name": "ユキ (Yuki)",
    "theme": "北海道の雪キツネ",
    "region_id": "hokkaido",
    "rarity": "NORMAL",
    "attribute": "ICE",
    "visual": {
      "icon": "🦊",
      "imageUrl": "/fairies/yuki.jpg",
      "colorFrom": "from-blue-100",
      "colorTo": "to-slate-300",
      "shadowColor": "shadow-blue-200/50",
      "sparkleColor": "text-blue-100"
    },
    "description": "北海道のふかふかの雪から生まれたキタキツネの妖精。冷たい風に乗って旅人を優しく見守ります。"
  },
  {
    "id": "fairy_tohoku",
    "name": "リン (Rin)",
    "theme": "東北の森とりんご",
    "region_id": "tohoku",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🍎",
      "imageUrl": "/fairies/touho_card_1786595356523.jpg",
      "colorFrom": "from-red-400",
      "colorTo": "to-rose-700",
      "shadowColor": "shadow-red-500/50",
      "sparkleColor": "text-red-200"
    },
    "description": "東北の豊かな森と美味しいりんごの精霊。出会うと心が温まり、お腹が空いてくると言われています。"
  },
  {
    "id": "fairy_kanto",
    "name": "ライト (Light)",
    "theme": "関東の都会と海風",
    "region_id": "kanto",
    "rarity": "NORMAL",
    "attribute": "WIND",
    "visual": {
      "icon": "🏙️",
      "imageUrl": "/fairies/light.jpg",
      "colorFrom": "from-slate-300",
      "colorTo": "to-indigo-600",
      "shadowColor": "shadow-slate-500/50",
      "sparkleColor": "text-slate-200"
    },
    "description": "都会のネオンと港町の潮風が混ざり合って生まれた近代的な妖精。"
  },
  {
    "id": "fairy_hokuriku",
    "name": "カニヤ (Kaniya)",
    "theme": "北陸の雪とカニ",
    "region_id": "hokuriku",
    "rarity": "NORMAL",
    "attribute": "ICE",
    "visual": {
      "icon": "🦀",
      "imageUrl": "/fairies/kaniya.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "北陸の厳しい冬の海からやってきた陽気なカニの精霊。美味しい海の幸が集まる場所に現れます。"
  },
  {
    "id": "fairy_tokai",
    "name": "チャチャ (Chacha)",
    "theme": "東海の茶葉と霊峰",
    "region_id": "tokai",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🍵",
      "imageUrl": "/fairies/touka_card_1786595498725.jpg",
      "colorFrom": "from-green-400",
      "colorTo": "to-emerald-700",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "香り高いお茶の葉と、遠くに見える富士山のパワーを宿したほっこり系の妖精。"
  },
  {
    "id": "fairy_kinki",
    "name": "ミヤビ (Miyabi)",
    "theme": "近畿の歴史とシカ",
    "region_id": "kinki",
    "rarity": "NORMAL",
    "attribute": "EARTH",
    "visual": {
      "icon": "🦌",
      "imageUrl": "/fairies/kinki_card_1786595521667.jpg",
      "colorFrom": "from-amber-600",
      "colorTo": "to-orange-900",
      "shadowColor": "shadow-amber-700/50",
      "sparkleColor": "text-amber-200"
    },
    "description": "古都の長い歴史を見守ってきたシカの精霊。雅なオーラで旅人を優雅な気持ちにさせます。"
  },
  {
    "id": "fairy_chugoku",
    "name": "レモ (Remo)",
    "theme": "中国・瀬戸内のレモン",
    "region_id": "chugoku",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🍋",
      "imageUrl": "/fairies/chuu_card_1786595546551.jpg",
      "colorFrom": "from-yellow-300",
      "colorTo": "to-amber-500",
      "shadowColor": "shadow-yellow-500/50",
      "sparkleColor": "text-yellow-100"
    },
    "description": "瀬戸内海の穏やかな気候と太陽をたっぷり浴びて育ったレモンの妖精。とてもフレッシュ。"
  },
  {
    "id": "fairy_shikoku",
    "name": "ミカ (Mika)",
    "theme": "四国のお遍路みかん",
    "region_id": "shikoku",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🍊",
      "imageUrl": "/fairies/mika.jpg",
      "colorFrom": "from-orange-300",
      "colorTo": "to-orange-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-100"
    },
    "description": "四国の温かい気候で育ったみかんの精霊。旅人の疲れを癒やすお接待の心を持っています。"
  },
  {
    "id": "fairy_kyushu",
    "name": "マグ (Magu)",
    "theme": "九州の火山と温泉",
    "region_id": "kyushu",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🌋",
      "imageUrl": "/fairies/kyuu_card_1786595593258.jpg",
      "colorFrom": "from-red-500",
      "colorTo": "to-slate-900",
      "shadowColor": "shadow-red-600/50",
      "sparkleColor": "text-red-300"
    },
    "description": "九州の力強い火山と温泉の熱から生まれた情熱的な精霊。エネルギーに満ち溢れています。"
  },
  {
    "id": "fairy_niigata_sado",
    "name": "朱鷺音 (Tokine)",
    "theme": "佐渡のトキと金山",
    "island_id": "sado",
    "rarity": "RARE",
    "attribute": "EARTH",
    "visual": {
      "icon": "🪶",
      "imageUrl": "/fairies/sado_card_1786466298460.jpg",
      "colorFrom": "from-rose-200",
      "colorTo": "to-yellow-600",
      "shadowColor": "shadow-yellow-500/50",
      "sparkleColor": "text-rose-100"
    },
    "description": "佐渡島の上空を舞う美しいトキと、眠る金脈の輝きから生まれた優雅な妖精。"
  },
  {
    "id": "fairy_hyogo_awaji",
    "name": "タマ (Tama)",
    "theme": "淡路の神話たまねぎ",
    "island_id": "awajishima",
    "rarity": "RARE",
    "attribute": "EARTH",
    "visual": {
      "icon": "🧅",
      "imageUrl": "/fairies/awaji_card_1786464678838.jpg",
      "colorFrom": "from-amber-200",
      "colorTo": "to-orange-400",
      "shadowColor": "shadow-amber-400/50",
      "sparkleColor": "text-amber-100"
    },
    "description": "国生み神話の地、淡路島の甘いタマネギの精霊。涙ではなく笑顔を引き出します。"
  },
  {
    "id": "fairy_kagawa_shodo",
    "name": "オリビ (Oribi)",
    "theme": "小豆島のオリーブの風",
    "island_id": "shodoshima",
    "rarity": "RARE",
    "attribute": "WIND",
    "visual": {
      "icon": "🫒",
      "imageUrl": "/fairies/shodo_card_1786464630691.jpg",
      "colorFrom": "from-lime-400",
      "colorTo": "to-green-700",
      "shadowColor": "shadow-lime-500/50",
      "sparkleColor": "text-lime-200"
    },
    "description": "小豆島のオリーブ畑を吹き抜ける風の妖精。平和と豊穣のシンボルです。"
  },
  {
    "id": "fairy_hiroshima_miyajima",
    "name": "イツク (Itsuku)",
    "theme": "宮島の神鹿と鳥居",
    "island_id": "itsukushima",
    "rarity": "EPIC",
    "attribute": "LIGHT",
    "visual": {
      "icon": "⛩️",
      "imageUrl": "/fairies/itsuku.jpg",
      "colorFrom": "from-red-500",
      "colorTo": "to-orange-700",
      "shadowColor": "shadow-red-600/50",
      "sparkleColor": "text-red-200"
    },
    "description": "海に浮かぶ大鳥居と神の使いである鹿の力を宿した神聖な妖精。"
  },
  {
    "id": "fairy_kanagawa_enoshima",
    "name": "リュウ (Ryu)",
    "theme": "江の島の海龍",
    "island_id": "enoshima",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "🐉",
      "imageUrl": "/fairies/ryu.jpg",
      "colorFrom": "from-teal-400",
      "colorTo": "to-blue-800",
      "shadowColor": "shadow-teal-500/50",
      "sparkleColor": "text-teal-200"
    },
    "description": "江の島の伝説に伝わる五頭龍の末裔。湘南の海を颯爽と泳ぎ回ります。"
  },
  {
    "id": "fairy_nagasaki_tsushima",
    "name": "ヤマ (Yama)",
    "theme": "対馬のヤマネコ",
    "island_id": "tsushima",
    "rarity": "RARE",
    "attribute": "NATURE",
    "visual": {
      "icon": "🐈",
      "imageUrl": "/fairies/tsushima_card_1786464492922.jpg",
      "colorFrom": "from-stone-400",
      "colorTo": "to-stone-700",
      "shadowColor": "shadow-stone-500/50",
      "sparkleColor": "text-stone-200"
    },
    "description": "国境の島、対馬の深い森に隠れ住むヤマネコの妖精。とても警戒心が強いが一度懐くと離れない。"
  },
  {
    "id": "fairy_kagoshima_yakushima",
    "name": "コダマ (Kodama)",
    "theme": "屋久杉と苔の精",
    "island_id": "yakushima",
    "rarity": "EPIC",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌲",
      "imageUrl": "/fairies/kodama.jpg",
      "colorFrom": "from-green-600",
      "colorTo": "to-emerald-900",
      "shadowColor": "shadow-green-700/50",
      "sparkleColor": "text-green-300"
    },
    "description": "何千年も生きる屋久杉の森から生まれた古代の精霊。生命の神秘そのものです。"
  },
  {
    "id": "fairy_kagawa_naoshima",
    "name": "アート (Art)",
    "theme": "直島の現代アート",
    "island_id": "naoshima",
    "rarity": "RARE",
    "attribute": "LIGHT",
    "visual": {
      "icon": "🎃",
      "imageUrl": "/fairies/nao_card_1786464652592.jpg",
      "colorFrom": "from-yellow-400",
      "colorTo": "to-red-500",
      "shadowColor": "shadow-yellow-500/50",
      "sparkleColor": "text-yellow-200"
    },
    "description": "直島の現代アートから飛び出してきたような、前衛的でポップなカボチャの妖精。"
  },
  {
    "id": "fairy_shimane_oki",
    "name": "ウシマ (Ushima)",
    "theme": "隠岐の島の潮風と牛",
    "island_id": "dogo",
    "rarity": "RARE",
    "attribute": "EARTH",
    "visual": {
      "icon": "🐄",
      "imageUrl": "/fairies/oki_card_1786464780548.jpg",
      "colorFrom": "from-slate-200",
      "colorTo": "to-slate-600",
      "shadowColor": "shadow-slate-400/50",
      "sparkleColor": "text-slate-100"
    },
    "description": "隠岐の島の絶壁に立つ力強い牛の妖精。日本海の荒波にも負けない力強さを持つ。"
  },
  {
    "id": "fairy_kagoshima_sakurajima",
    "name": "イグニ (Igni)",
    "theme": "桜島の燃える火山弾",
    "island_id": "sakurajima",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/igni.jpg",
      "colorFrom": "from-red-600",
      "colorTo": "to-orange-900",
      "shadowColor": "shadow-red-600/50",
      "sparkleColor": "text-red-300"
    },
    "description": "桜島の噴火と共に生まれる情熱の妖精。触ると少し熱い。"
  },
  {
    "id": "fairy_okinawa_shisa",
    "name": "シサ (Shisa)",
    "theme": "沖縄の守り神シーサー",
    "island_id": "okinawa_main",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🦁",
      "imageUrl": "/fairies/okina_card_1786595616415.jpg",
      "colorFrom": "from-orange-500",
      "colorTo": "to-red-700",
      "shadowColor": "shadow-orange-600/50",
      "sparkleColor": "text-orange-300"
    },
    "description": "沖縄の家々を守るシーサーから生まれた力強い妖精。悪い運気を追い払ってくれます。"
  },
  {
    "id": "fairy_yonaguni_horse",
    "name": "ヨナ (Yona)",
    "theme": "与那国馬と最西端の風",
    "island_id": "yonaguni",
    "rarity": "RARE",
    "attribute": "WIND",
    "visual": {
      "icon": "🐴",
      "imageUrl": "/fairies/yonaguni_card_1786448117030.jpg",
      "colorFrom": "from-amber-400",
      "colorTo": "to-yellow-800",
      "shadowColor": "shadow-amber-500/50",
      "sparkleColor": "text-amber-200"
    },
    "description": "日本最西端の与那国島で力強く生きる与那国馬の妖精。たくましい足腰を持っています。"
  },
  {
    "id": "fairy_miyako_horse",
    "name": "ミヤ (Miya)",
    "theme": "宮古馬とサトウキビ畑",
    "island_id": "miyako",
    "rarity": "RARE",
    "attribute": "EARTH",
    "visual": {
      "icon": "🐎",
      "imageUrl": "/fairies/miyako_card_1786458955157.jpg",
      "colorFrom": "from-yellow-200",
      "colorTo": "to-amber-600",
      "shadowColor": "shadow-yellow-400/50",
      "sparkleColor": "text-yellow-100"
    },
    "description": "宮古島の風土と共に育った宮古馬の妖精。のんびりとした性格で癒やされます。"
  },
  {
    "id": "fairy_hokkaido_shimaenaga",
    "name": "エナ (Ena)",
    "theme": "雪の妖精シマエナガ",
    "region_id": "hokkaido",
    "rarity": "EPIC",
    "attribute": "ICE",
    "visual": {
      "icon": "🐦",
      "imageUrl": "/fairies/shimaenaga.jpg",
      "colorFrom": "from-slate-50",
      "colorTo": "to-slate-200",
      "shadowColor": "shadow-slate-300/50",
      "sparkleColor": "text-white"
    },
    "description": "雪の妖精とも呼ばれるシマエナガの精霊。真っ白でふわふわな真ん丸の体をしています。"
  },
  {
    "id": "fairy_hateruma_cross",
    "name": "クロス (Cross)",
    "theme": "波照間の南十字星",
    "island_id": "hateruma",
    "rarity": "EPIC",
    "attribute": "LIGHT",
    "visual": {
      "icon": "✨",
      "imageUrl": "/fairies/hateru_card_1786446819465.jpg",
      "colorFrom": "from-indigo-300",
      "colorTo": "to-purple-800",
      "shadowColor": "shadow-indigo-400/50",
      "sparkleColor": "text-indigo-100"
    },
    "description": "日本最南端・波照間島の夜空に輝く南十字星の妖精。星降る夜にだけ姿を見せます。"
  },
  {
    "id": "fairy_ogasawara_chichijima",
    "name": "ホエ（Hoe）",
    "theme": "小笠原のザトウクジラ",
    "island_id": "ogasawara",
    "rarity": "EPIC",
    "attribute": "WATER",
    "visual": {
      "icon": "🐋",
      "imageUrl": "/fairies/chichijima_card_1786466246712.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-indigo-800",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ボニンブルーの海を雄大に泳ぐザトウクジラの妖精。ダイナミックなジャンプで旅人を歓迎します。"
  },
  {
    "id": "fairy_okinawa_main_kirahotel",
    "baseFairyId": "fairy_okinawa_main",
    "name": "ルリ (キラキラホテルVer)",
    "theme": "特別ホテルリゾート衣装",
    "island_id": "okinawa_main",
    "collabSponsor": "キラキラホテルリゾート",
    "rarity": "SPOT_EXCLUSIVE",
    "attribute": "LIGHT",
    "visual": {
      "icon": "🏨",
      "imageUrl": "/fairies/ruri_kirahotel.jpg",
      "colorFrom": "from-purple-400",
      "colorTo": "to-pink-600",
      "shadowColor": "shadow-purple-500/50",
      "sparkleColor": "text-purple-200"
    },
    "description": "キラキラホテルリゾートとの特別コラボ！ホテルの制服を着た激レアバージョンのルリです。"
  },
  {
    "id": "fairy_json_1",
    "name": "ルカ (Ruka)",
    "theme": "琉球ガラスガメ",
    "island_id": "沖縄本島",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌿",
      "imageUrl": "/fairies/art.png",
      "colorFrom": "from-green-400",
      "colorTo": "to-emerald-600",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "見習い子ガメ。琉球ガラスの甲羅を持つ。"
  },
  {
    "id": "fairy_json_2",
    "name": "レオン (Leon)",
    "theme": "シーサー",
    "island_id": "沖縄本島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/leon_card_1786595320305.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "パステルカラーのたてがみを持つ、甘えん坊の子犬シーサー。"
  },
  {
    "id": "fairy_json_3",
    "name": "エル (El)",
    "theme": "ゾウ",
    "island_id": "万座毛",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/angel_card_1786438076583.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "ゾウの鼻の形をした岩から生まれた、ふっくらした小象の精霊。サンセット色の耳を持つ。"
  },
  {
    "id": "fairy_json_4",
    "name": "ジン (Jin)",
    "theme": "星空ザメ",
    "island_id": "美ら海周辺",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/jinta_card_1786441826882.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "ジンベエザメの赤ちゃんで、星空模様の背中を持つ。のんびり屋。"
  },
  {
    "id": "fairy_json_5",
    "name": "ココ (Koko)",
    "theme": "恋の小鳥",
    "island_id": "古宇利島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/kourin_card_1786441859432.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ハートロックから生まれた、ハートのしっぽを持つピンク色の恋のキューピッド（小鳥）。"
  },
  {
    "id": "fairy_json_6",
    "name": "シロ (Shiro)",
    "theme": "白ヘビ",
    "island_id": "久高島",
    "rarity": "NORMAL",
    "attribute": "LIGHT",
    "visual": {
      "icon": "✨",
      "imageUrl": "/fairies/mika.png",
      "colorFrom": "from-yellow-300",
      "colorTo": "to-yellow-500",
      "shadowColor": "shadow-yellow-500/50",
      "sparkleColor": "text-yellow-200"
    },
    "description": "神聖な島を守る、真珠のようなウロコを持つ神々しい白ヘビの精霊。"
  },
  {
    "id": "fairy_json_7",
    "name": "アオト (Aoto)",
    "theme": "ウミガメ男の子",
    "island_id": "宮古島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/ao_nobg_1786442035434.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "宮古ブルーの目を持つ、元気いっぱいなウミガメの男の子。"
  },
  {
    "id": "fairy_json_8",
    "name": "ルミ (Rumi)",
    "theme": "青クラゲ",
    "island_id": "伊良部島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/irabu_card_1786459297153.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "青の洞窟の光をまとう、透き通ったクラゲの精霊。"
  },
  {
    "id": "fairy_json_9",
    "name": "ツイン (Twin)",
    "theme": "双子熱帯魚",
    "island_id": "下地島",
    "rarity": "NORMAL",
    "attribute": "EARTH",
    "visual": {
      "icon": "🪨",
      "imageUrl": "/fairies/miyabi.png",
      "colorFrom": "from-amber-600",
      "colorTo": "to-orange-900",
      "shadowColor": "shadow-amber-700/50",
      "sparkleColor": "text-amber-200"
    },
    "description": "通り池の2つの目を持つ、双子の熱帯魚。"
  },
  {
    "id": "fairy_json_10",
    "name": "マロ (Maro)",
    "theme": "マンゴーヤドカリ",
    "island_id": "来間島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/mangro_card_1786442788458.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "甘い香りのする、マンゴーの帽子をかぶったヤドカリ。"
  },
  {
    "id": "fairy_json_11",
    "name": "ピノ (Pino)",
    "theme": "ピンクタツノオトシゴ",
    "island_id": "池間島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/oribi.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ハート型のサンゴを首に下げた、ピンク色のタツノオトシゴ。"
  },
  {
    "id": "fairy_json_12",
    "name": "クリア (Clear)",
    "theme": "透明マンタ",
    "island_id": "川平湾",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/remo.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "エメラルドグリーンの海を泳ぐ、黒真珠の目を持つ透明な小さなエイ（マンタ）。"
  },
  {
    "id": "fairy_json_13",
    "name": "マヤ (Maya)",
    "theme": "ヤマネコ",
    "island_id": "西表島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/yama.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "マングローブの根のようなしっぽを持つ、ぽっちゃり子猫。"
  },
  {
    "id": "fairy_json_14",
    "name": "トミー (Tommy)",
    "theme": "のんびり水牛",
    "island_id": "竹富島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/taketomi_card_1786446667133.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "星砂を散りばめた角を持つ、のんびり屋の小さな水牛。"
  },
  {
    "id": "fairy_json_15",
    "name": "シュガ (Shuga)",
    "theme": "サトウキビ鳥",
    "island_id": "小浜島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/sugar_card_1786448480145.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "サトウキビの杖を持った、風に乗って飛ぶサギ（鳥）。"
  },
  {
    "id": "fairy_json_16",
    "name": "ステラ (Stella)",
    "theme": "星空フクロウ",
    "island_id": "波照間島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/hoshi.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "南十字星のランタンを持つ、夜空色のフクロウ。"
  },
  {
    "id": "fairy_json_17",
    "name": "ポニー (Pony)",
    "theme": "馬",
    "island_id": "与那国島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/rin.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ハンマーヘッドシャークの帽子をかぶった、人懐っこい与那国馬の仔馬。"
  },
  {
    "id": "fairy_json_18",
    "name": "クク (Kuku)",
    "theme": "三線ハト",
    "island_id": "鳩間島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/hatoma_card_1786458919572.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "音楽と三線が大好きな、青い羽のハトの精霊。"
  },
  {
    "id": "fairy_json_19",
    "name": "ミル (Milu)",
    "theme": "ハート牛",
    "island_id": "黒島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/kuro_card_1786448515530.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ハートの模様がある、ミルクのように白い仔牛。"
  },
  {
    "id": "fairy_json_20",
    "name": "ヤン (Yan)",
    "theme": "ヤンバルクイナ",
    "island_id": "多良間島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/shimaenaga.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "八月踊りのカラフルな衣装を着た、小さなヤンバルクイナ。"
  },
  {
    "id": "fairy_json_21",
    "name": "シェル (Shell)",
    "theme": "白砂ヤドカリ",
    "island_id": "久米島",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌿",
      "imageUrl": "/fairies/shisa.jpg",
      "colorFrom": "from-green-400",
      "colorTo": "to-emerald-600",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "真っ白な砂でできた、貝殻の首飾りをしたヤドカリ。"
  },
  {
    "id": "fairy_json_22",
    "name": "ホエル (Hoel)",
    "theme": "クジラ赤ちゃん",
    "island_id": "慶良間諸島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/ogasawara_whale.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "ザトウクジラの赤ちゃんで、潮吹きの代わりにキラキラの泡を出す。"
  },
  {
    "id": "fairy_json_23",
    "name": "シカコ (Shikako)",
    "theme": "ハイビスカス鹿",
    "island_id": "渡嘉敷島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/tokashiki_card_1786462465075.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "ケラマジカの子供。ツノに赤いハイビスカスが咲いている。"
  },
  {
    "id": "fairy_json_24",
    "name": "ウミ (Umi)",
    "theme": "サンゴウミウシ",
    "island_id": "座間味島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/zamami_card_1786462286710.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "カラフルなサンゴを背負った、好奇心旺盛なウミウシ。"
  },
  {
    "id": "fairy_json_25",
    "name": "ソルト (Salt)",
    "theme": "塩雪だるま",
    "island_id": "粟国島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/tida.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "キラキラ光る塩の結晶でできた、雪だるまのような妖精。"
  },
  {
    "id": "fairy_json_26",
    "name": "ピジョン (Pigeon)",
    "theme": "松とキジバト",
    "island_id": "伊平屋島",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/pigeon_card_1786509696995.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ルリカケス×アマミノクロウサギ。サファイアブルーの羽を持つ。"
  },
  {
    "id": "fairy_json_27",
    "name": "ピラミ (Pirami)",
    "theme": "ピラミッドヘビ",
    "island_id": "伊是名島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/pirami_card_1786509906248.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "ヤクシカ×シダ植物。苔の襟巻きをした小鹿。"
  },
  {
    "id": "fairy_json_28",
    "name": "ユリ (Yuri)",
    "theme": "テッポウユリウサギ",
    "island_id": "伊江島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/ie_card_1786462975260.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "樹齢数千年の知恵を持つ、おじいさんのようなフクロウ。"
  },
  {
    "id": "fairy_json_29",
    "name": "クロワ (Kurowa)",
    "theme": "クロワッサンヤギ",
    "island_id": "水納島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/kurowa_card_1786509952752.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "ロケットに乗った、宇宙飛行士に憧れるトビウオ。"
  },
  {
    "id": "fairy_json_30",
    "name": "メレ (Mere)",
    "theme": "カラフルカメレオン",
    "island_id": "瀬底島",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/mere_card_1786509974700.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "七つの島の星を繋ぐ、天の川の羽衣を着たウミガメ。"
  },
  {
    "id": "fairy_json_31",
    "name": "キャロ (Caro)",
    "theme": "ニンジンガメ",
    "island_id": "津堅島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/caro_card_1786510267274.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "麦焼酎の香りがする、麦わら帽子をかぶったお猿さん。"
  },
  {
    "id": "fairy_json_32",
    "name": "モズ (Mozu)",
    "theme": "もずくジュゴン",
    "island_id": "浜比嘉島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/mozu_card_1786510289515.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "ツシマヤマネコの精霊で、忍者みたいに素早い。"
  },
  {
    "id": "fairy_json_33",
    "name": "マース (Maasu)",
    "theme": "海塩の妖精",
    "island_id": "宮城島",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/maasu_card_1786510317528.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "椿の花びらのドレスを着た、ステンドグラスのように輝く蝶。"
  },
  {
    "id": "fairy_json_34",
    "name": "レッド (Red)",
    "theme": "赤い橋の子犬",
    "island_id": "伊計島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/red_card_1786592970533.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "古民家の守り神。ほうきを持った小さなタヌキ。"
  },
  {
    "id": "fairy_json_35",
    "name": "エア (Air)",
    "theme": "飛行機雲ツバメ",
    "island_id": "瀬長島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/air_card_1786592991069.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "サバンナのような赤土のサファリを駆ける、野生の鹿の精霊。"
  },
  {
    "id": "fairy_json_36",
    "name": "テン (Ten)",
    "theme": "天ぷらトラ猫",
    "island_id": "奥武島",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/ten_card_1786593278642.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "祈りの海を泳ぐ、十字架の模様を持つイルカ。"
  },
  {
    "id": "fairy_json_37",
    "name": "フク (Fuku)",
    "theme": "フクギのカエル",
    "island_id": "渡名喜島",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/fuku_card_1786593318718.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "南蛮菓子のあまーい香りがする、フリルのついたカモメ。"
  },
  {
    "id": "fairy_json_38",
    "name": "オクト (Octo)",
    "theme": "タコ公園のタコ",
    "island_id": "来間島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/octo_card_1786593341269.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "サンセットウェイを走る、夕日色に輝く馬の精霊。"
  },
  {
    "id": "fairy_json_39",
    "name": "コーラ (Cora)",
    "theme": "ハート熱帯魚",
    "island_id": "池間島",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/cora_card_1786599893938.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "イルカウォッチングでおなじみの、ピンク色のイルカ。"
  },
  {
    "id": "fairy_json_40",
    "name": "パナ (Pana)",
    "theme": "パナリ焼きヤドカリ",
    "island_id": "新城島",
    "rarity": "RARE",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌿",
      "imageUrl": "/fairies/pana_card_1786594027016.jpg",
      "colorFrom": "from-green-400",
      "colorTo": "to-emerald-600",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "断崖絶壁に住む、カノコユリの冠をかぶったウミネコ。"
  },
  {
    "id": "fairy_json_41",
    "name": "バフ (Buff)",
    "theme": "ピンク水牛",
    "island_id": "由布島",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/buff_card_1786594320179.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "オリーブの枝をくわえた、マカロンのように丸いメジロ。"
  },
  {
    "id": "fairy_json_42",
    "name": "モフ (Mofu)",
    "theme": "ふわふわ白ウサギ",
    "island_id": "嘉弥真島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/mofu_card_1786594391901.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "干潮時にだけ現れる、天使の羽が生えた真っ白な子犬。"
  },
  {
    "id": "fairy_json_43",
    "name": "ノッチ (Notch)",
    "theme": "ノッチ岩ヤドカリ",
    "island_id": "大神島",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/notch_card_1786594548775.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "水玉模様の帽子をかぶった、アートなカボチャの精霊。"
  },
  {
    "id": "fairy_json_44",
    "name": "スタ (Star)",
    "theme": "星の砂の小鹿",
    "island_id": "阿嘉島",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/star_card_1786594576169.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "水滴のように透き通った、レモンの香りがするスライム状の妖精。"
  },
  {
    "id": "fairy_json_45",
    "name": "カワラ (Kawara)",
    "theme": "赤瓦の小亀",
    "island_id": "慶留間島",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/kawara_card_1786594673309.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "海上アルプスを飛ぶ、エメラルドグリーンのトンビ。"
  },
  {
    "id": "fairy_json_46",
    "name": "バット (Bat)",
    "theme": "オオコウモリ",
    "island_id": "北大東島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/daito_card_1786462654721.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "隠岐牛の赤ちゃんで、頭に小さな松の木が生えている。"
  },
  {
    "id": "fairy_json_47",
    "name": "トレ (Tore)",
    "theme": "サトウキビ犬",
    "island_id": "南大東島",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/tore_card_1786595105901.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "みかんの皮をかぶった、あたたかい温泉好きのタヌキ。"
  },
  {
    "id": "fairy_json_48",
    "name": "ベレ (Bere)",
    "theme": "赤いベレー帽キツツキ",
    "island_id": "やんばる",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/bere_card_1786595131291.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "しまなみ海道を自転車で走るのが大好きな、ヘルメットをかぶったウサギ。"
  },
  {
    "id": "fairy_json_49",
    "name": "ナイト (Knight)",
    "theme": "波乗りコガネ騎士",
    "island_id": "辺戸岬",
    "rarity": "RARE",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/knight_card_1786595155670.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "四つ葉のクローバーの模様がある、アイボリー色のたれ耳うさぎ。"
  },
  {
    "id": "fairy_json_50",
    "name": "シーホ (Seaho)",
    "theme": "満月タツノオトシゴ",
    "island_id": "サンゴ礁",
    "rarity": "RARE",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/seaho_card_1786595238251.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "桃太郎の昔話から飛び出したような、小さなキジの精霊。"
  },
  {
    "id": "fairy_json_51",
    "name": "ルル (Ruru)",
    "theme": "青い鳥ウサギ",
    "island_id": "奄美大島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/oshima_card_1786466726632.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ツバキの花を頭に乗せた、真っ白な長毛の猫の精霊。"
  },
  {
    "id": "fairy_json_52",
    "name": "モス (Moss)",
    "theme": "苔の小鹿",
    "island_id": "屋久島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/yakushima_card_1786464569353.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "島を覆うツバキの森から生まれた、真っ赤なポンチョを着たリス。"
  },
  {
    "id": "fairy_json_53",
    "name": "モク (Moku)",
    "theme": "縄文杉フクロウ",
    "island_id": "屋久島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/tokine.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "モヤイ像とサーフボードを持った、日焼けした元気なカメレオン。"
  },
  {
    "id": "fairy_json_54",
    "name": "ロケ (Roke)",
    "theme": "ロケットトビウオ",
    "island_id": "種子島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/tanegashima_card_1786464598000.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "温泉が大好きな、タオルを頭に乗せたカピバラ。"
  },
  {
    "id": "fairy_json_55",
    "name": "リラ (Rira)",
    "theme": "天の川ウミガメ",
    "island_id": "トカラ列島",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌿",
      "imageUrl": "/fairies/ushima.png",
      "colorFrom": "from-green-400",
      "colorTo": "to-emerald-600",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "星空保護区の星をまとう、透き通った紫色のフクロウ。"
  },
  {
    "id": "fairy_json_56",
    "name": "ムギ (Mugi)",
    "theme": "麦わらサル",
    "island_id": "壱岐島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/iki_card_1786464519672.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "火山のパワーを持つ、あたたかいマグマ色のハリネズミ。"
  },
  {
    "id": "fairy_json_57",
    "name": "サスケ (Sasuke)",
    "theme": "ツシマヤマネコ忍者",
    "island_id": "対馬",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/yonaguni_horse.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "いつも笑っているような顔をした、野生のイルカの赤ちゃん。"
  },
  {
    "id": "fairy_json_58",
    "name": "ルチア (Lucia)",
    "theme": "椿とステンドグラス蝶",
    "island_id": "五島列島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/goto_card_1786464545328.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "光るキノコ（ヤコウタケ）の帽子をかぶった、陽気なカエル。"
  },
  {
    "id": "fairy_json_59",
    "name": "ポン (Pon)",
    "theme": "古民家タヌキ",
    "island_id": "小値賀島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/zou.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "二重カルデラの形をした、抹茶プリンのようなスライム妖精。"
  },
  {
    "id": "fairy_json_60",
    "name": "サバン (Saban)",
    "theme": "サバンナ鹿",
    "island_id": "野崎島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/art.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ボニンブルーの星空模様を持つイルカの精霊。"
  },
  {
    "id": "fairy_json_61",
    "name": "クロス (Cross)",
    "theme": "十字架イルカ",
    "island_id": "上五島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/hateruma_cross.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "アオウミガメの甲羅を持つ、南国フルーツの香りがする小鳥。"
  },
  {
    "id": "fairy_json_62",
    "name": "ビス (Bisu)",
    "theme": "南蛮菓子カモメ",
    "island_id": "平戸島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/mika.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "ハハジマメグロ（鳥）の精霊で、黄色いふわふわの毛玉のような姿。"
  },
  {
    "id": "fairy_json_63",
    "name": "セト (Seto)",
    "theme": "サンセット馬",
    "island_id": "生月島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/miyabi.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "しらす丼のどんぶりを被った、人懐っこいトンビ。"
  },
  {
    "id": "fairy_json_64",
    "name": "ピン (Pin)",
    "theme": "ピンクイルカ",
    "island_id": "天草諸島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/pinai_card_1786442996839.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "アジアンリゾートのハンモックでいつもお昼寝している怠け者のサル。"
  },
  {
    "id": "fairy_json_65",
    "name": "リリ (Lili)",
    "theme": "カノコユリウミネコ",
    "island_id": "甑島列島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/oribi.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "しらす漁の網をマントにしている、勇敢な小さなカニ。"
  },
  {
    "id": "fairy_json_66",
    "name": "オリ (Ori)",
    "theme": "オリーブメジロ",
    "island_id": "小豆島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/card_kabira_original_1786437047289.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "タコの形をした、真っ赤でプニプニの妖精。"
  },
  {
    "id": "fairy_json_67",
    "name": "アン (Ann)",
    "theme": "エンジェル犬",
    "island_id": "小豆島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/angel_nobg_1786438041423.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "島のアート作品から飛び出した、ペンキまみれの黒猫。"
  },
  {
    "id": "fairy_json_68",
    "name": "パンプ (Pump)",
    "theme": "水玉カボチャ",
    "island_id": "直島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/remo.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "真珠のネックレスをした、上品ならっこのお嬢様。"
  },
  {
    "id": "fairy_json_69",
    "name": "レモ (Remo)",
    "theme": "レモンスライム",
    "island_id": "豊島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/remo.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "潮騒の音がする巻貝を背負った、ロマンチックなヤドカリ。"
  },
  {
    "id": "fairy_json_70",
    "name": "エメ (Eme)",
    "theme": "エメラルドトンビ",
    "island_id": "青海島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/rin.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "海女さんのゴーグルをつけた、潜るのが得意なペンギン。"
  },
  {
    "id": "fairy_json_71",
    "name": "マツ (Matsu)",
    "theme": "松と小牛",
    "island_id": "隠岐諸島",
    "rarity": "NORMAL",
    "attribute": "EARTH",
    "visual": {
      "icon": "🪨",
      "imageUrl": "/fairies/shimaenaga.jpg",
      "colorFrom": "from-amber-600",
      "colorTo": "to-orange-900",
      "shadowColor": "shadow-amber-700/50",
      "sparkleColor": "text-amber-200"
    },
    "description": "甘くて美味しいタマネギの形をした、泣き虫だけど優しい精霊。"
  },
  {
    "id": "fairy_json_72",
    "name": "ミカ (Mika)",
    "theme": "みかんタヌキ",
    "island_id": "周防大島",
    "rarity": "NORMAL",
    "attribute": "EARTH",
    "visual": {
      "icon": "🪨",
      "imageUrl": "/fairies/suo_card_1786465494531.jpg",
      "colorFrom": "from-amber-600",
      "colorTo": "to-orange-900",
      "shadowColor": "shadow-amber-700/50",
      "sparkleColor": "text-amber-200"
    },
    "description": "勾玉（まがたま）の首飾りをした、神話から来た小さな龍。"
  },
  {
    "id": "fairy_json_73",
    "name": "チャリ (Chari)",
    "theme": "自転車ウサギ",
    "island_id": "大三島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/chacha.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "ラピュタのような廃墟を守る、レンガ色のコウモリ。"
  },
  {
    "id": "fairy_json_74",
    "name": "クロバ (Kuroba)",
    "theme": "四つ葉ウサギ",
    "island_id": "大久野島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/shisa.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "黄金の羽を持つトキ。たらい舟に乗って移動する。"
  },
  {
    "id": "fairy_json_75",
    "name": "タロ (Taro)",
    "theme": "桃太郎キジ",
    "island_id": "百島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/tida.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "わっぱ煮の鍋をかぶった、食いしん坊のタヌキ。"
  },
  {
    "id": "fairy_json_76",
    "name": "カメリア (Camellia)",
    "theme": "ツバキ白猫",
    "island_id": "伊豆大島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/tsubaki.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ガラス美術館のガラス細工でできた、透明なイルカ。"
  },
  {
    "id": "fairy_json_77",
    "name": "ポンチョ (Poncho)",
    "theme": "赤いポンチョのリス",
    "island_id": "利島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/tokine.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "金華山を拝む、神聖な白いシカの精霊。"
  },
  {
    "id": "fairy_json_78",
    "name": "モヤ (Moya)",
    "theme": "モヤイカメレオン",
    "island_id": "新島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/nii_card_1786466158647.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "コイン（お金）の模様が入った、金運を運ぶ招きシカ。"
  },
  {
    "id": "fairy_json_79",
    "name": "ポカ (Poka)",
    "theme": "温泉カピバラ",
    "island_id": "式根島",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌿",
      "imageUrl": "/fairies/ushima.png",
      "colorFrom": "from-green-400",
      "colorTo": "to-emerald-600",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "260の島々を繋ぐ、松の枝を持ったウミネコ。"
  },
  {
    "id": "fairy_json_80",
    "name": "パープ (Purp)",
    "theme": "星空保護区フクロウ",
    "island_id": "神津島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/yonaguni_horse.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "渡り鳥たちの案内役を務める、コンパスを持ったツバメ。"
  },
  {
    "id": "fairy_json_81",
    "name": "マグ (Magu)",
    "theme": "マグマハリネズミ",
    "island_id": "三宅島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/miyake_card_1786466185686.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "ゆずの香りがする、緑色のころんとしたメジロ。"
  },
  {
    "id": "fairy_json_82",
    "name": "ニコ (Niko)",
    "theme": "イルカ赤ちゃん",
    "island_id": "御蔵島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/zou.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "カキ（牡蠣）の殻をベッドにしている、パール色のアザラシ。"
  },
  {
    "id": "fairy_json_83",
    "name": "ルミナ (Lumina)",
    "theme": "光るキノコカエル",
    "island_id": "八丈島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/art.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "海賊の宝の地図を持った、片目に眼帯をした柴犬。"
  },
  {
    "id": "fairy_json_84",
    "name": "マチャ (Macha)",
    "theme": "抹茶プリンスライム",
    "island_id": "青ヶ島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/mika.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "なまはげのお面を被った、実は怖がりの子グマ。"
  },
  {
    "id": "fairy_json_85",
    "name": "ボニン (Bonin)",
    "theme": "ボニンブルーイルカ",
    "island_id": "小笠原全域",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/miyabi.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ウミネコ繁殖地を守る、卵の殻を被ったヒナの精霊。"
  },
  {
    "id": "fairy_json_86",
    "name": "ピヨ (Piyo)",
    "theme": "小鳥ウミガメ",
    "island_id": "父島",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌿",
      "imageUrl": "/fairies/oribi.png",
      "colorFrom": "from-green-400",
      "colorTo": "to-emerald-600",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "利尻富士のようなとんがり帽子をかぶった、高山植物の妖精。"
  },
  {
    "id": "fairy_json_87",
    "name": "メグ (Megu)",
    "theme": "メグロの黄色い鳥",
    "island_id": "母島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/hahajima_card_1786466270951.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "花の浮島に住む、レブンアツモリソウのドレスを着たウサギ。"
  },
  {
    "id": "fairy_json_88",
    "name": "マイ (Mai)",
    "theme": "ヒロベソカタマイマイ",
    "island_id": "南島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/minamijima_card_1786502339546.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "なべつる岩の形をしたドーナツをかじっている、ぽっちゃりアザラシ。"
  },
  {
    "id": "fairy_json_89",
    "name": "シラ (Shira)",
    "theme": "しらすトンビ",
    "island_id": "江の島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/shirayuri_card_1786442239484.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "オロロン鳥（ウミガラス）の精霊。タキシードを着ているように見える。"
  },
  {
    "id": "fairy_json_90",
    "name": "セーラ (Sailor)",
    "theme": "ハンモックサル",
    "island_id": "初島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/hatsushima_card_1786466944394.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "サフォーク羊の赤ちゃんで、顔と足が真っ黒のモコモコ妖精。"
  },
  {
    "id": "fairy_json_91",
    "name": "アミ (Ami)",
    "theme": "しらす網カニ",
    "island_id": "篠島",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌿",
      "imageUrl": "/fairies/amami_card_1786463001546.jpg",
      "colorFrom": "from-green-400",
      "colorTo": "to-emerald-600",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "湖に浮かぶ島を守る、エゾシカと白鳥のキメラ。"
  },
  {
    "id": "fairy_json_92",
    "name": "タコ (Tako)",
    "theme": "タコ妖精",
    "island_id": "日間賀島",
    "rarity": "NORMAL",
    "attribute": "EARTH",
    "visual": {
      "icon": "🪨",
      "imageUrl": "/fairies/octo_nobg_1786593330280.jpg",
      "colorFrom": "from-amber-600",
      "colorTo": "to-orange-900",
      "shadowColor": "shadow-amber-700/50",
      "sparkleColor": "text-amber-200"
    },
    "description": "まん丸の大きなマリモ。コロコロ転がって移動する。"
  },
  {
    "id": "fairy_json_93",
    "name": "ペンキ (Penki)",
    "theme": "ペンキ黒猫",
    "island_id": "佐久島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/remo.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "流氷に乗ってやってきた、クリオネの羽を持つシロクマの赤ちゃん。"
  },
  {
    "id": "fairy_json_94",
    "name": "パール (Pearl)",
    "theme": "真珠ラッコ",
    "island_id": "鳥羽離島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/rin.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "オホーツクの海を守る、氷の結晶でできたキタキツネ。"
  },
  {
    "id": "fairy_json_95",
    "name": "マキ (Maki)",
    "theme": "巻貝ヤドカリ",
    "island_id": "神島",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌿",
      "imageUrl": "/fairies/shimaenaga.jpg",
      "colorFrom": "from-green-400",
      "colorTo": "to-emerald-600",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "野生馬の保護区に住む、風のように走る昆布のたてがみを持つ仔馬。"
  },
  {
    "id": "fairy_json_96",
    "name": "アマ (Ama)",
    "theme": "海女ペンギン",
    "island_id": "答志島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/amami_rabbit_card_1786439174408.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "エトピリカ（鳥）の赤ちゃんで、オレンジ色のくちばしがチャームポイント。"
  },
  {
    "id": "fairy_json_97",
    "name": "オニィ (Onii)",
    "theme": "玉ねぎ妖精",
    "island_id": "淡路島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/shisa.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "アザラシのコロニーに住む、昆布巻きのおくるみに包まれたゴマフアザラシ。"
  },
  {
    "id": "fairy_json_98",
    "name": "タマ (Tama)",
    "theme": "勾玉龍",
    "island_id": "沼島",
    "rarity": "EPIC",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/tama.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "瓶子岩（へいしいわ）の形をした、お酒の匂いが少しする陽気なカモメ。"
  },
  {
    "id": "fairy_json_99",
    "name": "レン (Ren)",
    "theme": "廃墟コウモリ",
    "island_id": "友ヶ島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/bat_nobg_1786594788108.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "無人島を守る、オオミズナギドリの精霊。星空を読むのが得意。"
  },
  {
    "id": "fairy_json_100",
    "name": "トッキー (Tokky)",
    "theme": "たらい舟トキ",
    "island_id": "佐渡島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/tida.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "木彫りのクマとシマエナガが合体したような、白くて丸い北の地の守護神。雪の結晶を降らせる。"
  },
  {
    "id": "fairy_json_101",
    "name": "ナベ (Nabe)",
    "theme": "わっぱ煮タヌキ",
    "island_id": "粟島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/awa_niigata_card_1786466330576.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "念頭平松の小枝をくわえた、小さなキジバトの妖精。"
  },
  {
    "id": "fairy_json_102",
    "name": "グラス (Glass)",
    "theme": "ガラス細工イルカ",
    "island_id": "能登島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/sefa_v2_card_1786460961026.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ピラミッド型（城山）の麦わら帽子をかぶった、賢い小さな白ヘビ。"
  },
  {
    "id": "fairy_json_103",
    "name": "ハク (Haku)",
    "theme": "白い神鹿",
    "island_id": "牡鹿半島",
    "rarity": "EPIC",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/tokine.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "テッポウユリの花をパラソル代わりにさしている、真っ白なウサギ。"
  },
  {
    "id": "fairy_json_104",
    "name": "コイ (Koi)",
    "theme": "コイン鹿",
    "island_id": "金華山",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/ayamaru_card_1786463081046.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "クロワッサンのような美味しそうな角を持つ、ヤギの赤ちゃん。"
  },
  {
    "id": "fairy_json_105",
    "name": "シーガル (Seagull)",
    "theme": "ウミネコ",
    "island_id": "松島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/iriomote_cat_card_1786439105304.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "モンガラカワハギの模様と色を持つ、カラフルで元気なカメレオン。"
  },
  {
    "id": "fairy_json_106",
    "name": "スワロ (Swaro)",
    "theme": "コンパスツバメ",
    "island_id": "飛島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/tobishima_card_1786466749042.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ニンジン型のサーフボードに乗って波乗りする、活発なウミガメ。"
  },
  {
    "id": "fairy_json_107",
    "name": "ユズ (Yuzu)",
    "theme": "ゆずメジロ",
    "island_id": "気仙沼大島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/ushima.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "もずくのような緑色のふわふわした髪の毛を持つ、優しそうなジュゴンの子供。"
  },
  {
    "id": "fairy_json_108",
    "name": "オイス (Oys)",
    "theme": "牡蠣アザラシ",
    "island_id": "浦戸諸島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/ameri_card_1786441891081.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "太陽の光でキラキラ輝く海塩（マース）の結晶でできた、透明な妖精。"
  },
  {
    "id": "fairy_json_109",
    "name": "シバ (Shiba)",
    "theme": "海賊柴犬",
    "island_id": "寒風沢島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/yonaguni_horse.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "赤い橋の模様が描かれたバンダナを首に巻いた、元気な子犬。"
  },
  {
    "id": "fairy_json_110",
    "name": "ベア (Bear)",
    "theme": "なまはげ子熊",
    "island_id": "男鹿半島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/zou.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "飛行機雲のように真っ白で長いマフラーを巻いたツバメ。"
  },
  {
    "id": "fairy_json_111",
    "name": "エッグ (Egg)",
    "theme": "卵の殻ウミネコ",
    "island_id": "蕪島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/yaku_card_1786438111327.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "お魚の天ぷらをくわえて幸せそうに眠る、ぽっちゃりしたトラ猫。"
  },
  {
    "id": "fairy_json_112",
    "name": "コン (Kon)",
    "theme": "高山植物妖精",
    "island_id": "利尻島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/rishiri_card_1786466892575.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "フクギ並木の丈夫な葉っぱを傘にしている、雨上がりのアマガエル。"
  },
  {
    "id": "fairy_json_113",
    "name": "アツミ (Atsumi)",
    "theme": "アツモリソウ妖精",
    "island_id": "礼文島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/rebun_card_1786466916445.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "島のタコ公園のモニュメントにそっくりな、ピンク色で愛嬌のあるタコ。"
  },
  {
    "id": "fairy_json_114",
    "name": "ポルル (Poruru)",
    "theme": "ドーナツアザラシ",
    "island_id": "奥尻島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/okushiri_card_1786466772542.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ハート型のサンゴ礁を大事そうに抱え込んでいる、ピンクの熱帯魚。"
  },
  {
    "id": "fairy_json_115",
    "name": "オロ (Oro)",
    "theme": "オロロン鳥",
    "island_id": "天売島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/teuri_card_1786466801408.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "伝統的なパナリ焼きの壺に入り込んでいる、恥ずかしがり屋のヤドカリ。"
  },
  {
    "id": "fairy_json_116",
    "name": "モコ (Moko)",
    "theme": "サフォーク羊",
    "island_id": "焼尻島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/yagishiri_card_1786466850872.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "頭にハイビスカスの花を乗せた、ピンク色でとても足の遅い水牛の赤ちゃん。"
  },
  {
    "id": "fairy_json_117",
    "name": "スワン (Swan)",
    "theme": "シカ白鳥キメラ",
    "island_id": "洞爺湖",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/hachijo_card_1786466117124.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "野生のウサギがいっぱいの島に住む、ひときわフワフワな白ウサギ。"
  },
  {
    "id": "fairy_json_118",
    "name": "モリ (Mori)",
    "theme": "マリモ",
    "island_id": "阿寒湖",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/magu.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "島の神聖なノッチ岩（奇岩）の形をした分厚い殻を持つ、長老のヤドカリ。"
  },
  {
    "id": "fairy_json_119",
    "name": "クリ (Kuri)",
    "theme": "クリオネ白熊",
    "island_id": "知床",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/hokuri_card_1786595418078.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "背中に星の砂の模様が浮かび上がっている、美しいケラマジカの子供。"
  },
  {
    "id": "fairy_json_120",
    "name": "アイス (Ice)",
    "theme": "氷キツネ",
    "island_id": "網走",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/yuki.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "古民家の美しい赤瓦の屋根を背負った、歴史を知る小さな亀。"
  },
  {
    "id": "fairy_json_121",
    "name": "ケルプ (Kelp)",
    "theme": "昆布馬",
    "island_id": "ユルリ島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/air_card_fixed_1786593412175.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "大きなクリクリの瞳で夜空を見上げる、ダイトウオオコウモリ。"
  },
  {
    "id": "fairy_json_122",
    "name": "ピリカ (Pirika)",
    "theme": "エトピリカ",
    "island_id": "モユルリ島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/art.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "サトウキビを満載したトロッコを引っ張る、力持ちで働き者のダイトウ犬。"
  },
  {
    "id": "fairy_json_123",
    "name": "クル (Kuru)",
    "theme": "おくるみアザラシ",
    "island_id": "大黒島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/fairy_shimaenaga_1784442212371.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "真っ赤なベレー帽をかぶったような、芸術家気質のノグチゲラ（キツツキ）。"
  },
  {
    "id": "fairy_json_124",
    "name": "カモ (Kamo)",
    "theme": "かもめ",
    "island_id": "かもめ島",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/maehama_card_1786459151246.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "荒波を乗りこなす騎士のような出立ちの、ヤンバルテナガコガネ。"
  },
  {
    "id": "fairy_json_125",
    "name": "ミズ (Mizu)",
    "theme": "オオミズナギドリ",
    "island_id": "松前大島",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/mika.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "満月の夜にサンゴの卵（ピンクの玉）を大切に運ぶ、タツノオトシゴ。"
  },
  {
    "id": "fairy_json_126",
    "name": "リュウオウ (Ryu-Ou)",
    "theme": "黄金の大龍",
    "island_id": "沖縄本島",
    "rarity": "EPIC",
    "attribute": "EARTH",
    "visual": {
      "icon": "🪨",
      "imageUrl": "/fairies/ryu.png",
      "colorFrom": "from-amber-600",
      "colorTo": "to-orange-900",
      "shadowColor": "shadow-amber-700/50",
      "sparkleColor": "text-amber-200"
    },
    "description": "首里城の装飾を思わせる、威厳に満ちつつもどこか愛嬌のある黄金の大龍。"
  },
  {
    "id": "fairy_json_127",
    "name": "グラン (Gran)",
    "theme": "巨大ウミガメ長老",
    "island_id": "宮古",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/guru.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "巨大な甲羅の上に、宮古ブルーの海とサンゴ礁の箱庭が形成されている長老ガメ。"
  },
  {
    "id": "fairy_json_128",
    "name": "センニン (Sennin)",
    "theme": "ヤマネコ仙人",
    "island_id": "八重山",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/miyabi.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "マングローブの太い根を杖代わりに持ち、森の深い知恵を蓄えた巨大なヤマネコ。"
  },
  {
    "id": "fairy_json_129",
    "name": "エンペラ (Empera)",
    "theme": "ザトウクジラ大帝",
    "island_id": "慶良間",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/fairy_ruri_1784439901297.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "ケラマブルーの波のしぶきと珊瑚礁の欠片を纏いながら大ジャンプするクジラ。"
  },
  {
    "id": "fairy_json_130",
    "name": "クイーン (Queen)",
    "theme": "アマミノクロウサギ女王",
    "island_id": "奄美",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/kanto_card_1786595381305.jpg",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "大島紬の美しい和柄のリボンと、王冠を身につけた神々しいアマミノクロウサギ。"
  },
  {
    "id": "fairy_json_131",
    "name": "ダイオウ (Daiou)",
    "theme": "マッコウクジラ王",
    "island_id": "小笠原",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/tamatori_card_1786442453131.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "深海の覇者。ボニンブルーの星空と一体化したように輝く、宇宙を泳ぐようなマッコウクジラ。"
  },
  {
    "id": "fairy_json_132",
    "name": "プリンセ (Prince)",
    "theme": "大白猫カメリア",
    "island_id": "伊豆",
    "rarity": "NORMAL",
    "attribute": "NATURE",
    "visual": {
      "icon": "🌿",
      "imageUrl": "/fairies/kuikku_card_1786442013208.jpg",
      "colorFrom": "from-green-400",
      "colorTo": "to-emerald-600",
      "shadowColor": "shadow-green-500/50",
      "sparkleColor": "text-green-200"
    },
    "description": "伊豆諸島のツバキの花園を背負った、とてつもなく巨大でモフモフの真っ白な猫。"
  },
  {
    "id": "fairy_json_133",
    "name": "スカイ (Sky)",
    "theme": "天空のオリーブ鳥",
    "island_id": "瀬戸内",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/kume_card_1786462181336.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "輝くオリーブの冠と、レモン色に光る美しい羽を持ち、瀬戸内の島々を見下ろす大鳥。"
  },
  {
    "id": "fairy_json_134",
    "name": "ダイコク (Daikoku)",
    "theme": "黄金角の大黒牛",
    "island_id": "隠岐",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/fairy_shisa_1786432760134.jpg",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "隠岐の荒波を鎮める力を持つと言われる、黄金の角を持った高貴で力強い黒牛。"
  },
  {
    "id": "fairy_json_135",
    "name": "ステンド (Stained)",
    "theme": "ステンドヤマネコ",
    "island_id": "五島・対馬",
    "rarity": "NORMAL",
    "attribute": "FIRE",
    "visual": {
      "icon": "🔥",
      "imageUrl": "/fairies/oribi.png",
      "colorFrom": "from-orange-400",
      "colorTo": "to-red-600",
      "shadowColor": "shadow-orange-500/50",
      "sparkleColor": "text-orange-200"
    },
    "description": "背中の模様が五島列島の教会のステンドグラスのように輝く、頼りがいのある巨大なツシマヤマネコ。"
  },
  {
    "id": "fairy_json_136",
    "name": "カムイ (Kamuy)",
    "theme": "シマフクロウ×ヒグマ",
    "island_id": "北海道",
    "rarity": "NORMAL",
    "attribute": "WATER",
    "visual": {
      "icon": "💧",
      "imageUrl": "/fairies/kodama.png",
      "colorFrom": "from-blue-400",
      "colorTo": "to-cyan-600",
      "shadowColor": "shadow-blue-500/50",
      "sparkleColor": "text-blue-200"
    },
    "description": "吹雪と氷の結晶を纏い、肩に賢いシマフクロウ（コタンコロカムイ）を乗せた北の大地の守護神ヒグマ。"
  }
];
