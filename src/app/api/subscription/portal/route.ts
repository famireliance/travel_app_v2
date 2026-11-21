import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripeConfig } from '@/lib/stripeConfig';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  try {
    const { stripe } = await getStripeConfig();
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );
    if (authError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      return NextResponse.json(
        { error: 'サーバー設定エラーです。管理者にお問い合わせください。' },
        { status: 503 }
      );
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'サブスクリプション情報が見つかりません。有料プランご契約後にお試しください。' },
        { status: 404 }
      );
    }

    const ALLOWED_ORIGINS = [
      'https://island.kira-tabi.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    const rawOrigin = req.headers.get('origin') || '';
    const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://island.kira-tabi.com';

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${origin}/mypage`,
      });
      return NextResponse.json({ url: portalSession.url });
    } catch (portalErr: any) {
      const errMsg = String(portalErr?.message || '');
      // Stripe本番モードでデフォルトCustomer Portal構成が未保存の場合、標準構成を自動生成して自己修復する
      if (errMsg.includes('No configuration provided')) {
        const existingConfigs = await stripe.billingPortal.configurations.list({
          active: true,
          limit: 1,
        });
        let configId = existingConfigs.data[0]?.id;

        if (!configId) {
          const createdConfig = await stripe.billingPortal.configurations.create({
            business_profile: {
              headline: 'KIRATABI サブスクリプション管理・解約',
              privacy_policy_url: 'https://island.kira-tabi.com/privacy',
              terms_of_service_url: 'https://island.kira-tabi.com/terms',
            },
            features: {
              customer_update: {
                enabled: true,
                allowed_updates: ['email', 'name'],
              },
              invoice_history: { enabled: true },
              payment_method_update: { enabled: true },
              subscription_cancel: {
                enabled: true,
                mode: 'at_period_end',
                cancellation_reason: {
                  enabled: true,
                  options: ['too_expensive', 'unused', 'other'],
                },
              },
            },
          });
          configId = createdConfig.id;
        }

        const retrySession = await stripe.billingPortal.sessions.create({
          customer: profile.stripe_customer_id,
          return_url: `${origin}/mypage`,
          configuration: configId,
        });
        return NextResponse.json({ url: retrySession.url });
      }
      throw portalErr;
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'ポータルセッションの作成に失敗しました';
    console.error('Portal session error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
