import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import IslandClient from './IslandClient';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

// 動的メタデータ生成 (SEO強化)
export async function generateMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: { params: any } // Next.js 15+ resolves params asynchronously, but typing as any for compatibility if needed. Actually in 15 it's Promise<{id: string}>.
): Promise<Metadata> {
  const { id } = await params;
  
  // 1. まずDBから最新の実用情報（人口、アクセス等）を含めてフェッチ
  let islandName = '未知の島';
  let description = '魅力あふれる日本の離島の旅路。';
  let population = '';
  
  const { data } = await supabase.from('islands').select('name, description, population').eq('id', id).single();
  
  if (data) {
    islandName = data.name;
    description = data.description || description;
    population = data.population ? `人口: ${data.population}` : '';
  } else {
    // フォールバック: DBにない場合はマスター辞書を参照
    const master = ALL_ISLANDS_MASTER_DICTIONARY[id];
    if (master) {
      islandName = master.name;
      description = master.description || description;
    }
  }

  // クエリ意図に合わせたSEO最強タイトル
  const title = `${islandName}の観光・アクセス・人口情報｜島ログ対抗版 KIRATABI`;
  
  // descriptionsを適度に切り詰める (最大120字程度)
  const metaDesc = `${islandName}（${population}）。${description.replace(/\\n/g, '').substring(0, 100)}... 島の透明度やアクセス手段、サウナ等の実用情報を徹底解説！`;

  return {
    title,
    description: metaDesc,
    openGraph: {
      title,
      description: metaDesc,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDesc,
    }
  };
}

// サーバーコンポーネント本体
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function Page({ params }: { params: any }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = await params; 
  return <IslandClient />;
}
