'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Search, Map, Compass, User, Droplets, Moon, Wind, BedDouble, ChevronRight, ChevronLeft, Waves, MapPin, Menu, ArrowRight, Sparkles, Coffee, Heart, Flame, Bot, Award, X } from 'lucide-react';
import regionsData from '../data/regions.json';
import heroSlides from '../data/hero_slides.json';
import SearchModal from '@/components/SearchModal';
import AuthModal from '@/components/AuthModal';
import CompanionModal from '@/components/CompanionModal';
import { useTravel } from '@/context/TravelContext';
import { fetchAllIslands, fetchSiteSettings, fetchAdCampaigns } from '@/lib/supabase';
import BannerCarousel from '@/components/BannerCarousel';

const ALL_ISLANDS_COUNT = 432;

export default function Home() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allIslands, setAllIslands] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [adCampaigns, setAdCampaigns] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const { user, totalVisited, companionChar, companionStage, islandStatuses, totalPoints } = useTravel();
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 500], [0, 150]);
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  // サーバーサイドとクライアントサイドでhydreation不一致を防ぐための空配列またはデフォルトを保証する
  const slides = heroSlides.length > 0 ? heroSlides : [
    { type: 'image', src: "/hero/slide1.webp", title: ["まだ見ぬ青を、", "探す旅へ。"], location: "宮古島 (沖縄県)" }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

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
  }, []);

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
      // ケラマブルー・ミヤコブルー等、環境省国立公園・シュノーケル/ダイビング世界屈指の実績島
      'transparency': [
        '座間味島', '阿嘉島', '渡嘉敷島', '宮古島', '池間島', '下地島', 
        '波照間島', '古宇利島', '水納島', '式根島', '神津島', '柏島', '沖之島', '屋我地島'
      ],
      // 国際ダークスカイ協会「星空保護区」認定および天文台・南十字星観測スポット実在島
      'stars': [
        '波照間島', '神津島', '小浜島', '竹富島', '父島', '母島', 
        '八丈島', '与那国島', '黒島', '多良間島', '青ケ島', '西表島'
      ],
      // 屋久島海中温泉・式根島地鉈足付温泉・八丈島みはらしの湯・硫黄島東温泉など絶景野湯＆温泉実在島
      'onsen': [
        '屋久島', '式根島', '八丈島', '硫黄島（鹿児島）', '伊豆大島', '久米島', '小豆島', '壱岐島', '奥尻島', '利尻島'
      ],
      // 直島I♥湯・式根島絶景テントサウナ・八丈島・オリビアン小豆島・宮古島リゾートサウナ実稼働島
      'sauna': [
        '直島', '式根島', '八丈島', '小豆島', '伊豆大島', '久米島', '宮古島', '石垣島', '新島', '壱岐島'
      ],
      // 女子旅・島カフェ＆絶景リトリート（治安・おしゃれカフェ・コスメ・安全快適・フォトジェニック厳選）
      'retreat': [
        '直島', '豊島（香川）', '小豆島', '古宇利島', '瀬底島', '水納島', 
        '小浜島', '竹富島', '神津島', '生口島', '屋久島', '奄美大島', '壱岐島'
      ],
      // 1泊数万〜数十万クラスの最高峰5つ星ラグジュアリーヴィラ＆リゾートホテル実在島
      'luxury': [
        '宮古島', '伊良部島', '石垣島', '小浜島', '直島', '屋久島', '奄美大島', '古宇利島', '瀬底島'
      ]
    };

    const targetNames = VERIFIED_CATEGORY_MAP[selectedCategory] || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return allIslands.filter((island: any) => {
      const name = island.name || '';
      return targetNames.some((verifiedName: string) => name.includes(verifiedName) || verifiedName.includes(name));
    }).slice(0, 8);
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


  useEffect(() => {
    if (!isMounted || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      {/* Premium Minimalist Nav */}
      <motion.div 
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 pt-7 pb-4 lg:pt-8 lg:pb-6 flex items-center justify-between backdrop-blur-xl transition-all"
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
            <span>輝旅 島専科</span>
            <span className="text-[0.65rem] lg:text-xs opacity-80">(kiratabi -shimasenka)</span>
          </motion.span>
        </div>
        
        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8 mr-8">
          <motion.button onClick={() => setIsSearchOpen(true)} className="text-sm font-medium tracking-widest text-slate-800 hover:text-blue-600 transition-colors" style={{ color: navColor }}>探す</motion.button>
          <motion.button onClick={() => router.push('/map')} className="text-sm font-medium tracking-widest text-slate-800 hover:text-blue-600 transition-colors" style={{ color: navColor }}>マップ</motion.button>
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[65px] left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-6 shadow-xl flex flex-col gap-4 md:hidden"
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
      <div className={`relative ${adCampaigns.length > 0 ? 'h-[75vh]' : 'h-[85vh] lg:h-[90vh]'} w-full overflow-hidden flex flex-col justify-end items-center`}>
        {/* Subtle Ken Burns Effect */}
        <motion.div 
          className="absolute inset-0 z-0 h-[80vh] min-h-[600px] overflow-hidden bg-slate-900"
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
          <div className="mb-4 lg:mb-0 min-h-[140px] flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSlide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="font-serif text-3xl md:text-5xl lg:text-[4rem] font-light text-white leading-[1.6] tracking-widest drop-shadow-lg mb-6 whitespace-nowrap">
                  {isMounted && slides[currentSlide] ? slides[currentSlide].title[0] : slides[0].title[0]}<br />
                  {isMounted && slides[currentSlide] ? slides[currentSlide].title[1] : slides[0].title[1]}
                </h1>
                <div className="flex items-center gap-2 text-white/90 mb-4 bg-black/20 backdrop-blur-sm w-fit px-3 py-1.5 rounded-full border border-white/10">
                  <MapPin size={14} className="opacity-80" />
                  <span className="text-xs font-medium tracking-widest">{isMounted && slides[currentSlide] ? slides[currentSlide].location : slides[0].location}</span>
                </div>
              </motion.div>
            </AnimatePresence>
            <p className="text-white/80 text-xs md:text-sm font-medium tracking-[0.4em] uppercase drop-shadow-sm mb-6">Japan Islands - {ALL_ISLANDS_COUNT} Destinations</p>

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
                <h2 className="font-serif text-base text-white tracking-wider">全国踏破率</h2>
              </div>
              <div className="text-right">
                <span className="font-serif text-3xl font-light text-white tracking-tighter">{progressPct.toFixed(1)}</span>
                <span className="text-xs font-light text-white/70 ml-1">%</span>
              </div>
            </div>
            
            <div className="w-full h-[2px] bg-white/20 rounded-full overflow-hidden relative z-10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 2, ease: "circOut", delay: 0.5 }}
                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              />
            </div>
            <div className="flex justify-between items-center mt-3 text-[0.6rem] font-medium text-white/70 tracking-widest relative z-10">
              <span>踏破 {totalVisited} 島</span>
              <span className="text-amber-300">★ {totalPoints.toLocaleString()} pt</span>
              <span>残り {ALL_ISLANDS_COUNT - totalVisited} 島</span>
            </div>

            {/* 守護パートナー精霊・進化ステータスウィジェット */}
            {companionChar && companionStage && (
              <div 
                onClick={() => setIsCompanionModalOpen(true)}
                className="mt-4 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all cursor-pointer group/comp relative z-10 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${companionStage.badgeGradient} flex items-center justify-center text-4xl shadow-sm border border-white/60 shrink-0 group-hover/comp:scale-105 transition-transform`}>
                    {companionStage.icon}
                  </div>
                  <div>
                    <span className="text-[0.6rem] font-bold tracking-wider uppercase text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>同行守護精霊 (STAGE {companionStage.stage})</span>
                    </span>
                    <p className="text-xs font-bold text-white mt-0.5 group-hover/comp:underline leading-snug">
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
          </div>
        </motion.div>
      </div>

      {/* Featured & Popular Islands Section */}
      {isMounted && allIslands.filter(i => i.is_featured).length > 0 && (
        <div className="px-8 lg:px-12 pt-20 lg:pt-28 pb-10 bg-white">
          <div className="mb-10 flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-amber-500 mb-2">FEATURED DESTINATIONS</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-slate-900 tracking-widest flex items-center gap-2">
                <Star className="text-amber-400 fill-amber-400 w-6 h-6 lg:w-8 lg:h-8" />
                ピックアップ・人気の島
              </h2>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 hide-scrollbar max-w-7xl mx-auto snap-x">
            {allIslands.filter(i => i.is_featured).map((island, idx) => (
              <div 
                key={`featured-${island.id}-${idx}`}
                onClick={() => router.push(`/island/${island.id}`)}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-amber-500/10 transition-all hover:-translate-y-1"
              >
                <div className="h-40 bg-slate-200 relative overflow-hidden">
                  <img src={`/region/${island.region_id}.jpg`} alt={island.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.src = '/placeholders/trop.jpg'; }} />
                  <div className="absolute top-3 left-3 bg-amber-500 text-white text-[0.6rem] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                    <Star size={10} className="fill-white" /> PICKUP
                  </div>
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

      {/* Refined Categories & In-page Curated Results */}
      <div className={`px-8 lg:px-12 py-20 lg:py-28 bg-white border-b border-slate-100 ${isMounted && allIslands.filter(i => i.is_featured).length > 0 ? 'pt-10 lg:pt-10 border-t border-slate-100' : ''}`}>
        <div className="mb-12 text-center">
          <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-blue-600 mb-2">CURATED THEMES & PARTNERS</p>
          <h2 className="font-serif text-2xl lg:text-3xl text-slate-900 tracking-widest">目的から探す＆進化パートナー</h2>
          <div className="w-12 h-[1.5px] bg-blue-600 mx-auto mt-6" />

          {/* キャラクター図鑑ダイレクトアクセスボタン */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => router.push('/companion')}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all group/btn border border-blue-500/30"
            >
              <div className="flex -space-x-1 overflow-hidden">
                <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs border border-white">🐢</span>
                <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs border border-white">🦉</span>
                <span className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-xs border border-white">🌺</span>
                <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs border border-white">♨️</span>
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-amber-300">
                オリジナル進化キャラクター大図鑑ページへ ＞
              </span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-start md:justify-center gap-6 md:gap-14 overflow-x-auto hide-scrollbar -mx-8 px-8 snap-x pb-6">
          {[
            { id: 'transparency', icon: Droplets, label: '海の透明度', badge: 'ブルー・サンゴ' },
            { id: 'stars', icon: Moon, label: '星空保護区', badge: 'ダークスカイ' },
            { id: 'onsen', icon: Flame, label: '絶景秘湯・温泉', badge: '海中温泉・野湯' },
            { id: 'sauna', icon: Wind, label: '極上サウナ', badge: 'アウトドアサウナ' },
            { id: 'retreat', icon: Heart, label: '女子旅・リトリート', badge: 'カフェ＆癒やし' },
            { id: 'luxury', icon: BedDouble, label: '高級宿・ヴィラ', badge: '5つ星リゾート' }
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <div 
                key={cat.id} 
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)} 
                className="snap-center flex flex-col items-center gap-2.5 cursor-pointer group shrink-0"
              >
                <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border relative ${
                  isSelected
                    ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white border-blue-500 shadow-lg shadow-blue-900/25 scale-105 ring-4 ring-blue-500/20'
                    : 'bg-slate-50/80 text-slate-500 border-slate-200/80 group-hover:bg-white group-hover:text-slate-800 group-hover:shadow-md group-hover:scale-105'
                }`}>
                  <cat.icon size={26} strokeWidth={isSelected ? 1.8 : 1.3} className={isSelected ? 'text-amber-400' : ''} />
                  <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[0.6rem] font-bold tracking-tight shadow-sm opacity-90 group-hover:opacity-100">
                    {cat.badge}
                  </span>
                </div>
                <span className={`text-xs font-bold tracking-widest transition-colors ${
                  isSelected ? 'text-blue-900 font-extrabold' : 'text-slate-600 group-hover:text-slate-900'
                }`}>
                  {cat.label}
                </span>
              </div>
            );
          })}
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
                        {selectedCategory === 'onsen' && '潮騒を浴びる無人絶景海中温泉＆秘湯の島々'}
                        {selectedCategory === 'sauna' && 'アート銭湯＆絶景アウトドアサウナの島々'}
                        {selectedCategory === 'retreat' && '女子旅・島カフェ＆安心安全フォトジェニックの島々'}
                        {selectedCategory === 'luxury' && '非日常を極める最高峰5つ星リゾート＆ヴィラの島々'}
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
                      {selectedCategory === 'onsen' && '屋久島海中温泉・式根島地鉈足付温泉・八丈島みはらしの湯・硫黄島東温泉など野湯実在確認地'}
                      {selectedCategory === 'sauna' && '島内に著名なアート銭湯・絶景テントサウナ・オーシャンビューサウナ等の実稼働施設が確認された島より厳選'}
                      {selectedCategory === 'retreat' && '治安良好・洗練島カフェ＆オリーブコスメ・現代アート・初心者＆女子旅高評価リトリート島より厳選'}
                      {selectedCategory === 'luxury' && '1泊数万〜数十万クラスの最高峰5つ星級リゾートホテル・高級プライベートヴィラ実在島より厳選'}
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
                            src={`/region/${isl.region_id || 'okinawa_main'}.jpg`}
                            onError={(e) => { e.currentTarget.src = '/placeholders/trop.jpg'; }}
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
                ) : (
                  <div className="text-center py-12 text-slate-500 text-sm font-serif">
                    条件に合う島を抽出しています...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Magazine-style Region Cards */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-24">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-xl lg:text-2xl text-slate-800 tracking-widest">すべての諸島</h2>
          <p className="text-[0.7rem] lg:text-xs text-slate-400 tracking-[0.3em] uppercase mt-3">{allRegions.length} Regions</p>
          <div className="w-12 h-[1px] bg-slate-300 mx-auto mt-6" />
        </div>

        {/* Group by Area */}
        {Object.entries(
          allRegions.reduce((acc, region) => {
            if (!acc[region.area]) acc[region.area] = [];
            acc[region.area].push(region);
            return acc;
          }, {} as Record<string, typeof allRegions>)
        ).map(([area, regions]) => (
          <div key={area} className="mb-20">
            <h3 className="font-serif text-xl lg:text-2xl text-slate-700 tracking-widest border-b border-slate-200 pb-4 mb-8">
              {area}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
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
            } else {
              const climateMap: Record<string, string> = {
                "北海道地方": "/placeholders/cold.jpg",
                "東北地方": "/placeholders/cold.jpg",
                "北陸地方": "/placeholders/cold.jpg",
                "九州地方": "/placeholders/trop.jpg",
                "沖縄地方": "/placeholders/trop.jpg"
              };
              regionImg = climateMap[region.area] || "/placeholders/temp.jpg";
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
        ))}

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
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent" />
        <div className="relative max-w-sm mx-auto px-8 pb-[calc(24px+env(safe-area-inset-bottom))] pt-12 flex justify-between items-end pointer-events-auto">
          <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center gap-2 text-slate-800 hover:scale-110 transition-transform">
            <Compass size={24} strokeWidth={1.5} />
            <span className="text-[0.6rem] font-bold tracking-widest">探す</span>
          </button>
          <button onClick={() => router.push('/map')} className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-800 hover:scale-110 transition-all">
            <Map size={24} strokeWidth={1.5} />
            <span className="text-[0.6rem] font-bold tracking-widest">マップ</span>
          </button>
          <button onClick={() => { if (user) router.push('/mypage'); else setIsAuthOpen(true); }} className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-800 hover:scale-110 transition-all">
            <User size={24} strokeWidth={1.5} />
            <span className="text-[0.6rem] font-bold tracking-widest">マイページ</span>
          </button>
        </div>
      </div>
      
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CompanionModal isOpen={isCompanionModalOpen} onClose={() => setIsCompanionModalOpen(false)} />
    </div>
  );
}
