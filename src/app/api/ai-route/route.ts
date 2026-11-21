import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import regionsData from '@/data/regions.json';
import { generateGeminiContentWithFallback } from '@/lib/geminiHelper';

// Helper to initialize Gemini conditionally so the app doesn't crash if API key is missing
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith('REPLACE')) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
  });
};

// In-memory rate limit for unauthenticated guest visitors (10 requests per 10 minutes per IP)
const guestRouteRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const GUEST_WINDOW_MS = 10 * 60 * 1000;
const GUEST_MAX_REQUESTS = 10;

function checkGuestRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = guestRouteRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    guestRouteRateLimitMap.set(ip, { count: 1, resetAt: now + GUEST_WINDOW_MS });
    return true;
  }
  if (entry.count >= GUEST_MAX_REQUESTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

const REGION_NAME_MAP: Record<string, string> = {};
regionsData.forEach((r) => {
  REGION_NAME_MAP[r.id] = r.name;
});

function buildSmartDictionaryRoutes(params: {
  startLocation?: string;
  durationDays?: number;
  preferences?: string;
  maxIslands?: number;
  excludedSet: Set<string>;
}) {
  const { startLocation, durationDays, preferences, maxIslands, excludedSet } = params;
  const daysCount = Math.max(1, Math.min(7, Number(durationDays) || 3));
  const maxIsl = Math.max(1, Math.min(5, Number(maxIslands) || 3));
  const queryText = `${startLocation || ''} ${preferences || ''}`;

  const templates = [
    {
      key: 'yaeyama',
      tags: ['沖縄', '那覇', '石垣', '海', 'ブルー', 'ダイビング', 'シュノーケル', '星空', 'リゾート', '家族'],
      planType: '王道・定番ルート',
      title: '八重山ブルーを巡る石垣島＆竹富島アイランドホッピング',
      description: '石垣島を拠点に、赤瓦の集落が美しい竹富島や大自然の西表島へ高速船で渡る王道の離島満喫プランです。',
      totalEstimatedBudget: '65,000円〜',
      stops: [
        { id: '392', name: '石垣島', transport: '直行便または那覇経由で新石垣空港へ', activity: '川平湾のグラスボート遊覧と島グルメ堪能' },
        { id: '393', name: '竹富島', transport: '石垣港離島ターミナルから高速船で約15分', activity: '水牛車での赤瓦集落散策とコンドイビーチ' },
        { id: '396', name: '西表島', transport: '石垣港離島ターミナルから高速船で約45分', activity: '仲間川・浦内川マングローブクルーズと亜熱帯の自然探訪' },
      ],
    },
    {
      key: 'izu',
      tags: ['東京', '羽田', '竹芝', '首都圏', '温泉', 'サウナ', '火山', '秘境', '自然', '気軽'],
      planType: '秘境・自然ルート',
      title: '伊豆諸島・八丈島と伊豆大島で巡る火山と黒潮の絶景温泉旅',
      description: '東京からアクセス良好な伊豆諸島で、ダイナミックな火山地形と絶景露天風呂を満喫するプランです。',
      totalEstimatedBudget: '45,000円〜',
      stops: [
        { id: '56', name: '八丈島', transport: '羽田空港から飛行機で約55分（または竹芝から大型客船）', activity: '八丈富士の絶景ドライブとみはらしの湯・島寿司堪能' },
        { id: '49', name: '伊豆大島', transport: '竹芝桟橋・熱海港から高速ジェット船でアクセス', activity: '三原山トレッキングと裏砂漠散策' },
      ],
    },
    {
      key: 'setouchi',
      tags: ['香川', '岡山', '高松', '瀬戸内', '大阪', '関西', 'アート', '美術館', 'カフェ', '女子', 'オリーブ', 'グルメ'],
      planType: 'テーマ特化ルート',
      title: '瀬戸内国際芸術祭の舞台・直島＆小豆島アートとオリーブ旅',
      description: '穏やかな瀬戸内海をフェリーで渡り、世界的な現代アートとオリーブの島時間を味わう周遊ルートです。',
      totalEstimatedBudget: '48,000円〜',
      stops: [
        { id: '195', name: '直島', transport: '高松港または宇野港からフェリーでアクセス', activity: '地中美術館・ベネッセハウス周辺のアート巡り' },
        { id: '197', name: '小豆島', transport: '高松港からフェリーまたは高速船でアクセス', activity: 'エンジェルロードと小豆島オリーブ公園散策' },
      ],
    },
    {
      key: 'miyako',
      tags: ['宮古', '沖縄', '海', '透明度', 'シュノーケル', '高級', 'ヴィラ', 'ドライブ'],
      planType: '絶景リゾートルート',
      title: '宮古ブルーと絶景大橋を渡る宮古島＆池間島ステイ',
      description: '世界屈指の透明度を誇る宮古諸島の海と、大橋で結ばれた離島絶景をめぐる爽快ドライブルートです。',
      totalEstimatedBudget: '60,000円〜',
      stops: [
        { id: '386', name: '宮古島', transport: '羽田・関西・那覇等から宮古空港へ直行便', activity: '与那覇前浜ビーチと東平安名崎の絶景散策' },
        { id: '388', name: '池間島', transport: '宮古島から池間大橋を渡りレンタカーで約30分', activity: '池間ブルーの展望スポットと八重干瀬マリン体験' },
      ],
    },
    {
      key: 'goto',
      tags: ['福岡', '長崎', '九州', '博多', '五島', '歴史', '世界遺産', '教会', '海鮮', 'グルメ'],
      planType: '歴史・美食ルート',
      title: '祈りの世界遺産と極上五島グルメを巡る福江島＆中通島',
      description: '長崎・博多からアクセスできる五島列島で、美しい教会群と絶品の五島うどん・海の幸を堪能します。',
      totalEstimatedBudget: '52,000円〜',
      stops: [
        { id: '296', name: '福江島', transport: '長崎港からジェットフォイルまたは福岡・長崎空港から空路', activity: '堂崎天主堂・高浜ビーチと五島牛・海鮮グルメ堪能' },
        { id: '292', name: '中通島', transport: '福江港または長崎・佐世保港から高速船でアクセス', activity: '頭ヶ島天主堂（世界文化遺産）見学と蛤浜散策' },
      ],
    },
  ];

  const scored = templates.map((tpl, idx) => {
    let score = 10 - idx; // preserve balanced default order when no keywords match
    for (const tag of tpl.tags) {
      if (queryText.includes(tag)) score += 15;
    }
    const availableStops = tpl.stops.filter((s) => !excludedSet.has(s.id));
    if (availableStops.length === 0) score -= 100;
    return { tpl, availableStops: availableStops.length > 0 ? availableStops : tpl.stops, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const defaultPlanTypes = ['王道・定番ルート', '秘境・自然ルート', 'テーマ特化ルート'];

  return scored.slice(0, 3).map((entry, idx) => {
    const cappedStops = entry.availableStops.slice(0, maxIsl);
    const route = Array.from({ length: daysCount }, (_, i) => {
      const item = cappedStops[Math.min(i, cappedStops.length - 1)];
      const isSameAsPrev = i > 0 && cappedStops[Math.min(i - 1, cappedStops.length - 1)].id === item.id;
      return {
        day: i + 1,
        islandId: item.id,
        islandName: item.name,
        activity: i === 0 ? `到着後、${item.activity}` : isSameAsPrev ? `${item.name}に連泊し、島内の絶景スポットや体験をゆったり満喫` : item.activity,
        transportation:
          i === 0
            ? `${startLocation || '出発地'}から${item.transport}`
            : isSameAsPrev
            ? `${item.name}島内（レンタカー・レンタサイクル・路線バス等）`
            : item.transport,
      };
    });

    return {
      planType: defaultPlanTypes[idx] || entry.tpl.planType,
      title: entry.tpl.title,
      description: entry.tpl.description,
      totalEstimatedBudget: entry.tpl.totalEstimatedBudget,
      route,
    };
  });
}

export async function POST(request: Request) {
  try {
    // Allow both authenticated users and rate-limited public visitors
    let isAuthenticated = false;
    const authHeader = request.headers.get('authorization');
    if (
      authHeader &&
      authHeader.startsWith('Bearer ') &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
          );
          const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
          if (!authError && user) {
            isAuthenticated = true;
          }
        } catch {
          // Fallback to guest rate limit
        }
      }
    }

    if (!isAuthenticated) {
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'anonymous';
      if (!checkGuestRateLimit(clientIp)) {
        return NextResponse.json(
          { error: 'ゲスト利用の回数制限に達しました。しばらく時間を置くか、ログインしてご利用ください。' },
          { status: 429 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
    }
    const { startLocation, durationDays, preferences, maxIslands, excludedIslands = [] } = body || {};

    const excludedSet = new Set(Array.isArray(excludedIslands) ? excludedIslands.map(String) : []);
    const ai = getGeminiClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawRouteData: any[] = [];

    if (!ai) {
      // GEMINI_API_KEY 未設定時は内蔵スマート辞書ルート生成へ即時フォールバック（HTTP 500にしない）
      rawRouteData = buildSmartDictionaryRoutes({
        startLocation,
        durationDays,
        preferences,
        maxIslands,
        excludedSet,
      });
    } else {
      // Fetch islands from Supabase to provide context to the AI, falling back to ALL_ISLANDS_MASTER_DICTIONARY
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dbIslands: any[] | null = null;
      try {
        const { data } = await supabase
          .from('islands')
          .select('id, name, prefecture, access, region_id, is_conquest_target')
          .eq('is_published', true);
        dbIslands = data;
      } catch {
        dbIslands = null;
      }

      const masterIslands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY);
      const sourceIslands = dbIslands && dbIslands.length > 0 ? dbIslands : masterIslands;

      // Filter out excluded islands, non-conquest islands, and deduplicate by name + prefecture
      const seenKeys = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validIslands = sourceIslands.filter((i: any) => {
        const idStr = String(i.id);
        if (excludedSet.has(idStr)) return false;
        const master = ALL_ISLANDS_MASTER_DICTIONARY[idStr];
        if (i.is_conquest_target === false || master?.is_conquest_target === false) return false;
        if (master?.difficulty === '到達不可') return false;
        const accessStr = String(i.access || master?.access || '');
        if (accessStr.includes('上陸禁止') || accessStr.includes('上陸不可') || accessStr.includes('立入禁止')) {
          return false;
        }
        const name = i.name || master?.name || '';
        const pref = i.prefecture || master?.prefecture || '';
        const dedupKey = `${name}__${pref}`;
        if (seenKeys.has(dedupKey)) return false;
        seenKeys.add(dedupKey);
        return true;
      });

      // Create a compact string of islands including region_id / archipelago name for the AI prompt
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const islandsContext = validIslands
        .map((i: any) => {
          const master = ALL_ISLANDS_MASTER_DICTIONARY[String(i.id)];
          const regionId = i.region_id || master?.region_id || '';
          const regionName = REGION_NAME_MAP[regionId] || regionId || 'その他';
          const access = i.access || master?.access || '定期船・航空便';
          return `ID:${i.id} | ${i.name}(${i.prefecture} / 諸島:${regionName}[${regionId}]) | アクセス:${access}`;
        })
        .join('\n');

      const responseSchema: Schema = {
        type: Type.ARRAY,
        description: 'コンセプトの異なる3つの独立したツアープランのリスト',
        items: {
          type: Type.OBJECT,
          properties: {
            planType: { type: Type.STRING, description: 'プランのタイプ（例: 王道・定番ルート、秘境・穴場ルート、テーマ特化ルート）' },
            title: { type: Type.STRING, description: 'ルートの魅力的なタイトル' },
            description: { type: Type.STRING, description: 'ルートの概要とアピールポイント（2〜3文）' },
            totalEstimatedBudget: { type: Type.STRING, description: '予算の目安（例: 50,000円〜）' },
            route: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER, description: '何日目か' },
                  islandId: { type: Type.STRING, description: '島データベースに記載された正確なID（例: "392" や "oujima_nago" などの文字列）' },
                  islandName: { type: Type.STRING, description: '島データベースに記載された正確な島名' },
                  activity: { type: Type.STRING, description: 'その島でのおすすめの過ごし方（具体的に）' },
                  transportation: { type: Type.STRING, description: '出発地・拠点または前の島からの現実的な移動手段（アクセス情報を元に具体的に）' },
                },
                required: ['day', 'islandId', 'islandName', 'activity', 'transportation'],
              },
            },
          },
          required: ['planType', 'title', 'description', 'totalEstimatedBudget', 'route'],
        },
      };

      const prompt = `
あなたは日本の離島専門の超一流トラベルプランナーAI「島巡りコンシェルジュ」です。
ユーザーから以下の要望を受け取りました。

【出発地/拠点】: ${startLocation || '指定なし'}
【日数】: ${durationDays} 日間
【希望・テーマ】: ${preferences || '特になし'}
【最大訪問島数】: ${maxIslands || 3} 島以内

以下の全国島データベースから、現実的で魅力的な離島旅行・アイランドホッピングルートを提案してください。
データベースには各島の「諸島エリア（region_id）」と「アクセス情報」が記載されています。これらを元に、物理的に移動可能なルートのみを構築してください。

【島データベース】
${islandsContext}

【プラン作成の厳格なルール（絶対遵守）】
1. **必ず3つの異なるエリア・コンセプトのプランを提案すること**: 「王道ルート」「秘境・自然ルート」「テーマ特化ルート」など、3つのプランで異なる諸島エリアを取り上げてください。
2. **現実的な滞在とアイランドホッピング**:
   - 1つのプラン内で巡る島は**必ず同じ諸島エリア（同一のregion_idまたは隣接する同一県内の航路圏）**に限定してください。北海道と沖縄、あるいは奄美と五島などを同一プラン内で移動する非現実的なワープは絶対禁止です。
   - 大きな島（屋久島、奄美大島、佐渡島、石垣島、宮古島、父島、福江島など）での**複数日連泊滞在**や、拠点島（例：石垣島、高松・直島、那覇など）に連泊しながら近隣離島へフェリーで渡る**現実的なアイランドホッピング**を推奨します。無理に毎日別の島へ移動する必要はありません（連泊する場合は各日の \`islandId\` と \`islandName\` にその滞在島を指定してください）。
3. **実在のID・施設情報の遵守**:
   - \`islandId\` には必ず上記【島データベース】の \`ID:\` の値（例: "392" や "oujima_nago"）をそのまま指定してください。
   - 存在しない空港・航路・施設を捏造しないでください。
`;

      try {
        const response = await generateGeminiContentWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.6,
          },
        });
        if (response.text) {
          rawRouteData = JSON.parse(response.text);
        }
      } catch {
        rawRouteData = buildSmartDictionaryRoutes({
          startLocation,
          durationDays,
          preferences,
          maxIslands,
          excludedSet,
        });
      }

      if (!Array.isArray(rawRouteData) || rawRouteData.length === 0) {
        rawRouteData = buildSmartDictionaryRoutes({
          startLocation,
          durationDays,
          preferences,
          maxIslands,
          excludedSet,
        });
      }
    }

    // Validate and normalize every route day's islandId against ALL_ISLANDS_MASTER_DICTIONARY so links never 404
    const allMasterValues = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter(
      (isl) => isl.is_conquest_target !== false && isl.difficulty !== '到達不可'
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validatedRouteData = (Array.isArray(rawRouteData) ? rawRouteData : []).map((plan: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validatedRoute = (Array.isArray(plan.route) ? plan.route : []).map((day: any) => {
        const rawId = String(day.islandId || '').replace(/^ID:/i, '').trim();
        const rawName = String(day.islandName || '').trim();
        const cleanName = rawName.split('（')[0].split('(')[0].trim();

        let matched = ALL_ISLANDS_MASTER_DICTIONARY[rawId];
        if (!matched || matched.is_conquest_target === false || matched.difficulty === '到達不可') {
          matched =
            allMasterValues.find((isl) => isl.name === rawName || isl.name === cleanName || isl.slug === rawId) ||
            allMasterValues.find(
              (isl) =>
                (cleanName && isl.name.includes(cleanName)) ||
                (isl.name && cleanName.includes(isl.name))
            );
        }

        if (matched) {
          return {
            ...day,
            islandId: String(matched.id),
            slug: matched.slug || String(matched.id),
            islandName: matched.name,
          };
        }
        return {
          ...day,
          islandId: '',
        };
      });

      return {
        ...plan,
        route: validatedRoute,
      };
    });

    return NextResponse.json(validatedRouteData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred while generating the route.';
    console.error('AI Route API Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
