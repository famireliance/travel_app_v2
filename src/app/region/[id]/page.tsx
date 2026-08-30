'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Compass, ExternalLink, Hotel } from 'lucide-react';
import regionsData from '../../../data/regions.json';
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
}

export default function RegionMap() {
  const params = useParams();
  const router = useRouter();
  const rawRegionId = (params?.id as string) || '';
  let decodedRegionId = rawRegionId;
  try { decodedRegionId = decodeURIComponent(rawRegionId); } catch {}

  const region = regionsData.find(r => 
    r.id === rawRegionId || 
    r.id === decodedRegionId || 
    r.name === rawRegionId || 
    r.name === decodedRegionId ||
    r.area === rawRegionId ||
    r.area === decodedRegionId
  );

  const [regionIslands, setRegionIslands] = useState<IslandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (!region) {
      setLoading(false);
      return;
    }
    fetchAllIslands()
      .then(islands => {
        const filtered = (islands || []).filter((i: any) => 
          i.region_id === region.id || 
          i.region_id === region.name || 
          i.prefecture?.includes(region.name)
        );
        setRegionIslands(filtered as unknown as IslandData[]);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load map data", err);
        setLoading(false);
      });
  }, [rawRegionId, region]);

  // Compute bounding box based on islands
  let bounds: [[number, number], [number, number]] | undefined;
  if (regionIslands.length > 0) {
    const validCoords = regionIslands
      .filter(i => i.coordinates)
      .map(i => {
        const [lat, lng] = i.coordinates!.split(',').map(parseFloat);
        return { lat, lng };
      })
      .filter(c => !isNaN(c.lat) && !isNaN(c.lng));

    if (validCoords.length > 0) {
      const lats = validCoords.map(c => c.lat);
      const lngs = validCoords.map(c => c.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const padLat = Math.max(0.2, (maxLat - minLat) * 0.3);
      const padLng = Math.max(0.2, (maxLng - minLng) * 0.3);
      bounds = [[minLat - padLat, minLng - padLng], [maxLat + padLat, maxLng + padLng]];
    }
  }

  if (!region) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-600 font-serif gap-4"><p>指定されたエリアは見つかりませんでした。</p><button onClick={() => router.push('/')} className="px-6 py-2 bg-blue-600 text-white rounded-xl">トップへ戻る</button></div>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-400 font-serif tracking-[0.2em] text-sm gap-4">
      <Compass className="w-8 h-8 animate-spin-slow opacity-50" strokeWidth={1} />
      <span>地図を展開中...</span>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] overflow-hidden fixed inset-0 flex flex-col font-sans">
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] px-6 lg:px-12 pt-12 lg:pt-8 pb-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => {
            if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
              router.back();
            } else {
              router.push('/map');
            }
          }} 
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white flex items-center justify-center text-slate-800 hover:scale-105 transition-transform pointer-events-auto"
          title="前のページに戻る"
        >
          <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
        </button>
        
        <div className="text-center flex-1 mx-4 drop-shadow-md">
          <p className="text-[0.65rem] lg:text-xs text-slate-600 font-bold tracking-[0.3em] uppercase mb-1 drop-shadow-sm">{region.enName}</p>
          <h1 className="font-serif font-bold text-2xl lg:text-4xl text-slate-900 tracking-widest drop-shadow-sm">{region.name}</h1>
        </div>
        
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white flex items-center justify-center text-slate-800 hover:scale-105 transition-transform pointer-events-auto"
        >
          <Search className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
        </button>
      </header>

      {/* Breadcrumb Overlay */}
      <div className="absolute top-28 lg:top-24 left-6 lg:left-12 z-[1000] pointer-events-auto">
        <Breadcrumb 
          items={[
            { label: '日本全国離島マップ', href: '/map' },
            { label: region.name }
          ]} 
          className="mb-0"
        />
      </div>

      {/* Map Area */}
      <div className="flex-1 relative w-full h-full z-0">
        <MapClient islands={regionIslands} bounds={bounds} />
      </div>

      {/* Affiliate Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 lg:bottom-12 lg:left-12 lg:translate-x-0 z-[1000] pointer-events-auto w-[90%] max-w-sm">
        <a 
          href={getRakutenTravelSearchUrl(region.name)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex flex-col gap-1.5 px-4 py-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 transition-transform hover:scale-102 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.6rem] font-bold text-[#BF0000] uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full">Rakuten Travel</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#BF0000] transition-colors" />
          </div>
          <p className="text-sm font-bold text-slate-800 flex items-center gap-2 font-serif">
            <Hotel className="w-4 h-4 text-[#BF0000]" />
            {region.name}周辺の宿・ホテルを探す
          </p>
        </a>
      </div>

      {/* SEO & Accessibility Island Links */}
      <div className="absolute top-auto bottom-0 left-0 right-0 z-0 h-0 overflow-hidden opacity-0 pointer-events-none">
        <nav aria-label={`${region.name}の島一覧`}>
          <ul>
            {regionIslands.map((island) => (
              <li key={island.id}>
                <Link href={`/island/${island.slug || island.id}`}>{island.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSelectIsland={(islandId: string) => {
          setIsSearchOpen(false);
          router.push(`/island/${islandId}`);
        }}
      />
    </main>
  );
}
