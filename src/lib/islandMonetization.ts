import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import {
  RAKUTEN_AFFILIATE_ID,
  getRakutenTravelSearchUrl,
  getJalanSearchUrl,
  getRakutenRentacarSearchUrl,
  getJalanRentacarSearchUrl,
} from '@/data/islandFacilitiesData';
import { AFFILIATE_PRODUCTS } from '@/data/affiliateProducts';
import { getIslandInfrastructure } from '@/lib/islandInfrastructure';

export interface GatewayHubPlan {
  hubName: string;
  reason: string;
  rakutenGatewayHotelUrl: string;
  jalanGatewayHotelUrl: string;
  gatewayRentalCarUrl: string;
  jalanGatewayRentalCarUrl: string;
}

export interface FurusatoNozeiPlan {
  municipalityLabel: string;
  specialties: string[];
  rakutenFurusatoUrl: string;
  catchCopy: string;
}

export interface EssentialGearItem {
  id: string;
  name: string;
  icon: string;
  subtitle: string;
  rakutenUrl?: string;
  amazonUrl?: string;
}

export interface IslandMonetizationPlan {
  gatewayHub: GatewayHubPlan;
  furusatoNozei: FurusatoNozeiPlan;
  essentialGear: EssentialGearItem[];
}

interface GatewayHubSpec {
  hubName: string;
  searchQuery: string;
  searchPrefecture: string;
}

interface FurusatoSpec {
  municipalityLabel: string;
  furusatoKeyword: string;
  specialties: string[];
}

function buildRakutenFurusatoAffiliateUrl(furusatoKeyword: string): string {
  const cleanKeyword = furusatoKeyword.replace(/\s+/g, ' ').trim();
  const targetUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(`${cleanKeyword} ふるさと納税`)}/`;
  const affiliateId = (
    process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID ||
    RAKUTEN_AFFILIATE_ID ||
    ''
  ).trim();

  if (affiliateId) {
    const encoded = encodeURIComponent(targetUrl);
    return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encoded}&m=${encoded}`;
  }
  return targetUrl;
}

