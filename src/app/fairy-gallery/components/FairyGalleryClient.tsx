'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Home, 
  MapPin, 
  Compass, 
  Search, 
  Sparkles, 
  Eye, 
  Lock, 
  RotateCcw, 
  Waves, 
  User, 
  Trophy, 
  Maximize2,
  Grid,
  LayoutGrid,
  SlidersHorizontal,
  X,
  Globe
} from 'lucide-react';
import { FAIRIES_MASTER, IslandFairy, FairyRarity, FairyAttribute } from '@/lib/fairies';
import FairyCard from './FairyCard';
import FairyDetailModal from './FairyDetailModal';
import FairyCardViewerModal from './FairyCardViewerModal';
import { useTravel } from '@/context/TravelContext';
import Breadcrumb from '@/components/Breadcrumb';

interface FairyGalleryClientProps {
  discoveredImages?: string[];
}

const I18N = {
  ja: {
    backToTop: 'トップへ戻る',
    brand: 'キラ旅',
    islandMap: '離島マップ',
    myPage: 'マイページ',
    myCollection: 'マイ図鑑に戻す',
    previewAll: '全種プレビュー',
    breadcrumb: 'ご当地妖精ずかん',
    title: 'ご当地妖精ずかん',
    totalPrefix: '全',
    totalSuffix: '体',
    description: '日本全国の離島に宿る、神秘的な守護妖精たちの公式図鑑です。カードをクリックすると詳細情報やゆかりの島が表示され、拡大鑑賞モードで3D大画面カードも楽しめます。',
    loginTip: 'ログインすると発見した妖精がアカウントに永久保存されます。',
    collectionStatus: 'コレクション達成状況',
    previewingAll: '※全種プレビュー中',
    rate: '達成率',
    cardZoomHint: 'カードの右上ボタンで特大鑑賞',
    searchPlaceholder: '妖精の名前、島名（青ヶ島、屋久島等）、テーマで検索...',
    sizeLabel: 'サイズ:',
    sizeSm: '小',
    sizeMd: '中',
    sizeLg: '大',
    statusAll: '全',
    statusDiscovered: '発見',
    statusUndiscovered: '未発見',
    rarityLabel: 'レアリティ:',
    attributeLabel: '属性:',
    all: 'すべて',
    allAttributes: '全属性',
    resultCount: '該当件数:',
    items: '件',
    zoomHint: '※カード右上の「🔍」で特大3D拡大ビューが開きます',
    reset: '条件をリセット',
    noResults: '条件に一致する妖精が見つかりません',
    noResultsDesc: '検索条件を変更するか、リセットをお試しください',
  },
  en: {
    backToTop: 'Back to Home',
    brand: 'KiraTabi',
    islandMap: 'Island Map',
    myPage: 'My Page',
    myCollection: 'My Collection',
    previewAll: 'Preview All',
    breadcrumb: 'Fairy Gallery',
    title: 'Local Fairy Encyclopedia',
    totalPrefix: 'Total',
    totalSuffix: 'Fairies',
    description: 'Official encyclopedia of mystical guardian fairies residing in islands across Japan. Click any card for details and island lore, or enjoy high-res 3D card viewing.',
    loginTip: 'Log in to permanently save your discovered fairies to your account.',
    collectionStatus: 'Collection Progress',
    previewingAll: '※ Previewing all fairies',
    rate: 'Progress',
    cardZoomHint: 'Click top-right icon on cards to zoom',
    searchPlaceholder: 'Search by fairy name, island, theme...',
    sizeLabel: 'Size:',
    sizeSm: 'S',
    sizeMd: 'M',
    sizeLg: 'L',
    statusAll: 'All',
    statusDiscovered: 'Found',
    statusUndiscovered: 'Locked',
    rarityLabel: 'Rarity:',
    attributeLabel: 'Element:',
    all: 'All',
    allAttributes: 'All Elements',
    resultCount: 'Matched:',
    items: 'items',
    zoomHint: '※ Click the "🔍" on any card for 3D fullscreen view',
    reset: 'Reset Filters',
    noResults: 'No fairies match your criteria',
    noResultsDesc: 'Try adjusting your search query or reset the filters',
  },
};

