'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Compass, Award, Star, MapPin } from 'lucide-react';
import MapClient from '@/components/Map/MapClient';
import { useTravel } from '@/context/TravelContext';

export default function GlobalMap() {
  const router = useRouter();
  const { islandStatuses } = useTravel();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allIslands, setAllIslands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/islands?select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    })
      .then(res => res.json())
      .then(islands => {
        setAllIslands(islands || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load map data", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-400 font-serif tracking-[0.2em] text-sm gap-4">
      <Compass className="w-8 h-8 animate-spin-slow opacity-50" strokeWidth={1} />
      <span>日本全国の海図を展開中...</span>
    </div>
  );

  const visitedCount = Object.values(islandStatuses).filter(s => s === 'visited').length;
  const planningCount = Object.values(islandStatuses).filter(s => s === 'planning').length;

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
        
        <button className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white flex items-center justify-center text-slate-800 hover:scale-105 transition-transform pointer-events-auto">
          <Search className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
        </button>
      </header>

      {/* Map Area */}
      <div className="flex-1 relative w-full h-full z-0">
        <MapClient islands={allIslands} zoom={5} bounds={[[24, 122], [46, 146]]} />
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
          📍 全国 <strong className="text-white text-sm font-serif">432</strong> 島
        </div>
      </div>
    </main>
  );
}
