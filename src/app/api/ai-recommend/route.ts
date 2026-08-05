import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

// Vercel config
export const maxDuration = 30; // max execution time

export async function POST(req: NextRequest) {
  try {
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

    // Filter available islands
    const availableIslands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter((island) => {
      // Exclude visited
      if (visitedIslandIds && visitedIslandIds.includes(String(island.id))) return false;
      // Option: Exclude non-conquest targets if we only want real inhabited islands?
      // For now, let's include all but give the AI the is_uninhabited flag.
      return true;
    });

    // Create a mini dictionary for AI to select from (to save tokens)
    // Send ID, Name, Prefecture, IsUninhabited, Access, Points
    const islandListString = availableIslands.map(i => 
      `ID:${i.id} | Name:${i.name} (${i.prefecture}) | Uninhabited:${!!i.is_uninhabited} | Access:${i.access} | Pts:${i.points}`
    ).join('\n');

    const prompt = `
あなたは日本の離島専門のプロ旅行コンシェルジュです。
ユーザーから「こんな島に行きたい」という条件が提示されました。

ユーザーの要望: "${userInput || 'おすすめの島'}"

以下の島リストから、ユーザーの要望に最も合致する島を3つ選んでください。
選ぶ際、必ず3つの異なるテーマ（例：「王道リゾート」「秘境」「日帰り手軽」など）でバラエティを持たせてください。
ユーザーが既に訪れた島はリストから除外されていますので、このリスト内から選ぶだけで大丈夫です。

### 候補島リスト
${islandListString}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
              reason: { type: Type.STRING, description: 'ユーザーの要望を踏まえ、なぜこの島をおすすめするのかの熱のこもった理由（100字程度）' },
            },
            required: ['id', 'name', 'theme', 'reason'],
          },
        },
        temperature: 0.7,
      },
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error('AI returned empty response');
    }

    const plans = JSON.parse(textResult);
    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('AI Recommendation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: error.message },
      { status: 500 }
    );
  }
}
