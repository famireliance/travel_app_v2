import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import fs from 'fs';

// .env.local を読み込む
dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}
if (!openAiKey) {
  console.error('Error: Missing OPENAI_API_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openAiKey });

// 並列実行数
const CONCURRENCY = 5;

// AIでリッチデータを生成する関数
async function generateRichData(islandName, prefecture, fallbackDesc) {
  const prompt = `あなたは日本全国の離島情報を網羅するプロの旅行ライターであり、地域情報のスペシャリストです。
競合サイト（島ログなど）を凌駕する、圧倒的に質が高く、旅行者を惹きつける魅力的なデータを作成してください。
以下の島について、JSON形式で情報を出力してください。

【対象の島】
島名: ${islandName}
都道府県: ${prefecture}
参考情報（現在）: ${fallbackDesc}

【出力JSONフォーマット】
{
  "population": "島の人口（例: 約1,200人、無人島の場合は '無人島' など。できるだけ最新の概算を出力）",
  "access": "本土や主要な拠点からのアクセス手段と所要時間（例: 那覇空港から飛行機で約35分、泊港から高速船で約50分。フェリーの場合はその旨も記載。不明な場合は一般的な行き方を記載）",
  "description": "島の魅力、見どころ、特産品、歴史などを300文字以上の長文で、旅行者が「絶対に行きたい！」と思うようなリッチで臨場感のある文章で作成してください。改行（\\n）を適宜入れて読みやすくしてください。"
}

※必ずValidなJSONのみを出力してください。Markdownのバッククォートなどは含めないでください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // または gpt-4o-mini
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result;
  } catch (err) {
    console.error(`AI generation failed for ${islandName}:`, err.message);
    return null;
  }
}

async function processIsland(island) {
  console.log(`Processing [${island.id}] ${island.name} (${island.prefecture}) ...`);
  const enriched = await generateRichData(island.name, island.prefecture, island.description);
  
  if (enriched) {
    // DB更新
    const { error } = await supabase
      .from('islands')
      .update({
        population: enriched.population,
        access: enriched.access,
        description: enriched.description
      })
      .eq('id', island.id);
      
    if (error) {
      console.error(`[${island.id}] ${island.name} - DB Update Error:`, error.message);
    } else {
      console.log(`✅ [${island.id}] ${island.name} - Success! Pop: ${enriched.population}`);
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
  
  console.log(`Found ${islands.length} islands. Starting enrichment...`);
  
  // 並列処理 (Chunking)
  for (let i = 0; i < islands.length; i += CONCURRENCY) {
    const chunk = islands.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(processIsland));
    
    // APIレート制限回避のためのスリープ (1秒)
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('All islands processed successfully!');
}

main().catch(console.error);
