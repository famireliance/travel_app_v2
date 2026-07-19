'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, Compass } from 'lucide-react';
import MapClient from '@/components/Map/MapClient';
import SearchModal from '@/components/SearchModal';
import { useTravel } from '@/context/TravelContext';
import { getIslandDifficulty } from '@/lib/difficulty';
import { fetchAllIslands } from '@/lib/supabase';
import Breadcrumb from '@/components/Breadcrumb';

function GlobalMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { islandStatuses } = useTravel();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allIslands, setAllIslands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [manualBounds, setManualBounds] = useState<[[number, number], [number, number]] | null>(null);

  const regionParam = searchParams.get('region');
  const filterParam = searchParams.get('filter'); // currently unused but can be mapped to categories later

  useEffect(() => {
    fetchAllIslands()
      .then(islands => {
        if (!islands || islands.length === 0) {
          setError(true);
        } else {
          setAllIslands(islands);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load map data", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-400 font-serif tracking-[0.2em] text-sm gap-4">
      <Compass className="w-8 h-8 animate-spin-slow opacity-50" strokeWidth={1} />
      <span>日本全国の海図を展開中...</span>
    </div>
  );

  if (error || allIslands.length === 0) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-600 font-serif gap-4">
      <p>マップデータの読み込みに失敗しました。</p>
      <button onClick={() => router.push('/')} className="px-6 py-2 bg-blue-600 text-white rounded-xl">
        トップへ戻る
      </button>
    </div>
  );

  const visitedCount = Object.values(islandStatuses).filter(s => s === 'visited' || s === 'verified_visited').length;
  const planningCount = Object.values(islandStatuses).filter(s => s === 'planning').length;
  
  const filteredIslands = allIslands.filter(isl => {
    if (difficultyFilter && getIslandDifficulty(isl).level !== difficultyFilter) return false;
    if (regionParam && isl.region_id !== regionParam) return false;
    // (If we had category mapping, we'd apply filterParam here)
    return true;
  });

  const calculatedBounds = useMemo(() => {
    if (manualBounds) return manualBounds;
    
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    let hasValidCoords = false;
    
    filteredIslands.forEach(isl => {
      if (isl.coordinates) {
        const [latStr, lngStr] = isl.coordinates.split(',');
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (!isNaN(lat) && !isNaN(lng)) {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          hasValidCoords = true;
        }
      }
    });

    if (hasValidCoords) {
      if (minLat === maxLat && minLng === maxLng) {
        // Single point
        return [[minLat - 0.1, minLng - 0.1], [maxLat + 0.1, maxLng + 0.1]] as [[number, number], [number, number]];
      }
      const latPad = (maxLat - minLat) * 0.15 || 0.5;
      const lngPad = (maxLng - minLng) * 0.15 || 0.5;
      return [[minLat - latPad, minLng - lngPad], [maxLat + latPad, maxLng + lngPad]] as [[number, number], [number, number]];
    }
    
    return [[24, 122], [46, 146]] as [[number, number], [number, number]];
  }, [filteredIslands, manualBounds]);

  const handleSelectIsland = (islandId: string) => {
    const island = allIslands.find(i => i.id === islandId);
    if (island && island.coordinates) {
      const [latStr, lngStr] = island.coordinates.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Zoom tightly into the single island
        setManualBounds([[lat - 0.1, lng - 0.1], [lat + 0.1, lng + 0.1]]);
        setDifficultyFilter(null);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] overflow-hidden fixed inset-0 flex flex-col font-sans">
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] px-6 lg:px-12 pt-12 lg:pt-8 pb-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => router.push('/')} 
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white flex items-center justify-center text-slate-800 hover:scale-105 transition-transform pointer-events-auto"
        >
          <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
        </button>
        
        <div className="text-center flex-1 mx-4 drop-shadow-md">
          <p className="text-[0.65rem] lg:text-xs text-slate-600 font-bold tracking-[0.3em] uppercase mb-1 drop-shadow-sm">JAPAN</p>
          <h1 className="font-serif font-bold text-2xl lg:text-4xl text-slate-900 tracking-widest drop-shadow-sm">全国の離島マップ</h1>
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
            { label: '日本全国離島マップ' }
          ]} 
          className="mb-0"
        />
      </div>

      {/* Difficulty Tier Filter Bar */}
      <div className="absolute top-28 lg:top-24 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 overflow-x-auto max-w-[95vw] pointer-events-auto">
        <button 
          onClick={() => { setDifficultyFilter(null); setManualBounds(null); router.replace('/map'); }} 
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${!difficultyFilter && !regionParam ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          全島 ({allIslands.length})
        </button>
        {[1, 2, 3, 4, 5].map(lvl => (
          <button 
            key={lvl} 
            onClick={() => { setDifficultyFilter(lvl); setManualBounds(null); }} 
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${difficultyFilter === lvl ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            ★{lvl} {lvl === 5 ? 'レジェンド' : lvl === 4 ? '秘境島' : lvl === 3 ? 'アドベンチャー' : lvl === 2 ? 'スタンダード' : 'イージー'}
          </button>
        ))}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative w-full h-full z-0">
        <MapClient islands={filteredIslands} zoom={5} bounds={calculatedBounds} />
      </div>

      {/* Floating Legend & Filter Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-xl border border-slate-700 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-6 pointer-events-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-amber-300 shadow-sm" />
          👑 行った島: <strong className="text-white text-sm font-serif">{visitedCount}</strong>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block border border-blue-300 shadow-sm" />
          ⭐️ 行きたい島: <strong className="text-white text-sm font-serif">{planningCount}</strong>
        </div>
        <div className="h-4 w-px bg-slate-700 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="w-3 h-3 rounded-full bg-white inline-block border border-slate-500 shadow-sm" />
          📍 表示中 <strong className="text-white text-sm font-serif">{filteredIslands.length}</strong> 島
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectIsland={handleSelectIsland} />
    </main>
  );
}

export default function GlobalMap() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <GlobalMapContent />
    </Suspense>
  );
}
