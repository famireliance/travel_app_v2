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
    const { startLocation, durationDays, preferences, maxIslands, excludedIslands = [] } = body;

    const ai = getGeminiClient();

    if (!ai) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in the environment variables.' },
        { status: 500 }
      );
    }

    // Fetch islands from Supabase to provide context to the AI
    // We fetch ALL islands (up to 1000) and include 'access' so AI knows real transportation routes
    const { data: islands, error } = await supabase
      .from('islands')
      .select('id, name, prefecture, access')
      .eq('is_published', true);

    if (error) {
      console.error('Error fetching islands:', error);
      return NextResponse.json({ error: 'Failed to fetch islands data for context' }, { status: 500 });
    }

    // Filter out excluded islands if provided
    const filteredIslands = Array.isArray(excludedIslands) && excludedIslands.length > 0 
      ? islands.filter(i => !excludedIslands.includes(i.id))
      : islands;

    // Create a compact string of islands for the AI prompt
    const islandsContext = filteredIslands.map(i => `${i.name}(${i.prefecture}) - ID:${i.id} - アクセス:${i.access || '不明'}`).join('\\n');



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
                activity: { type: Type.STRING, description: "その島でのおすすめの過ごし方（具体的に）" },
                transportation: { type: Type.STRING, description: "次の目的地または拠点からの移動手段（アクセス情報を元に現実的に）" }
              },
              required: ["day", "islandId", "islandName", "activity", "transportation"]
            }
          }
        },
        required: ["planType", "title", "description", "totalEstimatedBudget", "route"]
      }
    };

    const prompt = `
あなたは日本の離島専門の超一流トラベルプランナーAI「島巡りコンシェルジュ」です。
ユーザーから以下の要望を受け取りました。

【出発地/拠点】: ${startLocation || '指定なし'}
【日数】: ${durationDays} 日間
【希望・テーマ】: ${preferences || '特になし'}
【最大訪問島数】: ${maxIslands || 3} 島

以下の全国島データベースから、最適なアイランドホッピング（島巡り）ルートを提案してください。
データベースには各島の「アクセス情報」も記載されています。これらを元に、絶対に物理的に移動可能なルートを構築してください。

【島データベース】
${islandsContext}

【プラン作成の厳格なルール（絶対遵守）】
1. **必ず3つの全く異なるプランを提案すること**: 「王道ルート」「秘境ルート」「ユーザー特化ルート」など、選ぶ島や地域が被らないように、全国の様々な島から多様性のある3プランを出力してください。毎回同じ島（例: 伊豆諸島や八重山諸島だけ）ばかり提案するのは禁止です。
2. **毎日異なる島を巡ること**: 1日目から最終日まで、同じ島が重複して登場しないようにしてください。（例: 1日目と3日目が同じ島になるのはNG。真のアイランドホッピングにしてください）。
3. **現実的なアクセス（最重要）**: データベースの「アクセス情報」を読み解き、フェリーの航路や橋の有無などを考慮して、実際に移動可能な島同士を組み合わせてください。北海道と沖縄を1日で移動するなどの非現実的なワープは厳禁です。
4. **超高品質な旅行計画**: 単なる地名の羅列ではなく、「なぜその島へ行くのか」「そこでどんな最高の体験ができるのか」を具体的に描写し、プロの旅行会社が販売できるレベルの実用的で魅力的な旅行計画にしてください。
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
