import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    if (!code) {
      return NextResponse.json({ error: 'クーポンコードを入力してください' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '').trim();

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Look up the code in app_promo_codes
    const { data: promoCode, error: promoError } = await adminClient
      .from('app_promo_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (promoError || !promoCode) {
      return NextResponse.json({ error: '無効なコードです。' }, { status: 404 });
    }

    // 3. Check if expired (valid_until || expires_at) or max_uses reached
    const expiryDate = promoCode.valid_until || promoCode.expires_at;
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return NextResponse.json({ error: 'このコードは有効期限切れです。' }, { status: 400 });
    }
    if (promoCode.max_uses !== null && promoCode.max_uses !== undefined && (promoCode.current_uses || 0) >= promoCode.max_uses) {
      return NextResponse.json({ error: 'このコードは利用上限に達しています。' }, { status: 400 });
    }

    // 4. Check if the user already redeemed it
    const { data: existingRedemption } = await adminClient
      .from('promo_code_redemptions')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingRedemption) {
      return NextResponse.json({ error: 'このコードはすでに利用済みです。' }, { status: 400 });
    }

    // 5. Insert redemption record FIRST and check error BEFORE granting tickets (prevents double-redemption!)
    const { error: redemptionError } = await adminClient
      .from('promo_code_redemptions')
      .insert({
        promo_code_id: promoCode.id,
        user_id: user.id,
      });

    if (redemptionError) {
      console.error('Redemption insert error:', redemptionError);
      return NextResponse.json({ error: 'このコードはすでに利用済みです。' }, { status: 400 });
    }

    const rewardAmount = promoCode.reward_amount || 1;

    await adminClient
      .from('app_promo_codes')
      .update({ current_uses: (promoCode.current_uses || 0) + 1 })
      .eq('id', promoCode.id);

    const { data: userProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('high_quality_tickets')
      .eq('id', user.id)
      .maybeSingle();

    if (!profileError && userProfile) {
      await adminClient
        .from('user_profiles')
        .update({
          high_quality_tickets: (userProfile.high_quality_tickets || 0) + rewardAmount
        })
        .eq('id', user.id);
    } else {
      await adminClient
        .from('user_profiles')
        .upsert({
          id: user.id,
          high_quality_tickets: rewardAmount
        }, { onConflict: 'id' });
    }

    // 6. Return success message
    return NextResponse.json({ success: true, message: `クーポン適用完了！ ${rewardAmount}枚のチケットを獲得しました。` });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