function resolveGatewayHubSpec(island: any): GatewayHubSpec {
  const id = String(island?.id || '');
  const name = String(island?.name || '');
  const reg = String(island?.region_id || '');
  const pref = String(island?.prefecture || '');

  // 八重山諸島
  if (reg === 'yaeyama') {
    if (id === '392' || name === '石垣島') {
      return {
        hubName: '石垣島市街・離島ターミナル周辺エリア',
        searchQuery: '石垣島 離島ターミナル',
        searchPrefecture: '沖縄県',
      };
    }
    return {
      hubName: '石垣島市街・離島ターミナル周辺',
      searchQuery: '石垣島',
      searchPrefecture: '沖縄県',
    };
  }

  // 宮古列島
  if (reg === 'miyako') {
    return {
      hubName: '宮古島市街（平良）・空港周辺エリア',
      searchQuery: '宮古島',
      searchPrefecture: '沖縄県',
    };
  }

  // 久米島周辺
  if (reg === 'kume') {
    if (id === '375' || id === '380' || name === '久米島') {
      return {
        hubName: '那覇・泊港（とまりん）＆久米島エリア',
        searchQuery: '那覇 泊港',
        searchPrefecture: '沖縄県',
      };
    }
    return {
      hubName: '久米島市街・イーフビーチ＆那覇泊港エリア',
      searchQuery: '久米島',
      searchPrefecture: '沖縄県',
    };
  }

  // 慶良間・大東
  if (reg === 'kerama' || reg === 'daito') {
    return {
      hubName: '那覇・泊港（とまりん）エリア',
      searchQuery: '那覇 泊港',
      searchPrefecture: '沖縄県',
    };
  }

  // 沖縄本島周辺離島
  if (reg === 'okinawa_main' || pref === '沖縄県') {
    if (/古宇利|瀬底|水納|伊江|伊平屋|伊是名|野甫|屋我地/.test(name)) {
      return {
        hubName: '沖縄本島北部（名護・本部港）＆那覇エリア',
        searchQuery: '名護 本部',
        searchPrefecture: '沖縄県',
      };
    }
    if (/浜比嘉|平安座|宮城|伊計|津堅|久高|奥武/.test(name)) {
      return {
        hubName: '那覇・うるま・沖縄本島中南部エリア',
        searchQuery: '那覇 北谷',
        searchPrefecture: '沖縄県',
      };
    }
    return {
      hubName: '那覇・泊港エリア',
      searchQuery: '那覇 泊港',
      searchPrefecture: '沖縄県',
    };
  }

  // 奄美・トカラ・大隅・甑島・薩摩
  if (reg === 'amami') {
    if (!['352', '356', '357', '358'].includes(id) && !/奄美大島|徳之島|沖永良部|与論/.test(name)) {
      return {
        hubName: '奄美大島（名瀬・古仁屋）＆鹿児島港エリア',
        searchQuery: '奄美大島',
        searchPrefecture: '鹿児島県',
      };
    }
    return {
      hubName: '鹿児島中央・天文館・鹿児島港エリア',
      searchQuery: '鹿児島中央 天文館',
      searchPrefecture: '鹿児島県',
    };
  }
  if (reg === 'tokara' || reg === 'osumi' || reg === 'pseudo_satsuma') {
    return {
      hubName: '鹿児島中央・天文館・鹿児島港エリア',
      searchQuery: '鹿児島中央 天文館',
      searchPrefecture: '鹿児島県',
    };
  }
  if (reg === 'koshiki') {
    return {
      hubName: '薩摩川内駅・鹿児島中央エリア',
      searchQuery: '薩摩川内 鹿児島中央',
      searchPrefecture: '鹿児島県',
    };
  }

  // 長崎・福岡・佐賀（五島・壱岐・対馬・平戸・西海・玄界灘）
  if (reg === 'goto') {
    return {
      hubName: '長崎駅・大波止（長崎港）エリア',
      searchQuery: '長崎駅 大波止',
      searchPrefecture: '長崎県',
    };
  }
  if (reg === 'pseudo_saikai') {
    return {
      hubName: '佐世保駅・佐世保港エリア',
      searchQuery: '佐世保',
      searchPrefecture: '長崎県',
    };
  }
  if (reg === 'hirado') {
    return {
      hubName: '平戸・佐世保港エリア',
      searchQuery: '平戸 佐世保',
      searchPrefecture: '長崎県',
    };
  }
  if (pref === '佐賀県') {
    return {
      hubName: '唐津・呼子・博多エリア',
      searchQuery: '唐津 呼子',
      searchPrefecture: '佐賀県',
    };
  }
  if (reg === 'iki' || reg === 'tsushima' || reg === 'chikuzen' || reg === 'genkai' || pref === '福岡県') {
    return {
      hubName: '博多・天神・ベイサイドエリア',
      searchQuery: '博多 天神',
      searchPrefecture: '福岡県',
    };
  }

  // 熊本・大分・宮崎
  if (reg === 'amakusa' || reg === 'pseudo_nagashima' || pref === '熊本県') {
    return {
      hubName: '天草（本渡・松島）・熊本駅エリア',
      searchQuery: '天草 熊本',
      searchPrefecture: '熊本県',
    };
  }
  if (reg === 'bungo' || pref === '大分県') {
    return {
      hubName: '別府・大分・佐伯エリア',
      searchQuery: '別府 大分 佐伯',
      searchPrefecture: '大分県',
    };
  }
  if (reg === 'minami_naka' || pref === '宮崎県') {
    return {
      hubName: '宮崎駅・青島・延岡エリア',
      searchQuery: '宮崎 青島',
      searchPrefecture: '宮崎県',
    };
  }

  // 瀬戸内・四国・中国・山陰
  if (reg === 'naoshima' || reg === 'shiwaku' || pref === '香川県') {
    return {
      hubName: '高松駅・高松港エリア',
      searchQuery: '高松駅 高松港',
      searchPrefecture: '香川県',
    };
  }
  if (reg === 'kasaoka' || pref === '岡山県') {
    return {
      hubName: '宇野・岡山・倉敷・笠岡エリア',
      searchQuery: '倉敷 岡山 宇野',
      searchPrefecture: '岡山県',
    };
  }
  if (reg === 'kamijima') {
    return pref === '広島県'
      ? {
          hubName: '尾道・三原・今治（しまなみ）エリア',
          searchQuery: '尾道 三原',
          searchPrefecture: '広島県',
        }
      : {
          hubName: '今治・尾道（しまなみ）エリア',
          searchQuery: '今治 道後',
          searchPrefecture: '愛媛県',
        };
  }
  if (reg === 'suo_oshima' || pref === '広島県') {
    if (pref === '山口県') {
      return {
        hubName: '柳井・周防大島・岩国エリア',
        searchQuery: '岩国 周防大島 柳井',
        searchPrefecture: '山口県',
      };
    }
    return {
      hubName: '広島駅・宇品港・宮島口エリア',
      searchQuery: '広島駅 宮島口',
      searchPrefecture: '広島県',
    };
  }
  if (reg === 'hagi' || pref === '山口県') {
    return {
      hubName: '萩・長門・下関エリア',
      searchQuery: '萩 下関 長門',
      searchPrefecture: '山口県',
    };
  }
  if (reg === 'kutsuna') {
    return {
      hubName: '松山・道後温泉・三津浜エリア',
      searchQuery: '松山 道後温泉',
      searchPrefecture: '愛媛県',
    };
  }
  if (reg === 'uwakai' || pref === '愛媛県') {
    return {
      hubName: '宇和島・八幡浜・松山エリア',
      searchQuery: '宇和島 松山',
      searchPrefecture: '愛媛県',
    };
  }
  if (reg === 'pseudo_tokushima' || pref === '徳島県') {
    return {
      hubName: '徳島駅・阿南・鳴門エリア',
      searchQuery: '徳島 鳴門',
      searchPrefecture: '徳島県',
    };
  }
  if (reg === 'pseudo_tosa' || pref === '高知県') {
    return {
      hubName: '宿毛・四万十・高知市エリア',
      searchQuery: '宿毛 四万十 高知',
      searchPrefecture: '高知県',
    };
  }
  if (reg === 'oki' || reg === 'pseudo_san_in' || pref === '島根県') {
    return {
      hubName: '松江・境港・米子エリア',
      searchQuery: '松江 皆生温泉 境港',
      searchPrefecture: '島根県',
    };
  }

  // 関西・東海・北陸
  if (reg === 'ieshima') {
    return {
      hubName: '姫路駅・姫路港エリア',
      searchQuery: '姫路駅',
      searchPrefecture: '兵庫県',
    };
  }
  if (pref === '和歌山県') {
    return {
      hubName: '和歌山市・白浜・串本エリア',
      searchQuery: '和歌山市 串本 白浜',
      searchPrefecture: '和歌山県',
    };
  }
  if (reg === 'pseudo_awaji' || pref === '兵庫県') {
    return {
      hubName: '神戸三宮・明石・淡路島エリア',
      searchQuery: '神戸 明石 淡路島',
      searchPrefecture: '兵庫県',
    };
  }
  if (reg === 'pseudo_biwako' || pref === '滋賀県') {
    return {
      hubName: '近江八幡・長浜・彦根エリア',
      searchQuery: '近江八幡 長浜',
      searchPrefecture: '滋賀県',
    };
  }
  if (pref === '京都府') {
    return {
      hubName: '舞鶴・天橋立・宮津エリア',
      searchQuery: '天橋立 舞鶴 宮津',
      searchPrefecture: '京都府',
    };
  }
  if (pref === '三重県') {
    return {
      hubName: '鳥羽・伊勢志摩・賢島エリア',
      searchQuery: '鳥羽 志摩 伊勢',
      searchPrefecture: '三重県',
    };
  }
  if (reg === 'aichi_santo' || pref === '愛知県') {
    return {
      hubName: '南知多（師崎・河和）・名古屋エリア',
      searchQuery: '南知多 知多',
      searchPrefecture: '愛知県',
    };
  }
  if (pref === '石川県') {
    return {
      hubName: '七尾・和倉温泉・金沢エリア',
      searchQuery: '七尾 金沢',
      searchPrefecture: '石川県',
    };
  }
  if (pref === '福井県') {
    return {
      hubName: '三国・あわら温泉・敦賀エリア',
      searchQuery: 'あわら温泉 敦賀',
      searchPrefecture: '福井県',
    };
  }
  if (reg === 'pseudo_hokuriku' || pref === '新潟県') {
    return {
      hubName: '新潟駅・万代・直江津エリア',
      searchQuery: '新潟駅 万代',
      searchPrefecture: '新潟県',
    };
  }

  // 伊豆・小笠原・関東・静岡
  if (id === '58' || name.includes('青ヶ島')) {
    return {
      hubName: '八丈島＆東京浜松町・竹芝・羽田エリア',
      searchQuery: '八丈島 浜松町',
      searchPrefecture: '東京都',
    };
  }
  if (reg === 'ogasawara') {
    return {
      hubName: '東京浜松町・竹芝エリア',
      searchQuery: '浜松町 竹芝 汐留',
      searchPrefecture: '東京都',
    };
  }
  if (reg === 'izu' || pref === '東京都') {
    if (/利島|新島|式根島|神津島/.test(name)) {
      return {
        hubName: '東京浜松町・竹芝＆熱海・下田エリア',
        searchQuery: '浜松町 熱海 下田',
        searchPrefecture: '東京都',
      };
    }
    return {
      hubName: '東京浜松町・竹芝・羽田空港周辺エリア',
      searchQuery: '浜松町 竹芝 羽田',
      searchPrefecture: '東京都',
    };
  }
  if (pref === '静岡県') {
    return {
      hubName: '熱海・伊東・下田エリア',
      searchQuery: '熱海 伊東 下田',
      searchPrefecture: '静岡県',
    };
  }
  if (pref === '千葉県') {
    return {
      hubName: '鴨川・館山（南房総）エリア',
      searchQuery: '鴨川 館山',
      searchPrefecture: '千葉県',
    };
  }
  if (reg === 'pseudo_kanto' || pref === '神奈川県') {
    return {
      hubName: '横須賀・鎌倉・藤沢・三浦エリア',
      searchQuery: '横須賀 鎌倉 江ノ島',
      searchPrefecture: '神奈川県',
    };
  }

  // 北海道・東北
  if (pref === '山形県') {
    return {
      hubName: '酒田・鶴岡（庄内）エリア',
      searchQuery: '酒田 鶴岡',
      searchPrefecture: '山形県',
    };
  }
  if (pref === '青森県') {
    return {
      hubName: '八戸駅・本八戸エリア',
      searchQuery: '八戸',
      searchPrefecture: '青森県',
    };
  }
  if (pref === '岩手県') {
    return {
      hubName: '宮古・釜石・大船渡（三陸）エリア',
      searchQuery: '宮古 釜石 大船渡',
      searchPrefecture: '岩手県',
    };
  }
  if (reg === 'oshika' || reg === 'pseudo_sanriku' || pref === '宮城県') {
    return {
      hubName: '石巻・松島・仙台エリア',
      searchQuery: '石巻 松島 仙台',
      searchPrefecture: '宮城県',
    };
  }
  if (reg === 'pseudo_hokkaido' || pref === '北海道') {
    if (id === '5' || name.includes('奥尻')) {
      return {
        hubName: '函館・江差エリア',
        searchQuery: '函館 江差',
        searchPrefecture: '北海道',
      };
    }
    if (id === '3' || id === '4' || name.includes('天売') || name.includes('焼尻')) {
      return {
        hubName: '羽幌・留萌・札幌エリア',
        searchQuery: '留萌 札幌 旭川',
        searchPrefecture: '北海道',
      };
    }
    return {
      hubName: '稚内駅・稚内港エリア',
      searchQuery: '稚内',
      searchPrefecture: '北海道',
    };
  }

  return {
    hubName: `${pref || '出発港'}周辺エリア`,
    searchQuery: pref || name,
    searchPrefecture: pref,
  };
}

