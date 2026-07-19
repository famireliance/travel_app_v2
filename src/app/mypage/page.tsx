'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { ArrowLeft, LogOut, Award, Star, MapPin, Edit3, Check, Sparkles, Globe as GlobeIcon, Video } from 'lucide-react';
import { supabase, fetchAllIslands } from '@/lib/supabase';
import { motion } from 'framer-motion';
import CertificateModal from '@/components/CertificateModal';
import { calculateDifficultyStats, getIslandDifficulty } from '@/lib/difficulty';
import { getPlayerLevelInfo, getIslandMastery, getSpecialTitles } from '@/lib/gamification';
import Breadcrumb from '@/components/Breadcrumb';

export default function MyPage() {
  const router = useRouter();
  const { user, islandStatuses, totalVisited, travelerName, updateTravelerName, totalPoints, conquestTargetCount, visitCounts, spotsVisited } = useTravel();

  useEffect(() => {
    if (user === null) {
      // If explicit null or unauthenticated, redirect to home
      router.push('/');
    }
  }, [user, router]);

  const ALL_ISLANDS_COUNT = conquestTargetCount || 425;
  const progressPct = (totalVisited / ALL_ISLANDS_COUNT) * 100;
  const playerLvInfo = getPlayerLevelInfo(totalPoints || 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [islandsData, setIslandsData] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allIslandsData, setAllIslandsData] = useState<any[]>([]);
  const specialTitles = useMemo(() => {
    return getSpecialTitles(allIslandsData || [], visitCounts || {});
  }, [allIslandsData, visitCounts]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(travelerName || '');
  const [myDiaries, setMyDiaries] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedIslandForCert, setSelectedIslandForCert] = useState<any>(null);

  useEffect(() => {
    setNameInput(travelerName || '');
  }, [travelerName]);

  useEffect(() => {
    fetchAllIslands()
    .then(data => {
      setAllIslandsData(data || []);
      const trackedIds = Object.keys(islandStatuses);
      if (trackedIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setIslandsData((data || []).filter((isl: any) => trackedIds.includes(isl.id)));
      }
    })
    .catch(console.error);

    if (user?.id) {
      supabase.from('island_diaries').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => setMyDiaries(data || []))
        .catch(console.error);
    }
  }, [islandStatuses, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const visitedList = islandsData.filter(i => islandStatuses[i.id] === 'visited');
  const planningList = islandsData.filter(i => islandStatuses[i.id] === 'planning');
  const diffStats = calculateDifficultyStats(allIslandsData, islandStatuses);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans">
      <header className="px-6 lg:px-12 py-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
        <button 
          onClick={() => router.push('/')} 
          className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif font-bold tracking-[0.2em] text-slate-800">MY PAGE</h1>
        <button onClick={() => { if (window.confirm('ログアウトしますか？')) handleLogout(); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 mt-8">
        <Breadcrumb items={[{ label: 'マイページ / パスポート' }]} />
        
        {/* Profile Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-serif text-2xl font-bold shadow-lg shrink-0">
            {travelerName?.charAt(0) || user?.email?.charAt(0) || '旅'}
          </div>
          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${playerLvInfo.badgeColor} text-white text-[0.7rem] font-bold tracking-wider shadow-sm flex items-center gap-1.5`}>
                <span className="text-sm">{playerLvInfo.icon}</span>
                <span>Lv.{playerLvInfo.level} {playerLvInfo.title}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 font-mono text-xs font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500" />
                TOTAL: {(totalPoints || 0).toLocaleString()} pt
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {user?.id?.slice(0, 8) || 'ANON-GUEST'}</span>
            </div>

            {!isEditingName ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-800 tracking-wide">
                  {travelerName || user?.email?.split('@')[0] || '島旅トラベラー'}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                  title="旅人ネームを編集"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4 max-w-sm">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="旅人ネームを入力"
                  className="bg-slate-50 border border-blue-300 rounded-xl px-3 py-1.5 text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex-1"
                  autoFocus
                />
                <button
                  onClick={() => {
                    updateTravelerName(nameInput.trim() || '島旅トラベラー');
                    setIsEditingName(false);
                  }}
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
                  title="保存"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-3">
              {/* Player XP Level Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1 font-sans">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    公式到達ポイント (Lv.{playerLvInfo.level} → {playerLvInfo.level === 99 ? 'MAX' : `Lv.${playerLvInfo.level + 1}`})
                  </span>
                  <span className="font-mono text-slate-600 font-bold">
                    {playerLvInfo.currentXP.toLocaleString()} / {playerLvInfo.nextLevelXP.toLocaleString()} pt
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${playerLvInfo.progressPct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${playerLvInfo.badgeColor}`}
                  />
                </div>
              </div>

              {/* Visited Islands Count Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1 font-serif text-slate-500">
                  <span>全国{ALL_ISLANDS_COUNT}島 到達コンプリート率: <strong className="text-slate-800">{progressPct.toFixed(1)}%</strong></span>
                  <span className="flex items-center gap-1 text-blue-600 font-bold"><Award size={14} className="text-amber-500" /> {totalVisited} / {ALL_ISLANDS_COUNT} 島</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Globe & Video Studio Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 rounded-3xl p-6 md:p-8 border border-indigo-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-white relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 text-center md:text-left z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg">
              <GlobeIcon className="w-8 h-8 animate-spin-slow" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[0.65rem] font-bold tracking-widest uppercase inline-block mb-1">
                NEW • 3D EXPEDITION STUDIO
              </span>
              <h3 className="text-lg md:text-xl font-serif font-bold tracking-wide">
                日本全国 島旅3D地球儀・航路トラッカー & ムービー録画
              </h3>
              <p className="text-xs text-indigo-200 mt-1 max-w-lg leading-relaxed font-sans">
                あなたが訪れた島々の座標を地球儀上にマッピング。飛行機や船が走る3D航海ルートをシネマティックに再生し、SNS用の高画質動画 (.mp4/.webm) を無料0円キャプチャ！
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/globe')}
            className="shrink-0 w-full md:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold font-serif text-xs tracking-widest shadow-xl flex items-center justify-center gap-2.5 transition-all hover:scale-105 border border-amber-400/40 z-10"
          >
            <Video className="w-4 h-4 text-yellow-300 animate-bounce" />
            3D地球儀・動画スタジオを開く →
          </button>
        </motion.div>

        {/* Difficulty Tier Quests & Trophies */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 mb-10">
          <h3 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-6 border-l-2 border-blue-500 pl-3 flex items-center justify-between">
            <span>冒険難易度別 踏破クエスト＆達成トロフィー</span>
            <span className="text-[0.7rem] font-normal text-slate-400">5段階難易度・達成実績</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            {Object.entries(diffStats).map(([key, stat], idx) => {
              const level = idx + 1;
              const pct = stat.total > 0 ? Math.round((stat.visited / stat.total) * 100) : 0;
              return (
                <div key={key} className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${stat.visited > 0 ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/5 border-amber-500/40 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-lg">{stat.icon}</span>
                      <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${stat.visited > 0 ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                        ★{level} {level === 5 ? 'レジェンド' : level === 4 ? '秘境島' : level === 3 ? 'アドベンチャー' : level === 2 ? 'スタンダード' : 'イージー'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 tracking-wide mt-1">{stat.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">
                      <strong className="text-slate-900 font-serif text-sm">{stat.visited}</strong> / {stat.total} 島 ({pct}%)
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${stat.visited > 0 ? 'bg-amber-500' : 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-center">
                      <span className={`text-[0.65rem] font-bold block py-1 rounded-lg ${stat.visited > 0 ? 'bg-amber-500/20 text-amber-800 border border-amber-500/30' : 'text-slate-400 bg-slate-100'}`}>
                        {stat.visited > 0 ? `🏆 Level ${level} 勲章獲得` : `🔒 挑戦待ち`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Special Titles Collection Section */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 mb-10">
          <h3 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-6 border-l-2 border-purple-500 pl-3 flex items-center justify-between">
            <span>👑 各諸島＆日本全国 特別称号コレクション ({specialTitles.filter(t => t.unlocked).length}/{specialTitles.length})</span>
            <span className="text-[0.7rem] font-normal text-slate-400">全国諸島覇者＆海神称号</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialTitles.map(t => (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  t.unlocked
                    ? 'bg-gradient-to-br from-amber-500/15 via-purple-500/10 to-indigo-500/10 border-amber-500/60 shadow-md scale-[1.01]'
                    : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{t.icon}</span>
                    <span
                      className={`text-[0.65rem] font-bold px-2.5 py-0.5 rounded-full ${
                        t.unlocked
                          ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-sm font-serif'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {t.unlocked ? '👑 称号獲得済' : `🔒 進行度: ${t.progress}%`}
                    </span>
                  </div>
                  <h4 className={`font-serif font-bold text-sm leading-snug ${t.unlocked ? 'text-slate-900' : 'text-slate-600'}`}>
                    {t.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.description}</p>
                </div>
                {!t.unlocked && (
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-purple-500" style={{ width: `${t.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Certificate Gallery Section (Card Holder) */}
        <div className="mb-12">
          <h3 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-amber-500 pl-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" strokeWidth={2.5}/> 到達証明カードホルダー ({visitedList.length})
            </span>
            <span className="text-[0.7rem] font-normal text-slate-400">デジタル・物理カード購入</span>
          </h3>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">プレミアム・カードホルダー機能（準備中）</h4>
                <p className="text-xs text-amber-700">あなたの到達証明を物理的なトレーディングカードとして郵送するサービスを準備中です。</p>
              </div>
            </div>
            <button className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold tracking-widest shadow-md transition-all whitespace-nowrap">
              詳細を見る
            </button>
          </div>

          {visitedList.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl border border-amber-500/30 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h4 className="font-serif font-bold text-white text-lg">まだ到達証明書はありません</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                日本全国432島を訪れ、「行った！」ボタンを押すと、あなたのお名前が入った公式公認デジタル＆紙証明書がここにコレクションされます。
              </p>
              <button
                onClick={() => router.push('/map')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs tracking-widest transition-all hover:scale-105 shadow-lg"
              >
                🗺️ 地図から島を探して記録する →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visitedList.map(island => {
                const diff = getIslandDifficulty(island);
                const mastery = getIslandMastery(visitCounts[island.id] || 1, spotsVisited[island.id] || 0, island.name);
                return (
                  <div
                    key={island.id}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-amber-500/40 shadow-lg hover:border-amber-400 transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[0.6rem] font-bold tracking-widest uppercase">
                            Verified
                          </span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold border ${mastery.bgColor} ${mastery.color} ${mastery.borderColor}`}>
                            {mastery.badgeText} ({visitCounts[island.id] || 1}回訪問)
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 text-[0.6rem] font-bold border border-amber-500/30">
                            {diff.stars}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-white text-lg group-hover:text-amber-300 transition-colors">
                          {island.name}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                          <MapPin size={10} className="text-amber-500" /> {island.region_id || 'Japan'}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-sm shrink-0">
                        🏆
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedIslandForCert(island)}
                      className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs tracking-wider border border-amber-500/40 hover:border-amber-500 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      証明書を見る・発行 / SNSシェア
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Diaries */}
        <div className="mb-12">
          <h3 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-blue-500 pl-3 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-500" strokeWidth={2}/> 私の島ログ ({myDiaries.length})
          </h3>
          
          {myDiaries.length === 0 ? (
            <p className="text-slate-400 text-sm font-serif mb-12">まだ島ログの投稿がありません。</p>
          ) : (
            <div className="space-y-4">
              {myDiaries.map(diary => {
                const island = allIslandsData.find(i => i.id === diary.island_id);
                return (
                  <div key={diary.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                    {diary.photo_url && (
                      <div className="w-full md:w-32 h-32 shrink-0">
                        <img src={diary.photo_url} alt="Diary photo" className="w-full h-full object-cover rounded-xl border border-slate-200" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(`/island/${diary.island_id}`)}>
                          {island?.name || '不明な島'}
                        </h4>
                        <span className="text-xs text-slate-400">{new Date(diary.created_at).toLocaleDateString('ja-JP')}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-serif whitespace-pre-wrap">{diary.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Planning Islands */}
        <h3 className="text-sm font-bold tracking-[0.2em] text-slate-800 mb-4 border-l-2 border-amber-500 pl-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" strokeWidth={2}/> 行きたい島一覧 ({planningList.length})
        </h3>
        {planningList.length === 0 ? (
          <p className="text-slate-400 text-sm font-serif mb-12">まだ記録がありません。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {planningList.map(island => (
              <div 
                key={island.id} 
                onClick={() => router.push(`/island/${island.id}`)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-amber-300 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 font-bold font-serif">
                  {island.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{island.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={10}/> {island.region_id}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <CertificateModal
        isOpen={!!selectedIslandForCert}
        onClose={() => setSelectedIslandForCert(null)}
        island={selectedIslandForCert}
        user={user}
      />
    </main>
  );
}
