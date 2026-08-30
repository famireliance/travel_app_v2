import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';
import { ISLAND_FACILITIES_DICTIONARY } from '../src/data/islandFacilitiesData';

// WebSocket Polyfill for Node 20
globalThis.WebSocket = WebSocket as any;

// 環境変数の読み込み
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabaseの環境変数が設定されていません');
  process.exit(1);
}

// Supabaseクライアントの初期化 (WebSocketエラー回避のため fetch を強制指定)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: { fetch: fetch }
});

const isDryRun = !process.argv.includes('--execute');

async function main() {
  console.log(`🚀 宿泊施設データ移行スクリプト開始 (Dry Run: ${isDryRun ? 'ON' : 'OFF'})`);
  
  // 1. 既存の islands をすべて取得
  const { data: dbIslands, error: islandsError } = await supabase.from('islands').select('id, name');
  if (islandsError) {
    console.error('❌ islands テーブルの取得に失敗:', islandsError);
    return;
  }

  const islandMapById = new Map(dbIslands.map(i => [i.id, i]));
  const islandMapByName = new Map(dbIslands.map(i => [i.name, i]));
  
  const errors = [];
  const successInserts = [];

  for (const [key, facilityData] of Object.entries(ISLAND_FACILITIES_DICTIONARY)) {
    const targetIslandId = facilityData.islandId;
    const targetIslandName = facilityData.islandName;
    
    // DBに登録されているかチェック
    let matchedIsland = islandMapById.get(targetIslandId);
    
    if (!matchedIsland) {
      // IDで一致しない場合、名前で一致確認
      matchedIsland = islandMapByName.get(targetIslandName);
    }
    
    if (!matchedIsland) {
      errors.push(`❌ [未登録エラー] 島名: ${targetIslandName}, 期待ID: ${targetIslandId} -> DBに存在しません！`);
      continue;
    }
    
    if (matchedIsland.name !== targetIslandName) {
      errors.push(`⚠️ [名称不一致エラー] DBのID:${matchedIsland.id} は '${matchedIsland.name}' ですが、データは '${targetIslandName}' です。`);
      continue;
    }
    
    console.log(`✅ [マッチ成功] ${targetIslandName} (ID: ${matchedIsland.id}) -> 宿: ${facilityData.accommodations.length}件`);
    
    // 宿データの準備
    for (const acc of facilityData.accommodations) {
      const insertData = {
        island_id: matchedIsland.id,
        name: acc.name,
        phone_number: acc.phone || '不明',
        plan_tier: acc.planTier,
        is_verified: true, // 今回投入するものはすべてモックデータ（確認済み想定）
        address: acc.address || null,
        website_url: acc.officialWebsite || null,
        description: acc.features || null,
        price_range: acc.priceRange || null,
        has_pickup: acc.features?.includes('送迎') || false,
        photo_urls: acc.imageUrl ? [acc.imageUrl] : [],
      };
      
      successInserts.push(insertData);
    }
  }
  
  console.log('\n--- 実行レポート ---');
  if (errors.length > 0) {
    console.error('🚨 以下の島データにエラー/未登録がありました。');
    errors.forEach(e => console.error(e));
  } else {
    console.log('🎉 全ての島データがデータベースと完璧にマッチしました！');
  }
  
  console.log(`\n準備完了: ${successInserts.length} 件の宿泊施設データがINSERT可能です。`);
  
  if (!isDryRun) {
    if (errors.length > 0) {
      console.log('⚠️ エラーがあるため、INSERTを中止します。エラーを解消してから再実行してください。');
      return;
    }
    
    console.log('🔄 データベースへ INSERT 中...');
    const { error: insertError } = await supabase.from('accommodations').insert(successInserts);
    if (insertError) {
      console.error('❌ INSERT エラー:', insertError);
    } else {
      console.log('🎉 INSERT 完了！');
    }
  } else {
    console.log('\n※ 今回はドライランのため、データベースは更新されていません。');
    console.log('本実行する場合は --execute オプションを付けてください。');
  }
}

main().catch(console.error);
