export interface AffiliateProduct {
  id: string;
  category: 'essential' | 'sea_ship' | 'weather_sun' | 'gadget' | 'convenience';
  name: string;
  subtitle: string;
  description: string;
  isMustHave: boolean; // 最重要必需品かどうか
  icon: string;
  amazonUrl: string;
  rakutenUrl: string;
  yahooUrl?: string;
  recommendReason: string;
}

// User can easily configure their affiliate tag or specific product URLs here
export const DEFAULT_AMAZON_TAG = 'kiratabi-22';

export const PACKING_CATEGORIES = [
  { id: 'all', name: 'すべて表示', icon: '✨' },
  { id: 'essential', name: '最重要必需品', icon: '🚨' },
  { id: 'sea_ship', name: '船旅・海アクティビティ', icon: '🌊' },
  { id: 'weather_sun', name: '日焼け・全天候・虫除け', icon: '☀️' },
  { id: 'gadget', name: '電子機器・撮影', icon: '🔋' },
  { id: 'convenience', name: 'プロの便利道具', icon: '🎒' },
];

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // 1. 最重要必需品
  {
    id: 'cash_money',
    category: 'essential',
    name: '現金（千円札・100円玉小銭）',
    subtitle: '離島はカード不可の商店・券売機多数！',
    description: '離島の商店、食堂、コインロッカー、自動販売機、路線バス等はクレジットカードや電子マネーが使えない場合が非常に多いです。1万円札だとお釣りがないと言われることもあるため、千円札と100円玉を多めに用意しましょう。',
    isMustHave: true,
    icon: '💵',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E5%B0%8F%E9%8A%AD%E5%85%A5%E3%82%8C+%E3%82%B3%E3%82%A4%E3%83%B3%E3%82%B1%E3%83%BC%E3%82%B9&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%B3%E3%82%A4%E3%83%B3%E3%82%B1%E3%83%BC%E3%82%B9/',
    recommendReason: '「島にATMが1台もない」「郵便局のATMが土日休み」という離島も珍しくありません！'
  },
  {
    id: 'motion_sickness_medicine',
    category: 'essential',
    name: '酔い止め薬（アネロン等）',
    subtitle: '船酔い・波しぶき対策の絶対必須アイテム',
    description: '高速船や小型フェリーは外洋に出ると想像以上に揺れます。島に薬局がないことも多いため、出発前・搭乗30分前に必ず服用しましょう。',
    isMustHave: true,
    icon: '💊',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%82%A2%E3%83%8D%E3%83%AD%E3%83%B3+%E9%85%95%E3%81%84%E3%81%A5%E3%82%81&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%A2%E3%83%8D%E3%83%AD%E3%83%B3/',
    recommendReason: '「アネロン ニスキャップ」は船酔いに最も効くと島旅経験者の間で絶大な支持を得ています！'
  },
  {
    id: 'power_bank',
    category: 'gadget',
    name: 'Anker 大容量モバイルバッテリー',
    subtitle: '写真撮影・GPS地図利用で電池消費激増！',
    description: '島での絶景写真撮影、Google Mapsやナビアプリの利用でスマホのバッテリーは一瞬で減ります。20000mAhクラスの大容量＆急速充電対応バッテリーが安心です。',
    isMustHave: true,
    icon: '🔋',
    amazonUrl: 'https://www.amazon.co.jp/s?k=Anker+%E3%83%AA%E3%83%99%E3%83%BC%E3%82%BF%E3%83%BC+%E3%83%A2%E3%83%90%E3%82%A4%E3%83%AB%E3%83%90%E3%83%83%E3%83%86%E3%83%AA%E3%83%BC&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/Anker+%E3%83%A2%E3%83%90%E3%82%A4%E3%83%AB%E3%83%90%E3%83%83%E3%83%86%E3%83%AA%E3%83%BC/',
    recommendReason: 'カフェや充電スポットがない離島の屋外散策にはモバイルバッテリーが命綱です。'
  },
  {
    id: 'waterproof_case',
    category: 'sea_ship',
    name: 'IPX8 完全防水スマホケース',
    subtitle: '船上の水飛沫・ビーチでの浸水・水難防止！',
    description: '船のデッキでの撮影やグラスボート、ビーチ散策でスマホを海水から守ります。水に浮くフロート機能付きケースが紛失防止にも役立ちます。',
    isMustHave: true,
    icon: '📱',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E9%98%B2%E6%B0%B4%E3%82%B9%E3%83%9E%E3%83%8B%E3%82%B1%E3%83%BC%E3%82%B9+IPX8+%E6%B5%AE%E3%81%8F&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E9%98%B2%E6%B0%B4%E3%82%B9%E3%83%9E%E3%83%9B%E3%82%B1%E3%83%BC%E3%82%B9+IPX8/',
    recommendReason: 'ケースに入れたまま水中撮影やタッチ操作が可能な最新モデルがおすすめ！'
  },
  {
    id: 'dry_bag',
    category: 'sea_ship',
    name: '完全防水ドライバッグ（10L〜20L）',
    subtitle: '着替えやカメラを海上の水飛沫から完全ガード',
    description: '小型船の船上やカヌー・シュノーケリング移動時、突然のスコールでも荷物を一切濡らさないロールトップ式防水バッグ。',
    isMustHave: false,
    icon: '🎒',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E9%98%B2%E6%B0%B4%E3%83%89%E3%83%A9%E3%82%A4%E3%83%90%E3%83%83%E3%82%B0&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E9%98%B2%E6%B0%B4%E3%83%89%E3%83%A9%E3%82%A4%E3%83%90%E3%83%83%E3%82%B0/',
    recommendReason: 'リュックタイプにもなる2WAY防水バッグなら島内サイクリングにも最適。'
  },
  {
    id: 'marine_shoes',
    category: 'sea_ship',
    name: 'アクアシューズ・マリンシューズ',
    subtitle: 'サンゴ礁やゴツゴツした磯場での怪我防止！',
    description: '離島のビーチや磯場はサンゴの欠片や鋭い岩場が多く、ビーチサンダルだと足を怪我しやすいです。滑りにくいソール付きのマリンシューズが必須です。',
    isMustHave: false,
    icon: '🥾',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%83%9E%E3%83%AA%E3%83%B3%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%BA+%E3%82%A2%E3%82%AF%E3%82%A2%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%BA&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%9E%E3%83%AA%E3%83%B3%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%BA/',
    recommendReason: '怪我を防ぎ、そのまま水に入って遊べるため、島旅の移動靴としても重宝します。'
  },
  {
    id: 'sunscreen_hat',
    category: 'weather_sun',
    name: 'UVカット サンシェードハット（首ガード付）',
    subtitle: '離島の強烈な直射日光・紫外線から首筋を守る！',
    description: '本州よりも格段に強烈な離島の日差し。風で飛ばされないあご紐付きで、首の後ろまでカバーできるサファリハットが最適です。',
    isMustHave: true,
    icon: '🧢',
    amazonUrl: 'https://www.amazon.co.jp/s?k=UV%E3%82%AB%E3%83%83%E3%83%88+%E3%82%B5%E3%83%B3%E3%82%B7%E3%82%A7%E3%83%BC%E3%83%89%E3%83%8F%E3%83%83%E3%83%88+%E3%81%82%E3%81%94%E7%B4%90&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/UV%E3%82%AB%E3%83%83%E3%83%88+%E3%82%B5%E3%83%B3%E3%82%B7%E3%82%A7%E3%83%BC%E3%83%89%E3%83%8F%E3%83%83%E3%83%88/',
    recommendReason: '海上のフェリー甲板は強い風が吹くため、「あご紐付き」が絶対条件です！'
  },
  {
    id: 'insect_repellent',
    category: 'weather_sun',
    name: '高濃度ディート虫除けスプレー ＆ 薬',
    subtitle: 'ブヨ・アブ・蚊が多い島の自然散策に！',
    description: '離島の草むらや展望台、滝めぐりコースには強い虫が生息しています。医薬品レベルの高濃度虫除けスプレーと痒み止め（ムヒアルファEX等）を持参しましょう。',
    isMustHave: false,
    icon: '🦟',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%83%96%E3%83%A8+%E8%99%AB%E9%99%A4%E3%81%91%E3%82%B9%E3%83%97%E3%83%AC%E3%83%BC+%E5%8C%BB%E7%99%82%E7%94%A8&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%96%E3%83%A8+%E8%99%AB%E9%99%A4%E3%81%91/',
    recommendReason: '刺されると何日も猛烈なかゆみが続くため、散策前のスプレー噴霧が欠かせません。'
  },
  {
    id: 'compact_towel',
    category: 'convenience',
    name: '超速乾マイクロファイバーセームタオル',
    subtitle: '濡れても絞れば一瞬で乾く！省スペースタオル',
    description: '海水浴や足湯、汗拭きに大活躍。バスタオルの1/4以下のコンパクトさで折りたため、絞るだけで何度でも吸水力が復活します。',
    isMustHave: false,
    icon: '🧖‍♂️',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%83%9E%E3%82%A4%E3%82%AF%E3%83%AD%E3%83%95%E3%82%A1%E3%82%A4%E3%83%90%E3%83%BC+%E9%80%9F%E4%B9%BE%E3%82%BF%E3%82%AA%E3%83%AB+%E3%82%BB%E3%83%BC%E3%83%A0%E3%82%BF%E3%82%AA%E3%83%AB&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E9%80%9F%E4%B9%BE%E3%82%BF%E3%82%AA%E3%83%AB+%E3%82%BB%E3%83%BC%E3%83%A0%E3%82%BF%E3%82%AA%E3%83%AB/',
    recommendReason: '荷物を最小限に抑えたい離島バックパッカーや日帰り旅に必須の便利品。'
  },
  {
    id: 'wet_wipes_trash_bag',
    category: 'convenience',
    name: '除菌ウェルッシュ ＆ ゴミ袋セット',
    subtitle: 'ゴミ箱のない島が多い！自分のゴミは自分で持ち帰ろう',
    description: '自然保護や環境維持のため、島内にゴミ箱を設置していない離島が大半です。食べ歩きやランチ後のゴミを持ち帰る袋と除菌シートを常備しましょう。',
    isMustHave: true,
    icon: '🧻',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E9%99%A4%E8%8F%8C%E3%82%A6%E3%82%A7%E3%83%83%E3%83%88%E3%83%86%E3%82%A3%E3%83%83%E3%82%B7%E3%83%A5+%E6%90%BA%E5%B8%AF%E7%94%A8&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E9%99%A4%E8%8F%8C%E3%82%A6%E3%82%A7%E3%83%83%E3%83%88%E3%83%86%E3%82%A3%E3%83%83%E3%82%B7%E3%83%A5/',
    recommendReason: '野外での食事前や、手が汚れた時に水道が近くにない場面で大活躍します。'
  }
];
