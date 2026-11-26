import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import {
  Ship,
  Hotel,
  Utensils,
  ShoppingBag,
  Compass,
  Landmark,
  Plus,
  Trash2,
  Upload,
  Search,
  Save,
  Crown,
  Calendar,
  AlertTriangle,
  Edit3,
  ExternalLink,
  Sparkles,
  Film,
} from 'lucide-react';

type PartnerBusinessType =
  | 'transport'
  | 'lodging'
  | 'dining'
  | 'shop'
  | 'activity'
  | 'municipality';

const PARTNER_TYPE_META: Record<
  PartnerBusinessType,
  { label: string; shortLabel: string; defaultCategory: string; pillActiveClass: string }
> = {
  transport: {
    label: '🚢 交通機関・レンタカー',
    shortLabel: '交通・レンタカー',
    defaultCategory: '交通・レンタカー',
    pillActiveClass: 'bg-sky-600 text-white shadow',
  },
  lodging: {
    label: '🏨 宿泊施設',
    shortLabel: '宿泊施設',
    defaultCategory: '宿泊施設',
    pillActiveClass: 'bg-indigo-600 text-white shadow',
  },
  dining: {
    label: '🍽️ 飲食店・カフェ・居酒屋',
    shortLabel: '飲食・カフェ',
    defaultCategory: '飲食店・カフェ',
    pillActiveClass: 'bg-orange-600 text-white shadow',
  },
  shop: {
    label: '🛍️ お土産・特産ショップ',
    shortLabel: 'お土産・特産店',
    defaultCategory: 'お土産・特産店',
    pillActiveClass: 'bg-pink-600 text-white shadow',
  },
  activity: {
    label: '🤿 マリン・アクティビティ',
    shortLabel: 'マリン・体験',
    defaultCategory: 'マリン・体験',
    pillActiveClass: 'bg-teal-600 text-white shadow',
  },
  municipality: {
    label: '🏛️ 自治体・観光協会・公式タイアップ',
    shortLabel: '自治体・観光協会',
    defaultCategory: '自治体・観光協会',
    pillActiveClass: 'bg-emerald-600 text-white shadow',
  },
};

function renderPartnerTypeIcon(type: string, className = 'w-5 h-5') {
  switch (type) {
    case 'lodging':
      return <Hotel className={className} />;
    case 'dining':
      return <Utensils className={className} />;
    case 'shop':
      return <ShoppingBag className={className} />;
    case 'activity':
      return <Compass className={className} />;
    case 'municipality':
      return <Landmark className={className} />;
    case 'transport':
    default:
      return <Ship className={className} />;
  }
}

interface PartnerData {
  id?: string;
  name: string;
  type: PartnerBusinessType | string;
  category_detail: string;
  island_id: string;
  logo_url?: string;
  banner_photo_url?: string;
  official_website_url?: string;
  perk_text?: string;
  sponsor_tier: 'GOLD' | 'SILVER' | 'STANDARD' | string;
  contract_start: string;
  contract_end: string;
  notification_email?: string;
  is_active: boolean;
}

