import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Helper to initialize Gemini conditionally so the app doesn't crash if API key is missing
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startLocation, durationDays, preferences, maxIslands } = body;

    const ai = getGeminiClient();

    if (!ai) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in the environment variables.' },
        { status: 500 }
      );
    }

    // Fetch islands from Supabase to provide context to the AI
    const { data: islands, error } = await supabase
      .from('islands')
      .select('id, name, prefecture, description')
      .eq('is_published', true)
      .limit(100); // Limit to top 100 for context size

    if (error) {
      console.error('Error fetching islands:', error);
      return NextResponse.json({ error: 'Failed to fetch islands data for context' }, { status: 500 });
    }

    // Create a compact string of islands for the AI prompt
    const islandsContext = islands.map(i => `${i.name}(${i.prefecture}) - ID:${i.id}`).join(', ');

    const prompt = `
あなたは日本の離島専門の優秀なトラベルプランナーAI「島巡りコンシェルジュ」です。
ユーザーから以下の要望を受け取りました。

【出発地/拠点】: ${startLocation || '指定なし'}
【日数】: ${durationDays} 日間
【希望・テーマ】: ${preferences || '特になし'}
【最大訪問島数】: ${maxIslands || 3} 島

以下の島データベース（抜粋）から、最適なアイランドホッピング（島巡り）ルートを提案してください。
データベース: ${islandsContext}

【プラン作成の厳格なルール】
1. **地理的・物理的な現実性（最重要）**: 北海道と沖縄を1日で移動するなど、物理的に不可能なルートは絶対に作成しないでください。必ず「同じ県」や「同じ諸島（例: 八重山諸島、伊豆諸島、瀬戸内海など）」といった近接エリア内に限定してルートを組んでください。
2. **移動の実現性**: 実際にフェリーや橋、飛行機で移動できる範囲の島々を選んでください。移動時間がかかりすぎる過密スケジュールは避けてください。
3. **洗練された提案**: 回答内容は長すぎず、ユーザーが読みやすいように簡潔かつ魅力的にまとめてください。誰もが「実際に行ってみたい！」と思えるような現実的で魅力的なプランにしてください。
`;

    // Define the expected JSON schema
    const responseSchema: Schema = {
      type: Type.ARRAY,
      description: "コンセプトの異なる3つの独立したツアープランのリスト",
      items: {
        type: Type.OBJECT,
        properties: {
          planType: { type: Type.STRING, description: "プランのタイプ（例: 王道・定番ルート、秘境・穴場ルート、テーマ特化ルート）" },
          title: { type: Type.STRING, description: "ルートの魅力的なタイトル" },
          description: { type: Type.STRING, description: "ルートの概要とアピールポイント（2〜3文）" },
          totalEstimatedBudget: { type: Type.STRING, description: "予算の目安（例: 50,000円〜）" },
          route: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER, description: "何日目か" },
                islandId: { type: Type.STRING, description: "データベースのID" },
                islandName: { type: Type.STRING, description: "島名" },
                activity: { type: Type.STRING, description: "その島でのおすすめの過ごし方" },
                transportation: { type: Type.STRING, description: "次の目的地または拠点からの移動手段の目安" }
              },
              required: ["day", "islandId", "islandName", "activity", "transportation"]
            }
          }
        },
        required: ["planType", "title", "description", "totalEstimatedBudget", "route"]
      }
    };

    const prompt = `
あなたは日本の離島専門の優秀なトラベルプランナーAI「島巡りコンシェルジュ」です。
ユーザーから以下の要望を受け取りました。

【出発地/拠点】: ${startLocation || '指定なし'}
【日数】: ${durationDays} 日間
【希望・テーマ】: ${preferences || '特になし'}
【最大訪問島数】: ${maxIslands || 3} 島

以下の島データベース（抜粋）から、最適なアイランドホッピング（島巡り）ルートを提案してください。
データベース: ${islandsContext}

【プラン作成の厳格なルール】
1. **必ず3つの異なるプランを提案すること**: 「王道・定番ルート」「秘境・リラックスルート」「テーマ特化ルート」など、コンセプトを明確に分けた3つのプランを出力してください。
2. **地理的・物理的な現実性（最重要）**: 北海道と沖縄を1日で移動するなど、物理的に不可能なルートは絶対に作成しないでください。必ず「同じ県」や「同じ諸島（例: 八重山諸島、伊豆諸島、瀬戸内海など）」といった近接エリア内に限定してルートを組んでください。
3. **移動の実現性**: 実際にフェリーや橋、飛行機で移動できる範囲の島々を選んでください。移動時間がかかりすぎる過密スケジュールは避けてください。
4. **洗練された提案**: 回答内容は長すぎず、ユーザーが読みやすいように簡潔かつ魅力的にまとめてください。誰もが「実際に行ってみたい！」と思えるような現実的で魅力的なプランにしてください。
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const aiContent = response.text;
    
    if (!aiContent) {
      throw new Error('AI returned empty response');
    }

    const routeData = JSON.parse(aiContent);
    return NextResponse.json(routeData);

  } catch (error: any) {
    console.error('AI Route API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating the route.' },
      { status: 500 }
    );
  }
}
