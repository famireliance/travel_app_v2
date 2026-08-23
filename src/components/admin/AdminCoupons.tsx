import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AdminCoupons({ password }: { password: string }) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.ok) setCoupons(data.coupons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) {
      toast.error('コードと割引額（率）を入力してください');
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading('クーポンを作成中...');
    
    try {
      const payload: any = { code };
      if (discountType === 'percent') {
        payload.percent_off = discountValue;
      } else {
        payload.amount_off = discountValue;
      }

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('クーポンを作成しました', { id: toastId });
      setCode('');
      setDiscountValue('');
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || '作成に失敗しました', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-white">読み込み中...</div>;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-amber-400">🎟️ クーポン管理</h3>
      
      <div className="bg-gray-900 p-4 rounded-lg mb-6 border border-gray-700">
        <h4 className="text-sm font-bold text-white mb-3">新規クーポン発行</h4>
        <form onSubmit={handleCreateCoupon} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">クーポンコード（例: SUMMER2026）</label>
            <input 
              type="text" 
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              placeholder="大文字英数字"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">割引タイプ</label>
              <select 
                value={discountType} 
                onChange={e => setDiscountType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              >
                <option value="percent">割引率（%）</option>
                <option value="amount">割引額（円）</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">値</label>
              <input 
                type="number" 
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                placeholder={discountType === 'percent' ? '例: 100 (100%無料)' : '例: 500 (500円引き)'}
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded text-sm disabled:opacity-50"
          >
            発行する
          </button>
        </form>
      </div>

      <h4 className="text-sm font-bold text-gray-300 mb-3">発行済みクーポン一覧</h4>
      {coupons.length === 0 ? (
        <p className="text-gray-400 text-sm">クーポンはありません。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700 text-gray-200">
              <tr>
                <th className="p-3 rounded-tl-lg">コード</th>
                <th className="p-3">割引内容</th>
                <th className="p-3">ステータス</th>
                <th className="p-3 rounded-tr-lg">作成日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-gray-750">
                  <td className="p-3 font-bold text-white tracking-widest">{c.code}</td>
                  <td className="p-3">
                    {c.coupon.percent_off ? `${c.coupon.percent_off}% OFF` : `¥${c.coupon.amount_off} OFF`}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${c.active ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>
                      {c.active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="p-3">
                    {new Date(c.created * 1000).toLocaleDateString('ja-JP')}
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
