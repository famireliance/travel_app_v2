import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-07-29.dahlia',
});

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'session_idが必要です' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: '支払いが完了していません' }, { status: 402 });
    }

    const meta = session.metadata || {};

    // シリアルナンバーの最終確定
    const islandKey = (meta.island_id || meta.island_name || 'ISL').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'ISL';
    const finalSerial = meta.pending_serial || `KT-${new Date().getFullYear()}-${islandKey}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

    // DBのステータスを paid に更新
    if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      try {
        const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        await adminClient.from('orders')
          .update({
            status: 'paid',
            serial_number: finalSerial,
            stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : '',
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', sessionId);
      } catch {
        // orders テーブルが存在しない場合は無視
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
      serialNumber: finalSerial,
      islandName: meta.island_name || meta.island_id,
      travelerName: meta.traveler_name,
      plan: meta.plan,
      amount: session.amount_total,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '決済確認に失敗しました';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
