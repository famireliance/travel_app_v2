import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripeConfig } from '@/lib/stripeConfig';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { stripe, priceIdPremium, priceIdUltimate } = await getStripeConfig();
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: '認証が無効です' }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const { target_tier } = body || {};
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
      ? priceIdUltimate
      : priceIdPremium;

    if (!targetPriceId) {
      return NextResponse.json({ error: '価格設定が正しくありません' }, { status: 500 });
    }

    // Stripeから現在のサブスクリプションを取得
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const currentItemId = subscription.items.data[0]?.id;
    if (!currentItemId) {
      return NextResponse.json({ error: 'サブスクリプションアイテムが見つかりません' }, { status: 500 });
    }

    // プランの更新
    const updatedSubscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [{
        id: currentItemId,
        price: targetPriceId,
      }],
      metadata: {
        ...(subscription.metadata || {}),
        user_id: user.id,
        tier: target_tier,
      },
      proration_behavior: 'create_prorations',
    });

    // DBも即座に更新（実在カラムのみ書き込み）
    const periodEndUnix =
      (updatedSubscription as any).current_period_end ||
      (updatedSubscription as any).trial_end ||
      (updatedSubscription as any).items?.data?.[0]?.current_period_end ||
      Date.now() / 1000 + 30 * 24 * 60 * 60;
    const periodEnd = new Date(periodEndUnix * 1000);

    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({
        subscription_tier: target_tier,
        premium_until: periodEnd.toISOString(),
        is_premium: true,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('DB update error:', updateError);
    }

    // Ultimate開始日の記録・ダウングレード時のクリア (admin_config)
    const metaKey = `ultimate_meta_${user.id}`;
    const existingMeta = await getFallbackJson<{
      ultimate_started_at?: string | null;
      anniversary_cert_used?: boolean;
    }>(metaKey, {});

    if (target_tier === 'ultimate') {
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

    return NextResponse.json({ success: true, tier: target_tier });
  } catch (err: any) {
    console.error('Plan change error:', err);
    return NextResponse.json({ error: err?.message || 'プラン変更に失敗しました' }, { status: 500 });
  }
}
