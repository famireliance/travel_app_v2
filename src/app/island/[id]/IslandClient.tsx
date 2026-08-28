'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Users, Navigation, Compass, CheckSquare, Star, Plus, Award, BookOpen, Bot, ExternalLink, Sparkles, AlertTriangle, BedDouble, Coffee, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTravel } from '@/context/TravelContext';
import { toast } from 'react-hot-toast';
import CertificateModal from '@/components/CertificateModal';
import MiniMapClient from '@/components/Map/MiniMapClient';
import CheckInModal from '@/components/CheckInModal';
import { fetchAllIslands, fetchSiteSettings, fetchAdCampaigns } from '@/lib/supabase';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import regionsData from '@/data/regions.json';
import { getGuideUrl, getAiCompanionUrl, ECOSYSTEM_CONFIG } from '@/lib/ecosystem';
import { getIslandDifficulty } from '@/lib/difficulty';
import Breadcrumb from '@/components/Breadcrumb';
import IslandDiaries from '@/components/IslandDiaries';
import BannerCarousel from '@/components/BannerCarousel';
import { Tent, Car, Ship, CloudLightning, Droplets, Moon, Store, CreditCard, Stethoscope, Sunrise, Mountain, PhoneCall, Phone, Radio, ShieldAlert } from 'lucide-react';

interface IslandDiarySSR {
  id: string;
  user_id: string;
  created_at: string;
  is_official?: boolean;
  overall_rating?: number;
  tags?: string[];
  water_clarity?: number;
  starry_sky?: number;
  visit_month?: number;
  companion_type?: string;
  content: string;
  photo_url?: string;
}

interface Props {
  islandId?: string;
  initialDiaries?: IslandDiarySSR[];
}

