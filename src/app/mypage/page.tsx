'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { ArrowLeft, LogOut, Award, Star, MapPin, Edit3, Check, Sparkles, Globe as GlobeIcon, Video, History, BookOpen, Compass, Heart, Map } from 'lucide-react';
import { supabase, fetchAllIslands } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDifficultyStats, getIslandDifficulty } from '@/lib/difficulty';
import { getPlayerLevelInfo, getIslandMastery, getSpecialTitles } from '@/lib/gamification';
import { FAIRIES_MASTER } from '@/lib/fairies';
import toast from 'react-hot-toast';

export default function MyPage() {
  const router = useRouter();
  const { user, islandStatuses, totalVisited, travelerName, updateTravelerName, bio, updateBio, totalPoints, conquestTargetCount, visitCounts, spotsVisited, companionChar, companionStage, collectedFairyDates } = useTravel();

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
  const [allIslandsData, setAllIslandsData] = useState<any[]>([]);
  const specialTitles = useMemo(() => {
    return getSpecialTitles(allIslandsData || [], visitCounts || {});
  }, [allIslandsData, visitCounts]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(travelerName || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(bio || '');
  const [myDiaries, setMyDiaries] = useState<any[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'history' | 'diaries' | 'quests' | 'fairies' | 'planning'>('history');

  useEffect(() => {
    setNameInput(travelerName || '');
  }, [travelerName]);

  useEffect(() => {
    Promise.all([
      fetchAllIslands()
      .then(data => {
        setAllIslandsData(data || []);
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

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const newName = nameInput.trim();
    if (!newName) return;
    if (newName === travelerName) {
      setIsEditingName(false);
      return;
    }

    if (user) {
      const { data } = await supabase.from('user_profiles').select('id').eq('nickname', newName).neq('id', user.id);
      if (data && data.length > 0) {
        toast.error('この名前はすでに使用されています。別の名前をお試しください。');
        return;
      }
    }

    updateTravelerName(newName);
    setIsEditingName(false);
    toast.success('名前を更新しました');
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBio = bioInput.trim();
    updateBio(newBio);
    setIsEditingBio(false);
    toast.success('自己紹介を更新しました');
  };

  // BUFGFIX: Directly filter from allIslandsData to prevent sync issues
  const visitedList = allIslandsData.filter(i => islandStatuses[i.id] === 'visited' || islandStatuses[i.id] === 'verified_visited');
  const planningList = allIslandsData.filter(i => islandStatuses[i.id] === 'planning');
  const diffStats = calculateDifficultyStats(allIslandsData, islandStatuses);

  const unlockedFairies = FAIRIES_MASTER.map(fairy => {
    // 開発環境ではテスト確認用にすべて開放状態にする
    const isDev = process.env.NODE_ENV === 'development';
    const unlocked = isDev || (fairy.island_id ? (islandStatuses[fairy.island_id] === 'visited' || islandStatuses[fairy.island_id] === 'verified_visited') : (visitedList.some(isl => isl.region_id === fairy.region_id)));
    return { ...fairy, unlocked };
  });

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] animate-pulse">
        <div className="h-16 bg-white border-b border-slate-100" />
        <div className="p-6 max-w-4xl mx-auto space-y-4">
          <div className="h-64 bg-white rounded-3xl shadow-sm border border-slate-100" />
          <div className="h-24 bg-white rounded-3xl shadow-sm border border-slate-100" />
          <div className="h-96 bg-white rounded-3xl shadow-sm border border-slate-100" />
        </div>
      </div>
    );
  }

  const photoDiaryCount = myDiaries.filter(d => d.photo_url).length;
  let reporterTitle = null;
  if (photoDiaryCount >= 50) reporterTitle = { name: "ゴールドレポーター", icon: "👑", color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200" };
  else if (photoDiaryCount >= 10) reporterTitle = { name: "シルバーレポーター", icon: "💎", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" };
  else if (photoDiaryCount >= 1) reporterTitle = { name: "ブロンズレポーター", icon: "🥉", color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200" };

  const tabs = [
    { id: 'history', label: 'トラベルヒストリー', icon: History, count: visitedList.length },
    { id: 'diaries', label: '島ログ', icon: BookOpen, count: myDiaries.length },
    { id: 'quests', label: 'クエスト・称号', icon: Award, count: specialTitles.filter(t => t.unlocked).length },
    { id: 'fairies', label: '妖精図鑑', icon: Sparkles, count: unlockedFairies.filter(f => f.unlocked).length },
    { id: 'planning', label: 'お気に入り', icon: Heart, count: planningList.length },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans relative text-slate-800">
      
      <header className="px-6 lg:px-12 py-4 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
        <button onClick={() => router.push('/')} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif font-bold tracking-[0.2em] text-slate-900 flex items-center gap-2">
          <MapPin className="text-blue-500 w-4 h-4" /> MY PASSPORT
        </h1>
        <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">ログアウトしますか？</h3>
            <p className="text-sm text-slate-600 mb-6">現在の端末からログアウトし、トップページに戻ります。</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">キャンセル</button>
              <button onClick={handleLogout} className="flex-1 py-3 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors">ログアウト</button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-8 space-y-8 relative z-10">
        
        {/* Profile Card Redesign (Clean & Premium) */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
          
          <div className="relative shrink-0 mt-2">
            {/* Level Ring */}
            <svg className="w-40 h-40 transform -rotate-90 absolute -top-4 -left-4 z-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
              <motion.circle
                initial={{ strokeDasharray: '0 289' }}
                animate={{ strokeDasharray: `${(playerLvInfo.progressPct / 100) * 289} 289` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="50" cy="50" r="46" fill="transparent" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="w-32 h-32 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center font-serif text-5xl font-bold shadow-inner relative z-10 border-4 border-white">
              {travelerName?.charAt(0) || user?.email?.charAt(0) || '旅'}
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[0.7rem] font-bold px-4 py-1.5 rounded-full shadow-md z-20 whitespace-nowrap border-2 border-white tracking-widest uppercase">
              Lv.{playerLvInfo.level} {playerLvInfo.title}
            </div>
          </div>

          <div className="flex-1 w-full text-center md:text-left pt-2 z-10">
            {!isEditingName ? (
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-wide">
                  {travelerName || user?.email?.split('@')[0] || '島旅トラベラー'}
                </h2>
                <button onClick={() => setIsEditingName(true)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors">
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveName} className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-white border border-blue-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  autoFocus
                />
                <button type="submit" className="p-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-md"><Check className="w-5 h-5" /></button>
              </form>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
              <div className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">ID: {user?.id?.slice(0, 12) || 'ANON-GUEST'}</div>
              {reporterTitle && (
                <div className={`text-xs font-bold ${reporterTitle.color} ${reporterTitle.bg} px-3 py-1 rounded-lg border ${reporterTitle.border} flex items-center gap-1.5 shadow-sm`}>
                  <span>{reporterTitle.icon}</span>
                  <span>{reporterTitle.name}</span>
                </div>
              )}
            </div>
            
            <div className="mb-8 max-w-lg mx-auto md:mx-0">
              {!isEditingBio ? (
                <div className="flex items-start justify-center md:justify-start gap-2 group relative">
                  <p className="text-sm text-slate-600 font-serif whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200 w-full min-h-[5rem] relative">
                    <span className="absolute -top-3 left-4 bg-white text-slate-500 text-[0.6rem] px-2 py-0.5 rounded-full border border-slate-200 font-bold">自己紹介</span>
                    {bio || '自己紹介文が未設定です。ここをタップして編集。'}
                  </p>
                  <button onClick={() => { setBioInput(bio); setIsEditingBio(true); }} className="absolute right-2 top-2 p-2 hover:bg-white rounded-full text-slate-400 hover:text-blue-500 transition-all shadow-sm">
                    <Edit3 size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveBio} className="flex flex-col gap-3">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 shadow-inner"
                    placeholder="冒険の記録や好きな島などを入力してください..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsEditingBio(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">キャンセル</button>
                    <button type="submit" className="px-4 py-2 text-xs bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 flex items-center gap-1 shadow-md transition-colors"><Check size={14} /> 保存</button>
                  </div>
                </form>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center md:items-start">
                <div className="text-slate-500 text-[0.65rem] font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-widest"><MapPin size={12} className="text-blue-500"/> 到達島数</div>
                <div className="text-3xl font-serif font-bold text-slate-800">{totalVisited}</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex flex-col items-center md:items-start">
                <div className="text-amber-700 text-[0.65rem] font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-widest"><Star size={12} className="text-amber-500"/> 獲得XP</div>
                <div className="text-3xl font-serif font-bold text-amber-600">{(totalPoints || 0).toLocaleString()}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex flex-col items-center md:items-start">
                <div className="text-purple-700 text-[0.65rem] font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-widest"><Sparkles size={12} className="text-purple-500"/> 妖精図鑑</div>
                <div className="text-3xl font-serif font-bold text-purple-600">{unlockedFairies.filter(f => f.unlocked).length}</div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center md:items-start">
                <div className="text-emerald-700 text-[0.65rem] font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-widest"><GlobeIcon size={12} className="text-emerald-500"/> 踏破率</div>
                <div className="text-3xl font-serif font-bold text-emerald-600">{progressPct.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Globe & Companion Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-indigo-100 shadow-sm flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[0.6rem] font-bold tracking-widest uppercase inline-block mb-3">3D EXPEDITION</span>
              <h3 className="text-lg font-serif font-bold text-slate-800 mb-1">島旅3D地球儀</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">訪れた島の軌跡を3D空間で俯瞰しよう。</p>
            </div>
            <button onClick={() => router.push('/globe')} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-widest shadow-md flex items-center justify-center gap-2 transition-colors">
              <GlobeIcon className="w-4 h-4" /> 地球儀を開く
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100 shadow-sm flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[0.6rem] font-bold tracking-widest uppercase inline-block mb-3">COMPANION</span>
              <h3 className="text-lg font-serif font-bold text-slate-800 mb-1">旅の相棒精霊: {companionStage.name}</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-2">{companionChar?.description || companionStage.skillDesc}</p>
            </div>
            <button onClick={() => router.push('/companion')} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm tracking-widest shadow-md flex items-center justify-center gap-2 transition-colors">
              <Sparkles className="w-4 h-4" /> 育成・変更
            </button>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 py-2 border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold tracking-wider transition-colors whitespace-nowrap border-b-2 ${activeTab === tab.id ? 'bg-white text-blue-600 border-blue-500 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-[0.65rem] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[400px]">
          
          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
              {visitedList.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
                    <Map className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif font-bold text-slate-700 text-lg">まだ到達記録がありません</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    島を訪れて「行った！」ボタンを押すと、ここにあなたのトラベルヒストリーがコレクションされます。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {visitedList.map(island => {
                    const diff = getIslandDifficulty(island);
                    return (
                      <div 
                        key={island.id} 
                        onClick={() => router.push(`/island/${island.id}`)}
                        className="group cursor-pointer aspect-[3/4] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300"
                      >
                        <img src={`/region/${island.region_id || 'okinawa_main'}.jpg`} alt={island.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542259009477-d625272157b7?q=80&w=800&auto=format&fit=crop'; }} />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80 z-10" />
                        <div className="absolute inset-0 flex flex-col justify-end p-4 z-20">
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="inline-block px-2 py-0.5 rounded text-[0.5rem] font-bold bg-blue-500 text-white uppercase">到達済</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[0.5rem] font-bold bg-white text-slate-800`}>{diff.stars}</span>
                          </div>
                          <h4 className="font-serif font-bold text-white text-sm group-hover:text-blue-300 transition-colors">{island.name}</h4>
                          <p className="text-[0.65rem] text-slate-300 mt-1 font-mono line-clamp-1">{island.prefecture}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Diaries Tab */}
          {activeTab === 'diaries' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
              {myDiaries.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-sm">
                  <p className="text-slate-500 text-sm font-serif">まだ島ログの投稿がありません。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myDiaries.map((diary) => {
                    const island = allIslandsData.find(i => i.id === diary.island_id);
                    return (
                      <div key={diary.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <h4 onClick={() => router.push(`/island/${diary.island_id}`)} className="font-bold text-lg text-slate-800 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2 font-serif">
                              <MapPin size={18} className="text-blue-500" /> {island?.name || '不明な島'}
                            </h4>
                            <span className="text-[0.7rem] text-slate-500 font-mono bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                              {new Date(diary.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 font-serif whitespace-pre-wrap leading-relaxed tracking-wide">{diary.content}</p>
                        </div>
                        {diary.photo_url && (
                          <div className="w-full md:w-48 h-48 md:h-auto shrink-0 relative overflow-hidden rounded-xl border border-slate-200">
                            <img src={diary.photo_url} alt="Diary photo" className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Quests Tab */}
          {activeTab === 'quests' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2 space-y-8">
              <div>
                <h3 className="text-sm font-bold tracking-widest text-slate-800 border-l-4 border-amber-500 pl-3 mb-4">特別称号コレクション</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {specialTitles.map(t => (
                    <div key={t.id} className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${t.unlocked ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-200 grayscale opacity-70'}`}>
                      <div className="flex items-start justify-between">
                        <span className="text-3xl drop-shadow-sm">{t.icon}</span>
                        <span className={`text-[0.6rem] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${t.unlocked ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {t.unlocked ? '👑 獲得済' : `進行度: ${t.progress}%`}
                        </span>
                      </div>
                      <div>
                        <h4 className={`font-serif font-black text-base mb-1 ${t.unlocked ? 'text-amber-800' : 'text-slate-600'}`}>{t.name}</h4>
                        <p className={`text-[0.65rem] leading-relaxed ${t.unlocked ? 'text-amber-700/80' : 'text-slate-500'}`}>{t.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Fairies Tab */}
          {activeTab === 'fairies' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                {unlockedFairies.map((fairy) => (
                  <div key={fairy.id} className="flex flex-col items-center gap-2 group">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all relative overflow-hidden ${fairy.unlocked ? `bg-gradient-to-br ${fairy.visual.colorFrom} ${fairy.visual.colorTo} shadow-md` : 'bg-slate-100 border border-slate-200 grayscale opacity-50'}`}>
                      {fairy.unlocked && fairy.visual.imageUrl ? (
                        <img src={fairy.visual.imageUrl} alt={fairy.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span>{fairy.visual.icon}</span>
                      )}
                    </div>
                    <div className={`text-[0.6rem] font-bold text-center w-full truncate px-1 ${fairy.unlocked ? 'text-slate-700' : 'text-slate-400'}`}>
                      {fairy.unlocked ? fairy.name : '???'}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Planning Tab */}
          {activeTab === 'planning' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
              {planningList.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-sm">
                  <p className="text-slate-500 text-sm font-serif">まだお気に入りに登録された島はありません。</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {planningList.map(island => (
                    <div key={island.id} onClick={() => router.push(`/island/${island.id}`)} className="cursor-pointer bg-white p-4 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 text-rose-400 fill-rose-200" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{island.name}</h4>
                        <p className="text-[0.65rem] text-slate-500">{island.prefecture}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </main>
  );
}
