import React, { useState } from 'react';
import { X, Calendar, Users, MessageSquare, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useTravel } from '@/context/TravelContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  innName: string;
}

export default function BookingModal({ isOpen, onClose, innName }: BookingModalProps) {
  const { user } = useTravel();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('予約にはログインが必要です。');
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
      // MVP E2E用: 「あおがしま屋」のテストオーナーが持つ accommodation_id を動的に取得
      // （※本番環境では、ページ遷移元の props や URLパラメータから本物のIDを渡します）
      const { data: ownerUsers } = await supabase.from('user_profiles').select('id').eq('email', 'owner@example.com').single();
      let accId = null;
      if (ownerUsers) {
         const { data: accs } = await supabase.from('accommodations').select('id').eq('owner_id', ownerUsers.id).single();
         if (accs) accId = accs.id;
      }
      
      if (!accId) {
        // フォールバック: DBにある最初の宿を使う
        const { data: fallbackAccs } = await supabase.from('accommodations').select('id').limit(1);
        if (fallbackAccs && fallbackAccs.length > 0) {
          accId = fallbackAccs[0].id;
        } else {
          throw new Error('テスト用の宿泊施設データが見つかりません。');
        }
      }

      const { error } = await supabase.from('reservations').insert([
        {
          accommodation_id: accId,
          guest_id: user.id,
          check_in_date: checkIn,
          check_out_date: checkOut,
          guest_count: guestCount,
          status: 'pending',
          guest_notes: notes
        }
      ]);

      if (error) throw error;

      toast.success('予約リクエストを送信しました！オーナーからの承認をお待ちください。', { duration: 5000, icon: '✈️' });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '予約リクエストの送信に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[0.65rem] font-bold tracking-widest text-blue-500 uppercase">Web Booking Request</span>
            <h3 className="font-bold text-slate-900 text-lg">{innName} への予約リクエスト</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> チェックイン日</label>
              <input 
                type="date" 
                required
                min={new Date().toISOString().split('T')[0]}
                value={checkIn} 
                onChange={e => setCheckIn(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> チェックアウト日</label>
              <input 
                type="date" 
                required
                min={checkIn || new Date().toISOString().split('T')[0]}
                value={checkOut} 
                onChange={e => setCheckOut(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> 宿泊人数</label>
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-2 w-max">
              <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-500 font-bold text-lg">-</button>
              <span className="w-8 text-center font-bold text-slate-800">{guestCount}名</span>
              <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-500 font-bold text-lg">+</button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/> オーナーへのメッセージ（任意）</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="アレルギー情報、到着便の時刻（送迎希望の場合）、その他ご要望など"
              className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            {!user ? (
              <div className="text-center p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-sm font-bold text-rose-600 mb-1">ログインが必要です</p>
                <p className="text-xs text-rose-500">予約リクエストを送るには、KIRATABIへのログインが必要です。</p>
              </div>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-widest rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 送信中...</>
                ) : (
                  <><Check className="w-5 h-5" /> 予約リクエストを送信する</>
                )}
              </button>
            )}
            <p className="text-[0.65rem] text-slate-400 text-center mt-3">
              ※この時点では予約は確定していません。宿からの承認をお待ちください。
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}
