'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Building,
  Award,
  Users,
  MapPin,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

interface AdminAnalyticsProps {
  password?: string;
}

interface DashboardSummary {
  totalUsers: number;
  paidUsers: number;
  premiumUsers: number;
  ultimateUsers: number;
  freeUsers: number;
  paidPlanRatio: string;
  totalOrders: number;
  unshippedOrders: number;
  pendingPaymentOrders: number;
  shippedOrders: number;
  physicalOrderRevenue: number;
  monthlySubscriptionRevenue: number;
  islandCount: number;
  diaryCount: number;
  visitCount: number;
  certificateCount: number;
  unhandledContacts: number;
}

export default function AdminAnalytics({ password }: AdminAnalyticsProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [loadingStats, setLoadingStats] = useState(false);
  const [liveSummary, setLiveSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchStats = async () => {
    const token =
      password || (typeof window !== 'undefined' ? sessionStorage.getItem('admin_password') || '' : '');
    if (!token) return;
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/dashboard-stats', {
        headers: { 'x-admin-password': token },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.summary) {
          setLiveSummary(data.summary);
        }
        if (Array.isArray(data?.recentOrders)) {
          setRecentOrders(data.recentOrders);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [password]);

  // 主要自治体・地域の定義
  const PREFECTURE_REGIONS = [
    { id: 'all', label: '全国（全離島）' },
    { id: '沖縄県', label: '沖縄県（八重山・宮古・本島周辺）' },
    { id: '東京都', label: '東京都（伊豆諸島・小笠原諸島）' },
    { id: '鹿児島県', label: '鹿児島県（奄美群島・トカラ・甑島・種屋久）' },
    { id: '長崎県', label: '長崎県（五島列島・壱岐・対馬）' },
    { id: '香川県', label: '香川県・瀬戸内海諸島' },
    { id: '新潟県', label: '新潟県（佐渡島・粟島）' },
    { id: '島根県', label: '島根県（隠岐諸島）' },
  ];

  // 実マスター辞書から対象地域の離島一覧を取得（架空データのハードコードを完全排除）
  const allMasterIslands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY);
  const filteredMasterIslands =
    selectedRegion === 'all'
      ? allMasterIslands
      : allMasterIslands.filter((isl: any) => String(isl?.prefecture || '') === selectedRegion);

  // 実注文データから島ごとの注文数を集計
  const orderCountByIslandId = new Map<string, number>();
  for (const ord of recentOrders) {
    const iid = String(ord?.island_id || '').trim();
    if (!iid || ord?.status === 'cancelled') continue;
    orderCountByIslandId.set(iid, (orderCountByIslandId.get(iid) || 0) + 1);
  }

  const displayIslands = [...filteredMasterIslands]
    .sort((a: any, b: any) => {
      const oa = orderCountByIslandId.get(String(a.id)) || 0;
      const ob = orderCountByIslandId.get(String(b.id)) || 0;
      if (ob !== oa) return ob - oa;
      return (Number(b.points) || 0) - (Number(a.points) || 0);
    })
    .slice(0, 15)
    .map((isl: any) => ({
      id: String(isl.id),
      name: String(isl.name || ''),
      prefecture: String(isl.prefecture || ''),
      difficulty: String(isl.difficulty || '-'),
      points: Number(isl.points) || 0,
      recentOrderCount: orderCountByIslandId.get(String(isl.id)) || 0,
    }));

  const totalVisitsReal = liveSummary?.visitCount ?? 0;
  const certIssuedReal = liveSummary?.certificateCount ?? 0;
  const totalOrdersReal = liveSummary?.totalOrders ?? 0;
  const targetIslandCount =
    selectedRegion === 'all'
      ? liveSummary?.islandCount || allMasterIslands.length
      : filteredMasterIslands.length;
  const totalPlatformRevenue =
    (liveSummary?.physicalOrderRevenue ?? 0) + (liveSummary?.monthlySubscriptionRevenue ?? 0);

  // CSVエクスポート処理（実集計データのみ出力）
  const handleExportCSV = () => {
    const regionLabel = PREFECTURE_REGIONS.find(r => r.id === selectedRegion)?.label || selectedRegion;
    const summaryHeaders = ['集計項目', '実績値', '備考'];
    const summaryRows = [
      ['総登録ユーザー数', liveSummary?.totalUsers ?? 0, '集計データ取得済'],
      ['有料プラン会員数', liveSummary?.paidUsers ?? 0, `Premium: ${liveSummary?.premiumUsers ?? 0} / Ultimate: ${liveSummary?.ultimateUsers ?? 0}`],
      ['累計離島到達記録数', totalVisitsReal, '実データベース集計値'],
      ['デジタル証明書発行数', certIssuedReal, '実データベース集計値'],
      ['実物証明書オーダー数', totalOrdersReal, `発送済: ${liveSummary?.shippedOrders ?? 0}`],
      ['旅日記投稿数', liveSummary?.diaryCount ?? 0, '実データベース集計値'],
      ['集計対象離島数', targetIslandCount, regionLabel],
    ];

    const islandHeaders = ['島ID', '島名', '都道府県', '到達難易度', '設定ポイント', '直近注文数'];
    const islandRows = displayIslands.map(item => [
      item.id,
      item.name,
      item.prefecture,
      item.difficulty,
      item.points,
      item.recentOrderCount,
    ]);

    const csvContent =
      '\uFEFF' +
      [summaryHeaders, ...summaryRows, [], islandHeaders, ...islandRows]
        .map(e => e.join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KIRATABI_観光動態レポート_${selectedRegion}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`📊 ${regionLabel}の実績集計CSVをエクスポートしました！`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 印刷専用スタイル（A4縦・余白設定） */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-analytics-report, #printable-analytics-report * {
            visibility: visible !important;
          }
          #printable-analytics-report {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      {/* Control Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            自治体・観光協会向け 到達実績アナリティクス
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            各島・地域の訪問者動態と公式証明書の発行実績を集計し、行政提出用レポート（PDF/CSV）を出力できます。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* 地域セレクタ */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold"
          >
            {PREFECTURE_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono"
          />

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition"
          >
            <FileSpreadsheet className="w-4 h-4" /> CSV出力
          </button>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md transition"
          >
            <Printer className="w-4 h-4" /> A4レポート印刷
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">累計到達記録数</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {totalVisitsReal.toLocaleString()} <span className="text-xs font-normal text-slate-400">人・回</span>
          </p>
          <span className="text-[11px] text-emerald-400 font-bold mt-1 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {liveSummary ? '集計データ取得済' : loadingStats ? '集計中...' : '実DB連携待機中'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">公式証明書 発行枚数</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {certIssuedReal.toLocaleString()} <span className="text-xs font-normal text-slate-400">枚</span>
          </p>
          <span className="text-[11px] text-amber-400 font-bold mt-1 inline-block">
            実物オーダー: {totalOrdersReal.toLocaleString()}件 / 発行率:{' '}
            {totalVisitsReal > 0 ? ((certIssuedReal / totalVisitsReal) * 100).toFixed(1) : '0.0'}%
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">集計対象離島数</span>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {targetIslandCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">島</span>
          </p>
          <span className="text-[11px] text-slate-400 font-bold mt-1 inline-block">
            {selectedRegion === 'all' ? '全国有人離島マスター網羅' : `${selectedRegion}管内マスター登録数`}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">プラットフォーム実績売上・月次収益</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">¥{totalPlatformRevenue.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400 font-bold mt-1 inline-block">
            登録会員: {(liveSummary?.totalUsers ?? 0).toLocaleString()}名 / 日記: {(liveSummary?.diaryCount ?? 0).toLocaleString()}件
          </span>
        </div>
      </div>

      {/* Real Database Island Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            管轄離島マスター ＆ 直近証明書オーダー実績（{selectedRegion === 'all' ? '全国主要離島' : `${selectedRegion}管内`}）
          </span>
          <span className="text-xs text-slate-400 font-normal flex items-center gap-2">
            <span>対象月: {selectedMonth}</span>
            <button
              type="button"
              onClick={fetchStats}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="最新データに再集計"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
            </button>
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">No.</th>
                <th className="py-3 px-4">島名</th>
                <th className="py-3 px-4">都道府県</th>
                <th className="py-3 px-4">到達難易度</th>
                <th className="py-3 px-4 text-right">制覇ポイント</th>
                <th className="py-3 px-4 text-right">直近証明書注文数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {displayIslands.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-bold text-amber-400">#{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-white">{row.name}</td>
                  <td className="py-3 px-4 text-slate-400">{row.prefecture}</td>
                  <td className="py-3 px-4 text-slate-300">{row.difficulty}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">{row.points} pt</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-300 font-bold">{row.recentOrderCount} 件</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          ※ 集計データ取得済：`/api/admin/dashboard-stats` の実データベース集計値および離島マスターを表示しています。
        </p>
      </div>

      {/* Printable Sheet (印刷時にのみ展開されるA4フォーマット) */}
      <div id="printable-analytics-report" className="hidden">
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Official Tourism &amp; Inbound Dynamics Report
              </p>
              <h1 className="text-2xl font-black text-slate-900 tracking-wide">
                離島観光客動態・公式到達証明 発行実績報告書
              </h1>
              <p className="text-xs font-bold text-blue-600 mt-1">
                対象自治体・地域: {PREFECTURE_REGIONS.find(r => r.id === selectedRegion)?.label || selectedRegion}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-700 block">対象年月: {selectedMonth}</span>
              <span className="text-xs text-slate-500">発行元: 輝旅 島専科 事務局</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-800 border-l-4 border-blue-600 pl-2 mb-3">1. 全体概況サマリー（実データベース集計）</h2>
          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div>
              <span className="text-xs text-slate-500 block">累計総到達記録数</span>
              <span className="text-xl font-bold text-slate-900">{totalVisitsReal.toLocaleString()} 人・回</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">公式証明書発行数</span>
              <span className="text-xl font-bold text-blue-600">{certIssuedReal.toLocaleString()} 枚</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">対象離島数</span>
              <span className="text-xl font-bold text-slate-900">{targetIslandCount.toLocaleString()} 島</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">実物オーダー・月次収益</span>
              <span className="text-xl font-bold text-emerald-600">¥{totalPlatformRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-800 border-l-4 border-blue-600 pl-2 mb-3">2. 管轄対象離島マスター内訳</h2>
          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300">No.</th>
                <th className="p-2 border-r border-slate-300">島名</th>
                <th className="p-2 border-r border-slate-300">自治体</th>
                <th className="p-2 border-r border-slate-300">難易度</th>
                <th className="p-2 border-r border-slate-300 text-right">ポイント</th>
                <th className="p-2 text-right">直近証明書注文数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayIslands.map((it, i) => (
                <tr key={it.id}>
                  <td className="p-2 border-r border-slate-200 font-bold">#{i + 1}</td>
                  <td className="p-2 border-r border-slate-200 font-bold">{it.name}</td>
                  <td className="p-2 border-r border-slate-200">{it.prefecture}</td>
                  <td className="p-2 border-r border-slate-200">{it.difficulty}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono">{it.points} pt</td>
                  <td className="p-2 text-right font-mono">{it.recentOrderCount} 件</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-300 text-[10px] text-slate-500 flex justify-between items-center">
          <span>※ 集計データ取得済：本数値は「輝旅 島専科」の実データベース（到達記録・証明書発行・注文履歴）に基づき出力されています。</span>
          <span>輝旅 島専科 (island.kira-tabi.com)</span>
        </div>
      </div>
    </div>
  );
}
