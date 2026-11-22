import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  PREFECTURE_SEO_LIST,
  FEATURE_SEO_LIST,
  getPrefectureBySlug,
  getConquestIslandsForPrefecture,
} from '@/data/seoTaxonomies';
import regionsData from '@/data/regions.json';
import { getIslandDifficulty } from '@/lib/difficulty';
import { getIslandInfrastructure } from '@/lib/islandInfrastructure';
import { getRakutenTravelSearchUrl, getJalanSearchUrl, getRakutenRentacarSearchUrl } from '@/data/islandFacilitiesData';
import Breadcrumb from '@/components/Breadcrumb';
import { Compass, MapPin, Ship, ArrowRight, HelpCircle, Navigation } from 'lucide-react';

export function generateStaticParams() {
  return PREFECTURE_SEO_LIST.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pref = getPrefectureBySlug(slug);
  if (!pref) return {};

  const islands = getConquestIslandsForPrefecture(pref.name);
  const title = `${pref.name}の離島一覧（全${islands.length}島）｜行き方・日帰りフェリー・観光比較ガイド`;
  const description = `${pref.name}に属する上陸可能な離島（全${islands.length}島）の完全ディレクトリ。${pref.hubAccess}からのアクセス方法・所要時間・日帰り可否・ATMや売店などの島内設備を徹底比較！`;
  const canonicalUrl = `https://island.kira-tabi.com/prefecture/${pref.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    keywords: [
      `${pref.name} 離島`,
      `${pref.shortName} 離島 一覧`,
      `${pref.shortName} 離島 日帰り`,
      `${pref.shortName} フェリー 島`,
      `${pref.name} 島旅`,
      '離島 観光',
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

export default async function PrefectureIslandsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pref = getPrefectureBySlug(slug);
  if (!pref) notFound();

  const islands = getConquestIslandsForPrefecture(pref.name);
  const canonicalUrl = `https://island.kira-tabi.com/prefecture/${pref.slug}`;

  // Group islands by region_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byRegion: Record<string, any[]> = {};
  for (const isl of islands) {
    const rid = isl.region_id || 'other';
    if (!byRegion[rid]) byRegion[rid] = [];
    byRegion[rid].push(isl);
  }

  const bridgeIslands = islands.filter((i) =>
    /橋|海中道路|直結/.test(String(i.access || '') + String(i.description || ''))
  );
  const sampleNames = islands
    .slice(0, 5)
    .map((i) => i.name)
    .join('・');

  const faqItems = [
    {
      q: `${pref.name}には観光・上陸できる離島がいくつありますか？`,
      a: `輝旅 島専科の検証済みディレクトリでは、${pref.name}の上陸・制覇対象離島として全${islands.length}島（${sampleNames}など）を収録しています。各島のフェリー航路・所要時間・島内インフラを比較できます。`,
    },
    {
      q: `${pref.name}の離島へ行く主な拠点港・空港はどこですか？`,
      a: `主な玄関口は「${pref.hubAccess}」です。島によって高速船・フェリー・連絡橋などアクセス手段が異なるため、各島ページの時刻表・航路案内をご確認ください。`,
    },
    {
      q: `${pref.name}で車（橋）や日帰りで気軽に渡れる離島はありますか？`,
      a:
        bridgeIslands.length > 0
          ? `${pref.name}には橋や海中道路で渡れる島（${bridgeIslands.slice(0, 5).map((i) => i.name).join('・')}など計${bridgeIslands.length}島）があるほか、短時間の定期船で日帰り訪問できる島も多数あります。`
          : `${pref.name}の離島は定期船・高速船でアクセスでき、港から片道1時間以内で日帰り観光できる島もあります。下表の「訪問目安・アクセス」欄をご参照ください。`,
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
          { '@type': 'ListItem', position: 3, name: `${pref.name}の離島一覧`, item: canonicalUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${pref.name}の離島一覧（全${islands.length}島）`,
        description: pref.leadText,
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

      <header className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 pt-16 pb-14 px-6 text-white">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb
            items={[
              { label: '日本全国離島一覧', href: '/islands' },
              { label: `${pref.name}の離島一覧` },
            ]}
            isDark={true}
            className="mb-6"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold mb-3">
            <MapPin className="w-3.5 h-3.5" />
            {pref.area}エリア ・ 上陸制覇対象 全{islands.length}島
          </div>
          <h1 className="text-2xl md:text-4xl font-serif font-bold tracking-wide leading-snug mb-4">
            {pref.name}の離島一覧・行き方＆観光比較ガイド（全{islands.length}島）
          </h1>
          <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-3xl mb-6">
            {pref.leadText}
          </p>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 text-xs md:text-sm text-blue-100 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-bold text-amber-300 shrink-0 flex items-center gap-1.5">
              <Ship className="w-4 h-4" /> 主な出発港・空港:
            </span>
            <span>{pref.hubAccess}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">
        {/* 諸島エリア別セクション */}
        {Object.entries(byRegion).map(([regionId, regionIslands]) => {
          const regionMeta = regionsData.find((r) => r.id === regionId);
          const regionTitle = regionMeta?.name || `${pref.name}沿岸の島々`;

          return (
            <section
              key={regionId}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    {regionTitle}（{regionIslands.length}島）
                  </h2>
                </div>
                {regionMeta && (
                  <Link
                    href={`/region/${regionMeta.id}`}
                    className="inline-flex items-center gap-1 text-xs md:text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    {regionTitle}のエリアマップ・詳細へ <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                      <th className="py-3 px-3 font-bold">島名</th>
                      <th className="py-3 px-3 font-bold">主なアクセス・行き方</th>
                      <th className="py-3 px-3 font-bold whitespace-nowrap">訪問目安</th>
                      <th className="py-3 px-3 font-bold whitespace-nowrap">到達難易度</th>
                      <th className="py-3 px-3 font-bold text-right whitespace-nowrap">詳細ガイド</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {regionIslands.map((isl) => {
                      const diff = getIslandDifficulty(isl);
                      const infra = getIslandInfrastructure(isl);
                      return (
                        <tr key={isl.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                            <Link
                              href={`/island/${isl.slug || isl.id}`}
                              className="text-blue-700 hover:underline font-serif text-sm md:text-base"
                            >
                              {isl.name}
                            </Link>
                          </td>
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
                            {diff.stars} <span className="text-slate-400 font-normal">({diff.shortLabel})</span>
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
          );
        })}

        {/* 宿泊・レンタカー予約比較CTA（アフィリエイト導線） */}
        <section className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-6 md:p-8 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 className="text-lg md:text-xl font-serif font-bold">
              {pref.name}の離島ホテル・民宿・レンタカーを予約比較
            </h2>
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-white/15 text-slate-200">
              PR・プロモーションを含みます
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-5">
            ハイシーズンや連休は離島の宿・レンタカーが早期に満室となります。各予約サイトの空室・料金を一括比較できます。
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={getRakutenTravelSearchUrl(islands[0]?.name || '離島', pref.name)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs md:text-sm font-bold transition-colors shadow-sm"
            >
              楽天トラベルで{pref.name}の宿を探す
            </a>
            <a
              href={getJalanSearchUrl(islands[0]?.name || '離島', pref.name)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs md:text-sm font-bold transition-colors shadow-sm"
            >
              じゃらんで{pref.name}の宿を探す
            </a>
            <a
              href={getRakutenRentacarSearchUrl(islands[0]?.name || '離島', pref.name)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs md:text-sm font-bold transition-colors"
            >
              離島・出発港のレンタカーを探す
            </a>
          </div>
        </section>

        {/* よくある質問 (FAQ) */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            {pref.name}の離島旅行に関するよくある質問（FAQ）
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm md:text-base mb-2">Q. {item.q}</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">A. {item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* テーマ別特集 ＆ 他都道府県への内部リンクハブ */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-8">
          <div>
            <h2 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Compass className="w-5 h-5 text-amber-500" />
              目的・テーマ別で日本の離島を探す
            </h2>
            <div className="flex flex-wrap gap-2">
              {FEATURE_SEO_LIST.map((f) => (
                <Link
                  key={f.slug}
                  href={`/feature/${f.slug}`}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors"
                >
                  {f.shortLabel}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">
              他の都道府県から離島を探す
            </h2>
            <div className="flex flex-wrap gap-2">
              {PREFECTURE_SEO_LIST.map((p) => (
                <Link
                  key={p.slug}
                  href={`/prefecture/${p.slug}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    p.slug === pref.slug
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
