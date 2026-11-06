import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAuthUser } from '@/lib/adminAuth';
import { generateGeminiContentWithFallback } from '@/lib/geminiHelper';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }

  try {
    const { islandName, keyword, themeHint } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEYが設定されていません' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `あなたは離島訪問プラットフォーム「KIRATABI」のご当地妖精（ローカルスピリット）のキャラクターデザイナーです。
対象の島「${islandName || '離島'}」（キーワード: ${keyword || '特になし'}、テーマ: ${themeHint || 'おすすめの特産物や風土'}）の魅力を表現するご当地妖精のデータをJSON形式で出力してください。

以下のJSONフォーマット厳守で出力してください（他の文章やMarkdownブロック解説は不要です）:
{
  "name": "妖精の可愛い名前（例: ハイビス・ルナ、黒牛のポッケ）",
  "theme": "テーマ（例: ガジュマルの樹木精霊、絶品石垣牛の守り神）",
  "description": "魅力的な100文字程度の伝承説話・説明文",
  "rarity": "NORMAL, RARE, EPIC, SPOT_EXCLUSIVE のいずれか",
  "attribute": "WATER, NATURE, FIRE, LIGHT, EARTH, WIND, ICE のいずれか",
  "icon": "代表する絵文字1文字（例: 🌺, 🐮, 🌊）",
  "color_from": "from-emerald-400 などのTailwindグラデーションクラス",
  "color_to": "to-teal-600 などのTailwindグラデーションクラス",
  "shadow_color": "shadow-emerald-500/50 などのシャドークラス",
  "sparkle_color": "text-emerald-200 などのテキストカラー"
}`;

    const response = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
    });

    let rawText = response.text || '{}';
    // JSONの抽出
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const fairyData = JSON.parse(rawText);

    return NextResponse.json({ success: true, fairy: fairyData });
  } catch (err: any) {
    console.error('Generate Fairy AI Error:', err);
    return NextResponse.json({ error: err.message || 'AI生成に失敗しました' }, { status: 500 });
  }
}
