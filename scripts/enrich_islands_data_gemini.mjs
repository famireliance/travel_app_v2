import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}
if (!geminiKey) {
  console.error('Error: Missing GEMINI_API_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CONCURRENCY = 3; // レート制限を考慮

async function generateRichDataWithGemini(islandName, prefecture, fallbackDesc) {
  const prompt = `あなたは日本全国の離島情報を網羅するプロの旅行ライターであり、地域情報のスペシャリストです。
競合サイト（島ログなど）を凌駕する、圧倒的に質が高く、旅行者を惹きつける魅力的なデータを作成してください。
以下の島について、必ずJSON形式で情報を出力してください。

【対象の島】
島名: ${islandName}
都道府県: ${prefecture}
参考情報: ${fallbackDesc}

【出力JSONフォーマット】
{
  "population": "島の人口（例: 約1,200人、無人島の場合は '無人島' など。できるだけ最新の概算を出力）",
  "access": "本土や主要な拠点からのアクセス手段と所要時間（例: 那覇空港から飛行機で約35分、泊港から高速船で約50分。一般的な行き方を記載）",
  "description": "島の魅力、見どころ、特産品、歴史などを300文字以上の長文で、旅行者が「絶対に行きたい！」と思うようなリッチで臨場感のある文章で作成してください。改行（\\n）を入れてください。",
  "practical_info": {
    "has_convenience_store": true/false (コンビニや商店があるか),
    "has_atm": true/false (郵便局や農協などのATMがあるか),
    "has_clinic": true/false (診療所や病院があるか),
    "day_trip_possible": true/false (本島や主要な港から日帰り観光が可能か),
    "has_sauna": true/false (サウナや温泉施設があるか),
    "transparency_level": 1〜10の整数 (海の透明度の高さ),
    "starry_sky_level": 1〜10の整数 (星空の綺麗さ、光害の少なさ),
    "seclusion_level": 1〜10の整数 (秘境度、アクセスの困難さ),
    "camping_level": 1〜10の整数 (キャンプ等のアウトドア適性)
  }
}

※必ず Valid な JSON のみを出力してください。Markdownのバッククォート（\`\`\`json 等）を含めずに、直接 { から始まるJSONを出力してください。`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    let content = data.candidates[0].content.parts[0].text;
    content = content.replace(/^```json/g, '').replace(/```$/g, '').trim();
    
    return JSON.parse(content);
  } catch (err) {
    console.error(`Gemini generation failed for ${islandName}:`, err.message);
    return null;
  }
}

async function processIsland(island) {
  console.log(`Processing [${island.id}] ${island.name} (${island.prefecture}) ...`);
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
      console.error(`[${island.id}] ${island.name} - DB Update Error:`, error.message);
    } else {
      console.log(`✅ [${island.id}] ${island.name} - Success! Pop: ${enriched.population}, Transp: ${enriched.practical_info?.transparency_level}`);
    }
  }
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
  
  console.log(`Found ${islands.length} islands. Starting enrichment with Gemini...`);
  
  for (let i = 0; i < islands.length; i += CONCURRENCY) {
    const chunk = islands.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(processIsland));
    // APIレート制限回避のためのスリープ (2秒)
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('All islands processed successfully!');
}

main().catch(console.error);
