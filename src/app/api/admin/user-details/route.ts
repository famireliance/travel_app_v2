import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function verifyAuth(req: NextRequest) {
  const user = await getAuthUser(req);
  return !!user;
}

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId が必要です' }, { status: 400 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 並列クエリで高速取得
    const [profileRes, visitsRes, certsRes, ordersRes, diariesRes] = await Promise.all([
      adminClient.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
      adminClient.from('island_visits').select('*').eq('user_id', userId).order('visited_at', { ascending: false, nullsFirst: false }),
      adminClient.from('certificates').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      adminClient.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      adminClient.from('island_diaries').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      profile: profileRes.data,
      visits: visitsRes.data || [],
      certificates: certsRes.data || [],
      orders: ordersRes.data || [],
      diaries: diariesRes.data || [],
    });
  } catch (err: any) {
    console.error('[user-details GET]', err);
    return NextResponse.json({ error: 'ユーザー詳細の取得に失敗しました' }, { status: 500 });
  }
}

// 訪問記録の削除
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const visitId = searchParams.get('visitId');

    if (!visitId) {
      return NextResponse.json({ error: 'visitId が必要です' }, { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error } = await adminClient
      .from('island_visits')
      .delete()
      .eq('id', visitId);

    if (error) {
      console.error('[user-details DELETE]', error);
      return NextResponse.json({ error: '訪問記録の削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '訪問記録を削除しました' });
  } catch (err: any) {
    console.error('[user-details DELETE]', err);
    return NextResponse.json({ error: '内部エラーが発生しました' }, { status: 500 });
  }
}
