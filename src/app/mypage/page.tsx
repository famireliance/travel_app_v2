'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { ArrowLeft, UserCircle, LogOut, Award, CheckSquare, Star, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function MyPage() {
  const router = useRouter();
  const { user, islandStatuses, totalVisited } = useTravel();
  const ALL_ISLANDS_COUNT = 432;
  const progressPct = (totalVisited / ALL_ISLANDS_COUNT) * 100;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [islandsData, setIslandsData] = useState<any[]>([]);

  useEffect(() => {
    // Only fetch islands that the user has interacted with
    const trackedIds = Object.keys(islandStatuses);
    if (trackedIds.length === 0) return;

    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/islands?id=in.(${trackedIds.join(',')})`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setIslandsData(data || []);
    })
    .catch(console.error);
  }, [islandStatuses]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const visitedList = islandsData.filter(i => islandStatuses[i.id] === 'visited');
  const planningList = islandsData.filter(i => islandStatuses[i.id] === 'planning');

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-50">
        <button 
          onClick={() => router.push('/')} 
          className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif font-bold tracking-[0.2em] text-slate-800">MY PAGE</h1>
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 mt-8">
        
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
            <UserCircle className="w-10 h-10 text-blue-600" strokeWidth={1} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400 tracking-widest mb-1">トラベラー</p>
            <h2 className="text-xl font-bold text-slate-800 mb-2 truncate">{user?.email || 'ゲスト'}</h2>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-blue-500"
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-xs font-serif text-slate-500">
              <span>踏破率: {progressPct.toFixed(1)}%</span>
              <span className="flex items-center gap-1 text-blue-600 font-bold"><Award size={12}/> {totalVisited} / {ALL_ISLANDS_COUNT} 島</span>
            </div>
          </div>
        </div>

        {/* Visited Islands */}
        <h3 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-blue-500 pl-3 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-500" strokeWidth={2}/> 行った島 ({visitedList.length})
        </h3>
        {visitedList.length === 0 ? (
          <p className="text-slate-400 text-sm font-serif mb-12">まだ記録がありません。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {visitedList.map(island => (
              <div 
                key={island.id} 
                onClick={() => router.push(`/island/${island.id}`)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-blue-300 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 font-bold font-serif">
                  {island.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{island.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={10}/> {island.region_id}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Planning Islands */}
        <h3 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-amber-500 pl-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" strokeWidth={2}/> 行きたい島 ({planningList.length})
        </h3>
        {planningList.length === 0 ? (
          <p className="text-slate-400 text-sm font-serif mb-12">まだ記録がありません。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {planningList.map(island => (
              <div 
                key={island.id} 
                onClick={() => router.push(`/island/${island.id}`)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-amber-300 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 font-bold font-serif">
                  {island.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{island.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={10}/> {island.region_id}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