const ATTRIBUTE_LABELS: Record<FairyAttribute, { ja: string; en: string; icon: string }> = {
  WATER: { ja: '水 (WATER)', en: 'Water', icon: '🌊' },
  NATURE: { ja: '自然 (NATURE)', en: 'Nature', icon: '🌿' },
  FIRE: { ja: '炎 (FIRE)', en: 'Fire', icon: '🔥' },
  LIGHT: { ja: '光 (LIGHT)', en: 'Light', icon: '✨' },
  EARTH: { ja: '大地 (EARTH)', en: 'Earth', icon: '⛰️' },
  WIND: { ja: '風 (WIND)', en: 'Wind', icon: '🍃' },
  ICE: { ja: '氷 (ICE)', en: 'Ice', icon: '❄️' },
};

const ATTRIBUTES: { key: FairyAttribute; icon: string }[] = [
  { key: 'WATER', icon: '🌊' },
  { key: 'NATURE', icon: '🌿' },
  { key: 'FIRE', icon: '🔥' },
  { key: 'LIGHT', icon: '✨' },
  { key: 'EARTH', icon: '⛰️' },
  { key: 'WIND', icon: '🍃' },
  { key: 'ICE', icon: '❄️' },
];

const RARITIES: { key: FairyRarity; label: string; badge: string }[] = [
  { key: 'NORMAL', label: 'NORMAL', badge: 'bg-slate-700 text-slate-300' },
  { key: 'RARE', label: 'RARE ★', badge: 'bg-blue-900 text-blue-200 border border-blue-500' },
  { key: 'EPIC', label: 'EPIC ★★★', badge: 'bg-amber-900 text-amber-200 border border-amber-500' },
  { key: 'SPOT_EXCLUSIVE', label: 'SPOT 💎', badge: 'bg-emerald-900 text-emerald-200 border border-emerald-500' },
];

type CardGridSize = 'sm' | 'md' | 'lg';