function resolveFurusatoSpec(island: any): FurusatoSpec {
  const id = String(island?.id || '');
  const name = String(island?.name || '');
  const reg = String(island?.region_id || '');
  const pref = String(island?.prefecture || '');

  // 八重山諸島
  if (id === '392' || name === '石垣島') {
    return {
      municipalityLabel: '沖縄県石垣市',
      furusatoKeyword: '沖縄県 石垣市',
      specialties: ['特選黒毛和牛「石垣牛」', '完熟マンゴー・ピーチパイン', '石垣島ホテル宿泊感謝券', '八重山そば・海ぶどう'],
    };
  }
  if (id === '401' || name.includes('与那国')) {
    return {
      municipalityLabel: '沖縄県与那国町',
      furusatoKeyword: '沖縄県 与那国町',
      specialties: ['琉球泡盛・花酒「どなん」', '与那国島産カジキ・海鮮加工品', '長命草・純黒糖スイーツ', '与那国町観光・宿泊応援券'],
    };
  }
  if (reg === 'yaeyama') {
    return {
      municipalityLabel: '沖縄県竹富町',
      furusatoKeyword: '沖縄県 竹富町',
      specialties: ['西表島・竹富島・小浜島 宿泊クーポン', '西表島産ピーチパイン・完熟マンゴー', '波照間島・小浜島の純黒糖', '八重山ミンサー織り工芸品'],
    };
  }

  // 宮古列島
  if (reg === 'miyako') {
    if (name.includes('多良間') || (name.includes('水納') && reg === 'miyako')) {
      return {
        municipalityLabel: '沖縄県多良間村・宮古島市',
        furusatoKeyword: '沖縄県 宮古島 多良間',
        specialties: ['宮古島産 完熟アップルマンゴー', '多良間島産 純黒糖・特産菓子', '特選宮古牛・島豚アグー', '宮古島リゾート宿泊クーポン'],
      };
    }
    return {
      municipalityLabel: '沖縄県宮古島市',
      furusatoKeyword: '沖縄県 宮古島市',
      specialties: ['宮古島産 完熟アップルマンゴー', '特選宮古牛・海ぶどうセット', '宮古島リゾート宿泊感謝券', '雪塩スイーツ・琉球泡盛'],
    };
  }

  // 慶良間・久米島・大東・沖縄本島周辺
  if (reg === 'kerama') {
    return {
      municipalityLabel: '沖縄県座間味村・渡嘉敷村',
      furusatoKeyword: '沖縄県 座間味 渡嘉敷',
      specialties: ['慶良間ブルー ダイビング・マリン体験券', '座間味・渡嘉敷 宿泊応援クーポン', '沖縄県産海ぶどう・太もずく', '琉球ガラス・島特産品'],
    };
  }
  if (reg === 'kume') {
    return {
      municipalityLabel: '沖縄県久米島町',
      furusatoKeyword: '沖縄県 久米島町',
      specialties: ['久米島産 活き車えび・冷凍車えび', '天然太もずく・海ぶどう詰合せ', '泡盛「久米島の久米仙」', '久米島リゾート宿泊クーポン'],
    };
  }
  if (reg === 'daito') {
    return {
      municipalityLabel: '沖縄県南大東村・北大東村',
      furusatoKeyword: '沖縄県 大東',
      specialties: ['南大東島産ラム酒「コルコル」', '大東諸島産マグロ・海鮮グルメ', '北大東じゃがいも・島焼酎', '沖縄離島応援ギフト'],
    };
  }
  if (reg === 'okinawa_main' || pref === '沖縄県') {
    if (name.includes('伊江島')) {
      return {
        municipalityLabel: '沖縄県伊江村',
        furusatoKeyword: '沖縄県 伊江村',
        specialties: ['伊江牛（黒毛和牛）焼肉・ステーキ', 'イエラムサンタマリア（島ラム酒）', 'ジーマミー（落花生）菓子・黒糖', '伊江島観光・宿泊クーポン'],
      };
    }
    if (name.includes('古宇利')) {
      return {
        municipalityLabel: '沖縄県今帰仁村',
        furusatoKeyword: '沖縄県 今帰仁村',
        specialties: ['今帰仁アグー豚しゃぶしゃぶ', '完熟マンゴー・今帰仁スイカ', '古宇利島オーシャンビュー宿泊券', '琉球泡盛・黒糖スイーツ'],
      };
    }
    return {
      municipalityLabel: '沖縄県（離島・やんばる・本島周辺自治体）',
      furusatoKeyword: '沖縄県 マンゴー アグー 宿泊券',
      specialties: ['完熟マンゴー・南国フルーツ', '沖縄あぐー豚・海ぶどう・もずく', '離島・リゾートホテル宿泊感謝券', '琉球泡盛・沖縄そばセット'],
    };
  }

  // 鹿児島（屋久島・種子島・奄美・甑島・十島村）
  if (id === '340' || name.includes('屋久島')) {
    return {
      municipalityLabel: '鹿児島県屋久島町',
      furusatoKeyword: '鹿児島県 屋久島町',
      specialties: ['本格芋焼酎「三岳」セット', '屋久島産たんかん・ぽんかん', '首折れサバ・飛び魚（あご）すり身', '屋久島ホテル・宿の宿泊補助券'],
    };
  }
  if (id === '339' || name.includes('種子島')) {
    return {
      municipalityLabel: '鹿児島県西之表市・中種子町・南種子町',
      furusatoKeyword: '鹿児島県 種子島',
      specialties: ['本場種子島産 蜜たっぷりの安納芋', '種子島産完熟アップルマンゴー', '鹿児島黒牛・種子島鮮魚セット', 'ロケットの島特産ギフト'],
    };
  }
  if (reg === 'amami') {
    if (name.includes('与論')) {
      return {
        municipalityLabel: '鹿児島県与論町',
        furusatoKeyword: '鹿児島県 与論町',
        specialties: ['黒糖焼酎「島有泉」', '与論島リゾート宿泊クーポン', '完熟マンゴー・パッションフルーツ', 'もずくそば・きび酢セット'],
      };
    }
    if (name.includes('徳之島')) {
      return {
        municipalityLabel: '鹿児島県徳之島（徳之島町・天城町・伊仙町）',
        furusatoKeyword: '鹿児島県 徳之島',
        specialties: ['徳之島産たんかん・南国果実', '奄美黒糖焼酎 蔵元飲み比べ', '鹿児島黒牛・新じゃが「春一番」', '徳之島旅行・宿泊応援券'],
      };
    }
    return {
      municipalityLabel: '鹿児島県奄美市・瀬戸内町・龍郷町',
      furusatoKeyword: '鹿児島県 奄美',
      specialties: ['本場奄美の鶏飯（けいはん）セット', '完熟たんかん・パッションフルーツ', '奄美黒糖焼酎 銘柄飲み比べ', '奄美リゾート宿泊感謝券・大島紬'],
    };
  }
  if (reg === 'koshiki') {
    return {
      municipalityLabel: '鹿児島県薩摩川内市（甑島）',
      furusatoKeyword: '鹿児島県 薩摩川内市 甑島',
      specialties: ['甑島産きびなご刺身・一夜干し', 'タカエビ（薩摩甘えび）海鮮セット', '島焼酎「六代目百合」「甑州」', '甑島・市内宿泊クーポン'],
    };
  }
  if (pref === '鹿児島県') {
    return {
      municipalityLabel: '鹿児島県（十島村・三島村・長島町ほか離島自治体）',
      furusatoKeyword: '鹿児島県 黒牛 ぶり 焼酎',
      specialties: ['日本一・鹿児島黒牛＆黒豚セット', '長島ブランド鰤（ぶり）刺身ロイン', '本格芋焼酎・離島限定焼酎', 'さつま揚げ・きびなご特産品'],
    };
  }

  // 長崎県
  if (reg === 'goto') {
    return {
      municipalityLabel: '長崎県五島市・新上五島町・小値賀町',
      furusatoKeyword: '長崎県 五島',
      specialties: ['幻のブランド黒毛和牛「五島牛」', '手延べ五島うどん＆あごだしセット', '五島列島直送 旬の鮮魚・クエ鍋', '五島椿オイル・島旅宿泊クーポン'],
    };
  }
  if (reg === 'iki') {
    return {
      municipalityLabel: '長崎県壱岐市',
      furusatoKeyword: '長崎県 壱岐市',
      specialties: ['銘牛「壱岐牛」ステーキ・焼肉', '壱岐産生ウニ・剣先イカ一夜干し', '麦焼酎発祥の地「壱岐焼酎」飲み比べ', '壱岐市宿泊・観光クーポン'],
    };
  }
  if (reg === 'tsushima') {
    return {
      municipalityLabel: '長崎県対馬市',
      furusatoKeyword: '長崎県 対馬市',
      specialties: ['対馬名物「黄金あなご」煮穴子・刺身', '対馬産肉厚原木しいたけ・クエ鍋', '対州そば・とんちゃん焼肉', '対馬観光応援クーポン'],
    };
  }
  if (pref === '長崎県') {
    return {
      municipalityLabel: '長崎県佐世保市・平戸市・松浦市',
      furusatoKeyword: '長崎県 平戸 佐世保 海鮮',
      specialties: ['平戸和牛・九十九島牡蠣・とらふぐ', 'アジフライの聖地・松浦の旬鮮魚', '長崎カステラ・あごだし詰合せ', '県内ホテル・旅館宿泊券'],
    };
  }

  // 北海道
  if (id === '1' || id === '2' || name.includes('礼文') || name.includes('利尻')) {
    return {
      municipalityLabel: '北海道礼文町・利尻富士町・利尻町',
      furusatoKeyword: '北海道 礼文 利尻',
      specialties: ['濃厚エゾバフンウニ・キタムラサキウニ', '最高級 天然利尻昆布・とろろ昆布', '礼文島産 肉厚ホッケ・海鮮セット', '島旅宿泊応援クーポン'],
    };
  }
  if (pref === '北海道') {
    return {
      municipalityLabel: '北海道（羽幌町・奥尻町・厚岸町ほか離島自治体）',
      furusatoKeyword: '北海道 羽幌 奥尻 厚岸 海鮮',
      specialties: ['北海道産 生ウニ・甘えび・いくら', '厚岸ブランド牡蠣・奥尻ワイン', '肉厚縞ホッケ・北海道海の幸セット', '北海道旅行・宿泊クーポン'],
    };
  }

  // 東京都（小笠原・伊豆諸島）
  if (reg === 'ogasawara') {
    return {
      municipalityLabel: '東京都小笠原村',
      furusatoKeyword: '東京都 小笠原村',
      specialties: ['小笠原パッションフルーツ・島レモン', '小笠原ラム酒・海底熟成ラム', '島はちみつ・島塩・メカジキグルメ', '世界自然遺産 小笠原村応援寄附'],
    };
  }
  if (reg === 'izu' || pref === '東京都') {
    return {
      municipalityLabel: '東京都（八丈町・大島町・新島村・神津島村・青ヶ島村）',
      furusatoKeyword: '東京都 八丈島 伊豆大島 神津島',
      specialties: ['幻の芋焼酎「青酎」・東京島酒飲み比べ', '伊豆諸島産 伊勢海老・金目鯛干物', '大島椿油・明日葉・八丈フルーツレモン', '東海汽船・伊豆諸島宿泊クーポン'],
    };
  }

  // 新潟・島根・瀬戸内
  if (pref === '新潟県') {
    return {
      municipalityLabel: '新潟県佐渡市・粟島浦村',
      furusatoKeyword: '新潟県 佐渡市',
      specialties: ['佐渡産コシヒカリ（朱鷺と暮らす郷）', '佐渡産紅ズワイガニ・寒ブリ・南蛮エビ', '佐渡の銘酒（北雪・真野鶴・天領盃）', '佐渡汽船・島内宿泊トラベルクーポン'],
    };
  }
  if (reg === 'oki' || pref === '島根県') {
    return {
      municipalityLabel: '島根県隠岐の島町・海士町・西ノ島町・知夫村',
      furusatoKeyword: '島根県 隠岐 海士町',
      specialties: ['海士町ブランド岩牡蠣「春香」・寒シマメ', '離島育ちの希少黒毛和牛「隠岐牛」', '隠岐誉など地酒・サザエ海鮮詰合せ', '隠岐諸島 宿泊・観光応援クーポン'],
    };
  }
  if (id === '197' || name.includes('小豆島')) {
    return {
      municipalityLabel: '香川県小豆島町・土庄町',
      furusatoKeyword: '香川県 小豆島',
      specialties: ['小豆島産エキストラバージンオリーブオイル', '讃岐オリーブ牛・手延べ小豆島そうめん', '木桶仕込み醤油・オリーブハマチ', '小豆島リゾートホテル宿泊クーポン'],
    };
  }
  if (pref === '香川県') {
    return {
      municipalityLabel: '香川県直島町・高松市・丸亀市',
      furusatoKeyword: '香川県 直島 高松 オリーブ牛',
      specialties: ['讃岐オリーブ牛・名物骨付鳥セット', '瀬戸内海産 旬の鮮魚・海苔・いりこ', '本場讃岐うどん食べ比べセット', '瀬戸内アート旅・高松宿泊クーポン'],
    };
  }
  if (pref === '岡山県') {
    return {
      municipalityLabel: '岡山県笠岡市・瀬戸内市・玉野市',
      furusatoKeyword: '岡山県 笠岡 瀬戸内 牡蠣 マスカット',
      specialties: ['岡山県産シャインマスカット・白桃', '笠岡諸島・日生の殻付き牡蠣＆鮮魚', '瀬戸内ワタリガニ・焼き海苔詰合せ', '倉敷・瀬戸内エリア宿泊利用券'],
    };
  }
  if (pref === '広島県') {
    return {
      municipalityLabel: '広島県尾道市・廿日市市・呉市・大崎上島町',
      furusatoKeyword: '広島県 尾道 宮島 牡蠣 レモン',
      specialties: ['生口島（瀬戸田）国産レモン＆柑橘', '広島産大粒牡蠣（むき身・殻付き）', '宮島あなごめし・尾道ラーメン', 'しまなみ海道・宮島エリア宿泊券'],
    };
  }
  if (pref === '愛媛県') {
    return {
      municipalityLabel: '愛媛県今治市・上島町・松山市・宇和島市',
      furusatoKeyword: '愛媛県 今治 宇和島 みかん 鯛めし',
      specialties: ['紅まどんな・せとか・愛媛柑橘セット', '宇和島鯛めし＆瀬戸内真鯛づくし', '今治タオルプレミアムギフト', '道後温泉・しまなみ宿泊クーポン'],
    };
  }
  if (pref === '山口県') {
    return {
      municipalityLabel: '山口県周防大島町・下関市・萩市',
      furusatoKeyword: '山口県 周防大島 下関 ふぐ',
      specialties: ['本場下関とらふぐ刺身・ふぐちり鍋', '周防大島みかん＆ご当地みかん鍋', '萩・角島沖の甘鯛・剣先イカ一夜干し', '山口の銘酒・温泉宿泊クーポン'],
    };
  }
  if (pref === '兵庫県') {
    return {
      municipalityLabel: '兵庫県洲本市・南あわじ市・淡路市・姫路市',
      furusatoKeyword: '兵庫県 淡路島 家島',
      specialties: ['最高峰ブランド「淡路ビーフ」・淡路牛', '淡路島フルーツ玉ねぎ・3年とらふぐ', '家島諸島・播磨灘の旬魚介セット', '淡路島・洲本温泉ホテル宿泊利用券'],
    };
  }

  // 都道府県別汎用高精度マップ
  const prefFallbackMap: Record<string, FurusatoSpec> = {
    青森県: {
      municipalityLabel: '青森県八戸市',
      furusatoKeyword: '青森県 八戸市 海鮮',
      specialties: ['八戸前沖さば・いか・ウニ海鮮セット', '青森県産りんご＆特選スイーツ', '八戸せんべい汁・地酒セット'],
    },
    岩手県: {
      municipalityLabel: '岩手県宮古市・大槌町・山田町・陸前高田市',
      furusatoKeyword: '岩手県 三陸 海鮮 牡蠣',
      specialties: ['三陸産 濃厚殻付き牡蠣・ホタテ・いくら', '瓶ドン（三陸海鮮ミルフィーユ）', '前沢牛・いわて短角牛グルメ'],
    },
    宮城県: {
      municipalityLabel: '宮城県石巻市・塩竈市・気仙沼市・女川町',
      furusatoKeyword: '宮城県 気仙沼 石巻 海鮮 牛タン',
      specialties: ['気仙沼産フカヒレ・戻り鰹・生牡蠣', '石巻・女川の銀鮭＆極上たらこ', '本場仙台厚切り牛タンセット'],
    },
    山形県: {
      municipalityLabel: '山形県酒田市',
      furusatoKeyword: '山形県 酒田市',
      specialties: ['飛島・庄内浜の旬鮮魚＆天然岩牡蠣', '山形牛・庄内豚しゃぶしゃぶセット', 'つや姫・雪若丸＆庄内メロン'],
    },
    神奈川県: {
      municipalityLabel: '神奈川県横須賀市・藤沢市・三浦市',
      furusatoKeyword: '神奈川県 三浦 横須賀 藤沢',
      specialties: ['三崎港直送 天然本マグロ刺身セット', '湘南しらす・葉山牛・よこすか海軍カレー', '鎌倉・湘南・三浦エリア宿泊利用券'],
    },
    千葉県: {
      municipalityLabel: '千葉県鴨川市・館山市（南房総）',
      furusatoKeyword: '千葉県 鴨川 館山 伊勢海老',
      specialties: ['房総産 活伊勢海老・さざえ・あわび', '千葉県産金目鯛姿煮・なめろうセット', '鴨川・館山温泉リゾート宿泊クーポン'],
    },
    静岡県: {
      municipalityLabel: '静岡県熱海市・伊東市・沼津市',
      furusatoKeyword: '静岡県 熱海 沼津 金目鯛 干物',
      specialties: ['伊豆名産 特大金目鯛姿煮・極上干物詰合せ', '駿河湾産 桜えび・生しらす海鮮セット', '熱海・伊豆温泉ホテル宿泊感謝券'],
    },
    愛知県: {
      municipalityLabel: '愛知県南知多町・西尾市',
      furusatoKeyword: '愛知県 南知多 西尾 うなぎ ふぐ',
      specialties: ['日間賀島名物 ゆでダコ・とらふぐセット', '三河一色産うなぎ蒲焼・篠島しらす', '南知多温泉郷・離島宿の宿泊補助券'],
    },
    三重県: {
      municipalityLabel: '三重県鳥羽市・志摩市',
      furusatoKeyword: '三重県 鳥羽 志摩 伊勢海老',
      specialties: ['伊勢志摩産 活伊勢海老・あわび・的矢かき', '松阪牛ステーキ・答志島トロさわら', '鳥羽・志摩のリゾートホテル宿泊券'],
    },
    滋賀県: {
      municipalityLabel: '滋賀県近江八幡市・長浜市',
      furusatoKeyword: '滋賀県 近江八幡 近江牛',
      specialties: ['日本三大和牛「近江牛」すき焼き・焼肉', '琵琶湖沖島の湖魚佃煮・近江米', 'バームクーヘン＆琵琶湖畔宿泊券'],
    },
    京都府: {
      municipalityLabel: '京都府舞鶴市・宮津市',
      furusatoKeyword: '京都府 舞鶴 宮津 カニ 海鮮',
      specialties: ['丹後・舞鶴港のズワイガニ・岩牡蠣・ぶり', '京都肉・丹後コシヒカリ詰合せ', '天橋立・丹後エリア温泉宿泊クーポン'],
    },
    和歌山県: {
      municipalityLabel: '和歌山県和歌山市・串本町',
      furusatoKeyword: '和歌山県 串本 和歌山市 マグロ みかん',
      specialties: ['串本産 本マグロ・真鯛・海鮮セット', '有田みかん・紀州南高梅プレミアム', '熊野牛＆南紀白浜・串本宿泊クーポン'],
    },
    石川県: {
      municipalityLabel: '石川県七尾市・輪島市（能登応援）',
      furusatoKeyword: '石川県 七尾 輪島 能登',
      specialties: ['能登かき・輪島港のどぐろ一夜干し', '希少銘牛「能登牛」ステーキ・焼肉', '能登半島復興応援ギフト・和倉宿泊券'],
    },
    福井県: {
      municipalityLabel: '福井県坂井市・敦賀市',
      furusatoKeyword: '福井県 坂井市 敦賀市 越前がに',
      specialties: ['越前がに・甘えび・敦賀真鯛海鮮セット', '若狭牛・福井名物おろしそば詰合せ', 'あわら温泉・福井旅行クーポン'],
    },
    徳島県: {
      municipalityLabel: '徳島県牟岐町・阿南市・鳴門市',
      furusatoKeyword: '徳島県 鳴門 阿南 牟岐',
      specialties: ['鳴門鯛・伊勢海老・黒潮鮮魚ボックス', '阿波牛・なると金時スイーツ', '徳島・鳴門エリア宿泊利用券'],
    },
    高知県: {
      municipalityLabel: '高知県宿毛市・大月町',
      furusatoKeyword: '高知県 宿毛 大月 かつお',
      specialties: ['本場土佐 わら焼き鰹のたたきセット', '宿毛・柏島黒潮育ちの真鯛・ブリ刺身', '土佐文旦・四万十ポーク詰合せ'],
    },
    福岡県: {
      municipalityLabel: '福岡県福岡市・宗像市・新宮町',
      furusatoKeyword: '福岡県 宗像 福岡 明太子 もつ鍋',
      specialties: ['本場博多 辛子明太子＆和牛もつ鍋セット', '玄界灘産 天然真鯛・鐘崎天然とらふく', '博多あまおう苺・市内ホテル宿泊券'],
    },
    佐賀県: {
      municipalityLabel: '佐賀県唐津市',
      furusatoKeyword: '佐賀県 唐津市 佐賀牛 イカ',
      specialties: ['呼子名物 剣先イカ活き造り冷凍セット', '最高級「佐賀牛」焼肉・ステーキ', '唐津産生ウニ・干物詰合せ'],
    },
    熊本県: {
      municipalityLabel: '熊本県上天草市・天草市',
      furusatoKeyword: '熊本県 天草 車えび',
      specialties: ['天草産 活き車えび・真鯛・タコ海鮮', '幻の地鶏「天草大王」＆黒毛和牛「和王」', '完熟デコポン・天草温泉宿泊クーポン'],
    },
    大分県: {
      municipalityLabel: '大分県姫島村・佐伯市・津久見市',
      furusatoKeyword: '大分県 佐伯 姫島 ふぐ 海鮮',
      specialties: ['姫島車えび・佐伯の豪華海鮮干物セット', '豊後水道とらふぐ刺身・まぐろ詰合せ', 'おおいた和牛・別府温泉宿泊利用券'],
    },
    宮崎県: {
      municipalityLabel: '宮崎県宮崎市・延岡市・日南市',
      furusatoKeyword: '宮崎県 宮崎牛 マンゴー',
      specialties: ['内閣総理大臣賞受賞「宮崎牛」焼肉セット', '完熟マンゴー「太陽のタマゴ」', '日向灘産かつお・伊勢海老・地鶏炭火焼'],
    },
  };

  if (pref && prefFallbackMap[pref]) {
    return prefFallbackMap[pref];
  }

  const fallbackPref = pref || '日本';
  return {
    municipalityLabel: `${fallbackPref} 離島地域自治体`,
    furusatoKeyword: `${fallbackPref} 海鮮 宿泊券`,
    specialties: ['産地直送 旬の鮮魚・干物詰め合わせ', 'ご当地ブランド和牛・特産フルーツ', '地域応援ホテル・旅館宿泊クーポン'],
  };
}

