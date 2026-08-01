import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminPassword } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  const ADMIN_PASSWORD = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  if (!auth || auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'REPLACE_WITH_YOUR_SERVICE_ROLE_KEY') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  const body = await req.json();
  const { userId, islandId, status, visitedAt, note } = body;

  if (!userId || !islandId || !status) {
    return NextResponse.json({ error: 'userId, islandId, status は必須です' }, { status: 400 });
  }

  const validStatuses = ['visited', 'verified_visited', 'planning'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: '無効なステータスです' }, { status: 400 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { error } = await adminClient
    .from('island_visits')
    .upsert({
      user_id: userId,
      island_id: islandId,
      status,
      visited_at: visitedAt || new Date().toISOString(),
    }, { onConflict: 'user_id,island_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 付与ログを admin_grants テーブルに記録（テーブルがなければスキップ）
  try {
    await adminClient.from('admin_grants').insert({
      user_id: userId,
      island_id: islandId,
      status,
      visited_at: visitedAt || new Date().toISOString(),
      note: note || '',
      granted_at: new Date().toISOString(),
    });
  } catch {
    // admin_grants テーブルが存在しない場合は無視
  }

  return NextResponse.json({ success: true, message: `${islandId} の到達記録を付与しました` });
}
