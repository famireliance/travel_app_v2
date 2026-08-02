'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { ArrowLeft, LogOut, Award, Star, MapPin, Edit3, Check, Sparkles, Globe as GlobeIcon, Video, ChevronDown, ChevronUp, History, BookOpen, Compass, Heart } from 'lucide-react';
import { supabase, fetchAllIslands } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import CertificateModal from '@/components/CertificateModal';
import { calculateDifficultyStats, getIslandDifficulty } from '@/lib/difficulty';
import { getPlayerLevelInfo, getIslandMastery, getSpecialTitles } from '@/lib/gamification';
import Breadcrumb from '@/components/Breadcrumb';

export default function MyPage() {
  const router = useRouter();
  const { user, islandStatuses, totalVisited, travelerName, updateTravelerName, totalPoints, conquestTargetCount, visitCounts, spotsVisited, updateStatus } = useTravel();

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (user === null) {
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
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [myDiaries, setMyDiaries] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedIslandForCert, setSelectedIslandForCert] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['recent', 'quests', 'titles', 'certs', 'diaries', 'planning']));
  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setNameInput(travelerName || '');
  }, [travelerName]);

  useEffect(() => {
    const savedBio = localStorage.getItem('kiratabi_bio');
    if (savedBio) setBio(savedBio);
  }, []);

  useEffect(() => {
    Promise.all([
      fetchAllIslands()
      .then(data => {
        setAllIslandsData(data || []);
        const trackedIds = Object.keys(islandStatuses);
        if (trackedIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setIslandsData((data || []).filter((isl: any) => trackedIds.includes(isl.id)));
        }
      }),
      (async () => {
        if (user?.id) {
          try {
            const { data } = await supabase.from('island_diaries').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            setMyDiaries(data || []);
          } catch (e) { console.error(e); }
        }
      })()
    ]).then(() => setIsDataLoaded(true));
  }, [islandStatuses, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const visitedList = islandsData.filter(i => islandStatuses[i.id] === 'visited' || islandStatuses[i.id] === 'verified_visited');
  const planningList = islandsData.filter(i => islandStatuses[i.id] === 'planning');
  const diffStats = calculateDifficultyStats(allIslandsData, islandStatuses);

  const recentVisits = Object.entries(islandStatuses)
    .filter(([_, s]) => s === 'visited' || s === 'verified_visited')
    .slice(-5)
    .reverse();

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 animate-pulse">
        <div className="h-16 bg-slate-200" />
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          <div className="h-40 bg-slate-200 rounded-3xl" />
          <div className="h-24 bg-slate-200 rounded-3xl" />
          <div className="h-48 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  const SectionHeader = ({ id, icon: Icon, title, subtitle }: { id: string, icon: any, title: string, subtitle?: string }) => (
    <div 
      className="flex items-center justify-between cursor-pointer py-4 hover:bg-slate-50/50 rounded-xl transition-colors -mx-2 px-2"
      onClick={() => toggleSection(id)}
    >
      <h3 className="text-sm font-bold tracking-[0.2em] text-slate-800 border-l-2 border-blue-500 pl-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-500" strokeWidth={2}/> {title}
        {subtitle && <span className="text-[0.7rem] font-normal text-slate-400 ml-2">{subtitle}</span>}
      </h3>
      <button className="text-slate-400 hover:text-slate-600 transition-colors">
        {openSections.has(id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans relative">
      <header className="px-6 lg:px-12 py-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
        <button 
          onClick={() => router.push('/')} 
          className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif font-bold tracking-[0.2em] text-slate-800">MY PAGE</h1>
        <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 mt-8 space-y-10">
        <Breadcrumb items={[{ label: 'マイページ / パスポート' }]} />
        
        {/* Profile Card Redesign */}
        <div id="section-profile" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="relative shrink-0 mt-2">
            {/* Level Ring */}
            <svg className="w-32 h-32 transform -rotate-90 absolute -top-2 -left-2 z-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
              <motion.circle
                initial={{ strokeDasharray: '0 289' }}
                animate={{ strokeDasharray: `${(playerLvInfo.progressPct / 100) * 289} 289` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="50" cy="50" r="46" fill="transparent" stroke="url(#gradient)" strokeWidth="6" strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-serif text-4xl font-bold shadow-xl relative z-10 border-4 border-white">
              {travelerName?.charAt(0) || user?.email?.charAt(0) || '旅'}
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[0.65rem] font-bold px-3 py-1 rounded-full shadow-lg z-20 whitespace-nowrap border-2 border-white tracking-widest">
              Lv.{playerLvInfo.level} {playerLvInfo.title}
            </div>
          </div>

          <div className="flex-1 w-full text-center md:text-left pt-2 z-10">
            {!isEditingName ? (
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 tracking-wide">
                  {travelerName || user?.email?.split('@')[0] || '島旅トラベラー'}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                updateTravelerName(nameInput.trim() || '島旅トラベラー');
                setIsEditingName(false);
              }} className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-slate-50 border border-blue-300 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
                <button type="submit" className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white"><Check className="w-5 h-5" /></button>
              </form>
            )}

            <div className="text-xs text-slate-400 font-mono mb-3">ID: {user?.id?.slice(0, 12) || 'ANON-GUEST'}</div>
            
            <div className="mb-6 max-w-sm">
              {!isEditingBio ? (
                <div className="flex items-start justify-center md:justify-start gap-2 group">
                  <p className="text-sm text-slate-600 font-serif whitespace-pre-wrap">{bio || '自己紹介文が未設定です。'}</p>
                  <button onClick={() => { setBioInput(bio); setIsEditingBio(true); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-all">
                    <Edit3 size={14} />
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setBio(bioInput);
                  localStorage.setItem('kiratabi_bio', bioInput);
                  setIsEditingBio(false);
                }} className="flex flex-col gap-2">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full bg-slate-50 border border-blue-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-20"
                    placeholder="自己紹介文を入力してください..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsEditingBio(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">キャンセル</button>
                    <button type="submit" className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center gap-1"><Check size={14} /> 保存</button>
                  </div>
                </form>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center md:items-start">
                <div className="text-slate-500 text-[0.65rem] font-bold mb-1 flex items-center gap-1"><MapPin size={12}/> 到達島数</div>
                <div className="text-xl font-serif font-bold text-slate-800">{totalVisited}</div>
              </div>
              <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50 flex flex-col items-center md:items-start">
                <div className="text-amber-600 text-[0.65rem] font-bold mb-1 flex items-center gap-1"><Star size={12}/> 獲得XP</div>
                <div className="text-xl font-serif font-bold text-amber-700">{(totalPoints || 0).toLocaleString()}</div>
              </div>
              <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100/50 flex flex-col items-center md:items-start">
                <div className="text-purple-600 text-[0.65rem] font-bold mb-1 flex items-center gap-1"><Sparkles size={12}/> 妖精図鑑</div>
                <div className="text-xl font-serif font-bold text-purple-700">0</div>
              </div>
              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 flex flex-col items-center md:items-start">
                <div className="text-blue-600 text-[0.65rem] font-bold mb-1 flex items-center gap-1"><GlobeIcon size={12}/> コンプリート率</div>
                <div className="text-xl font-serif font-bold text-blue-700">{progressPct.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Globe & Video Studio Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 rounded-3xl p-6 md:p-8 border border-indigo-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-white relative overflow-hidden"
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
                あなたが訪れた島々の座標を地球儀上にマッピング。飛行機や船が走る3D航海ルートをシネマティックに再生し、SNS用の高画質動画を無料キャプチャ！
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

        {/* Recent Timeline */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <SectionHeader id="recent" icon={History} title="最近の到達履歴" subtitle="最新5件" />
          <AnimatePresence>
            {openSections.has('recent') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4">
                  {recentVisits.length === 0 ? (
                    <p className="text-slate-400 text-sm font-serif">まだ到達記録がありません。</p>
                  ) : (
                    <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-4 relative">
                      {recentVisits.map(([id, _], i) => {
                        const island = allIslandsData.find(isl => isl.id === id);
                        return (
                          <div key={id} className="relative pl-6">
                            <div className="absolute -left-[1.3rem] top-1 w-3.5 h-3.5 bg-blue-500 border-4 border-white rounded-full shadow-sm" />
                            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors" onClick={() => router.push(`/island/${id}`)}>
                              <div>
                                <div className="text-slate-800 font-bold">{island?.name || '不明な島'}</div>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">{island?.region_id || 'Japan'}</div>
                              </div>
                              <Award className="w-4 h-4 text-amber-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Difficulty Tier Quests & Trophies */}
        <div id="section-quests" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <SectionHeader id="quests" icon={Compass} title="冒険難易度別 踏破クエスト＆達成トロフィー" subtitle="5段階難易度・達成実績" />
          <AnimatePresence>
            {openSections.has('quests') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Special Titles Collection */}
        <div id="section-titles" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <SectionHeader id="titles" icon={Award} title={`👑 特別称号コレクション (${specialTitles.filter(t => t.unlocked).length}/${specialTitles.length})`} subtitle="全国諸島覇者＆海神称号" />
          <AnimatePresence>
            {openSections.has('titles') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {specialTitles.map(t => (
                    <div key={t.id} className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${t.unlocked ? 'bg-gradient-to-br from-amber-500/15 via-purple-500/10 to-indigo-500/10 border-amber-500/60 shadow-md scale-[1.01]' : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'}`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{t.icon}</span>
                          <span className={`text-[0.65rem] font-bold px-2.5 py-0.5 rounded-full ${t.unlocked ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-sm font-serif' : 'bg-slate-200 text-slate-500'}`}>
                            {t.unlocked ? '👑 称号獲得済' : `🔒 進行度: ${t.progress}%`}
                          </span>
                        </div>
                        <h4 className={`font-serif font-bold text-sm leading-snug ${t.unlocked ? 'text-slate-900' : 'text-slate-600'}`}>{t.name}</h4>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Certificate Gallery */}
        <div id="section-certs" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <SectionHeader id="certs" icon={Award} title={`到達証明カードホルダー (${visitedList.length})`} subtitle="デジタル・物理カード購入" />
          <AnimatePresence>
            {openSections.has('certs') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4">
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
                    <button onClick={() => router.push('/globe')} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold tracking-widest shadow-md transition-all whitespace-nowrap">
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
                      <button onClick={() => router.push('/map')} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs tracking-widest transition-all hover:scale-105 shadow-lg">
                        🗺️ 地図から島を探して記録する →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visitedList.map(island => {
                        const diff = getIslandDifficulty(island);
                        const mastery = getIslandMastery(visitCounts[island.id] || 1, spotsVisited[island.id] || 0, island.name);
                        return (
                          <div key={island.id} className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-amber-500/40 shadow-lg hover:border-amber-400 transition-all flex flex-col justify-between gap-4 group">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[0.6rem] font-bold tracking-widest uppercase">Verified</span>
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold border ${mastery.bgColor} ${mastery.color} ${mastery.borderColor}`}>{mastery.badgeText} ({visitCounts[island.id] || 1}回)</span>
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 text-[0.6rem] font-bold border border-amber-500/30">{diff.stars}</span>
                                </div>
                                <h4 className="font-serif font-bold text-white text-lg group-hover:text-amber-300 transition-colors">{island.name}</h4>
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono"><MapPin size={10} className="text-amber-500" /> {island.region_id || 'Japan'}</p>
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-sm shrink-0">🏆</div>
                            </div>
                            <button onClick={() => setSelectedIslandForCert(island)} className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs tracking-wider border border-amber-500/40 hover:border-amber-500 transition-all flex items-center justify-center gap-1.5">
                              <Award className="w-3.5 h-3.5" /> 証明書を見る・発行 / SNSシェア
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* My Diaries */}
        <div id="section-diaries" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <SectionHeader id="diaries" icon={BookOpen} title={`私の島ログ (${myDiaries.length})`} />
          <AnimatePresence>
            {openSections.has('diaries') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4">
                  {myDiaries.length === 0 ? (
                    <p className="text-slate-400 text-sm font-serif">まだ島ログの投稿がありません。</p>
                  ) : (
                    <div className="space-y-4">
                      {myDiaries.map(diary => {
                        const island = allIslandsData.find(i => i.id === diary.island_id);
                        return (
                          <div key={diary.id} className="bg-slate-50 p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                            {diary.photo_url && (
                              <div className="w-full md:w-32 h-32 shrink-0">
                                <img src={diary.photo_url} alt="Diary photo" className="w-full h-full object-cover rounded-xl border border-slate-200" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(`/island/${diary.island_id}`)}>{island?.name || '不明な島'}</h4>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Planning Islands */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <SectionHeader id="planning" icon={Heart} title={`お気に入りリスト (${planningList.length})`} />
          <AnimatePresence>
            {openSections.has('planning') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4">
                  {planningList.length === 0 ? (
                    <p className="text-slate-400 text-sm font-serif">まだお気に入りに登録された島はありません。</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {planningList.map(island => (
                        <div key={island.id} className="bg-rose-50/50 p-4 rounded-xl shadow-sm border border-rose-100 flex items-center justify-between gap-4 transition-colors hover:border-rose-300">
                          <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => router.push(`/island/${island.id}`)}>
                            <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 font-bold font-serif">{island.name.charAt(0)}</div>
                            <div>
                              <h4 className="font-bold text-slate-800">{island.name}</h4>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={10}/> {island.region_id}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => updateStatus(island.id, 'visited')} 
                            className="shrink-0 text-[0.65rem] font-bold bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            到達済みに変更
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CertificateModal
        isOpen={!!selectedIslandForCert}
        onClose={() => setSelectedIslandForCert(null)}
        island={selectedIslandForCert}
        user={user}
      />

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-2">ログアウトしますか？</h3>
            <p className="text-sm text-slate-500 mb-6">旅の記録はデバイスに保存されます。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm">キャンセル</button>
              <button onClick={() => { setShowLogoutConfirm(false); handleLogout(); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm">ログアウト</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 flex md:hidden z-50 pb-safe">
        {[
          { label: 'プロフ', icon: Sparkles, id: 'profile' },
          { label: '履歴', icon: History, id: 'recent' },
          { label: '称号', icon: Award, id: 'titles' },
          { label: '証明', icon: Compass, id: 'certs' },
          { label: '日記', icon: BookOpen, id: 'diaries' }
        ].map(({ label, icon: Icon, id }, i) => (
          <button 
            key={i} 
            onClick={() => {
              if (id !== 'profile') {
                setOpenSections(prev => new Set(prev).add(id));
              }
              setTimeout(() => {
                const el = document.getElementById(`section-${id}`);
                if (el) {
                  const y = el.getBoundingClientRect().top + window.scrollY - 100;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }, 50);
            }} 
            className="flex-1 py-3 text-[0.65rem] font-bold text-slate-500 hover:text-blue-600 flex flex-col items-center gap-1 transition-colors"
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
