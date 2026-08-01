'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('注文情報が見つかりません');
      setLoading(false);
      return;
    }

    fetch(`/api/order/verify?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setOrderInfo(data);
        }
      })
      .catch(() => setError('注文情報の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 text-white">
        <Loader2 className="animate-spin w-12 h-12 text-blue-300 mb-4" />
        <p className="text-blue-200 text-lg">注文情報を確認中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
        <div className="bg-red-900/40 border border-red-500 rounded-2xl p-8 max-w-md text-center">
          <p className="text-red-300 text-lg mb-4">{error}</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-colors">
            <Home size={18} /> トップに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-900 text-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* 成功アニメーション */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-400 mb-6">
            <CheckCircle2 className="w-14 h-14 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">ご注文ありがとうございます！</h1>
          <p className="text-blue-200">公式到達証明書の発行手続きを開始しました。</p>
        </div>

        {/* 注文詳細 */}
        {orderInfo && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6 space-y-3">
            <h2 className="text-lg font-bold border-b border-white/20 pb-3 mb-4">📋 ご注文内容</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-blue-300">島名</span>
              <span className="font-semibold">{orderInfo.islandName || '—'}</span>
              <span className="text-blue-300">旅人ネーム</span>
              <span className="font-semibold">{orderInfo.travelerName || '—'}</span>
              <span className="text-blue-300">プラン</span>
              <span className="font-semibold">{orderInfo.plan === 'premium' ? 'プレミアム額装版' : 'スタンダード版'}</span>
              <span className="text-blue-300">お支払い金額</span>
              <span className="font-semibold text-green-300">¥{(orderInfo.amount || 0).toLocaleString()}</span>
              <span className="text-blue-300">シリアルNo.</span>
              <span className="font-mono text-xs font-bold text-yellow-300">{orderInfo.serialNumber}</span>
            </div>
          </div>
        )}

        {/* 次のステップ */}
        <div className="bg-blue-900/40 border border-blue-500/40 rounded-2xl p-5 mb-6">
          <h3 className="font-bold mb-2 text-blue-200">📬 今後の流れ</h3>
          <ol className="text-sm text-blue-100 space-y-1 list-decimal list-inside">
            <li>運営が注文内容を確認します（1〜2営業日）</li>
            <li>証明書を印刷・発送します</li>
            <li>お届けまで約3〜5営業日かかります</li>
          </ol>
        </div>

        {/* ボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-colors text-center">
            <Home size={18} /> トップに戻る
          </Link>
          <Link href="/mypage" className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl font-bold transition-colors text-center">
            マイページへ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-blue-950">
        <Loader2 className="animate-spin w-10 h-10 text-white" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
