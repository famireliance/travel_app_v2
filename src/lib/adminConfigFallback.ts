import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Reads a JSON value stored in `admin_config` under `key`.
 * Used as a durable PostgreSQL fallback when optional expansion tables/columns
 * have not yet been created via DDL migrations.
 */
export async function getFallbackJson<T>(key: string, defaultValue: T): Promise<T> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    return defaultValue;
  }
  try {
    const client = getClient();
    const { data, error } = await client
      .from('admin_config')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error || !data?.value) {
      return defaultValue;
    }
    return JSON.parse(data.value) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Persists a JSON value into `admin_config` under `key`.
 */
export async function setFallbackJson<T>(key: string, value: T): Promise<boolean> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    return false;
  }
  try {
    const client = getClient();
    const { error } = await client
      .from('admin_config')
      .upsert(
        {
          key,
          value: JSON.stringify(value),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    return !error;
  } catch {
    return false;
  }
}
