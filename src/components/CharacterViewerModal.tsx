import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CalendarHeart, MapPin } from 'lucide-react';

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
  if (!isOpen) return null;

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
          className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4 z-20">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-sm border border-white/10">
              <X size={20} />
            </button>
          </div>

          <div className={`w-full aspect-square relative bg-gradient-to-br ${badgeGradient} flex items-center justify-center p-8 overflow-hidden`}>
            {/* Background effects */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/90" />
            
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
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
