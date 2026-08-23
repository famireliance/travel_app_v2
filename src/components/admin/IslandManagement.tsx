import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function IslandManagement({ password }: { password: string }) {
  const [islands, setIslands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Form State
  const [selectedIsland, setSelectedIsland] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    id: '', name: '', region_id: '', prefecture: '', coordinates: '',
    description: '', access: '', difficulty: '未設定', points: 10, checkin_radius_m: 3000
  });

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

  const handleEdit = (island: any) => {
    setSelectedIsland(island);
    setFormData({
      id: island.id || '',
      name: island.name || '',
      region_id: island.region_id || '',
      prefecture: island.prefecture || '',
      coordinates: island.coordinates || '',
      description: island.description || '',
      access: island.access || '',
      difficulty: island.difficulty || '未設定',
      points: island.points || 10,
      checkin_radius_m: island.checkin_radius_m || 3000
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
      toast.success(data.message);
      fetchIslands();
      setSelectedIsland(null);
    } catch (err: any) {
      toast.error(`保存エラー: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-100">島データ管理</h2>
        <button 
          onClick={() => {
            setSelectedIsland(null);
            setFormData({ id: '', name: '', region_id: '', prefecture: '', coordinates: '', description: '', access: '', difficulty: '未設定', points: 10, checkin_radius_m: 3000 });
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-bold text-white transition-colors"
        >
          ＋ 新規島データ追加
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Section */}
        <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow border border-gray-700 flex flex-col h-[70vh]">
          <div className="p-4 border-b border-gray-700">
            <input 
              type="text" 
              placeholder="島名で検索..." 
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <p className="text-center text-gray-500 mt-4">読み込み中...</p>
            ) : (
              <ul className="space-y-1">
                {islands.map(island => (
                  <li key={island.id}>
                    <button 
                      onClick={() => handleEdit(island)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedIsland?.id === island.id ? 'bg-blue-900/50 text-blue-200 border border-blue-700/50' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                      <div className="font-bold">{island.name}</div>
                      <div className="text-xs text-gray-500">{island.prefecture} / {island.region_id}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow border border-gray-700 p-6 h-[70vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4 text-gray-200">
            {selectedIsland ? '島データを編集' : '新規島データを作成'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">ID (Slug)</label>
                <input required type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} disabled={!!selectedIsland} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">島名</label>
                <input required type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">都道府県</label>
                <input required type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2" value={formData.prefecture} onChange={e => setFormData({...formData, prefecture: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">地域ID (region_id)</label>
                <input required type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2" value={formData.region_id} onChange={e => setFormData({...formData, region_id: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">座標 (緯度, 経度)</label>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 bg-gray-900 border border-gray-700 rounded p-2" value={formData.coordinates} onChange={e => setFormData({...formData, coordinates: e.target.value})} placeholder="35.6895, 139.6917" />
                  <button type="button" className="px-3 bg-gray-700 hover:bg-gray-600 rounded text-xs" onClick={() => alert('マップ連携機能は準備中です')}>🗺️ 地図</button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">チェックイン半径 (m)</label>
                <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-2" value={formData.checkin_radius_m} onChange={e => setFormData({...formData, checkin_radius_m: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">難易度</label>
                <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">付与ポイント</label>
                <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-2" value={formData.points} onChange={e => setFormData({...formData, points: Number(e.target.value)})} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">説明文</label>
              <textarea className="w-full bg-gray-900 border border-gray-700 rounded p-2 h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">アクセス情報</label>
              <textarea className="w-full bg-gray-900 border border-gray-700 rounded p-2 h-16" value={formData.access} onChange={e => setFormData({...formData, access: e.target.value})} />
            </div>

            <div className="pt-4 flex justify-end gap-4 border-t border-gray-700">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold text-white transition-colors">
                保存する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
