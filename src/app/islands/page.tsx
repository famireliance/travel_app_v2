import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import regionsData from '@/data/regions.json';
import Breadcrumb from '@/components/Breadcrumb';
import { Compass, Navigation } from 'lucide-react';

export const metadata: Metadata = {
  title: '日本全国離島一覧ディレクトリ | キラ旅',
  description: '日本全国の全離島一覧です。エリアや地方ごとに島を探すことができます。KIRATABI（輝旅 島専科）の島ディレクトリ。',
  alternates: {
    canonical: 'https://island.kira-tabi.com/islands',
  }
};

export default function AllIslandsDirectory() {
  const islands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY);
  const totalIslands = islands.length;

  // Group islands by region_id
  const groupedIslands: Record<string, typeof islands> = {};
  islands.forEach(island => {
    const regionId = island.region_id || 'unknown';
    if (!groupedIslands[regionId]) {
      groupedIslands[regionId] = [];
    }
    groupedIslands[regionId].push(island);
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 pt-16 pb-12 px-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Breadcrumb 
            items={[
              { label: 'ホーム', href: '/' },
              { label: '日本全国離島一覧ディレクトリ' }
            ]}
            className="mb-6 !text-slate-300"
          />
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 tracking-wider flex items-center gap-3">
            <Compass className="w-8 h-8 text-blue-400" />
            日本の全離島一覧
          </h1>
          <p className="text-blue-100 font-serif leading-relaxed text-sm md:text-base max-w-2xl">
            KIRATABIに登録されている全{totalIslands}島をエリア別にご案内します。観光、アクセス、フェリー情報、宿泊施設など、各島の詳細情報を確認できます。
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {regionsData.map((region) => {
            const islandsInRegion = groupedIslands[region.id] || [];
            if (islandsInRegion.length === 0) return null;

            return (
              <section key={region.id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-blue-500" />
                    {region.name}の島々
                  </h2>
                  <Link href={`/region/${region.id}`} className="text-sm font-bold text-blue-600 hover:underline">
                    マップで見る →
                  </Link>
                </div>
                
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {islandsInRegion.map(island => (
                    <li key={island.id}>
                      <Link 
                        href={`/island/${island.id}`}
                        className="flex items-center gap-2 p-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors group"
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-400 transition-colors" />
                        <span className="text-slate-700 font-medium group-hover:text-blue-700 transition-colors">
                          {island.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
