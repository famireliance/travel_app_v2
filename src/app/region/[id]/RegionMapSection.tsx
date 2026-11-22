'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Compass, ExternalLink, Hotel } from 'lucide-react';
import Link from 'next/link';
import { getRakutenTravelSearchUrl } from '@/data/islandFacilitiesData';
import MapClient from '@/components/Map/MapClient';
import SearchModal from '@/components/SearchModal';
import { fetchAllIslands } from '@/lib/supabase';
import Breadcrumb from '@/components/Breadcrumb';

interface IslandData {
  id: string;
  name: string;
  region_id?: string;
  coordinates?: string;
  prefecture?: string;
  slug?: string;
}

interface RegionMapSectionProps {
  region: {
    id: string;
    name: string;
    enName?: string;
    area?: string;
  };
  initialIslands: IslandData[];
}

export default function RegionMapSection({ region, initialIslands }: RegionMapSectionProps) {
  const router = useRouter();
  const [regionIslands, setRegionIslands] = useState<IslandData[]>(initialIslands);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setRegionIslands(initialIslands);
    fetchAllIslands()
      .then((islands) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered = (islands || []).filter((i: any) => {
          if (region.id === 'okinawa_main') return i.region_id === 'okinawa_main' || i.region_id === 'kume';
          if (region.id === 'kume') return i.region_id === 'kume' || String(i.id) === '382' || String(i.id) === '383';
          return (
            i.region_id === region.id ||
            i.region_id === region.name ||
            i.prefecture?.includes(region.name)
          );
        });
        if (filtered.length > 0) {
          setRegionIslands(filtered as unknown as IslandData[]);
        }
      })
      .catch(() => {});
  }, [region, initialIslands]);

  let bounds: [[number, number], [number, number]] | undefined;
  if (regionIslands.length > 0) {
    const validCoords = regionIslands
      .filter((i) => i.coordinates)
      .map((i) => {
        const [lat, lng] = i.coordinates!.split(',').map(parseFloat);
        return { lat, lng };
      })
      .filter((c) => !isNaN(c.lat) && !isNaN(c.lng));

    if (validCoords.length > 0) {
      const lats = validCoords.map((c) => c.lat);
      const lngs = validCoords.map((c) => c.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const padLat = Math.max(0.18, (maxLat - minLat) * 0.28);
      const padLng = Math.max(0.18, (maxLng - minLng) * 0.28);
      bounds = [
        [minLat - padLat, minLng - padLng],
        [maxLat + padLat, maxLng + padLng],
      ];
    }
  }

  return (
    <div className="relative w-full h-[62vh] min-h-[460px] max-h-[680px] border-b border-slate-200 overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 sm:px-6 lg:px-12 pt-3 sm:pt-4 pb-2 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
              router.back();
            } else {
              router.push('/islands');
            }
          }}
          className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 flex items-center justify-center text-slate-800 hover:scale-105 transition-transform pointer-events-auto"
          title="前のページに戻る"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.6} />
        </button>

        <div className="text-center flex-1 mx-3 sm:mx-4 bg-white/85 backdrop-blur-md px-4 sm:px-5 py-1.5 sm:py-2 rounded-2xl shadow-sm border border-white/80 max-w-md">
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.25em] uppercase">
            {region.enName}
          </p>
          <p className="font-serif font-bold text-base sm:text-lg lg:text-2xl text-slate-900 tracking-wider">
            {region.name} エリアマップ
          </p>
        </div>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 flex items-center justify-center text-slate-800 hover:scale-105 transition-transform pointer-events-auto"
          title="島を検索"
        >
          <Search className="w-5 h-5" strokeWidth={1.6} />
        </button>
      </div>

      {/* Breadcrumb Overlay */}
      <div className="absolute bottom-5 left-5 z-[1000] pointer-events-auto hidden sm:block">
        <Breadcrumb
          items={[
            { label: '日本全国離島一覧', href: '/islands' },
            { label: region.name },
          ]}
          className="mb-0"
        />
      </div>

      {/* Interactive Map */}
      <div className="w-full h-full relative z-0">
        <MapClient
          islands={regionIslands}
          bounds={bounds}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onIslandSelect={(isl: any) => {
            if (typeof isl === 'string') {
              const matched = regionIslands.find((i) => String(i.id) === isl);
              router.push(`/island/${matched?.slug || isl}`);
            } else if (isl) {
              router.push(`/island/${isl.slug || isl.id}`);
            }
          }}
        />

        {regionIslands.length === 0 && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/30 pointer-events-none">
            <div className="bg-white/95 rounded-2xl shadow-xl p-6 max-w-md text-center pointer-events-auto border border-slate-200 space-y-3">
              <Compass className="w-10 h-10 text-blue-500 mx-auto opacity-80" />
              <h3 className="font-serif font-bold text-slate-800 text-base">{region.name}の島データを準備中</h3>
              <Link
                href="/map"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow hover:bg-blue-700 transition"
              >
                全国離島マップへ戻る
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Rakuten Travel Floating CTA */}
      <div className="absolute bottom-5 right-5 z-[1000] pointer-events-auto max-w-xs">
        <a
          href={getRakutenTravelSearchUrl(region.name)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80 transition-transform hover:scale-102 group"
        >
          <Hotel className="w-4 h-4 text-[#BF0000] shrink-0" />
          <span className="text-xs font-bold text-slate-800 font-serif">
            {region.name}周辺の宿を探す
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#BF0000] shrink-0" />
        </a>
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectIsland={(islandId: string) => {
          setIsSearchOpen(false);
          router.push(`/island/${islandId}`);
        }}
      />
    </div>
  );
}
