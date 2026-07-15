'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { ArrowLeft, UserCircle, LogOut, Award, CheckSquare, Star, MapPin, Edit3, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import CertificateModal from '@/components/CertificateModal';

export default function MyPage() {
  const router = useRouter();
  const { user, islandStatuses, totalVisited, travelerName, updateTravelerName } = useTravel();
  const ALL_ISLANDS_COUNT = 432;
  const progressPct = (totalVisited / ALL_ISLANDS_COUNT) * 100;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [islandsData, setIslandsData] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(travelerName || '');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedIslandForCert, setSelectedIslandForCert] = useState<any>(null);

  useEffect(() => {
    setNameInput(travelerName || '');
  }, [travelerName]);

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
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-serif text-2xl font-bold shadow-lg shrink-0">
            {travelerName?.charAt(0) || user?.email?.charAt(0) || '旅'}
          </div>
          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[0.65rem] font-bold tracking-widest uppercase">
                {totalVisited >= 100 ? '👑 島旅マスター' : totalVisited >= 20 ? '🌟 アイランドハンター' : totalVisited >= 5 ? '🏝️ 日本諸島探求者' : '🌱 見習い島旅人'}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {user?.id?.slice(0, 8) || 'ANON-GUEST'}</span>
            </div>

            {!isEditingName ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-800 tracking-wide">
                  {travelerName || user?.email?.split('@')[0] || '島旅トラベラー'}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                  title="旅人ネームを編集"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3 max-w-sm">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="旅人ネームを入力"
                  className="bg-slate-50 border border-blue-300 rounded-xl px-3 py-1.5 text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex-1"
                  autoFocus
                />
                <button
                  onClick={() => {
                    updateTravelerName(nameInput.trim() || '島旅トラベラー');
                    setIsEditingName(false);
                  }}
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
                  title="保存"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-amber-500"
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-xs font-serif text-slate-500">
              <span>全国432島 踏破率: <strong className="text-slate-800">{progressPct.toFixed(1)}%</strong></span>
              <span className="flex items-center gap-1 text-blue-600 font-bold"><Award size={14} className="text-amber-500" /> {totalVisited} / {ALL_ISLANDS_COUNT} 島</span>
            </div>
          </div>
        </div>

        {/* Certificate Gallery Section (NEW) */}
        <div className="mb-12">
          <h3 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-amber-500 pl-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" strokeWidth={2.5}/> 公式到達証明書コレクション ({visitedList.length})
            </span>
            <span className="text-[0.7rem] font-normal text-slate-400">デジタル・郵送オーダー対応</span>
          </h3>

          {visitedList.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl border border-amber-500/30 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h4 className="font-serif font-bold text-white text-lg">まだ到達証明書はありません</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                日本全国432島を訪れ、「行った！」ボタンを押すと、あなたのお名前が入った公式公認デジタル＆紙証明書がここにコレクションされます。
              </p>
              <button
                onClick={() => router.push('/map')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs tracking-widest transition-all hover:scale-105 shadow-lg"
              >
                🗺️ 地図から島を探して記録する →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visitedList.map(island => (
                <div
                  key={island.id}
                  className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-amber-500/40 shadow-lg hover:border-amber-400 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[0.6rem] font-bold tracking-widest uppercase mb-1.5">
                        Verified Record
                      </span>
                      <h4 className="font-serif font-bold text-white text-lg group-hover:text-amber-300 transition-colors">
                        {island.name}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <MapPin size={10} className="text-amber-500" /> {island.region_id || 'Japan'}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-sm shrink-0">
                      認
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIslandForCert(island)}
                    className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs tracking-wider border border-amber-500/40 hover:border-amber-500 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    証明書を見る・発行 / SNSシェア
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visited Islands */}
        <h3 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-blue-500 pl-3 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-500" strokeWidth={2}/> 行った島一覧 ({visitedList.length})
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
          <Star className="w-4 h-4 text-amber-500" strokeWidth={2}/> 行きたい島一覧 ({planningList.length})
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

      <CertificateModal
        isOpen={!!selectedIslandForCert}
        onClose={() => setSelectedIslandForCert(null)}
        island={selectedIslandForCert}
        user={user}
      />
    </main>
  );
}
