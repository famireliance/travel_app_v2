'use client';

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  ShieldAlert, RefreshCw, Filter, Search, Clock, 
  User, Globe, ChevronDown, ChevronRight, FileCode, ArrowRight, ShieldCheck
} from 'lucide-react';
import type { AuditLogEntry } from '@/lib/auditLogger';

interface AdminAuditLogsProps {
  password: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  WIFI_SPOT_CREATE: { label: 'Wi-Fi新規登録', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  WIFI_SPOT_UPDATE: { label: 'Wi-Fi情報更新', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  WIFI_SPOT_DELETE: { label: 'Wi-Fi削除', color: 'bg-red-50 text-red-700 border-red-200' },
  CELL_NOTE_UPDATE: { label: '電波目安更新', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ISLAND_UPDATE: { label: '島情報更新', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  LOGIN: { label: '管理者ログイン', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  CUSTOM_ADMIN_ACTION: { label: '管理操作', color: 'bg-slate-100 text-slate-700 border-slate-300' }
};

export default function AdminAuditLogs({ password }: AdminAuditLogsProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (actionFilter !== 'all') query.set('action', actionFilter);
      if (search) query.set('search', search);

      const res = await fetch(`/api/admin/audit-logs?${query.toString()}`, {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLogs(data.data || []);
      setTotalCount(data.count || 0);
    } catch (err: any) {
      toast.error(`ログ取得に失敗しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [password, actionFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* 監査ログ説明ヘッダー */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                IMMUTABLE AUDIT TRAIL // 操作監査証跡
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                改ざん防止・追記専用
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-0.5">
              全管理者 操作履歴・監査タイムライン
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              「いつ・誰が・どこから（IP/端末）・何の操作を行い・どうデータが変わったか」をミリ秒単位で完全記録・可視化します。
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>ログ再読込</span>
        </button>
      </div>

      {/* 検索・フィルターバー */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="操作者名、IP、島ID、内容で検索..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">全アクション（{totalCount}件）</option>
            <option value="WIFI_SPOT_CREATE">Wi-Fi新規登録</option>
            <option value="WIFI_SPOT_UPDATE">Wi-Fi情報更新</option>
            <option value="WIFI_SPOT_DELETE">Wi-Fi削除</option>
            <option value="CELL_NOTE_UPDATE">電波目安更新</option>
          </select>
        </div>
      </div>

      {/* タイムライン一覧 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">ログを読み込み中...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            記録された監査ログはありません。
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const actionMeta = ACTION_LABELS[log.action] || {
                label: log.action,
                color: 'bg-slate-100 text-slate-700 border-slate-300'
              };
              const isExpanded = expandedLogId === log.id;

              return (
                <div key={log.id} className="p-5 hover:bg-slate-50/50 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border shrink-0 mt-0.5 ${actionMeta.color}`}>
                        {actionMeta.label}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 leading-snug">
                          {log.target?.details || log.action}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {log.actor.name || 'Admin'}
                            {log.actor.org && (
                              <span className="text-[10px] text-slate-400">（{log.actor.org}）</span>
                            )}
                          </span>

                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                            <Globe className="w-3.5 h-3.5" />
                            {log.client.ip_address}
                          </span>

                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            {log.created_at ? new Date(log.created_at).toLocaleString('ja-JP') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 詳細展開ボタン */}
                    {log.diff && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : (log.id || null))}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 shrink-0 self-start md:self-auto cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isExpanded ? '差分を閉じる' : '変更前後の差分を見る'}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* 変更前後のJSON差分インスペクター */}
                  {isExpanded && log.diff && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 text-xs font-mono space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                        <span>変更差分インスペクター (Audit Diff)</span>
                        <span>Client: {log.client.user_agent}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.diff.before && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                              ◀ 変更前 (Before)
                            </span>
                            <pre className="p-3 rounded-lg bg-slate-900 border border-red-950/60 overflow-x-auto text-[11px] text-red-200/90 max-h-48">
                              {JSON.stringify(log.diff.before, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.diff.after && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                              ▶ 変更後 (After)
                            </span>
                            <pre className="p-3 rounded-lg bg-slate-900 border border-emerald-950/60 overflow-x-auto text-[11px] text-emerald-200/90 max-h-48">
                              {JSON.stringify(log.diff.after, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
