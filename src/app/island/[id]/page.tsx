import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import IslandClient from './IslandClient';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { getVerifiedIslandPhotos } from '@/lib/islandPhoto';

// 60秒間キャッシュする（高トラフィック時の負荷対策）
export const revalidate = 60;

function findMasterEntry(slugOrId: string) {
  if (!slugOrId) return undefined;
  const lower = slugOrId.toLowerCase().trim();
  
  // 1. 完全一致 (slug または id)
  let found = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(isl => isl.slug === lower || isl.id === slugOrId);
  if (found) return found;

  // 2. 代表的エイリアス (chichijima -> chichijimaogasawarashoto 等)
  if (lower === 'chichijima') {
    found = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(isl => isl.id === '63' || isl.slug === 'chichijimaogasawarashoto');
    if (found) return found;
  }
  if (lower === 'hahajima') {
    found = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(isl => isl.id === '64');
    if (found) return found;
  }
  if (lower === 'aogashima') {
    found = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(isl => isl.id === '58');
    if (found) return found;
  }
  if (lower === 'ishigaki' || lower === 'ishigakijima') {
    found = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(isl => isl.id === '392');
    if (found) return found;
  }

  // 3. 前方一致・部分一致
  found = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(isl => isl.slug?.startsWith(lower) || isl.name.includes(slugOrId));
  return found;
}

async function withTimeout<T>(thenable: any, ms: number, fallback: T): Promise<T> {
  try {
    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    });
    const result = await Promise.race([
      Promise.resolve(thenable).catch(() => fallback),
      timeoutPromise
    ]);
    if (timer) clearTimeout(timer);
    return result;
  } catch {
    return fallback;
  }
}

