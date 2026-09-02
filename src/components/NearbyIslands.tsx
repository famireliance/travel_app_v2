'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { Compass, ArrowRight, Star } from 'lucide-react';
import { getIslandDifficulty } from '@/lib/difficulty';

interface NearbyIslandsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentIsland: any;
}

export default function NearbyIslands({ currentIsland }: NearbyIslandsProps) {
  const nearbyList = useMemo(() => {
    if (!currentIsland) return [];

    const allIslands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY);
    
    // Find islands in the same region or prefecture
    const matches = allIslands.filter(
      (isl) =>
        isl.id !== currentIsland.id &&
        (isl.region_id === currentIsland.region_id || isl.prefecture === currentIsland.prefecture)
    );

    // If matches are few, fallback to any island
    if (matches.length < 3) {
      const remaining = allIslands.filter((isl) => isl.id !== currentIsland.id);
      return remaining.slice(0, 6);
    }

    return matches.slice(0, 6);
  }, [currentIsland]);

  if (nearbyList.length === 0) return null;

  return (
    <div className="mb-12 bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-slate-800 text-base">
              {currentIsland.name} の周辺の島々
            </h3>
            <p className="text-xs text-slate-400">同じエリア・自治体のおすすめ島めぐりコース</p>
          </div>
        </div>
        <Link
          href="/map"
          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          全体マップへ <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {nearbyList.map((isl) => {
          const diffInfo = getIslandDifficulty(isl);
          const bgImg = isl.hero_image_url || `/region/${isl.region_id}.jpg`;

          return (
            <Link
              key={isl.id}
              href={`/island/${isl.slug || isl.id}`}
              className="group relative bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-800 flex flex-col justify-end min-h-[140px] p-4"
            >
              <img
                src={bgImg}
                alt={isl.name}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-75 transition-all duration-500"
                onError={(e) => {
                  e.currentTarget.src = '/region/subtropical.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

              <div className="relative z-10 space-y-1">
                <span className="text-[0.65rem] font-bold text-cyan-300 tracking-widest block">
                  {isl.prefecture || isl.region_id}
                </span>
                <h4 className="font-serif font-bold text-white text-sm group-hover:text-cyan-200 transition-colors">
                  {isl.name}
                </h4>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[0.65rem] font-bold text-slate-300">
                    ★{diffInfo.level} {diffInfo.label}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
