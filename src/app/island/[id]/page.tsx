'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Users, Navigation, Compass, CheckSquare, Star, Plus, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTravel } from '@/context/TravelContext';
import CertificateModal from '@/components/CertificateModal';

export default function IslandDetail() {
  const params = useParams();
  const router = useRouter();
  const islandId = params.id as string;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [island, setIsland] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const { user, islandStatuses, updateStatus } = useTravel();
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
                  {flagIcons[key] || (val !== 'no' && <CheckSquare className="w-3 h-3" />)}
                  {key}
                  {val === 'no' && <span className="text-[0.6rem] ml-1">(なし)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificate Card Banner (When Visited) */}
        {status === 'visited' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 bg-gradient-to-br from-amber-500/15 via-slate-900 to-amber-500/10 border-2 border-amber-500/50 rounded-3xl p-6 lg:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Award className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[0.65rem] font-bold tracking-widest uppercase mb-1">
                  OFFICIAL RECORD OF ARRIVAL
                </span>
                <h3 className="font-serif font-bold text-white text-xl">「{island.name}」到達認定</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  この島への到達記録が保存されています。公式のデジタル到達証明書および郵送オーダーを利用できます。
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCertModalOpen(true)}
              className="shrink-0 w-full md:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Award className="w-4 h-4" />
              公式証明書を見る・発行
            </button>
          </motion.div>
        )}

        {/* Island Details Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:p-8 mb-12">
          <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-6 border-l-2 border-blue-500 pl-3">島の概要・アクセス情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs text-slate-400 tracking-wider block mb-1">所属地域 / 自治体</span>
              <span className="font-serif text-slate-800 font-bold">{island.region_id || '日本'}</span>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs text-slate-400 tracking-wider block mb-1">主なアクセス手段</span>
              <span className="font-serif text-slate-800 font-bold">{island.access || 'フェリー / 高速船'}</span>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs text-slate-400 tracking-wider block mb-1">周囲 / 面積</span>
              <span className="font-serif text-slate-800 font-bold">{island.area || '詳細情報確認中'}</span>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs text-slate-400 tracking-wider block mb-1">座標</span>
              <span className="font-mono text-slate-600 text-sm">{island.coordinates || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 lg:p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center justify-center gap-4 z-40">
          <button 
            onClick={() => handleStatusChange('visited')}
            className={`flex-1 max-w-xs py-4 rounded-2xl font-bold tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-2
              ${status === 'visited' ? 'bg-blue-600 text-white shadow-blue-500/25 scale-[1.02]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <CheckSquare className="w-4 h-4" /> 行った！ ({status === 'visited' ? '記録済' : '登録'})
          </button>
          
          <button 
            onClick={() => handleStatusChange('planning')}
            className={`flex-1 max-w-xs py-4 rounded-2xl font-bold tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-2
              ${status === 'planning' ? 'bg-amber-500 text-white shadow-amber-500/25 scale-[1.02]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Star className="w-4 h-4" /> 行きたい ({status === 'planning' ? '検討中' : '登録'})
          </button>
        </div>
      </div>

      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        island={island}
        user={user}
      />
    </main>
  );
}

// Additional lucide-react icons needed
function BedDouble(props: React.SVGProps<SVGSVGElement>) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg> }
function Coffee(props: React.SVGProps<SVGSVGElement>) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></svg> }
function Wifi(props: React.SVGProps<SVGSVGElement>) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> }
