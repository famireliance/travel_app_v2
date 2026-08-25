import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Palmtree,
  Plus,
  Trash2,
  MapPin,
  Upload,
  Search,
  Save,
  X,
  ExternalLink,
  Edit3
} from 'lucide-react';

interface IslandData {
  id: string;
  name: string;
  region_id: string;
  prefecture: string;
  coordinates: string;
  description: string;
  access: string;
  difficulty: string;
  points: number;
  checkin_radius_m: number;
  thumbnail_url?: string;
}

export default function IslandManagement({ password }: { password: string }) {
  const [islands, setIslands] = useState<IslandData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [selectedIsland, setSelectedIsland] = useState<IslandData | null>(null);
  const [formData, setFormData] = useState<IslandData>({
    id: '', name: '', region_id: 'yaeyama', prefecture: '沖縄県', coordinates: '24.3406, 124.1561',
    description: '', access: '', difficulty: '中級', points: 10, checkin_radius_m: 3000, thumbnail_url: ''
  });

  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false);

  // Uploading state
  const [uploading, setUploading] = useState(false);

  const fetchIslands = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/islands?search=${encodeURIComponent(search)}`, {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIslands(data.data || []);
    } catch (err: any) {
      toast.error(`島データの取得に失敗しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIslands();
  }, [search]);

  const handleEdit = (island: IslandData) => {
    setSelectedIsland(island);
    setFormData({
      id: island.id || '',
      name: island.name || '',
      region_id: island.region_id || '',
      prefecture: island.prefecture || '',
      coordinates: island.coordinates || '',
      description: island.description || '',
      access: island.access || '',
      difficulty: island.difficulty || '中級',
      points: island.points || 10,
      checkin_radius_m: island.checkin_radius_m || 3000,
      thumbnail_url: island.thumbnail_url || ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !selectedIsland;
    try {
      const res = await fetch('/api/admin/islands', {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '島データを保存しました');
      fetchIslands();
      setSelectedIsland(null);
    } catch (err: any) {
      toast.error(`保存エラー: ${err.message}`);
    }
  };

  const handleDelete = async (island: IslandData) => {
    if (!window.confirm(`本当に「${island.name}」(ID: ${island.id}) のデータを削除しますか？`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/islands?id=${encodeURIComponent(island.id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '削除しました');
      if (selectedIsland?.id === island.id) setSelectedIsland(null);
      fetchIslands();
    } catch (err: any) {
      toast.error(`削除エラー: ${err.message}`);
    }
  };

  // Upload image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('画像をアップロード中...');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('bucket', 'islands');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFormData(prev => ({ ...prev, thumbnail_url: data.url }));
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
            <Palmtree className="w-6 h-6 text-emerald-400" />
            島マスターデータ管理
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            対象離島のマスターデータ登録、位置座標、難易度、チェックイン判定半径、解説画像の更新・削除
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedIsland(null);
            setFormData({
              id: '', name: '', region_id: 'yaeyama', prefecture: '沖縄県', coordinates: '24.3406, 124.1561',
              description: '', access: '', difficulty: '中級', points: 10, checkin_radius_m: 3000, thumbnail_url: ''
            });
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          新規島データを作成
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Island List Column */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col h-[75vh]">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="島名で検索..."
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {isLoading ? (
              <p className="text-center text-gray-500 text-xs py-8">読み込み中...</p>
            ) : islands.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">島が見つかりません</p>
            ) : (
              islands.map(island => (
                <div
                  key={island.id}
                  className={`group p-3 rounded-xl transition cursor-pointer border flex items-center justify-between ${
                    selectedIsland?.id === island.id
                      ? 'bg-emerald-950/60 border-emerald-500/60 text-white'
                      : 'bg-gray-950/60 border-gray-800/80 text-gray-300 hover:border-gray-700'
                  }`}
                  onClick={() => handleEdit(island)}
                >
                  <div className="flex items-center gap-3">
                    {island.thumbnail_url ? (
                      <img src={island.thumbnail_url} alt={island.name} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-700" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 shrink-0">
                        <Palmtree className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-xs text-white">{island.name}</h4>
                      <p className="text-[10px] text-gray-400">{island.prefecture} / {island.region_id}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(island);
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
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-400" />
              {selectedIsland ? `「${selectedIsland.name}」の編集` : '新規島データ作成'}
            </h3>
            {selectedIsland && (
              <button
                type="button"
                onClick={() => handleDelete(selectedIsland)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold bg-red-950/40 border border-red-800/50 px-3 py-1.5 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> 島データを削除
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">島ID / スラッグ (必須)</label>
                <input
                  required
                  type="text"
                  placeholder="例: ishigaki"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!selectedIsland}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">島名 (必須)</label>
                <input
                  required
                  type="text"
                  placeholder="例: 石垣島"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">都道府県</label>
                <input
                  required
                  type="text"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={formData.prefecture}
                  onChange={e => setFormData({ ...formData, prefecture: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">地域ID (region_id)</label>
                <input
                  required
                  type="text"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={formData.region_id}
                  onChange={e => setFormData({ ...formData, region_id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">中心座標 (緯度, 経度)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    value={formData.coordinates}
                    onChange={e => setFormData({ ...formData, coordinates: e.target.value })}
                    placeholder="24.3406, 124.1561"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    className="px-3 bg-emerald-950 border border-emerald-600 text-emerald-300 hover:bg-emerald-900 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5" /> 座標設定
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">チェックイン判定半径 (m)</label>
                <input
                  type="number"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={formData.checkin_radius_m}
                  onChange={e => setFormData({ ...formData, checkin_radius_m: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">到達難易度</label>
                <select
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={formData.difficulty}
                  onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="初級 (アクセス容易)">初級 (アクセス容易)</option>
                  <option value="中級">中級</option>
                  <option value="上級 (定期船僅か・秘境)">上級 (定期船僅か・秘境)</option>
                  <option value="超S級 (チャーター要・難関)">超S級 (チャーター要・難関)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">到達ポイント</label>
                <input
                  type="number"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={formData.points}
                  onChange={e => setFormData({ ...formData, points: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Thumbnail Image Section */}
            <div className="bg-gray-950/60 p-4 rounded-xl border border-gray-800 space-y-3">
              <label className="block text-gray-300 font-bold">島サムネイル・ヘッダー画像URL</label>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                {formData.thumbnail_url && (
                  <img src={formData.thumbnail_url} alt="thumbnail" className="w-20 h-20 rounded-xl object-cover border border-gray-700 shrink-0" />
                )}
                <div className="flex-1 space-y-2 w-full">
                  <input
                    type="text"
                    placeholder="https://..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2 text-white text-xs font-mono"
                    value={formData.thumbnail_url || ''}
                    onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 text-xs font-bold transition flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      ファイル選択してアップロード
                      <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-bold">島の解説・魅力文</label>
              <textarea
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 h-24"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-bold">アクセス・フェリー情報</label>
              <textarea
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 h-20"
                value={formData.access}
                onChange={e => setFormData({ ...formData, access: e.target.value })}
              />
            </div>

            <div className="pt-3 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-8 py-3 rounded-xl transition shadow active:scale-95 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> 島データを保存する
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Interactive Map Coordinates Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-xl w-full p-6 text-white space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> 緯度・経度の入力設定アシスト
              </h3>
              <button onClick={() => setShowMapModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              対象の島の中央座標を入力してください。（形式: <code>24.3406, 124.1561</code>）
            </p>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.coordinates}
                onChange={e => setFormData({ ...formData, coordinates: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm font-mono text-white"
                placeholder="24.3406, 124.1561"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMapModal(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
              >
                決定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
