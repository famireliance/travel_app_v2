'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTravel } from '@/context/TravelContext';
import { Camera, Send, MessageCircle } from 'lucide-react';

export default function IslandDiaries({ islandId }: { islandId: string }) {
  const { user } = useTravel();
  const [diaries, setDiaries] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDiaries();
  }, [islandId]);

  const fetchDiaries = async () => {
    setLoading(true);
    try {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('island_diaries')
        .insert([{
          island_id: islandId,
          user_id: user.id,
          content: content.trim(),
          photo_url: photoUrl.trim() || null
        }])
        .select();

      if (error) throw error;
      
      setDiaries([data[0], ...diaries]);
      setContent('');
      setPhotoUrl('');
    } catch (err) {
      console.error('Failed to post diary:', err);
      alert('投稿に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:p-8 mb-12">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800">みんなの島ログ</h2>
          <p className="text-xs text-slate-400 mt-1">この島を訪れた旅人の記録と写真</p>
        </div>
      </div>

      {/* Post Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-10 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="この島の感想やおすすめスポットをシェアしよう！"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 resize-none h-24"
            required
          />
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="写真のURL（任意）"
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-500/20"
            >
              {submitting ? '投稿中...' : <><Send className="w-4 h-4" /> 投稿する</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
          <p className="text-sm text-slate-500 font-bold">島ログを投稿するにはログインが必要です</p>
        </div>
      )}

      {/* Diary List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">読み込み中...</div>
        ) : diaries.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <MessageCircle className="w-12 h-12 mx-auto opacity-20 mb-3" />
            <p className="font-serif text-sm">まだ島ログがありません。<br/>最初の記録を残してみませんか？</p>
          </div>
        ) : (
          diaries.map((diary) => (
            <div key={diary.id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs uppercase shadow-inner">
                  {diary.user_id.substring(0, 2)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">User {diary.user_id.substring(0, 5)}</div>
                  <div className="text-[10px] text-slate-400">{new Date(diary.created_at).toLocaleDateString('ja-JP')}</div>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-serif whitespace-pre-wrap pl-11">
                {diary.content}
              </p>
              {diary.photo_url && (
                <div className="mt-3 pl-11">
                  <img src={diary.photo_url} alt="User posted photo" className="rounded-xl max-h-64 object-cover border border-slate-200" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
