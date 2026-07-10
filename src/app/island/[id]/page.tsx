'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Users, Navigation, Compass, CheckSquare, Star, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTravel } from '@/context/TravelContext';

export default function IslandDetail() {
  const params = useParams();
  const router = useRouter();
  const islandId = params.id as string;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [island, setIsland] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { islandStatuses, updateStatus } = useTravel();
  const status = islandStatuses[islandId] || 'none';

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/islands?id=eq.${islandId}&select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        setIsland(data[0]);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [islandId]);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-400 font-serif tracking-[0.2em] text-sm gap-4">
      <Compass className="w-8 h-8 animate-spin-slow opacity-50" strokeWidth={1} />
      <span>島情報を取得中...</span>
    </div>
  );

  if (!island) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 font-serif">
      島が見つかりませんでした
    </div>
  );

  const fallbackImage = `/region/${island.region_id}.jpg`;
  
  const flagIcons: Record<string, React.ReactNode> = {
    '診療所': <Plus className="w-4 h-4 text-rose-500" />,
    '宿泊施設': <BedDouble className="w-4 h-4 text-blue-500" />,
    'カフェ・飲食店': <Coffee className="w-4 h-4 text-amber-600" />,
    '電波状況広く圏内': <Wifi className="w-4 h-4 text-emerald-500" />,
    // ... we can add more specific icons later if imported
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans relative">
      {/* Hero Image Section */}
      <div className="relative w-full h-[50vh] lg:h-[60vh] overflow-hidden">
        <img 
          src={`/placeholders/trop.jpg`} 
          onError={(e) => { e.currentTarget.src = fallbackImage }}
          alt={island.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#F8FAFC]"></div>
        
        <header className="absolute top-0 left-0 right-0 z-50 px-6 lg:px-12 pt-12 pb-6 flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </header>

        <div className="absolute bottom-8 left-6 lg:left-12 z-10 text-slate-800 drop-shadow-md">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-[0.7rem] font-bold tracking-[0.3em] uppercase mb-2 text-blue-900"
          >
            {island.region_id} region
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-serif font-bold text-4xl lg:text-6xl tracking-widest text-slate-900"
          >
            {island.name}
          </motion.h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 lg:px-12 -mt-4 relative z-20">
        
        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <MapPin className="w-5 h-5 text-blue-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs text-slate-500 font-medium tracking-widest mb-1">面積</span>
            <span className="text-lg font-serif text-slate-800">{island.area} <span className="text-xs">km²</span></span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <Users className="w-5 h-5 text-blue-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs text-slate-500 font-medium tracking-widest mb-1">人口</span>
            <span className="text-lg font-serif text-slate-800">{island.population} <span className="text-xs">人</span></span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <Navigation className="w-5 h-5 text-blue-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs text-slate-500 font-medium tracking-widest mb-1">アクセス</span>
            <span className="text-xs font-serif text-slate-800 leading-tight">{island.access}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-12">
          <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-blue-500 pl-3">島の特徴</h2>
          <p className="text-slate-600 leading-relaxed font-serif text-[0.95rem]">
            {island.description || '詳細な説明は現在準備中です。'}
          </p>
        </div>

        {/* Tourist Flags */}
        {island.flags && Object.keys(island.flags).length > 0 && (
          <div className="mb-12">
            <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-blue-500 pl-3">観光情報</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(island.flags).map(([key, val]) => (
                <div key={key} className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide border flex items-center gap-1.5
                  ${val === 'yes' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    val === 'info' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-slate-50 text-slate-400 border-slate-200'}`}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {val !== 'no' && <CheckSquare className="w-3 h-3" />}
                  {key}
                  {val === 'no' && <span className="text-[0.6rem] ml-1">(なし)</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-xl p-2 rounded-full shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-slate-100 flex items-center justify-between z-50">
        <button 
          onClick={() => updateStatus(islandId, status === 'planning' ? 'none' : 'planning')}
          className={`flex-1 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-bold tracking-widest transition-colors ${
            status === 'planning' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Star className="w-4 h-4" strokeWidth={2} />
          行きたい
        </button>
        <div className="w-[1px] h-8 bg-slate-200 mx-1"></div>
        <button 
          onClick={() => updateStatus(islandId, status === 'visited' ? 'none' : 'visited')}
          className={`flex-1 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-bold tracking-widest transition-colors ${
            status === 'visited' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <CheckSquare className="w-4 h-4" strokeWidth={2} />
          行った！
        </button>
      </div>

    </main>
  );
}

// Additional lucide-react icons needed
function BedDouble(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg> }
function Coffee(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></svg> }
function Wifi(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> }
