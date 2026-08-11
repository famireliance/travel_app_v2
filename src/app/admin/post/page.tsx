'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Send, MapPin, Loader2, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminPostPage() {
  const [islands, setIslands] = useState<any[]>([]);
  const [selectedIsland, setSelectedIsland] = useState('');
  const [keywords, setKeywords] = useState('');
  const [vibe, setVibe] = useState('ワクワクする楽しい雰囲気');
  
  const [content, setContent] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  
  const [overallRating, setOverallRating] = useState(5);
  const [waterClarity, setWaterClarity] = useState(0);
  const [starrySky, setStarrySky] = useState(0);
  const [ferryRisk, setFerryRisk] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIslands();
  }, []);

  const fetchIslands = async () => {
    const { data, error } = await supabase.from('islands').select('id, name').order('name');
    if (data) setIslands(data);
  };

  const handleGenerate = async () => {
    if (!selectedIsland) {
      toast.error('島を選択してください');
      return;
    }
    const islandName = islands.find(i => i.id === selectedIsland)?.name;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ islandName, keywords, vibe })
      });
      const data = await res.json();
      
      if (res.ok) {
        setContent(data.text);
        toast.success('AIが文章を生成しました');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || '生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIsland || !content.trim()) {
      toast.error('必須項目が入力されていません');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('ログインが必要です');
        setIsSubmitting(false);
        return;
      }

      const postData = {
        island_id: selectedIsland,
        user_id: userData.user.id,
        content: content,
        photo_url: photoUrl || null,
        overall_rating: overallRating,
        water_clarity: waterClarity > 0 ? waterClarity : null,
        starry_sky: starrySky > 0 ? starrySky : null,
        ferry_risk: ferryRisk || null,
        is_official: true
      };

      const { error } = await supabase.from('island_diaries').insert([postData]);
      if (error) throw error;

      toast.success('公式投稿として保存しました！');
      
      setContent('');
      setPhotoUrl('');
      setKeywords('');
      setWaterClarity(0);
      setStarrySky(0);
      setFerryRisk('');
    } catch (err: any) {
      console.error(err);
      toast.error('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-slate-900">公式投稿（AI自動生成）</h1>
            <p className="text-sm text-slate-500">KIRATABI運営用 島ノート投稿ツール</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Generation Form */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-6 text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-500" /> AI アシスタント
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">1. 対象の島を選択</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <select 
                    value={selectedIsland}
                    onChange={e => setSelectedIsland(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">島を選択...</option>
                    {islands.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">2. キーワード（任意）</label>
                <input 
                  type="text"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="例: シュノーケリング, 海亀, 星空, 絶品海鮮丼"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">3. トーン＆マナー</label>
                <select 
                  value={vibe}
                  onChange={e => setVibe(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ワクワクする楽しい雰囲気">ワクワクする楽しい雰囲気</option>
                  <option value="落ち着いた癒やしの雰囲気">落ち着いた癒やしの雰囲気</option>
                  <option value="神秘的で感動的な雰囲気">神秘的で感動的な雰囲気</option>
                  <option value="客観的で役立つガイド風">客観的で役立つガイド風</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !selectedIsland}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-400" />}
                {isGenerating ? 'AIが執筆中...' : 'AIで文章を生成する'}
              </button>
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-6 text-slate-700">
              <Send className="w-4 h-4 text-blue-500" /> 投稿内容の確認・編集
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">本文</label>
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="ここにAIの生成結果が表示されます。直接編集も可能です。"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">写真URL (任意)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input 
                    type="url"
                    value={photoUrl}
                    onChange={e => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {photoUrl && (
                  <div className="mt-2 h-24 rounded-lg overflow-hidden bg-slate-100">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">海の透明度 (0-5)</label>
                  <input type="number" min="0" max="5" value={waterClarity} onChange={e => setWaterClarity(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">星空指数 (0-5)</label>
                  <input type="number" min="0" max="5" value={starrySky} onChange={e => setStarrySky(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">総合満足度 (1-5)</label>
                  <input type="number" min="1" max="5" value={overallRating} onChange={e => setOverallRating(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">フェリー欠航リスク</label>
                  <select value={ferryRisk} onChange={e => setFerryRisk(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none">
                    <option value="">設定なし</option>
                    <option value="低">低</option>
                    <option value="中">中</option>
                    <option value="高">高</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting || !content || !selectedIsland}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  公式アンバサダーとして投稿
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
