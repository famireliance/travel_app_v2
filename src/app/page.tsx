'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Search, Map, Compass, User, Droplets, Moon, Wind, BedDouble, ChevronRight, ChevronLeft, Waves, MapPin, Menu, ArrowRight, Sparkles, Coffee, Heart, Flame, Bot, Award, X, Star, MessageCircle, CheckCircle, AlertTriangle, Users, Trophy, Medal } from 'lucide-react';
import regionsData from '../data/regions.json';
import heroSlides from '../data/hero_slides.json';
import SearchModal from '@/components/SearchModal';
import AuthModal from '@/components/AuthModal';
import CompanionModal from '@/components/CompanionModal';
import NearbyIslandsModal, { NearbyIslandItem } from '@/components/NearbyIslandsModal';
import { useTravel } from '@/context/TravelContext';
import { supabase, fetchAllIslands, fetchSiteSettings, fetchAdCampaigns } from '@/lib/supabase';
import BannerCarousel from '@/components/BannerCarousel';
import { calculateDistanceKm } from '@/lib/geo';
import { toast } from 'react-hot-toast';


const ALL_ISLANDS_COUNT = 432;

const getIslandIdFromLocation = (location: string) => {
  if (location.includes('西表')) return '396';
  if (location.includes('小笠原')) return '63';
  if (location.includes('与那国')) return '401';
  if (location.includes('宮古')) return '386';
  if (location.includes('粟国')) return '382';
  return null;
};

const getFallbackPlaceholder = (areaOrPrefecture: string) => {
  if (!areaOrPrefecture) return '/region/subtropical.jpg';
  if (areaOrPrefecture.includes('沖縄')) return '/region/tropical.jpg';
  if (areaOrPrefecture.includes('北海道') || areaOrPrefecture.includes('東北') || areaOrPrefecture.includes('北陸')) return '/region/northern.jpg';
  if (areaOrPrefecture.includes('四国') || areaOrPrefecture.includes('中国') || areaOrPrefecture.includes('近畿')) return '/region/setouchi.jpg';
  if (areaOrPrefecture.includes('関東') || areaOrPrefecture.includes('伊豆') || areaOrPrefecture.includes('小笠原')) return '/region/volcanic.jpg';
  if (areaOrPrefecture.includes('九州')) return '/region/subtropical.jpg';
  return '/region/subtropical.jpg';
};

