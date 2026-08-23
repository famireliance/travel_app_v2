import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-07-29.dahlia' as any, // fallback for newest types if needed
});

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ダミーのPrice ID。本番ではStripe管理画面で作った実際のPrice IDに置き換えます
const TIER_PRICES: Record<string, string> = {
  premium: process.env.STRIPE_PRICE_ID_PREMIUM || 'price_premium_dummy',
  ultimate: process.env.STRIPE_PRICE_ID_ULTIMATE || 'price_ultimate_dummy',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, tier } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    const priceId = TIER_PRICES[tier];
    if (!priceId) {
      return NextResponse.json({ error: '無効なプランが選択されました' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://island.kira-tabi.com';

    // 1. Supabaseから既存のStripe Customer IDを取得する（存在する場合）
    let customerId = undefined;
    if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data: profile } = await adminClient
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();
      
      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
      }
    }

    // 2. Stripe Checkout Session の作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId, // 既存顧客なら紐付け、なければStripeが新規作成
      client_reference_id: userId, // Webhookでユーザーを特定するために必須
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 90, // 3ヶ月無料トライアル設定
        metadata: {
          user_id: userId,
          tier: tier,
        }
      },
      success_url: `${origin}/mypage?subscription_success=true`,
      cancel_url: `${origin}/mypage?subscription_canceled=true`,
      locale: 'ja',
      // クーポン利用を許可（プロモーションコードをチェックアウト時に入力可能）
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'サブスクリプションセッションの作成に失敗しました';
    console.error('Stripe subscription checkout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
