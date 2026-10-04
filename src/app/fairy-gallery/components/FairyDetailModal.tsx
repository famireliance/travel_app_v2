'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, MapPin, Sparkles, Compass, ExternalLink, ArrowRight, ShieldCheck, Maximize2 } from 'lucide-react';
import { IslandFairy, FairyRarity, FairyAttribute } from '@/lib/fairies';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import FairyTeaserSilhouette from './FairyTeaserSilhouette';

interface FairyDetailModalProps {
  fairy: IslandFairy | null;
  isRevealed: boolean;
  onClose: () => void;
  onOpenViewer?: () => void;
}

// 属性ごとのバッジとカラー
const ATTRIBUTE_CONFIG: Record<FairyAttribute, { label: string; bg: string; text: string }> = {
  WATER: { label: '水属性 (WATER)', bg: 'bg-blue-500/20 border-blue-500/50', text: 'text-blue-300' },
  FIRE: { label: '炎属性 (FIRE)', bg: 'bg-rose-500/20 border-rose-500/50', text: 'text-rose-300' },
  NATURE: { label: '自然属性 (NATURE)', bg: 'bg-emerald-500/20 border-emerald-500/50', text: 'text-emerald-300' },
  LIGHT: { label: '光属性 (LIGHT)', bg: 'bg-amber-500/20 border-amber-500/50', text: 'text-amber-300' },
  EARTH: { label: '大地属性 (EARTH)', bg: 'bg-amber-800/30 border-amber-700/50', text: 'text-amber-200' },
  WIND: { label: '風属性 (WIND)', bg: 'bg-teal-500/20 border-teal-500/50', text: 'text-teal-300' },
  ICE: { label: '氷属性 (ICE)', bg: 'bg-cyan-500/20 border-cyan-500/50', text: 'text-cyan-200' },
};

// 地域スラッグの日本語名称マッピング（万一のフォールバック用）
const REGION_NAME_MAP: Record<string, string> = {
  okinawa_main: '沖縄本島周辺',
  yaeyama: '八重山諸島',
  miyako: '宮古諸島',
  amami: '奄美群島',
  izu: '伊豆諸島',
  ogasawara: '小笠原諸島',
  setouchi: '瀬戸内諸島',
  nagasaki: '長崎・五島列島',
  hokkaido: '北海道周辺離島',
  kagoshima: '鹿児島周辺離島',
  shimane: '隠岐諸島',
  niigata: '佐渡島周辺',
};

export function formatHabitatName(fairy: IslandFairy): string {
  if (fairy.island_id) {
    return REGION_NAME_MAP[fairy.island_id] || fairy.island_id;
  }
  if (fairy.region_id && REGION_NAME_MAP[fairy.region_id]) {
    return REGION_NAME_MAP[fairy.region_id];
  }
  return '日本全国の離島';
}

// レアリティの装飾
const RARITY_CONFIG: Record<FairyRarity, { label: string; border: string; glow: string; badge: string }> = {
  NORMAL: {
    label: 'NORMAL',
    border: 'border-slate-600',
    glow: '',
    badge: 'bg-slate-700 text-slate-200 border-slate-500',
  },
  RARE: {
    label: 'RARE ★',
    border: 'border-blue-400',
    glow: 'shadow-[0_0_30px_rgba(96,165,250,0.3)]',
    badge: 'bg-blue-900/80 text-blue-200 border-blue-400',
  },
  EPIC: {
    label: 'EPIC ★★★',
    border: 'border-amber-400',
    glow: 'shadow-[0_0_35px_rgba(251,191,36,0.35)]',
    badge: 'bg-amber-900/80 text-amber-200 border-amber-400',
  },
  SPOT_EXCLUSIVE: {
    label: 'SPOT EXCLUSIVE 💎',
    border: 'border-emerald-400',
    glow: 'shadow-[0_0_30px_rgba(52,211,153,0.3)]',
    badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-400',
  },
};

// 妖精から関連する島マスターデータを逆引きする関数
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
        (isl.name && fairy.island_id && (isl.name.includes(fairy.island_id) || fairy.island_id.includes(isl.name)))
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

