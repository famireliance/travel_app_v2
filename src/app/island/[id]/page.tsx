'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Users, Navigation, Compass, CheckSquare, Star, Plus, Award, BookOpen, Bot, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTravel } from '@/context/TravelContext';
import CertificateModal from '@/components/CertificateModal';
import MiniMapClient from '@/components/Map/MiniMapClient';
import CheckInModal from '@/components/CheckInModal';
import { fetchAllIslands } from '@/lib/supabase';
import { getGuideUrl, getAiCompanionUrl, ECOSYSTEM_CONFIG } from '@/lib/ecosystem';
import Breadcrumb from '@/components/Breadcrumb';

export default function IslandDetail() {
  const params = useParams();
  const router = useRouter();
  const islandId = params.id as string;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [island, setIsland] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const { user, islandStatuses, updateStatus } = useTravel();
  const status = islandStatuses[islandId] || 'none';

  const handleStatusChange = (newStatus: 'visited' | 'planning' | 'verified_visited') => {
    if (newStatus === 'visited') {
      updateStatus(islandId as string, 'visited');
    } else {
      updateStatus(islandId as string, newStatus);
    }
  };

  useEffect(() => {
    fetchAllIslands().then(islands => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = (islands || []).find((i: any) => i.id === islandId);
      if (found) {
        setIsland(found);
      } else {
        setIsland({
          id: islandId,
          name: typeof islandId === 'string' ? islandId.toUpperCase() : 'ISLAND',
          region_id: '日本の離島エリア',
          coordinates: '35.689, 139.691',
          description: '手つかずの自然と温かい文化が残る魅力ある日本の離島です。'
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [islandId]);

  // Premium Skeleton Loading Screen
  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans animate-pulse">
      <div className="w-full h-[50vh] lg:h-[60vh] bg-slate-200"></div>
      <div className="max-w-4xl mx-auto px-6 lg:px-12 -mt-10 relative z-20">
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="h-24 bg-white rounded-2xl shadow-sm border border-slate-100"></div>
          <div className="h-24 bg-white rounded-2xl shadow-sm border border-slate-100"></div>
          <div className="h-24 bg-white rounded-2xl shadow-sm border border-slate-100"></div>
        </div>
        <div className="h-40 bg-white rounded-3xl p-8 mb-8 shadow-sm"></div>
        <div className="h-64 bg-white rounded-3xl p-8 shadow-sm"></div>
      </div>
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
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-36 font-sans relative">
      {/* Hero Image Section */}
      <div className="relative w-full h-[50vh] lg:h-[60vh] overflow-hidden">
        <img 
          src={fallbackImage} 
          onError={(e) => { e.currentTarget.src = '/placeholders/trop.jpg' }}
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
            {island.region_id}
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
        <Breadcrumb 
          items={[
            { label: '日本全国離島マップ', href: '/map' },
            ...(island.region_id && island.region_id !== 'null' ? [{ label: `${island.region_id}`, href: `/region/${encodeURIComponent(island.region_id)}` }] : []),
            { label: island.name }
          ]} 
        />
        
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

        {/* Ecosystem Portal Section (Kira-Tabi Guide & AI Companion) */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 uppercase">輝旅エコシステム連携</h2>
            <span className="text-[0.65rem] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">公式連携</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Kira-Tabi Guide */}
            <a
              href={getGuideUrl(island.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors mb-1">
                  輝旅ガイドで情報を見る
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-serif">
                  絶景スポットやグルメ情報、現地の観光モデルコースをAIガイドで探索します。
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>guide.kira-tabi.com</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>

            {/* Card 2: AI Travel Companion */}
            <a
              href={getAiCompanionUrl(island.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-slate-800 hover:border-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between text-white"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ECOSYSTEM_CONFIG.isAiCompanionInDevelopment && (
                      <span className="text-[0.6rem] uppercase tracking-wider font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">開発中/Beta</span>
                    )}
                    <span className="text-[0.6rem] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">AI行程生成</span>
                  </div>
                </div>
                <h3 className="font-serif font-bold text-white text-base group-hover:text-blue-300 transition-colors mb-1">
                  AIコンパニオンに旅程を相談
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-serif">
                  旅の期間や予算、希望に合わせて「{island.name}」のオーダーメイドプランを作成します。
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-blue-400">
                <span>ai-travel-companion</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>
          </div>
        </div>

        {/* Description (Self-Contained Article) */}
        <div className="mb-12">
          <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-blue-500 pl-3">島の特徴・詳細解説</h2>
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
            <p className="text-slate-700 leading-relaxed font-serif text-[0.98rem] whitespace-pre-line">
              {island.description || '手つかずの自然と温かい伝統文化が残る、日本の魅力的な離島です。'}
            </p>
          </div>
        </div>

        {/* Recommended Spots (Self-Contained) */}
        {island.spots && island.spots.length > 0 && (
          <div className="mb-12">
            <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-amber-500 pl-3">必見の絶景・おすすめスポット</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {island.spots.map((spot: { name: string; desc: string }, i: number) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-amber-600">
                      <Sparkles className="w-4 h-4" />
                      <h3 className="font-serif font-bold text-slate-900 text-base">{spot.name}</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-serif">{spot.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Interactive Location MiniMap */}
        <div className="mb-12">
          <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-blue-500 pl-3">日本の位置・周辺マップ</h2>
          <MiniMapClient coordinates={island.coordinates} name={island.name} />
        </div>

        {/* Certificate Card Banner (When Visited or Verified) */}
        {(status === 'visited' || status === 'verified_visited') && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-16 border-2 rounded-3xl p-6 lg:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 ${
              status === 'verified_visited' 
                ? 'bg-gradient-to-br from-yellow-500/20 via-slate-900 to-yellow-600/20 border-yellow-400 shadow-yellow-500/20' 
                : 'bg-gradient-to-br from-amber-500/15 via-slate-900 to-amber-500/10 border-amber-500/50'
            }`}
          >
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner ${
                status === 'verified_visited' ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              }`}>
                <Award className={`w-7 h-7 ${status === 'verified_visited' ? 'animate-bounce' : 'animate-pulse'}`} />
              </div>
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold tracking-widest uppercase mb-1 ${
                  status === 'verified_visited' ? 'bg-yellow-500/30 text-yellow-200' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {status === 'verified_visited' ? '★ VERIFIED RECORD OF ARRIVAL ★' : 'OFFICIAL RECORD OF ARRIVAL'}
                </span>
                <h3 className="font-serif font-bold text-white text-xl">
                  「{island.name}」{status === 'verified_visited' ? '公式認定到達' : '到達記録'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  {status === 'verified_visited' ? 'GPS写真認証による公式な到達記録が保存されています。' : 'この島への到達記録が保存されています。公式のデジタル到達証明書をご利用できます。'}
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
            onClick={() => setIsCheckInModalOpen(true)}
            className={`flex-1 max-w-xs py-4 rounded-2xl font-bold tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-2
              ${(status === 'visited' || status === 'verified_visited') ? (status === 'verified_visited' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 shadow-yellow-500/30 scale-[1.02]' : 'bg-blue-600 text-white shadow-blue-500/25 scale-[1.02]') : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <CheckSquare className="w-4 h-4" /> 
            {status === 'verified_visited' ? '公式認定済！' : status === 'visited' ? '行った！(記録済)' : '行った！(到達登録)'}
          </button>
          
          <button 
            onClick={() => handleStatusChange('planning')}
            className={`flex-1 max-w-xs py-4 rounded-2xl font-bold tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-2
              ${status === 'planning' ? 'bg-amber-500 text-white shadow-amber-500/25 scale-[1.02]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Star className="w-4 h-4" /> 行きたい ({status === 'planning' ? '検討中' : '登録'})
          </button>

          {status !== 'none' && (
            <button
              onClick={() => updateStatus(islandId as string, 'none')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs tracking-wider transition-all shadow-sm bg-white hover:bg-slate-50"
            >
              記録を取り消す
            </button>
          )}
        </div>
      </div>

      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        island={island}
        user={user}
      />

      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        island={island}
      />
    </main>
  );
}

function BedDouble(props: React.SVGProps<SVGSVGElement>) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg> }
function Coffee(props: React.SVGProps<SVGSVGElement>) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></svg> }
function Wifi(props: React.SVGProps<SVGSVGElement>) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> }
