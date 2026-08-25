import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Package,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Truck,
  ExternalLink,
  Edit3,
  Save,
  CheckSquare,
  Square,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface OrderItem {
  id: string;
  user_id: string;
  island_id: string;
  type: string;
  shipping_name: string;
  shipping_postal_code: string;
  shipping_address: string;
  shipping_phone: string;
  status: 'pending_payment' | 'ordered' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;
  stripe_session_id?: string;
  tracking_number?: string;
  carrier?: string;
  notes?: string;
  ordered_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

const CARRIERS = [
  { id: 'yamato', name: 'ヤマト運輸' },
  { id: 'sagawa', name: '佐川急便' },
  { id: 'japanpost', name: '日本郵便 (クリックポスト/レターパック)' },
  { id: 'other', name: 'その他' },
];

const PLAN_NAMES: Record<string, string> = {
  standard: 'A4公式到達証明書（台紙付き）',
  frame_simple: '到達証明書（簡易フレーム装飾版）',
  frame_wood: '到達証明書（高級木製フレーム版）',
  frame_acrylic: '到達証明書（アクリル額装プレミアム）',
};

export default function AdminOrders({ password }: { password: string }) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('unshipped');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('shipped');
  const [bulkCarrier, setBulkCarrier] = useState<string>('yamato');

  // Individual editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTracking, setEditTracking] = useState('');
  const [editCarrier, setEditCarrier] = useState('yamato');
  const [editNotes, setEditNotes] = useState('');

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.error || '注文データの取得に失敗しました');
      }
    } catch (err) {
      toast.error('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update single order status & tracking info
  const updateSingleOrder = async (id: string, newStatus: string, trackingNumber?: string, carrier?: string, notes?: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          id,
          status: newStatus,
          tracking_number: trackingNumber,
          carrier,
          notes
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'ステータスを更新しました');
        setEditingId(null);
        fetchOrders();
      } else {
        toast.error(data.error || '更新に失敗しました');
      }
    } catch (err) {
      toast.error('エラーが発生しました');
    }
  };

  // Execute bulk status update
  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) {
      toast.error('対象の注文を選択してください');
      return;
    }
    if (!window.confirm(`選択した ${selectedIds.length} 件の注文ステータスを「${bulkStatus}」に変更しますか？`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          ids: selectedIds,
          status: bulkStatus,
          carrier: bulkCarrier
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || '一括更新を完了しました');
        setSelectedIds([]);
        fetchOrders();
      } else {
        toast.error(data.error || '一括更新に失敗しました');
      }
    } catch (err) {
      toast.error('通信エラーが発生しました');
    }
  };

  // Copy shipping address helper
  const handleCopyAddress = (order: OrderItem) => {
    const text = `〒${order.shipping_postal_code || ''}\n${order.shipping_address || ''}\n${order.shipping_name || ''} 様\nTEL: ${order.shipping_phone || '未入力'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(order.id);
    toast.success('配送先住所をコピーしました');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered orders logic
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter === 'unshipped') {
      if (order.status !== 'ordered' && order.status !== 'processing') return false;
    } else if (statusFilter !== 'all') {
      if (order.status !== statusFilter) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (order.shipping_name || '').toLowerCase();
      const addr = (order.shipping_address || '').toLowerCase();
      const island = (order.island_id || '').toLowerCase();
      const type = (order.type || '').toLowerCase();
      const tracking = (order.tracking_number || '').toLowerCase();

      if (!name.includes(q) && !addr.includes(q) && !island.includes(q) && !type.includes(q) && !tracking.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Select all visible checkbox toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('エクスポート対象の注文がありません');
      return;
    }

    const headers = ['注文ID', '注文日時', '商品種別', '対象島ID', '受取人氏名', '郵便番号', '配送先住所', '電話番号', 'ステータス', '配送業者', '追跡番号', '発送日'];
    const rows = filteredOrders.map(o => [
      o.id,
      new Date(o.ordered_at).toLocaleString('ja-JP'),
      PLAN_NAMES[o.type] || o.type,
      o.island_id || '',
      `"${(o.shipping_name || '').replace(/"/g, '""')}"`,
      o.shipping_postal_code || '',
      `"${(o.shipping_address || '').replace(/"/g, '""')}"`,
      o.shipping_phone || '',
      o.status,
      o.carrier || '',
      o.tracking_number || '',
      o.shipped_at ? new Date(o.shipped_at).toLocaleString('ja-JP') : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KIRATABI_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('CSVファイルをダウンロードしました');
  };

  return (
    <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-700 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            実物到達証明書 発送・注文管理
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            物理証明書および額装版の注文一覧確認、追跡番号登録、ワンクリック一括発送ステータス更新
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs transition border border-gray-600"
            title="最新化"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition shadow"
          >
            <Download className="w-4 h-4" />
            CSVエクスポート
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-gray-900/90 p-1.5 rounded-xl border border-gray-700/80">
          <button
            onClick={() => setStatusFilter('unshipped')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'unshipped' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            🚨 未発送のみ ({orders.filter(o => o.status === 'ordered' || o.status === 'processing').length})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            すべて ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('ordered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'ordered' ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            未対応 ({orders.filter(o => o.status === 'ordered').length})
          </button>
          <button
            onClick={() => setStatusFilter('processing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'processing' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            準備中 ({orders.filter(o => o.status === 'processing').length})
          </button>
          <button
            onClick={() => setStatusFilter('shipped')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'shipped' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            発送済 ({orders.filter(o => o.status === 'shipped').length})
          </button>
          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'delivered' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            配達完了 ({orders.filter(o => o.status === 'delivered').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="お名前・住所・島IDで検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
            <span className="bg-amber-500 text-black px-2 py-0.5 rounded font-mono">{selectedIds.length} 件選択中</span>
            <span>一括操作を選択してください:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="bg-gray-900 border border-amber-600 text-white text-xs rounded-lg px-2.5 py-1.5"
            >
              <option value="processing">ステータス: 準備中に変更</option>
              <option value="shipped">ステータス: 発送済に変更</option>
              <option value="delivered">ステータス: 配達完了に変更</option>
              <option value="cancelled">ステータス: キャンセルに変更</option>
            </select>

            {bulkStatus === 'shipped' && (
              <select
                value={bulkCarrier}
                onChange={e => setBulkCarrier(e.target.value)}
                className="bg-gray-900 border border-amber-600 text-white text-xs rounded-lg px-2.5 py-1.5"
              >
                {CARRIERS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={handleBulkUpdate}
              className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-1.5 rounded-lg transition shadow"
            >
              一括更新を実行
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-400 hover:text-white underline ml-2"
            >
              解除
            </button>
          </div>
        </div>
      )}

      {/* Main Orders Table */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">注文データを読み込み中...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800">
          該当する注文が見つかりませんでした。
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-700 rounded-xl">
          <table className="w-full text-left text-xs text-gray-200">
            <thead className="bg-gray-900 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-700">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={handleToggleSelectAll} className="text-gray-400 hover:text-white">
                    {selectedIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">注文日時</th>
                <th className="p-3">証明書プラン / 対象島</th>
                <th className="p-3">配送先情報</th>
                <th className="p-3">ステータス</th>
                <th className="p-3">追跡情報</th>
                <th className="p-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60 bg-gray-800/40">
              {filteredOrders.map(order => {
                const isSelected = selectedIds.includes(order.id);
                const isEditing = editingId === order.id;

                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-750 transition ${isSelected ? 'bg-amber-950/20' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (isSelected) {
                            setSelectedIds(prev => prev.filter(i => i !== order.id));
                          } else {
                            setSelectedIds(prev => [...prev, order.id]);
                          }
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Order Date */}
                    <td className="p-3 whitespace-nowrap font-mono text-gray-300">
                      {new Date(order.ordered_at).toLocaleString('ja-JP')}
                    </td>

                    {/* Certificate Plan */}
                    <td className="p-3">
                      <p className="font-bold text-white">{PLAN_NAMES[order.type] || order.type}</p>
                      <p className="text-[11px] text-amber-400 font-mono mt-0.5">
                        🏝️ 島ID: {order.island_id || '未登録'}
                      </p>
                    </td>

                    {/* Shipping Address */}
                    <td className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-white">{order.shipping_name} 様</p>
                          <p className="text-gray-400 text-[11px] mt-0.5">
                            〒{order.shipping_postal_code} {order.shipping_address}
                          </p>
                          {order.shipping_phone && (
                            <p className="text-gray-400 text-[11px]">📞 {order.shipping_phone}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopyAddress(order)}
                          className="shrink-0 p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition border border-gray-600"
                          title="配送先住所をコピー"
                        >
                          {copiedId === order.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${
                        order.status === 'shipped' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                        order.status === 'delivered' ? 'bg-sky-950 text-sky-300 border-sky-800' :
                        order.status === 'processing' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                        order.status === 'ordered' ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse' :
                        order.status === 'pending_payment' ? 'bg-gray-800 text-gray-400 border-gray-700' :
                        'bg-red-950 text-red-300 border-red-800'
                      }`}>
                        {order.status === 'shipped' ? '発送済み' :
                         order.status === 'delivered' ? '配達完了' :
                         order.status === 'processing' ? '準備中' :
                         order.status === 'ordered' ? '未対応 (新規注文)' :
                         order.status === 'pending_payment' ? '決済待ち' : 'キャンセル'}
                      </span>
                      {order.shipped_at && (
                        <p className="text-[10px] text-emerald-400/80 mt-1 font-mono">
                          発送日: {new Date(order.shipped_at).toLocaleDateString('ja-JP')}
                        </p>
                      )}
                    </td>

                    {/* Tracking Info & Edit */}
                    <td className="p-3">
                      {isEditing ? (
                        <div className="space-y-2 min-w-[200px] bg-gray-900 p-2 rounded-lg border border-amber-500/50">
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-0.5">配送業者</label>
                            <select
                              value={editCarrier}
                              onChange={e => setEditCarrier(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                            >
                              {CARRIERS.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-0.5">追跡番号</label>
                            <input
                              type="text"
                              value={editTracking}
                              onChange={e => setEditTracking(e.target.value)}
                              placeholder="例: 1234-5678-9012"
                              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div className="flex gap-1.5 justify-end pt-1">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-gray-800 text-gray-400 hover:text-white rounded text-[10px]"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={() => updateSingleOrder(order.id, 'shipped', editTracking, editCarrier, editNotes)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> 保存＆発送完了
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {order.tracking_number ? (
                            <div>
                              <p className="text-white font-mono font-bold">{order.tracking_number}</p>
                              <p className="text-[10px] text-gray-400">{order.carrier || '配送業者未指定'}</p>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-[11px]">未入力</p>
                          )}
                          <button
                            onClick={() => {
                              setEditingId(order.id);
                              setEditTracking(order.tracking_number || '');
                              setEditCarrier(order.carrier || 'yamato');
                              setEditNotes(order.notes || '');
                            }}
                            className="mt-1 text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Edit3 className="w-3 h-3" /> {order.tracking_number ? '追跡番号を変更' : '追跡番号を入力'}
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Quick Actions */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-end">
                        {order.status === 'ordered' && (
                          <button
                            onClick={() => updateSingleOrder(order.id, 'processing')}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1 rounded text-[11px] transition"
                          >
                            準備中にする
                          </button>
                        )}
                        {(order.status === 'ordered' || order.status === 'processing') && (
                          <button
                            onClick={() => {
                              setEditingId(order.id);
                              setEditTracking(order.tracking_number || '');
                              setEditCarrier(order.carrier || 'yamato');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[11px] transition"
                          >
                            発送完了へ
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateSingleOrder(order.id, 'delivered')}
                            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-2.5 py-1 rounded text-[11px] transition"
                          >
                            配達完了にする
                          </button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button
                            onClick={() => {
                              if (window.confirm('この注文をキャンセルしますか？')) {
                                updateSingleOrder(order.id, 'cancelled');
                              }
                            }}
                            className="text-gray-500 hover:text-red-400 text-[10px] underline mt-1"
                          >
                            キャンセル
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
