'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTravel } from '@/context/TravelContext';
import { getPlayerLevelInfo } from '@/lib/gamification';
import { Star, Award, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LevelUpModal() {
  const { totalPoints, isDataLoaded } = useTravel();
  const [showModal, setShowModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [levelInfo, setLevelInfo] = useState<any>(null);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    // データが完全にロードされるまでは処理しない
    if (!isDataLoaded || totalPoints === undefined || totalPoints === null) return;
    
    const currentInfo = getPlayerLevelInfo(totalPoints);
    const currentLevel = currentInfo.level;

    if (prevLevelRef.current === null) {
      // 初期ロード時: 過去に見たレベルを復元
      const storedLevelStr = localStorage.getItem('kira_last_seen_level');
      const storedLevel = storedLevelStr ? parseInt(storedLevelStr, 10) : null;
      
      if (storedLevel !== null && currentLevel <= storedLevel) {
        prevLevelRef.current = storedLevel;
      } else {
        // まだ保存されていないか、すでにレベルが上がっていた場合は保存して終了
        prevLevelRef.current = currentLevel;
        localStorage.setItem('kira_last_seen_level', currentLevel.toString());
      }
      return;
    }

    if (currentLevel > prevLevelRef.current) {
      // レベルアップを検知！
      setLevelInfo(currentInfo);
      setShowModal(true);
      
      // お祝いの紙吹雪
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#10b981']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#10b981']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // 今回見たレベルを記録
      prevLevelRef.current = currentLevel;
      localStorage.setItem('kira_last_seen_level', currentLevel.toString());
    }
  }, [totalPoints, isDataLoaded]);

  if (!levelInfo) return null;

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="relative w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden text-center border border-slate-700 p-8"
          >
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-6 relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${levelInfo.badgeColor} flex items-center justify-center shadow-xl border-4 border-white/10 relative z-10`}>
                <span className="text-4xl drop-shadow-md">{levelInfo.icon}</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-black text-white mb-2 tracking-widest uppercase">
                <span className="text-amber-400">Level</span> Up!
              </h2>
              <div className="text-amber-400 font-bold flex items-center justify-center gap-1 mb-4">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>Lv. {levelInfo.level}</span>
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                <p className="text-slate-400 text-xs mb-1">新たな称号を獲得</p>
                <h3 className="text-lg font-bold text-white mb-2">{levelInfo.title}</h3>
              </div>

              <button 
                onClick={() => setShowModal(false)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Award className="w-5 h-5" />
                冒険を続ける
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
