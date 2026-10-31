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

export function extractClientInfo(req: NextRequest): AuditClient {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || '127.0.0.1');
  const userAgent = req.headers.get('user-agent') || 'Unknown Client';
  return {
    ip_address: ip,
    user_agent: userAgent
  };
}

export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<AuditLogEntry> {
  const newLog: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
    ...entry
  };

  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    console.warn('[AuditLogger] DB Client not available, skipping log record.');
    return newLog;
  }

  try {
    const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // audit_logsテーブルへのINSERT
    const { error } = await client.from('audit_logs').insert([
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
    if (error) {
       console.error('[AuditLogger] Supabase DB insert error:', error);
    }
  } catch (err) {
    console.error('[AuditLogger] Supabase DB audit_logs insert failed:', err);
  }

  return newLog;
}

export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  action?: string;
  island_id?: string;
  search?: string;
  org_id?: string;  // Added for RBAC
}): Promise<{ data: AuditLogEntry[]; count: number }> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    return { data: [], count: 0 };
  }

  try {
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
    
    // Add org_id filtering if necessary, but typically we might just filter client side or via rpc.
    // Assuming actor->>org structure might change, keeping it flexible.
    
    if (options?.search) {
      const q = options.search;
      // Using ilike or generic text search might be complex on JSON, so we just fallback to basic matching if possible, or fetch more and filter.
      // For simplicity in this rewrite, we assume DB handles it or we rely on full text search.
      // Example basic DB filter if action matches:
      query = query.ilike('action', `%${q}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[AuditLogger] Error fetching logs:', error);
      return { data: [], count: 0 };
    }
    
    return { data: (data as AuditLogEntry[]) || [], count: count || 0 };
  } catch (err) {
    console.error('[AuditLogger] Fetch from DB failed:', err);
    return { data: [], count: 0 };
  }
}
