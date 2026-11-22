import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripeConfig } from '@/lib/stripeConfig';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: '認証トークンが無効です' }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sessionId) {
      return NextResponse.json({ error: 'session_idが必要です' }, { status: 400 });
    }

    const { stripe, priceIdUltimate } = await getStripeConfig();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.mode !== 'subscription') {
      return NextResponse.json({ error: 'サブスクリプションセッションではありません' }, { status: 400 });
    }

    const refUserId =
      checkoutSession.client_reference_id || checkoutSession.metadata?.user_id || '';
    if (refUserId !== user.id) {
      return NextResponse.json({ error: 'ユーザー情報が一致しません' }, { status: 403 });
    }

    if (
      checkoutSession.status !== 'complete' ||
      (checkoutSession.payment_status !== 'paid' &&
        checkoutSession.payment_status !== 'no_payment_required')
    ) {
      return NextResponse.json({ error: '決済が未完了です' }, { status: 402 });
    }

    const rawSubId = checkoutSession.subscription;
    const subscriptionId = typeof rawSubId === 'string' ? rawSubId : rawSubId?.id;
    const rawCustomerId = checkoutSession.customer;
    const customerId = typeof rawCustomerId === 'string' ? rawCustomerId : rawCustomerId?.id;

    if (!subscriptionId || !customerId) {
      return NextResponse.json({ error: 'サブスクリプション情報が未確定です' }, { status: 409 });
    }

    const subscription = (await stripe.subscriptions.retrieve(
      subscriptionId
    )) as Stripe.Subscription;
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const tier =
      priceId === priceIdUltimate || subscription.metadata?.tier === 'ultimate'
        ? 'ultimate'
        : 'premium';

    const periodEndUnix =
      (subscription as any).current_period_end ||
      (subscription as any).trial_end ||
      (subscription.items?.data?.[0] as any)?.current_period_end ||
      Date.now() / 1000 + 30 * 24 * 60 * 60;
    const periodEndIso = new Date(periodEndUnix * 1000).toISOString();

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const upsertPayload = {
      id: user.id,
      subscription_tier: tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      premium_until: periodEndIso,
      is_premium: true,
    };

    const { error: upsertErr } = await adminClient
      .from('user_profiles')
      .upsert(upsertPayload, { onConflict: 'id' });

    if (upsertErr) {
      console.error('Subscription verify user_profiles upsert error:', upsertErr);
      return NextResponse.json({ error: 'プラン情報の保存に失敗しました' }, { status: 500 });
    }

    const metaKey = `ultimate_meta_${user.id}`;
    const existingMeta = await getFallbackJson<{
      ultimate_started_at?: string | null;
      anniversary_cert_used?: boolean;
    }>(metaKey, {});

    if (tier === 'ultimate') {
      if (!existingMeta.ultimate_started_at) {
        await setFallbackJson(metaKey, {
          ...existingMeta,
          ultimate_started_at: new Date().toISOString(),
        });
      }
    } else if (existingMeta.ultimate_started_at) {
      await setFallbackJson(metaKey, {
        ...existingMeta,
        ultimate_started_at: null,
      });
    }

    return NextResponse.json({
      success: true,
      tier,
      premiumUntil: periodEndIso,
    });
  } catch (err: any) {
    console.error('Subscription verify error:', err);
    return NextResponse.json(
      { error: err?.message || 'サブスクリプション確認に失敗しました' },
      { status: 500 }
    );
  }
}
