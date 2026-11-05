/**
 * KIRATABI 全国主要離島フェリー・航路運行情報マスタ
 * 各島・諸島に対応する公式船会社、運行情報Webサイト、問い合わせ電話番号の直通マッピング
 */

export interface FerryCompanyInfo {
  name: string;
  officialUrl: string;
  statusUrl: string; // 運行状況ページ
  phone: string;
  mainPorts: string;
  notes?: string;
}

// 諸島地域コード または 島ID別の航路マッピング
export const REGION_FERRY_MAP: Record<string, FerryCompanyInfo[]> = {
  // 伊豆諸島
  izu: [
    {
      name: '東海汽船',
      officialUrl: 'https://www.tokaikisen.co.jp/',
      statusUrl: 'https://www.tokaikisen.co.jp/schedule/',
      phone: '03-5472-9999',
      mainPorts: '東京（竹芝）・横浜・熱海・久里浜 ⇔ 各島',
      notes: '大型客船（さるびあ丸等）および高速ジェット船セブンアイランド',
    },
    {
      name: '神新汽船（下田航路）',
      officialUrl: 'https://shinshin-kisen.jp/',
      statusUrl: 'https://shinshin-kisen.jp/',
      phone: '0558-22-2621',
      mainPorts: '下田 ⇔ 利島・新島・式根島・神津島',
    },
  ],
  // 小笠原諸島
  ogasawara: [
    {
      name: '小笠原海運（おがさわら丸）',
      officialUrl: 'https://www.ogasawarakaiun.co.jp/',
      statusUrl: 'https://www.ogasawarakaiun.co.jp/service/',
      phone: '03-3451-5171',
      mainPorts: '東京（竹芝） ⇔ 父島二見港（片道24時間）',
    },
    {
      name: '伊豆諸島開発（ははじま丸）',
      officialUrl: 'https://www.izushotou-kaihatsu.co.jp/',
      statusUrl: 'https://www.izushotou-kaihatsu.co.jp/',
      phone: '04998-2-2111',
      mainPorts: '父島 ⇔ 母島（約2時間）',
    },
  ],
  // 佐渡・新潟
  sado: [
    {
      name: '佐渡汽船',
      officialUrl: 'https://www.sadokisen.co.jp/',
      statusUrl: 'https://www.sadokisen.co.jp/',
      phone: '025-245-1234',
      mainPorts: '新潟 ⇔ 両津 / 直江津 ⇔ 小木',
      notes: 'カーフェリーおよびジェットフォイル運航',
    },
  ],
  // 瀬戸内海
  seto: [
    {
      name: '四国フェリーグループ / 小豆島フェリー',
      officialUrl: 'https://www.shikokuferry.com/',
      statusUrl: 'https://www.shikokuferry.com/',
      phone: '087-851-0131',
      mainPorts: '高松・新岡山・姫路 ⇔ 小豆島・直島',
    },
  ],
  // 隠岐諸島（島根）
  oki: [
    {
      name: '隠岐汽船',
      officialUrl: 'https://www.oki-kisen.co.jp/',
      statusUrl: 'https://www.oki-kisen.co.jp/',
      phone: '08512-2-1122',
      mainPorts: '七類・境港 ⇔ 西郷（島後）・別府・菱浦・西ノ島（島前）',
    },
  ],
  // 五島列島・壱岐・対馬（長崎）
  goto: [
    {
      name: '九州商船',
      officialUrl: 'https://kyusho.co.jp/',
      statusUrl: 'https://kyusho.co.jp/unkou/',
      phone: '095-822-9153',
      mainPorts: '長崎・佐世保 ⇔ 福江・有川・奈留・奈良尾',
    },
    {
      name: '野母商船（太古）',
      officialUrl: 'https://www.nomo.co.jp/taiko/',
      statusUrl: 'https://www.nomo.co.jp/taiko/',
      phone: '092-262-2518',
      mainPorts: '博多港 ⇔ 宇久・小値賀・有川・福江',
    },
  ],
  // 奄美群島・トカラ列島（鹿児島）
  amami: [
    {
      name: 'マルエーフェリー / 奄美海運',
      officialUrl: 'https://www.aline-ferry.com/',
      statusUrl: 'https://www.aline-ferry.com/status/',
      phone: '099-226-4141',
      mainPorts: '鹿児島・那覇 ⇔ 名瀬・亀徳・和泊・与論',
    },
    {
      name: '十島村営船（フェリーとしま2）',
      officialUrl: 'https://www.tokara.jp/',
      statusUrl: 'https://www.tokara.jp/',
      phone: '099-222-2101',
      mainPorts: '鹿児島本港 ⇔ トカラ列島各島 ⇔ 名瀬',
    },
  ],
  // 大東諸島（南北大東島）
  daito: [
    {
      name: '大東海運（だいとう）',
      officialUrl: 'https://www.daitokaiun.co.jp/',
      statusUrl: 'https://www.daitokaiun.co.jp/',
      phone: '098-861-0515',
      mainPorts: '那覇港（新港・泊港） ⇔ 南大東島・北大東島',
    },
  ],
  // 八重山諸島（石垣・西表・竹富・波照間等）
  yaeyama: [
    {
      name: '八重山観光フェリー',
      officialUrl: 'https://www.yaeyama.co.jp/',
      statusUrl: 'https://www.yaeyama.co.jp/operation.html',
      phone: '0980-82-5010',
      mainPorts: '石垣港離島ターミナル ⇔ 竹富・小浜・黒島・大原・上原・鳩間',
      notes: '波浪・台風時の運行状況をリアルタイム更新',
    },
    {
      name: '安栄観光',
      officialUrl: 'https://aneikankou.co.jp/',
      statusUrl: 'https://aneikankou.co.jp/condition',
      phone: '0980-83-0055',
      mainPorts: '石垣港 ⇔ 波照間・竹富・小浜・黒島・西表各港',
      notes: '波照間島高速船・フェリーは波高による欠航注意',
    },
  ],
  // 宮古諸島
  miyako: [
    {
      name: '多良間海運（フェリーたらまゆう）',
      officialUrl: 'https://taramakaiun.com/',
      statusUrl: 'https://taramakaiun.com/',
      phone: '0980-72-9209',
      mainPorts: '宮古島平良港 ⇔ 多良間島普天間港',
    },
  ],
  // 慶良間諸島
  kerama: [
    {
      name: '座間味村営船（クイーンざまみ・フェリーざまみ）',
      officialUrl: 'https://www.vill.zamami.okinawa.jp/',
      statusUrl: 'https://www.vill.zamami.okinawa.jp/',
      phone: '098-868-4567',
      mainPorts: '那覇泊港（とまりん） ⇔ 阿嘉港・座間味港',
    },
    {
      name: '渡嘉敷村営船（マリンライナーとかしき・フェリーとかしき）',
      officialUrl: 'https://www.vill.tokashiki.okinawa.jp/ferry/top',
      statusUrl: 'https://www.vill.tokashiki.okinawa.jp/ferry/top',
      phone: '098-868-7541',
      mainPorts: '那覇泊港（とまりん） ⇔ 渡嘉敷港',
    },
  ],
};