export default function FairyGalleryClient({ discoveredImages = [] }: FairyGalleryClientProps) {
  const router = useRouter();
  const { collectedFairies, user } = useTravel();

  // 言語ステート (ja / en)
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const t = I18N[lang];

  // フィルター状態
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<FairyRarity | 'ALL'>('ALL');
  const [filterAttribute, setFilterAttribute] = useState<FairyAttribute | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COLLECTED' | 'UNCOLLECTED'>('ALL');
  const [previewAll, setPreviewAll] = useState(false);

  // 表示サイズ切り替え (小・中・大)
  const [gridSize, setGridSize] = useState<CardGridSize>('md');

  // 詳細モーダル表示用の選択妖精
  const [selectedFairy, setSelectedFairy] = useState<IslandFairy | null>(null);

  // 特大カード鑑賞モード用（Viewer）
  const [viewerFairyId, setViewerFairyId] = useState<string | null>(null);

  // 統計情報
  const totalCount = FAIRIES_MASTER.length;
  const discoveredCount = useMemo(() => {
    return FAIRIES_MASTER.filter(fairy => collectedFairies.includes(fairy.id)).length;
  }, [collectedFairies]);

  const progressPercent = Math.round((discoveredCount / (totalCount || 1)) * 100);

  // フィルタリング処理
  const filteredFairies = useMemo(() => {
    return FAIRIES_MASTER.filter(fairy => {
      // 1. レアリティフィルター
      if (filterRarity !== 'ALL' && fairy.rarity !== filterRarity) return false;

      // 2. 属性フィルター
      if (filterAttribute !== 'ALL' && fairy.attribute !== filterAttribute) return false;

      // 3. 所持状態フィルター
      const isCollected = collectedFairies.includes(fairy.id);
      if (filterStatus === 'COLLECTED' && !isCollected) return false;
      if (filterStatus === 'UNCOLLECTED' && isCollected) return false;

      // 4. フリーワード検索（妖精名・テーマ・生息島名・説明文・ID）
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = fairy.name.toLowerCase().includes(q);
        const themeMatch = fairy.theme.toLowerCase().includes(q);
        const descMatch = fairy.description.toLowerCase().includes(q);
        const islandMatch = (fairy.island_id || '').toLowerCase().includes(q);
        const regionMatch = (fairy.region_id || '').toLowerCase().includes(q);
        if (!nameMatch && !themeMatch && !descMatch && !islandMatch && !regionMatch) {
          return false;
        }
      }

      return true;
    });
  }, [filterRarity, filterAttribute, filterStatus, searchQuery, collectedFairies]);

  // フィルターリセット
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterRarity('ALL');
    setFilterAttribute('ALL');
    setFilterStatus('ALL');
  };

  const isFiltered = searchQuery !== '' || filterRarity !== 'ALL' || filterAttribute !== 'ALL' || filterStatus !== 'ALL';

  // グリッドカラムのクラス
  const gridClasses: Record<CardGridSize, string> = {
    sm: 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-4',
    md: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6',
    lg: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8',
  };

  return (
    <div className="w-full">
      {/* 1. 最上部ヘッダーバー */}
      <header className="sticky top-0 z-40 -mt-4 -mx-4 md:-mt-8 md:-mx-8 px-4 sm:px-8 py-3.5 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 shadow-lg mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* 左側: トップへ戻るボタン & ブランド */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-blue-500/30 transition group flex-shrink-0"
              title={t.backToTop}
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>{t.backToTop}</span>
            </Link>

            <Link href="/" className="hidden sm:flex items-center gap-2 text-slate-300 hover:text-white transition pl-1">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Waves className="w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-sm tracking-wider">{t.brand}</span>
            </Link>
          </div>

          {/* 右側: 言語切替・離島マップ・マイページ・プレビュー切替 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 🌐 言語切り替えトグル (JP / EN) */}
            <button
              onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition shadow-sm"
              title={lang === 'ja' ? 'Switch to English' : '日本語に切り替え'}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'ja' ? 'EN' : '日本語'}</span>
            </button>

            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition"
              title={t.islandMap}
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{t.islandMap}</span>
            </Link>

            <Link
              href="/mypage"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition"
              title={t.myPage}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{t.myPage}</span>
            </Link>

            <button
              onClick={() => setPreviewAll(!previewAll)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition flex items-center gap-1.5 flex-shrink-0 ${
                previewAll
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
              }`}
              title={previewAll ? t.myCollection : t.previewAll}
            >
              {previewAll ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-blue-400" />}
              <span>{previewAll ? t.myCollection : t.previewAll}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* パンくずリスト */}
        <Breadcrumb items={[{ label: t.breadcrumb }]} isDark={true} className="mb-2" />

        {/* 2. タイトル＆コレクション進捗ダッシュボード */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-850 to-slate-900 border border-slate-800 p-5 sm:p-7 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl sm:text-4xl">🧚</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                  {t.title}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
                  {t.totalPrefix} {totalCount} {t.totalSuffix}
                </span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {t.description}
              </p>
              {!user && (
                <p className="text-xs text-amber-300/90 mt-1.5 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>{t.loginTip}</span>
                </p>
              )}
            </div>

            {/* 進捗プログレス */}
            <div className="w-full lg:w-80 bg-slate-950/70 border border-slate-850 p-4 rounded-xl shadow-inner flex flex-col justify-center">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  {t.collectionStatus}
                </span>
                <span className="text-sm font-bold font-mono">
                  <span className="text-blue-400 text-lg">{previewAll ? totalCount : discoveredCount}</span>
                  <span className="text-slate-500 text-xs"> / {totalCount}</span>
                </span>
              </div>

              {/* プログレスバー */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${previewAll ? 100 : Math.max(progressPercent, 2)}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400">
                <span>{previewAll ? t.previewingAll : `${t.rate} ${progressPercent}%`}</span>
                <span className="text-slate-500">{t.cardZoomHint}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 検索 & フィルターバー ＋ 表示サイズ切り替え */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          {/* 上段: フリーワード検索バー & 状態フィルター & 表示サイズ切替 */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* 検索ボックス */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="検索ワードをクリア"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* 表示サイズ切替（小・中・大） */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 px-1.5 hidden md:inline">{t.sizeLabel}</span>
                <button
                  onClick={() => setGridSize('sm')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                    gridSize === 'sm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="小サイズ（一覧性重視）"
                >
                  {t.sizeSm}
                </button>
                <button
                  onClick={() => setGridSize('md')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                    gridSize === 'md' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="標準サイズ"
                >
                  {t.sizeMd}
                </button>
                <button
                  onClick={() => setGridSize('lg')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                    gridSize === 'lg' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="大サイズ（迫力重視）"
                >
                  {t.sizeLg}
                </button>
              </div>

              {/* 状態フィルター（すべて / 発見済 / 未発見） */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-shrink-0">
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                    filterStatus === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.statusAll} ({totalCount})
                </button>
                <button
                  onClick={() => setFilterStatus('COLLECTED')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                    filterStatus === 'COLLECTED' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.statusDiscovered} ({discoveredCount})
                </button>
                <button
                  onClick={() => setFilterStatus('UNCOLLECTED')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                    filterStatus === 'UNCOLLECTED' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.statusUndiscovered} ({totalCount - discoveredCount})
                </button>
              </div>
            </div>
          </div>

          {/* 下段: レアリティ & 属性フィルタータグ */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            {/* レアリティ選択 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1 mr-1">
                {t.rarityLabel}
              </span>
              <button
                onClick={() => setFilterRarity('ALL')}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition font-medium ${
                  filterRarity === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {t.all}
              </button>
              {RARITIES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setFilterRarity(r.key)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition font-medium ${
                    filterRarity === r.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* 属性選択 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1 mr-1">
                {t.attributeLabel}
              </span>
              <button
                onClick={() => setFilterAttribute('ALL')}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition font-medium ${
                  filterAttribute === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {t.allAttributes}
              </button>
              {ATTRIBUTES.map(attr => (
                <button
                  key={attr.key}
                  onClick={() => setFilterAttribute(attr.key)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition font-medium flex items-center gap-1 ${
                    filterAttribute === attr.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span>{attr.icon}</span>
                  <span>{ATTRIBUTE_LABELS[attr.key][lang]}</span>
                </button>
              ))}
            </div>

            {/* 該当件数 & リセットボタン */}
            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  {t.resultCount} <span className="text-white font-bold">{filteredFairies.length}</span> {t.items} / {t.totalPrefix} {totalCount} {t.totalSuffix}
                </span>
                <span className="hidden sm:inline text-slate-500">
                  {t.zoomHint}
                </span>
              </div>
              {isFiltered && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.reset}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. 妖精一覧グリッド（選択したサイズでレンダリング） */}
        <div className={`${gridClasses[gridSize]} pb-20`}>
          {filteredFairies.map(fairy => {
            const isRevealed = previewAll || collectedFairies.includes(fairy.id);
            return (
              <FairyCard
                key={fairy.id}
                fairy={fairy}
                isRevealed={isRevealed}
                onClick={() => setSelectedFairy(fairy)}
                onZoom={() => setViewerFairyId(fairy.id)}
              />
            );
          })}
        </div>

        {/* 該当なし表示 */}
        {filteredFairies.length === 0 && (
          <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <span className="text-5xl mb-3">🔍</span>
            <p className="text-base font-bold text-white mb-1">{t.noResults}</p>
            <p className="text-xs text-slate-500 mb-4">{t.noResultsDesc}</p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow"
            >
              {t.reset}
            </button>
          </div>
        )}
      </div>

      {/* 5. 妖精詳細ポップアップモーダル */}
      <FairyDetailModal
        fairy={selectedFairy}
        isRevealed={previewAll || (selectedFairy ? collectedFairies.includes(selectedFairy.id) : false)}
        onClose={() => setSelectedFairy(null)}
        onOpenViewer={() => {
          if (selectedFairy) {
            setViewerFairyId(selectedFairy.id);
            setSelectedFairy(null); // ビューワーを開くため詳細モーダルを閉じる
          }
        }}
      />

      {/* 6. 特大3Dカード鑑賞モード（Viewer） */}
      <FairyCardViewerModal
        fairies={filteredFairies.length > 0 ? filteredFairies : FAIRIES_MASTER}
        currentFairyId={viewerFairyId}
        isOpen={Boolean(viewerFairyId)}
        isRevealed={previewAll || (viewerFairyId ? collectedFairies.includes(viewerFairyId) : false)}
        onClose={() => setViewerFairyId(null)}
        onSelectFairyId={(id) => setViewerFairyId(id)}
      />
    </div>
  );
}
