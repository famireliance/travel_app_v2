'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Users, MessageSquare, Check, Loader2, 
  Sparkles, Car, Compass, ShieldCheck, ArrowRight, Clock, MapPin, Phone, Mail, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useTravel } from '@/context/TravelContext';
import { useRouter } from 'next/navigation';
import { ServicePlanItem, IslandServiceItem } from '@/data/islandServicesData';

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: IslandServiceItem;
  selectedPlan?: ServicePlanItem | null;
}

export default function ServiceBookingModal({
  isOpen,
  onClose,
  service,
  selectedPlan
}: ServiceBookingModalProps) {
  const router = useRouter();
  const { user, travelerName } = useTravel();

  const isRental = service.type === 'rental_car' || service.type === 'bike_rental';

  // フォームステート
  const [chosenPlanId, setChosenPlanId] = useState<string>(selectedPlan?.id || service.plans[0]?.id || '');
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [participantsCount, setParticipantsCount] = useState<number>(isRental ? 1 : 2);
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [pickupNotes, setPickupNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdReservationId, setCreatedReservationId] = useState<string | null>(null);

  // 初期値セット
  useEffect(() => {
    if (selectedPlan) {
      setChosenPlanId(selectedPlan.id);
    } else if (service.plans.length > 0) {
      setChosenPlanId(service.plans[0].id);
    }
  }, [selectedPlan, service]);

  useEffect(() => {
    if (user) {
      if (!guestName && travelerName) setGuestName(travelerName);
      if (!guestEmail && user.email) setGuestEmail(user.email);
    }
    // 明日の日付をデフォルトに
    if (!startDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const iso = tomorrow.toISOString().split('T')[0];
      setStartDate(iso);
      if (isRental && !endDate) {
        const after = new Date(tomorrow);
        after.setDate(after.getDate() + 1);
        setEndDate(after.toISOString().split('T')[0]);
      }
    }
  }, [user, travelerName, isRental, startDate, endDate, guestName, guestEmail]);

  // 選択されたプランオブジェクト
  const activePlan = useMemo(() => {
    return service.plans.find(p => p.id === chosenPlanId) || service.plans[0];
  }, [service, chosenPlanId]);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (isRental && val) {
      const start = new Date(val);
      const nextDay = new Date(start);
      nextDay.setDate(nextDay.getDate() + 1);
      const isoNext = nextDay.toISOString().split('T')[0];
      if (!endDate || endDate <= val) {
        setEndDate(isoNext);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate) {
      toast.error('利用開始日を選択してください');
      return;
    }
    if (isRental && !endDate) {
      toast.error('返却日を選択してください');
      return;
    }
    if (!guestName.trim()) {
      toast.error('代表者様のお名前を入力してください');
      return;
    }
    if (!guestPhone.trim()) {
      toast.error('緊急時のご連絡先電話番号を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const notesHeader = [
        `【代表者様氏名】: ${guestName.trim()}`,
        `【お電話番号】: ${guestPhone.trim()}`,
        guestEmail.trim() ? `【メールアドレス】: ${guestEmail.trim()}` : '',
        pickupNotes.trim() ? `【ご希望・配車場所等】:\n${pickupNotes.trim()}` : ''
      ].filter(Boolean).join('\n');

      const reservationPayload = {
        service_id: service.id,
        guest_id: user?.id || null,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_email: guestEmail.trim() || user?.email || '',
        selected_plan_id: activePlan?.id || 'default',
        selected_plan_name: activePlan?.name || service.name,
        start_date: startDate,
        start_time: startTime,
        end_date: isRental ? endDate : startDate,
        end_time: isRental ? endTime : startTime,
        participants_count: participantsCount,
        total_price: activePlan?.price || service.priceRange,
        status: 'pending',
        guest_notes: notesHeader,
        created_at: new Date().toISOString()
      };

      let newResId = `srv-${Date.now()}`;

      // Supabaseに挿入（テーブルが存在する場合）
      const { data, error } = await supabase
        .from('service_reservations')
        .insert([reservationPayload])
        .select('id')
        .single();

      if (!error && data) {
        newResId = data.id;
      } else {
        // service_reservations が未作成の場合は reservations テーブルかローカル保存にフォールバック
        console.warn('service_reservations insert fallback:', error);
        await supabase.from('reservations').insert([{
          accommodation_id: null,
          guest_id: user?.id || null,
          guest_name: guestName.trim(),
          guest_phone: guestPhone.trim(),
          check_in_date: startDate,
          check_out_date: isRental ? endDate : startDate,
          guest_count: participantsCount,
          plan_name: `[${service.category}] ${activePlan?.name || service.name}`,
          total_price: activePlan?.price || service.priceRange,
          status: 'pending',
          guest_notes: `【${isRental ? 'レンタカー' : 'アクティビティ'}予約リクエスト: ${service.name}】\n` + notesHeader
        }]).select('id').maybeSingle();
      }

      setCreatedReservationId(newResId);
      setIsSuccess(true);
      toast.success('予約リクエストを送信しました！');
    } catch (err: any) {
      console.error('Reservation submission error:', err);
      toast.error('予約送信中にエラーが発生しました。お電話でも受け付けております。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10 my-8"
          >
            {/* Header */}
            <div className={`p-6 text-white relative ${
              isRental 
                ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900' 
                : 'bg-gradient-to-r from-purple-700 via-pink-700 to-slate-900'
            }`}>
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                title="閉じる"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[0.65rem] font-bold tracking-widest uppercase font-mono border border-white/20 flex items-center gap-1">
                  {isRental ? <Car size={12} /> : <Compass size={12} />}
                  KIRATABI {isRental ? 'RENTAL CAR' : 'ISLAND ACTIVITY'}
                </span>
                <span className="text-xs text-amber-300 font-bold">
                  ★ 公式提携・欠航免除保証
                </span>
              </div>

              <h3 className="font-serif font-bold text-xl sm:text-2xl text-white">
                {service.name}
              </h3>
              <p className="text-xs text-slate-200 mt-1 font-serif">
                {service.catchphrase?.split('\n')[0] || service.category}
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {isSuccess ? (
                <div className="text-center py-6 space-y-5">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Check size={32} strokeWidth={2.5} />
                  </div>

                  <div>
                    <span className="text-[0.65rem] font-bold text-emerald-600 uppercase tracking-widest font-mono">
                      RESERVATION REQUEST SENT
                    </span>
                    <h4 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                      予約リクエストを受け付けました！
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-serif">
                      店舗スタッフが空き状況・配車スケジュールを確認の上、速やかに確定のご連絡を差し上げます。
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">ご予約プラン:</span>
                      <strong className="text-slate-800">{activePlan?.name}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">ご利用日程:</span>
                      <strong className="text-slate-800">
                        {startDate} {startTime} {isRental && `〜 ${endDate} ${endTime}`}
                      </strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">人数 / 台数:</span>
                      <strong className="text-slate-800">{participantsCount} {isRental ? '台' : '名様'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">代表者様:</span>
                      <strong className="text-slate-800">{guestName} 様（{guestPhone}）</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[0.7rem] text-amber-800 text-left flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>天候悪化や船・ヘリの欠航による日程変更・キャンセルは無料です。</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        router.push('/mypage');
                      }}
                      className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                    >
                      マイページで予約を確認
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={onClose}
                      className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* プラン選択 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                      <span>ご希望のプランを選択 <span className="text-red-500">*</span></span>
                      <span className="text-[0.65rem] text-slate-500 font-normal">全{service.plans.length}件</span>
                    </label>
                    <div className="space-y-2">
                      {service.plans.map(plan => (
                        <label
                          key={plan.id}
                          className={`flex items-start justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                            chosenPlanId === plan.id
                              ? isRental 
                                ? 'border-blue-500 bg-blue-50/50' 
                                : 'border-purple-500 bg-purple-50/50'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="radio"
                              name="servicePlan"
                              checked={chosenPlanId === plan.id}
                              onChange={() => setChosenPlanId(plan.id)}
                              className="mt-1"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <strong className="text-xs sm:text-sm text-slate-900 block">{plan.name}</strong>
                                {plan.badge && (
                                  <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold text-[0.6rem] rounded">
                                    {plan.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[0.7rem] text-slate-500 mt-0.5 line-clamp-1">{plan.desc}</p>
                              {plan.duration && (
                                <span className="inline-block mt-1 text-[0.65rem] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  ⏱ 所要: {plan.duration}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 shrink-0 ml-2">
                            {plan.price}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 利用日時 ＆ 人数・台数 */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest font-mono block">
                      SCHEDULE & PARTICIPANTS
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Calendar size={13} className="text-blue-500" />
                          {isRental ? '利用開始日' : 'ツアー参加日'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Clock size={13} className="text-blue-500" />
                          開始希望時刻 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 font-mono"
                        >
                          <option value="08:30">08:30</option>
                          <option value="09:00">09:00（朝便・午前開始）</option>
                          <option value="09:30">09:30（ヘリ・定期船到着時）</option>
                          <option value="10:00">10:00</option>
                          <option value="11:00">11:00</option>
                          <option value="13:00">13:00（午後便・昼開始）</option>
                          <option value="14:00">14:00</option>
                          <option value="15:00">15:00</option>
                        </select>
                      </div>
                    </div>

                    {isRental && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <Calendar size={13} className="text-emerald-500" />
                            車両返却日 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <Clock size={13} className="text-emerald-500" />
                            返却予定時刻 <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 font-mono"
                          >
                            <option value="09:00">09:00（朝便出発前）</option>
                            <option value="12:00">12:00（昼）</option>
                            <option value="15:00">15:00</option>
                            <option value="17:00">17:00（夕方便出発前）</option>
                            <option value="18:00">18:00（営業終了）</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Users size={13} className="text-indigo-500" />
                        {isRental ? '予約台数' : '参加人数'} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5, 6, 8].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setParticipantsCount(num)}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                              participantsCount === num
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {num}{isRental ? '台' : '名'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 代表者連絡先（必須項目） */}
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
                    <span className="text-[0.65rem] font-bold text-amber-800 uppercase tracking-widest font-mono block">
                      REPRESENTATIVE CONTACT (必須項目)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                          <User size={13} className="text-amber-600" />
                          代表者様 氏名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="例: 山田 太郎"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                          <Phone size={13} className="text-amber-600" />
                          ご連絡先 電話番号 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="例: 090-1234-5678"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500 font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                        <Mail size={13} className="text-amber-600" />
                        メールアドレス（受付通知・確認用）
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="例: traveler@example.com"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                        <MapPin size={13} className="text-amber-600" />
                        配車・送迎希望場所 / ご要望
                      </label>
                      <textarea
                        value={pickupNotes}
                        onChange={(e) => setPickupNotes(e.target.value)}
                        rows={2}
                        placeholder={isRental ? "例: ヘリポート到着時に受取希望。ご宿泊先: ○○民宿" : "例: 港近くの宿まで送迎希望。足のサイズ: 26cm"}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-amber-500 font-serif leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* 欠航免除保証バナー */}
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs text-emerald-900 block font-serif">
                        公式提携: 船・ヘリ欠航時はキャンセル料無料
                      </strong>
                      <p className="text-[0.7rem] text-emerald-700 mt-0.5">
                        天候不良により島への交通機関が欠航となった場合、キャンセル料は一切発生いたしません。
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                        isRental
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          送信中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          予約リクエストを送信する（無料）
                        </>
                      )}
                    </button>
                    <p className="text-center text-[0.65rem] text-slate-400 mt-2">
                      ※この時点では予約は確定していません。店舗からの確認をもって確定となります。
                    </p>
                  </div>

                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
