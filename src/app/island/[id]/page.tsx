'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Users, Navigation, Compass, CheckSquare, Star, Plus, Award, BookOpen, Bot, ExternalLink, Sparkles, AlertTriangle, BedDouble, Coffee, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTravel } from '@/context/TravelContext';
import CertificateModal from '@/components/CertificateModal';
import MiniMapClient from '@/components/Map/MiniMapClient';
import CheckInModal from '@/components/CheckInModal';
import { fetchAllIslands, fetchSiteSettings, fetchAdCampaigns } from '@/lib/supabase';
import { getGuideUrl, getAiCompanionUrl, ECOSYSTEM_CONFIG } from '@/lib/ecosystem';
import Breadcrumb from '@/components/Breadcrumb';
import IslandDiaries from '@/components/IslandDiaries';
import BannerCarousel from '@/components/BannerCarousel';
import { Tent, Car, Ship, CloudLightning } from 'lucide-react';

export default function IslandDetail() {
  const params = useParams();
  const router = useRouter();
  const islandId = params.id as string;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [island, setIsland] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [adCampaigns, setAdCampaigns] = useState<any[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([]);
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
    fetchAllIslands().then(async (islands) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = (islands || []).find((i: any) => i.id === islandId);
      if (found) {
        setIsland(found);
        
        // Phase 6: Fetch Targeted Ads
        fetchAdCampaigns(found.id, found.region_id).then(ads => setAdCampaigns(ads || []));

        // Phase 6: Fetch Automated Weather Alerts
        if (found.coordinates) {
          const [lat, lon] = found.coordinates.split(',').map((s: string) => s.trim());
          fetch(`/api/weather?lat=${lat}&lon=${lon}`)
            .then(res => res.json())
            .then(data => {
              if (data.alerts) setWeatherAlerts(data.alerts);
            }).catch(() => {});
        }
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

    fetchSiteSettings().then(data => {
      if (data) setSiteSettings(data);
    });
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

  if (island.is_published === false) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
      <h1 className="font-serif font-bold text-2xl text-slate-700 mb-2">公開準備中</h1>
      <p className="text-slate-500 text-sm max-w-sm">この島の情報は現在準備中、または公開が一時停止されています。</p>
      <button onClick={() => router.back()} className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-bold shadow-md">戻る</button>
    </div>
  );

  const parseJsonSafe = (str: string | null) => {
    if (!str) return [];
    try { return JSON.parse(str); } catch { return [{ name: 'リンクを見る', url: str }]; }
  };
  // 安全対策: 管理者がうっかりURLを空のまま登録しても、ユーザー画面には絶対に表示させない（信頼性担保）
  const hotels = parseJsonSafe(island.aff_hotel_url).filter((h: any) => h.url && h.url.trim() !== '');
  const rentacars = parseJsonSafe(island.aff_rentacar_url).filter((r: any) => r.url && r.url.trim() !== '');
  const ferries = parseJsonSafe(island.aff_ferry_url).filter((f: any) => f.url && f.url.trim() !== '');
  const jobs = parseJsonSafe(island.aff_job_url).filter((j: any) => j.url && j.url.trim() !== '');

  let defaultFallback = '/placeholders/temp.jpg';
  if (island.prefecture === '北海道' || island.prefecture === '青森県' || island.region_id?.includes('hokkaido')) {
    defaultFallback = '/placeholders/cold.jpg';
  } else if (island.prefecture === '沖縄県' || island.prefecture === '鹿児島県' || island.region_id === 'ogasawara') {
    defaultFallback = '/placeholders/trop.jpg';
  }

  const fallbackImage = island.hero_image_url || `/region/${island.region_id}.jpg`;
  
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
        {/* Top Navigation Overlay */}
        <div className="absolute top-0 left-0 right-0 z-50 p-6 lg:p-8 flex flex-col gap-4 bg-gradient-to-b from-slate-900/80 via-slate-900/20 to-transparent pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <button 
              onClick={() => router.back()} 
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-colors shadow-sm"
              title="前に戻る"
            >
              <ArrowLeft className="w-6 h-6" strokeWidth={2} />
            </button>
            <Breadcrumb 
              items={[
                { label: 'マップ', href: '/map' },
                { label: island.region_id, href: `/region/${island.region_id}` },
                { label: island.name }
              ]} 
              isDark={true}
              className="!mb-0"
            />
          </div>
        </div>

        <img 
          src={fallbackImage} 
          onError={(e) => { e.currentTarget.src = defaultFallback }}
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
            {island.prefecture || island.region_id}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-serif font-bold text-4xl lg:text-6xl tracking-widest text-slate-900"
          >
            {island.name}
          </motion.h1>
        </div>
      </div>

      {/* Global & Targeted Campaign Banner (Carousel) */}
      {adCampaigns.length > 0 && (
        <BannerCarousel campaigns={adCampaigns} />
      )}

      {/* Automated Weather Alert Banner */}
      {weatherAlerts.length > 0 && (
        <div className="w-full bg-rose-600 text-white p-4 shadow-sm relative z-30 border-b border-rose-700/50">
          <div className="max-w-4xl mx-auto px-6 lg:px-12 flex gap-4 items-start md:items-center">
            <CloudLightning className="w-6 h-6 shrink-0 mt-0.5 md:mt-0 animate-pulse" />
            <div>
              <p className="font-bold text-sm md:text-base tracking-widest mb-1">
                【自動発令】{weatherAlerts[0].event}
              </p>
              <p className="text-xs md:text-sm font-medium text-white/90 whitespace-pre-line leading-relaxed">
                {weatherAlerts[0].description} ({weatherAlerts[0].sender_name})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Agency Manual Alert Banner */}
      {island.alert_status && island.alert_status !== 'normal' && (
        <div className={`w-full ${island.alert_status === 'danger' ? 'bg-red-700 text-white' : island.alert_status === 'cancelled' ? 'bg-slate-900 text-white' : 'bg-amber-500 text-slate-900'} p-4 shadow-sm relative z-30`}>
          <div className="max-w-4xl mx-auto px-6 lg:px-12 flex gap-4 items-start md:items-center">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 md:mt-0" />
            <div>
              <p className="font-bold text-sm md:text-base tracking-widest mb-1">
                {island.alert_status === 'danger' ? '【重要】渡航制限・危険情報' : island.alert_status === 'cancelled' ? '【重要】欠航・運休情報' : '【お知らせ】渡航に関する注意'}
              </p>
              <p className={`text-xs md:text-sm font-medium ${island.alert_status === 'warning' ? 'text-slate-800' : 'text-white/90'} whitespace-pre-line leading-relaxed`}>
                {island.alert_message || '現地からの最新情報をご確認の上、安全なご旅行をお願いいたします。'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className={`max-w-4xl mx-auto px-6 lg:px-12 ${(adCampaigns.length > 0) || (island.alert_status && island.alert_status !== 'normal') || weatherAlerts.length > 0 ? 'mt-8' : '-mt-4'} relative z-20`}>
        <Breadcrumb 
          items={[
            { label: '日本全国離島マップ', href: '/map' },
            ...(island.region_id && island.region_id !== 'null' ? [{ label: `${island.prefecture || island.region_id}`, href: `/region/${encodeURIComponent(island.region_id)}` }] : []),
            { label: island.name }
          ]} 
        />

        {island.is_conquest_target === false && (
          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-800 mb-1">制覇対象外（上陸不可）</h3>
              <p className="text-xs text-rose-600 leading-relaxed">
                この島は自衛隊基地や渡航手段不明などの理由により立入が制限されています。100%制覇の分母からは除外されています。
              </p>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <MapPin className="w-5 h-5 text-blue-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs text-slate-500 font-medium tracking-widest mb-1">面積</span>
            {island.area ? <span className="text-lg font-serif text-slate-800">{island.area} <span className="text-xs">km²</span></span> : <span className="text-sm font-serif text-slate-400">調査中</span>}
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <Users className="w-5 h-5 text-blue-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs text-slate-500 font-medium tracking-widest mb-1">人口</span>
            {island.population ? <span className="text-lg font-serif text-slate-800">{island.population} <span className="text-xs">人</span></span> : <span className="text-sm font-serif text-slate-400">調査中</span>}
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <Navigation className="w-5 h-5 text-blue-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs text-slate-500 font-medium tracking-widest mb-1">アクセス</span>
            <span className="text-xs font-serif text-slate-800 leading-tight">{island.access}</span>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-2xl shadow-sm border border-amber-100 flex flex-col items-center justify-center text-center col-span-3 sm:col-span-1 sm:row-start-1 sm:col-start-4">
            <Star className="w-5 h-5 text-amber-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs text-amber-700 font-medium tracking-widest mb-1">公式到達ポイント</span>
            <span className="text-lg font-mono font-bold text-amber-600">{island.points || 0} <span className="text-xs">pt</span></span>
          </div>
        </div>

        {/* Ecosystem Portal Section (Kira-Tabi Guide & Article) */}
        {(island.guide_url || island.article_url) && (
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 uppercase">KIRATABI 連携コンテンツ</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Kira-Tabi Guide */}
              {island.guide_url && (
                <a
                  href={island.guide_url}
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
                      KIRATABIガイドで情報を見る
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-serif">
                      絶景スポットやグルメ情報、現地の観光モデルコースを探索します。
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>guide.kira-tabi.com</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </a>
              )}

              {/* Card 2: Kira-Tabi Article */}
              {island.article_url && (
                <a
                  href={island.article_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-slate-800 hover:border-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between text-white"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Star className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="font-serif font-bold text-white text-base group-hover:text-blue-300 transition-colors mb-1">
                      KIRATABI 関連記事
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-serif">
                      この島の魅力や詳細な滞在レポートをKIRATABI本サイトで読むことができます。
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-blue-400">
                    <span>kira-tabi.com</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

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

        {/* Monetization / Affiliate Booking Section */}
        {(hotels.length > 0 || rentacars.length > 0 || ferries.length > 0 || jobs.length > 0) && (
          <div className="mb-12">
            <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-6 border-l-2 border-amber-500 pl-3">お得なご予約・移住・お仕事</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotels.map((h: any, idx: number) => (
                <a key={`hotel-${idx}`} href={h.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Tent size={20} /></div>
                  <div className="flex-1 truncate">
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5 group-hover:text-blue-400 transition-colors">宿泊予約</div>
                    <div className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-700 transition-colors">{h.name}</div>
                  </div>
                </a>
              ))}
              {rentacars.map((r: any, idx: number) => (
                <a key={`rentacar-${idx}`} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Car size={20} /></div>
                  <div className="flex-1 truncate">
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5 group-hover:text-emerald-400 transition-colors">レンタカー・移動手段</div>
                    <div className="text-sm font-bold text-slate-700 truncate group-hover:text-emerald-700 transition-colors">{r.name}</div>
                  </div>
                </a>
              ))}
              {ferries.map((f: any, idx: number) => (
                <a key={`ferry-${idx}`} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Ship size={20} /></div>
                  <div className="flex-1 truncate">
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5 group-hover:text-indigo-400 transition-colors">フェリー・航空券</div>
                    <div className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-700 transition-colors">{f.name}</div>
                  </div>
                </a>
              ))}
              {jobs.map((j: any, idx: number) => (
                <a key={`job-${idx}`} href={j.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-pink-50 border border-pink-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0"><Users size={20} /></div>
                  <div className="flex-1 truncate">
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5 group-hover:text-pink-400 transition-colors">求人・リゾートバイト</div>
                    <div className="text-sm font-bold text-slate-700 truncate group-hover:text-pink-700 transition-colors">{j.name}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Island Details Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:p-8 mb-12">
          <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-6 border-l-2 border-blue-500 pl-3">島の概要・アクセス情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs text-slate-400 tracking-wider block mb-1">所属地域 / 自治体</span>
              <span className="font-serif text-slate-800 font-bold">{island.prefecture || island.region_id || '日本'}</span>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs text-slate-400 tracking-wider block mb-1">主なアクセス手段</span>
              <span className="font-serif text-slate-800 font-bold">{island.access || '確認中'}</span>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs text-slate-400 tracking-wider block mb-1">周囲 / 面積</span>
              <span className="font-serif text-slate-800 font-bold">{island.area ? `${island.area} km²` : '調査中'}</span>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs text-slate-400 tracking-wider block mb-1">座標</span>
              <span className="font-mono text-slate-600 text-sm">{island.coordinates || 'N/A'}</span>
            </div>
          </div>
          
          {island.transport_info && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold tracking-widest text-slate-400 mb-3">島内移動・詳細アクセス情報</h3>
              <div 
                className="prose prose-sm prose-slate max-w-none text-slate-600 font-serif"
                dangerouslySetInnerHTML={{ __html: island.transport_info }}
              />
            </div>
          )}
        </div>

        {/* Island Diaries (島ログ) */}
        <IslandDiaries islandId={islandId} />

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

