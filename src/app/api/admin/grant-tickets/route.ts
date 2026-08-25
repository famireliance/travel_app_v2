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

  const { userId, ticketCount, action } = await req.json();
  if (!userId || ticketCount === undefined) {
    return NextResponse.json({ error: 'userId と ticketCount が必要です' }, { status: 400 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 現在のチケット数を取得
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('high_quality_tickets')
    .eq('id', userId)
    .single();

  const currentTickets = profile?.high_quality_tickets || 0;
  let newTicketCount = currentTickets;

  if (action === 'set') {
    newTicketCount = Math.max(0, ticketCount);
  } else {
    newTicketCount = Math.max(0, currentTickets + ticketCount);
  }

  const { error } = await adminClient
    .from('user_profiles')
    .upsert({
      id: userId,
      high_quality_tickets: newTicketCount,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `✅ 高画質証明書チケットを更新しました (${currentTickets}枚 ➔ ${newTicketCount}枚)`,
    tickets: newTicketCount
  });
}
