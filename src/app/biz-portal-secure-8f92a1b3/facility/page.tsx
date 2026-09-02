'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, Save, Image as ImageIcon, MapPin, CheckCircle, Info, 
  ExternalLink, Sparkles, BedDouble, ShieldCheck, Plus, Trash2, Eye
} from 'lucide-react';
import Link from 'next/link';

export default function BizPortalFacility() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [accId, setAccId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    catchphrase: '',
    description: '',
    price_range: '',
    has_pickup: false,
    booking_mode: 'request_based',
    deposit_policy: '',
    enable_pre_checkin: true,
    photo_exterior: '',
    photo_room: '',
    photo_food: '',
    photo_facility: '',
    features_text: '',
    plans_json: ''
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: acc } = await supabase
        .from('accommodations')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)
        .single();
      
      if (acc) {
        setAccId(acc.id);
        setFormData({
          name: acc.name || '',
          catchphrase: acc.catchphrase || '',
          description: acc.description || '',
          price_range: acc.price_range || '',
          has_pickup: acc.has_pickup || false,
          booking_mode: acc.booking_mode || 'request_based',
          deposit_policy: acc.deposit_policy || '',
          enable_pre_checkin: acc.enable_pre_checkin ?? true,
          photo_exterior: acc.photo_exterior?.[0] || acc.photo_urls?.[0] || '',
          photo_room: acc.photo_room?.[0] || acc.photo_urls?.[1] || '',
          photo_food: acc.photo_food?.[0] || acc.photo_urls?.[2] || '',
          photo_facility: acc.photo_facility?.[0] || acc.photo_urls?.[3] || '',
          features_text: (acc.features || []).join('\n'),
          plans_json: JSON.stringify(acc.plans || [
            { name: '1泊3食付き（朝・夕・名物お弁当付き）', price: '¥11,000〜 / 人', desc: '手作りの温かい島料理と名物お弁当がセットになったプラン。', badge: '1番人気' },
            { name: '素泊まり・ビジネス利用プラン', price: '¥7,500〜 / 人', desc: '自由なスケジュールで過ごしたい方向け。', badge: '自由旅' }
          ], null, 2)
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async () => {
    if (!accId) return;
    setSaving(true);
    setSuccess(false);

    let parsedPlans = [];
    try {
      if (formData.plans_json.trim()) {
        parsedPlans = JSON.parse(formData.plans_json);
      }
    } catch {
      alert('宿泊プランのJSON形式が不正です。');
      setSaving(false);
      return;
    }

    const featuresArray = formData.features_text
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const updateData: any = {
      description: formData.description,
      price_range: formData.price_range,
      has_pickup: formData.has_pickup,
      booking_mode: formData.booking_mode,
      deposit_policy: formData.deposit_policy,
      enable_pre_checkin: formData.enable_pre_checkin,
      photo_exterior: formData.photo_exterior ? [formData.photo_exterior] : [],
      photo_room: formData.photo_room ? [formData.photo_room] : [],
      photo_food: formData.photo_food ? [formData.photo_food] : [],
      photo_facility: formData.photo_facility ? [formData.photo_facility] : [],
      photo_urls: [
        formData.photo_exterior,
        formData.photo_room,
        formData.photo_food,
        formData.photo_facility
      ].filter(Boolean)
    };

    if (formData.name) updateData.name = formData.name;
    if (formData.catchphrase) updateData.catchphrase = formData.catchphrase;
    if (featuresArray.length > 0) updateData.features = featuresArray;
    if (parsedPlans.length > 0) updateData.plans = parsedPlans;

    const { error } = await supabase.from('accommodations').update(updateData).eq('id', accId);
    
    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } else {
      alert('エラーが発生しました: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Facility Data...</span>
      </div>
    );
  }

  if (!accId) {
    return (
      <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
          <BedDouble className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800">宿泊施設が紐付けられていません</h3>
        <p className="text-xs text-slate-500">アカウントに紐付く宿情報を確認してください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[0.65rem] font-bold tracking-widest text-amber-600 uppercase block mb-1">
            FACILITY PROFILE EDITOR
          </span>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <BedDouble className="w-7 h-7 text-amber-500" />
            施設情報 ＆ 写真・プラン編集
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {accId && (
            <Link
              href={`/stay/${accId}`}
              target="_blank"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              <span>公開LPを見る</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            変更を保存する
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl flex items-center gap-2.5 text-sm font-bold border border-emerald-200 shadow-sm animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>変更を保存しました！「公開LPを見る」から実際のページで即時確認できます。</span>
        </div>
      )}

      {/* 1. 基本アピール情報 */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          宿の基本情報 ＆ キャッチコピー
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">宿名 (施設名称)</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例: 青ヶ島 アイランドロッジ"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">料金目安（表示用）</label>
            <input
              type="text"
              name="price_range"
              value={formData.price_range}
              onChange={handleChange}
              placeholder="例: ¥11,000〜 / 1泊3食"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm outline-none transition-all font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">魅力キャッチコピー (1行アピール)</label>
          <input
            type="text"
            name="catchphrase"
            value={formData.catchphrase}
            onChange={handleChange}
            placeholder="例: 絶海の孤島・青ヶ島で味わう、島魚会席と温もりのおもてなし。"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">宿の紹介文・おもてなしの想い</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="青ヶ島集落の中心に位置し、港やヘリポートへの送迎も完備..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm outline-none transition-all font-serif leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            宿のこだわり・選ばれる理由（改行区切りで入力）
          </label>
          <textarea
            name="features_text"
            value={formData.features_text}
            onChange={handleChange}
            rows={3}
            placeholder="ヘリポート・港からの往復無料送迎付き&#10;自家製青酎と獲れたて地魚の島料理夕食 ＋ 島散策用お弁当付き&#10;全室コンセント多数・高速Wi-Fi完備"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-xs md:text-sm outline-none transition-all font-mono leading-relaxed"
          />
        </div>
      </div>

      {/* 2. 写真管理 */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-blue-500" />
          カテゴリ別 施設写真ギャラリー（画像URL）
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">1. 外観写真 (Exterior)</label>
            <input 
              type="text" 
              name="photo_exterior" 
              value={formData.photo_exterior} 
              onChange={handleChange} 
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-blue-500 font-mono" 
              placeholder="https://images.unsplash.com/..." 
            />
            {formData.photo_exterior && (
              <div className="h-32 rounded-xl overflow-hidden border border-slate-200">
                <img src={formData.photo_exterior} alt="外観プレビュー" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">2. 客室写真 (Room)</label>
            <input 
              type="text" 
              name="photo_room" 
              value={formData.photo_room} 
              onChange={handleChange} 
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-blue-500 font-mono" 
              placeholder="https://images.unsplash.com/..." 
            />
            {formData.photo_room && (
              <div className="h-32 rounded-xl overflow-hidden border border-slate-200">
                <img src={formData.photo_room} alt="客室プレビュー" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">3. お料理写真 (Food)</label>
            <input 
              type="text" 
              name="photo_food" 
              value={formData.photo_food} 
              onChange={handleChange} 
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-blue-500 font-mono" 
              placeholder="https://images.unsplash.com/..." 
            />
            {formData.photo_food && (
              <div className="h-32 rounded-xl overflow-hidden border border-slate-200">
                <img src={formData.photo_food} alt="料理プレビュー" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">4. 設備・風呂写真 (Facility)</label>
            <input 
              type="text" 
              name="photo_facility" 
              value={formData.photo_facility} 
              onChange={handleChange} 
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-blue-500 font-mono" 
              placeholder="https://images.unsplash.com/..." 
            />
            {formData.photo_facility && (
              <div className="h-32 rounded-xl overflow-hidden border border-slate-200">
                <img src={formData.photo_facility} alt="設備プレビュー" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. 予約・受付設定 */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          予約受付 ＆ 送迎・チェックイン設定
        </h3>
        
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">予約受付モード</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.booking_mode === 'request_based' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <input type="radio" name="booking_mode" value="request_based" checked={formData.booking_mode === 'request_based'} onChange={handleChange} className="mt-1" />
              <div>
                <strong className="block text-slate-900 text-sm">リクエスト承認制 (推奨)</strong>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">ゲストからのWeb予約依頼を受け取り、空室状況を確認してから手動で承認します。</p>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.booking_mode === 'instant_booking' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <input type="radio" name="booking_mode" value="instant_booking" checked={formData.booking_mode === 'instant_booking'} onChange={handleChange} className="mt-1" />
              <div>
                <strong className="block text-slate-900 text-sm">リアルタイム即時確定</strong>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">予約リクエストが入った瞬間に自動で確定します。</p>
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <label className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              name="has_pickup"
              checked={formData.has_pickup}
              onChange={handleChange}
              className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
            />
            <span className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-500" /> 港・ヘリポートへの往復送迎あり
            </span>
          </label>

          <label className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              name="enable_pre_checkin"
              checked={formData.enable_pre_checkin}
              onChange={handleChange}
              className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
            />
            <span className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> オンライン事前チェックイン機能（宿帳）を利用
            </span>
          </label>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">予約金（デポジット）やキャンセルポリシー</label>
          <textarea
            name="deposit_policy"
            value={formData.deposit_policy}
            onChange={handleChange}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 text-xs md:text-sm outline-none font-serif leading-relaxed"
            placeholder="例: 天候不良による船・ヘリの欠航時はキャンセル料は一切いただきません。"
            rows={2}
          />
        </div>
      </div>

    </div>
  );
}

