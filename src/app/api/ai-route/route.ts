import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

// Helper to initialize OpenAI conditionally so the app doesn't crash if API key is missing
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startLocation, durationDays, preferences, maxIslands } = body;

    const openai = getOpenAIClient();

    if (!openai) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured in the environment variables.' },
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

【制約事項】
必ず以下のJSON形式でのみ回答してください。余計なマークダウン(\`\`\`json)などは出力せず、純粋なJSON文字列のみを出力してください。
{
  "title": "ルートの魅力的なタイトル",
  "description": "ルートの概要とアピールポイント（2〜3文）",
  "totalEstimatedBudget": "予算の目安（例: 50,000円〜）",
  "route": [
    {
      "day": 1,
      "islandId": "データベースのID",
      "islandName": "島名",
      "activity": "その島でのおすすめの過ごし方",
      "transportation": "次の目的地または拠点からの移動手段の目安"
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional travel planner API that returns only JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const aiContent = response.choices[0]?.message?.content;
    
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
