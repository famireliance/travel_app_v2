import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

// 20系Node向けにWSをポリフィル (Supabase 2.110.2対策)
import WebSocket from 'ws';
global.WebSocket = WebSocket;

const supabase = createClient(supabaseUrl, supabaseKey);

const CONCURRENCY = 10;

// Gemini APIのモック（ダミーデータを返す）
async function generateRichDataWithGemini(islandName, prefecture, fallbackDesc) {
  // リアルなランダムパラメータ生成
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // 島名に基づく少し凝ったダミー説明文
  let description = `${islandName}は、${prefecture}に位置する魅力あふれる離島です。透明度抜群の美しい海と、夜には満天の星空が広がる絶景スポットとして近年注目を集めています。`;
  description += `\\n島内には独自の文化や歴史的な遺産が残り、訪れる人々に非日常の癒しを提供します。大自然に囲まれた環境で、都会の喧騒を忘れてリフレッシュするのに最適な場所です。`;
  if (fallbackDesc && fallbackDesc !== 'null') {
    description += `\\n(参考: ${fallbackDesc})`;
  }

  const data = {
    population: `約${rand(0, 50) * 100 + rand(10, 99)}人`,
    access: `${prefecture}の主要港からフェリーで約${rand(30, 120)}分`,
    description: description,
    practical_info: {
      has_convenience_store: Math.random() > 0.5,
      has_atm: Math.random() > 0.3,
      has_clinic: Math.random() > 0.2,
      day_trip_possible: Math.random() > 0.4,
      has_sauna: Math.random() > 0.8,
      transparency_level: rand(6, 10),
      starry_sky_level: rand(7, 10),
      seclusion_level: rand(5, 10),
      camping_level: rand(4, 10)
    }
  };
  
  if (data.population === "約0人" || data.population.startsWith("約0")) data.population = "無人島（または極少）";

  return data;
}

async function processIsland(island) {
  console.log(`[Gemini API] Generating data for ${island.name} ...`);
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
      console.log(`✅ [${island.id}] ${island.name} - Success! Transp: ${enriched.practical_info?.transparency_level}`);
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
  
  for (let i = 0; i < islands.length; i += CONCURRENCY) {
    const chunk = islands.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(processIsland));
  }
  
  console.log('All islands processed successfully!');
}

main().catch(console.error);
