'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  X, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ExternalLink,
  Info,
  Lock
} from 'lucide-react';
import { IslandFairy, FairyRarity, FairyAttribute } from '@/lib/fairies';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { formatHabitatName } from './FairyDetailModal';
import FairyTeaserSilhouette from './FairyTeaserSilhouette';

interface FairyCardViewerModalProps {
  fairies: IslandFairy[];
  currentFairyId: string | null;
  isOpen: boolean;
  isRevealed: boolean;
  onClose: () => void;
  onSelectFairyId: (id: string) => void;
}

// レアリティごとの装飾定義
const RARITY_CONFIG: Record<FairyRarity, {
  label: string;
  badge: string;
  borderColor: string;
  glowColor: string;
  foilGradient: string;
}> = {
  NORMAL: {
    label: 'NORMAL',
    badge: 'bg-slate-700 text-slate-300 border-slate-500',
    borderColor: 'border-slate-500',
    glowColor: 'shadow-[0_0_30px_rgba(148,163,184,0.3)]',
    foilGradient: 'from-slate-400/10 via-white/20 to-transparent',
  },
  RARE: {
    label: 'RARE ★',
    badge: 'bg-blue-900/90 text-blue-200 border-blue-400',
    borderColor: 'border-blue-400',
    glowColor: 'shadow-[0_0_45px_rgba(96,165,250,0.5)]',
    foilGradient: 'from-blue-400/20 via-cyan-300/30 to-transparent',
  },
  EPIC: {
    label: 'EPIC ★★★',
    badge: 'bg-amber-900/90 text-amber-200 border-amber-400',
    borderColor: 'border-amber-400',
    glowColor: 'shadow-[0_0_55px_rgba(251,191,36,0.6)]',
    foilGradient: 'from-amber-300/30 via-yellow-200/40 to-transparent',
  },
  SPOT_EXCLUSIVE: {
    label: 'SPOT EXCLUSIVE 💎',
    badge: 'bg-emerald-900/90 text-emerald-200 border-emerald-400',
    borderColor: 'border-emerald-400',
    glowColor: 'shadow-[0_0_50px_rgba(52,211,153,0.5)]',
    foilGradient: 'from-emerald-300/30 via-teal-200/40 to-transparent',
  },
};

// 属性設定
const ATTRIBUTE_LABELS: Record<FairyAttribute, { label: string; color: string; icon: string }> = {
  WATER: { label: '水属性', color: 'text-blue-300', icon: '🌊' },
  FIRE: { label: '炎属性', color: 'text-rose-300', icon: '🔥' },
  NATURE: { label: '自然属性', color: 'text-emerald-300', icon: '🌿' },
  LIGHT: { label: '光属性', color: 'text-amber-300', icon: '✨' },
  EARTH: { label: '大地属性', color: 'text-amber-200', icon: '⛰️' },
  WIND: { label: '風属性', color: 'text-teal-300', icon: '🍃' },
  ICE: { label: '氷属性', color: 'text-cyan-200', icon: '❄️' },
};

// 島マスターからの逆引き
function findRelatedIsland(fairy: IslandFairy) {
  const dictionary = ALL_ISLANDS_MASTER_DICTIONARY;
  const islands = Object.values(dictionary);

  if (fairy.island_id && dictionary[fairy.island_id]) {
    const isl = dictionary[fairy.island_id];
    return { id: isl.id, name: isl.name, prefecture: isl.prefecture, slug: isl.slug };
  }

  if (fairy.island_id) {
    const target = fairy.island_id.toLowerCase().trim();
    const found = islands.find(
      (isl: any) =>
        isl.name === fairy.island_id ||
        isl.slug === target ||
        (isl.name && (isl.name.includes(fairy.island_id as string) || (fairy.island_id as string).includes(isl.name)))
    );
    if (found) {
      return { id: found.id, name: found.name, prefecture: found.prefecture, slug: found.slug };
    }
  }

  for (const isl of islands as any[]) {
    if (isl.name && isl.name.length >= 2) {
      if (
        fairy.name.includes(isl.name) ||
        fairy.theme.includes(isl.name) ||
        fairy.description.includes(isl.name)
      ) {
        return { id: isl.id, name: isl.name, prefecture: isl.prefecture, slug: isl.slug };
      }
    }
  }

  return null;
}

