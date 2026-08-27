'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { ArrowLeft, LogOut, Award, Star, MapPin, Edit3, Check, Sparkles, Globe as GlobeIcon, Video, History, BookOpen, Compass, Heart, Map, CreditCard } from 'lucide-react';
import { PlanChangeModal } from '@/components/PlanChangeModal';
import OrderHistory from '@/components/OrderHistory';
import { supabase, fetchAllIslands } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDifficultyStats, getIslandDifficulty } from '@/lib/difficulty';
import { getPlayerLevelInfo, getIslandMastery, getSpecialTitles, getRegionMastery } from '@/lib/gamification';
import { FAIRIES_MASTER } from '@/lib/fairies';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function MyPage() {
  const router = useRouter();
  const { user, islandStatuses, totalVisited, travelerName, updateTravelerName, bio, updateBio, totalPoints, conquestTargetCount, visitCounts, spotsVisited, companionChar, companionStage, collectedFairyDates, allFairies, subscriptionTier, premiumUntil, ultimateStartedAt, anniversaryCertUsed, setAnniversaryCertUsed } = useTravel();

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

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
  const [activeTab, setActiveTab] = useState<'history' | 'diaries' | 'quests' | 'fairies' | 'planning' | 'orders' | 'settings' | 'certificates'>('history');
  const [filterAttribute, setFilterAttribute] = useState<string | null>(null);

  // 1周年記念特典
  const [showAnniversaryModal, setShowAnniversaryModal] = useState(false);
  const [anniversaryIslandId, setAnniversaryIslandId] = useState('');
  const [anniversaryIslandName, setAnniversaryIslandName] = useState('');
  const [anniversaryRecipientName, setAnniversaryRecipientName] = useState('');
  const [anniversaryPostalCode, setAnniversaryPostalCode] = useState('');
  const [anniversaryAddress, setAnniversaryAddress] = useState('');
  const [anniversaryPhone, setAnniversaryPhone] = useState('');
  const [anniversarySubmitting, setAnniversarySubmitting] = useState(false);
  const [anniversarySuccess, setAnniversarySuccess] = useState(false);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // 1周年特典の資格チェック
  const daysSinceUltimate = ultimateStartedAt
    ? Math.floor((Date.now() - new Date(ultimateStartedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isAnniversaryEligible =
    subscriptionTier === 'ultimate' &&
    !!ultimateStartedAt &&
    daysSinceUltimate >= 365 &&
    daysSinceUltimate <= 365 + 180 &&
    !anniversaryCertUsed;
  const anniversaryDaysLeft = Math.max(0, 365 + 180 - daysSinceUltimate);

  // 訪問済み島リスト（申請フォーム用）
  const visitedIslandsList = useMemo(() => {
    return allIslandsData.filter((i: any) => islandStatuses[i.id] === 'visited' || islandStatuses[i.id] === 'verified_visited');
  }, [allIslandsData, islandStatuses]);

  const handleAnniversarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anniversaryIslandId || !anniversaryRecipientName || !anniversaryPostalCode || !anniversaryAddress || !anniversaryPhone) {
      toast.error('すべての項目を入力してください');
      return;
    }
    setAnniversarySubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/certificates/anniversary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          island_id: anniversaryIslandId,
          island_name: anniversaryIslandName,
          recipient_name: anniversaryRecipientName,
          postal_code: anniversaryPostalCode,
          address: anniversaryAddress,
          phone: anniversaryPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '申請に失敗しました');
      setAnniversarySuccess(true);
      setAnniversaryCertUsed(true); // ローカルステートも更新
      toast.success('申請が完了しました！運営から連絡をお待ちください');
    } catch (err: any) {
      toast.error(err.message || '申請に失敗しました');
    } finally {
      setAnniversarySubmitting(false);
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode) {
      toast.error('クーポンコードを入力してください');
      return;
    }
    setIsRedeeming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/user/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'クーポンの適用に失敗しました');
      toast.success(data.message || 'クーポンを適用しました！');
      setPromoCode('');
    } catch (err: any) {
      toast.error(err.message || 'クーポンの適用に失敗しました');
    } finally {
      setIsRedeeming(false);
    }
  };

  useEffect(() => {
    setNameInput(travelerName || '');
  }, [travelerName]);

  const [myCertificates, setMyCertificates] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetchAllIslands()
      .then(data => {
        setAllIslandsData(data || []);
      }),
      (async () => {
        if (user?.id) {
          try {
            const { data: diariesData } = await supabase.from('island_diaries').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            setMyDiaries(diariesData || []);
            
            if (subscriptionTier === 'premium' || subscriptionTier === 'ultimate') {
              const { data: certsData } = await supabase.from('certificates').select('*').eq('user_id', user.id).not('image_url', 'is', null).order('created_at', { ascending: false });
              setMyCertificates(certsData || []);
            }
          } catch (e) { console.error(e); }
        }
      })()
    ]).then(() => setIsDataLoaded(true));
  }, [islandStatuses, user, subscriptionTier]);

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

  const unlockedFairies = allFairies.map(fairy => {
    // UI確認のため一時的にすべて開放表示
    const unlocked = true; // collectedFairies.includes(fairy.id);
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
    ...(subscriptionTier === 'premium' || subscriptionTier === 'ultimate' ? [{ id: 'certificates', label: '証明書', icon: Award, count: myCertificates.length }] : []),
    { id: 'quests', label: 'クエスト・称号', icon: Award, count: specialTitles.filter(t => t.unlocked).length },
    { id: 'fairies', label: '妖精図鑑', icon: Sparkles, count: unlockedFairies.filter(f => f.unlocked).length },
    { id: 'planning', label: 'お気に入り', icon: Heart, count: planningList.length },
    { id: 'orders', label: '注文履歴', icon: MapPin, count: undefined }, // Will load async
    { id: 'settings', label: '設定', icon: Edit3, count: undefined },
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

            {/* 1周年記念特典バナー */}
            {isAnniversaryEligible && (
              <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-yellow-900/90 via-amber-800/90 to-yellow-900/90 border border-amber-400/50 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,200,0,0.3) 10px, rgba(255,200,0,0.3) 20px)' }} />
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-amber-300 text-[0.65rem] font-bold tracking-widest uppercase mb-1">🎖️ ULTIMATE 1周年記念特典</p>
                    <h3 className="text-white font-serif text-lg font-bold mb-1">1周年おめでとうございます！</h3>
                    <p className="text-amber-200 text-xs leading-relaxed">特別版の紙の実物証明書を1通、無料でお届けします。</p>
                    <p className="text-amber-400 text-xs font-bold mt-2">⏰ 申請期限まで あと <span className="text-white text-lg">{anniversaryDaysLeft}</span> 日</p>
                  </div>
                  <button
                    onClick={() => setShowAnniversaryModal(true)}
                    className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-900 font-bold text-sm rounded-xl shadow-lg transition-all"
                  >
                    特別版証明書を申請する
                  </button>
                </div>
              </div>
            )}

            {/* Subscription Status */}
            <div className="mb-8 p-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-500">現在のプラン</span>
                  <span className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wider ${
                    subscriptionTier === 'ultimate' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                    subscriptionTier === 'premium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {subscriptionTier === 'ultimate' ? 'KIRATABI Ultimate' : subscriptionTier === 'premium' ? 'KIRATABI Premium' : 'Free (無料ユーザー)'}
                  </span>
                </div>
                {subscriptionTier !== 'free' && premiumUntil && (
                  <p className="text-[0.65rem] text-slate-500">
                    有効期限: {new Date(premiumUntil).toLocaleDateString('ja-JP')}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-1">
                  {subscriptionTier === 'free' ? '公式証明書(高画質)の発行や、より強力な相棒精霊の解放にはプレミアムプランをご利用ください。' : 'プレミアム特典が適用されています。公式証明書が何度でも無料で発行可能です！'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowPlanModal(true);
                }}
                className="shrink-0 px-4 py-2 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                {subscriptionTier === 'free' ? 'プランをアップグレード' : 'プラン変更・管理'}
              </button>

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
                        <img src={`https://picsum.photos/seed/${island.id}/400/600`} alt={island.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
              {myCertificates.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-sm">
                  <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-serif mb-2">まだ証明書が発行されていません。</p>
                  <p className="text-xs text-slate-400">到達した島のページから公式証明書を発行してみましょう。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCertificates.map((cert) => {
                    const island = allIslandsData.find(i => i.id === cert.island_id);
                    return (
                      <div key={cert.id} className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-700 hover:border-amber-500 transition-colors cursor-pointer group" onClick={() => window.open(cert.image_url, '_blank')}>
                        <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden flex items-center justify-center p-2">
                          {cert.image_url ? (
                            <img src={cert.image_url} alt="Certificate" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <span className="text-slate-500 text-xs">画像データがありません</span>
                          )}
                          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-mono border border-slate-700">
                            {cert.serial_number ? `No.${String(cert.serial_number).padStart(4, '0')}` : 'NO SERIAL'}
                          </div>
                        </div>
                        <div className="p-4 bg-slate-800">
                          <h4 className="font-bold text-white text-sm font-serif mb-1 line-clamp-1">{island?.name || '不明な島'} 到達証明書</h4>
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">
                              {new Date(cert.created_at).toLocaleDateString('ja-JP')}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {cert.type === 'high_quality' ? '公式版' : '簡易版'}
                            </span>
                          </div>
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
                <h3 className="text-sm font-bold tracking-widest text-slate-800 border-l-4 border-amber-500 pl-3 mb-4">諸島マスター</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(getRegionMastery(allIslandsData, visitCounts)).map(([region, mastery]) => (
                    <div key={region} className={`p-4 rounded-2xl border transition-all ${mastery.isMaster ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className={`font-bold font-serif ${mastery.isMaster ? 'text-amber-800' : 'text-slate-700'}`}>{mastery.title}</h4>
                        {mastery.isMaster && <span className="text-xs font-bold px-2 py-1 bg-amber-500 text-white rounded-full">MASTER</span>}
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                        <div className={`h-full ${mastery.isMaster ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${(mastery.visited / mastery.total) * 100}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[0.65rem] text-slate-500 font-bold">
                        <span>進行度</span>
                        <span>{mastery.visited} / {mastery.total} 島</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold tracking-widest text-slate-800 border-l-4 border-blue-500 pl-3 mb-4">特別称号コレクション</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {specialTitles.map(t => (
                    <div key={t.id} className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${t.unlocked ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200 grayscale opacity-70'}`}>
                      <div className="flex items-start justify-between">
                        <span className="text-3xl drop-shadow-sm">{t.icon}</span>
                        <span className={`text-[0.6rem] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${t.unlocked ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {t.unlocked ? '👑 獲得済' : `進行度: ${t.progress}%`}
                        </span>
                      </div>
                      <div>
                        <h4 className={`font-serif font-black text-base mb-1 ${t.unlocked ? 'text-blue-800' : 'text-slate-600'}`}>{t.name}</h4>
                        <p className={`text-[0.65rem] leading-relaxed ${t.unlocked ? 'text-blue-700/80' : 'text-slate-500'}`}>{t.description}</p>
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
              {/* Filter UI */}
              <div className="flex flex-wrap gap-2 mb-4 px-1">
                <button onClick={() => setFilterAttribute(null)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${!filterAttribute ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>すべて</button>
                <button onClick={() => setFilterAttribute('WATER')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${filterAttribute === 'WATER' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>💧 水</button>
                <button onClick={() => setFilterAttribute('NATURE')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${filterAttribute === 'NATURE' ? 'bg-green-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>🌿 自然</button>
                <button onClick={() => setFilterAttribute('FIRE')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${filterAttribute === 'FIRE' ? 'bg-red-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>🔥 火</button>
                <button onClick={() => setFilterAttribute('LIGHT')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${filterAttribute === 'LIGHT' ? 'bg-amber-400 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>✨ 光</button>
                <button onClick={() => setFilterAttribute('EARTH')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${filterAttribute === 'EARTH' ? 'bg-amber-700 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>🪨 地</button>
                <button onClick={() => setFilterAttribute('WIND')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${filterAttribute === 'WIND' ? 'bg-teal-400 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>🌪️ 風</button>
                <button onClick={() => setFilterAttribute('ICE')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${filterAttribute === 'ICE' ? 'bg-cyan-300 text-slate-800' : 'bg-white text-slate-500 border border-slate-200'}`}>❄️ 氷</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-transparent pt-2">
                {unlockedFairies.filter(f => !filterAttribute || (f as any).attribute === filterAttribute).map((fairy) => (
                  <div key={fairy.id} className={`relative flex flex-col items-center bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md ${fairy.unlocked ? 'border-slate-200' : 'border-slate-100 grayscale opacity-60'}`}>
                    {/* Card Header (Rarity & Attr) */}
                    {fairy.unlocked && (
                      <div className="absolute top-2 w-full px-2 flex justify-between items-center z-10">
                        <span className={`text-[0.55rem] font-black tracking-widest px-1.5 py-0.5 rounded-sm text-white shadow-sm ${
                          fairy.rarity === 'EPIC' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 
                          fairy.rarity === 'RARE' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
                          fairy.rarity === 'SPOT_EXCLUSIVE' ? 'bg-gradient-to-r from-rose-500 to-pink-600' : 'bg-slate-700'
                        }`}>
                          {fairy.rarity.replace('_EXCLUSIVE', '')}
                        </span>
                        {(fairy as any).attribute && (
                          <div className="bg-white/90 backdrop-blur-md rounded-full w-6 h-6 flex items-center justify-center text-[0.65rem] shadow-sm">
                            {{ WATER: '💧', NATURE: '🌿', FIRE: '🔥', LIGHT: '✨', EARTH: '🪨', WIND: '🌪️', ICE: '❄️' }[(fairy as any).attribute as string] || ''}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Image Area */}
                    <div className={`w-full aspect-[3/4] flex items-center justify-center text-5xl relative ${fairy.unlocked ? `bg-gradient-to-b ${fairy.visual.colorFrom} ${fairy.visual.colorTo}` : 'bg-slate-100'}`}>
                      {fairy.unlocked && fairy.visual.imageUrl ? (
                        <img src={fairy.visual.imageUrl} alt={fairy.name} className="w-full h-full object-contain p-2 drop-shadow-md" />
                      ) : (
                        <span>{fairy.visual.icon}</span>
                      )}
                    </div>
                    
                    {/* Card Footer (Name & Theme) */}
                    <div className="p-3 w-full text-center bg-white border-t border-slate-100">
                      <div className={`text-xs font-black truncate ${fairy.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                        {fairy.unlocked ? fairy.name : '???'}
                      </div>
                      <div className="text-[0.55rem] text-slate-500 truncate mt-0.5">
                        {fairy.unlocked ? fairy.theme : '未発見の妖精'}
                      </div>
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

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
              <OrderHistory />
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold tracking-widest text-slate-800 border-l-4 border-blue-500 pl-3 mb-4">クーポン・招待コード</h3>
                <form onSubmit={handleRedeemCode} className="flex flex-col gap-3 max-w-sm">
                  <p className="text-xs text-slate-500 mb-1">お持ちのクーポンコードを入力して特典を受け取りましょう。</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="クーポンコードを入力"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={isRedeeming || !promoCode}
                      className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {isRedeeming ? '適用中...' : '適用する'}
                    </button>
                  </div>
                </form>
              </div>

              {/* サブスクリプション管理 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold tracking-widest text-slate-800 border-l-4 border-amber-500 pl-3 mb-4">サブスクリプション管理・解約</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  プレミアムプラン・アルティメットプランの変更、お支払い方法の更新、およびプランの解約（自動更新の停止）は、Stripeの決済ポータルから安全に行うことができます。<br/>
                  解約した場合でも、現在の有効期限までは引き続き有料機能をご利用いただけます。
                </p>
                <button
                  onClick={async () => {
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const res = await fetch('/api/subscription/portal', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
                      });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    } catch (e) { console.error(e); }
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors inline-flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> お支払い管理・解約へ進む
                </button>
              </div>

              {/* 退会機能（Danger Zone） */}
              <div className="bg-rose-50 p-6 rounded-2xl shadow-sm border border-rose-200">
                <h3 className="text-sm font-bold tracking-widest text-rose-800 border-l-4 border-rose-500 pl-3 mb-4">アカウント退会（データ削除）</h3>
                <p className="text-xs text-rose-600 mb-4 leading-relaxed">
                  退会すると、これまでの訪問記録・獲得ポイント・相棒精霊の育成データがすべて初期化されます。一度退会すると復元はできません。<br/>
                  ※ 法執行機関からの開示請求等のため、バックエンドに一定期間データが保持されますが、一般公開されることはありません（あなたの過去の投稿は「退会済みユーザー」として匿名化されます）。
                </p>
                <button
                  onClick={async () => {
                    if (confirm('本当に退会しますか？この操作は取り消せません。')) {
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const res = await fetch('/api/user/delete', {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
                        });
                        if (res.ok) {
                          toast.success('アカウントを退会しました。ご利用ありがとうございました。');
                          await supabase.auth.signOut();
                          window.location.href = '/';
                        } else {
                          toast.error('退会処理に失敗しました。');
                        }
                      } catch (e) {
                        toast.error('エラーが発生しました。');
                      }
                    }
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                  アカウントを退会する
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 1周年記念証明書 申請モーダル */}
      <AnimatePresence>
        {showAnniversaryModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAnniversaryModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl border border-amber-400/40 shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* ヘッダー */}
              <div className="p-6 border-b border-amber-400/20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,200,0,0.5) 8px, rgba(255,200,0,0.5) 16px)' }} />
                <div className="relative">
                  <p className="text-amber-400 text-[0.6rem] font-bold tracking-widest uppercase mb-1">🎖️ KIRATABI ULTIMATE 1ST ANNIVERSARY</p>
                  <h2 className="text-white font-serif text-xl font-bold">特別版証明書 無料申請</h2>
                  <p className="text-amber-200/70 text-xs mt-1">訪問した島を1つ選んで、特別版の実物証明書をお届けします</p>
                </div>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {anniversarySuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-white font-serif text-lg font-bold mb-2">申請が完了しました！</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">運営から発送準備が整い次第、メールにてご連絡いたします。<br />到着まで今しばらくお待ちください。</p>
                    <button onClick={() => setShowAnniversaryModal(false)} className="mt-6 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm rounded-xl">閉じる</button>
                  </div>
                ) : (
                  <form onSubmit={handleAnniversarySubmit} className="space-y-4">
                    {/* 島を選択 */}
                    <div>
                      <label className="text-amber-300 text-xs font-bold mb-1.5 block">証明書にしたい島を選択</label>
                      <select
                        className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-xl p-3 focus:outline-none focus:border-amber-400"
                        value={anniversaryIslandId}
                        onChange={e => {
                          setAnniversaryIslandId(e.target.value);
                          const found = visitedIslandsList.find((i: any) => i.id === e.target.value);
                          setAnniversaryIslandName(found?.name || '');
                        }}
                        required
                      >
                        <option value="">-- 訪問済みの島から選ぶ --</option>
                        {visitedIslandsList.map((i: any) => (
                          <option key={i.id} value={i.id}>{i.name}（{i.prefecture}）</option>
                        ))}
                      </select>
                    </div>

                    {/* 送付先情報 */}
                    <div className="pt-2 border-t border-slate-700">
                      <p className="text-amber-300 text-xs font-bold mb-3">送付先情報</p>
                      <div className="space-y-3">
                        <input type="text" placeholder="氏名（フルネーム）" required value={anniversaryRecipientName} onChange={e => setAnniversaryRecipientName(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm rounded-xl p-3 focus:outline-none focus:border-amber-400" />
                        <input type="text" placeholder="郵便番号（例：123-4567）" required value={anniversaryPostalCode} onChange={e => setAnniversaryPostalCode(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm rounded-xl p-3 focus:outline-none focus:border-amber-400" />
                        <input type="text" placeholder="住所（都道府県〜番地・部屋番号まで）" required value={anniversaryAddress} onChange={e => setAnniversaryAddress(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm rounded-xl p-3 focus:outline-none focus:border-amber-400" />
                        <input type="tel" placeholder="電話番号（ハイフンなし）" required value={anniversaryPhone} onChange={e => setAnniversaryPhone(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm rounded-xl p-3 focus:outline-none focus:border-amber-400" />
                      </div>
                    </div>

                    <p className="text-slate-400 text-[0.65rem] leading-relaxed">※ 申請は1度のみ有効です。申請後の変更はお受けできません。個人情報は証明書の発送目的のみに使用します。</p>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowAnniversaryModal(false)}
                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors">
                        キャンセル
                      </button>
                      <button type="submit" disabled={anniversarySubmitting}
                        className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-900 font-bold text-sm rounded-xl shadow-lg transition-all disabled:opacity-60">
                        {anniversarySubmitting ? '送信中...' : '申請する'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <PlanChangeModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        currentTier={(subscriptionTier || 'free') as 'free' | 'premium' | 'ultimate'}
        onPlanChanged={(newTier) => {
          toast.success(`KIRATABI ${newTier === 'ultimate' ? 'Ultimate' : 'Premium'} に変更しました！`);
          // リロードしてContextを更新
          setTimeout(() => window.location.reload(), 1500);
        }}
      />
    </main>
  );
}
