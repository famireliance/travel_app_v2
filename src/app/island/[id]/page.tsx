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

  // SEOに最適化されたタイトル・説明
  const title = `${islandName}の観光・アクセス情報 | キラ旅`;
  
  // descriptionsを適度に切り詰める (最大120字程度)
  const metaDesc = `${islandName}${population ? `（${population}）` : ''}。${description.replace(/\\n/g, '').substring(0, 100)}。アクセス方法や見どころを紹介。キラ旅でGPSチェックインして離島制覇を目指そう！`;

  return {
    title,
    description: metaDesc,
    alternates: {
      canonical: `https://island.kira-tabi.com/island/${id}`,
    },
    keywords: [islandName, '離島', '観光', 'アクセス', '旅行', 'キラ旅'],
    openGraph: {
      title,
      description: metaDesc,
      url: `https://island.kira-tabi.com/island/${id}`,
      siteName: 'キラ旅',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${islandName} | キラ旅` }],
      type: 'website',
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDesc,
      images: ['/og-image.png'],
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
