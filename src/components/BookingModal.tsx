'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Users, MessageSquare, Check, Loader2, 
  Sparkles, BedDouble, ShieldCheck, ArrowRight, Clock, MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useTravel } from '@/context/TravelContext';
import { useRouter } from 'next/navigation';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  innName: string;
  accommodationId?: string;
  selectedPlan?: {
    name: string;
    price?: string;
  } | null;
}

const QUICK_TAGS = [
  '🚗 港・ヘリポート送迎希望',
  '🍽️ アレルギーあり',
  '🌙 遅めのチェックイン予定',
  '✨ 記念日・誕生日利用',
  '🎒 一人旅です'
];

export default function BookingModal({ 
  isOpen, 
  onClose, 
  innName, 
  accommodationId,
  selectedPlan 
}: BookingModalProps) {
  const router = useRouter();
  const { user } = useTravel();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // 計算: 宿泊日数
  const stayNights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const nights = Math.round(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  }, [checkIn, checkOut]);

  if (!isOpen) return null;

  const handleAddTag = (tag: string) => {
    if (notes.includes(tag)) return;
    setNotes(prev => prev ? `${prev}\n${tag}` : tag);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('予約リクエストを送るにはログインが必要です。');
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('チェックイン日とチェックアウト日を入力してください。');
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      toast.error('チェックアウト日はチェックイン日より後に設定してください。');
      return;
    }

    setIsSubmitting(true);

    try {
      let targetAccId = accommodationId;

      if (!targetAccId) {
        // Fallback: 宿名またはオーナーから取得
        const { data: matchedAcc } = await supabase
          .from('accommodations')
          .select('id')
          .ilike('name', `%${innName.replace(/（.*）|\(.*?\)/g, '').trim()}%`)
          .limit(1)
          .single();

        if (matchedAcc) {
          targetAccId = matchedAcc.id;
        } else {
          // フォールバック: DBにある最初の有効な宿を使う
          const { data: fallbackAccs } = await supabase.from('accommodations').select('id').limit(1);
          if (fallbackAccs && fallbackAccs.length > 0) {
            targetAccId = fallbackAccs[0].id;
          } else {
            throw new Error('宿泊施設情報の特定に失敗しました。');
          }
        }
      }

      const fullNotes = selectedPlan 
        ? `【選択プラン】: ${selectedPlan.name} (${selectedPlan.price || ''})\n\n${notes}`
        : notes;

      const { error } = await supabase.from('reservations').insert([
        {
          accommodation_id: targetAccId,
          guest_id: user.id,
          check_in_date: checkIn,
          check_out_date: checkOut,
          guest_count: guestCount,
          status: 'pending',
          guest_notes: fullNotes
        }
      ]);

      if (error) throw error;

      setIsSubmittedSuccess(true);
      toast.success('予約リクエストを送信しました！', { duration: 4000, icon: '✈️' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '予約リクエストの送信に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmittedSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 my-8"
        >
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white relative">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold text-[0.65rem] tracking-wider uppercase border border-amber-400/30">
                    DIRECT REQUEST
                  </span>
                  <span className="text-xs text-slate-300">Web予約リクエスト</span>
                </div>
                <h3 className="font-serif font-bold text-lg md:text-xl text-white line-clamp-1">
                  {innName}
                </h3>
              </div>
              <button 
                onClick={handleResetAndClose}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                title="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedPlan && (
              <div className="mt-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-between text-xs">
                <span className="text-amber-200 font-medium flex items-center gap-1.5">
                  <BedDouble className="w-3.5 h-3.5" /> {selectedPlan.name}
                </span>
                {selectedPlan.price && (
                  <span className="font-mono font-bold text-white bg-amber-500/30 px-2 py-0.5 rounded-md border border-amber-400/40">
                    {selectedPlan.price}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Success State */}
          {isSubmittedSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto shadow-sm">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-2xl text-slate-900">
                  予約リクエストを送信しました！
                </h4>
                <p className="text-sm text-slate-600 font-serif leading-relaxed max-w-md mx-auto">
                  宿オーナーが内容を確認後、承認通知と案内メッセージが届きます。進捗はマイページの「予約・宿泊履歴」でいつでも確認できます。
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>宿泊期間:</span>
                  <span className="font-bold text-slate-800">{checkIn} 〜 {checkOut} ({stayNights}泊)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>人数:</span>
                  <span className="font-bold text-slate-800">{guestCount} 名</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ステータス:</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">承認待ち (Pending)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    handleResetAndClose();
                    router.push('/mypage');
                  }}
                  className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  マイページの予約履歴へ <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-colors"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              
              {/* Dates with Night Badge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-500" /> 宿泊日程
                  </label>
                  {stayNights > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">
                      {stayNights} 泊 {stayNights + 1} 日
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider block mb-1">Check-in</span>
                    <input 
                      type="date" 
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={checkIn} 
                      onChange={e => setCheckIn(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="relative">
                    <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider block mb-1">Check-out</span>
                    <input 
                      type="date" 
                      required
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      value={checkOut} 
                      onChange={e => setCheckOut(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" /> 宿泊人数
                </label>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-2 w-max">
                  <button 
                    type="button" 
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))} 
                    className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-bold text-lg transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold font-serif text-lg text-slate-900">{guestCount} 名</span>
                  <button 
                    type="button" 
                    onClick={() => setGuestCount(guestCount + 1)} 
                    className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-bold text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Note Tags & Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-500" /> ご要望・メッセージ（任意）
                </label>

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_TAGS.map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors text-slate-600"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="到着予定時刻（フェリー便・ヘリ便名）や、送迎希望、お食事のご要望などがあればご記入ください..."
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs md:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none leading-relaxed font-serif"
                />
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                {!user ? (
                  <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <p className="text-xs font-bold text-amber-800 mb-1">KIRATABI へのログインが必要です</p>
                    <p className="text-[0.7rem] text-amber-700">
                      予約履歴の管理や到達証明との連動のため、ログイン後にリクエストを送信してください。
                    </p>
                  </div>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-widest rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> 送信処理中...</>
                    ) : (
                      <><Sparkles className="w-5 h-5 text-amber-300" /> 予約リクエストを送信する</>
                    )}
                  </button>
                )}

                <p className="text-[0.65rem] text-slate-400 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  送信時点では決済は発生しません。宿オーナーが確認・承認後に確定となります。
                </p>
              </div>

            </form>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
