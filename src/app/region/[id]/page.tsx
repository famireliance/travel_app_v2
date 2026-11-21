import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import regionsData from '@/data/regions.json';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { getIslandDifficulty } from '@/lib/difficulty';
import { getIslandInfrastructure } from '@/lib/islandInfrastructure';
import { getPrefectureByName } from '@/data/seoTaxonomies';
import RegionMapSection from './RegionMapSection';
import { Navigation, ArrowRight, HelpCircle, Compass, MapPin } from 'lucide-react';

function findRegion(rawId: string) {
  let decoded = rawId;
  try {
    decoded = decodeURIComponent(rawId);
  } catch {}
  return regionsData.find(
    (r) =>
      r.id === rawId ||
      r.id === decoded ||
      r.name === rawId ||
      r.name === decoded ||
      r.area === rawId ||
      r.area === decoded
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getIslandsForRegion(region: { id: string; name: string }): any[] {
  return Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter((i) => {
    if (i.is_conquest_target === false || i.is_published === false) return false;
    if (region.id === 'okinawa_main') return i.region_id === 'okinawa_main' || i.region_id === 'kume';
    if (region.id === 'kume') return i.region_id === 'kume' || String(i.id) === '382' || String(i.id) === '383';
    return i.region_id === region.id || i.region_id === region.name;
  });
}

export function generateStaticParams() {
  return regionsData.map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const region = findRegion(id);
  if (!region) return {};

  const islands = getIslandsForRegion(region);
  const sampleNames = islands
    .slice(0, 4)
    .map((i) => i.name)
    .join('・');
  const title = `${region.name}の離島一覧（全${islands.length}島）｜行き方・フェリー・日帰り観光マップ`;
  const description = `${region.area}エリア「${region.name}」に属する全${islands.length}島（${sampleNames}など）の位置関係マップと行き方・所要時間・日帰り可否・ATMや電波などの島内設備を比較できる完全ガイド。`;
  const canonicalUrl = `https://island.kira-tabi.com/region/${region.id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    keywords: [
      region.name,
      `${region.name} 島 一覧`,
      `${region.name} 行き方`,
      `${region.name} フェリー`,
      `${region.name} 日帰り`,
      `${region.area} 離島`,
      '輝旅 島専科',
    ],
    openGraph: {
      title: `${title} | 輝旅 島専科`,
      description,
      url: canonicalUrl,
      siteName: '輝旅 島専科（KIRATABI SHIMASENKA）',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | 輝旅 島専科`,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const region = findRegion(id);
  if (!region) notFound();

  const islands = getIslandsForRegion(region);
  const canonicalUrl = `https://island.kira-tabi.com/region/${region.id}`;
  const sampleNames = islands
    .slice(0, 5)
    .map((i) => i.name)
    .join('・');

  const dayTripCount = islands.filter((i) => getIslandInfrastructure(i).day_trip).length;
  const sameAreaRegions = regionsData.filter((r) => r.area === region.area && r.id !== region.id);
  const mainPref = getPrefectureByName(islands[0]?.prefecture);

  const faqItems = [
    {
      q: `${region.name}にはどのくらいの離島がありますか？`,
      a: `輝旅 島専科では、${region.name}（${region.area}エリア）の上陸・制覇対象離島として全${islands.length}島（${sampleNames}など）を収録しています。ページ上部の地図ピンおよび下部の比較一覧表から各島の詳細を確認できます。`,
    },
    {
      q: `${region.name}で日帰り観光できる島はありますか？`,
      a:
        dayTripCount > 0
          ? `はい、${region.name}には連絡橋・海中道路または短時間の定期船により日帰り訪問が可能な島が約${dayTripCount}島あります。天候や最終便時刻にご注意のうえ計画してください。`
          : `${region.name}の島々は船便の本数や航海時間の関係上、島内での宿泊を伴うゆとりある旅程が推奨されます。各島ページの航路・宿情報をご確認ください。`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://island.kira-tabi.com/' },
          { '@type': 'ListItem', position: 2, name: '日本全国離島一覧', item: 'https://island.kira-tabi.com/islands' },
          { '@type': 'ListItem', position: 3, name: region.name, item: canonicalUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${region.name}の離島一覧（全${islands.length}島）`,
        description: `${region.area}エリア「${region.name}」の離島マップ・アクセス・設備比較ガイド。`,
        url: canonicalUrl,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: islands.length,
          itemListElement: islands.map((isl, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: isl.name,
            url: `https://island.kira-tabi.com/island/${isl.slug || isl.id}`,
          })),
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 上部インタラクティブ諸島マップ */}
      <RegionMapSection region={region} initialIslands={islands} />

      {/* 下部：検索エンジン＆ユーザー向け可視ガイド・比較一覧表 */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-2">
                <MapPin className="w-3.5 h-3.5" />
                {region.area}エリア
                {mainPref && (
                  <>
                    <span>・</span>
                    <Link href={`/prefecture/${mainPref.slug}`} className="underline hover:text-blue-800">
                      {mainPref.name}の離島一覧を見る
                    </Link>
                  </>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
                {region.name}の離島一覧・行き方＆設備比較（全{islands.length}島）
              </h1>
            </div>
            <Link
              href="/islands"
              className="text-xs md:text-sm font-bold text-slate-600 hover:text-blue-600 shrink-0"
            >
              ← 全国481島ディレクトリへ
            </Link>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            {region.name}に属する上陸対象{islands.length}島（{sampleNames}ほか）のアクセス方法・日帰り訪問の目安・冒険難易度を一覧で比較できます。島名をタップすると、フェリー時刻の目安・宿・島内ATMや売店・携帯電波・口コミ「島ノート」を確認できます。
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                  <th className="py-3 px-3 font-bold">島名</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">都道府県</th>
                  <th className="py-3 px-3 font-bold">アクセス・特徴</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">訪問目安</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">難易度</th>
                  <th className="py-3 px-3 font-bold text-right whitespace-nowrap">ガイド</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {islands.map((isl) => {
                  const diff = getIslandDifficulty(isl);
                  const infra = getIslandInfrastructure(isl);
                  return (
                    <tr key={isl.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-3 font-bold whitespace-nowrap">
                        <Link
                          href={`/island/${isl.slug || isl.id}`}
                          className="text-blue-700 hover:underline font-serif text-sm md:text-base"
                        >
                          {isl.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">{isl.prefecture}</td>
                      <td className="py-3.5 px-3 text-slate-600 max-w-sm">
                        <p className="line-clamp-2">{isl.access || isl.description}</p>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            infra.day_trip
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {infra.day_trip_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-xs font-bold text-slate-700">
                        {diff.stars}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <Link
                          href={`/island/${isl.slug || isl.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                        >
                          詳細 <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h2 className="text-lg md:text-xl font-serif font-bold text-slate-900 flex items-center gap-2 mb-5">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            {region.name}のよくある質問
          </h2>
          <div className="space-y-4">
            {faqItems.map((f, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">Q. {f.q}</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">A. {f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 周辺諸島リンク */}
        {sameAreaRegions.length > 0 && (
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Compass className="w-5 h-5 text-blue-600" />
              {region.area}エリアの他の諸島を見る
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {sameAreaRegions.map((r) => (
                <Link
                  key={r.id}
                  href={`/region/${r.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-500" />
                  {r.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
