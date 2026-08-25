import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminPassword } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(req: NextRequest) {
  const ADMIN_PASSWORD = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  if (!auth || auth !== ADMIN_PASSWORD) {
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
    // 1. ユーザープロファイル
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 2. 島訪問記録
    const { data: visits } = await adminClient
      .from('island_visits')
      .select('*')
      .eq('user_id', userId)
      .order('visited_at', { ascending: false });

    // 3. デジタル証明書発行履歴
    const { data: certificates } = await adminClient
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 4. 物理証明書注文
    const { data: orders } = await adminClient
      .from('physical_orders')
      .select('*')
      .eq('user_id', userId)
      .order('ordered_at', { ascending: false });

    // 5. 投稿日記
    const { data: diaries } = await adminClient
      .from('island_diaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      profile,
      visits: visits || [],
      certificates: certificates || [],
      orders: orders || [],
      diaries: diaries || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'ユーザー詳細の取得に失敗しました' }, { status: 500 });
  }
}

// 訪問記録の削除または更新
export async function DELETE(req: NextRequest) {
  const ADMIN_PASSWORD = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  if (!auth || auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '訪問記録を削除しました' });
}
