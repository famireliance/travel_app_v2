'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Search, Map, Compass, User, Droplets, Moon, Wind, BedDouble, ChevronRight, ChevronLeft, Waves, MapPin, Menu } from 'lucide-react';
import regionsData from '../data/regions.json';
import heroSlides from '../data/hero_slides.json';
import SearchModal from '@/components/SearchModal';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/lib/supabase';
import { useTravel } from '@/context/TravelContext';

const ALL_ISLANDS_COUNT = 432;

export default function Home() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, totalVisited } = useTravel();
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
  }, []);

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
            className="font-serif font-bold text-base lg:text-lg tracking-[0.2em]"
            style={{ color: navColor }}
          >
            KIRATABI
          </motion.span>
        </div>
        
        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8 mr-8">
          <motion.button onClick={() => setIsSearchOpen(true)} className="text-sm font-medium tracking-widest text-slate-800 hover:text-blue-600 transition-colors" style={{ color: navColor }}>探す</motion.button>
          <motion.button onClick={() => router.push('/map')} className="text-sm font-medium tracking-widest text-slate-800 hover:text-blue-600 transition-colors" style={{ color: navColor }}>マップ</motion.button>
          <motion.button onClick={() => user ? router.push('/mypage') : setIsAuthOpen(true)} className="text-sm font-medium tracking-widest text-slate-800 hover:text-blue-600 transition-colors" style={{ color: navColor }}>
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
          <motion.div style={{ color: navColor }} className="cursor-pointer hover:opacity-70 transition-opacity">
            <Menu size={22} strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* Desktop Search Icon */}
        <div className="hidden md:block">
          <motion.div style={{ color: navColor }} className="cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setIsSearchOpen(true)}>
            <Search size={22} strokeWidth={1.5} />
          </motion.div>
        </div>
      </motion.div>

      {/* Cinematic Hero Section */}
      <div className="relative h-[85vh] lg:h-[90vh] w-full overflow-hidden flex flex-col justify-end items-center">
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
          <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden group w-full lg:w-[420px] shrink-0">
            <div className="flex justify-between items-end mb-6 relative z-10">
              <div>
                <p className="text-[0.65rem] font-medium text-white/60 tracking-[0.2em] uppercase mb-2">Your Voyage</p>
                <h2 className="font-serif text-lg text-white tracking-wider">全国踏破率</h2>
              </div>
              <div className="text-right">
                <span className="font-serif text-4xl font-light text-white tracking-tighter">{progressPct.toFixed(1)}</span>
                <span className="text-sm font-light text-white/70 ml-1">%</span>
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
            <div className="flex justify-between mt-3 text-[0.65rem] font-medium text-white/70 tracking-widest relative z-10">
              <span>踏破 {totalVisited} 島</span>
              <span>残り {ALL_ISLANDS_COUNT - totalVisited} 島</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Refined Categories */}
      <div className="px-8 lg:px-12 py-20 lg:py-32 bg-white">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-xl lg:text-2xl text-slate-800 tracking-widest">目的から探す</h2>
          <div className="w-12 h-[1px] bg-slate-300 mx-auto mt-6" />
        </div>
        
        <div className="flex justify-start md:justify-center gap-8 md:gap-16 overflow-x-auto hide-scrollbar -mx-8 px-8 snap-x pb-4">
          {[
            { id: 'transparency', icon: Droplets, label: '海の透明度' },
            { id: 'stars', icon: Moon, label: '星空' },
            { id: 'sauna', icon: Wind, label: 'サウナ' },
            { id: 'luxury', icon: BedDouble, label: '高級宿' }
          ].map((cat) => (
            <div key={cat.id} className="snap-center flex flex-col items-center gap-4 cursor-pointer group shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                <cat.icon size={22} strokeWidth={1} />
              </div>
              <span className="text-[0.65rem] font-medium text-slate-500 tracking-widest group-hover:text-slate-800 transition-colors">{cat.label}</span>
            </div>
          ))}
        </div>
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
            
            return (
              <motion.div 
                key={region.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/region/${region.id}`)}
                className="relative h-[280px] rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
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
      </div>

      {/* Floating Bottom Nav - Ultra Minimal (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent" />
        <div className="relative max-w-sm mx-auto px-8 pb-[calc(24px+env(safe-area-inset-bottom))] pt-12 flex justify-between items-end pointer-events-auto">
          <button className="flex flex-col items-center gap-2 text-slate-800 hover:scale-110 transition-transform">
            <Compass size={24} strokeWidth={1.5} />
            <span className="text-[0.6rem] font-bold tracking-widest">探す</span>
          </button>
          <button className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-800 hover:scale-110 transition-all">
            <Map size={24} strokeWidth={1.5} />
            <span className="text-[0.6rem] font-bold tracking-widest">マップ</span>
          </button>
          <button className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-800 hover:scale-110 transition-all">
            <User size={24} strokeWidth={1.5} />
            <span className="text-[0.6rem] font-bold tracking-widest">マイページ</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}
