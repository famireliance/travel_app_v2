'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Building } from 'lucide-react';
import StayDetailPage from '@/app/stay/[id]/page';

export default function DemoStayPage() {
  return (
    <div className="relative min-h-screen">
      {/* 事業者向け案内バナー（営業デモ用） */}
      <div className="bg-gradient-to-r from-amber-600 via-indigo-900 to-slate-900 text-white px-4 py-3 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded text-xs tracking-wider uppercase">
              Demo Page
            </span>
            <span className="font-medium text-amber-100">
              【宿泊事業者様向け】KIRATABI公式提携・特選宿LPの掲載イメージ見本です
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 bg-white text-slate-900 font-bold px-3 py-1 rounded-full hover:bg-amber-100 transition shadow-sm text-xs"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              掲載・パートナー申請はこちら
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 実際の宿LPコンポーネントをデモ用モードでマウント */}
      <StayDetailPage demoMode={true} />
    </div>
  );
}
