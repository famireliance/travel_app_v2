import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AdminOrders({ password }: { password: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!window.confirm(`ステータスを「${newStatus}」に変更しますか？`)) return;
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        toast.success('ステータスを更新しました');
        fetchOrders();
      } else {
        toast.error('更新に失敗しました');
      }
    } catch (err) {
      toast.error('エラーが発生しました');
    }
  };

  if (loading) return <div className="p-4 text-white">読み込み中...</div>;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-amber-400">📦 実物証明書 注文管理</h3>
      {orders.length === 0 ? (
        <p className="text-gray-400 text-sm">注文はありません。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700 text-gray-200">
              <tr>
                <th className="p-3 rounded-tl-lg">注文日時</th>
                <th className="p-3">種類</th>
                <th className="p-3">配送先</th>
                <th className="p-3">ステータス</th>
                <th className="p-3 rounded-tr-lg">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-750">
                  <td className="p-3">{new Date(order.ordered_at).toLocaleString('ja-JP')}</td>
                  <td className="p-3 font-bold">{order.type} {order.island_id && `(${order.island_id})`}</td>
                  <td className="p-3">
                    <p>{order.shipping_name}</p>
                    <p className="text-xs text-gray-400">〒{order.shipping_postal_code} {order.shipping_address}</p>
                    <p className="text-xs text-gray-400">{order.shipping_phone}</p>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      order.status === 'shipped' ? 'bg-green-900 text-green-300' :
                      order.status === 'delivered' ? 'bg-blue-900 text-blue-300' :
                      'bg-amber-900 text-amber-300'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    {order.status === 'ordered' && (
                      <button onClick={() => updateStatus(order.id, 'processing')} className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs">準備中へ</button>
                    )}
                    {(order.status === 'ordered' || order.status === 'processing') && (
                      <button onClick={() => updateStatus(order.id, 'shipped')} className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs">発送済にする</button>
                    )}
                    {order.status === 'shipped' && (
                      <button onClick={() => updateStatus(order.id, 'delivered')} className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs">配達完了</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
