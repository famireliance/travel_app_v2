import { createClient } from '@supabase/supabase-js';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function getAdminPassword(): Promise<string> {
  // DBから最新のパスワードを取得（なければ環境変数にフォールバック）
  try {
    if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      return process.env.ADMIN_PASSWORD || '';
    }
    const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data } = await client.from('admin_config').select('value').eq('key', 'admin_password').single();
    return data?.value || process.env.ADMIN_PASSWORD || '';
  } catch {
    return process.env.ADMIN_PASSWORD || '';
  }
}
