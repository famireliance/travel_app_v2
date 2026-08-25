import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Search,
  Save,
  Wand2,
  Edit3
} from 'lucide-react';

interface FairyData {
  id?: string;
  fairy_key: string;
  name: string;
  theme: string;
  description: string;
  region_id: string;
  island_id: string;
  rarity: string;
  attribute: string;
  collab_sponsor: string;
  icon: string;
  image_url: string;
  custom_photo_url: string;
  color_from: string;
  color_to: string;
  shadow_color: string;
  sparkle_color: string;
  is_time_limited: boolean;
  start_date?: string;
  end_date?: string;
  checkin_radius_m: number;
  is_qr_exclusive: boolean;
}

export default function FairyManagement({ password }: { password: string }) {
  const [fairies, setFairies] = useState<FairyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [selectedFairy, setSelectedFairy] = useState<FairyData | null>(null);
  const [formData, setFormData] = useState<FairyData>({
    fairy_key: '', name: '', theme: '', description: '', region_id: '', island_id: '',
    rarity: 'NORMAL', attribute: 'WATER', collab_sponsor: '', icon: '✨', image_url: '', custom_photo_url: '',
    color_from: 'from-blue-400', color_to: 'to-indigo-600', shadow_color: 'shadow-blue-500/50', sparkle_color: 'text-blue-200',
    is_time_limited: false, start_date: '', end_date: '',
    checkin_radius_m: 0, is_qr_exclusive: false
  });

  const [generatingAI, setGeneratingAI] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchFairies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/fairies?search=${encodeURIComponent(search)}`, {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFairies(data.data || []);
    } catch (err: any) {
      toast.error(`妖精データの取得に失敗しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFairies();
  }, [search]);

  const handleEdit = (fairy: FairyData) => {
    setSelectedFairy(fairy);
    setFormData({
      id: fairy.id,
      fairy_key: fairy.fairy_key || '',
      name: fairy.name || '',
      theme: fairy.theme || '',
      description: fairy.description || '',
      region_id: fairy.region_id || '',
      island_id: fairy.island_id || '',
      rarity: fairy.rarity || 'NORMAL',
      attribute: fairy.attribute || 'WATER',
      collab_sponsor: fairy.collab_sponsor || '',
      icon: fairy.icon || '✨',
      image_url: fairy.image_url || '',
      custom_photo_url: fairy.custom_photo_url || '',
      color_from: fairy.color_from || 'from-blue-400',
      color_to: fairy.color_to || 'to-indigo-600',
      shadow_color: fairy.shadow_color || 'shadow-blue-500/50',
      sparkle_color: fairy.sparkle_color || 'text-blue-200',
      is_time_limited: fairy.is_time_limited || false,
      start_date: fairy.start_date ? fairy.start_date.substring(0, 16) : '',
      end_date: fairy.end_date ? fairy.end_date.substring(0, 16) : '',
      checkin_radius_m: fairy.checkin_radius_m || 0,
      is_qr_exclusive: fairy.is_qr_exclusive || false
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !selectedFairy;
    try {
      const payload = { ...formData };
      if (!payload.start_date) delete payload.start_date;
      if (!payload.end_date) delete payload.end_date;

      const res = await fetch('/api/admin/fairies', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(isNew ? payload : { id: selectedFairy.id, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '保存しました');
      fetchFairies();
      setSelectedFairy(null);
    } catch (err: any) {
      toast.error(`保存エラー: ${err.message}`);
    }
  };

  const handleDelete = async (fairy: FairyData) => {
    if (!fairy.id) return;
    if (!window.confirm(`本当に妖精「${fairy.name}」(Key: ${fairy.fairy_key}) を削除しますか？`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/fairies?id=${encodeURIComponent(fairy.id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '削除しました');
      if (selectedFairy?.id === fairy.id) setSelectedFairy(null);
      fetchFairies();
    } catch (err: any) {
      toast.error(`削除エラー: ${err.message}`);
    }
  };

  // Real Gemini AI assist for fairy creation
  const handleAIAssist = async () => {
    const islandName = window.prompt('自動生成する「対象の島名」を入力してください（例: 屋久島、竹富島、宮古島）', '石垣島');
    if (!islandName) return;

    const keyword = window.prompt('特徴キーワードを入力してください（例: マンタ、ガジュマル、泡盛）', 'ガジュマルの樹木精霊');

    setGeneratingAI(true);
    const toastId = toast.loading('Gemini AI が妖精データをデザイン中...');

    try {
      const res = await fetch('/api/admin/generate-fairy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ islandName, keyword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const f = data.fairy;
      const keySlug = `${islandName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;

      setFormData(prev => ({
        ...prev,
        fairy_key: prev.fairy_key || keySlug,
        name: f.name || prev.name,
        theme: f.theme || prev.theme,
        description: f.description || prev.description,
        rarity: f.rarity || prev.rarity,
        attribute: f.attribute || prev.attribute,
        icon: f.icon || prev.icon,
        color_from: f.color_from || prev.color_from,
        color_to: f.color_to || prev.color_to,
        shadow_color: f.shadow_color || prev.shadow_color,
        sparkle_color: f.sparkle_color || prev.sparkle_color,
      }));

      toast.success('AIデザインが適用されました！', { id: toastId });
    } catch (err: any) {
      toast.error(`AI生成エラー: ${err.message}`, { id: toastId });
    } finally {
      setGeneratingAI(false);
    }
  };

  // Upload image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('妖精画像をアップロード中...');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('bucket', 'fairies');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFormData(prev => ({ ...prev, custom_photo_url: data.url }));
      toast.success('画像をアップロードしました', { id: toastId });
    } catch (err: any) {
      toast.error(`アップロード失敗: ${err.message}`, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            ご当地妖精マスター管理
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            各離島・スポットに降臨するご当地妖精（ローカルスピリット）のマスターデータ、世界観、出現条件の登録
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAIAssist}
            disabled={generatingAI}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <Wand2 className={`w-4 h-4 ${generatingAI ? 'animate-spin' : ''}`} />
            Gemini AI で自動デザイン
          </button>
          <button
            onClick={() => {
              setSelectedFairy(null);
              setFormData({
                fairy_key: '', name: '', theme: '', description: '', region_id: '', island_id: '',
                rarity: 'NORMAL', attribute: 'WATER', collab_sponsor: '', icon: '✨', image_url: '', custom_photo_url: '',
                color_from: 'from-blue-400', color_to: 'to-indigo-600', shadow_color: 'shadow-blue-500/50', sparkle_color: 'text-blue-200',
                is_time_limited: false, start_date: '', end_date: '', checkin_radius_m: 0, is_qr_exclusive: false
              });
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            新規妖精を追加
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Section */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col h-[75vh]">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="名前やテーマで検索..."
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {isLoading ? (
              <p className="text-center text-gray-500 text-xs py-8">読み込み中...</p>
            ) : fairies.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">該当する妖精が見つかりません</p>
            ) : (
              fairies.map(fairy => (
                <div
                  key={fairy.id || fairy.fairy_key}
                  className={`group p-3 rounded-xl transition cursor-pointer border flex items-center justify-between ${
                    selectedFairy?.id === fairy.id
                      ? 'bg-amber-950/60 border-amber-500/60 text-white'
                      : 'bg-gray-950/60 border-gray-800/80 text-gray-300 hover:border-gray-700'
                  }`}
                  onClick={() => handleEdit(fairy)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${fairy.color_from} ${fairy.color_to} shrink-0 shadow`}>
                      {fairy.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{fairy.name}</h4>
                      <p className="text-[10px] text-amber-400 font-mono">{fairy.rarity} / {fairy.attribute}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(fairy);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-gray-800 transition"
                    title="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor Form Column */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 h-[75vh] overflow-y-auto space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              {selectedFairy ? `「${selectedFairy.name}」の編集` : '新規妖精データ作成'}
            </h3>
            {selectedFairy && (
              <button
                type="button"
                onClick={() => handleDelete(selectedFairy)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold bg-red-950/40 border border-red-800/50 px-3 py-1.5 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> 妖精を削除
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* Live Preview Card & Basic Info */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Preview Card */}
              <div className="w-36 shrink-0 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">カードプレビュー</span>
                <div className={`w-full aspect-[3/4] rounded-2xl flex flex-col items-center justify-center text-4xl relative overflow-hidden bg-gradient-to-b ${formData.color_from} ${formData.color_to} ${formData.shadow_color} shadow-xl border border-white/20 p-3`}>
                  {formData.custom_photo_url || formData.image_url ? (
                    <img src={formData.custom_photo_url || formData.image_url} alt="preview" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-70" />
                  ) : null}
                  <span className={`relative z-10 drop-shadow-md ${formData.sparkle_color}`}>{formData.icon}</span>
                  <p className="relative z-10 text-[10px] font-extrabold text-white text-center mt-2 leading-tight drop-shadow">
                    {formData.name || '妖精名'}
                  </p>
                </div>
              </div>

              {/* Form Input Columns */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">Fairy Key (識別ID)</label>
                  <input
                    required
                    type="text"
                    placeholder="例: taketomi-shisa"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono"
                    value={formData.fairy_key}
                    onChange={e => setFormData({ ...formData, fairy_key: e.target.value })}
                    disabled={!!selectedFairy}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">名前</label>
                  <input
                    required
                    type="text"
                    placeholder="例: シーサーノ・ルー"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">テーマ / 称号</label>
                  <input
                    required
                    type="text"
                    placeholder="例: ガジュマルの樹木精霊"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white"
                    value={formData.theme}
                    onChange={e => setFormData({ ...formData, theme: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">レアリティ</label>
                  <select
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white"
                    value={formData.rarity}
                    onChange={e => setFormData({ ...formData, rarity: e.target.value })}
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="RARE">RARE</option>
                    <option value="EPIC">EPIC</option>
                    <option value="SPOT_EXCLUSIVE">SPOT_EXCLUSIVE (限定スポット)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">属性</label>
                  <select
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white"
                    value={formData.attribute}
                    onChange={e => setFormData({ ...formData, attribute: e.target.value })}
                  >
                    <option value="WATER">WATER (水)</option>
                    <option value="NATURE">NATURE (自然)</option>
                    <option value="FIRE">FIRE (火)</option>
                    <option value="LIGHT">LIGHT (光)</option>
                    <option value="EARTH">EARTH (地)</option>
                    <option value="WIND">WIND (風)</option>
                    <option value="ICE">ICE (氷)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">紐付け先 島ID</label>
                  <input
                    type="text"
                    placeholder="例: ishigaki"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono"
                    value={formData.island_id}
                    onChange={e => setFormData({ ...formData, island_id: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-bold">説明文・背景エピソード</label>
              <textarea
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 h-20"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Visual Styling Enforcer */}
            <div className="bg-gray-950/60 p-4 rounded-xl border border-gray-800 space-y-3">
              <h4 className="text-xs font-bold text-pink-400">🎨 ビジュアルモチーフ設定</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">絵文字アイコン</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-center text-sm"
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Color From</label>
                  <input
                    type="text"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs"
                    value={formData.color_from}
                    onChange={e => setFormData({ ...formData, color_from: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Color To</label>
                  <input
                    type="text"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs"
                    value={formData.color_to}
                    onChange={e => setFormData({ ...formData, color_to: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Shadow</label>
                  <input
                    type="text"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs"
                    value={formData.shadow_color}
                    onChange={e => setFormData({ ...formData, shadow_color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Sparkle</label>
                  <input
                    type="text"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs"
                    value={formData.sparkle_color}
                    onChange={e => setFormData({ ...formData, sparkle_color: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1 font-bold">カスタム背景/イラスト写真URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-2 text-white font-mono text-xs"
                    value={formData.custom_photo_url || ''}
                    onChange={e => setFormData({ ...formData, custom_photo_url: e.target.value })}
                  />
                  <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-xl border border-gray-700 text-xs font-bold transition flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    画像選択
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-8 py-3 rounded-xl transition shadow active:scale-95 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> 妖精データを保存する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
