'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Compass, ArrowRight, CheckCircle2 } from 'lucide-react';

const getFallbackPlaceholder = (areaOrPrefecture: string) => {
  if (areaOrPrefecture.includes('沖縄') || areaOrPrefecture.includes('八重山') || areaOrPrefecture.includes('宮古')) return '/region/okinawa_main.jpg';
  if (areaOrPrefecture.includes('伊豆') || areaOrPrefecture.includes('小笠原') || areaOrPrefecture.includes('東京')) return '/region/ogasawara.jpg';
  return '/hero/slide1.webp';
};

export interface NearbyIslandItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  island: any;
  distanceKm: number;
  isWithinCheckinRadius: boolean;
}

interface NearbyIslandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: NearbyIslandItem[];
}

export default function NearbyIslandsModal({ isOpen, onClose, items }: NearbyIslandsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const closestItem = items[0];
  const within50kmCount = items.filter(item => item.distanceKm <= 50).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-white tracking-wider flex items-center gap-2">
                  現在地から近い離島リスト
                </h3>
                <p className="text-xs text-slate-400">
                  {closestItem && closestItem.distanceKm <= 50
                    ? `半径50km圏内に ${within50kmCount} 島が見つかりました`
                    : `現在地から最も直線距離が近いトップ ${items.length} 島`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* List Content */}
          <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
            {items.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-sm font-bold">周辺の島データが見つかりませんでした</p>
              </div>
            ) : (
              items.map(({ island, distanceKm, isWithinCheckinRadius }, index) => {
                const distFormatted =
                  distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`;

                return (
                  <div
                    key={island.id || index}
                    onClick={() => {
                      onClose();
                      router.push(`/island/${island.id}`);
                    }}
                    className={`group relative rounded-2xl border p-4 transition-all cursor-pointer flex items-center gap-4 ${
                      index === 0
                        ? 'bg-slate-800/90 border-cyan-500/40 hover:border-cyan-400 shadow-md'
                        : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >

                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative border border-slate-700">
                      <img
                        src={
                          island.hero_image_url ||
                          island.image_url ||
                          `/region/${island.region_id || 'okinawa_main'}.jpg`
                        }
                        alt={island.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const t = e.currentTarget as HTMLImageElement;
                          const fallback = getFallbackPlaceholder(island.prefecture || '');
                          if (!t.src.endsWith(fallback)) {
                            t.src = fallback;
                          } else {
                            t.style.display = 'none';
                          }
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[0.65rem] font-bold text-slate-400 tracking-wider">
                          {island.prefecture || '日本離島'}
                        </span>
                        {isWithinCheckinRadius ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[0.6rem] font-bold border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={10} /> チェックイン判定エリア内
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[0.6rem] font-medium">
                            エリア外
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif font-bold text-base text-white group-hover:text-cyan-300 transition-colors truncate">
                        {island.name}
                      </h4>

                      <p className="text-[0.7rem] text-slate-400 line-clamp-1 mt-0.5">
                        {island.description}
                      </p>
                    </div>

                    {/* Distance Pill & Arrow */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1">
                        <MapPin size={12} className="text-cyan-400" />
                        <span>{distFormatted}</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 text-center shrink-0">
            <p className="text-[0.7rem] text-slate-500">
              ※ 直線距離で計算しています。実際の移動手段・アクセスは各島ページをご確認ください。
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
