import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import regionsData from '@/data/regions.json';

// Helper to initialize Gemini conditionally so the app doesn't crash if API key is missing
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
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

    const body = await request.json();
    const { startLocation, durationDays, preferences, maxIslands, excludedIslands = [] } = body;

    const ai = getGeminiClient();

    if (!ai) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in the environment variables.' },
        { status: 500 }
      );
    }

    // Fetch islands from Supabase to provide context to the AI, falling back to ALL_ISLANDS_MASTER_DICTIONARY
    const { data: dbIslands } = await supabase
      .from('islands')
      .select('id, name, prefecture, access, region_id, is_conquest_target')
      .eq('is_published', true);

    const masterIslands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY);
    const sourceIslands = dbIslands && dbIslands.length > 0 ? dbIslands : masterIslands;

    // Filter out excluded islands, non-conquest islands, and deduplicate by name + prefecture
    const excludedSet = new Set(Array.isArray(excludedIslands) ? excludedIslands.map(String) : []);
    const seenKeys = new Set<string>();
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
    const islandsContext = validIslands
      .map((i: any) => {
        const master = ALL_ISLANDS_MASTER_DICTIONARY[String(i.id)];
        const regionId = i.region_id || master?.region_id || '';
        const regionName = REGION_NAME_MAP[regionId] || regionId || 'その他';
        const access = i.access || master?.access || '定期船・航空便';
        return `ID:${i.id} | ${i.name}(${i.prefecture} / 諸島:${regionName}[${regionId}]) | アクセス:${access}`;
      })
      .join('\n');

    // Define the expected JSON schema
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
                islandId: { type: Type.STRING, description: '島データベースに記載された正確なID（数字文字列）' },
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
   - \`islandId\` には必ず上記【島データベース】の \`ID:\` の値（例: "392"）をそのまま指定してください。
   - 存在しない空港・航路・施設を捏造しないでください。
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.6,
      },
    });

    const aiContent = response.text;

    if (!aiContent) {
      throw new Error('AI returned empty response');
    }

    const rawRouteData = JSON.parse(aiContent);

    // Validate and normalize every route day's islandId against ALL_ISLANDS_MASTER_DICTIONARY so links never 404
    const allMasterValues = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter(
      (isl) => isl.is_conquest_target !== false && isl.difficulty !== '到達不可'
    );

    const validatedRouteData = (Array.isArray(rawRouteData) ? rawRouteData : []).map((plan: any) => {
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
  } catch (error: any) {
    console.error('AI Route API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating the route.' },
      { status: 500 }
    );
  }
}
