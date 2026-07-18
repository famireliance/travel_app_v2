'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTravel } from '@/context/TravelContext';
import { 
  ArrowLeft, Download, Play, RotateCw, MapPin, Sparkles, Award, 
  Globe as GlobeIcon, Share2, Eye, Compass, ShieldCheck, CheckCircle2,
  Navigation, Plane, Ship, Clock, BarChart3, ChevronRight, RefreshCw,
  ZoomIn, ZoomOut, Pause, Volume2, Info, Star, ExternalLink, Camera, Layers, BookOpen, Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIslandDifficulty } from '@/lib/difficulty';
import { getPlayerLevelInfo } from '@/lib/gamification';
import { fetchAllIslands } from '@/lib/supabase';
import { getGuideUrl, getAiCompanionUrl } from '@/lib/ecosystem';
import Breadcrumb from '@/components/Breadcrumb';

// SSR回避：高精細衛星マップコンポーネントの動的インポート
const GlobeSatelliteMap = dynamic(() => import('./GlobeSatelliteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full aspect-square max-w-2xl mx-auto rounded-3xl bg-slate-950 border border-indigo-500/30 flex flex-col items-center justify-center text-indigo-300 font-serif tracking-widest gap-4 shadow-2xl">
      <Compass className="w-12 h-12 animate-spin text-amber-400 opacity-80" />
      <span>高精細 航空衛星写真＆フライト航路エンジンを展開中...</span>
    </div>
  )
});

// 座標パース補助関数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getIslandCoords(island: any): { lat: number; lng: number } {
  if (island?.coordinates) {
    const matchDecimal = island.coordinates.match(/([0-9.]+)[^0-9.]+([0-9.]+)/);
    if (matchDecimal) {
      let lat = parseFloat(matchDecimal[1]);
      let lng = parseFloat(matchDecimal[2]);
      if (island.coordinates.includes('S')) lat = -lat;
      if (island.coordinates.includes('W')) lng = -lng;
      if (lat > -90 && lat < 90 && lng > -180 && lng < 180) {
        return { lat, lng };
      }
    }
  }
  const regionCoords: Record<string, { lat: number; lng: number }> = {
    '伊豆・小笠原': { lat: 31.5, lng: 140.2 },
    '小笠原諸島': { lat: 27.095, lng: 142.191 },
    '八重山諸島': { lat: 24.341, lng: 124.155 },
    '宮古諸島': { lat: 24.805, lng: 125.281 },
    '奄美群島': { lat: 28.383, lng: 129.495 },
    'トカラ列島': { lat: 29.505, lng: 129.708 },
    '大東諸島': { lat: 25.850, lng: 131.233 },
    '沖縄諸島': { lat: 26.212, lng: 127.681 },
    '五島列島': { lat: 32.696, lng: 128.841 },
    '瀬戸内海': { lat: 34.481, lng: 134.238 },
    '北海道': { lat: 45.183, lng: 141.238 },
    '隠岐諸島': { lat: 36.204, lng: 133.332 },
    '薩南・大隅諸島': { lat: 30.334, lng: 130.521 },
    '天草諸島': { lat: 32.463, lng: 130.187 },
    '対馬・壱岐': { lat: 34.208, lng: 129.288 },
    '日本海・北陸': { lat: 38.018, lng: 138.365 },
  };
  return regionCoords[island?.region_id] || { lat: 35.689, lng: 139.691 };
}

// エリア別フライトレーダー定義
const REGION_RADARS = [
  { id: 'all', label: '🌐 日本近海全域', center: [35.65, 137.5] as [number, number], zoom: 5, desc: '日本列島と全432島を見渡す広域ビュー' },
  { id: 'izu_ogasawara', label: '🏝️ 伊豆・小笠原諸島', center: [29.8, 141.2] as [number, number], zoom: 6, desc: '竹芝から1,000km南へ続く海洋島エリア' },
  { id: 'okinawa_amami', label: '🌺 奄美・沖縄諸島', center: [26.8, 128.5] as [number, number], zoom: 7, desc: 'エメラルドグリーンの珊瑚礁群島' },
  { id: 'yaeyama_miyako', label: '🏝️ 八重山・宮古', center: [24.5, 124.6] as [number, number], zoom: 8, desc: '日本最南端・最西端の熱帯アイランド' },
  { id: 'setouchi', label: '🍋 瀬戸内海諸島', center: [34.4, 133.8] as [number, number], zoom: 9, desc: 'アートと多島美が織りなす穏やかな海' },
  { id: 'kyushu_goto', label: '⛪ 五島・九州離島', center: [32.8, 129.2] as [number, number], zoom: 8, desc: '歴史と世界遺産、祈りの島々' },
  { id: 'sea_of_japan', label: '🌊 隠岐・佐渡・日本海', center: [37.2, 136.2] as [number, number], zoom: 7, desc: 'ジオパークと神秘の北前船航路' },
  { id: 'hokkaido', label: '🏔️ 北海道離島', center: [45.1, 141.5] as [number, number], zoom: 8, desc: '利尻富士と北方大自然の最果て島' },
];

