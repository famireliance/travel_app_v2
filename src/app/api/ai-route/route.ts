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

以下の島データベースから、最適なアイランドホッピング（島巡り）ルートを提案してください。
データベース: ${islandsContext}
`;

    // Define the expected JSON schema
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
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
      required: ["title", "description", "totalEstimatedBudget", "route"]
    };

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