// デフォルトの全国フェリー案内窓口（マッピングがない島向け）
const DEFAULT_FERRY_INFO: FerryCompanyInfo[] = [
  {
    name: '日本旅客船協会（全国離島航路ポータル）',
    officialUrl: 'https://www.jpmr.or.jp/',
    statusUrl: 'https://www.jpmr.or.jp/',
    phone: '03-3269-9923',
    mainPorts: '全国各地の定期旅客船・フェリー航路',
    notes: '各離島の運航状況は各島ページ内のアクセス情報または地元船会社をご確認ください。',
  },
];

/**
 * 対象の島IDやregion_idから、利用可能な定期船・フェリー運行情報を取得
 */
export function getFerryInfoForIsland(islandId: string | number, regionId?: string, prefecture?: string): FerryCompanyInfo[] {
  const sId = String(islandId || '');

  // 1. regionId から検索
  if (regionId) {
    const lowerRegion = regionId.toLowerCase();
    for (const [key, list] of Object.entries(REGION_FERRY_MAP)) {
      if (lowerRegion.includes(key)) {
        return list;
      }
    }
  }

  // 2. prefecture から推測
  if (prefecture) {
    if (prefecture.includes('東京')) {
      if (sId === 'chichijima' || sId === 'hahajima' || sId === '63' || sId === '64' || sId.includes('ogasawara')) {
        return REGION_FERRY_MAP.ogasawara;
      }
      return REGION_FERRY_MAP.izu;
    }
    if (prefecture.includes('新潟')) return REGION_FERRY_MAP.sado;
    if (prefecture.includes('島根')) return REGION_FERRY_MAP.oki;
    if (prefecture.includes('長崎')) return REGION_FERRY_MAP.goto;
    if (prefecture.includes('鹿児島')) return REGION_FERRY_MAP.amami;
    if (prefecture.includes('沖縄')) {
      const idNum = parseInt(sId, 10);
      if (idNum === 384 || idNum === 385) return REGION_FERRY_MAP.daito;
      if (idNum >= 386 && idNum <= 391) return REGION_FERRY_MAP.miyako;
      if ((idNum >= 392 && idNum <= 401) || sId.includes('ishigaki') || sId.includes('iriomote') || sId.includes('taketomi') || sId.includes('hateruma')) {
        return REGION_FERRY_MAP.yaeyama;
      }
    }
    if (prefecture.includes('香川') || prefecture.includes('愛媛') || prefecture.includes('広島') || prefecture.includes('岡山')) {
      return REGION_FERRY_MAP.seto;
    }
  }

  return DEFAULT_FERRY_INFO;
}
