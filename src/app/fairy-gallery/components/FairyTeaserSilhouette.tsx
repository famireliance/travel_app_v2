'use client';

import React from 'react';
import Image from 'next/image';
import { Lock, Sparkles } from 'lucide-react';
import { IslandFairy } from '@/lib/fairies';

interface FairyTeaserSilhouetteProps {
  fairy: IslandFairy;
  size?: 'sm' | 'md' | 'lg';
  showLockBadge?: boolean;
}

export default function FairyTeaserSilhouette({
  fairy,
  size = 'md',
  showLockBadge = true,
}: FairyTeaserSilhouetteProps) {
  const hasImage = Boolean(fairy.visual?.imageUrl);

  // 属性カラーのデフォルトフォールバック
  const colorFrom = fairy.visual?.colorFrom || 'from-blue-500';
  const colorTo = fairy.visual?.colorTo || 'to-indigo-600';

  // サイズごとのスタイル分岐
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  const blurClass = isLarge
    ? 'blur-[7px] group-hover:blur-[2.5px]'
    : isSmall
    ? 'blur-[4px] group-hover:blur-[1.5px]'
    : 'blur-[5.5px] group-hover:blur-[2px]';

  const ringSizeClass = isLarge ? 'w-20 h-20' : isSmall ? 'w-10 h-10' : 'w-14 h-14';
  const innerRingClass = isLarge ? 'w-14 h-14' : isSmall ? 'w-7 h-7' : 'w-10 h-10';
  const iconSizeClass = isLarge ? 'w-7 h-7' : isSmall ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center overflow-hidden select-none bg-slate-950"
      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
    >
      {/* 1. 背面の幻想的な属性オーラグラデーション（ホバーで光量アップ） */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr ${colorFrom} ${colorTo} opacity-25 blur-xl transition-all duration-700 group-hover:opacity-45 group-hover:scale-110 pointer-events-none animate-pulse`}
      />

      {hasImage ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* 2. 実際の妖精イラスト（神秘のヴェール・ティザー）
              - 通常時: 美しいイラストが幻想的な霧の奥に浮かび、色合いやポーズが垣間見える
              - ホバー時: ブラーが解け、真の姿が露わになりかけるスリルある演出 */}
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={fairy.visual.imageUrl!}
              alt="ティザープレビュー"
              fill
              className={`object-contain filter ${blurClass} brightness-[0.78] contrast-[1.12] saturate-[1.25] transition-all duration-500 ease-out group-hover:brightness-[0.95] group-hover:scale-105`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />

            {/* 3. 神秘的なダークビネット＆グラデーションオーバーレイ */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/40 transition-opacity duration-500 group-hover:opacity-60" />

            {/* 4. スタイリッシュな斜光シマーエフェクト */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </div>

          {/* 5. 中央の神秘的なルーンリング & 鍵アイコン */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-transform duration-300 group-hover:scale-105">
            {/* ルーンサークル */}
            <div className="relative flex items-center justify-center mb-1">
              <div className={`${ringSizeClass} rounded-full border border-dashed border-white/40 animate-[spin_20s_linear_infinite]`} />
              <div className={`absolute ${innerRingClass} rounded-full bg-slate-950/80 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg group-hover:border-blue-400 transition-colors`}>
                <Lock className={`${iconSizeClass} text-amber-400 animate-pulse`} />
              </div>
            </div>

            {/* 6. 上品な LOCKED バッジ */}
            {showLockBadge && !isSmall && (
              <div className="mt-1 flex flex-col items-center gap-0.5">
                <div className={`inline-flex items-center gap-1 ${isLarge ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'} rounded-full bg-slate-900/90 border border-amber-500/40 backdrop-blur-md text-amber-200 font-bold tracking-wider shadow-md uppercase`}>
                  <span>LOCKED</span>
                </div>
                <span className={`${isLarge ? 'text-xs' : 'text-[9px]'} text-slate-300 drop-shadow-sm font-medium tracking-tight`}>
                  {fairy.island_id ? `${fairy.island_id}で解放` : '島を訪れて解放'}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 画像がない場合のフォールバック */
        <div className="flex flex-col items-center justify-center text-slate-500 space-y-2 z-10">
          <div className="relative">
            <span className={`${isLarge ? 'text-7xl' : 'text-5xl'} opacity-40 filter drop-shadow`}>
              {fairy.visual?.icon || '🧚'}
            </span>
            <Lock className="w-4 h-4 text-amber-400 absolute -top-1 -right-1" />
          </div>
          <span className={`${isLarge ? 'text-2xl' : 'text-xl'} font-bold font-mono tracking-widest text-slate-400`}>???</span>
          <span className="text-[10px] text-slate-500">未解放</span>
        </div>
      )}
    </div>
  );
}
