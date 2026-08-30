'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Image as ImageIcon, MapPin, CheckCircle, Info } from 'lucide-react';

export default function BizPortalFacility() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [accId, setAccId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    price_range: '',
    has_pickup: false,
    booking_mode: 'request_based',
    deposit_policy: '',
    enable_pre_checkin: true, // MVPモック用
    // 写真は本来アップローダーを実装しますが、MVPモックとしてテキストURL入力
    photo_exterior: '',
    photo_room: '',
    photo_food: '',
    photo_facility: ''
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: acc } = await supabase
        .from('accommodations')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)
        .single();
      
      if (acc) {
        setAccId(acc.id);
        setFormData({
          description: acc.description || '',
          price_range: acc.price_range || '',
          has_pickup: acc.has_pickup || false,
          booking_mode: acc.booking_mode || 'request_based',
          deposit_policy: acc.deposit_policy || '',
          enable_pre_checkin: acc.enable_pre_checkin || false,
          photo_exterior: acc.photo_exterior?.[0] || '',
          photo_room: acc.photo_room?.[0] || '',
          photo_food: acc.photo_food?.[0] || '',
          photo_facility: acc.photo_facility?.[0] || ''
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

    const updateData = {
      description: formData.description,
      price_range: formData.price_range,
      has_pickup: formData.has_pickup,
      booking_mode: formData.booking_mode,
      deposit_policy: formData.deposit_policy,
      photo_exterior: formData.photo_exterior ? [formData.photo_exterior] : [],
      photo_room: formData.photo_room ? [formData.photo_room] : [],
      photo_food: formData.photo_food ? [formData.photo_food] : [],
      photo_facility: formData.photo_facility ? [formData.photo_facility] : []
    };

    const { error } = await supabase.from('accommodations').update(updateData).eq('id', accId);
    
    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert('エラーが発生しました: ' + error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  if (!accId) {
    return <div className="p-4 bg-white rounded-xl shadow-sm text-center">宿泊施設が紐付けられていません。</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 font-serif">施設情報・写真編集</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-6 rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存する
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg flex items-center gap-2 text-sm font-bold border border-emerald-200">
          <CheckCircle className="w-4 h-4" /> 変更を保存しました！ユーザー画面に即時反映されます。
        </div>
      )}

      {/* 予約設定 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">予約・受付設定</h3>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">予約受付モード</label>
          <div className="flex flex-col md:flex-row gap-3">
            <label className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.booking_mode === 'request_based' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <input type="radio" name="booking_mode" value="request_based" checked={formData.booking_mode === 'request_based'} onChange={handleChange} className="mt-1" />
              <div>
                <strong className="block text-slate-900">リクエスト承認制 (おすすめ)</strong>
                <p className="text-xs text-slate-500 mt-1">ゲストからの予約依頼を受け取り、空室状況を確認してから手動で承認します。</p>
              </div>
            </label>
            <label className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.booking_mode === 'instant_booking' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <input type="radio" name="booking_mode" value="instant_booking" checked={formData.booking_mode === 'instant_booking'} onChange={handleChange} className="mt-1" />
              <div>
                <strong className="block text-slate-900">リアルタイム自動完了 (即時確定)</strong>
                <p className="text-xs text-slate-500 mt-1">予約が入った瞬間に自動で確定します。在庫の一元管理ができている場合のみ推奨。</p>
              </div>
            </label>
          </div>
        </div>

        {/* 事前チェックイン機能 */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <strong className="block text-sm text-slate-700">スマート事前チェックイン (KIRATABI Check-in)</strong>
              <p className="text-xs text-slate-500 mt-1">予約確定時、ゲストに自動で宿帳入力フォームのURLを送信します。</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="enable_pre_checkin" checked={formData.enable_pre_checkin} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>
        
        {/* iCalカレンダー連携 */}
        <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl">
          <strong className="block text-sm text-slate-700 mb-2">外部カレンダー同期 (iCalエクスポート)</strong>
          <p className="text-xs text-slate-500 mb-3">楽天トラベルやBooking.com等のサイトコントローラーに以下のURLを登録することで、KIRATABIの予約状況を自動同期しダブルブッキングを防ぎます。</p>
          <div className="flex items-center gap-2">
            <input type="text" readOnly value={`https://kiratabi.com/api/ical/${accId || 'xxx'}/calendar.ics`} className="flex-1 p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-500 font-mono" />
            <button className="px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700">コピー</button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-700 mb-1">予約金（デポジット）に関するポリシー</label>
          <textarea
            name="deposit_policy"
            value={formData.deposit_policy}
            onChange={handleChange}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm"
            placeholder="例: ハイシーズンのみ、予約確定後1週間以内に予約金30%のお振込をお願いしています。"
            rows={2}
          />
        </div>
      </div>

      {/* 写真管理 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-slate-400" />
          カテゴリ別 写真管理
        </h3>
        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex gap-2 mb-4">
          <Info className="w-4 h-4 shrink-0" />
          ※本来はここにSupabase Storageのドラッグ＆ドロップアップローダーが実装されますが、MVPのため画像URLの直接入力フォームとなっています。
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">1. 外観 (Exterior)</label>
            <input type="text" name="photo_exterior" value={formData.photo_exterior} onChange={handleChange} className="w-full p-2 text-sm border rounded-lg" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">2. 部屋 (Room)</label>
            <input type="text" name="photo_room" value={formData.photo_room} onChange={handleChange} className="w-full p-2 text-sm border rounded-lg" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">3. 食事 (Food)</label>
            <input type="text" name="photo_food" value={formData.photo_food} onChange={handleChange} className="w-full p-2 text-sm border rounded-lg" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">4. 設備・風呂など (Facility)</label>
            <input type="text" name="photo_facility" value={formData.photo_facility} onChange={handleChange} className="w-full p-2 text-sm border rounded-lg" placeholder="https://..." />
          </div>
        </div>
      </div>

      {/* 基本情報 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">基本アピール情報</h3>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">宿の紹介文・魅力</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm h-32"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">料金目安</label>
            <input
              type="text"
              name="price_range"
              value={formData.price_range}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm"
              placeholder="例: 1泊2食付き 11,000円〜"
            />
          </div>
          
          <div className="flex items-center mt-6">
            <label className="flex items-center gap-3 cursor-pointer p-2 border rounded-xl w-full hover:bg-slate-50">
              <input
                type="checkbox"
                name="has_pickup"
                checked={formData.has_pickup}
                onChange={handleChange}
                className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
              />
              <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-blue-500" /> 港・空港への送迎あり
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
