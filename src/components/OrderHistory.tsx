import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, MapPin, Edit3, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState({
    shipping_name: '',
    shipping_postal_code: '',
    shipping_address: '',
    shipping_phone: ''
  });

  const fetchOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleEditClick = (order: any) => {
    setEditingOrderId(order.id);
    setEditForm({
      shipping_name: order.shipping_name || '',
      shipping_postal_code: order.shipping_postal_code || '',
      shipping_address: order.shipping_address || '',
      shipping_phone: order.shipping_phone || ''
    });
  };

  const handleSave = async (orderId: string) => {
    const toastId = toast.loading('更新中...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ id: orderId, ...editForm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('配送先を更新しました', { id: toastId });
      setEditingOrderId(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || '更新に失敗しました', { id: toastId });
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">読み込み中...</div>;

  if (orders.length === 0) return (
    <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center">
      <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-slate-800 mb-2">注文履歴はありません</h3>
      <p className="text-sm text-slate-500">1周年記念の実物証明書などを申請するとここに表示されます。</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {order.status === 'ordered' ? '注文確認済' : 
                   order.status === 'processing' ? '発送準備中' : 
                   order.status === 'shipped' ? '発送済' : '配達完了'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(order.ordered_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 mb-4">
                {order.type === 'anniversary' ? '1周年記念 リアル証明書' : '公式到達証明書'} 
                {order.island_id && ` (${order.island_id})`}
              </h4>

              {editingOrderId === order.id ? (
                <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
                  <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-2"><MapPin size={14}/> 配送先情報の編集</h5>
                  <input className="w-full text-sm p-2 border rounded" placeholder="宛名" value={editForm.shipping_name} onChange={e => setEditForm({...editForm, shipping_name: e.target.value})} />
                  <input className="w-full text-sm p-2 border rounded" placeholder="郵便番号" value={editForm.shipping_postal_code} onChange={e => setEditForm({...editForm, shipping_postal_code: e.target.value})} />
                  <input className="w-full text-sm p-2 border rounded" placeholder="住所" value={editForm.shipping_address} onChange={e => setEditForm({...editForm, shipping_address: e.target.value})} />
                  <input className="w-full text-sm p-2 border rounded" placeholder="電話番号" value={editForm.shipping_phone} onChange={e => setEditForm({...editForm, shipping_phone: e.target.value})} />
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleSave(order.id)} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg flex justify-center items-center gap-1"><Check size={14}/> 保存</button>
                    <button onClick={() => setEditingOrderId(null)} className="flex-1 bg-slate-300 text-slate-700 text-xs font-bold py-2 rounded-lg">キャンセル</button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1"><MapPin size={14}/> 配送先</h5>
                    {(order.status === 'ordered' || order.status === 'processing') ? (
                      <button onClick={() => handleEditClick(order)} className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1">
                        <Edit3 size={12}/> 変更する
                      </button>
                    ) : (
                      <span className="text-xs text-red-500 font-bold">発送完了のため変更不可</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-800">〒{order.shipping_postal_code}</p>
                  <p className="text-sm text-slate-800">{order.shipping_address}</p>
                  <p className="text-sm text-slate-800 mt-1">{order.shipping_name} 様</p>
                  {order.shipping_phone && <p className="text-xs text-slate-500 mt-1">TEL: {order.shipping_phone}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