export default function IslandDetail({ islandId: propIslandId, initialDiaries = [] }: Props) {
  const params = useParams();
  const router = useRouter();
  const rawId = propIslandId || (Array.isArray(params?.id) ? params.id[0] : params?.id);
  const islandId = rawId ? String(rawId) : '';
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [island, setIsland] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [adCampaigns, setAdCampaigns] = useState<any[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([]);
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const { user, islandStatuses, visitCounts, updateStatus, decrementVisitCount, addIslandVisit } = useTravel();
  const status = islandStatuses[islandId] || 'none';
  const visitCount = visitCounts[islandId] || 0;

  const handleStatusChange = (newStatus: 'visited' | 'planning' | 'verified_visited') => {
    if (newStatus === 'visited') {
      const result = addIslandVisit(islandId as string, island, 0, false);
      if (result.error === 'already_visited_today') {
        toast.error('本日はすでにこの島の到達記録を追加済みです。回数のカウントアップは1日1回までとなります！');
        return;
      }
      setIsCertModalOpen(true);
    } else {
      updateStatus(islandId as string, newStatus);
    }
  };

  const handleCancelRecord = () => {
    if (window.confirm("到達記録を取り消しますか？")) {
      if (visitCount > 1) {
        decrementVisitCount(islandId);
      } else {
        updateStatus(islandId, 'none');
      }
    }
  };

  useEffect(() => {
    if (!islandId) return;

    setLoading(true);
    setNotFound(false);

    fetchAllIslands().then(async (islands) => {
      let decodedId = islandId;
      try {
        decodedId = decodeURIComponent(islandId);
      } catch {
        decodedId = islandId;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let found: any = (islands || []).find((i: any) => 
        String(i.id) === String(islandId) || 
        String(i.id) === String(decodedId) ||
        i.slug === islandId || 
        i.slug === decodedId ||
        i.name === islandId || 
        i.name === decodedId
      );

      // Fallback to master dictionary by ID/slug/name
      if (!found) {
        found = ALL_ISLANDS_MASTER_DICTIONARY[islandId] || ALL_ISLANDS_MASTER_DICTIONARY[decodedId];
      }

      if (!found) {
        found = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
          (i: any) => i.name === islandId || i.name === decodedId || i.slug === islandId || i.slug === decodedId
        );
      }

      if (found) {
        setIsland(found);
        setNotFound(false);
        
        // Phase 6: Fetch Targeted Ads (including prefecture and area)
        fetchAdCampaigns(found.id as string, found.region_id as string | undefined, found.prefecture as string | undefined, found.area as string | undefined).then(ads => setAdCampaigns(ads || []));

        // Phase 6: Fetch Automated Weather Alerts
        if (found.coordinates) {
          const [lat, lon] = (found.coordinates as string).split(',').map((s: string) => s.trim());
          fetch(`/api/weather?lat=${lat}&lon=${lon}`)
            .then(res => res.json())
            .then(data => {
              if (data.alerts) setWeatherAlerts(data.alerts);
              if (data.current) setCurrentWeather(data.current);
            }).catch(() => {});
        }
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }).catch(() => {
      // If DB error happens, try local master dictionary before declaring notFound
      let decodedId = islandId;
      try { decodedId = decodeURIComponent(islandId); } catch {}
      const masterFound = ALL_ISLANDS_MASTER_DICTIONARY[islandId] || ALL_ISLANDS_MASTER_DICTIONARY[decodedId] || Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find((i: any) => i.name === islandId || i.name === decodedId || i.slug === islandId);
      if (masterFound) {
        setIsland(masterFound);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });

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

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center gap-6 text-white">
        <p className="text-6xl">🏝️</p>
        <h1 className="text-2xl font-bold">島が見つかりませんでした</h1>
        <p className="text-slate-400">指定された島のデータが存在しません。</p>
        <button onClick={() => router.push('/')} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-colors">トップへ戻る</button>
      </div>
    );
  }

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

  const parseJsonSafe = (val: unknown): any[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    }
    return [];
  };
  // 安全対策: 管理者がうっかりURLを空のまま登録しても、ユーザー画面には絶対に表示させない（信頼性担保）
  const hotels = parseJsonSafe(island.aff_hotel_url).filter((h: any) => h.url && h.url.trim() !== '');
  const rentacars = parseJsonSafe(island.aff_rentacar_url).filter((r: any) => r.url && r.url.trim() !== '');
  const ferries = parseJsonSafe(island.aff_ferry_url).filter((f: any) => f.url && f.url.trim() !== '');
  const jobs = parseJsonSafe(island.aff_job_url).filter((j: any) => j.url && j.url.trim() !== '');

  let defaultFallback = '/region/subtropical.jpg';
  if (island.prefecture === '北海道' || island.prefecture === '青森県' || island.region_id?.includes('hokkaido')) {
    defaultFallback = '/region/northern.jpg';
  } else if (island.prefecture === '沖縄県' || island.prefecture === '鹿児島県' || island.region_id === 'ogasawara') {
    defaultFallback = '/region/tropical.jpg';
  }

  const fallbackImage = island.hero_image_url || `/region/${island.region_id}.jpg`;
  
  const flagIcons: Record<string, React.ReactNode> = {
    '診療所': <Plus className="w-4 h-4 text-rose-500" />,
    '宿泊施設': <BedDouble className="w-4 h-4 text-blue-500" />,
    'カフェ・飲食店': <Coffee className="w-4 h-4 text-amber-600" />,
    '電波状況広く圏内': <Wifi className="w-4 h-4 text-emerald-500" />,
  };

  const difficultyInfo = island ? getIslandDifficulty(island) : null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-36 font-sans relative">
      {/* Hero Image Section */}
      <div className="relative w-full h-[50vh] lg:h-[60vh] overflow-hidden">

        <img 
          src={fallbackImage} 
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes(defaultFallback)) {
              target.src = defaultFallback;
            } else {
              target.style.display = 'none';
            }
          }}
          alt={island.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-black/40"></div>
        
        <header className="absolute top-0 left-0 right-0 z-50 px-6 lg:px-12 pt-12 pb-6 flex items-center justify-between">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
                router.back();
              } else {
                router.push('/map');
              }
            }} 
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors shadow-lg"
            title="前のページに戻る"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </header>

        <div className="absolute bottom-8 left-6 lg:left-12 z-10 text-white drop-shadow-lg">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-[0.7rem] font-bold tracking-[0.3em] uppercase mb-2 text-cyan-300 drop-shadow-md"
          >
            {island.prefecture || island.region_id}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-serif font-bold text-4xl lg:text-6xl tracking-widest text-white drop-shadow-lg"
          >
            {island.name}
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap items-center gap-3 mt-4">
            {difficultyInfo && difficultyInfo.level > 0 && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md ${difficultyInfo.badgeColor}`}>
                <span className="tracking-widest">{difficultyInfo.stars}</span>
                <span>{difficultyInfo.label}</span>
              </div>
            )}
            
            {currentWeather && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md bg-black/50 backdrop-blur-md text-white border border-white/30">
                <img src={`https://openweathermap.org/img/wn/${currentWeather.icon}.png`} alt={currentWeather.description} className="w-5 h-5 -my-1" />
                <span>{currentWeather.temp}°C {currentWeather.description}</span>
              </div>
            )}
            
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`【キラ旅】${island.name}に到達！`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&hashtags=キラ旅,離島`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-[#1DA1F2] transition-colors shadow-md" aria-label="Share on X">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-[#06C755] transition-colors shadow-md" aria-label="Share on LINE">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.298.08.683.04.945l-.173 1.057c-.053.33-.25.992.871.52 1.121-.471 6.035-3.553 8.351-6.171C22.612 14.869 24 12.721 24 10.304zM7.747 12.632H5.666c-.347 0-.629-.281-.629-.629V8.058c0-.347.282-.628.629-.628h2.081c.347 0 .628.281.628.628s-.281.628-.628.628H6.924v2.69h.823c.347 0 .628.281.628.628s-.281.627-.628.627zm4.331-.629c0 .348-.281.629-.628.629h-2.08c-.347 0-.629-.281-.629-.629V8.058c0-.347.282-.628.629-.628h.629v3.945h1.451c.347 0 .628.281.628.628zm2.493 0c0 .348-.281.629-.628.629h-.002c-.347 0-.628-.281-.628-.629V8.058c0-.347.281-.628.628-.628h.002c.347 0 .628.281.628.628v3.945zm5.291-3.316c0 .347-.282.628-.629.628h-1.451v.965h1.451c.347 0 .629.281.629.628s-.282.628-.629.628h-2.081c-.347 0-.628-.281-.628-.628V8.058c0-.347.281-.628.628-.628h2.081c.347 0 .629.281.629.628z"/></svg>
            </a>
          </motion.div>
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
                【自動発令】{weatherAlerts[0]?.event}
              </p>
              <p className="text-xs md:text-sm font-medium text-white/90 whitespace-pre-line leading-relaxed">
                {weatherAlerts[0]?.description} ({weatherAlerts[0]?.sender_name})
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
        {(() => {
          const matchingRegion = regionsData.find((r: any) => 
            r.id === island.region_id || 
            r.name === island.region_id || 
            r.name === island.prefecture
          );
          return (
            <Breadcrumb 
              items={[
                { label: '全国離島マップ', href: '/map' },
                ...(matchingRegion 
                  ? [{ label: matchingRegion.name, href: `/region/${matchingRegion.id}` }] 
                  : island.prefecture 
                    ? [{ label: island.prefecture, href: '/map' }] 
                    : []),
                { label: island.name }
              ]} 
            />
          );
        })()}

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
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-w-0">
            <MapPin className="w-5 h-5 text-blue-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs text-slate-500 font-medium tracking-widest mb-1">面積</span>
            {island.area ? <span className="text-lg font-serif text-slate-800">{island.area} <span className="text-xs">km²</span></span> : <span className="text-sm font-serif text-slate-400">調査中</span>}
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-w-0">
            <Users className="w-5 h-5 text-blue-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs text-slate-500 font-medium tracking-widest mb-1">人口</span>
            {island.population ? <span className="text-lg font-serif text-slate-800">{island.population} <span className="text-xs">人</span></span> : <span className="text-sm font-serif text-slate-400">調査中</span>}
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-w-0">
            <Navigation className="w-5 h-5 text-blue-500 mb-2 shrink-0" strokeWidth={1.5} />
            <span className="text-xs text-slate-500 font-medium tracking-widest mb-1 shrink-0">アクセス</span>
            <span className="text-xs font-serif text-slate-800 leading-tight break-words w-full line-clamp-3">{island.access}</span>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-2xl shadow-sm border border-amber-100 flex flex-col items-center justify-center text-center min-w-0">
            <Star className="w-5 h-5 text-amber-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs text-amber-700 font-medium tracking-widest mb-1">公式到達ポイント</span>
            <span className="text-lg font-mono font-bold text-amber-600">{island.points || 0} <span className="text-xs">pt</span></span>
          </div>
        </div>

        {/* Practical Info Section */}
        <div className="mb-10 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-bold tracking-widest text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-slate-500" />
              インフラ・実用情報
            </h3>
            <span className="text-[10px] md:text-xs text-slate-500 font-medium">データ出典: 国土交通省 国土数値情報 / 各自治体公開データ等</span>
          </div>
          <div className="p-6">
            {island.is_uninhabited === true ? (
              <div className="text-center py-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold tracking-widest mb-2">無人島</span>
                <p className="text-sm text-slate-500 mt-3">この島は定住者がいない無人島のため、インフラ設備は基本的にありません。</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CreditCard className={`w-5 h-5 mb-2 ${island.has_atm === true ? 'text-blue-500' : island.has_atm === false ? 'text-rose-400' : 'text-slate-300'}`} />
                  <span className="text-xs text-slate-500 font-medium mb-1">ATM/郵便局</span>
                  <span className={`text-sm font-bold ${island.has_atm === true ? 'text-slate-800' : island.has_atm === false ? 'text-rose-500' : 'text-slate-400'}`}>
                    {island.has_atm === true ? 'あり' : island.has_atm === false ? 'なし' : '不明'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Stethoscope className={`w-5 h-5 mb-2 ${island.has_clinic === true ? 'text-emerald-500' : island.has_clinic === false ? 'text-rose-400' : 'text-slate-300'}`} />
                  <span className="text-xs text-slate-500 font-medium mb-1">診療所/病院</span>
                  <span className={`text-sm font-bold ${island.has_clinic === true ? 'text-slate-800' : island.has_clinic === false ? 'text-rose-500' : 'text-slate-400'}`}>
                    {island.has_clinic === true ? 'あり' : island.has_clinic === false ? 'なし' : '不明'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Store className={`w-5 h-5 mb-2 ${island.has_store === true ? 'text-amber-500' : island.has_store === false ? 'text-rose-400' : 'text-slate-300'}`} />
                  <span className="text-xs text-slate-500 font-medium mb-1">商店/売店</span>
                  <span className={`text-sm font-bold ${island.has_store === true ? 'text-slate-800' : island.has_store === false ? 'text-rose-500' : 'text-slate-400'}`}>
                    {island.has_store === true ? 'あり' : island.has_store === false ? 'なし' : '不明'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Wifi className={`w-5 h-5 mb-2 ${island.signal_status ? 'text-indigo-500' : 'text-slate-300'}`} />
                  <span className="text-xs text-slate-500 font-medium mb-1">携帯電波</span>
                  <span className={`text-sm font-bold ${island.signal_status ? 'text-slate-800' : 'text-slate-400'} leading-tight`}>
                    {island.signal_status || '不明'}
                  </span>
                </div>
              </div>
            )}
            {island.is_uninhabited !== true && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <Sunrise className="w-5 h-5 text-orange-400 shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 font-medium block">日帰り訪問</span>
                    <span className={`text-sm font-bold ${island.day_trip === true ? 'text-emerald-600' : island.day_trip === false ? 'text-rose-500' : 'text-slate-400'}`}>
                      {island.day_trip === true ? '本土・主要島から可能' : island.day_trip === false ? '宿泊推奨（船便都合など）' : '不明'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Communications & Disaster Info Section */}
        <div className="mb-10 bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
          <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-bold tracking-widest text-rose-800 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-rose-500" />
              通信環境・防災情報について
            </h3>
            <span className="text-[10px] md:text-xs text-rose-600 font-medium">※ご旅行前に必ずご確認ください</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-white border border-rose-100 shadow-sm">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1"><Radio className="w-4 h-4" /> 通信・電波状況</span>
                <span className="text-sm font-bold text-slate-800">各通信キャリアの提供エリアをご確認ください</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-white border border-rose-100 shadow-sm">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> 避難所・緊急連絡先</span>
                <span className="text-sm font-bold text-slate-800">各自治体の公式防災マップをご確認ください</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <Phone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                島内の通信環境は本土と異なり、集落を離れると携帯電話の電波が届かないエリアが存在する場合があります。気象条件によるフェリーの欠航や緊急時に備え、あらかじめ自治体（{island.prefecture}等）が発信している公式の防災情報や避難所マップをご確認いただくことを強く推奨します。
              </p>
            </div>
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



        {/* Practical Info Section */}
        {island.practical_info && (
          <div className="mb-12">
            <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-6 border-l-2 border-emerald-500 pl-3">旅のインフラ・実用情報</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`relative overflow-hidden group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${island.practical_info.has_convenience_store ? 'from-emerald-50 to-white border-emerald-200' : 'from-slate-50 to-white border-slate-200'}`}>
                <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Store className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${island.practical_info.has_convenience_store ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-800">{island.practical_info.has_convenience_store ? '商店・コンビニ' : '商店なし'}</span>
                    <span className={`text-[0.65rem] font-bold ${island.practical_info.has_convenience_store ? 'text-emerald-600' : 'text-slate-400'}`}>{island.practical_info.has_convenience_store ? '現地調達可能' : '事前の準備が必要'}</span>
                  </div>
                </div>
              </div>

              <div className={`relative overflow-hidden group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${island.practical_info.has_atm ? 'from-emerald-50 to-white border-emerald-200' : 'from-rose-50 to-white border-rose-200'}`}>
                <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <CreditCard className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${island.practical_info.has_atm ? 'bg-emerald-500 text-white' : 'bg-rose-400 text-white'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-800">{island.practical_info.has_atm ? 'ATM・現金' : 'ATMなし'}</span>
                    <span className={`text-[0.65rem] font-bold ${island.practical_info.has_atm ? 'text-emerald-600' : 'text-rose-500'}`}>{island.practical_info.has_atm ? '現地で引き出し可能' : '現金の持参が必須'}</span>
                  </div>
                </div>
              </div>

              <div className={`relative overflow-hidden group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${island.practical_info.has_clinic ? 'from-blue-50 to-white border-blue-200' : 'from-slate-50 to-white border-slate-200'}`}>
                <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Stethoscope className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${island.practical_info.has_clinic ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-800">{island.practical_info.has_clinic ? '診療所・病院' : '医療機関なし'}</span>
                    <span className={`text-[0.65rem] font-bold ${island.practical_info.has_clinic ? 'text-blue-600' : 'text-slate-400'}`}>{island.practical_info.has_clinic ? '急病時も安心' : '常備薬の持参を推奨'}</span>
                  </div>
                </div>
              </div>

              <div className={`relative overflow-hidden group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${island.practical_info.day_trip_possible ? 'from-indigo-50 to-white border-indigo-200' : 'from-orange-50 to-white border-orange-200'}`}>
                <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sunrise className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${island.practical_info.day_trip_possible ? 'bg-indigo-500 text-white' : 'bg-orange-500 text-white'}`}>
                    <Sunrise className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-800">{island.practical_info.day_trip_possible ? '日帰り観光' : '日帰り困難'}</span>
                    <span className={`text-[0.65rem] font-bold ${island.practical_info.day_trip_possible ? 'text-indigo-600' : 'text-orange-600'}`}>{island.practical_info.day_trip_possible ? '気軽な滞在が可能' : '宿泊施設の手配が必須'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deep Parameters Section (Starry Sky, Transparency, etc.) */}
        {island.practical_info && island.practical_info.transparency_level && (
          <div className="mb-12">
            <div className="bg-gradient-to-br from-slate-900 via-[#0a192f] to-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800/80 relative overflow-hidden">
              {/* Glowing background blob */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
              
              <h2 className="text-sm font-bold tracking-[0.2em] text-white mb-8 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>ISLAND PARAMETERS</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="group">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-bold text-blue-200 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform"/> 海の透明度
                    </span>
                    <span className="text-lg font-mono font-bold text-white drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]">{island.practical_info.transparency_level}<span className="text-xs text-blue-400/70">/10</span></span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-3 backdrop-blur-sm border border-slate-700/50 overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }} whileInView={{ width: `${island.practical_info.transparency_level * 10}%` }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeOut" }}
                      className="bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300 h-full rounded-full shadow-[0_0_15px_rgba(56,189,248,0.6)] relative"
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/40 rounded-full"></div>
                    </motion.div>
                  </div>
                </div>

                <div className="group">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-bold text-indigo-200 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform"/> 星空の美しさ
                    </span>
                    <span className="text-lg font-mono font-bold text-white drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]">{island.practical_info.starry_sky_level}<span className="text-xs text-indigo-400/70">/10</span></span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-3 backdrop-blur-sm border border-slate-700/50 overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }} whileInView={{ width: `${island.practical_info.starry_sky_level * 10}%` }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                      className="bg-gradient-to-r from-indigo-600 via-indigo-400 to-purple-400 h-full rounded-full shadow-[0_0_15px_rgba(129,140,248,0.6)] relative"
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/40 rounded-full"></div>
                    </motion.div>
                  </div>
                </div>

                <div className="group">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-bold text-emerald-200 flex items-center gap-2">
                      <Mountain className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform"/> 秘境度
                    </span>
                    <span className="text-lg font-mono font-bold text-white drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">{island.practical_info.seclusion_level}<span className="text-xs text-emerald-400/70">/10</span></span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-3 backdrop-blur-sm border border-slate-700/50 overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }} whileInView={{ width: `${island.practical_info.seclusion_level * 10}%` }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                      className="bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 h-full rounded-full shadow-[0_0_15px_rgba(52,211,153,0.6)] relative"
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/40 rounded-full"></div>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Special Tags */}
              <div className="col-span-1 md:col-span-3 flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-700/50 relative z-10">
                {island.practical_info.has_sauna && (
                  <div className="px-4 py-2 bg-gradient-to-r from-rose-500/10 to-orange-500/10 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30 flex items-center gap-2 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                    <span className="text-base">♨️</span> サウナ・温泉あり
                  </div>
                )}
                {island.practical_info.camping_level >= 5 && (
                  <div className="px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <span className="text-base">🏕️</span> キャンプ好適地 (Lv.{island.practical_info.camping_level})
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description (Self-Contained Article) */}
        <div className="mb-12">
          <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-blue-500 pl-3">島の特徴・詳細解説</h2>
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
            <p className="text-slate-700 leading-relaxed font-serif text-[1.05rem] whitespace-pre-line tracking-wide">
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
            <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-blue-500 pl-3">生活・観光インフラ情報</h2>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(island.flags).map(([key, val]) => {
                if (key === '陸地座標実証済') return null;
                const strVal = String(val);
                const isYes = val === 'yes' || strVal.includes('可能') || strVal.includes('あり');
                const isWarning = strVal.includes('弱い') || strVal.includes('要') || strVal.includes('注意');
                const isNo = val === 'no' || strVal === 'なし';

                return (
                  <div key={key} className={`px-3.5 py-2 rounded-2xl text-xs font-medium tracking-wide border flex items-center gap-1.5 shadow-sm ${
                    isYes ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200' : 
                    isWarning ? 'bg-amber-50/80 text-amber-800 border-amber-200' : 
                    isNo ? 'bg-rose-50/80 text-rose-800 border-rose-200' : 
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {flagIcons[key] || <CheckSquare className="w-3.5 h-3.5 opacity-70 shrink-0" />}
                    <span className="font-bold text-slate-900">{key}:</span> 
                    <span>{val === 'yes' ? 'あり' : val === 'no' ? 'なし' : strVal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* KIRATABI Guide Link */}
        <div className="mb-12">
          <a
            href={getGuideUrl(island.name, island.guide_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 flex items-center justify-between group hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-blue-50 group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm md:text-base">KIRATABIガイドで詳しく見る</h3>
                <p className="text-xs text-slate-500 mt-1">観光スポットやアクセス情報をチェック</p>
              </div>
            </div>
            <ExternalLink size={20} className="text-blue-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </a>
        </div>

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

        {/* Island Diaries (島ログ) - SEOのために初期データを渡す */}
        <IslandDiaries islandId={islandId} islandName={island.name} initialDiaries={initialDiaries} />

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
          
          {status !== 'visited' && status !== 'verified_visited' && (
            <button 
              onClick={() => handleStatusChange('planning')}
              className={`flex-1 max-w-xs py-4 rounded-2xl font-bold tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-2
                ${status === 'planning' ? 'bg-amber-500 text-white shadow-amber-500/25 scale-[1.02]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Star className="w-4 h-4" /> 行きたい ({status === 'planning' ? '検討中' : '登録'})
            </button>
          )}

          {status !== 'none' && (
            <button
              onClick={handleCancelRecord}
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
        onOpenCertificate={() => {
          setIsCheckInModalOpen(false);
          setIsCertModalOpen(true);
        }}
        island={island}
      />
    </main>
  );
}

