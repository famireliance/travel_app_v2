import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import IslandClient from './IslandClient';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

// 60秒間キャッシュする（高トラフィック時の負荷対策）
export const revalidate = 60;

// 動的メタデータ生成 (SEO強化)
export async function generateMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: { params: any } 
): Promise<Metadata> {
  const { id: slugOrId } = await params;
  
  // slugから内部IDを逆引き
  let internalId = slugOrId;
  const masterEntry = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(isl => isl.slug === slugOrId || isl.id === slugOrId);
  if (masterEntry) {
    internalId = masterEntry.id;
  }
  
  // 1. まずDBから最新の実用情報（人口、アクセス等）と最新の口コミを並行してフェッチ
  let islandName = '未知の島';
  let description = '魅力あふれる日本の離島の旅路。';
  let population = '';
  
  const [islandResult, diariesResult] = await Promise.all([
    supabase.from('islands').select('name, description, population').eq('id', internalId).single(),
    supabase.from('island_diaries').select('content').eq('island_id', internalId).eq('is_hidden', false).order('created_at', { ascending: false }).limit(2)
  ]);
  
  if (islandResult.data) {
    islandName = islandResult.data.name;
    description = islandResult.data.description || description;
    population = islandResult.data.population ? `人口: ${islandResult.data.population}` : '';
  } else if (masterEntry) {
    islandName = masterEntry.name;
    description = masterEntry.description || description;
  }

  // 最新の口コミテキストをメタディスクリプションに反映
  const diarySnippet = diariesResult.data?.[0]?.content?.substring(0, 40);

  // SEOに最適化されたタイトル・説明
  const title = `${islandName}の観光・アクセス情報 | キラ旅`;
  
  // descriptionsを適度に切り詰める (最大120字程度)
  let metaDesc = `${islandName}${population ? `（${population}）` : ''}。${description.replace(/\\n/g, '').substring(0, 100)}。`;
  if (diarySnippet) {
    metaDesc += `「${diarySnippet.replace(/\\n/g, '')}...」などの口コミも届いています。`;
  } else {
    metaDesc += `アクセス方法や見どころを紹介。キラ旅でGPSチェックインして離島制覇を目指そう！`;
  }

  return {
    title,
    description: metaDesc,
    alternates: {
      canonical: `https://island.kira-tabi.com/island/${masterEntry?.slug || internalId}`,
    },
    keywords: [islandName, '離島', '観光', 'アクセス', '旅行', 'キラ旅'],
    openGraph: {
      title,
      description: metaDesc,
      url: `https://island.kira-tabi.com/island/${masterEntry?.slug || internalId}`,
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
  const { id: slugOrId } = await params; 
  
  // slugから内部IDを逆引き
  let internalId = slugOrId;
  const masterEntry = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(isl => isl.slug === slugOrId || isl.id === slugOrId);
  if (masterEntry) {
    internalId = masterEntry.id;
  }

  // サーバーサイドで最新の島ノートと宿泊施設情報を並行取得 (SSR)
  const [diariesResult, accommodationsResult, islandResult] = await Promise.all([
    supabase
      .from('island_diaries')
      .select('*')
      .eq('island_id', internalId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('accommodations')
      .select('*')
      .eq('island_id', internalId),
    supabase
      .from('islands')
      .select('name, region_id')
      .eq('id', internalId)
      .single()
  ]);

  const islandName = islandResult.data?.name || masterEntry?.name || '未知の島';
  const regionId = islandResult.data?.region_id || masterEntry?.region_id || '';

  // JSON-LD 構造化データ (BreadcrumbList)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "ホーム",
        "item": "https://island.kira-tabi.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "日本全国離島一覧",
        "item": "https://island.kira-tabi.com/islands"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": islandName,
        "item": `https://island.kira-tabi.com/island/${masterEntry?.slug || internalId}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <IslandClient 
        islandId={internalId} 
        initialDiaries={diariesResult.data ?? []} 
        initialAccommodations={accommodationsResult.data ?? []} 
      />
    </>
  );
}