function pickEssentialGear(island: any, isUninhabited: boolean): EssentialGearItem[] {
  const text = `${island?.name || ''} ${island?.access || ''} ${island?.description || ''}`;
  const targetIds: string[] = [];

  if (/船|フェリー|高速船|ジェット|おがさわら丸|マリンライナー|欠航/.test(text) || !/橋直結|陸路/.test(text)) {
    targetIds.push('motion_sickness_medicine');
  }
  if (/シュノーケル|サンゴ|ウミガメ|ブルー|ビーチ|透明/.test(text) || isUninhabited) {
    targetIds.push('rash_guard_set');
  }
  targetIds.push('extension_cord_tap');

  const items: EssentialGearItem[] = [];
  for (const pid of targetIds) {
    const found = AFFILIATE_PRODUCTS.find((p) => p.id === pid && p.hasAffiliateLink);
    if (found && !items.some((i) => i.id === found.id)) {
      items.push({
        id: found.id,
        name: found.name,
        icon: found.icon,
        subtitle: found.subtitle,
        rakutenUrl: found.rakutenUrl,
        amazonUrl: found.amazonUrl,
      });
    }
  }
  return items.slice(0, 2);
}

export function getIslandMonetizationPlan(island: any): IslandMonetizationPlan {
  const idStr = String(island?.id || '');
  const master = idStr ? ALL_ISLANDS_MASTER_DICTIONARY[idStr] : undefined;
  const merged = {
    ...(master || {}),
    ...(island || {}),
  };

  const islandName = String(merged.name || 'この島');
  const infra = getIslandInfrastructure(merged);
  const hubSpec = resolveGatewayHubSpec(merged);
  const furusatoSpec = resolveFurusatoSpec(merged);

  let gatewayReason = `「${islandName}」への定期船・高速船は朝便が中心のため、乗船港（${hubSpec.hubName}）周辺での前泊・後泊や拠点レンタカー確保が最も安心で便利です。`;
  if (infra.is_uninhabited) {
    gatewayReason = `「${islandName}」は島内に宿泊施設がない無人島のため、出港拠点となる「${hubSpec.hubName}」でホテル・宿と移動用レンタカーを確保して日帰り上陸するのが鉄則です。`;
  } else if (/橋|海中道路|直結/.test(String(merged.access || '') + String(merged.description || '')) && !/桟橋/.test(String(merged.access || ''))) {
    gatewayReason = `「${islandName}」へは拠点エリア（${hubSpec.hubName}）から連絡橋ドライブで快適にアクセスできるため、拠点ホテルと空港・駅発着レンタカーのセット予約がベストです。`;
  } else if (infra.day_trip !== true) {
    gatewayReason = `「${islandName}」は1日1便〜少数便ダイヤや天候欠航に備える必要があるため、乗継・出港拠点（${hubSpec.hubName}）での前泊・後泊ホテル手配が旅の安全性を大きく高めます。`;
  }

  return {
    gatewayHub: {
      hubName: hubSpec.hubName,
      reason: gatewayReason,
      rakutenGatewayHotelUrl: getRakutenTravelSearchUrl(hubSpec.searchQuery, hubSpec.searchPrefecture),
      jalanGatewayHotelUrl: getJalanSearchUrl(hubSpec.searchQuery, hubSpec.searchPrefecture),
      gatewayRentalCarUrl: getRakutenRentacarSearchUrl(hubSpec.searchQuery, hubSpec.searchPrefecture),
      jalanGatewayRentalCarUrl: getJalanRentacarSearchUrl(hubSpec.searchQuery, hubSpec.searchPrefecture),
    },
    furusatoNozei: {
      municipalityLabel: furusatoSpec.municipalityLabel,
      specialties: furusatoSpec.specialties,
      rakutenFurusatoUrl: buildRakutenFurusatoAffiliateUrl(furusatoSpec.furusatoKeyword),
      catchCopy: `現地になかなか行けない方も、ふるさと納税（実質自己負担2,000円〜）で「${islandName}」ゆかりの自治体・生産者を応援しながら島の絶品グルメや宿泊券を受け取れます。`,
    },
    essentialGear: pickEssentialGear(merged, infra.is_uninhabited),
  };
}
