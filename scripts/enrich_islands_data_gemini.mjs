import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '.env.local' });

global.WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Use the API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CONCURRENCY = 3; // Reduced concurrency to avoid rate limits

async function generateRichDataWithGemini(islandName, prefecture, fallbackDesc) {
  const prompt = `
あなたは日本の離島専門の熟練トラベルライター兼データアナリストです。
指定された島「${prefecture} ${islandName}」について、以下の要件を満たす正確な情報をJSON形式で出力してください。

【厳守事項】
1. 情報の正確性: アクセス手段や人口は現実のデータに基づいて推測してください。
2. explanation (description): 島の特徴や歴史、魅力について、心を打つようなエモーショナルで美しい長文の紹介文を作成してください。「(参考: ~)」などのゴミ文字は絶対に含めないこと。
3. transparency_level (透明度 1-10): 沖縄や小笠原は高く、内海や本土近海は低めなど現実的に。
4. starry_sky_level (星空レベル 1-10): 人口が多く明るい島(例: 宮古島中心部など)は中程度、波照間島のような離島は10など現実的に。
5. seclusion_level (秘境度 1-10): 観光地化されている島(例: 宮古島、石垣島)は低〜中(3-5程度)、アクセスが困難な無人島や離島は高(8-10)にすること。
6. access (アクセス): 飛行機、高速船、フェリーなど、存在する複数の主要アクセス手段を全て列挙してください（例: 「那覇空港から飛行機で約35分 / 泊港からフェリーで約3時間」）。1つに絞らず充実させてください。

【出力フォーマット（JSON構造）】
{
  "population": "約〇〇人" (不明な場合は "無人島" または "極少数"),
  "access": "〇〇から〇〇で約〇〇分" (例: 沖縄本島から橋で約10分、羽田空港から飛行機で約55分 等、最も主要なアクセス方法),
  "description": "島の魅力的な詳細解説...",
  "practical_info": {
    "has_convenience_store": true/false (コンビニや商店があるか),
    "has_atm": true/false,
    "has_clinic": true/false,
    "day_trip_possible": true/false (本土や主要島から日帰り可能か),
    "has_sauna": true/false (サウナ施設や温泉があるか),
    "transparency_level": 1〜10の整数,
    "starry_sky_level": 1〜10の整数,
    "seclusion_level": 1〜10の整数,
    "camping_level": 1〜10の整数
  }
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            population: { type: Type.STRING },
            access: { type: Type.STRING },
            description: { type: Type.STRING },
            practical_info: {
              type: Type.OBJECT,
              properties: {
                has_convenience_store: { type: Type.BOOLEAN },
                has_atm: { type: Type.BOOLEAN },
                has_clinic: { type: Type.BOOLEAN },
                day_trip_possible: { type: Type.BOOLEAN },
                has_sauna: { type: Type.BOOLEAN },
                transparency_level: { type: Type.INTEGER },
                starry_sky_level: { type: Type.INTEGER },
                seclusion_level: { type: Type.INTEGER },
                camping_level: { type: Type.INTEGER }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error(`Gemini API Error for ${islandName}:`, error.message);
    return null;
  }
}

async function processIsland(island) {
  console.log(`[Gemini API] Generating TRUE data for ${island.name} ...`);
  const enriched = await generateRichDataWithGemini(island.name, island.prefecture, island.description);
  
  if (enriched) {
    const { error } = await supabase
      .from('islands')
      .update({
        population: enriched.population,
        access: enriched.access,
        description: enriched.description,
        practical_info: enriched.practical_info
      })
      .eq('id', island.id);
      
    if (error) {
      console.error(`❌ [${island.id}] ${island.name} - DB Update Error:`, error.message);
    } else {
      console.log(`✅ [${island.id}] ${island.name} - Success! Transp: ${enriched.practical_info?.transparency_level}, Seclusion: ${enriched.practical_info?.seclusion_level}`);
    }
  }
  // Rate limit protection sleep
  await new Promise(r => setTimeout(r, 1000));
}

async function main() {
  console.log('Fetching all islands from Supabase...');
  const { data: islands, error } = await supabase
    .from('islands')
    .select('id, name, prefecture, description')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching islands:', error);
    return;
  }
  
  console.log(`Found ${islands.length} islands. Starting REAL AI enrichment...`);
  
  // To avoid hitting 15 RPM limit for free tier or concurrent limits, we chunk
  for (let i = 0; i < islands.length; i += CONCURRENCY) {
    const chunk = islands.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(processIsland));
    console.log(`Completed batch ${Math.floor(i/CONCURRENCY) + 1}/${Math.ceil(islands.length/CONCURRENCY)}`);
  }
  
  console.log('All islands processed successfully!');
}

main().catch(console.error);
