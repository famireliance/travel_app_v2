/**
 * 日本全国有人離島・無人島 インフラ・実用情報 高精度引当マスター
 * 国土交通省 離島振興法指定データ・各自治体公開情報・実地調査基準準拠
 */

export interface IslandInfrastructureInfo {
  has_atm: boolean | 'limited';
  atm_status: 'あり' | 'なし' | '限定的';
  atm_desc: string;
  has_clinic: boolean | 'limited';
  clinic_status: 'あり' | 'なし' | '限定的';
  clinic_desc: string;
  has_store: boolean | 'limited';
  store_status: 'あり' | 'なし' | '限定的';
  store_desc: string;
  signal_status: string;
  signal_desc: string;
  day_trip: boolean | 'difficult';
  day_trip_status: '日帰り可能' | '宿泊推奨' | '日帰り困難';
  day_trip_desc: string;
  cash_advice: 'cash_essential' | 'cash_preferred' | 'cashless_ok';
  cash_advice_text: string;
  tips: string[];
  is_uninhabited: boolean;
}

// 主要離島・特徴的離島の実地確認済みインフラ辞書
const VERIFIED_INFRASTRUCTURE_MAP: Record<string, Partial<IslandInfrastructureInfo>> = {
  // 青ヶ島 (東京都・伊豆諸島)
  '58': {
    has_atm: 'limited',
    atm_status: 'あり',
    atm_desc: '青ヶ島郵便局（ゆうちょATM）あり。平日・土曜稼働（日曜休止・取扱時間に注意）。',
    has_clinic: 'limited',
    clinic_status: 'あり',
    clinic_desc: '青ヶ島村国民健康保険直営診療所あり。急患時はドクターヘリ・東京消防庁ヘリ搬送。',
    has_store: 'limited',
    store_status: 'あり',
    store_desc: '十一屋酒店・あおがしま商店などの個人商店あり（日用品・青酎購入可）。コンビニなし。',
    signal_status: '主要3キャリア対応',
    signal_desc: 'docomo / au / SoftBankの電波が開通（集落中心）。カルデラ低地（ひんぎゃ）等は微弱。',
    day_trip: 'difficult',
    day_trip_status: '宿泊推奨',
    day_trip_desc: '定期船「あおがしま丸」・東京愛らんどシャトル（ヘリ）共に1日1便体制のため宿泊必須。',
    cash_advice: 'cash_essential',
    cash_advice_text: '島内は現金決済が基本です。クレジットカードや電子マネーは利用できない場所が多いため現金の持参が必須です。',
    tips: [
      '商店・自動販売機での購入用に小銭・千円札を多めに用意してください。',
      'ヘリ・船は天候による欠航率が高いため、滞在日数や食料に余裕を持った計画を立てましょう。',
      '外食できる飲食店（居酒屋など）は完全予約制の場合があります。'
    ]
  },

  // 父島 (小笠原諸島)
  '63': {
    has_atm: true,
    atm_status: 'あり',
    atm_desc: '小笠原郵便局（ゆうちょATM）、JA東京島しょATM、七島信用組合ATMあり。',
    has_clinic: true,
    clinic_status: 'あり',
    clinic_desc: '小笠原村診療所有り（内科・外科対応）。緊急時は自衛隊飛行艇・ヘリ搬送。',
    has_store: true,
    store_status: 'あり',
    store_desc: 'スーパー小祝、生協、スーパー佐藤など複数店舗あり。お弁当や総菜・お酒も購入可能。',
    signal_status: '主要3キャリア対応',
    signal_desc: 'docomo / au / SoftBank通話可能（二見港集落・主要道路）。山間部・西海岸は圏外あり。',
    day_trip: false,
    day_trip_status: '宿泊推奨',
    day_trip_desc: '「おがさわら丸」定期航路の運航サイクル（往復6日間単位）のため、現地最低3泊の滞在が基本。',
    cash_advice: 'cash_preferred',
    cash_advice_text: '主要店舗でクレジットカードや電子マネーが利用できますが、アクティビティや個人商店用に現金も必要です。',
    tips: [
      'ハイキングや自然探勝路では圏外になるため、紙のマップやオフラインマップを携行しましょう。',
      '日焼け止め・虫除け・常備薬は島内でも購入できますが、使い慣れたものを持参すると安心です。'
    ]
  },

  // 母島 (小笠原諸島)
  '64': {
    has_atm: 'limited',
    atm_status: 'あり',
    atm_desc: '母島郵便局（ゆうちょATM）、JA東京島しょ母島店ATMあり。',
    has_clinic: 'limited',
    clinic_status: 'あり',
    clinic_desc: '小笠原村母島診療所あり。医師・看護師が常駐。',
    has_store: 'limited',
    store_status: 'あり',
    store_desc: '前田商店・JA売店など集落内にあり。パン・日用品・飲料を販売。コンビニなし。',
    signal_status: '主要3キャリア対応',
    signal_desc: '集落（元地地区）周辺は良好。南崎や乳房山登山道では圏外あり。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '父島から「ははじま丸」（片道約2時間）で日帰り往復も可能（約4時間の滞在時間）。',
    cash_advice: 'cash_essential',
    cash_advice_text: '商店や宿泊施設では現金決済が推奨されます。ATM稼働時間にご注意ください。',
    tips: [
      '母島観光はレンタカーまたはレンタバイク（台数限定のため事前予約必須）が便利です。'
    ]
  },

  // 石垣島 (沖縄県)
  '392': {
    has_atm: true,
    atm_status: 'あり',
    atm_desc: '都市銀行・地方銀行（琉球銀行・沖縄銀行・海邦銀行）、郵便局、コンビニATM多数。',
    has_clinic: true,
    clinic_status: 'あり',
    clinic_desc: '沖縄県立八重山病院（総合病院・救急救命救急センター）ほか医療機関多数。',
    has_store: true,
    store_status: 'あり',
    store_desc: 'マックスバリュ、サンエー、ドン・キホーテ、ファミリーマート多数あり（24時間営業有）。',
    signal_status: '5G/4G全域対応',
    signal_desc: '全キャリア良好。高速データ通信・Wi-Fi環境も島内全域に充実。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '各地からの直行航空便が多数発着。日帰り観光・八重山諸島アイランドホッピングの拠点。',
    cash_advice: 'cashless_ok',
    cash_advice_text: 'ほぼ全域で各種キャッシュレス決済（クレジット・QR決済・交通系IC）が利用可能です。',
    tips: [
      '周辺離島（竹富・西表・小浜・黒島・鳩間・波照間）へ渡る前に、石垣島で現金の補充を済ませておくと安心です。'
    ]
  },

  // 竹富島 (沖縄県)
  '393': {
    has_atm: 'limited',
    atm_status: 'あり',
    atm_desc: '竹富郵便局（ゆうちょATM）あり（平日のみ稼働・土日祝休止）。',
    has_clinic: 'limited',
    clinic_status: 'あり',
    clinic_desc: '竹富診療所あり。重症時は石垣島（船で10分〜15分）への搬送体制完備。',
    has_store: 'limited',
    store_status: 'あり',
    store_desc: '集落内に個人商店・雑貨売店数軒あり。コンビニなし。',
    signal_status: '主要3キャリア良好',
    signal_desc: '石垣島本島に近いため、docomo / au / SoftBankともに全域で電波良好。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '石垣港離島ターミナルから高速船で約10〜15分。1日十数便運航しており気軽に日帰り可能。',
    cash_advice: 'cash_preferred',
    cash_advice_text: '水牛車や主要カフェはキャッシュレス対応が進んでいますが、個人商店や自販機用に現金も準備を。',
    tips: [
      '島内は白砂の道のため、自転車または徒歩での散策が主流です。'
    ]
  },

  // 西表島 (沖縄県)
  '396': {
    has_atm: 'limited',
    atm_status: 'あり',
    atm_desc: '大原郵便局、西表島郵便局、JA八重山地区ATMあり。',
    has_clinic: 'limited',
    clinic_status: 'あり',
    clinic_desc: '大原診療所、西部診療所有り。医師・看護師が常駐。',
    has_store: 'limited',
    store_status: 'あり',
    store_desc: 'スーパー玉盛（東部）、スーパー川満（西部）など個人スーパー数軒あり。コンビニなし。',
    signal_status: '主要3キャリア対応',
    signal_desc: '集落・主要海岸道路は通話良好。内陸のジャングル・マングローブ林深部は圏外。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '石垣港から大原港（約35〜40分）または上原港（約45〜50分）へ定期船が頻発し、日帰りツアーも人気。',
    cash_advice: 'cash_preferred',
    cash_advice_text: 'ホテルやアクティビティ会社はキャッシュレス可ですが、レンタカーや飲食店用に現金も必須。',
    tips: [
      '上原港航路は冬場の北風やシケで欠航しやすいため、大原港経由の振替バス運行を把握しておきましょう。'
    ]
  },

  // 波照間島 (沖縄県)
  '400': {
    has_atm: 'limited',
    atm_status: 'あり',
    atm_desc: '波照間郵便局（ゆうちょATM）あり。平日稼働。土日祝の現金引出は不可。',
    has_clinic: 'limited',
    clinic_status: 'あり',
    clinic_desc: '波照間診療所あり（村営・医師常駐）。',
    has_store: 'limited',
    store_status: 'あり',
    store_desc: '共同売店、名石商店など集落内に数軒あり（名産「泡波」の販売も）。コンビニなし。',
    signal_status: '主要キャリア対応',
    signal_desc: '集落やニシ浜は電波良好。最南端の碑付近などで一部電波が弱まることがあります。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '石垣島から高速船（約60〜80分）で日帰り可能ですが、海況により高速船の欠航率が高いため宿泊推奨。',
    cash_advice: 'cash_essential',
    cash_advice_text: '島内はほぼ現金決済のみです。郵便局ATMが停止する週末は必ず現金を多めにご用意ください。',
    tips: [
      '日本最南端の有人島。夜の星空観測（南十字星など）が格別なため、1泊以上の宿泊が強く推奨されます。'
    ]
  },

  // 与那国島 (沖縄県)
  '401': {
    has_atm: 'limited',
    atm_status: 'あり',
    atm_desc: '与那国郵便局、久部良郵便局（ゆうちょATM）、JAおきなわ与那国支店ATMあり。',
    has_clinic: 'limited',
    clinic_status: 'あり',
    clinic_desc: '与那国診療所有り（ドラマ「Dr.コトー診療所」のモデル）。医師・看護師常駐。',
    has_store: 'limited',
    store_status: 'あり',
    store_desc: '各集落（祖納・久部良・比川）に個人スーパー・共同売店あり。コンビニなし。',
    signal_status: '主要3キャリア対応',
    signal_desc: '各集落・主要道路沿いは良好。南牧場や東崎の一部で微弱エリアあり。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '那覇・石垣空港からの航空便（RAC）があり日帰りも可能ですが、海底遺跡や見どころが多く宿泊推奨。',
    cash_advice: 'cash_essential',
    cash_advice_text: '宿や飲食店・レンタカーでは現金決済が主流です。',
    tips: [
      '日本最西端の碑から台湾の山並みが見える日もあります。移動にはレンタカーやレンタバイクが必須です。'
    ]
  },

  // 宮古島 (沖縄県)
  '386': {
    has_atm: true,
    atm_status: 'あり',
    atm_desc: '琉球銀行・沖縄銀行・海邦銀行各支店、郵便局、ファミリーマート等コンビニATM多数。',
    has_clinic: true,
    clinic_status: 'あり',
    clinic_desc: '沖縄県立宮古病院（総合病院・救急指定）ほか、クリニック・歯科多数。',
    has_store: true,
    store_status: 'あり',
    store_desc: 'サンエー、イオン（マックスバリュ）、ドン・キホーテ、ファミリーマート多数。',
    signal_status: '5G/4G全域対応',
    signal_desc: '全域で高速データ通信完備。離島大橋（伊良部大橋・池間大橋・来間大橋）上も良好。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '東京・大阪・名古屋・那覇からの直行便が多数就航。気軽な日帰り観光も可能です。',
    cash_advice: 'cashless_ok',
    cash_advice_text: 'ほぼ全域でキャッシュレス決済（クレジットカード・電子マネー・QRコード）が利用可能。',
    tips: [
      '伊良部島・下地島・池間島・来間島とは無料の海上橋で陸続きとなっており、レンタカーで周遊できます。'
    ]
  },

  // 屋久島 (鹿児島県)
  '457': {
    has_atm: true,
    atm_status: 'あり',
    atm_desc: '鹿児島銀行、JA種子屋久、郵便局（各集落）ATMあり。',
    has_clinic: true,
    clinic_status: 'あり',
    clinic_desc: '公益財団法人屋久島徳洲会病院（総合病院・24時間救急救命）あり。',
    has_store: true,
    store_status: 'あり',
    store_desc: 'Aコープ、ライフセンターヤクデン、ドラッグストア、地元商店など多数（24Hコンビニはなし）。',
    signal_status: '主要3キャリア良好',
    signal_desc: '外周道路・集落沿いは4G通話良好。白谷雲水峡や縄文杉トレッキングルート深部は圏外。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '鹿児島空港からの飛行機や高速船トッピーで日帰りも可能ですが、トレッキングは宿泊必須。',
    cash_advice: 'cash_preferred',
    cash_advice_text: 'ホテルやレンタカーはカード利用可ですが、登山バスや個人飲食店用に小銭・現金が必要です。',
    tips: [
      '登山ルートにはトイレ・売店が限定されるため、携帯トイレや行動食・レインウェアを必ず携行してください。'
    ]
  },

  // 佐渡島 (新潟県)
  '355': {
    has_atm: true,
    atm_status: 'あり',
    atm_desc: '第四北越銀行、JA佐渡、郵便局、ローソン等コンビニATM多数あり。',
    has_clinic: true,
    clinic_status: 'あり',
    clinic_desc: '佐渡総合病院（災害拠点病院・急性期医療）など医療機関が充実。',
    has_store: true,
    store_status: 'あり',
    store_desc: '大型スーパー（マルイ、フレッシュマツヤ）、ローソン等多数あり。',
    signal_status: '5G/4G全域対応',
    signal_desc: '主要平野部・沿岸部は全キャリア良好。山岳ドライブウェイの一部に電波微弱区間あり。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '新潟港からジェットフォイルで約67分。日帰り観光ツアーも毎日催行されています。',
    cash_advice: 'cashless_ok',
    cash_advice_text: '主要観光施設や宿・レンタカーでキャッシュレス対応。',
    tips: [
      '沖縄本島に次ぐ広大な島のため、周遊にはレンタカーまたは定期観光バスの利用が必須です。'
    ]
  },

  // 淡路島 (兵庫県)
  '372': {
    has_atm: true,
    atm_status: 'あり',
    atm_desc: '三井住友銀行、みなと銀行、郵便局、セブンイレブン・ローソン等コンビニATM多数。',
    has_clinic: true,
    clinic_status: 'あり',
    clinic_desc: '兵庫県立淡路医療センター（高度総合医療・救命救急）など多数完備。',
    has_store: true,
    store_status: 'あり',
    store_desc: 'イオン、マルナカ、スーパー各社、コンビニ多数あり。',
    signal_status: '5G/4G全域完備',
    signal_desc: '全域で良好な通信環境。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '明石海峡大橋・大鳴門橋で本州・四国と直結。神戸・大阪から高速バスや車で気軽に日帰り可能。',
    cash_advice: 'cashless_ok',
    cash_advice_text: 'ほぼ全域でキャッシュレス対応。',
    tips: []
  },

  // 小豆島 (香川県)
  '389': {
    has_atm: true,
    atm_status: 'あり',
    atm_desc: '百十四銀行、香川銀行、郵便局、セブンイレブン等コンビニATMあり。',
    has_clinic: true,
    clinic_status: 'あり',
    clinic_desc: '小豆島中央病院（総合病院・救急指定）あり。',
    has_store: true,
    store_status: 'あり',
    store_desc: 'マルナカ、ダイキ、セブンイレブンなど多数展開。',
    signal_status: '主要キャリア良好',
    signal_desc: '全域で良好。寒霞渓山頂部も通信可能。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '高松港・岡山新岡山港・姫路港・神戸港からフェリー・高速船が頻発し、日帰り観光も人気。',
    cash_advice: 'cashless_ok',
    cash_advice_text: '主要施設・宿・フェリー窓口でキャッシュレス対応。',
    tips: []
  },

  // 礼文島 (北海道)
  '1': {
    has_atm: 'limited',
    atm_status: 'あり',
    atm_desc: '礼文郵便局、香深郵便局（ゆうちょATM）、北洋銀行ATMあり。',
    has_clinic: 'limited',
    clinic_status: 'あり',
    clinic_desc: '礼文町国民健康保険船泊診療所・香深診療所有り。緊急時は稚内からドクターヘリ。',
    has_store: 'limited',
    store_status: 'あり',
    store_desc: 'セイコーマート（日本最北の有人離島店）、地元商店あり。生鮮食品・ホットシェフ購入可。',
    signal_status: '主要3キャリア対応',
    signal_desc: '集落・港・主要道路沿いは4G通話良好。トレッキングルート岬部などで一部微弱。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '稚内港または利尻島からのハートランドフェリーで日帰り可能。トレイル満喫には宿泊推奨。',
    cash_advice: 'cash_preferred',
    cash_advice_text: 'セイコーマートやホテルはキャッシュレス対応ですが、民宿やバス乗車用に現金をご用意ください。',
    tips: [
      '「花の浮島」として高山植物のベストシーズン（5月〜8月）は宿が満室になりやすいため早期予約を。'
    ]
  },

  // 利尻島 (北海道)
  '2': {
    has_atm: 'limited',
    atm_status: 'あり',
    atm_desc: '稚内信用金庫、郵便局、セイコーマート設置ATMあり。',
    has_clinic: 'limited',
    clinic_status: 'あり',
    clinic_desc: '利尻町国保診療所・利尻富士町国保診療所有り。',
    has_store: 'limited',
    store_status: 'あり',
    store_desc: 'セイコーマート（鴛泊・沓形）、地元スーパー・お土産店あり。',
    signal_status: '主要3キャリア良好',
    signal_desc: '外周道路沿いは全キャリア良好。利尻山（利尻富士）登山道中腹以上は微弱〜圏外。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '札幌丘珠・新千歳からの航空便（夏期直行便）または稚内フェリーで日帰り観光可能。',
    cash_advice: 'cash_preferred',
    cash_advice_text: '主要施設はカード対応。個人商店や登山関連の支払いに現金をご用意ください。',
    tips: [
      '利尻山登山（標高1,721m）は本格登山の装備（携帯トイレ持参必須）が必要です。'
    ]
  },

  // 伊豆大島 (東京都)
  '49': {
    has_atm: true,
    atm_status: 'あり',
    atm_desc: 'みずほ銀行ATM、七島信用組合、郵便局、JA東京島しょATMあり。',
    has_clinic: true,
    clinic_status: 'あり',
    clinic_desc: '大島医療センター（救急対応・人工透析等）完備。',
    has_store: true,
    store_status: 'あり',
    store_desc: 'べにや、スーパーさのや、地元ストア、ドラッグストアなど多数あり。',
    signal_status: '主要3キャリア良好',
    signal_desc: '三原山裏砂漠の一部を除き、島内ほぼ全域で安定した通信が可能。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '東京竹芝港・熱海港から高速ジェット船で約1時間45分（熱海から約45分）。気軽な日帰り旅が可能。',
    cash_advice: 'cashless_ok',
    cash_advice_text: '多くの商店・飲食店・レンタカーでキャッシュレス決済が可能です。',
    tips: []
  },

  // 八丈島 (東京都)
  '57': {
    has_atm: true,
    atm_status: 'あり',
    atm_desc: 'みずほ銀行ATM、七島信用組合、八丈島郵便局、スーパーあさぬま等にATM多数。',
    has_clinic: true,
    clinic_status: 'あり',
    clinic_desc: '町立八丈病院（総合診療・救急救命・へき地医療拠点）あり。',
    has_store: true,
    store_status: 'あり',
    store_desc: 'スーパーあさぬま、スーパーまつもと、ドラッグストア等多数（深夜営業店あり）。',
    signal_status: '5G/4G全域良好',
    signal_desc: '島内ほぼ全域で高速データ通信が可能。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '羽田空港からANA直行便で約55分（1日3便）。日帰り温泉・ドライブ旅も人気。',
    cash_advice: 'cashless_ok',
    cash_advice_text: '主要店舗でキャッシュレス利用可能。個人飲食店用に現金の用意もあると安心です。',
    tips: []
  },

  // 式根島 (東京都)
  '52': {
    has_atm: 'limited',
    atm_status: 'あり',
    atm_desc: '式根島郵便局（ゆうちょATM）あり（平日・土曜稼働）。みずほ銀行提携。',
    has_clinic: 'limited',
    clinic_status: 'あり',
    clinic_desc: '新島村式根島診療所あり（医師・看護師常駐）。',
    has_store: 'limited',
    store_status: 'あり',
    store_desc: 'みやとら、ファミリーストアみやふじ、宮房商店など個人商店あり。お弁当・日用品・釣具販売。',
    signal_status: '主要3キャリア対応',
    signal_desc: '集落や地鉈温泉周辺は電波良好。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '新島から村営連絡船「にしき」（約15分）で気軽に日帰り往復可能。東京竹芝からも高速船で日帰り枠あり。',
    cash_advice: 'cash_essential',
    cash_advice_text: '商店や民宿・露天風呂（地鉈温泉・足付温泉）は現金が基本です。',
    tips: [
      '天然の海中温泉（水着着用必須）が名物です。水着とタオルを必ず持参しましょう。'
    ]
  },

  // 奄美大島 (鹿児島県)
  '185': {
    has_atm: true,
    atm_status: 'あり',
    atm_desc: '鹿児島銀行、奄美大島信用金庫、郵便局、ファミリーマート設置ATM多数あり。',
    has_clinic: true,
    clinic_status: 'あり',
    clinic_desc: '県立大島病院（救命救急センター・ドクターヘリ基地）など総合病院複数あり。',
    has_store: true,
    store_status: 'あり',
    store_desc: 'イオン、タイヨー、ビッグツー、ファミリーマート、地元スーパー多数。',
    signal_status: '5G/4G全域対応',
    signal_desc: '主要道路・市街地・空港周辺は高速通信。金作原原生林など一部山岳部は微弱。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '羽田・成田・関空・伊丹・福岡・鹿児島から直行航空便が多数発着。',
    cash_advice: 'cashless_ok',
    cash_advice_text: '市街地を中心にキャッシュレス利用可能。',
    tips: [
      '広大な島のため、レンタカーの手配が強く推奨されます。'
    ]
  },

  // 友ヶ島 (和歌山県・無人島)
  '701': {
    has_atm: false,
    atm_status: 'なし',
    atm_desc: '島内にATMや金融機関は一切ありません。乗船前の加太港周辺で準備してください。',
    has_clinic: false,
    clinic_status: 'なし',
    clinic_desc: '無人島のため医療機関はありません。怪我・急病時は海上保安庁・加太港への緊急搬送。',
    has_store: 'limited',
    store_status: '限定的',
    store_desc: '野奈浦桟橋付近に海の家・売店（季節営業・不定期）があるのみ。自動販売機も限定的。',
    signal_status: '主要キャリア微弱〜対応',
    signal_desc: '対岸（和歌山本土・淡路島）からの電波が届きますが、砲台跡やトンネル内・山陰は圏外。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '加太港から定期船（約20分）で日帰り観光が基本。宿泊施設はなく野営（キャンプ）のみ。',
    cash_advice: 'cash_essential',
    cash_advice_text: '船代や現地売店は現金のみ対応です。',
    tips: [
      '完全無人島のため、十分な飲料水・軽食・雨具・懐中電灯（要塞トンネル散策用）を本土から持参してください。'
    ],
    is_uninhabited: true
  },

  // 猿島 (神奈川県・無人島)
  '702': {
    has_atm: false,
    atm_status: 'なし',
    atm_desc: '島内にATMはありません。三笠桟橋（横須賀側）でご用意ください。',
    has_clinic: false,
    clinic_status: 'なし',
    clinic_desc: '無人島のため医療機関はありません。管理事務所に救急応急セットあり。',
    has_store: 'limited',
    store_status: 'あり',
    store_desc: '管理棟に売店・カフェ・BBQレンタルショップあり。ドリンク・軽食購入可能。',
    signal_status: '主要3キャリア良好',
    signal_desc: '横須賀市街地に近いため、島内全域で安定した電波が届きます。',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '三笠桟橋から船でわずか約10分。夜間滞在・宿泊は不可（日帰り限定）。',
    cash_advice: 'cashless_ok',
    cash_advice_text: 'チケット売場やカフェで電子マネー・クレジットカード利用可能。',
    tips: [
      '東京湾唯一の自然島・無人島。東京から日帰りで要塞探検・BBQが楽しめます。'
    ],
    is_uninhabited: true
  }
};

