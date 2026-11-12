import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import regionsData from '@/data/regions.json';
import Breadcrumb from '@/components/Breadcrumb';
import { Compass, Navigation, Search, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: '日本全国離島一覧ディレクトリ（全481島・制覇対象369島）',
  description:
    '日本全国の有人離島・主要離島（全481島収録・制覇対象369島）の完全ディレクトリです。全45諸島エリア・都道府県ごとに観光、アクセス、フェリー航路、宿泊施設の詳細情報を確認できます。',
  alternates: {
    canonical: 'https://island.kira-tabi.com/islands',
  },
  openGraph: {
    title: '日本全国離島一覧ディレクトリ | 輝旅 島専科',
    description: '日本全国の離島（全481島収録・制覇対象369島）をエリア別に網羅した公式ディレクトリ。',
    url: 'https://island.kira-tabi.com/islands',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '日本全国離島一覧ディレクトリ | 輝旅 島専科',
    description: '日本全国の離島（全481島収録・制覇対象369島）をエリア別に網羅した公式ディレクトリ。',
    images: ['/og-image.png'],
  },
};

export default function AllIslandsDirectory() {
  const allIslands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY);
  const publishedIslands = allIslands.filter((i) => i.is_published !== false);
  const restrictedIslands = allIslands.filter((i) => i.is_published === false);

  // Group published islands by region_id
  const groupedPublished: Record<string, typeof allIslands> = {};
  publishedIslands.forEach((island) => {
    const regionId = island.region_id || 'unknown';
    if (!groupedPublished[regionId]) {
      groupedPublished[regionId] = [];
    }
    groupedPublished[regionId].push(island);
  });

  // Group restricted/reference islands by region_id
  const groupedRestricted: Record<string, typeof allIslands> = {};
  restrictedIslands.forEach((island) => {
    const regionId = island.region_id || 'unknown';
    if (!groupedRestricted[regionId]) {
      groupedRestricted[regionId] = [];
    }
    groupedRestricted[regionId].push(island);
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 pt-16 pb-12 px-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Breadcrumb
            items={[{ label: 'ホーム', href: '/' }, { label: '日本全国離島一覧ディレクトリ' }]}
            className="mb-6 !text-slate-300"
          />
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 tracking-wider flex items-center gap-3">
            <Compass className="w-8 h-8 text-blue-400" />
            日本の全離島一覧ディレクトリ
          </h1>
          <p className="text-blue-100 font-serif leading-relaxed text-sm md:text-base max-w-2xl">
            輝旅 島専科（KIRATABI）に収録されている全国<strong>{allIslands.length}島</strong>（上陸・制覇対象<strong>{publishedIslands.length}島</strong> ／ 上陸制限・海域参照<strong>{restrictedIslands.length}島</strong>）を全45諸島エリア別にご案内します。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-xs md:text-sm font-bold shadow-lg transition"
            >
              <Search className="w-4 h-4" />
              マップ＆キーワード検索で探す
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {regionsData.map((region) => {
            const pubList = groupedPublished[region.id] || [];
            const resList = groupedRestricted[region.id] || [];
            if (pubList.length === 0 && resList.length === 0) return null;

            return (
              <section
                key={region.id}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-blue-500" />
                      {region.name}の島々
                      <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        制覇対象 {pubList.length}島
                      </span>
                    </h2>
                  </div>
                  <Link
                    href={`/region/${region.id}`}
                    className="text-sm font-bold text-blue-600 hover:underline shrink-0"
                  >
                    諸島ガイド・マップで見る →
                  </Link>
                </div>

                {pubList.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {pubList.map((island) => (
                      <li key={island.id}>
                        <Link
                          href={`/island/${island.slug || island.id}`}
                          className="flex items-center justify-between gap-2 p-3 rounded-xl hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-blue-600 transition-colors shrink-0" />
                            <span className="text-slate-800 font-bold group-hover:text-blue-700 transition-colors truncate">
                              {island.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {island.prefecture}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {resList.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                      上陸制限・特別保護・海域参照島（{resList.length}島 / 制覇カウント対象外）
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {resList.map((island) => (
                        <span
                          key={island.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs"
                        >
                          {island.name}（{island.prefecture}）
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
