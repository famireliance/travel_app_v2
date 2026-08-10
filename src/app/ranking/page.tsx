'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Medal, Star, Compass } from 'lucide-react';
import { useTravel } from '@/context/TravelContext';
import Breadcrumb from '@/components/Breadcrumb';
import { supabase } from '@/lib/supabase';

// 競合との比較を考慮し、実際に活気のあるサービスに見えるよう、
// DBが空の場合のフォールバック用としてモックデータを保持（β版としてのデモデータ）
const MOCK_RANKING = [
  { id: 'mock1', username: 'KIRA_Adventurer', visited: 215, points: 64500, title: '伝説の島旅王' },
  { id: 'mock2', username: 'Island_Hopper99', visited: 184, points: 55200, title: '海神の使い' },
  { id: 'mock3', username: 'BlueOcean_77', visited: 156, points: 46800, title: '伝説の旅人' },
  { id: 'mock4', username: 'SunnyWalker', visited: 128, points: 38400, title: '熟練の島巡り' },
  { id: 'mock5', username: 'StarGazer', visited: 112, points: 33600, title: '熟練の島巡り' },
  { id: 'mock6', username: 'YamaUmi_Lover', visited: 95, points: 28500, title: '旅の達人' },
  { id: 'mock7', username: 'NekoTraveler', visited: 82, points: 24600, title: '旅の達人' },
  { id: 'mock8', username: 'WanderingSoul', visited: 67, points: 20100, title: '中級探検家' },
  { id: 'mock9', username: 'SunsetChaser', visited: 54, points: 16200, title: '中級探検家' },
  { id: 'mock10', username: 'AquaMarine', visited: 42, points: 12600, title: '冒険者の卵' },
];

export default function RankingPage() {
  const router = useRouter();
  const { user, totalVisited, totalPoints } = useTravel();
  const [rankingType, setRankingType] = useState<'visited' | 'points'>('visited');
  const [realRanking, setRealRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchRanking() {
      try {
        const { data, error } = await supabase.from('user_ranking_view').select('*');
        if (!error && data && data.length > 0) {
          setRealRanking(data);
        }
      } catch (e) {
        console.error('Failed to fetch ranking view:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, []);

  // 実データが少ない場合はモックとマージして活気を演出（将来的に外す）
  let fullRanking = realRanking.length > 0 ? [...realRanking] : [...MOCK_RANKING];
  
  // モックだけの時、または実データに自分がいない場合は自分を挿入
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

        <div className="space-y-4">
          {fullRanking.map((p, index) => {
            const isMe = user && p.id === user.id;
            const rank = index + 1;
            return (
              <div 
                key={p.id}
                className={`relative overflow-hidden p-5 rounded-2xl flex items-center gap-4 border transition-all ${isMe ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md scale-[1.02]' : 'bg-white border-slate-100 shadow-sm'}`}
              >
                {isMe && <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[0.6rem] font-bold tracking-widest rounded-bl-xl">YOU</div>}
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                  rank === 1 ? 'bg-amber-100 text-amber-600' : 
                  rank === 2 ? 'bg-slate-200 text-slate-600' :
                  rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-50 text-slate-400'
                }`}>
                  {rank === 1 ? <Trophy size={20} /> : rank === 2 ? <Medal size={20} /> : rank === 3 ? <Medal size={20} /> : rank}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold truncate ${isMe ? 'text-blue-900' : 'text-slate-800'}`}>{p.username}</h3>
                    <span className="text-[0.6rem] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full shrink-0">{p.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><Compass size={12} className={rankingType === 'visited' ? 'text-blue-500' : ''}/> {p.visited} 島</span>
                    <span className="flex items-center gap-1"><Star size={12} className={rankingType === 'points' ? 'text-amber-500' : ''}/> {p.points.toLocaleString()} XP</span>
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
