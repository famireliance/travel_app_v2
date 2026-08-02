'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { ArrowLeft, LogOut, Award, Star, MapPin, Edit3, Check, Sparkles, Globe as GlobeIcon, Video, ChevronDown, ChevronUp, History, BookOpen, Compass, Heart, ImageIcon } from 'lucide-react';
import { supabase, fetchAllIslands } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import CertificateModal from '@/components/CertificateModal';
import { calculateDifficultyStats, getIslandDifficulty } from '@/lib/difficulty';
import { getPlayerLevelInfo, getIslandMastery, getSpecialTitles } from '@/lib/gamification';
import { FAIRIES_MASTER } from '@/lib/fairies';
import Breadcrumb from '@/components/Breadcrumb';
import CharacterViewerModal from '@/components/CharacterViewerModal';
import toast from 'react-hot-toast';

export default function MyPage() {
  const router = useRouter();
  const { user, islandStatuses, totalVisited, travelerName, updateTravelerName, bio, updateBio, totalPoints, conquestTargetCount, visitCounts, spotsVisited, updateStatus, companionChar, companionStage, collectedFairies, collectedFairyDates } = useTravel();

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
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(bio || '');
  const [myDiaries, setMyDiaries] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedIslandForCert, setSelectedIslandForCert] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [viewingCharacter, setViewingCharacter] = useState<{image?: string, icon?: string, name: string, theme?: string, description?: string, badgeGradient?: string, metDate?: string, metLocation?: string} | null>(null);

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['profile', 'fairies', 'recent', 'quests', 'titles', 'certs', 'diaries', 'planning']));
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

  const visitedList = islandsData.filter(i => islandStatuses[i.id] === 'visited' || islandStatuses[i.id] === 'verified_visited');
  const planningList = islandsData.filter(i => islandStatuses[i.id] === 'planning');
  const diffStats = calculateDifficultyStats(allIslandsData, islandStatuses);

  const recentVisits = Object.entries(islandStatuses)
    .filter(([_, s]) => s === 'visited' || s === 'verified_visited')
    .slice(-5)
    .reverse();

  const unlockedFairies = FAIRIES_MASTER.map(fairy => {
    const unlocked = fairy.island_id ? (islandStatuses[fairy.island_id] === 'visited' || islandStatuses[fairy.island_id] === 'verified_visited') : (visitedList.some(isl => isl.region_id === fairy.region_id));
    return { ...fairy, unlocked };
  });

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 animate-pulse">
        <div className="h-16 bg-slate-800" />
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          <div className="h-40 bg-slate-800 rounded-3xl" />
          <div className="h-24 bg-slate-800 rounded-3xl" />
          <div className="h-48 bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  const SectionHeader = ({ id, icon: Icon, title, subtitle }: { id: string, icon: any, title: string, subtitle?: string }) => (
    <div 
      className="flex items-center justify-between cursor-pointer py-4 hover:bg-slate-800/50 rounded-xl transition-colors -mx-2 px-2"
      onClick={() => toggleSection(id)}
    >
      <h3 className="text-sm font-bold tracking-[0.2em] text-white border-l-2 border-amber-500 pl-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-amber-500" strokeWidth={2}/> {title}
        {subtitle && <span className="text-[0.7rem] font-normal text-slate-400 ml-2">{subtitle}</span>}
      </h3>
      <button className="text-slate-400 hover:text-white transition-colors">
        {openSections.has(id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0F172A] pb-32 font-sans relative text-slate-200">
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-5 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-[#0F172A] to-indigo-950/80 pointer-events-none" />
      
      <header className="px-6 lg:px-12 py-6 border-b border-white/5 flex items-center justify-between sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md">
        <button 
          onClick={() => router.push('/')} 
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif font-bold tracking-[0.2em] text-white flex items-center gap-2"><Sparkles className="text-amber-500 w-4 h-4" /> ADVENTURER PASSPORT</h1>
        <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-8 space-y-10 relative z-10">
        
        {/* Profile Card Redesign (Glassmorphism Passport) */}
        <div id="section-profile" className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
          
          <div className="relative shrink-0 mt-2">
            {/* Level Ring */}
            <svg className="w-40 h-40 transform -rotate-90 absolute -top-4 -left-4 z-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <motion.circle
                initial={{ strokeDasharray: '0 289' }}
                animate={{ strokeDasharray: `${(playerLvInfo.progressPct / 100) * 289} 289` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="50" cy="50" r="46" fill="transparent" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="w-32 h-32 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-full flex items-center justify-center font-serif text-5xl font-bold shadow-2xl relative z-10 border-4 border-slate-700">
              {travelerName?.charAt(0) || user?.email?.charAt(0) || '旅'}
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 text-[0.7rem] font-bold px-4 py-1.5 rounded-full shadow-lg z-20 whitespace-nowrap border-2 border-slate-800 tracking-widest uppercase">
              Lv.{playerLvInfo.level} {playerLvInfo.title}
            </div>
          </div>

          <div className="flex-1 w-full text-center md:text-left pt-2 z-10">
            {!isEditingName ? (
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-wide drop-shadow-md">
                  {travelerName || user?.email?.split('@')[0] || '島旅トラベラー'}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveName} className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-slate-800 border border-amber-500/50 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                  autoFocus
                />
                <button type="submit" className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-md"><Check className="w-5 h-5" /></button>
              </form>
            )}

            <div className="text-xs text-slate-400 font-mono mb-4 bg-slate-800/50 inline-block px-3 py-1 rounded-lg border border-slate-700/50">ID: {user?.id?.slice(0, 12) || 'ANON-GUEST'}</div>
            
            <div className="mb-8 max-w-lg mx-auto md:mx-0">
              {!isEditingBio ? (
                <div className="flex items-start justify-center md:justify-start gap-2 group relative">
                  <p className="text-sm text-slate-300 font-serif whitespace-pre-wrap leading-relaxed bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 w-full min-h-[5rem] relative">
                    <span className="absolute -top-3 left-4 bg-slate-900 text-slate-400 text-[0.6rem] px-2 py-0.5 rounded-full border border-slate-700">自己紹介</span>
                    {bio || '自己紹介文が未設定です。ここをタップして編集。'}
                  </p>
                  <button onClick={() => { setBioInput(bio); setIsEditingBio(true); }} className="absolute right-2 top-2 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-amber-400 transition-all shadow-sm">
                    <Edit3 size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveBio} className="flex flex-col gap-3">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full bg-slate-800 border border-amber-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none h-24 shadow-inner"
                    placeholder="冒険の記録や好きな島などを入力してください..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsEditingBio(false)} className="px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 rounded-xl transition-colors">キャンセル</button>
                    <button type="submit" className="px-4 py-2 text-xs bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-600 flex items-center gap-1 shadow-md transition-colors"><Check size={14} /> 保存</button>
                  </div>
                </form>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center md:items-start transition-all hover:border-amber-500/30">
                <div className="text-slate-400 text-[0.65rem] font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-widest"><MapPin size={12} className="text-amber-500"/> 到達島数</div>
                <div className="text-3xl font-serif font-bold text-white drop-shadow-md">{totalVisited}</div>
              </div>
              <div className="bg-amber-900/20 backdrop-blur-sm p-4 rounded-2xl border border-amber-500/20 flex flex-col items-center md:items-start transition-all hover:border-amber-500/50">
                <div className="text-amber-300 text-[0.65rem] font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-widest"><Star size={12} className="text-amber-400"/> 獲得XP</div>
                <div className="text-3xl font-serif font-bold text-amber-400 drop-shadow-md">{(totalPoints || 0).toLocaleString()}</div>
              </div>
              <div className="bg-purple-900/20 backdrop-blur-sm p-4 rounded-2xl border border-purple-500/20 flex flex-col items-center md:items-start transition-all hover:border-purple-500/50">
                <div className="text-purple-300 text-[0.65rem] font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-widest"><Sparkles size={12} className="text-purple-400"/> 妖精図鑑</div>
                <div className="text-3xl font-serif font-bold text-purple-400 drop-shadow-md">{unlockedFairies.filter(f => f.unlocked).length}</div>
              </div>
              <div className="bg-indigo-900/20 backdrop-blur-sm p-4 rounded-2xl border border-indigo-500/20 flex flex-col items-center md:items-start transition-all hover:border-indigo-500/50">
                <div className="text-indigo-300 text-[0.65rem] font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-widest"><GlobeIcon size={12} className="text-indigo-400"/> コンプリート率</div>
                <div className="text-3xl font-serif font-bold text-indigo-400 drop-shadow-md">{progressPct.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Companion Character Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-amber-500/20 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full text-center md:text-left">
            {companionStage.image ? (
              <div 
                className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white/10 p-2 shadow-inner border border-white/20 shrink-0 relative cursor-pointer group hover:border-white/40 transition-colors"
                onClick={() => setViewingCharacter({
                  image: companionStage.image,
                  icon: companionStage.icon,
                  name: companionStage.name,
                  theme: companionChar?.theme,
                  description: companionChar?.description || companionStage.skillDesc,
                  badgeGradient: companionStage.badgeGradient
                })}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 to-orange-400/20 rounded-3xl mix-blend-overlay group-hover:from-amber-200/40 transition-colors" />
                <img src={companionStage.image} alt={companionStage.name} className="w-full h-full object-contain drop-shadow-2xl animate-[float_4s_ease-in-out_infinite] group-hover:scale-110 transition-transform" />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-800 flex items-center justify-center text-4xl shadow-inner border border-slate-700 shrink-0">
                ✨
              </div>
            )}
            
            <div className="flex-1">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[0.65rem] font-bold tracking-widest uppercase inline-block mb-2 border border-amber-500/30">
                旅の相棒精霊
              </span>
              <h3 className="text-xl md:text-2xl font-serif font-bold tracking-wide text-white drop-shadow-sm mb-1">
                {companionStage.name}
              </h3>
              <p className="text-xs md:text-sm text-amber-100/90 leading-relaxed font-sans max-w-md mx-auto md:mx-0">
                {companionChar?.description || companionStage.skillDesc}
              </p>
            </div>

            <button
              onClick={() => router.push('/companion')}
              className="shrink-0 mt-4 md:mt-0 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-900 font-bold font-serif text-sm tracking-widest shadow-xl flex items-center justify-center gap-2.5 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              相棒の育成・変更 →
            </button>
          </div>
        </motion.div>

        {/* 3D Globe Banner (Refined) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-5 text-center md:text-left z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg border border-white/10">
              <GlobeIcon className="w-8 h-8 animate-spin-slow" />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[0.65rem] font-bold tracking-widest uppercase inline-block mb-2 border border-amber-500/30">
                NEW • 3D EXPEDITION STUDIO
              </span>
              <h3 className="text-lg md:text-xl font-serif font-bold tracking-wide text-white drop-shadow-sm">
                日本全国 島旅3D地球儀・航路トラッカー
              </h3>
              <p className="text-xs text-indigo-200 mt-1 max-w-lg leading-relaxed font-sans opacity-90">
                あなたが訪れた島々の座標を地球儀上にマッピング。あなたの冒険の軌跡を3Dで俯瞰しよう。
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/globe')}
            className="shrink-0 w-full md:w-auto px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold font-serif text-sm tracking-widest shadow-xl flex items-center justify-center gap-2.5 transition-all hover:scale-105 border border-white/20 z-10 backdrop-blur-md"
          >
            <Video className="w-4 h-4 text-purple-300" />
            3D地球儀を開く →
          </button>
        </motion.div>

        {/* Fairy Dex Section (NEW) */}
        <div id="section-fairies" className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-lg border border-white/10">
          <SectionHeader id="fairies" icon={Sparkles} title={`妖精図鑑 - Fairy Dex (${unlockedFairies.filter(f => f.unlocked).length}/${unlockedFairies.length})`} subtitle="出会った精霊たち" />
          <AnimatePresence>
            {openSections.has('fairies') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {unlockedFairies.map((fairy) => (
                    <div 
                      key={fairy.id} 
                      className={`flex flex-col items-center gap-2 group ${fairy.unlocked ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (fairy.unlocked) {
                          setViewingCharacter({
                            image: fairy.visual.imageUrl,
                            icon: fairy.visual.icon,
                            name: fairy.name,
                            theme: fairy.theme,
                            description: fairy.description,
                            badgeGradient: `from-${fairy.visual.colorFrom?.replace('from-','')} to-${fairy.visual.colorTo?.replace('to-','')}`,
                            metDate: collectedFairyDates[fairy.id] ? new Date(collectedFairyDates[fairy.id]).toLocaleString('ja-JP', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}) : undefined,
                            metLocation: fairy.region_id
                          });
                        }
                      }}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-all duration-500 relative overflow-hidden ${fairy.unlocked ? `bg-gradient-to-br ${fairy.visual.colorFrom} ${fairy.visual.colorTo} shadow-lg shadow-white/10 group-hover:scale-110 group-hover:shadow-white/30` : 'bg-slate-800/50 border border-slate-700/50 grayscale opacity-40'}`}>
                        {fairy.unlocked && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        {fairy.unlocked && fairy.visual.imageUrl ? (
                           <img src={fairy.visual.imageUrl} alt={fairy.name} className="w-full h-full object-contain p-1 relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                           <span className="z-10">{fairy.visual.icon}</span>
                        )}
                        {fairy.unlocked && <Sparkles className={`absolute top-1 right-1 w-3 h-3 ${fairy.visual.sparkleColor} opacity-70 animate-pulse z-20`} />}
                      </div>
                      <div className={`text-[0.6rem] font-bold text-center w-full truncate px-1 ${fairy.unlocked ? 'text-white' : 'text-slate-500'}`}>
                        {fairy.unlocked ? fairy.name : '???'}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Difficulty Tier Quests & Trophies */}
        <div id="section-quests" className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-lg border border-white/10">
          <SectionHeader id="quests" icon={Compass} title="冒険難易度別 踏破クエスト" subtitle="5段階難易度・達成実績" />
          <AnimatePresence>
            {openSections.has('quests') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(diffStats).map(([key, stat], idx) => {
                    const level = idx + 1;
                    const pct = stat.total > 0 ? Math.round((stat.visited / stat.total) * 100) : 0;
                    return (
                      <motion.div 
                        key={key} 
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className={`p-6 rounded-[2rem] border backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden group ${stat.visited > 0 ? 'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:border-amber-400/80' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'}`}
                      >
                        {/* 獲得済みの背景エフェクト */}
                        {stat.visited > 0 && (
                          <div className="absolute -inset-24 bg-amber-500/20 opacity-0 group-hover:opacity-100 blur-[60px] rounded-full transition-opacity duration-700 pointer-events-none" />
                        )}

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-4xl drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-300">{stat.icon}</span>
                            <span className={`text-[0.65rem] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${stat.visited > 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-900 shadow-md font-serif' : 'bg-slate-700/80 text-slate-400'}`}>
                              ★{level} {level === 5 ? 'LEGEND' : level === 4 ? 'SECRET' : level === 3 ? 'ADV' : level === 2 ? 'STD' : 'EASY'}
                            </span>
                          </div>
                          <div className={`text-base font-black tracking-wider mt-3 ${stat.visited > 0 ? 'text-white drop-shadow-md' : 'text-slate-400'}`}>{stat.title}</div>
                          <div className="text-xs text-slate-300 mt-2 font-mono flex items-baseline gap-1">
                            <strong className={`font-serif text-xl ${stat.visited > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{stat.visited}</strong>
                            <span className="text-slate-500">/ {stat.total} 島</span>
                            <span className="ml-auto font-bold text-[10px] text-slate-400">({pct}%)</span>
                          </div>
                        </div>
                        <div className="space-y-3 relative z-10">
                          <div className="w-full bg-slate-900/80 h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                              className={`h-full relative overflow-hidden ${stat.visited > 0 ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-slate-600'}`} 
                            >
                              {stat.visited > 0 && <div className="absolute inset-0 bg-white/40 w-full h-full animate-[shimmer_1.5s_infinite]" />}
                            </motion.div>
                          </div>
                          <div className="text-center pt-1">
                            <span className={`text-[0.7rem] font-bold block py-2 rounded-xl transition-colors duration-300 ${stat.visited > 0 ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 group-hover:bg-amber-500/20' : 'text-slate-500 bg-slate-800/80 border border-slate-700/50'}`}>
                              {stat.visited > 0 ? `🏆 Level ${level} 勲章獲得済` : `🔒 未獲得`}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Special Titles Collection */}
        <div id="section-titles" className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-lg border border-white/10">
          <SectionHeader id="titles" icon={Award} title={`👑 特別称号コレクション (${specialTitles.filter(t => t.unlocked).length}/${specialTitles.length})`} subtitle="全国諸島覇者＆海神称号" />
          <AnimatePresence>
            {openSections.has('titles') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {specialTitles.map(t => (
                    <motion.div 
                      key={t.id} 
                      whileHover={{ scale: 1.03, y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`p-6 rounded-[2rem] border backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden group ${t.unlocked ? 'bg-gradient-to-br from-amber-500/15 via-purple-500/10 to-indigo-500/15 border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.35)] hover:border-amber-300/80 z-10' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'}`}
                    >
                      {/* 背景の光彩エフェクト */}
                      {t.unlocked && (
                        <>
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-400/30 transition-colors duration-500" />
                          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-400/30 transition-colors duration-500" />
                        </>
                      )}

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                            <span className="text-4xl drop-shadow-xl">{t.icon}</span>
                          </div>
                          <span className={`text-[0.65rem] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest ${t.unlocked ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-900 shadow-[0_4px_10px_rgba(245,158,11,0.3)] font-serif border border-amber-300/50' : 'bg-slate-800/80 text-slate-400 border border-slate-700'}`}>
                            {t.unlocked ? '👑 獲得済' : `🔒 進行度: ${t.progress}%`}
                          </span>
                        </div>
                        <h4 className={`font-serif font-black text-lg leading-snug tracking-wide ${t.unlocked ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 drop-shadow-sm' : 'text-slate-400'}`}>{t.name}</h4>
                        <p className={`text-xs mt-2 leading-relaxed font-medium ${t.unlocked ? 'text-slate-300' : 'text-slate-500'}`}>{t.description}</p>
                      </div>
                      {!t.unlocked && (
                        <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden mt-2 border border-slate-700/50 shadow-inner relative z-10">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${t.progress}%` }} 
                            transition={{ duration: 1.5, delay: 0.1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Certificate Gallery Carousel/Grid */}
        <div id="section-certs" className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-lg border border-white/10">
          <SectionHeader id="certs" icon={Award} title={`到達証明カードホルダー (${visitedList.length})`} subtitle="タップしてプレビュー" />
          <AnimatePresence>
            {openSections.has('certs') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-6">
                  {visitedList.length === 0 ? (
                    <div className="bg-slate-800/50 p-10 rounded-3xl border border-slate-700 text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-700/50 border border-slate-600 flex items-center justify-center text-slate-500 mx-auto">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <h4 className="font-serif font-bold text-white text-lg">まだ到達証明書はありません</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        日本全国432島を訪れ、「行った！」ボタンを押すと、あなたのお名前が入った公式公認デジタル証明書がここにコレクションされます。
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {visitedList.map(island => {
                        const diff = getIslandDifficulty(island);
                        const mastery = getIslandMastery(visitCounts[island.id] || 1, spotsVisited[island.id] || 0, island.name);
                        return (
                          <div 
                            key={island.id} 
                            onClick={() => setSelectedIslandForCert(island)}
                            className="group cursor-pointer aspect-[3/4] bg-slate-800 rounded-2xl border border-slate-600 overflow-hidden relative shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:border-amber-400 transition-all duration-300"
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90 z-10" />
                            <div className="absolute inset-0 flex flex-col justify-end p-4 z-20">
                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                  <span className="inline-block px-2 py-0.5 rounded text-[0.5rem] font-bold bg-amber-500 text-slate-900 uppercase">Verified</span>
                                  <span className="inline-block px-2 py-0.5 rounded text-[0.5rem] font-bold bg-slate-700 text-amber-400 border border-slate-600">{diff.stars}</span>
                                </div>
                                <h4 className="font-serif font-bold text-white text-sm group-hover:text-amber-400 transition-colors">{island.name}</h4>
                                <p className="text-[0.65rem] text-slate-400 mt-1 font-mono">{island.region_id}</p>
                            </div>
                            <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                               <Award className="w-4 h-4 text-amber-400" />
                            </div>
                            {/* Decorative background for the card */}
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay group-hover:scale-110 transition-transform duration-700" />
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
        <div id="section-diaries" className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-lg border border-white/10">
          <SectionHeader id="diaries" icon={BookOpen} title={`私の島ログ (${myDiaries.length})`} />
          <AnimatePresence>
            {openSections.has('diaries') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-6">
                  {myDiaries.length === 0 ? (
                    <p className="text-slate-500 text-sm font-serif">まだ島ログの投稿がありません。</p>
                  ) : (
                    <div className="relative border-l-2 border-slate-700/50 ml-4 md:ml-8 space-y-8 pb-4">
                      {myDiaries.map((diary, index) => {
                        const island = allIslandsData.find(i => i.id === diary.island_id);
                        return (
                          <motion.div 
                            key={diary.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative pl-6 md:pl-8 group"
                          >
                            {/* Timeline Node */}
                            <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-slate-900 border-2 border-amber-500 group-hover:bg-amber-400 group-hover:shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-300" />
                            
                            <div className="bg-slate-800/40 backdrop-blur-md p-5 md:p-6 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-slate-700/50 flex flex-col md:flex-row gap-6 hover:border-amber-500/30 hover:bg-slate-800/60 transition-all duration-300 group-hover:-translate-y-1">
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                                  <h4 
                                    className="font-black text-lg text-amber-400 cursor-pointer hover:text-amber-300 transition-colors flex items-center gap-2 font-serif drop-shadow-sm" 
                                    onClick={() => router.push(`/island/${diary.island_id}`)}
                                  >
                                    <MapPin size={18} className="text-amber-500" /> {island?.name || '不明な島'}
                                  </h4>
                                  <span className="text-[0.7rem] md:text-xs text-slate-400 font-mono bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700">
                                    {new Date(diary.created_at).toLocaleDateString('ja-JP')}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-300 font-serif whitespace-pre-wrap leading-relaxed tracking-wide">
                                  {diary.content}
                                </p>
                              </div>
                              
                              {diary.photo_url && (
                                <div className="w-full md:w-48 h-48 md:h-auto shrink-0 relative overflow-hidden rounded-xl border border-slate-700 shadow-md">
                                  <img 
                                    src={diary.photo_url} 
                                    alt="Diary photo" 
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
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
        <div className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-lg border border-white/10">
          <SectionHeader id="planning" icon={Heart} title={`お気に入りリスト (${planningList.length})`} />
          <AnimatePresence>
            {openSections.has('planning') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-6">
                  {planningList.length === 0 ? (
                    <p className="text-slate-500 text-sm font-serif">まだお気に入りに登録された島はありません。</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {planningList.map(island => (
                        <div key={island.id} className="bg-rose-900/10 p-4 rounded-xl shadow-sm border border-rose-500/20 flex items-center justify-between gap-4 transition-colors hover:border-rose-500/40">
                          <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => router.push(`/island/${island.id}`)}>
                            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold font-serif shadow-inner">{island.name.charAt(0)}</div>
                            <div>
                              <h4 className="font-bold text-white">{island.name}</h4>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={10}/> {island.region_id}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => updateStatus(island.id, 'visited')} 
                            className="shrink-0 text-[0.65rem] font-bold bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-500/40 border border-blue-500/30 transition-colors"
                          >
                            到達済に変更
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

      <CharacterViewerModal
        isOpen={!!viewingCharacter}
        onClose={() => setViewingCharacter(null)}
        image={viewingCharacter?.image}
        icon={viewingCharacter?.icon}
        name={viewingCharacter?.name || ''}
        theme={viewingCharacter?.theme}
        description={viewingCharacter?.description}
        badgeGradient={viewingCharacter?.badgeGradient}
        metDate={viewingCharacter?.metDate}
        metLocation={viewingCharacter?.metLocation}
      />

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl border border-slate-700">
            <h3 className="font-bold text-xl text-white mb-3">ログアウトしますか？</h3>
            <p className="text-sm text-slate-400 mb-8">旅の記録はデバイスとサーバーに保存されます。</p>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 border border-slate-600 hover:bg-slate-700 rounded-xl text-white font-bold text-sm transition-colors">キャンセル</button>
              <button onClick={() => { setShowLogoutConfirm(false); handleLogout(); }} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 transition-colors">ログアウト</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
