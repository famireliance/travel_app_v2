import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  FEATURE_SEO_LIST,
  PREFECTURE_SEO_LIST,
  getFeatureBySlug,
  getConquestIslandsForFeature,
} from '@/data/seoTaxonomies';
import { getIslandDifficulty } from '@/lib/difficulty';
import { getIslandInfrastructure } from '@/lib/islandInfrastructure';
import { getRakutenTravelSearchUrl, getJalanSearchUrl } from '@/data/islandFacilitiesData';
import Breadcrumb from '@/components/Breadcrumb';
import { AuthenticIslandCardImage } from '@/components/AuthenticIslandVisual';
import { Sparkles, ArrowRight, Compass, MapPin } from 'lucide-react';

export function generateStaticParams() {
  return FEATURE_SEO_LIST.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) return {};

  const canonicalUrl = `https://island.kira-tabi.com/feature/${feature.slug}`;

  return {
    title: feature.title,
    description: feature.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${feature.title} | 輝旅 島専科`,
      description: feature.description,
      url: canonicalUrl,
      siteName: '輝旅 島専科（KIRATABI SHIMASENKA）',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${feature.title} | 輝旅 島専科`,
      description: feature.description,
      images: ['/og-image.png'],
    },
  };
}

export default async function FeatureIslandsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) notFound();

  const islands = getConquestIslandsForFeature(feature);
  const canonicalUrl = `https://island.kira-tabi.com/feature/${feature.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://island.kira-tabi.com/' },
          { '@type': 'ListItem', position: 2, name: '日本全国離島一覧', item: 'https://island.kira-tabi.com/islands' },
          { '@type': 'ListItem', position: 3, name: feature.shortLabel, item: canonicalUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: feature.title,
        description: feature.description,
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
    ],
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 pt-16 pb-14 px-6 text-white">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb
            items={[
              { label: '日本全国離島一覧', href: '/islands' },
              { label: feature.shortLabel },
            ]}
            isDark={true}
            className="mb-6"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            厳選テーマ特集 ・ 該当 {islands.length}島
          </div>
          <h1 className="text-2xl md:text-4xl font-serif font-bold leading-snug mb-4">
            {feature.title}
          </h1>
          <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-3xl">
            {feature.leadText}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* カード一覧 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {islands.map((isl) => {
            const diff = getIslandDifficulty(isl);
            const infra = getIslandInfrastructure(isl);
            return (
              <Link
                key={isl.id}
                href={`/island/${isl.slug || isl.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col"
              >
                <div className="h-40 bg-slate-900 relative overflow-hidden">
                  <AuthenticIslandCardImage island={isl} />
                  <span className="absolute top-3 left-3 z-20 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[11px] font-bold">
                    {isl.prefecture}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h2 className="font-serif font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                        {isl.name}
                      </h2>
                      <span className="text-xs font-bold text-amber-600 shrink-0">{diff.stars}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                      {isl.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{infra.day_trip_status}</span>
                    <span className="font-bold text-blue-600 flex items-center gap-1">
                      行き方・詳細 <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {/* テーマ対象の宿・ツアー予約比較CTA */}
        <section className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 className="text-lg md:text-xl font-serif font-bold">
              「{feature.shortLabel}」で人気の離島宿・ホテルを探す
            </h2>
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-white/15 text-slate-200">
              PR・プロモーションを含みます
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-5">
            気になる島の空室状況や宿泊プランを主要予約サイトで比較できます。
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={getRakutenTravelSearchUrl(islands[0]?.name || '沖縄 離島', islands[0]?.prefecture)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs md:text-sm font-bold transition-colors shadow-sm"
            >
              楽天トラベルで人気の離島宿を見る
            </a>
            <a
              href={getJalanSearchUrl(islands[0]?.name || '沖縄 離島', islands[0]?.prefecture)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs md:text-sm font-bold transition-colors shadow-sm"
            >
              じゃらんで人気の離島宿を比較する
            </a>
            <Link
              href="/packing-list"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs md:text-sm font-bold transition-colors"
            >
              離島旅の必須持ち物リストを見る
            </Link>
          </div>
        </section>

        {/* 他のテーマ特集＆都道府県リンク */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-8">
          <div>
            <h2 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Compass className="w-5 h-5 text-amber-500" />
              他のテーマから日本の離島を探す
            </h2>
            <div className="flex flex-wrap gap-2">
              {FEATURE_SEO_LIST.map((f) => (
                <Link
                  key={f.slug}
                  href={`/feature/${f.slug}`}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    f.slug === feature.slug
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                  }`}
                >
                  {f.shortLabel}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h2 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              都道府県から離島を探す
            </h2>
            <div className="flex flex-wrap gap-2">
              {PREFECTURE_SEO_LIST.map((p) => (
                <Link
                  key={p.slug}
                  href={`/prefecture/${p.slug}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
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