export default function Home() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [nearbyItems, setNearbyItems] = useState<NearbyIslandItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allIslands, setAllIslands] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [adCampaigns, setAdCampaigns] = useState<any[]>([]);
  const [topRankers, setTopRankers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedAreaTab, setSelectedAreaTab] = useState<string>('全て');
  const { user, totalVisited, companionChar, companionStage, islandStatuses, totalPoints } = useTravel();
  const totalIslandsCount = useMemo(() => allIslands.length || 432, [allIslands]);
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 500], [0, 150]);
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  // サーバーサイドとクライアントサイドでhydreation不一致を防ぐための空配列またはデフォルトを保証する
  const slides = heroSlides.length > 0 ? heroSlides : [
    { type: 'image', src: "/hero/slide1.webp", title: ["まだ見ぬ青を、", "探す旅へ。"], location: "宮古島 (沖縄県)" }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [authNotification, setAuthNotification] = useState<{text: string, type: 'success'|'error'} | null>(null);



  useEffect(() => {
    // スクロール位置の復元
    const handleRestore = () => {
      const savedScrollY = sessionStorage.getItem('kiratabi_top_scroll');
      if (savedScrollY) {
        window.scrollTo({ top: parseInt(savedScrollY, 10), behavior: 'instant' });
      }
    };
    
    const timer = setTimeout(handleRestore, 100);
    
    const handleScroll = () => {
      sessionStorage.setItem('kiratabi_top_scroll', window.scrollY.toString());
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // ランダムな初期スライドを設定
    setCurrentSlide(Math.floor(Math.random() * slides.length));
    setIsMounted(true);
    fetchAllIslands().then(data => {
      if (data) setAllIslands(data);
    }).catch(() => {});
    fetchSiteSettings().then(data => {
      if (data) setSiteSettings(data);
    });
    fetchAdCampaigns().then(data => {
      setAdCampaigns(data || []);
    });
    supabase.from('user_ranking_view').select('*').order('visited', { ascending: false }).limit(3).then(({ data }) => {
      if (data) setTopRankers(data);
    });

    // メール確認リンクから戻ってきた場合の通知
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_success')) {
      setAuthNotification({ text: '✅ メールアドレスが確認されました！ようこそ、kiratabiへ！', type: 'success' });
      window.history.replaceState({}, '', '/');
      setTimeout(() => setAuthNotification(null), 6000);
    } else if (params.get('auth_error')) {
      setAuthNotification({ text: `⚠️ ${params.get('auth_error')}`, type: 'error' });
      window.history.replaceState({}, '', '/');
      setTimeout(() => setAuthNotification(null), 8000);
    }
  }, []);

  const handleCheckout = async (tier: 'premium' | 'ultimate') => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url; // Stripeのチェックアウト画面へ遷移
    } catch (err: any) {
      toast.error(err.message || 'サブスクリプション手続きの開始に失敗しました');
    }
  };



  useEffect(() => {
    if (selectedCategory && categoryRef.current) {
      setTimeout(() => {
        categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedRegionId && regionRef.current) {
      setTimeout(() => {
        regionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedRegionId]);

  // 【100%厳格検証済マスター】誤情報・推測抽出を排除し、実在施設・国際認定・国立公園実績が実証された島のみを抽出
  const selectedCategoryIslands = useMemo(() => {
    if (!selectedCategory || !allIslands.length) return [];
    
    // カテゴリーごとの厳格なファクトチェック済み島名リスト
    const VERIFIED_CATEGORY_MAP: Record<string, string[]> = {
      'transparency': ['座間味島', '阿嘉島', '渡嘉敷島', '宮古島', '伊良部島', '下地島', '池間島', '来間島'],
      'stars': ['波照間島', '神津島', '石垣島', '西表島', '竹富島', '小浜島', '黒島'],
      'retreat': ['直島', '豊島（香川）', '小豆島', '古宇利島', '瀬底島', '生口島', '竹富島', '与論島'],
      'family': ['石垣島', '宮古島', '淡路島', '伊豆大島', '佐渡島', '小豆島', '初島'],
      'onsen_sauna': ['式根島', '屋久島', '硫黄島（鹿児島）', '八丈島', '直島', '桜島'],
      'luxury': ['宮古島', '伊良部島', '石垣島', '小浜島', '屋久島', '奄美大島', '淡路島'],
      'remote': ['青ヶ島', '南大東島', '北大東島', '悪石島', '宝島', '与那国島', '波照間島'],
      'nature': ['西表島', '屋久島', '知床', '父島', '母島', '奄美大島', '徳之島', '御蔵島'],
      'gourmet': ['淡路島', '小豆島', '壱岐島', '福江島', '利尻島', '礼文島', '佐渡島', '隠岐'],
      'daytrip': ['江の島', '猿島', '友ヶ島', '能古島', '日間賀島', '佐久島', '相島', '水納島', '伊江島']
    };

    const targetNames = VERIFIED_CATEGORY_MAP[selectedCategory] || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return allIslands.filter((island: any) => {
      const name = island.name || '';
      return targetNames.some((verifiedName: string) => {
        const cleanName = verifiedName.split('（')[0]; // 「豊島（香川）」などを「豊島」としてマッチングさせる
        return name === cleanName || name.includes(cleanName) || cleanName.includes(name);
      });
    }).sort((a, b) => {
      const getIndex = (islandName: string) => targetNames.findIndex(n => {
        const clean = n.split('（')[0];
        return islandName === clean || islandName.includes(clean) || clean.includes(islandName);
      });
      return getIndex(a.name || '') - getIndex(b.name || '');
    });
  }, [selectedCategory, allIslands]);

  const selectedRegionObj = useMemo(() => {
    if (!selectedRegionId) return null;
    return regionsData.find(r => r.id === selectedRegionId) || null;
  }, [selectedRegionId]);

  const selectedRegionIslands = useMemo(() => {
    if (!selectedRegionId || !allIslands.length) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return allIslands.filter((island: any) => island.region_id === selectedRegionId);
  }, [selectedRegionId, allIslands]);

  const kiratabiChoice = useMemo(() => {
    const list = ['宮古島', '石垣島', '父島', '屋久島', '奄美大島', '佐渡島', '直島', '淡路島', '西表島'];
    return allIslands.filter(i => list.some(name => i.name === name || i.name.includes(name)))
      .sort((a, b) => {
        const getIdx = (n: string) => list.findIndex(l => n === l || n.includes(l));
        return getIdx(a.name) - getIdx(b.name);
      });
  }, [allIslands]);

  const recommendedForWomen = useMemo(() => {
    const list = ['直島', '小豆島', '淡路島', '宮古島', '竹富島', '江の島'];
    return allIslands.filter(i => list.some(name => i.name === name || i.name.includes(name)))
      .sort((a, b) => {
        const getIdx = (n: string) => list.findIndex(l => n === l || n.includes(l));
        return getIdx(a.name) - getIdx(b.name);
      });
  }, [allIslands]);

  const recommendedForFamilies = useMemo(() => {
    const list = ['淡路島', '宮古島', '石垣島', '小豆島', '初島', '瀬底島', '沖縄本島'];
    return allIslands.filter(i => list.some(name => i.name === name || i.name.includes(name)))
      .sort((a, b) => {
        const getIdx = (n: string) => list.findIndex(l => n === l || n.includes(l));
        return getIdx(a.name) - getIdx(b.name);
      });
  }, [allIslands]);

  const easilyAccessible = useMemo(() => {
    const list = ['淡路島', '江の島', '瀬底島', '古宇利島', '宮古島', '石垣島', '八丈島', '奄美大島'];
    return allIslands.filter(i => list.some(name => i.name === name || i.name.includes(name)))
      .sort((a, b) => {
        const getIdx = (n: string) => list.findIndex(l => n === l || n.includes(l));
        return getIdx(a.name) - getIdx(b.name);
      });
  }, [allIslands]);


  useEffect(() => {
    if (!isMounted || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
     
  }, [isMounted, currentSlide, slides.length]); // currentSlideが変更されたらタイマーをリセット

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  
  const navBg = useTransform(scrollY, [0, 100], ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)']);
  const navColor = useTransform(scrollY, [0, 100], ['rgba(255, 255, 255, 1)', 'rgba(15, 23, 42, 1)']);
  const navBorder = useTransform(scrollY, [0, 100], ['rgba(226, 232, 240, 0)', 'rgba(226, 232, 240, 0.8)']);

  const allRegions = regionsData;

  const progressPct = (totalVisited / ALL_ISLANDS_COUNT) * 100;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-[120px] relative font-sans text-slate-800 selection:bg-blue-900 selection:text-white">
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* メール認証完了/エラー通知トースト */}
      <AnimatePresence>
        {authNotification && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[10000] px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold max-w-sm w-full text-center ${
              authNotification.type === 'success' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-rose-500 text-white'
            }`}
          >
            {authNotification.text}
          </motion.div>
        )}
      </AnimatePresence>
      

      {/* Premium Minimalist Nav */}
      <motion.div 
        className="sticky top-0 left-0 right-0 z-50 px-6 lg:px-12 py-3.5 lg:py-4 flex items-center justify-between backdrop-blur-xl transition-all"
        style={{ backgroundColor: navBg, borderBottomWidth: 1, borderBottomColor: navBorder }}
      >
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <motion.div style={{ color: navColor }}>
            <Waves size={24} strokeWidth={1.5} />
          </motion.div>
          <motion.span 
            className="font-serif font-bold text-sm lg:text-base tracking-[0.1em] flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5"
            style={{ color: navColor }}
          >
            <span>キラ旅</span>
            <span className="text-[0.65rem] lg:text-xs opacity-80">KIRATABI</span>
          </motion.span>
        </div>
        
        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8 mr-8">
          <motion.button onClick={() => setIsSearchOpen(true)} className="text-sm font-medium tracking-widest text-slate-800 hover:text-blue-600 transition-colors" style={{ color: navColor }}>探す</motion.button>
          <motion.button onClick={() => router.push('/map')} className="text-sm font-medium tracking-widest text-slate-800 hover:text-blue-600 transition-colors" style={{ color: navColor }}>マップ</motion.button>
          <motion.button onClick={() => router.push('/timeline')} className="text-sm font-medium tracking-widest text-slate-800 hover:text-blue-600 transition-colors" style={{ color: navColor }}>みんなの島ノート</motion.button>
          <motion.button onClick={() => setIsCompanionModalOpen(true)} className="text-sm font-medium tracking-widest text-slate-800 hover:text-blue-600 transition-colors" style={{ color: navColor }}>図鑑</motion.button>
          <motion.button onClick={() => { if (user) router.push('/mypage'); else setIsAuthOpen(true); }} className="text-sm font-medium tracking-widest text-slate-800 hover:text-blue-600 transition-colors" style={{ color: navColor }}>
            {user ? 'マイページ' : 'ログイン'}
          </motion.button>
        </div>

        {/* Mobile Icons */}
        <div className="flex md:hidden items-center gap-5">
          <motion.div style={{ color: navColor }} className="cursor-pointer hover:opacity-70 transition-opacity" onClick={() => router.push('/map')}>
            <Map size={22} strokeWidth={1.5} />
          </motion.div>
          <motion.div style={{ color: navColor }} className="cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setIsSearchOpen(true)}>
            <Search size={22} strokeWidth={1.5} />
          </motion.div>
          <motion.div style={{ color: navColor }} className="cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu size={22} strokeWidth={1.5} />
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky top-[60px] left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-6 shadow-xl flex flex-col gap-4 md:hidden"
          >
            <button
              onClick={() => { setIsMobileMenuOpen(false); setIsSearchOpen(true); }}
              className="text-left font-serif text-base text-slate-800 py-2 border-b border-slate-100 flex items-center gap-3"
            >
              <Search size={18} /> 探す
            </button>
            <button
              onClick={() => { setIsMobileMenuOpen(false); router.push('/map'); }}
              className="text-left font-serif text-base text-slate-800 py-2 border-b border-slate-100 flex items-center gap-3"
            >
              <Map size={18} /> マップ
            </button>
            <button
              onClick={() => { setIsMobileMenuOpen(false); router.push('/timeline'); }}
              className="text-left font-serif text-base text-slate-800 py-2 border-b border-slate-100 flex items-center gap-3"
            >
              <MessageCircle size={18} /> みんなの島ノート
            </button>
            <button
              onClick={() => { setIsMobileMenuOpen(false); setIsCompanionModalOpen(true); }}
              className="text-left font-serif text-base text-slate-800 py-2 border-b border-slate-100 flex items-center gap-3"
            >
              <Sparkles size={18} /> 図鑑
            </button>
            <button
              onClick={() => { setIsMobileMenuOpen(false); if (user) router.push('/mypage'); else setIsAuthOpen(true); }}
              className="text-left font-serif text-base text-slate-800 py-2 flex items-center gap-3"
            >
              <User size={18} /> {user ? 'マイページ' : 'ログイン'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Campaign Banner (Carousel) */}
      {isMounted && adCampaigns.length > 0 && (
        <BannerCarousel campaigns={adCampaigns} marginTop="mt-[65px] lg:mt-[80px]" />
      )}

      {/* Cinematic Hero Section */}
      <div className={`relative ${adCampaigns.length > 0 ? 'min-h-[75dvh]' : 'min-h-[85dvh] lg:min-h-[90dvh]'} w-full overflow-hidden flex flex-col justify-end items-center -mt-[64px] pt-24`}>
        {/* Subtle Ken Burns Effect */}
        <motion.div 
          className="absolute -inset-[10%] z-0 h-[120%] overflow-hidden bg-slate-900"
          style={{ y: headerY }}
        >
          <AnimatePresence mode="wait">
            {isMounted && slides[currentSlide] && slides[currentSlide].type === 'video' ? (
              <motion.video 
                key={`video-${currentSlide}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                src={slides[currentSlide].src} 
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
              />
            ) : (
              <motion.img 
                key={`image-${currentSlide}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                src={isMounted && slides[currentSlide] ? slides[currentSlide].src : slides[0].src} 
                alt="Hero Background" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Elegant Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        
        <motion.div 
          className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pb-12 lg:pb-32 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12"
          style={{ opacity: headerOpacity, y: headerY }}
        >
          <div className="mb-4 lg:mb-0 shrink-0 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSlide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="sr-only">日本の離島{totalIslandsCount}島を制覇しよう</h1>
                <h2 className="font-serif text-3xl md:text-5xl lg:text-[4rem] font-light text-white leading-snug md:leading-[1.3] tracking-widest drop-shadow-lg mb-6 max-w-2xl break-words">
                  {isMounted && slides[currentSlide] ? slides[currentSlide].title[0] : slides[0].title[0]}<br />
                  {isMounted && slides[currentSlide] ? slides[currentSlide].title[1] : slides[0].title[1]}
                </h2>
                <div 
                  className="flex items-center gap-2 text-white/90 mb-4 bg-black/20 hover:bg-black/40 backdrop-blur-sm w-fit px-3 py-1.5 rounded-full border border-white/10 cursor-pointer transition-colors group/loc"
                  onClick={() => {
                    const loc = isMounted && slides[currentSlide] ? slides[currentSlide].location : slides[0].location;
                    const id = getIslandIdFromLocation(loc);
                    if (id) router.push(`/island/${id}`);
                  }}
                >
                  <MapPin size={14} className="opacity-80 group-hover/loc:scale-110 transition-transform" />
                  <span className="text-xs font-medium tracking-widest">{isMounted && slides[currentSlide] ? slides[currentSlide].location : slides[0].location}</span>
                  <ArrowRight size={14} className="ml-1 opacity-50 group-hover/loc:opacity-100 group-hover/loc:translate-x-1 transition-all" />
                </div>
              </motion.div>
            </AnimatePresence>
            <p className="text-white/80 text-xs md:text-sm font-medium tracking-[0.4em] uppercase drop-shadow-sm mb-6">Japan Islands - {totalIslandsCount} Destinations</p>

            {/* Manual Navigation Controls */}
            {isMounted && slides.length > 1 && (
              <div className="flex items-center gap-4">
                <button onClick={prevSlide} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all">
                  <ChevronLeft size={18} strokeWidth={2} />
                </button>
                <button onClick={nextSlide} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all">
                  <ChevronRight size={18} strokeWidth={2} />
                </button>
                <div className="flex gap-2 ml-4">
                  {slides.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Premium Glass Dashboard */}
          <div className="bg-white/10 backdrop-blur-2xl p-5 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden group w-full lg:w-[380px] shrink-0">
            <div className="flex justify-between items-end mb-4 relative z-10">
              <div>
                <p className="text-[0.6rem] font-medium text-white/60 tracking-[0.2em] uppercase mb-1">Your Voyage</p>
                <h2 className="font-serif text-base text-white tracking-wider">到達アイランド</h2>
              </div>
              <div className="text-right">
                <span className="font-serif text-3xl font-light text-white tracking-tighter">{totalVisited}</span>
                <span className="text-xs font-light text-white/70 ml-1">島</span>
              </div>
            </div>
            
            <div className="w-full h-[2px] bg-white/20 rounded-full overflow-hidden relative z-10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `100%` }}
                transition={{ duration: 2, ease: "circOut", delay: 0.5 }}
                className="h-full bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)]"
              />
            </div>
            <div className="flex justify-between items-center mt-3 text-[0.6rem] font-medium text-white/70 tracking-widest relative z-10">
              <span className="text-white">日本全国離島めぐり</span>
              <span className="text-amber-300">★ 累計 {totalPoints.toLocaleString()} pt</span>
            </div>

            {/* 守護パートナー精霊・進化ステータスウィジェット */}
            {companionChar && companionStage && (
              <div 
                onClick={() => setIsCompanionModalOpen(true)}
                className="mt-4 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all cursor-pointer group/comp relative z-10 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${companionStage.badgeGradient} flex items-center justify-center text-4xl shadow-sm border border-white/60 shrink-0 group-hover/comp:scale-105 transition-transform overflow-hidden`}>
                    {(companionChar as any).image_url ? (
                      <img src={(companionChar as any).image_url} alt={companionChar.name} className={`w-full h-full object-cover ${((user as any)?.subscription_tier === 'premium' || (user as any)?.subscription_tier === 'ultimate') ? 'hologram-effect' : ''}`} />
                    ) : companionStage.image ? (
                      <img src={companionStage.image} alt={companionStage.name} className={`w-full h-full object-cover ${((user as any)?.subscription_tier === 'premium' || (user as any)?.subscription_tier === 'ultimate') ? 'hologram-effect' : ''}`} />
                    ) : (
                      companionStage.icon
                    )}
                  </div>
                  <div>
                    <span className="text-[0.6rem] font-bold tracking-wider uppercase text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>同行守護精霊 (STAGE {companionStage.stage})</span>
                    </span>
                    <p className="text-xs font-bold text-white mt-0.5 group-hover/comp:underline leading-snug break-all">
                      {companionStage.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[0.65rem] text-blue-200 font-bold block group-hover/comp:text-white transition-colors">
                    図鑑/チェンジ
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/70 ml-auto mt-0.5 group-hover/comp:translate-x-1 transition-transform" />
                </div>
              </div>
            )}

            {/* アクションボタン群 */}
            <div className="mt-4 space-y-2.5 relative z-10">
              {/* メインボタン：チェックイン（未ログイン時はログイン誘導） */}
              {!user ? (
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-all hover:scale-[1.02]"
                >
                  <MapPin size={18} />
                  <span>ログインしてチェックイン</span>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (!navigator.geolocation) {
                      toast.error('お使いのブラウザは位置情報機能（GPS）をサポートしていません。');
                      return;
                    }
                    const btn = document.getElementById('top-checkin-btn-text');
                    if (btn) btn.innerText = 'GPSで検索中...';
                    
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const { latitude: userLat, longitude: userLng } = position.coords;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        let closestIsland: any = null;
                        let minDistance = Infinity;

                        allIslands.forEach(island => {
                          if (island.coordinates) {
                            const [islandLatStr, islandLngStr] = island.coordinates.split(',').map((s: string) => s.trim());
                            const distance = calculateDistanceKm(userLat, userLng, parseFloat(islandLatStr), parseFloat(islandLngStr));
                            if (distance < minDistance) {
                              minDistance = distance;
                              closestIsland = island;
                            }
                          }
                        });

                        if (btn) btn.innerText = '現在地からチェックイン';

                        if (closestIsland) {
                          const radiusKm = (closestIsland.checkin_radius_m || 5000) / 1000;
                          const distText = minDistance < 1 ? `${Math.round(minDistance * 1000)}m` : `${minDistance.toFixed(1)}km`;
                          
                          if (minDistance <= radiusKm) {
                            toast.success(`🎯 「${closestIsland.name}」エリア内です！チェックイン画面へ移動します`);
                          } else {
                            toast(`🧭 最寄りの島は「${closestIsland.name}」（約${distText}）です。チェックイン可能範囲外のため詳細ページをご案内します。`, { icon: 'ℹ️' });
                          }
                          router.push(`/island/${closestIsland.id}`);
                        } else {
                          toast.error('島データが見つかりませんでした。');
                        }
                      },
                      () => {
                        if (btn) btn.innerText = '現在地からチェックイン';
                        toast.error('現在地の取得に失敗しました。GPS許可を確認してください。');
                      },
                      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-all hover:scale-[1.02]"
                >
                  <MapPin size={18} />
                  <span id="top-checkin-btn-text">現在地からチェックイン</span>
                </button>
              )}

              {/* サブボタン：現在地から近くの島を探す（誰でも利用可能） */}
              <button 
                onClick={() => {
                  if (!navigator.geolocation) {
                    toast.error('お使いのブラウザは位置情報機能（GPS）をサポートしていません。');
                    return;
                  }
                  toast('GPSで現在地周辺の島を探索中...', { icon: '🔍' });
                  
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude: userLat, longitude: userLng } = position.coords;
                      const calculatedItems: NearbyIslandItem[] = [];

                      allIslands.forEach(island => {
                        if (island.coordinates) {
                          const [islandLatStr, islandLngStr] = island.coordinates.split(',').map((s: string) => s.trim());
                          const distanceKm = calculateDistanceKm(userLat, userLng, parseFloat(islandLatStr), parseFloat(islandLngStr));
                          const checkinRadiusKm = (island.checkin_radius_m || 5000) / 1000;
                          calculatedItems.push({
                            island,
                            distanceKm,
                            isWithinCheckinRadius: distanceKm <= checkinRadiusKm
                          });
                        }
                      });

                      calculatedItems.sort((a, b) => a.distanceKm - b.distanceKm);

                      const top5 = calculatedItems.slice(0, 5);
                      setNearbyItems(top5);
                      setIsNearbyModalOpen(true);
                    },
                    () => {
                      toast.error('現在地の取得に失敗しました。GPSを許可してください。');
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                }}
                className="w-full py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold tracking-widest text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Compass size={15} className="text-cyan-300" />
                <span>現在地から近くの島を探す</span>
              </button>

              {/* サブボタン：AIルートプランナーへのリンク */}
              <button 
                onClick={() => router.push('/route-planner')}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold tracking-widest text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Sparkles size={15} className="text-amber-300" />
                <span>AI アイランドホッピング提案</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky Navigation for Mobile */}
      <div className="sticky top-[env(safe-area-inset-top)] sm:top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm py-3 px-4 flex gap-4 overflow-x-auto hide-scrollbar snap-x">
        <button onClick={() => router.push('/map')} className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full snap-start transition-colors flex items-center gap-1.5 shadow-sm border border-slate-200">
          <Map className="w-3.5 h-3.5" /> マップから探す
        </button>
        <button onClick={() => { regionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full snap-start transition-colors flex items-center gap-1.5 shadow-sm border border-slate-200">
          <Compass className="w-3.5 h-3.5" /> 諸島一覧
        </button>
        <button onClick={() => { categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full snap-start transition-colors flex items-center gap-1.5 shadow-sm border border-slate-200">
          <Sparkles className="w-3.5 h-3.5" /> テーマ別
        </button>
        <button onClick={() => document.getElementById('ranking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full snap-start transition-colors flex items-center gap-1.5 shadow-sm border border-slate-200">
          <Trophy className="w-3.5 h-3.5" /> ランキング
        </button>
      </div>

      {/* Top Ranking Widget */}
      {isMounted && topRankers.length > 0 && (
        <div id="ranking-section" className="px-8 lg:px-12 pt-16 pb-8 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 lg:p-10 border border-blue-100 shadow-sm">
            <div className="lg:w-1/3 text-center lg:text-left">
              <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-blue-600 mb-2">TOP TRAVELERS</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-slate-900 tracking-widest flex items-center justify-center lg:justify-start gap-2 mb-4">
                <Trophy className="text-amber-500 w-6 h-6 lg:w-8 lg:h-8" />
                トップトラベラー
              </h2>
              <p className="text-sm text-slate-600 mb-6">全国の島巡りプレイヤーの頂点。<br/>あなたも冒険に出かけてランキング入りを目指そう！</p>
              <button 
                onClick={() => router.push('/ranking')}
                className="px-6 py-2.5 bg-white text-blue-600 border border-blue-200 font-bold rounded-full shadow-sm hover:bg-blue-50 transition-colors text-sm"
              >
                ランキング全体を見る
              </button>
            </div>
            <div className="lg:w-2/3 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
              {topRankers.slice(0, 3).map((ranker, idx) => (
                <div key={ranker.id} className={`relative bg-white rounded-2xl p-5 shadow-sm border transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col items-center text-center ${idx === 0 ? 'border-amber-200 bg-gradient-to-b from-white to-amber-50/30' : idx === 1 ? 'border-slate-200' : 'border-orange-200 bg-gradient-to-b from-white to-orange-50/30'}`} onClick={() => router.push('/ranking')}>
                  {/* Rank Badge */}
                  <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-md ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-orange-500'}`}>
                    {idx + 1}
                  </div>
                  
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl mb-3 shadow-inner border-2 ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-100 to-amber-200 text-amber-700 border-amber-300 shadow-amber-500/20' : 
                    idx === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-700 border-slate-300 shadow-slate-500/20' :
                    'bg-gradient-to-br from-orange-50 to-orange-200 text-orange-800 border-orange-300 shadow-orange-500/20'
                  }`}>
                    {idx === 0 ? <Trophy size={24} className="drop-shadow-sm" /> : idx === 1 ? <Medal size={24} className="drop-shadow-sm" /> : <Medal size={24} className="drop-shadow-sm" />}
                  </div>
                  
                  <h3 className="font-bold text-slate-800 w-full truncate mb-1">{ranker.username}</h3>
                  <span className="text-[0.65rem] px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full mb-3">{ranker.title}</span>
                  
                  <div className="w-full space-y-2 mt-auto">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 bg-white/60 p-1.5 rounded-lg border border-slate-100">
                      <span className="flex items-center gap-1"><Compass size={12} className="text-blue-500"/> 島数</span>
                      <span className="font-bold">{ranker.visited}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 bg-white/60 p-1.5 rounded-lg border border-slate-100">
                      <span className="flex items-center gap-1"><Star size={12} className="text-amber-500"/> XP</span>
                      <span className="font-bold text-amber-600">{ranker.points.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Fill empty spots if less than 3 rankers */}
              {Array.from({ length: Math.max(0, 3 - topRankers.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-slate-50/50 rounded-2xl p-5 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-70">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 mb-3" />
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured & Popular Islands Section */}
      {isMounted && allIslands.filter(i => i.is_featured).length > 0 && (
        <div className="px-8 lg:px-12 pt-20 lg:pt-28 pb-10 bg-white">
          <div className="mb-10 flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-amber-500 mb-2">TOP RATED ISLANDS</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-slate-900 tracking-widest flex items-center gap-2">
                <Star className="text-amber-400 fill-amber-400 w-6 h-6 lg:w-8 lg:h-8" />
                人気の島ランキング
              </h2>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 hide-scrollbar max-w-7xl mx-auto snap-x px-4 lg:px-0 scroll-pl-4 lg:scroll-pl-0 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none lg:hidden" />
            {allIslands.filter(i => i.is_featured).map((island, idx) => (
              <div 
                key={`featured-${island.id}-${idx}`}
                onClick={() => router.push(`/island/${island.id}`)}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-amber-500/10 transition-all hover:-translate-y-1 relative"
              >
                <div className="absolute top-0 left-5 z-10 w-10 h-12 bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-lg flex flex-col items-center justify-center font-bold font-serif shadow-amber-500/30 rounded-b-lg">
                  <span className="text-[0.55rem] leading-none mb-0.5 opacity-90">No.</span>
                  <span className="text-xl leading-none">{idx + 1}</span>
                </div>
                <div className="h-40 bg-slate-200 relative overflow-hidden">
                  <img src={island.hero_image_url || island.image_url || `/region/${island.region_id}.jpg`} alt={island.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    const fallback = getFallbackPlaceholder(island.prefecture || '');
                    if (!t.src.endsWith(fallback)) {
                      t.src = fallback;
                    } else {
                      t.style.display = 'none';
                    }
                  }} />
                </div>
                <div className="p-5">
                  <div className="text-[0.65rem] font-bold text-slate-400 tracking-widest mb-1">{island.prefecture}</div>
                  <h3 className="font-serif text-lg font-bold text-slate-800 mb-2 group-hover:text-amber-600 transition-colors">{island.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{island.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Islands Section Header */}
      {isMounted && (
        <div className="px-8 lg:px-12 pt-20 pb-4 bg-white text-center">
          <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-blue-600 mb-2">CURATED FOR YOU</p>
          <h2 className="font-serif text-2xl lg:text-3xl text-slate-900 tracking-widest">目的別おすすめの島</h2>
          <div className="w-12 h-[1.5px] bg-blue-600 mx-auto mt-6" />
        </div>
      )}

      {/* KIRATABI's Recommendations Section */}
      {isMounted && kiratabiChoice.length > 0 && (
        <div className="px-8 lg:px-12 pt-10 pb-10 bg-white">
          <div className="mb-8 flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-amber-500 mb-1">KIRATABI'S CHOICE</p>
              <h2 className="font-serif text-xl lg:text-2xl text-slate-900 tracking-widest flex items-center gap-2">
                <Sparkles className="text-amber-400 fill-amber-400 w-5 h-5 lg:w-6 lg:h-6" />
                KIRATABIのオススメ
              </h2>
            </div>
            
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar max-w-7xl mx-auto snap-x px-4 lg:px-0 scroll-pl-4 lg:scroll-pl-0 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none lg:hidden" />
            {kiratabiChoice.map((island, idx) => (
              <div 
                key={`kiratabi-${island.id}-${idx}`}
                onClick={() => router.push(`/island/${island.id}`)}
                className="w-[240px] shrink-0 snap-start bg-amber-50/50 rounded-2xl border border-amber-100 overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
              >
                <div className="h-28 bg-slate-200 relative overflow-hidden">
                  <img src={island.hero_image_url || island.image_url || `/region/${island.region_id || 'okinawa_main'}.jpg`} alt={island.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => {
                    const t = e.currentTarget;
                    const fallback = getFallbackPlaceholder(island.prefecture || '');
                    if (!t.src.endsWith(fallback)) {
                      t.src = fallback;
                    } else {
                      t.style.display = 'none';
                    }
                  }} />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-md font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">{island.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{island.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center max-w-7xl mx-auto px-4 lg:px-0">
            <button 
              onClick={() => router.push('/search')}
              className="text-sm font-bold text-slate-500 hover:text-amber-600 flex items-center gap-1 transition-colors bg-slate-100 hover:bg-amber-50 px-6 py-2.5 rounded-full shadow-sm"
            >
              続きをみる <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Recommended for Women Section */}
      {isMounted && recommendedForWomen.length > 0 && (
        <div className="px-8 lg:px-12 pt-4 pb-10 bg-white">
          <div className="mb-8 flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-rose-500 mb-1">RECOMMENDED FOR WOMEN</p>
              <h2 className="font-serif text-xl lg:text-2xl text-slate-900 tracking-widest flex items-center gap-2">
                <Heart className="text-rose-400 fill-rose-400 w-5 h-5 lg:w-6 lg:h-6" />
                女性・ひとり旅に人気の島
              </h2>
            </div>
            
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar max-w-7xl mx-auto snap-x px-4 lg:px-0 scroll-pl-4 lg:scroll-pl-0 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none lg:hidden" />
            {recommendedForWomen.map((island, idx) => (
              <div 
                key={`women-${island.id}-${idx}`}
                onClick={() => router.push(`/island/${island.id}`)}
                className="w-[240px] shrink-0 snap-start bg-rose-50/50 rounded-2xl border border-rose-100 overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
              >
                <div className="h-28 bg-slate-200 relative overflow-hidden">
                  <img src={island.hero_image_url || island.image_url || `/region/${island.region_id || 'okinawa_main'}.jpg`} alt={island.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => {
                    const t = e.currentTarget;
                    const fallback = getFallbackPlaceholder(island.prefecture || '');
                    if (!t.src.endsWith(fallback)) {
                      t.src = fallback;
                    } else {
                      t.style.display = 'none';
                    }
                  }} />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-md font-bold text-slate-800 mb-1 group-hover:text-rose-600 transition-colors">{island.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{island.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center max-w-7xl mx-auto px-4 lg:px-0">
            <button 
              onClick={() => router.push('/search')}
              className="text-sm font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors bg-slate-100 hover:bg-rose-50 px-6 py-2.5 rounded-full shadow-sm"
            >
              続きをみる <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Recommended for Families Section */}
      {isMounted && recommendedForFamilies.length > 0 && (
        <div className="px-8 lg:px-12 pt-4 pb-16 bg-white">
          <div className="mb-8 flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-emerald-500 mb-1">RECOMMENDED FOR FAMILIES</p>
              <h2 className="font-serif text-xl lg:text-2xl text-slate-900 tracking-widest flex items-center gap-2">
                <Users className="text-emerald-500 fill-emerald-500 w-5 h-5 lg:w-6 lg:h-6" />
                家族・子連れにおすすめの島
              </h2>
            </div>
            
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar max-w-7xl mx-auto snap-x px-4 lg:px-0 scroll-pl-4 lg:scroll-pl-0 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none lg:hidden" />
            {recommendedForFamilies.map((island, idx) => (
              <div 
                key={`family-${island.id}-${idx}`}
                onClick={() => router.push(`/island/${island.id}`)}
                className="w-[240px] shrink-0 snap-start bg-emerald-50/50 rounded-2xl border border-emerald-100 overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
              >
                <div className="h-28 bg-slate-200 relative overflow-hidden">
                  <img src={island.hero_image_url || island.image_url || `/region/${island.region_id || 'okinawa_main'}.jpg`} alt={island.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => {
                    const t = e.currentTarget;
                    const fallback = getFallbackPlaceholder(island.prefecture || '');
                    if (!t.src.endsWith(fallback)) {
                      t.src = fallback;
                    } else {
                      t.style.display = 'none';
                    }
                  }} />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-md font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">{island.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{island.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessible Islands Section */}
      {isMounted && easilyAccessible.length > 0 && (
        <div className="px-8 lg:px-12 pt-4 pb-16 bg-white">
          <div className="mb-8 flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-blue-500 mb-1">EASILY ACCESSIBLE</p>
              <h2 className="font-serif text-xl lg:text-2xl text-slate-900 tracking-widest flex items-center gap-2">
                <MapPin className="text-blue-500 fill-blue-500/20 w-5 h-5 lg:w-6 lg:h-6" />
                アクセスが容易にできる島
              </h2>
            </div>
            
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar max-w-7xl mx-auto snap-x px-4 lg:px-0 scroll-pl-4 lg:scroll-pl-0 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none lg:hidden" />
            {easilyAccessible.map((island, idx) => (
              <div 
                key={`accessible-${island.id}-${idx}`}
                onClick={() => router.push(`/island/${island.id}`)}
                className="w-[240px] shrink-0 snap-start bg-blue-50/50 rounded-2xl border border-blue-100 overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
              >
                <div className="h-28 bg-slate-200 relative overflow-hidden">
                  <img src={island.hero_image_url || island.image_url || `/region/${island.region_id || 'okinawa_main'}.jpg`} alt={island.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => {
                    const t = e.currentTarget;
                    const fallback = getFallbackPlaceholder(island.prefecture || '');
                    if (!t.src.endsWith(fallback)) {
                      t.src = fallback;
                    } else {
                      t.style.display = 'none';
                    }
                  }} />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-md font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{island.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{island.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remote Islands Section */}
      {isMounted && allIslands.filter(i => ['青ヶ島', '御蔵島', '水納島', '南大東島', '悪石島', '硫黄島（鹿児島）', '宝島', '北大東島'].some(name => i.name === name)).length > 0 && (
        <div className="px-8 lg:px-12 pt-4 pb-16 bg-white">
          <div className="mb-8 flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-indigo-500 mb-1">REMOTE ISLANDS</p>
              <h2 className="font-serif text-xl lg:text-2xl text-slate-900 tracking-widest flex items-center gap-2">
                <Compass className="text-indigo-500 fill-indigo-500/20 w-5 h-5 lg:w-6 lg:h-6" />
                アクセス困難な秘境島
              </h2>
            </div>
            
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar max-w-7xl mx-auto snap-x px-4 lg:px-0 scroll-pl-4 lg:scroll-pl-0 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none lg:hidden" />
            {allIslands.filter(i => ['青ヶ島', '御蔵島', '水納島', '南大東島', '悪石島', '硫黄島（鹿児島）', '宝島', '北大東島'].some(name => {
              const clean = name.split('（')[0];
              return i.name === clean || i.name.includes(clean);
            })).sort((a, b) => {
              const list = ['青ヶ島', '御蔵島', '水納島', '南大東島', '悪石島', '硫黄島（鹿児島）', '宝島', '北大東島'];
              const getIdx = (n: string) => list.findIndex(l => {
                const clean = l.split('（')[0];
                return n === clean || n.includes(clean);
              });
              return getIdx(a.name) - getIdx(b.name);
            }).map((island, idx) => (
              <div 
                key={`remote-${island.id}-${idx}`}
                onClick={() => router.push(`/island/${island.id}`)}
                className="w-[240px] shrink-0 snap-start bg-indigo-50/50 rounded-2xl border border-indigo-100 overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
              >
                <div className="h-28 bg-slate-200 relative overflow-hidden">
                  <img src={island.hero_image_url || island.image_url || `/region/${island.region_id || 'okinawa_main'}.jpg`} alt={island.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    const fallback = getFallbackPlaceholder(island.prefecture || '');
                    if (!t.src.endsWith(fallback)) {
                      t.src = fallback;
                    } else {
                      t.style.display = 'none';
                    }
                  }} />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-md font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{island.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{island.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refined Categories & In-page Curated Results */}
      <div className={`px-8 lg:px-12 py-20 lg:py-28 bg-white border-b border-slate-100 ${isMounted && allIslands.filter(i => i.is_featured).length > 0 ? 'pt-10 lg:pt-10 border-t border-slate-100' : ''}`}>
        <div className="mb-12 text-center">
          <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-blue-600 mb-2">EVOLUTION PARTNERS</p>
          <h2 className="font-serif text-2xl lg:text-3xl text-slate-900 tracking-widest">進化パートナー精霊</h2>
          <div className="w-12 h-[1.5px] bg-blue-600 mx-auto mt-6" />

          {/* キャラクター図鑑ダイレクトアクセスボタン */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => router.push('/companion')}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all group/btn border border-blue-500/30"
            >
              <div className="flex -space-x-1 overflow-hidden">
                <img src="/fairies/ruri.jpg" alt="ルリ" className="w-6 h-6 rounded-full object-cover border border-white bg-blue-50 shadow-sm" />
                <img src="/fairies/shisa.jpg" alt="シーサー" className="w-6 h-6 rounded-full object-cover border border-white bg-orange-50 shadow-sm" />
                <img src="/fairies/ryu.png" alt="リュウ" className="w-6 h-6 rounded-full object-cover border border-white bg-indigo-50 shadow-sm" />
                <img src="/fairies/shida.jpg" alt="シダ" className="w-6 h-6 rounded-full object-cover border border-white bg-green-50 shadow-sm" />
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-amber-300">
                オリジナル進化キャラクター大図鑑ページへ ＞
              </span>
            </button>
          </div>
        </div>

        <div ref={categoryRef} className="mt-20 mb-12 text-center">
          <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-blue-600 mb-2">CURATED THEMES</p>
          <h2 className="font-serif text-2xl lg:text-3xl text-slate-900 tracking-widest">目的から探す</h2>
          <div className="w-12 h-[1.5px] bg-blue-600 mx-auto mt-6" />
        </div>
        
        <div className="relative">
          <div className="flex justify-start lg:justify-center gap-5 md:gap-8 overflow-x-auto hide-scrollbar px-6 lg:px-8 snap-x pb-8 pt-6 scroll-pl-6 lg:scroll-pl-0">
            {[
              { id: 'transparency', icon: Droplets, label: '海の透明度No.1', badge: 'ダイビング', gradient: 'from-blue-400 to-cyan-500', shadow: 'shadow-blue-500/20' },
              { id: 'stars', icon: Moon, label: '満天の星空', badge: '保護区', gradient: 'from-indigo-400 to-purple-600', shadow: 'shadow-indigo-500/20' },
              { id: 'retreat', icon: Heart, label: '女子・ひとり旅', badge: '安心・カフェ', gradient: 'from-rose-400 to-pink-500', shadow: 'shadow-rose-500/20' },
              { id: 'family', icon: Users, label: '家族・子連れ旅', badge: '体験・安全', gradient: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
              { id: 'onsen_sauna', icon: Flame, label: '秘湯・サウナ', badge: '野湯・絶景', gradient: 'from-orange-400 to-red-500', shadow: 'shadow-orange-500/20' },
              { id: 'luxury', icon: BedDouble, label: '高級リゾート', badge: 'ヴィラ', gradient: 'from-amber-300 to-yellow-600', shadow: 'shadow-amber-500/20' },
              { id: 'remote', icon: Compass, label: '秘境・無人島', badge: '難易度高め', gradient: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/20' },
              { id: 'nature', icon: Waves, label: '野生動物・自然', badge: 'クジラ', gradient: 'from-lime-500 to-green-600', shadow: 'shadow-lime-500/20' },
              { id: 'gourmet', icon: Coffee, label: '島グルメ・食', badge: '島飯', gradient: 'from-amber-600 to-orange-700', shadow: 'shadow-amber-700/20' },
              { id: 'daytrip', icon: MapPin, label: '日帰り島', badge: '気軽', gradient: 'from-sky-400 to-blue-600', shadow: 'shadow-sky-500/20' }
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <div 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)} 
                  className="snap-center flex flex-col items-center gap-3 cursor-pointer group shrink-0 w-[5.5rem] lg:w-[6.5rem]"
                >
                  <div className={`w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-3xl flex items-center justify-center transition-all duration-300 shadow-md relative ${
                    isSelected
                      ? `bg-gradient-to-br ${cat.gradient} text-white shadow-lg ${cat.shadow} scale-110 ring-4 ring-offset-2 ring-blue-100`
                      : 'bg-white text-slate-500 border border-slate-200 hover:text-white hover:scale-105'
                  }`}>
                    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                      <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isSelected ? 'hidden' : ''}`} />
                    </div>
                    <cat.icon size={28} strokeWidth={isSelected ? 2 : 1.5} className={`relative z-10 ${isSelected ? 'text-white' : 'group-hover:text-white'}`} />
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-slate-800 text-white text-[0.55rem] font-bold tracking-tight shadow-md z-20 group-hover:scale-110 transition-transform whitespace-nowrap">
                      {cat.badge}
                    </span>
                  </div>
                  <span className={`text-[0.65rem] lg:text-xs font-bold tracking-widest transition-colors text-center ${
                    isSelected ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-800'
                  }`}>
                    {cat.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none lg:hidden" />
        </div>

        {/* Curated Results Grid */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="max-w-6xl mx-auto mt-12 overflow-hidden"
              ref={categoryRef}
            >
              <div className="bg-slate-50/80 rounded-3xl p-6 lg:p-10 border border-slate-200/60 shadow-inner">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="font-serif font-bold text-xl lg:text-2xl text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span>
                        {selectedCategory === 'transparency' && '極上のケラマ＆ミヤコブルー・透明度を誇る島々'}
                        {selectedCategory === 'stars' && '国際星空保護区＆満天の南十字星と出会う島々'}
                        {selectedCategory === 'retreat' && '女子旅・島カフェ＆安心安全フォトジェニックの島々'}
                        {selectedCategory === 'family' && '家族や子連れで楽しめる安全なビーチと体験がある島々'}
                        {selectedCategory === 'onsen_sauna' && '潮騒を浴びる絶景海中温泉＆極上アウトドアサウナの島々'}
                        {selectedCategory === 'luxury' && '非日常を極める最高峰5つ星リゾート＆ヴィラの島々'}
                        {selectedCategory === 'remote' && '難易度MAX！手付かずの自然が残る秘境と絶海孤島'}
                        {selectedCategory === 'nature' && 'クジラやウミガメ、独自の固有種に出会える野生の宝庫'}
                        {selectedCategory === 'gourmet' && '新鮮な海の幸と独自の島グルメ・食文化を堪能できる島々'}
                        {selectedCategory === 'daytrip' && '主要都市や本島からフェリーですぐ行ける日帰りアイランド'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">気になった島をタップすると詳しい解説とスポットを確認できます（もう一度アイコンを押すと閉じます）</p>
                  </div>
                  <button
                    onClick={() => router.push(`/map?filter=${selectedCategory}`)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <span>地図上で位置を確認する</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ファクトチェック基準ポリシー・免責バナー */}
                <div className="mb-6 bg-white/90 rounded-2xl p-3.5 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[0.65rem] tracking-wider shrink-0">100%実証済</span>
                    <span>
                      {selectedCategory === 'transparency' && '環境省国立公園指定・世界基準シュノーケル＆ダイビング実績地より厳選'}
                      {selectedCategory === 'stars' && '国際ダークスカイ協会「星空保護区」認定および天文台・南十字星観測実績地より厳選'}
                      {selectedCategory === 'retreat' && '治安良好・洗練島カフェ＆オリーブコスメ・現代アート・初心者＆女子旅高評価リトリート島より厳選'}
                      {selectedCategory === 'family' && '遠浅で波の穏やかなビーチやファミリー向けリゾート施設・体験プログラムの充実度より厳選'}
                      {selectedCategory === 'onsen_sauna' && '屋久島海中温泉など野湯実在確認地および絶景テントサウナ等実稼働施設より厳選'}
                      {selectedCategory === 'luxury' && '1泊数万〜数十万クラスの最高峰5つ星級リゾートホテル・高級プライベートヴィラ実在島より厳選'}
                      {selectedCategory === 'remote' && 'フェリー就航率の低さや上陸難易度が高い絶海孤島、および無人島ツアー開催地より厳選'}
                      {selectedCategory === 'nature' && '世界自然遺産登録地やホエールウォッチング、固有種（ヤンバルクイナ等）生息地より厳選'}
                      {selectedCategory === 'gourmet' && '特産品（黒毛和牛、新鮮な海鮮）や独自の島料理が有名な美食の島より厳選'}
                      {selectedCategory === 'daytrip' && '本土から片道1時間以内でアクセス可能、かつ日帰り観光ルートが確立している島より厳選'}
                    </span>
                  </div>
                  <span className="text-[0.65rem] text-slate-400 sm:text-right shrink-0">
                    ※ 施設営業・天候状況等はご旅行前に公式情報をご確認ください
                  </span>
                </div>

                {selectedCategoryIslands.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {selectedCategoryIslands.map((isl: any) => (
                      <motion.div
                        key={isl.id}
                        whileHover={{ y: -4 }}
                        onClick={() => router.push(`/island/${isl.id}`)}
                        className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col group"
                      >
                        <div className="relative h-36 overflow-hidden bg-slate-100">
                          <img
                            src={isl.hero_image_url || isl.image_url || `/region/${isl.region_id || 'okinawa_main'}.jpg`}
                            onError={(e) => {
                              const t = e.currentTarget;
                              const fallback = getFallbackPlaceholder(isl.prefecture || '');
                              if (!t.src.endsWith(fallback)) {
                                t.src = fallback;
                              } else {
                                t.style.display = 'none';
                              }
                            }}
                            alt={isl.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[0.65rem] font-medium">
                            {isl.prefecture || '日本離島'}
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-serif font-bold text-base text-slate-800 mb-1.5 group-hover:text-blue-600 transition-colors">
                              {isl.name}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {isl.description}
                            </p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end text-blue-600 font-bold text-[0.7rem] gap-1">
                            <span>詳しく見る</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : selectedCategory && (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-4xl mb-3">🏝️</p>
                    <p className="font-bold">該当する島が見つかりませんでした</p>
                    <p className="text-sm mt-1">別のカテゴリをお試しください</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* App Coming Soon Banner */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12 pb-16">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-[0.65rem] font-bold text-amber-400 tracking-widest uppercase bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/30 mb-4 inline-block">近日公開予定</span>
            <h3 className="font-serif text-xl lg:text-2xl text-white tracking-widest mb-2">公式ネイティブアプリ</h3>
            <p className="text-sm text-slate-400">iOS / Androidアプリを現在開発中です。GPSチェックインがよりスムーズに、より楽しくなります。</p>
          </div>
        </div>
      </div>

      {/* Monetization / Pricing Plan Section */}
      <div id="pricing" className="bg-slate-900 py-20 px-6 lg:px-12 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-2xl lg:text-3xl tracking-widest mb-4">キラ旅 プラン表</h2>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">基本機能はすべて無料。公式到達認定書やプレミアム機能を楽しみたい旅人のための特別なプランもご用意しています。</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <h3 className="text-xl font-bold mb-2 text-white">Free / 無料プラン</h3>
              <p className="text-slate-400 text-sm mb-6 h-10">日本全国の離島巡りを楽しむための基本機能</p>
              <div className="text-3xl font-serif mb-8">¥0<span className="text-sm text-slate-500 font-sans"> / 永遠に無料</span></div>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0"/> {totalIslandsCount}島すべてへのGPSチェックイン</li>
                <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0"/> ご当地妖精の収集・育成機能</li>
                <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0"/> デジタル島ノート（タイムライン投稿）</li>
                <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0"/> 全国旅人ランキング参加</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-8 border border-blue-700 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-xs font-bold px-4 py-1 rounded-bl-lg">おすすめ</div>
              <h3 className="text-xl font-bold mb-2 text-white">Premium / プレミアム</h3>
              <p className="text-blue-200 text-sm mb-6 h-10">一生の思い出を形に残す、特別なコレクション</p>
              <div className="text-3xl font-serif mb-8 text-amber-300">¥480<span className="text-sm text-blue-300 font-sans"> / 月</span></div>
              <ul className="space-y-4 text-sm text-blue-100">
                <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-amber-400 shrink-0"/> 無料プランの全機能</li>
                <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-amber-400 shrink-0"/> <strong className="text-white">公式到達デジタル＆紙認定書</strong>の発行権</li>
                <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-amber-400 shrink-0"/> 広告非表示＆プレミアムUIテーマ</li>
                <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-amber-400 shrink-0"/> 妖精の「伝説の進化」解放ルート</li>
              </ul>
              <button 
                onClick={() => handleCheckout('premium')}
                className="w-full mt-8 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-amber-950 font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
              >
                プレミアムプランを選択する
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Magazine-style Region Cards */}
      <div ref={regionRef} className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-24">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-xl lg:text-2xl text-slate-800 tracking-widest">すべての諸島</h2>
          <p className="text-[0.7rem] lg:text-xs text-slate-400 tracking-[0.3em] uppercase mt-3">{allRegions.length} Regions</p>
          <div className="w-12 h-[1px] bg-slate-300 mx-auto mt-6" />
        </div>

        {/* Area Tabs */}
        <div className="flex flex-wrap justify-center gap-2 lg:gap-4 mb-12">
          {['全て', ...Array.from(new Set(allRegions.map(r => r.area)))].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedAreaTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                selectedAreaTab === tab 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Group by Area */}
        <div className="space-y-4 mb-20">
        {Object.entries(
          allRegions.reduce((acc, region) => {
            if (selectedAreaTab !== '全て' && region.area !== selectedAreaTab) return acc;
            if (!acc[region.area]) acc[region.area] = [];
            acc[region.area].push(region);
            return acc;
          }, {} as Record<string, typeof allRegions>)
        ).map(([area, regions]) => (
          <details key={area} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" open={selectedAreaTab !== '全て'}>
            <summary className="font-serif text-xl lg:text-2xl text-slate-800 tracking-widest p-5 lg:p-6 cursor-pointer list-none flex justify-between items-center hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400" />
                {area}
                <span className="text-xs font-sans font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{regions.length}</span>
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="p-5 lg:p-6 pt-0 border-t border-slate-100 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mt-6">
          {regions.map((region) => {
            const pct = region.total > 0 ? (region.visited / region.total) * 100 : 0;
            const hash = region.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            
            // Match real user photos to correct regions
            const validImageSlides = slides.filter(s => s.type === 'image');
            const regionSpecificSlides = validImageSlides.filter(s => {
              if (region.id === 'ogasawara' && s.location.includes('小笠原')) return true;
              if (region.id === 'miyako' && s.location.includes('宮古')) return true;
              if (region.id === 'yaeyama' && (s.location.includes('与那国') || s.location.includes('竹富') || s.location.includes('西表'))) return true;
              if (region.id === 'kume' && s.location.includes('粟国')) return true;
              return false;
            });

            let regionImg = '';
            if (regionSpecificSlides.length > 0) {
              regionImg = regionSpecificSlides[hash % regionSpecificSlides.length].src;
            } else if (region.hero_image_url) {
              regionImg = region.hero_image_url;
            } else {
              regionImg = getFallbackPlaceholder(region.area);
            }
            
            const isSelected = selectedRegionId === region.id;
            return (
              <motion.div 
                key={region.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRegionId(isSelected ? null : region.id)}
                className={`relative h-[280px] rounded-2xl overflow-hidden shadow-lg cursor-pointer group transition-all ${
                  isSelected ? 'ring-4 ring-blue-500 shadow-2xl scale-[1.02]' : ''
                }`}
              >
                {/* Full Bleed Background Image */}
                <img 
                  src={regionImg} 
                  alt={region.name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                
                {/* Elegant Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent transition-opacity duration-500" />
                
                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <p className="text-[0.65rem] font-medium text-white/70 tracking-[0.3em] uppercase mb-2">{region.enName}</p>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="font-serif text-2xl font-light text-white tracking-wider">{region.name}</h3>
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                      <ChevronRight size={16} strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  {/* Ultra-thin Progress */}
                  {region.total > 0 && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-[2px] bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[0.65rem] font-medium text-white/70 tracking-widest tabular-nums shrink-0">
                        <span className={region.visited > 0 ? 'text-white' : ''}>{region.visited}</span> / {region.total}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
              </div>
            </div>
          </details>
        ))}
        </div>

        {/* 選択された諸島（Archipelago）のインページカード展開アコーディオン */}
        <AnimatePresence>
          {selectedRegionId && selectedRegionObj && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="mt-8 mb-24 overflow-hidden"
              ref={regionRef}
            >
              <div className="bg-slate-900 rounded-3xl p-6 lg:p-10 border border-slate-700 shadow-2xl text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
                  <div>
                    <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-amber-400 block mb-1">
                      {selectedRegionObj.enName || 'ARCHIPELAGO EXPLORER'}
                    </span>
                    <h3 className="font-serif font-bold text-xl lg:text-3xl text-white flex items-center gap-2.5">
                      <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
                      <span>【 {selectedRegionObj.name} 】のおすすめ島カード一覧 ({selectedRegionIslands.length}島)</span>
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      onClick={() => router.push(`/map?region=${selectedRegionId}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all group/btn border border-blue-400/30"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-200 group-hover/btn:scale-110 transition-transform" />
                      <span>地図上で位置を確認する ＞</span>
                    </button>
                    <button
                      onClick={() => router.push(`/region/${selectedRegionId}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs shadow-sm transition-all border border-slate-700"
                    >
                      <span>エリア詳細ページへ ＞</span>
                    </button>
                    <button
                      onClick={() => setSelectedRegionId(null)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="閉じる"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* カード一覧グリッド */}
                {selectedRegionIslands.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-serif">
                    <p>この諸島の詳細島データを確認中です...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {selectedRegionIslands.map((isl: any) => {
                      const status = islandStatuses[isl.id] || 'none';
                      return (
                        <div
                          key={isl.id}
                          onClick={() => router.push(`/island/${isl.id}`)}
                          className="bg-slate-800/90 hover:bg-slate-800 rounded-2xl border border-slate-700/80 hover:border-amber-500/50 p-5 cursor-pointer transition-all hover:-translate-y-1 shadow-lg group/card flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-amber-400 tracking-wider">
                                {isl.prefecture || selectedRegionObj.area}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${
                                status === 'visited'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : status === 'planning'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-700 text-slate-300'
                              }`}>
                                {status === 'visited' ? '✓ 到達済' : status === 'planning' ? '★ 行きたい' : '未記録'}
                              </span>
                            </div>
                            <h4 className="font-serif font-bold text-lg text-white group-hover/card:text-amber-300 transition-colors mb-2 flex items-center justify-between">
                              <span>{isl.name}</span>
                              <ArrowRight className="w-4 h-4 text-slate-500 group-hover/card:text-amber-300 group-hover/card:translate-x-1 transition-all" />
                            </h4>
                            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                              {isl.description || '島独自の自然と歴史文化が織りなす魅力あふれる離島。'}
                            </p>
                          </div>
                          <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-[0.7rem] text-slate-400">
                            <span>アクセス: {isl.access || '定期船便等'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Bottom Nav - Ultra Minimal (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent pointer-events-none" />
        <div className="relative max-w-md mx-auto px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-12 flex justify-between items-end">
          <button onClick={() => setIsSearchOpen(true)} className="pointer-events-auto flex flex-col items-center gap-1.5 text-slate-800 hover:scale-110 transition-transform flex-1">
            <Compass size={22} strokeWidth={1.5} />
            <span className="text-[0.55rem] font-bold tracking-widest whitespace-nowrap">探す</span>
          </button>
          <button onClick={() => router.push('/map')} className="pointer-events-auto flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-800 hover:scale-110 transition-all flex-1">
            <Map size={22} strokeWidth={1.5} />
            <span className="text-[0.55rem] font-bold tracking-widest whitespace-nowrap">マップ</span>
          </button>
          <button onClick={() => router.push('/timeline')} className="pointer-events-auto flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-800 hover:scale-110 transition-all flex-1">
            <MessageCircle size={22} strokeWidth={1.5} />
            <span className="text-[0.55rem] font-bold tracking-widest whitespace-nowrap">ノート</span>
          </button>
          <button onClick={() => setIsCompanionModalOpen(true)} className="pointer-events-auto flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-800 hover:scale-110 transition-all flex-1">
            <Sparkles size={22} strokeWidth={1.5} />
            <span className="text-[0.55rem] font-bold tracking-widest whitespace-nowrap">図鑑</span>
          </button>
          <button onClick={() => { if (user) router.push('/mypage'); else setIsAuthOpen(true); }} className="pointer-events-auto flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-800 hover:scale-110 transition-all flex-1">
            <User size={22} strokeWidth={1.5} />
            <span className="text-[0.55rem] font-bold tracking-widest whitespace-nowrap">マイページ</span>
          </button>
        </div>
      </div>
      
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CompanionModal isOpen={isCompanionModalOpen} onClose={() => setIsCompanionModalOpen(false)} />
      <NearbyIslandsModal isOpen={isNearbyModalOpen} onClose={() => setIsNearbyModalOpen(false)} items={nearbyItems} />
    </div>
  );
}
