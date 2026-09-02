'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, CheckCircle2, User, MapPin, Briefcase, CalendarClock, Plane, 
  ShieldCheck, ArrowLeft, BedDouble, Info, Check
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckinPage() {
  const params = useParams();
  const router = useRouter();
  const resId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reservation, setReservation] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    occupation: '',
    age: '',
    previous_location: '',
    next_location: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (resId) {
      loadData();
    }
  }, [resId]);

  async function loadData() {
    setLoading(true);

    // 1. 予約が存在するか確認
    const { data: res, error: resError } = await supabase
      .from('reservations')
      .select('*, accommodations(name, address)')
      .eq('id', resId)
      .single();

    if (resError || !res) {
      setLoading(false);
      return;
    }
    setReservation(res);

    // 2. 既に台帳が登録されているか確認
    const { data: existingLedger } = await supabase
      .from('guest_ledgers')
      .select('id')
      .eq('reservation_id', resId)
      .single();

    if (existingLedger) {
      setIsCompleted(true);
      setLoading(false);
      return;
    }

    // 3. ログインしている場合、プロフィール情報をオートフィル
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('user_profiles').select('nickname').eq('id', user.id).single();
      if (profile && profile.nickname) {
        setFormData(prev => ({ 
          ...prev, 
          name: profile.nickname,
          next_location: res.accommodations?.name || ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        next_location: res.accommodations?.name || ''
      }));
    }

    setLoading(false);
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '氏名を入力してください';
    if (!formData.address.trim()) newErrors.address = 'ご住所を入力してください';
    if (!formData.occupation.trim()) newErrors.occupation = 'ご職業を入力してください';
    if (!formData.age || isNaN(Number(formData.age))) newErrors.age = '年齢を正しく入力してください';
    if (!formData.previous_location.trim()) newErrors.previous_location = '前泊地（前日の宿泊地）を入力してください';
    if (!formData.next_location.trim()) newErrors.next_location = '次泊地（本日の宿泊地）を入力してください';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    // ログイン中のユーザー情報を取得
    const { data: { user } } = await supabase.auth.getUser();

    const insertData = {
      reservation_id: resId,
      accommodation_id: reservation.accommodation_id,
      guest_id: user?.id || null,
      name: formData.name,
      address: formData.address,
      occupation: formData.occupation,
      age: parseInt(formData.age),
      previous_location: formData.previous_location,
      next_location: formData.next_location
    };

    const { error } = await supabase.from('guest_ledgers').insert(insertData);

    if (error) {
      alert('登録に失敗しました: ' + error.message);
      setSubmitting(false);
    } else {
      setIsCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Digital Ledger...</span>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">該当の予約が見つかりません</h2>
          <p className="text-xs text-slate-500">URLが正しいかご確認ください。</p>
          <Link href="/" className="inline-block px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors">
            トップページへ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[0.65rem] font-bold tracking-wider uppercase inline-block">
              CHECK-IN COMPLETED
            </span>
            <h1 className="text-2xl font-serif font-bold text-slate-900">
              宿泊台帳の事前登録が完了しました
            </h1>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              ご入力いただいた情報は <strong className="text-slate-900">{reservation.accommodations?.name}</strong> へ安全に連携されました。当日はスムーズにチェックインいただけます。
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">宿泊施設</span>
              <span className="text-slate-800 font-bold">{reservation.accommodations?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">日程</span>
              <span className="text-slate-800 font-mono">
                {new Date(reservation.check_in_date).toLocaleDateString('ja-JP')} 〜 {new Date(reservation.check_out_date).toLocaleDateString('ja-JP')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">ご宿泊代表者</span>
              <span className="text-slate-800 font-bold">{formData.name || '登録済み'}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link 
              href="/mypage" 
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors text-center"
            >
              マイページで予約を確認
            </Link>
            <Link 
              href="/" 
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors text-center"
            >
              トップへ戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 font-sans text-slate-800">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[0.65rem] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            旅館業法準拠 スマート宿帳
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            オンライン宿泊台帳の登録
          </h1>
          <p className="text-xs text-slate-500 font-serif">
            {reservation.accommodations?.name} へのご宿泊にあたり、法令に基づく宿泊者情報をご入力ください。
          </p>
        </div>

        {/* Accommodation Info Strip */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">宿泊先</p>
              <h3 className="font-serif font-bold text-sm text-slate-900">{reservation.accommodations?.name}</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[0.65rem] text-slate-400 block font-mono">宿泊人数</span>
            <span className="font-bold text-xs text-slate-800">{reservation.guest_count} 名様</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8 space-y-5">
            
            {/* 氏名 */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  宿泊代表者 氏名
                </span>
                <span className="text-[0.6rem] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">必須</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className={`w-full p-3 text-xs md:text-sm rounded-xl border ${errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50 focus:bg-white'} outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all`}
                placeholder="例: 海島 太郎"
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* 年齢 */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
                  年齢
                </span>
                <span className="text-[0.6rem] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">必須</span>
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                className={`w-full p-3 text-xs md:text-sm rounded-xl border ${errors.age ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50 focus:bg-white'} outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono`}
                placeholder="例: 32"
              />
              {errors.age && <p className="text-xs text-rose-500 mt-1">{errors.age}</p>}
            </div>

            {/* ご住所 */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  ご住所（都道府県・市区町村・番地）
                </span>
                <span className="text-[0.6rem] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">必須</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className={`w-full p-3 text-xs md:text-sm rounded-xl border ${errors.address ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50 focus:bg-white'} outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all`}
                placeholder="例: 東京都港区六本木1-2-3"
              />
              {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
            </div>

            {/* ご職業 */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  ご職業
                </span>
                <span className="text-[0.6rem] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">必須</span>
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={e => setFormData({...formData, occupation: e.target.value})}
                className={`w-full p-3 text-xs md:text-sm rounded-xl border ${errors.occupation ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50 focus:bg-white'} outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all`}
                placeholder="例: 会社員 / 自営業 / 公務員 など"
              />
              {errors.occupation && <p className="text-xs text-rose-500 mt-1">{errors.occupation}</p>}
            </div>

            {/* 前泊地 & 次泊地 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-slate-400" />
                    前泊地（昨日の宿泊地）
                  </span>
                  <span className="text-[0.6rem] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">必須</span>
                </label>
                <input
                  type="text"
                  value={formData.previous_location}
                  onChange={e => setFormData({...formData, previous_location: e.target.value})}
                  className={`w-full p-3 text-xs md:text-sm rounded-xl border ${errors.previous_location ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50 focus:bg-white'} outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all`}
                  placeholder="例: 自宅、〇〇ホテル"
                />
                {errors.previous_location && <p className="text-xs text-rose-500 mt-1">{errors.previous_location}</p>}
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-slate-400" style={{ transform: 'scaleX(-1)' }} />
                    次泊地（本日の宿泊地）
                  </span>
                  <span className="text-[0.6rem] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">必須</span>
                </label>
                <input
                  type="text"
                  value={formData.next_location}
                  onChange={e => setFormData({...formData, next_location: e.target.value})}
                  className={`w-full p-3 text-xs md:text-sm rounded-xl border ${errors.next_location ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50 focus:bg-white'} outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all`}
                  placeholder={`例: ${reservation.accommodations?.name}`}
                />
                {errors.next_location && <p className="text-xs text-rose-500 mt-1">{errors.next_location}</p>}
              </div>
            </div>

          </div>

          {/* Submit Action */}
          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-200 space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              台帳を登録して事前チェックインを完了する
            </button>
            <p className="text-[0.7rem] text-slate-400 text-center leading-relaxed">
              🔒 入力情報は暗号化され、旅館業法第6条に基づく宿泊者名簿の記録・保管目的にのみ使用されます。
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}

