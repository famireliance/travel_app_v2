export type PackingCategoryType = 'essential' | 'sea_ship' | 'weather_sun' | 'gadget' | 'convenience';

export interface AffiliateProduct {
  id: string;
  categories: PackingCategoryType[];
  name: string;
  subtitle: string;
  description: string;
  isMustHave: boolean;
  hasAffiliateLink: boolean; // 現金など購入リンク不要なアイテム用
  icon: string;
  amazonUrl?: string;
  rakutenUrl?: string;
  recommendReason: string;
}

export const DEFAULT_AMAZON_TAG: string = 'kiratabi-22';
export const DEFAULT_RAKUTEN_ID: string = '56ebd0d5.3e11f68e.56ebd0d6.3ff60376';

export function createAmazonSearchUrl(query: string): string {
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(query)}&tag=${DEFAULT_AMAZON_TAG}`;
}

export function createRakutenSearchUrl(query: string): string {
  const targetUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(query)}/`;
  if (DEFAULT_RAKUTEN_ID && DEFAULT_RAKUTEN_ID.trim() !== '') {
    return `https://hb.afl.rakuten.co.jp/hgc/${DEFAULT_RAKUTEN_ID.trim()}/?pc=${encodeURIComponent(targetUrl)}`;
  }
  return targetUrl;
}

