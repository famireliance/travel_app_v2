import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '認証ヘッダーがありません' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    
    // Validate token and get user id using anon client
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    // Use service role client to perform operations
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Soft delete user profile (anonymize for public view)
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .update({
        deleted_at: new Date().toISOString(),
        nickname: '退会済みユーザー',
        bio: null
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to soft delete profile', profileError);
      return NextResponse.json({ error: 'プロフィール削除に失敗しました' }, { status: 500 });
    }

    // 2. We can also choose to delete from auth.users so they can't login again,
    // but keep the user_profiles row for referential integrity of UGC.
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user.id);
    
    if (deleteAuthError) {
      console.error('Failed to delete auth user', deleteAuthError);
      return NextResponse.json({ error: 'アカウントの完全削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ message: 'アカウントを退会しました' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
  }
}
