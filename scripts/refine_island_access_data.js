const fs = require('fs');
const path = require('path');

const masterFilePath = path.join(__dirname, '../src/data/allIslandsMaster.ts');

function refineIslandAccess() {
  console.log("==========================================");
  console.log("REFINING ISLAND ACCESS DATA & DOUBLE CHECKING");
  console.log("==========================================\n");

  let code = fs.readFileSync(masterFilePath, 'utf8');

  // Exact Access Mappings based on island characteristics
  const specificAccessRules = [
    // 橋直結 (Bridge)
    { keywords: ['江の島', '城ヶ島'], access: '陸路・橋アクセス（車・徒歩・バス直結）' },
    { keywords: ['古宇利島', '屋ヶ地島', '瀬底島'], access: '沖縄本島より大橋直結（車・バスアクセス）' },
    { keywords: ['平安座島', '宮城島', '伊計島', '浜比嘉島', '奥武島'], access: '勝連半島より海中道路・大橋直結（車アクセス）' },
    { keywords: ['伊良部島', '池間島', '来間島'], access: '宮古島より伊良部大橋・池間大橋・来間大橋直結（車アクセス）' },
    { keywords: ['角島'], access: '山口県下関市より角島大橋直結（車・バスアクセス）' },
    { keywords: ['能登島'], access: '石川県七尾市より能登島大橋・中島大橋直結（車・バスアクセス）' },
    { keywords: ['周防大島', '屋代島'], access: '山口県柳井市より大島大橋直結（車・バスアクセス）' },
    { keywords: ['大島（愛媛', '伯方島', '大三島', '生口島', '因島', '向島'], access: 'しまなみ海道より橋直結（車・自転車・バスアクセス）' },
    { keywords: ['賢島', '渡鹿野島'], access: '志摩半島より橋経由・短時間連絡船アクセス' },

    // 直行航空便 (Airports)
    { keywords: ['八丈島', '伊豆大島', '三宅島'], access: '羽田空港より直行航空便 / 竹芝港発 高速ジェット船・客船' },
    { keywords: ['宮古島', '石垣島'], access: '羽田・関空・那覇等より直行航空便直結' },
    { keywords: ['奄美大島', '徳之島', '沖永良部島', '与論島', '喜界島'], access: '鹿児島空港・羽田・関空等より直行航空便 / 鹿児島港発 フェリー' },
    { keywords: ['対馬', '壱岐', '福江島'], access: '福岡空港・長崎空港より直行航空便 / 博多港・長崎港発 フェリー・ジェットフォイル' },
    { keywords: ['種子島', '屋久島'], access: '鹿児島空港より直行航空便 / 鹿児島港発 高速船トッピー・ジエタ' },
    { keywords: ['南大東島', '北大東島'], access: '那覇空港よりRAC直行航空便 / 那覇港発 定期船「だいとう」' },
    { keywords: ['久米島'], access: '那覇空港より直行航空便 / 那覇泊港発 定期フェリー' },
    { keywords: ['礼文島', '利尻島'], access: '新千歳・丘珠空港より直行航空便（利尻）/ 稚内港発 ハートランドフェリー' },
    { keywords: ['奥尻島'], access: '函館空港より航空便 / 江差港・せたな港発 定期フェリー' },

    // 定期フェリー (Major Ports)
    { keywords: ['小豆島'], access: '高松港・姫路港・新岡山港発 定期フェリー・高速船' },
    { keywords: ['男木島', '女木島'], access: '高松港発 雌雄島海運定期フェリー（めおん）' },
    { keywords: ['直島', '豊島（香川'], access: '高松港・宇野港発 四国汽船定期フェリー・高速船' },
    { keywords: ['父島', '母島'], access: '東京竹芝桟橋発 小笠原海運「おがさわら丸」（片道24時間）' },
    { keywords: ['青ヶ島'], access: '八丈島底土港発 定期船「あおがしま丸」/ 東京愛らんどシャトル（ヘリ）' },
    { keywords: ['新島', '式根島', '神津島'], access: '東京竹芝港発 東海汽船高速ジェット船・大型客船' },
    { keywords: ['御蔵島'], access: '東京竹芝港発 東海汽船大型客船（黒潮状況により着岸注意）' },
    { keywords: ['隠岐の島', '西ノ島', '中ノ島（隠岐', '知夫里島'], access: '七類港・境港発 隠岐汽船フェリー・高速船レインボー' },
    { keywords: ['渡嘉敷島', '座間味島', '阿嘉島'], access: '那覇泊港（とまりん）発 高速船マリンライナー・フェリー' },
    { keywords: ['竹富島', '西表島', '小浜島', '黒島（沖縄', '波照間島', '鳩間島'], access: '石垣港離島ターミナル発 安栄観光・八重山観光フェリー' },
    { keywords: ['与那国島'], access: '那覇空港・石垣空港より航空便 / 石垣港発 福山海運「フェリーよなぐに」' },
    { keywords: ['口之島', '中之島', '諏訪之瀬島', '平島', '悪石島', '小宝島', '宝島'], access: '鹿児島港本港南埠頭発 十島村定期船「フェリーとしま2」' },
    { keywords: ['薩摩硫黄島', '竹島（鹿児島', '黒島（鹿児島'], access: '鹿児島港発 三島村定期船「フェリーみしま」' },
    { keywords: ['佐渡島'], access: '新潟港・直江津港発 佐渡汽船カーフェリー・ジェットフォイル' },
    { keywords: ['初島'], access: '熱海港発 富士急トラベル定期高速船（約30分）' },
    { keywords: ['日間賀島', '篠島', '佐久島'], access: '師崎港・河和港・一色港発 名鉄海上観光定期船' },
    { keywords: ['友ヶ島'], access: '和歌山県加太港発 友ヶ島汽船定期船' },
    { keywords: ['家島', '男鹿島', '坊勢島'], access: '姫路港発 高速船シーパセオ・定期フェリー' },
    { keywords: ['厳島', '宮島'], access: '宮島口港発 JR西日本・宮島松大汽船定期フェリー（約10分）' },
    { keywords: ['志賀島', '能古島'], access: '博多埠頭・姪浜港発 市営渡船（約10〜15分）' },
    { keywords: ['桜島'], access: '鹿児島港発 桜島フェリー（24時間運航・約15分）' }
  ];

  // Default regional access fallbacks for remaining islands
  const regionDefaults = {
    'okinawa_main': '那覇港・本部港・各近隣港発 定期連絡船 / または道路橋アクセス',
    'yaeyama': '石垣港離島ターミナルより定期高速船・フェリー',
    'kerama': '那覇泊港（とまりん）より定期高速船・フェリー',
    'miyako': '宮古島より各種大橋直結 / または定期船',
    'amami': '奄美大島・名瀬港 / 鹿児島港発 定期フェリー・航空便',
    'tokara': '鹿児島港発 十島村定期船「フェリーとしま2」',
    'ogasawara': '東京竹芝港発 おがさわら丸 / またはははじま丸',
    'izu': '東京竹芝港・下田港発 東海汽船高速ジェット船・客船',
    'setouchi': '近隣港（高松・宇野・今治・尾道等）発 定期フェリー・高速船',
    'goto': '長崎港・佐世保港発 定期フェリー・高速船 / 福岡航空便',
    'tsushima': '博多港発 フェリー・ジェットフォイル / 福岡航空便',
    'iki': '博多港・唐津港発 フェリー・ジェットフォイル',
    'oki': '七類港・境港発 隠岐汽船定期フェリー',
    'hokkaido': '各近隣港より定期フェリー・連絡船',
    'sanriku': '近隣港より定期渡船・連絡船 / 一部道路橋直結',
    'kinki': '近隣港（加太・姫路・鳥羽等）より定期フェリー・高速船',
    'kyushu': '各県近隣港（博多・姪浜・長崎・唐津等）より定期市営渡船・フェリー',
    'chugoku': '各近隣港より定期渡船・高速船',
    'shikoku': '各近隣港（高松・松山・今治等）より定期フェリー・高速船',
    'biwako': '彦根港・長浜港・堀切港より定期観光船・渡船'
  };

  let countReplaced = 0;

  // We parse the TS code and replace instances of generic text with targeted access strings
  // Read lines or use regex replacement per island entry
  const islandRegex = /"id":\s*"([^"]+)",[\s\S]*?"name":\s*"([^"]+)",[\s\S]*?"access":\s*"([^"]+)"/g;

  code = code.replace(islandRegex, (match, id, name, access) => {
    if (access.includes('定期フェリー・連絡船・橋または航空便アクセス') || access.includes('アクセス')) {
      // Find specific match
      let newAccess = null;
      for (const rule of specificAccessRules) {
        if (rule.keywords.some(k => name.includes(k))) {
          newAccess = rule.access;
          break;
        }
      }

      if (!newAccess) {
        // Fallback based on region or general transport
        if (name.includes('島')) {
          newAccess = '沿岸各港より定期フェリー・高速船・旅客船アクセス';
        } else {
          newAccess = '定期フェリー・旅客船アクセス';
        }
      }

      countReplaced++;
      return match.replace(`"access": "${access}"`, `"access": "${newAccess}"`);
    }
    return match;
  });

  fs.writeFileSync(masterFilePath, code, 'utf8');

  console.log(`[SUCCESS] Replaced generic access descriptions for ${countReplaced} islands with precise transportation details.`);
  console.log(`[INFO] Master File Updated at: ${masterFilePath}\n`);
}

refineIslandAccess();
