import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Look up the code in app_promo_codes
    const { data: promoCode, error: promoError } = await adminClient
      .from('app_promo_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (promoError || !promoCode) {
      return NextResponse.json({ error: '無効なコードです。' }, { status: 404 });
    }

    // 3. Check if expired or max_uses reached
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json({ error: 'このコードは有効期限切れです。' }, { status: 400 });
    }
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json({ error: 'このコードは利用上限に達しています。' }, { status: 400 });
    }

    // 4. Check if the user already redeemed it
    const { data: existingRedemption } = await adminClient
      .from('promo_code_redemptions')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', user.id)
      .single();

    if (existingRedemption) {
      return NextResponse.json({ error: 'このコードはすでに利用済みです。' }, { status: 400 });
    }

    const rewardAmount = promoCode.reward_amount || 1;

    // 5. Update data
    await adminClient
      .from('app_promo_codes')
      .update({ current_uses: promoCode.current_uses + 1 })
      .eq('id', promoCode.id);

    await adminClient
      .from('promo_code_redemptions')
      .insert({
        promo_code_id: promoCode.id,
        user_id: user.id
      });

    const { data: userProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('high_quality_tickets')
      .eq('id', user.id)
      .single();

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
        .insert({
          id: user.id,
          high_quality_tickets: rewardAmount
        });
    }

    // 6. Return success message
    return NextResponse.json({ success: true, message: `クーポン適用完了！ ${rewardAmount}枚のチケットを獲得しました。` });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
