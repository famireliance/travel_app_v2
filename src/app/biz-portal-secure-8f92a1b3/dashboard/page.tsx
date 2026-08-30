'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Bell, Hotel, CalendarDays, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export default function BizPortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [accommodation, setAccommodation] = useState<any>(null);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0 });

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 自分の宿を取得
      const { data: acc } = await supabase
        .from('accommodations')
        .select('*, islands(name)')
        .eq('owner_id', user.id)
        .limit(1)
        .single();
      
      if (acc) {
        setAccommodation(acc);

        // 予約の集計
        const { data: reservations } = await supabase
          .from('reservations')
          .select('status')
          .eq('accommodation_id', acc.id);
        
        if (reservations) {
          const pending = reservations.filter(r => r.status === 'pending').length;
          const confirmed = reservations.filter(r => r.status === 'confirmed').length;
          setStats({ pending, confirmed });
        }
      }
      setLoading(false);
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  if (!accommodation) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
        <Hotel className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">宿泊施設が登録されていません</h2>
        <p className="text-slate-500 mb-6">運営チームによるオーナー紐付け作業をお待ちください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full mb-3 inline-block">
            {accommodation.plan_tier === 'paid_premium' ? 'プレミアムプラン' : accommodation.plan_tier === 'paid_standard' ? 'スタンダードプラン' : '無料掲載プラン'}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-serif flex items-center gap-2">
            {accommodation.name}
          </h2>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            📍 {accommodation.islands?.name} / 設定モード: <strong className="text-slate-700">{accommodation.booking_mode === 'instant_booking' ? '即時予約(自動確定)' : 'リクエスト承認制'}</strong>
          </p>
        </div>
      </div>

      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">未承認の予約リクエストが {stats.pending} 件あります！</h4>
            <p className="text-xs text-amber-700 mt-1 mb-2">機会損失を防ぐため、早めの確認・承認をお願いします。</p>
            <Link href="/biz-portal-secure-8f92a1b3/reservations" className="text-xs font-bold bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600 transition-colors inline-block">
              予約管理へ移動
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-600">未承認リクエスト</h3>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Bell className="w-4 h-4 text-amber-600" /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-600">確定済み予約</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><CalendarDays className="w-4 h-4 text-emerald-600" /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.confirmed}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl shadow-sm text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-300">本日のアクセス数</h3>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-amber-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white flex items-end gap-2">
            124 <span className="text-sm font-normal text-slate-400 mb-1">PV</span>
          </p>
        </div>
      </div>
    </div>
  );
}
