import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { PREFECTURE_SEO_LIST, FEATURE_SEO_LIST } from '@/data/seoTaxonomies';
import regionsData from '@/data/regions.json';
import { MapPin, Sparkles, Navigation } from 'lucide-react';

export const metadata: Metadata = {
  title: '輝旅 島専科（KIRATABI SHIMASENKA）| 日本全国481島の離島観光・行き方・制覇ガイド',
  description:
    '日本全国の有人離島・主要離島（全481島収録・制覇対象369島）の行き方・フェリー航路・日帰り可否・ATMや売店・携帯電波などの実用情報を完全網羅。GPS・写真チェックインで公式到達証明書を発行しよう。',
  alternates: {
    canonical: 'https://island.kira-tabi.com',
  },
};

const homeFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '輝旅 島専科（KIRATABI SHIMASENKA）とはどのようなサイトですか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '日本全国の離島（全481島収録・上陸制覇対象369島）の行き方・フェリー航路・日帰り可否・ATMや売店・携帯電波などの実用情報を網羅した日本最大級の離島専門ガイド＆到達記録プラットフォームです。現地GPSや写真の位置情報で公式到達証明書を無料発行できます。',
      },
    },
    {
      '@type': 'Question',
      name: '日帰りや車（橋）で行ける初心者向けの離島はどう探せますか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '「那覇・沖縄本島から日帰りで行ける離島特集」「橋・海中道路で車で行ける離島一覧」「都道府県別離島一覧」や、AIアイランドホッピング旅程作成ツールから出発地・日数に合わせて簡単に検索できます。',
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
      />
      <HomeClient />

      {/* SSR 検索エンジン＆旅行者向け 全国離島クイックインデックス（全ページへの内部リンク強化） */}
      <section className="bg-white border-t border-slate-200 py-16 px-6 lg:px-12 font-sans">
        <div className="max-w-7xl mx-auto space-y-10">
          <div>
            <h2 className="text-lg md:text-xl font-serif font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              人気のテーマ・条件から離島を探す
            </h2>
            <div className="flex flex-wrap gap-2.5">
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

          <div className="pt-8 border-t border-slate-100">
            <h2 className="text-lg md:text-xl font-serif font-bold text-slate-900 flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              都道府県別に離島一覧・行き方を探す（全29都道府県）
            </h2>
            <div className="flex flex-wrap gap-2">
              {PREFECTURE_SEO_LIST.map((p) => (
                <Link
                  key={p.slug}
                  href={`/prefecture/${p.slug}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors"
                >
                  {p.name}の離島
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h2 className="text-lg md:text-xl font-serif font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Navigation className="w-5 h-5 text-indigo-600" />
              全国45諸島エリアガイドから探す
            </h2>
            <div className="flex flex-wrap gap-2">
              {regionsData.map((r) => (
                <Link
                  key={r.id}
                  href={`/region/${r.id}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-medium text-slate-600 hover:text-indigo-700 transition-colors"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
