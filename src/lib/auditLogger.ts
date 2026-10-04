import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export interface AuditActor {
  user_id?: string;
  email?: string;
  name?: string;
  org?: string;
  role?: string;
}

export interface AuditClient {
  ip_address?: string;
  user_agent?: string;
}

export interface AuditTarget {
  resource_type?: string;
  resource_id?: string;
  island_id?: string;
  details?: string;
}

export interface AuditDiff {
  before?: any;
  after?: any;
}

export interface AuditLogEntry {
  id?: string;
  created_at?: string;
  actor: AuditActor;
  client: AuditClient;
  action: string;
  target?: AuditTarget;
  diff?: AuditDiff;
}

// メモリ内フォールバックバッファ（route間で共有するため globalThis に保持）
const g = globalThis as unknown as { __auditBuffer?: AuditLogEntry[] };
const memoryAuditBuffer: AuditLogEntry[] = (g.__auditBuffer ??= []);

/**
 * リクエストからクライアントIPおよびUserAgentを抽出
 */
export function extractClientInfo(req: NextRequest): AuditClient {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || '127.0.0.1');
  const userAgent = req.headers.get('user-agent') || 'Unknown Client';
  return {
    ip_address: ip,
    user_agent: userAgent
  };
}

/**
 * 監査ログを記録（Supabase DB ＋ メモリ内バッファへの追記）
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<AuditLogEntry> {
  const newLog: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
    ...entry
  };

  // 1. メモリバッファへ追記（最新200件）
  memoryAuditBuffer.unshift(newLog);
  if (memoryAuditBuffer.length > 200) {
    memoryAuditBuffer.pop();
  }

  // 2. Supabase DBへの非同期記録（テーブルが存在する場合）
  try {
    if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      await client.from('audit_logs').insert([
        {
          id: newLog.id,
          actor: newLog.actor,
          client: newLog.client,
          action: newLog.action,
          target: newLog.target,
          diff: newLog.diff,
          created_at: newLog.created_at
        }
      ]);
    }
  } catch (err) {
    console.warn('[AuditLogger] Supabase DB audit_logs insert fallback to memory:', err);
  }

  return newLog;
}

/**
 * 監査ログを取得（検索・フィルタリング・ページネーション対応）
 */
export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  action?: string;
  island_id?: string;
  search?: string;
}): Promise<{ data: AuditLogEntry[]; count: number }> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  // Supabase DBから取得試行
  try {
    if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      let query = client.from('audit_logs').select('*', { count: 'exact' });

      if (options?.action && options.action !== 'all') {
        query = query.eq('action', options.action);
      }
      if (options?.island_id) {
        query = query.eq('target->>island_id', options.island_id);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error && data && data.length > 0) {
        return { data: data as AuditLogEntry[], count: count || data.length };
      }
    }
  } catch (err) {
    console.warn('[AuditLogger] Fetch from DB failed, reading memory buffer:', err);
  }

  // メモリバッファからの取得（フォールバック）
  let filtered = [...memoryAuditBuffer];
  if (options?.action && options.action !== 'all') {
    filtered = filtered.filter(l => l.action === options.action);
  }
  if (options?.island_id) {
    filtered = filtered.filter(l => l.target?.island_id === options.island_id);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(l => 
      l.action.toLowerCase().includes(q) ||
      l.actor.email?.toLowerCase().includes(q) ||
      l.actor.name?.toLowerCase().includes(q) ||
      l.target?.details?.toLowerCase().includes(q) ||
      l.client.ip_address?.includes(q)
    );
  }

  const paged = filtered.slice(offset, offset + limit);
  return {
    data: paged,
    count: filtered.length
  };
}
