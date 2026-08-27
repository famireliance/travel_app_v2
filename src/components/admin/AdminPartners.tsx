import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Ship,
  Hotel,
  Plus,
  Trash2,
  Upload,
  Search,
  Save,
  Crown,
  Calendar,
  AlertTriangle,
  Edit3,
  RefreshCw
} from 'lucide-react';

interface PartnerData {
  id?: string;
  name: string;
  type: 'transport' | 'lodging' | string;
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'transport' | 'lodging' | 'gold'>('all');
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
    const toastId = toast.loading('画像をアップロード中...');
    try {
      const body = new FormData();
      body.append('file', file);
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
    if (typeFilter === 'transport' && p.type !== 'transport') return false;
    if (typeFilter === 'lodging' && p.type !== 'lodging') return false;
    if (typeFilter === 'gold' && p.sponsor_tier !== 'GOLD') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.name || '').toLowerCase();
      const island = (p.island_id || '').toLowerCase();
      const cat = (p.category_detail || '').toLowerCase();
      if (!name.includes(q) && !island.includes(q) && !cat.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Ship className="w-6 h-6 text-sky-400" />
            宿・交通機関タイアップパートナー管理 (B2B)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            離島旅の必須インフラ「フェリー・航空・バス・レンタカー」および「宿・ホテル」のスポンサー契約・優待特典管理
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              typeFilter === 'all' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            すべて ({partners.length})
          </button>
          <button
            onClick={() => setTypeFilter('transport')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === 'transport' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Ship className="w-3.5 h-3.5" /> 交通機関 ({partners.filter(p => p.type === 'transport').length})
          </button>
          <button
            onClick={() => setTypeFilter('lodging')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === 'lodging' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Hotel className="w-3.5 h-3.5" /> 宿・ホテル ({partners.filter(p => p.type === 'lodging').length})
          </button>
          <button
            onClick={() => setTypeFilter('gold')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === 'gold' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" /> GOLDパートナー ({partners.filter(p => p.sponsor_tier === 'GOLD').length})
          </button>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="企業名・島ID・業種で検索..."
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
                          {p.type === 'transport' ? <Ship className="w-5 h-5" /> : <Hotel className="w-5 h-5" />}
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
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="transport">🚢 交通機関 (フェリー・航空・バス・レンタカー)</option>
                  <option value="lodging">🏨 宿泊施設 (ホテル・リゾート・民宿・ゲストハウス)</option>
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
