import { createClient, User } from '@supabase/supabase-js';

export interface UserAuthResult {
  user: User | null;
  token: string | null;
  error?: string;
}

export async function verifyUserAuth(request: Request): Promise<UserAuthResult> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, token: null, error: '認証が必要です' };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { user: null, token: null, error: '認証トークンがありません' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { user: null, token: null, error: 'サーバー設定エラー' };
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error } = await anonClient.auth.getUser(token);
  if (error || !user) {
    return { user: null, token: null, error: '認証トークンが無効です' };
  }

  return { user, token };
}