export default function FairyDetailModal({ fairy, isRevealed, onClose, onOpenViewer }: FairyDetailModalProps) {
  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!fairy) return null;

  const rarity = RARITY_CONFIG[fairy.rarity] || RARITY_CONFIG.NORMAL;
  const attribute = ATTRIBUTE_CONFIG[fairy.attribute] || {
    label: fairy.attribute,
    bg: 'bg-slate-700',
    text: 'text-slate-300',
  };
  const relatedIsland = findRelatedIsland(fairy);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* クリック外で閉じる */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-2xl bg-slate-900 border ${rarity.border} ${rarity.glow} rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダーグラデーション */}
        <div
          className={`h-24 sm:h-28 w-full bg-gradient-to-r ${fairy.visual.colorFrom} ${fairy.visual.colorTo} relative flex items-end p-4 sm:p-6`}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {onOpenViewer && (
              <button
                onClick={onOpenViewer}
                className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-blue-600 text-white flex items-center gap-1.5 transition border border-white/20 text-xs font-semibold shadow"
                title="3D特大カード鑑賞モードを開く"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">特大カード</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition border border-white/20"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl filter drop-shadow-md">{fairy.visual.icon}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${rarity.badge}`}>
                  {rarity.label}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${attribute.bg} ${attribute.text}`}>
                  {attribute.label}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide mt-1 drop-shadow-sm">
                {isRevealed ? fairy.name : '？？？（未発見の妖精）'}
              </h2>
            </div>
          </div>
        </div>

        {/* コンテンツ本体 */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* 画像 & 基本紹介 */}
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* イラスト表示領域（クリックで特大カードビューへ） */}
            <div 
              onClick={onOpenViewer}
              className={`relative w-48 h-64 sm:w-52 sm:h-68 rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center p-3 shadow-inner group ${onOpenViewer ? 'cursor-pointer hover:border-blue-500/80 transition' : ''}`}
              title={onOpenViewer ? 'クリックして特大カードで鑑賞' : ''}
            >
              {isRevealed && fairy.visual.imageUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={fairy.visual.imageUrl}
                    alt={fairy.name}
                    fill
                    className="object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
                    sizes="220px"
                  />
                  {onOpenViewer && (
                    <div className="absolute inset-0 bg-blue-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center backdrop-blur-[2px]">
                      <span className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>特大表示</span>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <FairyTeaserSilhouette fairy={fairy} size="lg" />
                  {onOpenViewer && (
                    <div className="absolute inset-0 bg-blue-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center backdrop-blur-[2px]">
                      <span className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>特大ティザー鑑賞</span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* テキスト詳細 */}
            <div className="flex-1 space-y-4 text-left w-full">
              <div>
                <span className="text-xs text-blue-400 font-semibold tracking-wider uppercase">テーマ</span>
                <p className="text-base sm:text-lg font-bold text-slate-100">
                  {isRevealed
                    ? fairy.theme
                    : `🔒 ${fairy.island_id ? `「${fairy.island_id}」` : '全国離島'}の未知なる守護妖精`}
                </p>
              </div>

              <div>
                <span className="text-xs text-blue-400 font-semibold tracking-wider uppercase">図鑑の生態記録</span>
                <p className="text-sm text-slate-300 leading-relaxed mt-1 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  {isRevealed
                    ? fairy.description
                    : `この妖精の詳しい生態はまだ封印されています。${fairy.island_id ? `「${fairy.island_id}」` : '該当の島'}へ実際に足を運び、位置情報チェックインまたは公式到達証明を発行することで、真の姿と神秘の力が解放されます。`}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-500 font-mono">
                  ずかん登録No: {fairy.id.replace('fairy_', '').toUpperCase()}
                </div>
                {onOpenViewer && (
                  <button
                    onClick={onOpenViewer}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>3D特大カードを見る</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 生息地・島連携カード */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-950/90 border border-slate-700 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">主な生息地・ゆかりの島</h3>
              </div>
              {relatedIsland?.prefecture && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {relatedIsland.prefecture}
                </span>
              )}
            </div>

            {relatedIsland ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-blue-300">{relatedIsland.name}</p>
                    <p className="text-xs text-slate-400">
                      この島にチェックインまたは訪れることで妖精の力が高まります。
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/island/${relatedIsland.id || relatedIsland.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-blue-500/25 transition"
                  >
                    <span>🏝️ {relatedIsland.name} の島詳細を見る</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/map`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-600 transition"
                  >
                    <Compass className="w-4 h-4 text-blue-400" />
                    <span>マップで位置を確認</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-300">
                  生息地: <span className="font-semibold text-blue-300">{formatHabitatName(fairy)}</span>
                </p>
                <div className="pt-1">
                  <Link
                    href="/map"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition"
                  >
                    <Compass className="w-4 h-4" />
                    <span>全国離島マップで探す</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          {onOpenViewer ? (
            <button
              onClick={onOpenViewer}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow transition"
            >
              <Maximize2 className="w-4 h-4" />
              <span>特大カードで鑑賞</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition border border-slate-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