// 動的メタデータ生成 (SEO強化)
export async function generateMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: { params: any } 
): Promise<Metadata> {
  const { id: slugOrId } = await params;
  
  // slugから内部IDを逆引き
  const masterEntry = findMasterEntry(slugOrId);
  const internalId = masterEntry ? masterEntry.id : slugOrId;
  
  // 1. まずDBから最新の実用情報（人口、アクセス等）と最新の口コミを並行してフェッチ（タイムアウト1500ms付き）
  let islandName = masterEntry?.name || '未知の島';
  let description = masterEntry?.description || '魅力あふれる日本の離島の旅路。';
  let population = '';
  let heroImageUrl = masterEntry?.hero_image_url || masterEntry?.image_url || '';
  
  const [islandResult, diariesResult] = await Promise.all([
    withTimeout(
      supabase.from('islands').select('name, description, population, hero_image_url, practical_info').eq('id', internalId).single(),
      1500,
      { data: null, error: null } as any
    ),
    withTimeout(
      supabase.from('island_diaries').select('content').eq('island_id', internalId).eq('is_hidden', false).order('created_at', { ascending: false }).limit(2),
      1500,
      { data: null, error: null } as any
    )
  ]);
  
  if (islandResult.data) {
    islandName = islandResult.data.name || islandName;
    description = islandResult.data.description || description;
    population = islandResult.data.population ? `人口: ${islandResult.data.population}` : '';
  } else if (masterEntry) {
    islandName = masterEntry.name;
    description = masterEntry.description || description;
  }

  const verifiedMeta = getVerifiedIslandPhotos({
    ...(masterEntry || {}),
    ...(islandResult.data || {}),
    id: internalId,
  });
  heroImageUrl = verifiedMeta.desktopUrl || verifiedMeta.mobileUrl || '';

  // 最新の口コミテキストをメタディスクリプションに反映
  const diarySnippet = diariesResult.data?.[0]?.content?.substring(0, 40);

  // SEOに最適化されたタイトル・説明（layout.tsxのテンプレートにより「| 輝旅 島専科（KIRATABI SHIMASENKA）」が自動付与されるため重複サフィックスを除去）
  const title = `${islandName}の観光・アクセス情報`;
  const ogTitle = `${islandName}の観光・アクセス情報 | 輝旅 島専科（KIRATABI SHIMASENKA）`;
  const canonicalUrl = `https://island.kira-tabi.com/island/${masterEntry?.slug || internalId}`;
  const ogImageUrl = heroImageUrl || '/og-image.png';
  
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
      canonical: canonicalUrl,
    },
    keywords: [islandName, masterEntry?.prefecture || '', '離島', '観光', 'アクセス', 'フェリー', '旅行', 'キラ旅', '輝旅 島専科'].filter(Boolean),
    openGraph: {
      title: ogTitle,
      description: metaDesc,
      url: canonicalUrl,
      siteName: '輝旅 島専科（KIRATABI SHIMASENKA）',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${islandName} | 輝旅 島専科` }],
      type: 'website',
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: metaDesc,
      images: [ogImageUrl],
    }
  };
}

// サーバーコンポーネント本体
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function Page({ params }: { params: any }) {
  const { id: slugOrId } = await params; 
  
  // slugから内部IDを逆引き
  const masterEntry = findMasterEntry(slugOrId);
  const internalId = masterEntry ? masterEntry.id : slugOrId;

  // サーバーサイドで最新の島ノートと宿泊施設情報を並行取得 (SSR - タイムアウト1500ms付き)
  const [diariesResult, accommodationsResult, islandResult] = await Promise.all([
    withTimeout(
      supabase
        .from('island_diaries')
        .select('*')
        .eq('island_id', internalId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(5),
      1500,
      { data: [], error: null } as any
    ),
    withTimeout(
      supabase
        .from('accommodations')
        .select('*')
        .eq('island_id', internalId),
      1500,
      { data: [], error: null } as any
    ),
    withTimeout(
      supabase
        .from('islands')
        .select('name, region_id, description, hero_image_url, practical_info')
        .eq('id', internalId)
        .single(),
      1500,
      { data: null, error: null } as any
    )
  ]);

  const mergedInitialIsland = masterEntry
    ? { ...masterEntry, ...(islandResult.data || {}), id: internalId }
    : islandResult.data;

  const islandName = islandResult.data?.name || masterEntry?.name || '未知の島';
  const islandDesc = islandResult.data?.description || masterEntry?.description || '魅力あふれる日本の離島の旅路。';
  const verifiedPhotos = getVerifiedIslandPhotos(mergedInitialIsland);
  const heroImageUrl = verifiedPhotos.desktopUrl || verifiedPhotos.mobileUrl || 'https://island.kira-tabi.com/og-image.png';
  const canonicalUrl = `https://island.kira-tabi.com/island/${masterEntry?.slug || internalId}`;

  let geoCoords: { '@type': string; latitude: number; longitude: number } | undefined;
  if (masterEntry?.coordinates) {
    const [latStr, lngStr] = String(masterEntry.coordinates).split(',').map((s: string) => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) {
      geoCoords = {
        '@type': 'GeoCoordinates',
        latitude: lat,
        longitude: lng,
      };
    }
  }

  // JSON-LD 構造化データ (BreadcrumbList + TouristDestination)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
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
            "item": canonicalUrl
          }
        ]
      },
      {
        "@type": "TouristDestination",
        "name": islandName,
        "description": islandDesc,
        "url": canonicalUrl,
        "image": heroImageUrl.startsWith('http') ? heroImageUrl : `https://island.kira-tabi.com${heroImageUrl}`,
        ...(masterEntry?.prefecture ? {
          "containedInPlace": {
            "@type": "AdministrativeArea",
            "name": masterEntry.prefecture
          }
        } : {}),
        ...(geoCoords ? { "geo": geoCoords } : {})
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
        initialIsland={mergedInitialIsland}
        initialDiaries={diariesResult.data ?? []} 
        initialAccommodations={accommodationsResult.data ?? []} 
      />
    </>
  );
}
