'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, Save, Image as ImageIcon, MapPin, CheckCircle, Info, 
  ExternalLink, Sparkles, BedDouble, ShieldCheck, Plus, Trash2, Eye,
  MessageCircle, Globe, Mail, Clock, Award, ArrowUp, ArrowDown, Tag
} from 'lucide-react';
import Link from 'next/link';

function InstagramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function TwitterIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

interface PlanItem {
  id: string;
  name: string;
  price: string;
  desc: string;
  badge: string;
  features_text: string;
}

const BADGE_PRESETS = ['1番人気', '定番', 'おすすめ', '連泊お得', '期間限定', '一人旅歓迎', '直前割'];

const DEFAULT_PLANS: PlanItem[] = [
  {
    id: 'plan-1',
    name: '【1泊3食付】名物地魚・島料理＆島散策お弁当付き 青ヶ島満喫スタンダードプラン',
    price: '¥11,500〜 / 人',
    desc: '港・ヘリポート送迎付き。旬の島魚会席と特製お弁当で絶海の孤島を心ゆくまで満喫。',
    badge: '1番人気',
    features_text: '朝夕食付き\nお弁当付き\n送迎無料\nWi-Fi完備'
  },
  {
    id: 'plan-2',
    name: '【1泊2食付】島魚と自家製青酎晩酌プラン',
    price: '¥9,800〜 / 人',
    desc: '日中はご自身で巡り、夜は宿自慢の島料理と青酎で語り合うゆったりステイ。',
    badge: '定番',
    features_text: '朝夕食付き\n送迎無料\n個室確約'
  },
  {
    id: 'plan-3',
    name: '【素泊まり】ビジネス・ワーケーション＆自由旅プラン',
    price: '¥7,500〜 / 人',
    desc: 'お仕事や自由なスケジュールで過ごしたい方向け。全室デスク＆高速Wi-Fi完備。',
    badge: '自由旅',
    features_text: '素泊まり\n高速Wi-Fi\nデスク完備'
  }
];