export const PACKING_CATEGORIES = [
  { id: 'all', name: 'すべて表示', icon: '✨' },
  { id: 'essential', name: '最重要必需品', icon: '🚨' },
  { id: 'sea_ship', name: '船旅・海アクティビティ', icon: '🌊' },
  { id: 'weather_sun', name: '日焼け・全天候・虫除け', icon: '☀️' },
  { id: 'gadget', name: '電子機器・撮影', icon: '🔋' },
  { id: 'convenience', name: 'プロの便利道具・宿対策', icon: '🎒' },
];

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // 1. 現金（購入リンク非表示）
  {
    id: 'cash_money',
    categories: ['essential'],
    name: '現金（千円札・100円玉小銭）',
    subtitle: '離島はカード不可の商店・券売機多数！',
    description: '離島の商店、食堂、コインロッカー、自動販売機、路線バス等はクレジットカードや電子マネーが使えない場合が非常に多いです。1万円札だとお釣りがないと言われることもあるため、千円札と100円玉を多めに用意しましょう。',
    isMustHave: true,
    hasAffiliateLink: false,
    icon: '💵',
    recommendReason: '「島にATMが1台もない」「郵便局のATMが土日休み」という離島も珍しくありません！'
  },
  
  // 2. 酔い止め薬（最重要 ＋ 船旅・海 の両方に重複表示）
  {
    id: 'motion_sickness_medicine',
    categories: ['essential', 'sea_ship'],
    name: '酔い止め薬（アネロン等）',
    subtitle: '船酔い・波しぶき対策の絶対必須アイテム',
    description: '高速船や小型フェリーは外洋に出ると想像以上に揺れます。島に薬局がないことも多いため、出発前・搭乗30分前に必ず服用しましょう。',
    isMustHave: true,
    hasAffiliateLink: true,
    icon: '💊',
    amazonUrl: createAmazonSearchUrl('アネロン 酔い止め'),
    rakutenUrl: createRakutenSearchUrl('アネロン 酔い止め'),
    recommendReason: '「アネロン ニスキャップ」は船酔いに最も効くと島旅経験者の間で絶大な支持を得ています！'
  },

  // 3. 宿対策・延長コード付きマルチタップ
  {
    id: 'extension_cord_tap',
    categories: ['essential', 'gadget', 'convenience'],
    name: '延長コード付き USBマルチタップ電源コード',
    subtitle: '離島宿・民宿はコンセントが遠い＆数が少ない！',
    description: '離島の素泊まり宿や伝統的な民宿では、枕元にコンセントがなかったり部屋に1個しか差し込み口がないことがよくあります。1.5m〜2mの延長コード付きマルチタップがあれば、ベッドでスマホを充電しながら快適に過ごせます。',
    isMustHave: true,
    hasAffiliateLink: true,
    icon: '🔌',
    amazonUrl: createAmazonSearchUrl('延長コード USB マルチタップ'),
    rakutenUrl: createRakutenSearchUrl('延長コード USB マルチタップ'),
    recommendReason: '「コンセントが柱の裏に1個だけ…」という離島民宿あるあるを完全解決する神アイテムです！'
  },

  // 4. アメニティ対策・速乾タオル
  {
    id: 'my_towel_set',
    categories: ['essential', 'convenience'],
    name: '速乾フェイスタオル ＆ バスタオルセット',
    subtitle: '離島の民宿・素泊まり宿はタオル無し・有料の場所多数！',
    description: 'ホテルと異なり、離島の民宿・ゲストハウス・素泊まり宿ではアメニティやタオルが用意されていない、もしくは有料レンタルであるケースが多くあります。持参すれば安心で、海水浴後にも重宝します。',
    isMustHave: true,
    hasAffiliateLink: true,
    icon: '🧖‍♀️',
    amazonUrl: createAmazonSearchUrl('速乾 マイクロファイバー タオル セット'),
    rakutenUrl: createRakutenSearchUrl('速乾 マイクロファイバー タオル セット'),
    recommendReason: '部屋干ししても一晩でカラッと乾くマイクロファイバー速乾タオルがベスト。'
  },

  // 5. 上半身＋下半身ラッシュガード＆マリンレギンス
  {
    id: 'rash_guard_set',
    categories: ['weather_sun', 'sea_ship'],
    name: 'UV長袖ラッシュガード ＆ マリンレギンス（トレンカ）',
    subtitle: '上半身・下半身の全身日焼け・クラゲ・サンゴ傷防止！',
    description: '南国・離島の強烈な紫外線は本州の数倍！水着だけで海に入ると足や背中が重度の日焼けになります。長袖ラッシュガード（上半身）とトレンカ・マリンレギンス（下半身）で全身をカバーしましょう。',
    isMustHave: true,
    hasAffiliateLink: true,
    icon: '👕',
    amazonUrl: createAmazonSearchUrl('ラッシュガード 上下セット マリンレギンス UPF50+'),
    rakutenUrl: createRakutenSearchUrl('ラッシュガード 上下セット マリンレギンス'),
    recommendReason: '足首まで覆うトレンカを履くことで、浅瀬のサンゴ傷やクラゲ刺されを100%近く防止できます。'
  },

  // 6. サンゴに優しい日焼け止め
  {
    id: 'reef_safe_sunscreen',
    categories: ['weather_sun', 'sea_ship'],
    name: 'サンゴに優しい日焼け止め（リーフセーフ）',
    subtitle: '沖縄・小笠原など世界自然遺産の海を守るマナー！',
    description: '一般的な日焼け止めに含まれる化学物質（オキシベンゾン等）はサンゴの白化原因になります。ハワイや沖縄で推奨されている「サンゴに優しいオーガニック日焼け止め」を選びましょう。',
    isMustHave: true,
    hasAffiliateLink: true,
    icon: '🧴',
    amazonUrl: createAmazonSearchUrl('サンゴに優しい日焼け止め'),
    rakutenUrl: createRakutenSearchUrl('サンゴに優しい日焼け止め'),
    recommendReason: '美しい透明な海とサンゴ礁を次世代に残すため、島旅人が選ぶべきエコ日焼け止めです。'
  },

  // 7. マリングローブ・作業用軍手
  {
    id: 'marine_gloves',
    categories: ['sea_ship', 'convenience'],
    name: 'マリングローブ・滑り止め手袋（軍手）',
    subtitle: '鋭いサンゴ礁・岩場・シーカヤックでの手傷防止！',
    description: 'ゴツゴツした岩場やサンゴ礁に手をついた際、ウニの棘や鋭い貝殻で手を切る事故が非常に多いです。手のひらが補強されたマリングローブや薄手軍手が一双あると安心です。',
    isMustHave: false,
    hasAffiliateLink: true,
    icon: '🧤',
    amazonUrl: createAmazonSearchUrl('マリングローブ シュノーケリング'),
    rakutenUrl: createRakutenSearchUrl('マリングローブ'),
    recommendReason: 'トレッキングやシュノーケリング、レンタサイクル時の転倒時の保護にも絶大です。'
  },

  // 8. 星空撮影用 小型トラベル三脚
  {
    id: 'star_tripod',
    categories: ['gadget', 'convenience'],
    name: '小型軽量トラベル三脚（スマホ・カメラ兼用）',
    subtitle: '離島の満天の星空・天の川・夜景スローシャッター撮影に！',
    description: '光害のない離島の夜空は満天の星空や天の川が広がります。スマホの「ナイトモード」や一眼レフで美しい星空をぶれずに撮影するには、軽量な折りたたみ三脚が欠かせません。',
    isMustHave: false,
    hasAffiliateLink: true,
    icon: '🔭',
    amazonUrl: createAmazonSearchUrl('スマホ 三脚 軽量 トラベル 星空撮影'),
    rakutenUrl: createRakutenSearchUrl('スマホ 三脚 軽量 トラベル'),
    recommendReason: 'リュックのサイドポケットに入る40cm以下の軽量アルミ・カーボン三脚が旅行に最適です。'
  },

  // 9. モバイルバッテリー
  {
    id: 'power_bank',
    categories: ['gadget', 'essential'],
    name: 'Anker 大容量モバイルバッテリー',
    subtitle: '写真撮影・GPS地図利用で電池消費激増！',
    description: '島での絶景写真撮影、Google Mapsやナビアプリの利用でスマホのバッテリーは一瞬で減ります。20000mAhクラスの大容量＆急速充電対応バッテリーが安心です。',
    isMustHave: true,
    hasAffiliateLink: true,
    icon: '🔋',
    amazonUrl: createAmazonSearchUrl('Anker モバイルバッテリー 20000mAh'),
    rakutenUrl: createRakutenSearchUrl('Anker モバイルバッテリー'),
    recommendReason: 'カフェや充電スポットがない離島の屋外散策にはモバイルバッテリーが命綱です。'
  },

  // 10. 高輝度LEDライト
  {
    id: 'led_flashlight',
    categories: ['gadget', 'convenience'],
    name: '小型超高輝度 LEDヘッドライト / 懐中電灯',
    subtitle: '夜道に街灯がない離島の暗闇・星空観察・洞窟探索用！',
    description: '離島の夜は街灯がなく「完全な闇」になります。スマホのライトだとあっという間にバッテリーが切れるため、USB充電式の明るい小型ライトや両手が空くヘッドライトを持参しましょう。',
    isMustHave: false,
    hasAffiliateLink: true,
    icon: '🔦',
    amazonUrl: createAmazonSearchUrl('LED ヘッドライト 充電式 超高輝度'),
    rakutenUrl: createRakutenSearchUrl('LED ヘッドライト 充電式'),
    recommendReason: '夜の海辺散策やウミガメ観察、満天の星空スポットへの移動で大活躍します！'
  },

  // 11. 偏光サングラス
  {
    id: 'polarized_sunglasses',
    categories: ['weather_sun', 'sea_ship'],
    name: '海中が見える 偏光サングラス',
    subtitle: '海面の反射光をカット！エメラルドグリーンの海の透明度が激変',
    description: '普通のサングラスと異なり、水面のギラつきを99%カットして「海の中の魚やサンゴ礁」をくっきり透かして見ることができます。高台からの絶景鑑賞でも感動が段違いです。',
    isMustHave: false,
    hasAffiliateLink: true,
    icon: '🕶️',
    amazonUrl: createAmazonSearchUrl('偏光サングラス マリン'),
    rakutenUrl: createRakutenSearchUrl('偏光サングラス'),
    recommendReason: '「こんなに綺麗に見えるのか！」と驚く、島旅フォトグラファー御用達の逸品。'
  },

  // 12. 完全防水スマホケース
  {
    id: 'waterproof_case',
    categories: ['sea_ship', 'essential'],
    name: 'IPX8 完全防水スマホケース',
    subtitle: '船上の水飛沫・ビーチでの浸水・水難防止！',
    description: '船のデッキでの撮影やグラスボート、ビーチ散策でスマホを海水から守ります。水に浮くフロート機能付きケースが紛失防止にも役立ちます。',
    isMustHave: true,
    hasAffiliateLink: true,
    icon: '📱',
    amazonUrl: createAmazonSearchUrl('防水スマホケース IPX8 浮く'),
    rakutenUrl: createRakutenSearchUrl('防水スマホケース IPX8'),
    recommendReason: 'ケースに入れたまま水中撮影やタッチ操作が可能な最新モデルがおすすめ！'
  },

  // 13. シュノーケル3点セット
  {
    id: 'snorkel_set',
    categories: ['sea_ship'],
    name: 'シュノーケル3点セット（マスク・スノーケル・短フィン）',
    subtitle: 'レンタル費用を節約＆ビーチからいつでも即海へ！',
    description: '島でのシュノーケルレンタル代（1日2,000円前後）を節約でき、自分の顔にフィットする清潔なギアでどこのビーチでも自由に泳げます。持ち運びやすいショートフィンが便利。',
    isMustHave: false,
    hasAffiliateLink: true,
    icon: '🤿',
    amazonUrl: createAmazonSearchUrl('シュノーケルセット 3点セット フィン付き'),
    rakutenUrl: createRakutenSearchUrl('シュノーケルセット 3点セット'),
    recommendReason: '浸水しにくいドライトップスノーケル付きのセットが初心者にも安全です。'
  },

  // 14. 完全防水ドライバッグ
  {
    id: 'dry_bag',
    categories: ['sea_ship', 'convenience'],
    name: '完全防水ドライバッグ（10L〜20L）',
    subtitle: '着替えやカメラを海上の水飛沫から完全ガード',
    description: '小型船の船上やカヌー・シュノーケリング移動時、突然のスコールでも荷物を一切濡らさないロールトップ式防水バッグ。',
    isMustHave: false,
    hasAffiliateLink: true,
    icon: '🎒',
    amazonUrl: createAmazonSearchUrl('防水ドライバッグ'),
    rakutenUrl: createRakutenSearchUrl('防水ドライバッグ'),
    recommendReason: 'リュックタイプにもなる2WAY防水バッグなら島内サイクリングにも最適。'
  },

  // 15. アクアシューズ・マリンシューズ
  {
    id: 'marine_shoes',
    categories: ['sea_ship', 'essential'],
    name: 'アクアシューズ・マリンシューズ',
    subtitle: 'サンゴ礁やゴツゴツした磯場での怪我防止！',
    description: '離島のビーチや磯場はサンゴの欠片や鋭い岩場が多く、ビーチサンダルだと足を怪我しやすいです。滑りにくいソール付きのマリンシューズが必須です。',
    isMustHave: false,
    hasAffiliateLink: true,
    icon: '🥾',
    amazonUrl: createAmazonSearchUrl('マリンシューズ アクアシューズ'),
    rakutenUrl: createRakutenSearchUrl('マリンシューズ'),
    recommendReason: '怪我を防ぎ、そのまま水に入って遊べるため、島旅の移動靴としても重宝します。'
  },

  // 16. サンシェードハット
  {
    id: 'sunscreen_hat',
    categories: ['weather_sun', 'essential'],
    name: 'UVカット サンシェードハット（首ガード付）',
    subtitle: '離島の強烈な直射日光・紫外線から首筋を守る！',
    description: '本州よりも格段に強烈な離島の日差し。風で飛ばされないあご紐付きで、首の後ろまでカバーできるサファリハットが最適です。',
    isMustHave: true,
    hasAffiliateLink: true,
    icon: '🧢',
    amazonUrl: createAmazonSearchUrl('UVカット サンシェードハット あご紐'),
    rakutenUrl: createRakutenSearchUrl('UVカット サンシェードハット'),
    recommendReason: '海上のフェリー甲板は強い風が吹くため、「あご紐付き」が絶対条件です！'
  },

  // 17. パッカブルデイパック
  {
    id: 'packable_backpack',
    categories: ['convenience'],
    name: '超軽量パッカブル（折りたたみ）デイパック',
    subtitle: 'メインバッグは宿に置き、手のひらサイズで軽快散策！',
    description: 'スーツケースや大きなバックパックは宿に預け、島内の散策やレンタルバイク・サイクリング時には手のひらサイズに折りたためる超軽量サブリュックが最高に便利です。',
    isMustHave: false,
    hasAffiliateLink: true,
    icon: '🎒',
    amazonUrl: createAmazonSearchUrl('パッカブル リュック 超軽量'),
    rakutenUrl: createRakutenSearchUrl('パッカブル リュック'),
    recommendReason: '使わない時はポケットにしまえる100g以下の撥水リュックが人気です。'
  },

  // 18. 虫除けスプレー
  {
    id: 'insect_repellent',
    categories: ['weather_sun', 'convenience'],
    name: '高濃度ディート虫除けスプレー ＆ 薬',
    subtitle: 'ブヨ・アブ・蚊が多い島の自然散策に！',
    description: '離島の草むらや展望台、滝めぐりコースには強い虫が生息しています。医薬品レベルの高濃度虫除けスプレーと痒み止め（ムヒアルファEX等）を持参しましょう。',
    isMustHave: false,
    hasAffiliateLink: true,
    icon: '🦟',
    amazonUrl: createAmazonSearchUrl('ブヨ 虫除けスプレー 医薬品'),
    rakutenUrl: createRakutenSearchUrl('ブヨ 虫除けスプレー'),
    recommendReason: '刺されると何日も猛烈なかゆみが続くため、散策前のスプレー噴霧が欠かせません。'
  },

  // 19. 除菌シート＆ゴミ袋
  {
    id: 'wet_wipes_trash_bag',
    categories: ['convenience', 'essential'],
    name: '除菌ウェルッシュ ＆ ゴミ袋セット',
    subtitle: 'ゴミ箱のない島が多い！自分のゴミは自分で持ち帰ろう',
    description: '自然保護や環境維持のため、島内にゴミ箱を設置していない離島が大半です。食べ歩きやランチ後のゴミを持ち帰る袋と除菌シートを常備しましょう。',
    isMustHave: true,
    hasAffiliateLink: true,
    icon: '🧻',
    amazonUrl: createAmazonSearchUrl('除菌ウェットティッシュ 携帯用'),
    rakutenUrl: createRakutenSearchUrl('除菌ウェットティッシュ'),
    recommendReason: '野外での食事前や、手が汚れた時に水道が近くにない場面で大活躍します。'
  }
];