export default function FairyCardViewerModal({
  fairies,
  currentFairyId,
  isOpen,
  isRevealed,
  onClose,
  onSelectFairyId,
}: FairyCardViewerModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  // 現在の妖精インデックス
  const currentIndex = fairies.findIndex(f => f.id === currentFairyId);
  const fairy = fairies[currentIndex] || null;

  // キーボード操作（左右で送り、ESCで閉じる、スペースで回転）
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, fairies]);

  // 前後の妖精へ
  const goToPrev = () => {
    if (fairies.length === 0) return;
    const prevIdx = (currentIndex - 1 + fairies.length) % fairies.length;
    setIsFlipped(false);
    setIsZoomed(false);
    onSelectFairyId(fairies[prevIdx].id);
  };

  const goToNext = () => {
    if (fairies.length === 0) return;
    const nextIdx = (currentIndex + 1) % fairies.length;
    setIsFlipped(false);
    setIsZoomed(false);
    onSelectFairyId(fairies[nextIdx].id);
  };

  // 3D Tilt & ホログラム光彩効果（マウス追従）
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isZoomed) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12; // 最大±12度傾斜
    const rotateY = ((x - centerX) / centerX) * 12;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, glareX, glareY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  if (!isOpen || !fairy) return null;

  const rarity = RARITY_CONFIG[fairy.rarity] || RARITY_CONFIG.NORMAL;
  const attrInfo = ATTRIBUTE_LABELS[fairy.attribute] || { label: fairy.attribute, color: 'text-slate-300', icon: '✨' };
  const relatedIsland = findRelatedIsland(fairy);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 p-4 sm:p-6 overflow-hidden select-none">
      {/* 背景クリックで閉じる */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* トップ操作バー */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-mono px-3 py-1.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 backdrop-blur-md">
            No. {fairy.id.replace('fairy_', '').toUpperCase()} ({currentIndex + 1} / {fairies.length})
          </span>
          <span className="hidden sm:inline-block text-xs text-slate-400">
            [←] [→] で切り替え / [スペース] またはタップで裏返し
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 裏返しボタン */}
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition backdrop-blur-md"
            title="カードを裏返す (スペースキー)"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-400" />
            <span>{isFlipped ? '表面へ' : '裏面へ'}</span>
          </button>

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-rose-600/80 text-white flex items-center justify-center transition border border-slate-700 backdrop-blur-md"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 前へボタン */}
      <button
        onClick={goToPrev}
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-850/80 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 shadow-2xl transition hover:scale-110 active:scale-95 backdrop-blur-md"
        title="前の妖精 (←キー)"
      >
        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* 次へボタン */}
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-850/80 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 shadow-2xl transition hover:scale-110 active:scale-95 backdrop-blur-md"
        title="次の妖精 (→キー)"
      >
        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* メイン: 特大妖精カード */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center max-w-full my-auto"
        style={{ perspective: '1200px' }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative cursor-pointer transition-transform duration-300 ease-out ${rarity.glowColor}`}
          style={{
            width: isZoomed ? 'min(92vw, 540px)' : 'min(86vw, 400px)',
            aspectRatio: '2/3',
            transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY + (isFlipped ? 180 : 0)}deg)`,
            transformStyle: 'preserve-3d',
            transition: isFlipped ? 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)' : 'transform 0.15s ease-out',
          }}
        >
          {/* ===================== 表面 (Front) ===================== */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-4 ${rarity.borderColor} flex flex-col overflow-hidden shadow-2xl`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* ホログラム光彩レイヤー（マウス位置に追従してキラキラ光る） */}
            <div
              className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle 300px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.4), transparent 80%)`,
              }}
            />

            {/* レアリティ特有のプリズム光彩 */}
            <div
              className={`absolute inset-0 pointer-events-none z-10 bg-gradient-to-tr ${rarity.foilGradient} opacity-60 mix-blend-color-dodge`}
            />

            {/* カード上部ヘッダー（名前、属性、アイコン） */}
            <div className={`h-14 w-full flex items-center justify-between px-4 bg-gradient-to-r ${fairy.visual.colorFrom} ${fairy.visual.colorTo} bg-opacity-30 border-b border-white/10 z-10`}>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl filter drop-shadow">{fairy.visual.icon}</span>
                <span className="text-base sm:text-lg font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-xs drop-shadow">
                  {isRevealed ? fairy.name : '？？？'}
                </span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${rarity.badge} shadow-sm`}>
                {rarity.label}
              </span>
            </div>

            {/* イラスト表示領域（特大） */}
            <div className="flex-1 relative bg-slate-950 w-full flex items-center justify-center p-4 overflow-hidden">
              {/* 背景の魔方陣風グラデーションサークル */}
              <div className={`absolute w-64 h-64 rounded-full bg-gradient-to-tr ${fairy.visual.colorFrom} ${fairy.visual.colorTo} opacity-20 blur-2xl animate-pulse pointer-events-none`} />

              {isRevealed && fairy.visual.imageUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={fairy.visual.imageUrl}
                    alt={fairy.name}
                    fill
                    className="object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
                    sizes="420px"
                    priority
                  />
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <FairyTeaserSilhouette fairy={fairy} size="lg" />
                </div>
              )}

              {/* 属性バッジ */}
              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg">
                <span className="text-sm">{attrInfo.icon}</span>
                <span className={`text-xs font-bold ${attrInfo.color}`}>{attrInfo.label}</span>
              </div>

              {/* 拡大ヒント */}
              <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                <RotateCw className="w-3 h-3 text-blue-400" />
                <span>タップで裏面</span>
              </div>
            </div>

            {/* カード下部フッター（テーマ＆生息島） */}
            <div className="h-16 bg-slate-950 border-t border-slate-800/80 px-4 flex flex-col justify-center text-center z-10">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                {isRevealed ? fairy.theme : `🔒 ${fairy.island_id ? `「${fairy.island_id}」` : '全国離島'}の未知なる守護精霊`}
              </span>
              <span className="text-[11px] text-blue-400/90 flex items-center justify-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span>{relatedIsland ? `${relatedIsland.name} (${relatedIsland.prefecture || '離島'})` : formatHabitatName(fairy)}</span>
              </span>
            </div>
          </div>

          {/* ===================== 裏面 (Back) ===================== */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-4 ${rarity.borderColor} flex flex-col p-6 sm:p-8 shadow-2xl overflow-y-auto`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              {/* アイコンサークル */}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl ${isRevealed ? `bg-gradient-to-br ${fairy.visual.colorFrom} ${fairy.visual.colorTo}` : 'bg-slate-900 border border-slate-700 shadow-inner'} shadow-xl border border-white/20`}>
                {isRevealed ? fairy.visual.icon : <Lock className="w-8 h-8 text-amber-400" />}
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  {isRevealed ? fairy.name : '？？？（未発見）'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isRevealed ? fairy.theme : `${fairy.island_id || '離島'}に眠る守護精霊`}
                </p>
              </div>

              <div className="w-full h-px bg-slate-800" />

              {/* 生態・伝承解説 */}
              <div className="text-left w-full bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 shadow-inner">
                <span className="text-[11px] font-bold text-blue-400 tracking-wider uppercase block mb-1.5">
                  📖 図鑑の公式記録
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-h-36 overflow-y-auto">
                  {isRevealed
                    ? fairy.description
                    : `この妖精は未発見の状態で眠っています。${fairy.island_id ? `「${fairy.island_id}」` : '該当の島'}を実際に訪れて位置情報チェックインまたは公式到達証明を発行することで、真の姿と神秘のステータスが解放されます。`}
                </p>
              </div>

              {/* 関連島 */}
              {relatedIsland && (
                <div className="w-full text-left bg-blue-950/30 border border-blue-900/50 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-blue-300 block">ゆかりの島</span>
                    <span className="text-sm font-bold text-white">{relatedIsland.name}</span>
                  </div>
                  <Link
                    href={`/island/${relatedIsland.id || relatedIsland.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow"
                  >
                    <span>島を見る</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 font-mono text-center pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <span>KIRATABI FAIRY MASTER</span>
              <span>No. {fairy.id.replace('fairy_', '').toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 下部アクションバー */}
      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex items-center justify-center gap-3 z-20 pointer-events-auto">
        {relatedIsland && (
          <Link
            href={`/island/${relatedIsland.id || relatedIsland.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg transition"
          >
            <span>🏝️ {relatedIsland.name} の島詳細を見る</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}

        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 shadow-lg transition backdrop-blur-md"
        >
          {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          <span>{isZoomed ? '標準サイズ' : 'さらに拡大'}</span>
        </button>
      </div>
    </div>
  );
}
