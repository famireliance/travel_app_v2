import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Package,
  AlertCircle,
  Palmtree,
  BookOpen,
  Sparkles,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Mail
} from 'lucide-react';

interface DashboardProps {
  password: string;
  onNavigateTab: (tab: string) => void;
}

export default function AdminDashboard({ password, onNavigateTab }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/dashboard-stats', {
        headers: { 'x-admin-password': password },
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error(json.error || 'データ取得に失敗しました');
      }
    } catch (err) {
      toast.error('通信エラーが発生しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm font-medium">ダッシュボードデータを読み込み中...</p>
      </div>
    );
  }

  const { summary, recentOrders, recentUsers } = data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-wide">
            <Sparkles className="w-6 h-6 text-amber-400" />
            KIRATABI システム概要ダッシュボード
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            プラットフォームの運用指標・未対応注文・ユーザー登録状況をリアルタイム表示
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardStats}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3.5 py-2 rounded-lg border border-gray-700 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            最新情報に更新
          </button>
        </div>
      </div>

      {/* Urgent Warning Banner for Unshipped Orders */}
      {summary?.unshippedOrders > 0 && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-gray-900 border border-amber-600/50 rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 border border-amber-500/30">
              <Truck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                発送待ちの物理証明書注文が <span className="text-base text-amber-400 font-extrabold underline">{summary.unshippedOrders} 件</span> あります
              </h3>
              <p className="text-xs text-amber-300/80 mt-0.5">
                準備中または未発送の証明書発行注文です。追跡番号を入力して発送完了処理を行ってください。
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2 rounded-lg transition shadow active:scale-95 flex items-center gap-1.5"
          >
            注文管理を開く
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users Card */}
        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">総登録ユーザー</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{summary?.totalUsers || 0}</span>
            <span className="text-xs text-gray-400">名</span>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
            <span>有料プラン会員率</span>
            <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              {summary?.paidPlanRatio || '0'}% ({summary?.paidUsers || 0}名)
            </span>
          </div>
        </div>

        {/* Paid Subscriptions Card */}
        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">有料プラン会員</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 group-hover:scale-110 transition">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-300">{summary?.paidUsers || 0}</span>
            <span className="text-xs text-purple-400/80">名</span>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center text-xs">
            <span className="text-indigo-300">Premium: <strong>{summary?.premiumUsers || 0}</strong></span>
            <span className="text-amber-300">Ultimate: <strong>{summary?.ultimateUsers || 0}</strong></span>
          </div>
        </div>

        {/* Physical Orders Card */}
        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">証明書注文・発送</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 group-hover:scale-110 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{summary?.totalOrders || 0}</span>
            <span className="text-xs text-gray-400">件</span>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center text-xs">
            <span className="text-amber-400 font-bold">未発送: {summary?.unshippedOrders || 0}</span>
            <span className="text-emerald-400">発送済: {summary?.shippedOrders || 0}</span>
          </div>
        </div>

        {/* Estimated Revenue Card */}
        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">売上概要（概算）</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-emerald-400 font-bold">¥</span>
            <span className="text-3xl font-black text-emerald-300">
              {((summary?.physicalOrderRevenue || 0) + (summary?.monthlySubscriptionRevenue || 0)).toLocaleString()}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center text-[11px] text-gray-400">
            <span>物販: ¥{(summary?.physicalOrderRevenue || 0).toLocaleString()}</span>
            <span>月額: ¥{(summary?.monthlySubscriptionRevenue || 0).toLocaleString()}/月</span>
          </div>
        </div>
      </div>

      {/* Platform Secondary Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
            <Palmtree className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">登録離島マスター</p>
            <p className="text-lg font-bold text-white">{summary?.islandCount || 0} <span className="text-xs text-gray-400 font-normal">島</span></p>
          </div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">投稿島日記数</p>
            <p className="text-lg font-bold text-white">{summary?.diaryCount || 0} <span className="text-xs text-gray-400 font-normal">件</span></p>
          </div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">未対応お問い合わせ</p>
            <p className="text-lg font-bold text-amber-300">{summary?.unhandledContacts || 0} <span className="text-xs text-gray-400 font-normal">件</span></p>
          </div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">システム状態</p>
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              正常稼働中
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders List */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                最新の物理証明書注文
              </h3>
              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium underline"
              >
                注文一覧へ <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-gray-900/80 border border-gray-800 rounded-xl p-3.5 flex items-center justify-between hover:border-gray-700 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          order.status === 'shipped' || order.status === 'delivered' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                          order.status === 'processing' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                          order.status === 'ordered' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                          'bg-gray-800 text-gray-400 border-gray-700'
                        }`}>
                          {order.status === 'shipped' ? '発送済' : order.status === 'delivered' ? '完了' : order.status === 'processing' ? '準備中' : order.status === 'ordered' ? '未対応' : order.status}
                        </span>
                        <span className="text-xs font-bold text-white">{order.shipping_name || '名前未登録'}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {order.type} {order.island_id && `(島ID: ${order.island_id})`}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                        {new Date(order.ordered_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => onNavigateTab('orders')}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 transition"
                      >
                        詳細
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-8 text-center">注文履歴がありません</p>
            )}
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                最新登録ユーザー
              </h3>
              <button
                onClick={() => onNavigateTab('user')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium underline"
              >
                ユーザー一覧へ <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentUsers && recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.map((u: any) => (
                  <div
                    key={u.id}
                    className="bg-gray-900/80 border border-gray-800 rounded-xl p-3.5 flex items-center justify-between hover:border-gray-700 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          u.tier === 'ultimate' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                          u.tier === 'premium' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                          'bg-gray-800 text-gray-400 border-gray-700'
                        }`}>
                          {u.tier === 'ultimate' ? '👑 Ultimate' : u.tier === 'premium' ? '⭐ Premium' : 'Free'}
                        </span>
                        <span className="text-xs font-bold text-white font-mono">{u.email}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">
                        登録: {new Date(u.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateTab('user')}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 transition"
                    >
                      管理
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-8 text-center">登録ユーザーがありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
