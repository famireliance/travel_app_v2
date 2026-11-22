'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { Compass, ArrowRight, Star } from 'lucide-react';
import { getIslandDifficulty } from '@/lib/difficulty';
import { AuthenticIslandCardImage } from '@/components/AuthenticIslandVisual';

interface NearbyIslandsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentIsland: any;
}

function parseCoords(coordsStr?: string): { lat: number; lng: number } | null {
  if (!coordsStr) return null;
  const parts = String(coordsStr).split(',').map((s) => parseFloat(s.trim()));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
}

function haversineDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)));
}

export default function NearbyIslands({ currentIsland }: NearbyIslandsProps) {
  const { nearbyList, hasCrossPrefecture, sameAreaCount } = useMemo(() => {
    if (!currentIsland) return { nearbyList: [], hasCrossPrefecture: false, sameAreaCount: 0 };

    const currentId = String(currentIsland.id);
    const currentCoords = parseCoords(currentIsland.coordinates);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const distanceFromCurrent = (isl: any): number => {
      if (!currentCoords) return Number.POSITIVE_INFINITY;
      const c = parseCoords(isl.coordinates);
      if (!c) return Number.POSITIVE_INFINITY;
      return haversineDistanceKm(currentCoords, c);
    };

    const conquestIslands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter(
      (isl) =>
        String(isl.id) !== currentId &&
        isl.is_conquest_target !== false &&
        isl.is_published !== false
    );

    // 1. Keep all same-region / same-prefecture matches first (ordered by geographic proximity)
    const sameAreaMatches = conquestIslands
      .filter(
        (isl) =>
          (currentIsland.region_id && isl.region_id === currentIsland.region_id) ||
          (currentIsland.prefecture && isl.prefecture === currentIsland.prefecture)
      )
      .sort((a, b) => distanceFromCurrent(a) - distanceFromCurrent(b));

    if (sameAreaMatches.length >= 6) {
      return {
        nearbyList: sameAreaMatches.slice(0, 6),
        hasCrossPrefecture: false,
        sameAreaCount: sameAreaMatches.length,
      };
    }

    // 2. Fill remaining slots with genuinely nearest conquest-target islands by Haversine distance
    const matchedIds = new Set(sameAreaMatches.map((m) => String(m.id)));
    const nearestOthers = conquestIslands
      .filter((isl) => !matchedIds.has(String(isl.id)))
      .sort((a, b) => distanceFromCurrent(a) - distanceFromCurrent(b))
      .slice(0, 6 - sameAreaMatches.length);

    const combined = [...sameAreaMatches, ...nearestOthers];
    return {
      nearbyList: combined,
      hasCrossPrefecture: nearestOthers.length > 0,
      sameAreaCount: sameAreaMatches.length,
    };
  }, [currentIsland]);

  if (nearbyList.length === 0) return null;

  const subtitleText = !hasCrossPrefecture
    ? '同じエリア・自治体のおすすめ島めぐりコース'
    : sameAreaCount > 0
      ? '同じエリアおよび近隣海域のおすすめ島めぐりコース'
      : '近隣海域・周辺エリアのおすすめ島めぐりコース';

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
            <p className="text-xs text-slate-400">{subtitleText}</p>
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

          return (
            <Link
              key={isl.id}
              href={`/island/${isl.slug || isl.id}`}
              className="group relative bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-800 flex flex-col justify-end min-h-[140px] p-4"
            >
              <div className="absolute inset-0 opacity-65 group-hover:opacity-80 transition-opacity duration-500">
                <AuthenticIslandCardImage island={isl} showBadgeOnPlaceholder={false} size="sm" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent"></div>

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