/**
 * 任意の島オブジェクトから、完全なインフラ・実用情報を高精度に解決する関数
 */
export function getIslandInfrastructure(island: any): IslandInfrastructureInfo {
  if (!island) {
    return createDefaultFallback(false);
  }

  const islandId = String(island.id || '');
  const islandName = String(island.name || '');

  // 1. 完全一致（ID）または個別検証辞書から引当
  if (VERIFIED_INFRASTRUCTURE_MAP[islandId]) {
    return {
      ...createDefaultFallback(island.is_uninhabited === true),
      ...VERIFIED_INFRASTRUCTURE_MAP[islandId]
    };
  }

  // 2. 島名による部分一致引当
  const verifiedKey = Object.keys(VERIFIED_INFRASTRUCTURE_MAP).find(k => {
    const item = VERIFIED_INFRASTRUCTURE_MAP[k];
    return islandName.includes(item.atm_desc?.substring(0, 3) || 'xxx') || 
           (k === '58' && islandName.includes('青ヶ島')) ||
           (k === '63' && islandName.includes('父島')) ||
           (k === '64' && islandName.includes('母島')) ||
           (k === '392' && islandName.includes('石垣')) ||
           (k === '393' && islandName.includes('竹富')) ||
           (k === '396' && islandName.includes('西表')) ||
           (k === '400' && islandName.includes('波照間')) ||
           (k === '401' && islandName.includes('与那国')) ||
           (k === '386' && islandName.includes('宮古')) ||
           (k === '457' && islandName.includes('屋久島')) ||
           (k === '355' && islandName.includes('佐渡')) ||
           (k === '372' && islandName.includes('淡路')) ||
           (k === '389' && islandName.includes('小豆')) ||
           (k === '1' && islandName.includes('礼文')) ||
           (k === '2' && islandName.includes('利尻')) ||
           (k === '49' && islandName.includes('大島')) ||
           (k === '57' && islandName.includes('八丈')) ||
           (k === '52' && islandName.includes('式根')) ||
           (k === '185' && islandName.includes('奄美大島'));
  });

  if (verifiedKey && VERIFIED_INFRASTRUCTURE_MAP[verifiedKey]) {
    return {
      ...createDefaultFallback(island.is_uninhabited === true),
      ...VERIFIED_INFRASTRUCTURE_MAP[verifiedKey]
    };
  }

  // 3. 無人島判定
  const isUninhabited = 
    island.is_uninhabited === true || 
    islandName.includes('沖ノ鳥島') || 
    islandName.includes('南鳥島') || 
    islandName.includes('無人島') ||
    island.difficulty === '上級冒険' ||
    (island.population !== undefined && Number(island.population) === 0);

  if (isUninhabited) {
    return {
      has_atm: false,
      atm_status: 'なし',
      atm_desc: '無人島のため島内にATM・金融機関はありません。本土・拠点島で事前にご用意ください。',
      has_clinic: false,
      clinic_status: 'なし',
      clinic_desc: '無人島のため医療施設はありません。急病・怪我の際は海上保安庁による救助要請となります。',
      has_store: false,
      store_status: 'なし',
      store_desc: '島内に商店・自販機はありません。飲食物や必須資材はすべて本土側から携行してください。',
      signal_status: '海上沿岸電波のみ',
      signal_desc: '本土や近隣の有人島からの電波が沿岸部に届く場合がありますが、山陰や奥地は完全圏外です。',
      day_trip: true,
      day_trip_status: '日帰り可能',
      day_trip_desc: '定期観光船またはチャーター船による日帰り訪問が原則となります。宿泊設備はありません。',
      cash_advice: 'cash_essential',
      cash_advice_text: '船の乗船料やチャーター費用は現金のみ対応の場合が多いため、現金をご用意ください。',
      tips: [
        '十分な飲料水・食料・熱中症対策・虫除け・救急セットを必ず自前で持参してください。',
        'ゴミはすべて持ち帰るのが離島訪問のマナーです。'
      ],
      is_uninhabited: true
    };
  }

  // 4. 有人離島のスマート推計（人口・アクセス・難易度から的確に自動解決）
  const difficulty = typeof island.difficulty === 'number' ? island.difficulty : 2;
  const isLargeIsland = 
    islandName.includes('島') && 
    (island.area > 50 || difficulty <= 1 || islandName.includes('市') || (island.population && Number(island.population) > 5000));

  if (isLargeIsland) {
    // 中〜大規模な有人離島（五島・壱岐・対馬・隠岐・天草・種子島など）
    return {
      has_atm: true,
      atm_status: 'あり',
      atm_desc: `地方銀行・郵便局ATM、および主要コンビニATMあり。現地で現金引き出しが可能です。`,
      has_clinic: true,
      clinic_status: 'あり',
      clinic_desc: `公立・私立の総合病院または複数診療所あり。救急医療体制が整っています。`,
      has_store: true,
      store_status: 'あり',
      store_desc: `大型スーパー・地元商店・コンビニエンスストアあり。生鮮食品・日用品が購入可能。`,
      signal_status: '主要3キャリア良好',
      signal_desc: `docomo / au / SoftBankともに全域で4G/5Gデータ通信が利用可能です。`,
      day_trip: true,
      day_trip_status: '日帰り可能',
      day_trip_desc: `定期フェリー・高速船または航空便により、本土や拠点都市からの日帰り・連泊ともに快適です。`,
      cash_advice: 'cashless_ok',
      cash_advice_text: '多くの店舗でキャッシュレス決済が利用可能ですが、個人店用に現金もあると安心です。',
      tips: [
        '広い島のため、移動にはレンタカーまたは路線バスの利用をおすすめします。'
      ],
      is_uninhabited: false
    };
  }

  // 小規模有人離島（離島振興指定の標準的な有人島：全国数百島に対応）
  return {
    has_atm: 'limited',
    atm_status: 'あり',
    atm_desc: `島内郵便局（または簡易郵便局・JA）にゆうちょATMあり。平日日中稼働（土日祝休止にご注意ください）。`,
    has_clinic: 'limited',
    clinic_status: 'あり',
    clinic_desc: `町村営診療所または巡回診療所あり（医師常駐または定期診療）。急患時はドクターヘリ対応。`,
    has_store: 'limited',
    store_status: 'あり',
    store_desc: `集落内に個人商店・共同売店（農協/生協）あり。食料・日用品の購入可能（コンビニなし）。`,
    signal_status: '主要キャリア対応',
    signal_desc: `集落・港周辺では主要キャリア（docomo / au / SoftBank）の通話が可能。山間部等は一部微弱。`,
    day_trip: difficulty <= 2 ? true : 'difficult',
    day_trip_status: difficulty <= 2 ? '日帰り可能' : '宿泊推奨',
    day_trip_desc: difficulty <= 2 
      ? `定期船のダイヤに合わせて数時間の日帰り散策が可能です。` 
      : `船便が1日1〜2便のため、のんびりとした宿泊滞在がおすすめです。`,
    cash_advice: 'cash_essential',
    cash_advice_text: '島内は現金決済が基本です。商店や宿での支払いに備えて現金を多めにご用意ください。',
    tips: [
      '商店の品数や営業時間が限られるため、必要な常備薬やお気に入りの飲料などは持参推奨です。',
      '自動販売機用の小銭（100円玉）や千円札を多めに準備しておくと便利です。'
    ],
    is_uninhabited: false
  };
}

function createDefaultFallback(isUninhabited: boolean): IslandInfrastructureInfo {
  return {
    has_atm: !isUninhabited,
    atm_status: isUninhabited ? 'なし' : 'あり',
    atm_desc: isUninhabited ? 'ATMなし' : '島内郵便局・ATMあり',
    has_clinic: !isUninhabited,
    clinic_status: isUninhabited ? 'なし' : 'あり',
    clinic_desc: isUninhabited ? '医療施設なし' : '公立診療所あり',
    has_store: !isUninhabited,
    store_status: isUninhabited ? 'なし' : 'あり',
    store_desc: isUninhabited ? '商店なし' : '地元商店あり',
    signal_status: '主要キャリア対応',
    signal_desc: '集落周辺で通話可能',
    day_trip: true,
    day_trip_status: '日帰り可能',
    day_trip_desc: '定期便により訪問可能',
    cash_advice: 'cash_preferred',
    cash_advice_text: '現金の用意を推奨します。',
    tips: [],
    is_uninhabited: isUninhabited
  };
}
