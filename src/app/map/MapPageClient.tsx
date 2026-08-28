'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, Compass, Bot, ArrowRightLeft } from 'lucide-react';
import MapClient from '@/components/Map/MapClient';
import SearchModal from '@/components/SearchModal';
import AiConcierge from '@/components/AiConcierge';
import IslandCompareModal from '@/components/IslandCompareModal';
import { useTravel } from '@/context/TravelContext';
import { getIslandDifficulty } from '@/lib/difficulty';
import { fetchAllIslands } from '@/lib/supabase';
import Breadcrumb from '@/components/Breadcrumb';
import type { MapStyle } from '@/components/Map/InteractiveMap';
import { X, Layers, Map as MapIcon, Image as ImageIcon, CheckCircle, Navigation } from 'lucide-react';
import Image from 'next/image';

const ARCHIPELAGOS = [
  { name: '八重山', bounds: [[24.0, 123.5], [24.6, 124.5]] as [[number, number], [number, number]] },
  { name: '宮古', bounds: [[24.6, 125.0], [25.0, 125.5]] as [[number, number], [number, number]] },
  { name: '沖縄本島', bounds: [[25.8, 127.0], [27.0, 128.5]] as [[number, number], [number, number]] },
  { name: '奄美群島', bounds: [[27.0, 128.0], [28.5, 130.2]] as [[number, number], [number, number]] },
  { name: 'トカラ列島', bounds: [[29.0, 129.0], [30.1, 130.2]] as [[number, number], [number, number]] },
  { name: '大隅諸島', bounds: [[30.0, 130.0], [30.9, 131.2]] as [[number, number], [number, number]] },
  { name: '五島列島', bounds: [[32.5, 128.5], [33.5, 129.5]] as [[number, number], [number, number]] },
  { name: '対馬・壱岐', bounds: [[33.7, 129.5], [34.7, 129.6]] as [[number, number], [number, number]] },
  { name: '天草諸島', bounds: [[32.1, 129.9], [32.6, 130.6]] as [[number, number], [number, number]] },
  { name: '瀬戸内', bounds: [[33.8, 131.0], [34.8, 135.0]] as [[number, number], [number, number]] },
  { name: '隠岐諸島', bounds: [[35.9, 132.9], [36.4, 133.4]] as [[number, number], [number, number]] },
  { name: '佐渡・粟島', bounds: [[37.7, 138.1], [38.6, 139.3]] as [[number, number], [number, number]] },
  { name: '伊豆諸島', bounds: [[32.4, 139.0], [34.8, 140.0]] as [[number, number], [number, number]] },
  { name: '小笠原諸島', bounds: [[26.5, 142.0], [27.2, 142.3]] as [[number, number], [number, number]] },
  { name: '大東諸島', bounds: [[25.7, 131.1], [26.0, 131.4]] as [[number, number], [number, number]] },
  { name: '三陸・東北', bounds: [[38.0, 140.5], [39.5, 142.2]] as [[number, number], [number, number]] },
  { name: '北海道離島', bounds: [[42.0, 139.0], [45.6, 141.5]] as [[number, number], [number, number]] },
];
function GlobalMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { islandStatuses } = useTravel();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allIslands, setAllIslands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<number | 'conquest_only' | null>('conquest_only');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [manualBounds, setManualBounds] = useState<[[number, number], [number, number]] | null>(null);
  
  const [mapStyle, setMapStyle] = useState<MapStyle>('voyager');
  const [selectedIslandId, setSelectedIslandId] = useState<string | null>(null);

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

  const visitedCount = Object.values(islandStatuses).filter(s => s === 'visited' || s === 'verified_visited').length;
  const planningCount = Object.values(islandStatuses).filter(s => s === 'planning').length;
  
  const filteredIslands = allIslands.filter(isl => {
    const level = getIslandDifficulty(isl).level;
    if (difficultyFilter === 'conquest_only' && level === 0) return false;
    if (typeof difficultyFilter === 'number' && level !== difficultyFilter) return false;
    if (regionParam && isl.region_id !== regionParam) return false;
    if (filterParam) {
      const lowerFilter = filterParam.toLowerCase();
      const matchTag = isl.tags && isl.tags.some((t: string) => t.toLowerCase().includes(lowerFilter));
      const matchCat = isl.category && isl.category.toLowerCase().includes(lowerFilter);
      const matchName = isl.name && isl.name.toLowerCase().includes(lowerFilter);
      const matchDesc = isl.description && isl.description.toLowerCase().includes(lowerFilter);
      if (!matchTag && !matchCat && !matchName && !matchDesc) return false;
    }
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
        return [[minLat - 0.1, minLng - 0.1], [maxLat + 0.1, maxLng + 0.1]] as [[number, number], [number, number]];
      }
      if (!regionParam && !filterParam && !manualBounds) {
        return [[31, 129], [44, 145]] as [[number, number], [number, number]];
      }
      const latPad = (maxLat - minLat) * 0.15 || 0.5;
      const lngPad = (maxLng - minLng) * 0.15 || 0.5;
      return [[minLat - latPad, minLng - lngPad], [maxLat + latPad, maxLng + lngPad]] as [[number, number], [number, number]];
    }
    
    return [[24, 122], [46, 146]] as [[number, number], [number, number]];
  }, [filteredIslands, manualBounds]);

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



  const handleSelectIsland = (islandId: string) => {
    const island = allIslands.find(i => i.id === islandId);
    if (island && island.coordinates) {
      const [latStr, lngStr] = island.coordinates.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Just fly to the island, don't set filter
        setManualBounds([[lat - 0.05, lng - 0.05], [lat + 0.05, lng + 0.05]]);
        setSelectedIslandId(islandId);
      }
    }
  };

  const selectedIsland = allIslands.find(i => i.id === selectedIslandId);
  const selectedStatus = selectedIsland ? (islandStatuses[selectedIsland.id] || 'none') : 'none';

  return (
    <main className="min-h-screen bg-[#F8FAFC] overflow-hidden fixed inset-0 flex flex-col font-sans">
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] px-6 lg:px-12 pt-12 lg:pt-8 pb-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => {
            if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
              router.back();
            } else {
              router.push('/');
            }
          }} 
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white flex items-center justify-center text-slate-800 hover:scale-105 transition-transform pointer-events-auto"
          title="前のページに戻る"
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
      <div className="absolute top-28 lg:top-24 left-6 lg:left-12 z-[1000] pointer-events-auto flex flex-col gap-2">
        <Breadcrumb 
          items={[
            { label: '日本全国離島マップ' }
          ]} 
          className="mb-0"
        />

        {difficultyFilter !== null && (
          <button 
            onClick={() => setDifficultyFilter(null)}
            className="bg-slate-900/90 hover:bg-slate-950 backdrop-blur-md text-amber-300 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg w-max border border-amber-500/30 transition-all cursor-pointer group"
            title="クリックで全表示に戻す"
          >
            <span>
              {difficultyFilter === 0 ? '🔒 渡航制限島（対象外）を抽出中' : `★${difficultyFilter} 難易度フィルター中`} ({filteredIslands.length}島)
            </span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
              解除 ✕
            </span>
          </button>
        )}

        {filterParam && (
          <button 
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('filter');
              router.replace(`/map?${params.toString()}`);
            }}
            className="bg-blue-600/90 hover:bg-blue-700 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg w-max transition-all cursor-pointer group"
            title="クリックで解除"
          >
            <span>🔍 「{filterParam}」でフィルター中</span>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full group-hover:bg-white group-hover:text-blue-600 transition-colors">
              解除 ✕
            </span>
          </button>
        )}
      </div>

      {/* Archipelago Quick Nav (諸島ナビ) */}
      <div className="absolute top-28 lg:top-24 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2 w-full pointer-events-auto">
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 px-2 py-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-1.5 overflow-x-auto max-w-[95vw] hide-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 px-2 shrink-0">人気の諸島:</span>
          <button 
            onClick={() => { setManualBounds(null); setDifficultyFilter(null); }} 
            className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all bg-slate-900 text-white shrink-0 shadow-sm"
          >
            全国
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1 shrink-0" />
          {ARCHIPELAGOS.map(arch => (
            <button
              key={arch.name}
              onClick={() => {
                setManualBounds(arch.bounds);
                setSelectedIslandId(null);
              }}
              className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all text-slate-700 hover:bg-slate-100 hover:text-slate-900 shrink-0 border border-transparent hover:border-slate-200 whitespace-nowrap"
            >
              {arch.name}
            </button>
          ))}
        </div>

        {/* Difficulty Tier Filter Bar */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 px-2 py-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-1.5 overflow-x-auto max-w-[95vw] hide-scrollbar">

        <button 
          onClick={() => { setDifficultyFilter('conquest_only'); setManualBounds(null); }} 
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${difficultyFilter === 'conquest_only' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
        >
          🏝️ 渡航可能島 ({allIslands.filter(i => getIslandDifficulty(i).level >= 1).length})
        </button>
        <button 
          onClick={() => { setDifficultyFilter(null); setManualBounds(null); router.replace('/map'); }} 
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${difficultyFilter === null && !regionParam ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
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
        <button 
          onClick={() => { setDifficultyFilter(0); setManualBounds(null); }} 
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${difficultyFilter === 0 ? 'bg-slate-900 text-amber-300 shadow-sm ring-2 ring-amber-400' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          🔒 渡航制限島（対象外）
        </button>
      </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative w-full h-full z-0" onClick={() => setSelectedIslandId(null)}>
        <MapClient 
          islands={filteredIslands} 
          zoom={5} 
          bounds={calculatedBounds} 
          mapStyle={mapStyle} 
          onIslandSelect={handleSelectIsland} 
        />
      </div>

      {/* Map Style Toggle Layer */}
      <div className="absolute top-44 lg:top-36 right-4 sm:right-6 lg:right-12 z-[1000] flex flex-col gap-2 pointer-events-auto">
        <button 
          onClick={() => setMapStyle('voyager')}
          className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center transition-all ${mapStyle === 'voyager' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          title="デザインマップ"
        >
          <MapIcon size={18} />
        </button>
        <button 
          onClick={() => setMapStyle('satellite')}
          className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center transition-all ${mapStyle === 'satellite' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          title="衛星写真"
        >
          <ImageIcon size={18} />
        </button>
        <button 
          onClick={() => setMapStyle('dark')}
          className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center transition-all ${mapStyle === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
          title="ダークモード"
        >
          <Layers size={18} />
        </button>
      </div>

      {/* Floating Legend & Filter Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-xl border border-slate-700 px-4 sm:px-6 py-2.5 rounded-full shadow-2xl flex flex-nowrap items-center gap-2.5 sm:gap-5 pointer-events-auto w-max max-w-[95vw] overflow-x-auto hide-scrollbar text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5 font-bold text-amber-400 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
          👑 到達: <strong className="text-white text-xs sm:text-sm font-serif">{visitedCount}</strong>
        </div>
        <div className="h-4 w-px bg-slate-700 shrink-0" />
        <div className="flex items-center gap-1.5 font-bold text-cyan-400 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm" />
          ⭐️ 行きたい: <strong className="text-white text-xs sm:text-sm font-serif">{planningCount}</strong>
        </div>
        <div className="h-4 w-px bg-slate-700 shrink-0" />
        <div className="flex items-center gap-1 font-bold text-slate-300 whitespace-nowrap">
          <span className="text-[9px]">難易度:</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="★1" />
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" title="★2" />
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="★3" />
          <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" title="★4" />
          <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" title="★5" />
        </div>
        <div className="h-4 w-px bg-slate-700 shrink-0" />
        <div className="flex items-center gap-1 font-bold text-rose-400 whitespace-nowrap">
          <span className="text-[10px]">⛔ 渡航不可</span>
        </div>
        <div className="h-4 w-px bg-slate-700 shrink-0" />
        <div className="flex items-center gap-1 font-bold text-slate-300 whitespace-nowrap">
          📍 表示中 <strong className="text-white text-xs sm:text-sm font-serif">{filteredIslands.length}</strong> 島
        </div>
      </div>

      {/* Floating Action Buttons for Phase 2 Features */}
      <div className="absolute bottom-24 right-4 sm:right-6 lg:right-12 z-[1000] flex flex-col gap-3 pointer-events-auto">
        <button 
          onClick={() => setIsAiOpen(true)}
          className="bg-indigo-600 text-white p-3 lg:p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:scale-105 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
          title="AIコンシェルジュ"
        >
          <Bot className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setIsCompareOpen(true)}
          className="bg-emerald-600 text-white p-3 lg:p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:scale-105 hover:bg-emerald-700 transition-all flex items-center gap-2 group"
          title="2島じまん比較"
        >
          <ArrowRightLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Island Bottom Sheet Preview */}
      <div className={`absolute bottom-0 left-0 right-0 z-[2000] transition-transform duration-500 ease-out flex justify-center pointer-events-none ${selectedIsland ? 'translate-y-0' : 'translate-y-[120%]'}`}>
        <div className="bg-white/95 backdrop-blur-2xl w-full max-w-2xl rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.1)] border-t border-slate-200/50 pointer-events-auto overflow-hidden">
          {selectedIsland && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-slate-100/50">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                <button onClick={() => setSelectedIslandId(null)} className="ml-auto w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 pt-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-md shrink-0 relative bg-slate-100">
                    {selectedIsland.thumbnail_url ? (
                      <Image src={selectedIsland.thumbnail_url} alt={selectedIsland.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                        <ImageIcon size={24} />
                        <span className="text-[10px] font-bold">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-500 mb-0.5">{selectedIsland.yomi}</p>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mb-1">{selectedIsland.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap text-xs font-bold mb-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md">★{getIslandDifficulty(selectedIsland).level}</span>
                      {selectedIsland.category && <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md">{selectedIsland.category}</span>}
                    </div>
                    {selectedStatus === 'visited' || selectedStatus === 'verified_visited' ? (
                      <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm bg-amber-50 px-3 py-1.5 rounded-lg w-max">
                        <CheckCircle size={16} /> 到達済み
                      </div>
                    ) : selectedStatus === 'planning' ? (
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg w-max">
                        ⭐️ 行きたい
                      </div>
                    ) : null}
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed line-clamp-2">
                  {selectedIsland.description || 'まだ詳細な説明が登録されていません。'}
                </p>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => router.push(`/island/${selectedIsland.id}`)}
                    className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Navigation size={18} /> 詳細を見る
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectIsland={handleSelectIsland} />
      <AiConcierge isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      <IslandCompareModal isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
    </main>
  );
}

export default function GlobalMap() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">日本全国離島マップ</h1>
        <p className="text-slate-600 mb-8 max-w-xl text-center leading-relaxed">
          日本全国の離島の位置や難易度、ご当地妖精の情報を確認できるインタラクティブマップを読み込んでいます。
          GPSチェックインによる島制覇記録の確認や、次に行く島のルート検索が可能です。
        </p>
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        
      </div>
    }>
      <GlobalMapContent />
    </Suspense>
  );
}
