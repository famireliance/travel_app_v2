'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Bell, Hotel, CalendarDays, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getBizBasePath } from '@/lib/bizPortalPath';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

export default function BizPortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [accommodation, setAccommodation] = useState<any>(null);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, todayPv: 0 });

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setLoading(false);
          return;
        }

        // Primary: load via B2B API (supports super_admin fallback, reservations, and tracking_events PV)
        const resp = await fetch('/api/b2b/reservations', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (resp.ok) {
          const json = await resp.json();
          if (json.accommodation) {
            setAccommodation(json.accommodation);
            const resList = Array.isArray(json.reservations) ? json.reservations : [];
            const pending = resList.filter((r: any) => r.status === 'pending').length;
            const confirmed = resList.filter((r: any) => r.status === 'confirmed').length;
            const todayPv = typeof json.todayPv === 'number' ? json.todayPv : 0;
            setStats({ pending, confirmed, todayPv });
          }
          setLoading(false);
          return;
        }

        // Fallback client query using .maybeSingle() + super_admin fallback + ALL_ISLANDS_MASTER_DICTIONARY
        const user = session.user;
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        let { data: acc } = await supabase
          .from('accommodations')
          .select('*')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle();

        if (!acc && profile?.role === 'super_admin') {
          const { data: fallbackAcc } = await supabase
            .from('accommodations')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          acc = fallbackAcc;
        }

        if (acc) {
          setAccommodation(acc);

          const { data: reservations } = await supabase
            .from('reservations')
            .select('status')
            .eq('accommodation_id', acc.id);

          const pending = (reservations || []).filter((r) => r.status === 'pending').length;
          const confirmed = (reservations || []).filter((r) => r.status === 'confirmed').length;

          let todayPv = 0;
          try {
            const now = new Date();
            const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
            const startIso = new Date(
              `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, '0')}-${String(jst.getUTCDate()).padStart(2, '0')}T00:00:00+09:00`
            ).toISOString();

            const { count, error: pvErr } = await supabase
              .from('tracking_events')
              .select('id', { count: 'exact', head: true })
              .eq('facility_id', String(acc.id))
              .gte('created_at', startIso);

            if (!pvErr && typeof count === 'number') {
              todayPv = count;
            }
          } catch {
            todayPv = 0;
          }

          setStats({ pending, confirmed, todayPv });
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
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

  const resolvedIslandName =
    accommodation.island_name ||
    ALL_ISLANDS_MASTER_DICTIONARY[String(accommodation.island_id || '').trim()]?.name ||
    '離島';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full mb-3 inline-block">
            {accommodation.plan_tier === 'paid_premium'
              ? 'プレミアムプラン'
              : accommodation.plan_tier === 'paid_standard'
                ? 'スタンダードプラン'
                : '無料掲載プラン'}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-serif flex items-center gap-2">
            {accommodation.name}
          </h2>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            📍 {resolvedIslandName} / 設定モード:{' '}
            <strong className="text-slate-700">
              {accommodation.booking_mode === 'instant_booking'
                ? '即時予約(自動確定)'
                : 'リクエスト承認制'}
            </strong>
          </p>
        </div>
      </div>

      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              未承認の予約リクエストが {stats.pending} 件あります！
            </h4>
            <p className="text-xs text-amber-700 mt-1 mb-2">
              機会損失を防ぐため、早めの確認・承認をお願いします。
            </p>
            <Link
              href={`${getBizBasePath()}/reservations`}
              className="text-xs font-bold bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600 transition-colors inline-block"
            >
              予約管理へ移動
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-600">未承認リクエスト</h3>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-600">確定済み予約</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.confirmed}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl shadow-sm text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-300">本日のアクセス数</h3>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white flex items-end gap-2">
            {stats.todayPv} <span className="text-sm font-normal text-slate-400 mb-1">PV</span>
          </p>
        </div>
      </div>
    </div>
  );
}
