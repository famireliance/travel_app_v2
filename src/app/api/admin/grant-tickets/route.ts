import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, isSuperAdmin } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    if (user.role === 'viewer') {
      return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
    }
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: '最高管理者権限が必要です' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const { userId, ticketCount, action } = body || {};
    if (!userId || ticketCount === undefined || ticketCount === null || ticketCount === '') {
      return NextResponse.json({ error: 'userId と ticketCount が必要です' }, { status: 400 });
    }

    const count = Math.floor(Number(ticketCount));
    if (!Number.isFinite(count)) {
      return NextResponse.json({ error: 'ticketCount は有効な数値で指定してください' }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 現在のチケット数を取得
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('high_quality_tickets')
      .eq('id', userId)
      .maybeSingle();

    const currentTickets = Math.max(0, Math.floor(Number(profile?.high_quality_tickets || 0)));
    let newTicketCount = currentTickets;

    if (action === 'set') {
      newTicketCount = Math.max(0, count);
    } else {
      newTicketCount = Math.max(0, currentTickets + count);
    }

    const { error } = await adminClient
      .from('user_profiles')
      .upsert(
        {
          id: userId,
          high_quality_tickets: newTicketCount,
        },
        { onConflict: 'id' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `✅ 高画質証明書チケットを更新しました (${currentTickets}枚 ➔ ${newTicketCount}枚)`,
      tickets: newTicketCount
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'チケット更新中にエラーが発生しました' }, { status: 500 });
  }
}
