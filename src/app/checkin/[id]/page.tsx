import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, User, MapPin, Briefcase, CalendarClock, Plane } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

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
      .select('*, accommodations(name)')
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
        setFormData(prev => ({ ...prev, name: profile.nickname }));
      }
    }

    setLoading(false);
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '氏名は必須です';
    if (!formData.address.trim()) newErrors.address = '住所は必須です';
    if (!formData.occupation.trim()) newErrors.occupation = '職業は必須です';
    if (!formData.age || isNaN(Number(formData.age))) newErrors.age = '年齢を正しく入力してください';
    if (!formData.previous_location.trim()) newErrors.previous_location = '前泊地（昨日の宿泊地）は必須です';
    if (!formData.next_location.trim()) newErrors.next_location = '次泊地（本日の宿泊地）は必須です';
    
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
      // MVP: 本来はここでWebhookなどを経由してメールを送信する
      console.log('【KIRATABIシステム】送信完了メールをゲストへ自動送信しました (MVP挙動)');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
          <p className="text-slate-500">該当の予約が見つかりません。</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">チェックイン情報の登録が完了しました</h1>
          <p className="text-slate-500 mb-6 leading-relaxed">
            ご入力いただいた内容は {reservation.accommodations?.name} へ安全に送信されました。<br/>
            ご登録のメールアドレスに控えを送信しました（※デモ）。
          </p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
            トップページへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-serif mb-2">オンライン宿泊台帳（事前チェックイン）</h1>
          <p className="text-slate-500 text-sm">
            {reservation.accommodations?.name} へのご宿泊にあたり、旅館業法に基づく宿泊者情報の登録をお願いいたします。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            
            {/* 氏名 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <User className="w-4 h-4 text-amber-500" />
                氏名 <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-center">必須</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className={`w-full p-3 rounded-xl border ${errors.name ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-200'} focus:outline-none focus:ring-2`}
                placeholder="例: 海島 太郎"
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* 年齢 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <CalendarClock className="w-4 h-4 text-amber-500" />
                年齢 <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-center">必須</span>
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                className={`w-full p-3 rounded-xl border ${errors.age ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-200'} focus:outline-none focus:ring-2`}
                placeholder="例: 30"
              />
              {errors.age && <p className="text-xs text-rose-500 mt-1">{errors.age}</p>}
            </div>

            {/* 住所 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                ご住所 <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-center">必須</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className={`w-full p-3 rounded-xl border ${errors.address ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-200'} focus:outline-none focus:ring-2`}
                placeholder="例: 東京都港区..."
              />
              {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
            </div>

            {/* 職業 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                ご職業 <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-center">必須</span>
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={e => setFormData({...formData, occupation: e.target.value})}
                className={`w-full p-3 rounded-xl border ${errors.occupation ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-200'} focus:outline-none focus:ring-2`}
                placeholder="例: 会社員"
              />
              {errors.occupation && <p className="text-xs text-rose-500 mt-1">{errors.occupation}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* 前泊地 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <Plane className="w-4 h-4 text-slate-400" />
                  前泊地（前日の宿泊場所） <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-center">必須</span>
                </label>
                <input
                  type="text"
                  value={formData.previous_location}
                  onChange={e => setFormData({...formData, previous_location: e.target.value})}
                  className={`w-full p-3 rounded-xl border ${errors.previous_location ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-200'} focus:outline-none focus:ring-2`}
                  placeholder="例: 自宅、または 〇〇ホテル"
                />
                {errors.previous_location && <p className="text-xs text-rose-500 mt-1">{errors.previous_location}</p>}
              </div>

              {/* 次泊地 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <Plane className="w-4 h-4 text-slate-400" style={{ transform: 'scaleX(-1)' }} />
                  次泊地（本日の宿泊場所） <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-center">必須</span>
                </label>
                <input
                  type="text"
                  value={formData.next_location}
                  onChange={e => setFormData({...formData, next_location: e.target.value})}
                  className={`w-full p-3 rounded-xl border ${errors.next_location ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-200'} focus:outline-none focus:ring-2`}
                  placeholder={`例: ${reservation.accommodations?.name}`}
                />
                {errors.next_location && <p className="text-xs text-rose-500 mt-1">{errors.next_location}</p>}
              </div>
            </div>

          </div>

          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-200">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              上記の内容で送信する
            </button>
            <p className="text-xs text-slate-500 text-center mt-4">
              ご入力いただいた情報は、宿泊施設の台帳管理および法令順守の目的のみに使用されます。
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
