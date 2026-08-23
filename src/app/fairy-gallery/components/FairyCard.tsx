'use client';

import Image from 'next/image';
import { IslandFairy } from '@/lib/fairies';
import { useState } from 'react';

interface FairyCardProps {
  fairy: IslandFairy;
  isRevealed: boolean;
}

export default function FairyCard({ fairy, isRevealed }: FairyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Rarity styling mapping
  const rarityConfig = {
    NORMAL: { border: 'border-slate-600', glow: '', badge: 'bg-slate-700 text-slate-300' },
    RARE: { border: 'border-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.5)]', badge: 'bg-blue-900 text-blue-200 border border-blue-500' },
    EPIC: { border: 'border-yellow-400', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.6)]', badge: 'bg-yellow-900 text-yellow-200 border border-yellow-500' },
    SPOT_EXCLUSIVE: { border: 'border-emerald-400', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.5)]', badge: 'bg-emerald-900 text-emerald-200 border border-emerald-500' },
  };

  const style = rarityConfig[fairy.rarity] || rarityConfig.NORMAL;

  return (
    <div 
      className="relative w-full aspect-[2/3] group cursor-pointer"
      style={{ perspective: '1000px' }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div 
        className="relative w-full h-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        
        {/* Front of Card */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-xl bg-slate-800 border-2 ${style.border} ${style.glow} flex flex-col overflow-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Header */}
          <div className={`h-8 w-full flex items-center justify-between px-2 bg-gradient-to-r ${fairy.visual.colorFrom} ${fairy.visual.colorTo} bg-opacity-20`}>
            <span className="text-xs font-bold text-white truncate pr-1">{fairy.name}</span>
            <span className="text-sm">{fairy.visual.icon}</span>
          </div>

          {/* Image Area */}
          <div className="flex-1 relative bg-slate-900 w-full flex items-center justify-center p-2">
            {isRevealed && fairy.visual.imageUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={fairy.visual.imageUrl}
                  alt={fairy.name}
                  fill
                  className="object-contain drop-shadow-md"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600">
                <span className="text-4xl mb-2 opacity-30">{fairy.visual.icon}</span>
                <span className="text-xl font-bold font-mono">???</span>
              </div>
            )}
            
            {/* Attribute & Rarity Badges */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${style.badge} font-bold`}>
                {fairy.rarity}
              </span>
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shadow-lg text-xs">
                {fairy.visual.icon}
              </div>
            </div>
          </div>
          
          {/* Footer - Theme */}
          <div className="h-10 bg-slate-950 flex items-center justify-center px-2 text-center">
            <span className="text-[10px] text-slate-400">{isRevealed ? fairy.theme : '未発見の妖精'}</span>
          </div>
        </div>

        {/* Back of Card */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-xl bg-slate-800 border-2 ${style.border} flex flex-col p-4`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex-1 flex flex-col items-center justify-center text-center">
             <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center text-2xl bg-gradient-to-br ${fairy.visual.colorFrom} ${fairy.visual.colorTo}`}>
               {fairy.visual.icon}
             </div>
             <h3 className="font-bold text-white mb-1 text-sm">{isRevealed ? fairy.name : '???'}</h3>
             <p className="text-xs text-slate-400 mb-3">{isRevealed ? fairy.theme : '未知の領域'}</p>
             <div className="w-full h-px bg-slate-700 mb-3"></div>
             <p className="text-xs text-slate-300 leading-relaxed overflow-y-auto">
               {isRevealed ? fairy.description : 'この妖精を仲間にするか、特定のスポットを訪れると詳細な生態が記録されます。'}
             </p>
          </div>
          <div className="text-[10px] text-slate-500 text-center mt-2">
            No. {fairy.id.replace('fairy_', '')}
          </div>
        </div>
      </div>
    </div>
  );
}
