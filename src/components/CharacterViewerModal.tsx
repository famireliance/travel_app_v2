import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CalendarHeart, MapPin, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface CharacterViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  image?: string;
  icon?: string;
  name: string;
  theme?: string;
  description?: string;
  badgeGradient?: string;
  metDate?: string;
  metLocation?: string;
}

export default function CharacterViewerModal({ isOpen, onClose, image, icon, name, theme, description, badgeGradient = 'from-amber-200 to-amber-500', metDate, metLocation }: CharacterViewerModalProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  if (!isOpen) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - card.left;
    const y = e.clientY - card.top;
    const centerX = card.width / 2;
    const centerY = card.height / 2;
    setRotateX((centerY - y) / 15);
    setRotateY((x - centerX) / 15);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleAROverlay = () => {
    toast('精霊ARモード: お手元の旅行写真を選択して、精霊と一緒に記念写真を保存できます！', { icon: '📸', duration: 4000 });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ perspective: 1000 }}
          className="relative z-10 w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4 z-30">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-sm border border-white/10">
              <X size={20} />
            </button>
          </div>

          {/* 3D Hologram Tilt Card Container */}
          <div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
            className={`w-full aspect-square relative bg-gradient-to-br ${badgeGradient} flex items-center justify-center p-8 overflow-hidden group select-none`}
          >
            {/* Holographic Rainbow Reflective Sheen Layer */}
            <div 
              style={{
                background: `radial-gradient(circle at ${50 + rotateY * 3}% ${50 - rotateX * 3}%, rgba(255,255,255,0.4) 0%, rgba(255,215,0,0.2) 30%, rgba(0,255,255,0.2) 60%, transparent 80%)`
              }}
              className="absolute inset-0 opacity-80 mix-blend-overlay pointer-events-none transition-opacity duration-300" 
            />
            
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 mix-blend-overlay pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/90 pointer-events-none" />
            
            {image ? (
              <motion.img 
                initial={{ scale: 0.8, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                src={image} alt={name} className="w-full h-full object-contain relative z-10 drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]" 
              />
            ) : (
              <motion.div 
                initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-[120px] relative z-10 drop-shadow-2xl"
              >
                {icon}
              </motion.div>
            )}

            <div className="absolute bottom-3 left-3 z-20">
              <span className="text-[10px] font-bold text-amber-300 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> 3D ホログラムカード
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-slate-900 relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800 border border-slate-600 px-4 py-1.5 rounded-full shadow-lg z-20">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300 tracking-widest">{theme || '精霊キャラクター'}</span>
            </div>
            
            <div className="text-center mt-4">
              <h2 className="text-3xl font-serif font-bold text-white mb-4 drop-shadow-sm">{name}</h2>
              {description && (
                <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                  {description}
                </p>
              )}
              
              {(metDate || metLocation) && (
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col items-center gap-2">
                  <div className="text-[10px] font-bold text-amber-400 tracking-widest uppercase mb-1">出会いの記録</div>
                  {metDate && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/20 px-3 py-1.5 rounded-full">
                      <CalendarHeart className="w-3 h-3 text-pink-400" /> {metDate}
                    </div>
                  )}
                  {metLocation && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/20 px-3 py-1.5 rounded-full">
                      <MapPin className="w-3 h-3 text-blue-400" /> {metLocation} エリア
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={handleAROverlay}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  精霊ARフォトフレームで記念撮影
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
