'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTravel } from '@/context/TravelContext';
import { MessageCircle, Edit3, Star, Droplets, Users, ShieldCheck } from 'lucide-react';
import DiaryPostModal from './DiaryPostModal';

interface IslandDiary {
  id: string;
  user_id: string;
  created_at: string;
  is_official?: boolean;
  overall_rating?: number;
  tags?: string[];
  water_clarity?: number;
  starry_sky?: number;
  visit_month?: number;
  companion_type?: string;
  content: string;
  photo_url?: string;
}

export default function IslandDiaries({ 
  islandId, 
  islandName,
  initialDiaries = []
}: { 
  islandId: string, 
  islandName: string,
  initialDiaries?: IslandDiary[]
}) {
  const { user } = useTravel();
  const [diaries, setDiaries] = useState<IslandDiary[]>(initialDiaries);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDiaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [islandId]);

  const fetchDiaries = async () => {
    setLoading(true);
    try {
      // NOTE: 本来はuser_profilesとJOINして表示名を出すのが理想ですが、現状はuser_idをそのまま使っています
      const { data, error } = await supabase
        .from('island_diaries')
        .select('*')
        .eq('island_id', islandId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiaries(data || []);
    } catch (err) {
      console.error('Failed to fetch diaries:', err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:p-8 mb-12">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800">みんなの島ノート</h2>
          <p className="text-xs text-slate-400 mt-1">この島を訪れた旅人の記録と写真</p>
        </div>
      </div>

      {/* Post Form Trigger */}
      {user ? (
        <div className="mb-10 text-center bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
          <p className="text-sm font-bold text-slate-600 mb-4">あなたの島旅の思い出を共有しませんか？</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 mx-auto hover:scale-105"
          >
            <Edit3 className="w-5 h-5" /> ✍️ リッチな島ノートを書く
          </button>
        </div>
      ) : (
        <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
          <p className="text-sm text-slate-500 font-bold">島ノートを投稿するにはログインが必要です</p>
        </div>
      )}

      {/* Diary Post Modal */}
      <DiaryPostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        islandId={islandId} 
        islandName={islandName}
        onSuccess={fetchDiaries}
      />

      {/* Diary List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">読み込み中...</div>
        ) : diaries.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <MessageCircle className="w-12 h-12 mx-auto opacity-20 mb-3" />
            <p className="font-serif text-sm">まだ島ノートがありません。<br/>最初の記録を残してみませんか？</p>
          </div>
        ) : (
          diaries.map((diary) => (
            <div key={diary.id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                    diary.is_official ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 ring-2 ring-amber-300 ring-offset-1' : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600'
                  }`}>
                    {diary.is_official ? <ShieldCheck className="w-4 h-4" /> : diary.user_id.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      {diary.is_official ? '公式アンバサダー' : `User ${diary.user_id.substring(0, 5)}`}
                      {diary.is_official && <span className="bg-amber-100 text-amber-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold">公式</span>}
                    </div>
                    <div className="text-[10px] text-slate-400">{new Date(diary.created_at).toLocaleDateString('ja-JP')}</div>
                  </div>
                </div>
                {/* 総合評価 */}
                {diary.overall_rating && (
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-amber-700">{diary.overall_rating}.0</span>
                  </div>
                )}
              </div>

              {/* タグとメタ情報 */}
              <div className="pl-11 mb-3 flex flex-wrap gap-1.5">
                {diary.tags?.map((tag: string) => (
                  <span key={tag} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                    {tag}
                  </span>
                ))}
                {diary.water_clarity && (
                  <span className="bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border border-cyan-100">
                    <Droplets className="w-3 h-3" /> 透明度 {diary.water_clarity}
                  </span>
                )}
                {diary.starry_sky && (
                  <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border border-indigo-100">
                    <Star className="w-3 h-3" /> 星空 {diary.starry_sky}
                  </span>
                )}
                {diary.visit_month && (
                  <span className="text-slate-500 text-[10px] font-medium ml-1 flex items-center">{diary.visit_month}月訪問</span>
                )}
                {diary.companion_type && (
                  <span className="text-slate-500 text-[10px] font-medium ml-1 flex items-center border-l border-slate-200 pl-2">
                    <Users className="w-3 h-3 mr-1" />{diary.companion_type}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-serif whitespace-pre-wrap pl-11">
                {diary.content}
              </p>
              {diary.photo_url && (
                <div className="mt-3 pl-11">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={diary.photo_url} alt="User posted photo" className="rounded-xl max-h-80 w-full md:w-3/4 object-contain bg-slate-100 border border-slate-200 shadow-sm" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
