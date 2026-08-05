import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const responseSchema = {
  type: Type.ARRAY,
  description: "島の実用データリスト",
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "リクエストされた島のIDをそのまま返す" },
      is_uninhabited: { type: Type.BOOLEAN, description: "現在無人島であるか（定住者がいないか）。不明な場合はfalse。" },
      has_atm: { type: Type.BOOLEAN, nullable: true, description: "島内にATM（郵便局・農協など含む）があるか。不明な場合はnull。" },
      has_clinic: { type: Type.BOOLEAN, nullable: true, description: "島内に診療所や病院など医療機関があるか。不明な場合はnull。" },
      has_store: { type: Type.BOOLEAN, nullable: true, description: "島内に食料品や日用品を買える商店・売店・コンビニがあるか。不明な場合はnull。" },
      signal_status: { type: Type.STRING, nullable: true, description: "携帯電話の電波状況（例：良好、集落のみ良好、一部不安定、ほぼ圏外など）。不明な場合はnull。" },
      day_trip: { type: Type.BOOLEAN, nullable: true, description: "本土や主要な拠点となる島から日帰りでの観光訪問が現実的に可能か。不明な場合はnull。" }
    },
    required: ["id", "is_uninhabited"]
  }
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runEnrichment() {
  console.log('Fetching islands from Supabase...');
  // すでに処理済みのものをスキップする場合は条件を入れる
  // 今回は has_atm が null のものを対象とする（新規追加カラムのため）
  const { data: islands, error } = await supabase
    .from('islands')
    .select('id, name, prefecture')
    .is('has_atm', null)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching islands:', error);
    process.exit(1);
  }

  console.log(`Found ${islands.length} islands to enrich.`);

  const batchSize = 15;
  for (let i = 0; i < islands.length; i += batchSize) {
    const batch = islands.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(islands.length / batchSize)}...`);

    const promptText = `
あなたは日本の離島データ専門のリサーチャーAIです。
以下の日本の島リストについて、Wikipediaや官公庁データに相当する知識を元に、実用データを返してください。
推測で誤情報を書くことは厳禁です。確実に分からない項目については必ず null を返してください。

無人島（定住者がいない島）については、is_uninhabited を true にしてください。（例：軍艦島、猿島、無人島の海水浴場など）
無人島の場合、has_atm等は通常falseまたはnullになります。

【調査対象の島リスト】
${batch.map(isl => `- ID: ${isl.id} | 名前: ${isl.name} | 都道府県: ${isl.prefecture}`).join('\n')}
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1, // 誤情報を避けるため低めに設定
        }
      });

      const aiContent = response.text;
      if (!aiContent) throw new Error("Empty response from AI");

      const enrichedData = JSON.parse(aiContent);

      for (const item of enrichedData) {
        // null が文字列として返ってきたりした場合のクレンジング
        const updatePayload = {
          is_uninhabited: Boolean(item.is_uninhabited),
          has_atm: item.has_atm === null ? null : Boolean(item.has_atm),
          has_clinic: item.has_clinic === null ? null : Boolean(item.has_clinic),
          has_store: item.has_store === null ? null : Boolean(item.has_store),
          signal_status: item.signal_status === null ? null : String(item.signal_status),
          day_trip: item.day_trip === null ? null : Boolean(item.day_trip),
        };

        const { error: updateError } = await supabase
          .from('islands')
          .update(updatePayload)
          .eq('id', item.id);

        if (updateError) {
          console.error(`Failed to update island ID ${item.id}:`, updateError);
        } else {
          console.log(`✓ Updated island: ${batch.find(b => b.id === item.id)?.name} (無人島: ${updatePayload.is_uninhabited})`);
        }
      }

      console.log('Sleeping for 2 seconds to avoid rate limits...');
      await delay(2000);

    } catch (err) {
      console.error(`Error processing batch:`, err.message);
      console.log('Sleeping for 5 seconds before continuing...');
      await delay(5000);
    }
  }

  console.log('\nEnrichment complete!');
}

runEnrichment();
