import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripeConfig } from '@/lib/stripeConfig';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '認証ヘッダーがありません' }, { status: 401 });
    }
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || supabaseServiceRoleKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    // Validate token and get user id using anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    // Use service role client to perform operations
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 0. Cancel active Stripe subscription before deleting user so they are never billed again
    const { data: existingProfile } = await adminClient
      .from('user_profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile?.stripe_subscription_id) {
      try {
        const { stripe } = await getStripeConfig();
        const sub = await stripe.subscriptions.retrieve(existingProfile.stripe_subscription_id);
        if (sub && sub.status !== 'canceled') {
          await stripe.subscriptions.cancel(existingProfile.stripe_subscription_id);
        }
      } catch (stripeErr: any) {
        // Ignore resource_missing / already canceled errors, but abort if active subscription cancel failed unexpectedly
        const code = stripeErr?.code || '';
        const msg = String(stripeErr?.message || '');
        if (
          code !== 'resource_missing' &&
          !msg.includes('No such subscription') &&
          !msg.includes('canceled') &&
          !msg.includes('未設定')
        ) {
          console.error('Failed to cancel Stripe subscription before user deletion:', stripeErr);
          return NextResponse.json(
            { error: 'サブスクリプションの自動解約に失敗しました。お支払い管理から解約後にお試しください。' },
            { status: 502 }
          );
        }
      }
    }

    // 1. Delete user's rows from island_visits, user_gamification, and certificates
    await Promise.allSettled([
      adminClient.from('island_visits').delete().eq('user_id', user.id),
      adminClient.from('user_gamification').delete().eq('user_id', user.id),
      adminClient.from('certificates').delete().eq('user_id', user.id),
    ]);

    // Clear Ultimate metadata in admin_config
    const metaKey = `ultimate_meta_${user.id}`;
    const existingMeta = await getFallbackJson<Record<string, any>>(metaKey, {});
    if (existingMeta && Object.keys(existingMeta).length > 0) {
      await setFallbackJson(metaKey, {
        ...existingMeta,
        ultimate_started_at: null,
      });
    }

    // 2. Soft delete user profile (anonymize for public view; fallback on optional columns so deleteUser is never blocked)
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .update({
        deleted_at: new Date().toISOString(),
        nickname: '退会済みユーザー',
        subscription_tier: 'free',
        is_premium: false,
        stripe_subscription_id: null,
      })
      .eq('id', user.id);

    if (profileError) {
      const { error: retryError } = await adminClient
        .from('user_profiles')
        .update({
          nickname: '退会済みユーザー',
          subscription_tier: 'free',
          stripe_subscription_id: null,
        })
        .eq('id', user.id);

      if (retryError) {
        console.warn('Profile anonymize retry warning (continuing to deleteUser):', retryError);
      }
    }

    // 3. Delete from auth.users so they can't login again
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      console.error('Failed to delete auth user', deleteAuthError);
      return NextResponse.json({ error: 'アカウントの完全削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ message: 'アカウントを退会しました' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
  }
}
