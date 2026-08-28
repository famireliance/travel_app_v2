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

export const DEFAULT_AMAZON_TAG = 'kiratabi-22';

export const PACKING_CATEGORIES = [
  { id: 'all', name: 'すべて表示', icon: '✨' },
  { id: 'essential', name: '最重要必需品', icon: '🚨' },
  { id: 'sea_ship', name: '船旅・海アクティビティ', icon: '🌊' },
  { id: 'weather_sun', name: '日焼け・全天候・虫除け', icon: '☀️' },
  { id: 'gadget', name: '電子機器・撮影', icon: '🔋' },
  { id: 'convenience', name: 'プロの便利道具・宿対策', icon: '🎒' },
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
    id: 'extension_cord_tap',
    category: 'gadget',
    name: '延長コード付き USBマルチタップ電源コード',
    subtitle: '離島宿・民宿はコンセントが遠い＆数が少ない！',
    description: '離島の素泊まり宿や伝統的な民宿では、枕元にコンセントがなかったり部屋に1個しか差し込み口がないことがよくあります。1.5m〜2mの延長コード付きマルチタップがあれば、ベッドでスマホを充電しながら快適に過ごせます。',
    isMustHave: true,
    icon: '🔌',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E5%BB%B6%E9%95%B7%E3%82%B3%E3%83%BC%E3%83%89+USB+%E3%83%9E%E3%83%AB%E3%83%81%E3%82%BF%E3%83%83%E3%83%97&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E5%BB%B6%E9%95%B7%E3%82%B3%E3%83%BC%E3%83%89+USB+%E3%82 me%E3%83%AB%E3%83%81%E3%82%BF%E3%83%83%E3%83%97/',
    recommendReason: '「コンセントが柱の裏に1個だけ…」という離島民宿あるあるを完全解決する神アイテムです！'
  },
  {
    id: 'my_towel_set',
    category: 'convenience',
    name: '速乾フェイスタオル ＆ バスタオルセット',
    subtitle: '離島の民宿・素泊まり宿はタオル無し・有料の場所多数！',
    description: 'ホテルと異なり、離島の民宿・ゲストハウス・素泊まり宿ではアメニティやタオルが用意されていない、もしくは有料レンタルであるケースが多くあります。持参すれば安心で、海水浴後にも重宝します。',
    isMustHave: true,
    icon: '🧖‍♀️',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E9%80%9F%E4%B9%BE+%E3%83%9E%E3%82%A4%E3%82%AF%E3%83%AD%E3%83%95%E3%82%A1%E3%82%A4%E3%83%90%E3%83%BC+%E3%82%BF%E3%82%AA%E3%83%AB+%E3%82%BB%E3%83%83%E3%83%88&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E9%80%9F%E4%B9%BE+%E3%82%BF%E3%82%AA%E3%83%AB+%E3%82%BB%E3%83%83%E3%83%88/',
    recommendReason: '部屋干ししても一晩でカラッと乾くマイクロファイバー速乾タオルがベスト。'
  },

  // 2. 日焼け・天候・虫除け
  {
    id: 'rash_guard',
    category: 'weather_sun',
    name: 'UVカット 長袖ラッシュガード（UPF50+）',
    subtitle: '直射日光による大やけど・クラゲ刺されを防ぐ！',
    description: '南国・離島の紫外線は本州の数倍！水着だけで海に入ると夜も眠れないほどの大やけどになります。長袖・フード付きのラッシュガードで全身を保護しましょう。',
    isMustHave: true,
    icon: '👕',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%83%A9%E3%83%83%E3%82%B7%E3%83%A5%E3%82%AC%E3%83%BC%E3%83%89+%E9%95%B7%E8%A2%96+UPF50%2B&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%A9%E3%83%83%E3%82%B7%E3%83%A5%E3%82%AC%E3%83%BC%E3%83%89+%E9%95%B7%E8%A2%96+UPF50%2B/',
    recommendReason: '体温低下防止やクラゲ・岩場での怪我防止にも直結する海の必須ウェアです。'
  },
  {
    id: 'reef_safe_sunscreen',
    category: 'weather_sun',
    name: 'サンゴに優しい日焼け止め（リーフセーフ）',
    subtitle: '沖縄・小笠原など世界自然遺産の海を守るマナー！',
    description: '一般的な日焼け止めに含まれる化学物質（オキシベンゾン等）はサンゴの白化原因になります。ハワイや沖縄で推奨されている「サンゴに優しいオーガニック日焼け止め」を選びましょう。',
    isMustHave: true,
    icon: '🧴',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%82%B5%E3%83%B3%E3%82%B4%E3%81%AB%E5%84%AA%E3%81%97%E3%81%84%E6%97%A5%E7%84%BC%E3%81%91%E3%81%A8%E3%82%81&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%B5%E3%83%B3%E3%82%B4%E3%81%AB%E5%84%AA%E3%81%97%E3%81%84%E6%97%A5%E7%84%BC%E3%81%91%E3%81%A8%E3%82%81/',
    recommendReason: '美しい透明な海とサンゴ礁を次世代に残すため、島旅人が選ぶべきエコ日焼け止めです。'
  },
  {
    id: 'marine_gloves',
    category: 'sea_ship',
    name: 'マリングローブ・滑り止め手袋（軍手）',
    subtitle: '鋭いサンゴ礁・岩場・シーカヤックでの手傷防止！',
    description: 'ゴツゴツした岩場やサンゴ礁に手をついた際、ウニの棘や鋭い貝殻で手を切る事故が非常に多いです。手のひらが補強されたマリングローブや薄手軍手が一双あると安心です。',
    isMustHave: false,
    icon: '🧤',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%83%9E%E3%83%AA%E3%83%B3%E3%82%B0%E3%83%AD%E3%83%BC%E3%83%96+%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%AF%E3%83%AA%E3%83%B3%E3%82%B0&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%9E%E3%83%AA%E3%83%B3%E3%82%B0%E3%83%AD%E3%83%BC%E3%83%96/',
    recommendReason: 'トレッキングやシュノーケリング、レンタサイクル時の転倒時の保護にも絶大です。'
  },

  // 3. 電子機器・ガジェット
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
    id: 'led_flashlight',
    category: 'gadget',
    name: '小型超高輝度 LEDヘッドライト / 懐中電灯',
    subtitle: '夜道に街灯がない離島の暗闇・星空観察・洞窟探索用！',
    description: '離島の夜は街灯がなく「完全な闇」になります。スマホのライトだとあっという間にバッテリーが切れるため、USB充電式の明るい小型ライトや両手が空くヘッドライトを持参しましょう。',
    isMustHave: false,
    icon: '🔦',
    amazonUrl: 'https://www.amazon.co.jp/s?k=LED+%E3%83%98%E3%83%83%E3%83%89%E3%83%A9%E3%82%A4%E3%83%88+%E5%85%85%E9%9B%BB%E5%BC%8F+%E8%B6%85%E2%98%85%E8%BC%9D%E5%BA%A6&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/LED+%E3%83%98%E3%83%83%E3%83%89%E3%83%A9%E3%82%A4%E3%83%88+%E5%85%85%E9%9B%BB%E5%BC%8F/',
    recommendReason: '夜の海辺散策やウミガメ観察、満天の星空スポットへの移動で大活躍します！'
  },
  {
    id: 'polarized_sunglasses',
    category: 'weather_sun',
    name: '海中が見える 偏光サングラス',
    subtitle: '海面の反射光をカット！エメラルドグリーンの海の透明度が激変',
    description: '普通のサングラスと異なり、水面のギラつきを99%カットして「海の中の魚やサンゴ礁」をくっきり透かして見ることができます。高台からの絶景鑑賞でも感動が段違いです。',
    isMustHave: false,
    icon: '🕶️',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E5%81%8F%E5%85%89%E3%82%B5%E3%83%B3%E3%82%B0%E3%83%A9%E3%82%B9+%E9%87%A3%E3%82%8A+%E3%83%9E%E3%83%AA%E3%83%B3&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E5%81%8F%E5%85%89%E3%82%B5%E3%83%B3%E3%82%B0%E3%83%A9%E3%82%B9/',
    recommendReason: '「こんなに綺麗に見えるのか！」と驚く、島旅フォトグラファー御用達の逸品。'
  },

  // 4. 海・船旅・マリン
  {
    id: 'waterproof_case',
    category: 'sea_ship',
    name: 'IPX8 完全防水スマホケース',
    subtitle: '船上の水飛沫・ビーチでの浸水・水難防止！',
    description: '船のデッキでの撮影やグラスボート、ビーチ散策でスマホを海水から守ります。水に浮くフロート機能付きケースが紛失防止にも役立ちます。',
    isMustHave: true,
    icon: '📱',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E9%98%B2%E6%B0%B4%E3%82%B9%E3%83%9E%E3%83%8B%E3%82%B1%E3%83%BC%E3%82%B9+IPX8+%E6%B5%AE%E3%81%8F&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E9%98%B2%E6%B0%B4%E3%82%B9%E3%83%9E%E3%83%8B%E3%82%B1%E3%83%BC%E3%82%B9+IPX8/',
    recommendReason: 'ケースに入れたまま水中撮影やタッチ操作が可能な最新モデルがおすすめ！'
  },
  {
    id: 'snorkel_set',
    category: 'sea_ship',
    name: 'シュノーケル3点セット（マスク・スノーケル・短フィン）',
    subtitle: 'レンタル費用を節約＆ビーチからいつでも即海へ！',
    description: '島でのシュノーケルレンタル代（1日2,000円前後）を節約でき、自分の顔にフィットする清潔なギアでどこのビーチでも自由に泳げます。持ち運びやすいショートフィンが便利。',
    isMustHave: false,
    icon: '🤿',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%82%B7%E3%83%A5%E3%83%8E%E3%83%BC%E3%82%B1%E3%83%AB%E3%82%BB%E3%83%83%E3%83%88+3%E7%94%B9%E7%82%B9+%E3%83%95%E3%82%A3%E3%83%B3付き&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%B7%E3%83%A5%E3%83%8E%E3%83%BC%E3%82%B1%E3%83%AB%E3%82%BB%E3%83%83%E3%83%88+3%E7%94%B9%E7%82%B9/',
    recommendReason: '浸水しにくいドライトップスノーケル付きのセットが初心者にも安全です。'
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
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E9%98%B2%E6%B0%B4%E3%83%89%E3%83%A9%E3%82%A4%E3%83%90%E3%83%83%E3%83%86%E3%82%B0/',
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

  // 5. 便利道具・全天候
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
    id: 'packable_backpack',
    category: 'convenience',
    name: '超軽量パッカブル（折りたたみ）デイパック',
    subtitle: 'メインバッグは宿に置き、手のひらサイズで軽快散策！',
    description: 'スーツケースや大きなバックパックは宿に預け、島内の散策やレンタルバイク・サイクリング時には手のひらサイズに折りたためる超軽量サブリュックが最高に便利です。',
    isMustHave: false,
    icon: '🎒',
    amazonUrl: 'https://www.amazon.co.jp/s?k=%E3%83%91%E3%83%83%E3%82%AB%E3%83%96%E3%83%AB+%E3%83%AA%E3%83%A5%E3%83%83%E3%82%AF+%E8%B6%85%E7%B5%84%E9%87%8F&tag=' + DEFAULT_AMAZON_TAG,
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%91%E3%83%83%E3%82%AB%E3%83%96%E3%83%AB+%E3%83%AA%E3%83%A5%E3%83%83%E3%82%AF/',
    recommendReason: '使わない時はポケットにしまえる100g以下の撥水リュックが人気です。'
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