export default function AdminPartners({ password }: { password: string }) {
  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState<'all' | PartnerBusinessType | 'gold'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for edit
  const [selectedPartner, setSelectedPartner] = useState<PartnerData | null>(null);
  const [formData, setFormData] = useState<PartnerData>({
    name: '',
    type: 'transport',
    category_detail: '高速フェリー',
    island_id: 'ishigaki',
    logo_url: '',
    banner_photo_url: '',
    official_website_url: '',
    perk_text: 'KIRATABI提示で乗船口優先案内・10%割引',
    sponsor_tier: 'GOLD',
    contract_start: new Date().toISOString().slice(0, 10),
    contract_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notification_email: 'partner-alert@kira-tabi.com',
    is_active: true
  });

  const [customDays, setCustomDays] = useState<number>(30);
  const [uploading, setUploading] = useState(false);

  const DEFAULT_FORM: PartnerData = {
    name: '',
    type: 'transport',
    category_detail: '高速フェリー',
    island_id: 'ishigaki',
    logo_url: '',
    banner_photo_url: '',
    official_website_url: '',
    perk_text: 'KIRATABI提示で特別割引',
    sponsor_tier: 'GOLD',
    contract_start: new Date().toISOString().slice(0, 10),
    contract_end: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    notification_email: '',
    is_active: true
  };

  const resetForm = () => {
    setSelectedPartner(null);
    setFormData({ ...DEFAULT_FORM });
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/partners', {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.ok) {
        setPartners(data.partners || []);
      } else {
        toast.error(data.error || 'パートナーデータの取得に失敗しました');
      }
    } catch (err) {
      toast.error('パートナーデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleEdit = (p: PartnerData) => {
    setSelectedPartner(p);
    setFormData({
      id: p.id,
      name: p.name || '',
      type: p.type || 'transport',
      category_detail: p.category_detail || '',
      island_id: p.island_id || '',
      logo_url: p.logo_url || '',
      banner_photo_url: p.banner_photo_url || '',
      official_website_url: p.official_website_url || '',
      perk_text: p.perk_text || '',
      sponsor_tier: p.sponsor_tier || 'STANDARD',
      contract_start: p.contract_start ? p.contract_start.substring(0, 10) : new Date().toISOString().slice(0, 10),
      contract_end: p.contract_end ? p.contract_end.substring(0, 10) : new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      notification_email: p.notification_email || '',
      is_active: p.is_active !== undefined ? p.is_active : true
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !selectedPartner;
    try {
      const res = await fetch('/api/admin/partners', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(isNew ? formData : { id: selectedPartner.id, ...formData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '保存しました');
      fetchPartners();
      resetForm();
    } catch (err: any) {
      toast.error(`保存エラー: ${err.message}`);
    }
  };

  const handleExtendContract = async (days: number) => {
    if (!days || isNaN(days) || days <= 0) {
      toast.error('有効な延長日数を指定してください');
      return;
    }
    if (!selectedPartner?.id) {
      // フォーム上の日付を延長
      const base = formData.contract_end ? new Date(formData.contract_end) : new Date();
      const validBase = isNaN(base.getTime()) ? new Date() : base;
      validBase.setDate(validBase.getDate() + days);
      setFormData(prev => ({ ...prev, contract_end: validBase.toISOString().slice(0, 10) }));
      toast.success(`契約期間を ＋${days}日 延長設定しました`);
      return;
    }

    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id: selectedPartner.id, extendDays: days })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || `契約を ＋${days}日 延長しました`);
      fetchPartners();
      if (data.partner) {
        // 延長後は契約終了日だけ更新（未保存入力内容は消さない）
        setFormData(prev => ({ ...prev, contract_end: data.partner.contract_end?.substring(0, 10) || prev.contract_end }));
      }
    } catch (err: any) {
      toast.error(`延長エラー: ${err.message}`);
    }
  };

  const handleDelete = async (p: PartnerData) => {
    if (!p.id) return;
    if (!window.confirm(`パートナー「${p.name}」の契約データを削除しますか？`)) return;

    try {
      const res = await fetch(`/api/admin/partners?id=${p.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('削除しました');
      if (selectedPartner?.id === p.id) resetForm();
      fetchPartners();
    } catch (err: any) {
      toast.error(`削除エラー: ${err.message}`);
    }
  };

  // Photo upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'logo_url' | 'banner_photo_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('画像を圧縮・アップロード中...');
    try {
      let uploadFile: File = file;
      if (file.type !== 'image/gif') {
        try {
          const compressed: Blob = await imageCompression(file, {
            maxSizeMB: 1.2,
            maxWidthOrHeight: 1600,
            useWebWorker: false,
          });
          uploadFile =
            compressed instanceof File
              ? compressed
              : new File([compressed], file.name, { type: compressed.type || file.type });
        } catch {
          uploadFile = file;
        }
      }

      const body = new FormData();
      body.append('file', uploadFile);
      body.append('bucket', 'public-assets');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFormData(prev => ({ ...prev, [targetField]: data.url }));
      toast.success('画像をアップロードしました', { id: toastId });
    } catch (err: any) {
      toast.error(`アップロード失敗: ${err.message}`, { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Admin-Only Expiring Contracts calculation (0〜30日以内、既に期限切れは除外)
  const expiringPartners = partners.filter(p => {
    if (!p.contract_end || p.is_active === false) return false;
    const diffDays = (new Date(p.contract_end).getTime() - Date.now()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 30;
  });

  const filteredPartners = partners.filter(p => {
    if (typeFilter === 'gold') {
      if (p.sponsor_tier !== 'GOLD') return false;
    } else if (typeFilter !== 'all') {
      if (p.type !== typeFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.name || '').toLowerCase();
      const island = (p.island_id || '').toLowerCase();
      const cat = (p.category_detail || '').toLowerCase();
      if (!name.includes(q) && !island.includes(q) && !cat.includes(q)) return false;
    }
    return true;
  });

  const previewImageUrl =
    (formData.banner_photo_url && (formData.banner_photo_url.startsWith('https://') || formData.banner_photo_url.startsWith('/'))
      ? formData.banner_photo_url
      : '') ||
    (formData.logo_url && (formData.logo_url.startsWith('https://') || formData.logo_url.startsWith('/'))
      ? formData.logo_url
      : '');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Ship className="w-6 h-6 text-sky-400" />
            島内店舗・自治体DMO・宿・交通 5秒CM＆タイアップ管理
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            到達証明書の発行時5秒CM枠・ご提示特典クーポン・宿・交通・飲食店・ショップ・自治体タイアップの一元管理
          </p>
        </div>
        <button
          onClick={() => resetForm()}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          新規パートナーを登録
        </button>
      </div>

      {/* STRICT ADMIN-ONLY PRIVATE ALERT SECTION */}
      {expiringPartners.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/80 via-gray-900 to-gray-900 border border-red-600/50 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  社内管理者専用アラート (非公開)
                </span>
                <h3 className="text-xs font-bold text-red-200">
                  契約満了間近のパートナーが <span className="text-sm text-red-400 font-extrabold">{expiringPartners.length} 件</span> あります
                </h3>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                30日以内に掲載契約が終了する企業です。契約延長またはメール通知を行ってください。
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-red-900/60 flex flex-wrap gap-2">
            {expiringPartners.map(p => (
              <button
                key={p.id}
                onClick={() => handleEdit(p)}
                className="bg-red-900/50 hover:bg-red-800 text-red-200 text-[11px] px-3 py-1 rounded-lg border border-red-700/50 flex items-center gap-1.5 font-bold transition"
              >
                <span>{p.name}</span>
                <span className="font-mono text-[10px] text-red-400">
                  (残り {Math.max(0, Math.ceil((new Date(p.contract_end).getTime() - Date.now()) / 86400000))} 日)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              typeFilter === 'all' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            すべて ({partners.length})
          </button>
          {(Object.keys(PARTNER_TYPE_META) as PartnerBusinessType[]).map((tKey) => {
            const meta = PARTNER_TYPE_META[tKey];
            const count = partners.filter((p) => p.type === tKey).length;
            return (
              <button
                key={tKey}
                onClick={() => setTypeFilter(tKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  typeFilter === tKey ? meta.pillActiveClass : 'text-gray-400 hover:text-white'
                }`}
              >
                {renderPartnerTypeIcon(tKey, 'w-3.5 h-3.5')}
                <span>
                  {meta.shortLabel} ({count})
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setTypeFilter('gold')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === 'gold' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" /> GOLD ({partners.filter(p => p.sponsor_tier === 'GOLD').length})
          </button>
        </div>

        <div className="relative w-full xl:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="企業名・店舗名・島ID・業種で検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partners List Column */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col h-[75vh]">
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-center text-gray-500 text-xs py-8">読み込み中...</p>
            ) : filteredPartners.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">登録パートナーがありません</p>
            ) : (
              filteredPartners.map(p => {
                const isSelected = selectedPartner?.id === p.id;
                const isExpiring = p.contract_end && (new Date(p.contract_end).getTime() - Date.now()) / 86400000 <= 30;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleEdit(p)}
                    className={`group p-3.5 rounded-xl transition cursor-pointer border flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-sky-950/60 border-sky-500/60 text-white shadow-lg'
                        : 'bg-gray-950/60 border-gray-800/80 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                          p.sponsor_tier === 'GOLD' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                          p.sponsor_tier === 'SILVER' ? 'bg-gray-800 text-gray-300 border-gray-700' :
                          'bg-gray-900 text-gray-400 border-gray-800'
                        }`}>
                          {p.sponsor_tier}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">島ID: {p.island_id}</span>
                      </div>
                      {isExpiring && (
                        <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800 animate-pulse font-bold">
                          満了近し
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {p.logo_url || p.banner_photo_url ? (
                        <img src={p.logo_url || p.banner_photo_url} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-gray-700 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                          {renderPartnerTypeIcon(p.type, 'w-5 h-5')}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-white">{p.name}</h4>
                        <p className="text-[10px] text-gray-400">{p.category_detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Editor Form Column */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 h-[75vh] overflow-y-auto space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-sky-400" />
              {selectedPartner ? `「${selectedPartner.name}」の契約・設定` : '新規パートナー登録'}
            </h3>
            {selectedPartner && (
              <button
                type="button"
                onClick={() => handleDelete(selectedPartner)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold bg-red-950/40 border border-red-800/50 px-3 py-1.5 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> パートナー削除
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">パートナー企業・施設名 (必須)</label>
                <input
                  required
                  type="text"
                  placeholder="例: 安栄観光フェリー"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">業種種別 (必須)</label>
                <select
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                  value={formData.type}
                  onChange={e => {
                    const nextType = e.target.value as PartnerBusinessType;
                    const defaultCatList = [
                      '高速フェリー',
                      '交通機関',
                      ...Object.values(PARTNER_TYPE_META).map(m => m.defaultCategory),
                    ];
                    const nextCategory =
                      !formData.category_detail.trim() || defaultCatList.includes(formData.category_detail.trim())
                        ? PARTNER_TYPE_META[nextType]?.defaultCategory || formData.category_detail
                        : formData.category_detail;
                    setFormData({ ...formData, type: nextType, category_detail: nextCategory });
                  }}
                >
                  <option value="transport">🚢 交通機関・レンタカー</option>
                  <option value="lodging">🏨 宿泊施設</option>
                  <option value="dining">🍽️ 飲食店・カフェ・居酒屋</option>
                  <option value="shop">🛍️ お土産・特産ショップ</option>
                  <option value="activity">🤿 マリン・アクティビティ</option>
                  <option value="municipality">🏛️ 自治体・観光協会・公式タイアップ</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">詳細カテゴリー</label>
                <input
                  type="text"
                  placeholder="例: 高速フェリー, 民宿, レンタサイクル"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                  value={formData.category_detail}
                  onChange={e => setFormData({ ...formData, category_detail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">対象の島ID (例: ishigaki, taketomi)</label>
                <input
                  required
                  type="text"
                  placeholder="ishigaki"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-sky-500"
                  value={formData.island_id}
                  onChange={e => setFormData({ ...formData, island_id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">スポンサーランク</label>
                <select
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500 font-bold"
                  value={formData.sponsor_tier}
                  onChange={e => setFormData({ ...formData, sponsor_tier: e.target.value })}
                >
                  <option value="GOLD">👑 GOLD スポンサー (最優先掲載)</option>
                  <option value="SILVER">⭐ SILVER スポンサー</option>
                  <option value="STANDARD">STANDARD パートナー</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">公式WebサイトURL (予約ページ)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono"
                  value={formData.official_website_url || ''}
                  onChange={e => setFormData({ ...formData, official_website_url: e.target.value })}
                />
              </div>
            </div>

            {/* Perk Text Section */}
            <div className="bg-gray-950/60 p-4 rounded-xl border border-gray-800 space-y-2">
              <label className="block text-gray-300 font-bold">🎁 KIRATABI ユーザー限定 優待・特典テキスト</label>
              <textarea
                placeholder="例: アプリの到達画面または提示で乗船料10%割引 / ウェルカムドリンク無料サービス"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 h-16"
                value={formData.perk_text || ''}
                onChange={e => setFormData({ ...formData, perk_text: e.target.value })}
              />
            </div>

            {/* Contract Period & Easy Extension Section (Strict Admin Private) */}
            <div className="bg-gradient-to-r from-gray-950 to-gray-900 p-4 rounded-xl border border-gray-800 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  掲載契約期間 ＆ ワンクリック延長 (管理者専用設定)
                </h4>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                  ※非公開社内データ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">契約開始日</label>
                  <input
                    type="date"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white font-mono"
                    value={formData.contract_start}
                    onChange={e => setFormData({ ...formData, contract_start: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">契約満了日 (掲載終了)</label>
                  <input
                    type="date"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white font-mono font-bold text-amber-300"
                    value={formData.contract_end}
                    onChange={e => setFormData({ ...formData, contract_end: e.target.value })}
                  />
                </div>
              </div>

              {/* Quick Contract Extension Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 block">ワンクリック契約延長:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtendContract(30)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-700 font-bold transition"
                  >
                    ＋30日延長
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendContract(90)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-700 font-bold transition"
                  >
                    ＋90日延長
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendContract(180)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-700 font-bold transition"
                  >
                    ＋180日延長
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendContract(365)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-700 font-bold transition"
                  >
                    ＋1年延長
                  </button>

                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={customDays}
                      onChange={e => setCustomDays(Number(e.target.value))}
                      className="w-16 bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-xs text-white text-center font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleExtendContract(customDays)}
                      className="bg-amber-600 hover:bg-amber-500 text-black text-xs px-3 py-1.5 rounded-lg font-extrabold transition"
                    >
                      指定日数追加
                    </button>
                  </div>
                </div>
              </div>

              {/* Private Email Notification Settings */}
              <div>
                <label className="block text-gray-400 mb-1">社内通知用連絡先メールアドレス (契約満了通知先)</label>
                <input
                  type="email"
                  placeholder="alert@kira-tabi.com"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white font-mono"
                  value={formData.notification_email || ''}
                  onChange={e => setFormData({ ...formData, notification_email: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="partner_is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-950 border-gray-800"
                />
                <label htmlFor="partner_is_active" className="text-gray-300 font-bold cursor-pointer text-xs">
                  掲載ステータス: 有効（チェックなしで一時停止）
                </label>
              </div>
            </div>

            {/* Photo / Logo Uploads */}
            <div className="bg-gray-950/60 p-4 rounded-xl border border-gray-800 space-y-3">
              <label className="block text-gray-300 font-bold">企業ロゴ ＆ メイン写真</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">企業ロゴURL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-2 text-white font-mono text-xs"
                      value={formData.logo_url || ''}
                      onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                    />
                    <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-xl border border-gray-700 text-xs font-bold transition flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'logo_url')} disabled={uploading} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">メイン写真URL (施設・フェリー)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-2 text-white font-mono text-xs"
                      value={formData.banner_photo_url || ''}
                      onChange={e => setFormData({ ...formData, banner_photo_url: e.target.value })}
                    />
                    <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-xl border border-gray-700 text-xs font-bold transition flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'banner_photo_url')} disabled={uploading} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Live 5-Second Certificate CM Preview Box */}
            <div className="bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-950 p-5 rounded-2xl border border-amber-500/40 space-y-3 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                <h4 className="font-extrabold text-amber-300 text-xs sm:text-sm flex items-center gap-2">
                  <Film className="w-4 h-4 text-amber-400" />
                  🎬 到達証明書 5秒CM枠プレビュー
                </h4>
                <span className="text-[10px] text-gray-400">
                  島ID「<span className="text-amber-300 font-mono font-bold">{formData.island_id || '未設定'}</span>」の証明書発行時＆保存後に表示
                </span>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                <div className="text-[11px] font-mono text-white bg-slate-900 px-3 py-1 rounded-lg border border-amber-500/30">
                  公認シリアル採番＆証明書を生成中... 残り 5秒
                </div>

                <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl">
                  {previewImageUrl && (
                    <div className="w-full h-36 bg-slate-950 overflow-hidden relative border-b border-amber-500/30">
                      <img
                        src={previewImageUrl}
                        alt={formData.name || 'CMプレビュー'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 flex flex-col items-center text-center space-y-2.5">
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold tracking-wider">
                        {formData.island_id || '対象島'} 公式パートナー PR
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          formData.sponsor_tier === 'GOLD'
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : formData.sponsor_tier === 'SILVER'
                            ? 'bg-slate-700 text-slate-100 border-slate-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {formData.sponsor_tier === 'GOLD'
                          ? '👑 GOLD SPONSOR'
                          : formData.sponsor_tier === 'SILVER'
                          ? '⭐ SILVER SPONSOR'
                          : 'OFFICIAL PARTNER'}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                        {formData.name || '（店舗・団体名を入力してください）'}
                      </h5>
                      <p className="text-[11px] text-sky-300 font-bold mt-0.5">
                        {formData.category_detail || 'カテゴリー未設定'}
                      </p>
                    </div>

                    {formData.perk_text?.trim() ? (
                      <div className="w-full bg-amber-500/15 border border-amber-400/50 rounded-xl px-3.5 py-2.5 text-left">
                        <p className="text-[11px] sm:text-xs font-extrabold text-amber-300 leading-relaxed">
                          🎁 到達証明書ご提示特典: {formData.perk_text}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-500 italic">
                        ※優待・特典テキストを入力するとクーポン枠が強調表示されます
                      </p>
                    )}

                    {formData.official_website_url?.trim() && (
                      <a
                        href={formData.official_website_url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-extrabold text-xs shadow hover:from-amber-300 hover:to-yellow-400 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        店舗・特典詳細を見る ↗
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-8 py-3 rounded-xl transition shadow active:scale-95 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> パートナー情報を保存する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
