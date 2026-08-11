import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { islandName, keywords, vibe } = await request.json();

    if (!islandName) {
      return NextResponse.json({ error: '島名が必要です' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEYが設定されていません' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `あなたは「${islandName}」の魅力を伝える公式旅行アンバサダーです。
以下のキーワードと雰囲気を参考にして、島の魅力が伝わる「島ノート（旅行記）」の本文を作成してください。

【対象の島】 ${islandName}
【キーワード】 ${keywords || '特になし（自由に魅力を語ってください）'}
【希望する雰囲気】 ${vibe || 'ワクワクする楽しい雰囲気'}

【条件】
- 文字数は300字〜500字程度
- 読者が「行ってみたい！」と思うようなリアルで魅力的なトーン
- 見出しなどは使わず、そのまま投稿できるプレーンなテキストで出力すること
- 絵文字を適度に使用すること`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const generatedText = response.text;

    return NextResponse.json({ text: generatedText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || '生成に失敗しました' }, { status: 500 });
  }
}
