'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Camera, Star, Droplets, Navigation, Users, Calendar, AlertTriangle, LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

interface DiaryPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  islandId: string;
  islandName: string;
  onSuccess?: () => void;
}

const AVAILABLE_TAGS = [
  '🏖️絶景', '🍜グルメ', '🏃アクティビティ', '👪子連れOK', 
  '💑カップル', '📸映えスポット', '🚗レンタカー必須', '🚲サイクリング',
  '🏊シュノーケリング', '🐠ダイビング', '♨️温泉', '🧘リラックス'
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const COMPANIONS = ['ひとり旅', 'カップル・夫婦', '家族・子連れ', '友人グループ'];
const FERRY_RISKS = ['低', '中', '高'];

export default function DiaryPostModal({ isOpen, onClose, islandId, islandName, onSuccess }: DiaryPostModalProps) {
  const [content, setContent] = useState('');
  const [photoUrl, setPhotoUrl] = useState(''); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visitMonth, setVisitMonth] = useState<number | null>(null);
  const [waterClarity, setWaterClarity] = useState(0);
  const [starrySky, setStarrySky] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [ferryRisk, setFerryRisk] = useState<string | null>(null);
  const [companion, setCompanion] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onload = (event) => {
          setPhotoUrl(event.target?.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('画像圧縮エラー:', error);
        toast.error('画像の最適化に失敗しました。別の写真をお試しください。');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('本文を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error('ログインが必要です');
        setIsSubmitting(false);
        return;
      }

      const postData = {
        island_id: islandId,
        user_id: userData.user.id,
        content: content,
        photo_url: photoUrl || null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        visit_month: visitMonth,
        water_clarity: waterClarity > 0 ? waterClarity : null,
        starry_sky: starrySky > 0 ? starrySky : null,
        overall_rating: overallRating > 0 ? overallRating : null,
        ferry_risk: ferryRisk,
        companion_type: companion,
        is_official: false
      };

      const { error } = await supabase.from('island_diaries').insert([postData]);
      
      if (error) throw error;

      toast.success('島ノートを投稿しました！');
      
      setContent('');
      setPhotoUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedTags([]);
      setVisitMonth(null);
      setWaterClarity(0);
      setStarrySky(0);
      setOverallRating(0);
      setFerryRisk(null);
      setCompanion(null);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error posting diary:', err);
      toast.error('投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingStars = ({ value, onChange, icon: Icon, colorClass }: { value: number, onChange: (v: number) => void, icon: LucideIcon, colorClass: string }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 transition-transform hover:scale-110 ${value >= star ? colorClass : 'text-slate-200'}`}
          >
            <Icon className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-400" />
                {islandName}のノートを書く
              </h3>
              <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
              <form id="diary-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex flex-col items-center justify-center">
                  <label className="block text-sm font-bold text-amber-900 mb-2">総合満足度（必須）</label>
                  <RatingStars value={overallRating} onChange={setOverallRating} icon={Star} colorClass="text-amber-400" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">旅行記・感想（必須）</label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    placeholder="島の魅力や感想を自由に書いてください！"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                    <Camera className="w-4 h-4" /> 写真（任意）
                  </label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                    id="diary-modal-image-upload"
                  />
                  <label 
                    htmlFor="diary-modal-image-upload"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 w-full bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors text-sm font-bold shadow-sm"
                  >
                    <Camera className="w-5 h-5 text-slate-400" />
                    端末から写真を選ぶ
                  </label>
                  
                  {photoUrl && (
                    <div className="mt-3 relative rounded-xl overflow-hidden bg-slate-100 inline-block border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoUrl} alt="Preview" className="h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => { setPhotoUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. タグ（複数選択） */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">おすすめタグ（複数選択可）</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          selectedTags.includes(tag) 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 透明度 */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Droplets className="w-4 h-4 text-cyan-500" /> 海の透明度
                    </label>
                    <RatingStars value={waterClarity} onChange={setWaterClarity} icon={Droplets} colorClass="text-cyan-400" />
                  </div>

                  {/* 星空 */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Star className="w-4 h-4 text-indigo-500" /> 星空指数
                    </label>
                    <RatingStars value={starrySky} onChange={setStarrySky} icon={Star} colorClass="text-indigo-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 訪問月 */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> 訪問月
                    </label>
                    <select 
                      value={visitMonth || ''} 
                      onChange={(e) => setVisitMonth(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">選択しない</option>
                      {MONTHS.map(m => (
                        <option key={m} value={m}>{m}月</option>
                      ))}
                    </select>
                  </div>

                  {/* 誰と */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Users className="w-4 h-4" /> 誰と行った？
                    </label>
                    <select 
                      value={companion || ''} 
                      onChange={(e) => setCompanion(e.target.value || null)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">選択しない</option>
                      {COMPANIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 欠航リスク */}
                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                  <label className="block text-sm font-bold text-rose-800 mb-3 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> フェリー欠航リスク・揺れ
                  </label>
                  <div className="flex gap-2">
                    {FERRY_RISKS.map(risk => (
                      <button
                        key={risk}
                        type="button"
                        onClick={() => setFerryRisk(ferryRisk === risk ? null : risk)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                          ferryRisk === risk 
                            ? 'bg-rose-500 text-white shadow-md' 
                            : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {risk}
                      </button>
                    ))}
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 shrink-0 flex justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm"
              >
                キャンセル
              </button>
              <button 
                type="submit"
                form="diary-form"
                disabled={isSubmitting || overallRating === 0 || !content.trim()}
                className="px-8 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                投稿する
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