export default function BizPortalFacility() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [accId, setAccId] = useState<string | null>(null);
  const [catchphrases, setCatchphrases] = useState<string[]>([
    '絶海の孤島・青ヶ島で味わう、島魚会席と温もりのおもてなし。',
    '港・ヘリポート往復送迎無料 ＆ 自家製青酎と獲れたて地魚の晩酌。',
    '満天の星空と二重カルデラの絶景に抱かれる、静寂のオアシス。'
  ]);
  const [plans, setPlans] = useState<PlanItem[]>(DEFAULT_PLANS);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_range: '',
    phone: '',
    email: '',
    line_url: '',
    instagram_url: '',
    instagram_account: '',
    twitter_url: '',
    website_url: '',
    check_in_time: '15:00 〜 19:00',
    check_out_time: '10:00',
    same_day_cutoff: '当日受付: 12:00まで',
    enable_certificate: true,
    certificate_message: '離島へのご来島ならびに当館へのご宿泊、誠にありがとうございました。この証明書はあなたが本島に滞在された公式な証です。',
    has_pickup: true,
    booking_mode: 'request_based',
    deposit_policy: '',
    enable_pre_checkin: true,
    photo_exterior: '',
    photo_room: '',
    photo_food: '',
    photo_facility: '',
    features_text: ''
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      let targetAcc: any = null;

      if (user) {
        const { data: acc } = await supabase
          .from('accommodations')
          .select('*')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle();
        targetAcc = acc;
      }

      // フォールバック: メイン宿泊施設を取得
      if (!targetAcc) {
        const { data: fallbackAccs } = await supabase
          .from('accommodations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        if (fallbackAccs && fallbackAccs.length > 0) {
          targetAcc = fallbackAccs[0];
          if (user && !targetAcc.owner_id) {
            await supabase.from('accommodations').update({ owner_id: user.id }).eq('id', targetAcc.id);
          }
        }
      }
      
      if (targetAcc) {
        setAccId(targetAcc.id);

        // キャッチコピーのパース
        let parsedCatchphrases: string[] = [];
        if (targetAcc.catchphrase) {
          parsedCatchphrases = targetAcc.catchphrase
            .split('\n')
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
        if (parsedCatchphrases.length === 0) {
          parsedCatchphrases = [
            '絶海の孤島・青ヶ島で味わう、島魚会席と温もりのおもてなし。',
            '港・ヘリポート往復送迎無料 ＆ 自家製青酎と獲れたて地魚の晩酌。',
            '満天の星空と二重カルデラの絶景に抱かれる、静寂のオアシス。'
          ];
        }
        setCatchphrases(parsedCatchphrases.slice(0, 4));

        // プランのパース
        if (targetAcc.plans && Array.isArray(targetAcc.plans) && targetAcc.plans.length > 0) {
          const loadedPlans: PlanItem[] = targetAcc.plans.map((p: any, idx: number) => ({
            id: p.id || `plan-${idx + 1}`,
            name: p.name || `プラン ${idx + 1}`,
            price: p.price || '¥10,000〜 / 人',
            desc: p.desc || '',
            badge: p.badge || '',
            features_text: Array.isArray(p.features) ? p.features.join('\n') : ''
          }));
          setPlans(loadedPlans);
        }

        setFormData({
          name: targetAcc.name || '青ヶ島 アイランドロッジ',
          description: targetAcc.description || '青ヶ島集落の中心に位置し、港やヘリポートへの送迎も完備。島のお母さんが腕を振るう島魚尽くしの夕食と、島散策用の手作りお弁当が旅人に親しまれています。全室エアコン・Wi-Fi完備で快適にお過ごしいただけます。',
          price_range: targetAcc.price_range || '¥11,000〜 / 1泊3食',
          phone: targetAcc.phone_number || targetAcc.phone || '04996-9-0123',
          email: targetAcc.email || 'aogashima-lodge@example.com',
          line_url: targetAcc.line_url || 'https://line.me/R/ti/p/@aogashima_lodge',
          instagram_url: targetAcc.instagram_url || 'https://instagram.com/aogashima_island_lodge',
          instagram_account: targetAcc.instagram_account || '@aogashima_island_lodge',
          twitter_url: targetAcc.twitter_url || 'https://x.com/aogashima_lodge',
          website_url: targetAcc.website_url || 'https://island.kira-tabi.com/stay/aogashimaya',
          check_in_time: targetAcc.check_in_time || '15:00 〜 19:00',
          check_out_time: targetAcc.check_out_time || '10:00',
          same_day_cutoff: targetAcc.same_day_cutoff || '当日受付: 12:00まで',
          enable_certificate: targetAcc.enable_certificate ?? true,
          certificate_message: targetAcc.certificate_message || '離島へのご来島ならびに当館へのご宿泊、誠にありがとうございました。この証明書はあなたが本島に滞在された公式な証です。',
          has_pickup: targetAcc.has_pickup ?? true,
          booking_mode: targetAcc.booking_mode || 'request_based',
          deposit_policy: targetAcc.deposit_policy || '',
          enable_pre_checkin: targetAcc.enable_pre_checkin ?? true,
          photo_exterior: targetAcc.photo_exterior?.[0] || targetAcc.photo_urls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
          photo_room: targetAcc.photo_room?.[0] || targetAcc.photo_urls?.[1] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          photo_food: targetAcc.photo_food?.[0] || targetAcc.photo_urls?.[2] || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
          photo_facility: targetAcc.photo_facility?.[0] || targetAcc.photo_urls?.[3] || 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
          features_text: (targetAcc.features && targetAcc.features.length > 0)
            ? targetAcc.features.join('\n')
            : 'ヘリポート・港からの往復無料送迎付き\n自家製青酎と獲れたて地魚の島料理夕食 ＋ 島散策用お弁当付き\n全室コンセント多数・高速Wi-Fi完備\n島内レンタカー・ガイド手配サポート'
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

  // キャッチコピー操作
  const handleCatchphraseChange = (index: number, val: string) => {
    const updated = [...catchphrases];
    updated[index] = val;
    setCatchphrases(updated);
  };

  const handleAddCatchphrase = () => {
    if (catchphrases.length < 4) {
      setCatchphrases([...catchphrases, '']);
    }
  };

  const handleRemoveCatchphrase = (index: number) => {
    setCatchphrases(catchphrases.filter((_, i) => i !== index));
  };

  // プラン操作
  const handlePlanChange = (index: number, field: keyof PlanItem, val: string) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [field]: val };
    setPlans(updated);
  };

  const handleAddPlan = () => {
    const newPlan: PlanItem = {
      id: `plan-${Date.now()}`,
      name: '新しい宿泊プラン',
      price: '¥10,000〜 / 人',
      desc: 'プランの説明文を入力してください。',
      badge: 'おすすめ',
      features_text: '朝夕食付き\n送迎無料'
    };
    setPlans([...plans, newPlan]);
  };

  const handleRemovePlan = (index: number) => {
    if (plans.length <= 1) {
      alert('最低1つのプランが必要です。');
      return;
    }
    setPlans(plans.filter((_, i) => i !== index));
  };

  const handleMovePlan = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === plans.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...plans];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setPlans(updated);
  };

  const handleSave = async () => {
    if (!accId) return;
    setSaving(true);
    setSuccess(false);

    const formattedCatchphrase = catchphrases.filter(s => s.trim().length > 0).join('\n');

    const formattedPlans = plans.map(p => ({
      id: p.id,
      name: p.name.trim(),
      price: p.price.trim(),
      desc: p.desc.trim(),
      badge: p.badge.trim(),
      features: p.features_text.split('\n').map(f => f.trim()).filter(Boolean)
    }));

    const featuresArray = formData.features_text
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const updateData: any = {
      description: formData.description,
      price_range: formData.price_range,
      phone_number: formData.phone,
      email: formData.email,
      line_url: formData.line_url,
      instagram_url: formData.instagram_url,
      instagram_account: formData.instagram_account,
      twitter_url: formData.twitter_url,
      website_url: formData.website_url,
      check_in_time: formData.check_in_time,
      check_out_time: formData.check_out_time,
      same_day_cutoff: formData.same_day_cutoff,
      enable_certificate: formData.enable_certificate,
      certificate_message: formData.certificate_message,
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
      ].filter(Boolean),
      catchphrase: formattedCatchphrase,
      plans: formattedPlans,
      features: featuresArray
    };

    if (formData.name) updateData.name = formData.name;

    const { error } = await supabase.from('accommodations').update(updateData).eq('id', accId);
    
    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
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
          <span className="text-[0.65rem] font-bold tracking-widest text-amber-600 uppercase block mb-1 font-mono">
            FACILITY PROFILE & LP EDITOR
          </span>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <BedDouble className="w-7 h-7 text-amber-500" />
            施設情報 ＆ 写真・プラン・SNS編集
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

      {/* 1. 基本アピール情報 ＆ 複数キャッチコピー */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          宿の基本情報 ＆ 魅力キャッチコピー
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

        {/* 魅力キャッチコピー（複数行アピール・最大4行） */}
        <div className="space-y-3 p-4 bg-amber-50/40 rounded-2xl border border-amber-200/70">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                魅力キャッチコピー (1行アピール・最大4行まで設定可能)
              </label>
              <span className="text-[0.68rem] text-slate-500">
                雑誌風LPのトップ帯や概要欄にスタイリッシュに掲載されます。
              </span>
            </div>
            {catchphrases.length < 4 && (
              <button
                type="button"
                onClick={handleAddCatchphrase}
                className="px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> 追加
              </button>
            )}
          </div>

          <div className="space-y-2">
            {catchphrases.map((cp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-200/80 text-amber-900 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={cp}
                  onChange={(e) => handleCatchphraseChange(idx, e.target.value)}
                  placeholder={`例: 絶海の孤島・青ヶ島で味わう、島魚会席と温もりのおもてなし。`}
                  className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 text-xs md:text-sm outline-none transition-all"
                />
                {catchphrases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCatchphrase(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
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

      {/* 2. SNS ＆ 連絡先連携 */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <InstagramIcon className="w-4 h-4 text-pink-500" />
          公式SNS ＆ お問い合わせ連絡先
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <InstagramIcon className="w-3.5 h-3.5 text-pink-500" /> Instagram URL
            </label>
            <input
              type="text"
              name="instagram_url"
              value={formData.instagram_url}
              onChange={handleChange}
              placeholder="https://instagram.com/aogashima_island_lodge"
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Instagram アカウント名（表示用）</label>
            <input
              type="text"
              name="instagram_account"
              value={formData.instagram_account}
              onChange={handleChange}
              placeholder="@aogashima_island_lodge"
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-[#06C755]" /> LINE公式アカウント URL
            </label>
            <input
              type="text"
              name="line_url"
              value={formData.line_url}
              onChange={handleChange}
              placeholder="https://line.me/R/ti/p/@your_inn"
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-500" /> お問い合わせ受付用メール
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="info@your-inn.com"
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <TwitterIcon className="w-3.5 h-3.5 text-black" /> 公式 X (Twitter) URL
            </label>
            <input
              type="text"
              name="twitter_url"
              value={formData.twitter_url}
              onChange={handleChange}
              placeholder="https://x.com/your_inn"
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" /> 公式ホームページ URL
            </label>
            <input
              type="text"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
              placeholder="https://your-inn.com"
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. 時刻設定 ＆ 宿泊証明書設定 */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          チェックイン時刻 ＆ デジタル宿泊証明書
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">チェックイン可能時間</label>
            <input
              type="text"
              name="check_in_time"
              value={formData.check_in_time}
              onChange={handleChange}
              placeholder="例: 15:00 〜 19:00"
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">チェックアウト時刻</label>
            <input
              type="text"
              name="check_out_time"
              value={formData.check_out_time}
              onChange={handleChange}
              placeholder="例: 10:00"
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">当日の予約受付締切時刻</label>
            <input
              type="text"
              name="same_day_cutoff"
              value={formData.same_day_cutoff}
              onChange={handleChange}
              placeholder="例: 当日受付: 12:00まで"
              className="w-full p-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white"
            />
          </div>
        </div>

        {/* 宿泊証明書設定 */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="enable_certificate"
              checked={formData.enable_certificate}
              onChange={handleChange}
              className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
            />
            <div>
              <strong className="text-xs md:text-sm text-slate-900 block flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                公式提携宿「デジタル宿泊証明書」の発行を有効にする
              </strong>
              <span className="text-[0.7rem] text-slate-500">
                宿泊完了したゲストがマイページで当館公認のデジタルパスを受け取れるようになります。
              </span>
            </div>
          </label>

          {formData.enable_certificate && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">証明書に記載する宿からのメッセージ</label>
              <textarea
                name="certificate_message"
                value={formData.certificate_message}
                onChange={handleChange}
                rows={2}
                placeholder="離島へのご来島ならびに当館へのご宿泊、誠にありがとうございました。"
                className="w-full p-2.5 text-xs bg-white border border-amber-200 rounded-xl outline-none font-serif leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. 写真管理 */}
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

      {/* 5. 直感的なGUI宿泊プラン管理 (JSONエディタを完全撤廃) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-indigo-500" />
              宿泊プラン管理（直感GUIエディター）
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              プラン名や料金、含まれるサービスをカード形式で直感的に登録できます。（全{plans.length}件登録中）
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddPlan}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            新しい宿泊プランを追加
          </button>
        </div>

        {/* Plan Cards List */}
        <div className="space-y-4">
          {plans.map((plan, idx) => (
            <div 
              key={plan.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-sm space-y-4 relative group hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
                    PLAN #{idx + 1}
                  </span>
                  {plan.badge && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[0.65rem] shadow-xs">
                      ★ {plan.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMovePlan(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                    title="上へ並び替え"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMovePlan(idx, 'down')}
                    disabled={idx === plans.length - 1}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                    title="下へ並び替え"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePlan(idx)}
                    className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors ml-1"
                    title="プラン削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[0.7rem] font-bold text-slate-700 mb-1">
                    プラン名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => handlePlanChange(idx, 'name', e.target.value)}
                    placeholder="例: 【1泊3食付】名物地魚・島料理＆島散策お弁当付きプラン"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[0.7rem] font-bold text-slate-700 mb-1">
                    料金目安（1名様あたり） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={plan.price}
                    onChange={(e) => handlePlanChange(idx, 'price', e.target.value)}
                    placeholder="例: ¥11,500〜 / 人"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-mono font-bold text-amber-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[0.7rem] font-bold text-slate-700 mb-1">
                    プランの詳しい説明
                  </label>
                  <textarea
                    value={plan.desc}
                    onChange={(e) => handlePlanChange(idx, 'desc', e.target.value)}
                    rows={2}
                    placeholder="例: 港やヘリポートへの送迎付き。旬の島魚会席と特製お弁当で絶海の孤島を心ゆくまで満喫。"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-500 font-serif leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[0.7rem] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-500" />
                    人気バッジ (任意)
                  </label>
                  <input
                    type="text"
                    value={plan.badge}
                    onChange={(e) => handlePlanChange(idx, 'badge', e.target.value)}
                    placeholder="例: 1番人気"
                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 mb-1.5"
                  />
                  <div className="flex flex-wrap gap-1">
                    {BADGE_PRESETS.map(badge => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => handlePlanChange(idx, 'badge', badge)}
                        className={`text-[0.6rem] px-2 py-0.5 rounded-md border transition-colors ${
                          plan.badge === badge
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[0.7rem] font-bold text-slate-700 mb-1">
                  プランに含まれるサービス・特徴（改行またはカンマ区切りで入力）
                </label>
                <input
                  type="text"
                  value={plan.features_text}
                  onChange={(e) => handlePlanChange(idx, 'features_text', e.target.value)}
                  placeholder="例: 朝夕食付き, お弁当付き, 送迎無料, Wi-Fi完備"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. 予約・受付設定 */}
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


