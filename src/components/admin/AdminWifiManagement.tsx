'use client';

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  Wifi, Plus, Trash2, Edit3, Save, X, Signal, 
  MapPin, CheckCircle, ShieldCheck, RefreshCw, AlertCircle 
} from 'lucide-react';
import type { PublicWifiSpot } from '@/lib/wifiStore';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

interface AdminWifiManagementProps {
  password: string;
}

const ISLAND_OPTIONS = [
  { id: 'hachijojima', name: '八丈島', region: '伊豆諸島' },
  { id: 'ishigakijima', name: '石垣島', region: '八重山諸島' },
  { id: 'aogashima', name: '青ヶ島', region: '伊豆諸島' },
  { id: 'amami', name: '奄美大島', region: '奄美群島' },
  { id: 'miyako', name: '宮古島', region: '宮古諸島' },
  { id: 'oshima', name: '伊豆大島', region: '伊豆諸島' },
  { id: 'chichijima', name: '父島', region: '小笠原諸島' }
];

export default function AdminWifiManagement({ password }: AdminWifiManagementProps) {
  const [selectedIslandId, setSelectedIslandId] = useState<string>('hachijojima');
  const [spots, setSpots] = useState<PublicWifiSpot[]>([]);
  const [cellNotes, setCellNotes] = useState<Record<string, string>>({});
  const [currentCellNote, setCurrentCellNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<PublicWifiSpot | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ssid: '',
    has_password: false,
    password: '',
    auth_method: 'ブラウザ利用規約同意（無料）',
    notes: ''
  });

  const operatorName = '弊社運営管理者 (Master Admin)';

  // データ取得
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/wifi-spots?island_id=${selectedIslandId}`, {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSpots(data.spots || []);
      setCellNotes(data.cell_notes || {});
      setCurrentCellNote(data.cell_notes?.[selectedIslandId] || '');
    } catch (err: any) {
      toast.error(`データ取得に失敗しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [password, selectedIslandId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 電波目安の保存
  const handleSaveCellNote = async () => {
    setIsSavingNote(true);
    try {
      const res = await fetch('/api/admin/wifi-spots', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          type: 'update_cell_note',
          island_id: selectedIslandId,
          cell_note: currentCellNote,
          operator_name: operatorName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('キャリア電波目安を更新しました！（操作ログに記録済）');
    } catch (err: any) {
      toast.error(`保存に失敗しました: ${err.message}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  // モーダルオープン（新規）
  const handleOpenAdd = () => {
    setEditingSpot(null);
    setFormData({
      name: '',
      location: '',
      ssid: '',
      has_password: false,
      password: '',
      auth_method: 'ブラウザ利用規約同意（無料）',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // モーダルオープン（編集）
  const handleOpenEdit = (spot: PublicWifiSpot) => {
    setEditingSpot(spot);
    setFormData({
      name: spot.name,
      location: spot.location,
      ssid: spot.ssid,
      has_password: spot.has_password,
      password: spot.password || '',
      auth_method: spot.auth_method,
      notes: spot.notes || ''
    });
    setIsModalOpen(true);
  };

  // スポットの保存（新規または編集）
  const handleSubmitSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ssid) {
      toast.error('スポット名とSSIDを入力してください');
      return;
    }

    try {
      const isEdit = Boolean(editingSpot);
      const url = '/api/admin/wifi-spots';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        ...(isEdit ? { id: editingSpot!.id } : {}),
        island_id: selectedIslandId,
        ...formData,
        operator_name: operatorName
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        isEdit 
          ? `「${formData.name}」を更新しました（操作ログ記録済）` 
          : `「${formData.name}」を新規登録しました（操作ログ記録済）`
      );
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(`保存に失敗しました: ${err.message}`);
    }
  };

  // スポットの削除
  const handleDeleteSpot = async (id: string, name: string) => {
    if (!confirm(`本当に「${name}」を削除しますか？\nこの操作は監査ログに記録されます。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/wifi-spots?id=${id}&operator_name=${encodeURIComponent(operatorName)}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`「${name}」を削除しました（操作ログ記録済）`);
      fetchData();
    } catch (err: any) {
      toast.error(`削除に失敗しました: ${err.message}`);
    }
  };

  const allPublishedIslands = React.useMemo(
    () =>
      Object.values(ALL_ISLANDS_MASTER_DICTIONARY)
        .filter((i: any) => i.is_published !== false)
        .sort((a: any, b: any) => Number(a.id) - Number(b.id)),
    []
  );

  const selectedIsland =
    ISLAND_OPTIONS.find((i) => i.id === selectedIslandId) ||
    (() => {
      const m: any =
        ALL_ISLANDS_MASTER_DICTIONARY[selectedIslandId] ||
        allPublishedIslands.find((i: any) => String(i.id) === selectedIslandId || i.slug === selectedIslandId);
      return m ? { id: String(m.id), name: m.name, region: m.prefecture || m.area || '' } : undefined;
    })();

  return (
    <div className="space-y-6">
      {/* 監査ログ連携のアナウンスヘッダー */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                ENTERPRISE GOVERNANCE // RBAC READY
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                改ざん防止・完全追跡
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-0.5">
              全国離島 公共Wi-Fi ＆ 電波インフラ マスター管理
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              全島のスポットを運営側で自由に追加・上書き可能。ここで行われた操作はすべて「操作・監査ログ」へ不可逆記録されます。
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>最新同期</span>
        </button>
      </div>

      {/* 対象の島 選択セレクター */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              管理対象の島を選択
            </label>
            <div className="flex flex-wrap gap-2">
              {ISLAND_OPTIONS.map(island => (
                <button
                  key={island.id}
                  onClick={() => setSelectedIslandId(island.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedIslandId === island.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{island.name}</span>
                  <span className={`text-[10px] ${selectedIslandId === island.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                    ({island.region})
                  </span>
                </button>
              ))}
              <select
                value={selectedIslandId}
                onChange={(e) => setSelectedIslandId(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <optgroup label="主要離島クイック選択">
                  {ISLAND_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} ({opt.region})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="全国369公開離島から選択">
                  {allPublishedIslands.map((isl: any) => (
                    <option key={isl.id} value={String(isl.id)}>
                      #{isl.id} {isl.name} ({isl.prefecture})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新規フリーWi-Fiを追加</span>
          </button>
        </div>

        {/* キャリア電波目安の編集 */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 text-emerald-600" />
            <span>【{selectedIsland?.name}】携帯キャリア電波目安（旅行者画面に表示）</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentCellNote}
              onChange={(e) => setCurrentCellNote(e.target.value)}
              placeholder="例: 集落内・港周辺は4G/5G快調。山間部・外海航路はdocomo推奨。"
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
            <button
              onClick={handleSaveCellNote}
              disabled={isSavingNote}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingNote ? '保存中...' : '電波目安を更新'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* スポット一覧 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span>登録済み公共フリーWi-Fiスポット（{spots.length}件）</span>
          </h4>
          <span className="text-[11px] text-slate-400">
            一般旅行者アプリ（IslandWifiGuide）に即座に反映されます
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">読み込み中...</div>
        ) : spots.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">この島にはまだ公共フリーWi-Fiスポットが登録されていません。</p>
            <button
              onClick={handleOpenAdd}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              ＋ 最初のスポットを登録する
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {spots.map((spot) => (
              <div
                key={spot.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{spot.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {spot.location}
                    </span>
                    {spot.is_verified && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-1 border border-emerald-200">
                        <CheckCircle className="w-2.5 h-2.5" />
                        運営公認
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      SSID: {spot.ssid}
                    </span>
                    <span>認証: {spot.auth_method}</span>
                    {spot.has_password && (
                      <span className="font-mono text-slate-600">PW: {spot.password}</span>
                    )}
                  </div>

                  {spot.notes && (
                    <p className="text-xs text-slate-400 leading-snug">{spot.notes}</p>
                  )}

                  <div className="text-[10px] text-slate-400">
                    最終更新: {new Date(spot.updated_at).toLocaleString('ja-JP')} （{spot.updated_by || 'Admin'}）
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => handleOpenEdit(spot)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="編集"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSpot(spot.id, spot.name)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 追加・編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-emerald-600" />
                <span>{editingSpot ? '公共Wi-Fiスポットの編集' : '新規公共Wi-Fiスポットの追加'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSpot} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">施設・スポット名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: 底土港 船客待合所"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">設置場所・階層</label>
                <input
                  type="text"
                  placeholder="例: 1F 待合ロビー / 観光案内カウンター周辺"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ネットワーク名（SSID） *</label>
                <input
                  type="text"
                  required
                  placeholder="例: FREE_Wi-Fi_and_TOKYO"
                  value={formData.ssid}
                  onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="has_password"
                  checked={formData.has_password}
                  onChange={(e) => setFormData({ ...formData, has_password: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="has_password" className="font-bold text-slate-700 cursor-pointer select-none">
                  暗証番号（パスワード）が必要なスポット
                </label>
              </div>

              {formData.has_password && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">パスワード</label>
                  <input
                    type="text"
                    placeholder="暗号化キーを入力"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">認証方式</label>
                <input
                  type="text"
                  placeholder="例: ブラウザ利用規約同意（無料） / メール・SNS認証"
                  value={formData.auth_method}
                  onChange={(e) => setFormData({ ...formData, auth_method: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">備考・利用ヒント</label>
                <textarea
                  rows={2}
                  placeholder="例: 乗船前の待ち時間や電波が届きにくい桟橋付近でも高速通信が可能。"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md"
                >
                  {editingSpot ? '更新を保存（ログ記録）' : '登録する（ログ記録）'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
