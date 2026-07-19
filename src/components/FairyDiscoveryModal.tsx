'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Award, X } from 'lucide-react';
import { useTravel } from '@/context/TravelContext';
import { IslandFairy } from '@/lib/fairies';
import confetti from 'canvas-confetti';

export default function FairyDiscoveryModal() {
  const { newlyDiscoveredFairies, clearDiscoveredFairy, collectedFairyDates } = useTravel();
  const [currentFairy, setCurrentFairy] = useState<IslandFairy | null>(null);

  useEffect(() => {
    if (newlyDiscoveredFairies.length > 0 && !currentFairy) {
      setCurrentFairy(newlyDiscoveredFairies[0]);
      
      // Fire confetti when a new fairy appears
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    }
  }, [newlyDiscoveredFairies, currentFairy]);

  const handleClose = () => {
    if (currentFairy) {
      clearDiscoveredFairy(currentFairy.id);
      setCurrentFairy(null);
    }
  };

  if (!currentFairy) return null;

  const isRareOrEpic = currentFairy.rarity === 'RARE' || currentFairy.rarity === 'EPIC' || currentFairy.rarity === 'SPOT_EXCLUSIVE';
  
  // 取得日時（フォーマット）
  const rawDate = collectedFairyDates[currentFairy.id] || new Date().toISOString();
  const obtainedDate = new Date(rawDate).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ duration: 1, type: "spring", bounce: 0.5 }}
          className="relative w-full max-w-sm flex flex-col items-center"
        >
          {/* Close button top right */}
          <button 
            onClick={handleClose}
            className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-8">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-amber-400 font-bold tracking-[0.3em] text-sm uppercase mb-2 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> NEW DISCOVERY <Sparkles size={16} />
            </motion.h2>
            <motion.h3 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
              className="text-white text-2xl font-serif font-bold"
            >
              新しい妖精が仲間になった！
            </motion.h3>
          </div>

          {/* Premium Trading Card UI */}
          <div className={`relative w-full aspect-[2/3] rounded-3xl p-1 bg-gradient-to-br from-white/40 via-white/10 to-white/5 ${isRareOrEpic ? 'animate-pulse shadow-[0_0_50px_rgba(251,191,36,0.4)]' : 'shadow-2xl'}`}>
            {/* Card Content */}
            <div className={`absolute inset-1 rounded-2xl bg-gradient-to-br ${currentFairy.visual.colorFrom} ${currentFairy.visual.colorTo} p-6 flex flex-col items-center justify-between overflow-hidden shadow-inner`}>
              
              {/* Holographic overlay */}
              {isRareOrEpic && (
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay group-hover:bg-[length:150%_150%] transition-all duration-1000" />
              )}
              
              <div className="relative z-10 w-full flex justify-between items-start">
                <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/20">
                  {currentFairy.theme}
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                  currentFairy.rarity === 'EPIC' ? 'bg-purple-500/80 text-white border-purple-300' :
                  currentFairy.rarity === 'SPOT_EXCLUSIVE' ? 'bg-amber-500/80 text-white border-amber-300' :
                  currentFairy.rarity === 'RARE' ? 'bg-blue-500/80 text-white border-blue-300' :
                  'bg-slate-500/80 text-white border-slate-300'
                }`}>
                  {currentFairy.rarity}
                </div>
              </div>

              <div className="relative z-10 flex-1 flex items-center justify-center my-4">
                <motion.div 
                  animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className={`relative flex items-center justify-center filter drop-shadow-2xl ${currentFairy.visual.shadowColor}`}
                >
                  {currentFairy.imageUrl ? (
                    <img src={currentFairy.imageUrl} alt={currentFairy.name} className="w-48 h-48 object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-[120px]">{currentFairy.visual.icon}</span>
                  )}
                </motion.div>
              </div>

              <div className="relative z-10 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
                <h4 className="text-xl font-bold text-white mb-1">{currentFairy.name}</h4>
                {currentFairy.collabSponsor && (
                  <p className="text-[9px] text-amber-300 font-bold tracking-widest mb-2">SPONSORED BY {currentFairy.collabSponsor}</p>
                )}
                <p className="text-[10px] text-white/80 leading-relaxed line-clamp-3">
                  {currentFairy.description}
                </p>
              </div>
              
              {/* Timestamp & Location Stamp */}
              <div className="w-full mt-4 p-2 bg-black/30 rounded-lg text-left border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] text-white/70 font-mono">OBTAINED: {obtainedDate}</p>
                <p className="text-[10px] text-white/70 font-mono">LOCATION: {currentFairy.island_id.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
            onClick={handleClose}
            className="mt-8 bg-white hover:bg-slate-200 text-slate-900 font-bold px-8 py-3 rounded-full shadow-lg transition-colors"
          >
            図鑑に登録する
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
