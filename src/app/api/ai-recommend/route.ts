import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { createClient } from '@supabase/supabase-js';
import { generateGeminiContentWithFallback } from '@/lib/geminiHelper';

// Vercel config
export const maxDuration = 30; // max execution time

// In-memory rate limit for unauthenticated guest visitors (15 requests per 10 minutes per IP)
const guestRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const GUEST_WINDOW_MS = 10 * 60 * 1000;
const GUEST_MAX_REQUESTS = 15;

function checkGuestRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = guestRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    guestRateLimitMap.set(ip, { count: 1, resetAt: now + GUEST_WINDOW_MS });
    return true;
  }
  if (entry.count >= GUEST_MAX_REQUESTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Allow both authenticated users and rate-limited public visitors
    let isAuthenticated = false;
    const authHeader = req.headers.get('authorization');
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
          // Fallback to guest rate limiting if token verification fails
        }
      }
    }

    if (!isAuthenticated) {
      const clientIp =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'anonymous';
      if (!checkGuestRateLimit(clientIp)) {
        return NextResponse.json(
          { error: 'ゲスト利用の回数制限に達しました。しばらく時間を置くか、ログインしてご利用ください。' },
          { status: 429 }
        );
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
    }

    const { userInput, visitedIslandIds } = body;

    // Filter available islands: exclude visited, non-conquest/landing-prohibited islands, and deduplicate by name + prefecture
    const seenKeys = new Set<string>();
    const availableIslands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter((island) => {
      if (visitedIslandIds && visitedIslandIds.includes(String(island.id))) return false;
      if (island.is_conquest_target === false) return false;
      if (island.difficulty === '到達不可') return false;
      const accessStr = String(island.access || '');
      const descStr = String(island.description || '');
      if (
        accessStr.includes('上陸禁止') ||
        accessStr.includes('上陸不可') ||
        accessStr.includes('立入禁止') ||
        descStr.includes('一般人の上陸は禁止') ||
        descStr.includes('上陸禁止')
      ) {
        return false;
      }
      const dedupKey = `${island.name || ''}__${island.prefecture || ''}`;
      if (seenKeys.has(dedupKey)) return false;
      seenKeys.add(dedupKey);
      return true;
    });

    // Create a concise dictionary for AI to select from (including description snippet so AI never fabricates facilities)
    const islandListString = availableIslands
      .map((i) => {
        const descSnippet = String(i.description || '').replace(/\n/g, ' ').slice(0, 75);
        return `ID:${i.id} | Name:${i.name} (${i.prefecture}) | Region:${i.region_id || ''} | Access:${i.access || ''} | Desc:${descSnippet}`;
      })
      .join('\n');

    const prompt = `
あなたは日本の離島専門のプロ旅行コンシェルジュです。
ユーザーから「こんな島に行きたい」という条件が提示されました。

ユーザーの要望: "${userInput || 'おすすめの島'}"

以下の島リストから、ユーザーの要望に最も合致する実在の有人・観光可能な離島を3つ選んでください。
選ぶ際、必ず3つの異なるテーマ（例：「王道リゾート」「秘境」「日帰り手軽」など）でバラエティを持たせてください。

【厳格な注意事項（絶対遵守）】
1. 候補島リストに記載されている「Desc（説明）」および「Access（アクセス）」の事実情報に厳密に基づいて推薦理由を作成してください。
2. 島のデータに記載されていない施設や特徴（存在しないサウナ、温泉、空港、定期船など）を絶対に捏造（ハルシネーション）しないでください。ユーザーが特定の設備（例：サウナ）を求めた場合、実際にその設備で知られる島（例：青ヶ島のひんぎゃサウナ、直島、屋久島、八丈島など）を選ぶか、記載されている自然・体験の魅力を正直に紹介してください。
3. 必ず候補島リスト内の正確な「ID」と「Name」を返してください。

### 候補島リスト
${islandListString}
`;

    let rawPlans: any[] = [];
    try {
      const response = await generateGeminiContentWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: '選んだ島のID' },
                name: { type: Type.STRING, description: '選んだ島の名前' },
                theme: { type: Type.STRING, description: 'この提案のテーマ（例: リラックス、アクティブ、穴場など）' },
                reason: { type: Type.STRING, description: '候補島リストの事実データに基づき、なぜこの島をおすすめするのかの理由（100字程度）' },
              },
              required: ['id', 'name', 'theme', 'reason'],
            },
          },
          temperature: 0.5,
        },
      });
      if (response.text) {
        rawPlans = JSON.parse(response.text);
      }
    } catch {
      // Gemini全モデルが高負荷・一時障害時のスマート辞書マッチングフォールバック
      const q = String(userInput || '').trim();
      const keywords = q.split(/[\s、,・。]+/).filter((w) => w.length >= 2);
      const scored = availableIslands.map((isl) => {
        const text = `${isl.name} ${isl.prefecture} ${isl.area || ''} ${isl.description || ''} ${isl.access || ''}`;
        let score = 0;
        for (const kw of keywords) {
          if (text.includes(kw)) score += 10;
        }
        if (q.includes('海') && (isl.prefecture === '沖縄県' || isl.prefecture === '鹿児島県' || isl.prefecture === '東京都')) score += 5;
        if (q.includes('温泉') && (text.includes('温泉') || ['66', '71', '74', '330'].includes(String(isl.id)))) score += 12;
        if (q.includes('アート') && (isl.prefecture === '香川県' || text.includes('アート') || text.includes('美術館'))) score += 12;
        if (q.includes('日帰り') && isl.day_trip) score += 8;
        return { isl, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const picked: any[] = [];
      const usedPrefs = new Set<string>();
      const themes = ['王道アイランドステイ', '絶景・自然満喫', '島時間・穴場トリップ'];
      for (const item of scored) {
        if (picked.length >= 3) break;
        if (!usedPrefs.has(item.isl.prefecture || '') || picked.length === 2) {
          usedPrefs.add(item.isl.prefecture || '');
          picked.push({
            id: String(item.isl.id),
            name: item.isl.name,
            theme: themes[picked.length] || 'おすすめ離島',
            reason: `${item.isl.prefecture}・${item.isl.area || '離島エリア'}に位置する魅力あふれる島。${String(item.isl.description || '').slice(0, 80)}（アクセス: ${item.isl.access || '定期船・航空便'}）`,
          });
        }
      }
      rawPlans = picked;
    }
    const validatedPlans = (Array.isArray(rawPlans) ? rawPlans : [])
      .map((p) => {
        const directMatch = ALL_ISLANDS_MASTER_DICTIONARY[String(p.id)];
        const validDirect =
          directMatch && directMatch.is_conquest_target !== false && directMatch.difficulty !== '到達不可'
            ? directMatch
            : undefined;
        const nameMatch = availableIslands.find(
          (isl) => isl.name === p.name || String(isl.name).includes(String(p.name || ''))
        );
        const matched = validDirect || nameMatch;
        if (!matched) return null;
        return {
          ...p,
          id: String(matched.id),
          name: matched.name,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ plans: validatedPlans });
  } catch (error: any) {
    console.error('AI Recommendation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: error.message },
      { status: 500 }
    );
  }
}
