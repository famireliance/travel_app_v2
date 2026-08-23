import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-07-29.dahlia' as any,
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: '認証が無効です' }, { status: 401 });
    }

    const { target_tier } = await req.json();
    if (!['premium', 'ultimate'].includes(target_tier)) {
      return NextResponse.json({ error: '無効なプランが指定されました' }, { status: 400 });
    }

    // DBからサブスクリプションIDを取得
    const { data: profile, error: dbError } = await adminClient
      .from('user_profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (dbError || !profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'サブスクリプション情報が見つかりません' }, { status: 404 });
    }

    const targetPriceId = target_tier === 'ultimate' 
      ? process.env.STRIPE_PRICE_ID_ULTIMATE 
      : process.env.STRIPE_PRICE_ID_PREMIUM;

    if (!targetPriceId) {
      return NextResponse.json({ error: '価格設定が正しくありません' }, { status: 500 });
    }

    // Stripeから現在のサブスクリプションを取得
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const currentItemId = subscription.items.data[0].id;

    // プランの更新
    const updatedSubscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [{
        id: currentItemId,
        price: targetPriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    // DBも即座に更新（Webhookを待たずにUIに反映するため）
    const periodEndUnix = (updatedSubscription as any).current_period_end || (updatedSubscription as any).trial_end || (updatedSubscription as any).items?.data?.[0]?.current_period_end || (Date.now()/1000 + 30*24*60*60);
    const periodEnd = new Date(periodEndUnix * 1000);

    const updatePayload: any = {
      subscription_tier: target_tier,
      premium_until: periodEnd.toISOString()
    };

    // Ultimateにアップグレードした場合、開始日が存在しない場合のみ記録
    if (target_tier === 'ultimate') {
      const { data: existingProfile } = await adminClient
        .from('user_profiles')
        .select('ultimate_started_at')
        .eq('id', user.id)
        .single();
      
      if (existingProfile && existingProfile.ultimate_started_at === null) {
        updatePayload.ultimate_started_at = new Date().toISOString();
      }
    }

    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', user.id);
      
    if (updateError) {
      console.error("DB update error:", updateError);
    }

    return NextResponse.json({ success: true, tier: target_tier });
  } catch (err: any) {
    console.error("Plan change error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
