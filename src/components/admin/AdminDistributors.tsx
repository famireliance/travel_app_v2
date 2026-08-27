import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Store,
  QrCode,
  Plus,
  Copy,
  Check,
  Download
} from 'lucide-react';

interface DistributorStore {
  id?: string;
  shop_name: string;
  island_id: string;
  referral_code: string;
  commission_rate: number;
  contact_person?: string;
  email?: string;
  phone?: string;
  total_sales_count: number;
  total_revenue: number;
  accumulated_commission: number;
  created_at: string;
}

export default function AdminDistributors({ password }: { password: string }) {
  const [stores, setStores] = useState<DistributorStore[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [shopName, setShopName] = useState('');
  const [islandId, setIslandId] = useState('ishigaki');
  const [commissionRate, setCommissionRate] = useState<number>(15);
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [qrModalStore, setQrModalStore] = useState<DistributorStore | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/distributors', {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.ok) {
        setStores(data.stores || []);
      } else {
        toast.error(data.error || '加盟店データの取得に失敗しました');
      }
    } catch (err) {
      toast.error('店舗データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('手数料率は0～100%の間で指定してください');
      return;
    }
    try {
      const res = await fetch('/api/admin/distributors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          shop_name: shopName,
          island_id: islandId,
          commission_rate: rate,
          contact_person: contactPerson,
          email,
          phone
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '加盟店舗を登録しました');
      setShopName('');
      setIslandId('ishigaki');
      setCommissionRate(15);
      setContactPerson('');
      setEmail('');
      setPhone('');
      fetchStores();
    } catch (err: any) {
      toast.error(`登録エラー: ${err.message}`);
    }
  };

  const getStoreUrl = (store: DistributorStore) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://island.kira-tabi.com';
    return `${origin}/island/${store.island_id}?ref_store=${store.referral_code}`;
  };

  const handleCopyLink = async (store: DistributorStore) => {
    try {
      await navigator.clipboard.writeText(getStoreUrl(store));
      setCopiedCode(store.referral_code);
      toast.success('店舗用専用注文URLをコピーしました');
      setTimeout(() => setCopiedCode(null), 2500);
    } catch (err) {
      toast.error('クリップボードへのコピーに失敗しました');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-400" />
            島の土産店・加盟店パートナー（販売手数料還元システム）
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            島内の売店やカフェに店頭用QRコードを設置してもらい、証明書・グッズ販売実績に応じた手数料（例: 15%）を提示還元するシステム
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <Plus className="w-4 h-4 text-amber-400" />
            新規販売加盟店を登録
          </h3>

          <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-bold">店舗名 (必須)</label>
              <input
                required
                type="text"
                placeholder="例: あざみ屋 石垣港店"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-bold">対象の島ID</label>
              <input
                required
                type="text"
                placeholder="ishigaki"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono"
                value={islandId}
                onChange={e => setIslandId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-bold">販売還元手数料率 (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-bold"
                  value={commissionRate}
                  onChange={e => setCommissionRate(Number(e.target.value))}
                />
                <span className="text-gray-400 font-bold">%</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">担当者名</label>
              <input
                type="text"
                placeholder="例: 田中 店長"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">連絡先メール</label>
              <input
                type="email"
                placeholder="store@example.com"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-xl transition shadow active:scale-95 mt-2"
            >
              加盟店として登録＆QR生成
            </button>
          </form>
        </div>

        {/* Stores List */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-gray-800 pb-3">
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" />
              登録加盟店一覧 ({stores.length}店舗)
            </span>
          </h3>

          {loading ? (
            <p className="text-xs text-gray-400 py-8 text-center">読み込み中...</p>
          ) : stores.length === 0 ? (
            <p className="text-xs text-gray-500 py-8 text-center">登録加盟店はありません。</p>
          ) : (
            <div className="space-y-3">
              {stores.map(st => (
                <div key={st.referral_code} className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-amber-950 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-800 font-mono">
                        {st.referral_code}
                      </span>
                      <span className="text-xs font-bold text-white">{st.shop_name}</span>
                      <span className="text-[10px] text-gray-400">({st.island_id})</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      還元率: <strong className="text-amber-400">{st.commission_rate}%</strong> | 累計売上: ¥{(st.total_revenue || 0).toLocaleString()} | 還元額: <strong className="text-emerald-400">¥{(st.accumulated_commission || 0).toLocaleString()}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setQrModalStore(st)}
                      className="bg-gray-800 hover:bg-gray-700 text-amber-400 border border-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" /> 店頭QRコード
                    </button>

                    <button
                      onClick={() => handleCopyLink(st)}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      title="店舗用URLをコピー"
                    >
                      {copiedCode === st.referral_code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Preview Modal */}
      {qrModalStore && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6 text-white text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <QrCode className="w-5 h-5" /> 店頭POP用 QRコード
              </h3>
              <button onClick={() => setQrModalStore(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-white">{qrModalStore.shop_name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">紹介コード: {qrModalStore.referral_code}</p>
            </div>

            {/* Generated QR Placeholder Image */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getStoreUrl(qrModalStore))}`}
                alt="Store QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              このQRコードを店舗のレジ前POPや卓上スタンドに掲示してください。旅行者がスマホでスキャンして注文すると、販売手数料が自動記録されます。
            </p>

            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(getStoreUrl(qrModalStore))}`}
              download={`QR_${qrModalStore.referral_code}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-gray-700 transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              高解像QR画像をダウンロード
            </a>

            <button
              onClick={() => setQrModalStore(null)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2.5 rounded-xl text-xs transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
