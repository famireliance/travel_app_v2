import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripeConfig } from '@/lib/stripeConfig';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  try {
    const { stripe } = await getStripeConfig();
    // 認証チェック
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );
    if (authError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラーです。管理者にお問い合わせください。' }, { status: 503 });
    }

    // Supabaseからstripe_customer_idを取得
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'サブスクリプション情報が見つかりません。一度ご契約後にお試しください。' }, { status: 404 });
    }

    const ALLOWED_ORIGINS = ['https://island.kira-tabi.com', 'http://localhost:3000', 'http://localhost:3001'];
    const rawOrigin = req.headers.get('origin') || '';
    const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://island.kira-tabi.com';

    // Stripe カスタマーポータルセッション作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/mypage`,
      // configuration は省略することで、Stripeダッシュボードの「デフォルト設定」が自動適用されます（本番/テスト切り替え時に安全）
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'ポータルセッションの作成に失敗しました';
    console.error('Portal session error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
