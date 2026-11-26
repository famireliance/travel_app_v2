import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripeConfig } from '@/lib/stripeConfig';
import { verifyUserAuth } from '@/lib/userAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

interface FulfilledTicketSessionEntry {
  userId: string;
  tickets: number;
  at: string;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyUserAuth(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || '認証が必要です' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    let body: { sessionId?: string } = {};
    try {
      body = (await req.json()) || {};
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId が必要です' }, { status: 400 });
    }

    const { stripe } = await getStripeConfig();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.purchase_type !== 'hq_ticket_pack') {
      return NextResponse.json({ error: '対象外の決済セッションです' }, { status: 400 });
    }
    if (session.metadata?.user_id !== auth.user.id) {
      return NextResponse.json({ error: '決済セッションの所有者が一致しません' }, { status: 403 });
    }
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: '決済がまだ完了していません' }, { status: 400 });
    }

    const rawCount = Number(
      session.metadata?.ticket_count || (session.metadata?.pack_key === 'pack_10' ? 10 : 3)
    );
    const ticketCount = Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 3;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const fulfilledMap = await getFallbackJson<Record<string, FulfilledTicketSessionEntry>>(
      'fallback_fulfilled_ticket_sessions',
      {}
    );

    if (fulfilledMap[session.id]) {
      const { data: currentProfile } = await adminClient
        .from('user_profiles')
        .select('high_quality_tickets')
        .eq('id', auth.user.id)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        addedTickets: fulfilledMap[session.id].tickets,
        totalTickets: Number(currentProfile?.high_quality_tickets || 0),
        alreadyFulfilled: true,
      });
    }

    const { data: existingProfile } = await adminClient
      .from('user_profiles')
      .select('id, high_quality_tickets')
      .eq('id', auth.user.id)
      .maybeSingle();

    const currentTickets = Number(existingProfile?.high_quality_tickets || 0);
    const newTotal = currentTickets + ticketCount;

    if (existingProfile) {
      const { error: updateErr } = await adminClient
        .from('user_profiles')
        .update({ high_quality_tickets: newTotal })
        .eq('id', auth.user.id);
      if (updateErr) throw updateErr;
    } else {
      const { error: upsertErr } = await adminClient
        .from('user_profiles')
        .upsert({ id: auth.user.id, high_quality_tickets: newTotal }, { onConflict: 'id' });
      if (upsertErr) throw upsertErr;
    }

    const latestFulfilled = await getFallbackJson<Record<string, FulfilledTicketSessionEntry>>(
      'fallback_fulfilled_ticket_sessions',
      {}
    );
    latestFulfilled[session.id] = {
      userId: auth.user.id,
      tickets: ticketCount,
      at: new Date().toISOString(),
    };
    await setFallbackJson('fallback_fulfilled_ticket_sessions', latestFulfilled);

    return NextResponse.json({
      success: true,
      addedTickets: ticketCount,
      totalTickets: newTotal,
      alreadyFulfilled: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'チケット付与確認に失敗しました';
    console.error('Ticket verify error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
