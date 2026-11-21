import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const FALLBACK_AUDIT_KEY = 'fallback_audit_logs';
const MAX_FALLBACK_LOGS = 300;

export interface AuditActor {
  user_id?: string;
  email?: string;
  name?: string;
  org?: string;
  org_id?: string;
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

function getDbClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url || key.startsWith('REPLACE')) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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

async function persistFallbackAuditLog(newLog: AuditLogEntry): Promise<void> {
  const existing = await getFallbackJson<AuditLogEntry[]>(FALLBACK_AUDIT_KEY, []);
  const list = Array.isArray(existing) ? existing : [];
  const updated = [newLog, ...list].slice(0, MAX_FALLBACK_LOGS);
  await setFallbackJson(FALLBACK_AUDIT_KEY, updated);
}

export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<AuditLogEntry> {
  const newLog: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
    ...entry
  };

  const client = getDbClient();
  if (!client) {
    return newLog;
  }

  try {
    const { error } = await client.from('admin_audit_logs').insert([
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
      await persistFallbackAuditLog(newLog);
    }
  } catch {
    await persistFallbackAuditLog(newLog);
  }

  return newLog;
}

export const logAdminAction = logAuditEvent;

function filterAuditLogEntries(
  entries: AuditLogEntry[],
  options?: {
    action?: string;
    island_id?: string;
    search?: string;
    org_id?: string;
    org_name?: string;
  }
): AuditLogEntry[] {
  const actionFilter = options?.action && options.action !== 'all' ? options.action : undefined;
  const islandFilter = options?.island_id?.trim().toLowerCase();
  const searchQuery = options?.search?.trim().toLowerCase();
  const orgIdFilter = options?.org_id;
  const orgNameFilter = options?.org_name;

  return entries.filter((log) => {
    if (actionFilter) {
      const isCellNoteFilter =
        actionFilter === 'WIFI_CELL_NOTE_UPDATE' || actionFilter === 'CELL_NOTE_UPDATE';
      if (isCellNoteFilter) {
        if (log.action !== 'WIFI_CELL_NOTE_UPDATE' && log.action !== 'CELL_NOTE_UPDATE') {
          return false;
        }
      } else if (log.action !== actionFilter) {
        return false;
      }
    }

    if (islandFilter) {
      const targetIsland = String(log.target?.island_id || '').toLowerCase();
      if (targetIsland !== islandFilter) return false;
    }

    if (orgIdFilter) {
      if (log.actor?.org_id) {
        if (log.actor.org_id !== orgIdFilter) return false;
      } else if (orgNameFilter) {
        if (log.actor?.org !== orgNameFilter) return false;
      } else {
        return false;
      }
    }

    if (searchQuery) {
      const haystack = [
        log.action,
        log.actor?.name,
        log.actor?.email,
        log.actor?.org,
        log.client?.ip_address,
        log.target?.details,
        log.target?.island_id,
        log.target?.resource_id,
        log.target?.resource_type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(searchQuery)) return false;
    }

    return true;
  });
}

export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  action?: string;
  island_id?: string;
  search?: string;
  org_id?: string;
  org_name?: string;
}): Promise<{ data: AuditLogEntry[]; count: number }> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const client = getDbClient();
  if (!client) {
    return { data: [], count: 0 };
  }

  let rawLogs: AuditLogEntry[] = [];

  try {
    const { data, error } = await client
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MAX_FALLBACK_LOGS);

    if (!error && Array.isArray(data)) {
      rawLogs = data as AuditLogEntry[];
    } else {
      const fb = await getFallbackJson<AuditLogEntry[]>(FALLBACK_AUDIT_KEY, []);
      rawLogs = Array.isArray(fb) ? fb : [];
    }
  } catch {
    const fb = await getFallbackJson<AuditLogEntry[]>(FALLBACK_AUDIT_KEY, []);
    rawLogs = Array.isArray(fb) ? fb : [];
  }

  const sorted = [...rawLogs].sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });

  const filtered = filterAuditLogEntries(sorted, options);
  return {
    data: filtered.slice(offset, offset + limit),
    count: filtered.length,
  };
}
