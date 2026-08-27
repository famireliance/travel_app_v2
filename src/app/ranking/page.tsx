'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Medal, Star, Compass, MapPin, Award, User } from 'lucide-react';
import { useTravel } from '@/context/TravelContext';
import Breadcrumb from '@/components/Breadcrumb';
import { supabase } from '@/lib/supabase';
import { getPlayerLevelInfo } from '@/lib/gamification';



interface RankingUser {
  id: string;
  username: string;
  visited: number;
  points: number;
  title: string;
}

export default function RankingPage() {
  const router = useRouter();
  const { user, totalVisited, totalPoints } = useTravel();
  const [rankingType, setRankingType] = useState<'visited' | 'points'>('visited');
  const [realRanking, setRealRanking] = useState<RankingUser[]>([]);

  React.useEffect(() => {
    async function fetchRanking() {
      try {
        const { data, error } = await supabase.from('user_ranking_view').select('*');
        if (!error && data && data.length > 0) {
          setRealRanking(data);
        }
      } catch (e) {
        console.error('Failed to fetch ranking view:', e);
      }
    }
    fetchRanking();
  }, []);

  // 実データをそのまま使用する
  const fullRanking = [...realRanking];
  
  // 実データに自分がいない場合は自分を一時的に挿入して順位を見せる（0島でも参加しているように見せる）
  const isMeInRanking = fullRanking.some(r => r.id === user?.id);
  if (user && !isMeInRanking) {
    fullRanking.push({
      id: user.id,
      username: user.email?.split('@')[0] || 'You',
      visited: totalVisited,
      points: totalPoints,
      title: totalVisited > 100 ? '伝説の旅人' : totalVisited > 50 ? '熟練の島巡り' : '冒険者の卵'
    });
  }

  // Sort
  fullRanking.sort((a, b) => (b[rankingType] || 0) - (a[rankingType] || 0));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      <header className="bg-slate-900 text-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <button 
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-bold tracking-widest flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              旅人ランキング
            </h1>
            <p className="text-xs text-white/60 mt-1">全国の島巡りプレイヤーと競おう</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6">
        <Breadcrumb items={[{ label: 'ランキング' }]} className="mb-6" />

        {!user && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between shadow-lg">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">ログインしてキラ旅をもっと楽しもう！</h3>
              <p className="text-blue-100 text-sm">進行状況の保存、ランキング参加、島ノートの投稿など、すべての機能が利用可能になります。</p>
            </div>
            <Link href="/mypage" className="px-6 py-3 bg-white text-blue-600 font-bold rounded-full shadow-md hover:bg-blue-50 transition-colors whitespace-nowrap">
              ログイン / 新規登録
            </Link>
          </div>
        )}

        <div className="bg-white rounded-full p-1 flex shadow-sm border border-slate-100 mb-8">
          <button
            onClick={() => setRankingType('visited')}
            className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${rankingType === 'visited' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            到達島数ランキング
          </button>
          <button
            onClick={() => setRankingType('points')}
            className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${rankingType === 'points' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            獲得XPランキング
          </button>
        </div>

        <div className="space-y-5">
          {fullRanking.map((p, index) => {
            const isMe = user && p.id === user.id;
            const rank = index + 1;
            const levelInfo = getPlayerLevelInfo(p.points);
            
            return (
              <div 
                key={p.id}
                className={`relative overflow-hidden p-6 rounded-3xl flex items-center gap-5 border transition-all hover:scale-[1.01] ${isMe ? 'bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.3)] text-white' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}
              >
                {isMe && (
                  <div className="absolute top-0 right-0 px-6 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[0.7rem] font-bold tracking-widest rounded-bl-2xl shadow-md z-10 flex items-center gap-1.5">
                    <User size={12} />
                    YOUR RANK
                  </div>
                )}
                
                {/* ランクバッジ */}
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center font-bold text-xl lg:text-2xl shadow-inner border-2 ${
                    rank === 1 ? 'bg-gradient-to-br from-yellow-100 to-amber-200 text-amber-700 border-amber-300 shadow-amber-500/20' : 
                    rank === 2 ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-700 border-slate-300 shadow-slate-500/20' :
                    rank === 3 ? 'bg-gradient-to-br from-orange-50 to-orange-200 text-orange-800 border-orange-300 shadow-orange-500/20' :
                    'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {rank === 1 ? <Trophy size={28} className="drop-shadow-sm" /> : rank === 2 ? <Medal size={28} className="drop-shadow-sm" /> : rank === 3 ? <Medal size={28} className="drop-shadow-sm" /> : rank}
                  </div>
                  {rank <= 3 && (
                    <div className="absolute -bottom-2 -right-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white ${
                        rank === 1 ? 'bg-amber-500' : rank === 2 ? 'bg-slate-400' : 'bg-orange-500'
                      }`}>
                        <Award size={12} />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* ユーザー情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className={`font-bold text-lg truncate ${isMe ? 'text-white drop-shadow-md' : 'text-slate-800'}`}>{p.username}</h3>
                    <span className={`text-[0.65rem] px-2.5 py-0.5 rounded-full font-bold shadow-sm shrink-0 ${
                      p.visited > 100 ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' :
                      p.visited > 50 ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {p.title}
                    </span>
                    <span className={`text-[0.65rem] px-2 py-0.5 rounded-full font-bold ${isMe ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      Lv.{levelInfo.level}
                    </span>
                  </div>
                  
                  {/* スコア・プログレス */}
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center justify-between text-xs font-bold mb-0.5 ${isMe ? 'text-white/80' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1.5"><Compass size={14} className={rankingType === 'visited' ? 'text-blue-500' : 'text-slate-400'}/> 制覇島数</span>
                        <span className={rankingType === 'visited' ? 'text-blue-600 text-sm' : ''}>{p.visited} 島</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full max-w-[150px]">
                        <div className={`h-full rounded-full ${rankingType === 'visited' ? 'bg-blue-500' : 'bg-slate-300'}`} style={{ width: `${Math.min(100, (p.visited / (fullRanking.length > 0 ? 432 : 432)) * 100)}%` }} />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center justify-between text-xs font-bold mb-0.5 ${isMe ? 'text-white/80' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1.5"><Star size={14} className={rankingType === 'points' ? 'text-amber-500' : 'text-slate-400'}/> 冒険XP</span>
                        <span className={rankingType === 'points' ? 'text-amber-600 text-sm' : ''}>{p.points.toLocaleString()} XP</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full max-w-[150px]">
                        <div className={`h-full rounded-full ${rankingType === 'points' ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${Math.min(100, (p.points / (levelInfo.nextLevelXP || p.points || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
