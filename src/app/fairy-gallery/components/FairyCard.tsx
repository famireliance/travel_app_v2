'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { IslandFairy } from '@/lib/fairies';
import { Maximize2, Sparkles, MapPin, Lock, RotateCw } from 'lucide-react';
import FairyTeaserSilhouette from './FairyTeaserSilhouette';

interface FairyCardProps {
  fairy: IslandFairy;
  isRevealed: boolean;
  onClick?: () => void;
  onZoom?: () => void;
}

export default function FairyCard({ fairy, isRevealed, onClick, onZoom }: FairyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Rarity styling mapping
  const rarityConfig = {
    NORMAL: { border: 'border-slate-600', glow: '', badge: 'bg-slate-700 text-slate-300' },
    RARE: { border: 'border-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.5)]', badge: 'bg-blue-900 text-blue-200 border border-blue-500' },
    EPIC: { border: 'border-yellow-400', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.6)]', badge: 'bg-yellow-900 text-yellow-200 border border-yellow-500' },
    SPOT_EXCLUSIVE: { border: 'border-emerald-400', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.5)]', badge: 'bg-emerald-900 text-emerald-200 border border-emerald-500' },
  };

  const style = rarityConfig[fairy.rarity] || rarityConfig.NORMAL;

  const handleToggleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(prev => !prev);
  };

  return (
    <div 
      className="relative w-full aspect-[2/3] group cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl select-none"
      style={{ perspective: '1000px' }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={onClick}
    >
      <div 
        className="relative w-full h-full transition-transform duration-500"
        style={{ 
          transformStyle: 'preserve-3d', 
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
        }}
      >
        {/* ===================== 表面 (Front) ===================== */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-xl bg-slate-800 border-2 ${style.border} ${style.glow} flex flex-col overflow-hidden transition-opacity duration-300 ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100 z-10'
          }`}
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(1px)'
          }}
        >
          {/* ヘッダー */}
          <div className={`h-8 w-full flex items-center justify-between px-2 bg-gradient-to-r ${fairy.visual.colorFrom} ${fairy.visual.colorTo} bg-opacity-20`}>
            <span className="text-xs font-bold text-white truncate pr-1">
              {isRevealed ? fairy.name : '？？？（未発見）'}
            </span>
            <span className="text-sm">{isRevealed ? fairy.visual.icon : '✨'}</span>
          </div>

          {/* イラスト表示領域（リッチティザーシルエット対応） */}
          <div className="flex-1 relative bg-slate-900 w-full flex items-center justify-center p-2 overflow-hidden">
            {isRevealed && fairy.visual.imageUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={fairy.visual.imageUrl}
                  alt={fairy.name}
                  fill
                  className="object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ) : (
              <FairyTeaserSilhouette fairy={fairy} size="md" />
            )}
            
            {/* 属性・レアリティバッジ */}
            <div className="absolute bottom-2 left-2 flex gap-1 z-10">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${style.badge} font-bold`}>
                {fairy.rarity}
              </span>
            </div>

            {/* 右上アクション: 特大カード拡大鑑賞ボタン */}
            {onZoom && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onZoom();
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition shadow-md border border-slate-700/80 opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 z-20"
                title="特大カードで拡大鑑賞"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          {/* フッター */}
          <div className="h-10 bg-slate-950 flex items-center justify-between px-2.5 text-center border-t border-slate-800/80">
            <span className="text-[10px] text-slate-300 truncate max-w-[110px] sm:max-w-[130px]">
              {isRevealed ? fairy.theme : `🔒 ${fairy.island_id ? `${fairy.island_id}の妖精` : '未発見の妖精'}`}
            </span>
            <span className="text-[9px] text-blue-400 font-medium whitespace-nowrap flex items-center gap-0.5">
              <span>詳細</span>
            </span>
          </div>
        </div>

        {/* ===================== 裏面 (Back) ===================== */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-xl bg-slate-900 border-2 ${style.border} flex flex-col p-3 shadow-2xl transition-opacity duration-300 ${
            isFlipped ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 pointer-events-none z-0'
          }`}
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg) translateZ(1px)' 
          }}
        >
          {/* 裏面ヘッダー */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 flex-shrink-0">
            <span className="text-[10px] font-bold text-amber-400 font-mono">
              No. {fairy.id.replace('fairy_', '').toUpperCase()}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${style.badge} font-bold`}>
              {fairy.rarity}
            </span>
          </div>

          {/* 裏面コンテンツ */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-1 overflow-hidden">
             <div className={`w-9 h-9 rounded-full mb-1.5 flex items-center justify-center text-lg flex-shrink-0 ${isRevealed ? `bg-gradient-to-br ${fairy.visual.colorFrom} ${fairy.visual.colorTo}` : 'bg-slate-800 border border-slate-700 shadow-inner'}`}>
               {isRevealed ? fairy.visual.icon : <Lock className="w-4 h-4 text-amber-400" />}
             </div>
             <h3 className="font-bold text-white mb-0.5 text-xs truncate max-w-full">
               {isRevealed ? fairy.name : '？？？（未発見）'}
             </h3>
             <p className="text-[10px] text-blue-400 font-medium mb-1.5 truncate max-w-full">
               {isRevealed ? fairy.theme : `${fairy.island_id || '離島'}に眠る守護精霊`}
             </p>
             <div className="w-full h-px bg-slate-800 mb-1.5"></div>
             
             {/* 解説テキスト領域（重なり一切なし・クッキリ読める） */}
             <div className="w-full text-left bg-slate-950/80 p-2 rounded-lg border border-slate-800 flex-1 overflow-y-auto max-h-24">
               <p className="text-[10px] text-slate-200 leading-relaxed">
                 {isRevealed
                   ? fairy.description
                   : `この妖精は未発見です。${fairy.island_id ? `「${fairy.island_id}」` : '該当の島'}を訪れてチェックインまたは到達証明を発行することで、真の姿と生態が図鑑にアンロックされます。`}
               </p>
             </div>
          </div>

          {/* 裏面フッター */}
          <div className="text-[10px] text-slate-400 text-center pt-1.5 border-t border-slate-800 flex items-center justify-between flex-shrink-0 mt-1">
            <span className="text-blue-400 font-medium text-[9px]">タップで詳細モーダル</span>
            <span className="text-slate-500 text-[9px]">{isRevealed ? '発見済み' : '未解放'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
