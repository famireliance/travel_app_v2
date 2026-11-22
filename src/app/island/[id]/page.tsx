import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import IslandClient from './IslandClient';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { getVerifiedIslandPhotos } from '@/lib/islandPhoto';
import { getIslandInfrastructure } from '@/lib/islandInfrastructure';
import { getPrefectureByName, FEATURE_SEO_LIST } from '@/data/seoTaxonomies';
import regionsData from '@/data/regions.json';

// 1時間ISRキャッシュ（高速TTFB・Core Web Vitals最適化）
export const revalidate = 3600;
export const dynamicParams = true;

// 主要人気50島をビルド時SSG事前生成（残りの全島も初回リクエスト時に即時生成＆エッジキャッシュ）
export function generateStaticParams() {
  const seen = new Set<string>();
  return Object.values(ALL_ISLANDS_MASTER_DICTIONARY)
    .filter((isl) => isl.is_conquest_target !== false && isl.is_published !== false)
    .slice(0, 60)
    .map((isl) => String(isl.slug || isl.id))
    .filter((slug) => {
      if (!slug || seen.has(slug)) return false;
      seen.add(slug);
      return true;
    })
    .map((id) => ({ id }));
}

function findMasterEntry(slugOrId: string) {
  if (!slugOrId) return undefined;
  let decoded = slugOrId;
  try {
    decoded = decodeURIComponent(slugOrId);
  } catch {
    decoded = slugOrId;
  }
  const trimmed = decoded.trim();
  const lower = trimmed.toLowerCase();
  const allEntries = Object.values(ALL_ISLANDS_MASTER_DICTIONARY);

  // 1. 完全一致 (id, slug, または正確な島名)
  let found = allEntries.find(
    (isl) => isl.id === slugOrId || isl.id === trimmed || isl.slug === lower || isl.name === trimmed
  );
  if (found) return found;

  // 2. 代表的エイリアス (chichijima -> chichijimaogasawarashoto 等)
  if (lower === 'chichijima') {
    found = allEntries.find((isl) => isl.id === '63' || isl.slug === 'chichijimaogasawarashoto');
    if (found) return found;
  }
  if (lower === 'hahajima') {
    found = allEntries.find((isl) => isl.id === '64');
    if (found) return found;
  }
  if (lower === 'aogashima') {
    found = allEntries.find((isl) => isl.id === '58');
    if (found) return found;
  }
  if (lower === 'ishigaki' || lower === 'ishigakijima') {
    found = allEntries.find((isl) => isl.id === '392');
    if (found) return found;
  }
  if (lower === 'sado' || lower === 'sadojima' || lower === 'sadogashima') {
    found = allEntries.find((isl) => isl.id === '76');
    if (found) return found;
  }

  // 3. 安全な前方一致フォールバック（4文字以上のslugのみ許可し、1文字等の過剰一致を防止）
  if (lower.length >= 4) {
    found = allEntries.find((isl) => isl.slug?.startsWith(lower));
    if (found) return found;
  }

  // 日本語島名の括弧なし一致（2文字以上）
  if (trimmed.length >= 2 && /[^\x00-\x7F]/.test(trimmed)) {
    found = allEntries.find((isl) => isl.name?.split('（')[0]?.split('(')[0] === trimmed);
    if (found) return found;
  }

  return undefined;
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
      supabase.from('islands').select('name, description, population, hero_image_url, practical_info, is_published').eq('id', internalId).single(),
      1500,
      { data: null, error: null } as any
    ),
    withTimeout(
      supabase.from('island_diaries').select('content').eq('island_id', internalId).eq('is_hidden', false).order('created_at', { ascending: false }).limit(2),
      1500,
      { data: null, error: null } as any
    )
  ]);
  
  if ((!masterEntry && !islandResult.data) || islandResult.data?.is_published === false || masterEntry?.is_published === false) {
    return {
      title: '島が見つかりません',
      robots: { index: false, follow: false },
    };
  }

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
  const diarySnippet = diariesResult.data?.[0]?.content?.substring(0, 36);

  const mergedForMeta = {
    ...(masterEntry || {}),
    ...(islandResult.data || {}),
    id: internalId,
  };
  const infraMeta = getIslandInfrastructure(mergedForMeta);
  const prefText = masterEntry?.prefecture || '';
  const isBridge = /橋|海中道路|直結/.test(String(mergedForMeta.access || '') + String(description || ''));
  const accessKeyword = isBridge ? '橋ドライブ・行き方' : 'フェリー行き方・アクセス';
  const stayKeyword = infraMeta.day_trip ? '日帰り観光' : '宿泊・観光';

  // ロングテール検索クエリ（「島名 行き方」「島名 日帰り」「島名 何がある/設備」）に最適化されたタイトル
  const title = `${islandName}${prefText ? `（${prefText}）` : ''}の${accessKeyword}・${stayKeyword}＆島内設備ガイド`;
  const ogTitle = `${title} | 輝旅 島専科（KIRATABI SHIMASENKA）`;
  const canonicalUrl = `https://island.kira-tabi.com/island/${masterEntry?.slug || internalId}`;
  const ogImageUrl = heroImageUrl || '/og-image.png';

  let metaDesc = `${prefText ? `${prefText}・` : ''}${islandName}${population ? `（${population}）` : ''}への行き方・アクセス（${(mergedForMeta.access || '定期船・連絡橋').substring(0, 36)}）と${infraMeta.day_trip_status}の目安、ATM・売店・携帯電波などの実用情報を徹底解説。${description.replace(/\n/g, '').substring(0, 65)}`;
  if (diarySnippet) {
    metaDesc += ` 旅人の口コミ「${diarySnippet.replace(/\n/g, '')}...」も掲載中。`;
  }

  const regionMeta = regionsData.find((r) => r.id === masterEntry?.region_id);

  return {
    title,
    description: metaDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      islandName,
      `${islandName} 行き方`,
      `${islandName} アクセス`,
      `${islandName} 日帰り`,
      `${islandName} フェリー`,
      `${islandName} 観光`,
      prefText,
      regionMeta?.name || '',
      '離島',
      '輝旅 島専科',
    ].filter(Boolean),
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
        .select('id, island_id, name, phone_number, plan_tier, is_verified, address, website_url, description, price_range, has_pickup, photo_urls, booking_mode, photo_exterior, photo_room, photo_food, photo_facility, deposit_policy')
        .eq('island_id', internalId)
        .eq('is_verified', true),
      1500,
      { data: [], error: null } as any
    ),
    withTimeout(
      supabase
        .from('islands')
        .select('name, region_id, description, hero_image_url, practical_info, is_published')
        .eq('id', internalId)
        .single(),
      1500,
      { data: null, error: null } as any
    )
  ]);

  const dbRow = islandResult.data;
  if ((!masterEntry && !dbRow) || dbRow?.is_published === false || masterEntry?.is_published === false) {
    notFound();
  }

  const mergedInitialIsland = masterEntry
    ? {
        ...masterEntry,
        ...(islandResult.data || {}),
        id: internalId,
        hero_image_url: islandResult.data?.hero_image_url || masterEntry.hero_image_url || '',
        practical_info: {
          ...(masterEntry.practical_info || {}),
          ...(islandResult.data?.practical_info && typeof islandResult.data.practical_info === 'object'
            ? islandResult.data.practical_info
            : {}),
        },
      }
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

  const infra = getIslandInfrastructure(mergedInitialIsland || { name: islandName });
  const prefEntry = getPrefectureByName(masterEntry?.prefecture);
  const regionEntry = regionsData.find((r) => r.id === (mergedInitialIsland?.region_id || masterEntry?.region_id));
  const accessSummary = mergedInitialIsland?.access || masterEntry?.access || '最寄り港より定期船・フェリーまたは連絡橋にてアクセス可能';

  const islandFaqs = [
    {
      q: `${islandName}への行き方・アクセス方法は？`,
      a: `${islandName}（${masterEntry?.prefecture || '日本'}）への主なアクセスは「${accessSummary}」です。${islandDesc}`,
    },
    {
      q: `${islandName}は日帰り観光できますか？それとも宿泊が必要ですか？`,
      a: `訪問スタイル目安は「${infra.day_trip_status}」です。${infra.day_trip_desc}`,
    },
    {
      q: `${islandName}にコンビニ・売店やATM・医療機関はありますか？`,
      a: `商店・売店は「${infra.store_status}」（${infra.store_desc}）、ATM・金融機関は「${infra.atm_status}」（${infra.atm_desc}）、診療所・医療機関は「${infra.clinic_status}」（${infra.clinic_desc}）となっています。${infra.cash_advice_text}`,
    },
    {
      q: `${islandName}の携帯電波やネット通信環境はどうですか？`,
      a: `携帯電波状況の目安は「${infra.signal_status}」です。${infra.signal_desc}`,
    },
  ];

  const breadcrumbElements = [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://island.kira-tabi.com/' },
    { '@type': 'ListItem', position: 2, name: '日本全国離島一覧', item: 'https://island.kira-tabi.com/islands' },
    ...(prefEntry
      ? [{ '@type': 'ListItem', position: 3, name: `${prefEntry.name}の離島一覧`, item: `https://island.kira-tabi.com/prefecture/${prefEntry.slug}` }]
      : []),
    ...(regionEntry
      ? [{ '@type': 'ListItem', position: prefEntry ? 4 : 3, name: regionEntry.name, item: `https://island.kira-tabi.com/region/${regionEntry.id}` }]
      : []),
    {
      '@type': 'ListItem',
      position: (prefEntry ? 1 : 0) + (regionEntry ? 1 : 0) + 3,
      name: islandName,
      item: canonicalUrl,
    },
  ];

  // JSON-LD 構造化データ (BreadcrumbList + TouristDestination + FAQPage)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbElements
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
      },
      {
        "@type": "FAQPage",
        "mainEntity": islandFaqs.map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.a
          }
        }))
      }
    ]
  };

  const safePublicAccommodations = (accommodationsResult.data ?? []).filter((acc: any) => {
    if (!acc || acc.is_verified !== true) return false;
    const accName = String(acc.name || '');
    if (accName.includes('（架空') || accName.includes('架空') || accName.includes('テスト用')) {
      return false;
    }
    return true;
  });

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
        initialAccommodations={safePublicAccommodations} 
      />

      {/* SSR FAQ & 関連エリア回遊セクション（Google構造化データガイドライン準拠の可視FAQ＋内部リンク強化） */}
      <section className="bg-[#F8FAFC] border-t border-slate-200 py-12 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
            <h2 className="text-lg md:text-xl font-serif font-bold text-slate-900 mb-5">
              {islandName}の行き方・日帰り観光・島内設備に関するよくある質問（FAQ）
            </h2>
            <div className="space-y-4">
              {islandFaqs.map((f, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5">Q. {f.q}</h3>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">A. {f.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">
              {islandName}に関連する諸島・都道府県・テーマから探す
            </h2>
            <div className="flex flex-wrap gap-2">
              {prefEntry && (
                <Link
                  href={`/prefecture/${prefEntry.slug}`}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition-colors"
                >
                  {prefEntry.name}の離島一覧を見る
                </Link>
              )}
              {regionEntry && (
                <Link
                  href={`/region/${regionEntry.id}`}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold transition-colors"
                >
                  {regionEntry.name}の島々・地図を見る
                </Link>
              )}
              <Link
                href="/islands"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                全国529島ディレクトリ
              </Link>
              {FEATURE_SEO_LIST.slice(0, 5).map((feat) => (
                <Link
                  key={feat.slug}
                  href={`/feature/${feat.slug}`}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors"
                >
                  {feat.shortLabel}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
