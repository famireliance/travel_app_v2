import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function FairyManagement({ password }: { password: string }) {
  const [fairies, setFairies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Form State
  const [selectedFairy, setSelectedFairy] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    fairy_key: '', name: '', theme: '', description: '', region_id: '', island_id: '',
    rarity: 'NORMAL', attribute: 'WATER', collab_sponsor: '', icon: '✨', image_url: '', custom_photo_url: '',
    color_from: 'from-blue-400', color_to: 'to-indigo-600', shadow_color: 'shadow-blue-500/50', sparkle_color: 'text-blue-200',
    is_time_limited: false, start_date: '', end_date: '',
    checkin_radius_m: 0, is_qr_exclusive: false
  });

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

  const handleEdit = (fairy: any) => {
    setSelectedFairy(fairy);
    setFormData({
      fairy_key: fairy.fairy_key || '', name: fairy.name || '', theme: fairy.theme || '', description: fairy.description || '',
      region_id: fairy.region_id || '', island_id: fairy.island_id || '', rarity: fairy.rarity || 'NORMAL', attribute: fairy.attribute || 'WATER',
      collab_sponsor: fairy.collab_sponsor || '', icon: fairy.icon || '✨', image_url: fairy.image_url || '', custom_photo_url: fairy.custom_photo_url || '',
      color_from: fairy.color_from || 'from-blue-400', color_to: fairy.color_to || 'to-indigo-600', shadow_color: fairy.shadow_color || 'shadow-blue-500/50', sparkle_color: fairy.sparkle_color || 'text-blue-200',
      is_time_limited: fairy.is_time_limited || false, start_date: fairy.start_date ? fairy.start_date.substring(0, 16) : '', end_date: fairy.end_date ? fairy.end_date.substring(0, 16) : '',
      checkin_radius_m: fairy.checkin_radius_m || 0, is_qr_exclusive: fairy.is_qr_exclusive || false
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !selectedFairy;
    try {
      const payload = { ...formData };
      if (!payload.start_date) delete (payload as any).start_date;
      if (!payload.end_date) delete (payload as any).end_date;

      const res = await fetch('/api/admin/fairies', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(isNew ? payload : { id: selectedFairy.id, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchFairies();
      setSelectedFairy(null);
    } catch (err: any) {
      toast.error(`保存エラー: ${err.message}`);
    }
  };

  const handleGenerateAssist = () => {
    // 簡易的な自動提案機能（将来的にはAI連携も可能）
    toast.success('自動提案を適用しました！');
    setFormData(prev => ({
      ...prev,
      icon: '☕',
      color_from: 'from-amber-700',
      color_to: 'to-amber-900',
      shadow_color: 'shadow-amber-800/50',
      sparkle_color: 'text-amber-200',
      theme: 'カフェの癒やし精霊',
      description: 'コーヒーの豊かな香りと共に現れる、ほっと一息つける妖精です。',
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-100">妖精データ管理</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleGenerateAssist}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-bold text-white transition-colors"
          >
            ✨ AIアシスト提案 (β)
          </button>
          <button 
            onClick={() => {
              setSelectedFairy(null);
              setFormData({ fairy_key: '', name: '', theme: '', description: '', region_id: '', island_id: '', rarity: 'NORMAL', attribute: 'WATER', collab_sponsor: '', icon: '✨', image_url: '', custom_photo_url: '', color_from: 'from-blue-400', color_to: 'to-indigo-600', shadow_color: 'shadow-blue-500/50', sparkle_color: 'text-blue-200', is_time_limited: false, start_date: '', end_date: '', checkin_radius_m: 0, is_qr_exclusive: false });
            }}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-bold text-white transition-colors"
          >
            ＋ 新規妖精追加
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Section */}
        <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow border border-gray-700 flex flex-col h-[75vh]">
          <div className="p-4 border-b border-gray-700">
            <input 
              type="text" 
              placeholder="名前やテーマで検索..." 
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
                {fairies.map(fairy => (
                  <li key={fairy.id}>
                    <button 
                      onClick={() => handleEdit(fairy)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-3 ${selectedFairy?.id === fairy.id ? 'bg-blue-900/50 border border-blue-700/50' : 'hover:bg-gray-700'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gradient-to-br ${fairy.color_from} ${fairy.color_to}`}>
                        {fairy.icon}
                      </div>
                      <div>
                        <div className="font-bold text-gray-200">{fairy.name}</div>
                        <div className="text-xs text-gray-500">{fairy.rarity} / {fairy.attribute}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow border border-gray-700 p-6 h-[75vh] overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="flex gap-6 items-start">
              {/* Live Preview Card */}
              <div className="w-32 flex-shrink-0 flex flex-col items-center gap-2">
                <p className="text-xs text-gray-400 font-bold">プレビュー</p>
                <div className={`w-full aspect-[3/4] rounded-xl flex items-center justify-center text-5xl relative overflow-hidden bg-gradient-to-b ${formData.color_from} ${formData.color_to} ${formData.shadow_color} shadow-lg`}>
                  {formData.custom_photo_url || formData.image_url ? (
                    <img src={formData.custom_photo_url || formData.image_url} alt="preview" className="w-full h-full object-cover mix-blend-overlay opacity-80" />
                  ) : null}
                  <span className={`absolute z-10 drop-shadow-md ${formData.sparkle_color}`}>{formData.icon}</span>
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fairy Key (ID)</label>
                  <input required type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.fairy_key} onChange={e => setFormData({...formData, fairy_key: e.target.value})} disabled={!!selectedFairy} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">名前</label>
                  <input required type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">テーマ</label>
                  <input required type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">レアリティ</label>
                  <select className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.rarity} onChange={e => setFormData({...formData, rarity: e.target.value})}>
                    <option value="NORMAL">NORMAL</option>
                    <option value="RARE">RARE</option>
                    <option value="EPIC">EPIC</option>
                    <option value="SPOT_EXCLUSIVE">SPOT_EXCLUSIVE (限定)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">属性</label>
                  <select className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.attribute} onChange={e => setFormData({...formData, attribute: e.target.value})}>
                    <option value="WATER">WATER (水)</option>
                    <option value="NATURE">NATURE (自然)</option>
                    <option value="FIRE">FIRE (火)</option>
                    <option value="LIGHT">LIGHT (光)</option>
                    <option value="EARTH">EARTH (地)</option>
                    <option value="WIND">WIND (風)</option>
                    <option value="ICE">ICE (氷)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">説明文</label>
                  <textarea className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm h-16" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Visual Motif Enforcer */}
            <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
              <h4 className="text-sm font-bold text-pink-400 mb-3">🎨 ビジュアルモチーフ設定（世界観の維持）</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">アイコン(絵文字)</label>
                  <input required type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-center" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Color From</label>
                  <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.color_from} onChange={e => setFormData({...formData, color_from: e.target.value})} placeholder="from-blue-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Color To</label>
                  <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.color_to} onChange={e => setFormData({...formData, color_to: e.target.value})} placeholder="to-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Shadow</label>
                  <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.shadow_color} onChange={e => setFormData({...formData, shadow_color: e.target.value})} placeholder="shadow-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sparkle</label>
                  <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.sparkle_color} onChange={e => setFormData({...formData, sparkle_color: e.target.value})} placeholder="text-blue-200" />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-400 mb-1">📸 カスタム写真/背景URL (看板犬や店舗イメージなど)</label>
                <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.custom_photo_url} onChange={e => setFormData({...formData, custom_photo_url: e.target.value})} placeholder="https://..." />
              </div>
            </div>

            {/* Collab & Restrictions */}
            <div className="bg-yellow-900/10 p-4 rounded border border-yellow-700/30">
              <h4 className="text-sm font-bold text-yellow-400 mb-3">📍 コラボ・取得範囲・期間限定設定</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">協賛企業・店舗名</label>
                  <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.collab_sponsor} onChange={e => setFormData({...formData, collab_sponsor: e.target.value})} placeholder="〇〇カフェ" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">紐付け先 島ID (または独自SPOT ID)</label>
                  <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.island_id} onChange={e => setFormData({...formData, island_id: e.target.value})} />
                </div>
                
                <div className="col-span-2 flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={formData.is_time_limited} onChange={e => setFormData({...formData, is_time_limited: e.target.checked})} className="rounded bg-gray-900 border-gray-700" />
                    期間限定にする
                  </label>
                  {formData.is_time_limited && (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="datetime-local" className="bg-gray-900 border border-gray-700 rounded p-1 text-sm w-full" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                      <span>〜</span>
                      <input type="datetime-local" className="bg-gray-900 border border-gray-700 rounded p-1 text-sm w-full" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                    </div>
                  )}
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-gray-700/50">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">取得可能半径 (m) ※0でデフォルト</label>
                    <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm" value={formData.checkin_radius_m} onChange={e => setFormData({...formData, checkin_radius_m: Number(e.target.value)})} />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={formData.is_qr_exclusive} onChange={e => setFormData({...formData, is_qr_exclusive: e.target.checked})} className="rounded bg-gray-900 border-gray-700 w-4 h-4" />
                      <span className="font-bold text-green-400">📱 店内QRコード限定で取得可能にする</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded font-bold text-white transition-colors">
                保存する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
