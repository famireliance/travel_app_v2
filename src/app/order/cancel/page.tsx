'use client';

import Link from 'next/link';
import { XCircle, Home, RefreshCw } from 'lucide-react';

export default function OrderCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400 mb-6">
          <XCircle className="w-12 h-12 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3">決済をキャンセルしました</h1>
        <p className="text-slate-300 mb-8">
          お支払いはキャンセルされました。<br />
          注文は確定されていません。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-colors">
            <Home size={18} /> トップに戻る
          </Link>
          <Link href="/mypage" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl font-bold transition-colors">
            <RefreshCw size={18} /> もう一度試す
          </Link>
        </div>
      </div>
    </div>
  );
}
