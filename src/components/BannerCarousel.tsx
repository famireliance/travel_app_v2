'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AdCampaign = {
  id: string;
  title?: string;
  subtitle?: string;
  sponsor_name?: string;
  banner_url: string;
  target_url: string;
};

interface BannerCarouselProps {
  campaigns: AdCampaign[];
  marginTop?: string;
}

export default function BannerCarousel({ campaigns, marginTop = 'mt-0' }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!campaigns || campaigns.length <= 1) return;
    
    // Auto slide every 5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [campaigns]);

  if (!campaigns || campaigns.length === 0) return null;

  const activeCampaign = campaigns[currentIndex];

  return (
    <div className={`w-full bg-slate-950 cursor-pointer overflow-hidden ${marginTop} shadow-xl`} onClick={() => { if (activeCampaign.target_url) window.open(activeCampaign.target_url, '_blank'); }}>
      <div className="max-w-7xl mx-auto h-32 sm:h-36 lg:h-40 relative group">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCampaign.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image with Zoom Effect */}
            <img 
              src={activeCampaign.banner_url} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 ease-linear scale-100 group-hover:scale-105" 
            />
            
            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-slate-900/20 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>

            {/* Native Ad Content */}
            <div className="absolute inset-0 px-6 sm:px-10 lg:px-16 flex flex-col justify-center">
              <span className="text-blue-400 text-[0.60rem] font-bold tracking-[0.2em] uppercase mb-1.5 flex items-center gap-2">
                <span className="w-2 h-0.5 bg-blue-500 rounded-full"></span>
                Sponsored by {activeCampaign.sponsor_name || 'KIRATABI'}
              </span>
              <h3 className="text-white font-serif font-bold text-lg sm:text-2xl lg:text-3xl mb-1 leading-tight tracking-wide drop-shadow-md">
                {activeCampaign.title || 'おすすめキャンペーン情報'}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed font-serif tracking-wide opacity-90">
                {activeCampaign.subtitle || '提携パートナーからの特別なご案内です。'}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Pagination Dots */}
        {campaigns.length > 1 && (
          <div className="absolute bottom-3 right-6 flex gap-1.5 z-10">
            {campaigns.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'bg-blue-400 w-5' : 'bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