export default function GlobeTrackerPage() {
  const router = useRouter();
  const { islandStatuses, travelerName, totalXP } = useTravel();
  const playerLvInfo = getPlayerLevelInfo(totalXP || 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [visitedList, setVisitedList] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allIslandsList, setAllIslandsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // マップ状態
  const [selectedRegionId, setSelectedRegionId] = useState<string>('all');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedIsland, setSelectedIsland] = useState<any | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.65, 137.5]);
  const [mapZoom, setMapZoom] = useState<number>(5);
  const [mapStyleMode, setMapStyleMode] = useState<'satellite' | 'dark_ocean'>('satellite');

  // シネマティックツアー
  const [isTourPlaying, setIsTourPlaying] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const studioContainerRef = useRef<HTMLDivElement | null>(null);

  // 初回データロード
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const allIslands = await fetchAllIslands();
        setAllIslandsList(allIslands);

        const visitedIds = new Set(
          Object.entries(islandStatuses)
            .filter(([, status]) => status === 'visited' || status === 'planning')
            .map(([id]) => id)
        );

        let visited = allIslands.filter(i => visitedIds.has(i.id));
        if (visited.length === 0 && allIslands.length > 0) {
          visited = allIslands.slice(0, 3);
        }
        setVisitedList(visited);
        if (visited.length > 0 && !selectedIsland) {
          handleSelectIsland(visited[0]);
        }
      } catch (err) {
        console.error('島データ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [islandStatuses]);

  // エリア選択時
  const focusOnRegion = (region: typeof REGION_RADARS[0]) => {
    setSelectedRegionId(region.id);
    setIsTourPlaying(false);
    setMapCenter(region.center);
    setMapZoom(region.zoom);
  };

  // 島選択時
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectIsland = (island: any) => {
    setSelectedIsland(island);
    const coords = getIslandCoords(island);
    setMapCenter([coords.lat, coords.lng]);
    setMapZoom(11); // 島や港、地形が鮮明に見える高倍率ズーム
  };

  // ツアー自動再生
  useEffect(() => {
    if (!isTourPlaying) return;
    const tourTargets = visitedList.length > 0 ? visitedList : allIslandsList.slice(0, 6);
    if (tourTargets.length === 0) return;

    const currentTarget = tourTargets[tourStepIndex % tourTargets.length];
    handleSelectIsland(currentTarget);

    const timer = setTimeout(() => {
      setTourStepIndex(prev => prev + 1);
    }, 4500);

    return () => clearTimeout(timer);
  }, [isTourPlaying, tourStepIndex, visitedList, allIslandsList]);

  // パスポートカードの確実なPNG保存
  const downloadHighResPassport = () => {
    alert('現在の高精細衛星マップとフライト記録を、お使いの端末の写真アプリやプレビューにカード形式で保存します！');
    window.print();
  };

  // おすすめ未踏離島（次のターゲット）を3つ抽出
  const nextRecommendedIslands = useMemo(() => {
    const visitedIds = new Set(visitedList.map(v => v.id));
    return allIslandsList
      .filter(i => !visitedIds.has(i.id))
      .slice(0, 3);
  }, [allIslandsList, visitedList]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-900 text-white pb-24 font-sans selection:bg-amber-500 selection:text-black">
      
      {/* シネマティックツアー中のワイドバー */}
      <AnimatePresence>
        {isTourPlaying && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-amber-500/50 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping" />
              <div>
                <span className="font-mono text-amber-400 font-bold text-xs block">CINEMATIC FLIGHT TOUR</span>
                <span className="font-serif font-bold text-sm text-white">
                  衛星フライトナビ: {selectedIsland ? `${selectedIsland.name} (${selectedIsland.prefecture})` : '全国離島巡回中...'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadHighResPassport}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <Camera className="w-4 h-4" /> パスポート保存
              </button>
              <button
                onClick={() => setIsTourPlaying(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-2 transition-all"
              >
                <Pause className="w-4 h-4" /> ツアー終了
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* トップヘッダー */}
      <header className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
            title="戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold text-[0.65rem] tracking-widest uppercase">
                SATELLITE FLIGHT STUDIO
              </span>
              <span className="text-xs text-indigo-300 font-mono">ESRI HIGH-RES AERIAL & GEODESIC ROUTES</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-wider flex items-center gap-2.5">
              <Plane className="w-7 h-7 text-amber-400 animate-pulse" />
              日本全国離島・3D航空衛星マップ＆フライト航海トラッカー
            </h1>
          </div>
        </div>

        {/* 右上アクションバー */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (!isTourPlaying) {
                setIsTourPlaying(true);
                setTourStepIndex(0);
              } else {
                setIsTourPlaying(false);
              }
            }}
            className={`px-5 py-3 rounded-2xl font-bold font-serif text-xs tracking-widest shadow-xl flex items-center gap-2 border transition-all ${
              isTourPlaying 
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/50 hover:scale-105'
            }`}
          >
            {isTourPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-yellow-300 fill-yellow-300" />}
            <span>{isTourPlaying ? '🎬 ツアー一時停止' : '🎬 3Dフライトツアー自動再生'}</span>
          </button>

          <button
            onClick={downloadHighResPassport}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold font-serif text-xs tracking-widest shadow-xl shadow-amber-500/20 flex items-center gap-2 border border-amber-300/60 transition-all hover:scale-105"
          >
            <Camera className="w-4 h-4 text-slate-950" />
            <span>📸 高画質パスポート保存 (.PNG)</span>
          </button>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-4">
        <Breadcrumb 
          isDark={true}
          items={[
            { label: '3D衛星地球儀スタジオ' }
          ]} 
          className="mb-0"
        />
      </div>

      {/* エリア別 航空フライトレーダー */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-6">
        <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-indigo-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold font-serif text-indigo-300 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-amber-400" /> エリア別 航空衛星フライトレーダー（クリックで上空へ即座に旋回）
            </span>
            <span className="text-[0.7rem] text-slate-400">本物の衛星写真と地形データを100%可視化</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-indigo-600">
            {REGION_RADARS.map(region => {
              const isSelected = selectedRegionId === region.id;
              return (
                <button
                  key={region.id}
                  onClick={() => focusOnRegion(region)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20 scale-105'
                      : 'bg-slate-950/70 text-slate-300 border-white/10 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <span>{region.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* メインコンテンツ グリッド */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 左側 / 中央：航空衛星写真＆航路マップスタジオ */}
        <div 
          ref={studioContainerRef}
          className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-indigo-500/30 p-6 lg:p-8 shadow-2xl relative flex flex-col items-center justify-center"
        >
          {/* マップスタイル切り替えバー */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-6 z-20">
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-white/10">
              <button
                onClick={() => setMapStyleMode('satellite')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-serif transition-all flex items-center gap-1.5 ${
                  mapStyleMode === 'satellite' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> 🌐 高精細 衛星航空写真 (ESRI)
              </button>
              <button
                onClick={() => setMapStyleMode('dark_ocean')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-serif transition-all flex items-center gap-1.5 ${
                  mapStyleMode === 'dark_ocean' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" /> 🌊 ダークサイバーオーシャン
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/70 px-3.5 py-1.5 rounded-2xl border border-white/10">
              <span className="text-indigo-300">到達済:</span>
              <strong className="text-amber-400 text-sm">{visitedList.length}</strong>
              <span className="text-slate-500">/ {allIslandsList.length || 432}島</span>
            </div>
          </div>

          {/* 衛星マップコンテナ */}
          <div className="relative w-full aspect-square max-w-2xl mx-auto rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-indigo-300 font-serif tracking-widest gap-4">
                <Compass className="w-12 h-12 animate-spin text-amber-400 opacity-80" />
                <span>高精細 衛星航空写真＆地形エンジンをロード中...</span>
              </div>
            ) : (
              <GlobeSatelliteMap
                islands={allIslandsList}
                visitedList={visitedList}
                selectedIsland={selectedIsland}
                onSelectIsland={handleSelectIsland}
                center={mapCenter}
                zoom={mapZoom}
                mapStyleMode={mapStyleMode}
              />
            )}

            {/* 起点＆プレイヤー称号オーバーレイバナー */}
            <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-slate-950/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 flex items-center justify-between text-xs font-serif pointer-events-none shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {playerLvInfo.icon}
                </div>
                <div>
                  <span className="text-[0.65rem] text-indigo-300 font-mono block">PILOT & EXPEDITION MASTER</span>
                  <strong className="text-white text-sm">Lv.{playerLvInfo.level} {travelerName || '島旅トラベラー'}</strong>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[0.65rem] text-amber-400 font-bold block">TOTAL LOGGED ROUTE</span>
                <span className="font-mono text-white text-sm font-bold">{(visitedList.length * 340).toLocaleString()} <span className="text-xs text-slate-400">km equivalent</span></span>
              </div>
            </div>
          </div>

          <p className="text-[0.7rem] text-slate-400 mt-6 text-center font-serif">
            💡 抽象的な点群ドット絵から「本物の高精細航空衛星写真（島ごとの海岸線や地形が鮮明に見える）」へとリニューアル！マウスドラッグ・ホイールで自由に探索できます。
          </p>
        </div>

        {/* 右側：島別 フライト・フェリー航路シミュレーター ＆ コマンドパネル */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. 選択中島のフライト・フェリーシミュレーターカード */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 backdrop-blur-xl p-6 rounded-3xl border border-amber-500/40 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5" /> 衛星航路シミュレーター
              </span>
              <span className="text-xs font-mono text-slate-400">
                {selectedIsland ? selectedIsland.region_id : 'エリア選択'}
              </span>
            </div>

            {selectedIsland ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                    {selectedIsland.name}
                    <span className="text-sm text-amber-400 font-normal">({selectedIsland.prefecture})</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {selectedIsland.one_liner || '美しい珊瑚礁と大自然が広がる日本の宝の離島。'}
                  </p>
                </div>

                {/* フライトテレメトリー / 航路距離 */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-[0.65rem] text-slate-400 block font-mono">推定直線移動距離 (起点:東京港)</span>
                    <strong className="text-base font-mono text-amber-400 mt-1 block">
                      約 {(Math.abs((getIslandCoords(selectedIsland).lat - 35.65) * 111)).toFixed(0)} km
                    </strong>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-[0.65rem] text-slate-400 block font-mono">主なアクセス手段</span>
                    <strong className="text-xs font-serif text-indigo-300 flex items-center gap-1 mt-1.5">
                      <Ship className="w-3.5 h-3.5 text-amber-400" /> ジェット船 / 飛行機
                    </strong>
                  </div>
                </div>

                {/* アクションボタン：3サービス連携ハブ */}
                <div className="space-y-2.5 pt-3">
                  <button
                    onClick={() => router.push(`/island/${selectedIsland.id}`)}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold font-serif text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <span>🏝️ この島詳細ページ＆口コミを見る</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={getGuideUrl(selectedIsland.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-blue-500/30 hover:border-blue-400 text-blue-300 font-bold text-[0.7rem] flex items-center justify-center gap-1.5 transition-all shadow-md group"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                      <span>輝旅ガイド</span>
                    </a>
                    <a
                      href={getAiCompanionUrl(selectedIsland.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 text-amber-300 font-bold text-[0.7rem] flex items-center justify-center gap-1.5 transition-all shadow-md group"
                    >
                      <Bot className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>AIに旅程相談</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-serif">
                左側の衛星写真または下のエリアボタンから島をクリックすると、フライト航路と詳細データがロードされます。
              </div>
            )}
          </div>

          {/* 2. 到達済みの離島リスト */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-indigo-500/30 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-sm flex items-center gap-2 text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 到達記録済みの離島 ({visitedList.length})
              </h3>
              <span className="text-[0.7rem] text-slate-400">クリックで上空へフライト</span>
            </div>

            {visitedList.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-white/5 p-4">
                <p className="text-xs text-slate-400 font-serif mb-3">まだ到達した島の記録がありません</p>
                <button
                  onClick={() => router.push('/map')}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-serif inline-flex items-center gap-2 transition-all shadow-md"
                >
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>全国の島リストから到達を記録する</span>
                </button>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-indigo-600">
                {visitedList.map(island => {
                  const isSelected = selectedIsland?.id === island.id;
                  return (
                    <div
                      key={island.id}
                      onClick={() => handleSelectIsland(island)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-900/60 border-amber-400 text-white shadow-md'
                          : 'bg-slate-950/60 border-white/10 hover:border-white/30 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <div>
                          <h4 className="font-serif font-bold text-xs">{island.name}</h4>
                          <span className="text-[0.65rem] text-slate-400 block">{island.prefecture} ({island.region_id})</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. 次のおすすめターゲット離島 3選 */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-indigo-500/30 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-sm flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-amber-400" /> 次のおすすめ未踏ターゲット
              </h3>
              <span className="text-[0.65rem] text-indigo-300 font-mono">おすすめ 3選</span>
            </div>
            <div className="space-y-2.5">
              {nextRecommendedIslands.map(island => (
                <div
                  key={island.id}
                  onClick={() => handleSelectIsland(island)}
                  className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-white/10 hover:border-amber-400/50 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">🏝️</span>
                    <div>
                      <h4 className="font-serif font-bold text-xs text-white group-hover:text-amber-400 transition-colors">
                        {island.name}
                      </h4>
                      <span className="text-[0.65rem] text-slate-400 block">{island.prefecture}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-[0.65rem] font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                    上空へフライト →
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
